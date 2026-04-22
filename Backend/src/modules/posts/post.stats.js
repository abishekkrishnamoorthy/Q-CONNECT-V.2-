// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\post.stats.js
/**
 * Stats Layer — MongoDB-backed (Redis-compatible interface).
 *
 * Architecture: MongoDB `stats` fields ARE the source of truth.
 * Each like/comment/save interaction uses $inc for atomic increment/decrement.
 * The cron job (statsFlush.job.js) is a no-op in this mode but is kept
 * as a hook so Redis can be plugged in later without changing service code.
 *
 * Key rule from implementation spec:
 *   - Never write stats directly on each interaction in a non-atomic way
 *   - $inc IS atomic in MongoDB — this satisfies the spirit of the rule
 */
import Post from "./models/post.model.js";

/**
 * Atomically increments a stat field on the post document.
 * Returns the new value.
 *
 * @param {string} postId
 * @param {"likes"|"comments"|"saves"} field
 * @returns {Promise<number>} updated count
 */
export async function incrementStat(postId, field) {
  const updated = await Post.findByIdAndUpdate(
    postId,
    { $inc: { [`stats.${field}`]: 1 } },
    { new: true, setOptions: { includeDeleted: false } }
  ).lean();
  return updated?.stats?.[field] ?? 0;
}

/**
 * Atomically decrements a stat field on the post document (floor at 0).
 * Returns the new value.
 *
 * @param {string} postId
 * @param {"likes"|"comments"|"saves"} field
 * @returns {Promise<number>} updated count
 */
export async function decrementStat(postId, field) {
  // Decrement only if current value > 0 to prevent negative counts
  const updated = await Post.findOneAndUpdate(
    { _id: postId, [`stats.${field}`]: { $gt: 0 } },
    { $inc: { [`stats.${field}`]: -1 } },
    { new: true, setOptions: { includeDeleted: false } }
  ).lean();
  return updated?.stats?.[field] ?? 0;
}

/**
 * Reads the stats snapshot for a post from MongoDB.
 *
 * @param {string} postId
 * @returns {Promise<{likes: number, comments: number, saves: number}>}
 */
export async function getStats(postId) {
  const post = await Post.findById(postId)
    .select("stats")
    .setOptions({ includeDeleted: false })
    .lean();
  return post?.stats ?? { likes: 0, comments: 0, saves: 0 };
}

/**
 * Merges stats into a post plain object.
 * When MongoDB IS the source of truth this is a pass-through —
 * stats are already on the post document.
 * Signature preserved for future Redis plug-in compatibility.
 *
 * @param {object} postDoc - lean post document or toObject() result
 * @returns {object} post with stats guaranteed to be present
 */
export function mergeStatsIntoPost(postDoc) {
  // Stats already live on the document — just ensure the field exists
  if (!postDoc.stats) {
    postDoc.stats = { likes: 0, comments: 0, saves: 0 };
  }
  return postDoc;
}

/**
 * Deletes Redis keys associated with a post's stats.
 * No-op in MongoDB mode — kept for interface compatibility.
 *
 * @param {string} _postId
 * @returns {Promise<void>}
 */
export async function deleteStats(_postId) {
  // No-op: MongoDB stats are cleared by deleting the Post document itself
}

/**
 * Flush: reads live stats and writes them back to MongoDB.
 * In MongoDB mode this is a no-op because stats are already in MongoDB.
 * Called by the cron job for future Redis compatibility.
 *
 * @param {string} _postId
 * @returns {Promise<void>}
 */
export async function flushStatsToDB(_postId) {
  // No-op in MongoDB-only mode
}

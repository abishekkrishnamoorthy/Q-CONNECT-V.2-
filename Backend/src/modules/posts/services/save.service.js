// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\services\save.service.js
import Save from "../models/save.model.js";
import { incrementStat, decrementStat } from "../post.stats.js";

/**
 * Saves a post. Duplicate save detected at DB level (unique index code 11000).
 *
 * @param {string} postId
 * @param {string} userId
 * @returns {Promise<{saved: boolean}>}
 */
export async function save(postId, userId) {
  try {
    await Save.create({ postId, userId });
  } catch (e) {
    if (e.code === 11000) {
      const err = new Error("You have already saved this post.");
      // @ts-expect-error custom code
      err.code = "DUPLICATE_SAVE";
      // @ts-expect-error custom statusCode
      err.statusCode = 400;
      throw err;
    }
    throw e;
  }

  await incrementStat(postId, "saves");
  return { saved: true };
}

/**
 * Unsaves a post.
 *
 * @param {string} postId
 * @param {string} userId
 * @returns {Promise<{saved: boolean}>}
 */
export async function unsave(postId, userId) {
  const result = await Save.deleteOne({ postId, userId });
  if (result.deletedCount === 0) {
    const err = new Error("You have not saved this post.");
    // @ts-expect-error custom code
    err.code = "NOT_SAVED";
    // @ts-expect-error custom statusCode
    err.statusCode = 400;
    throw err;
  }

  await decrementStat(postId, "saves");
  return { saved: false };
}

/**
 * Returns a paginated list of posts saved by a user (cursor-based).
 *
 * @param {string} userId
 * @param {{cursor?: string, limit?: number}} opts
 * @returns {Promise<{postIds: string[], nextCursor: string|null, hasNextPage: boolean}>}
 */
export async function getSavedPosts(userId, { cursor, limit = 20 } = {}) {
  const maxLimit = Math.min(limit, 50);
  const query = { userId };

  if (cursor) {
    try {
      const { createdAt, _id } = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
      query.$or = [
        { createdAt: { $lt: new Date(createdAt) } },
        { createdAt: new Date(createdAt), _id: { $lt: _id } }
      ];
    } catch {
      /* invalid cursor — ignore, return from beginning */
    }
  }

  const docs = await Save.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(maxLimit + 1)
    .lean();

  const hasNextPage = docs.length > maxLimit;
  const items = docs.slice(0, maxLimit);
  const last = items[items.length - 1];
  const nextCursor = hasNextPage
    ? Buffer.from(JSON.stringify({ createdAt: last.createdAt, _id: last._id })).toString("base64")
    : null;

  return { postIds: items.map((d) => String(d.postId)), nextCursor, hasNextPage };
}

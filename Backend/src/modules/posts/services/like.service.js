// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\services\like.service.js
import Like from "../models/like.model.js";
import { incrementStat, decrementStat, getStats } from "../post.stats.js";

/**
 * Likes a post. Duplicate like detected at DB level (unique index code 11000).
 *
 * @param {string} postId
 * @param {string} userId
 * @returns {Promise<{liked: boolean, count: number}>}
 */
export async function like(postId, userId) {
  try {
    await Like.create({ postId, userId });
  } catch (e) {
    if (e.code === 11000) {
      const err = new Error("You have already liked this post.");
      // @ts-expect-error custom code
      err.code = "DUPLICATE_LIKE";
      // @ts-expect-error custom statusCode
      err.statusCode = 400;
      throw err;
    }
    throw e;
  }

  const count = await incrementStat(postId, "likes");
  return { liked: true, count };
}

/**
 * Unlikes a post. Throws NOT_LIKED if user had not liked it.
 *
 * @param {string} postId
 * @param {string} userId
 * @returns {Promise<{liked: boolean, count: number}>}
 */
export async function unlike(postId, userId) {
  const result = await Like.deleteOne({ postId, userId });
  if (result.deletedCount === 0) {
    const err = new Error("You have not liked this post.");
    // @ts-expect-error custom code
    err.code = "NOT_LIKED";
    // @ts-expect-error custom statusCode
    err.statusCode = 400;
    throw err;
  }

  const count = await decrementStat(postId, "likes");
  return { liked: false, count };
}

/**
 * Checks whether a user has liked a specific post.
 *
 * @param {string} postId
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function hasLiked(postId, userId) {
  const doc = await Like.exists({ postId, userId });
  return Boolean(doc);
}

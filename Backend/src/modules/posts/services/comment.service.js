// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\services\comment.service.js
import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import { incrementStat, decrementStat } from "../post.stats.js";

/**
 * Adds a comment to a post (top-level or reply).
 *
 * @param {string} postId
 * @param {string} authorId
 * @param {{text: string, parentId?: string}} data
 * @returns {Promise<object>} saved comment document
 */
export async function addComment(postId, authorId, data) {
  // Verify post exists and is active
  const post = await Post.findById(postId);
  if (!post) {
    const err = new Error("Post not found");
    // @ts-expect-error custom code
    err.code = "NOT_FOUND";
    // @ts-expect-error custom statusCode
    err.statusCode = 404;
    throw err;
  }

  const comment = await Comment.create({
    postId,
    author:    authorId,
    text:      data.text,
    parentId:  data.parentId ?? null,
    isAIReply: false
  });

  await incrementStat(postId, "comments");
  return comment;
}

/**
 * Soft-deletes a comment. Only comment author OR post author can delete.
 *
 * @param {string} postId
 * @param {string} commentId
 * @param {string} requesterId
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteComment(postId, commentId, requesterId) {
  const comment = await Comment.findOne({ _id: commentId, postId, status: "active" });
  if (!comment) {
    const err = new Error("Comment not found");
    // @ts-expect-error custom code
    err.code = "NOT_FOUND";
    // @ts-expect-error custom statusCode
    err.statusCode = 404;
    throw err;
  }

  const post = await Post.findById(postId);
  const isCommentAuthor = String(comment.author) === String(requesterId);
  const isPostAuthor    = post && String(post.author) === String(requesterId);

  if (!isCommentAuthor && !isPostAuthor) {
    const err = new Error("You are not allowed to delete this comment");
    // @ts-expect-error custom code
    err.code = "FORBIDDEN";
    // @ts-expect-error custom statusCode
    err.statusCode = 403;
    throw err;
  }

  comment.status    = "deleted";
  comment.deletedAt = new Date();
  await comment.save();

  await decrementStat(postId, "comments");
  return { success: true };
}

/**
 * Returns paginated comments for a post (cursor-based).
 * Supports top-level only (parentId=null) or thread replies (parentId=<id>).
 *
 * @param {string} postId
 * @param {{cursor?: string, limit?: number, parentId?: string}} opts
 * @returns {Promise<{comments: object[], nextCursor: string|null, hasNextPage: boolean}>}
 */
export async function getComments(postId, { cursor, limit = 20, parentId } = {}) {
  const maxLimit = Math.min(limit, 50);

  const query = {
    postId,
    status:   "active",
    parentId: parentId ?? null
  };

  if (cursor) {
    try {
      const { createdAt, _id } = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
      query.$or = [
        { createdAt: { $gt: new Date(createdAt) } },
        { createdAt: new Date(createdAt), _id: { $gt: _id } }
      ];
    } catch {
      /* invalid cursor — ignore */
    }
  }

  const docs = await Comment.find(query)
    .sort({ createdAt: 1, _id: 1 })
    .limit(maxLimit + 1)
    .populate("author", "name profile.username profile.profileImage")
    .lean();

  const hasNextPage = docs.length > maxLimit;
  const comments    = docs.slice(0, maxLimit);
  const last        = comments[comments.length - 1];
  const nextCursor  = hasNextPage
    ? Buffer.from(JSON.stringify({ createdAt: last.createdAt, _id: last._id })).toString("base64")
    : null;

  return { comments, nextCursor, hasNextPage };
}

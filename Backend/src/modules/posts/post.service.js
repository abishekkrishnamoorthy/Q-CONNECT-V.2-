// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\post.service.js
import { validatePost } from "./post.validator.js";
import { createImagePost }    from "./services/image.service.js";
import { createShortPost }    from "./services/short.service.js";
import { createThoughtPost }  from "./services/thought.service.js";
import { createQuestionPost } from "./services/question.service.js";
import { createQuizPost }     from "./services/quiz.service.js";
import { createAIPost }       from "./services/ai.service.js";
import { mergeStatsIntoPost, deleteStats } from "./post.stats.js";
import Post from "./models/post.model.js";
import ModerationReport from "./models/moderationReport.model.js";

// ── Create Post ───────────────────────────────────────────────────────────────

/**
 * Orchestrates post creation: validates → dispatches to type service.
 *
 * @param {string} authorId
 * @param {unknown} rawBody
 * @param {string} [callerRole] - required for "ai" type posts
 * @returns {Promise<object>} created post
 */
export async function createPost(authorId, rawBody, callerRole = "user") {
  const validatedData = validatePost(rawBody);

  switch (validatedData.type) {
    case "image":
      return createImagePost(authorId, validatedData);
    case "short":
      return createShortPost(authorId, validatedData);
    case "thought":
      return createThoughtPost(authorId, validatedData);
    case "question":
      return createQuestionPost(authorId, validatedData);
    case "quiz":
      return createQuizPost(authorId, validatedData);
    case "ai":
      return createAIPost(authorId, validatedData, callerRole);
    default: {
      const err = new Error(`Unknown post type: "${validatedData.type}"`);
      // @ts-expect-error custom code
      err.code = "INVALID_POST_TYPE";
      // @ts-expect-error custom statusCode
      err.statusCode = 400;
      throw err;
    }
  }
}

// ── Get Single Post ───────────────────────────────────────────────────────────

/**
 * Fetches a single active post by ID and merges stats.
 *
 * @param {string} postId
 * @returns {Promise<object>}
 */
export async function getPostById(postId) {
  const post = await Post.findById(postId)
    .populate("author", "name profile.username profile.profileImage")
    .lean();

  if (!post) {
    const err = new Error("Post not found");
    // @ts-expect-error custom code
    err.code = "NOT_FOUND";
    // @ts-expect-error custom statusCode
    err.statusCode = 404;
    throw err;
  }

  return mergeStatsIntoPost(post);
}

// ── Edit Post ─────────────────────────────────────────────────────────────────

/**
 * Edits allowed fields on an active post owned by userId.
 * Editable: content.text, tags, meta.poll.question (only if no votes yet).
 *
 * @param {string} postId
 * @param {string} userId
 * @param {{content?: {text?: string}, tags?: string[], meta?: {poll?: {question?: string}}}} updateBody
 * @returns {Promise<object>} updated post
 */
export async function editPost(postId, userId, updateBody) {
  const post = await Post.findOne({ _id: postId, author: userId, status: "active" });
  if (!post) {
    const err = new Error("Post not found or you are not the author");
    // @ts-expect-error custom code
    err.code = "NOT_FOUND";
    // @ts-expect-error custom statusCode
    err.statusCode = 404;
    throw err;
  }

  // Apply editable fields only
  if (updateBody.content?.text !== undefined) {
    post.content.text = updateBody.content.text;
  }
  if (Array.isArray(updateBody.tags)) {
    post.tags = updateBody.tags;
  }
  if (updateBody.meta?.poll?.question !== undefined && post.meta?.poll) {
    // Poll question editable only if no votes yet
    if (post.meta.poll.totalVotes > 0) {
      const err = new Error("Cannot edit poll question after votes have been cast");
      // @ts-expect-error custom code
      err.code = "FORBIDDEN";
      // @ts-expect-error custom statusCode
      err.statusCode = 403;
      throw err;
    }
    post.meta.poll.question = updateBody.meta.poll.question;
  }

  post.editedAt = new Date();
  await post.save();
  return post;
}

// ── Delete Post ───────────────────────────────────────────────────────────────

/**
 * Soft-deletes a post owned by userId.
 * Cleans up associated stats keys.
 *
 * @param {string} postId
 * @param {string} userId
 * @returns {Promise<{success: boolean}>}
 */
export async function deletePost(postId, userId) {
  const post = await Post.findOne({ _id: postId, author: userId, status: "active" });
  if (!post) {
    const err = new Error("Post not found or you are not the author");
    // @ts-expect-error custom code
    err.code = "NOT_FOUND";
    // @ts-expect-error custom statusCode
    err.statusCode = 404;
    throw err;
  }

  post.status    = "deleted";
  post.deletedAt = new Date();
  await post.save();

  // Remove stats (no-op in MongoDB mode, cleans Redis keys if plugged in)
  await deleteStats(postId);

  return { success: true };
}

// ── Report Post ───────────────────────────────────────────────────────────────

/**
 * Submits a moderation report for a post.
 *
 * @param {string} postId
 * @param {string} reporterId
 * @param {string} reason
 * @returns {Promise<{success: boolean}>}
 */
export async function reportPost(postId, reporterId, reason) {
  // Verify post exists
  const post = await Post.findById(postId);
  if (!post) {
    const err = new Error("Post not found");
    // @ts-expect-error custom code
    err.code = "NOT_FOUND";
    // @ts-expect-error custom statusCode
    err.statusCode = 404;
    throw err;
  }

  await ModerationReport.create({ postId, reporterId, reason });
  return { success: true };
}

// ── Feed (Cursor-Based Pagination) ────────────────────────────────────────────

/**
 * Returns a paginated post feed using cursor-based pagination.
 * Never uses offset — uses (createdAt + _id) cursor.
 *
 * @param {string} _userId - reserved for personalisation (joined communities, etc.)
 * @param {{cursor?: string, limit?: number, type?: string, communityId?: string, tempRoomId?: string, visibility?: string}} query
 * @returns {Promise<{posts: object[], nextCursor: string|null, hasNextPage: boolean}>}
 */
export async function getFeed(_userId, query = {}) {
  const maxLimit = Math.min(Number(query.limit) || 20, 50);

  const filter = { status: "active" };

  if (query.type)        filter.type        = query.type;
  if (query.communityId) filter.communityId = query.communityId;
  if (query.tempRoomId)  filter.tempRoomId  = query.tempRoomId;
  if (query.visibility)  filter.visibility  = query.visibility;

  if (query.cursor) {
    try {
      const { createdAt, _id } = JSON.parse(Buffer.from(query.cursor, "base64").toString("utf8"));
      filter.$or = [
        { createdAt: { $lt: new Date(createdAt) } },
        { createdAt: new Date(createdAt), _id: { $lt: _id } }
      ];
    } catch {
      /* invalid cursor — return from start */
    }
  }

  const docs = await Post.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(maxLimit + 1)
    .populate("author", "name profile.username profile.profileImage")
    .lean();

  const hasNextPage = docs.length > maxLimit;
  const posts       = docs.slice(0, maxLimit).map(mergeStatsIntoPost);
  const last        = posts[posts.length - 1];

  const nextCursor = hasNextPage
    ? Buffer.from(JSON.stringify({ createdAt: last.createdAt, _id: last._id })).toString("base64")
    : null;

  return { posts, nextCursor, hasNextPage };
}

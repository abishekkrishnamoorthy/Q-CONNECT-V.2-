// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\post.controller.js
import { v4 as uuidv4 } from "uuid";
import * as postService    from "./post.service.js";
import * as likeService    from "./services/like.service.js";
import * as saveService    from "./services/save.service.js";
import * as commentService from "./services/comment.service.js";
import * as thoughtService from "./services/thought.service.js";
import * as quizService    from "./services/quiz.service.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Wraps a successful response in the standard envelope.
 */
function ok(res, data, status = 200) {
  res.status(status).json({ data });
}

/**
 * Creates a standardized error body per Step 9 spec.
 */
export function makeErrorBody(code, message, details = []) {
  return {
    error: { code, message, details },
    meta:  { requestId: uuidv4() }
  };
}

// ── Post CRUD ─────────────────────────────────────────────────────────────────

/** POST /api/posts */
export async function createPost(req, res) {
  const post = await postService.createPost(req.user.id, req.body, req.user.role);
  ok(res, post, 201);
}

/** GET /api/posts/feed */
export async function getFeed(req, res) {
  const result = await postService.getFeed(req.user.id, req.query);
  ok(res, result);
}

/** GET /api/posts/:id */
export async function getPost(req, res) {
  const post = await postService.getPostById(req.params.id);
  ok(res, post);
}

/** PATCH /api/posts/:id */
export async function editPost(req, res) {
  const post = await postService.editPost(req.params.id, req.user.id, req.body);
  ok(res, post);
}

/** DELETE /api/posts/:id */
export async function deletePost(req, res) {
  const result = await postService.deletePost(req.params.id, req.user.id);
  ok(res, result);
}

/** POST /api/posts/:id/report */
export async function reportPost(req, res) {
  const result = await postService.reportPost(req.params.id, req.user.id, req.body.reason);
  ok(res, result, 201);
}

// ── Engagement — Like / Unlike ─────────────────────────────────────────────

/** POST /api/posts/:id/like */
export async function likePost(req, res) {
  const result = await likeService.like(req.params.id, req.user.id);
  ok(res, result);
}

/** DELETE /api/posts/:id/like */
export async function unlikePost(req, res) {
  const result = await likeService.unlike(req.params.id, req.user.id);
  ok(res, result);
}

// ── Engagement — Save / Unsave ─────────────────────────────────────────────

/** POST /api/posts/:id/save */
export async function savePost(req, res) {
  const result = await saveService.save(req.params.id, req.user.id);
  ok(res, result);
}

/** DELETE /api/posts/:id/save */
export async function unsavePost(req, res) {
  const result = await saveService.unsave(req.params.id, req.user.id);
  ok(res, result);
}

// ── Comments ──────────────────────────────────────────────────────────────────

/** GET /api/posts/:id/comments */
export async function getComments(req, res) {
  const result = await commentService.getComments(req.params.id, {
    cursor:   req.query.cursor,
    limit:    Number(req.query.limit) || 20,
    parentId: req.query.parentId
  });
  ok(res, result);
}

/** POST /api/posts/:id/comments */
export async function addComment(req, res) {
  const comment = await commentService.addComment(req.params.id, req.user.id, {
    text:     req.body.text,
    parentId: req.body.parentId
  });
  ok(res, comment, 201);
}

/** DELETE /api/posts/:id/comments/:commentId */
export async function deleteComment(req, res) {
  const result = await commentService.deleteComment(
    req.params.id,
    req.params.commentId,
    req.user.id
  );
  ok(res, result);
}

// ── Poll ──────────────────────────────────────────────────────────────────────

/** PATCH /api/posts/:id/vote */
export async function voteOnPoll(req, res) {
  const result = await thoughtService.voteOnPoll(
    req.params.id,
    req.user.id,
    Number(req.body.optionIndex)
  );
  ok(res, result);
}

/** GET /api/posts/:id/vote */
export async function getPollResults(req, res) {
  const result = await thoughtService.getPollResults(req.params.id, req.user.id);
  ok(res, result);
}

// ── Community & Room Feeds ────────────────────────────────────────────────────

/** GET /api/posts/community/:communityId */
export async function getCommunityFeed(req, res) {
  const result = await postService.getFeed(req.user.id, {
    ...req.query,
    communityId: req.params.communityId,
    visibility:  "community"
  });
  ok(res, result);
}

/** GET /api/posts/room/:tempRoomId */
export async function getRoomFeed(req, res) {
  const result = await postService.getFeed(req.user.id, {
    ...req.query,
    tempRoomId: req.params.tempRoomId,
    visibility:  "tempRoom"
  });
  ok(res, result);
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

/** POST /api/quiz */
export async function createQuiz(req, res) {
  const quiz = await quizService.createQuiz(req.user.id, req.body);
  ok(res, quiz, 201);
}

/** POST /api/quiz/:id/attempt */
export async function attemptQuiz(req, res) {
  const result = await quizService.attemptQuiz(
    req.params.id,
    req.user.id,
    req.body.answers,
    req.body.timeTaken
  );
  ok(res, result, 201);
}

/** GET /api/quiz/:id/leaderboard */
export async function getLeaderboard(req, res) {
  const result = await quizService.getQuizLeaderboard(req.params.id);
  ok(res, { leaderboard: result });
}

// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\post.routes.js
import { Router } from "express";
import {
  requireAuth,
  requireAIAccount,
  attachPostToRequest
} from "./post.middleware.js";
import {
  createPost,
  getFeed,
  getPost,
  editPost,
  deletePost,
  reportPost,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  getComments,
  addComment,
  deleteComment,
  voteOnPoll,
  getPollResults,
  getCommunityFeed,
  getRoomFeed,
  createQuiz,
  attemptQuiz,
  getLeaderboard
} from "./post.controller.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// All routes require authentication
// ─────────────────────────────────────────────────────────────────────────────

router.use(requireAuth);

// ── Post CRUD ──────────────────────────────────────────────────────────────────
// NOTE: static paths (/feed, /community/:id, /room/:id) MUST be declared
// before the dynamic /:id route to avoid Express matching them as post IDs.

router.get("/feed",                      getFeed);
router.get("/community/:communityId",    getCommunityFeed);
router.get("/room/:tempRoomId",          getRoomFeed);

router.post("/",                         createPost);
router.get("/:id",                       getPost);
router.patch("/:id",                     editPost);
router.delete("/:id",                    deletePost);

// ── Reporting ─────────────────────────────────────────────────────────────────
router.post("/:id/report",               attachPostToRequest, reportPost);

// ── Engagement — Like / Unlike ─────────────────────────────────────────────
router.post("/:id/like",                 attachPostToRequest, likePost);
router.delete("/:id/like",               attachPostToRequest, unlikePost);

// ── Engagement — Save / Unsave ─────────────────────────────────────────────
router.post("/:id/save",                 attachPostToRequest, savePost);
router.delete("/:id/save",               attachPostToRequest, unsavePost);

// ── Comments ──────────────────────────────────────────────────────────────────
router.get("/:id/comments",              getComments);
router.post("/:id/comments",             attachPostToRequest, addComment);
router.delete("/:id/comments/:commentId", deleteComment);

// ── Poll ──────────────────────────────────────────────────────────────────────
router.patch("/:id/vote",                attachPostToRequest, voteOnPoll);
router.get("/:id/vote",                  getPollResults);

// ── AI-only post creation guard ───────────────────────────────────────────────
// AI posts are created via POST /api/posts with type:"ai"
// The requireAIAccount check happens inside ai.service.js (double-check)
// Expose an explicit AI-only sub-router if needed in future here.
// router.post("/ai", requireAIAccount, createPost);  // optional explicit route

export default router;

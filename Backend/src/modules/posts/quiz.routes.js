// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\quiz.routes.js
import { Router } from "express";
import { requireAuth } from "./post.middleware.js";
import { createQuiz, attemptQuiz, getLeaderboard } from "./post.controller.js";

const router = Router();

// All quiz endpoints require authentication
router.use(requireAuth);

/**
 * POST /api/quiz
 * Body: { title, questions[], timeLimit?, communityId? }
 * Creates a Quiz document (not the Post — post is a separate step).
 */
router.post("/", createQuiz);

/**
 * POST /api/quiz/:id/attempt
 * Body: { answers: [number], timeTaken: number }
 * Submits a quiz attempt; one per user enforced at DB level.
 */
router.post("/:id/attempt", attemptQuiz);

/**
 * GET /api/quiz/:id/leaderboard
 * Returns top-50 scorers sorted by score desc, timeTaken asc.
 */
router.get("/:id/leaderboard", getLeaderboard);

export default router;

// d:\projects\QCONNECT(V2.0)\Backend\src\server.js
import "express-async-errors";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { config } from "./config/index.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import authRouter    from "./modules/auth/auth.routes.js";
import userRouter    from "./modules/users/user.routes.js";
import profileRouter from "./modules/profile/profile.routes.js";
import postRouter    from "./modules/posts/post.routes.js";
import quizRouter    from "./modules/posts/quiz.routes.js";
import { checkEmailConnectivity } from "./services/email.service.js";
import { startStatsFlushJob }     from "./jobs/statsFlush.job.js";

// ── Post-module models for ensureIndexes (Step 10) ───────────────────────────
import Post            from "./modules/posts/models/post.model.js";
import PollVote        from "./modules/posts/models/pollVote.model.js";
import Like            from "./modules/posts/models/like.model.js";
import Save            from "./modules/posts/models/save.model.js";
import Comment         from "./modules/posts/models/comment.model.js";
import Quiz            from "./modules/posts/models/quiz.model.js";
import QuizAttempt     from "./modules/posts/models/quizAttempt.model.js";

const app = express();

app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

/**
 * Maps mongoose connection state to readable status.
 * @returns {"up"|"down"}
 */
function getDbHealthStatus() {
  return mongoose.connection.readyState === 1 ? "up" : "down";
}

app.get("/health", async (_req, res) => {
  const email = await checkEmailConnectivity();
  const db = getDbHealthStatus();
  const status = db === "up" ? "ok" : "degraded";
  res.status(status === "ok" ? 200 : 503).json({
    status,
    services: {
      db,
      email
    },
    env: {
      backendBaseUrl: config.backendBaseUrl,
      clientOrigin: config.clientOrigin
    }
  });
});

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/api/profile", profileRouter);
app.use("/api/posts",   postRouter);
app.use("/api/quiz",    quizRouter);

app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

app.use(errorMiddleware);

/**
 * Starts the Express server after MongoDB connection is established.
 * @returns {Promise<void>}
 */
export async function startServer() {
  await mongoose.connect(config.mongoUri);
  // eslint-disable-next-line no-console
  console.log("MongoDB: connected");

  // ── STEP 10: Ensure all post-module indexes are registered ─────────────────
  await Promise.all([
    Post.ensureIndexes(),
    PollVote.ensureIndexes(),
    Like.ensureIndexes(),
    Save.ensureIndexes(),
    Comment.ensureIndexes(),
    Quiz.ensureIndexes(),
    QuizAttempt.ensureIndexes()
  ]);
  // eslint-disable-next-line no-console
  console.log("Post module: indexes ensured");

  // ── STEP 11: Start stats flush cron job ────────────────────────────────────
  startStatsFlushJob();

  const email = await checkEmailConnectivity();
  // eslint-disable-next-line no-console
  console.log(`Email service: ${email.configured ? "configured" : "not configured"}`);
  // eslint-disable-next-line no-console
  console.log(`Email provider connectivity: ${email.reachable ? "reachable" : "unreachable"}`);
  // eslint-disable-next-line no-console
  console.log(`Email status detail: ${email.message}`);

  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server: listening on ${config.backendBaseUrl}`);
  });

  server.on("error", (error) => {
    const serverError = /** @type {{code?:string}} */ (error);
    if (serverError.code === "EADDRINUSE") {
      // eslint-disable-next-line no-console
      console.error(`Server start failed: Port ${config.port} is already in use`);
      process.exit(1);
      return;
    }
    // eslint-disable-next-line no-console
    console.error("Server start failed", error);
    process.exit(1);
  });
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", error);
  process.exit(1);
});

/**
 * Express app instance for testing.
 */
export default app;

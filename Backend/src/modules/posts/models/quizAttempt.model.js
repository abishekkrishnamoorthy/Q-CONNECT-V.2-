// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\models\quizAttempt.model.js
import mongoose from "mongoose";

/**
 * QuizAttempt — one attempt per user per quiz (enforced by compound unique index).
 * Matches DB_SCHEMA_REFERENCE SCHEMA 7.
 */
const quizAttemptSchema = new mongoose.Schema(
  {
    quizId:      { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers:     { type: [Number], required: true }, // selected optionIndex per question
    score:       { type: Number, required: true },   // correct answer count
    totalQ:      { type: Number, required: true },   // snapshot of question count at attempt time
    timeTaken:   { type: Number, default: 0 },       // seconds
    completedAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

// One attempt per user per quiz
quizAttemptSchema.index({ quizId: 1, userId: 1 }, { unique: true });
// Leaderboard: best scores first, then fastest
quizAttemptSchema.index({ quizId: 1, score: -1, timeTaken: 1 });

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);

export default QuizAttempt;

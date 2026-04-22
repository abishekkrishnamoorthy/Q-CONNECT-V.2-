// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\models\quiz.model.js
import mongoose from "mongoose";

/**
 * Quiz — the quiz definition document linked 1:1 to a quiz-type Post.
 * Matches DB_SCHEMA_REFERENCE SCHEMA 6.
 */
const questionSchema = new mongoose.Schema(
  {
    text:        { type: String, required: true },
    options:     {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length >= 2 && v.length <= 6,
        message: "options must have between 2 and 6 items"
      }
    },
    correct:     { type: Number, required: true }, // 0-based index
    explanation: { type: String, default: null }
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    // postId is null until the quiz-type Post is created and back-linked.
    // Flow: POST /api/quiz → quiz created (postId=null)
    //       POST /api/posts { type:"quiz", meta.quizId } → post saved → quiz.postId updated
    postId:        { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    author:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    communityId:   { type: mongoose.Schema.Types.ObjectId, ref: "Community", default: null },
    title:         { type: String, required: true, trim: true, maxlength: 150 },
    questions:     { type: [questionSchema], required: true },
    timeLimit:     { type: Number, default: null }, // seconds, null = no limit
    totalAttempts: { type: Number, default: 0 },
    status:        { type: String, enum: ["active", "closed"], default: "active" }
  },
  { timestamps: true }
);

quizSchema.index({ postId: 1 }, { unique: true });        // 1:1 with Post
quizSchema.index({ author: 1, createdAt: -1 });
quizSchema.index({ communityId: 1, createdAt: -1 });

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;

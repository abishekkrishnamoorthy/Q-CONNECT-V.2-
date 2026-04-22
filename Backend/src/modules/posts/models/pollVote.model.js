// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\models\pollVote.model.js
import mongoose from "mongoose";

/**
 * PollVote — one document per user per poll post.
 * Compound unique index at DB level prevents duplicate votes without app-level races.
 * Matches DB_SCHEMA_REFERENCE SCHEMA 2.
 */
const pollVoteSchema = new mongoose.Schema(
  {
    postId:      { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    optionIndex: { type: Number, required: true, min: 0 }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// UNIQUE compound index — DB-level duplicate vote prevention
pollVoteSchema.index({ postId: 1, userId: 1 }, { unique: true });
// Count votes per post per option
pollVoteSchema.index({ postId: 1 });

const PollVote = mongoose.model("PollVote", pollVoteSchema);

export default PollVote;

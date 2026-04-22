// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\models\comment.model.js
import mongoose from "mongoose";

/**
 * Comment — threaded comments on posts.
 * parentId === null means top-level comment.
 * Matches DB_SCHEMA_REFERENCE SCHEMA 3.
 */
const commentSchema = new mongoose.Schema(
  {
    postId:    { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    author:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text:      { type: String, required: true, maxlength: 1000, trim: true },
    parentId:  { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    isAIReply: { type: Boolean, default: false },
    status:    { type: String, enum: ["active", "deleted"], default: "active" },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Feed queries — load comments for a post
commentSchema.index({ postId: 1, status: 1, createdAt: 1 });
// Load replies to a comment
commentSchema.index({ parentId: 1, status: 1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;

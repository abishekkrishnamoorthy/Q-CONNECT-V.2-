// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\models\like.model.js
import mongoose from "mongoose";

/**
 * Like — one document per user per post.
 * Compound unique index prevents duplicate likes at DB level.
 * Matches DB_SCHEMA_REFERENCE SCHEMA 4.
 */
const likeSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

likeSchema.index({ postId: 1, userId: 1 }, { unique: true });
likeSchema.index({ userId: 1 });

const Like = mongoose.model("Like", likeSchema);

export default Like;

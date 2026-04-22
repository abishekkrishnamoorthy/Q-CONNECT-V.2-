// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\models\save.model.js
import mongoose from "mongoose";

/**
 * Save — one document per user per post.
 * Compound unique index prevents duplicate saves at DB level.
 * Matches DB_SCHEMA_REFERENCE SCHEMA 5.
 */
const saveSchema = new mongoose.Schema(
  {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

saveSchema.index({ postId: 1, userId: 1 }, { unique: true });
saveSchema.index({ userId: 1, createdAt: -1 }); // saved posts feed

const Save = mongoose.model("Save", saveSchema);

export default Save;

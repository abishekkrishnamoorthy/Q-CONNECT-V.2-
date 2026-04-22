// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\models\moderationReport.model.js
import mongoose from "mongoose";

/**
 * ModerationReport — user-submitted report on a post.
 * Matches DB_SCHEMA_REFERENCE SCHEMA 9.
 */
const moderationReportSchema = new mongoose.Schema(
  {
    postId:     { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason:     { type: String, required: true, maxlength: 500, trim: true },
    status:     { type: String, enum: ["pending", "reviewed", "dismissed"], default: "pending" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

moderationReportSchema.index({ postId: 1, status: 1 });
moderationReportSchema.index({ status: 1, createdAt: 1 });

const ModerationReport = mongoose.model("ModerationReport", moderationReportSchema);

export default ModerationReport;

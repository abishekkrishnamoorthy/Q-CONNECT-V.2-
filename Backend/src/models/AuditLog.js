// d:\projects\QCONNECT(V2.0)\Backend\src\models\AuditLog.js
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    eventType: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

/**
 * AuditLog model capturing authentication and onboarding security events.
 */
const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;

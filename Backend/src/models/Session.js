// d:\projects\QCONNECT(V2.0)\Backend\src\models\Session.js
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "" }
  },
  { timestamps: true }
);

/**
 * Session model storing hashed refresh tokens and revocation metadata.
 */
const Session = mongoose.model("Session", sessionSchema);

export default Session;

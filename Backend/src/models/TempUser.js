// d:\projects\QCONNECT(V2.0)\Backend\src\models\TempUser.js
import mongoose from "mongoose";

const tempUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    lastSentAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now, expires: 3600 }
  },
  { timestamps: false }
);

/**
 * TempUser model for pending email verification records with TTL expiry.
 */
const TempUser = mongoose.model("TempUser", tempUserSchema);

export default TempUser;

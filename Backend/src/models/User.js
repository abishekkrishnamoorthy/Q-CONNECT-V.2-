// d:\projects\QCONNECT(V2.0)\Backend\src\models\User.js
import mongoose from "mongoose";

const oauthProviderSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ["google"], required: true },
    id: { type: String, required: true },
    linkedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null },
    oauthProviders: { type: [oauthProviderSchema], default: [] },
    name: { type: String, trim: true, default: "" },
    // Role: "user" | "moderator" | "admin" | "ai_account"
    // ai_account: one per community AI, posts autonomously on schedule
    role: {
      type: String,
      enum: ["user", "moderator", "admin", "ai_account"],
      default: "user",
      index: true
    },
    // Communities (subjects) the user has joined — refs to Community collection
    subjects: { type: [mongoose.Schema.Types.ObjectId], ref: "Community", default: [] },
    profile: {
      username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
      profileImage: { type: String, default: "" },
      banner: { type: String, default: "" },
      bio: { type: String, trim: true, maxlength: 280, default: "" },
      tagline: { type: String, trim: true, maxlength: 100, default: "" },
      dob: { type: Date, default: null },
      interests: { type: [String], default: [] },
    },
    isProfileComplete: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null }
  },
  { timestamps: true }
);

/**
 * User model storing verified account credentials and profile metadata.
 */
const User = mongoose.model("User", userSchema);

export default User;

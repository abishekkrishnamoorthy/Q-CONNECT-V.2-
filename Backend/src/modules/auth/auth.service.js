// d:\projects\QCONNECT(V2.0)\Backend\src\modules\auth\auth.service.js
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import mongoose from "mongoose";
import { config } from "../../config/index.js";
import User from "../../models/User.js";
import TempUser from "../../models/TempUser.js";
import Session from "../../models/Session.js";
import AuditLog from "../../models/AuditLog.js";
import { createAppError } from "../../middleware/error.middleware.js";
import { sendVerificationEmail } from "../../services/email.service.js";
import {
  issueAccessToken,
  issueRefreshToken,
  revokeJti,
  sha256,
  verifyRefreshToken
} from "../../services/token.service.js";

const googleClient = new OAuth2Client(config.googleClientId);

/**
 * Builds API user payload shape.
 * @param {import("../../models/User.js").default & {_id:import("mongoose").Types.ObjectId}} user
 * @returns {object}
 */
function mapUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name || "",
    username: user.profile?.username || "",
    bio: user.profile?.bio || "",
    tagline: user.profile?.tagline || "",
    banner: user.profile?.banner || "",
    dob: user.profile?.dob || null,
    interests: user.profile?.interests || [],
    profileImage: user.profile?.profileImage || "",
    isProfileComplete: Boolean(user.isProfileComplete)
  };
}

/**
 * Checks whether current MongoDB connection supports transactions.
 * @returns {boolean}
 */
function isTransactionSupported() {
  const topologyDescription = mongoose.connection?.client?.topology?.description;
  const topologyType = topologyDescription?.type;
  return topologyType === "ReplicaSetWithPrimary" || topologyType === "Sharded";
}

/**
 * Creates user from pending record without transaction and handles idempotency.
 * @param {{_id:import("mongoose").Types.ObjectId,email:string,passwordHash:string}} tempUser
 * @returns {Promise<{message:string}>}
 */
async function verifyWithoutTransaction(tempUser) {
  try {
    await User.create({
      email: tempUser.email,
      passwordHash: tempUser.passwordHash,
      isProfileComplete: false
    });
  } catch (error) {
    const mongoError = /** @type {{code?:number}} */ (error);
    if (mongoError.code !== 11000) {
      throw error;
    }

    const existingUser = await User.findOne({ email: tempUser.email }).select("_id").lean();
    if (!existingUser) {
      throw error;
    }
  }

  await TempUser.deleteOne({ _id: tempUser._id });
  await AuditLog.create({ eventType: "VERIFY_SUCCESS", metadata: { email: tempUser.email } });
  return { message: "Email verified successfully" };
}

/**
 * Creates or updates pending email verification and dispatches email.
 * @param {{email:string,password:string}} input
 * @returns {Promise<{message:string}>}
 */
export async function registerUser(input) {
  const existing = await User.findOne({ email: input.email }).lean();
  if (existing) {
    throw createAppError("Email already exists", 400, "EMAIL_EXISTS");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(verificationToken);
  const now = new Date();

  await TempUser.findOneAndUpdate(
    { email: input.email },
    {
      $set: {
        email: input.email,
        passwordHash,
        tokenHash,
        createdAt: now,
        lastSentAt: now
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const verificationUrl = `${config.backendBaseUrl}/auth/verify?token=${encodeURIComponent(verificationToken)}`;
  await sendVerificationEmail({ toEmail: input.email, verificationUrl });

  await AuditLog.create({ eventType: "REGISTER_PENDING", metadata: { email: input.email } });

  return { message: "Check email to verify" };
}

/**
 * Verifies token and promotes pending user to permanent user.
 * @param {string} token
 * @returns {Promise<{message:string}>}
 */
export async function verifyEmailToken(token) {
  const tokenHash = sha256(token);
  const tempUser = await TempUser.findOne({ tokenHash });
  if (!tempUser) {
    throw createAppError("Invalid or expired verification token", 400, "INVALID_TOKEN");
  }

  if (!isTransactionSupported()) {
    return verifyWithoutTransaction({
      _id: tempUser._id,
      email: tempUser.email,
      passwordHash: tempUser.passwordHash
    });
  }

  const mongoSession = await mongoose.startSession();
  try {
    await mongoSession.withTransaction(async () => {
      await User.create(
        [
          {
            email: tempUser.email,
            passwordHash: tempUser.passwordHash,
            isProfileComplete: false
          }
        ],
        { session: mongoSession }
      );
      await TempUser.deleteOne({ _id: tempUser._id }, { session: mongoSession });
      await AuditLog.create(
        [{ eventType: "VERIFY_SUCCESS", metadata: { email: tempUser.email } }],
        { session: mongoSession }
      );
    });
  } catch (error) {
    const mongoError = /** @type {{code?:number,message?:string}} */ (error);
    if (mongoError.code === 11000) {
      await TempUser.deleteOne({ _id: tempUser._id });
      return { message: "Email verified successfully" };
    }
    if (mongoError.code === 20 || mongoError.message?.includes("Transaction numbers are only allowed")) {
      return verifyWithoutTransaction({
        _id: tempUser._id,
        email: tempUser.email,
        passwordHash: tempUser.passwordHash
      });
    }
    throw error;
  } finally {
    await mongoSession.endSession();
  }

  return { message: "Email verified successfully" };
}

/**
 * Returns verification status for a given email.
 * @param {string} email
 * @returns {Promise<{verified:boolean,status:"verified"|"pending"|"not_found"}>}
 */
export async function getVerificationStatus(email) {
  const user = await User.findOne({ email }).select("_id").lean();
  if (user) {
    return { verified: true, status: "verified" };
  }
  const pending = await TempUser.findOne({ email }).select("_id").lean();
  if (pending) {
    return { verified: false, status: "pending" };
  }
  return { verified: false, status: "not_found" };
}

/**
 * Rotates pending verification token and resends email.
 * @param {string} email
 * @returns {Promise<{message:string,retryAfterSec:number}>}
 */
export async function resendVerification(email) {
  const user = await User.findOne({ email }).select("_id").lean();
  if (user) {
    throw createAppError("Email is already verified", 409, "ALREADY_VERIFIED");
  }

  const pending = await TempUser.findOne({ email });
  if (!pending) {
    throw createAppError("No pending verification found", 404, "PENDING_NOT_FOUND");
  }

  const now = Date.now();
  if (pending.lastSentAt && now - pending.lastSentAt.getTime() < 60 * 1000) {
    throw createAppError("Please wait before resending", 429, "RESEND_COOLDOWN");
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  pending.tokenHash = sha256(verificationToken);
  pending.createdAt = new Date();
  pending.lastSentAt = new Date();
  await pending.save();

  const verificationUrl = `${config.backendBaseUrl}/auth/verify?token=${encodeURIComponent(verificationToken)}`;
  await sendVerificationEmail({ toEmail: email, verificationUrl });

  await AuditLog.create({ eventType: "VERIFY_RESEND", metadata: { email } });

  return { message: "Verification email resent", retryAfterSec: 60 };
}

/**
 * Logs in a user with email and password, then creates tokens and session.
 * @param {{email:string,password:string,userAgent?:string,ipAddress?:string}} input
 * @returns {Promise<{accessToken:string,refreshToken:string,user:ReturnType<typeof mapUser>}>}
 */
export async function loginUser(input) {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    throw createAppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  if (!user.passwordHash) {
    throw createAppError("Use Google sign-in for this account", 401, "OAUTH_ONLY_ACCOUNT");
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    throw createAppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  user.lastLogin = new Date();
  await user.save();

  const { token: accessToken } = issueAccessToken({ id: String(user._id), email: user.email });
  const { token: refreshToken, expiresAt } = issueRefreshToken({ id: String(user._id), email: user.email });

  await Session.create({
    userId: user._id,
    tokenHash: sha256(refreshToken),
    expiresAt,
    userAgent: input.userAgent || "",
    ipAddress: input.ipAddress || ""
  });

  await AuditLog.create({ eventType: "LOGIN_SUCCESS", userId: user._id, metadata: {} });

  return { accessToken, refreshToken, user: mapUser(user) };
}

/**
 * Logs in or registers a user via Google OAuth.
 * @param {{credential:string,userAgent?:string,ipAddress?:string}} input
 * @returns {Promise<{accessToken:string,refreshToken:string,user:ReturnType<typeof mapUser>}>}
 */
export async function oauthGoogle(input) {
  if (!config.googleClientId) {
    throw createAppError("Google OAuth is not configured", 503, "GOOGLE_OAUTH_NOT_CONFIGURED");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: input.credential,
    audience: config.googleClientId
  });

  const payload = ticket.getPayload();
  if (!payload?.email || !payload?.sub) {
    throw createAppError("Invalid Google token payload", 401, "GOOGLE_TOKEN_INVALID");
  }

  const email = payload.email.toLowerCase().trim();
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      email,
      oauthProviders: [{ provider: "google", id: payload.sub }],
      profile: { profileImage: payload.picture || "" },
      isProfileComplete: false
    });
  } else {
    const hasProvider = user.oauthProviders.some((provider) => provider.provider === "google" && provider.id === payload.sub);
    if (!hasProvider) {
      user.oauthProviders.push({ provider: "google", id: payload.sub, linkedAt: new Date() });
    }
    user.lastLogin = new Date();
    if (!user.profile?.profileImage && payload.picture) {
      user.profile.profileImage = payload.picture;
    }
    await user.save();
  }

  const { token: accessToken } = issueAccessToken({ id: String(user._id), email: user.email });
  const { token: refreshToken, expiresAt } = issueRefreshToken({ id: String(user._id), email: user.email });

  await Session.create({
    userId: user._id,
    tokenHash: sha256(refreshToken),
    expiresAt,
    userAgent: input.userAgent || "",
    ipAddress: input.ipAddress || ""
  });

  await AuditLog.create({ eventType: "OAUTH_LOGIN_SUCCESS", userId: user._id, metadata: { provider: "google" } });

  return { accessToken, refreshToken, user: mapUser(user) };
}

/**
 * Returns current authenticated user profile.
 * @param {string} userId
 * @returns {Promise<ReturnType<typeof mapUser>>}
 */
export async function getAuthMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw createAppError("User not found", 404, "USER_NOT_FOUND");
  }
  return mapUser(user);
}

/**
 * Revokes current session from refresh cookie and current access token jti.
 * @param {{refreshToken?:string|null,jti:string,exp:number}} input
 * @returns {Promise<{message:string}>}
 */
export async function logoutUser(input) {
  if (input.refreshToken) {
    const tokenHash = sha256(input.refreshToken);
    await Session.findOneAndUpdate({ tokenHash, revokedAt: null }, { $set: { revokedAt: new Date() } });

    try {
      const payload = verifyRefreshToken(input.refreshToken);
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp < nowSec) {
        await Session.deleteMany({ expiresAt: { $lt: new Date() } });
      }
    } catch {
      // silently ignore malformed or expired refresh tokens in logout
    }
  }

  revokeJti(input.jti, input.exp);
  return { message: "Logged out successfully" };
}

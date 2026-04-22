// d:\projects\QCONNECT(V2.0)\Backend\src\modules\users\user.service.js
import User from "../../models/User.js";
import { createAppError } from "../../middleware/error.middleware.js";
import { deleteProfileImage, uploadProfileImage } from "../../services/cloudinary.service.js";

/**
 * Maps user model to API payload.
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
 * Checks if username is available globally.
 * @param {string} username
 * @returns {Promise<{available:boolean,normalizedUsername:string,message:string}>}
 */
export async function checkUsernameAvailability(username) {
  const normalizedUsername = username.trim().toLowerCase();
  const existing = await User.findOne({ "profile.username": normalizedUsername }).select("_id").lean();

  return {
    available: !existing,
    normalizedUsername,
    message: existing ? "Username is already taken" : "Username is available"
  };
}

/**
 * Returns the current authenticated user's profile.
 * @param {string} userId
 * @returns {Promise<{user:ReturnType<typeof mapUser>}>}
 */
export async function getMyProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw createAppError("User not found", 404, "USER_NOT_FOUND");
  }
  return { user: mapUser(user) };
}

/**
 * Updates onboarding profile fields and optional image upload.
 * @param {{userId:string,name:string,username:string,bio?:string,interestedTopics?:string[],profileFile?:Express.Multer.File}} input
 * @returns {Promise<{user:ReturnType<typeof mapUser>}>}
 */
export async function setupProfile(input) {
  const user = await User.findById(input.userId);
  if (!user) {
    throw createAppError("User not found", 404, "USER_NOT_FOUND");
  }

  const normalizedUsername = input.username.trim().toLowerCase();
  const usernameOwner = await User.findOne({ "profile.username": normalizedUsername }).select("_id").lean();
  if (usernameOwner && String(usernameOwner._id) !== String(user._id)) {
    throw createAppError("Username already taken", 409, "USERNAME_TAKEN");
  }

  if (input.profileFile) {
    const upload = await uploadProfileImage({
      buffer: input.profileFile.buffer,
      mimetype: input.profileFile.mimetype,
      userId: String(user._id)
    });
    user.profile.profileImage = upload.url;
  }

  user.name = input.name?.trim() || user.name;
  user.profile.username = normalizedUsername;
  user.profile.bio = input.bio?.trim() || "";
  user.profile.interests = (input.interestedTopics || []).map((topic) => topic.trim().toLowerCase());
  user.isProfileComplete = true;

  await user.save();

  return { user: mapUser(user) };
}

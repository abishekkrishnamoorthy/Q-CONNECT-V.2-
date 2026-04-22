import User from "../../models/User.js";
import { deleteProfileImage, uploadProfileImage } from "../../services/cloudinary.service.js";

const DOMAIN_TOPICS_MAP = {
  "Programming": ["DSA", "Web Dev", "React", "Node.js", "System Design", "Python", "Java"],
  "Maths": ["Calculus", "Linear Algebra", "Probability", "Discrete Math", "Statistics"],
  "Physics": ["Mechanics", "Quantum Physics", "Electromagnetism", "Thermodynamics", "Optics"]
};

export async function checkUsernameAvailability(username, currentUserId) {
  const existingUser = await User.findOne({ "profile.username": username }).select("_id").lean();
  if (!existingUser) {
    return { available: true };
  }
  if (String(existingUser._id) === String(currentUserId)) {
    return { available: true }; // It's their own username
  }
  return { available: false };
}

export function getSuggestedTopics(selectedDomains) {
  const topics = new Set();
  for (const domain of selectedDomains) {
    const domainTopics = DOMAIN_TOPICS_MAP[domain] || [];
    domainTopics.forEach((t) => topics.add(t));
  }
  return Array.from(topics);
}

export async function setupUserProfile(userId, profileData, file) {
  // Ensure username is not taken by someone else
  const { available } = await checkUsernameAvailability(profileData.username, userId);
  if (!available) {
    const error = new Error("Username is already taken");
    // @ts-expect-error custom status
    error.statusCode = 409;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  let profileImageUrl = profileData.profileImageStr || user.profile?.profileImage || "";
  
  if (file) {
    const upload = await uploadProfileImage({
      buffer: file.buffer,
      mimetype: file.mimetype,
      userId: userId
    });
    profileImageUrl = upload.url;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        "profile.username": profileData.username,
        "profile.bio": profileData.bio || "",
        "profile.tagline": profileData.tagline || "",
        "profile.dob": profileData.dob ? new Date(profileData.dob) : null,
        "profile.banner": profileData.banner || "",
        "profile.profileImage": profileImageUrl,
        "profile.interests": profileData.interests || [],
        isProfileComplete: true
      }
    },
    { new: true }
  ).select("-passwordHash -oauthProviders");

  return updatedUser;
}

export async function getUserProfile(userId) {
  return await User.findById(userId).select("-passwordHash -oauthProviders").lean();
}

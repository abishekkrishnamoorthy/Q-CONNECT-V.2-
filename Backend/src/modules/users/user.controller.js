// d:\projects\QCONNECT(V2.0)\Backend\src\modules\users\user.controller.js
import { createAppError } from "../../middleware/error.middleware.js";
import {
  checkUsernameAvailability,
  getMyProfile,
  setupProfile
} from "./user.service.js";
import {
  parseInterestedTopics,
  profileSetupSchema,
  usernameAvailabilitySchema
} from "./user.validation.js";

/**
 * Returns live username availability response.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
export async function usernameAvailabilityController(req, res, next) {
  try {
    const parsed = usernameAvailabilitySchema.parse({ username: req.query.username });
    const result = await checkUsernameAvailability(parsed.username);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Returns current authenticated profile.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
export async function meController(req, res, next) {
  try {
    const result = await getMyProfile(req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles profile setup submission with optional image upload.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
export async function profileSetupController(req, res, next) {
  try {
    let topics = [];
    try {
      topics = parseInterestedTopics(req.body.interestedTopics);
    } catch {
      throw createAppError("Invalid interestedTopics format", 400, "INVALID_TOPICS");
    }

    const parsed = profileSetupSchema.parse({
      name: req.body.name,
      username: req.body.username,
      bio: req.body.bio,
      interestedTopics: topics
    });

    const result = await setupProfile({
      userId: req.user.id,
      name: parsed.name,
      username: parsed.username,
      bio: parsed.bio,
      interestedTopics: parsed.interestedTopics || [],
      profileFile: req.file
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// d:\projects\QCONNECT(V2.0)\Backend\src\modules\users\user.validation.js
import { z } from "zod";

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

/**
 * Allowed topic choices for onboarding profile setup.
 */
export const ALLOWED_TOPICS = [
  "javascript",
  "typescript",
  "react",
  "nodejs",
  "mongodb",
  "system-design",
  "devops",
  "machine-learning",
  "data-structures",
  "career-growth"
];

/**
 * Username query validation schema.
 */
export const usernameAvailabilitySchema = z.object({
  username: z.string().trim().toLowerCase().regex(USERNAME_REGEX, "Username must be 3-20 chars using lowercase letters, numbers or underscores")
});

/**
 * Profile setup body validation schema for multipart fields.
 */
export const profileSetupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name is too long"),
  username: z.string().trim().toLowerCase().regex(USERNAME_REGEX, "Username must be 3-20 chars using lowercase letters, numbers or underscores"),
  bio: z.string().trim().max(280, "Bio must be at most 280 characters").optional(),
  interestedTopics: z.array(z.enum(ALLOWED_TOPICS)).max(10, "Too many topics").optional()
});

/**
 * Parses raw multipart interested topics into normalized array.
 * @param {unknown} raw
 * @returns {string[]}
 */
export function parseInterestedTopics(raw) {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  }

  if (typeof raw === "string") {
    const value = raw.trim();
    if (!value) {
      return [];
    }
    if (value.startsWith("[")) {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
    }
    return value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
}

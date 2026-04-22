// d:\projects\QCONNECT(V2.0)\Backend\src\modules\profile\profile.validation.js
import { z } from "zod";

export const usernameQuerySchema = z.object({
  query: z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores")
  })
});

export const suggestTopicsSchema = z.object({
  body: z.object({
    selectedDomains: z.array(z.string()).min(1, "Select at least one domain")
  })
});

export const setupProfileSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3)
      .max(20)
      .regex(/^[a-z0-9_]+$/),
    bio: z.string().max(280).optional(),
    tagline: z.string().max(100).optional(),
    dob: z.string().optional().or(z.date().optional()),
    banner: z.string().optional(),
    profileImage: z.string().optional(),
    interests: z
      .array(z.string())
      .min(3, "Select at least 3 interests")
      .max(10, "Select at most 10 interests")
  })
});

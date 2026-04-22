// d:\projects\QCONNECT(V2.0)\Backend\src\modules\auth\auth.validation.js
import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Registration request schema.
 */
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().regex(emailRegex, "Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

/**
 * Login request schema.
 */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().regex(emailRegex, "Invalid email address"),
  password: z.string().min(1, "Password is required")
});

/**
 * OAuth request schema.
 */
export const oauthSchema = z.object({
  credential: z.string().min(1, "Google credential is required")
});

/**
 * Resend request schema.
 */
export const resendSchema = z.object({
  email: z.string().trim().toLowerCase().regex(emailRegex, "Invalid email address")
});

/**
 * Check status request header schema.
 */
export const checkStatusSchema = z.object({
  email: z.string().trim().toLowerCase().regex(emailRegex, "Invalid email address")
});

/**
 * Verify token query schema.
 */
export const verifyTokenSchema = z.object({
  token: z.string().min(1, "Verification token is required")
});

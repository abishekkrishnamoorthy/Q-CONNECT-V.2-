// d:\projects\QCONNECT(V2.0)\Backend\src\middleware\rateLimit.middleware.js
import rateLimit from "express-rate-limit";

const commonOptions = {
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many attempts. Please try later." } }
};

/**
 * Rate limiter for registration endpoint.
 */
export const registerRateLimiter = rateLimit(commonOptions);

/**
 * Rate limiter for login endpoint.
 */
export const loginRateLimiter = rateLimit(commonOptions);

/**
 * Rate limiter for resend verification endpoint.
 */
export const resendRateLimiter = rateLimit(commonOptions);

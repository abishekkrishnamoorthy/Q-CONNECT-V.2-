// d:\projects\QCONNECT(V2.0)\Backend\src\middleware\auth.middleware.js
import User from "../models/User.js";
import { isJtiRevoked, verifyAccessToken } from "../services/token.service.js";

/**
 * Validates bearer access token and attaches authenticated user context.
 * @param {import("express").Request} req
 * @param {import("express").Response} _res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
export async function authMiddleware(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error = new Error("Authentication required");
      // @ts-expect-error custom status
      error.statusCode = 401;
      // @ts-expect-error custom code
      error.code = "AUTH_REQUIRED";
      throw error;
    }

    const token = authHeader.slice(7).trim();
    const payload = verifyAccessToken(token);

    if (isJtiRevoked(payload.jti)) {
      const revokedError = new Error("Session is revoked");
      // @ts-expect-error custom status
      revokedError.statusCode = 401;
      // @ts-expect-error custom code
      revokedError.code = "TOKEN_REVOKED";
      throw revokedError;
    }

    const user = await User.findById(payload.sub).select("_id email name profile.username isProfileComplete").lean();
    if (!user) {
      const missingError = new Error("User not found");
      // @ts-expect-error custom status
      missingError.statusCode = 401;
      // @ts-expect-error custom code
      missingError.code = "USER_NOT_FOUND";
      throw missingError;
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      username: user.profile?.username || "",
      isProfileComplete: Boolean(user.isProfileComplete),
      jti: payload.jti,
      exp: payload.exp,
      token
    };

    next();
  } catch (error) {
    next(error);
  }
}

// d:\projects\QCONNECT(V2.0)\Backend\src\modules\auth\auth.controller.js
import { config } from "../../config/index.js";
import {
  checkStatusSchema,
  loginSchema,
  oauthSchema,
  registerSchema,
  resendSchema,
  verifyTokenSchema
} from "./auth.validation.js";
import {
  getAuthMe,
  getVerificationStatus,
  loginUser,
  logoutUser,
  oauthGoogle,
  registerUser,
  resendVerification,
  verifyEmailToken
} from "./auth.service.js";

/**
 * Handles user registration request.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
export async function registerController(req, res, next) {
  try {
    const parsed = registerSchema.parse(req.body);
    const result = await registerUser(parsed);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles email verification callback.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
export async function verifyController(req, res, next) {
  try {
    const parsed = verifyTokenSchema.parse({ token: req.query.token });
    const result = await verifyEmailToken(parsed.token);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles login request and sets refresh cookie.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
export async function loginController(req, res, next) {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = await loginUser({
      ...parsed,
      userAgent: req.get("user-agent") || "",
      ipAddress: req.ip
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ accessToken: result.accessToken, user: result.user });
  } catch (error) {
    next(error);
  }
}

/**
 * Handles Google OAuth login and sets refresh cookie.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
export async function oauthController(req, res, next) {
  try {
    const parsed = oauthSchema.parse(req.body);
    const result = await oauthGoogle({
      ...parsed,
      userAgent: req.get("user-agent") || "",
      ipAddress: req.ip
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ accessToken: result.accessToken, user: result.user });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns verification status for polling clients.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
export async function checkStatusController(req, res, next) {
  try {
    const parsed = checkStatusSchema.parse({ email: req.header("x-user-email") });
    const result = await getVerificationStatus(parsed.email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Resends verification email.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
export async function resendController(req, res, next) {
  try {
    const parsed = resendSchema.parse(req.body);
    const result = await resendVerification(parsed.email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Logs out user by revoking current tokens and clearing cookie.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
export async function logoutController(req, res, next) {
  try {
    const result = await logoutUser({
      refreshToken: req.cookies?.refreshToken || null,
      jti: req.user.jti,
      exp: req.user.exp
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: "strict"
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Returns authenticated user profile.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
export async function meController(req, res, next) {
  try {
    const user = await getAuthMe(req.user.id);
    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

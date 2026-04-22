// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\post.middleware.js
import { authMiddleware } from "../../middleware/auth.middleware.js";
import Post from "./models/post.model.js";
import User from "../../models/User.js";

/**
 * requireAuth — delegates to the existing platform auth middleware.
 * Attaches req.user with { id, email, name, username, isProfileComplete, role }.
 * Also fetches and attaches req.user.role from the User document.
 */
export async function requireAuth(req, res, next) {
  // Run existing JWT auth middleware first
  authMiddleware(req, res, async (err) => {
    if (err) return next(err);

    // Augment req.user with role (needed for requireAIAccount)
    try {
      const userDoc = await User.findById(req.user.id).select("role").lean();
      req.user.role = userDoc?.role ?? "user";
      next();
    } catch (e) {
      next(e);
    }
  });
}

/**
 * requireAIAccount — ensures the authenticated user has role "ai_account".
 * Must be used AFTER requireAuth.
 */
export function requireAIAccount(req, _res, next) {
  if (req.user?.role !== "ai_account") {
    const err = new Error("Only AI accounts can perform this action");
    // @ts-expect-error custom code
    err.code = "FORBIDDEN";
    // @ts-expect-error custom statusCode
    err.statusCode = 403;
    return next(err);
  }
  next();
}

/**
 * attachPostToRequest — fetches post by req.params.id and attaches as req.post.
 * Returns 404 if not found or not active.
 * Must be used AFTER requireAuth.
 */
export async function attachPostToRequest(req, _res, next) {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post) {
      const err = new Error("Post not found");
      // @ts-expect-error custom code
      err.code = "NOT_FOUND";
      // @ts-expect-error custom statusCode
      err.statusCode = 404;
      return next(err);
    }
    req.post = post;
    next();
  } catch (e) {
    next(e);
  }
}

/**
 * requireOwner — confirms the authenticated user is the author of req.post.
 * Must be used AFTER attachPostToRequest.
 */
export function requireOwner(req, _res, next) {
  if (!req.post) {
    const err = new Error("Post not loaded — use attachPostToRequest first");
    // @ts-expect-error custom code
    err.code = "INTERNAL_ERROR";
    // @ts-expect-error custom statusCode
    err.statusCode = 500;
    return next(err);
  }
  if (String(req.post.author) !== String(req.user.id)) {
    const err = new Error("You are not the author of this post");
    // @ts-expect-error custom code
    err.code = "FORBIDDEN";
    // @ts-expect-error custom statusCode
    err.statusCode = 403;
    return next(err);
  }
  next();
}

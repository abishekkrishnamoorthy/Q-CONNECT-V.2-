// d:\projects\QCONNECT(V2.0)\Backend\src\middleware\profile.middleware.js

/**
 * Middleware to ensure the user's profile is NOT complete.
 */
export function requireProfileIncomplete(req, _res, next) {
  if (req.user && req.user.isProfileComplete) {
    const error = new Error("Profile is already completed");
    // @ts-expect-error custom status
    error.statusCode = 403;
    // @ts-expect-error custom code
    error.code = "PROFILE_COMPLETED";
    return next(error);
  }
  next();
}

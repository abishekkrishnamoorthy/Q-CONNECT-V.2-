// d:\projects\QCONNECT(V2.0)\Backend\src\modules\auth\auth.routes.js
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  loginRateLimiter,
  registerRateLimiter,
  resendRateLimiter
} from "../../middleware/rateLimit.middleware.js";
import {
  checkStatusController,
  loginController,
  logoutController,
  meController,
  oauthController,
  registerController,
  resendController,
  verifyController
} from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/register", registerRateLimiter, registerController);
authRouter.get("/verify", verifyController);
authRouter.post("/login", loginRateLimiter, loginController);
authRouter.post("/oauth", oauthController);
authRouter.get("/checkstatus", checkStatusController);
authRouter.post("/resend", resendRateLimiter, resendController);
authRouter.post("/logout", authMiddleware, logoutController);
authRouter.get("/me", authMiddleware, meController);

/**
 * Express router containing all authentication endpoints.
 */
export default authRouter;

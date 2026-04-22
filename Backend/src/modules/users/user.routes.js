// d:\projects\QCONNECT(V2.0)\Backend\src\modules\users\user.routes.js
import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { createAppError } from "../../middleware/error.middleware.js";
import {
  meController,
  profileSetupController,
  usernameAvailabilityController
} from "./user.controller.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(createAppError("Profile image must be JPG, PNG, or WebP", 400, "INVALID_IMAGE_TYPE"));
      return;
    }
    callback(null, true);
  }
});

const userRouter = Router();

userRouter.get("/username-availability", usernameAvailabilityController);
userRouter.get("/me", authMiddleware, meController);
userRouter.patch("/profile-setup", authMiddleware, upload.single("profilePic"), profileSetupController);

/**
 * Express router for user profile onboarding endpoints.
 */
export default userRouter;

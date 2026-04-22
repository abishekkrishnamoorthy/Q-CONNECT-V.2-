// d:\projects\QCONNECT(V2.0)\Backend\src\modules\profile\profile.routes.js
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireProfileIncomplete } from "../../middleware/profile.middleware.js";
import multer from "multer";
import {
  checkUsernameController,
  suggestTopicsController,
  setupProfileController,
  meController
} from "./profile.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const profileRouter = Router();

profileRouter.get("/check-username", authMiddleware, checkUsernameController);
profileRouter.post("/suggest-topics", authMiddleware, suggestTopicsController);
profileRouter.post("/setup", authMiddleware, requireProfileIncomplete, upload.single("profileImage"), setupProfileController);
profileRouter.get("/me", authMiddleware, meController);

export default profileRouter;

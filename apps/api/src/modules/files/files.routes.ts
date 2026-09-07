import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import * as controller from "./files.controller.js";
import { upload } from "./files.service.js";

export const filesRouter = Router();

filesRouter.post(
  "/upload",
  authenticate,
  requirePermission("files:upload"),
  upload.single("file"),
  asyncHandler(controller.upload),
);

filesRouter.get(
  "/:id/signed-url",
  authenticate,
  asyncHandler(controller.signedUrl),
);

filesRouter.get("/:id/download", authenticate, asyncHandler(controller.download));

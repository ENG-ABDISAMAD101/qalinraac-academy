import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./progress.controller.js";
import { completeLessonSchema } from "./progress.service.js";

export const progressRouter = Router();

progressRouter.use(authenticate);

progressRouter.post(
  "/complete",
  requirePermission("progress:write"),
  validate(completeLessonSchema),
  asyncHandler(controller.complete),
);

progressRouter.get("/:courseId", asyncHandler(controller.get));

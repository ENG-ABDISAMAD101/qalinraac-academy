import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./enrollments.controller.js";
import { checkoutSchema, enrollSchema } from "./enrollments.service.js";

export const enrollmentsRouter = Router();

enrollmentsRouter.use(authenticate);

enrollmentsRouter.post(
  "/",
  validate(enrollSchema),
  asyncHandler(controller.enroll),
);

enrollmentsRouter.post(
  "/checkout",
  validate(checkoutSchema),
  asyncHandler(controller.checkout),
);

enrollmentsRouter.get("/mine", asyncHandler(controller.mine));

enrollmentsRouter.get(
  "/roster/:courseId",
  requirePermission("enrollments:manage"),
  asyncHandler(controller.roster),
);

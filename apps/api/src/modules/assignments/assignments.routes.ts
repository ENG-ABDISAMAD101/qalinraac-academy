import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./assignments.controller.js";
import {
  createAssignmentSchema,
  gradeSchema,
  submitSchema,
  updateAssignmentSchema,
} from "./assignments.service.js";

export const assignmentsRouter = Router();

assignmentsRouter.use(authenticate);

assignmentsRouter.get("/", asyncHandler(controller.list));
assignmentsRouter.get("/:id", asyncHandler(controller.get));

assignmentsRouter.post(
  "/",
  requirePermission("assignments:write"),
  validate(createAssignmentSchema),
  asyncHandler(controller.create),
);

assignmentsRouter.patch(
  "/:id",
  requirePermission("assignments:write"),
  validate(updateAssignmentSchema),
  asyncHandler(controller.update),
);

assignmentsRouter.delete(
  "/:id",
  requirePermission("assignments:write"),
  asyncHandler(controller.remove),
);

assignmentsRouter.post(
  "/:id/submit",
  requirePermission("assignments:submit"),
  validate(submitSchema),
  asyncHandler(controller.submit),
);

assignmentsRouter.get(
  "/:id/submissions",
  requirePermission("assignments:grade"),
  asyncHandler(controller.submissions),
);

assignmentsRouter.post(
  "/:id/submissions/:userId/grade",
  requirePermission("assignments:grade"),
  validate(gradeSchema),
  asyncHandler(controller.grade),
);

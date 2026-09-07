import { Router } from "express";
import { paginationQuerySchema } from "@qalinraac/shared";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./courses.controller.js";
import {
  createCourseSchema,
  createLessonSchema,
  createModuleSchema,
  updateCourseSchema,
} from "./courses.service.js";

export const coursesRouter = Router();

const listQuery = paginationQuerySchema.extend({
  status: z.string().optional(),
});

coursesRouter.get(
  "/",
  authenticate,
  requirePermission("courses:read"),
  validate(listQuery, "query"),
  asyncHandler(controller.list),
);

coursesRouter.get(
  "/:id",
  authenticate,
  requirePermission("courses:read"),
  asyncHandler(controller.get),
);

coursesRouter.post(
  "/",
  authenticate,
  requirePermission("courses:write"),
  validate(createCourseSchema),
  asyncHandler(controller.create),
);

coursesRouter.patch(
  "/:id",
  authenticate,
  requirePermission("courses:write"),
  validate(updateCourseSchema),
  asyncHandler(controller.update),
);

coursesRouter.post(
  "/:id/publish",
  authenticate,
  requirePermission("courses:publish"),
  asyncHandler(controller.publish),
);

coursesRouter.delete(
  "/:id",
  authenticate,
  requirePermission("courses:write"),
  asyncHandler(controller.remove),
);

coursesRouter.post(
  "/:id/modules",
  authenticate,
  requirePermission("courses:write"),
  validate(createModuleSchema),
  asyncHandler(controller.addModule),
);

coursesRouter.post(
  "/:id/modules/:moduleId/lessons",
  authenticate,
  requirePermission("lessons:write"),
  validate(createLessonSchema),
  asyncHandler(controller.addLesson),
);

coursesRouter.patch(
  "/lessons/:lessonId",
  authenticate,
  requirePermission("lessons:write"),
  validate(createLessonSchema.partial()),
  asyncHandler(controller.updateLesson),
);

coursesRouter.delete(
  "/lessons/:lessonId",
  authenticate,
  requirePermission("lessons:write"),
  asyncHandler(controller.deleteLesson),
);

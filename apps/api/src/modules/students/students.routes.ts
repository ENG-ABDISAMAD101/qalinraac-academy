import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./students.controller.js";
import { updateProfileSchema } from "./students.service.js";

export const studentsRouter = Router();

studentsRouter.use(authenticate);

studentsRouter.get(
  "/me/dashboard",
  requirePermission("progress:write"),
  asyncHandler(controller.dashboard),
);

studentsRouter.patch(
  "/me/profile",
  requirePermission("progress:write"),
  validate(updateProfileSchema),
  asyncHandler(controller.updateProfile),
);

studentsRouter.get(
  "/me/courses",
  requirePermission("progress:write"),
  asyncHandler(controller.myCourses),
);

studentsRouter.get(
  "/me/learn/:courseId",
  requirePermission("lessons:read"),
  asyncHandler(controller.learnCourse),
);

studentsRouter.get(
  "/me/feedback",
  requirePermission("gradebook:read"),
  asyncHandler(controller.feedback),
);

studentsRouter.get(
  "/me/feedback/quizzes/:quizId",
  requirePermission("gradebook:read"),
  asyncHandler(controller.feedbackQuiz),
);

studentsRouter.get(
  "/me/feedback/assignments/:assignmentId",
  requirePermission("gradebook:read"),
  asyncHandler(controller.feedbackAssignment),
);

studentsRouter.post(
  "/me/feedback/assignments/:assignmentId/replies",
  requirePermission("assignments:submit"),
  asyncHandler(controller.replyAssignment),
);

studentsRouter.get(
  "/me/orders",
  requirePermission("progress:write"),
  asyncHandler(controller.myOrders),
);

studentsRouter.get(
  "/me/resources",
  requirePermission("lessons:read"),
  asyncHandler(controller.myResources),
);

studentsRouter.get(
  "/me/support",
  requirePermission("progress:write"),
  asyncHandler(controller.listSupport),
);

studentsRouter.post(
  "/me/support",
  requirePermission("progress:write"),
  asyncHandler(controller.createSupport),
);

studentsRouter.get(
  "/me/support/:id",
  requirePermission("progress:write"),
  asyncHandler(controller.getSupport),
);

import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./instructors.controller.js";
import {
  createAssignmentSchema,
  createCourseSchema,
  createQuizSchema,
  createResourceSchema,
  createWithdrawalSchema,
  lessonSchema,
  moduleSchema,
  reorderSchema,
  updateCourseSchema,
  updateLessonSchema,
  updateModuleSchema,
  updateProfileSchema,
} from "./instructors.service.js";

export const instructorsRouter = Router();

instructorsRouter.use(authenticate, requireRole("Instructor"));

instructorsRouter.get("/me/dashboard", asyncHandler(controller.dashboard));
instructorsRouter.post(
  "/me/onboarding/complete",
  asyncHandler(controller.completeOnboarding),
);
instructorsRouter.patch(
  "/me/profile",
  validate(updateProfileSchema),
  asyncHandler(controller.updateProfile),
);

instructorsRouter.get("/me/courses", asyncHandler(controller.listCourses));
instructorsRouter.post(
  "/me/courses",
  validate(createCourseSchema),
  asyncHandler(controller.createCourse),
);
instructorsRouter.get("/me/courses/:id", asyncHandler(controller.getCourse));
instructorsRouter.patch(
  "/me/courses/:id",
  validate(updateCourseSchema),
  asyncHandler(controller.updateCourse),
);
instructorsRouter.post(
  "/me/courses/:id/draft",
  asyncHandler(controller.saveDraft),
);
instructorsRouter.post(
  "/me/courses/:id/submit",
  asyncHandler(controller.submitForReview),
);
instructorsRouter.post(
  "/me/courses/:id/request-update",
  asyncHandler(controller.requestUpdate),
);
instructorsRouter.post(
  "/me/courses/:id/modules",
  validate(moduleSchema),
  asyncHandler(controller.addModule),
);
instructorsRouter.post(
  "/me/courses/:id/modules/:moduleId/lessons",
  validate(lessonSchema),
  asyncHandler(controller.addLesson),
);
instructorsRouter.patch(
  "/me/lessons/:lessonId",
  validate(updateLessonSchema),
  asyncHandler(controller.updateLesson),
);
instructorsRouter.delete(
  "/me/lessons/:lessonId",
  asyncHandler(controller.deleteLesson),
);
instructorsRouter.delete(
  "/me/modules/:moduleId",
  asyncHandler(controller.deleteModule),
);
instructorsRouter.patch(
  "/me/modules/:moduleId",
  validate(updateModuleSchema),
  asyncHandler(controller.updateModule),
);
instructorsRouter.post(
  "/me/courses/:id/reorder",
  validate(reorderSchema),
  asyncHandler(controller.reorderCurriculum),
);
instructorsRouter.post(
  "/me/lessons/:lessonId/duplicate",
  asyncHandler(controller.duplicateLesson),
);
instructorsRouter.get(
  "/me/courses/:id/checklist",
  asyncHandler(controller.submitChecklist),
);
instructorsRouter.post(
  "/me/courses/:id/discussions",
  asyncHandler(controller.replyCourseDiscussion),
);
instructorsRouter.get(
  "/me/courses/:id/lessons",
  asyncHandler(controller.listCourseLessons),
);
instructorsRouter.get(
  "/me/courses/:id/curriculum",
  asyncHandler(controller.listCourseCurriculum),
);

instructorsRouter.get("/me/students", asyncHandler(controller.listStudents));

instructorsRouter.get("/me/assignments", asyncHandler(controller.listAssignments));
instructorsRouter.post(
  "/me/assignments",
  validate(createAssignmentSchema),
  asyncHandler(controller.createAssignment),
);
instructorsRouter.get(
  "/me/assignments/:id",
  asyncHandler(controller.getAssignment),
);
instructorsRouter.post(
  "/me/assignments/:id/discussions",
  asyncHandler(controller.replyAssignment),
);
instructorsRouter.post(
  "/me/assignments/:id/submissions/:userId/grade",
  asyncHandler(controller.gradeSubmission),
);

instructorsRouter.get("/me/quizzes", asyncHandler(controller.listQuizzes));
instructorsRouter.post(
  "/me/quizzes",
  validate(createQuizSchema),
  asyncHandler(controller.createQuiz),
);
instructorsRouter.get(
  "/me/quizzes/:id",
  asyncHandler(controller.getQuizResults),
);

instructorsRouter.get("/me/resources", asyncHandler(controller.listResources));
instructorsRouter.post(
  "/me/resources",
  validate(createResourceSchema),
  asyncHandler(controller.createResource),
);
instructorsRouter.delete(
  "/me/resources/:id",
  asyncHandler(controller.deleteResource),
);

instructorsRouter.get("/me/earnings", asyncHandler(controller.listEarnings));
instructorsRouter.get("/me/withdrawals", asyncHandler(controller.listWithdrawals));
instructorsRouter.post(
  "/me/withdrawals",
  validate(createWithdrawalSchema),
  asyncHandler(controller.createWithdrawal),
);

instructorsRouter.get("/me/agreements", asyncHandler(controller.listAgreements));

instructorsRouter.get("/me/support", asyncHandler(controller.listSupport));
instructorsRouter.post("/me/support", asyncHandler(controller.createSupport));
instructorsRouter.get("/me/support/:id", asyncHandler(controller.getSupport));

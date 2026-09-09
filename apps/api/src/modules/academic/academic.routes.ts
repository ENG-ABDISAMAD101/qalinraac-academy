import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import {
  authenticate,
  requirePermission,
  requireRole,
} from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./academic.controller.js";
import {
  createActivationSchema,
  createAgreementSchema,
  rejectActivationSchema,
  rejectCertSchema,
  rejectCourseSchema,
  setCourseStatusSchema,
  replyDiscussionSchema,
  updateAgreementSchema,
  updateProfileSchema,
} from "./academic.service.js";

export const academicRouter = Router();

academicRouter.use(authenticate);
academicRouter.use(requireRole("Academic", "SuperAdmin"));

academicRouter.get("/dashboard", asyncHandler(controller.dashboard));

academicRouter.get("/students", asyncHandler(controller.listStudents));
academicRouter.get("/students/search", asyncHandler(controller.searchStudents));

academicRouter.get("/instructors", asyncHandler(controller.listInstructors));
academicRouter.get("/instructors/:id", asyncHandler(controller.getInstructor));

academicRouter.get("/courses", asyncHandler(controller.listCourses));
academicRouter.get(
  "/courses/published",
  asyncHandler(controller.listPublishedCourses),
);
academicRouter.get(
  "/courses/:id/review",
  requirePermission("courses:read"),
  asyncHandler(controller.getCourseReview),
);
academicRouter.post(
  "/courses/:id/approve",
  requirePermission("courses:publish"),
  asyncHandler(controller.approveCourse),
);
academicRouter.post(
  "/courses/:id/request-changes",
  requirePermission("courses:publish"),
  asyncHandler(controller.requestChanges),
);
academicRouter.post(
  "/courses/:id/reject",
  requirePermission("courses:publish"),
  validate(rejectCourseSchema),
  asyncHandler(controller.rejectCourse),
);
academicRouter.post(
  "/courses/:id/set-status",
  requirePermission("courses:publish"),
  validate(setCourseStatusSchema),
  asyncHandler(controller.setCourseStatus),
);
academicRouter.post(
  "/courses/:id/discussions",
  requirePermission("courses:read"),
  validate(replyDiscussionSchema),
  asyncHandler(controller.replyDiscussion),
);

academicRouter.get("/activations", asyncHandler(controller.listActivations));
academicRouter.get("/activations/:id", asyncHandler(controller.getActivation));
academicRouter.post(
  "/activations",
  requirePermission("enrollments:manage"),
  validate(createActivationSchema),
  asyncHandler(controller.createActivation),
);
academicRouter.post(
  "/activations/:id/approve",
  requireRole("SuperAdmin"),
  asyncHandler(controller.approveActivation),
);
academicRouter.post(
  "/activations/:id/reject",
  requireRole("SuperAdmin"),
  validate(rejectActivationSchema),
  asyncHandler(controller.rejectActivation),
);

academicRouter.get("/certificates", asyncHandler(controller.listCertificates));
academicRouter.get("/certificates/:id", asyncHandler(controller.getCertificate));
academicRouter.post(
  "/certificates/:id/approve",
  requirePermission("certificates:issue"),
  asyncHandler(controller.approveCertificate),
);
academicRouter.post(
  "/certificates/:id/ready",
  requirePermission("certificates:issue"),
  asyncHandler(controller.readyCertificate),
);
academicRouter.post(
  "/certificates/:id/reject",
  requirePermission("certificates:issue"),
  validate(rejectCertSchema),
  asyncHandler(controller.rejectCertificate),
);

academicRouter.get("/agreements", asyncHandler(controller.listAgreements));
academicRouter.post(
  "/agreements",
  requirePermission("files:upload"),
  validate(createAgreementSchema),
  asyncHandler(controller.createAgreement),
);
academicRouter.patch(
  "/agreements/:id",
  requirePermission("files:upload"),
  validate(updateAgreementSchema),
  asyncHandler(controller.updateAgreement),
);

academicRouter.get(
  "/reports",
  requirePermission("reports:read"),
  asyncHandler(controller.reports),
);

academicRouter.patch(
  "/profile",
  validate(updateProfileSchema),
  asyncHandler(controller.updateProfile),
);

import { Router } from "express";
import { paginationQuerySchema } from "@qalinraac/shared";
import { asyncHandler } from "../../lib/async-handler.js";
import {
  authenticate,
  requirePermission,
  requireRole,
} from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./admin.controller.js";
import {
  replyTicketSchema,
  updateAdminProfileSchema,
  updateTicketSchema,
  uploadCertificateSchema,
} from "./admin-portal.service.js";
import { updateSettingsSchema } from "./admin.service.js";

export const adminRouter = Router();

adminRouter.use(authenticate);

adminRouter.get(
  "/settings",
  requirePermission("admin:settings"),
  asyncHandler(controller.getSettings),
);

adminRouter.patch(
  "/settings",
  requirePermission("admin:settings"),
  validate(updateSettingsSchema),
  asyncHandler(controller.updateSettings),
);

adminRouter.get(
  "/audit-logs",
  requirePermission("audit:read"),
  validate(paginationQuerySchema, "query"),
  asyncHandler(controller.listAudit),
);

const portal = Router();
portal.use(requireRole("Admin", "SuperAdmin"));

portal.get("/dashboard", asyncHandler(controller.getDashboard));
portal.get("/students", asyncHandler(controller.listStudents));
portal.get("/students/:id", asyncHandler(controller.getStudent));
portal.get("/instructors", asyncHandler(controller.listInstructors));
portal.get("/instructors/:id", asyncHandler(controller.getInstructor));
portal.get("/courses", asyncHandler(controller.listCourses));
portal.get("/certificates", asyncHandler(controller.listCertificates));
portal.get("/certificates/:id", asyncHandler(controller.getCertificate));
portal.post(
  "/certificates/:id/upload",
  requirePermission("certificates:issue"),
  validate(uploadCertificateSchema),
  asyncHandler(controller.uploadCertificate),
);
portal.get("/support", asyncHandler(controller.listTickets));
portal.get("/support/:id", asyncHandler(controller.getTicket));
portal.post(
  "/support/:id/reply",
  validate(replyTicketSchema),
  asyncHandler(controller.replyTicket),
);
portal.patch(
  "/support/:id",
  validate(updateTicketSchema),
  asyncHandler(controller.updateTicket),
);
portal.get(
  "/reports",
  requirePermission("reports:read"),
  asyncHandler(controller.getReports),
);
portal.patch(
  "/profile",
  validate(updateAdminProfileSchema),
  asyncHandler(controller.updateProfile),
);
portal.get("/notifications", asyncHandler(controller.listNotifications));

adminRouter.use(portal);

import { Router } from "express";
import { paginationQuerySchema } from "@qalinraac/shared";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./admin.controller.js";
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

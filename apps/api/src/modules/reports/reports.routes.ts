import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import * as controller from "./reports.controller.js";

export const reportsRouter = Router();

reportsRouter.get(
  "/summary",
  authenticate,
  requirePermission("reports:read"),
  asyncHandler(controller.summary),
);

reportsRouter.get(
  "/export/excel",
  authenticate,
  requirePermission("reports:read"),
  asyncHandler(controller.exportExcel),
);

reportsRouter.get(
  "/export/pdf",
  authenticate,
  requirePermission("reports:read"),
  asyncHandler(controller.exportPdf),
);

import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./finance.controller.js";
import { createInvoiceSchema, createPaymentSchema } from "./finance.service.js";

export const financeRouter = Router();

financeRouter.post("/webhooks/waafi", asyncHandler(controller.waafiWebhook));

financeRouter.use(authenticate);

financeRouter.get(
  "/invoices",
  requirePermission("finance:read"),
  asyncHandler(controller.listInvoices),
);

financeRouter.get(
  "/invoices/:id",
  requirePermission("finance:read"),
  asyncHandler(controller.getInvoice),
);

financeRouter.post(
  "/invoices",
  requirePermission("finance:write"),
  validate(createInvoiceSchema),
  asyncHandler(controller.createInvoice),
);

financeRouter.post(
  "/payments",
  requirePermission("payments:process"),
  validate(createPaymentSchema),
  asyncHandler(controller.createPayment),
);

financeRouter.post(
  "/invoices/:id/mark-paid",
  requirePermission("finance:write"),
  asyncHandler(controller.markPaid),
);

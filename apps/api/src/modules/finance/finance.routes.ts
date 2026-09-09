import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import {
  authenticate,
  requirePermission,
  requireRole,
} from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./finance.controller.js";
import {
  createExpenseSchema,
  createManualIncomeSchema,
  createShareholderSchema,
  rejectWithdrawalSchema,
  updateFinanceProfileSchema,
} from "./finance-portal.service.js";
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

const portal = Router();
portal.use(requireRole("Finance", "SuperAdmin"));

portal.get(
  "/dashboard",
  requirePermission("finance:read"),
  asyncHandler(controller.getDashboard),
);

portal.get(
  "/revenue",
  requirePermission("finance:read"),
  asyncHandler(controller.listRevenue),
);

portal.post(
  "/revenue/manual",
  requirePermission("finance:write"),
  validate(createManualIncomeSchema),
  asyncHandler(controller.createManualIncome),
);

portal.get(
  "/expenses",
  requirePermission("finance:read"),
  asyncHandler(controller.listExpenses),
);

portal.post(
  "/expenses",
  requirePermission("finance:write"),
  validate(createExpenseSchema),
  asyncHandler(controller.createExpense),
);

portal.get(
  "/instructor-payments",
  requirePermission("finance:read"),
  asyncHandler(controller.listInstructorPayments),
);

portal.get(
  "/withdrawals",
  requirePermission("finance:read"),
  asyncHandler(controller.listWithdrawals),
);

portal.get(
  "/withdrawals/:id",
  requirePermission("finance:read"),
  asyncHandler(controller.getWithdrawal),
);

portal.post(
  "/withdrawals/:id/complete",
  requirePermission("finance:write"),
  asyncHandler(controller.completeWithdrawal),
);

portal.post(
  "/withdrawals/:id/reject",
  requirePermission("finance:write"),
  validate(rejectWithdrawalSchema),
  asyncHandler(controller.rejectWithdrawal),
);

portal.get(
  "/shareholders",
  requirePermission("finance:read"),
  asyncHandler(controller.listShareholders),
);

portal.post(
  "/shareholders",
  requireRole("SuperAdmin"),
  requirePermission("finance:write"),
  validate(createShareholderSchema),
  asyncHandler(controller.createShareholder),
);

portal.get(
  "/reports",
  requirePermission("reports:read"),
  asyncHandler(controller.getReports),
);

portal.patch(
  "/profile",
  validate(updateFinanceProfileSchema),
  asyncHandler(controller.updateProfile),
);

financeRouter.use(portal);

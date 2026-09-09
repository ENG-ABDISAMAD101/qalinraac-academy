import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./finance.service.js";
import * as portal from "./finance-portal.service.js";

export async function createInvoice(req: Request, res: Response) {
  const data = await service.createInvoice(req.body, req.user!.id);
  return sendSuccess(res, data, 201);
}

export async function listInvoices(req: Request, res: Response) {
  const data = await service.listInvoices({
    userId: req.query.userId as string | undefined,
    status: req.query.status as string | undefined,
  });
  return sendSuccess(res, data);
}

export async function getInvoice(req: Request, res: Response) {
  const data = await service.getInvoice(req.params.id);
  return sendSuccess(res, data);
}

export async function createPayment(req: Request, res: Response) {
  const data = await service.createPayment(req.body, req.user!.id);
  return sendSuccess(res, data, 201);
}

export async function markPaid(req: Request, res: Response) {
  const data = await service.markInvoicePaid(req.params.id, req.user!.id);
  return sendSuccess(res, data);
}

export async function stripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_SIGNATURE",
        message: "Missing Stripe signature",
      },
    });
  }
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body));
  const data = await service.handleStripeWebhook(rawBody, signature);
  return sendSuccess(res, data);
}

export async function waafiWebhook(req: Request, res: Response) {
  const data = await service.handleWaafiWebhook(req.body);
  return sendSuccess(res, data);
}

function actorId(req: Request) {
  return req.user!.id;
}

export async function getDashboard(_req: Request, res: Response) {
  return sendSuccess(res, await portal.getFinanceDashboard());
}

export async function listRevenue(req: Request, res: Response) {
  return sendSuccess(
    res,
    await portal.listRevenue({
      period: req.query.period as string | undefined,
      method: req.query.method as string | undefined,
      q: req.query.q as string | undefined,
      source: req.query.source as string | undefined,
    }),
  );
}

export async function createManualIncome(req: Request, res: Response) {
  return sendSuccess(
    res,
    await portal.createManualIncome(actorId(req), req.body),
    201,
  );
}

export async function listExpenses(req: Request, res: Response) {
  return sendSuccess(
    res,
    await portal.listExpenses({
      period: req.query.period as string | undefined,
      q: req.query.q as string | undefined,
    }),
  );
}

export async function createExpense(req: Request, res: Response) {
  return sendSuccess(
    res,
    await portal.createExpense(actorId(req), req.body),
    201,
  );
}

export async function listInstructorPayments(req: Request, res: Response) {
  return sendSuccess(
    res,
    await portal.listInstructorPayments({
      q: req.query.q as string | undefined,
    }),
  );
}

export async function listWithdrawals(req: Request, res: Response) {
  return sendSuccess(
    res,
    await portal.listWithdrawals({
      status: req.query.status as string | undefined,
      q: req.query.q as string | undefined,
    }),
  );
}

export async function getWithdrawal(req: Request, res: Response) {
  return sendSuccess(res, await portal.getWithdrawal(req.params.id));
}

export async function completeWithdrawal(req: Request, res: Response) {
  return sendSuccess(
    res,
    await portal.completeWithdrawal(req.params.id, actorId(req)),
  );
}

export async function rejectWithdrawal(req: Request, res: Response) {
  return sendSuccess(
    res,
    await portal.rejectWithdrawal(req.params.id, actorId(req), req.body),
  );
}

export async function listShareholders(req: Request, res: Response) {
  return sendSuccess(
    res,
    await portal.listShareholders({
      q: req.query.q as string | undefined,
    }),
  );
}

export async function createShareholder(req: Request, res: Response) {
  return sendSuccess(
    res,
    await portal.createShareholder(actorId(req), req.body),
    201,
  );
}

export async function getReports(_req: Request, res: Response) {
  return sendSuccess(res, await portal.getFinanceReports());
}

export async function updateProfile(req: Request, res: Response) {
  return sendSuccess(
    res,
    await portal.updateFinanceProfile(actorId(req), req.body),
  );
}

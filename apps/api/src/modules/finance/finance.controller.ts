import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./finance.service.js";

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
    return res.status(400).json({ success: false, error: { code: "MISSING_SIGNATURE", message: "Missing Stripe signature" } });
  }
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  const data = await service.handleStripeWebhook(rawBody, signature);
  return sendSuccess(res, data);
}

export async function waafiWebhook(req: Request, res: Response) {
  const data = await service.handleWaafiWebhook(req.body);
  return sendSuccess(res, data);
}

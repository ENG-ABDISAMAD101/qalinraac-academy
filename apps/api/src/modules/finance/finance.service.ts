import { paymentProviderSchema } from "@qalinraac/shared";
import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { writeAuditLog } from "../../lib/audit.js";
import { sendEmail } from "../../lib/email.js";
import { enqueuePaymentWebhook } from "../../lib/queue.js";
import { logger } from "../../lib/logger.js";
import { Enrollment } from "../../models/Enrollment.js";
import { Invoice } from "../../models/Invoice.js";
import { Payment } from "../../models/Payment.js";
import { User } from "../../models/User.js";
import { createNotification } from "../notifications/notifications.service.js";
import {
  constructStripeEvent,
  processStripePayment,
  processWaafiPayment,
} from "./payment-adapters.js";

export const createInvoiceSchema = z.object({
  userId: z.string().min(1),
  courseId: z.string().optional(),
  enrollmentId: z.string().optional(),
  amountCents: z.number().int().min(0),
  currency: z.string().length(3).optional(),
  description: z.string().optional(),
});

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  provider: paymentProviderSchema,
  accountNo: z.string().optional(),
});

export async function createInvoice(
  input: z.infer<typeof createInvoiceSchema>,
  actorId: string,
) {
  const invoice = await Invoice.create({
    ...input,
    currency: input.currency ?? "USD",
    status: "open",
  });
  await writeAuditLog({
    actorId,
    action: "finance.invoice.create",
    resource: "Invoice",
    resourceId: String(invoice._id),
  });
  return invoice;
}

export async function listInvoices(filters?: { userId?: string; status?: string }) {
  const filter: Record<string, unknown> = {};
  if (filters?.userId) filter.userId = filters.userId;
  if (filters?.status) filter.status = filters.status;
  return Invoice.find(filter).sort({ createdAt: -1 });
}

export async function getInvoice(id: string) {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new AppError(404, "NOT_FOUND", "Invoice not found");
  return invoice;
}

export async function createPayment(
  input: z.infer<typeof createPaymentSchema>,
  actorId: string,
) {
  const invoice = await Invoice.findById(input.invoiceId);
  if (!invoice) throw new AppError(404, "NOT_FOUND", "Invoice not found");
  if (invoice.status === "paid") {
    throw new AppError(400, "ALREADY_PAID", "Invoice already paid");
  }

  let result;
  if (input.provider === "stripe") {
    result = await processStripePayment({
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      invoiceId: String(invoice._id),
    });
  } else if (input.provider === "waafi") {
    result = await processWaafiPayment({
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      invoiceId: String(invoice._id),
      accountNo: input.accountNo,
    });
  } else {
    result = {
      simulated: true,
      providerRef: `manual_${Date.now()}`,
      status: "succeeded" as const,
      raw: { message: "Manual payment recorded" },
    };
  }

  const payment = await Payment.create({
    invoiceId: invoice._id,
    userId: invoice.userId,
    provider: input.provider,
    amountCents: invoice.amountCents,
    currency: invoice.currency,
    status: result.status,
    providerRef: result.providerRef,
    rawResponse: result.raw as Record<string, unknown>,
  });

  if (result.status === "succeeded") {
    await markInvoicePaid(String(invoice._id), actorId);
  }

  return {
    payment,
    clientSecret: "clientSecret" in result ? result.clientSecret : undefined,
    simulated: result.simulated,
  };
}

export async function markInvoicePaid(invoiceId: string, actorId: string) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new AppError(404, "NOT_FOUND", "Invoice not found");
  if (invoice.status === "paid") return invoice;

  invoice.status = "paid";
  invoice.paidAt = new Date();
  await invoice.save();

  if (invoice.enrollmentId) {
    await Enrollment.findByIdAndUpdate(invoice.enrollmentId, {
      status: "active",
      unlockedAt: new Date(),
    });
  }

  await writeAuditLog({
    actorId,
    action: "finance.invoice.paid",
    resource: "Invoice",
    resourceId: invoiceId,
  });

  await createNotification({
    userId: String(invoice.userId),
    title: "Payment received",
    body: "Your invoice is paid and enrollment is unlocked.",
    type: "finance",
    meta: { invoiceId },
  });

  const user = await User.findById(invoice.userId);
  if (user?.email) {
    await sendEmail({
      to: user.email,
      subject: "Payment received — Qalinraac Academy",
      html: `<p>Hi ${user.fullName},</p><p>Your invoice <strong>${invoiceId}</strong> is paid. Enrollment is unlocked.</p>`,
    });
  }

  return invoice;
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  const event = constructStripeEvent(rawBody, signature);
  const queued = await enqueuePaymentWebhook({
    provider: "stripe",
    payload: event,
    signature,
  });

  if (!queued.queued) {
    await processStripeWebhookEvent(event);
  }

  return { received: true, queued: queued.queued };
}

export async function processStripeWebhookEvent(event: unknown) {
  const ev = event as {
    type?: string;
    data?: { object?: Record<string, unknown> };
  };
  if (
    ev.type === "payment_intent.succeeded" ||
    ev.type === "checkout.session.completed"
  ) {
    const obj = ev.data?.object ?? {};
    const metadata = (obj.metadata ?? {}) as {
      invoiceId?: string;
      invoice_id?: string;
    };
    const invoiceId = metadata.invoiceId ?? metadata.invoice_id;
    const providerRef = String(obj.id ?? "");

    if (invoiceId) {
      await Payment.findOneAndUpdate(
        { providerRef },
        { status: "succeeded", rawResponse: obj },
        { upsert: false },
      );
      await markInvoicePaid(invoiceId, "system:stripe-webhook");
      logger.info("Stripe webhook marked invoice paid", { invoiceId });
    }
  }
}

export async function handleWaafiWebhook(payload: unknown) {
  const queued = await enqueuePaymentWebhook({
    provider: "waafi",
    payload,
  });
  if (!queued.queued) {
    await processWaafiWebhookPayload(payload);
  }
  return { received: true, queued: queued.queued };
}

export async function processWaafiWebhookPayload(payload: unknown) {
  const data = payload as {
    invoiceId?: string;
    referenceId?: string;
    transactionId?: string;
    responseCode?: string;
  };
  const invoiceId = data.invoiceId ?? data.referenceId;
  if (!invoiceId) return;
  if (data.responseCode && data.responseCode !== "2001" && data.responseCode !== "0") {
    return;
  }
  if (data.transactionId) {
    await Payment.findOneAndUpdate(
      { providerRef: data.transactionId },
      { status: "succeeded", rawResponse: payload },
    );
  }
  await markInvoicePaid(invoiceId, "system:waafi-webhook");
}

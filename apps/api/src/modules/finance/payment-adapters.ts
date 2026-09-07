import Stripe from "stripe";
import { env, hasStripeConfig, hasWaafiConfig } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

export type PaymentAdapterResult = {
  simulated: boolean;
  providerRef: string;
  status: "succeeded" | "pending" | "failed";
  raw: unknown;
  clientSecret?: string;
};

export function getStripe(): Stripe | null {
  if (!hasStripeConfig()) return null;
  return new Stripe(env.STRIPE_SECRET_KEY!);
}

export async function processStripePayment(input: {
  amountCents: number;
  currency: string;
  invoiceId: string;
  metadata?: Record<string, string>;
}): Promise<PaymentAdapterResult> {
  const stripe = getStripe();
  if (!stripe) {
    return {
      simulated: true,
      providerRef: `stripe_sim_${Date.now()}`,
      status: "succeeded",
      raw: { message: "Stripe key missing — simulated success" },
    };
  }

  const intent = await stripe.paymentIntents.create({
    amount: input.amountCents,
    currency: input.currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata: {
      invoiceId: input.invoiceId,
      ...input.metadata,
    },
  });

  // In server-to-server LMS flow without browser Elements, confirm with test PM when possible
  if (env.NODE_ENV !== "production" && intent.status === "requires_payment_method") {
    try {
      const confirmed = await stripe.paymentIntents.confirm(intent.id, {
        payment_method: "pm_card_visa",
        return_url: env.CORS_ORIGIN,
      });
      return {
        simulated: false,
        providerRef: confirmed.id,
        status: confirmed.status === "succeeded" ? "succeeded" : "pending",
        raw: confirmed,
        clientSecret: confirmed.client_secret ?? undefined,
      };
    } catch (err) {
      logger.warn("Stripe confirm failed; returning pending intent", { err });
    }
  }

  return {
    simulated: false,
    providerRef: intent.id,
    status: intent.status === "succeeded" ? "succeeded" : "pending",
    raw: intent,
    clientSecret: intent.client_secret ?? undefined,
  };
}

export async function processWaafiPayment(input: {
  amountCents: number;
  currency: string;
  invoiceId: string;
  accountNo?: string;
}): Promise<PaymentAdapterResult> {
  if (!hasWaafiConfig()) {
    return {
      simulated: true,
      providerRef: `waafi_sim_${Date.now()}`,
      status: "succeeded",
      raw: { message: "Waafi keys missing — simulated success" },
    };
  }

  const amount = (input.amountCents / 100).toFixed(2);
  const body = {
    schemaVersion: "1.0",
    requestId: `inv_${input.invoiceId}_${Date.now()}`,
    timestamp: new Date().toISOString(),
    channelName: "WEB",
    serviceName: "API_PURCHASE",
    serviceParams: {
      merchantUid: env.WAAFI_MERCHANT_UID,
      apiUserId: env.WAAFI_API_USER_ID,
      apiKey: env.WAAFI_API_KEY,
      paymentMethod: "MWALLET_ACCOUNT",
      payerInfo: {
        accountNo: input.accountNo ?? "252610000000",
      },
      transactionInfo: {
        referenceId: input.invoiceId,
        invoiceId: input.invoiceId,
        amount,
        currency: input.currency,
        description: `Invoice ${input.invoiceId}`,
      },
    },
  };

  const res = await fetch(env.WAAFI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const raw = (await res.json().catch(() => ({ status: res.status }))) as Record<
    string,
    unknown
  >;

  const responseCode = String(
    (raw.responseCode as string | undefined) ??
      (raw.errorCode as string | undefined) ??
      "",
  );
  const succeeded =
    res.ok && (responseCode === "2001" || responseCode === "0" || raw.success === true);

  return {
    simulated: false,
    providerRef: String(raw.transactionId ?? raw.requestId ?? body.requestId),
    status: succeeded ? "succeeded" : "pending",
    raw,
  };
}

export function constructStripeEvent(rawBody: Buffer, signature: string) {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook secret not configured");
  }
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}

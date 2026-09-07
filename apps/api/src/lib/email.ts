import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import nodemailer from "nodemailer";
import { env, hasSesConfig } from "../config/env.js";
import { logger } from "./logger.js";
import { enqueueEmail } from "./queue.js";

let sesClient: SESClient | null = null;

function getSesClient() {
  if (!sesClient && hasSesConfig()) {
    sesClient = new SESClient({
      region: env.SES_REGION,
      credentials: {
        accessKeyId: env.SES_ACCESS_KEY_ID!,
        secretAccessKey: env.SES_SECRET_ACCESS_KEY!,
      },
    });
  }
  return sesClient;
}

export async function deliverEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (!hasSesConfig()) {
    logger.info("Email skipped (SES not configured)", {
      to: input.to,
      subject: input.subject,
    });
    return { sent: false, mode: "log" as const };
  }

  const client = getSesClient();
  if (!client) {
    return { sent: false, mode: "log" as const };
  }

  // Prefer Nodemailer SES transport when available; fall back to SDK command
  try {
    const transporter = nodemailer.createTransport({
      SES: { ses: client, aws: { SendEmailCommand } },
    } as never);

    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? input.html.replace(/<[^>]+>/g, " "),
    });
    return { sent: true, mode: "ses" as const };
  } catch (err) {
    logger.warn("Nodemailer SES failed, trying direct SES command", { err });
    await client.send(
      new SendEmailCommand({
        Source: env.EMAIL_FROM,
        Destination: { ToAddresses: [input.to] },
        Message: {
          Subject: { Data: input.subject },
          Body: {
            Html: { Data: input.html },
            Text: { Data: input.text ?? input.html.replace(/<[^>]+>/g, " ") },
          },
        },
      }),
    );
    return { sent: true, mode: "ses-sdk" as const };
  }
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const queued = await enqueueEmail(input);
  if (queued.queued) return { ...queued, deferred: true as const };
  return deliverEmail(input);
}

import { Queue, Worker, type ConnectionOptions, type JobsOptions } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

let connection: Redis | null = null;
let paymentQueue: Queue | null = null;
let emailQueue: Queue | null = null;
let workersStarted = false;

export function getRedisConnection(): Redis | null {
  if (connection) return connection;
  try {
    connection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: () => null,
    });
    connection.on("error", (err: Error) => {
      logger.warn("Redis connection error", { message: err.message });
    });
    return connection;
  } catch (err) {
    logger.warn("Redis unavailable", { err });
    return null;
  }
}

export async function ensureQueues() {
  const conn = getRedisConnection();
  if (!conn) return null;
  try {
    if (conn.status !== "ready") {
      await conn.connect();
    }
    const connectionOpts = conn as unknown as ConnectionOptions;
    paymentQueue ??= new Queue("payments", { connection: connectionOpts });
    emailQueue ??= new Queue("emails", { connection: connectionOpts });
    return { paymentQueue, emailQueue, connection: conn };
  } catch (err) {
    logger.warn("Could not connect Redis queues — falling back to inline processing", {
      err,
    });
    return null;
  }
}

export async function enqueuePaymentWebhook(
  data: { provider: "stripe" | "waafi"; payload: unknown; signature?: string },
  opts?: JobsOptions,
) {
  const queues = await ensureQueues();
  if (!queues?.paymentQueue) return { queued: false as const };
  await queues.paymentQueue.add("webhook", data, {
    removeOnComplete: 100,
    removeOnFail: 50,
    ...opts,
  });
  return { queued: true as const };
}

export async function enqueueEmail(
  data: { to: string; subject: string; html: string; text?: string },
  opts?: JobsOptions,
) {
  const queues = await ensureQueues();
  if (!queues?.emailQueue) return { queued: false as const };
  await queues.emailQueue.add("send", data, {
    removeOnComplete: 100,
    removeOnFail: 50,
    ...opts,
  });
  return { queued: true as const };
}

export async function startWorkers(
  handlers: {
    onPaymentWebhook: (data: {
      provider: "stripe" | "waafi";
      payload: unknown;
      signature?: string;
    }) => Promise<void>;
    onEmail: (data: {
      to: string;
      subject: string;
      html: string;
      text?: string;
    }) => Promise<void>;
  },
) {
  if (workersStarted || env.NODE_ENV === "test") return;
  const queues = await ensureQueues();
  if (!queues) return;

  workersStarted = true;
  const connectionOpts = queues.connection as unknown as ConnectionOptions;

  new Worker(
    "payments",
    async (job) => {
      await handlers.onPaymentWebhook(job.data);
    },
    { connection: connectionOpts },
  );

  new Worker(
    "emails",
    async (job) => {
      await handlers.onEmail(job.data);
    },
    { connection: connectionOpts },
  );

  logger.info("BullMQ workers started");
}

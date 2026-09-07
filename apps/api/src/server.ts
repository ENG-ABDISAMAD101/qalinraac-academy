import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./db/mongoose.js";
import { deliverEmail } from "./lib/email.js";
import { logger } from "./lib/logger.js";
import { startWorkers } from "./lib/queue.js";
import {
  processStripeWebhookEvent,
  processWaafiWebhookPayload,
} from "./modules/finance/finance.service.js";
import { seedDatabase } from "./seeds/seed.js";

async function main() {
  await connectMongo();

  if (env.SEED_ON_BOOT) {
    await seedDatabase();
    logger.info("Database seed complete");
  }

  await startWorkers({
    onPaymentWebhook: async (data) => {
      if (data.provider === "stripe") {
        await processStripeWebhookEvent(data.payload);
      } else {
        await processWaafiWebhookPayload(data.payload);
      }
    },
    onEmail: async (data) => {
      await deliverEmail(data);
    },
  });

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`Swagger UI at http://localhost:${env.PORT}${env.API_PREFIX}/docs`);
  });
}

main().catch((err) => {
  logger.error("Failed to start server", { err });
  process.exit(1);
});

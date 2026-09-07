import { connectMongo, disconnectMongo } from "../db/mongoose.js";
import { logger } from "../lib/logger.js";
import { seedDatabase } from "./seed.js";

async function run() {
  await connectMongo();
  await seedDatabase();
  await disconnectMongo();
  logger.info("Seed finished");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

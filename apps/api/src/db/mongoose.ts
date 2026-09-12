import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { migrateCourseStatuses } from "./migrate-course-statuses.js";

export async function connectMongo(uri = env.MONGODB_URI): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  logger.info("MongoDB connected");
  try {
    await migrateCourseStatuses();
  } catch (err) {
    logger.warn(`Course status migration skipped/failed: ${String(err)}`);
  }
  return mongoose;
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

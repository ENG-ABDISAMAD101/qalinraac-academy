import { Notification } from "../../models/Notification.js";
import { AppError } from "../../lib/app-error.js";

export async function createNotification(input: {
  userId: string;
  title: string;
  body: string;
  type?: string;
  meta?: Record<string, unknown>;
}) {
  return Notification.create({
    userId: input.userId,
    title: input.title,
    body: input.body,
    type: input.type ?? "info",
    meta: input.meta,
  });
}

export async function listMine(userId: string) {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(100);
}

export async function markRead(id: string, userId: string) {
  const n = await Notification.findOne({ _id: id, userId });
  if (!n) throw new AppError(404, "NOT_FOUND", "Notification not found");
  n.readAt = new Date();
  await n.save();
  return n;
}

export async function markAllRead(userId: string) {
  await Notification.updateMany(
    { userId, readAt: { $exists: false } },
    { $set: { readAt: new Date() } },
  );
  return { updated: true };
}

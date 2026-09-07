import { AuditLog } from "../models/AuditLog.js";
import type { Types } from "mongoose";

export async function writeAuditLog(input: {
  actorId?: Types.ObjectId | string;
  action: string;
  resource: string;
  resourceId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  await AuditLog.create({
    actorId: input.actorId,
    action: input.action,
    resource: input.resource,
    resourceId: input.resourceId,
    meta: input.meta,
    ip: input.ip,
  });
}

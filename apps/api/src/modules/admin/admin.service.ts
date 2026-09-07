import { paginationQuerySchema } from "@qalinraac/shared";
import { z } from "zod";
import { AcademySettings } from "../../models/AcademySettings.js";
import { AuditLog } from "../../models/AuditLog.js";
import { writeAuditLog } from "../../lib/audit.js";

export const updateSettingsSchema = z.object({
  academyName: z.string().min(2).max(200).optional(),
  supportEmail: z.string().email().optional(),
  allowSelfRegistration: z.boolean().optional(),
  defaultCurrency: z.string().length(3).optional(),
  certificateRequireCompletion: z.boolean().optional(),
  branding: z
    .object({
      primaryColor: z.string().optional(),
      logoUrl: z.string().url().optional(),
    })
    .optional(),
});

export async function getSettings() {
  let settings = await AcademySettings.findOne({ key: "default" });
  if (!settings) {
    settings = await AcademySettings.create({ key: "default" });
  }
  return settings;
}

export async function updateSettings(
  input: z.infer<typeof updateSettingsSchema>,
  actorId: string,
) {
  const settings = await AcademySettings.findOneAndUpdate(
    { key: "default" },
    { $set: input },
    { new: true, upsert: true },
  );
  await writeAuditLog({
    actorId,
    action: "admin.settings.update",
    resource: "AcademySettings",
    resourceId: "default",
    meta: input,
  });
  return settings;
}

export async function listAuditLogs(query: z.infer<typeof paginationQuerySchema>) {
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    AuditLog.find()
      .populate("actorId", "email fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    AuditLog.countDocuments(),
  ]);
  return { items, total, page: query.page, limit: query.limit };
}

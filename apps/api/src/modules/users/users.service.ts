import { AcademyRole, paginationQuerySchema } from "@qalinraac/shared";
import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { writeAuditLog } from "../../lib/audit.js";
import { ROLE_PERMISSIONS } from "@qalinraac/shared";
import { User } from "../../models/User.js";
import { toPublicUser } from "../auth/auth.service.js";

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  role: AcademyRole.optional(),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().url().optional(),
  /** Super Admin only — how many courses an instructor may create. */
  courseLimit: z.number().int().min(0).max(100).optional(),
});

export async function listUsers(query: z.infer<typeof paginationQuerySchema>) {
  const page = query.page;
  const limit = query.limit;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);
  return {
    items: items.map(toPublicUser),
    total,
    page,
    limit,
  };
}

export async function getUser(id: string) {
  const user = await User.findById(id);
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  return toPublicUser(user);
}

export async function updateUser(
  id: string,
  input: z.infer<typeof updateUserSchema>,
  actorId: string,
) {
  const user = await User.findById(id);
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");

  if (input.fullName !== undefined) user.fullName = input.fullName;
  if (input.isActive !== undefined) user.isActive = input.isActive;
  if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl;
  if (input.courseLimit !== undefined) user.courseLimit = input.courseLimit;
  if (input.role !== undefined) {
    user.role = input.role;
    user.permissions = [...ROLE_PERMISSIONS[input.role]];
  }
  await user.save();

  await writeAuditLog({
    actorId,
    action: "users.update",
    resource: "User",
    resourceId: id,
    meta: input,
  });

  return toPublicUser(user);
}

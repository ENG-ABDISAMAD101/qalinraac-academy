import { z } from "zod";

/** Single-tenant academy roles */
export const AcademyRole = z.enum([
  "SuperAdmin",
  "Admin",
  "Instructor",
  "Student",
  "Academic",
  "Finance",
  "Researcher",
]);
export type AcademyRole = z.infer<typeof AcademyRole>;

export const ACADEMY_ROLES = AcademyRole.options;

export const PERMISSIONS = [
  "users:read",
  "users:write",
  "roles:manage",
  "courses:read",
  "courses:write",
  "courses:publish",
  "enrollments:manage",
  "lessons:read",
  "lessons:write",
  "progress:write",
  "files:upload",
  "quizzes:write",
  "quizzes:attempt",
  "assignments:write",
  "assignments:submit",
  "assignments:grade",
  "gradebook:read",
  "certificates:request",
  "certificates:issue",
  "certificates:read",
  "research:read",
  "research:write",
  "research:review",
  "finance:read",
  "finance:write",
  "payments:process",
  "notifications:read",
  "notifications:send",
  "reports:read",
  "admin:settings",
  "audit:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PermissionSchema = z.enum(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<AcademyRole, Permission[]> = {
  SuperAdmin: [...PERMISSIONS],
  Admin: [
    "users:read",
    "users:write",
    "courses:read",
    "courses:write",
    "courses:publish",
    "enrollments:manage",
    "lessons:read",
    "lessons:write",
    "files:upload",
    "quizzes:write",
    "assignments:write",
    "assignments:grade",
    "gradebook:read",
    "certificates:issue",
    "certificates:read",
    "research:read",
    "research:review",
    "finance:read",
    "notifications:send",
    "reports:read",
    "admin:settings",
    "audit:read",
  ],
  Academic: [
    "users:read",
    "courses:read",
    "courses:publish",
    "enrollments:manage",
    "lessons:read",
    "files:upload",
    "certificates:issue",
    "certificates:read",
    "notifications:read",
    "notifications:send",
    "reports:read",
  ],
  Instructor: [
    "courses:read",
    "courses:write",
    "lessons:read",
    "lessons:write",
    "files:upload",
    "quizzes:write",
    "assignments:write",
    "assignments:grade",
    "gradebook:read",
    "certificates:read",
    "research:read",
    "notifications:read",
  ],
  Student: [
    "courses:read",
    "lessons:read",
    "progress:write",
    "files:upload",
    "quizzes:attempt",
    "assignments:submit",
    "gradebook:read",
    "certificates:request",
    "certificates:read",
    "research:read",
    "notifications:read",
  ],
  Finance: [
    "finance:read",
    "finance:write",
    "payments:process",
    "reports:read",
    "users:read",
    "notifications:read",
  ],
  Researcher: [
    "research:read",
    "research:write",
    "research:review",
    "files:upload",
    "notifications:read",
  ],
};

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(24).optional(),
  role: AcademyRole.default("Student"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const apiSuccessSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  meta: z.record(z.unknown()).optional(),
});

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  timestamp: z.string(),
  tenancy: z.literal("single-tenant"),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const courseStatusSchema = z.enum([
  "draft",
  "pending_review",
  "published",
  "rejected",
  "archived",
]);
export type CourseStatus = z.infer<typeof courseStatusSchema>;

export const courseLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);
export type CourseLevel = z.infer<typeof courseLevelSchema>;

export const courseCategorySchema = z.enum([
  "development",
  "design",
  "business",
  "marketing",
  "it_software",
  "personal_development",
  "data_science",
  "other",
]);
export type CourseCategory = z.infer<typeof courseCategorySchema>;

export const certificateStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "issued",
]);
export const paymentProviderSchema = z.enum(["stripe", "waafi", "manual"]);
export const invoiceStatusSchema = z.enum([
  "draft",
  "open",
  "paid",
  "void",
  "failed",
]);

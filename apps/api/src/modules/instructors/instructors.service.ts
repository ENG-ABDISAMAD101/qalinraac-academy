import { Types } from "mongoose";
import { z } from "zod";
import { courseCategorySchema, courseLevelSchema } from "@qalinraac/shared";
import { AppError } from "../../lib/app-error.js";
import { toPublicUser } from "../auth/auth.service.js";
import { AcademySettings } from "../../models/AcademySettings.js";
import { Assignment } from "../../models/Assignment.js";
import { Course } from "../../models/Course.js";
import { CourseResource } from "../../models/CourseResource.js";
import { DiscussionMessage } from "../../models/DiscussionMessage.js";
import { Enrollment } from "../../models/Enrollment.js";
import { FileAsset } from "../../models/FileAsset.js";
import { InstructorAgreement } from "../../models/InstructorAgreement.js";
import { Invoice } from "../../models/Invoice.js";
import { Lesson } from "../../models/Lesson.js";
import { Module } from "../../models/Module.js";
import { Quiz } from "../../models/Quiz.js";
import { QuizAttempt } from "../../models/QuizAttempt.js";
import { Submission } from "../../models/Submission.js";
import { SupportTicket } from "../../models/SupportTicket.js";
import { User } from "../../models/User.js";
import { Withdrawal } from "../../models/Withdrawal.js";

// Student list progress uses Enrollment.progressPercent.

function oid(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", "Invalid id");
  }
  return new Types.ObjectId(id);
}

function requireObjectId(id: string, label = "id") {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", `Invalid ${label}`);
  }
}

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${base || "course"}-${Date.now().toString(36)}`;
}

async function ownedCourseFilter(instructorId: string) {
  const id = oid(instructorId);
  return {
    $or: [{ instructorIds: id }, { createdBy: id }],
  };
}

async function getOwnedCourse(instructorId: string, courseId: string) {
  requireObjectId(courseId, "courseId");
  const course = await Course.findOne({
    _id: courseId,
    ...(await ownedCourseFilter(instructorId)),
  });
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");
  return course;
}

async function ownedCourseIds(instructorId: string) {
  const courses = await Course.find(await ownedCourseFilter(instructorId)).select(
    "_id",
  );
  return courses.map((c) => c._id);
}

function mapCourse(course: InstanceType<typeof Course>, extras?: Record<string, unknown>) {
  return {
    id: String(course._id),
    title: course.title,
    subtitle: course.subtitle,
    slug: course.slug,
    description: course.description,
    shortDescription: course.shortDescription,
    status: course.status,
    level: course.level,
    category: course.category,
    language: course.language ?? "en",
    learningOutcomes: course.learningOutcomes ?? [],
    requirements: course.requirements ?? [],
    targetAudience: course.targetAudience ?? [],
    tags: course.tags ?? [],
    isFree: course.isFree ?? course.priceCents === 0,
    priceCents: course.priceCents,
    discountPriceCents: course.discountPriceCents,
    accessDuration: course.accessDuration ?? "lifetime",
    currency: course.currency,
    visibility: course.visibility ?? "public",
    thumbnailUrl: course.thumbnailUrl,
    bannerUrl: course.bannerUrl,
    promoVideoUrl: course.promoVideoUrl,
    builderStep: course.builderStep ?? 1,
    rejectionReason: course.rejectionReason,
    submittedAt: course.submittedAt,
    publishedAt: course.publishedAt,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    ...extras,
  };
}

function mapLesson(l: InstanceType<typeof Lesson>) {
  return {
    id: String(l._id),
    title: l.title,
    description: l.description,
    content: l.content,
    contentType: l.contentType ?? "video",
    videoUrl: l.videoUrl,
    externalUrl: l.externalUrl,
    attachments: l.attachments ?? [],
    order: l.order,
    durationMinutes: l.durationMinutes,
    isPreview: l.isPreview ?? false,
    moduleId: String(l.moduleId),
  };
}

function assertCourseEditable(status: string) {
  if (status === "pending_review" || status === "archived") {
    throw new AppError(
      400,
      "LOCKED",
      "This course cannot be edited while pending review or archived",
    );
  }
}

async function countCoursesTowardLimit(instructorId: string) {
  // Rejected and archived do not consume a slot.
  return Course.countDocuments({
    ...(await ownedCourseFilter(instructorId)),
    status: { $in: ["draft", "pending_review", "published"] },
  });
}

async function getSharePercent() {
  const settings = await AcademySettings.findOne({ key: "default" }).lean();
  return settings?.instructorSharePercent ?? 70;
}

function populatedDoc<T>(value: unknown): T | null {
  if (!value || typeof value !== "object") return null;
  return value as T;
}

// ——— Dashboard ———

export async function getDashboard(instructorId: string) {
  const user = await User.findById(instructorId);
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");

  const filter = await ownedCourseFilter(instructorId);
  const courses = await Course.find(filter).sort({ updatedAt: -1 }).lean();
  const courseIds = courses.map((c) => c._id);

  const [totalStudents, earnings] = await Promise.all([
    courseIds.length
      ? Enrollment.countDocuments({
          courseId: { $in: courseIds },
          status: { $in: ["active", "completed"] },
        })
      : 0,
    getEarningsSummary(instructorId),
  ]);

  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.status === "published").length;
  const pendingCourses = courses.filter((c) => c.status === "pending_review").length;
  const towardLimit = await countCoursesTowardLimit(instructorId);
  const courseLimit = user.courseLimit ?? 1;

  return {
    stats: {
      totalCourses,
      publishedCourses,
      pendingCourses,
      draftCourses: courses.filter((c) => c.status === "draft").length,
      rejectedCourses: courses.filter((c) => c.status === "rejected").length,
      archivedCourses: courses.filter((c) => c.status === "archived").length,
      totalStudents,
      totalEarnings: earnings.totalEarnings,
      availableBalance: earnings.availableBalance,
      pendingWithdrawal: earnings.pendingWithdrawal,
    },
    courseLimit,
    canCreateCourse: towardLimit < courseLimit,
    recentCourses: courses.slice(0, 5).map((c) => ({
      id: String(c._id),
      title: c.title,
      status: c.status,
      thumbnailUrl: c.thumbnailUrl,
      createdAt: c.createdAt,
    })),
  };
}

// ——— Onboarding / profile ———

export async function completeOnboarding(instructorId: string) {
  const user = await User.findById(instructorId);
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  user.onboardingCompleted = true;
  user.onboardingCompletedAt = new Date();
  await user.save();
  return toPublicUser(user);
}

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(24).optional(),
  username: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/, "Invalid username")
    .optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().min(1).max(2000).optional(),
});

export async function updateProfile(
  instructorId: string,
  input: z.infer<typeof updateProfileSchema>,
) {
  const parsed = updateProfileSchema.parse(input);
  const user = await User.findById(instructorId);
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");

  if (parsed.username) {
    const taken = await User.findOne({
      username: parsed.username.toLowerCase(),
      _id: { $ne: user._id },
    });
    if (taken) {
      throw new AppError(409, "USERNAME_TAKEN", "Username is already taken");
    }
    user.username = parsed.username.toLowerCase();
  }
  if (parsed.fullName !== undefined) user.fullName = parsed.fullName.trim();
  if (parsed.phone !== undefined) user.phone = parsed.phone.trim();
  if (parsed.bio !== undefined) user.bio = parsed.bio.trim();
  if (parsed.avatarUrl !== undefined) user.avatarUrl = parsed.avatarUrl;
  await user.save();
  return toPublicUser(user);
}

// ——— Courses ———

export const createCourseSchema = z.object({
  title: z.string().min(3).max(160).default("Untitled Course"),
  subtitle: z.string().max(160).optional(),
  description: z.string().max(50000).optional(),
  shortDescription: z.string().max(500).optional(),
  priceCents: z.number().int().min(0).default(0),
  discountPriceCents: z.number().int().min(0).optional(),
  accessDuration: z.enum(["6_months", "1_year", "lifetime"]).optional(),
  currency: z.string().min(3).max(8).default("USD"),
  level: courseLevelSchema.default("beginner"),
  category: courseCategorySchema.optional(),
  language: z.string().min(2).max(16).default("en"),
  learningOutcomes: z.array(z.string().min(1).max(240)).max(30).default([]),
  requirements: z.array(z.string().min(1).max(240)).max(30).default([]),
  targetAudience: z.array(z.string().min(1).max(240)).max(30).default([]),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  isFree: z.boolean().optional(),
  visibility: z.enum(["public", "private", "unlisted"]).optional(),
  thumbnailUrl: z.string().max(2000).optional(),
  bannerUrl: z.string().max(2000).optional(),
  promoVideoUrl: z.string().max(2000).optional(),
  builderStep: z.number().int().min(1).max(9).optional(),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  title: z.string().min(3).max(160).optional(),
});

export async function listCourses(instructorId: string) {
  const courses = await Course.find(await ownedCourseFilter(instructorId)).sort({
    updatedAt: -1,
  });
  const ids = courses.map((c) => c._id);
  const [enrollCounts, lessonCounts] = await Promise.all([
    Enrollment.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { courseId: { $in: ids } } },
      { $group: { _id: "$courseId", count: { $sum: 1 } } },
    ]),
    Lesson.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { courseId: { $in: ids } } },
      { $group: { _id: "$courseId", count: { $sum: 1 } } },
    ]),
  ]);
  const enrollMap = new Map(enrollCounts.map((e) => [String(e._id), e.count]));
  const lessonMap = new Map(lessonCounts.map((e) => [String(e._id), e.count]));

  const user = await User.findById(instructorId).lean();
  const towardLimit = await countCoursesTowardLimit(instructorId);
  const courseLimit = user?.courseLimit ?? 1;

  return {
    courseLimit,
    canCreateCourse: towardLimit < courseLimit,
    items: courses.map((c) =>
      mapCourse(c, {
        students: enrollMap.get(String(c._id)) ?? 0,
        lessons: lessonMap.get(String(c._id)) ?? 0,
      }),
    ),
  };
}

export async function createCourse(
  instructorId: string,
  input: z.infer<typeof createCourseSchema>,
) {
  const parsed = createCourseSchema.parse({
    ...input,
    title: input.title?.trim() || "Untitled Course",
  });
  const user = await User.findById(instructorId);
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");

  const towardLimit = await countCoursesTowardLimit(instructorId);
  const limit = user.courseLimit ?? 1;
  if (towardLimit >= limit) {
    throw new AppError(
      403,
      "COURSE_LIMIT",
      `Course limit reached (${limit}). Ask Super Admin to increase your limit.`,
    );
  }

  const isFree = parsed.isFree ?? parsed.priceCents === 0;
  const course = await Course.create({
    title: parsed.title.trim(),
    subtitle: parsed.subtitle?.trim(),
    slug: slugify(parsed.title),
    description: parsed.description?.trim() ?? "",
    shortDescription: parsed.shortDescription?.trim(),
    status: "draft",
    level: parsed.level,
    category: parsed.category,
    language: parsed.language,
    learningOutcomes: parsed.learningOutcomes,
    requirements: parsed.requirements,
    targetAudience: parsed.targetAudience,
    tags: parsed.tags,
    isFree,
    priceCents: isFree ? 0 : parsed.priceCents,
    currency: parsed.currency,
    visibility: parsed.visibility ?? "public",
    thumbnailUrl: parsed.thumbnailUrl,
    bannerUrl: parsed.bannerUrl,
    promoVideoUrl: parsed.promoVideoUrl,
    builderStep: 1,
    instructorIds: [oid(instructorId)],
    createdBy: oid(instructorId),
  });

  return mapCourse(course, { students: 0, lessons: 0 });
}

export async function getCourse(instructorId: string, courseId: string) {
  const course = await getOwnedCourse(instructorId, courseId);
  const modules = await Module.find({ courseId: course._id }).sort({ order: 1 });
  const lessons = await Lesson.find({ courseId: course._id }).sort({ order: 1 });
  const lessonsByModule = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    const key = String(lesson.moduleId);
    const list = lessonsByModule.get(key) ?? [];
    list.push(lesson);
    lessonsByModule.set(key, list);
  }

  const discussions = await DiscussionMessage.find({ courseId: course._id })
    .sort({ createdAt: 1 })
    .populate("authorId", "fullName avatarUrl role")
    .lean();

  return {
    ...mapCourse(course),
    curriculum: modules.map((m) => ({
      id: String(m._id),
      title: m.title,
      description: m.description,
      order: m.order,
      lessons: (lessonsByModule.get(String(m._id)) ?? []).map((l) => mapLesson(l)),
    })),
    discussions: discussions.map((d) => {
      const author = populatedDoc<{
        _id: Types.ObjectId;
        fullName: string;
        avatarUrl?: string;
        role?: string;
      }>(d.authorId);
      return {
        id: String(d._id),
        body: d.body,
        createdAt: d.createdAt,
        author: author
          ? {
              id: String(author._id),
              fullName: author.fullName,
              avatarUrl: author.avatarUrl,
              role: author.role,
            }
          : null,
      };
    }),
  };
}

export async function updateCourse(
  instructorId: string,
  courseId: string,
  input: z.infer<typeof updateCourseSchema>,
) {
  const course = await getOwnedCourse(instructorId, courseId);
  assertCourseEditable(course.status);

  const parsed = updateCourseSchema.parse(input);
  if (parsed.title !== undefined) course.title = parsed.title.trim();
  if (parsed.subtitle !== undefined) course.subtitle = parsed.subtitle.trim();
  if (parsed.description !== undefined) course.description = parsed.description;
  if (parsed.shortDescription !== undefined) {
    course.shortDescription = parsed.shortDescription.trim();
  }
  if (parsed.level !== undefined) course.level = parsed.level;
  if (parsed.category !== undefined) course.category = parsed.category;
  if (parsed.language !== undefined) course.language = parsed.language;
  if (parsed.learningOutcomes !== undefined) {
    course.learningOutcomes = parsed.learningOutcomes;
  }
  if (parsed.requirements !== undefined) course.requirements = parsed.requirements;
  if (parsed.targetAudience !== undefined) {
    course.targetAudience = parsed.targetAudience;
  }
  if (parsed.tags !== undefined) course.tags = parsed.tags;
  if (parsed.currency !== undefined) course.currency = parsed.currency;
  if (parsed.visibility !== undefined) course.visibility = parsed.visibility;
  if (parsed.thumbnailUrl !== undefined) course.thumbnailUrl = parsed.thumbnailUrl;
  if (parsed.bannerUrl !== undefined) course.bannerUrl = parsed.bannerUrl;
  if (parsed.promoVideoUrl !== undefined) course.promoVideoUrl = parsed.promoVideoUrl;
  if (parsed.builderStep !== undefined) course.builderStep = parsed.builderStep;
  if (parsed.isFree !== undefined) {
    course.isFree = parsed.isFree;
    if (parsed.isFree) course.priceCents = 0;
  }
  if (parsed.priceCents !== undefined && !(parsed.isFree ?? course.isFree)) {
    course.priceCents = parsed.priceCents;
    course.isFree = parsed.priceCents === 0;
  }
  if (parsed.discountPriceCents !== undefined) {
    course.discountPriceCents = parsed.discountPriceCents;
  }
  if (parsed.accessDuration !== undefined) {
    course.accessDuration = parsed.accessDuration;
  }
  await course.save();
  return mapCourse(course);
}

/** Save as draft (explicit). Can withdraw from pending review back to draft. */
export async function saveDraft(instructorId: string, courseId: string) {
  const course = await getOwnedCourse(instructorId, courseId);
  if (course.status === "archived") {
    throw new AppError(400, "LOCKED", "Archived courses cannot return to draft");
  }
  // Published stays published until resubmitted; pending/rejected return to draft.
  if (course.status === "pending_review" || course.status === "rejected") {
    course.status = "draft";
    course.rejectionReason = undefined;
    course.set("submittedAt", undefined);
    await course.save();
  }
  return mapCourse(course);
}

function validateSubmitChecklist(course: InstanceType<typeof Course>, lessonCount: number, moduleCount: number) {
  const missing: string[] = [];
  // Flexible content rule: required fields only — no fixed lesson/quiz quotas.
  if (!course.title?.trim() || course.title === "Untitled Course") missing.push("title");
  if (!course.description?.trim() && !course.shortDescription?.trim()) {
    missing.push("description");
  }
  if (!course.category) missing.push("category");
  if (!course.language) missing.push("language");
  if (!course.level) missing.push("level");
  if (!(course.learningOutcomes?.length > 0)) missing.push("learningOutcomes");
  if (moduleCount < 1) missing.push("modules");
  if (lessonCount < 1) missing.push("lessons");
  return missing;
}

/**
 * Submit for Super Admin / Academic review.
 * Works from draft, rejected, OR published (edits → pending again).
 */
export async function submitForReview(instructorId: string, courseId: string) {
  const course = await getOwnedCourse(instructorId, courseId);
  if (course.status === "pending_review" || course.status === "archived") {
    throw new AppError(400, "INVALID_STATUS", "Cannot submit this course in its current status");
  }
  const [lessonCount, moduleCount] = await Promise.all([
    Lesson.countDocuments({ courseId: course._id }),
    Module.countDocuments({ courseId: course._id }),
  ]);
  const missing = validateSubmitChecklist(course, lessonCount, moduleCount);
  if (missing.length) {
    throw new AppError(400, "VALIDATION", "Course is incomplete", { missing });
  }
  course.status = "pending_review";
  course.submittedAt = new Date();
  course.rejectionReason = undefined;
  course.builderStep = 9;
  await course.save();
  return mapCourse(course);
}

export async function requestUpdate(instructorId: string, courseId: string) {
  return submitForReview(instructorId, courseId);
}

export async function getSubmitChecklist(instructorId: string, courseId: string) {
  const course = await getOwnedCourse(instructorId, courseId);
  const [lessonCount, moduleCount, quizCount, assignmentCount] = await Promise.all([
    Lesson.countDocuments({ courseId: course._id }),
    Module.countDocuments({ courseId: course._id }),
    Quiz.countDocuments({ courseId: course._id }),
    Assignment.countDocuments({ courseId: course._id }),
  ]);
  const missing = validateSubmitChecklist(course, lessonCount, moduleCount);
  const checklist = {
    basicInfo: Boolean(
      course.title &&
        course.title !== "Untitled Course" &&
        course.category &&
        course.language &&
        course.level,
    ),
    description: Boolean(course.description?.trim()),
    learningOutcomes: Boolean(course.learningOutcomes?.length),
    requirements: true,
    curriculum: moduleCount > 0,
    lessons: lessonCount > 0,
    assessment: true,
    pricing: true,
  };
  const checklistValues = Object.values(checklist);
  const completeness = Math.min(
    100,
    Math.round(
      (checklistValues.filter(Boolean).length / checklistValues.length) * 100,
    ),
  );
  return {
    checklist,
    missing,
    canSubmit: missing.length === 0,
    completeness,
    counts: {
      modules: moduleCount,
      lessons: lessonCount,
      quizzes: quizCount,
      assignments: assignmentCount,
    },
  };
}

export const moduleSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(1000).optional(),
  order: z.number().int().min(0).optional(),
});

export async function addModule(
  instructorId: string,
  courseId: string,
  input: z.infer<typeof moduleSchema>,
) {
  const course = await getOwnedCourse(instructorId, courseId);
  assertEditableCurriculum(course.status);
  const parsed = moduleSchema.parse(input);
  const count = await Module.countDocuments({ courseId: course._id });
  const mod = await Module.create({
    courseId: course._id,
    title: parsed.title.trim(),
    description: parsed.description?.trim(),
    order: parsed.order ?? count + 1,
  });
  return {
    id: String(mod._id),
    title: mod.title,
    description: mod.description,
    order: mod.order,
    lessons: [],
  };
}

export const lessonSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(5000).optional(),
  content: z.string().max(50000).optional(),
  contentType: z
    .enum(["video", "article", "pdf", "slides", "zip", "external"])
    .optional(),
  videoUrl: z.string().max(2000).optional(),
  externalUrl: z.string().max(2000).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        mimeType: z.string().optional(),
        size: z.number().optional(),
      }),
    )
    .optional(),
  durationMinutes: z.number().int().min(0).optional(),
  isPreview: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const updateLessonSchema = lessonSchema.partial();

export async function addLesson(
  instructorId: string,
  courseId: string,
  moduleId: string,
  input: z.infer<typeof lessonSchema>,
) {
  const course = await getOwnedCourse(instructorId, courseId);
  assertEditableCurriculum(course.status);
  requireObjectId(moduleId, "moduleId");
  const mod = await Module.findOne({ _id: moduleId, courseId: course._id });
  if (!mod) throw new AppError(404, "NOT_FOUND", "Module not found");
  const parsed = lessonSchema.parse(input);
  const count = await Lesson.countDocuments({ moduleId: mod._id });
  const lesson = await Lesson.create({
    courseId: course._id,
    moduleId: mod._id,
    title: parsed.title.trim(),
    description: parsed.description,
    content: parsed.content,
    contentType: parsed.contentType ?? "video",
    videoUrl: parsed.videoUrl,
    externalUrl: parsed.externalUrl,
    attachments: parsed.attachments ?? [],
    durationMinutes: parsed.durationMinutes,
    isPreview: parsed.isPreview ?? false,
    order: parsed.order ?? count + 1,
  });
  return mapLesson(lesson);
}

export async function updateLesson(
  instructorId: string,
  lessonId: string,
  input: z.infer<typeof updateLessonSchema>,
) {
  requireObjectId(lessonId, "lessonId");
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(404, "NOT_FOUND", "Lesson not found");
  const course = await getOwnedCourse(instructorId, String(lesson.courseId));
  assertEditableCurriculum(course.status);
  const parsed = updateLessonSchema.parse(input);
  if (parsed.title !== undefined) lesson.title = parsed.title.trim();
  if (parsed.description !== undefined) lesson.description = parsed.description;
  if (parsed.content !== undefined) lesson.content = parsed.content;
  if (parsed.contentType !== undefined) lesson.contentType = parsed.contentType;
  if (parsed.videoUrl !== undefined) lesson.videoUrl = parsed.videoUrl;
  if (parsed.externalUrl !== undefined) lesson.externalUrl = parsed.externalUrl;
  if (parsed.attachments !== undefined) lesson.attachments = parsed.attachments;
  if (parsed.durationMinutes !== undefined) {
    lesson.durationMinutes = parsed.durationMinutes;
  }
  if (parsed.isPreview !== undefined) lesson.isPreview = parsed.isPreview;
  if (parsed.order !== undefined) lesson.order = parsed.order;
  await lesson.save();
  return mapLesson(lesson);
}

export async function deleteLesson(instructorId: string, lessonId: string) {
  requireObjectId(lessonId, "lessonId");
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(404, "NOT_FOUND", "Lesson not found");
  const course = await getOwnedCourse(instructorId, String(lesson.courseId));
  assertEditableCurriculum(course.status);
  await lesson.deleteOne();
  return { deleted: true };
}

export async function deleteModule(instructorId: string, moduleId: string) {
  requireObjectId(moduleId, "moduleId");
  const mod = await Module.findById(moduleId);
  if (!mod) throw new AppError(404, "NOT_FOUND", "Module not found");
  const course = await getOwnedCourse(instructorId, String(mod.courseId));
  assertEditableCurriculum(course.status);
  await Lesson.deleteMany({ moduleId: mod._id });
  await mod.deleteOne();
  return { deleted: true };
}

export const updateModuleSchema = moduleSchema.partial();

export async function updateModule(
  instructorId: string,
  moduleId: string,
  input: z.infer<typeof updateModuleSchema>,
) {
  requireObjectId(moduleId, "moduleId");
  const mod = await Module.findById(moduleId);
  if (!mod) throw new AppError(404, "NOT_FOUND", "Module not found");
  const course = await getOwnedCourse(instructorId, String(mod.courseId));
  assertEditableCurriculum(course.status);
  const parsed = updateModuleSchema.parse(input);
  if (parsed.title !== undefined) mod.title = parsed.title.trim();
  if (parsed.description !== undefined) mod.description = parsed.description?.trim();
  if (parsed.order !== undefined) mod.order = parsed.order;
  await mod.save();
  return {
    id: String(mod._id),
    title: mod.title,
    description: mod.description,
    order: mod.order,
  };
}

export const reorderSchema = z.object({
  moduleIds: z.array(z.string()).optional(),
  lessonOrders: z
    .array(
      z.object({
        lessonId: z.string(),
        moduleId: z.string(),
        order: z.number().int().min(0),
      }),
    )
    .optional(),
});

export async function reorderCurriculum(
  instructorId: string,
  courseId: string,
  input: z.infer<typeof reorderSchema>,
) {
  const course = await getOwnedCourse(instructorId, courseId);
  assertEditableCurriculum(course.status);
  const parsed = reorderSchema.parse(input);

  if (parsed.moduleIds?.length) {
    await Promise.all(
      parsed.moduleIds.map((id, index) =>
        Module.updateOne(
          { _id: id, courseId: course._id },
          { $set: { order: index + 1 } },
        ),
      ),
    );
  }

  if (parsed.lessonOrders?.length) {
    await Promise.all(
      parsed.lessonOrders.map((row) =>
        Lesson.updateOne(
          { _id: row.lessonId, courseId: course._id },
          {
            $set: {
              moduleId: oid(row.moduleId),
              order: row.order,
            },
          },
        ),
      ),
    );
  }

  return getCourse(instructorId, courseId);
}

export async function duplicateLesson(instructorId: string, lessonId: string) {
  requireObjectId(lessonId, "lessonId");
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError(404, "NOT_FOUND", "Lesson not found");
  const course = await getOwnedCourse(instructorId, String(lesson.courseId));
  assertEditableCurriculum(course.status);
  const count = await Lesson.countDocuments({ moduleId: lesson.moduleId });
  const copy = await Lesson.create({
    courseId: lesson.courseId,
    moduleId: lesson.moduleId,
    title: `${lesson.title} (copy)`,
    description: lesson.description,
    content: lesson.content,
    contentType: lesson.contentType,
    videoUrl: lesson.videoUrl,
    externalUrl: lesson.externalUrl,
    attachments: lesson.attachments,
    durationMinutes: lesson.durationMinutes,
    isPreview: false,
    order: count + 1,
  });
  return mapLesson(copy);
}

function assertEditableCurriculum(status: string) {
  assertCourseEditable(status);
}

export async function replyCourseDiscussion(
  instructorId: string,
  courseId: string,
  body: string,
) {
  const course = await getOwnedCourse(instructorId, courseId);
  const text = body?.trim();
  if (!text) throw new AppError(400, "EMPTY", "Message is required");
  const msg = await DiscussionMessage.create({
    courseId: course._id,
    authorId: oid(instructorId),
    body: text,
  });
  const author = await User.findById(instructorId).select("fullName avatarUrl role");
  return {
    id: String(msg._id),
    body: msg.body,
    createdAt: msg.createdAt,
    author: author
      ? {
          id: String(author._id),
          fullName: author.fullName,
          avatarUrl: author.avatarUrl,
          role: author.role,
        }
      : null,
  };
}

// ——— Students ———

export async function listStudents(instructorId: string, q?: string) {
  const courseIds = await ownedCourseIds(instructorId);
  if (!courseIds.length) return { items: [] };

  const enrollments = await Enrollment.find({
    courseId: { $in: courseIds },
  })
    .populate("userId", "fullName email avatarUrl isActive")
    .populate("courseId", "title")
    .sort({ updatedAt: -1 })
    .lean();

  let items = enrollments.map((e) => {
    const student = populatedDoc<{
      _id: Types.ObjectId;
      fullName: string;
      email: string;
      avatarUrl?: string;
      isActive?: boolean;
    }>(e.userId);
    const course = populatedDoc<{ _id: Types.ObjectId; title: string }>(e.courseId);
    return {
      id: String(e._id),
      studentId: student ? String(student._id) : "",
      name: student?.fullName ?? "Student",
      email: student?.email ?? "",
      avatarUrl: student?.avatarUrl,
      courseId: course ? String(course._id) : "",
      courseTitle: course?.title ?? "",
      status: e.status,
      progress: e.progressPercent ?? 0,
      enrolledAt: e.enrolledAt ?? e.createdAt,
    };
  });

  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(needle) ||
        i.email.toLowerCase().includes(needle) ||
        i.courseTitle.toLowerCase().includes(needle),
    );
  }

  return { items };
}

// ——— Assignments ———

export const createAssignmentSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(5000).optional(),
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  maxScore: z.number().int().min(1).max(1000).default(100),
});

export async function listAssignments(instructorId: string) {
  const courseIds = await ownedCourseIds(instructorId);
  if (!courseIds.length) return { items: [] };

  const assignments = await Assignment.find({
    courseId: { $in: courseIds },
  })
    .sort({ createdAt: -1 })
    .lean();

  const courseMap = new Map(
    (
      await Course.find({ _id: { $in: courseIds } })
        .select("title")
        .lean()
    ).map((c) => [String(c._id), c.title]),
  );
  const lessonIds = assignments
    .map((a) => a.lessonId)
    .filter(Boolean) as Types.ObjectId[];
  const lessonMap = new Map(
    (
      await Lesson.find({ _id: { $in: lessonIds } })
        .select("title")
        .lean()
    ).map((l) => [String(l._id), l.title]),
  );

  return {
    items: assignments.map((a) => ({
      id: String(a._id),
      title: a.title,
      description: a.description,
      courseId: String(a.courseId),
      courseTitle: courseMap.get(String(a.courseId)) ?? "",
      lessonId: a.lessonId ? String(a.lessonId) : undefined,
      lessonTitle: a.lessonId ? lessonMap.get(String(a.lessonId)) ?? "" : "",
      maxScore: a.maxScore,
      createdAt: a.createdAt,
    })),
  };
}

export async function createAssignment(
  instructorId: string,
  input: z.infer<typeof createAssignmentSchema>,
) {
  const parsed = createAssignmentSchema.parse(input);
  await getOwnedCourse(instructorId, parsed.courseId);
  requireObjectId(parsed.lessonId, "lessonId");
  const lesson = await Lesson.findOne({
    _id: parsed.lessonId,
    courseId: parsed.courseId,
  });
  if (!lesson) throw new AppError(404, "NOT_FOUND", "Lesson not found on this course");

  const assignment = await Assignment.create({
    title: parsed.title.trim(),
    description: parsed.description?.trim(),
    courseId: oid(parsed.courseId),
    lessonId: lesson._id,
    maxScore: parsed.maxScore,
    createdBy: oid(instructorId),
  });

  return {
    id: String(assignment._id),
    title: assignment.title,
    description: assignment.description,
    courseId: String(assignment.courseId),
    lessonId: String(assignment.lessonId),
    maxScore: assignment.maxScore,
    createdAt: assignment.createdAt,
  };
}

export async function getAssignmentDetail(instructorId: string, assignmentId: string) {
  requireObjectId(assignmentId, "assignmentId");
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
  await getOwnedCourse(instructorId, String(assignment.courseId));

  const [course, lesson, submissions, discussions] = await Promise.all([
    Course.findById(assignment.courseId).select("title"),
    assignment.lessonId
      ? Lesson.findById(assignment.lessonId).select("title")
      : null,
    Submission.find({ assignmentId: assignment._id })
      .populate("userId", "fullName avatarUrl email")
      .populate("fileAssetId")
      .sort({ createdAt: -1 })
      .lean(),
    DiscussionMessage.find({ assignmentId: assignment._id })
      .populate("authorId", "fullName avatarUrl role")
      .sort({ createdAt: 1 })
      .lean(),
  ]);

  return {
    id: String(assignment._id),
    title: assignment.title,
    description: assignment.description,
    courseId: String(assignment.courseId),
    courseTitle: course?.title ?? "",
    lessonId: assignment.lessonId ? String(assignment.lessonId) : undefined,
    lessonTitle: lesson?.title ?? "",
    maxScore: assignment.maxScore,
    students: submissions.map((s) => {
      const student = populatedDoc<{
        _id: Types.ObjectId;
        fullName: string;
        avatarUrl?: string;
        email?: string;
      }>(s.userId);
      const file = populatedDoc<{
        _id: Types.ObjectId;
        originalName: string;
        url?: string;
      }>(s.fileAssetId);
      return {
        submissionId: String(s._id),
        studentId: student ? String(student._id) : "",
        name: student?.fullName ?? "Student",
        email: student?.email,
        avatarUrl: student?.avatarUrl,
        status: s.status,
        score: s.score,
        content: s.content,
        file: file
          ? {
              id: String(file._id),
              name: file.originalName,
              url: file.url,
            }
          : null,
        submittedAt: s.createdAt,
      };
    }),
    discussions: discussions.map((d) => {
      const author = populatedDoc<{
        _id: Types.ObjectId;
        fullName: string;
        avatarUrl?: string;
        role?: string;
      }>(d.authorId);
      return {
        id: String(d._id),
        body: d.body,
        createdAt: d.createdAt,
        author: author
          ? {
              id: String(author._id),
              fullName: author.fullName,
              avatarUrl: author.avatarUrl,
              role: author.role,
            }
          : null,
      };
    }),
  };
}

export async function replyAssignmentDiscussion(
  instructorId: string,
  assignmentId: string,
  body: string,
) {
  requireObjectId(assignmentId, "assignmentId");
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
  await getOwnedCourse(instructorId, String(assignment.courseId));
  const text = body?.trim();
  if (!text) throw new AppError(400, "EMPTY", "Message is required");
  const msg = await DiscussionMessage.create({
    assignmentId: assignment._id,
    authorId: oid(instructorId),
    body: text,
  });
  const author = await User.findById(instructorId).select("fullName avatarUrl role");
  return {
    id: String(msg._id),
    body: msg.body,
    createdAt: msg.createdAt,
    author: author
      ? {
          id: String(author._id),
          fullName: author.fullName,
          avatarUrl: author.avatarUrl,
          role: author.role,
        }
      : null,
  };
}

export async function gradeSubmission(
  instructorId: string,
  assignmentId: string,
  studentUserId: string,
  input: { score: number; feedback?: string },
) {
  requireObjectId(assignmentId, "assignmentId");
  requireObjectId(studentUserId, "userId");
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new AppError(404, "NOT_FOUND", "Assignment not found");
  await getOwnedCourse(instructorId, String(assignment.courseId));

  const submission = await Submission.findOne({
    assignmentId: assignment._id,
    userId: studentUserId,
  });
  if (!submission) throw new AppError(404, "NOT_FOUND", "Submission not found");

  submission.score = input.score;
  submission.feedback = input.feedback;
  submission.status = "graded";
  submission.gradedBy = oid(instructorId);
  submission.gradedAt = new Date();
  await submission.save();
  return { id: String(submission._id), status: submission.status, score: submission.score };
}

// ——— Quizzes ———

export const createQuizSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(2000).optional(),
  courseId: z.string().min(1),
  lessonId: z.string().optional(),
  passingScore: z.number().int().min(0).max(100).default(70),
  questions: z
    .array(
      z.object({
        prompt: z.string().min(1),
        options: z.array(z.string().min(1)).min(2).max(8),
        correctIndex: z.number().int().min(0),
        points: z.number().int().min(1).default(1),
      }),
    )
    .min(1)
    .max(50),
});

export async function listQuizzes(instructorId: string, q?: string) {
  const courseIds = await ownedCourseIds(instructorId);
  if (!courseIds.length) return { items: [] };

  const quizzes = await Quiz.find({ courseId: { $in: courseIds } })
    .sort({ createdAt: -1 })
    .lean();
  const courseMap = new Map(
    (
      await Course.find({ _id: { $in: courseIds } })
        .select("title")
        .lean()
    ).map((c) => [String(c._id), c.title]),
  );

  const attemptAgg = await QuizAttempt.aggregate<{
    _id: Types.ObjectId;
    count: number;
    avgScore: number;
  }>([
    { $match: { quizId: { $in: quizzes.map((qz) => qz._id) } } },
    {
      $group: {
        _id: "$quizId",
        count: { $sum: 1 },
        avgScore: {
          $avg: {
            $cond: [
              { $gt: ["$maxScore", 0] },
              { $multiply: [{ $divide: ["$score", "$maxScore"] }, 100] },
              0,
            ],
          },
        },
      },
    },
  ]);
  const attemptMap = new Map(
    attemptAgg.map((a) => [String(a._id), { count: a.count, avg: a.avgScore }]),
  );

  let items = quizzes.map((qz) => {
    const stats = attemptMap.get(String(qz._id));
    return {
      id: String(qz._id),
      title: qz.title,
      description: qz.description,
      courseId: String(qz.courseId),
      courseTitle: courseMap.get(String(qz.courseId)) ?? "",
      questionCount: qz.questions?.length ?? 0,
      passingScore: qz.passingScore,
      attempts: stats?.count ?? 0,
      avgScore: Math.round(stats?.avg ?? 0),
      createdAt: qz.createdAt,
    };
  });

  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(needle) ||
        i.courseTitle.toLowerCase().includes(needle),
    );
  }

  return { items };
}

export async function createQuiz(
  instructorId: string,
  input: z.infer<typeof createQuizSchema>,
) {
  const parsed = createQuizSchema.parse(input);
  await getOwnedCourse(instructorId, parsed.courseId);
  if (parsed.lessonId) {
    requireObjectId(parsed.lessonId, "lessonId");
    const lesson = await Lesson.findOne({
      _id: parsed.lessonId,
      courseId: parsed.courseId,
    });
    if (!lesson) throw new AppError(404, "NOT_FOUND", "Lesson not found");
  }

  const quiz = await Quiz.create({
    title: parsed.title.trim(),
    description: parsed.description?.trim(),
    courseId: oid(parsed.courseId),
    lessonId: parsed.lessonId ? oid(parsed.lessonId) : undefined,
    passingScore: parsed.passingScore,
    questions: parsed.questions,
    createdBy: oid(instructorId),
  });

  return {
    id: String(quiz._id),
    title: quiz.title,
    questionCount: quiz.questions.length,
    courseId: String(quiz.courseId),
  };
}

export async function getQuizResults(instructorId: string, quizId: string) {
  requireObjectId(quizId, "quizId");
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new AppError(404, "NOT_FOUND", "Quiz not found");
  await getOwnedCourse(instructorId, String(quiz.courseId));

  const attempts = await QuizAttempt.find({ quizId: quiz._id })
    .populate("userId", "fullName avatarUrl email")
    .sort({ createdAt: -1 })
    .lean();

  return {
    id: String(quiz._id),
    title: quiz.title,
    passingScore: quiz.passingScore,
    results: attempts.map((a) => {
      const student = populatedDoc<{
        _id: Types.ObjectId;
        fullName: string;
        avatarUrl?: string;
        email?: string;
      }>(a.userId);
      const scorePercent =
        a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0;
      return {
        id: String(a._id),
        studentId: student ? String(student._id) : "",
        name: student?.fullName ?? "Student",
        avatarUrl: student?.avatarUrl,
        email: student?.email,
        score: scorePercent,
        passed: a.passed,
        createdAt: a.createdAt,
      };
    }),
  };
}

// ——— Earnings / withdrawals ———

async function getEarningsSummary(instructorId: string) {
  const courseIds = await ownedCourseIds(instructorId);
  const share = await getSharePercent();

  let grossCents = 0;
  if (courseIds.length) {
    const paid = await Invoice.find({
      courseId: { $in: courseIds },
      status: "paid",
    }).lean();
    grossCents = paid.reduce((sum, inv) => sum + inv.amountCents, 0);
  }

  const totalEarnings = Math.round((grossCents * share) / 100);
  const withdrawals = await Withdrawal.find({ instructorId }).lean();
  const pendingWithdrawal = withdrawals
    .filter((w) => w.status === "pending" || w.status === "approved")
    .reduce((s, w) => s + w.amountCents, 0);
  const completedWithdrawal = withdrawals
    .filter((w) => w.status === "completed")
    .reduce((s, w) => s + w.amountCents, 0);
  const availableBalance = Math.max(
    0,
    totalEarnings - pendingWithdrawal - completedWithdrawal,
  );

  return {
    totalEarnings,
    availableBalance,
    pendingWithdrawal,
    sharePercent: share,
  };
}

export async function listEarnings(instructorId: string, q?: string) {
  const courseIds = await ownedCourseIds(instructorId);
  const share = await getSharePercent();
  const summary = await getEarningsSummary(instructorId);

  if (!courseIds.length) {
    return { ...summary, items: [] as unknown[] };
  }

  const invoices = await Invoice.find({
    courseId: { $in: courseIds },
    status: "paid",
  })
    .populate("userId", "fullName email")
    .populate("courseId", "title")
    .sort({ paidAt: -1, createdAt: -1 })
    .lean();

  let items = invoices.map((inv) => {
    const student = populatedDoc<{ fullName: string; email: string }>(inv.userId);
    const course = populatedDoc<{ title: string }>(inv.courseId);
    const instructorShare = Math.round((inv.amountCents * share) / 100);
    return {
      id: String(inv._id),
      courseTitle: course?.title ?? "",
      studentName: student?.fullName ?? "Student",
      studentEmail: student?.email ?? "",
      amountCents: inv.amountCents,
      instructorShareCents: instructorShare,
      currency: inv.currency,
      paidAt: inv.paidAt ?? inv.createdAt,
    };
  });

  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    items = items.filter(
      (i) =>
        i.courseTitle.toLowerCase().includes(needle) ||
        i.studentName.toLowerCase().includes(needle) ||
        i.studentEmail.toLowerCase().includes(needle),
    );
  }

  return { ...summary, items };
}

export async function listWithdrawals(instructorId: string, q?: string) {
  let items = (
    await Withdrawal.find({ instructorId }).sort({ createdAt: -1 }).lean()
  ).map((w) => ({
    id: String(w._id),
    amountCents: w.amountCents,
    currency: w.currency,
    paymentMethod: w.paymentMethod,
    status: w.status,
    note: w.note,
    rejectionReason: w.rejectionReason,
    createdAt: w.createdAt,
    processedAt: w.processedAt,
  }));

  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    items = items.filter(
      (i) =>
        i.status.toLowerCase().includes(needle) ||
        String(i.amountCents).includes(needle) ||
        (i.paymentMethod ?? "").toLowerCase().includes(needle) ||
        (i.note ?? "").toLowerCase().includes(needle),
    );
  }

  const summary = await getEarningsSummary(instructorId);
  return { availableBalance: summary.availableBalance, items };
}

export const createWithdrawalSchema = z.object({
  amountCents: z.number().int().min(100),
  paymentMethod: z.enum(["waafi", "evc_plus", "zaad", "bank_transfer"]),
  note: z.string().max(500).optional(),
});

export async function createWithdrawal(
  instructorId: string,
  input: z.infer<typeof createWithdrawalSchema>,
) {
  const parsed = createWithdrawalSchema.parse(input);
  const summary = await getEarningsSummary(instructorId);
  if (parsed.amountCents > summary.availableBalance) {
    throw new AppError(400, "INSUFFICIENT", "Amount exceeds available balance");
  }
  const w = await Withdrawal.create({
    instructorId: oid(instructorId),
    amountCents: parsed.amountCents,
    paymentMethod: parsed.paymentMethod,
    note: parsed.note?.trim(),
    status: "pending",
  });
  return {
    id: String(w._id),
    amountCents: w.amountCents,
    paymentMethod: w.paymentMethod,
    status: w.status,
    createdAt: w.createdAt,
  };
}

// ——— Agreement ———

export async function listAgreements(instructorId: string) {
  const items = await InstructorAgreement.find({
    isActive: true,
    $or: [{ instructorId: oid(instructorId) }, { instructorId: { $exists: false } }, { instructorId: null }],
  })
    .sort({ createdAt: -1 })
    .lean();

  return {
    items: items.map((a) => ({
      id: String(a._id),
      courseTitle: a.courseTitle,
      courseDescription: a.courseDescription,
      description: a.description,
      fileUrl: a.fileUrl,
      fileName: a.fileName,
      version: a.version,
      createdAt: a.createdAt,
    })),
  };
}

// ——— Support ———

export async function listSupport(instructorId: string) {
  const tickets = await SupportTicket.find({ userId: instructorId })
    .sort({ createdAt: -1 })
    .lean();
  return tickets.map((t) => ({
    id: String(t._id),
    subject: t.subject,
    body: t.body,
    status: t.status,
    createdAt: t.createdAt,
  }));
}

export async function createSupport(
  instructorId: string,
  input: { subject: string; body: string; attachmentIds?: string[] },
) {
  const subject = input.subject?.trim();
  const body = input.body?.trim();
  if (!subject || !body) {
    throw new AppError(400, "INVALID", "Subject and message are required");
  }
  const ticket = await SupportTicket.create({
    userId: oid(instructorId),
    subject,
    body,
    attachmentIds: (input.attachmentIds ?? [])
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id)),
    status: "open",
  });
  return {
    id: String(ticket._id),
    subject: ticket.subject,
    body: ticket.body,
    status: ticket.status,
    createdAt: ticket.createdAt,
  };
}

export async function getSupport(instructorId: string, ticketId: string) {
  requireObjectId(ticketId, "ticketId");
  const ticket = await SupportTicket.findOne({
    _id: ticketId,
    userId: instructorId,
  }).lean();
  if (!ticket) throw new AppError(404, "NOT_FOUND", "Support ticket not found");
  return {
    id: String(ticket._id),
    subject: ticket.subject,
    body: ticket.body,
    status: ticket.status,
    replies: ticket.replies,
    createdAt: ticket.createdAt,
  };
}

/** Lessons for assignment/quiz pickers */
export async function listCourseLessons(instructorId: string, courseId: string) {
  await getOwnedCourse(instructorId, courseId);
  const lessons = await Lesson.find({ courseId }).sort({ order: 1 }).lean();
  return {
    items: lessons.map((l) => ({
      id: String(l._id),
      title: l.title,
      moduleId: String(l.moduleId),
    })),
  };
}

/** Curriculum sections + lessons for resource / assessment pickers */
export async function listCourseCurriculum(
  instructorId: string,
  courseId: string,
) {
  await getOwnedCourse(instructorId, courseId);
  const [modules, lessons] = await Promise.all([
    Module.find({ courseId }).sort({ order: 1 }).lean(),
    Lesson.find({ courseId }).sort({ order: 1 }).lean(),
  ]);
  const byModule = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    const key = String(lesson.moduleId);
    const list = byModule.get(key) ?? [];
    list.push(lesson);
    byModule.set(key, list);
  }
  return {
    modules: modules.map((m) => ({
      id: String(m._id),
      title: m.title,
      order: m.order,
      lessons: (byModule.get(String(m._id)) ?? []).map((l) => ({
        id: String(l._id),
        title: l.title,
        order: l.order,
      })),
    })),
  };
}

export const createResourceSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(2000).optional(),
  courseId: z.string().min(1),
  moduleId: z.string().min(1),
  lessonId: z.string().min(1),
  fileAssetId: z.string().min(1),
});

function mapInstructorResource(r: {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  mimeType: string;
  originalName: string;
  courseId: unknown;
  moduleId?: unknown;
  lessonId?: unknown;
  fileAssetId: unknown;
  createdAt?: Date;
}) {
  const course = populatedDoc<{ _id: Types.ObjectId; title: string }>(r.courseId);
  const mod = populatedDoc<{ _id: Types.ObjectId; title: string }>(r.moduleId);
  const lesson = populatedDoc<{ _id: Types.ObjectId; title: string }>(
    r.lessonId,
  );
  const file = populatedDoc<{
    _id: Types.ObjectId;
    originalName: string;
    mimeType: string;
    size?: number;
    url?: string;
  }>(r.fileAssetId);

  return {
    id: String(r._id),
    title: r.title,
    description: r.description,
    mimeType: r.mimeType,
    originalName: r.originalName,
    courseId: course ? String(course._id) : String(r.courseId),
    courseTitle: course?.title ?? "Course",
    moduleId: mod ? String(mod._id) : r.moduleId ? String(r.moduleId) : undefined,
    moduleTitle: mod?.title,
    lessonId: lesson
      ? String(lesson._id)
      : r.lessonId
        ? String(r.lessonId)
        : undefined,
    lessonTitle: lesson?.title,
    file: file
      ? {
          id: String(file._id),
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          url: file.url,
        }
      : {
          id: String(r.fileAssetId),
          originalName: r.originalName,
          mimeType: r.mimeType,
        },
    createdAt: r.createdAt,
  };
}

export async function listResources(instructorId: string, q?: string) {
  const courseIds = await Course.find(await ownedCourseFilter(instructorId))
    .select("_id")
    .lean();
  const ids = courseIds.map((c) => c._id);
  if (ids.length === 0) return { items: [] };

  const filter: Record<string, unknown> = { courseId: { $in: ids } };
  if (q?.trim()) {
    const needle = q.trim();
    filter.$or = [
      { title: { $regex: needle, $options: "i" } },
      { originalName: { $regex: needle, $options: "i" } },
      { description: { $regex: needle, $options: "i" } },
    ];
  }

  const resources = await CourseResource.find(filter)
    .populate("courseId", "title")
    .populate("moduleId", "title")
    .populate("lessonId", "title")
    .populate("fileAssetId")
    .sort({ createdAt: -1 })
    .lean();

  return { items: resources.map((r) => mapInstructorResource(r)) };
}

export async function createResource(
  instructorId: string,
  input: z.infer<typeof createResourceSchema>,
) {
  const parsed = createResourceSchema.parse(input);
  const course = await getOwnedCourse(instructorId, parsed.courseId);
  if (course.status === "archived") {
    throw new AppError(400, "LOCKED", "Archived courses cannot accept resources");
  }

  requireObjectId(parsed.moduleId, "moduleId");
  requireObjectId(parsed.lessonId, "lessonId");
  requireObjectId(parsed.fileAssetId, "fileAssetId");

  const [mod, lesson, asset] = await Promise.all([
    Module.findOne({ _id: parsed.moduleId, courseId: course._id }),
    Lesson.findOne({ _id: parsed.lessonId, courseId: course._id }),
    FileAsset.findById(parsed.fileAssetId),
  ]);
  if (!mod) throw new AppError(404, "NOT_FOUND", "Curriculum section not found");
  if (!lesson) throw new AppError(404, "NOT_FOUND", "Lesson not found");
  if (String(lesson.moduleId) !== String(mod._id)) {
    throw new AppError(400, "INVALID", "Lesson does not belong to that section");
  }
  if (!asset) throw new AppError(404, "NOT_FOUND", "Uploaded file not found");
  if (String(asset.uploadedBy) !== instructorId) {
    throw new AppError(403, "FORBIDDEN", "File was not uploaded by you");
  }

  const resource = await CourseResource.create({
    courseId: course._id,
    moduleId: mod._id,
    lessonId: lesson._id,
    title: parsed.title.trim(),
    description: parsed.description?.trim(),
    fileAssetId: asset._id,
    mimeType: asset.mimeType,
    originalName: asset.originalName,
    uploadedBy: oid(instructorId),
  });

  const populated = await CourseResource.findById(resource._id)
    .populate("courseId", "title")
    .populate("moduleId", "title")
    .populate("lessonId", "title")
    .populate("fileAssetId")
    .lean();

  return mapInstructorResource(populated!);
}

export async function deleteResource(instructorId: string, resourceId: string) {
  requireObjectId(resourceId, "resourceId");
  const resource = await CourseResource.findById(resourceId);
  if (!resource) throw new AppError(404, "NOT_FOUND", "Resource not found");
  await getOwnedCourse(instructorId, String(resource.courseId));
  await resource.deleteOne();
  return { ok: true };
}

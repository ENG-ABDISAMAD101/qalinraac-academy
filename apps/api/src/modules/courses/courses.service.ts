import { courseStatusSchema, paginationQuerySchema } from "@qalinraac/shared";
import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { writeAuditLog } from "../../lib/audit.js";
import {
  isCourseUnderReview,
  normalizeCourseWorkflow,
  pendingReviewFilter,
} from "../../lib/course-workflow.js";
import { Assignment } from "../../models/Assignment.js";
import { Course } from "../../models/Course.js";
import { CourseResource } from "../../models/CourseResource.js";
import { CourseRevisionHistory } from "../../models/CourseRevisionHistory.js";
import { Lesson } from "../../models/Lesson.js";
import { Module } from "../../models/Module.js";
import { Quiz } from "../../models/Quiz.js";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export const createCourseSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  priceCents: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  thumbnailUrl: z.string().url().optional(),
  instructorIds: z.array(z.string()).optional(),
  slug: z.string().min(2).max(100).optional(),
});

export const updateCourseSchema = createCourseSchema.partial().extend({
  status: courseStatusSchema.optional(),
});

export const createModuleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  order: z.number().int().min(0).optional(),
});

export const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  order: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(0).optional(),
});

export async function listCourses(
  query: z.infer<typeof paginationQuerySchema> & { status?: string },
) {
  const filter: Record<string, unknown> = {};
  if (query.status === "pending_review" || query.status === "pending") {
    Object.assign(filter, pendingReviewFilter());
  } else if (query.status) {
    filter.status = query.status;
  }
  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    Course.countDocuments(filter),
  ]);
  return { items, total, page: query.page, limit: query.limit };
}

export async function getCourse(id: string) {
  const course = await Course.findById(id);
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");
  const modules = await Module.find({ courseId: id }).sort({ order: 1 });
  const lessons = await Lesson.find({ courseId: id }).sort({ order: 1 });
  return { course, modules, lessons };
}

export async function createCourse(
  input: z.infer<typeof createCourseSchema>,
  actorId: string,
) {
  let slug = input.slug ?? slugify(input.title);
  const exists = await Course.findOne({ slug });
  if (exists) slug = `${slug}-${Date.now().toString(36)}`;

  const course = await Course.create({
    title: input.title,
    slug,
    description: input.description ?? "",
    priceCents: input.priceCents ?? 0,
    currency: input.currency ?? "USD",
    thumbnailUrl: input.thumbnailUrl,
    instructorIds: input.instructorIds ?? [actorId],
    createdBy: actorId,
    status: "draft",
    reviewStatus: "none",
    isDisabled: false,
  });

  await writeAuditLog({
    actorId,
    action: "courses.create",
    resource: "Course",
    resourceId: String(course._id),
  });

  return course;
}

export async function updateCourse(
  id: string,
  input: z.infer<typeof updateCourseSchema>,
  actorId: string,
) {
  const course = await Course.findById(id);
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");
  Object.assign(course, input);
  await course.save();
  await writeAuditLog({
    actorId,
    action: "courses.update",
    resource: "Course",
    resourceId: id,
  });
  return course;
}

async function buildChangeSummary(
  liveId: string,
  revisionId: string,
): Promise<string[]> {
  const summary: string[] = [];
  const [live, rev] = await Promise.all([
    Course.findById(liveId).lean(),
    Course.findById(revisionId).lean(),
  ]);
  if (!live || !rev) return summary;

  if (live.title !== rev.title) summary.push("~ Updated title");
  if (live.description !== rev.description) summary.push("~ Updated description");
  if (
    JSON.stringify(live.learningOutcomes ?? []) !==
    JSON.stringify(rev.learningOutcomes ?? [])
  ) {
    summary.push("~ Updated course objectives");
  }
  if (live.promoVideoUrl !== rev.promoVideoUrl) {
    summary.push(
      rev.promoVideoUrl
        ? "~ Updated introduction video"
        : "- Removed introduction video",
    );
  }
  if (live.thumbnailUrl !== rev.thumbnailUrl) summary.push("~ Updated thumbnail");

  const [
    liveLessons,
    revLessons,
    liveResources,
    revResources,
    liveQuizzes,
    revQuizzes,
  ] = await Promise.all([
    Lesson.find({ courseId: liveId }).select("title").lean(),
    Lesson.find({ courseId: revisionId }).select("title").lean(),
    CourseResource.find({ courseId: liveId }).select("title").lean(),
    CourseResource.find({ courseId: revisionId }).select("title").lean(),
    Quiz.find({ courseId: liveId }).select("title").lean(),
    Quiz.find({ courseId: revisionId }).select("title").lean(),
  ]);

  const liveLessonTitles = new Set(liveLessons.map((l) => l.title));
  const revLessonTitles = new Set(revLessons.map((l) => l.title));
  for (const t of revLessonTitles) {
    if (!liveLessonTitles.has(t)) summary.push(`+ New lesson: ${t}`);
  }
  for (const t of liveLessonTitles) {
    if (!revLessonTitles.has(t)) summary.push(`- Removed lesson: ${t}`);
  }

  const liveQuizTitles = new Set(liveQuizzes.map((q) => q.title));
  for (const q of revQuizzes) {
    if (!liveQuizTitles.has(q.title)) summary.push(`+ New quiz: ${q.title}`);
  }

  const liveResTitles = new Set(liveResources.map((r) => r.title));
  const revResTitles = new Set(revResources.map((r) => r.title));
  for (const t of revResTitles) {
    if (!liveResTitles.has(t)) summary.push(`+ New resource: ${t}`);
  }
  for (const t of liveResTitles) {
    if (!revResTitles.has(t)) summary.push(`- Removed resource: ${t}`);
  }

  if (!summary.length) summary.push("~ Curriculum or content updates");
  return summary;
}

export async function publishCourse(id: string, actorId: string) {
  const course = await Course.findById(id);
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");

  const rawStatus = String(course.status);
  const underReview =
    isCourseUnderReview(course) ||
    rawStatus === "pending_review" ||
    rawStatus === "academic_approved";

  if (!underReview) {
    throw new AppError(
      400,
      "INVALID_STATUS",
      "Only courses pending review can be published",
    );
  }

  // Draft revision of a live course → merge metadata + move curriculum onto live.
  if (course.liveCourseId) {
    const live = await Course.findById(course.liveCourseId);
    if (!live) {
      throw new AppError(404, "NOT_FOUND", "Live course not found for this draft");
    }
    const changeSummary = await buildChangeSummary(
      String(live._id),
      String(course._id),
    );
    const priorVersions = await CourseRevisionHistory.countDocuments({
      courseId: live._id,
    });

    live.title = course.title;
    live.subtitle = course.subtitle;
    live.description = course.description;
    live.shortDescription = course.shortDescription;
    live.level = course.level;
    live.category = course.category;
    live.language = course.language;
    live.learningOutcomes = course.learningOutcomes;
    live.requirements = course.requirements;
    live.targetAudience = course.targetAudience;
    live.tags = course.tags;
    live.isFree = course.isFree;
    live.priceCents = course.priceCents;
    live.discountPriceCents = course.discountPriceCents;
    live.accessDuration = course.accessDuration;
    live.currency = course.currency;
    live.visibility =
      course.visibility === "private" ? live.visibility : course.visibility;
    live.thumbnailUrl = course.thumbnailUrl;
    live.bannerUrl = course.bannerUrl;
    live.promoVideoUrl = course.promoVideoUrl;
    live.status = "published";
    live.reviewStatus = "approved";
    live.isDisabled = false;
    live.publishedAt = new Date();
    live.rejectionReason = undefined;
    await live.save();

    await Module.deleteMany({ courseId: live._id });
    await Lesson.deleteMany({ courseId: live._id });
    const draftModules = await Module.find({ courseId: course._id }).sort({
      order: 1,
    });
    for (const mod of draftModules) {
      const lessons = await Lesson.find({ moduleId: mod._id }).sort({ order: 1 });
      mod.courseId = live._id;
      await mod.save();
      for (const lesson of lessons) {
        lesson.courseId = live._id;
        await lesson.save();
      }
    }

    await Quiz.updateMany({ courseId: course._id }, { courseId: live._id });
    await Assignment.updateMany({ courseId: course._id }, { courseId: live._id });
    await CourseResource.updateMany(
      { courseId: course._id },
      { courseId: live._id },
    );

    course.status = "archived";
    course.reviewStatus = "approved";
    course.rejectionReason = undefined;
    course.reviewedAt = new Date();
    await course.save();

    await CourseRevisionHistory.create({
      courseId: live._id,
      revisionCourseId: course._id,
      version: priorVersions + 1,
      title: live.title,
      changeSummary,
      publishedBy: actorId,
      publishedAt: new Date(),
    });

    await writeAuditLog({
      actorId,
      action: "courses.publish_changes",
      resource: "Course",
      resourceId: String(live._id),
      meta: { draftId: id, changeSummary },
    });
    return live;
  }

  course.status = "published";
  course.reviewStatus = "approved";
  course.isDisabled = false;
  course.publishedAt = new Date();
  course.reviewedAt = new Date();
  course.rejectionReason = undefined;
  await course.save();
  await writeAuditLog({
    actorId,
    action: "courses.publish",
    resource: "Course",
    resourceId: id,
  });
  return course;
}

/** Academic: publish new course or approved changes (goes live). */
export async function academicApproveCourse(id: string, actorId: string) {
  return publishCourse(id, actorId);
}

/** Academic / SuperAdmin: send course/revision back to instructor as Draft. */
export async function requestCourseChanges(
  id: string,
  actorId: string,
  reason?: string,
) {
  const course = await Course.findById(id);
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");
  const rawStatus = String(course.status);
  if (
    !isCourseUnderReview(course) &&
    rawStatus !== "pending_review" &&
    rawStatus !== "academic_approved"
  ) {
    throw new AppError(
      400,
      "INVALID_STATUS",
      "Only courses in review can receive change requests",
    );
  }
  const feedback = reason?.trim();
  if (!feedback) {
    throw new AppError(
      400,
      "FEEDBACK_REQUIRED",
      "Feedback is required when returning a course to Draft",
    );
  }
  course.status = "draft";
  course.reviewStatus = "changes_requested";
  course.rejectionReason = feedback;
  course.reviewedAt = new Date();
  course.set("submittedAt", undefined);
  await course.save();
  await writeAuditLog({
    actorId,
    action: "courses.request_changes",
    resource: "Course",
    resourceId: id,
    meta: { reason: course.rejectionReason },
  });
  return course;
}

export async function disableCourse(
  id: string,
  actorId: string,
  disabled = true,
) {
  const course = await Course.findById(id);
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");
  const wf = normalizeCourseWorkflow(course);
  if (wf.status !== "published") {
    throw new AppError(
      400,
      "INVALID_STATUS",
      "Only published courses can be disabled",
    );
  }
  if (course.liveCourseId) {
    throw new AppError(400, "INVALID", "Cannot disable a revision draft");
  }
  course.isDisabled = disabled;
  await course.save();
  await writeAuditLog({
    actorId,
    action: disabled ? "courses.disable" : "courses.enable",
    resource: "Course",
    resourceId: id,
  });
  return course;
}

export async function deleteCourse(id: string, actorId: string) {
  const course = await Course.findByIdAndDelete(id);
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");
  await Module.deleteMany({ courseId: id });
  await Lesson.deleteMany({ courseId: id });
  await writeAuditLog({
    actorId,
    action: "courses.delete",
    resource: "Course",
    resourceId: id,
  });
  return { deleted: true };
}

export async function addModule(
  courseId: string,
  input: z.infer<typeof createModuleSchema>,
) {
  const course = await Course.findById(courseId);
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");
  return Module.create({
    courseId,
    title: input.title,
    description: input.description,
    order: input.order ?? 0,
  });
}

export async function addLesson(
  courseId: string,
  moduleId: string,
  input: z.infer<typeof createLessonSchema>,
) {
  const mod = await Module.findOne({ _id: moduleId, courseId });
  if (!mod) throw new AppError(404, "NOT_FOUND", "Module not found");
  return Lesson.create({
    courseId,
    moduleId,
    title: input.title,
    content: input.content,
    videoUrl: input.videoUrl,
    order: input.order ?? 0,
    durationMinutes: input.durationMinutes,
  });
}

export async function updateLesson(
  lessonId: string,
  input: Partial<z.infer<typeof createLessonSchema>>,
) {
  const lesson = await Lesson.findByIdAndUpdate(lessonId, input, { new: true });
  if (!lesson) throw new AppError(404, "NOT_FOUND", "Lesson not found");
  return lesson;
}

export async function deleteLesson(lessonId: string) {
  const lesson = await Lesson.findByIdAndDelete(lessonId);
  if (!lesson) throw new AppError(404, "NOT_FOUND", "Lesson not found");
  return { deleted: true };
}

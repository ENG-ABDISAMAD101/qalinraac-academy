import { courseStatusSchema, paginationQuerySchema } from "@qalinraac/shared";
import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { writeAuditLog } from "../../lib/audit.js";
import { Course } from "../../models/Course.js";
import { Module } from "../../models/Module.js";
import { Lesson } from "../../models/Lesson.js";

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
  if (query.status) filter.status = query.status;
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

export async function publishCourse(id: string, actorId: string) {
  const course = await Course.findById(id);
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");
  course.status = "published";
  course.publishedAt = new Date();
  await course.save();
  await writeAuditLog({
    actorId,
    action: "courses.publish",
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

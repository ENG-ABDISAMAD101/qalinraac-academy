import { Types } from "mongoose";
import { AppError } from "../../lib/app-error.js";
import { Course } from "../../models/Course.js";
import { Lesson } from "../../models/Lesson.js";
import { Module } from "../../models/Module.js";
import { User } from "../../models/User.js";

function formatAccessLabel(access?: string) {
  if (access === "6_months") return "6 Months";
  if (access === "1_year") return "1 Year";
  return "Lifetime";
}

function formatMinutes(totalMinutes: number) {
  const mins = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

async function instructorSummaries(ids: unknown[]) {
  const objectIds = ids.map(String).filter(Boolean);
  if (!objectIds.length) return [];
  const users = await User.find({ _id: { $in: objectIds } })
    .select("fullName avatarUrl email")
    .lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return objectIds.map((id) => {
    const u = byId.get(id);
    return {
      id,
      fullName: u?.fullName ?? "Instructor",
      avatarUrl: u?.avatarUrl,
    };
  });
}

export async function listPublicCourses(opts?: { q?: string }) {
  const filter: Record<string, unknown> = {
    status: "published",
    isDisabled: { $ne: true },
    liveCourseId: { $exists: false },
    visibility: { $in: ["public", "unlisted"] as const },
  };
  const q = opts?.q?.trim();
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
      { shortDescription: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  const courses = await Course.find(filter).sort({ publishedAt: -1, createdAt: -1 });
  const courseIds = courses.map((c) => c._id);
  const lessons = await Lesson.find({ courseId: { $in: courseIds } })
    .select("courseId durationMinutes")
    .lean();

  const durationByCourse = new Map<string, number>();
  const lessonCountByCourse = new Map<string, number>();
  for (const lesson of lessons) {
    const id = String(lesson.courseId);
    lessonCountByCourse.set(id, (lessonCountByCourse.get(id) ?? 0) + 1);
    durationByCourse.set(
      id,
      (durationByCourse.get(id) ?? 0) + (lesson.durationMinutes ?? 0),
    );
  }

  const items = await Promise.all(
    courses.map(async (course) => {
      const id = String(course._id);
      const instructors = await instructorSummaries(course.instructorIds ?? []);
      const totalMinutes = durationByCourse.get(id) ?? 0;
      const priceCents =
        course.discountPriceCents != null && course.discountPriceCents < course.priceCents
          ? course.discountPriceCents
          : course.priceCents;

      return {
        id,
        slug: course.slug,
        title: course.title,
        description: course.shortDescription || course.description || "",
        category: course.category || "General",
        level: course.level || "beginner",
        thumbnailUrl: course.thumbnailUrl,
        priceCents,
        listPriceCents: course.priceCents,
        currency: course.currency || "USD",
        isFree: course.isFree || course.priceCents === 0,
        accessDuration: course.accessDuration ?? "lifetime",
        accessLabel: formatAccessLabel(course.accessDuration),
        durationLabel: totalMinutes > 0 ? formatMinutes(totalMinutes) : formatAccessLabel(course.accessDuration),
        lessonCount: lessonCountByCourse.get(id) ?? 0,
        instructor: instructors[0] ?? null,
        instructors,
      };
    }),
  );

  return { items, total: items.length };
}

export async function getPublicCourse(idOrSlug: string) {
  const publishedFilter = {
    status: "published" as const,
    isDisabled: { $ne: true },
    liveCourseId: { $exists: false },
    visibility: { $in: ["public", "unlisted"] as ("public" | "unlisted")[] },
  };

  let course = await Course.findOne({ ...publishedFilter, slug: idOrSlug });
  if (!course && Types.ObjectId.isValid(idOrSlug)) {
    course = await Course.findOne({ ...publishedFilter, _id: idOrSlug });
  }

  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");

  const [modules, lessons, instructors] = await Promise.all([
    Module.find({ courseId: course._id }).sort({ order: 1 }),
    Lesson.find({ courseId: course._id }).sort({ order: 1 }),
    instructorSummaries(course.instructorIds ?? []),
  ]);

  const lessonsByModule = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    const mid = String(lesson.moduleId);
    const list = lessonsByModule.get(mid) ?? [];
    list.push(lesson);
    lessonsByModule.set(mid, list);
  }

  const totalMinutes = lessons.reduce(
    (sum, l) => sum + (l.durationMinutes ?? 0),
    0,
  );

  const sections = modules.map((mod, index) => {
    const sectionLessons = lessonsByModule.get(String(mod._id)) ?? [];
    const sectionMinutes = sectionLessons.reduce(
      (sum, l) => sum + (l.durationMinutes ?? 0),
      0,
    );
    const freePreviews = sectionLessons.filter((l) => l.isPreview).length;
    return {
      id: String(mod._id),
      index: index + 1,
      title: mod.title,
      description: mod.description,
      lessonCount: sectionLessons.length,
      durationLabel: formatMinutes(sectionMinutes),
      freePreviewCount: freePreviews,
      lessons: sectionLessons.map((l) => ({
        id: String(l._id),
        title: l.title,
        durationMinutes: l.durationMinutes ?? 0,
        durationLabel: formatMinutes(l.durationMinutes ?? 0),
        isPreview: Boolean(l.isPreview),
        contentType: l.contentType ?? "video",
      })),
    };
  });

  const effectivePrice =
    course.discountPriceCents != null &&
    course.discountPriceCents < course.priceCents
      ? course.discountPriceCents
      : course.priceCents;

  return {
    id: String(course._id),
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description || "",
    shortDescription: course.shortDescription || "",
    category: course.category || "General",
    level: course.level || "beginner",
    thumbnailUrl: course.thumbnailUrl,
    promoVideoUrl: course.promoVideoUrl,
    learningOutcomes: course.learningOutcomes ?? [],
    requirements: course.requirements ?? [],
    targetAudience: course.targetAudience ?? [],
    priceCents: effectivePrice,
    listPriceCents: course.priceCents,
    discountPriceCents: course.discountPriceCents,
    currency: course.currency || "USD",
    isFree: course.isFree || course.priceCents === 0,
    accessDuration: course.accessDuration ?? "lifetime",
    accessLabel: formatAccessLabel(course.accessDuration),
    lessonCount: lessons.length,
    sectionCount: modules.length,
    totalMinutes,
    durationLabel: formatMinutes(totalMinutes),
    instructor: instructors[0] ?? null,
    instructors,
    sections,
    included: [
      `${lessons.length} video lesson${lessons.length === 1 ? "" : "s"}`,
      `${formatMinutes(totalMinutes)} of content`,
      "Certificate of completion",
      `${formatAccessLabel(course.accessDuration)} access`,
    ],
  };
}

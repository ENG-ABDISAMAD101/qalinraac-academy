import { Types } from "mongoose";
import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { writeAuditLog } from "../../lib/audit.js";
import { Assignment } from "../../models/Assignment.js";
import { CertificateRequest } from "../../models/CertificateRequest.js";
import { Course } from "../../models/Course.js";
import { CourseResource } from "../../models/CourseResource.js";
import { DiscussionMessage } from "../../models/DiscussionMessage.js";
import { Enrollment } from "../../models/Enrollment.js";
import { InstructorAgreement } from "../../models/InstructorAgreement.js";
import { Lesson } from "../../models/Lesson.js";
import { Module } from "../../models/Module.js";
import { Quiz } from "../../models/Quiz.js";
import { StudentActivation } from "../../models/StudentActivation.js";
import { User } from "../../models/User.js";
import { toPublicUser } from "../auth/auth.service.js";
import {
  publishCourse,
  requestCourseChanges,
} from "../courses/courses.service.js";
import { createNotification } from "../notifications/notifications.service.js";

function oid(id: string, label = "id") {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", `Invalid ${label}`);
  }
  return new Types.ObjectId(id);
}

function money(cents: number, currency = "USD") {
  return { priceCents: cents, currency, price: cents / 100 };
}

function mapUserLite(u: {
  _id: Types.ObjectId;
  fullName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  isActive?: boolean;
}) {
  return {
    id: String(u._id),
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    isActive: u.isActive !== false,
  };
}

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(24).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const createActivationSchema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  priceCents: z.coerce.number().int().min(0),
  currency: z.string().min(3).max(3).default("USD"),
});

export const rejectActivationSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const rejectCourseSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const createAgreementSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(1).max(5000),
  fileUrl: z.string().min(1),
  fileName: z.string().optional(),
  version: z.string().min(1).max(40).default("1.0"),
  effectiveDate: z.string().optional(),
  instructorId: z.string().optional(),
  courseId: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).default("active"),
});

export const updateAgreementSchema = createAgreementSchema.partial();

export const rejectCertSchema = z.object({
  reason: z.string().min(1).max(500),
});

/** Dashboard work-queue stats + pending tables. */
export async function getDashboard() {
  const [
    totalStudents,
    totalInstructors,
    activeCourses,
    draftCourses,
    publishedCourses,
    pendingCourseReviewCount,
    pendingActivationCount,
    pendingCertificateCount,
    pendingCourses,
    pendingActivations,
    pendingCertificates,
  ] = await Promise.all([
    User.countDocuments({ role: "Student" }),
    User.countDocuments({ role: "Instructor" }),
    Course.countDocuments({ status: "published" }),
    Course.countDocuments({ status: "draft" }),
    Course.countDocuments({ status: "published" }),
    Course.countDocuments({ status: "pending_review" }),
    StudentActivation.countDocuments({ status: "pending" }),
    CertificateRequest.countDocuments({ status: "pending" }),
    Course.find({ status: "pending_review" })
      .populate("instructorIds", "fullName email")
      .sort({ submittedAt: -1, updatedAt: -1 })
      .limit(10)
      .lean(),
    StudentActivation.find({ status: "pending" })
      .populate("studentId", "fullName email")
      .populate("courseId", "title priceCents currency")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    CertificateRequest.find({ status: "pending" })
      .populate("userId", "fullName email")
      .populate("courseId", "title instructorIds")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const pendingCourseReviews = pendingCourses.map((c) => {
    const instructors = (c.instructorIds ?? []) as unknown as {
      fullName?: string;
    }[];
    return {
      id: String(c._id),
      course: c.title,
      instructor: instructors.map((i) => i.fullName).filter(Boolean).join(", ") || "—",
      submittedAt: c.submittedAt ?? c.updatedAt,
      status: "Pending Review",
    };
  });

  const pendingActivationRows = pendingActivations.map((a) => {
    const student = a.studentId as unknown as { fullName?: string };
    const course = a.courseId as unknown as {
      title?: string;
      priceCents?: number;
    };
    return {
      id: String(a._id),
      student: student?.fullName ?? "—",
      course: course?.title ?? "—",
      priceCents: a.priceCents,
      currency: a.currency,
      requestedAt: a.createdAt,
      status: "Pending",
    };
  });

  const instructorIds = pendingCertificates.flatMap((c) => {
    const course = c.courseId as unknown as { instructorIds?: Types.ObjectId[] };
    return course?.instructorIds ?? [];
  });
  const instructorDocs = instructorIds.length
    ? await User.find({ _id: { $in: instructorIds } })
        .select("fullName")
        .lean()
    : [];
  const instructorName = new Map(
    instructorDocs.map((u) => [String(u._id), u.fullName]),
  );

  const pendingCertificateRows = await Promise.all(
    pendingCertificates.map(async (cert) => {
      const student = cert.userId as unknown as { fullName?: string };
      const course = cert.courseId as unknown as {
        title?: string;
        instructorIds?: Types.ObjectId[];
      };
      const enrollment = await Enrollment.findById(cert.enrollmentId)
        .select("progressPercent completedAt")
        .lean();
      const names = (course?.instructorIds ?? [])
        .map((id) => instructorName.get(String(id)))
        .filter(Boolean);
      return {
        id: String(cert._id),
        student: student?.fullName ?? "—",
        course: course?.title ?? "—",
        instructor: names.join(", ") || "—",
        completionDate: enrollment?.completedAt ?? cert.createdAt,
        progress: enrollment?.progressPercent ?? 100,
        status: "Pending Review",
      };
    }),
  );

  return {
    stats: {
      totalStudents,
      totalInstructors,
      activeCourses,
      draftCourses,
      publishedCourses,
      pendingCourseReviews: pendingCourseReviewCount,
      pendingActivations: pendingActivationCount,
      pendingCertificates: pendingCertificateCount,
    },
    pendingCourseReviews,
    pendingActivations: pendingActivationRows,
    pendingCertificates: pendingCertificateRows,
  };
}

export async function listStudents(q?: string) {
  const filter: Record<string, unknown> = { role: "Student" };
  if (q?.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ fullName: rx }, { email: rx }, { phone: rx }];
  }
  const students = await User.find(filter)
    .select("fullName email phone isActive createdAt avatarUrl")
    .sort({ fullName: 1 })
    .lean();

  const enrollments = await Enrollment.find({
    userId: { $in: students.map((s) => s._id) },
    status: { $in: ["active", "completed"] },
  })
    .select("userId progressPercent status")
    .lean();

  const byUser = new Map<string, { courses: number; progressSum: number }>();
  for (const e of enrollments) {
    const key = String(e.userId);
    const cur = byUser.get(key) ?? { courses: 0, progressSum: 0 };
    cur.courses += 1;
    cur.progressSum += e.progressPercent ?? 0;
    byUser.set(key, cur);
  }

  return students.map((s) => {
    const agg = byUser.get(String(s._id));
    return {
      id: String(s._id),
      name: s.fullName,
      email: s.email,
      phone: s.phone ?? "—",
      courses: agg?.courses ?? 0,
      progress:
        agg && agg.courses > 0
          ? Math.round(agg.progressSum / agg.courses)
          : 0,
      status: s.isActive ? "Active" : "Disabled",
      avatarUrl: s.avatarUrl,
      registeredAt: s.createdAt,
    };
  });
}

export async function searchStudents(q: string) {
  if (!q.trim() || q.trim().length < 2) return [];
  return listStudents(q);
}

export async function listInstructors(opts?: {
  q?: string;
  filter?: "all" | "active" | "activity";
}) {
  const filter: Record<string, unknown> = { role: "Instructor" };
  if (opts?.filter === "active") filter.isActive = true;
  if (opts?.q?.trim()) {
    const rx = new RegExp(
      opts.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    filter.$or = [{ fullName: rx }, { email: rx }, { phone: rx }];
  }

  const instructors = await User.find(filter)
    .select("fullName email phone isActive avatarUrl createdAt")
    .sort({ fullName: 1 })
    .lean();

  const courses = await Course.find({
    instructorIds: { $in: instructors.map((i) => i._id) },
  })
    .select("title status instructorIds createdAt updatedAt submittedAt publishedAt")
    .lean();

  const courseIds = courses.map((c) => c._id);
  const enrollments = await Enrollment.find({
    courseId: { $in: courseIds },
    status: { $in: ["active", "completed"] },
  })
    .select("courseId progressPercent")
    .lean();

  const studentsByCourse = new Map<string, { count: number; progress: number }>();
  for (const e of enrollments) {
    const key = String(e.courseId);
    const cur = studentsByCourse.get(key) ?? { count: 0, progress: 0 };
    cur.count += 1;
    cur.progress += e.progressPercent ?? 0;
    studentsByCourse.set(key, cur);
  }

  const rows = instructors.map((ins) => {
    const owned = courses.filter((c) =>
      (c.instructorIds ?? []).some((id) => String(id) === String(ins._id)),
    );
    let studentTotal = 0;
    let progressSum = 0;
    let progressN = 0;
    for (const c of owned) {
      const agg = studentsByCourse.get(String(c._id));
      if (agg) {
        studentTotal += agg.count;
        progressSum += agg.progress;
        progressN += agg.count;
      }
    }
    return {
      id: String(ins._id),
      name: ins.fullName,
      email: ins.email,
      phone: ins.phone ?? "—",
      status: ins.isActive ? "Active" : "Disabled",
      courses: owned.length,
      students: studentTotal,
      performance:
        progressN > 0 ? Math.round(progressSum / progressN) : 0,
      avatarUrl: ins.avatarUrl,
    };
  });

  if (opts?.filter === "activity") {
    const activity = courses
      .map((c) => {
        const ins = instructors.find((i) =>
          (c.instructorIds ?? []).some((id) => String(id) === String(i._id)),
        );
        const agg = studentsByCourse.get(String(c._id));
        return {
          id: String(c._id),
          instructor: ins?.fullName ?? "—",
          instructorId: ins ? String(ins._id) : "",
          course: c.title,
          courseStatus: c.status,
          students: agg?.count ?? 0,
          progress:
            agg && agg.count > 0 ? Math.round(agg.progress / agg.count) : 0,
          lastActivity: c.updatedAt,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
      );
    return { instructors: rows, activity };
  }

  return { instructors: rows, activity: [] };
}

export async function getInstructor(instructorId: string) {
  const id = oid(instructorId, "instructorId");
  const instructor = await User.findOne({ _id: id, role: "Instructor" }).lean();
  if (!instructor) throw new AppError(404, "NOT_FOUND", "Instructor not found");

  const courses = await Course.find({ instructorIds: id })
    .select(
      "title status createdAt updatedAt publishedAt submittedAt priceCents currency",
    )
    .sort({ updatedAt: -1 })
    .lean();

  const courseIds = courses.map((c) => c._id);
  const enrollments = await Enrollment.find({
    courseId: { $in: courseIds },
    status: { $in: ["active", "completed"] },
  })
    .populate("userId", "fullName email")
    .lean();

  const byCourse = new Map<string, { students: number; progress: number }>();
  for (const e of enrollments) {
    const key = String(e.courseId);
    const cur = byCourse.get(key) ?? { students: 0, progress: 0 };
    cur.students += 1;
    cur.progress += e.progressPercent ?? 0;
    byCourse.set(key, cur);
  }

  const courseRows = courses.map((c) => {
    const agg = byCourse.get(String(c._id));
    return {
      id: String(c._id),
      name: c.title,
      status: c.status,
      students: agg?.students ?? 0,
      progress:
        agg && agg.students > 0
          ? Math.round(agg.progress / agg.students)
          : 0,
      createdAt: c.createdAt,
    };
  });

  const published = courses.filter((c) => c.status === "published").length;
  const pending = courses.filter((c) => c.status === "pending_review").length;
  const rejected = courses.filter((c) => c.status === "rejected").length;
  const archived = courses.filter((c) => c.status === "archived").length;
  const totalStudents = courseRows.reduce((n, c) => n + c.students, 0);
  const avgProgress =
    courseRows.length > 0
      ? Math.round(
          courseRows.reduce((n, c) => n + c.progress, 0) / courseRows.length,
        )
      : 0;
  const completedEnrollments = enrollments.filter(
    (e) => e.status === "completed" || (e.progressPercent ?? 0) >= 100,
  ).length;
  const completionRate =
    enrollments.length > 0
      ? Math.round((completedEnrollments / enrollments.length) * 100)
      : 0;

  const studentMap = new Map<
    string,
    { name: string; email: string; progress: number; status: string }
  >();
  for (const e of enrollments) {
    const u = e.userId as unknown as {
      _id: Types.ObjectId;
      fullName: string;
      email: string;
    };
    if (!u?._id) continue;
    const key = String(u._id);
    const prev = studentMap.get(key);
    const progress = e.progressPercent ?? 0;
    if (!prev || progress > prev.progress) {
      studentMap.set(key, {
        name: u.fullName,
        email: u.email,
        progress,
        status: e.status,
      });
    }
  }

  return {
    id: String(instructor._id),
    basic: mapUserLite(instructor),
    courses: courseRows,
    students: {
      total: totalStudents,
      active: enrollments.filter((e) => e.status === "active").length,
      completed: completedEnrollments,
      list: [...studentMap.values()],
    },
    performance: {
      totalCourses: courses.length,
      published,
      pending,
      rejected,
      archived,
      totalStudents,
      avgProgress,
      completionRate,
    },
  };
}

export async function listCourses(status?: string) {
  const filter: Record<string, unknown> = {};
  if (status && status !== "all") {
    filter.status = status;
  }
  const courses = await Course.find(filter)
    .populate("instructorIds", "fullName email")
    .sort({ updatedAt: -1 })
    .lean();

  const courseIds = courses.map((c) => c._id);
  const [lessonCounts, enrollmentCounts] = await Promise.all([
    Lesson.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: "$courseId", count: { $sum: 1 } } },
    ]),
    Enrollment.aggregate<{ _id: Types.ObjectId; count: number }>([
      {
        $match: {
          courseId: { $in: courseIds },
          status: { $in: ["active", "completed"] },
        },
      },
      { $group: { _id: "$courseId", count: { $sum: 1 } } },
    ]),
  ]);
  const lessonsMap = new Map(
    lessonCounts.map((r) => [String(r._id), r.count]),
  );
  const studentsMap = new Map(
    enrollmentCounts.map((r) => [String(r._id), r.count]),
  );

  return courses.map((c) => {
    const instructors = (c.instructorIds ?? []) as unknown as {
      fullName?: string;
    }[];
    return {
      id: String(c._id),
      title: c.title,
      instructor:
        instructors.map((i) => i.fullName).filter(Boolean).join(", ") || "—",
      students: studentsMap.get(String(c._id)) ?? 0,
      lessons: lessonsMap.get(String(c._id)) ?? 0,
      status: c.status,
      createdAt: c.createdAt,
      submittedAt: c.submittedAt,
      priceCents: c.priceCents,
      currency: c.currency,
      category: c.category,
      level: c.level,
      thumbnailUrl: c.thumbnailUrl,
    };
  });
}

export async function getCourseReview(courseId: string) {
  const id = oid(courseId, "courseId");
  const course = await Course.findById(id)
    .populate("instructorIds", "fullName email avatarUrl")
    .lean();
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");

  const [modules, lessons, quizzes, assignments, resources, discussions] =
    await Promise.all([
      Module.find({ courseId: id }).sort({ order: 1 }).lean(),
      Lesson.find({ courseId: id }).sort({ order: 1 }).lean(),
      Quiz.find({ courseId: id }).lean(),
      Assignment.find({ courseId: id }).lean(),
      CourseResource.find({ courseId: id }).lean(),
      DiscussionMessage.find({ courseId: id }).sort({ createdAt: 1 }).lean(),
    ]);

  const curriculum = modules.map((m) => ({
    id: String(m._id),
    title: m.title,
    description: m.description,
    order: m.order,
    lessons: lessons
      .filter((l) => String(l.moduleId) === String(m._id))
      .map((l) => ({
        id: String(l._id),
        title: l.title,
        description: l.description ?? l.content,
        videoUrl: l.videoUrl,
        durationMinutes: l.durationMinutes,
        order: l.order,
        quizzes: quizzes
          .filter((q) => String(q.lessonId) === String(l._id))
          .map((q) => ({
            id: String(q._id),
            title: q.title,
            questionCount: q.questions?.length ?? 0,
          })),
        assignments: assignments
          .filter((a) => String(a.lessonId) === String(l._id))
          .map((a) => ({
            id: String(a._id),
            title: a.title,
            dueAt: a.dueAt,
          })),
        resources: resources
          .filter((r) => String(r.lessonId) === String(l._id))
          .map((r) => ({
            id: String(r._id),
            title: r.title,
            fileName: r.originalName,
            mimeType: r.mimeType,
            fileAssetId: String(r.fileAssetId),
          })),
      })),
  }));

  const authorIds = discussions.map((d) => d.authorId);
  const authors = authorIds.length
    ? await User.find({ _id: { $in: authorIds } })
        .select("fullName role")
        .lean()
    : [];
  const authorById = new Map(
    authors.map((u) => [String(u._id), u]),
  );

  return {
    course: {
      id: String(course._id),
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription,
      category: course.category,
      level: course.level,
      language: course.language,
      priceCents: course.priceCents,
      currency: course.currency,
      thumbnailUrl: course.thumbnailUrl,
      bannerUrl: course.bannerUrl,
      status: course.status,
      accessDuration: course.accessDuration,
      learningOutcomes: course.learningOutcomes,
      requirements: course.requirements,
      submittedAt: course.submittedAt,
      rejectionReason: course.rejectionReason,
      instructors: (
        course.instructorIds as unknown as {
          _id: Types.ObjectId;
          fullName: string;
          email: string;
          avatarUrl?: string;
        }[]
      ).map(mapUserLite),
    },
    curriculum,
    counts: {
      modules: modules.length,
      lessons: lessons.length,
      quizzes: quizzes.length,
      assignments: assignments.length,
      resources: resources.length,
    },
    discussions: discussions.map((d) => {
      const author = authorById.get(String(d.authorId));
      return {
        id: String(d._id),
        body: d.body,
        authorName: author?.fullName ?? "—",
        authorRole: author?.role ?? "—",
        createdAt: d.createdAt,
      };
    }),
  };
}

export const setCourseStatusSchema = z.object({
  status: z.enum(["draft", "published"]),
});

/** Academic can set a course to Draft or Published (overrides pending review). */
export async function setCourseStatus(
  courseId: string,
  actorId: string,
  status: "draft" | "published",
) {
  const course = await Course.findById(oid(courseId, "courseId"));
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");

  const previous = course.status;
  course.status = status;
  if (status === "published") {
    course.publishedAt = new Date();
    course.rejectionReason = undefined;
  } else {
    course.rejectionReason = undefined;
  }
  await course.save();

  await writeAuditLog({
    actorId,
    action: "courses.set_status",
    resource: "Course",
    resourceId: courseId,
    meta: { from: previous, to: status },
  });

  for (const id of course.instructorIds ?? []) {
    await createNotification({
      userId: String(id),
      title:
        status === "published" ? "Course published" : "Course set to draft",
      body:
        status === "published"
          ? `“${course.title}” is now published.`
          : `“${course.title}” was moved to draft by Academic.`,
      type: "course",
      meta: { courseId },
    });
  }

  return course;
}

export async function approveCourse(courseId: string, actorId: string) {
  const course = await publishCourse(courseId, actorId);
  const instructors = await User.find({
    _id: { $in: course.instructorIds ?? [] },
  });
  for (const ins of instructors) {
    await createNotification({
      userId: String(ins._id),
      title: "Course published",
      body: `“${course.title}” was approved and is now published.`,
      type: "course",
      meta: { courseId },
    });
  }
  return course;
}

export async function requestChanges(
  courseId: string,
  actorId: string,
  reason?: string,
) {
  const course = await requestCourseChanges(courseId, actorId, reason);
  for (const id of course.instructorIds ?? []) {
    await createNotification({
      userId: String(id),
      title: "Course changes requested",
      body:
        reason?.trim() ||
        `Academic requested changes on “${course.title}”. The course is back in draft.`,
      type: "course",
      meta: { courseId },
    });
  }
  return course;
}

export async function rejectCourse(
  courseId: string,
  actorId: string,
  reason: string,
) {
  const course = await Course.findById(courseId);
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");
  if (course.status !== "pending_review") {
    throw new AppError(
      400,
      "INVALID_STATUS",
      "Only courses pending review can be rejected",
    );
  }
  course.status = "rejected";
  course.rejectionReason = reason.trim();
  await course.save();
  await writeAuditLog({
    actorId,
    action: "courses.reject",
    resource: "Course",
    resourceId: courseId,
    meta: { reason },
  });
  for (const id of course.instructorIds ?? []) {
    await createNotification({
      userId: String(id),
      title: "Course rejected",
      body: reason.trim(),
      type: "course",
      meta: { courseId },
    });
  }
  return course;
}

export async function listActivations(status?: string) {
  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;

  const rows = await StudentActivation.find(filter)
    .populate("studentId", "fullName email phone")
    .populate("courseId", "title")
    .sort({ createdAt: -1 })
    .lean();

  return Promise.all(
    rows.map(async (a) => {
      const student = a.studentId as unknown as {
        fullName?: string;
        email?: string;
      };
      const course = a.courseId as unknown as { title?: string };
      let progress = 0;
      if (a.enrollmentId) {
        const enr = await Enrollment.findById(a.enrollmentId)
          .select("progressPercent status")
          .lean();
        progress = enr?.progressPercent ?? 0;
        if (enr?.status === "completed" && a.status === "active") {
          // keep UI status from activation unless completed
        }
      }
      return {
        id: String(a._id),
        student: student?.fullName ?? "—",
        studentEmail: student?.email,
        course: course?.title ?? "—",
        ...money(a.priceCents, a.currency),
        progress,
        activationDate: a.activatedAt ?? a.reviewedAt,
        requestedAt: a.createdAt,
        status: a.status,
        rejectionReason: a.rejectionReason,
      };
    }),
  );
}

export async function getActivation(activationId: string) {
  const a = await StudentActivation.findById(oid(activationId))
    .populate("studentId", "fullName email phone avatarUrl")
    .populate("courseId", "title status priceCents currency")
    .populate("requestedBy", "fullName email")
    .populate("reviewedBy", "fullName email")
    .lean();
  if (!a) throw new AppError(404, "NOT_FOUND", "Activation not found");

  let progress = 0;
  let enrollmentStatus: string | undefined;
  if (a.enrollmentId) {
    const enr = await Enrollment.findById(a.enrollmentId).lean();
    progress = enr?.progressPercent ?? 0;
    enrollmentStatus = enr?.status;
  }

  return {
    id: String(a._id),
    student: mapUserLite(a.studentId as never),
    course: a.courseId,
    ...money(a.priceCents, a.currency),
    status: a.status,
    progress,
    enrollmentStatus,
    requestedBy: a.requestedBy,
    reviewedBy: a.reviewedBy,
    requestedAt: a.createdAt,
    reviewedAt: a.reviewedAt,
    activatedAt: a.activatedAt,
    rejectionReason: a.rejectionReason,
  };
}

export async function createActivation(
  actorId: string,
  input: z.infer<typeof createActivationSchema>,
) {
  const studentId = oid(input.studentId, "studentId");
  const courseId = oid(input.courseId, "courseId");

  const student = await User.findOne({ _id: studentId, role: "Student" });
  if (!student) {
    throw new AppError(404, "NOT_FOUND", "Existing student account required");
  }
  const course = await Course.findById(courseId);
  if (!course || course.status !== "published") {
    throw new AppError(400, "INVALID_COURSE", "Select a published course");
  }

  const existingPending = await StudentActivation.findOne({
    studentId,
    courseId,
    status: { $in: ["pending", "approved", "active"] },
  });
  if (existingPending) {
    throw new AppError(
      409,
      "EXISTS",
      "An activation already exists for this student and course",
    );
  }

  const existingEnrollment = await Enrollment.findOne({
    userId: studentId,
    courseId,
    status: { $in: ["active", "completed"] },
  });
  if (existingEnrollment) {
    throw new AppError(409, "ENROLLED", "Student already has this course active");
  }

  const activation = await StudentActivation.create({
    studentId,
    courseId,
    priceCents: input.priceCents,
    currency: input.currency ?? "USD",
    status: "pending",
    requestedBy: actorId,
  });

  await writeAuditLog({
    actorId,
    action: "activations.request",
    resource: "StudentActivation",
    resourceId: String(activation._id),
  });

  const supers = await User.find({ role: "SuperAdmin", isActive: true }).select(
    "_id",
  );
  for (const sa of supers) {
    await createNotification({
      userId: String(sa._id),
      title: "Student activation request",
      body: `${student.fullName} → ${course.title} needs Super Admin approval.`,
      type: "enrollment",
      meta: { activationId: String(activation._id) },
    });
  }

  return getActivation(String(activation._id));
}

/** Super Admin final approval → unlock enrollment. */
export async function approveActivation(activationId: string, actorId: string) {
  const activation = await StudentActivation.findById(oid(activationId));
  if (!activation) throw new AppError(404, "NOT_FOUND", "Activation not found");
  if (activation.status !== "pending") {
    throw new AppError(400, "INVALID_STATUS", "Only pending activations can be approved");
  }

  let enrollment = await Enrollment.findOne({
    userId: activation.studentId,
    courseId: activation.courseId,
  });
  if (!enrollment) {
    enrollment = await Enrollment.create({
      userId: activation.studentId,
      courseId: activation.courseId,
      status: "active",
      unlockedAt: new Date(),
      enrolledAt: new Date(),
    });
  } else {
    enrollment.status = "active";
    enrollment.unlockedAt = new Date();
    await enrollment.save();
  }

  activation.status = "active";
  activation.reviewedBy = oid(actorId);
  activation.reviewedAt = new Date();
  activation.activatedAt = new Date();
  activation.enrollmentId = enrollment._id;
  await activation.save();

  await writeAuditLog({
    actorId,
    action: "activations.approve",
    resource: "StudentActivation",
    resourceId: activationId,
  });

  await createNotification({
    userId: String(activation.studentId),
    title: "Course activated",
    body: "Your course has been activated. You can start learning.",
    type: "enrollment",
    meta: { activationId, courseId: String(activation.courseId) },
  });

  return getActivation(activationId);
}

export async function rejectActivation(
  activationId: string,
  actorId: string,
  reason: string,
) {
  const activation = await StudentActivation.findById(oid(activationId));
  if (!activation) throw new AppError(404, "NOT_FOUND", "Activation not found");
  if (activation.status !== "pending") {
    throw new AppError(400, "INVALID_STATUS", "Only pending activations can be rejected");
  }
  activation.status = "rejected";
  activation.rejectionReason = reason.trim();
  activation.reviewedBy = oid(actorId);
  activation.reviewedAt = new Date();
  await activation.save();

  await writeAuditLog({
    actorId,
    action: "activations.reject",
    resource: "StudentActivation",
    resourceId: activationId,
    meta: { reason },
  });

  await createNotification({
    userId: String(activation.requestedBy),
    title: "Activation rejected",
    body: reason.trim(),
    type: "enrollment",
    meta: { activationId },
  });

  return getActivation(activationId);
}

function certStatusLabel(status: string) {
  if (status === "pending") return "Pending Review";
  if (status === "approved") return "Approved";
  if (status === "issued") return "Ready";
  if (status === "rejected") return "Rejected";
  return status;
}

export async function listCertificates(status?: string) {
  const filter: Record<string, unknown> = {};
  if (status && status !== "all") {
    if (status === "pending_review" || status === "Pending Review") {
      filter.status = "pending";
    } else if (status === "ready" || status === "Ready") {
      filter.status = "issued";
    } else {
      filter.status = status;
    }
  }

  const rows = await CertificateRequest.find(filter)
    .populate("userId", "fullName email")
    .populate("courseId", "title instructorIds")
    .sort({ createdAt: -1 })
    .lean();

  const instructorIds = rows.flatMap((r) => {
    const c = r.courseId as unknown as { instructorIds?: Types.ObjectId[] };
    return c?.instructorIds ?? [];
  });
  const instructors = instructorIds.length
    ? await User.find({ _id: { $in: instructorIds } }).select("fullName").lean()
    : [];
  const nameById = new Map(instructors.map((u) => [String(u._id), u.fullName]));

  return Promise.all(
    rows.map(async (cert) => {
      const student = cert.userId as unknown as { fullName?: string; email?: string };
      const course = cert.courseId as unknown as {
        title?: string;
        instructorIds?: Types.ObjectId[];
      };
      const enrollment = await Enrollment.findById(cert.enrollmentId)
        .select("progressPercent completedAt")
        .lean();
      return {
        id: String(cert._id),
        student: student?.fullName ?? "—",
        studentEmail: student?.email,
        course: course?.title ?? "—",
        instructor:
          (course?.instructorIds ?? [])
            .map((id) => nameById.get(String(id)))
            .filter(Boolean)
            .join(", ") || "—",
        completionDate: enrollment?.completedAt ?? cert.createdAt,
        progress: enrollment?.progressPercent ?? 100,
        certificateNumber: `QA-${String(cert._id).slice(-8).toUpperCase()}`,
        status: certStatusLabel(cert.status),
        rawStatus: cert.status,
        rejectionReason: cert.rejectionReason,
        createdAt: cert.createdAt,
      };
    }),
  );
}

export async function getCertificate(certId: string) {
  const cert = await CertificateRequest.findById(oid(certId))
    .populate("userId", "fullName email phone avatarUrl")
    .populate("courseId", "title instructorIds status")
    .lean();
  if (!cert) throw new AppError(404, "NOT_FOUND", "Certificate request not found");

  const course = cert.courseId as unknown as {
    _id: Types.ObjectId;
    title: string;
    instructorIds?: Types.ObjectId[];
  };
  const instructors = await User.find({
    _id: { $in: course?.instructorIds ?? [] },
  })
    .select("fullName email")
    .lean();
  const enrollment = await Enrollment.findById(cert.enrollmentId).lean();
  const [lessonTotal, lessonDone, quizTotal, assignmentTotal] = await Promise.all([
    Lesson.countDocuments({ courseId: course._id }),
    Enrollment.exists({ _id: cert.enrollmentId }),
    Quiz.countDocuments({ courseId: course._id }),
    Assignment.countDocuments({ courseId: course._id }),
  ]);
  void lessonDone;

  return {
    id: String(cert._id),
    student: mapUserLite(cert.userId as never),
    course: {
      id: String(course._id),
      title: course.title,
    },
    instructors: instructors.map(mapUserLite),
    completionDate: enrollment?.completedAt ?? cert.createdAt,
    progress: enrollment?.progressPercent ?? 0,
    certificateNumber: `QA-${String(cert._id).slice(-8).toUpperCase()}`,
    status: certStatusLabel(cert.status),
    rawStatus: cert.status,
    recipientName: cert.recipientName,
    rejectionReason: cert.rejectionReason,
    fileUrl: cert.fileUrl,
    verification: {
      lessons: lessonTotal,
      quizzes: quizTotal,
      assignments: assignmentTotal,
      progressPercent: enrollment?.progressPercent ?? 0,
      enrollmentStatus: enrollment?.status,
    },
  };
}

export async function approveCertificate(certId: string, actorId: string) {
  const cert = await CertificateRequest.findById(oid(certId));
  if (!cert) throw new AppError(404, "NOT_FOUND", "Certificate request not found");
  if (cert.status !== "pending") {
    throw new AppError(400, "INVALID_STATUS", "Only pending requests can be approved");
  }
  cert.status = "approved";
  await cert.save();
  await writeAuditLog({
    actorId,
    action: "certificates.approve",
    resource: "CertificateRequest",
    resourceId: certId,
  });
  await createNotification({
    userId: String(cert.userId),
    title: "Certificate approved",
    body: "Your certificate was approved and is being processed.",
    type: "certificate",
    meta: { certificateRequestId: certId },
  });
  return getCertificate(certId);
}

export async function markCertificateReady(certId: string, actorId: string) {
  const cert = await CertificateRequest.findById(oid(certId));
  if (!cert) throw new AppError(404, "NOT_FOUND", "Certificate request not found");
  if (!["pending", "approved"].includes(cert.status)) {
    throw new AppError(400, "INVALID_STATUS", "Cannot mark this certificate ready");
  }
  cert.status = "issued";
  cert.filePath = cert.filePath ?? `certificates/${certId}.pdf`;
  cert.fileUrl = cert.fileUrl ?? cert.filePath;
  cert.issuedAt = new Date();
  cert.issuedBy = oid(actorId);
  await cert.save();
  await writeAuditLog({
    actorId,
    action: "certificates.ready",
    resource: "CertificateRequest",
    resourceId: certId,
  });
  await createNotification({
    userId: String(cert.userId),
    title: "Certificate ready",
    body: "Your course certificate is ready to download.",
    type: "certificate",
    meta: { certificateRequestId: certId },
  });
  return getCertificate(certId);
}

export async function rejectCertificate(
  certId: string,
  actorId: string,
  reason: string,
) {
  const cert = await CertificateRequest.findById(oid(certId));
  if (!cert) throw new AppError(404, "NOT_FOUND", "Certificate request not found");
  cert.status = "rejected";
  cert.rejectionReason = reason.trim();
  await cert.save();
  await writeAuditLog({
    actorId,
    action: "certificates.reject",
    resource: "CertificateRequest",
    resourceId: certId,
    meta: { reason },
  });
  await createNotification({
    userId: String(cert.userId),
    title: "Certificate rejected",
    body: reason.trim(),
    type: "certificate",
    meta: { certificateRequestId: certId },
  });
  return getCertificate(certId);
}

export async function listAgreements() {
  const rows = await InstructorAgreement.find()
    .populate("instructorId", "fullName email")
    .populate("createdBy", "fullName email")
    .sort({ createdAt: -1 })
    .lean();

  return rows.map((a) => ({
    id: String(a._id),
    title: a.courseTitle,
    description: a.description,
    version: a.version,
    effectiveDate: a.effectiveDate ?? a.createdAt,
    uploadedBy:
      (a.createdBy as unknown as { fullName?: string })?.fullName ?? "—",
    uploadedAt: a.createdAt,
    status: a.status ?? (a.isActive ? "active" : "archived"),
    fileUrl: a.fileUrl,
    fileName: a.fileName,
    instructor: a.instructorId
      ? mapUserLite(a.instructorId as never)
      : null,
  }));
}

export async function createAgreement(
  actorId: string,
  input: z.infer<typeof createAgreementSchema>,
) {
  const doc = await InstructorAgreement.create({
    courseTitle: input.title,
    description: input.description,
    fileUrl: input.fileUrl,
    fileName: input.fileName,
    version: input.version,
    effectiveDate: input.effectiveDate
      ? new Date(input.effectiveDate)
      : new Date(),
    instructorId: input.instructorId
      ? oid(input.instructorId, "instructorId")
      : undefined,
    courseId: input.courseId ? oid(input.courseId, "courseId") : undefined,
    status: input.status,
    isActive: input.status !== "archived",
    createdBy: actorId,
  });

  if (input.instructorId) {
    await createNotification({
      userId: input.instructorId,
      title: "Instructor agreement updated",
      body: `A new agreement “${input.title}” is available to view and download.`,
      type: "system",
      meta: { agreementId: String(doc._id) },
    });
  }

  await writeAuditLog({
    actorId,
    action: "agreements.create",
    resource: "InstructorAgreement",
    resourceId: String(doc._id),
  });

  return listAgreements().then((all) =>
    all.find((a) => a.id === String(doc._id)),
  );
}

export async function updateAgreement(
  agreementId: string,
  actorId: string,
  input: z.infer<typeof updateAgreementSchema>,
) {
  const doc = await InstructorAgreement.findById(oid(agreementId));
  if (!doc) throw new AppError(404, "NOT_FOUND", "Agreement not found");

  if (input.title != null) doc.courseTitle = input.title;
  if (input.description != null) doc.description = input.description;
  if (input.fileUrl != null) doc.fileUrl = input.fileUrl;
  if (input.fileName != null) doc.fileName = input.fileName;
  if (input.version != null) doc.version = input.version;
  if (input.effectiveDate != null) {
    doc.effectiveDate = new Date(input.effectiveDate);
  }
  if (input.instructorId != null) {
    doc.instructorId = input.instructorId
      ? oid(input.instructorId)
      : undefined;
  }
  if (input.status != null) {
    doc.status = input.status;
    doc.isActive = input.status !== "archived";
  }
  await doc.save();

  await writeAuditLog({
    actorId,
    action: "agreements.update",
    resource: "InstructorAgreement",
    resourceId: agreementId,
  });

  if (doc.instructorId) {
    await createNotification({
      userId: String(doc.instructorId),
      title: "Instructor agreement updated",
      body: `Agreement “${doc.courseTitle}” was updated.`,
      type: "system",
      meta: { agreementId },
    });
  }

  const all = await listAgreements();
  return all.find((a) => a.id === agreementId);
}

export async function getReports() {
  const [
    totalStudents,
    activeStudents,
    instructors,
    courses,
    certificates,
  ] = await Promise.all([
    User.countDocuments({ role: "Student" }),
    User.countDocuments({ role: "Student", isActive: true }),
    User.find({ role: "Instructor" }).select("_id isActive").lean(),
    Course.find().select("status").lean(),
    CertificateRequest.find().select("status").lean(),
  ]);

  const enrollments = await Enrollment.find({
    status: { $in: ["active", "completed"] },
  })
    .select("progressPercent status")
    .lean();

  const completedStudents = enrollments.filter(
    (e) => e.status === "completed" || e.progressPercent >= 100,
  ).length;
  const avgProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((n, e) => n + (e.progressPercent ?? 0), 0) /
            enrollments.length,
        )
      : 0;

  return {
    students: {
      total: totalStudents,
      active: activeStudents,
      completed: completedStudents,
      avgProgress,
      enrollments: enrollments.length,
      completionRate:
        enrollments.length > 0
          ? Math.round((completedStudents / enrollments.length) * 100)
          : 0,
    },
    instructors: {
      total: instructors.length,
      active: instructors.filter((i) => i.isActive).length,
      published: courses.filter((c) => c.status === "published").length,
      pending: courses.filter((c) => c.status === "pending_review").length,
      draft: courses.filter((c) => c.status === "draft").length,
      totalStudents: enrollments.length,
    },
    courses: {
      total: courses.filter((c) =>
        ["draft", "pending_review", "published"].includes(c.status),
      ).length,
      published: courses.filter((c) => c.status === "published").length,
      pending: courses.filter((c) => c.status === "pending_review").length,
      draft: courses.filter((c) => c.status === "draft").length,
    },
    certificates: {
      total: certificates.filter((c) => c.status !== "rejected").length,
      pending: certificates.filter((c) => c.status === "pending").length,
      approved: certificates.filter((c) => c.status === "approved").length,
      ready: certificates.filter((c) => c.status === "issued").length,
    },
  };
}

export async function updateProfile(
  userId: string,
  input: z.infer<typeof updateProfileSchema>,
) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  if (input.fullName != null) user.fullName = input.fullName;
  if (input.phone != null) user.phone = input.phone;
  if (input.bio != null) user.bio = input.bio;
  if (input.avatarUrl !== undefined) {
    user.avatarUrl = input.avatarUrl || undefined;
  }
  await user.save();
  return toPublicUser(user);
}

export async function listPublishedCoursesForActivation() {
  const courses = await Course.find({ status: "published" })
    .select("title priceCents currency")
    .sort({ title: 1 })
    .lean();
  return courses.map((c) => ({
    id: String(c._id),
    title: c.title,
    priceCents: c.priceCents,
    currency: c.currency,
  }));
}

import { Types } from "mongoose";
import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { Assignment } from "../../models/Assignment.js";
import { CertificateRequest } from "../../models/CertificateRequest.js";
import { Course } from "../../models/Course.js";
import { CourseResource } from "../../models/CourseResource.js";
import { DiscussionMessage } from "../../models/DiscussionMessage.js";
import { Enrollment } from "../../models/Enrollment.js";
import { Invoice } from "../../models/Invoice.js";
import { Lesson } from "../../models/Lesson.js";
import { Module } from "../../models/Module.js";
import { Notification } from "../../models/Notification.js";
import { Payment } from "../../models/Payment.js";
import { Progress } from "../../models/Progress.js";
import { Quiz } from "../../models/Quiz.js";
import { QuizAttempt } from "../../models/QuizAttempt.js";
import { Submission } from "../../models/Submission.js";
import { SupportTicket } from "../../models/SupportTicket.js";
import { User } from "../../models/User.js";
import { toPublicUser } from "../auth/auth.service.js";

type PopulatedCourse = {
  _id: Types.ObjectId;
  title: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  status?: string;
  instructorIds?: Types.ObjectId[];
};

type FeedbackStatus =
  | "pending"
  | "reviewed"
  | "need_revision"
  | "passed"
  | "failed";

const ASSIGNMENT_PASS_RATIO = 0.7;

function courseFromEnrollment(courseId: unknown): PopulatedCourse | null {
  if (!courseId || typeof courseId !== "object" || !("_id" in courseId)) {
    return null;
  }
  return courseId as PopulatedCourse;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Consecutive calendar days (ending today or yesterday) with lesson completions. */
function computeStreak(completedAts: Date[]) {
  if (completedAts.length === 0) return 0;
  const days = new Set(completedAts.map(dayKey));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  const todayKey = dayKey(cursor);
  const yesterday = new Date(cursor);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dayKey(yesterday);

  if (!days.has(todayKey) && !days.has(yesterdayKey)) return 0;

  if (!days.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function weeklyActivity(completedAts: Date[]) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday

  for (const at of completedAts) {
    if (at < start) continue;
    const idx = (at.getDay() + 6) % 7;
    counts[idx] += 1;
  }

  return labels.map((range, i) => ({
    range,
    hours: counts[i],
  }));
}

function requireObjectId(id: string, label = "id") {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", `Invalid ${label}`);
  }
  return new Types.ObjectId(id);
}

async function getActiveEnrollment(userId: string, courseId: string) {
  const enrollment = await Enrollment.findOne({
    userId,
    courseId,
    status: { $in: ["active", "completed"] },
  }).lean();
  if (!enrollment) {
    throw new AppError(403, "NOT_ENROLLED", "Active enrollment required");
  }
  return enrollment;
}

async function getEnrolledCourseIds(userId: string) {
  const enrollments = await Enrollment.find({
    userId,
    status: { $in: ["active", "completed"] },
  })
    .select("courseId")
    .lean();
  return enrollments.map((e) => e.courseId);
}

function mapInstructor(user: {
  _id: Types.ObjectId;
  fullName: string;
  avatarUrl?: string;
}) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  };
}

/** Narrow a populated lean ref (ObjectId | doc) to a typed doc when populated. */
function populatedDoc<T extends { _id: Types.ObjectId }>(
  value: unknown,
): T | null {
  if (!value || typeof value !== "object") return null;
  if (value instanceof Types.ObjectId) return null;
  if (!("_id" in value)) return null;
  return value as T;
}

function quizFeedbackStatus(attempt: { passed: boolean } | undefined): FeedbackStatus {
  if (!attempt) return "pending";
  return attempt.passed ? "passed" : "failed";
}

function assignmentFeedbackStatus(submission: {
  status: string;
  score?: number;
  maxScore: number;
} | null): FeedbackStatus {
  if (!submission) return "pending";
  if (submission.status === "returned") return "need_revision";
  if (submission.status === "submitted") return "pending";
  if (submission.status === "graded") {
    const max = submission.maxScore || 100;
    const score = submission.score ?? 0;
    if (max > 0 && score / max >= ASSIGNMENT_PASS_RATIO) return "reviewed";
    return "need_revision";
  }
  return "pending";
}

function isApprovedStatus(status: FeedbackStatus) {
  return status === "passed" || status === "reviewed";
}

function isNeedRevisionStatus(status: FeedbackStatus) {
  return status === "need_revision" || status === "failed";
}

export async function getStudentDashboard(userId: string) {
  const userObjectId = new Types.ObjectId(userId);

  const enrollments = await Enrollment.find({
    userId: userObjectId,
    status: { $in: ["active", "completed"] },
  })
    .populate("courseId")
    .sort({ updatedAt: -1 })
    .lean();

  const courseIds = enrollments
    .map((e) => courseFromEnrollment(e.courseId)?._id)
    .filter(Boolean) as Types.ObjectId[];

  const [
    lessons,
    progressRows,
    certs,
    quizzes,
    attempts,
    notifications,
  ] = await Promise.all([
    courseIds.length
      ? Lesson.find({ courseId: { $in: courseIds } }).lean()
      : Promise.resolve([]),
    Progress.find({ userId: userObjectId, completed: true }).lean(),
    CertificateRequest.find({
      userId: userObjectId,
      status: { $in: ["approved", "issued"] },
    }).lean(),
    courseIds.length
      ? Quiz.find({ courseId: { $in: courseIds } }).sort({ createdAt: 1 }).lean()
      : Promise.resolve([]),
    QuizAttempt.find({ userId: userObjectId }).lean(),
    Notification.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const lessonCountByCourse = new Map<string, number>();
  for (const lesson of lessons) {
    const key = String(lesson.courseId);
    lessonCountByCourse.set(key, (lessonCountByCourse.get(key) ?? 0) + 1);
  }

  const completedLessons = progressRows.length;
  const totalLessons = lessons.length;
  const remainingLessons = Math.max(totalLessons - completedLessons, 0);

  const activeCourses = enrollments.filter((e) => e.status === "active").length;
  const completedCourses = enrollments.filter(
    (e) => e.status === "completed" || e.progressPercent >= 100,
  ).length;

  const overallProgress =
    enrollments.length === 0
      ? 0
      : Math.round(
          enrollments.reduce((sum, e) => sum + (e.progressPercent ?? 0), 0) /
            enrollments.length,
        );

  const latestAttempts = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    const key = String(attempt.quizId);
    const prev = latestAttempts.get(key);
    if (!prev || attempt.createdAt > prev.createdAt) {
      latestAttempts.set(key, attempt);
    }
  }

  const attemptPercents: number[] = [];
  for (const attempt of latestAttempts.values()) {
    if (attempt.maxScore > 0) {
      attemptPercents.push(
        Math.round((attempt.score / attempt.maxScore) * 100),
      );
    }
  }
  const quizAverage =
    attemptPercents.length === 0
      ? null
      : Math.round(
          attemptPercents.reduce((a, b) => a + b, 0) / attemptPercents.length,
        );

  const finishedQuizIds = new Set(
    [...latestAttempts.entries()]
      .filter(([, a]) => a.passed)
      .map(([id]) => id),
  );

  const startedCourseIds = new Set(
    enrollments
      .filter(
        (e) =>
          (e.progressPercent ?? 0) > 0 ||
          progressRows.some(
            (p) =>
              String(p.courseId) ===
              String(courseFromEnrollment(e.courseId)?._id),
          ),
      )
      .map((e) => String(courseFromEnrollment(e.courseId)?._id))
      .filter((id) => id !== "undefined"),
  );

  const courseTitleById = new Map<string, string>();
  for (const e of enrollments) {
    const c = courseFromEnrollment(e.courseId);
    if (c) courseTitleById.set(String(c._id), c.title);
  }

  const lessonTitleById = new Map(
    lessons.map((l) => [String(l._id), l.title] as const),
  );

  const upcomingQuizzes = quizzes
    .filter((q) => startedCourseIds.has(String(q.courseId)))
    .filter((q) => !finishedQuizIds.has(String(q._id)))
    .slice(0, 2)
    .map((q) => ({
      id: String(q._id),
      title: q.title,
      courseId: String(q.courseId),
      courseTitle: courseTitleById.get(String(q.courseId)) ?? "Course",
      lessonTitle: q.lessonId
        ? lessonTitleById.get(String(q.lessonId))
        : undefined,
    }));

  const continueEnrollment =
    enrollments.find(
      (e) => e.status === "active" && (e.progressPercent ?? 0) < 100,
    ) ??
    enrollments.find((e) => e.status === "active") ??
    null;

  const continueCourseRaw = continueEnrollment
    ? courseFromEnrollment(continueEnrollment.courseId)
    : null;

  const continueCourse = continueCourseRaw
    ? {
        id: String(continueCourseRaw._id),
        title: continueCourseRaw.title,
        thumbnailUrl: continueCourseRaw.thumbnailUrl,
        progressPercent: continueEnrollment?.progressPercent ?? 0,
        description: continueCourseRaw.description,
      }
    : null;

  const instructorIdSet = new Set<string>();
  for (const e of enrollments) {
    if (e.status !== "active") continue;
    const first = courseFromEnrollment(e.courseId)?.instructorIds?.[0];
    if (first) instructorIdSet.add(String(first));
  }

  const instructors = instructorIdSet.size
    ? await User.find({
        _id: { $in: [...instructorIdSet].map((id) => new Types.ObjectId(id)) },
      })
        .select("fullName avatarUrl")
        .lean()
    : [];

  const instructorById = new Map(
    instructors.map((u) => [String(u._id), mapInstructor(u)] as const),
  );

  const learningCourses = enrollments
    .filter((e) => e.status === "active")
    .slice(0, 4)
    .flatMap((e) => {
      const c = courseFromEnrollment(e.courseId);
      if (!c) return [];
      const total = lessonCountByCourse.get(String(c._id)) ?? 0;
      const watched = progressRows.filter(
        (p) => String(p.courseId) === String(c._id),
      ).length;
      const firstInstructorId = c.instructorIds?.[0]
        ? String(c.instructorIds[0])
        : undefined;
      return [
        {
          id: String(e._id),
          courseId: String(c._id),
          title: c.title,
          thumbnailUrl: c.thumbnailUrl,
          progressPercent: e.progressPercent ?? 0,
          watched,
          total,
          instructor: firstInstructorId
            ? instructorById.get(firstInstructorId) ?? null
            : null,
        },
      ];
    });

  const completedAts = progressRows
    .map((p) => p.completedAt ?? p.updatedAt)
    .filter(Boolean) as Date[];

  return {
    continueCourse,
    stats: {
      activeCourses,
      completedCourses,
      certificates: certs.length,
      quizAverage,
      overallProgress,
      streakDays: computeStreak(completedAts),
      completedLessons,
      remainingLessons,
    },
    learningCourses,
    upcomingQuizzes,
    activity: weeklyActivity(completedAts),
    notifications: notifications.map((n) => ({
      id: String(n._id),
      title: n.title,
      body: n.body,
      type: n.type,
      read: Boolean(n.readAt),
      createdAt: n.createdAt,
    })),
  };
}

export async function getMyCourses(userId: string) {
  const userObjectId = new Types.ObjectId(userId);

  const enrollments = await Enrollment.find({
    userId: userObjectId,
    status: { $in: ["active", "completed"] },
  })
    .populate("courseId", "title thumbnailUrl description instructorIds")
    .sort({ updatedAt: -1 })
    .lean();

  const courseIds = enrollments
    .map((e) => courseFromEnrollment(e.courseId)?._id)
    .filter(Boolean) as Types.ObjectId[];

  const instructorIdSet = new Set<string>();
  for (const e of enrollments) {
    const course = courseFromEnrollment(e.courseId);
    const first = course?.instructorIds?.[0];
    if (first) instructorIdSet.add(String(first));
  }

  const [instructors, lessons, progressRows] = await Promise.all([
    instructorIdSet.size
      ? User.find({
          _id: {
            $in: [...instructorIdSet].map((id) => new Types.ObjectId(id)),
          },
        })
          .select("fullName avatarUrl")
          .lean()
      : Promise.resolve([]),
    courseIds.length
      ? Lesson.find({ courseId: { $in: courseIds } })
          .select("courseId")
          .lean()
      : Promise.resolve([]),
    Progress.find({ userId: userObjectId, completed: true })
      .select("courseId")
      .lean(),
  ]);

  const instructorById = new Map(
    instructors.map((u) => [String(u._id), mapInstructor(u)] as const),
  );

  const lessonCountByCourse = new Map<string, number>();
  for (const lesson of lessons) {
    const key = String(lesson.courseId);
    lessonCountByCourse.set(key, (lessonCountByCourse.get(key) ?? 0) + 1);
  }

  const watchedByCourse = new Map<string, number>();
  for (const row of progressRows) {
    const key = String(row.courseId);
    watchedByCourse.set(key, (watchedByCourse.get(key) ?? 0) + 1);
  }

  return enrollments.flatMap((e) => {
    const course = courseFromEnrollment(e.courseId);
    if (!course) return [];
    const courseId = String(course._id);
    const firstInstructorId = course.instructorIds?.[0]
      ? String(course.instructorIds[0])
      : undefined;
    return [
      {
        id: String(e._id),
        courseId,
        status: e.status,
        progressPercent: e.progressPercent ?? 0,
        watched: watchedByCourse.get(courseId) ?? 0,
        total: lessonCountByCourse.get(courseId) ?? 0,
        course: {
          id: courseId,
          title: course.title,
          thumbnailUrl: course.thumbnailUrl,
          description: course.description,
        },
        instructor: firstInstructorId
          ? instructorById.get(firstInstructorId) ?? null
          : null,
      },
    ];
  });
}

export async function getLearnCourse(userId: string, courseId: string) {
  requireObjectId(courseId, "courseId");
  const userObjectId = new Types.ObjectId(userId);
  const enrollment = await getActiveEnrollment(userId, courseId);

  const courseDoc = await Course.findById(courseId)
    .select("title description thumbnailUrl instructorIds")
    .lean();
  if (!courseDoc) throw new AppError(404, "NOT_FOUND", "Course not found");

  const [modules, lessons, progressRows, quizzes, assignments, instructors] =
    await Promise.all([
      Module.find({ courseId }).sort({ order: 1 }).lean(),
      Lesson.find({ courseId }).sort({ order: 1 }).lean(),
      Progress.find({
        userId: userObjectId,
        courseId,
        completed: true,
      }).lean(),
      Quiz.find({ courseId }).sort({ createdAt: 1 }).lean(),
      Assignment.find({ courseId }).sort({ createdAt: 1 }).lean(),
      courseDoc.instructorIds?.length
        ? User.find({ _id: { $in: courseDoc.instructorIds } })
            .select("fullName avatarUrl")
            .lean()
        : Promise.resolve([]),
    ]);

  const completedLessonIds = progressRows.map((p) => String(p.lessonId));
  const completedSet = new Set(completedLessonIds);

  const lessonsByModule = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    const key = String(lesson.moduleId);
    const list = lessonsByModule.get(key) ?? [];
    list.push(lesson);
    lessonsByModule.set(key, list);
  }

  const quizSummary = (q: (typeof quizzes)[number]) => ({
    id: String(q._id),
    title: q.title,
    description: q.description,
    lessonId: q.lessonId ? String(q.lessonId) : undefined,
    passingScore: q.passingScore,
    questionCount: q.questions?.length ?? 0,
  });

  const assignmentSummary = (a: (typeof assignments)[number]) => ({
    id: String(a._id),
    title: a.title,
    description: a.description,
    lessonId: a.lessonId ? String(a.lessonId) : undefined,
    maxScore: a.maxScore,
  });

  const quizzesForLesson: Record<string, ReturnType<typeof quizSummary>[]> = {};
  for (const q of quizzes) {
    if (!q.lessonId) continue;
    const key = String(q.lessonId);
    (quizzesForLesson[key] ??= []).push(quizSummary(q));
  }

  const assignmentsForLesson: Record<
    string,
    ReturnType<typeof assignmentSummary>[]
  > = {};
  for (const a of assignments) {
    if (!a.lessonId) continue;
    const key = String(a.lessonId);
    (assignmentsForLesson[key] ??= []).push(assignmentSummary(a));
  }

  return {
    course: {
      id: String(courseDoc._id),
      title: courseDoc.title,
      description: courseDoc.description,
      thumbnailUrl: courseDoc.thumbnailUrl,
    },
    enrollment: {
      progressPercent: enrollment.progressPercent ?? 0,
      status: enrollment.status,
    },
    modules: modules.map((m) => ({
      id: String(m._id),
      title: m.title,
      order: m.order,
      lessons: (lessonsByModule.get(String(m._id)) ?? []).map((l) => ({
        id: String(l._id),
        title: l.title,
        order: l.order,
        durationMinutes: l.durationMinutes,
        videoUrl: l.videoUrl,
        content: l.content,
        completed: completedSet.has(String(l._id)),
      })),
    })),
    completedLessonIds,
    lessonCount: lessons.length,
    completedCount: completedLessonIds.length,
    quizzesForLesson,
    assignmentsForLesson,
    quizzes: quizzes.map(quizSummary),
    assignments: assignments.map(assignmentSummary),
    instructors: instructors.map(mapInstructor),
  };
}

export async function getFeedback(userId: string) {
  const userObjectId = new Types.ObjectId(userId);
  const courseIds = await getEnrolledCourseIds(userId);
  if (courseIds.length === 0) {
    return {
      stats: {
        totalAssignments: 0,
        totalQuizzes: 0,
        approved: 0,
        needRevision: 0,
        pending: 0,
      },
      items: [],
    };
  }

  const [quizzes, assignments, attempts, submissions, courseDocs, lessonDocs] =
    await Promise.all([
      Quiz.find({ courseId: { $in: courseIds } }).lean(),
      Assignment.find({ courseId: { $in: courseIds } }).lean(),
      QuizAttempt.find({ userId: userObjectId }).lean(),
      Submission.find({ userId: userObjectId }).lean(),
      Course.find({ _id: { $in: courseIds } }).select("title").lean(),
      Lesson.find({ courseId: { $in: courseIds } }).select("title").lean(),
    ]);

  const courseTitleById = new Map(
    courseDocs.map((c) => [String(c._id), c.title]),
  );
  const lessonTitleById = new Map(
    lessonDocs.map((l) => [String(l._id), l.title]),
  );

  const latestAttempts = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    const key = String(attempt.quizId);
    const prev = latestAttempts.get(key);
    if (!prev || attempt.createdAt > prev.createdAt) {
      latestAttempts.set(key, attempt);
    }
  }

  const submissionByAssignment = new Map(
    submissions.map((s) => [String(s.assignmentId), s] as const),
  );

  const items: {
    kind: "quiz" | "assignment";
    id: string;
    title: string;
    description?: string;
    courseId: string;
    courseTitle: string;
    lessonTitle?: string;
    questionCount?: number;
    passingScore?: number;
    status: FeedbackStatus;
    createdAt: Date;
  }[] = [];

  let approved = 0;
  let needRevision = 0;
  let pending = 0;

  for (const q of quizzes) {
    const status = quizFeedbackStatus(latestAttempts.get(String(q._id)));
    if (isApprovedStatus(status)) approved += 1;
    else if (isNeedRevisionStatus(status)) needRevision += 1;
    else pending += 1;

    items.push({
      kind: "quiz",
      id: String(q._id),
      title: q.title,
      description: q.description,
      courseId: String(q.courseId),
      courseTitle: courseTitleById.get(String(q.courseId)) ?? "Course",
      lessonTitle: q.lessonId
        ? lessonTitleById.get(String(q.lessonId))
        : undefined,
      questionCount: q.questions?.length ?? 0,
      passingScore: q.passingScore,
      status,
      createdAt: q.createdAt,
    });
  }

  for (const a of assignments) {
    const sub = submissionByAssignment.get(String(a._id));
    const status = assignmentFeedbackStatus(
      sub
        ? {
            status: sub.status,
            score: sub.score,
            maxScore: a.maxScore,
          }
        : null,
    );
    if (isApprovedStatus(status)) approved += 1;
    else if (isNeedRevisionStatus(status)) needRevision += 1;
    else pending += 1;

    items.push({
      kind: "assignment",
      id: String(a._id),
      title: a.title,
      description: a.description,
      courseId: String(a.courseId),
      courseTitle: courseTitleById.get(String(a.courseId)) ?? "Course",
      lessonTitle: a.lessonId
        ? lessonTitleById.get(String(a.lessonId))
        : undefined,
      status,
      createdAt: a.createdAt,
    });
  }

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    stats: {
      totalAssignments: assignments.length,
      totalQuizzes: quizzes.length,
      approved,
      needRevision,
      pending,
    },
    items,
  };
}

export async function getFeedbackQuiz(userId: string, quizId: string) {
  requireObjectId(quizId, "quizId");
  const userObjectId = new Types.ObjectId(userId);

  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) throw new AppError(404, "NOT_FOUND", "Quiz not found");

  await getActiveEnrollment(userId, String(quiz.courseId));

  const [course, attempt] = await Promise.all([
    Course.findById(quiz.courseId).select("title").lean(),
    QuizAttempt.findOne({ quizId, userId: userObjectId })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    quiz: {
      id: String(quiz._id),
      title: quiz.title,
      description: quiz.description,
      lessonId: quiz.lessonId ? String(quiz.lessonId) : undefined,
      passingScore: quiz.passingScore,
      questionCount: quiz.questions?.length ?? 0,
      questions: (quiz.questions ?? []).map((q) => ({
        prompt: q.prompt,
        options: q.options,
        points: q.points,
      })),
    },
    courseTitle: course?.title ?? "Course",
    courseId: String(quiz.courseId),
    attempt: attempt
      ? {
          id: String(attempt._id),
          answers: attempt.answers,
          score: attempt.score,
          maxScore: attempt.maxScore,
          passed: attempt.passed,
          createdAt: attempt.createdAt,
        }
      : null,
    status: quizFeedbackStatus(attempt ?? undefined),
  };
}

export async function getFeedbackAssignment(
  userId: string,
  assignmentId: string,
) {
  requireObjectId(assignmentId, "assignmentId");
  const userObjectId = new Types.ObjectId(userId);

  const assignment = await Assignment.findById(assignmentId).lean();
  if (!assignment) {
    throw new AppError(404, "NOT_FOUND", "Assignment not found");
  }

  await getActiveEnrollment(userId, String(assignment.courseId));

  const [course, submission, messages] = await Promise.all([
    Course.findById(assignment.courseId).select("title").lean(),
    Submission.findOne({ assignmentId, userId: userObjectId })
      .populate("fileAssetId")
      .lean(),
    DiscussionMessage.find({ assignmentId })
      .sort({ createdAt: 1 })
      .populate("authorId", "fullName avatarUrl role")
      .lean(),
  ]);

  const fileAsset = populatedDoc<{
    _id: Types.ObjectId;
    originalName: string;
    mimeType: string;
    size: number;
    url?: string;
    path: string;
  }>(submission?.fileAssetId);

  return {
    assignment: {
      id: String(assignment._id),
      title: assignment.title,
      description: assignment.description,
      lessonId: assignment.lessonId ? String(assignment.lessonId) : undefined,
      maxScore: assignment.maxScore,
      dueAt: assignment.dueAt,
      courseId: String(assignment.courseId),
    },
    course: course
      ? { id: String(course._id), title: course.title }
      : { id: String(assignment.courseId), title: "Course" },
    submission: submission
      ? {
          id: String(submission._id),
          content: submission.content,
          status: submission.status,
          score: submission.score,
          feedback: submission.feedback,
          gradedAt: submission.gradedAt,
          createdAt: submission.createdAt,
          fileAsset: fileAsset
            ? {
                id: String(fileAsset._id),
                originalName: fileAsset.originalName,
                mimeType: fileAsset.mimeType,
                size: fileAsset.size,
                url: fileAsset.url,
                path: fileAsset.path,
              }
            : null,
        }
      : null,
    status: assignmentFeedbackStatus(
      submission
        ? {
            status: submission.status,
            score: submission.score,
            maxScore: assignment.maxScore,
          }
        : null,
    ),
    messages: messages.map((m) => {
      const author = populatedDoc<{
        _id: Types.ObjectId;
        fullName: string;
        avatarUrl?: string;
        role: string;
      }>(m.authorId);
      return {
        id: String(m._id),
        body: m.body,
        createdAt: m.createdAt,
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

export const replySchema = z.object({
  body: z.string().min(1).max(5000),
});

export async function replyToAssignment(
  userId: string,
  assignmentId: string,
  input: z.infer<typeof replySchema>,
) {
  requireObjectId(assignmentId, "assignmentId");
  const parsed = replySchema.parse(input);

  const assignment = await Assignment.findById(assignmentId).lean();
  if (!assignment) {
    throw new AppError(404, "NOT_FOUND", "Assignment not found");
  }

  await getActiveEnrollment(userId, String(assignment.courseId));

  const message = await DiscussionMessage.create({
    assignmentId,
    authorId: userId,
    body: parsed.body.trim(),
  });

  const author = await User.findById(userId)
    .select("fullName avatarUrl role")
    .lean();

  return {
    id: String(message._id),
    body: message.body,
    createdAt: message.createdAt,
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

export async function getMyOrders(userId: string) {
  const invoices = await Invoice.find({ userId })
    .populate("courseId", "title")
    .sort({ createdAt: -1 })
    .lean();

  const invoiceIds = invoices.map((inv) => inv._id);
  const payments = invoiceIds.length
    ? await Payment.find({
        invoiceId: { $in: invoiceIds },
        status: "succeeded",
      })
        .sort({ createdAt: -1 })
        .lean()
    : [];

  const methodByInvoice = new Map<string, string>();
  for (const p of payments) {
    const key = String(p.invoiceId);
    if (!methodByInvoice.has(key)) {
      methodByInvoice.set(key, p.provider);
    }
  }

  return invoices.map((inv) => {
    const course = populatedDoc<{ _id: Types.ObjectId; title: string }>(
      inv.courseId,
    );
    return {
      id: String(inv._id),
      courseTitle: course?.title ?? inv.description ?? "Order",
      amountCents: inv.amountCents,
      currency: inv.currency,
      status: inv.status,
      method: methodByInvoice.get(String(inv._id)),
      date: inv.paidAt ?? inv.createdAt,
    };
  });
}

export async function getMyResources(userId: string) {
  const courseIds = await getEnrolledCourseIds(userId);
  if (courseIds.length === 0) return [];

  const resources = await CourseResource.find({
    courseId: { $in: courseIds },
  })
    .populate("courseId", "title")
    .populate("uploadedBy", "fullName avatarUrl")
    .populate("fileAssetId")
    .sort({ createdAt: -1 })
    .lean();

  return resources.map((r) => {
    const course = populatedDoc<{ _id: Types.ObjectId; title: string }>(
      r.courseId,
    );
    const uploader = populatedDoc<{
      _id: Types.ObjectId;
      fullName: string;
      avatarUrl?: string;
    }>(r.uploadedBy);
    const file = populatedDoc<{
      _id: Types.ObjectId;
      originalName: string;
      mimeType: string;
      size: number;
      url?: string;
      path: string;
    }>(r.fileAssetId);

    return {
      id: String(r._id),
      title: r.title,
      description: r.description,
      mimeType: r.mimeType,
      originalName: r.originalName,
      courseId: course ? String(course._id) : String(r.courseId),
      courseTitle: course?.title ?? "Course",
      uploader: uploader
        ? {
            id: String(uploader._id),
            fullName: uploader.fullName,
            avatarUrl: uploader.avatarUrl,
          }
        : null,
      file: file
        ? {
            id: String(file._id),
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            url: file.url,
            path: file.path,
          }
        : {
            id: String(r.fileAssetId),
            originalName: r.originalName,
            mimeType: r.mimeType,
          },
      createdAt: r.createdAt,
    };
  });
}

function mapSupportTicket(ticket: {
  _id: Types.ObjectId;
  subject: string;
  body: string;
  status: string;
  priority?: string;
  attachmentIds: Types.ObjectId[];
  replies: { authorId: Types.ObjectId; body: string; createdAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}) {
  const status =
    ticket.status === "resolved" || ticket.status === "closed"
      ? ticket.status
      : "open";
  return {
    id: String(ticket._id),
    subject: ticket.subject,
    body: ticket.body,
    status,
    priority:
      ticket.priority === "high" || ticket.priority === "urgent"
        ? ticket.priority
        : "medium",
    attachmentIds: (ticket.attachmentIds ?? []).map(String),
    replies: (ticket.replies ?? []).map((r) => ({
      authorId: String(r.authorId),
      body: r.body,
      createdAt: r.createdAt,
    })),
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

export async function listMySupport(userId: string) {
  const tickets = await SupportTicket.find({ userId })
    .sort({ updatedAt: -1 })
    .lean();
  return tickets.map(mapSupportTicket);
}

export const createSupportSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  priority: z.enum(["high", "medium", "urgent"]).optional(),
  attachmentIds: z.array(z.string().min(1)).optional(),
});

export async function createSupportTicket(
  userId: string,
  input: z.infer<typeof createSupportSchema>,
) {
  const parsed = createSupportSchema.parse(input);
  const ticket = await SupportTicket.create({
    userId,
    subject: parsed.subject.trim(),
    body: parsed.body.trim(),
    status: "open",
    priority: parsed.priority ?? "medium",
    attachmentIds: parsed.attachmentIds ?? [],
  });
  return mapSupportTicket(ticket.toObject());
}

export async function getMySupportTicket(userId: string, ticketId: string) {
  requireObjectId(ticketId, "ticketId");
  const ticket = await SupportTicket.findOne({ _id: ticketId, userId }).lean();
  if (!ticket) throw new AppError(404, "NOT_FOUND", "Support ticket not found");
  return mapSupportTicket(ticket);
}

export const updateSupportStatusSchema = z.object({
  status: z.enum(["open", "resolved", "closed"]),
});

export async function updateMySupportTicketStatus(
  userId: string,
  ticketId: string,
  input: z.infer<typeof updateSupportStatusSchema>,
) {
  requireObjectId(ticketId, "ticketId");
  const parsed = updateSupportStatusSchema.parse(input);

  const ticket = await SupportTicket.findOneAndUpdate(
    { _id: ticketId, userId },
    { $set: { status: parsed.status } },
    { new: true },
  ).lean();
  if (!ticket) throw new AppError(404, "NOT_FOUND", "Support ticket not found");
  return mapSupportTicket(ticket);
}

export const supportReplySchema = z.object({
  body: z.string().min(1).max(5000),
});

export async function replyToMySupportTicket(
  userId: string,
  ticketId: string,
  input: z.infer<typeof supportReplySchema>,
) {
  requireObjectId(ticketId, "ticketId");
  const parsed = supportReplySchema.parse(input);
  const ticket = await SupportTicket.findOne({ _id: ticketId, userId });
  if (!ticket) throw new AppError(404, "NOT_FOUND", "Support ticket not found");

  ticket.replies.push({
    authorId: new Types.ObjectId(userId),
    body: parsed.body.trim(),
    createdAt: new Date(),
  });
  if (ticket.status === "resolved") ticket.status = "open";
  await ticket.save();
  return mapSupportTicket(ticket.toObject());
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

export async function updateMyProfile(
  userId: string,
  input: z.infer<typeof updateProfileSchema>,
) {
  const parsed = updateProfileSchema.parse(input);
  const user = await User.findById(userId);
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

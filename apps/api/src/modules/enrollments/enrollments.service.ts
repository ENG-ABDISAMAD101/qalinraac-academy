import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { writeAuditLog } from "../../lib/audit.js";
import { sendEmail } from "../../lib/email.js";
import { Course } from "../../models/Course.js";
import { Enrollment } from "../../models/Enrollment.js";
import { Invoice } from "../../models/Invoice.js";
import { User } from "../../models/User.js";
import { createNotification } from "../notifications/notifications.service.js";

export const enrollSchema = z.object({
  courseId: z.string().min(1),
  userId: z.string().min(1).optional(),
});

export async function enroll(
  input: z.infer<typeof enrollSchema>,
  actorId: string,
  actorRole: string,
) {
  const course = await Course.findById(input.courseId);
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");
  if (course.status !== "published" && actorRole === "Student") {
    throw new AppError(400, "COURSE_NOT_PUBLISHED", "Course is not published");
  }

  const userId = input.userId ?? actorId;
  const existing = await Enrollment.findOne({ userId, courseId: course._id });
  if (existing) {
    throw new AppError(409, "ALREADY_ENROLLED", "Already enrolled in this course");
  }

  const needsPayment = course.priceCents > 0;
  const enrollment = await Enrollment.create({
    userId,
    courseId: course._id,
    status: needsPayment ? "pending_payment" : "active",
    unlockedAt: needsPayment ? undefined : new Date(),
  });

  let invoice = null;
  if (needsPayment) {
    invoice = await Invoice.create({
      userId,
      courseId: course._id,
      enrollmentId: enrollment._id,
      amountCents: course.priceCents,
      currency: course.currency,
      status: "open",
      description: `Enrollment: ${course.title}`,
    });
  }

  await writeAuditLog({
    actorId,
    action: "enrollments.create",
    resource: "Enrollment",
    resourceId: String(enrollment._id),
  });

  await createNotification({
    userId,
    title: "Enrollment confirmed",
    body: needsPayment
      ? `Enrolled in ${course.title}. Payment required to unlock.`
      : `You are enrolled in ${course.title}.`,
    type: "enrollment",
    meta: { enrollmentId: String(enrollment._id), courseId: String(course._id) },
  });

  const user = await User.findById(userId);
  if (user?.email) {
    await sendEmail({
      to: user.email,
      subject: `Enrolled — ${course.title}`,
      html: `<p>Hi ${user.fullName},</p><p>You are enrolled in <strong>${course.title}</strong>.</p>`,
    });
  }

  return { enrollment, invoice };
}

export async function myCourses(userId: string) {
  return Enrollment.find({ userId })
    .populate("courseId")
    .sort({ createdAt: -1 });
}

export async function roster(courseId: string) {
  const course = await Course.findById(courseId);
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");
  return Enrollment.find({ courseId }).populate("userId", "email fullName role").sort({
    createdAt: -1,
  });
}

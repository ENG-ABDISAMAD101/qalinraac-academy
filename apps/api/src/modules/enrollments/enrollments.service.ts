import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { writeAuditLog } from "../../lib/audit.js";
import { sendEmail } from "../../lib/email.js";
import { Course } from "../../models/Course.js";
import { Enrollment } from "../../models/Enrollment.js";
import { Invoice } from "../../models/Invoice.js";
import { Payment } from "../../models/Payment.js";
import { User } from "../../models/User.js";
import { createNotification } from "../notifications/notifications.service.js";

export const enrollSchema = z.object({
  courseId: z.string().min(1),
  userId: z.string().min(1).optional(),
});

export const checkoutSchema = z.object({
  courseId: z.string().min(1),
  paymentMethod: z.enum(["evc", "zaad", "sahal", "card"]).optional(),
  phone: z.string().optional(),
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

/**
 * Student checkout: enroll (or resume pending) and activate access.
 * Real payment gateways will be wired later — currently simulated success.
 */
export async function checkoutCourse(
  input: z.infer<typeof checkoutSchema>,
  actorId: string,
) {
  const course = await Course.findById(input.courseId);
  if (!course) throw new AppError(404, "NOT_FOUND", "Course not found");
  if (course.status !== "published") {
    throw new AppError(400, "COURSE_NOT_PUBLISHED", "Course is not published");
  }

  const method = input.paymentMethod ?? "card";
  const phone = input.phone?.replace(/\s+/g, "") || undefined;
  if (method !== "card") {
    if (!phone || !/^252\d{9}$/.test(phone)) {
      throw new AppError(
        400,
        "INVALID_PHONE",
        "Enter a valid phone number like 252XXXXXXXXX",
      );
    }
  }

  let enrollment = await Enrollment.findOne({
    userId: actorId,
    courseId: course._id,
  });
  let invoice = enrollment
    ? await Invoice.findOne({
        enrollmentId: enrollment._id,
        userId: actorId,
      }).sort({ createdAt: -1 })
    : null;

  if (!enrollment) {
    const created = await enroll(
      { courseId: String(course._id) },
      actorId,
      "Student",
    );
    enrollment = created.enrollment;
    invoice = created.invoice;
  }

  if (enrollment.status === "active") {
    return {
      enrollment,
      invoice,
      activated: true,
      alreadyActive: true,
    };
  }

  const amountCents =
    course.discountPriceCents != null &&
    course.discountPriceCents < course.priceCents
      ? course.discountPriceCents
      : course.priceCents;

  if (!invoice && amountCents > 0) {
    invoice = await Invoice.create({
      userId: actorId,
      courseId: course._id,
      enrollmentId: enrollment._id,
      amountCents,
      currency: course.currency,
      status: "open",
      description: `Enrollment: ${course.title}`,
    });
  }

  if (invoice && invoice.status !== "paid") {
    invoice.status = "paid";
    invoice.paidAt = new Date();
    await invoice.save();

    await Payment.create({
      invoiceId: invoice._id,
      userId: actorId,
      provider: "manual",
      amountCents: invoice.amountCents,
      currency: invoice.currency,
      status: "succeeded",
      providerRef: `checkout_sim_${Date.now()}`,
      rawResponse: {
        simulated: true,
        message: "Simulated checkout — real gateway pending",
        paymentMethod: method,
        phone: phone ?? null,
      },
    });
  }

  enrollment.status = "active";
  enrollment.unlockedAt = new Date();
  await enrollment.save();

  await writeAuditLog({
    actorId,
    action: "enrollments.checkout",
    resource: "Enrollment",
    resourceId: String(enrollment._id),
    meta: { paymentMethod: method, phone: phone ?? null, simulated: true },
  });

  await createNotification({
    userId: actorId,
    title: "Course unlocked",
    body: `“${course.title}” is now active in your courses.`,
    type: "enrollment",
    meta: {
      enrollmentId: String(enrollment._id),
      courseId: String(course._id),
    },
  });

  return {
    enrollment,
    invoice,
    activated: true,
    alreadyActive: false,
  };
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

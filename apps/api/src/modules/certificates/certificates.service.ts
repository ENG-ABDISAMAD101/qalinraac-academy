import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { writeAuditLog } from "../../lib/audit.js";
import {
  CertificateRequest,
  type CertificateStatus,
} from "../../models/CertificateRequest.js";
import { Enrollment } from "../../models/Enrollment.js";
import { Lesson } from "../../models/Lesson.js";
import { Progress } from "../../models/Progress.js";
import { createNotification } from "../notifications/notifications.service.js";
import { sendEmail } from "../../lib/email.js";
import { User } from "../../models/User.js";

export const requestCertificateSchema = z.object({
  courseId: z.string().min(1),
  recipientName: z.string().min(3).max(120).optional(),
  declarationAccepted: z.literal(true),
});

export const rejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const issueSchema = z.object({
  filePath: z.string().min(1),
  fileUrl: z.string().optional(),
});

async function isCourseCompleted(userId: string, courseId: string, enrollment: {
  progressPercent: number;
  status: string;
}) {
  if (enrollment.progressPercent >= 100 || enrollment.status === "completed") {
    return true;
  }
  const totalLessons = await Lesson.countDocuments({ courseId });
  if (totalLessons === 0) return false;
  const completed = await Progress.countDocuments({
    userId,
    courseId,
    completed: true,
  });
  return completed >= totalLessons;
}

export async function requestCertificate(
  userId: string,
  input: z.infer<typeof requestCertificateSchema>,
) {
  const { courseId, recipientName } = input;
  const enrollment = await Enrollment.findOne({ userId, courseId });
  if (!enrollment) {
    throw new AppError(404, "NOT_ENROLLED", "Enrollment not found");
  }

  const completed = await isCourseCompleted(userId, courseId, enrollment);
  if (!completed) {
    throw new AppError(
      400,
      "COURSE_INCOMPLETE",
      "Complete all lessons or reach 100% progress before requesting a certificate",
    );
  }

  const existing = await CertificateRequest.findOne({ userId, courseId });
  if (existing) {
    throw new AppError(409, "ALREADY_REQUESTED", "Certificate already requested");
  }

  const req = await CertificateRequest.create({
    userId,
    courseId,
    enrollmentId: enrollment._id,
    status: "pending",
    recipientName,
  });

  await createNotification({
    userId,
    title: "Certificate requested",
    body: "Your certificate request is pending admin review.",
    type: "certificate",
    meta: { certificateRequestId: String(req._id) },
  });

  return req;
}

export async function listRequests(status?: string) {
  const filter: { status?: CertificateStatus } = {};
  if (status) filter.status = status as CertificateStatus;
  return CertificateRequest.find(filter)
    .populate("userId", "email fullName")
    .populate("courseId", "title slug")
    .sort({ createdAt: -1 });
}

export async function myCertificates(userId: string) {
  return CertificateRequest.find({ userId }).populate("courseId", "title slug").sort({
    createdAt: -1,
  });
}

export async function issueCertificate(
  id: string,
  input: z.infer<typeof issueSchema>,
  actorId: string,
) {
  const cert = await CertificateRequest.findById(id);
  if (!cert) throw new AppError(404, "NOT_FOUND", "Certificate request not found");
  if (cert.status === "rejected") {
    throw new AppError(400, "REJECTED", "Cannot issue a rejected request");
  }

  cert.status = "issued";
  cert.filePath = input.filePath;
  cert.fileUrl = input.fileUrl ?? input.filePath;
  cert.issuedAt = new Date();
  cert.issuedBy = actorId as never;
  await cert.save();

  await writeAuditLog({
    actorId,
    action: "certificates.issue",
    resource: "CertificateRequest",
    resourceId: id,
  });

  await createNotification({
    userId: String(cert.userId),
    title: "Certificate issued",
    body: "Your course certificate is ready to download.",
    type: "certificate",
    meta: { certificateRequestId: id },
  });

  const user = await User.findById(cert.userId);
  if (user?.email) {
    await sendEmail({
      to: user.email,
      subject: "Certificate issued — Qalinraac Academy",
      html: `<p>Hi ${user.fullName},</p><p>Your course certificate is ready to download in the portal.</p>`,
    });
  }

  return cert;
}

export async function rejectCertificate(
  id: string,
  input: z.infer<typeof rejectSchema>,
  actorId: string,
) {
  const cert = await CertificateRequest.findById(id);
  if (!cert) throw new AppError(404, "NOT_FOUND", "Certificate request not found");

  cert.status = "rejected";
  cert.rejectionReason = input.reason;
  await cert.save();

  await writeAuditLog({
    actorId,
    action: "certificates.reject",
    resource: "CertificateRequest",
    resourceId: id,
  });

  await createNotification({
    userId: String(cert.userId),
    title: "Certificate rejected",
    body: input.reason,
    type: "certificate",
    meta: { certificateRequestId: id },
  });

  return cert;
}

export async function downloadCertificate(id: string, userId: string, role: string) {
  const cert = await CertificateRequest.findById(id);
  if (!cert) throw new AppError(404, "NOT_FOUND", "Certificate request not found");
  if (String(cert.userId) !== userId && !["Admin", "SuperAdmin", "Academic"].includes(role)) {
    throw new AppError(403, "FORBIDDEN", "Not allowed to download this certificate");
  }
  if (cert.status !== "issued" || !cert.filePath) {
    throw new AppError(400, "NOT_ISSUED", "Certificate not issued yet");
  }
  return {
    filePath: cert.filePath,
    fileUrl: cert.fileUrl,
    status: cert.status,
  };
}

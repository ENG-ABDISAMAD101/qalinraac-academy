import { Types } from "mongoose";
import { z } from "zod";
import { AppError } from "../../lib/app-error.js";
import { writeAuditLog } from "../../lib/audit.js";
import { pendingReviewFilter } from "../../lib/course-workflow.js";
import { CertificateRequest } from "../../models/CertificateRequest.js";
import { Course } from "../../models/Course.js";
import { Enrollment } from "../../models/Enrollment.js";
import { Notification } from "../../models/Notification.js";
import { SupportTicket } from "../../models/SupportTicket.js";
import { User } from "../../models/User.js";
import { toPublicUser } from "../auth/auth.service.js";
import { issueCertificate } from "../certificates/certificates.service.js";
import { createNotification } from "../notifications/notifications.service.js";

function oid(id: string, label = "id") {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, "INVALID_ID", `Invalid ${label}`);
  }
  return new Types.ObjectId(id);
}

function normalizeTicketStatus(raw: string): "open" | "resolved" {
  if (raw === "resolved" || raw === "closed") return "resolved";
  return "open";
}

function normalizePriority(raw?: string): "high" | "medium" | "urgent" {
  if (raw === "high" || raw === "urgent") return raw;
  return "medium";
}

function mapUserLite(u: {
  _id: Types.ObjectId;
  fullName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  isActive?: boolean;
  role?: string;
  createdAt?: Date;
  bio?: string;
}) {
  return {
    id: String(u._id),
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    isActive: u.isActive !== false,
    role: u.role,
    registeredAt: u.createdAt,
    bio: u.bio,
  };
}

export const updateAdminProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(24).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const replyTicketSchema = z.object({
  body: z.string().min(1).max(10000),
});

export const updateTicketSchema = z.object({
  status: z.enum(["open", "resolved"]).optional(),
  priority: z.enum(["high", "medium", "urgent"]).optional(),
});

export const uploadCertificateSchema = z.object({
  filePath: z.string().min(1),
  fileUrl: z.string().optional(),
});

// ——— Dashboard ———

export async function getAdminDashboard() {
  const [
    totalStudents,
    totalInstructors,
    totalCourses,
    activeCourses,
    openSupportTickets,
    recentTickets,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments({ role: "Student" }),
    User.countDocuments({ role: "Instructor" }),
    Course.countDocuments({}),
    Course.countDocuments({ status: "published" }),
    SupportTicket.countDocuments({ status: "open" }),
    SupportTicket.find({ status: "open" })
      .populate("userId", "fullName email role avatarUrl")
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean(),
    User.find({ role: { $in: ["Student", "Instructor"] } })
      .select("fullName email role isActive avatarUrl createdAt")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
  ]);

  return {
    stats: {
      totalStudents,
      totalInstructors,
      totalCourses,
      activeCourses,
      openSupportTickets,
      totalUsers: totalStudents + totalInstructors,
    },
    recentTickets: recentTickets.map((t) => {
      const user = t.userId as unknown as {
        fullName?: string;
        email?: string;
        role?: string;
      };
      return {
        id: String(t._id),
        subject: t.subject,
        priority: normalizePriority(t.priority as string | undefined),
        status: normalizeTicketStatus(String(t.status)),
        user: user?.fullName ?? "—",
        role: user?.role ?? "—",
        email: user?.email ?? "—",
        updatedAt: t.updatedAt,
      };
    }),
    recentUsers: recentUsers.map((u) => ({
      id: String(u._id),
      name: u.fullName,
      email: u.email,
      role: u.role,
      status: u.isActive ? "Active" : "Disabled",
      avatarUrl: u.avatarUrl,
      registeredAt: u.createdAt,
    })),
  };
}

// ——— Students ———

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
    .select("userId")
    .lean();

  const courseCount = new Map<string, number>();
  for (const e of enrollments) {
    const key = String(e.userId);
    courseCount.set(key, (courseCount.get(key) ?? 0) + 1);
  }

  return {
    items: students.map((s) => ({
      id: String(s._id),
      name: s.fullName,
      email: s.email,
      phone: s.phone ?? "—",
      courses: courseCount.get(String(s._id)) ?? 0,
      status: s.isActive ? "Active" : "Disabled",
      avatarUrl: s.avatarUrl,
      registeredAt: s.createdAt,
    })),
    total: students.length,
  };
}

export async function getStudent(id: string) {
  const student = await User.findOne({ _id: oid(id), role: "Student" }).lean();
  if (!student) throw new AppError(404, "NOT_FOUND", "Student not found");

  const enrollments = await Enrollment.find({
    userId: student._id,
    status: { $in: ["active", "completed", "pending_payment"] },
  })
    .populate("courseId", "title status thumbnailUrl")
    .sort({ createdAt: -1 })
    .lean();

  const courses = enrollments.map((e) => {
    const course = e.courseId as unknown as {
      _id?: Types.ObjectId;
      title?: string;
      status?: string;
      thumbnailUrl?: string;
    };
    return {
      id: course?._id ? String(course._id) : String(e.courseId),
      title: course?.title ?? "Course",
      status: e.status,
      progressPercent: e.progressPercent ?? 0,
      thumbnailUrl: course?.thumbnailUrl,
      enrolledAt: e.createdAt,
    };
  });

  return {
    ...mapUserLite(student),
    name: student.fullName,
    status: student.isActive ? "Active" : "Disabled",
    coursesRegistered: courses.length,
    courses,
  };
}

// ——— Instructors ———

export async function listInstructors(q?: string) {
  const filter: Record<string, unknown> = { role: "Instructor" };
  if (q?.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ fullName: rx }, { email: rx }, { phone: rx }];
  }

  const instructors = await User.find(filter)
    .select("fullName email phone isActive avatarUrl createdAt")
    .sort({ fullName: 1 })
    .lean();

  const courses = await Course.find({
    instructorIds: { $in: instructors.map((i) => i._id) },
  })
    .select("instructorIds status")
    .lean();

  return {
    items: instructors.map((ins) => {
      const owned = courses.filter((c) =>
        (c.instructorIds ?? []).some((id) => String(id) === String(ins._id)),
      );
      return {
        id: String(ins._id),
        name: ins.fullName,
        email: ins.email,
        phone: ins.phone ?? "—",
        status: ins.isActive ? "Active" : "Disabled",
        courses: owned.length,
        published: owned.filter((c) => c.status === "published").length,
        avatarUrl: ins.avatarUrl,
        registeredAt: ins.createdAt,
      };
    }),
    total: instructors.length,
  };
}

export async function getInstructor(id: string) {
  const instructor = await User.findOne({
    _id: oid(id),
    role: "Instructor",
  }).lean();
  if (!instructor) throw new AppError(404, "NOT_FOUND", "Instructor not found");

  const courses = await Course.find({ instructorIds: instructor._id })
    .select("title status priceCents currency thumbnailUrl createdAt publishedAt")
    .sort({ updatedAt: -1 })
    .lean();

  const courseIds = courses.map((c) => c._id);
  const studentCount = courseIds.length
    ? await Enrollment.countDocuments({
        courseId: { $in: courseIds },
        status: { $in: ["active", "completed"] },
      })
    : 0;

  return {
    ...mapUserLite(instructor),
    name: instructor.fullName,
    status: instructor.isActive ? "Active" : "Disabled",
    coursesCount: courses.length,
    studentsCount: studentCount,
    courses: courses.map((c) => ({
      id: String(c._id),
      title: c.title,
      status: c.status,
      priceCents: c.priceCents,
      currency: c.currency,
      thumbnailUrl: c.thumbnailUrl,
      createdAt: c.createdAt,
      publishedAt: c.publishedAt,
    })),
  };
}

// ——— Courses ———

export async function listCourses(opts?: { q?: string; status?: string }) {
  const filter: Record<string, unknown> = {};
  if (opts?.status === "pending" || opts?.status === "pending_review") {
    Object.assign(filter, pendingReviewFilter());
  } else if (opts?.status === "published") {
    filter.status = "published";
  } else if (opts?.status && opts.status !== "all") {
    filter.status = opts.status;
  }

  if (opts?.q?.trim()) {
    const rx = new RegExp(
      opts.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    filter.title = rx;
  }

  const [courses, pendingCount, publishedCount] = await Promise.all([
    Course.find(filter)
      .populate("instructorIds", "fullName email")
      .sort({ updatedAt: -1 })
      .lean(),
    Course.countDocuments(pendingReviewFilter()),
    Course.countDocuments({ status: "published" }),
  ]);

  return {
    stats: { pending: pendingCount, published: publishedCount },
    items: courses.map((c) => {
      const instructors = (c.instructorIds ?? []) as unknown as {
        fullName?: string;
      }[];
      return {
        id: String(c._id),
        title: c.title,
        status: c.status,
        instructor:
          instructors.map((i) => i.fullName).filter(Boolean).join(", ") || "—",
        priceCents: c.priceCents,
        currency: c.currency ?? "USD",
        thumbnailUrl: c.thumbnailUrl,
        updatedAt: c.updatedAt,
        publishedAt: c.publishedAt,
      };
    }),
    total: courses.length,
  };
}

// ——— Certificates ———

export async function listCertificates(opts?: { q?: string; status?: string }) {
  const filter: Record<string, unknown> = {};
  if (opts?.status && opts.status !== "all") {
    filter.status = opts.status;
  }

  let certs = await CertificateRequest.find(filter)
    .populate("userId", "fullName email phone avatarUrl")
    .populate("courseId", "title")
    .sort({ createdAt: -1 })
    .lean();

  if (opts?.q?.trim()) {
    const q = opts.q.trim().toLowerCase();
    certs = certs.filter((c) => {
      const student = c.userId as unknown as {
        fullName?: string;
        email?: string;
      };
      const course = c.courseId as unknown as { title?: string };
      return (
        student?.fullName?.toLowerCase().includes(q) ||
        student?.email?.toLowerCase().includes(q) ||
        course?.title?.toLowerCase().includes(q)
      );
    });
  }

  return {
    items: certs.map((c) => {
      const student = c.userId as unknown as {
        _id?: Types.ObjectId;
        fullName?: string;
        email?: string;
        phone?: string;
        avatarUrl?: string;
      };
      const course = c.courseId as unknown as {
        _id?: Types.ObjectId;
        title?: string;
      };
      return {
        id: String(c._id),
        status: c.status,
        recipientName: c.recipientName,
        student: {
          id: student?._id ? String(student._id) : "",
          name: student?.fullName ?? "—",
          email: student?.email ?? "—",
          phone: student?.phone,
          avatarUrl: student?.avatarUrl,
        },
        course: {
          id: course?._id ? String(course._id) : "",
          title: course?.title ?? "—",
        },
        fileUrl: c.fileUrl,
        requestedAt: c.createdAt,
        issuedAt: c.issuedAt,
      };
    }),
    total: certs.length,
  };
}

export async function getCertificate(id: string) {
  const cert = await CertificateRequest.findById(oid(id))
    .populate("userId", "fullName email phone avatarUrl isActive createdAt")
    .populate("courseId", "title status")
    .lean();
  if (!cert) throw new AppError(404, "NOT_FOUND", "Certificate request not found");

  const student = cert.userId as unknown as {
    _id: Types.ObjectId;
    fullName: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    isActive?: boolean;
    createdAt?: Date;
  };
  const course = cert.courseId as unknown as {
    _id: Types.ObjectId;
    title?: string;
    status?: string;
  };

  return {
    id: String(cert._id),
    status: cert.status,
    recipientName: cert.recipientName ?? student.fullName,
    filePath: cert.filePath,
    fileUrl: cert.fileUrl,
    requestedAt: cert.createdAt,
    issuedAt: cert.issuedAt,
    rejectionReason: cert.rejectionReason,
    student: {
      id: String(student._id),
      name: student.fullName,
      email: student.email,
      phone: student.phone,
      avatarUrl: student.avatarUrl,
      status: student.isActive !== false ? "Active" : "Disabled",
      registeredAt: student.createdAt,
    },
    course: {
      id: String(course._id),
      title: course.title ?? "—",
      status: course.status,
    },
  };
}

export async function uploadCertificateFile(
  id: string,
  input: z.infer<typeof uploadCertificateSchema>,
  actorId: string,
) {
  return issueCertificate(id, input, actorId);
}

// ——— Support ———

export async function listTickets(opts?: {
  q?: string;
  status?: string;
  priority?: string;
}) {
  const filter: Record<string, unknown> = {};
  if (opts?.status === "resolved") {
    filter.status = "resolved";
  } else if (opts?.status === "open") {
    filter.status = "open";
  }
  if (opts?.priority && ["high", "medium", "urgent"].includes(opts.priority)) {
    filter.priority = opts.priority;
  }

  let tickets = await SupportTicket.find(filter)
    .populate("userId", "fullName email role avatarUrl")
    .sort({ updatedAt: -1 })
    .lean();

  if (opts?.q?.trim()) {
    const q = opts.q.trim().toLowerCase();
    tickets = tickets.filter((t) => {
      const user = t.userId as unknown as { fullName?: string; email?: string };
      return (
        t.subject.toLowerCase().includes(q) ||
        user?.fullName?.toLowerCase().includes(q) ||
        user?.email?.toLowerCase().includes(q)
      );
    });
  }

  return {
    items: tickets.map((t) => {
      const user = t.userId as unknown as {
        fullName?: string;
        email?: string;
        role?: string;
        avatarUrl?: string;
      };
      return {
        id: String(t._id),
        subject: t.subject,
        priority: normalizePriority(t.priority as string | undefined),
        status: normalizeTicketStatus(String(t.status)),
        user: user?.fullName ?? "—",
        email: user?.email ?? "—",
        role: user?.role ?? "—",
        avatarUrl: user?.avatarUrl,
        updatedAt: t.updatedAt,
        createdAt: t.createdAt,
      };
    }),
    total: tickets.length,
    stats: {
      open: tickets.filter(
        (t) => normalizeTicketStatus(String(t.status)) === "open",
      ).length,
      resolved: tickets.filter(
        (t) => normalizeTicketStatus(String(t.status)) === "resolved",
      ).length,
    },
  };
}

export async function getTicket(id: string) {
  const ticket = await SupportTicket.findById(oid(id))
    .populate("userId", "fullName email role phone avatarUrl")
    .populate("replies.authorId", "fullName role avatarUrl")
    .lean();
  if (!ticket) throw new AppError(404, "NOT_FOUND", "Support ticket not found");

  const user = ticket.userId as unknown as {
    _id: Types.ObjectId;
    fullName?: string;
    email?: string;
    role?: string;
    phone?: string;
    avatarUrl?: string;
  };

  return {
    id: String(ticket._id),
    subject: ticket.subject,
    body: ticket.body,
    priority: normalizePriority(ticket.priority as string | undefined),
    status: normalizeTicketStatus(String(ticket.status)),
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    user: {
      id: String(user._id),
      name: user.fullName ?? "—",
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    },
    replies: (ticket.replies ?? []).map((r) => {
      const author = r.authorId as unknown as {
        _id?: Types.ObjectId;
        fullName?: string;
        role?: string;
        avatarUrl?: string;
      };
      return {
        authorId: author?._id ? String(author._id) : String(r.authorId),
        authorName: author?.fullName ?? "Staff",
        authorRole: author?.role,
        avatarUrl: author?.avatarUrl,
        body: r.body,
        createdAt: r.createdAt,
      };
    }),
  };
}

export async function replyToTicket(
  id: string,
  actorId: string,
  input: z.infer<typeof replyTicketSchema>,
) {
  const ticket = await SupportTicket.findById(oid(id));
  if (!ticket) throw new AppError(404, "NOT_FOUND", "Support ticket not found");

  ticket.replies.push({
    authorId: oid(actorId) as never,
    body: input.body.trim(),
    createdAt: new Date(),
  });
  if (normalizeTicketStatus(String(ticket.status)) === "resolved") {
    // keep resolved if already resolved
  } else {
    ticket.status = "open";
  }
  await ticket.save();

  await createNotification({
    userId: String(ticket.userId),
    title: "Support reply",
    body: `New reply on “${ticket.subject}”.`,
    type: "support",
    meta: { ticketId: String(ticket._id) },
  });

  await writeAuditLog({
    actorId,
    action: "admin.support.reply",
    resource: "SupportTicket",
    resourceId: String(ticket._id),
  });

  return getTicket(String(ticket._id));
}

export async function updateTicket(
  id: string,
  actorId: string,
  input: z.infer<typeof updateTicketSchema>,
) {
  const ticket = await SupportTicket.findById(oid(id));
  if (!ticket) throw new AppError(404, "NOT_FOUND", "Support ticket not found");

  if (input.status) ticket.status = input.status;
  if (input.priority) ticket.priority = input.priority;
  await ticket.save();

  if (input.status === "resolved") {
    await createNotification({
      userId: String(ticket.userId),
      title: "Ticket resolved",
      body: `Your support ticket “${ticket.subject}” has been marked resolved.`,
      type: "support",
      meta: { ticketId: String(ticket._id) },
    });
  }

  await writeAuditLog({
    actorId,
    action: "admin.support.update",
    resource: "SupportTicket",
    resourceId: String(ticket._id),
    meta: input,
  });

  return getTicket(String(ticket._id));
}

// ——— Reports ———

export async function getReports() {
  const [
    students,
    instructors,
    published,
    pending,
    openTickets,
    resolvedTickets,
    certPending,
    certIssued,
    enrollments,
  ] = await Promise.all([
    User.countDocuments({ role: "Student" }),
    User.countDocuments({ role: "Instructor" }),
    Course.countDocuments({ status: "published", isDisabled: { $ne: true } }),
    Course.countDocuments(pendingReviewFilter()),
    SupportTicket.countDocuments({ status: "open" }),
    SupportTicket.countDocuments({ status: "resolved" }),
    CertificateRequest.countDocuments({ status: "pending" }),
    CertificateRequest.countDocuments({ status: "issued" }),
    Enrollment.find({ status: { $in: ["active", "completed"] } })
      .select("createdAt")
      .lean(),
  ]);

  const months: { label: string; enrollments: number; tickets: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = d.toLocaleString("en", { month: "short" });
    const enrollmentsCount = enrollments.filter(
      (e) => e.createdAt >= d && e.createdAt < next,
    ).length;
    months.push({ label, enrollments: enrollmentsCount, tickets: 0 });
  }

  const tickets = await SupportTicket.find()
    .select("createdAt status")
    .lean();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
    months[i].tickets = tickets.filter(
      (t) => t.createdAt >= d && t.createdAt < next,
    ).length;
  }

  return {
    summary: {
      students,
      instructors,
      publishedCourses: published,
      pendingCourses: pending,
      openTickets,
      resolvedTickets,
      pendingCertificates: certPending,
      issuedCertificates: certIssued,
      totalUsers: students + instructors,
    },
    chart: months,
    composition: [
      { name: "Students", value: students },
      { name: "Instructors", value: instructors },
    ],
    courseStatus: [
      { name: "Published", value: published },
      { name: "Pending review", value: pending },
    ],
  };
}

// ——— Profile & notifications ———

export async function updateProfile(
  userId: string,
  input: z.infer<typeof updateAdminProfileSchema>,
) {
  const user = await User.findById(oid(userId));
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  if (input.fullName !== undefined) user.fullName = input.fullName;
  if (input.phone !== undefined) user.phone = input.phone;
  if (input.bio !== undefined) user.bio = input.bio;
  if (input.avatarUrl !== undefined) {
    user.avatarUrl = input.avatarUrl || undefined;
  }
  await user.save();
  return toPublicUser(user);
}

export async function listNotifications(userId: string) {
  const items = await Notification.find({ userId: oid(userId) })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  return items.map((n) => ({
    id: String(n._id),
    title: n.title,
    body: n.body,
    type: n.type,
    read: Boolean(n.readAt),
    createdAt: n.createdAt,
  }));
}

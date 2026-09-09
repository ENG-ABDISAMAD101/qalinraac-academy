import { z } from "zod";
import { Types } from "mongoose";
import { AppError } from "../../lib/app-error.js";
import { AcademySettings } from "../../models/AcademySettings.js";
import { Course } from "../../models/Course.js";
import { Enrollment } from "../../models/Enrollment.js";
import { Expense } from "../../models/Expense.js";
import { Invoice } from "../../models/Invoice.js";
import { ManualIncome } from "../../models/ManualIncome.js";
import { Payment } from "../../models/Payment.js";
import { Shareholder } from "../../models/Shareholder.js";
import { User } from "../../models/User.js";
import { Withdrawal } from "../../models/Withdrawal.js";
import { createNotification } from "../notifications/notifications.service.js";

function oid(id: string) {
  return new Types.ObjectId(id);
}

function populatedDoc<T>(value: unknown): T | null {
  if (!value || typeof value !== "object") return null;
  return value as T;
}

async function getSharePercent() {
  const settings = await AcademySettings.findOne().lean();
  return settings?.instructorSharePercent ?? 70;
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dateRange(period?: string): Date | null {
  const now = new Date();
  if (!period || period === "all") return null;
  if (period === "today") return startOfDay(now);
  if (period === "weekly") {
    const d = startOfDay(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "monthly") {
    const d = startOfDay(now);
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  if (period === "annual") {
    const d = startOfDay(now);
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }
  return null;
}

function moneyLabel(cents: number) {
  return Number((cents / 100).toFixed(2));
}

async function instructorEarningsSummary(instructorId: string) {
  const share = await getSharePercent();
  const courses = await Course.find({
    instructorIds: oid(instructorId),
  })
    .select("_id")
    .lean();
  const courseIds = courses.map((c) => c._id);
  let grossCents = 0;
  if (courseIds.length) {
    const paid = await Invoice.find({
      courseId: { $in: courseIds },
      status: "paid",
    }).lean();
    grossCents = paid.reduce((s, inv) => s + inv.amountCents, 0);
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
    sharePercent: share,
    grossCents,
    platformShareCents: grossCents - totalEarnings,
    totalEarnings,
    pendingWithdrawal,
    completedWithdrawal,
    availableBalance,
  };
}

// ——— Dashboard ———

export async function getFinanceDashboard() {
  const [
    paidInvoices,
    manualIncomes,
    expenses,
    pendingWithdrawalCount,
    shareholdersActive,
    pendingWithdrawals,
    chartMonths,
  ] = await Promise.all([
    Invoice.find({ status: "paid" }).lean(),
    ManualIncome.find().lean(),
    Expense.find().lean(),
    Withdrawal.countDocuments({ status: "pending" }),
    Shareholder.countDocuments({ status: "active" }),
    Withdrawal.find({ status: "pending" })
      .populate("instructorId", "fullName email avatarUrl")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    buildMonthlyChart(),
  ]);

  const courseSalesCents = paidInvoices.reduce((s, i) => s + i.amountCents, 0);
  const manualIncomeCents = manualIncomes.reduce((s, i) => s + i.amountCents, 0);
  const totalRevenueCents = courseSalesCents + manualIncomeCents;
  const totalExpensesCents = expenses.reduce((s, e) => s + e.amountCents, 0);
  const share = await getSharePercent();
  const totalInstructorPayments = Math.round((courseSalesCents * share) / 100);

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = dateRange("weekly")!;
  const monthStart = dateRange("monthly")!;
  const yearStart = dateRange("annual")!;

  const sumRevenueSince = (since: Date) => {
    const course = paidInvoices
      .filter((i) => new Date(i.paidAt ?? i.createdAt) >= since)
      .reduce((s, i) => s + i.amountCents, 0);
    const manual = manualIncomes
      .filter((i) => new Date(i.incomeDate) >= since)
      .reduce((s, i) => s + i.amountCents, 0);
    return course + manual;
  };
  const sumExpenseSince = (since: Date) =>
    expenses
      .filter((e) => new Date(e.expenseDate) >= since)
      .reduce((s, e) => s + e.amountCents, 0);

  return {
    stats: {
      totalRevenue: moneyLabel(totalRevenueCents),
      totalExpenses: moneyLabel(totalExpensesCents),
      netProfit: moneyLabel(totalRevenueCents - totalExpensesCents),
      pendingWithdrawals: pendingWithdrawalCount,
      totalInstructorPayments: moneyLabel(totalInstructorPayments),
      activeShareholders: shareholdersActive,
    },
    revenueOverview: {
      today: moneyLabel(sumRevenueSince(todayStart)),
      weekly: moneyLabel(sumRevenueSince(weekStart)),
      monthly: moneyLabel(sumRevenueSince(monthStart)),
      annual: moneyLabel(sumRevenueSince(yearStart)),
      courseSales: moneyLabel(courseSalesCents),
      manualIncome: moneyLabel(manualIncomeCents),
    },
    expenseOverview: {
      today: moneyLabel(sumExpenseSince(todayStart)),
      monthly: moneyLabel(sumExpenseSince(monthStart)),
      annual: moneyLabel(sumExpenseSince(yearStart)),
    },
    pendingWithdrawals: pendingWithdrawals.map((w) => {
      const instructor = populatedDoc<{
        fullName: string;
        email: string;
        avatarUrl?: string;
      }>(w.instructorId);
      return {
        id: String(w._id),
        instructor: instructor?.fullName ?? "Instructor",
        instructorEmail: instructor?.email ?? "",
        amount: moneyLabel(w.amountCents),
        amountCents: w.amountCents,
        method: formatMethod(w.paymentMethod),
        status: formatWithdrawalStatus(w.status),
        requestedAt: w.createdAt,
      };
    }),
    chart: chartMonths,
  };
}

async function buildMonthlyChart() {
  const months: { label: string; revenue: number; expenses: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const [inv, man, exp] = await Promise.all([
      Invoice.find({
        status: "paid",
        $or: [
          { paidAt: { $gte: start, $lt: end } },
          { paidAt: null, createdAt: { $gte: start, $lt: end } },
        ],
      }).lean(),
      ManualIncome.find({ incomeDate: { $gte: start, $lt: end } }).lean(),
      Expense.find({ expenseDate: { $gte: start, $lt: end } }).lean(),
    ]);
    const revenue =
      inv.reduce((s, x) => s + x.amountCents, 0) +
      man.reduce((s, x) => s + x.amountCents, 0);
    const expenses = exp.reduce((s, x) => s + x.amountCents, 0);
    months.push({
      label: start.toLocaleString(undefined, { month: "short" }),
      revenue: moneyLabel(revenue),
      expenses: moneyLabel(expenses),
    });
  }
  return months;
}

function formatMethod(method: string) {
  const map: Record<string, string> = {
    waafi: "Waafi",
    evc_plus: "EVC Plus",
    zaad: "Zaad",
    bank_transfer: "Bank Transfer",
    stripe: "Stripe",
    manual: "Manual",
  };
  return map[method] ?? method;
}

function formatWithdrawalStatus(status: string) {
  if (status === "pending") return "Pending";
  if (status === "approved") return "Approved";
  if (status === "completed") return "Completed";
  if (status === "rejected") return "Rejected";
  return status;
}

// ——— Revenue ———

export async function listRevenue(query: {
  period?: string;
  method?: string;
  q?: string;
  source?: string;
}) {
  const since = dateRange(query.period);
  const invoiceFilter: Record<string, unknown> = { status: "paid" };
  if (since) {
    invoiceFilter.$or = [
      { paidAt: { $gte: since } },
      { paidAt: null, createdAt: { $gte: since } },
    ];
  }
  const manualFilter: Record<string, unknown> = {};
  if (since) manualFilter.incomeDate = { $gte: since };

  const [invoices, manuals, payments] = await Promise.all([
    Invoice.find(invoiceFilter)
      .populate("userId", "fullName email")
      .populate("courseId", "title instructorIds")
      .sort({ paidAt: -1, createdAt: -1 })
      .lean(),
    ManualIncome.find(manualFilter).sort({ incomeDate: -1 }).lean(),
    Payment.find({ status: "succeeded" }).lean(),
  ]);

  const paymentByInvoice = new Map(
    payments.map((p) => [String(p.invoiceId), p]),
  );

  const instructorIds = new Set<string>();
  for (const inv of invoices) {
    const course = populatedDoc<{
      instructorIds?: Types.ObjectId[];
    }>(inv.courseId);
    for (const id of course?.instructorIds ?? []) instructorIds.add(String(id));
  }
  const instructors = await User.find({
    _id: { $in: [...instructorIds].map(oid) },
  })
    .select("fullName")
    .lean();
  const instructorName = new Map(
    instructors.map((u) => [String(u._id), u.fullName]),
  );

  let rows: {
    id: string;
    student: string;
    course: string;
    instructor: string;
    amount: number;
    amountCents: number;
    paymentMethod: string;
    paymentGateway: string;
    date: string;
    source: "Course Sales" | "Manual Income";
    createdAt: string;
  }[] = [];

  for (const inv of invoices) {
    const student = populatedDoc<{ fullName: string }>(inv.userId);
    const course = populatedDoc<{
      title: string;
      instructorIds?: Types.ObjectId[];
    }>(inv.courseId);
    const pay = paymentByInvoice.get(String(inv._id));
    const method = pay?.provider ?? "manual";
    const primaryInstructorId = course?.instructorIds?.[0]
      ? String(course.instructorIds[0])
      : "";
    rows.push({
      id: String(inv._id),
      student: student?.fullName ?? "Student",
      course: course?.title ?? inv.description ?? "Course",
      instructor: instructorName.get(primaryInstructorId) ?? "—",
      amount: moneyLabel(inv.amountCents),
      amountCents: inv.amountCents,
      paymentMethod: formatMethod(method),
      paymentGateway: formatMethod(method),
      date: new Date(inv.paidAt ?? inv.createdAt).toISOString(),
      source: "Course Sales",
      createdAt: new Date(inv.paidAt ?? inv.createdAt).toISOString(),
    });
  }

  for (const m of manuals) {
    rows.push({
      id: String(m._id),
      student: "—",
      course: m.title,
      instructor: "—",
      amount: moneyLabel(m.amountCents),
      amountCents: m.amountCents,
      paymentMethod: formatMethod(m.paymentMethod),
      paymentGateway: "Manual",
      date: new Date(m.incomeDate).toISOString(),
      source: "Manual Income",
      createdAt: new Date(m.incomeDate).toISOString(),
    });
  }

  rows.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  if (query.source === "course") {
    rows = rows.filter((r) => r.source === "Course Sales");
  } else if (query.source === "manual") {
    rows = rows.filter((r) => r.source === "Manual Income");
  }

  if (query.method?.trim()) {
    const needle = query.method.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.paymentMethod.toLowerCase().includes(needle) ||
        r.paymentGateway.toLowerCase().includes(needle),
    );
  }

  if (query.q?.trim()) {
    const needle = query.q.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.student.toLowerCase().includes(needle) ||
        r.course.toLowerCase().includes(needle) ||
        r.instructor.toLowerCase().includes(needle) ||
        r.paymentMethod.toLowerCase().includes(needle) ||
        r.source.toLowerCase().includes(needle),
    );
  }

  const methods = [
    ...new Set(rows.map((r) => r.paymentMethod).filter(Boolean)),
  ].sort();

  return { items: rows, methods, total: rows.length };
}

export const createManualIncomeSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(500).optional(),
  amountCents: z.coerce.number().int().min(1),
  paymentMethod: z.string().min(2).max(60),
  incomeDate: z.string().optional(),
});

export async function createManualIncome(
  actorId: string,
  input: z.infer<typeof createManualIncomeSchema>,
) {
  const parsed = createManualIncomeSchema.parse(input);
  const doc = await ManualIncome.create({
    title: parsed.title.trim(),
    description: parsed.description?.trim(),
    amountCents: parsed.amountCents,
    paymentMethod: parsed.paymentMethod.trim(),
    incomeDate: parsed.incomeDate ? new Date(parsed.incomeDate) : new Date(),
    createdBy: oid(actorId),
  });
  return {
    id: String(doc._id),
    title: doc.title,
    amount: moneyLabel(doc.amountCents),
    paymentMethod: doc.paymentMethod,
    date: doc.incomeDate,
  };
}

// ——— Expenses ———

export async function listExpenses(query: {
  period?: string;
  q?: string;
}) {
  const since = dateRange(query.period);
  const filter: Record<string, unknown> = {};
  if (since) filter.expenseDate = { $gte: since };

  const items = await Expense.find(filter)
    .populate("createdBy", "fullName")
    .sort({ expenseDate: -1 })
    .lean();

  let rows = items.map((e) => {
    const creator = populatedDoc<{ fullName: string }>(e.createdBy);
    return {
      id: String(e._id),
      title: e.title,
      description: e.description ?? "",
      amount: moneyLabel(e.amountCents),
      amountCents: e.amountCents,
      category: e.category ?? "—",
      date: e.expenseDate.toISOString(),
      createdBy: creator?.fullName ?? "—",
    };
  });

  if (query.q?.trim()) {
    const needle = query.q.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        r.description.toLowerCase().includes(needle) ||
        r.category.toLowerCase().includes(needle) ||
        r.createdBy.toLowerCase().includes(needle),
    );
  }

  return { items: rows, total: rows.length };
}

export const createExpenseSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(500).optional(),
  amountCents: z.coerce.number().int().min(1),
  category: z.string().max(80).optional(),
  expenseDate: z.string().optional(),
});

export async function createExpense(
  actorId: string,
  input: z.infer<typeof createExpenseSchema>,
) {
  const parsed = createExpenseSchema.parse(input);
  const doc = await Expense.create({
    title: parsed.title.trim(),
    description: parsed.description?.trim(),
    amountCents: parsed.amountCents,
    category: parsed.category?.trim(),
    expenseDate: parsed.expenseDate
      ? new Date(parsed.expenseDate)
      : new Date(),
    createdBy: oid(actorId),
  });
  return {
    id: String(doc._id),
    title: doc.title,
    amount: moneyLabel(doc.amountCents),
    date: doc.expenseDate,
  };
}

// ——— Instructor payments (read-only ledger) ———

export async function listInstructorPayments(query: { q?: string }) {
  const share = await getSharePercent();
  const invoices = await Invoice.find({ status: "paid", courseId: { $ne: null } })
    .populate("userId", "fullName email")
    .populate("courseId", "title instructorIds")
    .sort({ paidAt: -1 })
    .lean();

  let rows: {
    id: string;
    instructorId: string;
    instructor: string;
    course: string;
    student: string;
    studentEmail: string;
    gross: number;
    instructorShare: number;
    platformShare: number;
    amountCents: number;
    date: string;
  }[] = invoices.map((inv) => {
    const student = populatedDoc<{ fullName: string; email: string }>(
      inv.userId,
    );
    const course = populatedDoc<{
      title: string;
      instructorIds?: Types.ObjectId[];
    }>(inv.courseId);
    const instructorId = course?.instructorIds?.[0]
      ? String(course.instructorIds[0])
      : "";
    const instructorShare = Math.round((inv.amountCents * share) / 100);
    return {
      id: String(inv._id),
      instructorId,
      instructor: "",
      course: course?.title ?? "Course",
      student: student?.fullName ?? "Student",
      studentEmail: student?.email ?? "",
      gross: moneyLabel(inv.amountCents),
      instructorShare: moneyLabel(instructorShare),
      platformShare: moneyLabel(inv.amountCents - instructorShare),
      amountCents: instructorShare,
      date: new Date(inv.paidAt ?? inv.createdAt).toISOString(),
    };
  });

  const instructorIds = [
    ...new Set(rows.map((r) => r.instructorId).filter(Boolean)),
  ];
  const instructors = await User.find({
    _id: { $in: instructorIds.map(oid) },
  })
    .select("fullName")
    .lean();
  const names = new Map(instructors.map((u) => [String(u._id), u.fullName]));

  rows = rows.map((r) => ({
    ...r,
    instructor: names.get(r.instructorId) ?? "Instructor",
  }));

  if (query.q?.trim()) {
    const needle = query.q.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.instructor.toLowerCase().includes(needle) ||
        r.course.toLowerCase().includes(needle) ||
        r.student.toLowerCase().includes(needle),
    );
  }

  return { items: rows, sharePercent: share, total: rows.length };
}

// ——— Withdrawals ———

export async function listWithdrawals(query: {
  status?: string;
  q?: string;
}) {
  const filter: Record<string, unknown> = {};
  if (query.status && query.status !== "all") {
    filter.status = query.status;
  }

  const items = await Withdrawal.find(filter)
    .populate("instructorId", "fullName email avatarUrl phone")
    .sort({ createdAt: -1 })
    .lean();

  const enriched = await Promise.all(
    items.map(async (w) => {
      const instructor = populatedDoc<{
        _id: Types.ObjectId;
        fullName: string;
        email: string;
        avatarUrl?: string;
        phone?: string;
      }>(w.instructorId);
      const instructorId = instructor ? String(instructor._id) : String(w.instructorId);
      const earnings = await instructorEarningsSummary(instructorId);
      const balanceExcludingThis =
        w.status === "pending" || w.status === "approved"
          ? earnings.availableBalance + w.amountCents
          : earnings.availableBalance;
      const canApprove = balanceExcludingThis >= w.amountCents;

      return {
        id: String(w._id),
        instructorId,
        instructor: instructor?.fullName ?? "Instructor",
        instructorEmail: instructor?.email ?? "",
        avatarUrl: instructor?.avatarUrl,
        phone: instructor?.phone ?? "",
        amount: moneyLabel(w.amountCents),
        amountCents: w.amountCents,
        method: formatMethod(w.paymentMethod),
        paymentMethod: w.paymentMethod,
        status: formatWithdrawalStatus(w.status),
        rawStatus: w.status,
        note: w.note ?? "",
        rejectionReason: w.rejectionReason ?? "",
        requestedAt: w.createdAt.toISOString(),
        processedAt: w.processedAt?.toISOString(),
        availableBalance: moneyLabel(earnings.availableBalance),
        availableBalanceCents: earnings.availableBalance,
        balanceExcludingThisCents: balanceExcludingThis,
        canApprove,
        insufficientBalance: !canApprove && w.status === "pending",
      };
    }),
  );

  let rows = enriched;
  if (query.q?.trim()) {
    const needle = query.q.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.instructor.toLowerCase().includes(needle) ||
        r.instructorEmail.toLowerCase().includes(needle) ||
        r.method.toLowerCase().includes(needle) ||
        r.status.toLowerCase().includes(needle),
    );
  }

  const pendingCount = await Withdrawal.countDocuments({ status: "pending" });
  const completedCount = await Withdrawal.countDocuments({
    status: "completed",
  });

  return {
    items: rows,
    total: rows.length,
    stats: {
      pending: pendingCount,
      completed: completedCount,
    },
  };
}

export async function getWithdrawal(id: string) {
  const w = await Withdrawal.findById(id)
    .populate("instructorId", "fullName email avatarUrl phone")
    .lean();
  if (!w) throw new AppError(404, "NOT_FOUND", "Withdrawal not found");

  const instructor = populatedDoc<{
    _id: Types.ObjectId;
    fullName: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
  }>(w.instructorId);
  const instructorId = instructor
    ? String(instructor._id)
    : String(w.instructorId);
  const earnings = await instructorEarningsSummary(instructorId);

  const courses = await Course.find({
    instructorIds: oid(instructorId),
  })
    .select("title")
    .lean();
  const courseIds = courses.map((c) => c._id);
  const studentCount = courseIds.length
    ? await Enrollment.countDocuments({
        courseId: { $in: courseIds },
        status: { $in: ["active", "completed"] },
      })
    : 0;

  const previousWithdrawals = await Withdrawal.find({
    instructorId: oid(instructorId),
    _id: { $ne: w._id },
    status: { $in: ["completed", "approved"] },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const balanceExcludingThis =
    w.status === "pending" || w.status === "approved"
      ? earnings.availableBalance + w.amountCents
      : earnings.availableBalance;
  const canApprove = balanceExcludingThis >= w.amountCents;

  return {
    id: String(w._id),
    instructor: {
      id: instructorId,
      fullName: instructor?.fullName ?? "Instructor",
      email: instructor?.email ?? "",
      avatarUrl: instructor?.avatarUrl,
      phone: instructor?.phone ?? "",
    },
    courses: courses.map((c) => ({ id: String(c._id), title: c.title })),
    students: studentCount,
    amount: moneyLabel(w.amountCents),
    amountCents: w.amountCents,
    method: formatMethod(w.paymentMethod),
    paymentMethod: w.paymentMethod,
    status: formatWithdrawalStatus(w.status),
    rawStatus: w.status,
    note: w.note ?? "",
    rejectionReason: w.rejectionReason ?? "",
    requestedAt: w.createdAt.toISOString(),
    processedAt: w.processedAt?.toISOString(),
    accountDetails: {
      phone: instructor?.phone ?? "—",
      email: instructor?.email ?? "—",
      method: formatMethod(w.paymentMethod),
      note: w.note ?? "—",
    },
    previousWithdrawals: previousWithdrawals.map((p) => ({
      id: String(p._id),
      amount: moneyLabel(p.amountCents),
      method: formatMethod(p.paymentMethod),
      status: formatWithdrawalStatus(p.status),
      date: p.processedAt?.toISOString() ?? p.createdAt.toISOString(),
    })),
    earnings: {
      total: moneyLabel(earnings.totalEarnings),
      platformShare: moneyLabel(earnings.platformShareCents),
      availableBalance: moneyLabel(earnings.availableBalance),
      pendingWithdrawal: moneyLabel(earnings.pendingWithdrawal),
      completedWithdrawal: moneyLabel(earnings.completedWithdrawal),
      sharePercent: earnings.sharePercent,
    },
    canApprove,
    insufficientBalance: !canApprove && w.status === "pending",
    insufficientMessage: !canApprove
      ? "This instructor’s available earnings are lower than the requested withdrawal. Approve is disabled until the balance covers the request."
      : null,
  };
}

export async function completeWithdrawal(id: string, actorId: string) {
  const w = await Withdrawal.findById(id);
  if (!w) throw new AppError(404, "NOT_FOUND", "Withdrawal not found");
  if (w.status !== "pending" && w.status !== "approved") {
    throw new AppError(400, "INVALID_STATUS", "Withdrawal cannot be completed");
  }

  const detail = await getWithdrawal(id);
  if (!detail.canApprove) {
    throw new AppError(
      400,
      "INSUFFICIENT_BALANCE",
      detail.insufficientMessage ?? "Insufficient instructor balance",
    );
  }

  w.status = "completed";
  w.processedAt = new Date();
  await w.save();

  await createNotification({
    userId: String(w.instructorId),
    title: "Withdrawal completed",
    body: `Your withdrawal of $${moneyLabel(w.amountCents).toFixed(2)} has been paid.`,
    type: "payment",
    meta: { withdrawalId: String(w._id), actorId },
  });

  return getWithdrawal(id);
}

export const rejectWithdrawalSchema = z.object({
  reason: z.string().min(3).max(500),
});

export async function rejectWithdrawal(
  id: string,
  actorId: string,
  input: z.infer<typeof rejectWithdrawalSchema>,
) {
  const parsed = rejectWithdrawalSchema.parse(input);
  const w = await Withdrawal.findById(id);
  if (!w) throw new AppError(404, "NOT_FOUND", "Withdrawal not found");
  if (w.status !== "pending" && w.status !== "approved") {
    throw new AppError(400, "INVALID_STATUS", "Withdrawal cannot be rejected");
  }
  w.status = "rejected";
  w.rejectionReason = parsed.reason.trim();
  w.processedAt = new Date();
  await w.save();

  await createNotification({
    userId: String(w.instructorId),
    title: "Withdrawal rejected",
    body: `Your withdrawal was rejected: ${parsed.reason.trim()}`,
    type: "payment",
    meta: { withdrawalId: String(w._id), actorId },
  });

  return getWithdrawal(id);
}

// ——— Shareholders ———

export async function listShareholders(query: { q?: string }) {
  let items = await Shareholder.find().sort({ createdAt: -1 }).lean();
  if (query.q?.trim()) {
    const needle = query.q.trim().toLowerCase();
    items = items.filter(
      (s) =>
        s.fullName.toLowerCase().includes(needle) ||
        (s.email ?? "").toLowerCase().includes(needle) ||
        (s.phone ?? "").toLowerCase().includes(needle),
    );
  }
  return {
    items: items.map((s) => ({
      id: String(s._id),
      fullName: s.fullName,
      email: s.email ?? "—",
      phone: s.phone ?? "—",
      sharePercent: s.sharePercent,
      investment: moneyLabel(s.investmentCents),
      investmentCents: s.investmentCents,
      status: s.status === "active" ? "Active" : "Inactive",
      rawStatus: s.status,
      notes: s.notes ?? "",
      createdAt: s.createdAt.toISOString(),
    })),
    total: items.length,
  };
}

export const createShareholderSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional(),
  sharePercent: z.coerce.number().min(0).max(100),
  investmentCents: z.coerce.number().int().min(0),
  notes: z.string().max(500).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function createShareholder(
  actorId: string,
  input: z.infer<typeof createShareholderSchema>,
) {
  const parsed = createShareholderSchema.parse(input);
  const doc = await Shareholder.create({
    fullName: parsed.fullName.trim(),
    email: parsed.email?.trim() || undefined,
    phone: parsed.phone?.trim(),
    sharePercent: parsed.sharePercent,
    investmentCents: parsed.investmentCents,
    notes: parsed.notes?.trim(),
    status: parsed.status ?? "active",
    createdBy: oid(actorId),
  });
  return { id: String(doc._id), fullName: doc.fullName };
}

// ——— Reports ———

export async function getFinanceReports() {
  const [
    dashboard,
    revenue,
    expenses,
    withdrawals,
    payments,
    shareholders,
  ] = await Promise.all([
    getFinanceDashboard(),
    listRevenue({ period: "all" }),
    listExpenses({ period: "all" }),
    listWithdrawals({ status: "all" }),
    listInstructorPayments({}),
    listShareholders({}),
  ]);

  const completedWithdrawals = withdrawals.items.filter(
    (w) => w.rawStatus === "completed",
  );
  const withdrawTotal = completedWithdrawals.reduce(
    (s, w) => s + w.amountCents,
    0,
  );

  const table = [
    ...revenue.items.map((r) => ({
      id: `rev-${r.id}`,
      type: r.source,
      party: r.student !== "—" ? r.student : r.course,
      detail: r.course,
      method: r.paymentMethod,
      amount: r.amount,
      amountCents: r.amountCents,
      direction: "in" as const,
      date: r.date,
    })),
    ...expenses.items.map((e) => ({
      id: `exp-${e.id}`,
      type: "Expense",
      party: e.createdBy,
      detail: e.title,
      method: e.category,
      amount: e.amount,
      amountCents: e.amountCents,
      direction: "out" as const,
      date: e.date,
    })),
    ...completedWithdrawals.map((w) => ({
      id: `wd-${w.id}`,
      type: "Withdrawal",
      party: w.instructor,
      detail: w.method,
      method: w.method,
      amount: w.amount,
      amountCents: w.amountCents,
      direction: "out" as const,
      date: w.processedAt ?? w.requestedAt,
    })),
    ...payments.items.map((p) => ({
      id: `pay-${p.id}`,
      type: "Instructor Earning",
      party: p.instructor,
      detail: `${p.course} · ${p.student}`,
      method: "Course sale share",
      amount: p.instructorShare,
      amountCents: p.amountCents,
      direction: "out" as const,
      date: p.date,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    summary: {
      income: dashboard.stats.totalRevenue,
      expense: dashboard.stats.totalExpenses,
      withdraw: moneyLabel(withdrawTotal),
      studentCourseSales: dashboard.revenueOverview.courseSales,
      balance: dashboard.stats.netProfit,
      instructorPayments: dashboard.stats.totalInstructorPayments,
      shareholders: shareholders.total,
    },
    chart: dashboard.chart,
    breakdown: [
      { label: "Course sales", value: dashboard.revenueOverview.courseSales },
      { label: "Manual income", value: dashboard.revenueOverview.manualIncome },
      { label: "Expenses", value: dashboard.stats.totalExpenses },
      { label: "Withdrawals", value: moneyLabel(withdrawTotal) },
      {
        label: "Instructor earnings",
        value: dashboard.stats.totalInstructorPayments,
      },
    ],
    table,
    shareholders: shareholders.items,
  };
}

export async function updateFinanceProfile(
  userId: string,
  input: {
    fullName?: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
  },
) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "NOT_FOUND", "User not found");
  if (input.fullName != null) user.fullName = input.fullName.trim();
  if (input.phone != null) user.phone = input.phone.trim();
  if (input.bio != null) user.bio = input.bio;
  if (input.avatarUrl !== undefined) {
    user.avatarUrl = input.avatarUrl || undefined;
  }
  await user.save();
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
    isActive: user.isActive,
  };
}

export const updateFinanceProfileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(24).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

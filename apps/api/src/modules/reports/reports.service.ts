import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Course } from "../../models/Course.js";
import { Enrollment } from "../../models/Enrollment.js";
import { Invoice } from "../../models/Invoice.js";
import { CertificateRequest } from "../../models/CertificateRequest.js";
import { User } from "../../models/User.js";
import { ResearchProject } from "../../models/ResearchProject.js";

export async function getSummaryStats() {
  const [
    users,
    courses,
    publishedCourses,
    enrollments,
    completedEnrollments,
    openInvoices,
    paidInvoices,
    pendingCertificates,
    issuedCertificates,
    researchProjects,
  ] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Course.countDocuments({ status: "published" }),
    Enrollment.countDocuments(),
    Enrollment.countDocuments({ status: "completed" }),
    Invoice.countDocuments({ status: "open" }),
    Invoice.countDocuments({ status: "paid" }),
    CertificateRequest.countDocuments({ status: "pending" }),
    CertificateRequest.countDocuments({ status: "issued" }),
    ResearchProject.countDocuments(),
  ]);

  const revenueAgg = await Invoice.aggregate([
    { $match: { status: "paid" } },
    { $group: { _id: null, totalCents: { $sum: "$amountCents" } } },
  ]);

  const enrollmentsByStatus = await Enrollment.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const invoicesByStatus = await Invoice.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  return {
    users,
    courses,
    publishedCourses,
    enrollments,
    completedEnrollments,
    openInvoices,
    paidInvoices,
    revenueCents: revenueAgg[0]?.totalCents ?? 0,
    pendingCertificates,
    issuedCertificates,
    researchProjects,
    charts: {
      enrollmentsByStatus: enrollmentsByStatus.map((r) => ({
        name: String(r._id ?? "unknown"),
        value: r.count as number,
      })),
      invoicesByStatus: invoicesByStatus.map((r) => ({
        name: String(r._id ?? "unknown"),
        value: r.count as number,
      })),
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function exportSummaryExcel(): Promise<Buffer> {
  const stats = await getSummaryStats();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Summary");
  sheet.columns = [
    { header: "Metric", key: "metric", width: 28 },
    { header: "Value", key: "value", width: 18 },
  ];
  const rows: Array<[string, string | number]> = [
    ["Users", stats.users],
    ["Courses", stats.courses],
    ["Published courses", stats.publishedCourses],
    ["Enrollments", stats.enrollments],
    ["Completed enrollments", stats.completedEnrollments],
    ["Open invoices", stats.openInvoices],
    ["Paid invoices", stats.paidInvoices],
    ["Revenue (cents)", stats.revenueCents],
    ["Pending certificates", stats.pendingCertificates],
    ["Issued certificates", stats.issuedCertificates],
    ["Research projects", stats.researchProjects],
    ["Generated at", stats.generatedAt],
  ];
  for (const [metric, value] of rows) {
    sheet.addRow({ metric, value });
  }
  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function exportSummaryPdf(): Promise<Buffer> {
  const stats = await getSummaryStats();
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  page.drawText("Qalinraac Academy — Report Summary", {
    x: 50,
    y: 740,
    size: 16,
    font: bold,
    color: rgb(0.04, 0.27, 0.2),
  });

  const lines = [
    `Users: ${stats.users}`,
    `Courses: ${stats.courses} (${stats.publishedCourses} published)`,
    `Enrollments: ${stats.enrollments} (${stats.completedEnrollments} completed)`,
    `Invoices: ${stats.openInvoices} open / ${stats.paidInvoices} paid`,
    `Revenue: $${(stats.revenueCents / 100).toFixed(2)}`,
    `Certificates: ${stats.pendingCertificates} pending / ${stats.issuedCertificates} issued`,
    `Research projects: ${stats.researchProjects}`,
    `Generated: ${stats.generatedAt}`,
  ];

  let y = 700;
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 11, font, color: rgb(0.1, 0.1, 0.1) });
    y -= 22;
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

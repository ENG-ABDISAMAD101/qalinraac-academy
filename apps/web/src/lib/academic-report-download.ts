"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const LOGO_PATH = "/qalinraac-acadmy-logo.jpeg";
const BRAND_NAVY: [number, number, number] = [0, 43, 92];
const BRAND_LIME: [number, number, number] = [112, 193, 0];

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export type ReportColumn = { key: string; label: string };

export async function downloadReportPdf(opts: {
  title: string;
  subtitle?: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
  fileName: string;
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const logo = await loadLogoDataUrl();
  if (logo) {
    try {
      doc.addImage(logo, "JPEG", 40, 28, 42, 42);
    } catch {
      /* ignore logo failures */
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_NAVY);
  doc.setFontSize(18);
  doc.text("Qalinraac Academy", logo ? 95 : 40, 46);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(opts.title, logo ? 95 : 40, 64);
  if (opts.subtitle) {
    doc.setFontSize(9);
    doc.text(opts.subtitle, logo ? 95 : 40, 78);
  }

  doc.setDrawColor(...BRAND_LIME);
  doc.setLineWidth(2);
  doc.line(40, 92, doc.internal.pageSize.getWidth() - 40, 92);

  autoTable(doc, {
    startY: 104,
    head: [opts.columns.map((c) => c.label)],
    body: opts.rows.map((row) =>
      opts.columns.map((c) => String(row[c.key] ?? "—")),
    ),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: {
      fillColor: BRAND_NAVY,
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [244, 246, 249] },
    margin: { left: 40, right: 40 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Generated ${new Date().toLocaleString()} · Page ${i}/${pageCount}`,
      40,
      doc.internal.pageSize.getHeight() - 24,
    );
  }

  doc.save(opts.fileName.endsWith(".pdf") ? opts.fileName : `${opts.fileName}.pdf`);
}

export function downloadReportXlsx(opts: {
  sheetName: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
  fileName: string;
}) {
  const data = opts.rows.map((row) => {
    const out: Record<string, string | number> = {};
    for (const col of opts.columns) {
      out[col.label] = row[col.key] ?? "";
    }
    return out;
  });
  const sheet = XLSX.utils.json_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, opts.sheetName.slice(0, 31));
  XLSX.writeFile(
    book,
    opts.fileName.endsWith(".xlsx") ? opts.fileName : `${opts.fileName}.xlsx`,
  );
}

import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./reports.service.js";

export async function summary(_req: Request, res: Response) {
  const data = await service.getSummaryStats();
  return sendSuccess(res, data);
}

export async function exportExcel(_req: Request, res: Response) {
  const buf = await service.exportSummaryExcel();
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", 'attachment; filename="qalinraac-report.xlsx"');
  return res.send(buf);
}

export async function exportPdf(_req: Request, res: Response) {
  const buf = await service.exportSummaryPdf();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="qalinraac-report.pdf"');
  return res.send(buf);
}

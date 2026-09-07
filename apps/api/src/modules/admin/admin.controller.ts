import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./admin.service.js";

export async function getSettings(_req: Request, res: Response) {
  const data = await service.getSettings();
  return sendSuccess(res, data);
}

export async function updateSettings(req: Request, res: Response) {
  const data = await service.updateSettings(req.body, req.user!.id);
  return sendSuccess(res, data);
}

export async function listAudit(req: Request, res: Response) {
  const data = await service.listAuditLogs(req.query as never);
  return sendSuccess(res, data.items, 200, {
    total: data.total,
    page: data.page,
    limit: data.limit,
  });
}

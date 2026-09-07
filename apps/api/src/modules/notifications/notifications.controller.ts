import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./notifications.service.js";

export async function list(req: Request, res: Response) {
  const data = await service.listMine(req.user!.id);
  return sendSuccess(res, data);
}

export async function markRead(req: Request, res: Response) {
  const data = await service.markRead(req.params.id, req.user!.id);
  return sendSuccess(res, data);
}

export async function markAllRead(req: Request, res: Response) {
  const data = await service.markAllRead(req.user!.id);
  return sendSuccess(res, data);
}

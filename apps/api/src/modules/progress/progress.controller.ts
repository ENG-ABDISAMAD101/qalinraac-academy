import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./progress.service.js";

export async function complete(req: Request, res: Response) {
  const data = await service.markLessonComplete(req.user!.id, req.body);
  return sendSuccess(res, data);
}

export async function get(req: Request, res: Response) {
  const data = await service.getProgress(req.user!.id, req.params.courseId);
  return sendSuccess(res, data);
}

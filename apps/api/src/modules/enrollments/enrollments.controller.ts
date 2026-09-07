import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./enrollments.service.js";

export async function enroll(req: Request, res: Response) {
  const data = await service.enroll(req.body, req.user!.id, req.user!.role);
  return sendSuccess(res, data, 201);
}

export async function mine(req: Request, res: Response) {
  const data = await service.myCourses(req.user!.id);
  return sendSuccess(res, data);
}

export async function roster(req: Request, res: Response) {
  const data = await service.roster(req.params.courseId);
  return sendSuccess(res, data);
}

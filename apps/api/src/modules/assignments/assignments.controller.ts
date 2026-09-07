import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./assignments.service.js";

export async function create(req: Request, res: Response) {
  const data = await service.createAssignment(req.body, req.user!.id);
  return sendSuccess(res, data, 201);
}

export async function list(req: Request, res: Response) {
  const data = await service.listAssignments(req.query.courseId as string | undefined);
  return sendSuccess(res, data);
}

export async function get(req: Request, res: Response) {
  const data = await service.getAssignment(req.params.id);
  return sendSuccess(res, data);
}

export async function update(req: Request, res: Response) {
  const data = await service.updateAssignment(req.params.id, req.body);
  return sendSuccess(res, data);
}

export async function remove(req: Request, res: Response) {
  const data = await service.deleteAssignment(req.params.id);
  return sendSuccess(res, data);
}

export async function submit(req: Request, res: Response) {
  const data = await service.submitAssignment(req.params.id, req.user!.id, req.body);
  return sendSuccess(res, data, 201);
}

export async function grade(req: Request, res: Response) {
  const data = await service.gradeSubmission(
    req.params.id,
    req.params.userId,
    req.body,
    req.user!.id,
  );
  return sendSuccess(res, data);
}

export async function submissions(req: Request, res: Response) {
  const data = await service.listSubmissions(req.params.id);
  return sendSuccess(res, data);
}

import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./courses.service.js";

export async function list(req: Request, res: Response) {
  const data = await service.listCourses(req.query as never);
  return sendSuccess(res, data.items, 200, {
    total: data.total,
    page: data.page,
    limit: data.limit,
  });
}

export async function get(req: Request, res: Response) {
  const data = await service.getCourse(req.params.id);
  return sendSuccess(res, data);
}

export async function create(req: Request, res: Response) {
  const data = await service.createCourse(req.body, req.user!.id);
  return sendSuccess(res, data, 201);
}

export async function update(req: Request, res: Response) {
  const data = await service.updateCourse(req.params.id, req.body, req.user!.id);
  return sendSuccess(res, data);
}

export async function publish(req: Request, res: Response) {
  const data = await service.publishCourse(req.params.id, req.user!.id);
  return sendSuccess(res, data);
}

export async function requestChanges(req: Request, res: Response) {
  const data = await service.requestCourseChanges(
    req.params.id,
    req.user!.id,
    typeof req.body?.reason === "string" ? req.body.reason : undefined,
  );
  return sendSuccess(res, data);
}

export async function remove(req: Request, res: Response) {
  const data = await service.deleteCourse(req.params.id, req.user!.id);
  return sendSuccess(res, data);
}

export async function addModule(req: Request, res: Response) {
  const data = await service.addModule(req.params.id, req.body);
  return sendSuccess(res, data, 201);
}

export async function addLesson(req: Request, res: Response) {
  const data = await service.addLesson(req.params.id, req.params.moduleId, req.body);
  return sendSuccess(res, data, 201);
}

export async function updateLesson(req: Request, res: Response) {
  const data = await service.updateLesson(req.params.lessonId, req.body);
  return sendSuccess(res, data);
}

export async function deleteLesson(req: Request, res: Response) {
  const data = await service.deleteLesson(req.params.lessonId);
  return sendSuccess(res, data);
}

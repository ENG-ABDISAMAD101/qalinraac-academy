import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./quizzes.service.js";

export async function create(req: Request, res: Response) {
  const data = await service.createQuiz(req.body, req.user!.id);
  return sendSuccess(res, data, 201);
}

export async function list(req: Request, res: Response) {
  const data = await service.listQuizzes(req.query.courseId as string | undefined);
  return sendSuccess(res, data);
}

export async function get(req: Request, res: Response) {
  const hideAnswers = !req.user!.permissions.includes("quizzes:write");
  const data = await service.getQuiz(req.params.id, hideAnswers);
  return sendSuccess(res, data);
}

export async function update(req: Request, res: Response) {
  const data = await service.updateQuiz(req.params.id, req.body);
  return sendSuccess(res, data);
}

export async function remove(req: Request, res: Response) {
  const data = await service.deleteQuiz(req.params.id);
  return sendSuccess(res, data);
}

export async function attempt(req: Request, res: Response) {
  const data = await service.attemptQuiz(req.params.id, req.user!.id, req.body);
  return sendSuccess(res, data, 201);
}

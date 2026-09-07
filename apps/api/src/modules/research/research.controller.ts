import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./research.service.js";

export async function create(req: Request, res: Response) {
  const data = await service.createProject(req.body, req.user!.id);
  return sendSuccess(res, data, 201);
}

export async function list(req: Request, res: Response) {
  const mine = req.query.mine === "true";
  const data = await service.listProjects({
    authorId: mine ? req.user!.id : undefined,
    status: req.query.status as string | undefined,
  });
  return sendSuccess(res, data);
}

export async function get(req: Request, res: Response) {
  const data = await service.getProject(req.params.id);
  return sendSuccess(res, data);
}

export async function update(req: Request, res: Response) {
  const data = await service.updateProject(req.params.id, req.body, req.user!.id);
  return sendSuccess(res, data);
}

export async function review(req: Request, res: Response) {
  const data = await service.reviewProject(req.params.id, req.body, req.user!.id);
  return sendSuccess(res, data);
}

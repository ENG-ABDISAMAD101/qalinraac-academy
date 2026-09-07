import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as usersService from "./users.service.js";

export async function list(req: Request, res: Response) {
  const data = await usersService.listUsers(req.query as never);
  return sendSuccess(res, data.items, 200, {
    total: data.total,
    page: data.page,
    limit: data.limit,
  });
}

export async function get(req: Request, res: Response) {
  const data = await usersService.getUser(req.params.id);
  return sendSuccess(res, data);
}

export async function update(req: Request, res: Response) {
  const data = await usersService.updateUser(req.params.id, req.body, req.user!.id);
  return sendSuccess(res, data);
}

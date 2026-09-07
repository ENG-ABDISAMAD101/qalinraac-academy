import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as authService from "./auth.service.js";

export async function register(req: Request, res: Response) {
  const data = await authService.register(req.body, req.ip);
  return sendSuccess(res, data, 201);
}

export async function login(req: Request, res: Response) {
  const data = await authService.login(req.body, req.ip);
  return sendSuccess(res, data);
}

export async function refresh(req: Request, res: Response) {
  const data = await authService.refresh(req.body.refreshToken);
  return sendSuccess(res, data);
}

export async function logout(req: Request, res: Response) {
  const data = await authService.logout(req.body.refreshToken);
  return sendSuccess(res, data);
}

export async function me(req: Request, res: Response) {
  const data = await authService.me(req.user!.id);
  return sendSuccess(res, data);
}

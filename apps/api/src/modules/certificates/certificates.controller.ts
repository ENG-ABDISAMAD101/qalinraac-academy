import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./certificates.service.js";

export async function request(req: Request, res: Response) {
  const data = await service.requestCertificate(req.user!.id, req.body.courseId);
  return sendSuccess(res, data, 201);
}

export async function list(req: Request, res: Response) {
  const data = await service.listRequests(req.query.status as string | undefined);
  return sendSuccess(res, data);
}

export async function mine(req: Request, res: Response) {
  const data = await service.myCertificates(req.user!.id);
  return sendSuccess(res, data);
}

export async function issue(req: Request, res: Response) {
  const data = await service.issueCertificate(req.params.id, req.body, req.user!.id);
  return sendSuccess(res, data);
}

export async function reject(req: Request, res: Response) {
  const data = await service.rejectCertificate(req.params.id, req.body, req.user!.id);
  return sendSuccess(res, data);
}

export async function download(req: Request, res: Response) {
  const data = await service.downloadCertificate(
    req.params.id,
    req.user!.id,
    req.user!.role,
  );
  return sendSuccess(res, data);
}

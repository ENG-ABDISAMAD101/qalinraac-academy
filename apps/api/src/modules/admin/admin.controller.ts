import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as portal from "./admin-portal.service.js";
import * as service from "./admin.service.js";

export async function getSettings(_req: Request, res: Response) {
  const data = await service.getSettings();
  return sendSuccess(res, data);
}

export async function updateSettings(req: Request, res: Response) {
  const data = await service.updateSettings(req.body, req.user!.id);
  return sendSuccess(res, data);
}

export async function listAudit(req: Request, res: Response) {
  const data = await service.listAuditLogs(req.query as never);
  return sendSuccess(res, data.items, 200, {
    total: data.total,
    page: data.page,
    limit: data.limit,
  });
}

export async function getDashboard(_req: Request, res: Response) {
  const data = await portal.getAdminDashboard();
  return sendSuccess(res, data);
}

export async function listStudents(req: Request, res: Response) {
  const data = await portal.listStudents(
    typeof req.query.q === "string" ? req.query.q : undefined,
  );
  return sendSuccess(res, data);
}

export async function getStudent(req: Request, res: Response) {
  const data = await portal.getStudent(req.params.id);
  return sendSuccess(res, data);
}

export async function listInstructors(req: Request, res: Response) {
  const data = await portal.listInstructors(
    typeof req.query.q === "string" ? req.query.q : undefined,
  );
  return sendSuccess(res, data);
}

export async function getInstructor(req: Request, res: Response) {
  const data = await portal.getInstructor(req.params.id);
  return sendSuccess(res, data);
}

export async function listCourses(req: Request, res: Response) {
  const data = await portal.listCourses({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
  });
  return sendSuccess(res, data);
}

export async function listCertificates(req: Request, res: Response) {
  const data = await portal.listCertificates({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    status:
      typeof req.query.status === "string" ? req.query.status : undefined,
  });
  return sendSuccess(res, data);
}

export async function getCertificate(req: Request, res: Response) {
  const data = await portal.getCertificate(req.params.id);
  return sendSuccess(res, data);
}

export async function uploadCertificate(req: Request, res: Response) {
  const data = await portal.uploadCertificateFile(
    req.params.id,
    req.body,
    req.user!.id,
  );
  return sendSuccess(res, data);
}

export async function listTickets(req: Request, res: Response) {
  const data = await portal.listTickets({
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    priority:
      typeof req.query.priority === "string" ? req.query.priority : undefined,
  });
  return sendSuccess(res, data);
}

export async function getTicket(req: Request, res: Response) {
  const data = await portal.getTicket(req.params.id);
  return sendSuccess(res, data);
}

export async function replyTicket(req: Request, res: Response) {
  const data = await portal.replyToTicket(
    req.params.id,
    req.user!.id,
    req.body,
  );
  return sendSuccess(res, data);
}

export async function updateTicket(req: Request, res: Response) {
  const data = await portal.updateTicket(
    req.params.id,
    req.user!.id,
    req.body,
  );
  return sendSuccess(res, data);
}

export async function getReports(_req: Request, res: Response) {
  const data = await portal.getReports();
  return sendSuccess(res, data);
}

export async function updateProfile(req: Request, res: Response) {
  const data = await portal.updateProfile(req.user!.id, req.body);
  return sendSuccess(res, data);
}

export async function listNotifications(req: Request, res: Response) {
  const data = await portal.listNotifications(req.user!.id);
  return sendSuccess(res, data);
}

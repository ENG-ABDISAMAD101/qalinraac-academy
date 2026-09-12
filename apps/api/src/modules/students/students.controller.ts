import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./students.service.js";

export async function dashboard(req: Request, res: Response) {
  const data = await service.getStudentDashboard(req.user!.id);
  return sendSuccess(res, data);
}

export async function myCourses(req: Request, res: Response) {
  const data = await service.getMyCourses(req.user!.id);
  return sendSuccess(res, data);
}

export async function learnCourse(req: Request, res: Response) {
  const data = await service.getLearnCourse(req.user!.id, req.params.courseId);
  return sendSuccess(res, data);
}

export async function feedback(req: Request, res: Response) {
  const data = await service.getFeedback(req.user!.id);
  return sendSuccess(res, data);
}

export async function feedbackQuiz(req: Request, res: Response) {
  const data = await service.getFeedbackQuiz(req.user!.id, req.params.quizId);
  return sendSuccess(res, data);
}

export async function feedbackAssignment(req: Request, res: Response) {
  const data = await service.getFeedbackAssignment(
    req.user!.id,
    req.params.assignmentId,
  );
  return sendSuccess(res, data);
}

export async function replyAssignment(req: Request, res: Response) {
  const data = await service.replyToAssignment(
    req.user!.id,
    req.params.assignmentId,
    req.body,
  );
  return sendSuccess(res, data, 201);
}

export async function myOrders(req: Request, res: Response) {
  const data = await service.getMyOrders(req.user!.id);
  return sendSuccess(res, data);
}

export async function myResources(req: Request, res: Response) {
  const data = await service.getMyResources(req.user!.id);
  return sendSuccess(res, data);
}

export async function listSupport(req: Request, res: Response) {
  const data = await service.listMySupport(req.user!.id);
  return sendSuccess(res, data);
}

export async function createSupport(req: Request, res: Response) {
  const data = await service.createSupportTicket(req.user!.id, req.body);
  return sendSuccess(res, data, 201);
}

export async function getSupport(req: Request, res: Response) {
  const data = await service.getMySupportTicket(req.user!.id, req.params.id);
  return sendSuccess(res, data);
}

export async function updateSupportStatus(req: Request, res: Response) {
  const data = await service.updateMySupportTicketStatus(
    req.user!.id,
    req.params.id,
    req.body,
  );
  return sendSuccess(res, data);
}

export async function replySupport(req: Request, res: Response) {
  const data = await service.replyToMySupportTicket(
    req.user!.id,
    req.params.id,
    req.body,
  );
  return sendSuccess(res, data, 201);
}

export async function updateProfile(req: Request, res: Response) {
  const data = await service.updateMyProfile(req.user!.id, req.body);
  return sendSuccess(res, data);
}

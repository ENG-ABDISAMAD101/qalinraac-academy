import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./academic.service.js";

function id(req: Request) {
  return req.user!.id;
}

export async function dashboard(_req: Request, res: Response) {
  return sendSuccess(res, await service.getDashboard());
}

export async function listStudents(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.listStudents(String(req.query.q ?? "")),
  );
}

export async function searchStudents(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.searchStudents(String(req.query.q ?? "")),
  );
}

export async function listInstructors(req: Request, res: Response) {
  const filter = String(req.query.filter ?? "all") as
    | "all"
    | "active"
    | "activity";
  return sendSuccess(
    res,
    await service.listInstructors({
      q: String(req.query.q ?? ""),
      filter,
    }),
  );
}

export async function getInstructor(req: Request, res: Response) {
  return sendSuccess(res, await service.getInstructor(req.params.id));
}

export async function listCourses(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.listCourses(String(req.query.status ?? "all")),
  );
}

export async function getCourseReview(req: Request, res: Response) {
  return sendSuccess(res, await service.getCourseReview(req.params.id));
}

export async function approveCourse(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.approveCourse(req.params.id, id(req)),
  );
}

export async function publishApprovedCourse(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.publishApprovedCourse(req.params.id, id(req)),
  );
}

export async function requestChanges(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.requestChanges(req.params.id, id(req), req.body?.reason),
  );
}

export async function rejectCourse(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.rejectCourse(req.params.id, id(req), req.body.reason),
  );
}

export async function setCourseStatus(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.setCourseStatus(
      req.params.id,
      id(req),
      req.body.status,
      req.body.reason,
    ),
  );
}

export async function disableCourse(req: Request, res: Response) {
  const disabled = req.body?.disabled !== false;
  return sendSuccess(
    res,
    await service.disablePublishedCourse(req.params.id, id(req), disabled),
  );
}

export async function replyDiscussion(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.replyCourseDiscussion(id(req), req.params.id, req.body.body),
    201,
  );
}

export async function listActivations(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.listActivations(String(req.query.status ?? "all")),
  );
}

export async function getActivation(req: Request, res: Response) {
  return sendSuccess(res, await service.getActivation(req.params.id));
}

export async function createActivation(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.createActivation(id(req), req.body),
    201,
  );
}

export async function approveActivation(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.approveActivation(req.params.id, id(req)),
  );
}

export async function rejectActivation(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.rejectActivation(req.params.id, id(req), req.body.reason),
  );
}

export async function listPublishedCourses(_req: Request, res: Response) {
  return sendSuccess(res, await service.listPublishedCoursesForActivation());
}

export async function listCertificates(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.listCertificates(String(req.query.status ?? "all")),
  );
}

export async function getCertificate(req: Request, res: Response) {
  return sendSuccess(res, await service.getCertificate(req.params.id));
}

export async function approveCertificate(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.approveCertificate(req.params.id, id(req)),
  );
}

export async function readyCertificate(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.markCertificateReady(req.params.id, id(req)),
  );
}

export async function rejectCertificate(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.rejectCertificate(req.params.id, id(req), req.body.reason),
  );
}

export async function listAgreements(_req: Request, res: Response) {
  return sendSuccess(res, await service.listAgreements());
}

export async function createAgreement(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.createAgreement(id(req), req.body),
    201,
  );
}

export async function updateAgreement(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.updateAgreement(req.params.id, id(req), req.body),
  );
}

export async function reports(_req: Request, res: Response) {
  return sendSuccess(res, await service.getReports());
}

export async function updateProfile(req: Request, res: Response) {
  return sendSuccess(res, await service.updateProfile(id(req), req.body));
}

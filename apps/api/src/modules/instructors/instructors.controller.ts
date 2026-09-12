import type { Request, Response } from "express";
import { sendSuccess } from "../../lib/api-response.js";
import * as service from "./instructors.service.js";

function id(req: Request) {
  return req.user!.id;
}

export async function dashboard(req: Request, res: Response) {
  return sendSuccess(res, await service.getDashboard(id(req)));
}

export async function completeOnboarding(req: Request, res: Response) {
  return sendSuccess(res, await service.completeOnboarding(id(req)));
}

export async function updateProfile(req: Request, res: Response) {
  return sendSuccess(res, await service.updateProfile(id(req), req.body));
}

export async function listCourses(req: Request, res: Response) {
  return sendSuccess(res, await service.listCourses(id(req)));
}

export async function createCourse(req: Request, res: Response) {
  return sendSuccess(res, await service.createCourse(id(req), req.body), 201);
}

export async function getCourse(req: Request, res: Response) {
  return sendSuccess(res, await service.getCourse(id(req), req.params.id));
}

export async function openCourseEditor(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.openCourseEditor(id(req), req.params.id),
  );
}

export async function updateCourse(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.updateCourse(id(req), req.params.id, req.body),
  );
}

export async function saveDraft(req: Request, res: Response) {
  return sendSuccess(res, await service.saveDraft(id(req), req.params.id));
}

export async function submitForReview(req: Request, res: Response) {
  return sendSuccess(res, await service.submitForReview(id(req), req.params.id));
}

export async function requestUpdate(req: Request, res: Response) {
  return sendSuccess(res, await service.requestUpdate(id(req), req.params.id));
}

export async function addModule(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.addModule(id(req), req.params.id, req.body),
    201,
  );
}

export async function addLesson(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.addLesson(
      id(req),
      req.params.id,
      req.params.moduleId,
      req.body,
    ),
    201,
  );
}

export async function updateLesson(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.updateLesson(id(req), req.params.lessonId, req.body),
  );
}

export async function deleteLesson(req: Request, res: Response) {
  return sendSuccess(res, await service.deleteLesson(id(req), req.params.lessonId));
}

export async function deleteModule(req: Request, res: Response) {
  return sendSuccess(res, await service.deleteModule(id(req), req.params.moduleId));
}

export async function updateModule(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.updateModule(id(req), req.params.moduleId, req.body),
  );
}

export async function reorderCurriculum(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.reorderCurriculum(id(req), req.params.id, req.body),
  );
}

export async function duplicateLesson(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.duplicateLesson(id(req), req.params.lessonId),
  );
}

export async function submitChecklist(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.getSubmitChecklist(id(req), req.params.id),
  );
}

export async function replyCourseDiscussion(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.replyCourseDiscussion(id(req), req.params.id, req.body.body),
    201,
  );
}

export async function listCourseLessons(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.listCourseLessons(id(req), req.params.id),
  );
}

export async function listCourseCurriculum(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.listCourseCurriculum(id(req), req.params.id),
  );
}

export async function listStudents(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.listStudents(id(req), String(req.query.q ?? "")),
  );
}

export async function listAssignments(req: Request, res: Response) {
  return sendSuccess(res, await service.listAssignments(id(req)));
}

export async function createAssignment(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.createAssignment(id(req), req.body),
    201,
  );
}

export async function updateAssignment(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.updateAssignment(id(req), req.params.id, req.body),
  );
}

export async function deleteAssignment(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.deleteAssignment(id(req), req.params.id),
  );
}

export async function getAssignment(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.getAssignmentDetail(id(req), req.params.id),
  );
}

export async function replyAssignment(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.replyAssignmentDiscussion(
      id(req),
      req.params.id,
      req.body.body,
    ),
    201,
  );
}

export async function gradeSubmission(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.gradeSubmission(
      id(req),
      req.params.id,
      req.params.userId,
      req.body,
    ),
  );
}

export async function listQuizzes(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.listQuizzes(id(req), String(req.query.q ?? "")),
  );
}

export async function createQuiz(req: Request, res: Response) {
  return sendSuccess(res, await service.createQuiz(id(req), req.body), 201);
}

export async function updateQuiz(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.updateQuiz(id(req), req.params.id, req.body),
  );
}

export async function deleteQuiz(req: Request, res: Response) {
  return sendSuccess(res, await service.deleteQuiz(id(req), req.params.id));
}

export async function getQuizResults(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.getQuizResults(id(req), req.params.id),
  );
}

export async function reviewQuizAttempt(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.reviewQuizAttempt(
      id(req),
      req.params.id,
      req.params.attemptId,
      {
        feedback: req.body?.feedback,
        allowRetake: Boolean(req.body?.allowRetake),
      },
    ),
  );
}

export async function listResources(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.listResources(id(req), String(req.query.q ?? "")),
  );
}

export async function createResource(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.createResource(id(req), req.body),
    201,
  );
}

export async function deleteResource(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.deleteResource(id(req), req.params.id),
  );
}

export async function listEarnings(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.listEarnings(id(req), String(req.query.q ?? "")),
  );
}

export async function listWithdrawals(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.listWithdrawals(id(req), String(req.query.q ?? "")),
  );
}

export async function createWithdrawal(req: Request, res: Response) {
  return sendSuccess(
    res,
    await service.createWithdrawal(id(req), req.body),
    201,
  );
}

export async function listAgreements(req: Request, res: Response) {
  return sendSuccess(res, await service.listAgreements(id(req)));
}

export async function listSupport(req: Request, res: Response) {
  return sendSuccess(res, await service.listSupport(id(req)));
}

export async function createSupport(req: Request, res: Response) {
  return sendSuccess(res, await service.createSupport(id(req), req.body), 201);
}

export async function getSupport(req: Request, res: Response) {
  return sendSuccess(res, await service.getSupport(id(req), req.params.id));
}

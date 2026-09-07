import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./quizzes.controller.js";
import {
  attemptQuizSchema,
  createQuizSchema,
  updateQuizSchema,
} from "./quizzes.service.js";

export const quizzesRouter = Router();

quizzesRouter.use(authenticate);

quizzesRouter.get("/", asyncHandler(controller.list));
quizzesRouter.get("/:id", asyncHandler(controller.get));

quizzesRouter.post(
  "/",
  requirePermission("quizzes:write"),
  validate(createQuizSchema),
  asyncHandler(controller.create),
);

quizzesRouter.patch(
  "/:id",
  requirePermission("quizzes:write"),
  validate(updateQuizSchema),
  asyncHandler(controller.update),
);

quizzesRouter.delete(
  "/:id",
  requirePermission("quizzes:write"),
  asyncHandler(controller.remove),
);

quizzesRouter.post(
  "/:id/attempt",
  requirePermission("quizzes:attempt"),
  validate(attemptQuizSchema),
  asyncHandler(controller.attempt),
);

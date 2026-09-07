import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./research.controller.js";
import {
  createResearchSchema,
  reviewSchema,
  updateResearchSchema,
} from "./research.service.js";

export const researchRouter = Router();

researchRouter.use(authenticate);

researchRouter.get(
  "/",
  requirePermission("research:read"),
  asyncHandler(controller.list),
);

researchRouter.get(
  "/:id",
  requirePermission("research:read"),
  asyncHandler(controller.get),
);

researchRouter.post(
  "/",
  requirePermission("research:write"),
  validate(createResearchSchema),
  asyncHandler(controller.create),
);

researchRouter.patch(
  "/:id",
  requirePermission("research:write"),
  validate(updateResearchSchema),
  asyncHandler(controller.update),
);

researchRouter.post(
  "/:id/review",
  requirePermission("research:review"),
  validate(reviewSchema),
  asyncHandler(controller.review),
);

import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./certificates.controller.js";
import {
  issueSchema,
  rejectSchema,
  requestCertificateSchema,
} from "./certificates.service.js";

export const certificatesRouter = Router();

certificatesRouter.use(authenticate);

certificatesRouter.post(
  "/request",
  requirePermission("certificates:request"),
  validate(requestCertificateSchema),
  asyncHandler(controller.request),
);

certificatesRouter.get("/mine", asyncHandler(controller.mine));

certificatesRouter.get(
  "/",
  requirePermission("certificates:issue"),
  asyncHandler(controller.list),
);

certificatesRouter.post(
  "/:id/issue",
  requirePermission("certificates:issue"),
  validate(issueSchema),
  asyncHandler(controller.issue),
);

certificatesRouter.post(
  "/:id/reject",
  requirePermission("certificates:issue"),
  validate(rejectSchema),
  asyncHandler(controller.reject),
);

certificatesRouter.get(
  "/:id/download",
  requirePermission("certificates:read"),
  asyncHandler(controller.download),
);

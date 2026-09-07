import { Router } from "express";
import { paginationQuerySchema } from "@qalinraac/shared";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./users.controller.js";
import { updateUserSchema } from "./users.service.js";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get(
  "/",
  requirePermission("users:read"),
  validate(paginationQuerySchema, "query"),
  asyncHandler(controller.list),
);

usersRouter.get("/:id", requirePermission("users:read"), asyncHandler(controller.get));

usersRouter.patch(
  "/:id",
  requirePermission("users:write"),
  validate(updateUserSchema),
  asyncHandler(controller.update),
);

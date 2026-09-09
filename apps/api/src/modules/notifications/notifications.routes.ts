import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate, requirePermission } from "../../middleware/auth.js";
import * as controller from "./notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.use(authenticate, requirePermission("notifications:read"));

notificationsRouter.get("/", asyncHandler(controller.list));
notificationsRouter.post("/read-all", asyncHandler(controller.markAllRead));
notificationsRouter.post("/:id/read", asyncHandler(controller.markRead));
notificationsRouter.delete("/:id", asyncHandler(controller.remove));

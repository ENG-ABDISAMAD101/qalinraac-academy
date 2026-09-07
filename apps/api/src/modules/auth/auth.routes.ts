import { Router } from "express";
import { loginSchema, registerSchema } from "@qalinraac/shared";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./auth.controller.js";

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const authRouter = Router();

authRouter.post(
  "/register",
  validate(registerSchema),
  asyncHandler(controller.register),
);
authRouter.post("/login", validate(loginSchema), asyncHandler(controller.login));
authRouter.post("/refresh", validate(refreshSchema), asyncHandler(controller.refresh));
authRouter.post("/logout", validate(refreshSchema), asyncHandler(controller.logout));
authRouter.get("/me", authenticate, asyncHandler(controller.me));

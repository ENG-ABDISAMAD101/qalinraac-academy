import { Router, type Router as ExpressRouter } from "express";
import type { HealthResponse } from "@qalinraac/shared";
import { sendSuccess } from "../../lib/api-response.js";

export const healthRouter: ExpressRouter = Router();

healthRouter.get("/", (_req, res) => {
  const payload: HealthResponse = {
    status: "ok",
    service: "qalinraac-api",
    timestamp: new Date().toISOString(),
    tenancy: "single-tenant",
  };
  return sendSuccess(res, payload);
});

import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { sendError } from "../lib/api-response.js";
import { AppError } from "../lib/app-error.js";
import { logger } from "../lib/logger.js";

export function notFoundHandler(_req: Request, res: Response) {
  return sendError(res, 404, "NOT_FOUND", "Route not found");
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err instanceof ZodError) {
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid request", err.flatten());
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name?: string }).name === "CastError"
  ) {
    return sendError(res, 400, "INVALID_ID", "Invalid resource id");
  }

  logger.error("Unhandled error", { err });
  return sendError(res, 500, "INTERNAL_ERROR", "Internal server error");
}

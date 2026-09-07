import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

type RequestTarget = "body" | "query" | "params";

export function validate(schema: ZodSchema, target: RequestTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[target]);
      if (target === "query") {
        Object.assign(req.query, parsed);
      } else if (target === "params") {
        Object.assign(req.params, parsed);
      } else {
        req.body = parsed;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

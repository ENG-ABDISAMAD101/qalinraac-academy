import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { validate } from "../../middleware/validate.js";
import * as service from "./public-courses.service.js";

export const publicRouter = Router();

const listQuery = z.object({
  q: z.string().optional(),
});

publicRouter.get(
  "/courses",
  validate(listQuery, "query"),
  asyncHandler(async (req, res) => {
    const data = await service.listPublicCourses({
      q: typeof req.query.q === "string" ? req.query.q : undefined,
    });
    return sendSuccess(res, data);
  }),
);

publicRouter.get(
  "/courses/:idOrSlug",
  asyncHandler(async (req, res) => {
    const data = await service.getPublicCourse(req.params.idOrSlug);
    return sendSuccess(res, data);
  }),
);

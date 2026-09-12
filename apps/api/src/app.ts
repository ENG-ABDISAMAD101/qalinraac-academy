import cors from "cors";
import express, { type Express } from "express";
import path from "node:path";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { openApiDocument } from "./docs/openapi.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { coursesRouter } from "./modules/courses/courses.routes.js";
import { enrollmentsRouter } from "./modules/enrollments/enrollments.routes.js";
import { progressRouter } from "./modules/progress/progress.routes.js";
import { filesRouter } from "./modules/files/files.routes.js";
import { quizzesRouter } from "./modules/quizzes/quizzes.routes.js";
import { assignmentsRouter } from "./modules/assignments/assignments.routes.js";
import { certificatesRouter } from "./modules/certificates/certificates.routes.js";
import { researchRouter } from "./modules/research/research.routes.js";
import { financeRouter } from "./modules/finance/finance.routes.js";
import * as financeController from "./modules/finance/finance.controller.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { studentsRouter } from "./modules/students/students.routes.js";
import { instructorsRouter } from "./modules/instructors/instructors.routes.js";
import { academicRouter } from "./modules/academic/academic.routes.js";
import { publicRouter } from "./modules/public/public.routes.js";
import { asyncHandler } from "./lib/async-handler.js";

export function createApp(): Express {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  const p = env.API_PREFIX;

  // Stripe needs the raw body for signature verification
  app.post(
    `${p}/finance/webhooks/stripe`,
    express.raw({ type: "application/json" }),
    asyncHandler(financeController.stripeWebhook),
  );

  app.use(express.json({ limit: "2mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: env.NODE_ENV === "test" ? 10_000 : 500,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(
    "/uploads",
    express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)),
  );

  app.use(`${p}/docs`, swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use(`${p}/health`, healthRouter);
  app.use(`${p}/auth`, authRouter);
  app.use(`${p}/users`, usersRouter);
  app.use(`${p}/courses`, coursesRouter);
  app.use(`${p}/enrollments`, enrollmentsRouter);
  app.use(`${p}/progress`, progressRouter);
  app.use(`${p}/files`, filesRouter);
  app.use(`${p}/quizzes`, quizzesRouter);
  app.use(`${p}/assignments`, assignmentsRouter);
  app.use(`${p}/certificates`, certificatesRouter);
  app.use(`${p}/research`, researchRouter);
  app.use(`${p}/finance`, financeRouter);
  app.use(`${p}/notifications`, notificationsRouter);
  app.use(`${p}/reports`, reportsRouter);
  app.use(`${p}/admin`, adminRouter);
  app.use(`${p}/students`, studentsRouter);
  app.use(`${p}/instructors`, instructorsRouter);
  app.use(`${p}/academic`, academicRouter);
  app.use(`${p}/public`, publicRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

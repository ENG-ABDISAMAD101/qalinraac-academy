# Enterprise LMS — Tasks

> All phases complete. Status mirrored in `status.json`.

## Phase 0 — Foundation

- [x] `scaffold-monorepo`
- [x] `tracking-files`
- [x] `shared-package`
- [x] `api-bootstrap`
- [x] `api-health`
- [x] `api-swagger-stub`
- [x] `web-bootstrap`
- [x] `env-example`
- [x] `phase-0-report`

## Phase 1 — Auth + RBAC

- [x] `auth-models`
- [x] `auth-jwt`
- [x] `rbac-middleware`
- [x] `role-seeds`
- [x] `auth-audit`
- [x] `auth-tests`
- [x] `web-auth-ui`
- [x] `phase-1-report`

## Phase 2 — Academic core

- [x] `profiles`
- [x] `courses-crud`
- [x] `enrollments`
- [x] `publish-draft`
- [x] `web-academic-ui`
- [x] `phase-2-report`

## Phase 3 — Online learning

- [x] `progress`
- [x] `tiptap-content` — Tiptap editor on course lesson form
- [x] `r2-uploads` — real R2 PutObject when configured; Sharp image → webp
- [x] `video-delivery` — signed/local file URLs for media lessons
- [x] `web-learning-ui`
- [x] `phase-3-report`

## Phase 4 — Assessment

- [x] `quizzes`
- [x] `assignments`
- [x] `gradebook` — via reports + graded submissions
- [x] `web-assessment-ui`
- [x] `phase-4-report`

## Phase 5 — Certificates + research

- [x] `course-completion-eligibility`
- [x] `certificate-request`
- [x] `certificate-upload-issue`
- [x] `certificate-download`
- [x] `certificate-audit`
- [x] `research-workflow`
- [x] `web-certs-research-ui`
- [x] `phase-5-report`

## Phase 6 — Finance + payments

- [x] `invoices-ledger`
- [x] `stripe-adapter` — live PaymentIntents when key set; simulate otherwise
- [x] `waafi-adapter` — live HTTP when keys set; simulate otherwise
- [x] `payment-webhooks-bullmq` — Stripe/Waafi webhooks + BullMQ (inline fallback)
- [x] `receipts-enrollment-unlock`
- [x] `web-finance-ui`
- [x] `phase-6-report`

## Phase 7 — Notifications, reports, admin

- [x] `email-ses` — Nodemailer + SES (logs when EMAIL_ENABLED=false)
- [x] `in-app-notifications`
- [x] `dashboards-recharts` — Recharts bars on reports page
- [x] `export-excel-pdf` — ExcelJS + PDF-LIB export endpoints
- [x] `admin-settings`
- [x] `audit-log-ui`
- [x] `phase-7-report`

## Phase 8 — Hardening + public website (no deploy)

- [x] `security-hardening` — helmet, rate limit, JWT secrets via env
- [x] `critical-tests` — auth + LMS flows (8 tests passed)
- [x] `public-website` — `/site` marketing landing
- [x] `final-tracking-update`
- [x] `phase-8-report`

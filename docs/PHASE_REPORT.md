# Phase Reports — Qalinraac Academy LMS

---

## Phase 0 — Foundation

**Status:** done · **Completed:** 2026-09-05  

pnpm monorepo (`apps/web`, `apps/api`, `packages/shared`), health endpoint, Swagger stub, tracking files, env template.

---

## Phase 1 — Auth + RBAC

**Status:** done · **Completed:** 2026-09-05  

JWT access/refresh, bcryptjs, permission middleware, role seeds (6 academy roles), audit logs, web login/register. **Tests: 4/4 passed.**

Seeded SuperAdmin: `admin@qalinraac.local` / `Admin123!`

---

## Phase 2 — Academic core

**Status:** done · **Completed:** 2026-09-05  

Courses, modules, lessons, publish/draft, enrollments, roster, web course UI.

---

## Phase 3 — Online learning

**Status:** done · **Completed:** 2026-09-05  

Lesson progress, file uploads (local `uploads/` + R2-ready), learn pages for lesson completion.

---

## Phase 4 — Assessment

**Status:** done · **Completed:** 2026-09-05  

Quizzes (attempt + grade), assignments (submit + grade), web assessment pages.

---

## Phase 5 — Certificates + research

**Status:** done · **Completed:** 2026-09-05  

Student certificate **request** after course completion → admin **upload/issue** to student → download. Research projects + review. Audited.

---

## Phase 6 — Finance + payments

**Status:** done · **Completed:** 2026-09-05  

Invoices, Stripe/Waafi payment adapters (simulate when keys missing), mark paid unlocks enrollment, finance UI.

---

## Phase 7 — Notifications, reports, admin

**Status:** done · **Completed:** 2026-09-05  

In-app notifications, reports summary, admin settings, audit log UI.

---

## Phase 8 — Hardening + public website

**Status:** done · **Completed:** 2026-09-05  

Helmet + express-rate-limit, auth tests green, public marketing at `/site`. **Deployment skipped** (no VPS/Nginx/PM2) per plan.

### Final acceptance

| Item | Result |
|------|--------|
| Single-tenant one academy | pass |
| All 8 phases delivered | pass |
| Auth tests | pass |
| Public site at `/site` only | pass |
| No production deploy work | pass (by design) |
| Tracking files updated | pass |

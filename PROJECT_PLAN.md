# Enterprise LMS — PROJECT PLAN

> **Project:** Qalinraac Academy — Enterprise Learning Management System  
> **Status:** All phases complete  
> **Architecture:** Modular Monolith (single-tenant, one academy)  
> **Language:** TypeScript · **Package Manager:** pnpm

## Locked decisions

| Decision | Choice |
|----------|--------|
| Tenancy | Single-tenant — one academy |
| Roles | SuperAdmin, Admin, Instructor, Student, Finance, Researcher |
| Certificates | Request → admin upload/issue (R2/local) |
| Public website | `/site` (Phase 8) |
| Deployment | Skipped |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 0 | Foundation | done |
| 1 | Auth + RBAC | done |
| 2 | Academic core | done |
| 3 | Online learning | done |
| 4 | Assessment | done |
| 5 | Certificates + research | done |
| 6 | Finance + payments | done |
| 7 | Notifications, reports, admin | done |
| 8 | Hardening + public website | done |

See `task.md`, `status.json`, and `docs/PHASE_REPORT.md` for details.

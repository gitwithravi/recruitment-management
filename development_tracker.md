# Development Tracker — Recruitment Management Application

Tracks progress against `development_plan.md`. Update status with one of:
`[ ]` Not started · `[~]` In progress · `[x]` Done · `[!]` Blocked (add a note).

Legend at the bottom maps statuses to a quick health summary.

---

## Phase 0 — Project Bootstrap & Infrastructure

- [x] Initialize Next.js project (TypeScript, App Router)
- [x] Install and configure Tailwind CSS
- [x] Install and configure shadcn/ui (base components)
- [x] Add Prisma and initial `schema.prisma`
- [x] Add `docker-compose.yml` (PostgreSQL + volume + health check)
- [x] Add `.env`, `.env.example`, `.gitignore` secrets
- [x] Add ESLint + Prettier + `lint` / `typecheck` scripts
- [x] Create folder layout (`src/app`, `src/components`, `src/lib`, `src/server`, `src/db`, `src/features`)
- [x] Add root layout with theme provider and shell
- [x] Document local setup in `README.md`

**Phase status:** Done
**Acceptance check:** `docker compose up -d` works · `npm run dev` works · `lint`/`typecheck` pass · Prisma connects

---

## Phase 1 — Database Schema & Migrations

- [x] `User` (role enum, unique username/email)
- [x] `Job` (status enum, created_by)
- [x] `JobUser` (unique (job_id, user_id))
- [x] `JobStage` (unique (job_id, position))
- [x] `Candidate` (all 8.1 fields; unique (job_id, email), unique (job_id, phone); resume NOT NULL)
- [x] `CandidateComment` (visibility enum, soft delete)
- [x] `CommentAttachment`
- [x] `CommentMention`
- [x] `CandidateStageHistory`
- [x] `CandidateAssignmentHistory`
- [x] `CandidateOfferDetails` (1:1 with candidate)
- [x] `Notification`
- [x] `AuditLog` (metadata JSON)
- [x] Cascade rules and referential integrity
- [x] First migration generated and applied
- [x] Seed script (admin user + defaults)

**Phase status:** Done
**Acceptance check:** All Section 17 entities present · DB constraints for duplicates enforced

---

## Phase 2 — Authentication & Session Management

- [x] Choose and implement auth (NextAuth credentials or custom JWT + httpOnly cookie)
- [x] `password_hash` with bcrypt/argon2
- [x] Login form at `/login`
- [x] Login server action / route handler
- [x] Logout
- [x] `getCurrentUser()` / `requireUser()` helpers
- [x] `requireAdmin()` / `requireJobAccess(jobId)` guards
- [x] Route middleware protecting everything except `/login`
- [x] `is_active` check on auth
- [x] Header with current user + logout

**Phase status:** Done
**Acceptance check:** All pages require auth · roles distinguished · inactive users blocked

---

## Phase 3 — Admin: User Management

- [ ] `GET /admin/users` (Admin only)
- [ ] `POST /admin/users` (create)
- [ ] `PATCH /admin/users/[id]` (update)
- [ ] User list UI (shadcn DataTable)
- [ ] User create/edit dialog with validation
- [ ] Audit log on create/update/deactivate
- [ ] Prevent admin from deactivating themselves

**Phase status:** Not started
**Acceptance check:** Admin can create/manage users · non-admins blocked

---

## Phase 4 — Job Management

- [ ] `GET /jobs` (role-scoped list)
- [ ] `POST /jobs` (Admin) + seed default stages in transaction
- [ ] `GET /jobs/[id]` (guarded by `requireJobAccess`)
- [ ] `PATCH /jobs/[id]` (Admin)
- [ ] `POST /jobs/[id]/close` (Admin)
- [ ] Jobs list UI with status badges/filters
- [ ] Job create/edit dialog
- [ ] Job detail layout with tabs (Board, Candidates, Stages, Users, Reports)
- [ ] Audit log on create/edit/close

**Phase status:** Not started
**Acceptance check:** Admin creates jobs · attached users see them · unattached users blocked · close preserves data · default stages auto-created

---

## Phase 5 — Job User Assignment (Admin)

- [ ] `GET /jobs/[id]/users` (Admin)
- [ ] `POST /jobs/[id]/users` (attach; block duplicates)
- [ ] `DELETE /jobs/[id]/users/[userId]` (detach)
- [ ] UI panel with add/remove controls
- [ ] Audit log on attach/detach

**Phase status:** Not started
**Acceptance check:** Admin attaches multiple users · no duplicate attachments · detached users lose access immediately

---

## Phase 6 — Stage Configuration (Admin)

- [ ] `GET /jobs/[id]/stages`
- [ ] `POST /jobs/[id]/stages` (add)
- [ ] `PATCH /jobs/[id]/stages/[stageId]` (rename)
- [ ] `POST /jobs/[id]/stages/reorder` (transaction)
- [ ] `DELETE /jobs/[id]/stages/[stageId]` (only if empty)
- [ ] Stage config UI with drag-and-drop (`@dnd-kit/sortable`)
- [ ] Delete confirmation modal
- [ ] Audit log on stage changes

**Phase status:** Not started
**Acceptance check:** Rename/add/reorder/delete works · order reflected on board · empty-stage-only delete enforced

---

## Phase 7 — Candidate / Resume Management

- [ ] `GET /jobs/[id]/candidates` (list w/ filters/search)
- [ ] `POST /jobs/[id]/candidates` (create; validate duplicates; require resume; set initial stage)
- [ ] `GET /jobs/[id]/candidates/[candidateId]` (detail)
- [ ] `PATCH /jobs/[id]/candidates/[candidateId]` (edit; role-aware)
- [ ] `POST /jobs/[id]/candidates/[candidateId]/resume` (replace)
- [ ] `GET /jobs/[id]/candidates/[candidateId]/resume` (download, access-checked)
- [ ] File storage on disk with stable naming
- [ ] Candidate create/edit form (all 8.1 fields)
- [ ] Duplicate handling with clear server error
- [ ] Feedback field editor (assignee-gated)
- [ ] Audit log on create/update/resume replace

**Phase status:** Not started
**Acceptance check:** Admin/attached users create candidates · resume mandatory · duplicates blocked in same job · one resume per candidate · downloads access-checked · feedback rules enforced

---

## Phase 8 — Kanban Board UI

- [ ] `GET /jobs/[id]/board`
- [ ] Card component (fields per req 19.3)
- [ ] Drag-and-drop via `@dnd-kit`
- [ ] Drop opens movement modal (Phase 9)
- [ ] Filter bar (stage, assignee, source, city, experience range, notice period)
- [ ] Search input (name/email/phone, debounced)
- [ ] Live updates without full reload
- [ ] Loading + empty states
- [ ] Assigned user visual indicator on cards

**Phase status:** Not started
**Acceptance check:** One board per job · ordered columns · required card fields · drag opens modal · filters combine · search works

---

## Phase 9 — Stage Movement & History

- [ ] `POST /jobs/[id]/candidates/[candidateId]/move` (role-aware; validate target stage; write history + optional comment)
- [ ] Movement modal UI (drag-drop + card menu)
- [ ] Optimistic update with rollback
- [ ] Candidate timeline component (stage moves)

**Phase status:** Not started
**Acceptance check:** Admin moves any · users move only assigned · modal + optional comment · every move recorded · unassigned move blocked

---

## Phase 10 — Assignment Management

- [ ] `POST /jobs/[id]/candidates/[candidateId]/assign` (role-aware; validate assignee in job; allow null)
- [ ] Write `CandidateAssignmentHistory`
- [ ] Trigger in-app + email notification (Phase 13)
- [ ] Assignment UI (select from job users / Unassigned)
- [ ] Optional comment input
- [ ] Assignment history section in timeline
- [ ] Audit log on assignment

**Phase status:** Not started
**Acceptance check:** Single assignee · unassign allowed · Admin assigns any · users assign only own, only to job users · history recorded · notifications dispatched

---

## Phase 11 — Comments, Attachments, Mentions

- [ ] `GET /jobs/[id]/candidates/[candidateId]/comments` (admin-only filtered for non-admins)
- [ ] `POST .../comments` (visibility; parse @mentions against job users; create mentions; trigger notifications)
- [ ] `PATCH /jobs/[id]/comments/[commentId]` (edit own; re-parse mentions)
- [ ] `DELETE /jobs/[id]/comments/[commentId]` (own or any by Admin)
- [ ] `POST /jobs/[id]/comments/[commentId]/attachments` (upload)
- [ ] `GET .../attachments/[attachmentId]` (download, visibility + job access enforced)
- [ ] Comment thread UI with composer, visibility toggle (Admin), attachments, edit/delete menus
- [ ] Mention autocomplete (job-attached users only)
- [ ] Audit log on comment create/delete

**Phase status:** Not started
**Acceptance check:** Thread per candidate · comments + attachments in assigned jobs · admin-only hidden from users · creator/Admin delete · mentions notify in-app + email · no out-of-job mentions

---

## Phase 12 — Offer Details (Admin)

- [ ] `GET /jobs/[id]/candidates/[candidateId]/offer` (Admin only)
- [ ] `PUT .../offer` (upsert)
- [ ] Offer panel in candidate detail (server-gated)
- [ ] Offer status enum (Not Offered / Offered / Accepted / Rejected / Joined)
- [ ] Audit log on offer create/update

**Phase status:** Not started
**Acceptance check:** Admin adds/updates offer · users cannot see or edit (server-enforced) · offer persists across stage changes

---

## Phase 13 — Notifications (In-App + Email)

- [ ] `GET /notifications` (current user, unread first)
- [ ] `POST /notifications/[id]/read`
- [ ] `POST /notifications/read-all`
- [ ] Notifications dropdown/screen + unread badge
- [ ] Email transport setup (SMTP env or provider SDK)
- [ ] Email templates: assignment + mention (content per req 15.3)
- [ ] Dispatch helper (both channels; skip actor; skip out-of-job users)
- [ ] Used by Phase 10 and Phase 11

**Phase status:** Not started
**Acceptance check:** Assignment + mention notifications delivered in-app and by email with required context · no notifications to out-of-job users or the actor

---

## Phase 14 — Search, Filters, and List View

- [ ] Shared `queryCandidates({ jobId, search, filters })`
- [ ] Filters: stage, assigned_user_id, source, current_city, experience range, notice_period
- [ ] Search across name/email/phone (case-insensitive partial)
- [ ] Job-scoped; Admin can pick any accessible job
- [ ] List view (shadcn DataTable) reusing same filters

**Phase status:** Not started
**Acceptance check:** Search/filters work in accessible jobs · combinable filters · no results from unattached jobs

---

## Phase 15 — Reports

- [ ] `GET /reports/candidates-per-stage`
- [ ] `GET /reports/assigned-per-user`
- [ ] `GET /reports/source-counts`
- [ ] `GET /reports/aging` (days in current stage)
- [ ] Reports screen with job selector + relevant filters
- [ ] Admin sees all jobs; users see attached jobs only
- [ ] Each report supports CSV export (Phase 16)

**Phase status:** Not started
**Acceptance check:** Admin sees all four reports · data respects job access

---

## Phase 16 — CSV Export

- [ ] Shared CSV serializer (proper escaping)
- [ ] `GET /jobs/[id]/candidates/export` (with active filters)
- [ ] `GET /reports/[report]/export`
- [ ] Streamed `text/csv` response with `Content-Disposition: attachment`
- [ ] Job-access enforced
- [ ] `ENABLE_USER_CSV_EXPORT` env toggle for user export

**Phase status:** Not started
**Acceptance check:** Admin exports lists + reports · export respects filters · users can't export unattached jobs

---

## Phase 17 — Audit Trail & Candidate Timeline

- [ ] Central `writeAuditLog()` helper
- [ ] Central `writeCandidateHistory()` helper
- [ ] `GET /jobs/[id]/candidates/[candidateId]/history` (unified timeline)
- [ ] Strip admin-only comment content + offer details for non-admins
- [ ] Timeline UI grouped by date with action badges
- [ ] Admin-only `/admin/audit` screen with filters

**Phase status:** Not started
**Acceptance check:** All key actions recorded · chronological timeline · admin sees full · users see sanitized history for attached jobs

---

## Phase 18 — Dashboard

- [ ] `GET /dashboard` (role-aware)
- [ ] Admin: jobs count, candidates per stage, assignments per user, recent activity
- [ ] User: assigned resumes across attached jobs, recent notifications
- [ ] Quick links to jobs + notifications

**Phase status:** Not started
**Acceptance check:** Authenticated users land on a relevant, server-rendered dashboard

---

## Phase 19 — Hardening, Tests, and Polish

- [ ] Server-side access checks on every mutation
- [ ] Unit tests: duplicate logic, stage delete guard, assign/move permissions, mention parsing, CSV serializer
- [ ] Integration tests: login, job+default stages, candidate+duplicate, move+history, assign+notification, comment+mention+notification, offer visibility
- [ ] Login rate limiting
- [ ] File upload validation (mime/size)
- [ ] Error boundaries + 404/403 pages
- [ ] Loading + empty states across screens
- [ ] Final `README.md` setup + seed instructions

**Phase status:** Not started
**Acceptance check:** Business rules server-enforced · access server-enforced · DB constraints used · audit/history consistent

---

## Overall Progress Summary

| Phase | Status | Notes |
|-------|--------|-------|
| 0 — Bootstrap | Not started | |
| 1 — Schema | Not started | |
| 2 — Auth | Not started | |
| 3 — User Mgmt | Not started | |
| 4 — Jobs | Not started | |
| 5 — Job Users | Not started | |
| 6 — Stages | Not started | |
| 7 — Candidates | Not started | |
| 8 — Board UI | Not started | |
| 9 — Stage Move | Not started | |
| 10 — Assignment | Not started | |
| 11 — Comments | Not started | |
| 12 — Offers | Not started | |
| 13 — Notifications | Not started | |
| 14 — Search/Filters | Not started | |
| 15 — Reports | Not started | |
| 16 — CSV Export | Not started | |
| 17 — Audit/History | Not started | |
| 18 — Dashboard | Not started | |
| 19 — Hardening/Tests | Not started | |

**Last updated:** —
**Blockers / notes:** —

---

## Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[!]` Blocked — add a note in the phase section and the Overall Progress Summary

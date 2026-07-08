# Development Plan — Recruitment Management Application

This plan breaks the requirements in `requirements.md` into ordered, deliverable phases. Each phase lists goals, tasks, data model impact, API surface, UI screens, and the acceptance criteria it satisfies.

Stack: **Next.js (App Router) + Tailwind CSS + shadcn/ui + PostgreSQL (Docker) + Prisma**.

---

## Phase 0 — Project Bootstrap & Infrastructure

### Goals

- Initialize the Next.js application.
- Set up Docker-based PostgreSQL.
- Establish folder structure, conventions, and tooling.

### Tasks

- [x] Initialize Next.js project with TypeScript and App Router.
- [x] Install and configure Tailwind CSS.
- [x] Install and configure shadcn/ui (New York style, base components).
- [x] Add Prisma and create initial `schema.prisma`.
- [x] Add `docker-compose.yml` with a PostgreSQL service, volume, and health check.
- [x] Add `.env`, `.env.example`, and `.gitignore` entries for secrets.
- [x] Add ESLint, Prettier, and a `npm run lint` / `npm run typecheck` script.
- [x] Create folder layout: `src/app`, `src/components`, `src/lib`, `src/server`, `src/db`, `src/features`.
- [x] Add a root layout with theme provider and base layout shell.
- [x] Document local setup steps in `README.md`.

### Acceptance Criteria

- `docker compose up -d` starts PostgreSQL.
- `npm run dev` starts the app.
- `npm run lint` and `npm run typecheck` pass.
- Prisma can connect to the database.

---

## Phase 1 — Database Schema & Migrations

### Goals

- Implement all entities listed in `requirements.md` Section 17 with correct constraints.

### Tasks

- [x] Define `User` (role enum `admin`/`user`, `username` unique, `email` unique).
- [x] Define `Job` (status enum `open`/`closed`, `created_by` relation).
- [x] Define `JobUser` (unique constraint on `(job_id, user_id)`).
- [x] Define `JobStage` (unique `(job_id, position)`, belongs to one job).
- [x] Define `Candidate` with all fields from 8.1/17.5; add unique constraint on `(job_id, email)` and `(job_id, phone)`; `resume_file_path` NOT NULL.
- [x] Define `CandidateComment` with `visibility` enum (`job`/`admin`), soft delete via `deleted_at`.
- [x] Define `CommentAttachment` (belongs to comment).
- [x] Define `CommentMention` (belongs to comment + mentioned user).
- [x] Define `CandidateStageHistory` (from/to stage, moved_by, optional comment).
- [x] Define `CandidateAssignmentHistory` (previous/new assignee, assigned_by, optional comment).
- [x] Define `CandidateOfferDetails` (one-to-one with candidate).
- [x] Define `Notification` (recipient, type, title, body, related job/candidate, `read_at`).
- [x] Define `AuditLog` (actor, action, entity_type, entity_id, `metadata` JSON).
- [x] Add cascade rules and referential integrity.
- [x] Generate and run the first migration.
- [x] Add a seed script for an admin user and default data.

### Acceptance Criteria (req 20.2)

- Candidate belongs to a job and a stage.
- Candidate stage belongs to the same job as the candidate (validated at app layer).
- Assignee must be in `job_users` (validated at app layer).
- Duplicate email/phone blocked within same job via DB constraint.
- Stage delete blocked when candidates exist (app layer + transaction).

---

## Phase 2 — Authentication & Session Management

### Goals

- Internal-only authentication with role-aware session.

### Tasks

- [x] Choose auth approach (NextAuth credentials provider or custom session with httpOnly cookie + JWT).
- [x] Implement `password_hash` storage using bcrypt/argon2.
- [x] Implement login form at `/login`.
- [x] Implement login server action / route handler.
- [x] Implement logout.
- [x] Add session helper `getCurrentUser()` and `requireUser()`.
- [x] Add `requireAdmin()` and `requireJobAccess(jobId)` guards.
- [x] Add middleware to protect all routes except `/login`.
- [x] Add `is_active` check on every auth flow.
- [x] Add a basic header showing the logged-in user and a logout button.

### Acceptance Criteria (req 20.1, 4, 5)

- All pages require authentication.
- Admin and User roles are distinguished.
- Inactive users cannot sign in.

---

## Phase 3 — Admin: User Management

### Goals

- Admin can create and manage users.

### Tasks

- [x] `GET /admin/users` — list users (Admin only).
- [x] `POST /admin/users` — create user (name, username, email, role, initial password).
- [x] `PATCH /admin/users/[id]` — update user (name, email, role, is_active, password reset).
- [x] User list UI with shadcn `DataTable`.
- [x] User create/edit dialog form with validation.
- [x] Audit log on user create/update/deactivate.
- [x] Prevent admin from deactivating themselves.

### Acceptance Criteria (req 5.1)

- Admin can create users.
- Admin can manage users.
- Non-admins cannot access the user management screen.

---

## Phase 4 — Job Management

### Goals

- Admin can create/edit/close jobs; users see only attached jobs.

### Tasks

- [x] `GET /jobs` — list jobs visible to the current user (Admin: all; User: attached).
- [x] `POST /jobs` — create job (Admin only). On creation, seed default stages from req 7.2 in a transaction.
- [x] `GET /jobs/[id]` — job detail page (access guarded by `requireJobAccess`).
- [x] `PATCH /jobs/[id]` — edit job title/description/status (Admin only).
- [x] `POST /jobs/[id]/close` — close job (Admin only); data preserved.
- [x] Jobs list UI with status badges and filters.
- [x] Job create/edit dialog form.
- [x] Job detail layout with tabs (Board, Candidates, Stages, Users, Reports).
- [x] Audit log on job create/edit/close.

### Acceptance Criteria (req 6)

- Admin can create a job with title and JD.
- Attached users can see the job.
- Unattached users cannot see or access it (server-enforced).
- Admin can close a job; closed jobs remain visible to Admin; data is not deleted.
- Default stages are created automatically for new jobs.

---

## Phase 5 — Job User Assignment (Admin)

### Goals

- Admin can attach/detach users to/from jobs.

### Tasks

- [x] `GET /jobs/[id]/users` — list users attached to a job (Admin only).
- [x] `POST /jobs/[id]/users` — attach a user (Admin only); block duplicates.
- [x] `DELETE /jobs/[id]/users/[userId]` — detach a user (Admin only).
- [x] UI panel listing attached users with add/remove controls.
- [x] Audit log on attach/detach.

### Acceptance Criteria (req 6.3, 5.1)

- Admin can attach multiple users to a job.
- A user cannot be attached twice to the same job.
- Detached users immediately lose access (server-enforced on every request).

---

## Phase 6 — Stage Configuration (Admin)

### Goals

- Admin can rename, add, reorder, and delete stages.

### Tasks

- [x] `GET /jobs/[id]/stages` — list stages ordered by position.
- [x] `POST /jobs/[id]/stages` — add a stage (appends at end).
- [x] `PATCH /jobs/[id]/stages/[stageId]` — rename a stage.
- [x] `POST /jobs/[id]/stages/reorder` — accept an ordered list of stage IDs and update positions in a transaction.
- [x] `DELETE /jobs/[id]/stages/[stageId]` — delete a stage only if no candidates exist in it.
- [x] Stage configuration UI with drag-and-drop reordering (e.g., `@dnd-kit/sortable`).
- [x] Confirmation modal before delete.
- [x] Audit log on stage create/rename/reorder/delete.

### Acceptance Criteria (req 7.3, 7.5)

- Admin can rename, add, reorder, and delete stages.
- Stage order is reflected on the Kanban board.
- Admin cannot delete a stage that has candidates.
- Users cannot configure stages.

---

## Phase 7 — Candidate / Resume Management

### Goals

- Create, edit, list candidates; upload and download resume files; enforce duplicate rules.

### Tasks

- [x] `GET /jobs/[id]/candidates` — list candidates (with filters/search params).
- [x] `POST /jobs/[id]/candidates` — create candidate (Admin or attached user).
  - Validate duplicate email/phone within the job.
  - Require resume file upload (multipart).
  - Set initial `current_stage_id` to the first stage of the job.
- [x] `GET /jobs/[id]/candidates/[candidateId]` — candidate detail page.
- [x] `PATCH /jobs/[id]/candidates/[candidateId]` — update candidate details.
  - Admin: any field.
  - User: detail fields allowed; assignment/stage/feedback restrictions apply per req 8.5.
- [x] `POST /jobs/[id]/candidates/[candidateId]/resume` — replace resume file (overwrites reference).
- [x] `GET /jobs/[id]/candidates/[candidateId]/resume` — download resume (enforce job access).
- [x] File storage: local disk under `/storage` with a stable naming scheme (or signed URL pattern).
- [x] Candidate create/edit form with all fields from 8.1.
- [x] Duplicate handling: server returns a clear error when email/phone exists in the same job.
- [x] Feedback field editor (respecting assignee-based edit rights).
- [x] Audit log on candidate create/update/resume replace.

### Acceptance Criteria (req 8)

- Admin can create a candidate in any job.
- Attached users can create candidates in that job.
- Resume file upload is mandatory.
- Duplicate email/phone within the same job is blocked.
- Same email/phone across different jobs is allowed.
- Only one resume file per candidate.
- Admin and attached users can download the resume.
- Feedback is a separate text field; users can edit it only when assigned.

---

## Phase 8 — Kanban Board UI

### Goals

- Visual board per job with cards, drag-and-drop, filters, and search.

### Tasks

- [x] `GET /jobs/[id]/board` — board view with stages as columns and candidate cards.
- [x] Card component showing the fields from req 19.3.
- [x] Drag-and-drop across columns using `@dnd-kit`.
- [x] On drop, open a movement modal (Phase 9) instead of committing immediately.
- [x] Filter bar: stage, assigned user, source, current city, experience range, notice period.
- [x] Search input (name/email/phone) with debounce.
- [x] Filters and search update results without full page reload (client state + server fetch).
- [x] Empty state and loading skeletons.
- [x] Visual indicator of the assigned user on each card.

### Acceptance Criteria (req 7.1, 12, 19.2)

- Each job has its own Kanban board.
- Stages render as columns in the configured order.
- Cards show the required candidate fields.
- Dragging a card opens a confirmation modal.
- Filters can be combined and update results live.
- Search supports name/email/phone.

---

## Phase 9 — Stage Movement & History

### Goals

- Move candidates across stages with an optional comment and full history.

### Tasks

- [x] `POST /jobs/[id]/candidates/[candidateId]/move` — body: `{ to_stage_id, comment? }`.
  - Admin: any candidate. User: only candidates assigned to them.
  - Validate `to_stage_id` belongs to the same job.
  - Update `current_stage_id`, write `CandidateStageHistory` (from/to/moved_by/comment).
  - If `comment` provided, also append a job-visible comment authored by the mover.
  - Write audit log.
- [x] Movement modal UI (triggered from drag-drop and from card action menu).
- [x] Optimistic UI update with rollback on failure.
- [x] Candidate timeline component showing stage movements in chronological order.

### Acceptance Criteria (req 7.4, 16.2, 16.4)

- Admin can move any resume.
- Users can move only resumes assigned to them.
- Movement opens a modal with an optional comment.
- Every movement is recorded with from/to/moved_by/comment/timestamp.
- User cannot move a resume not assigned to them.

---

## Phase 10 — Assignment Management

### Goals

- Single-assignee model with history and notifications.

### Tasks

- [x] `POST /jobs/[id]/candidates/[candidateId]/assign` — body: `{ new_assignee_id, comment? }`.
  - Admin: any candidate. User: only candidates currently assigned to them.
  - Validate `new_assignee_id` is attached to the job (or null to unassign).
  - Update `assigned_user_id`, write `CandidateAssignmentHistory`.
  - Trigger in-app notification; email transport is handled in Phase 13.
  - Write audit log.
- [x] Assignment UI: select a user from the job's attached users (or "Unassigned").
- [x] Optional comment input in the assignment modal.
- [x] Assignment history section in candidate timeline.

### Acceptance Criteria (req 9, 16.3)

- Resume has at most one assignee.
- Resume can be unassigned.
- Admin can assign any resume; users only those assigned to them, and only to users in the same job.
- Assignment history is recorded.
- Notifications are dispatched in-app; email delivery is implemented in Phase 13.

---

## Phase 11 — Comments, Attachments, Mentions

### Goals

- Per-candidate comment thread with visibility, attachments, and mentions.

### Tasks

- [ ] `GET /jobs/[id]/candidates/[candidateId]/comments` — list comments (filter admin-only for non-admins).
- [ ] `POST /jobs/[id]/candidates/[candidateId]/comments` — create comment.
  - Visibility: `job` (everyone) or `admin` (admin only).
  - Parse `@username` mentions; only allow usernames attached to the job.
  - Create `CommentMention` rows for matched users.
  - Trigger mention notifications (Phase 13).
  - Write audit log.
- [ ] `PATCH /jobs/[id]/comments/[commentId]` — edit own comment (re-parse mentions).
- [ ] `DELETE /jobs/[id]/comments/[commentId]` — delete own comment; Admin can delete any.
- [ ] `POST /jobs/[id]/comments/[commentId]/attachments` — upload attachment(s).
- [ ] `GET /jobs/[id]/comments/[commentId]/attachments/[attachmentId]` — download (enforce comment visibility + job access).
- [ ] Comment thread UI with composer, visibility toggle (Admin only), attachments, edit/delete menus.
- [ ] Mention autocomplete in the composer (show only job-attached users).
- [ ] Audit log on comment create/delete.

### Acceptance Criteria (req 10)

- Each candidate has a general comment thread.
- Users can add comments and attachments in assigned jobs.
- Admin can add admin-only comments; users cannot.
- Users cannot see admin-only comments (server-filtered).
- Creator can edit/delete own comments; Admin can delete any comment.
- `@username` mentions notify users in-app and by email.
- Users outside the job cannot be mentioned.

---

## Phase 12 — Offer Details (Admin)

### Goals

- Admin-only offer details per candidate.

### Tasks

- [ ] `GET /jobs/[id]/candidates/[candidateId]/offer` — Admin only.
- [ ] `PUT /jobs/[id]/candidates/[candidateId]/offer` — upsert offer details.
- [ ] Offer fields: offered_ctc, offer_date, joining_date, offer_status (enum from req 11.3).
- [ ] Offer panel in candidate detail, rendered only for Admin (server-gated).
- [ ] Audit log on offer create/update.

### Acceptance Criteria (req 11)

- Admin can add and update offer details.
- Users cannot see or edit offer details (server-enforced, not just UI hidden).
- Offer details persist regardless of stage changes.

---

## Phase 13 — Notifications (In-App + Email)

### Goals

- Deliver assignment and mention notifications through both channels.

### Tasks

- [ ] `GET /notifications` — list notifications for the current user (unread first).
- [ ] `POST /notifications/[id]/read` — mark as read.
- [ ] `POST /notifications/read-all` — mark all as read.
- [ ] Notifications dropdown / screen in the header with unread badge.
- [ ] Email transport setup (SMTP via env, or provider SDK).
- [ ] Email templates for assignment and mention (with the content from req 15.3).
- [ ] Notification dispatch helper used by Phase 10 and Phase 11 (queue or inline send).
- [ ] Never notify users outside the job; never notify the actor themselves.
- [ ] Audit log entry per notification creation (optional).

### Acceptance Criteria (req 15)

- Assigned user receives in-app + email notification with job title, candidate name, assigned by, optional comment.
- Mentioned user receives in-app + email notification with job title, candidate name, comment excerpt.
- Notifications are not sent to users outside the job.

---

## Phase 14 — Search, Filters, and List View

### Goals

- Robust search/filter that also powers CSV export and reports.

### Tasks

- [x] Shared server function `queryCandidates({ jobId, search, filters })` used by board, list, export, and reports.
- [x] Filters: stage, assigned_user_id, source, current_city, total_experience range, notice_period.
- [x] Search across name/email/phone (case-insensitive, partial match).
- [x] Job-scoped by default; Admin can scope to any accessible job.
- [x] List view as an alternative to the board (shadcn `DataTable`) with the same filters.

### Acceptance Criteria (req 12)

- Search and filters work within accessible jobs.
- Filters can be combined.
- Results update without a full page reload where possible.
- Users cannot search candidates from unattached jobs (server-enforced).

---

## Phase 15 — Reports

### Goals

- Four required reports with job-access-aware data.

### Tasks

- [ ] `GET /reports/candidates-per-stage` — counts grouped by stage per job.
- [ ] `GET /reports/assigned-per-user` — resumes assigned to each user.
- [ ] `GET /reports/source-counts` — candidate count grouped by source.
- [ ] `GET /reports/aging` — days in current stage per candidate.
- [ ] Reports screen with job selector and date/source filters where relevant.
- [ ] Admin sees all jobs; users see only attached jobs (when exposed).
- [ ] Each report reuses the CSV export helper.

### Acceptance Criteria (req 13)

- Admin can view all four reports.
- Report data respects job access rules.

---

## Phase 16 — CSV Export

### Goals

- Export candidate lists, filtered lists, and reports.

### Tasks

- [ ] Shared CSV serializer (quoted fields, proper escaping, UTF-8 BOM optional).
- [ ] `GET /jobs/[id]/candidates/export` — export candidate list with active filters.
- [ ] `GET /reports/[report]/export` — export a report.
- [ ] Stream the response with `Content-Type: text/csv` and `Content-Disposition: attachment`.
- [ ] Enforce job access; users export only from attached jobs (if enabled).
- [ ] Config flag `ENABLE_USER_CSV_EXPORT` (env) to toggle user export access per req 14.2.

### Acceptance Criteria (req 14)

- Admin can export candidate lists and reports.
- Export respects active filters.
- Users cannot export from unattached jobs.

---

## Phase 17 — Audit Trail & Candidate Timeline

### Goals

- Unified, chronological timeline with role-aware visibility.

### Tasks

- [ ] Centralized `writeAuditLog()` and `writeCandidateHistory()` helpers used by all phases.
- [ ] `GET /jobs/[id]/candidates/[candidateId]/history` — unified timeline merging:
  - creation, detail updates, resume uploads, stage moves, assignments, feedback updates, offer updates, comment create/delete.
- [ ] Strip admin-only comment content and offer details for non-admin viewers (req 16.4).
- [ ] Timeline UI grouped by date with action badges.
- [ ] Admin-only "Audit Log" screen (`/admin/audit`) with filters by actor/action/entity.

### Acceptance Criteria (req 16)

- Every stage movement and assignment change is recorded.
- Timeline shows important actions chronologically.
- Admin can view full history.
- Users see history for candidates in attached jobs, with admin-only content stripped.

---

## Phase 18 — Dashboard

### Goals

- A landing dashboard after login.

### Tasks

- [ ] `GET /dashboard` — role-aware summary.
  - Admin: counts of jobs, candidates per stage, assignments per user, recent activity.
  - User: their assigned resumes across attached jobs, recent notifications.
- [ ] Quick links to jobs and notifications.

### Acceptance Criteria

- Authenticated users land on a relevant dashboard.
- Role-based content is server-rendered.

---

## Phase 19 — Hardening, Tests, and Polish

### Goals

- Server-side enforcement, tests, and UX polish.

### Tasks

- [ ] Server-side access checks on every mutation endpoint (no UI-only protection).
- [ ] Unit tests for: duplicate candidate logic, stage delete guard, assignment/move permission checks, mention parsing, CSV serializer.
- [ ] Integration tests for: login, job creation with default stages, candidate create + duplicate, move + history, assign + notification, comment + mention + notification, offer visibility.
- [ ] Rate-limit login attempts.
- [ ] File upload validation (mime/size).
- [ ] Error boundaries and 404/403 pages.
- [ ] Loading and empty states across screens.
- [ ] `README.md` final setup + seed instructions.

### Acceptance Criteria (req 20)

- Business rules enforced server-side.
- Access control enforced server-side.
- DB constraints used where applicable.
- Audit/history written consistently.

---

## Cross-Cutting Conventions

- **Server actions / route handlers** for all mutations; never trust client state.
- **Transactions** for multi-step writes (job+stages, candidate+history, comment+mentions+notifications).
- **Access helpers**: `requireUser`, `requireAdmin`, `requireJobAccess(jobId)`, `requireCandidateAccess(candidateId)` — used everywhere.
- **Audit log** written in the same transaction as the change where possible.
- **History vs Audit**: history is candidate-scoped (user-visible); audit is system-scoped (admin-visible).
- **Notifications** dispatched via a single helper that handles both channels and skips the actor.
- **Files** stored outside the repo; paths stored in DB; downloads always go through access-checked endpoints.
- **Enums** modeled with Prisma enums: `UserRole`, `JobStatus`, `CommentVisibility`, `OfferStatus`, `NotificationType`, `AuditAction`.

---

## Suggested Phase Ordering (Dependency Graph)

```
0 -> 1 -> 2 -> 3 -> 4 -> 5
                       -> 6
                       -> 7 -> 8 -> 9
                                -> 10 -> 13
                                -> 11 -> 13
                                -> 12
                       -> 14
                       -> 15 -> 16
17 (after 9, 10, 11, 12)
18 (after 4, 7)
19 (continuous, finalized last)
```

---

## Out of Scope Reminders (do not build)

Per `requirements.md` Section 3.2 and Section 22: candidate login, self-application, public career page, resume parsing, calendar integration, interviewer role, interview rounds module, email import, bulk/CSV import, stage automation, mandatory pre-move actions, complex permission matrix, rejection reason, multiple resume files per candidate, stage templates, job owner/lead concept.

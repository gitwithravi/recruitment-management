# Manual Testing Use Cases

This document is for QA to manually validate the Recruitment Management Application.

## Scope

The application currently covers:

- Authentication
- Admin user management
- Job management
- Job user attachment
- Stage configuration
- Candidate creation and editing
- Resume upload and download
- Kanban board movement
- Candidate assignment
- Comments, mentions, and attachments
- Offer details
- Notifications
- Search, filters, and list view
- Reports and CSV export
- Candidate history timeline
- Admin audit log
- Dashboard

## Test Environment

Recommended local setup:

1. Start PostgreSQL with `docker compose up -d`
2. Create `.env` from `.env.example`
3. Install dependencies with `npm install`
4. Generate Prisma client with `npm run db:generate`
5. Seed data with `npm run db:seed`
6. Start the app with `npm run dev`
7. Open `http://localhost:3000`

Default seeded admin account:

- Username: `admin`
- Email: `admin@example.com`
- Password: `Admin@123`

## Suggested Test Data

Create these users before running full QA:

- `user1` - active standard user
- `user2` - active standard user
- `inactive1` - inactive standard user

Create these jobs:

- `Frontend Hiring`
- `Backend Hiring`

Attach users:

- Attach `user1` and `user2` to `Frontend Hiring`
- Attach only `user2` to `Backend Hiring`

Create at least 3 candidates in `Frontend Hiring`:

- Candidate A: assigned to `user1`
- Candidate B: unassigned
- Candidate C: assigned to `user2`

Create at least 1 candidate in `Backend Hiring` assigned to `user2`.

## Execution Notes

- Run every relevant scenario once as Admin and once as a standard User where applicable.
- Verify both success paths and denial paths.
- For file upload checks, use a small PDF or DOC resume.
- For mention checks, use valid usernames from the same job only.
- For CSV checks, verify both browser download behavior and file contents.

## Test Cases

### Authentication

`AUTH-01` Valid admin login
Steps: Open `/login`, sign in with seeded admin credentials.
Expected: Login succeeds and user lands on dashboard.

`AUTH-02` Valid standard user login
Steps: Sign in with an active standard user account.
Expected: Login succeeds and dashboard shows only user-scoped data.

`AUTH-03` Invalid password
Steps: Attempt login with valid username and wrong password.
Expected: Login is rejected with an error.

`AUTH-04` Inactive user blocked
Steps: Attempt login with inactive user account.
Expected: Login is rejected.

`AUTH-05` Protected routes require auth
Steps: Log out and open `/`, `/jobs`, `/reports`, `/notifications`.
Expected: User is redirected to `/login`.

`AUTH-06` Logout
Steps: Log in, then use logout.
Expected: Session ends and protected pages are no longer accessible.

### Dashboard

`DASH-01` Admin dashboard
Steps: Log in as admin and open `/`.
Expected: Dashboard shows job counts, stage breakdown, assignment data, and recent activity.

`DASH-02` User dashboard
Steps: Log in as standard user and open `/`.
Expected: Dashboard shows assigned candidates, recent notifications, and only attached jobs.

### User Management

`USER-01` Admin can view user management
Steps: Log in as admin and open `/admin/users`.
Expected: User list is visible.

`USER-02` Standard user blocked from user management
Steps: Log in as standard user and open `/admin/users`.
Expected: Access is denied or redirected away.

`USER-03` Create active standard user
Steps: Create a new standard user from user management.
Expected: User is created and appears in the list.

`USER-04` Edit user details
Steps: Update name, username, or email for an existing user.
Expected: Changes persist and list reflects updates.

`USER-05` Deactivate user
Steps: Deactivate a standard user.
Expected: User becomes inactive and can no longer log in.

`USER-06` Admin cannot deactivate self
Steps: Try to deactivate the currently logged-in admin.
Expected: Action is blocked.

### Job Management

`JOB-01` Admin can create a job
Steps: Create a new job with title and description.
Expected: Job is created with default stages and appears in jobs list.

`JOB-02` Standard user cannot create a job
Steps: Log in as standard user and try to create a job.
Expected: Action is unavailable or denied.

`JOB-03` Admin can edit a job
Steps: Edit job title or description.
Expected: Updated values persist.

`JOB-04` Admin can close a job
Steps: Close a job from job actions.
Expected: Status changes to `Closed` and job remains visible.

`JOB-05` Attached user can see attached job
Steps: Log in as `user1` and open `/jobs`.
Expected: `Frontend Hiring` is visible.

`JOB-06` Unattached user cannot see unrelated job
Steps: Log in as `user1` and check for `Backend Hiring`.
Expected: `Backend Hiring` is not visible.

### Job User Assignment

`JUA-01` Admin can attach user to job
Steps: Open a job and attach a standard user not currently attached.
Expected: User is added to the attached users list.

`JUA-02` Admin can detach user from job
Steps: Remove an attached user from a job.
Expected: User is removed and loses access immediately.

`JUA-03` Duplicate attachment blocked
Steps: Try to attach the same user twice.
Expected: Duplicate attachment is prevented.

### Stage Configuration

`STAGE-01` Default stages created
Steps: Create a new job and inspect the stages tab.
Expected: Default stages are present in the expected order.

`STAGE-02` Admin can add stage
Steps: Add a new custom stage.
Expected: Stage appears in stage list and board.

`STAGE-03` Admin can rename stage
Steps: Rename an existing stage.
Expected: Updated name appears in stage list and board.

`STAGE-04` Admin can reorder stages
Steps: Drag and reorder stages.
Expected: New order persists and board columns match it.

`STAGE-05` Empty stage can be deleted
Steps: Delete a stage with no candidates.
Expected: Stage is removed.

`STAGE-06` Non-empty stage cannot be deleted
Steps: Try to delete a stage that contains candidates.
Expected: Action is blocked with a clear error.

`STAGE-07` Standard user cannot configure stages
Steps: Log in as standard user and inspect stage management.
Expected: Stage management actions are unavailable or denied.

### Candidate Creation and Editing

`CAND-01` Admin can create candidate
Steps: Add a candidate with all required fields and a resume.
Expected: Candidate is created and lands in initial stage.

`CAND-02` Standard user can create candidate in attached job
Steps: Log in as attached user and create a candidate in an attached job.
Expected: Candidate is created successfully.

`CAND-03` Resume is mandatory on create
Steps: Try to create a candidate without a resume.
Expected: Validation error is shown.

`CAND-04` Duplicate email blocked within same job
Steps: Create another candidate in the same job with an existing email.
Expected: Creation is blocked.

`CAND-05` Duplicate phone blocked within same job
Steps: Create another candidate in the same job with an existing phone.
Expected: Creation is blocked.

`CAND-06` Same candidate email allowed in different job
Steps: Create a candidate in another job using same email as an existing candidate from a different job.
Expected: Creation succeeds.

`CAND-07` Candidate details can be edited
Steps: Edit a candidate's main fields.
Expected: Updated values persist in detail page and list view.

`CAND-08` Resume can be replaced
Steps: Replace candidate resume file.
Expected: Replacement succeeds and new file downloads correctly.

`CAND-09` Resume download is access-controlled
Steps: Attempt resume download from unattached job as standard user.
Expected: Access is denied.

`CAND-10` Feedback permissions
Steps: As admin edit feedback; as assigned user edit feedback; as non-assigned attached user try editing feedback.
Expected: Admin and assigned user can update it, non-assigned user cannot.

### Candidate List, Search, and Filters

`LIST-01` Candidate list loads for accessible job
Steps: Open `/jobs/{jobId}/candidates`.
Expected: Candidates for that job are listed.

`LIST-02` Search by name
Steps: Search using candidate name.
Expected: Matching candidate appears.

`LIST-03` Search by email
Steps: Search using candidate email.
Expected: Matching candidate appears.

`LIST-04` Search by phone
Steps: Search using candidate phone.
Expected: Matching candidate appears.

`LIST-05` Filter by stage
Steps: Apply stage filter.
Expected: Only candidates in selected stage are shown.

`LIST-06` Filter by assignee
Steps: Apply assignee filter.
Expected: Only candidates assigned to selected user are shown.

`LIST-07` Combined filters
Steps: Combine search and multiple filters.
Expected: Results respect all selected criteria.

### Kanban Board and Stage Movement

`BOARD-01` Job board shows ordered columns
Steps: Open `/jobs/{jobId}/board`.
Expected: Columns match configured stage order.

`BOARD-02` Candidate card shows expected summary
Steps: Inspect a candidate card.
Expected: Key summary fields and assignee information are visible.

`BOARD-03` Admin can move any candidate
Steps: As admin move any candidate to another stage and confirm modal.
Expected: Move succeeds and board updates.

`BOARD-04` Assigned user can move own candidate
Steps: As assigned user move a candidate assigned to self.
Expected: Move succeeds.

`BOARD-05` Non-assigned user cannot move candidate
Steps: As attached but non-assigned user try moving candidate assigned to someone else.
Expected: Move is blocked.

`BOARD-06` Optional move comment recorded
Steps: Move a candidate and add a comment in the modal.
Expected: Move succeeds and comment appears in candidate history/timeline.

### Assignment

`ASSIGN-01` Admin can assign candidate
Steps: Assign an unassigned candidate to a job-attached user.
Expected: Assignment succeeds and current assignee updates.

`ASSIGN-02` Admin can unassign candidate
Steps: Set assignee to unassigned.
Expected: Candidate becomes unassigned.

`ASSIGN-03` Assigned user can reassign own candidate
Steps: As assigned user, reassign candidate currently assigned to self.
Expected: Reassignment succeeds.

`ASSIGN-04` Non-assigned user cannot reassign candidate
Steps: As attached but non-assigned user try reassigning candidate assigned to another user.
Expected: Action is blocked.

`ASSIGN-05` Cannot assign candidate to unattached user
Steps: Try assigning candidate to user not attached to that job.
Expected: Assignment is blocked.

`ASSIGN-06` Assignment comment recorded
Steps: Reassign candidate with optional comment.
Expected: Comment appears in candidate timeline/history.

### Comments, Mentions, and Attachments

`COMM-01` Add job-visible comment
Steps: Add a regular comment to a candidate.
Expected: Comment appears in thread.

`COMM-02` Admin-only comment visible to admin
Steps: As admin add comment with admin visibility.
Expected: Admin can see it in thread.

`COMM-03` Admin-only comment hidden from standard user
Steps: As standard user open same candidate thread.
Expected: Admin-only comment is not visible.

`COMM-04` Standard user cannot create admin-only comment
Steps: As standard user try to add admin-only comment.
Expected: Action is blocked.

`COMM-05` Edit own comment
Steps: Edit a comment created by current user.
Expected: Updated text persists.

`COMM-06` Standard user cannot edit another user's comment
Steps: Try editing comment created by someone else.
Expected: Action is blocked.

`COMM-07` Delete own comment
Steps: Delete a comment created by current user.
Expected: Comment is removed from visible thread.

`COMM-08` Admin can delete another user's comment
Steps: As admin delete another user's comment.
Expected: Deletion succeeds.

`COMM-09` Mention attached user
Steps: Add comment with `@user1` or `@user2`.
Expected: Mention is accepted and notification is created for mentioned user.

`COMM-10` Mention out-of-job user blocked from resolution
Steps: Mention a username not attached to the job.
Expected: No valid mention is created for that user.

`COMM-11` Upload comment attachment
Steps: Upload a file to a comment.
Expected: Attachment upload succeeds and file is available for download.

`COMM-12` Attachment download respects access
Steps: Attempt download as unattached user.
Expected: Access is denied.

### Offer Details

`OFFER-01` Admin can add offer details
Steps: As admin open candidate detail and add offer values.
Expected: Offer details persist.

`OFFER-02` Admin can update offer details
Steps: Modify existing offer status, dates, or CTC.
Expected: Updated values persist.

`OFFER-03` Standard user cannot view offer details
Steps: Open same candidate detail as standard user.
Expected: Offer panel is not visible.

`OFFER-04` Standard user cannot edit offer details
Steps: Attempt direct access or form submission as standard user.
Expected: Access is denied.

### Notifications

`NOTIF-01` Assignment notification created
Steps: Assign candidate from admin to another user.
Expected: Recipient sees an unread notification.

`NOTIF-02` Mention notification created
Steps: Mention another attached user in a comment.
Expected: Mentioned user sees unread notification.

`NOTIF-03` Actor does not receive self-notification
Steps: Assign candidate to self or mention self.
Expected: No self-notification is created.

`NOTIF-04` Mark one notification as read
Steps: Open notifications and mark a notification as read.
Expected: Notification read state updates.

`NOTIF-05` Mark all notifications as read
Steps: Use read-all action.
Expected: All current notifications are marked read.

### Reports

`REPORT-01` Admin can open reports page
Steps: Log in as admin and open `/reports`.
Expected: Reports page loads with report options.

`REPORT-02` Standard user sees only attached jobs in reports
Steps: Open reports as standard user.
Expected: Job selector includes only attached jobs.

`REPORT-03` Candidates per stage report
Steps: Open candidates-per-stage report for a job with data.
Expected: Stage counts match current board/list data.

`REPORT-04` Assigned per user report
Steps: Open assigned-per-user report.
Expected: Counts match actual assignments.

`REPORT-05` Source counts report
Steps: Open source-counts report.
Expected: Counts match candidate sources.

`REPORT-06` Aging report
Steps: Open aging report.
Expected: Candidates show days in current stage.

### CSV Export

`CSV-01` Admin exports candidate list
Steps: Apply candidate filters and export CSV from candidate list.
Expected: Download succeeds and exported rows match visible filtered set.

`CSV-02` Admin exports report CSV
Steps: Export CSV from each report type.
Expected: Download succeeds and content matches report data.

`CSV-03` User export behavior respects access
Steps: As standard user try exporting from an attached job and an unattached job.
Expected: Attached-job behavior follows environment toggle, unattached-job export is denied.

`CSV-04` CSV escaping
Steps: Use candidate/comment data with commas or quotes and export.
Expected: CSV remains valid and values are escaped correctly.

### Candidate History Timeline

`HIST-01` Timeline shows creation
Steps: Create a new candidate and open candidate detail.
Expected: Timeline contains candidate creation event.

`HIST-02` Timeline shows stage movement
Steps: Move candidate between stages.
Expected: Timeline contains movement event in chronological order.

`HIST-03` Timeline shows assignment changes
Steps: Assign and unassign candidate.
Expected: Timeline contains assignment events.

`HIST-04` Timeline shows comments and resume replacement
Steps: Add comment and replace resume.
Expected: Timeline contains both events.

`HIST-05` User sees sanitized timeline
Steps: As admin create admin-only comment and add offer details, then open candidate detail as standard user.
Expected: Admin-only comment body and offer-sensitive details are not exposed to standard user timeline.

### Audit Log

`AUDIT-01` Admin can open audit log
Steps: Open `/admin/audit`.
Expected: Audit page loads with recent activity.

`AUDIT-02` Standard user blocked from audit log
Steps: As standard user open `/admin/audit`.
Expected: Access is denied or redirected.

`AUDIT-03` Audit log records key actions
Steps: Create user, create job, add candidate, move candidate, assign candidate, add comment.
Expected: Relevant audit entries appear for each action.

`AUDIT-04` Audit filters work
Steps: Filter audit log by actor, action, and entity.
Expected: Results narrow correctly.

## Regression Focus

These flows should always be rechecked after any release:

- Login and logout
- Admin user creation and deactivation
- Job creation with default stages
- Candidate creation with resume upload
- Duplicate email and phone validation
- Board movement permission rules
- Assignment permission rules
- Comment visibility and mentions
- Offer visibility restrictions
- Notification creation and read actions
- Reports and CSV export
- Candidate history timeline
- Admin audit log

## Known Risk Areas

Pay extra attention to:

- Role-based access between Admin and standard User
- Job-scoped access for users attached to only some jobs
- Actions that should work only for assigned users
- Duplicate candidate prevention inside the same job
- Admin-only data leakage in comments, offers, history, and audit-related screens
- File upload and download permissions

# Recruitment Management Application Requirements

## 1. Overview

This document defines the requirements for a small internal recruitment management application.

The application will work like a lightweight Jira-style workflow system for recruitment. Each job will behave like a project. Every job will have its own configurable Kanban board where resumes move through stages such as Backlog, Contacted, Interview Scheduled, Offered, Joined, etc.

The system is only for internal users. Candidates will not log in to the application.

---

## 2. Objectives

The application must allow the recruitment team to:

- Create and manage job postings.
- Add users to specific jobs.
- Add candidate resumes manually to jobs.
- Track every candidate through a configurable Kanban workflow.
- Assign each resume to one user at a time.
- Allow assigned users to take action on resumes assigned to them.
- Maintain comments, feedback, attachments, assignment history, and stage movement history.
- Notify users when resumes are assigned to them or when they are mentioned in comments.
- Store offer details for admin visibility.
- Provide basic filters, reports, and CSV export.

---

## 3. Scope

### 3.1 In Scope

The system must support:

- Internal user authentication.
- Two user roles: Admin and User.
- Job creation and management.
- Job-specific user access.
- Job-specific configurable Kanban stages.
- Manual candidate/resume creation.
- Resume file upload.
- Candidate assignment to a user.
- Candidate movement across Kanban stages.
- Optional comment while moving a candidate between stages.
- General comment thread per candidate.
- Comment attachments.
- Admin-only and job-visible comments.
- `@username` mentions in comments.
- Separate simple text feedback field per candidate.
- Candidate offer details visible only to Admin.
- Email and in-app notifications.
- Candidate filtering and search.
- Basic reports.
- CSV export.
- Audit trail for important actions.
- PostgreSQL-backed persistence.
- Public careers listing for published open jobs.
- Candidate self-application through the careers page, gated by email OTP.

### 3.2 Out of Scope

The following are explicitly out of scope:

- Candidate login.
- Resume parsing.
- Calendar integration.
- Interviewer role.
- Separate interview rounds module.
- Email import.
- Bulk resume upload.
- CSV import.
- Stage-level automation rules.
- Required actions before stage movement.
- Complex permission matrix.
- Rejection reason field.
- Multiple resume files per candidate.
- Stage templates.
- Job owner/lead concept.

---

## 4. User Roles

The application will have only two roles:

1. Admin
2. User

---

## 5. Role Capabilities

### 5.1 Admin

Admin can:

- Create users.
- Manage users.
- Create jobs.
- Edit jobs.
- Attach users to jobs.
- Remove users from jobs.
- View all jobs.
- View all resumes in all jobs.
- Create resumes in any job.
- Edit candidate/resume details.
- Upload resume files.
- Download resume files.
- Configure stages for each job.
- Reorder stages.
- Move resumes across stages.
- Assign resumes to any user attached to the job.
- Add comments.
- Add admin-only comments.
- View all comments, including admin-only comments.
- Edit own comments.
- Delete own comments.
- Delete any user's comment.
- Edit candidate feedback.
- View and manage offer details.
- View reports.
- Export CSV data.
- View audit history.
- List and unlist open jobs on the public careers page.

### 5.2 User

User can:

- View only jobs to which they are attached.
- Navigate between assigned jobs.
- View all resumes inside jobs to which they are attached.
- Create resumes manually inside jobs to which they are attached.
- Edit candidate/resume details in jobs to which they are attached.
- Upload resume file while creating or editing a candidate.
- Download resume files from jobs to which they are attached.
- View all job-visible comments in assigned jobs.
- Add comments to resumes in assigned jobs.
- Mention users using `@username`.
- Add attachments to comments.
- Edit their own comments.
- Delete their own comments.
- Assign resumes to users attached to the same job, but only for resumes currently assigned to them.
- Move resumes across stages, but only for resumes currently assigned to them.
- Add optional comments while moving resumes.
- Edit the feedback field, but only for resumes currently assigned to them.
- Receive in-app and email notifications.

User cannot:

- View jobs they are not attached to.
- View resumes from jobs they are not attached to.
- Take action on resumes not assigned to them.
- View admin-only comments.
- Add admin-only comments.
- Configure job stages.
- View offer details.
- Manage users.
- Create jobs.
- Edit jobs.
- View global reports unless explicitly exposed later.

---

## 6. Job Management

### 6.1 Job Fields

Each job must have the following fields:

- Job Title
- Job Description / JD
- Status
- Listed on careers (publish flag)
- Created At
- Updated At

### 6.2 Job Status

Supported job statuses:

- Open
- Closed

### 6.3 Job Access

- Admin can attach multiple users to a job.
- All users attached to a job are equal.
- There is no job owner or job lead.
- Users can only access jobs to which they are attached.
- Jobs should behave like projects, allowing users to switch between jobs they are part of.

### 6.4 Acceptance Criteria

- Admin can create a job with Job Title and JD.
- Admin can attach users to a job.
- Attached users can see the job in their job list.
- Users not attached to the job cannot see it.
- Users can navigate between all jobs assigned to them.
- Admin can close a job.
- Closed jobs remain visible to Admin.
- Job data must not be deleted when a job is closed.
- Admin can list an open job on `/careers`. Unpublished jobs never appear publicly.
- Closed jobs do not appear in the public listing even if they remain marked as listed.

### 6.5 Public careers page

- `/careers` is public and does not require login.
- Only jobs that are both Open and listed appear on the listing.
- Applicants verify email with a one-time code before the apply form is shown.
- SMTP must be configured for public applications. If it is not, the job page says applications are unavailable.
- A successful public application creates a normal candidate in the first stage, unassigned, with source `Website`.
- Staff can still add candidates internally without OTP.

---

## 7. Kanban Board and Stages

### 7.1 Job-Specific Kanban Board

Each job must have its own independent Kanban board.

Each board contains stages. Candidate resumes are shown as cards inside stages.

### 7.2 Default Stages

When a new job is created, the following default stages must be created automatically:

1. Backlog
2. Contacted
3. Interview Scheduled
4. Interview Feedback Received
5. Recommendation Sent
6. Offered
7. Accepted/Rejected
8. Joined

### 7.3 Stage Configuration

Admin can:

- Rename stages.
- Add new stages.
- Reorder stages using drag-and-drop.
- Delete stages only if no resumes are present in that stage.

Users cannot configure stages.

### 7.4 Stage Movement

- Admin can move any resume in any job.
- User can move only resumes assigned to them.
- Moving a resume to another stage should open a modal.
- The modal should allow the user to optionally add a comment.
- The system must record stage movement history.
- Resumes in final stages can still be moved later.
- There are no system-reserved final stages.
- All stages are configurable by Admin.

### 7.5 Acceptance Criteria

- Each job has its own Kanban board.
- Default stages are created automatically for each new job.
- Admin can reorder stages.
- Stage order is reflected on the Kanban board.
- Admin cannot delete a stage if resumes exist in that stage.
- Dragging or moving a candidate to another stage opens a confirmation modal.
- User can add an optional comment during stage movement.
- Stage movement is saved in candidate history.
- User cannot move a resume not assigned to them.
- Admin can move any resume.

---

## 8. Candidate / Resume Management

### 8.1 Candidate Fields

Each candidate/resume record must have:

- Candidate Name
- Email
- Phone
- Total Experience
- Relevant Experience
- Current City
- Current CTC
- Expected CTC
- Notice Period
- Resume File
- Source
- Current Stage
- Assigned User
- Feedback
- Created At
- Updated At

### 8.2 Resume File

- Resume file upload is mandatory.
- Only one resume file is allowed per candidate record.
- Uploaded resume file must be downloadable by Admin and users attached to the job.
- Replacing a resume file should overwrite the current resume file reference.

### 8.3 Candidate Creation

- Candidates are added manually through a form, or by applying on the public careers page.
- Both Admin and users attached to the job can add candidates internally.
- Public applicants must verify email with OTP before submitting. They do not get user accounts.
- Candidate import is not required.

### 8.4 Duplicate Handling

- The same candidate may exist in multiple jobs.
- Duplicate candidates must not be allowed within the same job.
- Duplicate detection must be based on email and phone.
- If a candidate with the same email or phone already exists in the same job, creation must be blocked.

### 8.5 Candidate Editing

- Admin can edit any candidate.
- Users attached to a job can edit candidate details inside that job.
- Action restrictions still apply: moving, assigning, and feedback editing are allowed only when the resume is assigned to that user.

### 8.6 Feedback Field

- Each candidate must have a separate feedback field.
- Feedback is a simple text field.
- Admin can edit feedback for any candidate.
- User can edit feedback only when the candidate is assigned to them.
- Feedback is separate from comments.

### 8.7 Acceptance Criteria

- Admin can create a candidate in any job.
- User can create a candidate in assigned jobs.
- Resume file upload is mandatory.
- System blocks duplicate email/phone inside the same job.
- Same email/phone is allowed in different jobs.
- Only one resume file is stored per candidate record.
- Admin and users attached to the job can download the resume.
- Feedback can be added as simple text.
- User cannot edit feedback for a candidate not assigned to them.
- Candidate details can be updated by Admin and users attached to the job.

---

## 9. Assignment Management

### 9.1 Assignment Rules

- Each resume can be assigned to only one user at a time.
- Assignment is not mandatory.
- A resume may remain unassigned.
- Users can assign a resume to any user attached to the same job, but only if the resume is currently assigned to them.
- Admin can assign or reassign any resume.
- Assignment can include an optional comment.
- Assignment changes must be recorded in history.

### 9.2 Assignment Notifications

When a resume is assigned to a user, the assigned user must receive:

- In-app notification
- Email notification

The assignment notification should include:

- Job title
- Candidate name
- Assigned by
- Optional assignment comment, if provided

### 9.3 Acceptance Criteria

- Resume can have only one assignee at a time.
- Resume can be unassigned.
- Admin can assign any resume.
- User can assign only resumes currently assigned to them.
- User can assign only to users attached to the same job.
- Assignment notification is created in-app.
- Assignment email is sent.
- Assignment history is recorded.

---

## 10. Comments and Attachments

### 10.1 Comment Thread

Each candidate must have one general comment thread.

Comments are not stage-specific.

### 10.2 Comment Fields

Each comment must have:

- Candidate
- Author
- Comment Body
- Visibility
- Attachments
- Mentions
- Created At
- Updated At

### 10.3 Comment Visibility

Supported visibility options:

1. Visible to all users attached to the job
2. Admin only

Rules:

- Admin can create admin-only comments.
- User cannot create admin-only comments.
- Admin can view all comments.
- User can view only comments visible to all users attached to the job.
- Admin-only comments must be hidden from users.

### 10.4 Comment Attachments

- Comments can have attachments.
- Attachments should be downloadable by users who can view the comment.
- Admin-only comment attachments are visible only to Admin.

### 10.5 Editing and Deleting Comments

- Comment creator can edit their own comments.
- Comment creator can delete their own comments.
- Admin can delete any comment.
- Comment edit/delete history does not need to be maintained.
- Comment create/delete actions should still be covered by general audit logs where applicable.

### 10.6 Mentions

- Users can mention other users using `@username`.
- Only users attached to the same job should be mentionable.
- Mentioned users must receive in-app and email notifications.

The mention notification should include:

- Job title
- Candidate name
- Comment excerpt

### 10.7 Acceptance Criteria

- Each candidate has a general comment thread.
- User can add comments to candidates in assigned jobs.
- User can add attachments to comments.
- Admin can add admin-only comments.
- User cannot see admin-only comments.
- Admin can see all admin-only comments.
- Comment creator can edit and delete own comments.
- Admin can delete any comment.
- `@username` mentions trigger in-app and email notifications.
- Users outside the job cannot be mentioned.

---

## 11. Offer Details

### 11.1 Offer Visibility

Offer details must be visible only to Admin.

Users must not be able to view or edit offer details.

### 11.2 Offer Fields

Offer details should include:

- Offered CTC
- Offer Date
- Joining Date
- Offer Status

### 11.3 Offer Status

Supported offer statuses:

- Not Offered
- Offered
- Accepted
- Rejected
- Joined

### 11.4 Acceptance Criteria

- Admin can add offer details to a candidate.
- Admin can update offer details.
- User cannot see offer details.
- User cannot update offer details.
- Offer details remain available even if candidate stage changes.

---

## 12. Search and Filters

### 12.1 Global Search Within Job

Within a job, users should be able to search candidates by:

- Candidate name
- Email
- Phone

### 12.2 Filters

The Kanban/list view should support filters by:

- Stage
- Assigned User
- Source
- Current City
- Experience Range
- Notice Period

### 12.3 Acceptance Criteria

- Users can search candidates inside jobs they are attached to.
- Admin can search candidates across accessible jobs.
- Search supports name, email, and phone.
- Filters can be combined.
- Filters update the visible Kanban/list results.
- Users cannot search candidates from jobs they are not attached to.

---

## 13. Reports

### 13.1 Required Reports

The application should provide the following reports:

1. Candidates per stage per job
2. Resumes assigned to each user
3. Source-wise candidate count
4. Aging report showing how long candidates are stuck in their current stage

### 13.2 Report Access

- Admin can view reports.
- Users may view reports only for jobs they are attached to if exposed in the UI.

### 13.3 Acceptance Criteria

- Admin can view candidate count per stage for each job.
- Admin can view number of resumes assigned to each user.
- Admin can view candidate count grouped by source.
- Admin can view how long each candidate has been in the current stage.
- Report data respects job access rules.

---

## 14. CSV Export

### 14.1 Export Scope

The application must support CSV export.

CSV export should be available for:

- Candidate list of a job
- Filtered candidate list
- Reports

### 14.2 Export Access

- Admin can export data.
- Users can export candidate data only from jobs they are attached to, if export is enabled for users.

### 14.3 Acceptance Criteria

- Admin can export candidate list as CSV.
- Export respects active filters.
- CSV contains candidate details relevant to the selected view.
- Users cannot export data from jobs they are not attached to.

---

## 15. Notifications

### 15.1 Notification Types

The system must support notifications for:

1. Resume assignment
2. Comment mention using `@username`

### 15.2 Notification Channels

Each notification must be sent through:

- In-app notification
- Email notification

### 15.3 Notification Content

Assignment notification should include:

- Job title
- Candidate name
- Assigned by
- Optional assignment comment

Mention notification should include:

- Job title
- Candidate name
- Comment excerpt

### 15.4 Acceptance Criteria

- Assigned user receives in-app notification.
- Assigned user receives email notification.
- Mentioned user receives in-app notification.
- Mentioned user receives email notification.
- Notifications are not sent to users outside the job.
- Notifications contain the required context.

---

## 16. Audit Trail and History

### 16.1 Candidate History

The system must maintain history for:

- Candidate creation
- Candidate details update
- Resume file upload/replacement
- Stage movement
- Assignment change
- Feedback update
- Offer details update
- Comment creation
- Comment deletion

### 16.2 Stage Movement History

Each stage movement record must store:

- Candidate
- From Stage
- To Stage
- Moved By
- Optional Comment
- Moved At

### 16.3 Assignment History

Each assignment history record must store:

- Candidate
- Previous Assignee
- New Assignee
- Assigned By
- Optional Comment
- Assigned At

### 16.4 Acceptance Criteria

- Every stage movement is recorded.
- Every assignment change is recorded.
- Candidate timeline shows important actions in chronological order.
- Admin can view candidate history.
- User can view history for candidates in jobs they are attached to, excluding admin-only comment details and offer details.

---

## 17. Data Entities

The following database entities are required.

### 17.1 users

Represents application users.

Suggested fields:

- id
- name
- username
- email
- password_hash
- role: `admin` or `user`
- is_active
- created_at
- updated_at

### 17.2 jobs

Represents recruitment jobs.

Suggested fields:

- id
- title
- description
- status
- created_by
- created_at
- updated_at

### 17.3 job_users

Represents users attached to jobs.

Suggested fields:

- id
- job_id
- user_id
- attached_by
- created_at

Constraints:

- One user should not be attached to the same job more than once.

### 17.4 job_stages

Represents stages for a job Kanban board.

Suggested fields:

- id
- job_id
- name
- position
- created_at
- updated_at

Constraints:

- Stage belongs to one job.
- Stage position controls display order.

### 17.5 candidates

Represents candidate/resume records inside jobs.

Suggested fields:

- id
- job_id
- name
- email
- phone
- total_experience
- relevant_experience
- current_city
- current_ctc
- expected_ctc
- notice_period
- resume_file_path
- source
- current_stage_id
- assigned_user_id
- feedback
- created_by
- created_at
- updated_at

Constraints:

- Email/phone duplicate must be blocked within the same job.
- Same email/phone may exist in different jobs.
- Resume file is mandatory.

### 17.6 candidate_comments

Represents comments on candidates.

Suggested fields:

- id
- candidate_id
- author_id
- body
- visibility: `job` or `admin`
- created_at
- updated_at
- deleted_at

### 17.7 comment_attachments

Represents attachments added to comments.

Suggested fields:

- id
- comment_id
- file_name
- file_path
- mime_type
- file_size
- uploaded_by
- created_at

### 17.8 comment_mentions

Represents users mentioned in comments.

Suggested fields:

- id
- comment_id
- mentioned_user_id
- created_at

### 17.9 candidate_stage_history

Represents movement of candidates across stages.

Suggested fields:

- id
- candidate_id
- from_stage_id
- to_stage_id
- moved_by
- comment
- created_at

### 17.10 candidate_assignment_history

Represents assignment changes.

Suggested fields:

- id
- candidate_id
- previous_assignee_id
- new_assignee_id
- assigned_by
- comment
- created_at

### 17.11 candidate_offer_details

Represents admin-only offer details.

Suggested fields:

- id
- candidate_id
- offered_ctc
- offer_date
- joining_date
- offer_status
- created_at
- updated_at

### 17.12 notifications

Represents in-app notifications.

Suggested fields:

- id
- recipient_user_id
- type
- title
- body
- related_job_id
- related_candidate_id
- read_at
- created_at

### 17.13 audit_logs

Represents important system activity.

Suggested fields:

- id
- actor_user_id
- action
- entity_type
- entity_id
- metadata
- created_at

---

## 18. Technical Stack

The application will be built using:

- Frontend/Application: Next.js
- Styling: Tailwind CSS
- UI Components: shadcn/ui
- Database: PostgreSQL
- Local database setup: Docker-based PostgreSQL

---

## 19. UI Requirements

### 19.1 Main Screens

The application should include:

- Login screen
- Dashboard
- Jobs list
- Job detail page
- Job Kanban board
- Candidate detail page
- Candidate create/edit form
- Comment thread
- Candidate history/timeline
- User management screen for Admin
- Job user assignment screen for Admin
- Stage configuration screen for Admin
- Reports screen
- Notifications screen

### 19.2 Kanban Board UI

The Kanban board should:

- Show stages as columns.
- Show candidates as cards.
- Support drag-and-drop movement.
- Open a modal before confirming movement.
- Allow optional comment while moving.
- Visually indicate assigned user.
- Allow filtering/search.

### 19.3 Candidate Card

Candidate card should display:

- Candidate name
- Current city
- Total experience
- Relevant experience
- Notice period
- Source
- Assigned user
- Last updated date

### 19.4 Candidate Detail Page

Candidate detail page should display:

- Candidate details
- Resume download link
- Current stage
- Current assignee
- Feedback field
- Comment thread
- Attachments
- Candidate history
- Offer details for Admin only

---

## 20. Non-Functional Requirements

### 20.1 Security

- Authentication is required for all application pages.
- Users must not access jobs they are not attached to.
- Users must not access resumes from jobs they are not attached to.
- Users must not see admin-only comments.
- Users must not see offer details.
- File downloads must enforce access control.

### 20.2 Data Integrity

- Candidate must belong to a job.
- Candidate must belong to a stage.
- Candidate stage must belong to the same job as the candidate.
- Candidate assignee must be attached to the candidate's job.
- Mentioned users must be attached to the same job.
- Duplicate email/phone must be blocked within the same job.
- Stage cannot be deleted if candidates exist in it.

### 20.3 Performance

- Kanban board should load efficiently for normal recruitment workloads.
- Filters and search should work without full page reloads where possible.
- CSV export should work for filtered data.

### 20.4 Maintainability

- Business rules should be implemented server-side.
- UI restrictions should not be the only protection.
- Audit and history records should be written consistently.
- Database constraints should be used where possible.

---

## 21. Acceptance Criteria Summary

The product is considered complete when:

- Admin can create jobs.
- Admin can attach users to jobs.
- Each job has an independent Kanban board.
- Default stages are created for new jobs.
- Admin can configure stages.
- Users can access only assigned jobs.
- Users can view all resumes in assigned jobs.
- Users can create candidates in assigned jobs.
- Resume file upload is mandatory.
- Same candidate cannot be duplicated within the same job by email/phone.
- Same candidate can exist in multiple jobs.
- Each resume can be assigned to one user at a time.
- Users can take action only on resumes assigned to them.
- Users can move assigned resumes across stages.
- Stage movement opens a modal with optional comment.
- Stage movement history is maintained.
- Users can assign resumes assigned to them to another user in the same job.
- Assignment notifications are sent in-app and by email.
- Comments support attachments.
- Comments support `@username` mentions.
- Mention notifications are sent in-app and by email.
- Admin-only comments are visible only to Admin.
- Creator and Admin can delete comments.
- Feedback is stored as a separate simple text field.
- Offer details are visible only to Admin.
- Search and recommended filters are available.
- Reports are available.
- CSV export is available.
- Audit/history records are maintained.
- Access control is enforced server-side.

---

## 22. Explicit Product Rules

- Candidates do not log in.
- Jobs are internal projects.
- Users are attached to jobs by Admin.
- Users attached to a job can see all resumes in that job.
- Users can only take action on resumes assigned to them.
- Admin can take action on any resume.
- There are no interviewers in the system.
- Interview stages are represented through job stages only.
- Interview feedback is manually written in the feedback field.
- No calendar integration is required.
- No resume parsing is required.
- No bulk import is required.
- No candidate communication module is required.
- No stage-level rules are required.
- No mandatory action validation is required before moving stages.

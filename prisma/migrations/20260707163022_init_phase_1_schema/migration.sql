-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "CommentVisibility" AS ENUM ('job', 'admin');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('not_offered', 'offered', 'accepted', 'rejected', 'joined');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('resume_assignment', 'comment_mention');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('user_created', 'user_updated', 'user_deactivated', 'job_created', 'job_updated', 'job_closed', 'job_user_attached', 'job_user_detached', 'stage_created', 'stage_updated', 'stage_reordered', 'stage_deleted', 'candidate_created', 'candidate_updated', 'candidate_resume_replaced', 'candidate_stage_moved', 'candidate_assigned', 'candidate_feedback_updated', 'comment_created', 'comment_updated', 'comment_deleted', 'offer_created', 'offer_updated', 'notification_created');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'open',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_users" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "attached_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_stages" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "total_experience" DECIMAL(5,2) NOT NULL,
    "relevant_experience" DECIMAL(5,2) NOT NULL,
    "current_city" TEXT NOT NULL,
    "current_ctc" DECIMAL(12,2),
    "expected_ctc" DECIMAL(12,2),
    "notice_period" TEXT NOT NULL,
    "resume_file_path" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "current_stage_id" TEXT NOT NULL,
    "assigned_user_id" TEXT,
    "feedback" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_comments" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "CommentVisibility" NOT NULL DEFAULT 'job',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "candidate_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_attachments" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_mentions" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "mentioned_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_stage_history" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "from_stage_id" TEXT,
    "to_stage_id" TEXT NOT NULL,
    "moved_by" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_assignment_history" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "previous_assignee_id" TEXT,
    "new_assignee_id" TEXT,
    "assigned_by" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_assignment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_offer_details" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "offered_ctc" DECIMAL(12,2),
    "offer_date" DATE,
    "joining_date" DATE,
    "offer_status" "OfferStatus" NOT NULL DEFAULT 'not_offered',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_offer_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipient_user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "related_job_id" TEXT,
    "related_candidate_id" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_created_by_idx" ON "jobs"("created_by");

-- CreateIndex
CREATE INDEX "job_users_user_id_idx" ON "job_users"("user_id");

-- CreateIndex
CREATE INDEX "job_users_attached_by_idx" ON "job_users"("attached_by");

-- CreateIndex
CREATE UNIQUE INDEX "job_users_job_id_user_id_key" ON "job_users"("job_id", "user_id");

-- CreateIndex
CREATE INDEX "job_stages_job_id_idx" ON "job_stages"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_stages_job_id_position_key" ON "job_stages"("job_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "job_stages_job_id_name_key" ON "job_stages"("job_id", "name");

-- CreateIndex
CREATE INDEX "candidates_job_id_current_stage_id_idx" ON "candidates"("job_id", "current_stage_id");

-- CreateIndex
CREATE INDEX "candidates_assigned_user_id_idx" ON "candidates"("assigned_user_id");

-- CreateIndex
CREATE INDEX "candidates_created_by_idx" ON "candidates"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_job_id_email_key" ON "candidates"("job_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_job_id_phone_key" ON "candidates"("job_id", "phone");

-- CreateIndex
CREATE INDEX "candidate_comments_candidate_id_created_at_idx" ON "candidate_comments"("candidate_id", "created_at");

-- CreateIndex
CREATE INDEX "candidate_comments_author_id_idx" ON "candidate_comments"("author_id");

-- CreateIndex
CREATE INDEX "candidate_comments_visibility_idx" ON "candidate_comments"("visibility");

-- CreateIndex
CREATE INDEX "comment_attachments_comment_id_idx" ON "comment_attachments"("comment_id");

-- CreateIndex
CREATE INDEX "comment_attachments_uploaded_by_idx" ON "comment_attachments"("uploaded_by");

-- CreateIndex
CREATE INDEX "comment_mentions_mentioned_user_id_idx" ON "comment_mentions"("mentioned_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_mentions_comment_id_mentioned_user_id_key" ON "comment_mentions"("comment_id", "mentioned_user_id");

-- CreateIndex
CREATE INDEX "candidate_stage_history_candidate_id_created_at_idx" ON "candidate_stage_history"("candidate_id", "created_at");

-- CreateIndex
CREATE INDEX "candidate_stage_history_from_stage_id_idx" ON "candidate_stage_history"("from_stage_id");

-- CreateIndex
CREATE INDEX "candidate_stage_history_to_stage_id_idx" ON "candidate_stage_history"("to_stage_id");

-- CreateIndex
CREATE INDEX "candidate_stage_history_moved_by_idx" ON "candidate_stage_history"("moved_by");

-- CreateIndex
CREATE INDEX "candidate_assignment_history_candidate_id_created_at_idx" ON "candidate_assignment_history"("candidate_id", "created_at");

-- CreateIndex
CREATE INDEX "candidate_assignment_history_previous_assignee_id_idx" ON "candidate_assignment_history"("previous_assignee_id");

-- CreateIndex
CREATE INDEX "candidate_assignment_history_new_assignee_id_idx" ON "candidate_assignment_history"("new_assignee_id");

-- CreateIndex
CREATE INDEX "candidate_assignment_history_assigned_by_idx" ON "candidate_assignment_history"("assigned_by");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_offer_details_candidate_id_key" ON "candidate_offer_details"("candidate_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_user_id_read_at_created_at_idx" ON "notifications"("recipient_user_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "notifications_related_job_id_idx" ON "notifications"("related_job_id");

-- CreateIndex
CREATE INDEX "notifications_related_candidate_id_idx" ON "notifications"("related_candidate_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_users" ADD CONSTRAINT "job_users_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_users" ADD CONSTRAINT "job_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_users" ADD CONSTRAINT "job_users_attached_by_fkey" FOREIGN KEY ("attached_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_stages" ADD CONSTRAINT "job_stages_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "job_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_comments" ADD CONSTRAINT "candidate_comments_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_comments" ADD CONSTRAINT "candidate_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_attachments" ADD CONSTRAINT "comment_attachments_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "candidate_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_attachments" ADD CONSTRAINT "comment_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_mentions" ADD CONSTRAINT "comment_mentions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "candidate_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_mentions" ADD CONSTRAINT "comment_mentions_mentioned_user_id_fkey" FOREIGN KEY ("mentioned_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_stage_history" ADD CONSTRAINT "candidate_stage_history_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_stage_history" ADD CONSTRAINT "candidate_stage_history_from_stage_id_fkey" FOREIGN KEY ("from_stage_id") REFERENCES "job_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_stage_history" ADD CONSTRAINT "candidate_stage_history_to_stage_id_fkey" FOREIGN KEY ("to_stage_id") REFERENCES "job_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_stage_history" ADD CONSTRAINT "candidate_stage_history_moved_by_fkey" FOREIGN KEY ("moved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_assignment_history" ADD CONSTRAINT "candidate_assignment_history_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_assignment_history" ADD CONSTRAINT "candidate_assignment_history_previous_assignee_id_fkey" FOREIGN KEY ("previous_assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_assignment_history" ADD CONSTRAINT "candidate_assignment_history_new_assignee_id_fkey" FOREIGN KEY ("new_assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_assignment_history" ADD CONSTRAINT "candidate_assignment_history_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_offer_details" ADD CONSTRAINT "candidate_offer_details_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_job_id_fkey" FOREIGN KEY ("related_job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_candidate_id_fkey" FOREIGN KEY ("related_candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

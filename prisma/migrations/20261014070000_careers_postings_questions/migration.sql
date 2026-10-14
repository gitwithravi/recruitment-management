-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('onsite', 'hybrid', 'remote');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('full_time', 'part_time', 'contract', 'internship');

-- CreateEnum
CREATE TYPE "JobQuestionType" AS ENUM ('short_text', 'long_text', 'yes_no', 'single_choice');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'job_question_created';
ALTER TYPE "AuditAction" ADD VALUE 'job_question_updated';
ALTER TYPE "AuditAction" ADD VALUE 'job_question_deleted';

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "location" TEXT,
ADD COLUMN "department" TEXT,
ADD COLUMN "work_mode" "WorkMode",
ADD COLUMN "employment_type" "EmploymentType",
ADD COLUMN "min_experience" INTEGER,
ADD COLUMN "max_experience" INTEGER,
ADD COLUMN "openings" INTEGER,
ADD COLUMN "apply_by" DATE;

-- AlterTable
ALTER TABLE "candidates" ADD COLUMN "consent_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "job_questions" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "JobQuestionType" NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "required" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_answers" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "question_id" TEXT,
    "question_label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_questions_job_id_position_idx" ON "job_questions"("job_id", "position");

-- CreateIndex
CREATE INDEX "candidate_answers_question_id_idx" ON "candidate_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_answers_candidate_id_question_id_key" ON "candidate_answers"("candidate_id", "question_id");

-- AddForeignKey
ALTER TABLE "job_questions" ADD CONSTRAINT "job_questions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_answers" ADD CONSTRAINT "candidate_answers_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_answers" ADD CONSTRAINT "candidate_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "job_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

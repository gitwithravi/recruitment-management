-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'candidate_applied';

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "is_published" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "jobs_status_is_published_idx" ON "jobs"("status", "is_published");

-- AlterTable
ALTER TABLE "candidates" ALTER COLUMN "created_by" DROP NOT NULL;

-- AlterTable
ALTER TABLE "candidate_stage_history" ALTER COLUMN "moved_by" DROP NOT NULL;

-- CreateTable
CREATE TABLE "email_otps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMP(3),
    "consumed_at" TIMESTAMP(3),
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_otps_email_created_at_idx" ON "email_otps"("email", "created_at");

-- CreateIndex
CREATE INDEX "email_otps_expires_at_idx" ON "email_otps"("expires_at");

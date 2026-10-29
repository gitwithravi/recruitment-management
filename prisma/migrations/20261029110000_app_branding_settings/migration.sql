-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'settings_updated';

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "app_name" TEXT,
    "logo_file_path" TEXT,
    "logo_mime_type" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

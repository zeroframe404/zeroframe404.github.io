-- CreateEnum
CREATE TYPE "AdminLogAutoClearUnit" AS ENUM ('day', 'week', 'month');

-- CreateTable
CREATE TABLE "admin_log_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "auto_clear_value" INTEGER NOT NULL DEFAULT 1,
    "auto_clear_unit" "AdminLogAutoClearUnit" NOT NULL DEFAULT 'month',
    "last_cleared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_log_settings_pkey" PRIMARY KEY ("id")
);

-- Seed singleton row
INSERT INTO "admin_log_settings" ("id", "updated_at")
VALUES (1, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

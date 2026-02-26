-- CreateTable
CREATE TABLE "admin_tasks" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "description_markdown" TEXT NOT NULL,
    "created_by_user_id" UUID,
    "completed_at" TIMESTAMP(3),
    "completed_by_user_id" UUID,

    CONSTRAINT "admin_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_task_assignments" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "task_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "admin_task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_task_attachments" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "task_id" UUID NOT NULL,
    "uploader_user_id" UUID,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "file_data" BYTEA NOT NULL,
    "file_sha256" TEXT,

    CONSTRAINT "admin_task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_task_messages" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "task_id" UUID NOT NULL,
    "sender_user_id" UUID,
    "body_markdown" TEXT,

    CONSTRAINT "admin_task_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_task_message_attachments" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message_id" UUID NOT NULL,
    "uploader_user_id" UUID,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "file_data" BYTEA NOT NULL,
    "file_sha256" TEXT,

    CONSTRAINT "admin_task_message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_tasks_created_at_idx" ON "admin_tasks"("created_at" DESC);

-- CreateIndex
CREATE INDEX "admin_tasks_created_by_user_id_idx" ON "admin_tasks"("created_by_user_id");

-- CreateIndex
CREATE INDEX "admin_tasks_completed_by_user_id_idx" ON "admin_tasks"("completed_by_user_id");

-- CreateIndex
CREATE INDEX "admin_tasks_completed_at_idx" ON "admin_tasks"("completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_task_assignments_task_id_user_id_key" ON "admin_task_assignments"("task_id", "user_id");

-- CreateIndex
CREATE INDEX "admin_task_assignments_task_id_idx" ON "admin_task_assignments"("task_id");

-- CreateIndex
CREATE INDEX "admin_task_assignments_user_id_idx" ON "admin_task_assignments"("user_id");

-- CreateIndex
CREATE INDEX "admin_task_attachments_task_id_idx" ON "admin_task_attachments"("task_id");

-- CreateIndex
CREATE INDEX "admin_task_attachments_uploader_user_id_idx" ON "admin_task_attachments"("uploader_user_id");

-- CreateIndex
CREATE INDEX "admin_task_messages_task_id_idx" ON "admin_task_messages"("task_id");

-- CreateIndex
CREATE INDEX "admin_task_messages_sender_user_id_idx" ON "admin_task_messages"("sender_user_id");

-- CreateIndex
CREATE INDEX "admin_task_messages_created_at_idx" ON "admin_task_messages"("created_at" DESC);

-- CreateIndex
CREATE INDEX "admin_task_message_attachments_message_id_idx" ON "admin_task_message_attachments"("message_id");

-- CreateIndex
CREATE INDEX "admin_task_message_attachments_uploader_user_id_idx" ON "admin_task_message_attachments"("uploader_user_id");

-- AddForeignKey
ALTER TABLE "admin_tasks" ADD CONSTRAINT "admin_tasks_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_tasks" ADD CONSTRAINT "admin_tasks_completed_by_user_id_fkey" FOREIGN KEY ("completed_by_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_task_assignments" ADD CONSTRAINT "admin_task_assignments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "admin_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_task_assignments" ADD CONSTRAINT "admin_task_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_task_attachments" ADD CONSTRAINT "admin_task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "admin_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_task_attachments" ADD CONSTRAINT "admin_task_attachments_uploader_user_id_fkey" FOREIGN KEY ("uploader_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_task_messages" ADD CONSTRAINT "admin_task_messages_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "admin_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_task_messages" ADD CONSTRAINT "admin_task_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_task_message_attachments" ADD CONSTRAINT "admin_task_message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "admin_task_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_task_message_attachments" ADD CONSTRAINT "admin_task_message_attachments_uploader_user_id_fkey" FOREIGN KEY ("uploader_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

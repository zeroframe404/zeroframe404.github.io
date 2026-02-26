-- CreateEnum
CREATE TYPE "AdminUserBranch" AS ENUM ('lanus', 'avellaneda', 'online');

-- AlterTable
ALTER TABLE "admin_users"
ADD COLUMN "branch" "AdminUserBranch" NOT NULL DEFAULT 'online';

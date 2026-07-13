-- CreateTable
CREATE TABLE IF NOT EXISTS "early_access_signups" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "establishment" TEXT,
    "city" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "early_access_signups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "early_access_signups_email_idx" ON "early_access_signups"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "early_access_signups_userType_idx" ON "early_access_signups"("userType");

-- AlterTable
ALTER TABLE "early_access_signups" ALTER COLUMN "phone" DROP NOT NULL;


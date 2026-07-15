/*
  Warnings:

  - Changed the type of `userType` on the `early_access_signups` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "EarlyAccessUserType" AS ENUM ('PROFESSIONAL', 'CLIENT');

-- AlterTable
ALTER TABLE "early_access_signups" DROP COLUMN "userType",
ADD COLUMN     "userType" "EarlyAccessUserType" NOT NULL;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "accountId" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "tenantId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "interval" TEXT NOT NULL DEFAULT 'year',
    "maxSalons" INTEGER NOT NULL,
    "stripePriceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'NONE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_ownerUserId_key" ON "accounts"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_accountId_key" ON "subscriptions"("accountId");

-- CreateIndex
CREATE INDEX "early_access_signups_userType_idx" ON "early_access_signups"("userType");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

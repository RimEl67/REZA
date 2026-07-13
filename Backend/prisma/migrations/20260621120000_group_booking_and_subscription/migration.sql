-- AlterTable
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscriptionActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "BookingGroupStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "booking_groups" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bookerClientId" TEXT,
    "bookerFirstName" TEXT NOT NULL,
    "bookerLastName" TEXT NOT NULL,
    "bookerPhone" TEXT NOT NULL,
    "bookerEmail" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "status" "BookingGroupStatus" NOT NULL DEFAULT 'PENDING',
    "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricingSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "booking_participants" (
    "id" TEXT NOT NULL,
    "bookingGroupId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "clientId" TEXT,
    "isBooker" BOOLEAN NOT NULL DEFAULT false,
    "serviceIds" TEXT[],
    "durationMinutes" INTEGER NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "appointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_participants_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "bookingGroupId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "booking_groups_tenantId_startTime_idx" ON "booking_groups"("tenantId", "startTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "booking_participants_bookingGroupId_idx" ON "booking_participants"("bookingGroupId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "booking_participants_appointmentId_key" ON "booking_participants"("appointmentId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "booking_groups" ADD CONSTRAINT "booking_groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "booking_groups" ADD CONSTRAINT "booking_groups_bookerClientId_fkey" FOREIGN KEY ("bookerClientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "booking_participants" ADD CONSTRAINT "booking_participants_bookingGroupId_fkey" FOREIGN KEY ("bookingGroupId") REFERENCES "booking_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "booking_participants" ADD CONSTRAINT "booking_participants_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "booking_participants" ADD CONSTRAINT "booking_participants_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "appointments" ADD CONSTRAINT "appointments_bookingGroupId_fkey" FOREIGN KEY ("bookingGroupId") REFERENCES "booking_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

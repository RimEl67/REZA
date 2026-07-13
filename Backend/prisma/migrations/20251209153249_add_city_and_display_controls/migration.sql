-- AlterTable
ALTER TABLE "tenant_settings" ADD COLUMN     "onlineReservationEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showMap" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showOnlineReservation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showOpeningHours" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showReviews" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "city" TEXT;

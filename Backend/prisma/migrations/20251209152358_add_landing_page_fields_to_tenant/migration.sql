-- AlterTable
ALTER TABLE "tenant_settings" ADD COLUMN     "amenities" JSONB,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "socialMedia" JSONB;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "category" TEXT,
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "website" TEXT;

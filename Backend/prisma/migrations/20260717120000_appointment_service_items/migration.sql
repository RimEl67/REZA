-- First-class service lines for multi-service reservations.
CREATE TABLE "appointment_service_items" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "serviceId" TEXT,
  "serviceName" TEXT NOT NULL,
  "duration" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "appointment_service_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "appointment_service_items_appointmentId_idx"
  ON "appointment_service_items"("appointmentId");

CREATE INDEX "appointment_service_items_serviceId_idx"
  ON "appointment_service_items"("serviceId");

ALTER TABLE "appointment_service_items"
  ADD CONSTRAINT "appointment_service_items_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointment_service_items"
  ADD CONSTRAINT "appointment_service_items_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "services"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill the existing compatibility service as the first reservation service item.
INSERT INTO "appointment_service_items" (
  "id",
  "appointmentId",
  "serviceId",
  "serviceName",
  "duration",
  "price",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
SELECT
  'asi_' || md5(a."id" || ':' || s."id" || ':' || random()::text),
  a."id",
  s."id",
  s."name",
  COALESCE(a."duration", s."duration", 0),
  COALESCE(s."price", s."priceFrom", 0),
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "appointments" a
JOIN "services" s ON s."id" = a."serviceId"
WHERE NOT EXISTS (
  SELECT 1
  FROM "appointment_service_items" asi
  WHERE asi."appointmentId" = a."id"
);

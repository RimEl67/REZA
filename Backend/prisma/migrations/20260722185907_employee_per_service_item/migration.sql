-- Add per-service-item employee assignment for sequential multi-employee reservations.
ALTER TABLE "appointment_service_items"
  ADD COLUMN "employeeId" TEXT;

ALTER TABLE "appointment_service_items"
  ADD CONSTRAINT "appointment_service_items_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "appointment_service_items_employeeId_idx"
  ON "appointment_service_items"("employeeId");

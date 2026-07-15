-- AlterEnum: add REFUND to CashTransactionType
ALTER TYPE "CashTransactionType" ADD VALUE IF NOT EXISTS 'REFUND';

-- Make Invoice.clientId optional (walk-in sales)
ALTER TABLE "invoices" ALTER COLUMN "clientId" DROP NOT NULL;

-- CreateTable: invoice_items
CREATE TABLE IF NOT EXISTS "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "serviceId" TEXT,
    "serviceName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");
CREATE INDEX IF NOT EXISTS "invoice_items_serviceId_idx" ON "invoice_items"("serviceId");

ALTER TABLE "invoice_items"
  ADD CONSTRAINT "invoice_items_invoiceId_fkey"
  FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoice_items"
  ADD CONSTRAINT "invoice_items_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

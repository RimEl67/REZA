-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorites_clientId_idx" ON "favorites"("clientId");

-- CreateIndex
CREATE INDEX "favorites_tenantId_idx" ON "favorites"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_clientId_tenantId_key" ON "favorites"("clientId", "tenantId");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

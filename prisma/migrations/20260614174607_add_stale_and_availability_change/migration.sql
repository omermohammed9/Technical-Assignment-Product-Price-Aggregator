-- AlterTable
ALTER TABLE "PriceHistory" ADD COLUMN     "availabilityChanged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isStale" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "PriceHistory_productId_idx" ON "PriceHistory"("productId");

-- CreateIndex
CREATE INDEX "Product_isStale_idx" ON "Product"("isStale");

-- CreateIndex
CREATE INDEX "Product_lastFetched_idx" ON "Product"("lastFetched");

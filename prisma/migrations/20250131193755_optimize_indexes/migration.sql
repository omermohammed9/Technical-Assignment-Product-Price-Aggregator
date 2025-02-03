/*
  Warnings:

  - You are about to alter the column `name` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- CreateIndex
CREATE INDEX "PriceHistory_timestamp_idx" ON "PriceHistory"("timestamp");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE INDEX "Product_provider_idx" ON "Product"("provider");

-- CreateIndex
CREATE INDEX "Product_price_idx" ON "Product"("price");

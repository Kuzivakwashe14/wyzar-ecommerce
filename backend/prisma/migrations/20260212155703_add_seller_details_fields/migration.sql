-- AlterTable
ALTER TABLE "seller_details" ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "productCategory" TEXT,
ADD COLUMN     "totalSkuCount" INTEGER,
ADD COLUMN     "annualRevenue" TEXT,
ADD COLUMN     "primarySalesChannel" TEXT,
ADD COLUMN     "catalogStandardsAgreed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slaAgreed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "paymentProof" TEXT;

-- AlterTable
ALTER TABLE "verification_documents" ADD COLUMN     "fileHash" TEXT;

-- CreateIndex
CREATE INDEX "verification_documents_fileHash_idx" ON "verification_documents"("fileHash");

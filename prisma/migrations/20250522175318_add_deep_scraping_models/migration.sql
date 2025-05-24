/*
  Warnings:

  - The `status` column on the `WebsiteAnalysis` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `WebsiteAnalysis` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'MAPPING', 'SCRAPING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('CSS', 'JAVASCRIPT', 'IMAGE', 'FONT', 'VIDEO', 'AUDIO', 'OTHER');

-- AlterTable
ALTER TABLE "WebsiteAnalysis" ADD COLUMN     "error" TEXT,
ADD COLUMN     "options" JSONB,
ADD COLUMN     "processingTime" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "WebsitePage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "htmlContent" TEXT,
    "markdownContent" TEXT,
    "screenshotPath" TEXT,
    "metadata" JSONB,
    "analysisId" TEXT NOT NULL,

    CONSTRAINT "WebsitePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteAsset" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "content" TEXT,
    "metadata" JSONB,
    "analysisId" TEXT NOT NULL,

    CONSTRAINT "WebsiteAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceData" (
    "id" TEXT NOT NULL,
    "performanceScore" DOUBLE PRECISION,
    "accessibilityScore" DOUBLE PRECISION,
    "seoScore" DOUBLE PRECISION,
    "bestPracticesScore" DOUBLE PRECISION,
    "lighthouseData" JSONB,
    "analysisId" TEXT NOT NULL,

    CONSTRAINT "PerformanceData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WebsiteAssetToWebsitePage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WebsiteAssetToWebsitePage_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceData_analysisId_key" ON "PerformanceData"("analysisId");

-- CreateIndex
CREATE INDEX "_WebsiteAssetToWebsitePage_B_index" ON "_WebsiteAssetToWebsitePage"("B");

-- AddForeignKey
ALTER TABLE "WebsitePage" ADD CONSTRAINT "WebsitePage_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "WebsiteAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteAsset" ADD CONSTRAINT "WebsiteAsset_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "WebsiteAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceData" ADD CONSTRAINT "PerformanceData_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "WebsiteAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WebsiteAssetToWebsitePage" ADD CONSTRAINT "_WebsiteAssetToWebsitePage_A_fkey" FOREIGN KEY ("A") REFERENCES "WebsiteAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WebsiteAssetToWebsitePage" ADD CONSTRAINT "_WebsiteAssetToWebsitePage_B_fkey" FOREIGN KEY ("B") REFERENCES "WebsitePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

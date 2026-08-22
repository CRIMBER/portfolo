-- CreateEnum
CREATE TYPE "ViewSource" AS ENUM ('DIRECT', 'QR');

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "source" "ViewSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageView_portfolioId_createdAt_idx" ON "PageView"("portfolioId", "createdAt");

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

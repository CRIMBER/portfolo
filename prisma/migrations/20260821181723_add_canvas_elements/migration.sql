-- CreateEnum
CREATE TYPE "CanvasElementType" AS ENUM ('TEXT', 'IMAGE');

-- CreateTable
CREATE TABLE "CanvasElement" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "type" "CanvasElementType" NOT NULL,
    "content" TEXT NOT NULL,
    "xPct" DOUBLE PRECISION NOT NULL,
    "yPx" DOUBLE PRECISION NOT NULL,
    "widthPct" DOUBLE PRECISION NOT NULL,
    "heightPx" DOUBLE PRECISION NOT NULL,
    "rotationDeg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zIndex" INTEGER NOT NULL DEFAULT 0,
    "style" JSONB NOT NULL,
    "animations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanvasElement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CanvasElement_portfolioId_idx" ON "CanvasElement"("portfolioId");

-- AddForeignKey
ALTER TABLE "CanvasElement" ADD CONSTRAINT "CanvasElement_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

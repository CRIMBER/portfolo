/*
  Warnings:

  - You are about to drop the column `offlineAvailable` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `posterUrl` on the `Media` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Media" DROP COLUMN "offlineAvailable",
DROP COLUMN "posterUrl";

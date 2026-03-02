/*
  Warnings:

  - You are about to drop the column `backupEnabled` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `contactEmail` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `openHours` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `orgName` on the `SystemSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SystemSettings" DROP COLUMN "backupEnabled",
DROP COLUMN "contactEmail",
DROP COLUMN "openHours",
DROP COLUMN "orgName",
ADD COLUMN     "requireInstitutionalDomain" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "notificationsEnabled" SET DEFAULT false;

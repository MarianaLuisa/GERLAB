/*
  Warnings:

  - You are about to drop the column `activeFloors` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `allowedManagerEmails` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `auditRetentionDays` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `backupEnabled` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `defaultLabsByFloor` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `exportMaskPhones` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `maintenanceMode` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `notifyChannels` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `overdueGraceDays` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `requireInstitutionalDomain` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `requireReasonOnCancel` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `requireReasonOnMaintenance` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `sessionMaxHours` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `SystemSettings` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'ALLOCATION_RENEWED';

-- AlterTable
ALTER TABLE "SystemSettings" DROP COLUMN "activeFloors",
DROP COLUMN "allowedManagerEmails",
DROP COLUMN "auditRetentionDays",
DROP COLUMN "backupEnabled",
DROP COLUMN "defaultLabsByFloor",
DROP COLUMN "exportMaskPhones",
DROP COLUMN "language",
DROP COLUMN "maintenanceMode",
DROP COLUMN "notifyChannels",
DROP COLUMN "overdueGraceDays",
DROP COLUMN "requireInstitutionalDomain",
DROP COLUMN "requireReasonOnCancel",
DROP COLUMN "requireReasonOnMaintenance",
DROP COLUMN "sessionMaxHours",
DROP COLUMN "theme";

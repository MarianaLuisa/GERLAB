/*
  Warnings:

  - You are about to drop the column `ccEmails` on the `NotificationOutbox` table. All the data in the column will be lost.
  - You are about to drop the column `toEmails` on the `NotificationOutbox` table. All the data in the column will be lost.
  - You are about to drop the column `allocationMonthsDefault` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `lgpdFooterText` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `limitOneActivePerUser` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `notificationsEnabled` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `notifyCcEmails` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `notifyDaysBeforeDue` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `notifyManagerEmails` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `orgContactEmail` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `orgWorkingHours` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `renewalMaxCount` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `renewalMonths` on the `SystemSettings` table. All the data in the column will be lost.
  - Added the required column `entity` to the `NotificationOutbox` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toEmail` to the `NotificationOutbox` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `NotificationOutbox` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "NotificationOutbox" DROP COLUMN "ccEmails",
DROP COLUMN "toEmails",
ADD COLUMN     "entity" "AuditEntity" NOT NULL,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "toEmail" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SystemSettings" DROP COLUMN "allocationMonthsDefault",
DROP COLUMN "lgpdFooterText",
DROP COLUMN "limitOneActivePerUser",
DROP COLUMN "notificationsEnabled",
DROP COLUMN "notifyCcEmails",
DROP COLUMN "notifyDaysBeforeDue",
DROP COLUMN "notifyManagerEmails",
DROP COLUMN "orgContactEmail",
DROP COLUMN "orgWorkingHours",
DROP COLUMN "renewalMaxCount",
DROP COLUMN "renewalMonths",
ADD COLUMN     "allocationMonths" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "allowedEmails" TEXT,
ADD COLUMN     "backupEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'pt-BR',
ADD COLUMN     "maxRenewals" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "notifyEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "openHours" TEXT,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'light',
ALTER COLUMN "id" SET DEFAULT 'singleton';

-- CreateIndex
CREATE INDEX "NotificationOutbox_status_createdAt_idx" ON "NotificationOutbox"("status", "createdAt");

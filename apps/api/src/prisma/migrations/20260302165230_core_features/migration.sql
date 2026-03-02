/*
  Warnings:

  - You are about to drop the column `allowedEmails` on the `SystemSettings` table. All the data in the column will be lost.
  - You are about to drop the column `notifyEnabled` on the `SystemSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SystemSettings" DROP COLUMN "allowedEmails",
DROP COLUMN "notifyEnabled",
ADD COLUMN     "allowedManagerEmails" TEXT NOT NULL DEFAULT 'msbrasil@ufcspa.edu.br,yorrana.marins@ufcspa.edu.br',
ADD COLUMN     "notificationToEmails" TEXT,
ADD COLUMN     "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "NotificationEvent" AS ENUM ('ALLOCATION_CREATED', 'ALLOCATION_ENDED', 'ALLOCATION_RENEWED', 'ALLOCATION_CANCELLED', 'LOCKER_MAINTENANCE', 'LOCKER_FREED', 'DUE_SOON', 'OVERDUE');

-- CreateEnum
CREATE TYPE "AccessEvent" AS ENUM ('LOGIN', 'LOGOUT', 'ACCESS_DENIED');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'ALLOCATION_CANCELLED';

-- DropIndex
DROP INDEX "Allocation_one_active_per_locker";

-- DropIndex
DROP INDEX "Allocation_one_active_per_user";

-- AlterTable
ALTER TABLE "Allocation" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "renewedCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "allocationMonthsDefault" INTEGER NOT NULL DEFAULT 6,
    "allowRenewal" BOOLEAN NOT NULL DEFAULT true,
    "renewalMonths" INTEGER NOT NULL DEFAULT 6,
    "renewalMaxCount" INTEGER NOT NULL DEFAULT 1,
    "limitOneActivePerUser" BOOLEAN NOT NULL DEFAULT true,
    "overdueGraceDays" INTEGER NOT NULL DEFAULT 7,
    "requireReasonOnCancel" BOOLEAN NOT NULL DEFAULT false,
    "requireReasonOnMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyChannels" "NotificationChannel"[] DEFAULT ARRAY['EMAIL']::"NotificationChannel"[],
    "notifyManagerEmails" TEXT NOT NULL DEFAULT '',
    "notifyCcEmails" TEXT NOT NULL DEFAULT '',
    "notifyDaysBeforeDue" TEXT NOT NULL DEFAULT '30,15,7,1',
    "orgName" TEXT NOT NULL DEFAULT 'PROPPGI / UFCSPA',
    "orgContactEmail" TEXT NOT NULL DEFAULT '',
    "orgWorkingHours" TEXT NOT NULL DEFAULT '',
    "activeFloors" TEXT NOT NULL DEFAULT '2,3,5,6,7,8',
    "defaultLabsByFloor" JSONB,
    "allowedManagerEmails" TEXT NOT NULL DEFAULT '',
    "requireInstitutionalDomain" BOOLEAN NOT NULL DEFAULT true,
    "sessionMaxHours" INTEGER NOT NULL DEFAULT 24,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "auditRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "exportMaskPhones" BOOLEAN NOT NULL DEFAULT false,
    "backupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "lgpdFooterText" TEXT NOT NULL DEFAULT 'Acesso restrito a e-mails autorizados. Conformidade LGPD.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationOutbox" (
    "id" TEXT NOT NULL,
    "event" "NotificationEvent" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "toEmails" TEXT NOT NULL,
    "ccEmails" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "NotificationOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL,
    "actorEmail" TEXT,
    "event" "AccessEvent" NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

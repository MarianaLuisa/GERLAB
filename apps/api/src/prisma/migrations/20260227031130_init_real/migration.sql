-- CreateEnum
CREATE TYPE "LockerStatus" AS ENUM ('FREE', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOCKER_CREATED', 'LOCKER_STATUS_CHANGED', 'ALLOCATION_CREATED', 'ALLOCATION_ENDED', 'NOTIFICATION_SENT', 'DATA_IMPORT');

-- CreateEnum
CREATE TYPE "AuditEntity" AS ENUM ('LOCKER', 'ALLOCATION', 'USER', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locker" (
    "id" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "keyNumber" INTEGER NOT NULL,
    "lab" TEXT,
    "status" "LockerStatus" NOT NULL DEFAULT 'FREE',
    "currentUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Locker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lockerId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorEmail" TEXT,
    "actorName" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity" "AuditEntity" NOT NULL,
    "entityId" TEXT,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Locker_floor_keyNumber_key" ON "Locker"("floor", "keyNumber");

-- CreateIndex
CREATE INDEX "Allocation_userId_endAt_idx" ON "Allocation"("userId", "endAt");

-- CreateIndex
CREATE INDEX "Allocation_lockerId_endAt_idx" ON "Allocation"("lockerId", "endAt");

-- AddForeignKey
ALTER TABLE "Locker" ADD CONSTRAINT "Locker_currentUserId_fkey" FOREIGN KEY ("currentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_lockerId_fkey" FOREIGN KEY ("lockerId") REFERENCES "Locker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 1 alocação ativa por armário
CREATE UNIQUE INDEX IF NOT EXISTS "Allocation_one_active_per_locker"
ON "Allocation"("lockerId")
WHERE "endAt" IS NULL;

-- 1 alocação ativa por usuário
CREATE UNIQUE INDEX IF NOT EXISTS "Allocation_one_active_per_user"
ON "Allocation"("userId")
WHERE "endAt" IS NULL;
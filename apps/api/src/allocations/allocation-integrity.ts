import { Prisma, PrismaClient } from '@prisma/client';

type PrismaLike =
  | Pick<PrismaClient, 'allocation' | 'locker'>
  | Pick<Prisma.TransactionClient, 'allocation' | 'locker'>;

const activeOrder = [
  { startAt: 'desc' as const },
  { createdAt: 'desc' as const },
  { id: 'desc' as const },
];

export async function findActiveAllocationForLocker(
  tx: PrismaLike,
  lockerId: string,
) {
  return await tx.allocation.findFirst({
    where: { lockerId, endAt: null },
    orderBy: activeOrder,
    include: { user: true, locker: true },
  });
}

export async function hasActiveAllocationForUser(
  tx: PrismaLike,
  userId: string,
) {
  return await tx.allocation.findFirst({
    where: { userId, endAt: null },
    select: { id: true },
  });
}

export async function reconcileLockerState(tx: PrismaLike, lockerId: string) {
  const locker = await tx.locker.findUnique({ where: { id: lockerId } });
  if (!locker) return null;

  const active = await findActiveAllocationForLocker(tx, lockerId);

  if (active) {
    if (
      locker.status !== 'OCCUPIED' ||
      locker.currentUserId !== active.userId
    ) {
      await tx.locker.update({
        where: { id: lockerId },
        data: { status: 'OCCUPIED', currentUserId: active.userId },
      });
    }
    return {
      status: 'OCCUPIED' as const,
      currentUserId: active.userId,
      active,
    };
  }

  const nextStatus = locker.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'FREE';
  if (locker.status !== nextStatus || locker.currentUserId !== null) {
    await tx.locker.update({
      where: { id: lockerId },
      data: { status: nextStatus, currentUserId: null },
    });
  }

  return { status: nextStatus, currentUserId: null, active: null };
}

export async function endActiveAllocationsForLocker(
  tx: PrismaLike,
  lockerId: string,
  endedAt: Date,
) {
  const active = await tx.allocation.findMany({
    where: { lockerId, endAt: null },
    orderBy: activeOrder,
    include: { user: true, locker: true },
  });

  if (active.length === 0) return { endedCount: 0, primary: null };

  await tx.allocation.updateMany({
    where: { lockerId, endAt: null },
    data: { endAt: endedAt },
  });

  await tx.locker.update({
    where: { id: lockerId },
    data: { status: 'FREE', currentUserId: null },
  });

  return { endedCount: active.length, primary: active[0] };
}

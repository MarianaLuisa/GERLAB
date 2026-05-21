import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { reconcileLockerState } from '../allocations/allocation-integrity';

@Controller('maintenance')
@UseGuards(AuthGuard)
export class MaintenanceController {
  constructor(private prisma: PrismaService) {}

  @Post('reconcile')
  async reconcile() {
    const endedAt = new Date();
    let fixedLockers = 0;
    let endedDuplicateAllocations = 0;

    const maintenanceLockersWithActive = await this.prisma.locker.findMany({
      where: { status: 'MAINTENANCE', allocations: { some: { endAt: null } } },
      select: { id: true },
    });

    for (const locker of maintenanceLockersWithActive) {
      const result = await this.prisma.allocation.updateMany({
        where: { lockerId: locker.id, endAt: null },
        data: {
          endAt: endedAt,
          cancelReason: 'Encerrada por reconciliação: armário em manutenção.',
        },
      });

      endedDuplicateAllocations += result.count;
      await this.prisma.locker.update({
        where: { id: locker.id },
        data: { currentUserId: null },
      });
    }

    endedDuplicateAllocations += await this.endDuplicateActiveAllocations(
      'lockerId',
      endedAt,
    );
    endedDuplicateAllocations += await this.endDuplicateActiveAllocations(
      'userId',
      endedAt,
    );

    const lockers = await this.prisma.locker.findMany();
    for (const locker of lockers) {
      const before = `${locker.status}:${locker.currentUserId ?? ''}`;
      const state = await this.prisma.$transaction((tx) =>
        reconcileLockerState(tx, locker.id),
      );
      const after = `${state?.status ?? locker.status}:${state?.currentUserId ?? ''}`;
      if (before !== after) fixedLockers++;
    }

    return { ok: true, fixed: fixedLockers, endedDuplicateAllocations };
  }

  private async endDuplicateActiveAllocations(
    groupField: 'lockerId' | 'userId',
    endedAt: Date,
  ) {
    const active = await this.prisma.allocation.findMany({
      where: { endAt: null },
      orderBy: [{ startAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, lockerId: true, userId: true },
    });

    const seen = new Set<string>();
    const duplicateIds: string[] = [];

    for (const allocation of active) {
      const groupId = allocation[groupField];
      if (seen.has(groupId)) {
        duplicateIds.push(allocation.id);
      } else {
        seen.add(groupId);
      }
    }

    if (duplicateIds.length === 0) return 0;

    const result = await this.prisma.allocation.updateMany({
      where: { id: { in: duplicateIds }, endAt: null },
      data: {
        endAt: endedAt,
        cancelReason: 'Encerrada por reconciliação: alocação ativa duplicada.',
      },
    });

    return result.count;
  }
}

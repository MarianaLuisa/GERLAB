import { Controller, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";

@Controller("maintenance")
@UseGuards(AuthGuard)
export class MaintenanceController {
  constructor(private prisma: PrismaService) {}

  @Post("reconcile")
  async reconcile() {
    const lockers = await this.prisma.locker.findMany();
    let fixed = 0;

    for (const l of lockers) {
      const active = await this.prisma.allocation.findFirst({
        where: { lockerId: l.id, endAt: null },
        include: { user: true },
      });

      // se está em manutenção, respeita manutenção (não mexe)
      if (l.status === "MAINTENANCE") continue;

      if (active) {
        // deveria estar ocupado com user
        if (l.status !== "OCCUPIED" || l.currentUserId !== active.userId) {
          await this.prisma.locker.update({
            where: { id: l.id },
            data: { status: "OCCUPIED", currentUserId: active.userId },
          });
          fixed++;
        }
      } else {
        // deveria estar livre
        if (l.status !== "FREE" || l.currentUserId !== null) {
          await this.prisma.locker.update({
            where: { id: l.id },
            data: { status: "FREE", currentUserId: null },
          });
          fixed++;
        }
      }
    }

    return { ok: true, fixed };
  }
}
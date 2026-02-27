import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";

@Controller("audit")
@UseGuards(AuthGuard)
export class AuditController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Query("fromISO") fromISO?: string, @Query("toISO") toISO?: string) {
    return this.prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: fromISO ? new Date(fromISO) : undefined,
          lte: toISO ? new Date(toISO) : undefined,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { IsISO8601, IsOptional, IsString } from "class-validator";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";

class CreateAllocationDto {
  @IsString()
  userId!: string;

  @IsString()
  lockerId!: string;

  // como você quer REAL, startAt vem do momento real (agora) ou pode ser enviado
  @IsOptional()
  @IsISO8601()
  startAtISO?: string;

  // não existe na planilha -> mantemos opcional
  @IsOptional()
  @IsISO8601()
  dueAtISO?: string;
}

function lockerLabel(l: { floor: number; keyNumber: number; lab: string | null }) {
  return `${l.floor}º • Chave ${l.keyNumber}${l.lab ? ` • ${l.lab}` : ""}`;
}

function mapAllocation(a: any) {
  return {
    id: a.id,
    userId: a.userId,
    userName: a.user?.name ?? null,
    lockerId: a.lockerId,

    lockerFloor: a.locker?.floor ?? null,
    lockerKeyNumber: a.locker?.keyNumber ?? null,
    lockerLab: a.locker?.lab ?? null,
    lockerLabel: a.locker ? lockerLabel(a.locker) : null,

    startAt: a.startAt,
    dueAt: a.dueAt,
    endAt: a.endAt,
  };
}

@Controller("allocations")
@UseGuards(AuthGuard)
export class AllocationsController {
  constructor(private prisma: PrismaService) {}

  @Get("active")
  async active() {
    const xs = await this.prisma.allocation.findMany({
      where: { endAt: null },
      orderBy: { startAt: "desc" },
      include: { user: true, locker: true },
    });

    return xs.map(mapAllocation);
  }

  @Get("history/user/:userId")
  async historyByUser(@Param("userId") userId: string) {
    const xs = await this.prisma.allocation.findMany({
      where: { userId },
      orderBy: { startAt: "desc" },
      include: { user: true, locker: true },
    });

    return xs.map(mapAllocation);
  }

  @Get("history/locker/:lockerId")
  async historyByLocker(@Param("lockerId") lockerId: string) {
    const xs = await this.prisma.allocation.findMany({
      where: { lockerId },
      orderBy: { startAt: "desc" },
      include: { user: true, locker: true },
    });

    return xs.map(mapAllocation);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateAllocationDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new BadRequestException("Usuário não encontrado.");

    const locker = await this.prisma.locker.findUnique({ where: { id: dto.lockerId } });
    if (!locker) throw new BadRequestException("Armário não encontrado.");

    if (locker.status !== "FREE") {
      throw new BadRequestException("Chave indisponível (não está Livre).");
    }

    // regra: usuário só pode ter 1 alocação ativa
    const userHasActive = await this.prisma.allocation.findFirst({
      where: { userId: user.id, endAt: null },
    });
    if (userHasActive) throw new BadRequestException("Este usuário já possui uma alocação ativa.");

    const startAt = dto.startAtISO ? new Date(dto.startAtISO) : new Date();
    const dueAt = dto.dueAtISO ? new Date(dto.dueAtISO) : null;

    const allocation = await this.prisma.$transaction(async (tx) => {
      const a = await tx.allocation.create({
        data: {
          userId: user.id,
          lockerId: locker.id,
          startAt,
          dueAt,
          endAt: null,
        },
        include: { user: true, locker: true },
      });

      await tx.locker.update({
        where: { id: locker.id },
        data: {
          status: "OCCUPIED",
          currentUserId: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorEmail: req.userEmail ?? null,
          actorName: req.userEmail ?? null,
          action: "ALLOCATION_CREATED",
          entity: "ALLOCATION",
          entityId: a.id,
          details: `Saída registrada: ${user.name} -> ${lockerLabel(locker)}`,
        },
      });

      return a;
    });

    return mapAllocation(allocation);
  }

  @Post(":id/end")
  async end(@Req() req: any, @Param("id") id: string) {
    const a = await this.prisma.allocation.findUnique({
      where: { id },
      include: { locker: true, user: true },
    });
    if (!a || a.endAt) throw new BadRequestException("Alocação ativa não encontrada.");

    await this.prisma.$transaction(async (tx) => {
      await tx.allocation.update({
        where: { id },
        data: { endAt: new Date() },
      });

      await tx.locker.update({
        where: { id: a.lockerId },
        data: { status: "FREE", currentUserId: null },
      });

      await tx.auditLog.create({
        data: {
          actorEmail: req.userEmail ?? null,
          actorName: req.userEmail ?? null,
          action: "ALLOCATION_ENDED",
          entity: "ALLOCATION",
          entityId: id,
          details: `Devolução registrada: ${a.user?.name ?? "Usuário"} -> ${a.locker ? lockerLabel(a.locker) : "Chave"}`,
        },
      });
    });

    return { ok: true };
  }
}
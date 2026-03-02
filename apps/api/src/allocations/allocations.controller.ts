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
import { IsEmail, IsOptional, IsString } from "class-validator";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";

class CreateAllocationDto {
  @IsString()
  lockerId!: string;

  @IsString()
  userName!: string;

  @IsEmail()
  userEmail!: string;

  @IsOptional()
  @IsString()
  userPhone?: string;
}

class CancelAllocationDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);

  // ajuste para meses com menos dias
  if (d.getDate() < day) d.setDate(0);
  return d;
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
    renewedCount: a.renewedCount,
    cancelReason: a.cancelReason,
  };
}

@Controller("allocations")
@UseGuards(AuthGuard)
export class AllocationsController {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService
  ) {}

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
    const userEmail = dto.userEmail.trim().toLowerCase();
    const userName = dto.userName.trim();
    const userPhone = dto.userPhone?.trim() || null;

    if (!userName) throw new BadRequestException("Informe o nome do usuário.");

    const locker = await this.prisma.locker.findUnique({ where: { id: dto.lockerId } });
    if (!locker) throw new BadRequestException("Armário não encontrado.");
    if (locker.status !== "FREE") throw new BadRequestException("Chave indisponível (não está Livre).");

    // settings
    const settings = await this.prisma.systemSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });

    const startAt = new Date();
    const dueAt = addMonths(startAt, settings.allocationMonths || 6);

    const result = await this.prisma.$transaction(async (tx) => {
      // upsert usuário
      const user = await tx.user.upsert({
        where: { email: userEmail },
        create: { email: userEmail, name: userName, phone: userPhone },
        update: { name: userName, phone: userPhone },
      });

      // integridade: usuário não pode ter alocação ativa
      const userHasActive = await tx.allocation.findFirst({
        where: { userId: user.id, endAt: null },
      });
      if (userHasActive) {
        throw new BadRequestException("Este usuário já possui uma alocação ativa.");
      }

      // integridade: armário não pode ter alocação ativa (dupla)
      const lockerHasActive = await tx.allocation.findFirst({
        where: { lockerId: locker.id, endAt: null },
      });
      if (lockerHasActive) {
        throw new BadRequestException("Este armário já possui uma alocação ativa.");
      }

      const a = await tx.allocation.create({
        data: {
          userId: user.id,
          lockerId: locker.id,
          startAt,
          dueAt,
          endAt: null,
          renewedCount: 0,
          cancelReason: null,
        },
        include: { user: true, locker: true },
      });

      await tx.locker.update({
        where: { id: locker.id },
        data: { status: "OCCUPIED", currentUserId: user.id },
      });

      await tx.auditLog.create({
        data: {
          actorEmail: req.userEmail ?? null,
          actorName: req.userEmail ?? null,
          action: "ALLOCATION_CREATED",
          entity: "ALLOCATION",
          entityId: a.id,
          details: `Saída registrada: ${user.name} -> ${lockerLabel(locker)} (previsto até ${dueAt.toLocaleString("pt-BR")})`,
        },
      });

      return a;
    });

    // notificação (outbox + SMTP se tiver)
    await this.notifications.send({
      event: "ALLOCATION_CREATED",
      entity: "ALLOCATION",
      entityId: result.id,
      toEmail: (await this.prisma.systemSettings.findUnique({ where: { id: "singleton" } }))?.notificationToEmails?.split(",")[0]?.trim()
        || req.userEmail, // fallback
      subject: "Nova alocação registrada",
      body: `Alocação criada.\nUsuário: ${result.user?.name}\nArmário: ${result.locker ? lockerLabel(result.locker) : ""}\nInício: ${new Date(result.startAt).toLocaleString("pt-BR")}\nPrevisto: ${result.dueAt ? new Date(result.dueAt).toLocaleString("pt-BR") : "-"}`,
      actorEmail: req.userEmail ?? null,
      actorName: req.userEmail ?? null,
    }).catch(() => {});

    return mapAllocation(result);
  }

  @Post(":id/end")
  async end(@Req() req: any, @Param("id") id: string) {
    const a = await this.prisma.allocation.findUnique({
      where: { id },
      include: { locker: true, user: true },
    });
    if (!a || a.endAt) throw new BadRequestException("Alocação ativa não encontrada.");

    await this.prisma.$transaction(async (tx) => {
      await tx.allocation.update({ where: { id }, data: { endAt: new Date() } });

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

    await this.notifications.send({
      event: "ALLOCATION_ENDED",
      entity: "ALLOCATION",
      entityId: id,
      toEmail: req.userEmail ?? "msbrasil@ufcspa.edu.br",
      subject: "Devolução registrada",
      body: `Devolução registrada.\nUsuário: ${a.user?.name}\nArmário: ${a.locker ? lockerLabel(a.locker) : ""}\nQuando: ${new Date().toLocaleString("pt-BR")}`,
      actorEmail: req.userEmail ?? null,
      actorName: req.userEmail ?? null,
    }).catch(() => {});

    return { ok: true };
  }

  @Post(":id/renew")
  async renew(@Req() req: any, @Param("id") id: string) {
    const settings = await this.prisma.systemSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });

    if (!settings.allowRenewal) throw new BadRequestException("Renovação desativada nas configurações.");

    const a = await this.prisma.allocation.findUnique({
      where: { id },
      include: { locker: true, user: true },
    });
    if (!a || a.endAt) throw new BadRequestException("Alocação ativa não encontrada.");

    if (a.renewedCount >= settings.maxRenewals) {
      throw new BadRequestException("Limite de renovações atingido.");
    }

    const base = a.dueAt ?? new Date();
    const nextDue = addMonths(new Date(base), settings.allocationMonths || 6);

    const updated = await this.prisma.$transaction(async (tx) => {
      const up = await tx.allocation.update({
        where: { id },
        data: { dueAt: nextDue, renewedCount: { increment: 1 } },
        include: { locker: true, user: true },
      });

      await tx.auditLog.create({
        data: {
          actorEmail: req.userEmail ?? null,
          actorName: req.userEmail ?? null,
          action: "ALLOCATION_RENEWED",
          entity: "ALLOCATION",
          entityId: id,
          details: `Renovação: ${up.user?.name ?? "Usuário"} -> ${up.locker ? lockerLabel(up.locker) : "Chave"} (novo prazo ${nextDue.toLocaleString("pt-BR")})`,
        },
      });

      return up;
    });

    await this.notifications.send({
      event: "ALLOCATION_RENEWED",
      entity: "ALLOCATION",
      entityId: id,
      toEmail: req.userEmail ?? "msbrasil@ufcspa.edu.br",
      subject: "Alocação renovada",
      body: `Renovação registrada.\nUsuário: ${updated.user?.name}\nArmário: ${updated.locker ? lockerLabel(updated.locker) : ""}\nNovo prazo: ${nextDue.toLocaleString("pt-BR")}`,
      actorEmail: req.userEmail ?? null,
      actorName: req.userEmail ?? null,
    }).catch(() => {});

    return mapAllocation(updated);
  }

  @Post(":id/cancel")
  async cancel(@Req() req: any, @Param("id") id: string, @Body() dto: CancelAllocationDto) {
    const a = await this.prisma.allocation.findUnique({
      where: { id },
      include: { locker: true, user: true },
    });
    if (!a || a.endAt) throw new BadRequestException("Alocação ativa não encontrada.");

    const reason = dto.reason?.trim() || "Cancelado pelo gestor";

    await this.prisma.$transaction(async (tx) => {
      await tx.allocation.update({
        where: { id },
        data: { endAt: new Date(), cancelReason: reason },
      });

      await tx.locker.update({
        where: { id: a.lockerId },
        data: { status: "FREE", currentUserId: null },
      });

      await tx.auditLog.create({
        data: {
          actorEmail: req.userEmail ?? null,
          actorName: req.userEmail ?? null,
          action: "ALLOCATION_CANCELLED",
          entity: "ALLOCATION",
          entityId: id,
          details: `Cancelamento: ${a.user?.name ?? "Usuário"} -> ${a.locker ? lockerLabel(a.locker) : "Chave"}. Motivo: ${reason}`,
        },
      });
    });

    await this.notifications.send({
      event: "ALLOCATION_CANCELLED",
      entity: "ALLOCATION",
      entityId: id,
      toEmail: req.userEmail ?? "msbrasil@ufcspa.edu.br",
      subject: "Alocação cancelada",
      body: `Cancelamento registrado.\nUsuário: ${a.user?.name}\nArmário: ${a.locker ? lockerLabel(a.locker) : ""}\nMotivo: ${reason}`,
      actorEmail: req.userEmail ?? null,
      actorName: req.userEmail ?? null,
    }).catch(() => {});

    return { ok: true };
  }
}
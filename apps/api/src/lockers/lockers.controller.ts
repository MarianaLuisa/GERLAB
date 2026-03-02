import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { LockerStatus } from "@prisma/client";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";

class CreateLockerDto {
  @IsInt()
  @Min(1)
  floor!: number;

  @IsInt()
  @Min(1)
  keyNumber!: number;

  @IsOptional()
  @IsString()
  lab?: string;
}

class UpdateLockerDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  floor?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  keyNumber?: number;

  @IsOptional()
  @IsString()
  lab?: string | null;
}

class UpdateStatusDto {
  @IsString()
  status!: "FREE" | "OCCUPIED" | "MAINTENANCE";
}

@Controller("lockers")
@UseGuards(AuthGuard)
export class LockersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    const lockers = await this.prisma.locker.findMany({
      orderBy: [{ floor: "asc" }, { keyNumber: "asc" }],
      include: { currentUser: true },
    });

    return lockers.map((l) => ({
      id: l.id,
      floor: l.floor,
      keyNumber: l.keyNumber,
      lab: l.lab,
      status: l.status,
      currentUserId: l.currentUserId,
      currentUserName: l.currentUser?.name ?? null,
    }));
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateLockerDto) {
    const floor = Number(dto.floor);
    const keyNumber = Number(dto.keyNumber);
    const lab = dto.lab?.trim() || null;

    if (![2, 3, 5, 6, 7, 8].includes(floor)) {
      throw new BadRequestException("Andar inválido (permitidos: 2, 3, 5, 6, 7, 8).");
    }

    try {
      const locker = await this.prisma.locker.create({
        data: { floor, keyNumber, lab, status: "FREE", currentUserId: null },
      });

      await this.prisma.auditLog.create({
        data: {
          actorEmail: req.userEmail ?? null,
          actorName: req.userEmail ?? null,
          action: "LOCKER_CREATED",
          entity: "LOCKER",
          entityId: locker.id,
          details: `Armário criado: ${floor}º • Chave ${keyNumber}${lab ? ` • ${lab}` : ""}`,
        },
      });

      return locker;
    } catch {
      throw new BadRequestException("Já existe uma chave com esse número nesse andar.");
    }
  }

  @Patch(":id")
  async update(@Req() req: any, @Param("id") id: string, @Body() dto: UpdateLockerDto) {
    const locker = await this.prisma.locker.findUnique({ where: { id } });
    if (!locker) throw new BadRequestException("Armário não encontrado.");

    const data: any = {};
    if (dto.floor !== undefined) {
      const floor = Number(dto.floor);
      if (![2, 3, 5, 6, 7, 8].includes(floor)) {
        throw new BadRequestException("Andar inválido (permitidos: 2, 3, 5, 6, 7, 8).");
      }
      data.floor = floor;
    }
    if (dto.keyNumber !== undefined) data.keyNumber = Number(dto.keyNumber);
    if (dto.lab !== undefined) data.lab = dto.lab === null ? null : String(dto.lab).trim() || null;

    try {
      const updated = await this.prisma.locker.update({ where: { id }, data });

      await this.prisma.auditLog.create({
        data: {
          actorEmail: req.userEmail ?? null,
          actorName: req.userEmail ?? null,
          action: "LOCKER_STATUS_CHANGED",
          entity: "LOCKER",
          entityId: id,
          details: `Armário editado: ${locker.floor}º/Chave ${locker.keyNumber} -> ${updated.floor}º/Chave ${updated.keyNumber}`,
        },
      });

      return updated;
    } catch {
      throw new BadRequestException("Conflito: já existe uma chave com esse número nesse andar.");
    }
  }

  @Patch(":id/status")
  async updateStatus(@Req() req: any, @Param("id") id: string, @Body() dto: UpdateStatusDto) {
    const status = dto.status as LockerStatus;

    const locker = await this.prisma.locker.findUnique({ where: { id } });
    if (!locker) throw new BadRequestException("Armário não encontrado.");

    // Se marcar como FREE/MAINTENANCE remove vínculo de usuário atual
    const nextCurrentUserId = status === "OCCUPIED" ? locker.currentUserId : null;

    // Se tentar colocar em manutenção, só permite se estiver livre e sem alocação ativa
    if (status === "MAINTENANCE") {
      if (locker.status !== "FREE") {
        throw new BadRequestException("Só é possível marcar como Manutenção quando o armário está Livre.");
      }

      const active = await this.prisma.allocation.findFirst({
        where: { lockerId: locker.id, endAt: null },
        select: { id: true },
      });

      if (active) {
        throw new BadRequestException("Este armário está com alocação ativa. Registre a devolução antes de marcar Manutenção.");
      }
    }
    // regra: não pode colocar FREE se existe alocação ativa (evita inconsistência)
    if (status === "FREE") {
      const active = await this.prisma.allocation.findFirst({
        where: { lockerId: id, endAt: null },
        select: { id: true },
      });
      if (active) throw new BadRequestException("Não pode marcar como Livre: existe alocação ativa.");
    }

    await this.prisma.locker.update({
      where: { id },
      data: { status, currentUserId: nextCurrentUserId },
    });

    await this.prisma.auditLog.create({
      data: {
        actorEmail: req.userEmail ?? null,
        actorName: req.userEmail ?? null,
        action: "LOCKER_STATUS_CHANGED",
        entity: "LOCKER",
        entityId: id,
        details: `Status alterado: ${locker.floor}º • Chave ${locker.keyNumber} (${locker.status} -> ${status})`,
      },
    });

    return { ok: true };
  }

  @Delete(":id")
  async remove(@Req() req: any, @Param("id") id: string) {
    const locker = await this.prisma.locker.findUnique({ where: { id } });
    if (!locker) throw new BadRequestException("Armário não encontrado.");

    // não deixar deletar se tem alocação ativa
    const active = await this.prisma.allocation.findFirst({
      where: { lockerId: id, endAt: null },
      select: { id: true },
    });
    if (active) throw new BadRequestException("Não é possível excluir: armário possui alocação ativa.");

    // não deixar deletar se já teve histórico (opcional, mas recomendado)
    const anyHistory = await this.prisma.allocation.findFirst({
      where: { lockerId: id },
      select: { id: true },
    });
    if (anyHistory) throw new BadRequestException("Não é possível excluir: este armário já possui histórico de utilização.");

    try {
      await this.prisma.locker.delete({ where: { id } });

      await this.prisma.auditLog.create({
        data: {
          actorEmail: req.userEmail ?? null,
          actorName: req.userEmail ?? null,
          action: "LOCKER_STATUS_CHANGED",
          entity: "LOCKER",
          entityId: id,
          details: `Armário excluído: ${locker.floor}º • Chave ${locker.keyNumber}`,
        },
      });

      return { ok: true };
    } catch (e: any) {
      throw new BadRequestException("Não foi possível excluir este armário.");
    }
  }
}
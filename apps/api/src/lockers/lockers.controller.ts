import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
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
        data: {
          floor,
          keyNumber,
          lab,
          status: "FREE",
          currentUserId: null,
        },
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

      return {
        id: locker.id,
        floor: locker.floor,
        keyNumber: locker.keyNumber,
        lab: locker.lab,
        status: locker.status,
        currentUserId: locker.currentUserId,
        currentUserName: null,
      };
    } catch {
      throw new BadRequestException("Já existe uma chave com esse número nesse andar.");
    }
  }

  @Patch(":id/status")
  async updateStatus(@Req() req: any, @Param("id") id: string, @Body() dto: UpdateStatusDto) {
    const status = dto.status as LockerStatus;

    const locker = await this.prisma.locker.findUnique({ where: { id } });
    if (!locker) throw new BadRequestException("Armário não encontrado.");

    // Se tirar de ocupado, remove vínculo com usuário atual
    const nextCurrentUserId = status === "OCCUPIED" ? locker.currentUserId : null;

    await this.prisma.locker.update({
      where: { id },
      data: {
        status,
        currentUserId: nextCurrentUserId,
      },
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
}
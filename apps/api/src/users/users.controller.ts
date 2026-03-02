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
import { IsEmail, IsOptional, IsString } from "class-validator";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.user.findMany({ orderBy: { name: "asc" } });
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) throw new BadRequestException("Usuário não encontrado.");
    return u;
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateUserDto) {
    const name = dto.name.trim();
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone?.trim() || null;

    if (!name) throw new BadRequestException("Informe o nome.");
    if (!email) throw new BadRequestException("Informe o e-mail.");

    try {
      const u = await this.prisma.user.create({
        data: { name, email, phone },
      });

      // Audit (sem mexer em enum agora): usa DATA_IMPORT como ação genérica
      await this.prisma.auditLog.create({
        data: {
          actorEmail: req.userEmail ?? null,
          actorName: req.userEmail ?? null,
          action: "DATA_IMPORT",
          entity: "USER",
          entityId: u.id,
          details: `Usuário criado: ${u.name} (${u.email})`,
        },
      });

      return u;
    } catch (e: any) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    throw new BadRequestException("Já existe um usuário com este e-mail.");
  }
  throw e;
    }
  }

  @Patch(":id")
  async update(@Req() req: any, @Param("id") id: string, @Body() dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException("Usuário não encontrado.");

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.email !== undefined) data.email = dto.email.trim().toLowerCase();
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;

    if (data.name !== undefined && !data.name) throw new BadRequestException("Nome inválido.");
    if (data.email !== undefined && !data.email) throw new BadRequestException("E-mail inválido.");

    try {
      const u = await this.prisma.user.update({ where: { id }, data });

      await this.prisma.auditLog.create({
        data: {
          actorEmail: req.userEmail ?? null,
          actorName: req.userEmail ?? null,
          action: "DATA_IMPORT",
          entity: "USER",
          entityId: id,
          details: `Usuário atualizado: ${u.name} (${u.email})`,
        },
      });

      return u;
    } catch {
      throw new BadRequestException("E-mail já está em uso por outro usuário.");
    }
  }

  @Delete(":id")
  async remove(@Req() req: any, @Param("id") id: string) {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) throw new BadRequestException("Usuário não encontrado.");

    const active = await this.prisma.allocation.findFirst({
      where: { userId: id, endAt: null },
      select: { id: true },
    });
    if (active) throw new BadRequestException("Não é possível excluir: usuário possui alocação ativa.");

    const anyHistory = await this.prisma.allocation.findFirst({
      where: { userId: id },
      select: { id: true },
    });
    if (anyHistory) throw new BadRequestException("Não é possível excluir: usuário já utilizou armários e possui histórico.");

    await this.prisma.user.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        actorEmail: req.userEmail ?? null,
        actorName: req.userEmail ?? null,
        action: "DATA_IMPORT",
        entity: "USER",
        entityId: id,
        details: `Usuário removido: ${u.name} (${u.email})`,
      },
    });

    return { ok: true };
  }
}
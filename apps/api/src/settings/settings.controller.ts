import { Body, Controller, Get, Put, UseGuards, BadRequestException } from "@nestjs/common";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";

class UpdateSettingsDto {
  // regras
  @IsOptional() @IsInt() @Min(1) allocationMonths?: number;
  @IsOptional() @IsBoolean() allowRenewal?: boolean;
  @IsOptional() @IsInt() @Min(0) maxRenewals?: number;

  // notificações
  @IsOptional() @IsBoolean() notificationsEnabled?: boolean;
  @IsOptional() @IsString() notificationToEmails?: string; // CSV

  // segurança
  @IsOptional() @IsString() allowedManagerEmails?: string; // CSV
  @IsOptional() @IsBoolean() requireInstitutionalDomain?: boolean;

  // aparência
  @IsOptional() @IsString() theme?: string;
  @IsOptional() @IsString() locale?: string;
}

@Controller("settings")
@UseGuards(AuthGuard)
export class SettingsController {
  constructor(private prisma: PrismaService) {}

  private async ensureRow() {
    return this.prisma.systemSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });
  }

  @Get()
  async get() {
    return this.ensureRow();
  }

  @Put()
  async update(@Body() dto: UpdateSettingsDto) {
    await this.ensureRow();

    const data: any = {};

    if (dto.allocationMonths !== undefined) data.allocationMonths = dto.allocationMonths;
    if (dto.allowRenewal !== undefined) data.allowRenewal = dto.allowRenewal;
    if (dto.maxRenewals !== undefined) data.maxRenewals = dto.maxRenewals;

    if (dto.notificationsEnabled !== undefined) data.notificationsEnabled = dto.notificationsEnabled;
    if (dto.notificationToEmails !== undefined) {
      const v = dto.notificationToEmails.trim();
      data.notificationToEmails = v ? v : null;
    }

    if (dto.allowedManagerEmails !== undefined) {
      const v = dto.allowedManagerEmails.trim();
      if (!v) throw new BadRequestException("Informe os e-mails gestores autorizados (CSV).");
      data.allowedManagerEmails = v;
    }
    if (dto.requireInstitutionalDomain !== undefined) data.requireInstitutionalDomain = dto.requireInstitutionalDomain;

    if (dto.theme !== undefined) data.theme = dto.theme.trim() || "light";
    if (dto.locale !== undefined) data.locale = dto.locale.trim() || "pt-BR";

    return this.prisma.systemSettings.update({
      where: { id: "singleton" },
      data,
    });
  }
}
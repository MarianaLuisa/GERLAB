import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";

@Controller()
export class MeController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(AuthGuard)
  @Get("me")
  async me(@Req() req: any) {
    const email = req.userEmail as string;

    // cria usuário se não existir (simplificado)
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name: email.split("@")[0] },
    });

    return user;
  }
}
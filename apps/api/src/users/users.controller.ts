import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";

@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.user.findMany({ orderBy: { name: "asc" } });
  }
}
import { Module } from "@nestjs/common";
import { AllocationsController } from "./allocations.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [AllocationsController],
})
export class AllocationsModule {}
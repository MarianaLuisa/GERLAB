import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationsService } from "./notifications.service";
import { OutboxWorker } from "./outbox.worker";
import { EmailService } from "./email.service";

@Module({
  imports: [PrismaModule],
  providers: [NotificationsService, OutboxWorker, EmailService],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
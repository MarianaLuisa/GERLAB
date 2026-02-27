import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async notify(actorEmail: string, subject: string, message: string) {
    // MOCK: hoje só registra no console e auditoria
    console.log(`[NOTIFY] to=INTERNAL subject="${subject}" message="${message}"`);

    await this.prisma.auditLog.create({
      data: {
        actorEmail,
        actorName: actorEmail,
        action: "LOCKER_STATUS_CHANGED", // mantemos enum existente
        entity: "LOCKER",
        entityId: "notification",
        details: `NOTIFICAÇÃO: ${subject} | ${message}`,
      },
    });
  }
}
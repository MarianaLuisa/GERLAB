import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "./email.service";

function splitCsv(s?: string | null) {
  return String(s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

@Injectable()
export class OutboxWorker implements OnModuleInit {
  private readonly log = new Logger(OutboxWorker.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService
  ) {}

  onModuleInit() {
    this.log.log("OutboxWorker iniciado");

    this.flushOnce().catch(console.error);

    setInterval(() => {
      this.flushOnce().catch(console.error);
    }, 5000);
  }

  async flushOnce(limit = 25) {
    const items = await this.prisma.notificationOutbox.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    for (const it of items) {
      try {
        const recipients = splitCsv(it.toEmail);

        for (const email of recipients) {
          await this.email.send(
            email,
            it.subject,
            `<pre>${it.body}</pre>`
          );
        }

        await this.prisma.notificationOutbox.update({
          where: { id: it.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            error: null,
          },
        });

        await this.prisma.auditLog.create({
          data: {
            actorEmail: null,
            actorName: null,
            action: "NOTIFICATION_SENT",
            entity: "SYSTEM",
            entityId: it.id,
            details: `Email enviado para ${it.toEmail}`,
          },
        });

      } catch (err: any) {

        await this.prisma.notificationOutbox.update({
          where: { id: it.id },
          data: {
            status: "FAILED",
            error: String(err?.message ?? err),
          },
        });

      }
    }
  }
}
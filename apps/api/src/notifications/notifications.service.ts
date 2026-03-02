import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import nodemailer from "nodemailer";
import type { NotificationEvent, AuditEntity } from "@prisma/client";

type SendNotificationInput = {
  event: NotificationEvent;
  entity: AuditEntity;
  entityId?: string | null;

  toEmail: string;
  subject: string;
  body: string;

  actorEmail?: string | null;
  actorName?: string | null;
};

function envBool(v: any) {
  const s = String(v ?? "").toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes";
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  private smtpConfigured() {
    return (
      !!process.env.SMTP_HOST &&
      !!process.env.SMTP_PORT &&
      !!process.env.SMTP_USER &&
      !!process.env.SMTP_PASS &&
      !!process.env.SMTP_FROM
    );
  }

  private buildTransport() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT!),
      secure: envBool(process.env.SMTP_SECURE), // opcional
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });
  }

  async send(input: SendNotificationInput) {
    // settings singleton (cria se não existir)
    const settings = await this.prisma.systemSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });

    // sempre grava outbox
    const outbox = await this.prisma.notificationOutbox.create({
      data: {
        channel: "EMAIL",
        event: input.event,
        toEmail: input.toEmail.toLowerCase().trim(),
        subject: input.subject,
        body: input.body,
        status: "PENDING",
        entity: input.entity,
        entityId: input.entityId ?? null,
      },
    });

    // se notificações desligadas, mantém pendente
    if (!settings.notificationsEnabled) {
      return { ok: true, outboxId: outbox.id, status: "PENDING" as const };
    }

    // sem SMTP configurado: marca error (mas fica auditável)
    if (!this.smtpConfigured()) {
      await this.prisma.notificationOutbox.update({
        where: { id: outbox.id },
        data: {
          status: "ERROR",
          error: "SMTP não configurado (defina SMTP_HOST/PORT/USER/PASS/FROM).",
        },
      });
      return { ok: false, outboxId: outbox.id, status: "ERROR" as const };
    }

    // tenta enviar
    try {
      const transport = this.buildTransport();
      await transport.sendMail({
        from: process.env.SMTP_FROM!,
        to: outbox.toEmail,
        subject: outbox.subject,
        text: outbox.body,
      });

      await this.prisma.$transaction(async (tx) => {
        await tx.notificationOutbox.update({
          where: { id: outbox.id },
          data: { status: "SENT", sentAt: new Date(), error: null },
        });

        await tx.auditLog.create({
          data: {
            actorEmail: input.actorEmail ?? null,
            actorName: input.actorName ?? input.actorEmail ?? null,
            action: "NOTIFICATION_SENT",
            entity: input.entity,
            entityId: input.entityId ?? null,
            details: `Notificação enviada (${input.event}) para ${outbox.toEmail}: ${outbox.subject}`,
          },
        });
      });

      return { ok: true, outboxId: outbox.id, status: "SENT" as const };
    } catch (e: any) {
      await this.prisma.notificationOutbox.update({
        where: { id: outbox.id },
        data: { status: "ERROR", error: e?.message ?? "Falha ao enviar e-mail." },
      });
      return { ok: false, outboxId: outbox.id, status: "ERROR" as const };
    }
  }
}
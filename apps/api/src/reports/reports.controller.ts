import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import PDFDocument from "pdfkit";
import path from "path";

function toDateOrUndefined(iso?: string) {
  if (!iso) return undefined;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : d;
}

function actionLabel(a: string) {
  const map: Record<string, string> = {
    ALLOCATION_CREATED: "Saída de chave",
    ALLOCATION_ENDED: "Devolução de chave",
    ALLOCATION_RENEWED: "Renovação",
    ALLOCATION_CANCELLED: "Cancelamento",
    LOCKER_CREATED: "Criação de armário",
    LOCKER_STATUS_CHANGED: "Alteração de status",
    DATA_IMPORT: "Importação de dados",
    NOTIFICATION_SENT: "Notificação enviada",
  };
  return map[a] ?? a;
}

@Controller("reports")
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  @Get("audit.pdf")
  async auditPdf(
    @Res() res: Response,
    @Query("fromISO") fromISO?: string,
    @Query("toISO") toISO?: string
  ) {
    const from = toDateOrUndefined(fromISO);
    const to = toDateOrUndefined(toISO);

    const settings = await this.prisma.systemSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });

    const logs = await this.prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 2000,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="relatorio_auditoria.pdf"`);

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    doc.pipe(res);

    const logo = path.join(process.cwd(), "assets", "logo.png");

    try {
      doc.image(logo, 50, 45, { width: 60 });
    } catch {}

    doc
      .fontSize(20)
      .text("Sistema de Gestão de Armários", 120, 50);

    doc
      .fontSize(12)
      .fillColor("#555")
      .text("PROPPGI / UFCSPA", 120, 75);

    doc.moveDown(2);

    doc
      .fontSize(14)
      .fillColor("#000")
      .text("Relatório de Auditoria", { align: "center" });

    doc.moveDown(0.5);

    const now = new Date();

    doc
      .fontSize(9)
      .fillColor("#666")
      .text(`Gerado em: ${now.toLocaleString("pt-BR")}`, { align: "center" });

    const period =
      `Período: ${from ? from.toLocaleDateString("pt-BR") : "Início"} até ${
        to ? to.toLocaleDateString("pt-BR") : "Atual"
      }`;

    doc.text(period, { align: "center" });

    doc.moveDown(2);

    doc.fontSize(10).fillColor("#000");

    for (const l of logs) {
      const when = l.createdAt.toLocaleString("pt-BR");
      const who = l.actorName || l.actorEmail || "-";

      doc
        .font("Helvetica-Bold")
        .text(`${when}  •  ${who}`);

      doc
        .font("Helvetica")
        .fillColor("#444")
        .text(`${actionLabel(l.action)}  •  ${l.entity}${l.entityId ? ` (${l.entityId.slice(0,8)})` : ""}`);

      doc
        .fillColor("#000")
        .text(l.details);

      doc.moveDown(0.8);

      if (doc.y > 750) doc.addPage();
    }

    doc.moveDown(2);

    doc
      .fontSize(9)
      .fillColor("#666")
      .text(`Total de registros: ${logs.length}`);

    doc.end();
  }
}
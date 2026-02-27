import { Controller, Get, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import PDFDocument from "pdfkit";

@Controller("reports")
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  @Get("pdf")
  async auditPdf(
    @Req() req: any,
    @Res() res: Response,
    @Query("fromISO") fromISO?: string,
    @Query("toISO") toISO?: string
  ) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: fromISO ? new Date(fromISO) : undefined,
          lte: toISO ? new Date(toISO) : undefined,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500, // evita PDF gigante
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="auditoria.pdf"`);

    const doc = new PDFDocument({ margin: 48, size: "A4" });
    doc.pipe(res);

    // Cabeçalho
    doc.fontSize(18).text("PROPPGI / UFCSPA", { align: "left" });
    doc.moveDown(0.2);
    doc.fontSize(12).text("Relatório de Auditoria", { align: "left" });
    doc.moveDown(0.5);

    doc
      .fontSize(10)
      .fillColor("gray")
      .text(`Gerado por: ${req.userEmail}`, { align: "left" });
    doc.text(
      `Filtro: ${fromISO ? new Date(fromISO).toLocaleString() : "início"}  →  ${toISO ? new Date(toISO).toLocaleString() : "agora"}`,
      { align: "left" }
    );
    doc.moveDown(1);
    doc.fillColor("black");

    // Tabela simples
    const col1 = 48;   // Data/Hora
    const col2 = 170;  // Quem
    const col3 = 290;  // Ação
    const col4 = 380;  // Detalhes
    const lineH = 14;

    doc.fontSize(10).text("Data/Hora", col1);
    doc.text("Quem", col2);
    doc.text("Ação", col3);
    doc.text("Detalhes", col4);
    doc.moveDown(0.6);

    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor("#E6EAF0").stroke();
    doc.moveDown(0.6);

    doc.fontSize(9).strokeColor("#E6EAF0");

    for (const l of logs) {
      // quebra de página
      if (doc.y > 780) doc.addPage();

      const when = new Date(l.createdAt).toLocaleString();
      doc.fillColor("#111827").text(when, col1, doc.y, { width: 110 });
      doc.fillColor("#111827").text(l.actorName ?? "-", col2, doc.y, { width: 110 });
      doc.fillColor("#111827").text(l.action, col3, doc.y, { width: 80 });
      doc.fillColor("#4B5563").text(l.details, col4, doc.y, { width: 160 });

      doc.moveDown(0.9);
      doc.moveTo(48, doc.y).lineTo(547, doc.y).stroke();
      doc.moveDown(0.2);
    }

    doc.end();
  }
}
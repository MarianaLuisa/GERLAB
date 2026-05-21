import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';

type AuditReportRow = {
  id: string;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string;
  createdAt: Date;
};

function toDateOrUndefined(iso?: string) {
  if (!iso) return undefined;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function fmtDateTime(date: Date) {
  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function fmtPeriodDate(date?: Date) {
  return date
    ? date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : null;
}

function periodLabel(from?: Date, to?: Date) {
  return `${fmtPeriodDate(from) ?? 'Início dos registros'} até ${fmtPeriodDate(to) ?? 'agora'}`;
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    ALLOCATION_CREATED: 'Alocação registrada',
    ALLOCATION_ENDED: 'Devolução registrada',
    ALLOCATION_RENEWED: 'Alocação renovada',
    ALLOCATION_CANCELLED: 'Alocação cancelada',
    LOCKER_CREATED: 'Armário criado',
    LOCKER_STATUS_CHANGED: 'Status do armário alterado',
    DATA_IMPORT: 'Importação de dados',
    NOTIFICATION_SENT: 'Notificação enviada',
  };
  return map[action] ?? action;
}

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? '');
  const escaped = text.replace(/"/g, '""');
  return /[;\n\r"]/.test(escaped) ? `"${escaped}"` : escaped;
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  private async getAuditRows(fromISO?: string, toISO?: string) {
    const from = toDateOrUndefined(fromISO);
    const to = toDateOrUndefined(toISO);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 2000,
    });

    return { from, to, logs: logs as AuditReportRow[] };
  }

  @Get('audit.csv')
  async auditCsv(
    @Res() res: Response,
    @Query('fromISO') fromISO?: string,
    @Query('toISO') toISO?: string,
  ) {
    const { logs } = await this.getAuditRows(fromISO, toISO);

    const header = ['Data/Hora', 'Ação', 'Entidade', 'Identificador', 'Detalhes'];
    const rows = logs.map((log) => [
      fmtDateTime(log.createdAt),
      actionLabel(log.action),
      log.entity,
      log.entityId ?? '',
      log.details,
    ]);

    const csv = [
      header.map(csvEscape).join(';'),
      ...rows.map((row) => row.map(csvEscape).join(';')),
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="auditoria-gerlab.csv"',
    );
    res.send(`\uFEFF${csv}`);
  }

  @Get('audit.pdf')
  async auditPdf(
    @Res() res: Response,
    @Query('fromISO') fromISO?: string,
    @Query('toISO') toISO?: string,
  ) {
    const { from, to, logs } = await this.getAuditRows(fromISO, toISO);
    const issuedAt = new Date();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="relatorio-auditoria-gerlab.pdf"',
    );

    const doc = new PDFDocument({
      margin: 45,
      size: 'A4',
      bufferPages: true,
      info: {
        Title: 'Relatório de Auditoria — GERLAB',
        Author: 'PROPPGI/UFCSPA',
        Subject: 'Auditoria do Sistema GERLAB',
      },
    });

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 45;
    const contentWidth = pageWidth - margin * 2;
    const tableTop = 205;
    const footerTop = pageHeight - 38;
    const columns = [
      { label: 'Data/Hora', x: margin, width: 82 },
      { label: 'Ação', x: margin + 86, width: 112 },
      { label: 'Entidade', x: margin + 202, width: 72 },
      { label: 'Detalhes', x: margin + 278, width: contentWidth - 278 },
    ];

    const drawHeader = () => {
      doc
        .rect(0, 0, pageWidth, 96)
        .fill('#F3F6FA')
        .fillColor('#102A43')
        .font('Helvetica-Bold')
        .fontSize(17)
        .text('Relatório de Auditoria — GERLAB', margin, 38, {
          width: contentWidth,
        });

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#526579')
        .text('Sistema de Gestão de Acessos aos Armários — PROPPGI/UFCSPA', margin, 62, {
          width: contentWidth,
        });
    };

    const drawMetadata = () => {
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#102A43')
        .text('Período', margin, 118)
        .text('Emissão', margin + 220, 118)
        .text('Total', margin + 390, 118);

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#526579')
        .text(periodLabel(from, to), margin, 134, { width: 200 })
        .text(fmtDateTime(issuedAt), margin + 220, 134, { width: 150 })
        .text(String(logs.length), margin + 390, 134, { width: 90 });
    };

    const drawTableHeader = (y: number) => {
      doc.rect(margin, y, contentWidth, 22).fill('#E8EDF3');
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#344054');
      for (const col of columns) {
        doc.text(col.label, col.x + 5, y + 7, { width: col.width - 10 });
      }
      return y + 22;
    };

    const drawFooter = (pageNumber: number, pageCount: number) => {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#7A8798')
        .text('GERLAB — PROPPGI/UFCSPA', margin, footerTop, {
          width: contentWidth / 2,
        })
        .text(`Página ${pageNumber} de ${pageCount}`, margin, footerTop, {
          width: contentWidth,
          align: 'right',
        });
    };

    drawHeader();
    drawMetadata();

    let y = drawTableHeader(tableTop);

    if (logs.length === 0) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#60738A')
        .text('Nenhum registro encontrado para o período selecionado.', margin, y + 18);
    }

    logs.forEach((log, index) => {
      const detail = truncateText(log.details, 620);
      const values = [
        fmtDateTime(log.createdAt),
        actionLabel(log.action),
        log.entity,
        detail,
      ];

      const heights = values.map((value, i) =>
        doc.heightOfString(value, {
          width: columns[i].width - 10,
          lineGap: 1,
        }),
      );
      const rowHeight = Math.max(28, Math.max(...heights) + 14);

      if (y + rowHeight > footerTop - 12) {
        doc.addPage();
        drawHeader();
        y = drawTableHeader(118);
      }

      doc
        .rect(margin, y, contentWidth, rowHeight)
        .fill(index % 2 === 0 ? '#FFFFFF' : '#FAFBFC');
      doc
        .moveTo(margin, y + rowHeight)
        .lineTo(margin + contentWidth, y + rowHeight)
        .strokeColor('#E8EDF3')
        .lineWidth(0.5)
        .stroke();

      doc.font('Helvetica').fontSize(8.5).fillColor('#344054');
      values.forEach((value, i) => {
        doc.text(value, columns[i].x + 5, y + 8, {
          width: columns[i].width - 10,
          lineGap: 1,
        });
      });

      y += rowHeight;
    });

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      drawFooter(i + 1, range.count);
    }

    doc.end();
  }
}

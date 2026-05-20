import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Filter, X } from "lucide-react";
import { api } from "../services/api";
import type { AuditLog } from "../types/models";
import {
  Alert,
  Button,
  CountBadge,
  DataToolbar,
  EmptyCell,
  Field,
  PageHeader,
  TableShell,
  TextInput,
  tableClass,
  tdClass,
  thClass,
  theadClass,
} from "../components/ui";

type AuditRow = AuditLog & {
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function toISOFromLocal(input: string): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(+d)) return null;
  return d.toISOString();
}

function fmt(d: string) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return d;
  }
}

function safeActor(l: AuditRow) {
  return l.actorUserName ?? l.actorName ?? l.actorEmail ?? "-";
}

function actionPt(action: string) {
  const map: Record<string, string> = {
    LOCKER_CREATED: "Armário criado",
    LOCKER_STATUS_CHANGED: "Status do armário alterado",
    ALLOCATION_CREATED: "Alocação registrada",
    ALLOCATION_ENDED: "Devolução registrada",
    ALLOCATION_CANCELLED: "Alocação cancelada",
    ALLOCATION_RENEWED: "Alocação renovada",
    NOTIFICATION_SENT: "Notificação enviada",
    DATA_IMPORT: "Importação de dados",
  };
  return map[action] ?? action;
}

export function Reports() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const fromISO = toISOFromLocal(from) ?? undefined;
      const toISO = toISOFromLocal(to) ?? undefined;
      const data = await api.listAudit({ fromISO, toISO });
      setLogs(data);
      setPage(1);
    } catch (e: unknown) {
      setErr(errorMessage(e, "Erro ao carregar auditoria."));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const fromT = from ? new Date(from).getTime() : -Infinity;
    const toT = to ? new Date(to).getTime() : Infinity;
    return logs.filter((l) => {
      const t = new Date(l.createdAt).getTime();
      return t >= fromT && t <= toT;
    });
  }, [logs, from, to]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered.length]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  async function exportCSV() {
    const blob = await api.exportCsv({
      fromISO: from ? new Date(from).toISOString() : undefined,
      toISO: to ? new Date(to).toISOString() : undefined,
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "auditoria.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    const blob = await api.exportPdf({
      fromISO: from ? new Date(from).toISOString() : undefined,
      toISO: to ? new Date(to).toISOString() : undefined,
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "auditoria.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearFilters() {
    setFrom("");
    setTo("");
    setTimeout(() => load(), 0);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios e Auditoria"
        description="Logs de operações com filtros por período e exportação CSV/PDF."
      />

      {err ? <Alert>{err}</Alert> : null}

      <DataToolbar meta={<CountBadge>{loading ? "Carregando..." : `${filtered.length} registros`}</CountBadge>}>
        <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="De">
              <TextInput type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="Até">
              <TextInput type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={load}>
              <Filter size={15} />
              Aplicar
            </Button>
            <Button onClick={clearFilters}>
              <X size={15} />
              Limpar
            </Button>
            <Button variant="primary" onClick={exportCSV} disabled={filtered.length === 0}>
              <Download size={15} />
              CSV
            </Button>
            <Button onClick={() => exportPDF().catch((e) => alert(e.message))} disabled={filtered.length === 0}>
              <FileText size={15} />
              PDF
            </Button>
          </div>
        </div>
      </DataToolbar>

      <TableShell>
        <table className={tableClass}>
          <thead className={theadClass}>
            <tr>
              <th className={thClass}>Data/Hora</th>
              <th className={thClass}>Quem</th>
              <th className={thClass}>Ação</th>
              <th className={thClass}>Entidade</th>
              <th className={thClass}>Detalhes</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <EmptyCell colSpan={5}>Carregando...</EmptyCell>
            ) : pageItems.length === 0 ? (
              <EmptyCell colSpan={5}>Sem registros no intervalo.</EmptyCell>
            ) : (
              pageItems.map((l) => {
                const row = l as AuditRow;
                return (
                  <tr key={l.id} className="align-top transition hover:bg-[#FAFCFF]">
                    <td className={`${tdClass} whitespace-nowrap text-[#60738A]`}>{fmt(l.createdAt)}</td>
                    <td className={`${tdClass} font-semibold text-[#102A43]`}>{safeActor(row)}</td>
                    <td className={`${tdClass} text-[#40516A]`}>{actionPt(row.action)}</td>
                    <td className={`${tdClass} whitespace-nowrap text-[#60738A]`}>
                      {row.entity}
                      {row.entityId ? <span className="text-xs text-[#8AA0B8]"> • {String(row.entityId).slice(0, 8)}...</span> : null}
                    </td>
                    <td className={`${tdClass} max-w-lg text-[#60738A]`}>{row.details}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {!loading && filtered.length > 0 ? (
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-medium text-[#60738A]">
              Página {page} de {totalPages}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setPage(1)} disabled={page === 1} className="min-h-8 px-3 py-1 text-xs">
                Início
              </Button>
              <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="min-h-8 px-3 py-1 text-xs">
                Anterior
              </Button>
              <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="min-h-8 px-3 py-1 text-xs">
                Próxima
              </Button>
              <Button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="min-h-8 px-3 py-1 text-xs">
                Fim
              </Button>
            </div>
          </div>
        ) : null}
      </TableShell>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import type { AuditLog } from "../types/models";

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

function safeActor(l: any) {
  return l.actorUserName ?? l.actorName ?? l.actorEmail ?? "-";
}

function actionPt(action: AuditLog["action"]) {
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

  // paginação
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
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar auditoria.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fallback: se algum log vier fora do range, ainda filtramos no front
  const filtered = useMemo(() => {
    const fromT = from ? new Date(from).getTime() : -Infinity;
    const toT = to ? new Date(to).getTime() : Infinity;
    return logs.filter((l: any) => {
      const t = new Date(l.createdAt).getTime();
      return t >= fromT && t <= toT;
    });
  }, [logs, from, to]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filtered.length / pageSize));
  }, [filtered.length]);

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
    // recarrega “tudo” (sem range)
    setTimeout(() => load(), 0);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#003366]">Relatórios e Auditoria</h1>
        <p className="text-sm text-gray-600 mt-1">Logs de operações + exportação CSV/PDF</p>
      </div>

      {err ? (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3">
          {err}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_8px_20px_rgba(17,24,39,0.06)] p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="space-y-1">
              <label className="text-xs text-gray-600">De</label>
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-600">Até</label>
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={load}
              className="border border-[#E6EAF0] px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-[#F5F7FA]"
            >
              Aplicar filtro
            </button>

            <button
              onClick={clearFilters}
              className="border border-[#E6EAF0] px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-[#F5F7FA]"
            >
              Limpar
            </button>

            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="bg-[#003366] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-95"
            >
              Exportar CSV
            </button>

            <button
              onClick={() => exportPDF().catch((e) => alert(e.message))}
              disabled={filtered.length === 0}
              className="border border-[#E6EAF0] disabled:opacity-50 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-[#F5F7FA]"
            >
              Exportar PDF
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          {loading ? "Carregando..." : `${filtered.length} registros no intervalo`}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_8px_20px_rgba(17,24,39,0.06)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Data/Hora</th>
              <th className="text-left px-4 py-3">Quem</th>
              <th className="text-left px-4 py-3">Ação</th>
              <th className="text-left px-4 py-3">Entidade</th>
              <th className="text-left px-4 py-3">Detalhes</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={5}>
                  Carregando...
                </td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={5}>
                  Sem registros no intervalo.
                </td>
              </tr>
            ) : (
              pageItems.map((l: any) => (
                <tr key={l.id} className="border-t border-[#E6EAF0] align-top">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(l.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{safeActor(l)}</td>
                  <td className="px-4 py-3 text-gray-600">{actionPt(l.action)}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {l.entity}
                    {l.entityId ? <span className="text-xs text-gray-400"> • {String(l.entityId).slice(0, 8)}…</span> : null}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginação */}
        {!loading && filtered.length > 0 ? (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E6EAF0]">
            <div className="text-xs text-gray-500">
              Página {page} de {totalPages}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="border border-[#E6EAF0] disabled:opacity-50 rounded-xl px-3 py-1 text-xs font-medium text-gray-700 hover:bg-[#F5F7FA]"
              >
                Início
              </button>

              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border border-[#E6EAF0] disabled:opacity-50 rounded-xl px-3 py-1 text-xs font-medium text-gray-700 hover:bg-[#F5F7FA]"
              >
                Anterior
              </button>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border border-[#E6EAF0] disabled:opacity-50 rounded-xl px-3 py-1 text-xs font-medium text-gray-700 hover:bg-[#F5F7FA]"
              >
                Próxima
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="border border-[#E6EAF0] disabled:opacity-50 rounded-xl px-3 py-1 text-xs font-medium text-gray-700 hover:bg-[#F5F7FA]"
              >
                Fim
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
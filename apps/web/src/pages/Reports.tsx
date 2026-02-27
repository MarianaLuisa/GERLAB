import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { api } from "../services/api";
import type { AuditLog } from "../types/models";
import { getSessionEmail } from "../services/auth";

export function Reports() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    api.listAudit().then(setLogs);
  }, []);

  const filtered = useMemo(() => {
    const fromT = from ? new Date(from).getTime() : -Infinity;
    const toT = to ? new Date(to).getTime() : Infinity;
    return logs.filter((l) => {
      const t = new Date(l.createdAt).getTime();
      return t >= fromT && t <= toT;
    });
  }, [logs, from, to]);

  function exportCSV() {
    const csv = Papa.unparse(
      filtered.map((l) => ({
        when: l.createdAt,
        actor: l.actorUserName,
        action: l.action,
        entity: l.entity,
        details: l.details,
      }))
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "auditoria.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    const base = import.meta.env.VITE_API_URL as string;
    const email = getSessionEmail();

    const qs = new URLSearchParams();
    if (from) qs.set("fromISO", new Date(from).toISOString());
    if (to) qs.set("toISO", new Date(to).toISOString());

    const res = await fetch(`${base}/reports/pdf?${qs.toString()}`, {
        headers: {
        ...(email ? { "x-user-email": email } : {}),
        },
    });

    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Erro ao gerar PDF");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "auditoria.pdf";
    a.click();
    URL.revokeObjectURL(url);
    }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#003366]">Relatórios e Auditoria</h1>
        <p className="text-sm text-gray-600 mt-1">Logs de operações e exportação</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_8px_20px_rgba(17,24,39,0.06)] p-4 flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
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

        <div className="flex gap-3">
          <button onClick={exportCSV} className="bg-[#003366] text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-95">
            Exportar CSV
          </button>
          <button
            onClick={() => exportPDF().catch((e) => alert(e.message))}
            className="border border-[#E6EAF0] px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-[#F5F7FA]"
            >
            Exportar PDF
            </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_8px_20px_rgba(17,24,39,0.06)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Data/Hora</th>
              <th className="text-left px-4 py-3">Quem</th>
              <th className="text-left px-4 py-3">Ação</th>
              <th className="text-left px-4 py-3">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-t border-[#E6EAF0]">
                <td className="px-4 py-3 text-gray-600">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{l.actorUserName}</td>
                <td className="px-4 py-3 text-gray-600">{l.action}</td>
                <td className="px-4 py-3 text-gray-600">{l.details}</td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr><td className="px-4 py-6 text-gray-500" colSpan={4}>Sem registros no intervalo.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import type { Allocation, Locker } from "../types/models";

function statusLabel(s: Locker["status"]) {
  if (s === "FREE") return "Livre";
  if (s === "OCCUPIED") return "Ocupado";
  return "Manutenção";
}

export function Dashboard() {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [activeAllocations, setActiveAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const [ls, act] = await Promise.all([
        api.listLockers(),
        api.listActiveAllocations(),
      ]);
      setLockers(ls);
      setActiveAllocations(act);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  refresh();
  const t = window.setInterval(refresh, 10000); // 10s
  return () => window.clearInterval(t);
}, []);

  const stats = useMemo(() => {
    const total = lockers.length;
    const free = lockers.filter((l) => l.status === "FREE").length;
    const occupied = lockers.filter((l) => l.status === "OCCUPIED").length;
    const maintenance = lockers.filter((l) => l.status === "MAINTENANCE").length;
    return { total, free, occupied, maintenance };
  }, [lockers]);

  const lastAllocations = useMemo(() => {
    return [...activeAllocations]
      .sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt))
      .slice(0, 8);
  }, [activeAllocations]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#003366]">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Visão geral de ocupação e alocações ativas.
          </p>
        </div>

        <button
          onClick={refresh}
          className="border border-[#E6EAF0] rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-[#F5F7FA]"
        >
          Atualizar
        </button>
      </div>

      {err ? (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3">
          {err}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total de chaves" value={loading ? "…" : String(stats.total)} />
        <Card title="Livres" value={loading ? "…" : String(stats.free)} />
        <Card title="Ocupadas" value={loading ? "…" : String(stats.occupied)} />
        <Card title="Em manutenção" value={loading ? "…" : String(stats.maintenance)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E6EAF0] rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Resumo rápido</h2>

          <div className="space-y-3">
            {(["FREE", "OCCUPIED", "MAINTENANCE"] as Locker["status"][]).map((s) => {
              const count = lockers.filter((l) => l.status === s).length;
              const total = lockers.length || 1;
              const pct = Math.round((count / total) * 100);

              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{statusLabel(s)}</span>
                    <span className="text-gray-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-[#F5F7FA] rounded-full overflow-hidden border border-[#E6EAF0]">
                    <div className="h-2 bg-[#003366]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-[#E6EAF0] rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">
            Alocações ativas (agora)
          </h2>

          {loading ? (
            <div className="text-sm text-gray-500">Carregando…</div>
          ) : lastAllocations.length === 0 ? (
            <div className="text-sm text-gray-500">
              Nenhuma alocação ativa no momento.
            </div>
          ) : (
            <div className="divide-y divide-[#E6EAF0]">
              {lastAllocations.map((a) => (
                <div key={a.id} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{a.userName}</div>
                    <div className="text-xs text-gray-500">{a.lockerLabel}</div>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(a.startAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border border-[#E6EAF0] rounded-2xl p-4 shadow-[0_8px_20px_rgba(17,24,39,0.04)]">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-[#003366]">{value}</div>
    </div>
  );
}
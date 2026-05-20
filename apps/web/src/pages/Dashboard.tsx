import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "../services/api";
import type { Allocation, Locker } from "../types/models";
import { Alert, Button, CountBadge, MetricCard, PageHeader, Panel, SectionHeader } from "../components/ui";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

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
    } catch (e: unknown) {
      setErr(errorMessage(e, "Erro ao carregar dashboard."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = window.setInterval(refresh, 10000);
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
      <PageHeader
        title="Dashboard"
        description="Visão executiva de ocupação e alocações ativas."
        actions={
          <Button onClick={refresh}>
            <RefreshCw size={15} />
            Atualizar
          </Button>
        }
      />

      {err ? <Alert>{err}</Alert> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total de chaves" value={loading ? "..." : stats.total} accent="slate" />
        <MetricCard title="Livres" value={loading ? "..." : stats.free} accent="green" />
        <MetricCard title="Ocupadas" value={loading ? "..." : stats.occupied} accent="blue" />
        <MetricCard title="Em manutenção" value={loading ? "..." : stats.maintenance} accent="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel>
          <SectionHeader
            title="Resumo de ocupação"
            description="Distribuição atual por situação."
            actions={<CountBadge>{lockers.length} armários</CountBadge>}
          />

          <div className="space-y-4 p-5">
            {(["FREE", "OCCUPIED", "MAINTENANCE"] as Locker["status"][]).map((s) => {
              const count = lockers.filter((l) => l.status === s).length;
              const total = lockers.length || 1;
              const pct = Math.round((count / total) * 100);

              return (
                <div key={s} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[#344054]">{statusLabel(s)}</span>
                    <span className="text-[#60738A]">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-sm bg-[#E8EDF3]">
                    <div className="h-full bg-[#0F62A8]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <SectionHeader
            title="Alocações ativas"
            description="Registros mais recentes em aberto."
            actions={<span className="text-xs font-medium text-[#60738A]">Atualização automática</span>}
          />

          {loading ? (
            <div className="p-5 text-sm text-[#60738A]">Carregando...</div>
          ) : lastAllocations.length === 0 ? (
            <div className="m-5 rounded border border-dashed border-[#C8D4E1] p-5 text-sm text-[#60738A]">
              Nenhuma alocação ativa no momento.
            </div>
          ) : (
            <div className="divide-y divide-[#E8EDF3]">
              {lastAllocations.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#102A43]">{a.userName}</div>
                    <div className="mt-1 truncate text-xs text-[#60738A]">{a.lockerLabel}</div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-[#60738A]">
                    {new Date(a.startAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { api } from "../services/api";
import type { Allocation, Locker } from "../types/models";
import { Alert, Button, EmptyCell, tableClass, tdClass, thClass, theadClass } from "./ui";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type Props = {
  open: boolean;
  onClose: () => void;
  locker: Locker | null;
};

function lockerLabel(l: Locker) {
  const floor = `${l.floor}º`;
  const key = `Chave ${l.keyNumber}`;
  const lab = l.lab ? ` • ${l.lab}` : "";
  return `${floor} • ${key}${lab}`;
}

function fmt(dt?: string | null) {
  if (!dt) return "-";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export function HistoryModal({ open, onClose, locker }: Props) {
  const [items, setItems] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !locker) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await api.listHistoryByLocker(locker.id);
        if (!cancelled) setItems(data);
      } catch (e: unknown) {
        if (!cancelled) setErr(errorMessage(e, "Erro ao carregar histórico."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, locker]);

  const title = useMemo(() => {
    if (!locker) return "Histórico do armário";
    return `Histórico • ${lockerLabel(locker)}`;
  }, [locker]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        {err ? <Alert>{err}</Alert> : null}

        <div className="rounded border border-[#D9E2EC] bg-[#F7FAFD] p-3 text-[13px] leading-5">
          <div className="text-[12px] text-[#667085]">Registros encontrados</div>
          <div className="mt-1 text-lg font-semibold leading-6 text-[#0A376A]">
            {loading ? "Carregando..." : items.length}
          </div>
        </div>

        <div className="app-scrollbar overflow-x-auto rounded border border-[#D9E2EC]">
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Usuário</th>
                <th className={thClass}>Início</th>
                <th className={thClass}>Devolução prevista</th>
                <th className={thClass}>Encerrado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <EmptyCell colSpan={4}>Carregando histórico...</EmptyCell>
              ) : items.length === 0 ? (
                <EmptyCell colSpan={4}>Nenhum registro para este armário.</EmptyCell>
              ) : (
                items.map((a) => (
                  <tr key={a.id} className="transition hover:bg-[#FAFCFF]">
                    <td className={`${tdClass} font-semibold text-[#1D2939]`}>{a.userName}</td>
                    <td className={`${tdClass} text-[#667085]`}>{fmt(a.startAt)}</td>
                    <td className={`${tdClass} text-[#667085]`}>{a.dueAt ? new Date(a.dueAt).toLocaleString() : "-"}</td>
                    <td className={`${tdClass} text-[#667085]`}>{fmt(a.endAt ?? null)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Button onClick={onClose} className="w-full">
          Fechar
        </Button>
      </div>
    </Modal>
  );
}

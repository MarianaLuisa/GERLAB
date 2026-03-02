import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { api } from "../services/api";
import type { Allocation, Locker } from "../types/models";

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
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Erro ao carregar histórico.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, locker?.id]);

  const title = useMemo(() => {
    if (!locker) return "Histórico do Armário";
    return `Histórico • ${lockerLabel(locker)}`;
  }, [locker]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {err ? (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3 mb-3">
          {err}
        </div>
      ) : null}

      <div className="bg-[#F5F7FA] border border-[#E6EAF0] rounded-xl p-3 text-sm mb-4">
        <div className="text-gray-600">Registros encontrados</div>
        <div className="font-semibold text-[#003366]">{loading ? "Carregando..." : items.length}</div>
      </div>

      <div className="border border-[#E6EAF0] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] text-gray-600">
            <tr>
              <th className="text-left px-3 py-2">Usuário</th>
              <th className="text-left px-3 py-2">Início</th>
              <th className="text-left px-3 py-2">Devolução prevista</th>
              <th className="text-left px-3 py-2">Encerrado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={4}>
                  Carregando histórico...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={4}>
                  Nenhum registro para este armário.
                </td>
              </tr>
            ) : (
              items.map((a) => (
                <tr key={a.id} className="border-t border-[#E6EAF0]">
                  <td className="px-3 py-2 font-medium text-gray-900">{a.userName}</td>
                  <td className="px-3 py-2 text-gray-600">{fmt(a.startAt)}</td>
                  <td className="px-3 py-2 text-gray-600">{a.dueAt ? new Date(a.dueAt).toLocaleString() : "-"}</td>
                  <td className="px-3 py-2 text-gray-600">{fmt(a.endAt ?? null)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={onClose}
        className="mt-4 w-full border border-[#E6EAF0] rounded-xl py-2 text-sm font-medium text-gray-700 hover:bg-[#F5F7FA]"
      >
        Fechar
      </button>
    </Modal>
  );
}
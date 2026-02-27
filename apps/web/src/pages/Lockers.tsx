import { useEffect, useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";
import { HistoryModal } from "../components/HistoryModal";
import { api } from "../services/api";
import type { Locker, LockerStatus, User } from "../types/models";

function StatusBadge({ status }: { status: LockerStatus }) {
  const map: Record<LockerStatus, string> = {
    FREE: "bg-[#EAF7EF] text-[#1E7A3A]",
    OCCUPIED: "bg-[#EAF1FF] text-[#1E4FBF]",
    MAINTENANCE: "bg-[#FFF5E6] text-[#A16207]",
  };
  const label: Record<LockerStatus, string> = {
    FREE: "Livre",
    OCCUPIED: "Ocupado",
    MAINTENANCE: "Manutenção",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border border-[#E6EAF0] ${map[status]}`}>
      {label[status]}
    </span>
  );
}

function lockerLabel(l: Locker) {
  const floor = `${l.floor}º`;
  const key = `Chave ${l.keyNumber}`;
  const lab = l.lab ? `• ${l.lab}` : "";
  return `${floor} • ${key} ${lab}`.trim();
}

export function Lockers() {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LockerStatus | "ALL">("ALL");

  const [toast, setToast] = useState<string | null>(null);

  // modal alocação
  const [openAlloc, setOpenAlloc] = useState(false);
  const [allocLockerId, setAllocLockerId] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [dueAt, setDueAt] = useState<string>("");
  const [allocErr, setAllocErr] = useState<string | null>(null);

  // histórico
  const [openHistory, setOpenHistory] = useState(false);
  const [historyLockerId, setHistoryLockerId] = useState<string | null>(null);

  const historyLocker = useMemo(
    () => lockers.find((l) => l.id === historyLockerId) ?? null,
    [lockers, historyLockerId]
  );

  function openHistoryFor(lockerId: string) {
    setHistoryLockerId(lockerId);
    setOpenHistory(true);
  }

  async function refresh() {
    setLoading(true);
    try {
      const [ls, us] = await Promise.all([api.listLockers(), api.listUsers()]);
      setLockers(ls);
      setUsers(us);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lockers.filter((l) => {
      const label = lockerLabel(l).toLowerCase();
      const matchesSearch = !q || label.includes(q) || String(l.floor).includes(q) || String(l.keyNumber).includes(q);
      const matchesFilter = filter === "ALL" || l.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [lockers, search, filter]);

  // helpers
  const allocLocker = useMemo(() => lockers.find((l) => l.id === allocLockerId) ?? null, [lockers, allocLockerId]);

  const userResults = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, userQuery]);

  function openAllocationFor(lockerId: string) {
    setAllocErr(null);
    setAllocLockerId(lockerId);
    setUserQuery("");
    setSelectedUserId("");

    // sugestão: devolução em 7 dias
    const d = new Date(Date.now() + 7 * 86400000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
    setDueAt(local);

    setOpenAlloc(true);
  }

  async function confirmAllocation() {
    setAllocErr(null);
    if (!allocLockerId) return;
    if (!selectedUserId) return setAllocErr("Selecione um usuário.");
    if (!dueAt) return setAllocErr("Informe a data/hora de devolução prevista.");

    try {
      await api.createAllocation({
        userId: selectedUserId,
        lockerId: allocLockerId,
        dueAtISO: new Date(dueAt).toISOString(),
      });
      setOpenAlloc(false);
      setToast("Alocação registrada (saída da chave registrada).");
      await refresh();
    } catch (e: any) {
      setAllocErr(e?.message ?? "Erro ao alocar.");
    }
  }

  async function handleReturn(locker: Locker) {
    try {
      const actives = await api.listActiveAllocations();
      const active = actives.find((a) => a.lockerId === locker.id);
      if (!active) throw new Error("Não há alocação ativa para este armário.");
      await api.endAllocation(active.id);
      setToast("Devolução registrada (check-in).");
      await refresh();
    } catch (e: any) {
      setToast(e?.message ?? "Erro ao registrar devolução.");
    }
  }

  async function setMaintenance(locker: Locker) {
    try {
      await api.updateLockerStatus(locker.id, "MAINTENANCE");
      setToast("Armário marcado como manutenção.");
      await refresh();
    } catch (e: any) {
      setToast(e?.message ?? "Erro ao alterar status.");
    }
  }

  async function setFree(locker: Locker) {
    try {
      await api.updateLockerStatus(locker.id, "FREE");
      setToast("Armário marcado como livre.");
      await refresh();
    } catch (e: any) {
      setToast(e?.message ?? "Erro ao alterar status.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#003366]">Gestão de Armários</h1>
        <p className="text-sm text-gray-600 mt-1">Lista, filtros e operações rápidas</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_8px_20px_rgba(17,24,39,0.06)] p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex gap-3 flex-col sm:flex-row">
          <input
            type="text"
            placeholder="Buscar por andar, chave, lab... (ex: 8, 21, 803)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
          >
            <option value="ALL">Todos</option>
            <option value="FREE">Livre</option>
            <option value="OCCUPIED">Ocupado</option>
            <option value="MAINTENANCE">Manutenção</option>
          </select>
        </div>

        <button
          onClick={() => refresh()}
          className="border border-[#E6EAF0] rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-[#F5F7FA]"
        >
          Atualizar
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_8px_20px_rgba(17,24,39,0.06)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Armário</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Usuário Atual</th>
              <th className="text-left px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={4}>
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={4}>
                  Nenhum armário encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((locker) => (
                <tr key={locker.id} className="border-t border-[#E6EAF0]">
                  <td className="px-4 py-3 font-medium text-gray-900">{lockerLabel(locker)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={locker.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{locker.currentUserName ?? "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      {locker.status === "FREE" ? (
                        <button
                          onClick={() => openAllocationFor(locker.id)}
                          className="text-[#003366] text-xs font-medium hover:underline"
                        >
                          Alocar
                        </button>
                      ) : null}

                      {locker.status === "OCCUPIED" ? (
                        <button
                          onClick={() => handleReturn(locker)}
                          className="text-[#003366] text-xs font-medium hover:underline"
                        >
                          Registrar Devolução
                        </button>
                      ) : null}

                      {locker.status !== "MAINTENANCE" ? (
                        <button
                          onClick={() => setMaintenance(locker)}
                          className="text-[#A16207] text-xs font-medium hover:underline"
                        >
                          Marcar Manutenção
                        </button>
                      ) : (
                        <button onClick={() => setFree(locker)} className="text-[#1E7A3A] text-xs font-medium hover:underline">
                          Marcar Livre
                        </button>
                      )}

                      <button
                        onClick={() => openHistoryFor(locker.id)}
                        className="text-gray-600 text-xs font-medium hover:underline"
                      >
                        Histórico
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Alocação */}
      <Modal open={openAlloc} onClose={() => setOpenAlloc(false)} title="Confirmar Alocação e Registrar Saída da Chave">
        <div className="space-y-4">
          {allocErr ? <div className="text-sm text-red-600">{allocErr}</div> : null}

          <div className="bg-[#F5F7FA] border border-[#E6EAF0] rounded-xl p-3 text-sm">
            <div className="text-gray-600">Armário selecionado</div>
            <div className="font-semibold text-[#003366]">{allocLocker ? lockerLabel(allocLocker) : "-"}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">Buscar usuário (nome/e-mail)</label>
            <input
              type="text"
              placeholder="Digite para buscar..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">Selecionar usuário</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
            >
              <option value="">— Selecione —</option>
              {userResults.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">Data/Hora de devolução prevista</label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          <button onClick={confirmAllocation} className="w-full bg-[#003366] text-white py-2 rounded-xl font-medium hover:opacity-95">
            Confirmar Alocação e Registrar Saída da Chave
          </button>
        </div>
      </Modal>

      <HistoryModal open={openHistory} onClose={() => setOpenHistory(false)} locker={historyLocker} />

      {toast ? <Toast>{toast}</Toast> : null}
    </div>
  );
}
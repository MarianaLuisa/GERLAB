import { useEffect, useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";
import { HistoryModal } from "../components/HistoryModal";
import { api } from "../services/api";
import type { Allocation, Locker, LockerStatus } from "../types/models";

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

function fmtDate(s?: string | null) {
  if (!s) return "-";
  try {
    return new Date(s).toLocaleString();
  } catch {
    return "-";
  }
}

export function Lockers() {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [activeAllocations, setActiveAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);

  const [allocSaving, setAllocSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LockerStatus | "ALL">("ALL");

  const [toast, setToast] = useState<string | null>(null);

  // Modal Alocação
  const [openAlloc, setOpenAlloc] = useState(false);
  const [allocLockerId, setAllocLockerId] = useState<string | null>(null);
  const [allocName, setAllocName] = useState("");
  const [allocEmail, setAllocEmail] = useState("");
  const [allocPhone, setAllocPhone] = useState("");
  const [allocErr, setAllocErr] = useState<string | null>(null);

  // Modal Locker (Novo/Editar)
  const [openLockerForm, setOpenLockerForm] = useState(false);
  const [editingLockerId, setEditingLockerId] = useState<string | null>(null);
  const [lfloor, setLfloor] = useState<string>("8");
  const [lkey, setLkey] = useState<string>("1");
  const [llab, setLlab] = useState<string>("");
  const [lockerFormErr, setLockerFormErr] = useState<string | null>(null);

  // Histórico
  const [openHistory, setOpenHistory] = useState(false);
  const [historyLockerId, setHistoryLockerId] = useState<string | null>(null);

  const historyLocker = useMemo(
    () => lockers.find((l) => l.id === historyLockerId) ?? null,
    [lockers, historyLockerId]
  );

  const allocLocker = useMemo(
    () => lockers.find((l) => l.id === allocLockerId) ?? null,
    [lockers, allocLockerId]
  );

  const activeByLockerId = useMemo(() => {
    const m = new Map<string, Allocation>();
    for (const a of activeAllocations) m.set(a.lockerId, a);
    return m;
  }, [activeAllocations]);

  async function refresh() {
    setLoading(true);
    try {
      const [ls, act] = await Promise.all([api.listLockers(), api.listActiveAllocations()]);
      setLockers(ls);
      setActiveAllocations(act);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = window.setInterval(refresh, 10000); // 10s
    return () => window.clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lockers.filter((l) => {
      const label = lockerLabel(l).toLowerCase();
      const matchesSearch =
        !q ||
        label.includes(q) ||
        String(l.floor).includes(q) ||
        String(l.keyNumber).includes(q) ||
        (l.currentUserName ?? "").toLowerCase().includes(q);

      const matchesFilter = filter === "ALL" || l.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [lockers, search, filter]);

  // ===== Ações =====

  function openHistoryFor(lockerId: string) {
    setHistoryLockerId(lockerId);
    setOpenHistory(true);
  }

  function openAllocationFor(lockerId: string) {
    setAllocErr(null);
    setAllocLockerId(lockerId);
    setAllocName("");
    setAllocEmail("");
    setAllocPhone("");
    setOpenAlloc(true);
  }

  async function confirmAllocation() {
    setAllocErr(null);
    if (!allocLockerId) return;

    if (!allocName.trim()) return setAllocErr("Informe o nome.");
    if (!allocEmail.trim()) return setAllocErr("Informe o e-mail.");
    
    setAllocSaving(true);

    try {
      await api.createAllocation({
        lockerId: allocLockerId,
        userName: allocName.trim(),
        userEmail: allocEmail.trim(),
        userPhone: allocPhone.trim() ? allocPhone.trim() : undefined,
      });

      setOpenAlloc(false);

      setToast("Alocação registrada (agora + devolução prevista automática em 6 meses).");
      await refresh();
    } catch (e: any) {
      setAllocErr(e?.message ?? "Erro ao alocar.");
    }
  }

  async function handleReturn(locker: Locker) {
  const ok = window.confirm(`Confirmar devolução da chave do armário ${lockerLabel(locker)}?`);
  if (!ok) return;

  try {
    const active = activeByLockerId.get(locker.id);
    if (!active) throw new Error("Não há alocação ativa para este armário.");

    await api.endAllocation(active.id);

    setToast("Devolução registrada.");
    await refresh(); 
  } catch (e: any) {
    setToast(e?.message ?? "Erro ao registrar devolução.");
  }
}

  async function handleRenew(locker: Locker) {
    try {
      const active = activeByLockerId.get(locker.id);
      if (!active) throw new Error("Não há alocação ativa para este armário.");
      const r = await api.renewAllocation(active.id);
      setToast(`Renovado! Nova devolução prevista: ${new Date(r.dueAt).toLocaleString()}`);
      await refresh();
    } catch (e: any) {
      setToast(e?.message ?? "Erro ao renovar.");
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

  // ===== CRUD Locker =====

  function openCreateLocker() {
    setLockerFormErr(null);
    setEditingLockerId(null);
    setLfloor("8");
    setLkey("1");
    setLlab("");
    setOpenLockerForm(true);
  }

  function openEditLocker(locker: Locker) {
    setLockerFormErr(null);
    setEditingLockerId(locker.id);
    setLfloor(String(locker.floor));
    setLkey(String(locker.keyNumber));
    setLlab(locker.lab ?? "");
    setOpenLockerForm(true);
  }

  async function submitLockerForm() {
    setLockerFormErr(null);

    const floor = Number(lfloor);
    const keyNumber = Number(lkey);
    const lab = llab.trim() ? llab.trim() : undefined;

    if (!Number.isFinite(floor) || floor <= 0) return setLockerFormErr("Andar inválido.");
    if (!Number.isFinite(keyNumber) || keyNumber <= 0) return setLockerFormErr("Número da chave inválido.");

    try {
      if (!editingLockerId) {
        await api.createLocker({ floor, keyNumber, lab });
        setToast("Armário criado.");
      } else {
        await api.updateLocker(editingLockerId, { floor, keyNumber, lab: lab ?? null });
        setToast("Armário atualizado.");
      }
      setOpenLockerForm(false);
      await refresh();
    } catch (e: any) {
      setLockerFormErr(e?.message ?? "Erro ao salvar armário.");
    }
  }

  async function deleteLocker(locker: Locker) {
    const ok = window.confirm(`Excluir ${lockerLabel(locker)}?\n\nIsso não pode ser desfeito.`);
    if (!ok) return;

    try {
      await api.deleteLocker(locker.id);
      setToast("Armário excluído.");
      await refresh();
    } catch (e: any) {
      setToast(e?.message ?? "Erro ao excluir armário.");
    }
  }

  // ===== Render =====

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#003366]">Armários</h1>
          <p className="text-sm text-gray-600 mt-1">Status em tempo real + alocações + cadastro</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={openCreateLocker}
            className="bg-[#003366] text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-95"
          >
            Novo armário
          </button>

          <button
            onClick={refresh}
            className="border border-[#E6EAF0] rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-[#F5F7FA]"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_8px_20px_rgba(17,24,39,0.06)] p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex gap-3 flex-col sm:flex-row">
          <input
            type="text"
            placeholder="Buscar por andar, chave, lab ou usuário..."
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

        <div className="text-xs text-gray-500">
          {loading ? "Carregando..." : `${filtered.length} armários exibidos`}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_8px_20px_rgba(17,24,39,0.06)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Armário</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Usuário</th>
              <th className="text-left px-4 py-3">Devolução prevista</th>
              <th className="text-left px-4 py-3">Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={5}>
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={5}>
                  Nenhum armário encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((locker) => {
                const active = activeByLockerId.get(locker.id);

                return (
                  <tr key={locker.id} className="border-t border-[#E6EAF0]">
                    <td className="px-4 py-3 font-medium text-gray-900">{lockerLabel(locker)}</td>

                    <td className="px-4 py-3">
                      <StatusBadge status={locker.status} />
                    </td>

                    <td className="px-4 py-3 text-gray-600">{locker.currentUserName ?? active?.userName ?? "-"}</td>

                    <td className="px-4 py-3 text-gray-600">{active ? fmtDate(active.dueAt ?? null) : "-"}</td>

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
                          <>
                            <button
                              onClick={() => handleReturn(locker)}
                              className="text-[#003366] text-xs font-medium hover:underline"
                            >
                              Registrar devolução
                            </button>

                            <button
                              onClick={() => handleRenew(locker)}
                              className="text-[#1E4FBF] text-xs font-medium hover:underline"
                            >
                              Renovar +6 meses
                            </button>
                          </>
                        ) : null}

                        {locker.status !== "MAINTENANCE" ? (
                          <button
                            onClick={() => setMaintenance(locker)}
                            className="text-[#A16207] text-xs font-medium hover:underline"
                          >
                            Manutenção
                          </button>
                        ) : (
                          <button
                            onClick={() => setFree(locker)}
                            className="text-[#1E7A3A] text-xs font-medium hover:underline"
                          >
                            Marcar livre
                          </button>
                        )}

                        <button
                          onClick={() => openHistoryFor(locker.id)}
                          className="text-gray-600 text-xs font-medium hover:underline"
                        >
                          Histórico
                        </button>

                        <button
                          onClick={() => openEditLocker(locker)}
                          className="text-gray-600 text-xs font-medium hover:underline"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => deleteLocker(locker)}
                          className="text-red-600 text-xs font-medium hover:underline"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Alocação */}
      <Modal open={openAlloc} onClose={() => setOpenAlloc(false)} title="Registrar saída (alocação)">
        <div className="space-y-4">
          {allocErr ? <div className="text-sm text-red-600">{allocErr}</div> : null}

          <div className="bg-[#F5F7FA] border border-[#E6EAF0] rounded-xl p-3 text-sm">
            <div className="text-gray-600">Armário</div>
            <div className="font-semibold text-[#003366]">{allocLocker ? lockerLabel(allocLocker) : "-"}</div>
            <div className="text-xs text-gray-500 mt-1">Devolução prevista será automática: agora + 6 meses</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">Nome</label>
            <input
              value={allocName}
              onChange={(e) => setAllocName(e.target.value)}
              placeholder="Nome completo"
              className="w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">E-mail</label>
            <input
              value={allocEmail}
              onChange={(e) => setAllocEmail(e.target.value)}
              placeholder="email@..."
              className="w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">Telefone (opcional)</label>
            <input
              value={allocPhone}
              onChange={(e) => setAllocPhone(e.target.value)}
              placeholder="(xx) xxxxx-xxxx"
              className="w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          <button
          disabled={allocSaving}
          onClick={confirmAllocation}
          className={`w-full bg-[#003366] text-white py-2 rounded-xl font-medium hover:opacity-95 ${allocSaving ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {allocSaving ? "Salvando..." : "Confirmar e Registrar"}
        </button>
        </div>
      </Modal>

      {/* Modal: Novo/Editar Locker */}
      <Modal
        open={openLockerForm}
        onClose={() => setOpenLockerForm(false)}
        title={editingLockerId ? "Editar armário" : "Novo armário"}
      >
        <div className="space-y-4">
          {lockerFormErr ? <div className="text-sm text-red-600">{lockerFormErr}</div> : null}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Andar</label>
              <input
                value={lfloor}
                onChange={(e) => setLfloor(e.target.value)}
                className="w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Nº da chave</label>
              <input
                value={lkey}
                onChange={(e) => setLkey(e.target.value)}
                className="w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-600">Lab (opcional)</label>
              <input
                value={llab}
                onChange={(e) => setLlab(e.target.value)}
                className="w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
            </div>
          </div>

          <button onClick={submitLockerForm} className="w-full bg-[#003366] text-white py-2 rounded-xl font-medium hover:opacity-95">
            Salvar
          </button>
        </div>
      </Modal>

      <HistoryModal open={openHistory} onClose={() => setOpenHistory(false)} locker={historyLocker} />

      {toast ? <Toast>{toast}</Toast> : null}
    </div>
  );
}
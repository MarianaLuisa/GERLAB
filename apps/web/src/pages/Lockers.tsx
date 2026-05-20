import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CalendarClock,
  CheckCircle2,
  History,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";
import { HistoryModal } from "../components/HistoryModal";
import { api } from "../services/api";
import type { Allocation, Locker, LockerStatus } from "../types/models";
import {
  Alert,
  Button,
  CountBadge,
  DataToolbar,
  Field,
  MetricCard,
  PageHeader,
  Panel,
  SelectInput,
  StatusBadge,
  TextInput,
} from "../components/ui";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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

function statusAccent(status: LockerStatus) {
  if (status === "FREE") return "border-t-emerald-600";
  if (status === "OCCUPIED") return "border-t-[#0F62A8]";
  return "border-t-amber-600";
}

export function Lockers() {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [activeAllocations, setActiveAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allocSaving, setAllocSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<LockerStatus | "ALL">("ALL");
  const [toast, setToast] = useState<string | null>(null);
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);

  const [openAlloc, setOpenAlloc] = useState(false);
  const [allocLockerId, setAllocLockerId] = useState<string | null>(null);
  const [allocName, setAllocName] = useState("");
  const [allocEmail, setAllocEmail] = useState("");
  const [allocPhone, setAllocPhone] = useState("");
  const [allocErr, setAllocErr] = useState<string | null>(null);

  const [openLockerForm, setOpenLockerForm] = useState(false);
  const [editingLockerId, setEditingLockerId] = useState<string | null>(null);
  const [lfloor, setLfloor] = useState<string>("8");
  const [lkey, setLkey] = useState<string>("1");
  const [llab, setLlab] = useState<string>("");
  const [lockerFormErr, setLockerFormErr] = useState<string | null>(null);

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

  async function refresh(options: { initial?: boolean } = {}) {
    if (options.initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [ls, act] = await Promise.all([api.listLockers(), api.listActiveAllocations()]);
      setLockers(ls);
      setActiveAllocations(act);
    } finally {
      if (options.initial) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    refresh({ initial: true });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lockers.filter((l) => {
      const label = lockerLabel(l).toLowerCase();
      const active = activeByLockerId.get(l.id);
      const matchesSearch =
        !q ||
        label.includes(q) ||
        String(l.floor).includes(q) ||
        String(l.keyNumber).includes(q) ||
        (l.lab ?? "").toLowerCase().includes(q) ||
        (l.currentUserName ?? "").toLowerCase().includes(q) ||
        (active?.userName ?? "").toLowerCase().includes(q);

      const matchesFilter = filter === "ALL" || l.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [activeByLockerId, lockers, search, filter]);

  const statusCounts = useMemo(() => {
    return {
      total: lockers.length,
      free: lockers.filter((l) => l.status === "FREE").length,
      occupied: lockers.filter((l) => l.status === "OCCUPIED").length,
      maintenance: lockers.filter((l) => l.status === "MAINTENANCE").length,
    };
  }, [lockers]);

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
    } catch (e: unknown) {
      setAllocErr(errorMessage(e, "Erro ao alocar."));
    } finally {
      setAllocSaving(false);
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
    } catch (e: unknown) {
      setToast(errorMessage(e, "Erro ao registrar devolução."));
    }
  }

  async function handleRenew(locker: Locker) {
    try {
      const active = activeByLockerId.get(locker.id);
      if (!active) throw new Error("Não há alocação ativa para este armário.");
      const r = await api.renewAllocation(active.id);
      setToast(`Renovado! Nova devolução prevista: ${new Date(r.dueAt).toLocaleString()}`);
      await refresh();
    } catch (e: unknown) {
      setToast(errorMessage(e, "Erro ao renovar."));
    }
  }

  async function setMaintenance(locker: Locker) {
    try {
      await api.updateLockerStatus(locker.id, "MAINTENANCE");
      setToast("Armário marcado como manutenção.");
      await refresh();
    } catch (e: unknown) {
      setToast(errorMessage(e, "Erro ao alterar status."));
    }
  }

  async function setFree(locker: Locker) {
    try {
      await api.updateLockerStatus(locker.id, "FREE");
      setToast("Armário marcado como livre.");
      await refresh();
    } catch (e: unknown) {
      setToast(errorMessage(e, "Erro ao alterar status."));
    }
  }

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
    } catch (e: unknown) {
      setLockerFormErr(errorMessage(e, "Erro ao salvar armário."));
    }
  }

  async function deleteLocker(locker: Locker) {
    const ok = window.confirm(`Excluir ${lockerLabel(locker)}?\n\nIsso não pode ser desfeito.`);
    if (!ok) return;

    try {
      await api.deleteLocker(locker.id);
      setToast("Armário excluído.");
      await refresh();
    } catch (e: unknown) {
      setToast(errorMessage(e, "Erro ao excluir armário."));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Armários"
        description="Visão operacional dos armários, alocações e ações de manutenção."
        actions={
          <>
            <Button variant="primary" onClick={openCreateLocker}>
              <Plus size={15} />
              Novo armário
            </Button>
            <Button onClick={() => refresh()} disabled={refreshing}>
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Atualizando..." : "Atualizar"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard title="Total" value={loading ? "-" : statusCounts.total} accent="slate" />
        <MetricCard title="Livres" value={loading ? "-" : statusCounts.free} accent="green" />
        <MetricCard title="Ocupados" value={loading ? "-" : statusCounts.occupied} accent="blue" />
        <MetricCard title="Manutenção" value={loading ? "-" : statusCounts.maintenance} accent="amber" />
      </div>

      <DataToolbar
        meta={
          <CountBadge>
            {loading ? "Carregando..." : refreshing ? "Atualizando dados..." : `${filtered.length} armários exibidos`}
          </CountBadge>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_190px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" size={17} />
            <TextInput
              type="text"
              placeholder="Buscar por andar, chave, lab ou usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <SelectInput value={filter} onChange={(e) => setFilter(e.target.value as LockerStatus | "ALL")}>
            <option value="ALL">Todos</option>
            <option value="FREE">Livre</option>
            <option value="OCCUPIED">Ocupado</option>
            <option value="MAINTENANCE">Manutenção</option>
          </SelectInput>
        </div>
      </DataToolbar>

      {loading ? (
        <LockerGridSkeleton />
      ) : filtered.length === 0 ? (
        <Panel className="p-10 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center gap-2">
            <KeyRound size={26} className="text-[#8AA0B8]" />
            <h2 className="text-base font-semibold text-[#102A43]">Nenhum armário encontrado</h2>
            <p className="text-sm leading-6 text-[#60738A]">
              Ajuste a busca ou o filtro para visualizar outros armários cadastrados.
            </p>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((locker) => {
            const active = activeByLockerId.get(locker.id);
            return (
              <LockerCard
                key={locker.id}
                locker={locker}
                active={active}
                menuOpen={openActionsId === locker.id}
                onToggleMenu={() => setOpenActionsId((id) => (id === locker.id ? null : locker.id))}
                onCloseMenu={() => setOpenActionsId(null)}
                onAllocate={() => openAllocationFor(locker.id)}
                onReturn={() => handleReturn(locker)}
                onRenew={() => handleRenew(locker)}
                onMaintenance={() => setMaintenance(locker)}
                onFree={() => setFree(locker)}
                onHistory={() => openHistoryFor(locker.id)}
                onEdit={() => openEditLocker(locker)}
                onDelete={() => deleteLocker(locker)}
              />
            );
          })}
        </div>
      )}

      <Modal open={openAlloc} onClose={() => setOpenAlloc(false)} title="Registrar saída">
        <div className="space-y-4">
          {allocErr ? <Alert>{allocErr}</Alert> : null}

          <div className="rounded border border-[#D9E2EC] bg-[#F7FAFD] p-3 text-sm">
            <div className="text-[#60738A]">Armário</div>
            <div className="font-semibold text-[#102A43]">{allocLocker ? lockerLabel(allocLocker) : "-"}</div>
            <div className="mt-1 text-xs text-[#60738A]">Devolução prevista automática: agora + 6 meses</div>
          </div>

          <Field label="Nome">
            <TextInput value={allocName} onChange={(e) => setAllocName(e.target.value)} placeholder="Nome completo" />
          </Field>
          <Field label="E-mail">
            <TextInput value={allocEmail} onChange={(e) => setAllocEmail(e.target.value)} placeholder="email@..." />
          </Field>
          <Field label="Telefone (opcional)">
            <TextInput value={allocPhone} onChange={(e) => setAllocPhone(e.target.value)} placeholder="(xx) xxxxx-xxxx" />
          </Field>

          <Button variant="primary" disabled={allocSaving} onClick={confirmAllocation} className="w-full">
            {allocSaving ? "Salvando..." : "Confirmar e registrar"}
          </Button>
        </div>
      </Modal>

      <Modal open={openLockerForm} onClose={() => setOpenLockerForm(false)} title={editingLockerId ? "Editar armário" : "Novo armário"}>
        <div className="space-y-4">
          {lockerFormErr ? <Alert>{lockerFormErr}</Alert> : null}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field label="Andar">
              <TextInput value={lfloor} onChange={(e) => setLfloor(e.target.value)} />
            </Field>
            <Field label="Nº da chave">
              <TextInput value={lkey} onChange={(e) => setLkey(e.target.value)} />
            </Field>
            <Field label="Lab (opcional)">
              <TextInput value={llab} onChange={(e) => setLlab(e.target.value)} />
            </Field>
          </div>

          <Button variant="primary" onClick={submitLockerForm} className="w-full">
            Salvar
          </Button>
        </div>
      </Modal>

      <HistoryModal open={openHistory} onClose={() => setOpenHistory(false)} locker={historyLocker} />
      {toast ? <Toast>{toast}</Toast> : null}
    </div>
  );
}

function LockerCard({
  locker,
  active,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onAllocate,
  onReturn,
  onRenew,
  onMaintenance,
  onFree,
  onHistory,
  onEdit,
  onDelete,
}: {
  locker: Locker;
  active?: Allocation;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onAllocate: () => void;
  onReturn: () => void;
  onRenew: () => void;
  onMaintenance: () => void;
  onFree: () => void;
  onHistory: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Panel className={`relative border-t-4 ${statusAccent(locker.status)} transition hover:border-[#B7C7D8]`}>
      <div className="flex items-start justify-between gap-4 border-b border-[#E8EDF3] p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-[-0.01em] text-[#102A43]">
              Chave {locker.keyNumber}
            </h2>
            <StatusBadge status={locker.status} />
          </div>
          <div className="mt-1 text-sm text-[#60738A]">{locker.floor}º andar</div>
        </div>

        <LockerActionMenu
          locker={locker}
          open={menuOpen}
          onToggle={onToggleMenu}
          onClose={onCloseMenu}
          onHistory={onHistory}
          onEdit={onEdit}
          onRenew={onRenew}
          onMaintenance={onMaintenance}
          onFree={onFree}
          onDelete={onDelete}
        />
      </div>

      <div className="space-y-4 p-4">
        <InfoRow
          icon={<KeyRound size={16} />}
          label="Laboratório"
          value={locker.lab || "Sem laboratório informado"}
        />

        <InfoRow
          icon={<UserRound size={16} />}
          label={active ? "Responsável atual" : "Situação"}
          value={locker.currentUserName ?? active?.userName ?? "Sem usuário vinculado"}
          muted={!active && !locker.currentUserName}
        />

        <InfoRow
          icon={<CalendarClock size={16} />}
          label="Devolução prevista"
          value={active ? fmtDate(active.dueAt ?? null) : "Sem alocação ativa"}
          muted={!active}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#E8EDF3] bg-[#F8FAFC] px-4 py-3">
        <div className="text-xs font-medium text-[#60738A]">
          {active ? "Armário em uso" : locker.status === "MAINTENANCE" ? "Indisponível para alocação" : "Pronto para alocação"}
        </div>
        <PrimaryAction locker={locker} onAllocate={onAllocate} onReturn={onReturn} onFree={onFree} />
      </div>
    </Panel>
  );
}

function PrimaryAction({
  locker,
  onAllocate,
  onReturn,
  onFree,
}: {
  locker: Locker;
  onAllocate: () => void;
  onReturn: () => void;
  onFree: () => void;
}) {
  if (locker.status === "FREE") {
    return (
      <Button variant="primary" className="min-h-8 px-3 py-1.5 text-xs" onClick={onAllocate}>
        Alocar
      </Button>
    );
  }

  if (locker.status === "OCCUPIED") {
    return (
      <Button variant="secondary" className="min-h-8 px-3 py-1.5 text-xs" onClick={onReturn}>
        Registrar devolução
      </Button>
    );
  }

  return (
    <Button variant="secondary" className="min-h-8 px-3 py-1.5 text-xs" onClick={onFree}>
      Marcar livre
    </Button>
  );
}

function InfoRow({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-[#8AA0B8]">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-[0.05em] text-[#60738A]">{label}</div>
        <div className={`mt-0.5 truncate text-sm ${muted ? "text-[#8AA0B8]" : "font-medium text-[#24364B]"}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

function LockerActionMenu({
  open,
  onToggle,
  onClose,
  locker,
  onHistory,
  onEdit,
  onRenew,
  onMaintenance,
  onFree,
  onDelete,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  locker: Locker;
  onHistory: () => void;
  onEdit: () => void;
  onRenew: () => void;
  onMaintenance: () => void;
  onFree: () => void;
  onDelete: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  function run(action: () => void) {
    onClose();
    action();
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        className={`inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#0F62A8]/15 ${
          open
            ? "border-[#0F62A8] bg-[#EDF4FB] text-[#0F62A8]"
            : "border-[#C8D4E1] bg-white text-[#40516A] hover:border-[#AFC0D2] hover:bg-[#F6F8FA]"
        }`}
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal size={15} />
        Mais ações
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-md border border-[#C8D4E1] bg-white p-1 text-sm shadow-[0_16px_36px_rgba(15,23,42,0.16)]"
        >
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#60738A]">
            Ações do armário
          </div>
          <div className="mb-1 border-t border-[#E8EDF3]" />
          <MenuButton icon={<History size={15} />} label="Histórico" onClick={() => run(onHistory)} />
          <MenuButton icon={<Pencil size={15} />} label="Editar cadastro" onClick={() => run(onEdit)} />

          {locker.status === "OCCUPIED" ? (
            <MenuButton icon={<RotateCw size={15} />} label="Renovar +6 meses" onClick={() => run(onRenew)} />
          ) : null}

          {locker.status !== "MAINTENANCE" ? (
            <MenuButton icon={<Wrench size={15} />} label="Marcar manutenção" onClick={() => run(onMaintenance)} tone="warning" />
          ) : (
            <MenuButton icon={<CheckCircle2 size={15} />} label="Marcar livre" onClick={() => run(onFree)} tone="success" />
          )}

          <div className="my-1 border-t border-[#E8EDF3]" />
          <MenuButton icon={<Trash2 size={15} />} label="Excluir" onClick={() => run(onDelete)} tone="danger" />
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tone?: "default" | "warning" | "success" | "danger";
}) {
  const toneClass = {
    default: "text-[#24364B] hover:bg-[#F6F8FA]",
    warning: "text-[#92400E] hover:bg-[#FFFBEB]",
    success: "text-[#166534] hover:bg-[#F0FDF4]",
    danger: "text-[#B42318] hover:bg-[#FFF5F5]",
  }[tone];

  return (
    <button
      type="button"
      role="menuitem"
      className={`flex w-full items-center gap-2 rounded px-2.5 py-2 text-left transition ${toneClass}`}
      onClick={onClick}
    >
      <span className="flex w-4 justify-center text-current/70">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function LockerGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Panel key={index} className="border-t-4 border-t-[#D9E2EC] p-4">
          <div className="h-5 w-32 animate-pulse rounded-sm bg-[#E8EDF3]" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-full animate-pulse rounded-sm bg-[#EEF2F6]" />
            <div className="h-4 w-3/4 animate-pulse rounded-sm bg-[#EEF2F6]" />
            <div className="h-4 w-2/3 animate-pulse rounded-sm bg-[#EEF2F6]" />
          </div>
          <div className="mt-5 h-9 w-full animate-pulse rounded-sm bg-[#EEF2F6]" />
        </Panel>
      ))}
    </div>
  );
}

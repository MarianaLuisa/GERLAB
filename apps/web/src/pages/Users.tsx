import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";
import { api } from "../services/api";
import type { User } from "../types/models";
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

type Mode = "CREATE" | "EDIT";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function Users() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("CREATE");
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const data = await api.listUsers();
      setItems(data);
    } catch (e: unknown) {
      setErr(errorMessage(e, "Erro ao carregar usuários."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone ?? "").includes(q));
  }, [items, search]);

  function openCreate() {
    setMode("CREATE");
    setEditId(null);
    setName("");
    setEmail("");
    setPhone("");
    setFormErr(null);
    setOpen(true);
  }

  function openEdit(u: User) {
    setMode("EDIT");
    setEditId(u.id);
    setName(u.name ?? "");
    setEmail(u.email ?? "");
    setPhone(u.phone ?? "");
    setFormErr(null);
    setOpen(true);
  }

  async function save() {
    setFormErr(null);
    const n = name.trim();
    const e = email.trim().toLowerCase();
    const p = phone.trim();

    if (!n) return setFormErr("Informe o nome.");
    if (!e) return setFormErr("Informe o e-mail.");

    setSaving(true);
    try {
      if (mode === "CREATE") {
        await api.createUser({ name: n, email: e, phone: p || undefined });
        setToast("Usuário criado.");
      } else {
        if (!editId) throw new Error("Usuário inválido.");
        await api.updateUser(editId, { name: n, email: e, phone: p || undefined });
        setToast("Usuário atualizado.");
      }
      setOpen(false);
      await refresh();
    } catch (e: unknown) {
      setFormErr(errorMessage(e, "Erro ao salvar."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(u: User) {
    const ok = window.confirm(`Excluir "${u.name}"? (Não pode ter alocação ativa)`);
    if (!ok) return;

    try {
      await api.deleteUser(u.id);
      setToast("Usuário excluído.");
      await refresh();
    } catch (e: unknown) {
      setToast(errorMessage(e, "Erro ao excluir."));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Cadastro, edição e exclusão de usuários."
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={15} />
            Novo usuário
          </Button>
        }
      />

      {err ? <Alert>{err}</Alert> : null}

      <DataToolbar meta={<CountBadge>{loading ? "Carregando..." : `${filtered.length} usuários`}</CountBadge>}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]" size={17} />
            <TextInput
              type="text"
              placeholder="Buscar por nome, e-mail, telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button onClick={refresh}>
            <RefreshCw size={15} />
            Atualizar
          </Button>
        </div>
      </DataToolbar>

      <TableShell>
        <table className={tableClass}>
          <thead className={theadClass}>
            <tr>
              <th className={thClass}>Nome</th>
              <th className={thClass}>E-mail</th>
              <th className={thClass}>Telefone</th>
              <th className={`${thClass} text-right`}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <EmptyCell colSpan={4}>Carregando...</EmptyCell>
            ) : filtered.length === 0 ? (
              <EmptyCell colSpan={4}>Nenhum usuário encontrado.</EmptyCell>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="transition hover:bg-[#FAFCFF]">
                  <td className={`${tdClass} font-semibold text-[#102A43]`}>{u.name}</td>
                  <td className={`${tdClass} text-[#40516A]`}>{u.email}</td>
                  <td className={`${tdClass} text-[#60738A]`}>{u.phone ?? "-"}</td>
                  <td className={`${tdClass} text-right`}>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="ghost" className="min-h-8 px-2.5 py-1 text-xs" onClick={() => openEdit(u)}>
                        Editar
                      </Button>
                      <Button variant="danger" className="min-h-8 px-2.5 py-1 text-xs" onClick={() => remove(u)}>
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      <Modal open={open} onClose={() => setOpen(false)} title={mode === "CREATE" ? "Novo usuário" : "Editar usuário"}>
        <div className="space-y-4">
          {formErr ? <Alert>{formErr}</Alert> : null}

          <Field label="Nome">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="E-mail">
            <TextInput value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Telefone (opcional)">
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>

          <Button variant="primary" onClick={save} disabled={saving} className="w-full">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
          <Button onClick={() => setOpen(false)} className="w-full">
            Cancelar
          </Button>
        </div>
      </Modal>

      {toast ? <Toast>{toast}</Toast> : null}
    </div>
  );
}

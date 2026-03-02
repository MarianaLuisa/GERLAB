import { useEffect, useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { Toast } from "../components/Toast";
import { api } from "../services/api";
import type { User } from "../types/models";

type Mode = "CREATE" | "EDIT";

export function Users() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // modal
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
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar usuários.");
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
    setPhone((u as any).phone ?? ""); // se teu type User não tem phone, ainda assim funciona
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
    } catch (e: any) {
      setFormErr(e?.message ?? "Erro ao salvar.");
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
    } catch (e: any) {
      setToast(e?.message ?? "Erro ao excluir.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#003366]">Usuários</h1>
          <p className="text-sm text-gray-600 mt-1">Cadastro, edição e exclusão</p>
        </div>

        <button
          onClick={openCreate}
          className="rounded-xl bg-[#003366] text-white px-4 py-2 text-sm font-medium hover:opacity-95"
        >
          Novo usuário
        </button>
      </div>

      {err ? (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3">{err}</div>
      ) : null}

      <div className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_8px_20px_rgba(17,24,39,0.06)] p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Buscar por nome, e-mail, telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
        />

        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="border border-[#E6EAF0] rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-[#F5F7FA]"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_8px_20px_rgba(17,24,39,0.06)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3">E-mail</th>
              <th className="text-left px-4 py-3">Telefone</th>
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
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-t border-[#E6EAF0]">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-700">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{(u as any).phone ?? "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => openEdit(u)} className="text-[#003366] text-xs font-medium hover:underline">
                        Editar
                      </button>
                      <button onClick={() => remove(u)} className="text-red-600 text-xs font-medium hover:underline">
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "CREATE" ? "Novo usuário" : "Editar usuário"}
      >
        <div className="space-y-4">
          {formErr ? <div className="text-sm text-red-600">{formErr}</div> : null}

          <div className="space-y-2">
            <label className="text-sm text-gray-600">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">E-mail</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-600">Telefone (opcional)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-[#003366] text-white py-2 rounded-xl font-medium hover:opacity-95 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>

          <button
            onClick={() => setOpen(false)}
            className="w-full border border-[#E6EAF0] rounded-xl py-2 text-sm font-medium text-gray-700 hover:bg-[#F5F7FA]"
          >
            Cancelar
          </button>
        </div>
      </Modal>

      {toast ? <Toast>{toast}</Toast> : null}
    </div>
  );
}
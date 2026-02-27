import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import type { Allocation } from "../types/models";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [active, setActive] = useState<Allocation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const [us, act] = await Promise.all([api.listUsers(), api.listActiveAllocations()]);
      setUsers(us as any);
      setActive(act);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const activeByUser = useMemo(() => {
    const m = new Map<string, Allocation>();
    for (const a of active) m.set(a.userId, a);
    return m;
  }, [active]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        String(u.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#003366]">Usuários</h1>
          <p className="text-sm text-gray-600">Lista real de contatos e situação de chave ativa.</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone…"
            className="w-72 max-w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
          />
          <button
            onClick={refresh}
            className="border border-[#E6EAF0] rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-[#F5F7FA]"
          >
            Atualizar
          </button>
        </div>
      </div>

      {err ? (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3">
          {err}
        </div>
      ) : null}

      <div className="bg-white border border-[#E6EAF0] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3">E-mail</th>
              <th className="text-left px-4 py-3">Telefone</th>
              <th className="text-left px-4 py-3">Chave ativa</th>
              <th className="text-left px-4 py-3">Desde</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={5}>
                  Carregando…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={5}>
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const a = activeByUser.get(u.id);
                return (
                  <tr key={u.id} className="border-t border-[#E6EAF0]">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{u.phone ?? "-"}</td>
                    <td className="px-4 py-3">
                      {a ? (
                        <span className="inline-flex items-center rounded-full bg-[#003366]/10 text-[#003366] px-2 py-1 text-xs font-medium">
                          {a.lockerLabel}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {a ? new Date(a.startAt).toLocaleString() : "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
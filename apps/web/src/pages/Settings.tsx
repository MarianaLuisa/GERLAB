export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#003366]">Configurações</h1>
        <p className="text-sm text-gray-600 mt-1">Regras, notificações, segurança e backup</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: "Informações Institucionais", desc: "Nome, e-mail de contato, horário de funcionamento" },
          { title: "Regras de Alocação", desc: "Dias máximos, renovação, observações para usuários" },
          { title: "Notificações", desc: "E-mail para alocações, devoluções e manutenções" },
          { title: "Segurança", desc: "RBAC, acesso institucional, conformidade LGPD" },
          { title: "Backup e Manutenção", desc: "Backup diário, histórico, execução manual" },
          { title: "Aparência", desc: "Tema e idioma" },
        ].map((c) => (
          <div key={c.title} className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_8px_20px_rgba(17,24,39,0.06)] p-4">
            <div className="font-medium text-[#003366]">{c.title}</div>
            <div className="text-sm text-gray-600 mt-1">{c.desc}</div>
            <div className="mt-3 text-xs text-gray-500">Implementaremos quando integrar com backend.</div>
          </div>
        ))}
      </div>
    </div>
  );
}
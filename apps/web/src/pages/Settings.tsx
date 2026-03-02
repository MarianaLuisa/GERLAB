import { useEffect, useState } from "react";
import { api } from "../services/api";

type Form = {
  // Regras
  allocationMonths: number;
  allowRenewal: boolean;
  maxRenewals: number;

  // Notificações
  notificationsEnabled: boolean;
  notificationToEmails: string;

  // Segurança
  allowedManagerEmails: string;
  requireInstitutionalDomain: boolean;

  // Aparência
  theme: string;
  locale: string;
};

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [f, setF] = useState<Form | null>(null);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    if (!f) return;
    setF({ ...f, [k]: v });
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const s = await api.getSettings();
        setF({
          allocationMonths: Number(s.allocationMonths ?? 6),
          allowRenewal: Boolean(s.allowRenewal ?? true),
          maxRenewals: Number(s.maxRenewals ?? 1),

          notificationsEnabled: Boolean(s.notificationsEnabled ?? false),
          notificationToEmails: s.notificationToEmails ?? "",

          allowedManagerEmails: s.allowedManagerEmails ?? "",
          requireInstitutionalDomain: Boolean(s.requireInstitutionalDomain ?? true),

          theme: s.theme ?? "light",
          locale: s.locale ?? "pt-BR",
        });
      } catch (e: any) {
        setErr(e?.message ?? "Erro ao carregar configurações.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    if (!f) return;

    setSaving(true);
    setErr(null);
    setOk(null);

    if (f.allocationMonths < 1) return setErr("Prazo padrão deve ser >= 1 mês.");
    if (f.maxRenewals < 0) return setErr("Máx. renovações deve ser >= 0.");
    if (!f.allowedManagerEmails.trim()) return setErr("Informe os e-mails gestores autorizados (CSV).");

    try {
      await api.updateSettings({
        allocationMonths: f.allocationMonths,
        allowRenewal: f.allowRenewal,
        maxRenewals: f.maxRenewals,

        notificationsEnabled: f.notificationsEnabled,
        notificationToEmails: f.notificationToEmails,

        allowedManagerEmails: f.allowedManagerEmails,
        requireInstitutionalDomain: f.requireInstitutionalDomain,

        theme: f.theme,
        locale: f.locale,
      });

      setOk("Configurações salvas.");
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao salvar configurações.");
    } finally {
      setSaving(false);
      setTimeout(() => setOk(null), 2500);
    }
  }

  if (loading) return <div className="text-sm text-gray-600">Carregando…</div>;
  if (err && !f) return <div className="text-sm text-red-600">{err}</div>;
  if (!f) return null;

  const Card = ({ title, desc, children }: any) => (
    <div className="bg-white rounded-2xl border border-[#E6EAF0] shadow-[0_8px_20px_rgba(17,24,39,0.06)] p-4">
      <div className="font-medium text-[#003366]">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{desc}</div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );

  const Row = ({ label, children }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );

  const Input = (props: any) => (
    <input
      {...props}
      className={`w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] ${props.className ?? ""}`}
    />
  );

  const Textarea = (props: any) => (
    <textarea
      {...props}
      className={`w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] ${props.className ?? ""}`}
    />
  );

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`px-3 py-2 rounded-xl text-sm font-medium border ${
        value ? "bg-[#003366] text-white border-[#003366]" : "bg-white text-gray-700 border-[#E6EAF0]"
      }`}
    >
      {value ? "Ativo" : "Inativo"}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#003366]">Configurações</h1>
          <p className="text-sm text-gray-600 mt-1">Regras, notificações, segurança e aparência</p>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="bg-[#003366] text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-95 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {err ? <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3">{err}</div> : null}
      {ok ? <div className="text-sm text-green-700 border border-green-200 bg-green-50 rounded-xl p-3">{ok}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Regras de alocação" desc="Prazo padrão, renovação e limites">
          <Row label="Prazo padrão (meses)">
            <Input type="number" min={1} value={f.allocationMonths} onChange={(e: any) => set("allocationMonths", Number(e.target.value))} />
          </Row>
          <Row label="Permitir renovação">
            <Toggle value={f.allowRenewal} onChange={(v) => set("allowRenewal", v)} />
          </Row>
          <Row label="Máx. renovações">
            <Input type="number" min={0} value={f.maxRenewals} onChange={(e: any) => set("maxRenewals", Number(e.target.value))} />
          </Row>
        </Card>

        <Card title="Notificações" desc="Liga/desliga e e-mails destinatários (CSV)">
          <Row label="Ativar notificações">
            <Toggle value={f.notificationsEnabled} onChange={(v) => set("notificationsEnabled", v)} />
          </Row>
          <Row label="Enviar para (CSV)">
            <Textarea rows={3} value={f.notificationToEmails} onChange={(e: any) => set("notificationToEmails", e.target.value)} placeholder="magda@ufcspa.edu.br, gerlab@ufcspa.edu.br" />
          </Row>
        </Card>

        <Card title="Segurança" desc="Quem pode acessar e validação institucional">
          <Row label="Gestores autorizados (CSV)">
            <Textarea rows={3} value={f.allowedManagerEmails} onChange={(e: any) => set("allowedManagerEmails", e.target.value)} />
          </Row>
          <Row label="Exigir domínio @ufcspa.edu.br">
            <Toggle value={f.requireInstitutionalDomain} onChange={(v) => set("requireInstitutionalDomain", v)} />
          </Row>
        </Card>

        <Card title="Aparência" desc="Preferências de interface">
          <Row label="Tema">
            <Input value={f.theme} onChange={(e: any) => set("theme", e.target.value)} placeholder="light" />
          </Row>
          <Row label="Idioma">
            <Input value={f.locale} onChange={(e: any) => set("locale", e.target.value)} placeholder="pt-BR" />
          </Row>
        </Card>
      </div>
    </div>
  );
}
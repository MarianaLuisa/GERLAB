import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api } from "../services/api";
import { Alert, Button, PageHeader, Panel, SectionHeader, TextArea, TextInput } from "../components/ui";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type Form = {
  allocationMonths: number;
  allowRenewal: boolean;
  maxRenewals: number;
  notificationsEnabled: boolean;
  notificationToEmails: string;
  allowedManagerEmails: string;
  requireInstitutionalDomain: boolean;
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
      } catch (e: unknown) {
        setErr(errorMessage(e, "Erro ao carregar configurações."));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    if (!f) return;

    if (f.allocationMonths < 1) {
      setErr("Prazo padrão deve ser >= 1 mês.");
      return;
    }
    if (f.maxRenewals < 0) {
      setErr("Máx. renovações deve ser >= 0.");
      return;
    }
    if (!f.allowedManagerEmails.trim()) {
      setErr("Informe os e-mails gestores autorizados (CSV).");
      return;
    }

    setSaving(true);
    setErr(null);
    setOk(null);

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
    } catch (e: unknown) {
      setErr(errorMessage(e, "Erro ao salvar configurações."));
    } finally {
      setSaving(false);
      setTimeout(() => setOk(null), 2500);
    }
  }

  if (loading) return <div className="text-sm text-[#60738A]">Carregando...</div>;
  if (err && !f) return <Alert>{err}</Alert>;
  if (!f) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Regras, notificações, segurança e preferências de interface."
        actions={
          <Button variant="primary" onClick={save} disabled={saving}>
            <Save size={15} />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        }
      />

      {err ? <Alert>{err}</Alert> : null}
      {ok ? <Alert type="success">{ok}</Alert> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SettingsCard title="Regras de alocação" desc="Prazo padrão, renovação e limites.">
          <SettingsRow label="Prazo padrão (meses)">
            <TextInput type="number" min={1} value={f.allocationMonths} onChange={(e) => set("allocationMonths", Number(e.target.value))} />
          </SettingsRow>
          <SettingsRow label="Permitir renovação">
            <Toggle value={f.allowRenewal} onChange={(v) => set("allowRenewal", v)} />
          </SettingsRow>
          <SettingsRow label="Máx. renovações">
            <TextInput type="number" min={0} value={f.maxRenewals} onChange={(e) => set("maxRenewals", Number(e.target.value))} />
          </SettingsRow>
        </SettingsCard>

        <SettingsCard title="Notificações" desc="Liga/desliga e e-mails destinatários (CSV).">
          <SettingsRow label="Ativar notificações">
            <Toggle value={f.notificationsEnabled} onChange={(v) => set("notificationsEnabled", v)} />
          </SettingsRow>
          <SettingsRow label="Enviar para (CSV)">
            <TextArea rows={3} value={f.notificationToEmails} onChange={(e) => set("notificationToEmails", e.target.value)} placeholder="magda@ufcspa.edu.br, gerlab@ufcspa.edu.br" />
          </SettingsRow>
        </SettingsCard>

        <SettingsCard title="Segurança e acesso" desc="Quem pode acessar e validação institucional.">
          <SettingsRow label="Gestores autorizados (CSV)">
            <TextArea rows={3} value={f.allowedManagerEmails} onChange={(e) => set("allowedManagerEmails", e.target.value)} />
          </SettingsRow>
          <SettingsRow label="Exigir domínio @ufcspa.edu.br">
            <Toggle value={f.requireInstitutionalDomain} onChange={(v) => set("requireInstitutionalDomain", v)} />
          </SettingsRow>
        </SettingsCard>

        <SettingsCard title="Aparência e localidade" desc="Preferências de interface.">
          <SettingsRow label="Tema">
            <TextInput value={f.theme} onChange={(e) => set("theme", e.target.value)} placeholder="light" />
          </SettingsRow>
          <SettingsRow label="Idioma">
            <TextInput value={f.locale} onChange={(e) => set("locale", e.target.value)} placeholder="pt-BR" />
          </SettingsRow>
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <Panel>
      <SectionHeader title={title} description={desc} />
      <div className="space-y-4 p-5">{children}</div>
    </Panel>
  );
}

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:items-center">
      <div className="text-sm font-medium text-[#344054]">{label}</div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`inline-flex min-w-24 items-center justify-center rounded border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#0F62A8]/15 ${
        value
          ? "border-[#0F62A8] bg-[#0F62A8] text-white"
          : "border-[#C8D4E1] bg-white text-[#40516A] hover:bg-[#F6F8FA]"
      }`}
    >
      {value ? "Ativo" : "Inativo"}
    </button>
  );
}

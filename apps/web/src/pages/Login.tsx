import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { loginWithEmail } from "../services/auth";
import logo from "../assets/logo.png";
import logoUfcspa from "../assets/ufcspalogo.png";
import { Alert, Button, Field, TextInput } from "../components/ui";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function handleLogin() {
    setErr(null);
    try {
      loginWithEmail(email);
      navigate("/", { replace: true });
    } catch (e: unknown) {
      setErr(errorMessage(e, "Erro ao autenticar."));
    }
  }

  useEffect(() => {
    const email = localStorage.getItem("ufcspa_email");
    if (email) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-5 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-md border border-[#D9E2EC] bg-white lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex min-h-[500px] flex-col justify-between bg-[#052B4F] p-7 text-white lg:p-9">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/75">
              Acesso institucional
            </div>
            <h1 className="mt-6 text-[2.15rem] font-semibold leading-tight">
              GERLAB
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-6 text-blue-50/78">
              Sistema de Gestão de Acessos aos Armários da PROPPGI/UFCSPA.
            </p>
          </div>

          <div className="border-t border-white/12 pt-4 text-[13px] leading-5 text-blue-50/76">
            Gestão centralizada, auditoria e conformidade para uso institucional.
          </div>
        </section>

        <section className="flex flex-col justify-center p-7 sm:p-9">
          <div className="mb-7 flex items-center justify-center gap-5">
            <img src={logo} alt="PROPPGI" className="h-12 w-auto object-contain" />
            <div className="h-10 w-px bg-[#D9E2EC]" />
            <img src={logoUfcspa} alt="UFCSPA" className="h-12 w-auto object-contain" />
          </div>

          <div className="mb-5">
            <h2 className="text-[1.35rem] font-semibold leading-7 text-[#102A43]">Entrar no sistema</h2>
            <p className="mt-1 text-[13px] text-[#60738A]">
              Use seu e-mail institucional autorizado.
            </p>
          </div>

          {err ? (
            <div className="mb-4">
              <Alert>{err}</Alert>
            </div>
          ) : null}

          <div className="space-y-4">
            <Field label="E-mail institucional">
              <TextInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@ufcspa.edu.br"
                type="email"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
              />
            </Field>

            <Button variant="primary" className="w-full" onClick={handleLogin}>
              Entrar
              <ArrowRight size={15} />
            </Button>
          </div>

          <p className="mt-5 text-[11px] leading-4 text-[#60738A]">
            Acesso restrito a e-mails autorizados. Conformidade LGPD.
          </p>
        </section>
      </div>
    </div>
  );
}

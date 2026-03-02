import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithEmail } from "../services/auth";
import logo from "../assets/logo.png";
import logoUfcspa from "../assets/ufcspalogo.png";
import { useEffect } from "react";


export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function handleLogin() {
    setErr(null);
    try {
      loginWithEmail(email);
      navigate("/", { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao autenticar.");
    }
  }
  useEffect(() => {
  const email = localStorage.getItem("ufcspa_email");
  if (email) {
    navigate("/", { replace: true });
  }
}, []);

  return (
    // <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-6">
    <div className="min-h-screen from-[#F5F7FA] to-[#E8EEF5] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_20px_rgba(17,24,39,0.06)] border border-[#E6EAF0] p-6">

    <div className="mb-6 text-center">

      <div className="flex items-center justify-center gap-6 mb-4">
        <img
          src={logo}
          alt="PROPPGI"
          className="h-20 object-contain"
        />

        <div className="w-px h-10 bg-gray-200"></div>

        <img
          src={logoUfcspa}
          alt="UFCSPA"
          className="h-20 object-contain"
        />
      </div>

      <div className="text-2xl font-semibold text-[#003366]">
        PROPPGI / UFCSPA
      </div>

      <div className="text-sm text-gray-600">
        Sistema de Gestão de Acessos aos Armários
      </div>

    </div>

        {err ? (
          <div className="mb-4 text-sm text-red-600 border border-red-200 bg-red-50 rounded-xl p-3">
            {err}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm text-gray-600">E-mail institucional</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@ufcspa.edu.br"
            className="w-full border border-[#E6EAF0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
          />
        </div>

        <button
          className="mt-4 w-full rounded-xl bg-[#003366] text-white py-3 font-medium hover:opacity-95"
          onClick={handleLogin}
        >
          Entrar
        </button>

        <div className="mt-6 text-xs text-gray-500">
          Acesso restrito a e-mails autorizados. Conformidade LGPD.
        </div>
      </div>
    </div>
  );
}
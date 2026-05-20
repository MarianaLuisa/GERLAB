import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { FileText, LayoutDashboard, Lock, LogOut, Settings, ShieldCheck, Users } from "lucide-react";
import { logout } from "../services/auth";
import logo from "../assets/logo.png";

const navItems = [
  { to: "/", label: "Início", icon: LayoutDashboard },
  { to: "/armarios", label: "Armários", icon: Lock },
  { to: "/usuarios", label: "Usuários", icon: Users },
  { to: "/relatorios", label: "Relatórios", icon: FileText },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="sticky top-0 z-20 flex border-b border-white/10 bg-[#052B4F] text-white lg:h-screen lg:w-[16.5rem] lg:flex-col lg:border-b-0">
          <div className="flex w-full flex-col">
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4 lg:px-5 lg:py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white">
                <img src={logo} alt="PROPPGI" className="h-8 w-auto object-contain" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold tracking-[-0.01em]">PROPPGI / UFCSPA</div>
                <div className="truncate text-xs text-blue-100/75">Gestão de Armários</div>
              </div>
            </div>

            <nav className="app-scrollbar flex gap-1 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:overflow-x-visible">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      [
                        "group flex shrink-0 items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition",
                        isActive
                          ? "bg-white text-[#052B4F]"
                          : "text-blue-50/80 hover:bg-white/10 hover:text-white",
                      ].join(" ")
                    }
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="hidden border-t border-white/10 p-4 lg:block">
              <div className="border border-white/10 bg-white/7 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.05em] text-white">
                  <ShieldCheck size={16} />
                  Conformidade
                </div>
                <p className="mt-2 text-xs leading-5 text-blue-50/70">
                  LGPD e acesso institucional para gestão segura.
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-white/15 px-3 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="border-b border-[#D9E2EC] bg-white px-5 py-3 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold text-[#102A43]">
                Sistema de Gestão de Acessos
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded border border-[#C8D4E1] bg-white px-3 py-2 text-sm font-semibold text-[#40516A] transition hover:bg-[#F6F8FA] lg:hidden"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1480px] px-5 py-6 lg:px-8 lg:py-7">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

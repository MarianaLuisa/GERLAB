// src/layouts/AppLayout.tsx
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Lock, Users, FileText, Settings } from "lucide-react";
import { logout } from "../services/auth";
import logo from "../assets/logo.png";

const navItems = [
  { to: "/", label: "Início", icon: LayoutDashboard },
  { to: "/armarios", label: "Armários", icon: Lock },
  { to: "/usuarios", label: "Usuários", icon: Users },
  { to: "/relatorios", label: "Relatórios", icon: FileText },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

const linkClass = (isActive: boolean) =>
  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
    isActive
      ? "bg-white/12 text-white"
      : "text-white/80 hover:bg-white/10 hover:text-white"
  }`;

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-[#003366] text-white p-4 flex flex-col">
          
          {/* LOGO */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <img
              src={logo}
              alt="UFCSPA"
              className="h-10 w-auto object-contain"
            />

            <div className="leading-tight">
              <div className="text-sm font-semibold">PROPPGI / UFCSPA</div>
              <div className="text-xs text-white/70">
                Gestão de Armários
              </div>
            </div>
          </div>

          {/* MENU */}
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={linkClass(active)}
                  end={item.to === "/"}
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* RODAPÉ */}
          <div className="mt-8 border-t border-white/10 pt-4 text-xs text-white/70">
            <div className="font-medium text-white/80">Conformidade</div>
            <div>LGPD • Acesso institucional</div>

            <button
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
              className="mt-4 w-full border border-white/20 text-white/90 rounded-xl px-3 py-2 text-sm hover:bg-white/10 transition"
            >
              Sair
            </button>
          </div>

        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
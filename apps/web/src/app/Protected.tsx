import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { getSessionEmail, isLoggedIn, logout } from "../services/auth";

function isValidEmail(email: string) {
  const e = email.trim().toLowerCase();

  if (!e) return false;

  // só e-mail institucional
  if (!e.endsWith("@ufcspa.edu.br")) return false;

  return true;
}

export function Protected({ children }: { children: ReactNode }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const email = getSessionEmail();

  if (!email || !isValidEmail(email)) {
    logout();
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
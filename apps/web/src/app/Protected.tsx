import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { isLoggedIn } from "../services/auth";

export function Protected({ children }: { children: ReactNode }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
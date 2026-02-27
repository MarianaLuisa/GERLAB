import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Lockers } from "../pages/Lockers";
import { Users } from "../pages/Users";
import { Reports } from "../pages/Reports";
import { Settings } from "../pages/Settings";
import { Protected } from "./Protected";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <Protected>
        <AppLayout />
      </Protected>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "armarios", element: <Lockers /> },
      { path: "usuarios", element: <Users /> },
      { path: "relatorios", element: <Reports /> },
      { path: "configuracoes", element: <Settings /> },
    ],
  },
]);
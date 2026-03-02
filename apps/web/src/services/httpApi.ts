import type { ApiClient, AuditFilters } from "./contracts";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getEmail(): string | null {
  return localStorage.getItem("ufcspa_email");
}


export async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const email = getEmail();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      "Content-Type": "application/json",
      ...(email ? { "x-user-email": email } : {}),
    },
  });

  if (!res.ok) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data = await res.json().catch(() => null);
    const msg =
      (typeof data?.message === "string" && data.message) ||
      (Array.isArray(data?.message) && data.message.join(" • ")) ||
      data?.error ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const text = await res.text().catch(() => "");
  throw new Error(text || `HTTP ${res.status}`);
}

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await res.json()) as T;

  // endpoints que retornam arquivo
  return (await res.blob()) as unknown as T;
}

export const httpApi: ApiClient = {
  me: () => req("/me"),
  listUsers: () => req("/users"),

  listLockers: () => req("/lockers"),
  createLocker: (input) => req("/lockers", { method: "POST", body: JSON.stringify(input) }),
  updateLockerStatus: (lockerId, status) =>
    req(`/lockers/${lockerId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }).then(() => undefined),

  listActiveAllocations: () => req("/allocations/active"),
  listMyHistory: (userId) => req(`/allocations/history/user/${userId}`),
  createAllocation: (input) => req("/allocations", { method: "POST", body: JSON.stringify(input) }),

  endAllocation: (allocationId) => req(`/allocations/${allocationId}/end`, { method: "POST" }).then(() => undefined),

  listAudit: (filters?: AuditFilters) => {
    const qs = new URLSearchParams();
    if (filters?.fromISO) qs.set("fromISO", filters.fromISO);
    if (filters?.toISO) qs.set("toISO", filters.toISO);
    const q = qs.toString();
    return req(`/audit${q ? `?${q}` : ""}`);
  },
  cancelAllocation: (allocationId, input) => req(`/allocations/${allocationId}/cancel`, { method: "POST", body: JSON.stringify(input) }),
  listHistoryByUser: (userId) => req(`/allocations/history/user/${userId}`),
  listHistoryByLocker: (lockerId) => req(`/allocations/history/locker/${lockerId}`),
  createUser: (input) => req("/users", { method: "POST", body: JSON.stringify(input) }),
  updateUser: (id, input) => req(`/users/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteUser: (id) => req(`/users/${id}`, { method: "DELETE" }).then(() => undefined),
    updateLocker: (lockerId, input) =>
    req(`/lockers/${lockerId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }).then(() => undefined),

  deleteLocker: (lockerId) =>
    req(`/lockers/${lockerId}`, { method: "DELETE" }).then(() => undefined),


  renewAllocation: (allocationId) =>
    req(`/allocations/${allocationId}/renew`, { method: "POST" }),

  exportCsv: (filters) => {
  const qs = new URLSearchParams();
  if (filters?.fromISO) qs.set("fromISO", filters.fromISO);
  if (filters?.toISO) qs.set("toISO", filters.toISO);
  const q = qs.toString();
  return req(`/reports/audit.csv${q ? `?${q}` : ""}`);
},

  exportPdf: (filters) => {
    const qs = new URLSearchParams();
    if (filters?.fromISO) qs.set("fromISO", filters.fromISO);
    if (filters?.toISO) qs.set("toISO", filters.toISO);
    const q = qs.toString();
    return req(`/reports/audit.pdf${q ? `?${q}` : ""}`);
  },
  
  getSettings: () => req("/settings"),
  updateSettings: (input) => req("/settings", { method: "PUT", body: JSON.stringify(input) }),
};
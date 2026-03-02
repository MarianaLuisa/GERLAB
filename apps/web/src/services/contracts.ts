import type { Allocation, AuditLog, Locker, LockerStatus, User } from "../types/models";

export type CreateLockerInput = {
  floor: number;
  keyNumber: number;
  lab?: string | null;
};
export type CreateAllocationInput = {
  lockerId: string; 
  userName: string;
  userEmail: string;
  userPhone?: string;
};

export type SystemSettings = {
  id: string;

  allocationMonths: number;
  allowRenewal: boolean;
  maxRenewals: number;

  notificationsEnabled: boolean;
  notificationToEmails?: string | null;

  allowedManagerEmails: string;
  requireInstitutionalDomain: boolean;

  theme: string;
  locale: string;

  createdAt: string;
  updatedAt: string;
};

export type UpdateSettingsInput = Partial<Pick<
  SystemSettings,
  | "allocationMonths"
  | "allowRenewal"
  | "maxRenewals"
  | "notificationsEnabled"
  | "notificationToEmails"
  | "allowedManagerEmails"
  | "requireInstitutionalDomain"
  | "theme"
  | "locale"
>>;


export type UpdateSystemSettingsInput = Partial<Omit<SystemSettings, "id" | "updatedAt">>;

export interface ApiClient {
  // ...
  getSettings: () => Promise<SystemSettings>;
  updateSettings: (input: UpdateSystemSettingsInput) => Promise<SystemSettings>;
}

export type AuditFilters = { fromISO?: string; toISO?: string };

export interface ApiClient {
  me(): Promise<User>;

  listLockers(): Promise<Locker[]>;
  createLocker(input: CreateLockerInput): Promise<Locker>;
  updateLockerStatus(lockerId: string, status: LockerStatus): Promise<void>;
  createLocker: (input: { floor: number; keyNumber: number; lab?: string | null }) => Promise<Locker>;
  updateLocker: (lockerId: string, input: { floor?: number; keyNumber?: number; lab?: string | null }) => Promise<void>;
  deleteLocker: (lockerId: string) => Promise<void>;

  listUsers(): Promise<User[]>;
  createUser: (input: { name: string; email: string; phone?: string }) => Promise<User>;
  updateUser: (id: string, input: { name?: string; email?: string; phone?: string | null }) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;

  listActiveAllocations(): Promise<Allocation[]>;
  listMyHistory(userId: string): Promise<Allocation[]>;

  createAllocation(input: CreateAllocationInput): Promise<Allocation>;
  endAllocation(allocationId: string): Promise<void>;

  listAudit: (filters?: { fromISO?: string; toISO?: string }) => Promise<AuditLog[]>;
  listHistoryByUser(userId: string): Promise<Allocation[]>;
  listHistoryByLocker(lockerId: string): Promise<Allocation[]>;
  cancelAllocation: (allocationId: string, input?: { reason?: string }) => Promise<{ ok: true }>;
  
  
  endAllocation: (allocationId: string) => Promise<void>;

  renewAllocation: (allocationId: string) => Promise<{ ok: true; dueAt: string }>;

  exportPdf: (filters?: AuditFilters) => Promise<Blob>;
  exportCsv: (filters?: AuditFilters) => Promise<Blob>;
  

}
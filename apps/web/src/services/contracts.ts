import type { Allocation, AuditLog, Locker, LockerStatus, User } from "../types/models";

export type CreateLockerInput = {
  floor: number;
  keyNumber: number;
  lab?: string | null;
};
export type CreateAllocationInput = { userId: string; lockerId: string; dueAtISO: string };

export type AuditFilters = { fromISO?: string; toISO?: string };

export interface ApiClient {
  me(): Promise<User>;

  listLockers(): Promise<Locker[]>;
  createLocker(input: CreateLockerInput): Promise<Locker>;
  updateLockerStatus(lockerId: string, status: LockerStatus): Promise<void>;

  listUsers(): Promise<User[]>;
  listActiveAllocations(): Promise<Allocation[]>;
  listMyHistory(userId: string): Promise<Allocation[]>;

  createAllocation(input: CreateAllocationInput): Promise<Allocation>;
  endAllocation(allocationId: string): Promise<void>;

  listAudit(filters?: AuditFilters): Promise<AuditLog[]>;

  listHistoryByUser(userId: string): Promise<Allocation[]>;
  listHistoryByLocker(lockerId: string): Promise<Allocation[]>;

}
export type Role = "MANAGER" | "USER";
export type LockerStatus = "FREE" | "OCCUPIED" | "MAINTENANCE";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};


export type Locker = {
  id: string;
  floor: number;
  keyNumber: number;
  lab: string | null;
  status: LockerStatus;
  currentUserId: string | null;
  currentUserName: string | null;
};

export type Allocation = {
  id: string;
  userId: string;
  userName: string;
  lockerId: string;

  lockerFloor: number;
  lockerKeyNumber: number;
  lockerLab?: string | null;
  lockerLabel: string;

  startAt: string;
  dueAt?: string | null;
  endAt?: string | null;
};

export type AuditLog = {
  id: string;
  actorUserName: string;
  action: "LOCKER_CREATED" | "LOCKER_STATUS_CHANGED" | "ALLOCATION_CREATED" | "ALLOCATION_ENDED";
  entity: "LOCKER" | "ALLOCATION";
  entityId: string;
  createdAt: string;
  details: string;
};
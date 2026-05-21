-- Reconcile data created before the allocation-active rule was enforced.
-- Official active allocation rule: "endAt" IS NULL.

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY "lockerId"
      ORDER BY "startAt" DESC, "createdAt" DESC, id DESC
    ) AS rn
  FROM "Allocation"
  WHERE "endAt" IS NULL
)
UPDATE "Allocation" a
SET
  "endAt" = NOW(),
  "cancelReason" = COALESCE(a."cancelReason", 'Encerrada por migração: alocação ativa duplicada para o armário.'),
  "updatedAt" = NOW()
FROM ranked r
WHERE a.id = r.id
  AND r.rn > 1;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY "userId"
      ORDER BY "startAt" DESC, "createdAt" DESC, id DESC
    ) AS rn
  FROM "Allocation"
  WHERE "endAt" IS NULL
)
UPDATE "Allocation" a
SET
  "endAt" = NOW(),
  "cancelReason" = COALESCE(a."cancelReason", 'Encerrada por migração: alocação ativa duplicada para o usuário.'),
  "updatedAt" = NOW()
FROM ranked r
WHERE a.id = r.id
  AND r.rn > 1;

UPDATE "Allocation" a
SET
  "endAt" = NOW(),
  "cancelReason" = COALESCE(a."cancelReason", 'Encerrada por migração: armário em manutenção.'),
  "updatedAt" = NOW()
FROM "Locker" l
WHERE a."lockerId" = l.id
  AND a."endAt" IS NULL
  AND l.status = 'MAINTENANCE'::"LockerStatus";

WITH active AS (
  SELECT DISTINCT ON (a."lockerId")
    a."lockerId",
    a."userId"
  FROM "Allocation" a
  WHERE a."endAt" IS NULL
  ORDER BY a."lockerId", a."startAt" DESC, a."createdAt" DESC, a.id DESC
)
UPDATE "Locker" l
SET
  status = 'OCCUPIED'::"LockerStatus",
  "currentUserId" = active."userId",
  "updatedAt" = NOW()
FROM active
WHERE l.id = active."lockerId";

UPDATE "Locker" l
SET
  status = 'FREE'::"LockerStatus",
  "currentUserId" = NULL,
  "updatedAt" = NOW()
WHERE l.status <> 'MAINTENANCE'::"LockerStatus"
  AND NOT EXISTS (
    SELECT 1
    FROM "Allocation" a
    WHERE a."lockerId" = l.id
      AND a."endAt" IS NULL
  );

UPDATE "Locker" l
SET
  "currentUserId" = NULL,
  "updatedAt" = NOW()
WHERE l.status = 'MAINTENANCE'::"LockerStatus";

CREATE UNIQUE INDEX IF NOT EXISTS "Allocation_one_active_per_locker"
ON "Allocation"("lockerId")
WHERE "endAt" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Allocation_one_active_per_user"
ON "Allocation"("userId")
WHERE "endAt" IS NULL;

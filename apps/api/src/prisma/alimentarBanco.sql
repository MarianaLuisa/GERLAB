BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- 1) UPSERT USERS (somente quem tem e-mail)
-- =========================================================
WITH input_users AS (
  SELECT * FROM (VALUES
    ('ana.bernandi@ufcspa.edu.br', 'Ana Paula Bernandi', '46 999167022'),
    ('johan.ordovas@ufcspa.edu.br', 'Johan stamado ordovás', '51 984332207'),
    ('manuelarossadasilva1739@gmail.com', 'Manuela Rossa', '51 983335510'),
    ('pc.santanafilho@gmail.com', 'Paulo Cesar  Santana', '51 992288230'),
    ('squizani.samia@gmail.com', 'Samia Squizani', '55 996015500'),
    ('diogo.alves@ufcspa.edu.br', 'Diogo Feliciano', '13 988359093'),

    ('daianeribeiro@ufcspa.edu.br', 'Daiane Nobre', '51 982169418'),
    ('fernandaiotto@ufcspa.edu.br', 'Fernanda', '51 986270868'),
    ('renata.lopin@yfcspa.edu.br', 'Renata', '51 984525386'),
    ('ana.pinheiro@ufcspa.edu.br', 'Ana Carolina', '53 999597808'),
    ('tamira.rosa@ufcspa.edu.br', 'Tamira da rosa', '51 997972225'),
    ('rhailprte1@gmail.com', 'Raul', '51 983218408'),
    ('thcram@gmail.com', 'Thais', '53 991314905'),
    ('paolar@ufcspa.edu.br', 'Paola romam', '54 999076107'),
    ('luiza.silva@ufcspa.edu.br', 'Luiza', '51 991648447'),
    ('julia.mantiolho@ufcspa.edu.br', 'Julia Salles', '51 992985198'),

    ('adrianesilvaoliveira30@gmail.com', 'Adriane Oliveira', '21 996253471'),
    ('heinzerodrigues@gmail.com', 'Cristiano Rodrigues', '51 996245160'),

    ('gabriele.rais@ufcspa.edu.br', 'Gabriele vayas', '51 9985108664'),
    ('giulianog@ufcspa.edu.br', 'Giuliano', '51 999074247'),
    ('eronides@ufcspa.edu.br', 'Eronides Heberte', '55 996320714'),
    ('glauciaprado92@gmail.com', 'Glaucia Prado', '55 997293195'),
    ('isadora.kirsten@ufcspa.edu.br', 'Isadora Kirsten', '51 995835350'),
    ('gigimaliuk13@gmail.com', 'Giovana Maliuk', '51980466120'),
    ('luiza.subtil@gmail.com', 'Luiza Subtil', '51 999449694'),
    ('frahmeier13@hotmail.com', 'Francine Rahmis', '55 999495548'),

    ('amanda.hackenhoor@ufcspa.edu.br', 'Amanda Elisa Hackenhoor', '49 988350618'),
    ('ana.luiza@ufcspa.edu.br', 'Ana luiza Da Silveira', '51 9976676728'),
    ('carolarende@gmail.com', 'Caroline Arend Birrer', '55 991437576'),
    ('lohani.rodrigues@ufcspa.edu.br', 'Lohani Aguiar Rodrigues', '51 999119480'),
    ('bianca.martinelho@ufcspa.edu.br', 'Bianca Rodrugues', '51 994240033'),

    ('giovana.guelfond@ufcspa.edu.br', 'Giovana Guelfond', '51 996839627'),
    ('freyjulia@hotmail.com', 'Julia Frey Da Silva', '51 996988939'),
    ('luizagraciano6@gmail.com', 'Luiza Michel Graciano', '51 997000504'),
    ('ana.silveira@ufcspa.edu.br', 'Ana Kalise', '51 993565309'),
    ('leandro.morais@ufcspa.edu.br', 'Leandro Zonim', '51 99876055')
  ) AS t(email, name, phone)
),
norm AS (
  SELECT
    lower(trim(email)) AS email,
    trim(name) AS name,
    NULLIF(trim(phone), '') AS phone
  FROM input_users
  WHERE email IS NOT NULL AND trim(email) <> ''
)
INSERT INTO "User" (id, email, name, phone)
SELECT gen_random_uuid(), email, name, phone
FROM norm
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone;

-- =========================================================
-- 2) UPSERT LOCKERS (somente os citados)
-- =========================================================
WITH input_lockers AS (
  SELECT * FROM (VALUES
    -- 8º andar (lab 803)
    (8, 21, '803'),
    (8, 9,  '803'),
    (8, 24, '803'),
    (8, 6,  '803'),
    (8, 20, '803'),
    (8, 5,  '803'),

    -- 7º andar (lab vazio -> NULL)
    (7, 16, NULL),
    (7, 11, NULL),
    (7, 9,  NULL),
    (7, 17, NULL),
    (7, 15, NULL),
    (7, 23, NULL),
    (7, 20, NULL),
    (7, 1,  NULL),
    (7, 2,  NULL),
    (7, 6,  NULL),
    (7, 4,  NULL),
    (7, 24, NULL),

    -- 6º andar
    (6, 18, '613'),
    (6, 9,  '714'),
    (6, 13, '613'),

    -- 5º andar
    (5, 20, '514'),
    (5, 22, '514'),
    (5, 14, '514'),
    (5, 3,  '514'),
    (5, 5,  '714'),
    (5, 4,  '714'),
    (5, 6,  '714'),
    (5, 23, '514'),

    -- 3º andar
    (3, 2,  'Biologia Molecular'),
    (3, 15, 'Biologia Molecular'),
    (3, 22, 'Bio mol'),          -- "22/11." -> fixado como 22
    (3, 4,  'Biologia Molecular'),
    (3, 17, 'Bio mol'),

    -- 2º andar
    (2, 22, 'Gentox'),
    (2, 16, 'genetica toxicolos'),
    (2, 13, 'genetica toxicolos'),
    (2, 17, 'genetica toxicolos')
    -- Leandro sem keyNumber -> não entra
  ) AS t(floor, keyNumber, lab)
)
INSERT INTO "Locker" (id, floor, "keyNumber", lab, status, "currentUserId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  floor,
  keyNumber,
  lab,
  'FREE'::"LockerStatus",
  NULL,
  NOW(),
  NOW()
FROM input_lockers
ON CONFLICT (floor, "keyNumber") DO UPDATE SET
  lab = EXCLUDED.lab,
  "updatedAt" = NOW();

-- =========================================================
-- 3) ALLOCATIONS + LOCKER STATUS
-- Regras:
-- - "Em Uso"/"Em uso" => allocation ativa (endAt NULL) + locker OCCUPIED/currentUserId
-- - "Devolvida" => allocation encerrada (endAt = startAt) + locker FREE/currentUserId NULL
-- - Sem e-mail ou sem chave => pula
-- =========================================================
WITH input_alloc AS (
  SELECT * FROM (VALUES
    -- 8º
    ('ana.bernandi@ufcspa.edu.br', 8, 21, '06/12/2025', '803', 'Em Uso'),
    ('johan.ordovas@ufcspa.edu.br', 8, 9,  '06/12/2025', '803', 'Em Uso'),
    ('manuelarossadasilva1739@gmail.com', 8, 24, '06/12/2025', '803', 'Em Uso'),
    ('pc.santanafilho@gmail.com', 8, 6,  '06/13/2025', '803', 'Em Uso'),
    ('squizani.samia@gmail.com', 8, 20, '06/13/2025', '803', 'Em Uso'),
    ('diogo.alves@ufcspa.edu.br', 8, 5,  '06/13/2025', '803', 'Em Uso'),

    -- 7º (Lisiani e Arthur sem e-mail => fora)
    ('daianeribeiro@ufcspa.edu.br', 7, 16, '03/25/2025', NULL, 'Em Uso'),
    ('fernandaiotto@ufcspa.edu.br', 7, 11, '03/25/2025', NULL, 'Em Uso'),
    ('renata.lopin@yfcspa.edu.br', 7, 9,  '03/25/2025', NULL, 'Em Uso'),
    ('ana.pinheiro@ufcspa.edu.br', 7, 15, '03/25/2025', NULL, 'Em Uso'),
    ('tamira.rosa@ufcspa.edu.br', 7, 23, '03/26/2025', NULL, 'Em Uso'),
    ('rhailprte1@gmail.com', 7, 1, '03/26/2025', NULL, 'Em Uso'),
    ('thcram@gmail.com', 7, 2, '03/26/2025', NULL, 'Em Uso'),
    ('paolar@ufcspa.edu.br', 7, 6, '03/26/2025', NULL, 'Em Uso'),
    ('luiza.silva@ufcspa.edu.br', 7, 4, '03/28/2025', NULL, 'Em Uso'),
    ('julia.mantiolho@ufcspa.edu.br', 7, 24, '03/31/2025', NULL, 'Em Uso'),

    -- 6º (Carlo sem e-mail => fora)
    ('adrianesilvaoliveira30@gmail.com', 6, 18, '04/14/2025', '613', 'Em Uso'),
    ('heinzerodrigues@gmail.com', 6, 13, '08/28/2025', '613', 'Em Uso'),

    -- 5º
    ('gabriele.rais@ufcspa.edu.br', 5, 20, '04/15/2025', '514', 'Em uso'),
    ('giulianog@ufcspa.edu.br', 5, 22, '04/15/2025', '514', 'Em uso'),
    ('eronides@ufcspa.edu.br', 5, 14, '04/15/2025', '514', 'Em uso'),
    ('glauciaprado92@gmail.com', 5, 3, '06/25/2025', '514', 'Em uso'),
    ('isadora.kirsten@ufcspa.edu.br', 5, 5, '08/25/2025', '714', 'Em uso'),
    ('gigimaliuk13@gmail.com', 5, 4, '08/25/2025', '714', 'Em uso'),
    ('luiza.subtil@gmail.com', 5, 6, '08/25/2025', '714', 'Em uso'),
    ('frahmeier13@hotmail.com', 5, 23, '10/15/2025', '514', 'Em uso'),

    -- 3º
    ('amanda.hackenhoor@ufcspa.edu.br', 3, 2,  '04/11/2025', 'Biologia Molecular', 'Em uso'),
    ('ana.luiza@ufcspa.edu.br', 3, 15, '04/23/2025', 'Biologia Molecular', 'Devolvida'),
    ('carolarende@gmail.com', 3, 22, '04/24/2025', 'Bio mol', 'Em uso'),
    ('lohani.rodrigues@ufcspa.edu.br', 3, 4,  '08/26/2025', 'Biologia Molecular', 'Em uso'),
    ('bianca.martinelho@ufcspa.edu.br', 3, 17, '01/05/2026', 'Bio mol', 'Em uso'),

    -- 2º (Leandro sem chave => fora)
    ('giovana.guelfond@ufcspa.edu.br', 2, 22, '09/05/2025', 'Gentox', 'Em uso'),
    ('freyjulia@hotmail.com', 2, 16, '09/08/2025', 'genetica toxicolos', 'Em uso'),
    ('luizagraciano6@gmail.com', 2, 13, '09/15/2025', 'genetica toxicolos', 'Em uso'),
    ('ana.silveira@ufcspa.edu.br', 2, 17, '09/15/2025', 'genetica toxicolos', 'Em uso')
  ) AS t(email, floor, keyNumber, startMDY, lab, situation)
),
norm AS (
  SELECT
    lower(trim(email)) AS email,
    floor,
    keyNumber,
    to_date(startMDY, 'MM/DD/YYYY')::date AS startDate,
    NULLIF(trim(lab), '') AS lab,
    lower(trim(situation)) AS situation
  FROM input_alloc
  WHERE email IS NOT NULL AND trim(email) <> ''
),
joined AS (
  SELECT
    u.id AS "userId",
    l.id AS "lockerId",
    n.startDate,
    n.lab,
    n.situation
  FROM norm n
  JOIN "User" u ON u.email = n.email
  JOIN "Locker" l ON l.floor = n.floor AND l."keyNumber" = n.keyNumber
),
to_insert AS (
  SELECT
    gen_random_uuid() AS id,
    "userId",
    "lockerId",
    (startDate::timestamp) AS "startAt",
    NULL::timestamp AS "dueAt",
    CASE
      WHEN situation LIKE '%devolvid%' THEN (startDate::timestamp)
      ELSE NULL
    END AS "endAt",
    NOW() AS "createdAt",
    NOW() AS "updatedAt",
    situation
  FROM joined
)
INSERT INTO "Allocation" (id, "userId", "lockerId", "startAt", "dueAt", "endAt", "createdAt", "updatedAt")
SELECT id, "userId", "lockerId", "startAt", "dueAt", "endAt", "createdAt", "updatedAt"
FROM to_insert;

-- Atualizar lockers conforme situação
WITH input_alloc AS (
  SELECT * FROM (VALUES
    -- repete o mínimo pra atualizar estado
    ('ana.bernandi@ufcspa.edu.br', 8, 21, 'Em Uso'),
    ('johan.ordovas@ufcspa.edu.br', 8, 9,  'Em Uso'),
    ('manuelarossadasilva1739@gmail.com', 8, 24, 'Em Uso'),
    ('pc.santanafilho@gmail.com', 8, 6,  'Em Uso'),
    ('squizani.samia@gmail.com', 8, 20, 'Em Uso'),
    ('diogo.alves@ufcspa.edu.br', 8, 5,  'Em Uso'),

    ('daianeribeiro@ufcspa.edu.br', 7, 16, 'Em Uso'),
    ('fernandaiotto@ufcspa.edu.br', 7, 11, 'Em Uso'),
    ('renata.lopin@yfcspa.edu.br', 7, 9,  'Em Uso'),
    ('ana.pinheiro@ufcspa.edu.br', 7, 15, 'Em Uso'),
    ('tamira.rosa@ufcspa.edu.br', 7, 23, 'Em Uso'),
    ('rhailprte1@gmail.com', 7, 1, 'Em Uso'),
    ('thcram@gmail.com', 7, 2, 'Em Uso'),
    ('paolar@ufcspa.edu.br', 7, 6, 'Em Uso'),
    ('luiza.silva@ufcspa.edu.br', 7, 4, 'Em Uso'),
    ('julia.mantiolho@ufcspa.edu.br', 7, 24, 'Em Uso'),

    ('adrianesilvaoliveira30@gmail.com', 6, 18, 'Em Uso'),
    ('heinzerodrigues@gmail.com', 6, 13, 'Em Uso'),

    ('gabriele.rais@ufcspa.edu.br', 5, 20, 'Em Uso'),
    ('giulianog@ufcspa.edu.br', 5, 22, 'Em Uso'),
    ('eronides@ufcspa.edu.br', 5, 14, 'Em Uso'),
    ('glauciaprado92@gmail.com', 5, 3, 'Em Uso'),
    ('isadora.kirsten@ufcspa.edu.br', 5, 5, 'Em Uso'),
    ('gigimaliuk13@gmail.com', 5, 4, 'Em Uso'),
    ('luiza.subtil@gmail.com', 5, 6, 'Em Uso'),
    ('frahmeier13@hotmail.com', 5, 23, 'Em Uso'),

    ('amanda.hackenhoor@ufcspa.edu.br', 3, 2,  'Em Uso'),
    ('ana.luiza@ufcspa.edu.br', 3, 15, 'Devolvida'),
    ('carolarende@gmail.com', 3, 22, 'Em Uso'),
    ('lohani.rodrigues@ufcspa.edu.br', 3, 4,  'Em Uso'),
    ('bianca.martinelho@ufcspa.edu.br', 3, 17, 'Em Uso'),

    ('giovana.guelfond@ufcspa.edu.br', 2, 22, 'Em Uso'),
    ('freyjulia@hotmail.com', 2, 16, 'Em Uso'),
    ('luizagraciano6@gmail.com', 2, 13, 'Em Uso'),
    ('ana.silveira@ufcspa.edu.br', 2, 17, 'Em Uso')
  ) AS t(email, floor, keyNumber, situation)
),
norm AS (
  SELECT lower(trim(email)) AS email, floor, keyNumber, lower(trim(situation)) AS situation
  FROM input_alloc
  WHERE email IS NOT NULL AND trim(email) <> ''
),
joined AS (
  SELECT
    u.id AS "userId",
    l.id AS "lockerId",
    n.situation
  FROM norm n
  JOIN "User" u ON u.email = n.email
  JOIN "Locker" l ON l.floor = n.floor AND l."keyNumber" = n.keyNumber
)
UPDATE "Locker" l
SET
  status = CASE WHEN j.situation LIKE '%devolvid%' THEN 'FREE'::"LockerStatus" ELSE 'OCCUPIED'::"LockerStatus" END,
  "currentUserId" = CASE WHEN j.situation LIKE '%devolvid%' THEN NULL ELSE j."userId" END,
  "updatedAt" = NOW()
FROM joined j
WHERE l.id = j."lockerId";

-- =========================================================
-- 4) Audit log
-- =========================================================
INSERT INTO "AuditLog" (id, action, entity, "entityId", details, "createdAt")
VALUES (
  gen_random_uuid(),
  'DATA_IMPORT',
  'SYSTEM',
  NULL,
  'Importação inicial via SQL apenas com registros fornecidos (usuários/armários/alocações).',
  NOW()
);

COMMIT;
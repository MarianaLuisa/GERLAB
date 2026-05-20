import { PrismaClient, LockerStatus, AuditAction, AuditEntity } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

type SeedUser = { email: string; name: string; phone?: string | null };
type SeedLocker = { floor: number; keyNumber: number; lab?: string | null };
type SeedAlloc = {
  email: string;
  floor: number;
  keyNumber: number;
  startMDY: string; // "MM/DD/YYYY"
  lab?: string | null;
  situation: "Em Uso" | "Em uso" | "Devolvida";
};

function normEmail(email: string) {
  return email.trim().toLowerCase();
}

function parseMDY(mdy: string) {
  const [mm, dd, yyyy] = mdy.split("/").map((x) => Number(x));
  return new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return d;
}

// =====================
// DADOS
// =====================
const users: SeedUser[] = [
  { email: "ana.bernandi@ufcspa.edu.br", name: "Ana Paula Bernandi", phone: "46 999167022" },
  { email: "johan.ordovas@ufcspa.edu.br", name: "Johan stamado ordovás", phone: "51 984332207" },
  { email: "manuelarossadasilva1739@gmail.com", name: "Manuela Rossa", phone: "51 983335510" },
  { email: "pc.santanafilho@gmail.com", name: "Paulo Cesar  Santana", phone: "51 992288230" },
  { email: "squizani.samia@gmail.com", name: "Samia Squizani", phone: "55 996015500" },
  { email: "diogo.alves@ufcspa.edu.br", name: "Diogo Feliciano", phone: "13 988359093" },

  { email: "daianeribeiro@ufcspa.edu.br", name: "Daiane Nobre", phone: "51 982169418" },
  { email: "fernandaiotto@ufcspa.edu.br", name: "Fernanda", phone: "51 986270868" },
  { email: "renata.lopin@yfcspa.edu.br", name: "Renata", phone: "51 984525386" },
  { email: "ana.pinheiro@ufcspa.edu.br", name: "Ana Carolina", phone: "53 999597808" },
  { email: "tamira.rosa@ufcspa.edu.br", name: "Tamira da rosa", phone: "51 997972225" },
  { email: "rhailprte1@gmail.com", name: "Raul", phone: "51 983218408" },
  { email: "thcram@gmail.com", name: "Thais", phone: "53 991314905" },
  { email: "paolar@ufcspa.edu.br", name: "Paola romam", phone: "54 999076107" },
  { email: "luiza.silva@ufcspa.edu.br", name: "Luiza", phone: "51 991648447" },
  { email: "julia.mantiolho@ufcspa.edu.br", name: "Julia Salles", phone: "51 992985198" },

  { email: "adrianesilvaoliveira30@gmail.com", name: "Adriane Oliveira", phone: "21 996253471" },
  { email: "heinzerodrigues@gmail.com", name: "Cristiano Rodrigues", phone: "51 996245160" },

  { email: "gabriele.rais@ufcspa.edu.br", name: "Gabriele vayas", phone: "51 9985108664" },
  { email: "giulianog@ufcspa.edu.br", name: "Giuliano", phone: "51 999074247" },
  { email: "eronides@ufcspa.edu.br", name: "Eronides Heberte", phone: "55 996320714" },
  { email: "glauciaprado92@gmail.com", name: "Glaucia Prado", phone: "55 997293195" },
  { email: "isadora.kirsten@ufcspa.edu.br", name: "Isadora Kirsten", phone: "51 995835350" },
  { email: "gigimaliuk13@gmail.com", name: "Giovana Maliuk", phone: "51980466120" },
  { email: "luiza.subtil@gmail.com", name: "Luiza Subtil", phone: "51 999449694" },
  { email: "frahmeier13@hotmail.com", name: "Francine Rahmis", phone: "55 999495548" },

  { email: "amanda.hackenhoor@ufcspa.edu.br", name: "Amanda Elisa Hackenhoor", phone: "49 988350618" },
  { email: "ana.luiza@ufcspa.edu.br", name: "Ana luiza Da Silveira", phone: "51 9976676728" },
  { email: "carolarende@gmail.com", name: "Caroline Arend Birrer", phone: "55 991437576" },
  { email: "lohani.rodrigues@ufcspa.edu.br", name: "Lohani Aguiar Rodrigues", phone: "51 999119480" },
  { email: "bianca.martinelho@ufcspa.edu.br", name: "Bianca Rodrugues", phone: "51 994240033" },

  { email: "giovana.guelfond@ufcspa.edu.br", name: "Giovana Guelfond", phone: "51 996839627" },
  { email: "freyjulia@hotmail.com", name: "Julia Frey Da Silva", phone: "51 996988939" },
  { email: "luizagraciano6@gmail.com", name: "Luiza Michel Graciano", phone: "51 997000504" },
  { email: "ana.silveira@ufcspa.edu.br", name: "Ana Kalise", phone: "51 993565309" },
  { email: "leandro.morais@ufcspa.edu.br", name: "Leandro Zonim", phone: "51 99876055" },
];

const lockers: SeedLocker[] = [
  { floor: 8, keyNumber: 21, lab: "803" },
  { floor: 8, keyNumber: 9, lab: "803" },
  { floor: 8, keyNumber: 24, lab: "803" },
  { floor: 8, keyNumber: 6, lab: "803" },
  { floor: 8, keyNumber: 20, lab: "803" },
  { floor: 8, keyNumber: 5, lab: "803" },

  { floor: 7, keyNumber: 16, lab: null },
  { floor: 7, keyNumber: 11, lab: null },
  { floor: 7, keyNumber: 9, lab: null },
  { floor: 7, keyNumber: 17, lab: null },
  { floor: 7, keyNumber: 15, lab: null },
  { floor: 7, keyNumber: 23, lab: null },
  { floor: 7, keyNumber: 20, lab: null },
  { floor: 7, keyNumber: 1, lab: null },
  { floor: 7, keyNumber: 2, lab: null },
  { floor: 7, keyNumber: 6, lab: null },
  { floor: 7, keyNumber: 4, lab: null },
  { floor: 7, keyNumber: 24, lab: null },

  { floor: 6, keyNumber: 18, lab: "613" },
  { floor: 6, keyNumber: 9, lab: "714" },
  { floor: 6, keyNumber: 13, lab: "613" },

  { floor: 5, keyNumber: 20, lab: "514" },
  { floor: 5, keyNumber: 22, lab: "514" },
  { floor: 5, keyNumber: 14, lab: "514" },
  { floor: 5, keyNumber: 3, lab: "514" },
  { floor: 5, keyNumber: 5, lab: "714" },
  { floor: 5, keyNumber: 4, lab: "714" },
  { floor: 5, keyNumber: 6, lab: "714" },
  { floor: 5, keyNumber: 23, lab: "514" },

  { floor: 3, keyNumber: 2, lab: "Biologia Molecular" },
  { floor: 3, keyNumber: 15, lab: "Biologia Molecular" },
  { floor: 3, keyNumber: 22, lab: "Bio mol" },
  { floor: 3, keyNumber: 4, lab: "Biologia Molecular" },
  { floor: 3, keyNumber: 17, lab: "Bio mol" },

  { floor: 2, keyNumber: 22, lab: "Gentox" },
  { floor: 2, keyNumber: 16, lab: "genetica toxicolos" },
  { floor: 2, keyNumber: 13, lab: "genetica toxicolos" },
  { floor: 2, keyNumber: 17, lab: "genetica toxicolos" },
];

const allocs: SeedAlloc[] = [
  { email: "ana.bernandi@ufcspa.edu.br", floor: 8, keyNumber: 21, startMDY: "06/12/2025", lab: "803", situation: "Em Uso" },
  { email: "johan.ordovas@ufcspa.edu.br", floor: 8, keyNumber: 9, startMDY: "06/12/2025", lab: "803", situation: "Em Uso" },
  { email: "manuelarossadasilva1739@gmail.com", floor: 8, keyNumber: 24, startMDY: "06/12/2025", lab: "803", situation: "Em Uso" },
  { email: "pc.santanafilho@gmail.com", floor: 8, keyNumber: 6, startMDY: "06/13/2025", lab: "803", situation: "Em Uso" },
  { email: "squizani.samia@gmail.com", floor: 8, keyNumber: 20, startMDY: "06/13/2025", lab: "803", situation: "Em Uso" },
  { email: "diogo.alves@ufcspa.edu.br", floor: 8, keyNumber: 5, startMDY: "06/13/2025", lab: "803", situation: "Em Uso" },

  { email: "daianeribeiro@ufcspa.edu.br", floor: 7, keyNumber: 16, startMDY: "03/25/2025", lab: null, situation: "Em Uso" },
  { email: "fernandaiotto@ufcspa.edu.br", floor: 7, keyNumber: 11, startMDY: "03/25/2025", lab: null, situation: "Em Uso" },
  { email: "renata.lopin@yfcspa.edu.br", floor: 7, keyNumber: 9, startMDY: "03/25/2025", lab: null, situation: "Em Uso" },
  { email: "ana.pinheiro@ufcspa.edu.br", floor: 7, keyNumber: 15, startMDY: "03/25/2025", lab: null, situation: "Em Uso" },
  { email: "tamira.rosa@ufcspa.edu.br", floor: 7, keyNumber: 23, startMDY: "03/26/2025", lab: null, situation: "Em Uso" },
  { email: "rhailprte1@gmail.com", floor: 7, keyNumber: 1, startMDY: "03/26/2025", lab: null, situation: "Em Uso" },
  { email: "thcram@gmail.com", floor: 7, keyNumber: 2, startMDY: "03/26/2025", lab: null, situation: "Em Uso" },
  { email: "paolar@ufcspa.edu.br", floor: 7, keyNumber: 6, startMDY: "03/26/2025", lab: null, situation: "Em Uso" },
  { email: "luiza.silva@ufcspa.edu.br", floor: 7, keyNumber: 4, startMDY: "03/28/2025", lab: null, situation: "Em Uso" },
  { email: "julia.mantiolho@ufcspa.edu.br", floor: 7, keyNumber: 24, startMDY: "03/31/2025", lab: null, situation: "Em Uso" },

  { email: "adrianesilvaoliveira30@gmail.com", floor: 6, keyNumber: 18, startMDY: "04/14/2025", lab: "613", situation: "Em Uso" },
  { email: "heinzerodrigues@gmail.com", floor: 6, keyNumber: 13, startMDY: "08/28/2025", lab: "613", situation: "Em Uso" },

  { email: "gabriele.rais@ufcspa.edu.br", floor: 5, keyNumber: 20, startMDY: "04/15/2025", lab: "514", situation: "Em uso" },
  { email: "giulianog@ufcspa.edu.br", floor: 5, keyNumber: 22, startMDY: "04/15/2025", lab: "514", situation: "Em uso" },
  { email: "eronides@ufcspa.edu.br", floor: 5, keyNumber: 14, startMDY: "04/15/2025", lab: "514", situation: "Em uso" },
  { email: "glauciaprado92@gmail.com", floor: 5, keyNumber: 3, startMDY: "06/25/2025", lab: "514", situation: "Em uso" },
  { email: "isadora.kirsten@ufcspa.edu.br", floor: 5, keyNumber: 5, startMDY: "08/25/2025", lab: "714", situation: "Em uso" },
  { email: "gigimaliuk13@gmail.com", floor: 5, keyNumber: 4, startMDY: "08/25/2025", lab: "714", situation: "Em uso" },
  { email: "luiza.subtil@gmail.com", floor: 5, keyNumber: 6, startMDY: "08/25/2025", lab: "714", situation: "Em uso" },
  { email: "frahmeier13@hotmail.com", floor: 5, keyNumber: 23, startMDY: "10/15/2025", lab: "514", situation: "Em uso" },

  { email: "amanda.hackenhoor@ufcspa.edu.br", floor: 3, keyNumber: 2, startMDY: "04/11/2025", lab: "Biologia Molecular", situation: "Em uso" },
  { email: "ana.luiza@ufcspa.edu.br", floor: 3, keyNumber: 15, startMDY: "04/23/2025", lab: "Biologia Molecular", situation: "Devolvida" },
  { email: "carolarende@gmail.com", floor: 3, keyNumber: 22, startMDY: "04/24/2025", lab: "Bio mol", situation: "Em uso" },
  { email: "lohani.rodrigues@ufcspa.edu.br", floor: 3, keyNumber: 4, startMDY: "08/26/2025", lab: "Biologia Molecular", situation: "Em uso" },
  { email: "bianca.martinelho@ufcspa.edu.br", floor: 3, keyNumber: 17, startMDY: "01/05/2026", lab: "Bio mol", situation: "Em uso" },

  { email: "giovana.guelfond@ufcspa.edu.br", floor: 2, keyNumber: 22, startMDY: "09/05/2025", lab: "Gentox", situation: "Em uso" },
  { email: "freyjulia@hotmail.com", floor: 2, keyNumber: 16, startMDY: "09/08/2025", lab: "genetica toxicolos", situation: "Em uso" },
  { email: "luizagraciano6@gmail.com", floor: 2, keyNumber: 13, startMDY: "09/15/2025", lab: "genetica toxicolos", situation: "Em uso" },
  { email: "ana.silveira@ufcspa.edu.br", floor: 2, keyNumber: 17, startMDY: "09/15/2025", lab: "genetica toxicolos", situation: "Em uso" },
];

async function main() {
  await prisma.systemSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  await prisma.$transaction([
    prisma.notificationOutbox.deleteMany({}),
    prisma.accessLog.deleteMany({}),
    prisma.auditLog.deleteMany({}),
    prisma.allocation.deleteMany({}),
    prisma.locker.deleteMany({}),
    prisma.user.deleteMany({}),
  ]);

  // users
  for (const u of users) {
    const email = normEmail(u.email);
    await prisma.user.upsert({
      where: { email },
      create: { email, name: u.name.trim(), phone: (u.phone ?? null) || null },
      update: { name: u.name.trim(), phone: (u.phone ?? null) || null },
    });
  }

  // lockers
  for (const l of lockers) {
    await prisma.locker.upsert({
      where: { floor_keyNumber: { floor: l.floor, keyNumber: l.keyNumber } },
      create: {
        floor: l.floor,
        keyNumber: l.keyNumber,
        lab: l.lab ?? null,
        status: LockerStatus.FREE,
        currentUserId: null,
      },
      update: {
        lab: l.lab ?? null,
      },
    });
  }

  const allUsers = await prisma.user.findMany();
  const userIdByEmail = new Map(allUsers.map((u) => [u.email.toLowerCase(), u.id]));

  const allLockers = await prisma.locker.findMany();
  const lockerIdByKey = new Map(allLockers.map((l) => [`${l.floor}:${l.keyNumber}`, l.id]));

  const settings = await prisma.systemSettings.findUnique({ where: { id: "singleton" } });
  const months = settings?.allocationMonths ?? 6;

  // allocations + locker state
  for (const a of allocs) {
    const email = normEmail(a.email);
    const userId = userIdByEmail.get(email);
    const lockerId = lockerIdByKey.get(`${a.floor}:${a.keyNumber}`);
    if (!userId || !lockerId) continue;

    const startAt = parseMDY(a.startMDY);
    const dueAt = addMonths(startAt, months);

    const isReturned = a.situation.toLowerCase().includes("devolvid");
    const endAt = isReturned ? startAt : null;

    await prisma.allocation.create({
      data: {
        userId,
        lockerId,
        startAt,
        dueAt,
        endAt,
        renewedCount: 0,
        cancelReason: null,
      },
    });

    await prisma.locker.update({
      where: { id: lockerId },
      data: {
        status: isReturned ? LockerStatus.FREE : LockerStatus.OCCUPIED,
        currentUserId: isReturned ? null : userId,
        lab: a.lab ?? null,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorEmail: null,
      actorName: null,
      action: AuditAction.DATA_IMPORT,
      entity: AuditEntity.SYSTEM,
      entityId: null,
      details: "Importação inicial via seed Prisma apenas com registros fornecidos (usuários/armários/alocações).",
    },
  });

  const [uc, lc, ac, auc] = await prisma.$transaction([
    prisma.user.count(),
    prisma.locker.count(),
    prisma.allocation.count(),
    prisma.auditLog.count(),
  ]);

  console.log("Seed OK ✅", { users: uc, lockers: lc, allocations: ac, audit: auc });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
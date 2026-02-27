import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  throw new Error("DATABASE_URL não definido em apps/api/.env");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

type LockerRow = {
  floor: number;
  keyNumber: number;
  lab: string | null;
  status: "FREE" | "OCCUPIED" | "MAINTENANCE";
};

const FLOORS = [2, 3, 5, 6, 7, 8];
const KEY_RANGE = { start: 1, end: 30 }; // ajuste para sua realidade

function buildLockers(): LockerRow[] {
  const rows: LockerRow[] = [];
  for (const floor of FLOORS) {
    for (let keyNumber = KEY_RANGE.start; keyNumber <= KEY_RANGE.end; keyNumber++) {
      rows.push({
        floor,
        keyNumber,
        lab: null,
        status: "FREE",
      });
    }
  }
  return rows;
}

async function main() {
  console.log("Seed iniciado...");

  // Gestores permitidos
  const gestores = [
    { name: "Gestor GERLAB 1", email: "gestor1@ufcspa.edu.br", phone: null as string | null },
    { name: "Gestor GERLAB 2", email: "gestor2@ufcspa.edu.br", phone: null as string | null },
  ];

  for (const g of gestores) {
    await prisma.user.upsert({
      where: { email: g.email },
      update: { name: g.name, phone: g.phone },
      create: g,
    });
  }
  console.log("Gestores ok");

  // Lockers (estrutura)
  const lockers = buildLockers();

  for (const l of lockers) {
    await prisma.locker.upsert({
      where: { floor_keyNumber: { floor: l.floor, keyNumber: l.keyNumber } },
      update: { lab: l.lab, status: l.status, currentUserId: null },
      create: {
        floor: l.floor,
        keyNumber: l.keyNumber,
        lab: l.lab,
        status: l.status,
        currentUserId: null,
      },
    });
  }

  console.log(`Lockers ok (${lockers.length})`);

  await prisma.auditLog.create({
    data: {
      actorEmail: null,
      actorName: null,
      action: "DATA_IMPORT",
      entity: "SYSTEM",
      entityId: null,
      details: `Seed aplicado (gestores + lockers). Andares: ${FLOORS.join(", ")}. Chaves: ${KEY_RANGE.start}-${KEY_RANGE.end}.`,
    },
  });

  console.log("Seed finalizado!");
}

main()
  .catch((e) => {
    console.error("Seed falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
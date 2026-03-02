import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

async function main() {
  // Coloque seu SQL em um arquivo e execute por aqui.
  // Ex.: apps/api/src/prisma/seed.sql
  const sqlPath = join(process.cwd(), "src", "prisma", "alimentarBanco.sql");
  const sql = readFileSync(sqlPath, "utf8");

  // Usa queryRawUnsafe porque é SQL multi-statement (BEGIN/COMMIT etc).
  await prisma.$executeRawUnsafe(sql);

  console.log("Seed aplicado com seed.sql");
}

main()
  .catch((e) => {
    console.error("Seed falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
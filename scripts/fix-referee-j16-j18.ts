/**
 * Ajout des arbitres manquants pour J16 et J18 Top 14 2025-2026
 * J16 Racing 92 - USAP : Kévin Bralley
 * J18 Stade Français - USAP : Tual Trainini
 *
 * Exécution : npx tsx scripts/fix-referee-j16-j18.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Ajout arbitres J16 et J18 ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  // J16 — Kévin Bralley
  const bralley = await prisma.referee.findFirstOrThrow({
    where: { lastName: { contains: "Bralley", mode: "insensitive" } },
  });
  const matchJ16 = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 16, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  await prisma.match.update({
    where: { id: matchJ16.id },
    data: { refereeId: bralley.id },
  });
  console.log(`J16 ${matchJ16.opponent.name} : arbitre → ${bralley.firstName} ${bralley.lastName}`);

  // J18 — Tual Trainini
  const trainini = await prisma.referee.findFirstOrThrow({
    where: { lastName: { contains: "Trainini", mode: "insensitive" } },
  });
  const matchJ18 = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 18, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  await prisma.match.update({
    where: { id: matchJ18.id },
    data: { refereeId: trainini.id },
  });
  console.log(`J18 ${matchJ18.opponent.name} : arbitre → ${trainini.firstName} ${trainini.lastName}`);

  console.log("\n=== Terminé ===");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

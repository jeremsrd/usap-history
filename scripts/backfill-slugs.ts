// =============================================================================
// USAP HISTORY - Backfill des slugs pour joueurs et matchs existants
// Usage : npx tsx scripts/backfill-slugs.ts
// =============================================================================

import { PrismaClient } from "@prisma/client";
import { generatePlayerSlug, generateMatchSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

async function main() {
  // --- Backfill joueurs ---
  console.log("Backfill des slugs joueurs...");

  const players = await prisma.player.findMany({
    where: { slug: "" },
    select: { id: true, firstName: true, lastName: true },
  });

  for (const p of players) {
    const slug = generatePlayerSlug(p.firstName, p.lastName, p.id);
    await prisma.player.update({
      where: { id: p.id },
      data: { slug },
    });
  }
  console.log(`  ${players.length} joueur(s) mis à jour.`);

  // --- Backfill matchs ---
  console.log("Backfill des slugs matchs...");

  const matches = await prisma.match.findMany({
    where: { slug: "" },
    select: {
      id: true,
      date: true,
      isHome: true,
      matchday: true,
      round: true,
      competition: { select: { name: true, shortName: true } },
      opponent: { select: { name: true, shortName: true } },
    },
  });

  for (const m of matches) {
    const slug = generateMatchSlug({
      competitionShortName: m.competition.shortName,
      competitionName: m.competition.name,
      opponentShortName: m.opponent.shortName,
      opponentName: m.opponent.name,
      isHome: m.isHome,
      matchday: m.matchday,
      round: m.round,
      date: m.date,
    });
    await prisma.match.update({
      where: { id: m.id },
      data: { slug },
    });
  }
  console.log(`  ${matches.length} match(s) mis à jour.`);

  // --- Backfill arbitres ---
  console.log("Backfill des slugs arbitres...");

  const referees = await prisma.referee.findMany({
    where: { slug: "" },
    select: { id: true, firstName: true, lastName: true },
  });

  for (const r of referees) {
    const slug = generateRefereeSlug(r.firstName, r.lastName, r.id);
    await prisma.referee.update({
      where: { id: r.id },
      data: { slug },
    });
  }
  console.log(`  ${referees.length} arbitre(s) mis à jour.`);

  console.log("Backfill terminé.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

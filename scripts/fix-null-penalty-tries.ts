/**
 * Met à 0 les compteurs d'essais de pénalité restés `null`.
 *
 * `penaltyTriesUsap` et `penaltyTriesOpponent` sont nullables, et un `null`
 * n'est pas un zéro : une garde écrite `points <> score - 7 * penaltyTries`
 * ne compare alors rien du tout et laisse passer la ligne en silence. Tant
 * qu'un match garde ses compteurs à `null`, tous les contrôles de points
 * l'ignorent.
 *
 * Le script ne met à 0 que ce qu'il peut prouver : la somme des points des
 * joueurs du camp doit déjà retomber exactement sur le score. S'il manque
 * sept points, c'est qu'un essai de pénalité a bien été marqué et qu'il faut
 * le compter à la main, pas l'effacer d'un zéro.
 *
 * Usage :
 *   npx tsx scripts/fix-null-penalty-tries.ts --dry
 *   npx tsx scripts/fix-null-penalty-tries.ts
 *
 * Idempotent : un compteur déjà renseigné n'est jamais touché.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

async function main() {
  console.log(
    `=== Essais de pénalité restés nuls${DRY_RUN ? " (simulation)" : ""} ===\n`,
  );

  const matchs = await prisma.match.findMany({
    where: { OR: [{ penaltyTriesUsap: null }, { penaltyTriesOpponent: null }] },
    orderBy: { date: "asc" },
    include: {
      season: { select: { label: true } },
      opponent: { select: { name: true, shortName: true } },
    },
  });

  let corriges = 0;
  const laisses: string[] = [];

  for (const match of matchs) {
    const jour = match.date.toISOString().slice(0, 10);
    const etiquette = `${match.season.label} ${jour} ${(match.opponent.shortName ?? match.opponent.name).padEnd(16)}`;

    const data: { penaltyTriesUsap?: number; penaltyTriesOpponent?: number } = {};
    for (const camp of [
      { champ: "penaltyTriesUsap", isOpponent: false, score: match.scoreUsap },
      { champ: "penaltyTriesOpponent", isOpponent: true, score: match.scoreOpponent },
    ] as const) {
      if (match[camp.champ] != null) continue;
      const somme = await prisma.matchPlayer.aggregate({
        where: { matchId: match.id, isOpponent: camp.isOpponent },
        _sum: { totalPoints: true },
      });
      const points = somme._sum.totalPoints ?? 0;
      if (points === camp.score) data[camp.champ] = 0;
      else {
        laisses.push(
          `${etiquette} ${camp.champ} : ${points} points saisis pour ${camp.score} au score — ` +
            `l'écart demande un arbitrage`,
        );
      }
    }

    if (Object.keys(data).length === 0) continue;
    console.log(`${etiquette} → ${Object.keys(data).join(", ")} à 0`);
    if (!DRY_RUN) await prisma.match.update({ where: { id: match.id }, data });
    corriges++;
  }

  console.log(
    `\n=== ${corriges} match(s) ${DRY_RUN ? "à corriger" : "corrigés"}, ${laisses.length} laissé(s) de côté ===`,
  );
  for (const l of laisses) console.log(`  ⚠ ${l}`);
  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

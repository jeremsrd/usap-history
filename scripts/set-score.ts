/**
 * Pose le score d'une rencontre du calendrier en cours, depuis la LNR.
 *
 * Une saison entre en base avant de se jouer, sans score (cf.
 * `seed-calendrier-2026-2027.ts`), et rien dans la chaîne ne l'écrivait
 * ensuite : `seed-opponent-sheet.ts` et `seed-chronologie.ts` **exigent** le
 * score — c'est le total auquel ils confrontent tout ce qu'ils lisent — et
 * un match joué restait donc « à venir » jusqu'à ce qu'on l'écrive à la
 * main. Ce script est le premier temps du lendemain de match : le score du
 * calendrier officiel, qui fait foi, puis le résultat.
 *
 * Il ne touche ni aux bonus — `fix-bonus-points.ts` les recalcule une fois
 * les essais connus, après la feuille —, ni à la mi-temps ni à l'affluence,
 * que la LNR ne donne pas (cf. `set-annexe.ts`).
 *
 * Usage :
 *   npx tsx scripts/set-score.ts --match=2026-09-05 --dry
 *   npx tsx scripts/set-score.ts --match=2026-09-05
 *   npx tsx scripts/set-score.ts --match=2026-09-05 --force   # réécrit un score déjà posé
 */

import { PrismaClient, MatchResult } from "@prisma/client";
import { lireCalendrier, utiliserDivision } from "./lib/lnr";

const prisma = new PrismaClient();

function argument(nom: string): string | undefined {
  const prefixe = `--${nom}=`;
  return process.argv.find((a) => a.startsWith(prefixe))?.slice(prefixe.length);
}

async function main() {
  const dry = process.argv.includes("--dry");
  const force = process.argv.includes("--force");
  const jour = argument("match");
  if (!jour || !/^\d{4}-\d{2}-\d{2}$/.test(jour)) {
    console.error("Usage : npx tsx scripts/set-score.ts --match=AAAA-MM-JJ [--dry] [--force]");
    process.exit(1);
  }
  const debut = new Date(`${jour}T00:00:00Z`);
  const fin = new Date(debut.getTime() + 86_400_000);
  const matchs = await prisma.match.findMany({
    where: { date: { gte: debut, lt: fin } },
    include: { season: true, opponent: { select: { name: true, shortName: true } } },
  });
  if (matchs.length !== 1) {
    console.error(`${matchs.length} rencontre(s) le ${jour} — il en faut exactement une.`);
    process.exit(1);
  }
  const match = matchs[0];
  const affiche = match.isHome ? `USAP – ${match.opponent.name}` : `${match.opponent.name} – USAP`;
  if (match.scoreUsap != null && !force) {
    console.error(`${jour} ${affiche} : score déjà posé, ${match.scoreUsap}-${match.scoreOpponent}. Relancer avec --force pour le réécrire.`);
    process.exit(1);
  }
  if (!match.matchday) {
    console.error(`${jour} ${affiche} : pas de journée — ce script ne connaît que les journées du championnat.`);
    process.exit(1);
  }

  utiliserDivision(match.season.division === "PRO_D2" ? "prod2" : "top14");
  const rencontre = await lireCalendrier(match.season.label, `j${match.matchday}`);
  if (!rencontre) {
    console.error(`${jour} ${affiche} : la LNR ne publie pas encore le score de la J${match.matchday}.`);
    process.exit(1);
  }
  const scoreUsap = match.isHome ? rencontre.scoreRecevant : rencontre.scoreVisiteur;
  const scoreOpponent = match.isHome ? rencontre.scoreVisiteur : rencontre.scoreRecevant;
  const result = scoreUsap > scoreOpponent ? MatchResult.VICTOIRE : scoreUsap < scoreOpponent ? MatchResult.DEFAITE : MatchResult.NUL;

  console.log(`${dry ? "[dry] " : ""}${jour} ${affiche} : ${scoreUsap}-${scoreOpponent}, ${result} — ${rencontre.url}`);
  if (dry) return;
  await prisma.match.update({ where: { id: match.id }, data: { scoreUsap, scoreOpponent, result } });
  console.log("✔ score posé ; enchaîner seed-opponent-sheet --usap, seed-chronologie, puis fix-bonus-points.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

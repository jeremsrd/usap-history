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
 * **Et les compteurs de réalisations de chaque camp** — essais,
 * transformations, pénalités, drops, essais de pénalité —, lus sur les faits
 * de la feuille par `realisationsDepuisFaits`, comme le font les scripts de
 * saison. Sans eux, `fix-bonus-points.ts` ne peut pas décider du bonus
 * offensif, et la fiche de match n'a pas de détail du score : la première
 * journée 2026-2027 a été écrite sans, le 6 septembre 2026, avant qu'on s'en
 * aperçoive. Un camp dont les faits ne retombent pas sur le score reste à
 * `null`, et le script le dit.
 *
 * Il ne touche ni aux bonus — `fix-bonus-points.ts` les recalcule ensuite —,
 * ni à la mi-temps ni à l'affluence, que la LNR ne donne pas (cf.
 * `set-annexe.ts`).
 *
 * Usage :
 *   npx tsx scripts/set-score.ts --match=2026-09-05 --dry
 *   npx tsx scripts/set-score.ts --match=2026-09-05
 *   npx tsx scripts/set-score.ts --match=2026-09-05 --force   # réécrit un score déjà posé
 */

import { PrismaClient, MatchResult } from "@prisma/client";
import { lireCalendrier, lireFeuille, realisationsDepuisFaits, utiliserDivision, type Camp } from "./lib/lnr";

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

  // Les compteurs, camp par camp, et seulement s'ils retombent sur le score.
  const feuille = await lireFeuille(rencontre.url);
  const campUsap: Camp = match.isHome ? "home" : "away";
  const campAdverse: Camp = match.isHome ? "away" : "home";
  const usap = realisationsDepuisFaits(feuille.faits, campUsap, scoreUsap);
  const adverse = realisationsDepuisFaits(feuille.faits, campAdverse, scoreOpponent);
  const compteurs: Record<string, number | null> = {};
  for (const [camp, r, score, suffixe] of [
    ["USAP", usap, scoreUsap, "Usap"],
    [match.opponent.shortName ?? match.opponent.name, adverse, scoreOpponent, "Opponent"],
  ] as const) {
    if (r.total === score) {
      compteurs[`tries${suffixe}`] = r.essais;
      compteurs[`conversions${suffixe}`] = r.transformations;
      compteurs[`penalties${suffixe}`] = r.penalites;
      compteurs[`dropGoals${suffixe}`] = r.drops;
      compteurs[`penaltyTries${suffixe}`] = r.essaisDePenalite;
      console.log(`  ${camp} : ${r.essais} E, ${r.transformations} T, ${r.penalites} P, ${r.drops} D${r.essaisDePenalite ? `, ${r.essaisDePenalite} EP` : ""} — ${r.total} points, conforme`);
    } else {
      console.log(`  ⚠ ${camp} : ${r.total} points reconstitués pour ${score} au score — compteurs laissés à null`);
    }
  }

  if (dry) return;
  await prisma.match.update({ where: { id: match.id }, data: { scoreUsap, scoreOpponent, result, ...compteurs } });
  console.log("✔ score et compteurs posés ; enchaîner seed-opponent-sheet --usap, seed-chronologie, puis fix-bonus-points.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

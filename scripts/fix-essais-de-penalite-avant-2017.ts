/**
 * Range à part, dans `penaltyTries`, les essais de pénalité d'avant 2017-2018
 * que la base comptait parmi les essais.
 *
 * **Le 26 octobre 2026, Jérémy a rendu l'essai de pénalité à son époque** :
 * avant 2017-2018, il vaut un essai et se transforme, et sa transformation va
 * au buteur que la feuille nomme (cf. `baremeDeMatch`, `docs/decisions.md`).
 * La plupart des rencontres le rangeaient déjà dans `penaltyTries`, à sept
 * points ; elles se reprennent par la marche ordinaire — `set-score --force`,
 * `seed-opponent-sheet`, `seed-chronologie`. Celles-ci, non : leurs essais de
 * pénalité, comptés à cinq points comme il se doit, sont dans `tries`, avec
 * `penaltyTries` à zéro. Seuls les compteurs du match sont faux, les lignes
 * des joueurs et les chronologies sont justes.
 *
 *   - six rencontres de coupe d'Europe écrites par `seed-cup-espn.ts` : la
 *     feuille de l'ERC nomme l'essai de pénalité (2001, 2006, 2007), ou la
 *     chronologie du Match Centre le trahit par sa transformation (2010-2013) ;
 *   - Perpignan-Toulon du 5 novembre 2009, que la LNR omet et qu'ESPN donne
 *     (cf. `REALISATIONS_COMPLETEES`, `lib/feuilles.ts`).
 *
 * **Contrôles, camp par camp, avant d'écrire** : le compteur d'essais dépasse
 * d'autant la somme des lignes, `penaltyTries` est à zéro, et la somme des
 * points des lignes plus cinq par essai de pénalité vaut le score. Un camp
 * déjà corrigé ne passe plus le premier : le script est idempotent.
 *
 * Usage :
 *   npx tsx scripts/fix-essais-de-penalite-avant-2017.ts --dry
 *   npx tsx scripts/fix-essais-de-penalite-avant-2017.ts
 */

import { PrismaClient } from "@prisma/client";
import { journeeDeParis } from "./lib/dates";
import { baremeDeMatch } from "../src/lib/scoring";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry");

const A_CORRIGER: { jour: string; camp: "usap" | "adversaire"; essaisDePenalite: number; source: string }[] = [
  { jour: "2001-09-29", camp: "usap", essaisDePenalite: 1, source: "ERC, « Pen try »" },
  { jour: "2006-12-15", camp: "usap", essaisDePenalite: 1, source: "ERC, colonne des essais de pénalité" },
  { jour: "2007-12-09", camp: "adversaire", essaisDePenalite: 1, source: "ERC, colonne des essais de pénalité" },
  { jour: "2009-11-05", camp: "usap", essaisDePenalite: 1, source: "ESPN gameId=99380, 26e" },
  { jour: "2010-10-17", camp: "usap", essaisDePenalite: 1, source: "Match Centre de l'ERC, transformation orpheline de la 65e" },
  { jour: "2012-10-13", camp: "usap", essaisDePenalite: 1, source: "Match Centre de l'ERC, transformation orpheline de la 58e" },
  { jour: "2013-01-17", camp: "usap", essaisDePenalite: 1, source: "Match Centre de l'ERC, transformation orpheline de la 55e" },
];

async function main() {
  console.log(`=== Essais de pénalité d'avant 2017 sortis des essais${DRY_RUN ? " (simulation)" : ""} ===`);
  let corriges = 0;
  let dejaFaits = 0;
  const echecs: string[] = [];

  for (const c of A_CORRIGER) {
    const matchs = await prisma.match.findMany({
      where: { date: journeeDeParis(c.jour) },
      include: {
        season: { select: { startYear: true } },
        opponent: { select: { name: true } },
        players: { select: { isOpponent: true, tries: true, totalPoints: true } },
      },
    });
    if (matchs.length !== 1) {
      echecs.push(`${c.jour} : ${matchs.length} rencontre(s)`);
      continue;
    }
    const m = matchs[0];
    const etiquette = `${c.jour} ${m.opponent.name} (${c.camp})`;
    const bareme = baremeDeMatch(m.season.startYear);
    if (!bareme.essaiDePenaliteSeTransforme) {
      echecs.push(`${etiquette} : saison ${m.season.startYear}, l'essai de pénalité ne se transforme plus`);
      continue;
    }
    const usap = c.camp === "usap";
    const lignes = m.players.filter((l) => l.isOpponent === !usap);
    const essaisLignes = lignes.reduce((s, l) => s + l.tries, 0);
    const pointsLignes = lignes.reduce((s, l) => s + l.totalPoints, 0);
    const essais = usap ? m.triesUsap : m.triesOpponent;
    const ep = usap ? m.penaltyTriesUsap : m.penaltyTriesOpponent;
    const score = usap ? m.scoreUsap : m.scoreOpponent;

    if (essais === essaisLignes && ep === c.essaisDePenalite) {
      dejaFaits++;
      console.log(`  = ${etiquette} : déjà ${essais} E et ${ep} EP`);
      continue;
    }
    if (essais == null || score == null || essais - essaisLignes !== c.essaisDePenalite || (ep ?? 0) !== 0) {
      echecs.push(`${etiquette} : ${essais} E au compteur, ${essaisLignes} sur les lignes, ${ep} EP`);
      continue;
    }
    if (pointsLignes + bareme.essaiDePenalite * c.essaisDePenalite !== score) {
      echecs.push(`${etiquette} : ${pointsLignes} points sur les lignes + ${c.essaisDePenalite} EP pour ${score}`);
      continue;
    }

    console.log(`  ✎ ${etiquette} : ${essais} E → ${essais - c.essaisDePenalite} E + ${c.essaisDePenalite} EP — ${c.source}`);
    if (!DRY_RUN) {
      await prisma.match.update({
        where: { id: m.id },
        data: usap
          ? { triesUsap: essais - c.essaisDePenalite, penaltyTriesUsap: c.essaisDePenalite }
          : { triesOpponent: essais - c.essaisDePenalite, penaltyTriesOpponent: c.essaisDePenalite },
      });
    }
    corriges++;
  }

  for (const e of echecs) console.log(`  ✗ ${e}`);
  console.log(`=== ${corriges} corrigé(s), ${dejaFaits} déjà fait(s), ${echecs.length} en échec ===`);
  if (echecs.length > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

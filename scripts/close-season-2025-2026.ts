/**
 * Clôture de la saison 2025-2026 de l'USAP.
 *
 * À exécuter après scripts/seed-fin-saison-2025-2026.ts et
 * scripts/seed-access-match-2026.ts.
 *
 * - recalcule les statistiques agrégées à partir des 26 matchs de Top 14
 *   et vérifie qu'elles correspondent au classement final officiel ;
 * - fixe le classement final (13e), le maintien et l'absence de titre ;
 * - remplace les notes « saison en cours » par un bilan au passé ;
 * - renseigne le président (François Rivière) et corrige l'entraîneur
 *   principal de la saison : Laurent Labit, arrivé le 03/11/2025 en
 *   remplacement de Franck Azéma, a dirigé l'équipe sur 20 des 26 journées
 *   ainsi que sur l'access match (la table season_coaches conserve les
 *   deux passages avec leurs dates).
 *
 * Bilan Top 14 2025-2026 : 26J — 6V 0N 20D — 550 pts pour / 797 contre —
 * 1 BO, 4 BD — 29 points — 13e. Maintien acquis à l'access match.
 *
 * Sources : Wikipedia (classement final Top 14 2025-2026), top14.lnr.fr.
 *
 * Usage : npx tsx scripts/close-season-2025-2026.ts
 *
 * Idempotent.
 */

import { PrismaClient } from "@prisma/client";
import { matchPoints } from "../src/lib/scoring";

const prisma = new PrismaClient();

/** Classement final officiel, utilisé comme garde-fou sur le recalcul. */
const OFFICIEL = {
  matchesPlayed: 26,
  wins: 6,
  draws: 0,
  losses: 20,
  pointsFor: 550,
  pointsAgainst: 797,
  bonusOffensif: 1,
  bonusDefensif: 4,
  totalPoints: 29,
  finalRanking: 13,
};

const NOTES =
  "13e du Top 14, maintien acquis à l'access match contre Provence Rugby (47-24 à Aix-en-Provence). " +
  "Saison la plus difficile de l'ère récente : 6 victoires en 26 journées et 29 points seulement. " +
  "Début de saison catastrophique avec 11 défaites consécutives (J1-J11), qui coûte sa place à " +
  "Franck Azéma, remplacé par Laurent Labit le 3 novembre 2025. Le redressement est réel mais tardif : " +
  "première victoire à la J12 contre Clermont (26-20), exploit à Aimé-Giral face au Stade Toulousain, " +
  "champion en titre (30-27, J14), puis des succès contre Montauban (31-8), Pau (40-24), Toulon (36-20) " +
  "et Castres (29-27, J25), ce dernier décisif dans la course au maintien. " +
  "En Challenge Européen, l'USAP sort des poules avec une victoire (Dragons 41-17) et un nul (Lions 20-20) " +
  "avant d'être éliminée en huitième de finale à Montpellier (13-53). " +
  "Montauban, promu, termine dernier et redescend en Pro D2.";

async function main() {
  console.log("=== Clôture de la saison 2025-2026 ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  // ---- Recalcul depuis les matchs de Top 14 --------------------------------
  const matches = await prisma.match.findMany({
    where: { seasonId: season.id, competition: { shortName: "Top 14" } },
  });

  const calcule = {
    matchesPlayed: matches.length,
    wins: matches.filter((m) => m.result === "VICTOIRE").length,
    draws: matches.filter((m) => m.result === "NUL").length,
    losses: matches.filter((m) => m.result === "DEFAITE").length,
    pointsFor: matches.reduce((acc, m) => acc + m.scoreUsap, 0),
    pointsAgainst: matches.reduce((acc, m) => acc + m.scoreOpponent, 0),
    bonusOffensif: matches.filter((m) => m.bonusOffensif).length,
    bonusDefensif: matches.filter((m) => m.bonusDefensif).length,
  };
  // Barème dérivé de l'époque : le 4/2/0 ne vaut que depuis 2004-2005.
  const totalPoints = matches.reduce(
    (acc, m) => acc + matchPoints(m.result, m.bonusOffensif, m.bonusDefensif, season.startYear),
    0,
  );

  console.log("Recalcul depuis les matchs en base :");
  console.log(
    `  ${calcule.matchesPlayed}J ${calcule.wins}V ${calcule.draws}N ${calcule.losses}D — ` +
      `${calcule.pointsFor} pour / ${calcule.pointsAgainst} contre — ` +
      `${calcule.bonusOffensif} BO, ${calcule.bonusDefensif} BD — ${totalPoints} pts`,
  );

  // Garde-fou : refuse d'écrire si le recalcul diverge du classement officiel
  const ecarts = Object.entries({ ...calcule, totalPoints })
    .filter(([k, v]) => OFFICIEL[k as keyof typeof OFFICIEL] !== v)
    .map(([k, v]) => `${k}: calculé ${v} ≠ officiel ${OFFICIEL[k as keyof typeof OFFICIEL]}`);

  if (ecarts.length > 0) {
    console.error("\n❌ Le recalcul ne correspond pas au classement final officiel :");
    ecarts.forEach((e) => console.error(`   ${e}`));
    console.error("\nDes matchs sont manquants ou erronés — clôture annulée.");
    process.exit(1);
  }
  console.log("  ✔ conforme au classement final officiel\n");

  // ---- Staff ---------------------------------------------------------------
  const labit = await prisma.coach.findFirstOrThrow({
    where: { firstName: "Laurent", lastName: "Labit" },
  });
  const riviere = await prisma.president.findFirstOrThrow({
    where: { firstName: "François", lastName: "Rivière" },
  });

  // ---- Mise à jour ---------------------------------------------------------
  await prisma.season.update({
    where: { id: season.id },
    data: {
      ...calcule,
      totalPoints,
      finalRanking: OFFICIEL.finalRanking,
      champion: false,
      promoted: false,
      relegated: false,
      coachId: labit.id,
      presidentId: riviere.id,
      notes: NOTES,
    },
  });

  const total = await prisma.match.count({ where: { seasonId: season.id } });
  console.log("Saison 2025-2026 clôturée :");
  console.log(`  ${OFFICIEL.finalRanking}e du Top 14 — ${totalPoints} points — maintenue`);
  console.log("  Entraîneur principal : Laurent Labit");
  console.log("  Président : François Rivière");
  console.log(`  ${total} matchs en base (26 Top 14 + 5 Challenge Européen + 1 access match)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

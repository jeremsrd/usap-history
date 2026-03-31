/**
 * Seed saison 2022-2023 de l'USAP
 * Top 14 (26 journées) + Challenge Cup (4 matchs de poule) + Barrage maintien
 *
 * 13e du Top 14, 10V 0N 16D — 43 pts — Points marqués: 503, encaissés: 724
 * Challenge Cup : éliminé en phase de poule (0V 0N 4D)
 * Barrage maintien : victoire 33-19 à Grenoble → maintien en Top 14
 * Coach : Patrick Arlettaz
 *
 * Usage : npx tsx scripts/seed-2022-2023.ts
 *
 * Idempotent : supprime les matchs de la saison 2022-23 avant de recréer.
 */

import {
  PrismaClient,
  MatchResult,
  Continent,
} from "@prisma/client";
import {
  generateMatchSlug,
  generateOpponentSlug,
  generateCoachSlug,
} from "../src/lib/slugs";

const prisma = new PrismaClient();

// =============================================================================
// DONNÉES DES MATCHS
// =============================================================================

interface MatchData {
  matchday?: number;
  round?: string;
  date: string; // YYYY-MM-DD
  isHome: boolean;
  opponentName: string;
  scoreUsap: number;
  scoreOpp: number;
  competition: "TOP14" | "CHALLENGE" | "BARRAGE";
  isNeutralVenue?: boolean;
}

const MATCHES: MatchData[] = [
  // === TOP 14 — Phase aller ===
  { matchday: 1, date: "2022-09-03", isHome: false, opponentName: "Section Paloise", scoreUsap: 14, scoreOpp: 16, competition: "TOP14" },
  { matchday: 2, date: "2022-09-10", isHome: true, opponentName: "CA Brive", scoreUsap: 6, scoreOpp: 17, competition: "TOP14" },
  { matchday: 3, date: "2022-09-17", isHome: false, opponentName: "Stade Rochelais", scoreUsap: 8, scoreOpp: 43, competition: "TOP14" },
  { matchday: 4, date: "2022-09-24", isHome: true, opponentName: "RC Toulon", scoreUsap: 19, scoreOpp: 13, competition: "TOP14" },
  { matchday: 5, date: "2022-10-01", isHome: true, opponentName: "Castres Olympique", scoreUsap: 14, scoreOpp: 10, competition: "TOP14" },
  { matchday: 6, date: "2022-10-08", isHome: false, opponentName: "Stade Français Paris", scoreUsap: 3, scoreOpp: 52, competition: "TOP14" },
  { matchday: 7, date: "2022-10-15", isHome: true, opponentName: "ASM Clermont Auvergne", scoreUsap: 10, scoreOpp: 20, competition: "TOP14" },
  { matchday: 8, date: "2022-10-22", isHome: false, opponentName: "Aviron Bayonnais", scoreUsap: 20, scoreOpp: 24, competition: "TOP14" },
  { matchday: 9, date: "2022-10-29", isHome: true, opponentName: "Lyon OU", scoreUsap: 28, scoreOpp: 21, competition: "TOP14" },
  { matchday: 10, date: "2022-11-05", isHome: false, opponentName: "Racing 92", scoreUsap: 20, scoreOpp: 44, competition: "TOP14" },
  { matchday: 11, date: "2022-11-26", isHome: true, opponentName: "Union Bordeaux-Bègles", scoreUsap: 23, scoreOpp: 20, competition: "TOP14" },
  { matchday: 12, date: "2022-12-03", isHome: false, opponentName: "Stade Toulousain", scoreUsap: 13, scoreOpp: 34, competition: "TOP14" },
  { matchday: 13, date: "2022-12-23", isHome: false, opponentName: "Montpellier Hérault Rugby", scoreUsap: 10, scoreOpp: 38, competition: "TOP14" },

  // === TOP 14 — Phase retour ===
  { matchday: 14, date: "2022-12-31", isHome: true, opponentName: "Stade Rochelais", scoreUsap: 10, scoreOpp: 29, competition: "TOP14" },
  { matchday: 15, date: "2023-01-07", isHome: false, opponentName: "ASM Clermont Auvergne", scoreUsap: 20, scoreOpp: 31, competition: "TOP14" },
  { matchday: 16, date: "2023-01-28", isHome: true, opponentName: "Stade Français Paris", scoreUsap: 31, scoreOpp: 24, competition: "TOP14" },
  { matchday: 17, date: "2023-02-04", isHome: false, opponentName: "CA Brive", scoreUsap: 24, scoreOpp: 22, competition: "TOP14" },
  { matchday: 18, date: "2023-02-18", isHome: true, opponentName: "Section Paloise", scoreUsap: 49, scoreOpp: 29, competition: "TOP14" },
  { matchday: 19, date: "2023-02-25", isHome: false, opponentName: "Union Bordeaux-Bègles", scoreUsap: 7, scoreOpp: 43, competition: "TOP14" },
  { matchday: 20, date: "2023-03-04", isHome: true, opponentName: "Aviron Bayonnais", scoreUsap: 34, scoreOpp: 27, competition: "TOP14" },
  { matchday: 21, date: "2023-03-25", isHome: false, opponentName: "Montpellier Hérault Rugby", scoreUsap: 22, scoreOpp: 23, competition: "TOP14" },
  { matchday: 22, date: "2023-04-15", isHome: false, opponentName: "RC Toulon", scoreUsap: 15, scoreOpp: 37, competition: "TOP14" },
  { matchday: 23, date: "2023-04-22", isHome: true, opponentName: "Racing 92", scoreUsap: 30, scoreOpp: 21, competition: "TOP14" },
  { matchday: 24, date: "2023-05-06", isHome: false, opponentName: "Lyon OU", scoreUsap: 31, scoreOpp: 41, competition: "TOP14" },
  { matchday: 25, date: "2023-05-13", isHome: true, opponentName: "Stade Toulousain", scoreUsap: 26, scoreOpp: 21, competition: "TOP14" },
  { matchday: 26, date: "2023-05-28", isHome: false, opponentName: "Castres Olympique", scoreUsap: 16, scoreOpp: 26, competition: "TOP14" },

  // === CHALLENGE CUP — Phase de poules (Pool A) ===
  { round: "Poule J1", date: "2022-12-09", isHome: true, opponentName: "Bristol Bears", scoreUsap: 5, scoreOpp: 19, competition: "CHALLENGE" },
  { round: "Poule J2", date: "2022-12-16", isHome: false, opponentName: "Glasgow Warriors", scoreUsap: 18, scoreOpp: 26, competition: "CHALLENGE" },
  { round: "Poule J3", date: "2023-01-14", isHome: true, opponentName: "Glasgow Warriors", scoreUsap: 26, scoreOpp: 40, competition: "CHALLENGE" },
  { round: "Poule J4", date: "2023-01-20", isHome: false, opponentName: "Bristol Bears", scoreUsap: 19, scoreOpp: 33, competition: "CHALLENGE" },

  // === BARRAGE MAINTIEN ===
  { round: "Barrage", date: "2023-06-03", isHome: false, opponentName: "FC Grenoble Rugby", scoreUsap: 33, scoreOpp: 19, competition: "BARRAGE" },
];

// =============================================================================
// ADVERSAIRES
// =============================================================================

interface OpponentData {
  name: string;
  shortName: string;
  city: string;
  countryCode?: string; // Défaut: "FR"
  countryName?: string;
  continent?: Continent;
}

const OPPONENTS_DATA: OpponentData[] = [
  // Top 14 (réutilise ceux existants + nouveaux)
  { name: "Section Paloise", shortName: "Pau", city: "Pau" },
  { name: "CA Brive", shortName: "Brive", city: "Brive-la-Gaillarde" },
  { name: "Stade Rochelais", shortName: "La Rochelle", city: "La Rochelle" },
  { name: "RC Toulon", shortName: "Toulon", city: "Toulon" },
  { name: "Castres Olympique", shortName: "Castres", city: "Castres" },
  { name: "Stade Français Paris", shortName: "Stade Français", city: "Paris" },
  { name: "ASM Clermont Auvergne", shortName: "Clermont", city: "Clermont-Ferrand" },
  { name: "Aviron Bayonnais", shortName: "Bayonne", city: "Bayonne" },
  { name: "Lyon OU", shortName: "Lyon", city: "Lyon" },
  { name: "Racing 92", shortName: "Racing 92", city: "Nanterre" },
  { name: "Union Bordeaux-Bègles", shortName: "UBB", city: "Bordeaux" },
  { name: "Stade Toulousain", shortName: "Toulouse", city: "Toulouse" },
  { name: "Montpellier Hérault Rugby", shortName: "Montpellier", city: "Montpellier" },
  // Challenge Cup
  { name: "Bristol Bears", shortName: "Bristol", city: "Bristol", countryCode: "GB", countryName: "Angleterre", continent: Continent.EUROPE },
  { name: "Glasgow Warriors", shortName: "Glasgow", city: "Glasgow", countryCode: "SC", countryName: "Écosse", continent: Continent.EUROPE },
  // Barrage
  { name: "FC Grenoble Rugby", shortName: "Grenoble", city: "Grenoble" },
];

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

async function findOrCreateCountry(
  code: string,
  name: string,
  continent: Continent,
): Promise<string> {
  // Chercher par code ou par nom
  const existing = await prisma.country.findFirst({
    where: { OR: [{ code }, { name: { equals: name, mode: "insensitive" } }] },
  });
  if (existing) return existing.id;
  const country = await prisma.country.create({
    data: { name, code, continent },
  });
  console.log(`  [pays] Créé : ${name} (${code})`);
  return country.id;
}

async function findOrCreateOpponent(
  data: OpponentData,
  defaultCountryId: string,
): Promise<{ id: string; name: string; shortName: string | null }> {
  const existing = await prisma.opponent.findFirst({
    where: { name: { equals: data.name, mode: "insensitive" } },
  });
  if (existing) {
    console.log(`  [adversaire] Existe : ${data.name}`);
    return { id: existing.id, name: existing.name, shortName: existing.shortName };
  }

  let countryId = defaultCountryId;
  if (data.countryCode && data.countryCode !== "FR") {
    countryId = await findOrCreateCountry(
      data.countryCode,
      data.countryName || data.city,
      data.continent || Continent.EUROPE,
    );
  }

  const opp = await prisma.opponent.create({
    data: {
      name: data.name,
      shortName: data.shortName,
      city: data.city,
      countryId,
      slug: `temp-${Date.now()}-${Math.random()}`,
    },
  });
  await prisma.opponent.update({
    where: { id: opp.id },
    data: { slug: generateOpponentSlug(data.name, opp.id) },
  });
  console.log(`  [adversaire] Créé : ${data.name}`);
  return { id: opp.id, name: opp.name, shortName: opp.shortName };
}

function computeResult(scoreUsap: number, scoreOpp: number): {
  result: MatchResult;
  bonusDefensif: boolean;
} {
  if (scoreUsap > scoreOpp) {
    return { result: MatchResult.VICTOIRE, bonusDefensif: false };
  }
  if (scoreUsap < scoreOpp) {
    const margin = scoreOpp - scoreUsap;
    return { result: MatchResult.DEFAITE, bonusDefensif: margin <= 7 };
  }
  return { result: MatchResult.NUL, bonusDefensif: false };
}

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log("=== Seed Saison 2022-2023 USAP ===\n");

  // 1. Trouver la saison 2022-2023
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2022, endYear: 2023 },
  });
  console.log(`Saison : ${season.label} (${season.id})\n`);

  // 2. Trouver les compétitions
  const top14 = await prisma.competition.findFirstOrThrow({
    where: { shortName: "Top 14" },
  });
  const challengeCup = await prisma.competition.findFirstOrThrow({
    where: { type: "CHALLENGE_EUROPE" },
  });
  // Pour le barrage, on utilise Top 14 (c'est un match de barrage Top 14 / Pro D2)
  console.log(`Compétitions : ${top14.shortName}, ${challengeCup.shortName}\n`);

  // 3. Trouver/créer le coach Patrick Arlettaz
  let arlettaz = await prisma.coach.findFirst({
    where: { lastName: { equals: "Arlettaz", mode: "insensitive" } },
  });
  if (!arlettaz) {
    arlettaz = await prisma.coach.create({
      data: {
        firstName: "Patrick",
        lastName: "Arlettaz",
        role: "Entraîneur principal",
        slug: `temp-${Date.now()}`,
        biography: "Entraîneur de l'USAP. Ancien joueur et entraîneur catalan.",
      },
    });
    await prisma.coach.update({
      where: { id: arlettaz.id },
      data: { slug: generateCoachSlug("Patrick", "Arlettaz", arlettaz.id) },
    });
    console.log("Coach créé : Patrick Arlettaz");
  } else {
    console.log("Coach trouvé : Patrick Arlettaz");
  }

  // 4. Stade Aimé-Giral
  const aimeGiral = await prisma.venue.findFirst({
    where: { name: { contains: "Giral" } },
  });
  console.log(`Stade domicile : ${aimeGiral?.name || "Non trouvé"}\n`);

  // 5. Pays France
  const france = await prisma.country.findFirstOrThrow({
    where: { code: "FR" },
  });

  // 6. Nettoyage des données 2022-23 existantes
  console.log("--- Nettoyage ---");
  const existingMatchIds = (
    await prisma.match.findMany({
      where: { seasonId: season.id },
      select: { id: true },
    })
  ).map((m) => m.id);

  if (existingMatchIds.length > 0) {
    await prisma.matchEvent.deleteMany({
      where: { matchId: { in: existingMatchIds } },
    });
    await prisma.matchPlayer.deleteMany({
      where: { matchId: { in: existingMatchIds } },
    });
    await prisma.match.deleteMany({
      where: { seasonId: season.id },
    });
    console.log(`  ${existingMatchIds.length} match(s) supprimé(s)`);
  } else {
    console.log("  Aucun match existant");
  }
  console.log("");

  // 7. Créer/trouver les adversaires
  console.log("--- Adversaires ---");
  const opponentMap: Record<string, { id: string; name: string; shortName: string | null }> = {};

  for (const oppData of OPPONENTS_DATA) {
    const opp = await findOrCreateOpponent(oppData, france.id);
    opponentMap[oppData.name] = opp;
  }
  console.log(`  ${Object.keys(opponentMap).length} adversaires prêts\n`);

  // 8. Créer les matchs
  console.log("--- Matchs ---");

  let matchCount = 0;
  for (const m of MATCHES) {
    const opponent = opponentMap[m.opponentName];
    if (!opponent) {
      console.error(`  ERREUR: adversaire "${m.opponentName}" non trouvé !`);
      continue;
    }

    // Compétition (barrage = Top 14)
    const competition = m.competition === "CHALLENGE" ? challengeCup : top14;
    const competitionId = competition.id;

    const { result, bonusDefensif } = computeResult(m.scoreUsap, m.scoreOpp);

    const slug = generateMatchSlug({
      competitionShortName: competition.shortName,
      competitionName: competition.name,
      opponentShortName: opponent.shortName,
      opponentName: opponent.name,
      isHome: m.isHome,
      matchday: m.matchday ?? null,
      round: m.round ?? null,
      date: new Date(m.date),
    });

    const venueId = m.isHome && aimeGiral ? aimeGiral.id : null;

    await prisma.match.create({
      data: {
        slug,
        date: new Date(m.date),
        seasonId: season.id,
        competitionId,
        matchday: m.matchday ?? null,
        round: m.round ?? null,
        isHome: m.isHome,
        venueId,
        isNeutralVenue: m.isNeutralVenue ?? false,
        opponentId: opponent.id,
        scoreUsap: m.scoreUsap,
        scoreOpponent: m.scoreOpp,
        result,
        bonusOffensif: false,
        bonusDefensif,
      },
    });

    const icon = result === MatchResult.VICTOIRE ? "V" : result === MatchResult.DEFAITE ? "D" : "N";
    const bd = bonusDefensif ? " (BD)" : "";
    const compLabel = m.competition === "CHALLENGE" ? "CC" : m.competition === "BARRAGE" ? "BAR" : "T14";
    const phase = m.matchday ? `J${m.matchday}` : m.round;
    console.log(
      `  [${compLabel}] ${phase} ${m.isHome ? "DOM" : "EXT"} vs ${opponent.shortName || opponent.name} : ${m.scoreUsap}-${m.scoreOpp} [${icon}]${bd}`,
    );
    matchCount++;
  }
  console.log(`\n  ${matchCount} matchs créés\n`);

  // 9. Mettre à jour les stats de la saison
  console.log("--- Mise à jour saison ---");

  const top14Matches = MATCHES.filter((m) => m.competition === "TOP14");
  const wins = top14Matches.filter((m) => m.scoreUsap > m.scoreOpp).length;
  const draws = top14Matches.filter((m) => m.scoreUsap === m.scoreOpp).length;
  const losses = top14Matches.filter((m) => m.scoreUsap < m.scoreOpp).length;
  const pointsFor = top14Matches.reduce((acc, m) => acc + m.scoreUsap, 0);
  const pointsAgainst = top14Matches.reduce((acc, m) => acc + m.scoreOpp, 0);
  const bonusDef = top14Matches.filter((m) => {
    if (m.scoreUsap >= m.scoreOpp) return false;
    return m.scoreOpp - m.scoreUsap <= 7;
  }).length;
  const totalPoints = wins * 4 + draws * 2 + bonusDef;

  await prisma.season.update({
    where: { id: season.id },
    data: {
      finalRanking: 13,
      matchesPlayed: top14Matches.length,
      wins,
      draws,
      losses,
      pointsFor,
      pointsAgainst,
      bonusOffensif: 0,
      bonusDefensif: bonusDef,
      totalPoints,
      coachId: arlettaz.id,
      notes:
        "13e du Top 14. Saison difficile, maintien obtenu via barrage contre Grenoble (33-19). " +
        "Une seule victoire à l'extérieur en Top 14 : 24-22 à Brive (J17, match de la peur). " +
        "Éliminé en phase de poules de Challenge Cup (0V 4D, Pool A avec Bristol et Glasgow). " +
        "Belles victoires à domicile : 49-29 vs Pau (J18), 26-21 vs Toulouse (J25), 30-21 vs Racing (J23). " +
        "Coach : Patrick Arlettaz.",
    },
  });

  console.log(`  Classement : 13e`);
  console.log(`  Bilan : ${wins}V ${draws}N ${losses}D`);
  console.log(`  Points : ${totalPoints} (${bonusDef} BD)`);
  console.log(`  Score : ${pointsFor} marqués, ${pointsAgainst} encaissés (diff: ${pointsFor - pointsAgainst})`);
  console.log(`  Coach : Patrick Arlettaz`);

  console.log("\n=== Seed 2022-2023 terminé ! ===");
  console.log(`  ${matchCount} matchs (26 Top 14 + 4 Challenge Cup + 1 Barrage)`);
  console.log(`  ${Object.keys(opponentMap).length} adversaires`);
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

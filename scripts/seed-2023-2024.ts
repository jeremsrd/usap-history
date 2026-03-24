/**
 * Seed saison 2023-2024 de l'USAP
 * Top 14 (26 journées) + Challenge Cup (4 matchs de poule)
 *
 * 10e du Top 14, 13V 0N 13D — 58 pts — Points marqués: 634, encaissés: 701
 * Challenge Cup : éliminé en phase de poule (0V 0N 4D)
 * Coach : Franck Azéma
 *
 * Usage : npx tsx scripts/seed-2023-2024.ts
 *
 * Idempotent : supprime les matchs de la saison 2023-24 avant de recréer.
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
  competition: "TOP14" | "CHALLENGE";
  isNeutralVenue?: boolean;
}

const MATCHES: MatchData[] = [
  // === TOP 14 — Phase aller ===
  { matchday: 1, date: "2023-08-19", isHome: true, opponentName: "Stade Français Paris", scoreUsap: 7, scoreOpp: 29, competition: "TOP14" },
  { matchday: 2, date: "2023-08-26", isHome: false, opponentName: "ASM Clermont Auvergne", scoreUsap: 14, scoreOpp: 38, competition: "TOP14" },
  { matchday: 3, date: "2023-09-02", isHome: false, opponentName: "Racing 92", scoreUsap: 10, scoreOpp: 59, competition: "TOP14" },
  // --- Coupure Coupe du Monde 2023 (sept-oct) ---
  { matchday: 4, date: "2023-10-29", isHome: true, opponentName: "Section Paloise", scoreUsap: 24, scoreOpp: 39, competition: "TOP14" },
  { matchday: 5, date: "2023-11-04", isHome: true, opponentName: "RC Toulon", scoreUsap: 26, scoreOpp: 22, competition: "TOP14" },
  { matchday: 6, date: "2023-11-11", isHome: false, opponentName: "Stade Toulousain", scoreUsap: 34, scoreOpp: 43, competition: "TOP14" },
  { matchday: 7, date: "2023-11-18", isHome: true, opponentName: "Montpellier Hérault Rugby", scoreUsap: 23, scoreOpp: 16, competition: "TOP14" },
  { matchday: 8, date: "2023-11-25", isHome: false, opponentName: "Union Bordeaux-Bègles", scoreUsap: 22, scoreOpp: 46, competition: "TOP14" },
  { matchday: 9, date: "2023-12-02", isHome: false, opponentName: "Stade Rochelais", scoreUsap: 6, scoreOpp: 35, competition: "TOP14" },
  { matchday: 10, date: "2023-12-22", isHome: true, opponentName: "Aviron Bayonnais", scoreUsap: 36, scoreOpp: 10, competition: "TOP14" },
  { matchday: 11, date: "2023-12-31", isHome: false, opponentName: "Castres Olympique", scoreUsap: 17, scoreOpp: 13, competition: "TOP14" },
  { matchday: 12, date: "2024-01-06", isHome: true, opponentName: "US Oyonnax", scoreUsap: 27, scoreOpp: 12, competition: "TOP14" },
  { matchday: 13, date: "2024-01-27", isHome: false, opponentName: "Lyon OU", scoreUsap: 24, scoreOpp: 36, competition: "TOP14" },

  // === TOP 14 — Phase retour ===
  { matchday: 14, date: "2024-02-03", isHome: true, opponentName: "Racing 92", scoreUsap: 26, scoreOpp: 5, competition: "TOP14" },
  { matchday: 15, date: "2024-02-17", isHome: false, opponentName: "Stade Français Paris", scoreUsap: 19, scoreOpp: 32, competition: "TOP14" },
  { matchday: 16, date: "2024-02-24", isHome: true, opponentName: "Stade Rochelais", scoreUsap: 27, scoreOpp: 15, competition: "TOP14" },
  { matchday: 17, date: "2024-03-02", isHome: false, opponentName: "RC Toulon", scoreUsap: 22, scoreOpp: 44, competition: "TOP14" },
  { matchday: 18, date: "2024-03-09", isHome: true, opponentName: "Stade Toulousain", scoreUsap: 27, scoreOpp: 17, competition: "TOP14" },
  { matchday: 19, date: "2024-03-23", isHome: false, opponentName: "US Oyonnax", scoreUsap: 15, scoreOpp: 14, competition: "TOP14" },
  { matchday: 20, date: "2024-03-30", isHome: true, opponentName: "Castres Olympique", scoreUsap: 43, scoreOpp: 12, competition: "TOP14" },
  { matchday: 21, date: "2024-04-20", isHome: true, opponentName: "Lyon OU", scoreUsap: 51, scoreOpp: 20, competition: "TOP14" },
  { matchday: 22, date: "2024-04-27", isHome: false, opponentName: "Montpellier Hérault Rugby", scoreUsap: 25, scoreOpp: 20, competition: "TOP14" },
  { matchday: 23, date: "2024-05-11", isHome: true, opponentName: "ASM Clermont Auvergne", scoreUsap: 28, scoreOpp: 35, competition: "TOP14" },
  { matchday: 24, date: "2024-05-18", isHome: false, opponentName: "Aviron Bayonnais", scoreUsap: 20, scoreOpp: 23, competition: "TOP14" },
  { matchday: 25, date: "2024-06-01", isHome: true, opponentName: "Union Bordeaux-Bègles", scoreUsap: 37, scoreOpp: 30, competition: "TOP14" },
  { matchday: 26, date: "2024-06-08", isHome: false, opponentName: "Section Paloise", scoreUsap: 24, scoreOpp: 36, competition: "TOP14" },

  // === CHALLENGE CUP — Phase de poules ===
  { round: "Poule J1", date: "2023-12-10", isHome: true, opponentName: "Emirates Lions", scoreUsap: 12, scoreOpp: 28, competition: "CHALLENGE" },
  { round: "Poule J2", date: "2023-12-16", isHome: false, opponentName: "Benetton Rugby", scoreUsap: 7, scoreOpp: 29, competition: "CHALLENGE" },
  { round: "Poule J3", date: "2024-01-12", isHome: false, opponentName: "Ospreys", scoreUsap: 3, scoreOpp: 25, competition: "CHALLENGE" },
  { round: "Poule J4", date: "2024-01-21", isHome: true, opponentName: "Newcastle Falcons", scoreUsap: 23, scoreOpp: 32, competition: "CHALLENGE" },
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
  // Top 14
  { name: "Stade Français Paris", shortName: "Stade Français", city: "Paris" },
  { name: "ASM Clermont Auvergne", shortName: "Clermont", city: "Clermont-Ferrand" },
  { name: "Racing 92", shortName: "Racing 92", city: "Nanterre" },
  { name: "Section Paloise", shortName: "Pau", city: "Pau" },
  { name: "RC Toulon", shortName: "Toulon", city: "Toulon" },
  { name: "Stade Toulousain", shortName: "Toulouse", city: "Toulouse" },
  { name: "Montpellier Hérault Rugby", shortName: "Montpellier", city: "Montpellier" },
  { name: "Union Bordeaux-Bègles", shortName: "UBB", city: "Bordeaux" },
  { name: "Stade Rochelais", shortName: "La Rochelle", city: "La Rochelle" },
  { name: "Aviron Bayonnais", shortName: "Bayonne", city: "Bayonne" },
  { name: "Castres Olympique", shortName: "Castres", city: "Castres" },
  { name: "US Oyonnax", shortName: "Oyonnax", city: "Oyonnax" },
  { name: "Lyon OU", shortName: "Lyon", city: "Lyon" },
  // Challenge Cup
  { name: "Emirates Lions", shortName: "Lions", city: "Johannesburg", countryCode: "ZA", countryName: "Afrique du Sud", continent: Continent.AFRIQUE },
  { name: "Benetton Rugby", shortName: "Benetton", city: "Trévise", countryCode: "IT", countryName: "Italie", continent: Continent.EUROPE },
  { name: "Ospreys", shortName: "Ospreys", city: "Swansea", countryCode: "WA", countryName: "Pays de Galles", continent: Continent.EUROPE },
  { name: "Newcastle Falcons", shortName: "Newcastle", city: "Newcastle", countryCode: "GB", countryName: "Angleterre", continent: Continent.EUROPE },
];

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/** Trouve ou crée un pays par code ISO */
async function findOrCreateCountry(
  code: string,
  name: string,
  continent: Continent,
): Promise<string> {
  const existing = await prisma.country.findFirst({ where: { code } });
  if (existing) return existing.id;

  const country = await prisma.country.create({
    data: { name, code, continent },
  });
  console.log(`  [pays] Créé : ${name} (${code})`);
  return country.id;
}

/** Trouve ou crée un adversaire par nom */
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

  // Déterminer le pays
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

  // Slug définitif
  await prisma.opponent.update({
    where: { id: opp.id },
    data: { slug: generateOpponentSlug(data.name, opp.id) },
  });

  console.log(`  [adversaire] Créé : ${data.name}`);
  return { id: opp.id, name: opp.name, shortName: opp.shortName };
}

/** Calcule le résultat et les bonus */
function computeResult(scoreUsap: number, scoreOpp: number): {
  result: MatchResult;
  bonusDefensif: boolean;
} {
  if (scoreUsap > scoreOpp) {
    return { result: MatchResult.VICTOIRE, bonusDefensif: false };
  }
  if (scoreUsap < scoreOpp) {
    const margin = scoreOpp - scoreUsap;
    return { result: MatchResult.DEFAITE, bonusDefensif: margin <= 5 };
  }
  return { result: MatchResult.NUL, bonusDefensif: false };
}

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log("=== Seed Saison 2023-2024 USAP ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver la saison 2023-2024
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  console.log(`Saison : ${season.label} (${season.id})\n`);

  // -------------------------------------------------------------------------
  // 2. Trouver les compétitions
  // -------------------------------------------------------------------------
  const top14 = await prisma.competition.findFirstOrThrow({
    where: { shortName: "Top 14" },
  });
  const challengeCup = await prisma.competition.findFirstOrThrow({
    where: { type: "CHALLENGE_EUROPE" },
  });
  console.log(`Compétitions : ${top14.shortName}, ${challengeCup.shortName}\n`);

  // -------------------------------------------------------------------------
  // 3. Trouver/créer le coach Franck Azéma
  // -------------------------------------------------------------------------
  let azema = await prisma.coach.findFirst({
    where: { lastName: { equals: "Azéma", mode: "insensitive" } },
  });
  if (!azema) {
    azema = await prisma.coach.create({
      data: {
        firstName: "Franck",
        lastName: "Azéma",
        role: "Manager général",
        slug: `temp-${Date.now()}`,
        biography: "Manager général de l'USAP. Ancien entraîneur de Clermont.",
      },
    });
    await prisma.coach.update({
      where: { id: azema.id },
      data: { slug: generateCoachSlug("Franck", "Azéma", azema.id) },
    });
    console.log("Coach créé : Franck Azéma");
  } else {
    console.log("Coach trouvé : Franck Azéma");
  }

  // -------------------------------------------------------------------------
  // 4. Trouver le stade Aimé-Giral
  // -------------------------------------------------------------------------
  const aimeGiral = await prisma.venue.findFirst({
    where: { name: { contains: "Giral" } },
  });
  console.log(`Stade domicile : ${aimeGiral?.name || "Non trouvé"}\n`);

  // -------------------------------------------------------------------------
  // 5. Pays France (par défaut pour les adversaires)
  // -------------------------------------------------------------------------
  const france = await prisma.country.findFirstOrThrow({
    where: { code: "FR" },
  });

  // -------------------------------------------------------------------------
  // 6. Nettoyage des données 2023-24 existantes
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 7. Créer/trouver les adversaires
  // -------------------------------------------------------------------------
  console.log("--- Adversaires ---");
  const opponentMap: Record<string, { id: string; name: string; shortName: string | null }> = {};

  for (const oppData of OPPONENTS_DATA) {
    const opp = await findOrCreateOpponent(oppData, france.id);
    opponentMap[oppData.name] = opp;
  }
  console.log(`  ${Object.keys(opponentMap).length} adversaires prêts\n`);

  // -------------------------------------------------------------------------
  // 8. Créer les matchs
  // -------------------------------------------------------------------------
  console.log("--- Matchs ---");

  let matchCount = 0;
  for (const m of MATCHES) {
    const opponent = opponentMap[m.opponentName];
    if (!opponent) {
      console.error(`  ERREUR: adversaire "${m.opponentName}" non trouvé !`);
      continue;
    }

    // Compétition
    const competition = m.competition === "CHALLENGE" ? challengeCup : top14;
    const competitionId = competition.id;

    // Résultat et bonus
    const { result, bonusDefensif } = computeResult(m.scoreUsap, m.scoreOpp);

    // Slug
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

    // Venue : Aimé-Giral pour les matchs à domicile
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
    const compLabel = m.competition === "CHALLENGE" ? "CC" : "T14";
    const phase = m.matchday ? `J${m.matchday}` : m.round;
    console.log(
      `  [${compLabel}] ${phase} ${m.isHome ? "DOM" : "EXT"} vs ${opponent.shortName || opponent.name} : ${m.scoreUsap}-${m.scoreOpp} [${icon}]${bd}`,
    );
    matchCount++;
  }
  console.log(`\n  ${matchCount} matchs créés\n`);

  // -------------------------------------------------------------------------
  // 9. Mettre à jour les stats de la saison
  // -------------------------------------------------------------------------
  console.log("--- Mise à jour saison ---");

  // Stats Top 14 uniquement
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
      finalRanking: 10,
      matchesPlayed: top14Matches.length,
      wins,
      draws,
      losses,
      pointsFor,
      pointsAgainst,
      bonusOffensif: 0,
      bonusDefensif: bonusDef,
      totalPoints,
      coachId: azema.id,
      notes:
        "10e du Top 14. Saison marquée par la coupure Coupe du Monde 2023. " +
        "Début catastrophique (4 défaites en 4 matchs) puis remontée spectaculaire. " +
        "Phase retour remarquable : 51-20 vs Lyon (J21), 27-17 vs Toulouse (J18), 26-5 vs Racing (J14). " +
        "Éliminé en phase de poules de Challenge Cup (0V 4D). " +
        "Coach : Franck Azéma (1ère saison).",
    },
  });

  console.log(`  Classement : 10e`);
  console.log(`  Bilan : ${wins}V ${draws}N ${losses}D`);
  console.log(`  Points : ${totalPoints} (${bonusDef} BD)`);
  console.log(`  Score : ${pointsFor} marqués, ${pointsAgainst} encaissés (diff: ${pointsFor - pointsAgainst})`);
  console.log(`  Coach : Franck Azéma`);

  console.log("\n=== Seed 2023-2024 terminé ! ===");
  console.log(`  ${matchCount} matchs`);
  console.log(`  ${Object.keys(opponentMap).length} adversaires`);
}

main()
  .catch((e) => {
    console.error("Erreur fatale :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

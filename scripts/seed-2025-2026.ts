/**
 * Seed saison 2025-2026 de l'USAP
 * Top 14 (18 journées jouées sur 26) + Challenge Cup (4 matchs de poule)
 *
 * SAISON EN COURS — Données au 12/03/2026
 * 13e du Top 14 — 18 pts — 4V 14D
 * Coach : Franck Azéma
 *
 * Usage : npx tsx scripts/seed-2025-2026.ts
 *
 * Idempotent : supprime les matchs et liens joueurs-saison 2025-26 avant de recréer.
 */

import {
  PrismaClient,
  Position,
  MatchResult,
  Continent,
} from "@prisma/client";
import {
  generateMatchSlug,
  generatePlayerSlug,
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
  { matchday: 1, date: "2025-09-06", isHome: true, opponentName: "Aviron Bayonnais", scoreUsap: 19, scoreOpp: 26, competition: "TOP14" },
  { matchday: 2, date: "2025-09-13", isHome: false, opponentName: "Stade Toulousain", scoreUsap: 13, scoreOpp: 31, competition: "TOP14" },
  { matchday: 3, date: "2025-09-20", isHome: true, opponentName: "Racing 92", scoreUsap: 15, scoreOpp: 28, competition: "TOP14" },
  { matchday: 4, date: "2025-09-27", isHome: false, opponentName: "Stade Rochelais", scoreUsap: 8, scoreOpp: 31, competition: "TOP14" },
  { matchday: 5, date: "2025-10-04", isHome: true, opponentName: "Stade Français Paris", scoreUsap: 11, scoreOpp: 28, competition: "TOP14" },
  { matchday: 6, date: "2025-10-11", isHome: false, opponentName: "Lyon OU", scoreUsap: 19, scoreOpp: 44, competition: "TOP14" },
  { matchday: 7, date: "2025-10-18", isHome: true, opponentName: "Union Bordeaux-Bègles", scoreUsap: 12, scoreOpp: 27, competition: "TOP14" },
  { matchday: 8, date: "2025-10-25", isHome: false, opponentName: "US Montauban", scoreUsap: 22, scoreOpp: 29, competition: "TOP14" },
  { matchday: 9, date: "2025-11-01", isHome: false, opponentName: "Section Paloise", scoreUsap: 23, scoreOpp: 27, competition: "TOP14" },
  { matchday: 10, date: "2025-11-22", isHome: true, opponentName: "Montpellier Hérault Rugby", scoreUsap: 0, scoreOpp: 28, competition: "TOP14" },
  { matchday: 11, date: "2025-11-29", isHome: false, opponentName: "Castres Olympique", scoreUsap: 7, scoreOpp: 23, competition: "TOP14" },
  { matchday: 12, date: "2025-12-20", isHome: true, opponentName: "ASM Clermont Auvergne", scoreUsap: 26, scoreOpp: 20, competition: "TOP14" },
  { matchday: 13, date: "2025-12-28", isHome: false, opponentName: "RC Toulon", scoreUsap: 16, scoreOpp: 31, competition: "TOP14" },

  // === TOP 14 — Phase retour ===
  { matchday: 14, date: "2026-01-03", isHome: true, opponentName: "Stade Toulousain", scoreUsap: 30, scoreOpp: 27, competition: "TOP14" },
  { matchday: 15, date: "2026-01-24", isHome: true, opponentName: "US Montauban", scoreUsap: 31, scoreOpp: 8, competition: "TOP14" },
  { matchday: 16, date: "2026-01-31", isHome: false, opponentName: "Racing 92", scoreUsap: 31, scoreOpp: 37, competition: "TOP14" },
  { matchday: 17, date: "2026-02-22", isHome: true, opponentName: "Section Paloise", scoreUsap: 40, scoreOpp: 24, competition: "TOP14" },
  { matchday: 18, date: "2026-02-28", isHome: false, opponentName: "Stade Français Paris", scoreUsap: 21, scoreOpp: 42, competition: "TOP14" },

  // === CHALLENGE CUP — Phase de poule ===
  { round: "Poule J1", date: "2025-12-07", isHome: true, opponentName: "Dragons RFC", scoreUsap: 41, scoreOpp: 17, competition: "CHALLENGE" },
  { round: "Poule J2", date: "2025-12-13", isHome: false, opponentName: "Benetton Rugby", scoreUsap: 31, scoreOpp: 44, competition: "CHALLENGE" },
  { round: "Poule J3", date: "2026-01-10", isHome: false, opponentName: "Newcastle Falcons", scoreUsap: 19, scoreOpp: 26, competition: "CHALLENGE" },
  { round: "Poule J4", date: "2026-01-17", isHome: true, opponentName: "Lions", scoreUsap: 20, scoreOpp: 20, competition: "CHALLENGE" },
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
  { name: "Aviron Bayonnais", shortName: "Bayonne", city: "Bayonne" },
  { name: "Stade Toulousain", shortName: "Toulouse", city: "Toulouse" },
  { name: "Racing 92", shortName: "Racing 92", city: "Nanterre" },
  { name: "Stade Rochelais", shortName: "La Rochelle", city: "La Rochelle" },
  { name: "Stade Français Paris", shortName: "Stade Français", city: "Paris" },
  { name: "Lyon OU", shortName: "Lyon", city: "Lyon" },
  { name: "Union Bordeaux-Bègles", shortName: "UBB", city: "Bordeaux" },
  { name: "US Montauban", shortName: "Montauban", city: "Montauban" },
  { name: "Section Paloise", shortName: "Pau", city: "Pau" },
  { name: "Montpellier Hérault Rugby", shortName: "Montpellier", city: "Montpellier" },
  { name: "Castres Olympique", shortName: "Castres", city: "Castres" },
  { name: "ASM Clermont Auvergne", shortName: "Clermont", city: "Clermont-Ferrand" },
  { name: "RC Toulon", shortName: "Toulon", city: "Toulon" },
  // Challenge Cup
  { name: "Dragons RFC", shortName: "Dragons", city: "Newport", countryCode: "WA", countryName: "Pays de Galles", continent: Continent.EUROPE },
  { name: "Benetton Rugby", shortName: "Benetton", city: "Trévise", countryCode: "IT", countryName: "Italie", continent: Continent.EUROPE },
  { name: "Newcastle Falcons", shortName: "Newcastle", city: "Newcastle", countryCode: "ENG", countryName: "Angleterre", continent: Continent.EUROPE },
  { name: "Lions", shortName: "Lions", city: "Johannesburg", countryCode: "ZA", countryName: "Afrique du Sud", continent: Continent.AFRIQUE },
];

// =============================================================================
// EFFECTIF 2025-2026
// =============================================================================

interface PlayerData {
  firstName: string;
  lastName: string;
  position: Position;
}

const SQUAD: PlayerData[] = [
  // Piliers gauche
  { firstName: "Giorgi", lastName: "Beria", position: Position.PILIER_GAUCHE },
  { firstName: "Bruce", lastName: "Devaux", position: Position.PILIER_GAUCHE },
  { firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE },

  // Talonneurs
  { firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR },
  { firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR },
  { firstName: "Sama", lastName: "Malolo", position: Position.TALONNEUR },
  { firstName: "Mathys", lastName: "Lotrian", position: Position.TALONNEUR },

  // Piliers droit
  { firstName: "Kieran", lastName: "Brookes", position: Position.PILIER_DROIT },
  { firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT },
  { firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT },
  { firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT },

  // Deuxièmes lignes
  { firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE },
  { firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE },
  { firstName: "Adrien", lastName: "Warion", position: Position.DEUXIEME_LIGNE },
  { firstName: "Bastien", lastName: "Chinarro", position: Position.DEUXIEME_LIGNE },

  // Troisièmes lignes aile
  { firstName: "Noé", lastName: "Della Schiava", position: Position.TROISIEME_LIGNE_AILE },
  { firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE },
  { firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE },
  { firstName: "Jamie", lastName: "Ritchie", position: Position.TROISIEME_LIGNE_AILE },
  { firstName: "Mattéo", lastName: "Le Corvec", position: Position.TROISIEME_LIGNE_AILE },
  { firstName: "Max", lastName: "Hicks", position: Position.TROISIEME_LIGNE_AILE },
  { firstName: "Mahamadou", lastName: "Diaby", position: Position.TROISIEME_LIGNE_AILE },
  { firstName: "Andro", lastName: "Dvali", position: Position.TROISIEME_LIGNE_AILE },

  // Numéros 8
  { firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT },
  { firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT },
  { firstName: "Peceli", lastName: "Yato", position: Position.NUMERO_HUIT },

  // Demis de mêlée
  { firstName: "Gela", lastName: "Aprasidze", position: Position.DEMI_DE_MELEE },
  { firstName: "James", lastName: "Hall", position: Position.DEMI_DE_MELEE },
  { firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE },

  // Demis d'ouverture
  { firstName: "Antoine", lastName: "Aucagne", position: Position.DEMI_OUVERTURE },
  { firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE },
  { firstName: "Tristan", lastName: "Tedder", position: Position.DEMI_OUVERTURE },
  { firstName: "Benjamin", lastName: "Urdapilleta", position: Position.DEMI_OUVERTURE },
  { firstName: "Tommaso", lastName: "Allan", position: Position.DEMI_OUVERTURE },
  { firstName: "Gabin", lastName: "Kretchmann", position: Position.DEMI_OUVERTURE },
  { firstName: "Hugo", lastName: "Reus", position: Position.DEMI_OUVERTURE },

  // Centres
  { firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE },
  { firstName: "Job", lastName: "Poulet", position: Position.CENTRE },
  { firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE },
  { firstName: "Duncan", lastName: "Paia'aua", position: Position.CENTRE },
  { firstName: "Eneriko", lastName: "Buliruarua", position: Position.CENTRE },

  // Ailiers
  { firstName: "Jefferson-Lee", lastName: "Joseph", position: Position.AILIER },
  { firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER },
  { firstName: "Jordan", lastName: "Petaia", position: Position.AILIER },
  { firstName: "Maxim", lastName: "Granell", position: Position.AILIER },

  // Arrières
  { firstName: "Théo", lastName: "Forner", position: Position.ARRIERE },
  { firstName: "Lucas", lastName: "Dubois", position: Position.ARRIERE },
  { firstName: "Mayron", lastName: "Fahy", position: Position.ARRIERE },
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

/** Trouve ou crée un joueur */
async function findOrCreatePlayer(
  data: PlayerData,
): Promise<string> {
  const existing = await prisma.player.findFirst({
    where: {
      firstName: { equals: data.firstName, mode: "insensitive" },
      lastName: { equals: data.lastName, mode: "insensitive" },
    },
  });

  if (existing) {
    // Marquer comme actif si ce n'est pas déjà le cas
    if (!existing.isActive) {
      await prisma.player.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }
    return existing.id;
  }

  const player = await prisma.player.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      position: data.position,
      isActive: true,
      slug: `temp-${Date.now()}-${Math.random()}`,
    },
  });

  await prisma.player.update({
    where: { id: player.id },
    data: { slug: generatePlayerSlug(data.firstName, data.lastName, player.id) },
  });

  return player.id;
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
    return { result: MatchResult.DEFAITE, bonusDefensif: margin <= 7 };
  }
  return { result: MatchResult.NUL, bonusDefensif: false };
}

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log("=== Seed Saison 2025-2026 USAP ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver la saison 2025-2026
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
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
  // 6. Nettoyage des données 2025-26 existantes
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
  }

  await prisma.seasonPlayer.deleteMany({ where: { seasonId: season.id } });
  console.log("  Liens joueurs-saison supprimés\n");

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
  // 8. Créer les joueurs + liens SeasonPlayer
  // -------------------------------------------------------------------------
  console.log("--- Effectif ---");
  let createdCount = 0;
  let existingCount = 0;

  for (const playerData of SQUAD) {
    const existsBefore = await prisma.player.findFirst({
      where: {
        firstName: { equals: playerData.firstName, mode: "insensitive" },
        lastName: { equals: playerData.lastName, mode: "insensitive" },
      },
    });

    const playerId = await findOrCreatePlayer(playerData);

    if (existsBefore) {
      existingCount++;
    } else {
      createdCount++;
    }

    // Lien SeasonPlayer
    await prisma.seasonPlayer.create({
      data: {
        seasonId: season.id,
        playerId,
        position: playerData.position,
      },
    });
  }
  console.log(`  ${createdCount} joueur(s) créé(s), ${existingCount} existant(s)`);
  console.log(`  ${SQUAD.length} liens joueur-saison créés\n`);

  // -------------------------------------------------------------------------
  // 9. Créer les matchs
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
  // 10. Mettre à jour les stats de la saison (en cours)
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
      coachId: azema.id,
      notes:
        "SAISON EN COURS (18 journées sur 26). " +
        "13e du Top 14 avec 18 pts. " +
        "Début de saison catastrophique : 11 défaites consécutives (J1-J11). " +
        "Première victoire J12 vs Clermont (26-20). " +
        "Exploit : victoire 30-27 vs Toulouse champion en titre (J14). " +
        "Montauban (promu de Pro D2) 14e avec 7 pts. " +
        "Qualifié en 8e de finale de Challenge Cup (vs Montpellier le 04/04/2026).",
    },
  });

  console.log(`  Classement : 13e (saison en cours)`);
  console.log(`  Bilan : ${wins}V ${draws}N ${losses}D`);
  console.log(`  Points : ${totalPoints} (${bonusDef} BD)`);
  console.log(`  Score : ${pointsFor} marqués, ${pointsAgainst} encaissés (diff: ${pointsFor - pointsAgainst})`);
  console.log(`  Coach : Franck Azéma`);

  console.log("\n=== Seed 2025-2026 terminé ! ===");
  console.log(`  ${matchCount} matchs`);
  console.log(`  ${SQUAD.length} joueurs dans l'effectif`);
  console.log(`  ${Object.keys(opponentMap).length} adversaires`);
}

main()
  .catch((e) => {
    console.error("Erreur lors du seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

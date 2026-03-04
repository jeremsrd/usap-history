/**
 * Seed saison 2024-2025 de l'USAP
 * Top 14 (26 journées) + Challenge Cup (5 matchs) + Access Match (1 match)
 *
 * 13e du Top 14, maintien via access match vs Grenoble (13-11)
 * 9V 2N 15D — 44 pts — Points marqués: 469, encaissés: 647
 * Coach : Franck Azéma
 *
 * Usage : npx tsx scripts/seed-2024-2025.ts
 *
 * Idempotent : supprime les matchs et liens joueurs-saison 2024-25 avant de recréer.
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
  competition: "TOP14" | "CHALLENGE" | "BARRAGE";
  isNeutralVenue?: boolean;
}

const MATCHES: MatchData[] = [
  // === TOP 14 — Phase aller ===
  { matchday: 1, date: "2024-09-07", isHome: false, opponentName: "Aviron Bayonnais", scoreUsap: 19, scoreOpp: 21, competition: "TOP14" },
  { matchday: 2, date: "2024-09-14", isHome: true, opponentName: "Montpellier Hérault Rugby", scoreUsap: 7, scoreOpp: 26, competition: "TOP14" },
  { matchday: 3, date: "2024-09-21", isHome: false, opponentName: "Castres Olympique", scoreUsap: 12, scoreOpp: 27, competition: "TOP14" },
  { matchday: 4, date: "2024-09-28", isHome: true, opponentName: "ASM Clermont Auvergne", scoreUsap: 33, scoreOpp: 3, competition: "TOP14" },
  { matchday: 5, date: "2024-10-05", isHome: true, opponentName: "Section Paloise", scoreUsap: 11, scoreOpp: 10, competition: "TOP14" },
  { matchday: 6, date: "2024-10-12", isHome: false, opponentName: "Union Bordeaux-Bègles", scoreUsap: 12, scoreOpp: 66, competition: "TOP14" },
  { matchday: 7, date: "2024-10-19", isHome: true, opponentName: "Lyon OU", scoreUsap: 29, scoreOpp: 26, competition: "TOP14" },
  { matchday: 8, date: "2024-10-26", isHome: false, opponentName: "Racing 92", scoreUsap: 23, scoreOpp: 30, competition: "TOP14" },
  { matchday: 9, date: "2024-11-02", isHome: true, opponentName: "RC Vannes", scoreUsap: 32, scoreOpp: 13, competition: "TOP14" },
  { matchday: 10, date: "2024-11-23", isHome: false, opponentName: "Stade Toulousain", scoreUsap: 9, scoreOpp: 41, competition: "TOP14" },
  { matchday: 11, date: "2024-11-30", isHome: true, opponentName: "RC Toulon", scoreUsap: 13, scoreOpp: 22, competition: "TOP14" },
  { matchday: 12, date: "2024-12-21", isHome: false, opponentName: "Stade Français Paris", scoreUsap: 7, scoreOpp: 24, competition: "TOP14" },
  { matchday: 13, date: "2024-12-28", isHome: true, opponentName: "Stade Rochelais", scoreUsap: 21, scoreOpp: 13, competition: "TOP14" },

  // === TOP 14 — Phase retour ===
  { matchday: 14, date: "2025-01-04", isHome: false, opponentName: "Lyon OU", scoreUsap: 12, scoreOpp: 17, competition: "TOP14" },
  { matchday: 15, date: "2025-01-25", isHome: true, opponentName: "Aviron Bayonnais", scoreUsap: 16, scoreOpp: 11, competition: "TOP14" },
  { matchday: 16, date: "2025-02-15", isHome: true, opponentName: "Castres Olympique", scoreUsap: 20, scoreOpp: 20, competition: "TOP14" },
  { matchday: 17, date: "2025-02-22", isHome: false, opponentName: "Section Paloise", scoreUsap: 6, scoreOpp: 23, competition: "TOP14" },
  { matchday: 18, date: "2025-03-01", isHome: true, opponentName: "Union Bordeaux-Bègles", scoreUsap: 17, scoreOpp: 29, competition: "TOP14" },
  { matchday: 19, date: "2025-03-22", isHome: false, opponentName: "RC Toulon", scoreUsap: 19, scoreOpp: 40, competition: "TOP14" },
  { matchday: 20, date: "2025-03-29", isHome: false, opponentName: "RC Vannes", scoreUsap: 20, scoreOpp: 20, competition: "TOP14" },
  { matchday: 21, date: "2025-04-19", isHome: true, opponentName: "Racing 92", scoreUsap: 28, scoreOpp: 24, competition: "TOP14" },
  { matchday: 22, date: "2025-04-26", isHome: false, opponentName: "Montpellier Hérault Rugby", scoreUsap: 13, scoreOpp: 19, competition: "TOP14" },
  { matchday: 23, date: "2025-05-10", isHome: true, opponentName: "Stade Français Paris", scoreUsap: 20, scoreOpp: 18, competition: "TOP14" },
  { matchday: 24, date: "2025-05-17", isHome: false, opponentName: "ASM Clermont Auvergne", scoreUsap: 13, scoreOpp: 31, competition: "TOP14" },
  { matchday: 25, date: "2025-05-31", isHome: false, opponentName: "Stade Rochelais", scoreUsap: 15, scoreOpp: 38, competition: "TOP14" },
  { matchday: 26, date: "2025-06-07", isHome: true, opponentName: "Stade Toulousain", scoreUsap: 42, scoreOpp: 35, competition: "TOP14" },

  // === CHALLENGE CUP ===
  { round: "Poule J1", date: "2024-12-08", isHome: false, opponentName: "Toyota Cheetahs", scoreUsap: 20, scoreOpp: 20, competition: "CHALLENGE", isNeutralVenue: true },
  { round: "Poule J2", date: "2024-12-15", isHome: true, opponentName: "Connacht Rugby", scoreUsap: 18, scoreOpp: 31, competition: "CHALLENGE" },
  { round: "Poule J3", date: "2025-01-12", isHome: true, opponentName: "Cardiff Rugby", scoreUsap: 23, scoreOpp: 20, competition: "CHALLENGE" },
  { round: "Poule J4", date: "2025-01-19", isHome: false, opponentName: "Zebre Parme", scoreUsap: 39, scoreOpp: 21, competition: "CHALLENGE" },
  { round: "Huitième de finale", date: "2025-04-05", isHome: true, opponentName: "Racing 92", scoreUsap: 18, scoreOpp: 24, competition: "CHALLENGE" },

  // === ACCESS MATCH (Barrage maintien) ===
  { round: "Access Match", date: "2025-06-14", isHome: false, opponentName: "FC Grenoble", scoreUsap: 13, scoreOpp: 11, competition: "BARRAGE" },
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
  { name: "Montpellier Hérault Rugby", shortName: "Montpellier", city: "Montpellier" },
  { name: "Castres Olympique", shortName: "Castres", city: "Castres" },
  { name: "ASM Clermont Auvergne", shortName: "Clermont", city: "Clermont-Ferrand" },
  { name: "Section Paloise", shortName: "Pau", city: "Pau" },
  { name: "Union Bordeaux-Bègles", shortName: "UBB", city: "Bordeaux" },
  { name: "Lyon OU", shortName: "Lyon", city: "Lyon" },
  { name: "Racing 92", shortName: "Racing 92", city: "Nanterre" },
  { name: "RC Vannes", shortName: "Vannes", city: "Vannes" },
  { name: "Stade Toulousain", shortName: "Toulouse", city: "Toulouse" },
  { name: "RC Toulon", shortName: "Toulon", city: "Toulon" },
  { name: "Stade Français Paris", shortName: "Stade Français", city: "Paris" },
  { name: "Stade Rochelais", shortName: "La Rochelle", city: "La Rochelle" },
  // Challenge Cup
  { name: "Toyota Cheetahs", shortName: "Cheetahs", city: "Bloemfontein", countryCode: "ZA", countryName: "Afrique du Sud", continent: Continent.AFRIQUE },
  { name: "Connacht Rugby", shortName: "Connacht", city: "Galway", countryCode: "IE", countryName: "Irlande", continent: Continent.EUROPE },
  { name: "Cardiff Rugby", shortName: "Cardiff", city: "Cardiff", countryCode: "WA", countryName: "Pays de Galles", continent: Continent.EUROPE },
  { name: "Zebre Parme", shortName: "Zebre", city: "Parme", countryCode: "IT", countryName: "Italie", continent: Continent.EUROPE },
  // Access Match
  { name: "FC Grenoble", shortName: "Grenoble", city: "Grenoble" },
];

// =============================================================================
// EFFECTIF 2024-2025
// =============================================================================

interface PlayerData {
  firstName: string;
  lastName: string;
  position: Position;
}

const SQUAD: PlayerData[] = [
  // Piliers gauche
  { firstName: "Giorgi", lastName: "Beria", position: Position.PILIER_GAUCHE },
  { firstName: "Lorenço", lastName: "Boyer Gallardo", position: Position.PILIER_GAUCHE },
  { firstName: "Bruce", lastName: "Devaux", position: Position.PILIER_GAUCHE },
  { firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE },

  // Talonneurs
  { firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR },
  { firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR },
  { firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR },

  // Piliers droit
  { firstName: "Kieran", lastName: "Brookes", position: Position.PILIER_DROIT },
  { firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT },
  { firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT },
  { firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT },

  // Deuxièmes lignes
  { firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE },
  { firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE },
  { firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE },
  { firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE },
  { firstName: "Adrien", lastName: "Warion", position: Position.DEUXIEME_LIGNE },

  // Troisièmes lignes aile
  { firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE },
  { firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE },
  { firstName: "Noé", lastName: "Della Schiava", position: Position.TROISIEME_LIGNE_AILE },
  { firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE },
  { firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE },

  // Numéros 8
  { firstName: "So'otala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT },
  { firstName: "Joaquin", lastName: "Oviedo", position: Position.NUMERO_HUIT },
  { firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT },

  // Demis de mêlée
  { firstName: "Gela", lastName: "Aprasidze", position: Position.DEMI_DE_MELEE },
  { firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE },
  { firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE },
  { firstName: "James", lastName: "Hall", position: Position.DEMI_DE_MELEE },

  // Demis d'ouverture
  { firstName: "Antoine", lastName: "Aucagne", position: Position.DEMI_OUVERTURE },
  { firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE },

  // Ailiers
  { firstName: "Alistair", lastName: "Crossdale", position: Position.AILIER },
  { firstName: "Lucas", lastName: "Dubois", position: Position.AILIER },
  { firstName: "Jefferson-Lee", lastName: "Joseph", position: Position.AILIER },
  { firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER },

  // Centres
  { firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE },
  { firstName: "Apisai", lastName: "Naqalevu", position: Position.CENTRE },
  { firstName: "Job", lastName: "Poulet", position: Position.CENTRE },
  { firstName: "Jean-Pascal", lastName: "Baraque", position: Position.CENTRE },
  { firstName: "Eneriko", lastName: "Buliruarua", position: Position.CENTRE },
  { firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE },

  // Arrières
  { firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE },
  { firstName: "Louis", lastName: "Dupichot", position: Position.ARRIERE },
  { firstName: "Théo", lastName: "Forner", position: Position.ARRIERE },

  // Arrivée en cours de saison
  { firstName: "Valentin", lastName: "Delpy", position: Position.ARRIERE },
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
  console.log("=== Seed Saison 2024-2025 USAP ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver la saison 2024-2025
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2024, endYear: 2025 },
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

  // Barrages : trouver ou créer
  let barrages = await prisma.competition.findFirst({
    where: { type: "BARRAGES" },
  });
  if (!barrages) {
    barrages = await prisma.competition.create({
      data: {
        name: "Barrages Top 14 / Pro D2",
        shortName: "Barrages",
        type: "BARRAGES",
      },
    });
    console.log("Compétition créée : Barrages");
  }
  console.log(`Compétitions : ${top14.shortName}, ${challengeCup.shortName}, ${barrages.shortName}\n`);

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
        biography: "Manager général de l'USAP pour la saison 2024-2025. Ancien entraîneur de Clermont.",
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
  // 6. Nettoyage des données 2024-25 existantes
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
    const competition =
      m.competition === "CHALLENGE" ? challengeCup :
      m.competition === "BARRAGE" ? barrages :
      top14;
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
    const compLabel = m.competition === "CHALLENGE" ? "CC" : m.competition === "BARRAGE" ? "BAR" : "T14";
    const phase = m.matchday ? `J${m.matchday}` : m.round;
    console.log(
      `  [${compLabel}] ${phase} ${m.isHome ? "DOM" : "EXT"} vs ${opponent.shortName || opponent.name} : ${m.scoreUsap}-${m.scoreOpp} [${icon}]${bd}`,
    );
    matchCount++;
  }
  console.log(`\n  ${matchCount} matchs créés\n`);

  // -------------------------------------------------------------------------
  // 10. Mettre à jour les stats de la saison
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
        "13e du Top 14. Maintien via access match contre Grenoble (13-11). " +
        "Pire défaite de l'histoire : 66-12 à Bordeaux-Bègles (J6). " +
        "Victoire 42-35 vs Toulouse à domicile (J26). " +
        "Budget record de 23M€, moyenne 13 871 spectateurs. " +
        "Éliminé en 1/8 de Challenge Cup par Racing 92.",
    },
  });

  console.log(`  Classement : 13e`);
  console.log(`  Bilan : ${wins}V ${draws}N ${losses}D`);
  console.log(`  Points : ${totalPoints} (${bonusDef} BD)`);
  console.log(`  Score : ${pointsFor} marqués, ${pointsAgainst} encaissés (diff: ${pointsFor - pointsAgainst})`);
  console.log(`  Coach : Franck Azéma`);

  console.log("\n=== Seed 2024-2025 terminé ! ===");
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

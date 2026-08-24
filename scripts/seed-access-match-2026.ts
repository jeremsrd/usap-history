/**
 * Access match Top 14 / Pro D2 — Provence Rugby 24-47 USAP (14/06/2026)
 *
 * 13e du Top 14, l'USAP affronte Provence Rugby, demi-finaliste de Pro D2,
 * au Stade Maurice-David d'Aix-en-Provence, et conserve sa place dans l'élite.
 * Peceli Yato, entré à la 28e minute, inscrit un doublé et est désigné homme
 * du match. Quatrième access match remporté par les Catalans.
 *
 * Sources : top14.lnr.fr (compte rendu et marqueurs), provencerugby.com,
 *   lerugbynistere.fr, blog-rct.com (composition USAP),
 *   minutesports.fr (désignation arbitrale).
 *
 * Précision sur les données : les marqueurs d'essais et leurs minutes sont
 * sourcés, mais les buteurs des transformations (6 pour l'USAP, 2 pour
 * Provence) ne le sont pas. Elles sont donc comptabilisées au niveau du match
 * (conversionsUsap / conversionsOpponent) mais ne sont attribuées à aucun
 * joueur et n'apparaissent pas dans la chronologie. Le score à la mi-temps,
 * l'affluence et le banc de Provence restent également à sourcer.
 *
 * Usage : npx tsx scripts/seed-access-match-2026.ts
 *
 * Idempotent : recrée compositions et événements à chaque exécution.
 */

import { PrismaClient, Position, MatchResult } from "@prisma/client";
import {
  generateMatchSlug,
  generatePlayerSlug,
  generateOpponentSlug,
  generateRefereeSlug,
  slugify,
} from "../src/lib/slugs";

const prisma = new PrismaClient();

const DATE = new Date("2026-06-14");
const SCORE_USAP = 47;
const SCORE_PROVENCE = 24;

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, firstName: "Sama", lastName: "Malolo", position: Position.TALONNEUR, isStarter: true },
  { num: 3, firstName: "Kieran", lastName: "Brookes", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, firstName: "Jonny", lastName: "Gray", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, firstName: "Maxwell", lastName: "Hicks", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, tries: 2 },
  { num: 9, firstName: "James", lastName: "Hall", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, firstName: "Benjamin", lastName: "Urdapilleta", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, firstName: "Théo", lastName: "Forner", position: Position.AILIER, isStarter: true, tries: 1 },
  { num: 12, firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, isCaptain: true, tries: 1 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true },
  { num: 14, firstName: "Jefferson-Lee", lastName: "Joseph", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: true },
  { num: 16, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: false, tries: 1 },
  { num: 17, firstName: "Bruce", lastName: "Devaux", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, firstName: "Peceli", lastName: "Yato", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, tries: 2, subIn: 28 },
  { num: 19, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 20, firstName: "Mattéo", lastName: "Le Corvec", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, firstName: "Jordan", lastName: "Petaia", position: Position.AILIER, isStarter: false },
  { num: 23, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false },
];

// === COMPOSITION PROVENCE RUGBY (XV de départ ; banc non sourcé) ===
const PROVENCE_SQUAD = [
  { num: 1, name: "Lino Julien", position: Position.PILIER_GAUCHE },
  { num: 2, name: "Romain Latterrade", position: Position.TALONNEUR },
  { num: 3, name: "Tomas Francis", position: Position.PILIER_DROIT },
  { num: 4, name: "Andrès Zafra Tarazona", position: Position.DEUXIEME_LIGNE, isCaptain: true },
  { num: 5, name: "Yannick Youyoutte", position: Position.DEUXIEME_LIGNE },
  { num: 6, name: "Teimana Harrison", position: Position.TROISIEME_LIGNE_AILE },
  { num: 7, name: "Charly Gambini", position: Position.TROISIEME_LIGNE_AILE },
  { num: 8, name: "Tornike Jalagonia", position: Position.NUMERO_HUIT },
  { num: 9, name: "Arthur Coville", position: Position.DEMI_DE_MELEE },
  { num: 10, name: "Caleb Muntz", position: Position.DEMI_OUVERTURE },
  { num: 11, name: "Léo Drouet", position: Position.AILIER },
  { num: 12, name: "Kaveinga Finau", position: Position.CENTRE },
  { num: 13, name: "Setareki Bituniyata", position: Position.CENTRE },
  { num: 14, name: "Adrien Lapegue-Lafaye", position: Position.AILIER },
  { num: 15, name: "Manuel Portela Morais Vareiro", position: Position.ARRIERE },
];

// === CHRONOLOGIE (essais uniquement — transformations non sourcées) ===
const EVENTS = [
  { minute: 20, isUsap: false, who: "Tornike Jalagonia" },
  { minute: 25, isUsap: false, who: "Andrès Zafra Tarazona" },
  { minute: 36, isUsap: true, who: "Peceli Yato" },
  { minute: 39, isUsap: true, who: "Théo Forner" },
  { minute: 43, isUsap: true, who: "Joaquín Oviedo" },
  { minute: 49, isUsap: true, who: "Peceli Yato" },
  { minute: 60, isUsap: false, who: "Léo Drouet" },
  { minute: 64, isUsap: true, who: "Ignacio Ruiz" },
  { minute: 74, isUsap: false, who: "Setareki Bituniyata" },
  { minute: 77, isUsap: true, who: "Joaquín Oviedo" },
  { minute: 79, isUsap: true, who: "Jerónimo De La Fuente" },
];

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

async function findOrCreatePlayer(
  firstName: string,
  lastName: string,
  position: Position,
): Promise<string> {
  const existing = await prisma.player.findFirst({
    where: {
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
  });
  if (existing) return existing.id;

  const player = await prisma.player.create({
    data: {
      firstName,
      lastName,
      position,
      isActive: true,
      slug: `temp-${Date.now()}-${Math.random()}`,
    },
  });
  await prisma.player.update({
    where: { id: player.id },
    data: { slug: generatePlayerSlug(firstName, lastName, player.id) },
  });
  console.log(`  [joueur] Créé : ${firstName} ${lastName}`);
  return player.id;
}

async function findOrCreateReferee(firstName: string, lastName: string): Promise<string> {
  const existing = await prisma.referee.findFirst({
    where: {
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
  });
  if (existing) {
    console.log(`  [arbitre] Existe : ${firstName} ${lastName}`);
    return existing.id;
  }
  const referee = await prisma.referee.create({
    data: { firstName, lastName, slug: `temp-${Date.now()}` },
  });
  await prisma.referee.update({
    where: { id: referee.id },
    data: { slug: generateRefereeSlug(firstName, lastName, referee.id) },
  });
  console.log(`  [arbitre] Créé : ${firstName} ${lastName}`);
  return referee.id;
}

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log("=== Access match 2026 : Provence Rugby 24-47 USAP ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });
  const competition = await prisma.competition.findFirstOrThrow({
    where: { shortName: "Barrages" },
  });
  const france = await prisma.country.findFirst({ where: { code: "FR" } });

  // ---- Stade -----------------------------------------------------------
  let venue = await prisma.venue.findFirst({ where: { name: "Stade Maurice-David" } });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade Maurice-David",
        city: "Aix-en-Provence",
        capacity: 3500,
        countryId: france?.id ?? null,
        slug: "temp",
      },
    });
    await prisma.venue.update({
      where: { id: venue.id },
      data: { slug: `${slugify("Stade Maurice-David")}-${slugify("Aix-en-Provence")}-${venue.id}` },
    });
    console.log("  [stade] Créé : Stade Maurice-David (Aix-en-Provence)");
  } else {
    console.log("  [stade] Existe : Stade Maurice-David");
  }

  // ---- Adversaire ------------------------------------------------------
  let opponent = await prisma.opponent.findFirst({ where: { name: "Provence Rugby" } });
  if (!opponent) {
    opponent = await prisma.opponent.create({
      data: {
        name: "Provence Rugby",
        shortName: "Provence",
        city: "Aix-en-Provence",
        countryId: france?.id ?? null,
        venueId: venue.id,
        foundedYear: 1970,
        slug: "temp",
      },
    });
    await prisma.opponent.update({
      where: { id: opponent.id },
      data: { slug: generateOpponentSlug("Provence Rugby", opponent.id) },
    });
    console.log("  [adversaire] Créé : Provence Rugby");
  } else {
    console.log("  [adversaire] Existe : Provence Rugby");
  }

  const refereeId = await findOrCreateReferee("Vincent", "Blasco-Baqué");

  // ---- Match -----------------------------------------------------------
  const common = {
    date: DATE,
    kickoffTime: "18:00",
    seasonId: season.id,
    competitionId: competition.id,
    matchday: null,
    round: "Access Match",
    isHome: false,
    venueId: venue.id,
    opponentId: opponent.id,
    refereeId,
    scoreUsap: SCORE_USAP,
    scoreOpponent: SCORE_PROVENCE,
    result: MatchResult.VICTOIRE,
    bonusOffensif: false,
    bonusDefensif: false,
    triesUsap: 7,
    conversionsUsap: 6,
    penaltiesUsap: 0,
    dropGoalsUsap: 0,
    penaltyTriesUsap: 0,
    triesOpponent: 4,
    conversionsOpponent: 2,
    penaltiesOpponent: 0,
    dropGoalsOpponent: 0,
    penaltyTriesOpponent: 0,
    manOfTheMatch: "Peceli Yato",
    report:
      "L'USAP conserve sa place en Top 14 au terme d'un access match maîtrisé " +
      "au Stade Maurice-David. Provence Rugby prend pourtant les devants par " +
      "Jalagonia (20') et son capitaine Zafra Tarazona (25'), mais l'entrée de " +
      "Peceli Yato à la 28e minute change le match : le Fidjien inscrit un " +
      "doublé (36', 49') et Forner (39') permet aux Catalans de virer en tête. " +
      "Oviedo (43'), Ruiz (64'), Oviedo encore (77') et De La Fuente (79') " +
      "portent le total à sept essais. Drouet (60') et Bituniyata (74') " +
      "sauvent l'honneur provençal. Victoire 47-24 et maintien assuré : " +
      "l'USAP remporte son quatrième access match.",
  };

  let match = await prisma.match.findFirst({
    where: { seasonId: season.id, competitionId: competition.id, round: "Access Match" },
  });

  if (match) {
    match = await prisma.match.update({ where: { id: match.id }, data: common });
    console.log(`\n  Match mis à jour : ${match.slug}`);
  } else {
    const slug = generateMatchSlug({
      competitionShortName: competition.shortName,
      competitionName: competition.name,
      opponentShortName: opponent.shortName,
      opponentName: opponent.name,
      isHome: false,
      matchday: null,
      round: "Access Match",
      date: DATE,
    });
    match = await prisma.match.create({ data: { slug, ...common } });
    console.log(`\n  Match créé : ${match.slug}`);
  }

  // ---- Composition USAP -------------------------------------------------
  await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  const playerIds: Record<string, string> = {};

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);
    playerIds[`${p.firstName} ${p.lastName}`] = playerId;

    const tries = p.tries ?? 0;
    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
        subIn: p.subIn ?? null,
        minutesPlayed: p.isStarter ? 80 : p.subIn != null ? 80 - p.subIn : null,
        tries,
        totalPoints: tries * 5,
      },
    });

    const linked = await prisma.seasonPlayer.findFirst({
      where: { seasonId: season.id, playerId },
    });
    if (!linked) {
      await prisma.seasonPlayer.create({
        data: { seasonId: season.id, playerId, position: p.position },
      });
    }
  }
  console.log(`  Composition USAP : ${USAP_SQUAD.length} joueurs`);

  // ---- Composition Provence ---------------------------------------------
  for (const p of PROVENCE_SQUAD) {
    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        isOpponent: true,
        opponentPlayerName: p.name,
        shirtNumber: p.num,
        isStarter: true,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
      },
    });
  }
  console.log(`  Composition Provence : ${PROVENCE_SQUAD.length} joueurs (XV de départ)`);

  // ---- Chronologie -------------------------------------------------------
  await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
  for (const e of EVENTS) {
    const team = e.isUsap ? "USAP" : "Provence";
    await prisma.matchEvent.create({
      data: {
        matchId: match.id,
        minute: e.minute,
        type: "ESSAI",
        playerId: e.isUsap ? (playerIds[e.who] ?? null) : null,
        isUsap: e.isUsap,
        description: `Essai de ${e.who} (${team}).`,
      },
    });
  }
  console.log(`  Chronologie : ${EVENTS.length} essais`);

  console.log("\n=== Terminé ===");
  console.log("  Provence Rugby 24 - 47 USAP — maintien en Top 14");
  console.log("  Homme du match : Peceli Yato");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

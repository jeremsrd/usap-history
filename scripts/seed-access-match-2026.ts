/**
 * Access match Top 14 / Pro D2 — Provence Rugby 24-47 USAP (14/06/2026)
 *
 * 13e du Top 14, l'USAP affronte Provence Rugby, finaliste malheureux de
 * Pro D2, au Stade Maurice-David d'Aix-en-Provence, et conserve sa place
 * dans l'élite. Peceli Yato, entré à la 28e minute, inscrit un doublé et est
 * désigné homme du match. Quatrième access match remporté par les Catalans.
 *
 * Sources : top14.lnr.fr (feuille de match officielle : compositions et
 *   officiels), rugbyrama.fr (direct commenté : chronologie complète, cartons,
 *   remplacements, score à la mi-temps), provencerugby.com, lerugbynistere.fr.
 *
 * À noter :
 * - Benjamin Urdapilleta, annoncé à l'ouverture dans la composition de
 *   présentation, déclare forfait le jour du match (adducteurs) ; Jake
 *   McIntyre débute au poste de demi d'ouverture.
 * - Sama Malolo écope d'un carton orange à la 33e (plaquage à la tête sur
 *   Jalagonia). Le type EventType ne comporte pas encore CARTON_ORANGE : la
 *   sanction est portée sur la feuille de match (champ orangeCard) et non
 *   dans la chronologie.
 * - 18e : Bruce Devaux entre pendant le carton jaune de Tetrashvili, Théo
 *   Forner sortant temporairement ; Forner revient ensuite et marque à la 39e.
 *   Seule l'entrée de Devaux est donc enregistrée.
 * - Affluence non chiffrée (stade annoncé à guichets fermés).
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
const VIDEO_URL = "https://www.youtube.com/watch?v=l3AfbfwKHgE";

// === COMPOSITION USAP (feuille de match LNR) ===
const USAP_SQUAD = [
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, yellowCardMin: 16 },
  { num: 2, firstName: "Sama", lastName: "Malolo", position: Position.TALONNEUR, isStarter: true, orangeCardMin: 33, subOut: 33 },
  { num: 3, firstName: "Kieran", lastName: "Brookes", position: Position.PILIER_DROIT, isStarter: true, subOut: 53 },
  { num: 4, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 28 },
  { num: 5, firstName: "Jonny", lastName: "Gray", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 53 },
  { num: 6, firstName: "Maxwell", lastName: "Hicks", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 40 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, tries: 2 },
  { num: 9, firstName: "James", lastName: "Hall", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 63 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, subOut: 66 },
  { num: 11, firstName: "Théo", lastName: "Forner", position: Position.AILIER, isStarter: true, tries: 1 },
  { num: 12, firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, isCaptain: true, tries: 1 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true },
  { num: 14, firstName: "Jefferson-Lee", lastName: "Joseph", position: Position.AILIER, isStarter: true, subOut: 34 },
  { num: 15, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: true, conversions: 6 },
  { num: 16, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: false, tries: 1, subIn: 34 },
  { num: 17, firstName: "Bruce", lastName: "Devaux", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 18 },
  { num: 18, firstName: "Peceli", lastName: "Yato", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, tries: 2, subIn: 28 },
  { num: 19, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 53 },
  { num: 20, firstName: "Mattéo", lastName: "Le Corvec", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 40 },
  { num: 21, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 63 },
  { num: 22, firstName: "Jordan", lastName: "Petaia", position: Position.CENTRE, isStarter: false, subIn: 66 },
  { num: 23, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false, subIn: 53 },
];

// === COMPOSITION PROVENCE RUGBY (feuille de match LNR) ===
const PROVENCE_SQUAD = [
  { num: 1, name: "Lino Julien", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 43 },
  { num: 2, name: "Romain Latterrade", position: Position.TALONNEUR, isStarter: true, subOut: 51 },
  { num: 3, name: "Tomas Francis", position: Position.PILIER_DROIT, isStarter: true, subOut: 49 },
  { num: 4, name: "Andrès Zafra Tarazona", position: Position.DEUXIEME_LIGNE, isStarter: true, isCaptain: true, yellowCardMin: 37 },
  { num: 5, name: "Yannick Youyoutte", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 49 },
  { num: 6, name: "Teimana Harrison", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Charly Gambini", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Tornike Jalagonia", position: Position.NUMERO_HUIT, isStarter: true, subOut: 33 },
  { num: 9, name: "Arthur Coville", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 75 },
  { num: 10, name: "Caleb Muntz", position: Position.DEMI_OUVERTURE, isStarter: true, subOut: 76 },
  { num: 11, name: "Léo Drouet", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Kaveinga Finau", position: Position.CENTRE, isStarter: true, subOut: 62 },
  { num: 13, name: "Setareki Bituniyata", position: Position.CENTRE, isStarter: true, yellowCardMin: 43 },
  { num: 14, name: "Adrien Lapegue-Lafaye", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Manuel Portela Morais Vareiro", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Kapeliele Pifeleti Jr", position: Position.TALONNEUR, isStarter: false, subIn: 51 },
  { num: 17, name: "Thomas Vernet", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 43 },
  { num: 18, name: "Izack Rodda", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 49 },
  { num: 19, name: "Marvin Saint Gys Okuya", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Albert Tuisue", position: Position.NUMERO_HUIT, isStarter: false, subIn: 33 },
  { num: 21, name: "Joris Cazenave", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 75 },
  { num: 22, name: "Pierre Lucas", position: Position.CENTRE, isStarter: false, subIn: 62 },
  { num: 23, name: "Hugo Ndiaye", position: Position.PILIER_DROIT, isStarter: false, subIn: 49 },
];

// === CHRONOLOGIE (direct commenté Rugbyrama) ===
// Le carton orange de Malolo (33') n'y figure pas : voir en-tête du fichier.
type EventType = "ESSAI" | "TRANSFORMATION" | "CARTON_JAUNE";
const EVENTS: Array<{ minute: number; type: EventType; isUsap: boolean; who: string }> = [
  { minute: 16, type: "CARTON_JAUNE", isUsap: true, who: "Giorgi Tetrashvili" },
  { minute: 20, type: "ESSAI", isUsap: false, who: "Tornike Jalagonia" },
  { minute: 25, type: "ESSAI", isUsap: false, who: "Andrès Zafra Tarazona" },
  { minute: 36, type: "ESSAI", isUsap: true, who: "Peceli Yato" },
  { minute: 36, type: "TRANSFORMATION", isUsap: true, who: "Tommaso Allan" },
  { minute: 37, type: "CARTON_JAUNE", isUsap: false, who: "Andrès Zafra Tarazona" },
  { minute: 39, type: "ESSAI", isUsap: true, who: "Théo Forner" },
  { minute: 39, type: "TRANSFORMATION", isUsap: true, who: "Tommaso Allan" },
  // Mi-temps : Provence 10 - 14 USAP
  { minute: 43, type: "CARTON_JAUNE", isUsap: false, who: "Setareki Bituniyata" },
  { minute: 44, type: "ESSAI", isUsap: true, who: "Joaquín Oviedo" },
  { minute: 44, type: "TRANSFORMATION", isUsap: true, who: "Tommaso Allan" },
  { minute: 51, type: "ESSAI", isUsap: true, who: "Peceli Yato" },
  { minute: 51, type: "TRANSFORMATION", isUsap: true, who: "Tommaso Allan" },
  { minute: 59, type: "ESSAI", isUsap: false, who: "Léo Drouet" },
  { minute: 59, type: "TRANSFORMATION", isUsap: false, who: "Manuel Portela Morais Vareiro" },
  { minute: 65, type: "ESSAI", isUsap: true, who: "Ignacio Ruiz" },
  { minute: 73, type: "ESSAI", isUsap: false, who: "Setareki Bituniyata" },
  { minute: 73, type: "TRANSFORMATION", isUsap: false, who: "Manuel Portela Morais Vareiro" },
  { minute: 77, type: "ESSAI", isUsap: true, who: "Joaquín Oviedo" },
  { minute: 77, type: "TRANSFORMATION", isUsap: true, who: "Tommaso Allan" },
  { minute: 80, type: "ESSAI", isUsap: true, who: "Jerónimo De La Fuente" },
  { minute: 80, type: "TRANSFORMATION", isUsap: true, who: "Tommaso Allan" },
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

/**
 * Index des joueurs existants, par nom normalisé. Construit une seule fois :
 * la recherche doit porter sur le nom normalisé complet, car un filtre SQL sur
 * le seul nom de famille rate les variantes d'accent et de ponctuation
 * ("Guerois-Galisson" vs "Guerois Galisson", "Bécognée" vs "Becognee").
 */
let playerIndex: Map<string, string> | null = null;

async function getPlayerIndex(): Promise<Map<string, string>> {
  if (playerIndex) return playerIndex;
  const all = await prisma.player.findMany({
    select: { id: true, firstName: true, lastName: true },
  });
  playerIndex = new Map();
  for (const p of all) {
    const key = normalizeName(`${p.firstName} ${p.lastName}`);
    if (!playerIndex.has(key)) playerIndex.set(key, p.id);
  }
  return playerIndex;
}

/**
 * Retrouve le joueur adverse par nom complet, ou le crée.
 * Convention du projet : un adversaire est une vraie ligne `Player` reliée par
 * MatchPlayer.playerId avec isOpponent = true (voir CLAUDE.md).
 */
async function findOrCreateOpponentPlayer(
  fullName: string,
  position: Position,
): Promise<string> {
  const index = await getPlayerIndex();
  const key = normalizeName(fullName);
  const existing = index.get(key);
  if (existing) return existing;

  const { firstName, lastName } = splitFullName(fullName);
  const player = await prisma.player.create({
    data: {
      firstName,
      lastName,
      position,
      isActive: false,
      slug: `temp-${Date.now()}-${Math.random()}`,
    },
  });
  await prisma.player.update({
    where: { id: player.id },
    data: { slug: generatePlayerSlug(firstName, lastName, player.id) },
  });
  index.set(key, player.id);
  console.log(`    [adversaire] Créé : ${fullName}`);
  return player.id;
}

/** Nom comparable : sans accents, sans casse, sans ponctuation. */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Découpe un nom complet, particules rattachées au nom de famille. */
function splitFullName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: "", lastName: parts[0] };
  const particles = new Set(["de", "la", "le", "van", "von", "du", "des", "da", "di"]);
  const idx = parts.findIndex((x, i) => i > 0 && particles.has(x.toLowerCase()));
  if (idx > 0) {
    return { firstName: parts.slice(0, idx).join(" "), lastName: parts.slice(idx).join(" ") };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
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

/** Score courant (Provence-USAP, l'USAP joue à l'extérieur) après l'événement i. */
function runningScore(upTo: number): string {
  let usap = 0;
  let provence = 0;
  for (let i = 0; i <= upTo; i++) {
    const e = EVENTS[i];
    const v = e.type === "ESSAI" ? 5 : e.type === "TRANSFORMATION" ? 2 : 0;
    if (e.isUsap) usap += v;
    else provence += v;
  }
  return `${provence}-${usap}`;
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
    halfTimeUsap: 14,
    halfTimeOpponent: 10,
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
    videoUrl: VIDEO_URL,
    report:
      "L'USAP conserve sa place en Top 14 au terme d'un match en deux temps au " +
      "Stade Maurice-David. Privés d'Urdapilleta, forfait le jour du match " +
      "(adducteurs) et remplacé par Jake McIntyre à l'ouverture, les Catalans " +
      "subissent pendant une demi-heure : carton jaune pour Tetrashvili (16'), " +
      "essais de Jalagonia (20') et du capitaine Zafra Tarazona (25'), puis " +
      "carton orange pour Malolo (33') après un plaquage à la tête. Vareiro " +
      "manque toutefois les deux transformations et Provence ne mène que 10-0. " +
      "L'entrée de Peceli Yato à la 28e minute renverse la rencontre : le " +
      "Fidjien marque (36'), Forner enchaîne (39') et l'USAP vire en tête 14-10. " +
      "En seconde période les Catalans déroulent — Oviedo (44'), Yato encore " +
      "(51'), Ruiz (65'), Oviedo à nouveau (77') et De La Fuente à la sirène " +
      "(80') — Tommaso Allan passant six transformations sur sept. Drouet (59') " +
      "et Bituniyata (73') limitent la casse. Victoire 47-24 et maintien " +
      "assuré : l'USAP remporte son quatrième access match.",
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
    const conversions = p.conversions ?? 0;
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
        subOut: p.subOut ?? null,
        minutesPlayed: p.isStarter ? (p.subOut ?? 80) : p.subIn != null ? 80 - p.subIn : null,
        tries,
        conversions,
        totalPoints: tries * 5 + conversions * 2,
        yellowCard: p.yellowCardMin != null,
        yellowCardMin: p.yellowCardMin ?? null,
        orangeCard: p.orangeCardMin != null,
        orangeCardMin: p.orangeCardMin ?? null,
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
  // Réalisations déduites de la chronologie, comme pour l'USAP.
  const oppScoring: Record<string, { tries: number; conversions: number }> = {};
  const oppNames = new Set(PROVENCE_SQUAD.map((p) => p.name));
  for (const e of EVENTS) {
    if (e.isUsap || e.type === "CARTON_JAUNE") continue;
    if (!oppNames.has(e.who)) {
      console.log(`  ⚠ marqueur provençal absent de la composition : ${e.who}`);
      continue;
    }
    oppScoring[e.who] ??= { tries: 0, conversions: 0 };
    if (e.type === "ESSAI") oppScoring[e.who].tries++;
    else oppScoring[e.who].conversions++;
  }

  let oppPoints = 0;
  const oppPlayerIds: Record<string, string> = {};
  for (const p of PROVENCE_SQUAD) {
    const sc = oppScoring[p.name] ?? { tries: 0, conversions: 0 };
    const pts = sc.tries * 5 + sc.conversions * 2;
    oppPoints += pts;
    const oppPlayerId = await findOrCreateOpponentPlayer(p.name, p.position);
    oppPlayerIds[p.name] = oppPlayerId;
    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId: oppPlayerId,
        isOpponent: true,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
        subIn: p.subIn ?? null,
        subOut: p.subOut ?? null,
        minutesPlayed: p.isStarter ? (p.subOut ?? 80) : p.subIn != null ? 80 - p.subIn : null,
        tries: sc.tries,
        conversions: sc.conversions,
        totalPoints: pts,
        yellowCard: p.yellowCardMin != null,
        yellowCardMin: p.yellowCardMin ?? null,
      },
    });
  }
  if (oppPoints !== SCORE_PROVENCE) {
    console.log(`  ⚠ points Provence répartis : ${oppPoints} au lieu de ${SCORE_PROVENCE}`);
  }
  console.log(
    `  Composition Provence : ${PROVENCE_SQUAD.length} joueurs (${oppPoints} pts répartis)`,
  );

  // ---- Chronologie -------------------------------------------------------
  await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
  for (let i = 0; i < EVENTS.length; i++) {
    const e = EVENTS[i];
    const team = e.isUsap ? "USAP" : "Provence";
    const description =
      e.type === "CARTON_JAUNE"
        ? `Carton jaune pour ${e.who} (${team}).`
        : `${e.type === "ESSAI" ? "Essai" : "Transformation"} de ${e.who} (${team}). ${runningScore(i)}.`;

    await prisma.matchEvent.create({
      data: {
        matchId: match.id,
        minute: e.minute,
        type: e.type,
        playerId: e.isUsap
          ? (playerIds[e.who] ?? null)
          : (oppPlayerIds[e.who] ?? null),
        isUsap: e.isUsap,
        description,
      },
    });
  }
  console.log(`  Chronologie : ${EVENTS.length} événements`);

  console.log("\n=== Terminé ===");
  console.log("  Provence Rugby 24 - 47 USAP (mi-temps 10-14) — maintien en Top 14");
  console.log("  Arbitre : Vincent Blasco-Baqué | Homme du match : Peceli Yato");
  console.log(`  Vidéo : ${VIDEO_URL}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

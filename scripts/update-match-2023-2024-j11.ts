/**
 * Mise à jour du match Castres - USAP (J11 Top 14, 31/12/2023)
 * Score : Castres 13 - 17 USAP
 *
 * Victoire dramatique à Pierre-Fabre pour la Saint-Sylvestre !
 * L'USAP est menée 13-10 après 66' mais Veredamu arrache la victoire
 * à la 83' sur une action collective. Allan auteur d'un gros match
 * (1 essai, 2 conv, 1 pén = 11 pts).
 * 2 CJ USAP : Chiocci (48'), De La Fuente (59').
 *
 * Essais USAP : Acebes (27'), Veredamu (83')
 * Essai Castres : Arata (3')
 *
 * Sources : top14.lnr.fr (compositions), itsrugby.fr (stats),
 *   sectionpaloise.com (arbitre)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j11.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2023-2024/j11/10327-castres-perpignan/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 80 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 56, subOut: 56 },
  { num: 3, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 50, subOut: 50 },
  { num: 4, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 50, subOut: 50 },
  { num: 6, firstName: "Joaquin", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 48, subOut: 48 },
  { num: 8, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 65, subOut: 65 },
  { num: 10, firstName: "Tommaso", lastName: "Allan", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acebes", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jeronimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Edward", lastName: "Sawailau", position: Position.CENTRE, isStarter: true, minutesPlayed: 72, subOut: 72 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Louis", lastName: "Dupichot", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Vakhtang", lastName: "Jintcharadze", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 24, subIn: 56 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 0 },
  { num: 18, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 30, subIn: 50 },
  { num: 19, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 32, subIn: 48 },
  { num: 20, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 21, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 15, subIn: 65 },
  { num: 22, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: false, minutesPlayed: 8, subIn: 72 },
  { num: 23, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 30, subIn: 50 },
];

// === COMPOSITION CASTRES (adversaire) ===
// Source : top14.lnr.fr
const CO_SQUAD = [
  { num: 1, name: "Wayan De Benedittis", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Gaëtan Barlot", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Wilfrid Hounkpatin", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Florent Vanverberghe", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Thomas Staniforth", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Mathieu Babillot", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Tyler Ardron", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Abraham Papali'i", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Santiago Arata", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Pierre Popelin", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Filipo Nakosi", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Vilimoni Botitu", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Adrien Seguret", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Nathanaël Hulleu", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Julien Dumora", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Loris Zarantonello", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Antoine Tichit", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Leone Nakarawa", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Baptiste Delaporte", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Jérémy Fernandez", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Louis Le Brun", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Geoffrey Palis", position: Position.ARRIERE, isStarter: false },
  { num: 23, name: "Levan Chilachava", position: Position.PILIER_DROIT, isStarter: false },
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
      isActive: false,
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

async function findOrCreateReferee(
  firstName: string,
  lastName: string,
): Promise<string> {
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
    data: {
      firstName,
      lastName,
      slug: `temp-${Date.now()}`,
    },
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
  console.log("=== Mise à jour match Castres - USAP (J11, 31/12/2023) ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver le match
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 11, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // -------------------------------------------------------------------------
  // 2. Arbitre
  // -------------------------------------------------------------------------
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Vivien", "Praderie");

  // -------------------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // -------------------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score : Castres 13 - 17 USAP (extérieur)
   * Mi-temps : Castres 10 - 10 USAP
   *
   * CO : 1E(Arata 3') + 1T(Popelin) + 2P(Popelin 17', 66') = 5+2+6 = 13
   * USAP : 2E(Acebes 27', Veredamu 83') + 2T(Allan) + 1P(Allan 35') = 10+4+3 = 17
   *
   * CJ : Chiocci (48'), De La Fuente (59')
   */
  const venue = await prisma.venue.findFirst({ where: { name: { contains: "Pierre-Fabre" } } });

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "14:00",
      refereeId,
      venueId: venue?.id ?? undefined,
      // Mi-temps
      halfTimeUsap: 10,
      halfTimeOpponent: 10,
      // Détail scoring USAP
      triesUsap: 2,
      conversionsUsap: 2,
      penaltiesUsap: 1,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Castres
      triesOpponent: 1,
      conversionsOpponent: 1,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Victoire dramatique de l'USAP à Pierre-Fabre pour terminer l'année 2023 ! " +
        "Castres ouvre le score rapidement par Arata (3') et mène 10-0 après une pénalité " +
        "de Popelin (17'). L'USAP réagit par Acebes (27') et Allan (pénalité 35') pour " +
        "égaliser à la pause (10-10). En seconde période, Popelin redonne l'avantage à " +
        "Castres (66', 13-10) mais Veredamu arrache la victoire à la 83' sur une action " +
        "collective, Allan transforme pour le 13-17 final. Deux cartons jaunes pour l'USAP " +
        "(Chiocci 48', De La Fuente 59') mais les Catalans tiennent bon en infériorité.",
    },
  });
  console.log("  Match mis à jour");

  // -------------------------------------------------------------------------
  // 4. Composition USAP (23 joueurs)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition USAP ---");
  const deleted = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);

    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;
    let yellowCard = false, yellowCardMin: number | null = null;

    // Acebes : 1 essai (27')
    if (p.lastName === "Acebes") { tries = 1; totalPoints = 5; }
    // Veredamu : 1 essai (83')
    if (p.lastName === "Veredamu") { tries = 1; totalPoints = 5; }
    // Allan : 2 transformations + 1 pénalité = 4+3 = 7 pts
    if (p.lastName === "Allan" && p.num === 10) { conversions = 2; penalties = 1; totalPoints = 7; }
    // Chiocci : CJ 48'
    if (p.lastName === "Chiocci") { yellowCard = true; yellowCardMin = 48; }
    // De La Fuente : CJ 59'
    if (p.lastName === "De La Fuente") { yellowCard = true; yellowCardMin = 59; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: false,
        positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard, yellowCardMin,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null,
        subOut: (p as any).subOut ?? null,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [
      totalPoints > 0 ? `(${totalPoints} pts)` : "",
      yellowCard ? `[CJ ${yellowCardMin}']` : "",
      sub,
      `[${p.minutesPlayed}']`,
    ].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // -------------------------------------------------------------------------
  // 5. Composition Castres (adversaire)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition Castres ---");

  for (const p of CO_SQUAD) {
    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        isOpponent: true,
        opponentPlayerName: p.name,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: false,
        positionPlayed: p.position,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.name}`);
  }

  // -------------------------------------------------------------------------
  // 6. Liens joueurs-saison
  // -------------------------------------------------------------------------
  console.log("\n--- Liens joueurs-saison ---");
  let linkedCount = 0;
  for (const p of USAP_SQUAD) {
    const player = await prisma.player.findFirst({
      where: {
        firstName: { equals: p.firstName, mode: "insensitive" },
        lastName: { equals: p.lastName, mode: "insensitive" },
      },
    });
    if (!player) continue;
    const exists = await prisma.seasonPlayer.findFirst({
      where: { seasonId: season.id, playerId: player.id },
    });
    if (!exists) {
      await prisma.seasonPlayer.create({
        data: { seasonId: season.id, playerId: player.id, position: p.position },
      });
      linkedCount++;
    }
  }
  console.log(`  ${linkedCount} nouveau(x) lien(s) joueur-saison créé(s)`);

  // -------------------------------------------------------------------------
  // 7. Événements du match (timeline)
  // -------------------------------------------------------------------------
  console.log("\n--- Événements du match ---");
  const deletedEvents = await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
  if (deletedEvents.count > 0) console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events: Array<{
    minute: number;
    type: string;
    playerLastName?: string;
    isUsap: boolean;
    description: string;
  }> = [
    // === PREMIÈRE MI-TEMPS ===
    // 3' - Essai Arata (Castres) 0-5
    { minute: 3, type: "ESSAI", isUsap: false,
      description: "Essai de Santiago Arata (Castres). 0-5." },
    // 4' - Transformation Popelin (Castres) 0-7
    { minute: 4, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Pierre Popelin (Castres). 0-7." },
    // 17' - Pénalité Popelin (Castres) 0-10
    { minute: 17, type: "PENALITE", isUsap: false,
      description: "Pénalité de Pierre Popelin (Castres). 0-10." },
    // 27' - Essai Acebes (USAP) 5-10
    { minute: 27, type: "ESSAI", playerLastName: "Acebes", isUsap: true,
      description: "Essai de Mathieu Acebes (USAP). L'USAP réagit. 5-10." },
    // 28' - Transformation Allan (USAP) 7-10
    { minute: 28, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 7-10." },
    // 35' - Pénalité Allan (USAP) 10-10
    { minute: 35, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). Égalisation. 10-10." },

    // === MI-TEMPS : Castres 10 - 10 USAP ===

    // === SECONDE MI-TEMPS ===
    // 48' - CJ Chiocci (USAP)
    { minute: 48, type: "CARTON_JAUNE", playerLastName: "Chiocci", isUsap: true,
      description: "Carton jaune Xavier Chiocci (USAP). USAP à 14." },
    // 59' - CJ De La Fuente (USAP)
    { minute: 59, type: "CARTON_JAUNE", playerLastName: "De La Fuente", isUsap: true,
      description: "Carton jaune Jeronimo De La Fuente (USAP). USAP à 14." },
    // 66' - Pénalité Popelin (Castres) 10-13
    { minute: 66, type: "PENALITE", isUsap: false,
      description: "Pénalité de Pierre Popelin (Castres). 10-13." },
    // 83' - Essai Veredamu (USAP) 15-13
    { minute: 83, type: "ESSAI", playerLastName: "Veredamu", isUsap: true,
      description: "Essai de Tavite Veredamu (USAP) ! Victoire arrachée dans les dernières minutes. 15-13." },
    // 83' - Transformation Allan (USAP) 17-13
    { minute: 83, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 17-13. Score final." },
  ];

  for (const evt of events) {
    let playerId: string | null = null;
    if (evt.isUsap && evt.playerLastName) {
      const player = await prisma.player.findFirst({
        where: { lastName: { equals: evt.playerLastName, mode: "insensitive" } },
      });
      playerId = player?.id ?? null;
    }

    await prisma.matchEvent.create({
      data: {
        matchId: match.id,
        minute: evt.minute,
        type: evt.type as any,
        playerId,
        isUsap: evt.isUsap,
        description: evt.description,
      },
    });

    const side = evt.isUsap ? "USAP" : "CO";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // -------------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Castres 13 - 17 USAP (extérieur)");
  console.log("  Mi-temps : Castres 10 - 10 USAP");
  console.log("  Arbitre : Vivien Praderie");
  console.log("  Stade : Pierre-Fabre");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition Castres : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  Essais USAP : Acebes (27'), Veredamu (83')");
  console.log("  2 CJ USAP : Chiocci (48'), De La Fuente (59')");
  console.log("  Victoire arrachée dans les dernières minutes !");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Mise à jour du match Lyon - USAP (J13 Top 14, 27/01/2024)
 * Score : Lyon 36 - 24 USAP
 *
 * Défaite à Gerland malgré une belle réaction en 2e mi-temps.
 * Le LOU mène 20-3 à la pause grâce à Botha, Allen et les pénalités
 * de Berdeu. L'USAP réagit avec 3 essais en 2e MT (Van Tonder,
 * Fa'aso'o, Roelofse) mais Lyon gère l'écart.
 * CJ Sobela (25'), CJ Couilloud (38', LOU).
 *
 * Essais USAP : Van Tonder (45'), Fa'aso'o (69'), Roelofse (74')
 * Essais Lyon : Botha (8'), Allen (30'), Couilloud (60')
 *
 * Sources : top14.lnr.fr (compositions), radioscoop.com,
 *   allrugby.com (arbitre)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j13.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2023-2024/j13/10342-lyon-perpignan/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 3, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 4, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Alistair", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 28, subIn: 52 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 28, subIn: 52 },
  { num: 18, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 19, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 20, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 21, firstName: "Mathieu", lastName: "Acebes", position: Position.CENTRE, isStarter: false, minutesPlayed: 0 },
  { num: 22, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: false, minutesPlayed: 0 },
  { num: 23, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 28, subIn: 52 },
];

// === COMPOSITION LYON (adversaire) ===
// Source : top14.lnr.fr
const LOU_SQUAD = [
  { num: 1, name: "Jérôme Rey", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Liam Coltman", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Demba Bamba", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Félix Lambey", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Mickaël Guillard", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Marvin Okuya", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Liam Allen", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Arno Botha", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Baptiste Couilloud", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Léo Berdeu", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Davit Niniashvili", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Semi Radradra", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Alfred Parisien", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Vincent Rattez", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Alexandre Tchaptchet", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Guillaume Marchand", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Vivien Devisme", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Joel Kpoku", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Maxime Gouzou", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Martin Page-Relo", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Paddy Jackson", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Josiah Maraku", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Paulo Tafili", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match Lyon - USAP (J13, 27/01/2024) ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver le match
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 13, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // -------------------------------------------------------------------------
  // 2. Arbitre
  // -------------------------------------------------------------------------
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Benoît", "Rousselet");

  // -------------------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // -------------------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score : Lyon 36 - 24 USAP (extérieur)
   * Mi-temps : Lyon 20 - 3 USAP
   *
   * LOU : 3E(Botha 8', Allen 30', Couilloud 60') + 3T(Berdeu×2, Jackson)
   *      + 5P(Berdeu×4 5' 22' 47' 55', Jackson 79') = 15+6+15 = 36
   * USAP : 3E(Van Tonder 45', Fa'aso'o 69', Roelofse 74')
   *      + 3T(Allan) + 1P(McIntyre 15') = 15+6+3 = 24
   *
   * CJ : Sobela (25', USAP), Couilloud (38', LOU)
   */
  const venue = await prisma.venue.findFirst({ where: { name: { contains: "Gerland" } } });

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      venueId: venue?.id ?? undefined,
      // Mi-temps
      halfTimeUsap: 3,
      halfTimeOpponent: 20,
      // Détail scoring USAP
      triesUsap: 3,
      conversionsUsap: 3,
      penaltiesUsap: 1,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Lyon
      triesOpponent: 3,
      conversionsOpponent: 3,
      penaltiesOpponent: 5,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Défaite à Gerland malgré une belle réaction en seconde mi-temps. " +
        "Le LOU prend les devants grâce à Botha (8'), Allen (30') et les pénalités " +
        "de Berdeu pour mener 20-3 à la pause. CJ Sobela (25') et CJ Couilloud (38'). " +
        "L'USAP réagit en 2e MT : Van Tonder réduit l'écart (45'), puis Fa'aso'o (69') " +
        "et Roelofse (74') marquent mais Lyon gère avec Couilloud (60') et les pieds " +
        "de Jackson. Score final 36-24, l'USAP repart sans bonus.",
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

    // Van Tonder : 1 essai (45')
    if (p.lastName === "Van Tonder") { tries = 1; totalPoints = 5; }
    // Fa'aso'o : 1 essai (69')
    if (p.lastName === "Fa'aso'o" && p.num === 19) { tries = 1; totalPoints = 5; }
    // Roelofse : 1 essai (74')
    if (p.lastName === "Roelofse") { tries = 1; totalPoints = 5; }
    // Allan : 3 transformations = 6 pts
    if (p.lastName === "Allan" && p.num === 15) { conversions = 3; totalPoints = 6; }
    // McIntyre : 1 pénalité = 3 pts
    if (p.lastName === "McIntyre") { penalties = 1; totalPoints = 3; }
    // Sobela : CJ 25'
    if (p.lastName === "Sobela") { yellowCard = true; yellowCardMin = 25; }

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
  // 5. Composition Lyon (adversaire)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition Lyon ---");

  for (const p of LOU_SQUAD) {
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
    // 5' - Pénalité Berdeu (LOU) 0-3
    { minute: 5, type: "PENALITE", isUsap: false,
      description: "Pénalité de Léo Berdeu (Lyon). 0-3." },
    // 8' - Essai Botha (LOU) 0-8
    { minute: 8, type: "ESSAI", isUsap: false,
      description: "Essai d'Arno Botha (Lyon). 0-8." },
    // 9' - Transformation Berdeu (LOU) 0-10
    { minute: 9, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Léo Berdeu (Lyon). 0-10." },
    // 15' - Pénalité McIntyre (USAP) 3-10
    { minute: 15, type: "PENALITE", playerLastName: "McIntyre", isUsap: true,
      description: "Pénalité de Jake McIntyre (USAP). 3-10." },
    // 22' - Pénalité Berdeu (LOU) 3-13
    { minute: 22, type: "PENALITE", isUsap: false,
      description: "Pénalité de Léo Berdeu (Lyon). 3-13." },
    // 25' - CJ Sobela (USAP)
    { minute: 25, type: "CARTON_JAUNE", playerLastName: "Sobela", isUsap: true,
      description: "Carton jaune Patrick Sobela (USAP). USAP à 14." },
    // 30' - Essai Allen (LOU) 3-18
    { minute: 30, type: "ESSAI", isUsap: false,
      description: "Essai de Liam Allen (Lyon). 3-18." },
    // 31' - Transformation Berdeu (LOU) 3-20
    { minute: 31, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Léo Berdeu (Lyon). 3-20." },
    // 38' - CJ Couilloud (LOU)
    { minute: 38, type: "CARTON_JAUNE", isUsap: false,
      description: "Carton jaune Baptiste Couilloud (Lyon). Lyon à 14." },

    // === MI-TEMPS : Lyon 20 - 3 USAP ===

    // === SECONDE MI-TEMPS ===
    // 45' - Essai Van Tonder (USAP) 10-20
    { minute: 45, type: "ESSAI", playerLastName: "Van Tonder", isUsap: true,
      description: "Essai de Jacobus Van Tonder (USAP). L'USAP réagit. 10-20." },
    // 46' - Transformation Allan (USAP) 10-20
    { minute: 46, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 10-20." },
    // 47' - Pénalité Berdeu (LOU) 10-23
    { minute: 47, type: "PENALITE", isUsap: false,
      description: "Pénalité de Léo Berdeu (Lyon). 10-23." },
    // 55' - Pénalité Berdeu (LOU) 10-26
    { minute: 55, type: "PENALITE", isUsap: false,
      description: "Pénalité de Léo Berdeu (Lyon). 10-26." },
    // 60' - Essai Couilloud (LOU) 10-31
    { minute: 60, type: "ESSAI", isUsap: false,
      description: "Essai de Baptiste Couilloud (Lyon). Passe de Radradra. 10-31." },
    // 61' - Transformation Jackson (LOU) 10-33
    { minute: 61, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Paddy Jackson (Lyon). 10-33." },
    // 69' - Essai Fa'aso'o (USAP) 15-33
    { minute: 69, type: "ESSAI", playerLastName: "Fa'aso'o", isUsap: true,
      description: "Essai de So'otala Fa'aso'o (USAP). 15-33." },
    // 70' - Transformation Allan (USAP) 17-33
    { minute: 70, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 17-33." },
    // 74' - Essai Roelofse (USAP) 22-33
    { minute: 74, type: "ESSAI", playerLastName: "Roelofse", isUsap: true,
      description: "Essai de Nemo Roelofse (USAP). 22-33." },
    // 75' - Transformation Allan (USAP) 24-33
    { minute: 75, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 24-33." },
    // 79' - Pénalité Jackson (LOU) 24-36
    { minute: 79, type: "PENALITE", isUsap: false,
      description: "Pénalité de Paddy Jackson (Lyon). 24-36. Score final." },
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

    const side = evt.isUsap ? "USAP" : "LOU";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // -------------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Lyon 36 - 24 USAP (extérieur)");
  console.log("  Mi-temps : Lyon 20 - 3 USAP");
  console.log("  Arbitre : Benoît Rousselet");
  console.log("  Stade : Matmut Stadium de Gerland");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition Lyon : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  Essais USAP : Van Tonder (45'), Fa'aso'o (69'), Roelofse (74')");
  console.log("  CJ : Sobela (25'), Couilloud (38', LOU)");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

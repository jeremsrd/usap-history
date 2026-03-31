/**
 * Mise à jour du match UBB - USAP (J8 Top 14, 25/11/2023)
 * Score : UBB 46 - 22 USAP
 *
 * Lourde défaite de l'USAP à Chaban-Delmas. Damian Penaud signe un
 * quadruplé historique (2', 17', 33', 39'). L'UBB mène 34-0 avant que
 * Van Tonder ne sauve l'honneur (36'). En 2e MT, Roelofse (57'),
 * Acébès (61') et McIntyre (82') marquent pour l'USAP.
 *
 * Essais UBB : Penaud (2', 17', 33', 39'), Buros (7'), Lamothe (69'), Poirot (76')
 * Essais USAP : Van Tonder (36'), Roelofse (57'), Acébès (61'), McIntyre (82')
 *
 * Sources : allrugby.com, espn.com, francebleu.fr, sectionpaloise.com (arbitre)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j8.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 50, subOut: 50 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 50, subOut: 50 },
  { num: 3, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 50, subOut: 50 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 58, subOut: 58 },
  { num: 5, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 58, subOut: 58 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 53, subOut: 53 },
  { num: 10, firstName: "Tommaso", lastName: "Allan", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 53, subOut: 53 },
  { num: 11, firstName: "Louis", lastName: "Dupichot", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Mathieu", lastName: "Acebes", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Jean-Pascal", lastName: "Barraqué", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 30, subIn: 50 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 30, subIn: 50 },
  { num: 18, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 30, subIn: 50 },
  { num: 19, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 22, subIn: 58 },
  { num: 20, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 22, subIn: 58 },
  { num: 21, firstName: "Kelian", lastName: "Galletier", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 10, subIn: 70 },
  { num: 22, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 27, subIn: 53 },
  { num: 23, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 27, subIn: 53 },
];

// === COMPOSITION UBB (adversaire) ===
const UBB_SQUAD = [
  { num: 1, name: "Lekso Kaulashvili", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Romain Latterrade", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Sipili Falatea", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Guido Petti", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Kane Douglas", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Mahamadou Diaby", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Bastien Vergnes-Taillefer", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Marko Gazzotti", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Maxime Lucu", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Matthieu Jalibert", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Louis Bielle-Biarrey", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Yoram Moefana", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Nicolas Depoortère", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Damian Penaud", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Romain Buros", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Maxime Lamothe", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Jefferson Poirot", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Ben Tameifuna", position: Position.PILIER_DROIT, isStarter: false },
  { num: 19, name: "Thomas Jolmès", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 20, name: "Pete Samu", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, name: "Paul Abadie", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Matéo Garcia", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 23, name: "Pablo Uberti", position: Position.CENTRE, isStarter: false },
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
  console.log("=== Mise à jour match UBB - USAP (J8, 25/11/2023) ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver le match
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 8, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // -------------------------------------------------------------------------
  // 2. Arbitre
  // -------------------------------------------------------------------------
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Tual", "Trainini");

  // -------------------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // -------------------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score : UBB 46 - 22 USAP (extérieur)
   * Mi-temps : UBB 34 - 5 USAP
   *
   * UBB : 7E(Penaud×4, Buros, Lamothe, Poirot) + 4T(Jalibert×3, Garcia) + 1P(Jalibert) = 35+8+3 = 46
   * USAP : 4E(Van Tonder, Roelofse, Acébès, McIntyre) + 1T(McIntyre) = 20+2 = 22
   *
   * CJ : Gazzotti (UBB, 56')
   */
  // Stade Chaban-Delmas (extérieur)
  const venue = await prisma.venue.findFirst({ where: { name: { contains: "Chaban" } } });

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      venueId: venue?.id ?? undefined,
      // Mi-temps
      halfTimeUsap: 5,
      halfTimeOpponent: 34,
      // Détail scoring USAP
      triesUsap: 4,
      conversionsUsap: 1,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring UBB
      triesOpponent: 7,
      conversionsOpponent: 4,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Lourde défaite de l'USAP à Chaban-Delmas face à une UBB survoltée. " +
        "Damian Penaud réalise un quadruplé historique (2', 17', 33', 39'), " +
        "égalant le record de Gabriel Lacroix avec 4 essais en 40 minutes. " +
        "L'UBB mène 34-0 avant que Van Tonder ne sauve l'honneur à la 36'. " +
        "En seconde période, les Catalans réagissent avec Roelofse (57'), " +
        "Acébès (61') et McIntyre (82') mais c'est trop tard. " +
        "Lamothe (69') et Poirot (76') aggravent le score pour l'UBB. " +
        "Bonus offensif pour Bordeaux, rien pour l'USAP.",
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

    // Van Tonder : 1 essai (36')
    if (p.lastName === "Van Tonder") { tries = 1; totalPoints = 5; }
    // Roelofse : 1 essai (57')
    if (p.lastName === "Roelofse") { tries = 1; totalPoints = 5; }
    // Acébès : 1 essai (61')
    if (p.lastName === "Acebes") { tries = 1; totalPoints = 5; }
    // McIntyre : 1 essai (82') + 1 transformation (58') = 7 pts
    if (p.lastName === "McIntyre") { tries = 1; conversions = 1; totalPoints = 7; }

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
  // 5. Composition UBB (adversaire)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition UBB ---");

  for (const p of UBB_SQUAD) {
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
    // 2' - Essai Penaud (UBB) 0-5
    { minute: 2, type: "ESSAI", isUsap: false,
      description: "Essai de Damian Penaud (UBB). 0-5." },
    // 3' - Transformation Jalibert (UBB) 0-7
    { minute: 3, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Matthieu Jalibert (UBB). 0-7." },
    // 7' - Essai Buros (UBB) 0-12
    { minute: 7, type: "ESSAI", isUsap: false,
      description: "Essai de Romain Buros (UBB). 0-12." },
    // 8' - Transformation Jalibert (UBB) 0-14
    { minute: 8, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Matthieu Jalibert (UBB). 0-14." },
    // 15' - Pénalité Jalibert (UBB) 0-17
    { minute: 15, type: "PENALITE", isUsap: false,
      description: "Pénalité de Matthieu Jalibert (UBB). 0-17." },
    // 17' - Essai Penaud (UBB) 0-22
    { minute: 17, type: "ESSAI", isUsap: false,
      description: "Essai de Damian Penaud (UBB). Doublé. 0-22." },
    // 18' - Transformation Jalibert (UBB) 0-24
    { minute: 18, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Matthieu Jalibert (UBB). 0-24." },
    // 33' - Essai Penaud (UBB) 0-29
    { minute: 33, type: "ESSAI", isUsap: false,
      description: "Essai de Damian Penaud (UBB). Triplé. 0-29." },
    // 36' - Essai Van Tonder (USAP) 5-29
    { minute: 36, type: "ESSAI", playerLastName: "Van Tonder", isUsap: true,
      description: "Essai de Jacobus Van Tonder (USAP). L'honneur est sauf. 5-29." },
    // 39' - Essai Penaud (UBB) 5-34
    { minute: 39, type: "ESSAI", isUsap: false,
      description: "Essai de Damian Penaud (UBB). Quadruplé historique ! 5-34." },

    // === MI-TEMPS : UBB 34 - 5 USAP ===

    // === SECONDE MI-TEMPS ===
    // 56' - CJ Gazzotti (UBB)
    { minute: 56, type: "CARTON_JAUNE", isUsap: false,
      description: "Carton jaune Marko Gazzotti (UBB). UBB à 14." },
    // 57' - Essai Roelofse (USAP) 10-34
    { minute: 57, type: "ESSAI", playerLastName: "Roelofse", isUsap: true,
      description: "Essai de Nemo Roelofse (USAP). 10-34." },
    // 58' - Transformation McIntyre (USAP) 12-34
    { minute: 58, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true,
      description: "Transformation de Jake McIntyre (USAP). 12-34." },
    // 61' - Essai Acébès (USAP) 17-34
    { minute: 61, type: "ESSAI", playerLastName: "Acebes", isUsap: true,
      description: "Essai de Mathieu Acébès (USAP). 17-34." },
    // 69' - Essai Lamothe (UBB) 17-39
    { minute: 69, type: "ESSAI", isUsap: false,
      description: "Essai de Maxime Lamothe (UBB). 17-39." },
    // 76' - Essai Poirot (UBB) 17-44
    { minute: 76, type: "ESSAI", isUsap: false,
      description: "Essai de Jefferson Poirot (UBB). 17-44." },
    // 77' - Transformation Garcia (UBB) 17-46
    { minute: 77, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Matéo Garcia (UBB). 17-46." },
    // 82' - Essai McIntyre (USAP) 22-46
    { minute: 82, type: "ESSAI", playerLastName: "McIntyre", isUsap: true,
      description: "Essai de Jake McIntyre (USAP). 22-46. Score final." },
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

    const side = evt.isUsap ? "USAP" : "UBB";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // -------------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : UBB 46 - 22 USAP (extérieur)");
  console.log("  Mi-temps : UBB 34 - 5 USAP");
  console.log("  Arbitre : Tual Trainini");
  console.log("  Stade : Chaban-Delmas");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition UBB : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  Penaud quadruplé (2', 17', 33', 39')");
  console.log("  1 CJ : Gazzotti (56')");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Mise à jour du match USAP - Racing 92 (J14 Top 14, 03/02/2024)
 * Score : USAP 26 - 5 Racing 92
 *
 * Large victoire de l'USAP à Aimé-Giral face au Racing.
 * 3 essais en 1e MT pour mener 19-5 à la pause.
 * Bonus offensif assuré par Ruiz en fin de match.
 *
 * Essais USAP : Dupichot (10'), Ecochard (24'), Veredamu (32'), Ruiz (79')
 * Transformations : McIntyre x3 (11', 25', 80')
 * Essai Racing : Tarrit (29')
 * CJ : Lotrian (58'), Kharaishvili (58', Racing)
 *
 * Sources : top14.lnr.fr (compositions), eurosport.fr (timeline),
 *   allrugby.com (arbitre), francebleu.fr (résumé)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j14.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 47, subOut: 47 },
  { num: 3, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 56, subOut: 56 },
  { num: 4, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 7, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 44, subOut: 44 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 67, subOut: 67 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, minutesPlayed: 69, subOut: 69 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Louis", lastName: "Dupichot", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 33, subIn: 47 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 36, subIn: 44 },
  { num: 19, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 0 },
  { num: 20, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 21, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 13, subIn: 67 },
  { num: 22, firstName: "Mathieu", lastName: "Acebes", position: Position.CENTRE, isStarter: false, minutesPlayed: 11, subIn: 69 },
  { num: 23, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 24, subIn: 56 },
];

// === COMPOSITION RACING 92 (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Eddy Ben Arous", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Janick Tarrit", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Thomas Laclayat", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Boris Palu", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Semisi Veikoso Poloniati", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Wenceslas Lauret", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Maxime Baudonne", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Kitione Kamikamica", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Clovis Le Bail", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Martin Méliande", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Juan Imhoff", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Henry Chavancy", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Francis Saili", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Vinaya Habosi", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Tristan Tedder", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Camille Chat", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Hassane Kolingar", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Anthime Hemery", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Ibrahim Diallo", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Max Spring", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Olivier Klemenczak", position: Position.CENTRE, isStarter: false },
  { num: 22, name: "Christian Wade", position: Position.AILIER, isStarter: false },
  { num: 23, name: "Gia Kharaishvili", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Racing 92 (J14, 03/02/2024) ===\n");

  // 1. Trouver le match
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 14, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // 2. Arbitre
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Ludovic", "Cayre");

  // 3. Mettre à jour les infos générales du match
  console.log("\n--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "15:00",
      refereeId,
      // Mi-temps
      halfTimeUsap: 19,
      halfTimeOpponent: 5,
      // Détail scoring USAP
      triesUsap: 4,
      conversionsUsap: 3,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Racing
      triesOpponent: 1,
      conversionsOpponent: 0,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: true,
      bonusDefensif: false,
      // Rapport
      report:
        "Large victoire de l'USAP à Aimé-Giral face au Racing 92 (4e). " +
        "Dupichot ouvre le bal sur une relance (10'), Ecochard enchaîne (24'), " +
        "avant que Tarrit ne réduise l'écart pour le Racing (29'). " +
        "Veredamu enfonce le clou juste avant la pause (32', 19-5). " +
        "En seconde période, les deux équipes se neutralisent malgré les cartons " +
        "jaunes de Lotrian (58') et Kharaishvili (58'). " +
        "Ruiz assure le bonus offensif en toute fin de match (79'). " +
        "McIntyre parfait au pied avec 3 transformations sur 4. " +
        "5e victoire consécutive à domicile pour l'USAP.",
    },
  });
  console.log("  Match mis à jour");

  // 4. Composition USAP (23 joueurs)
  console.log("\n--- Composition USAP ---");
  const deleted = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);

    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;
    let yellowCard = false, yellowCardMin: number | null = null;
    const isCaptain = (p as any).isCaptain ?? false;

    // Dupichot : 1 essai (10')
    if (p.lastName === "Dupichot") { tries = 1; totalPoints = 5; }
    // Ecochard : 1 essai (24')
    if (p.lastName === "Ecochard") { tries = 1; totalPoints = 5; }
    // Veredamu : 1 essai (32')
    if (p.lastName === "Veredamu") { tries = 1; totalPoints = 5; }
    // Ruiz : 1 essai (79')
    if (p.lastName === "Ruiz") { tries = 1; totalPoints = 5; }
    // McIntyre : 3 transformations = 6 pts
    if (p.lastName === "McIntyre") { conversions = 3; totalPoints = 6; }
    // Lotrian : CJ 58'
    if (p.lastName === "Lotrian") { yellowCard = true; yellowCardMin = 58; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain,
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
      isCaptain ? "(C)" : "",
      sub,
      `[${p.minutesPlayed}']`,
    ].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // 5. Composition Racing 92 (adversaire)
  console.log("\n--- Composition Racing 92 ---");

  for (const p of OPP_SQUAD) {
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

  // 6. Liens joueurs-saison
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

  // 7. Événements du match (timeline)
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
    { minute: 10, type: "ESSAI", playerLastName: "Dupichot", isUsap: true,
      description: "Essai de Louis Dupichot (USAP). Belle relance depuis les 22m. 5-0." },
    { minute: 11, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true,
      description: "Transformation de Jake McIntyre (USAP). 7-0." },
    { minute: 24, type: "ESSAI", playerLastName: "Ecochard", isUsap: true,
      description: "Essai de Tom Ecochard (USAP). 12-0." },
    { minute: 25, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true,
      description: "Transformation de Jake McIntyre (USAP). 14-0." },
    { minute: 29, type: "ESSAI", isUsap: false,
      description: "Essai de Janick Tarrit (Racing 92). Le Racing réagit. 14-5." },
    { minute: 32, type: "ESSAI", playerLastName: "Veredamu", isUsap: true,
      description: "Essai de Tavite Veredamu (USAP). 19-5." },

    // === MI-TEMPS : USAP 19 - 5 Racing 92 ===

    // === SECONDE MI-TEMPS ===
    { minute: 58, type: "CARTON_JAUNE", playerLastName: "Lotrian", isUsap: true,
      description: "Carton jaune Sacha Lotrian (USAP). USAP à 14." },
    { minute: 58, type: "CARTON_JAUNE", isUsap: false,
      description: "Carton jaune Gia Kharaishvili (Racing 92). Racing à 14." },
    { minute: 79, type: "ESSAI", playerLastName: "Ruiz", isUsap: true,
      description: "Essai d'Ignacio Ruiz (USAP). Bonus offensif assuré ! 24-5." },
    { minute: 80, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true,
      description: "Transformation de Jake McIntyre (USAP). 26-5. Score final." },
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

    const side = evt.isUsap ? "USAP" : "R92";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // Résumé
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 26 - 5 Racing 92 (domicile)");
  console.log("  Mi-temps : USAP 19 - 5 Racing 92");
  console.log("  Arbitre : Ludovic Cayre");
  console.log("  Stade : Aimé-Giral");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition Racing 92 : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  Essais USAP : Dupichot (10'), Ecochard (24'), Veredamu (32'), Ruiz (79')");
  console.log("  Bonus offensif : OUI (4 essais)");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

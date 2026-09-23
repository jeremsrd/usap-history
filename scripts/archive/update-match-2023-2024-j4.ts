/**
 * Mise à jour du match USAP - Pau (J4 Top 14, 29/10/2023)
 * Score : USAP 24 - 39 Section Paloise
 *
 * Reprise après la Coupe du Monde 2023. L'USAP mène 14-0 puis s'effondre.
 * 1 carton jaune : Dubois (38')
 *
 * Sources : top14.lnr.fr, itsrugby.fr, lequipe.fr, francebleu.fr, dailymotion
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j4.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2023-2024/j4/10277-perpignan-pau/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, firstName: "Ewan", lastName: "Bertheau", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, firstName: "Alistair", lastName: "Crossdale", position: Position.AILIER, isStarter: true },
  { num: 12, firstName: "Mathieu", lastName: "Acebes", position: Position.CENTRE, isStarter: true, isCaptain: true },
  { num: 13, firstName: "Edward", lastName: "Sawailau", position: Position.CENTRE, isStarter: true },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: true },
  // Remplaçants
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false },
  { num: 17, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: false },
  { num: 22, firstName: "Louis", lastName: "Dupichot", position: Position.ARRIERE, isStarter: false },
  { num: 23, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false },
];

// === COMPOSITION PAU (adversaire) ===
const PAU_SQUAD = [
  { num: 1, name: "Hayden Thompson-Stringer", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Lucas Rey", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Siate Tokolahi", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Guillaume Ducat", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Mickaël Capelli", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Martin Puech", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Luke Whitelock", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, isCaptain: true },
  { num: 8, name: "Sacha Zegueur", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Dan Robson", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Joe Simmonds", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Samuel Ezeala", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Nathan Decron", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Emilien Gailleton", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Clément Laporte", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Jack Maddocks", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Youri Delhommel", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Rémi Sénéca", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Nicolas Corato", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Hugo Auradou", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Fabrice Metz", position: Position.NUMERO_HUIT, isStarter: false },
  { num: 21, name: "Reece Hewat", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Thibault Daubagna", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Axel Despérès", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Pau (J4, 29/10/2023) ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver le match
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 4, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // -------------------------------------------------------------------------
  // 2. Arbitre
  // -------------------------------------------------------------------------
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Adrien", "Descottes");

  // -------------------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // -------------------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score : USAP 24 - 39 Pau
   * Mi-temps : USAP 14 - 7 Pau
   *
   * USAP : 3E 3T 1P 0D = 15+6+3 = 24
   * Pau : 5E 4T 2P 0D = 25+8+6 = 39
   *
   * 1 CJ : Dubois (38')
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:05",
      refereeId,
      // Mi-temps
      halfTimeUsap: 14,
      halfTimeOpponent: 7,
      // Détail scoring USAP
      triesUsap: 3,
      conversionsUsap: 3,
      penaltiesUsap: 1,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Pau
      triesOpponent: 5,
      conversionsOpponent: 4,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Vidéo
      videoUrl: "https://www.dailymotion.com/video/x8p7yqj",
      // Rapport
      report:
        "Reprise après la Coupe du Monde 2023. L'USAP mène 14-0 grâce aux essais de Velarte (8') " +
        "et Acebes (34'), mais Pau revient à 14-7 juste avant la pause par Ezeala. " +
        "En seconde période, Pau déroule avec des essais de Zegueur (46'), Maddocks (55'), " +
        "Ezeala (62') et Daubagna (76'). Tuilagi sauve l'honneur (74'). " +
        "4e défaite consécutive en ouverture de saison. Carton jaune Dubois (38').",
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

    // Velarte : 1 essai (8')
    if (p.lastName === "Velarte") { tries = 1; totalPoints = 5; }
    // Acebes : 1 essai (34')
    if (p.lastName === "Acebes") { tries = 1; totalPoints = 5; }
    // Tuilagi : 1 essai (74')
    if (p.lastName === "Tuilagi") { tries = 1; totalPoints = 5; }
    // Allan : 3 transformations + 1 pénalité = 9 pts
    if (p.lastName === "Allan") { conversions = 3; penalties = 1; totalPoints = 9; }
    // Dubois : CJ 38'
    if (p.lastName === "Dubois") { yellowCard = true; yellowCardMin = 38; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard, yellowCardMin,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const extra = [
      p.isCaptain ? "(C)" : "",
      totalPoints > 0 ? `(${totalPoints} pts)` : "",
      yellowCard ? `[CJ ${yellowCardMin}']` : "",
    ].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // -------------------------------------------------------------------------
  // 5. Composition Pau (adversaire)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition Pau ---");

  for (const p of PAU_SQUAD) {
    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        isOpponent: true,
        opponentPlayerName: p.name,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const cap = p.isCaptain ? " (C)" : "";
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.name}${cap}`);
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
    // 8' - Essai Velarte (USAP) 5-0
    { minute: 8, type: "ESSAI", playerLastName: "Velarte", isUsap: true,
      description: "Essai de Lucas Velarte (USAP). 5-0." },
    { minute: 9, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 7-0." },
    // 34' - Essai Acebes (USAP) 12-0
    { minute: 34, type: "ESSAI", playerLastName: "Acebes", isUsap: true,
      description: "Essai de Mathieu Acebes (USAP). 12-0." },
    { minute: 35, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 14-0." },
    // 38' - CJ Dubois (USAP)
    { minute: 38, type: "CARTON_JAUNE", playerLastName: "Dubois", isUsap: true,
      description: "Carton jaune Lucas Dubois (USAP)." },
    // 40' - Essai Ezeala (Pau) 14-5
    { minute: 40, type: "ESSAI", isUsap: false,
      description: "Essai de Samuel Ezeala (Pau). 14-5." },
    { minute: 40, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Joe Simmonds (Pau). 14-7." },
    // === MI-TEMPS : USAP 14 - 7 Pau ===
    // 46' - Essai Zegueur (Pau) 14-12
    { minute: 46, type: "ESSAI", isUsap: false,
      description: "Essai de Sacha Zegueur (Pau). 14-12." },
    { minute: 48, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Joe Simmonds (Pau). 14-14." },
    // 50' - Pénalité Allan (USAP) 17-14
    { minute: 50, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 17-14." },
    // 52' - Pénalité Simmonds (Pau) 17-17
    { minute: 52, type: "PENALITE", isUsap: false,
      description: "Pénalité de Joe Simmonds (Pau). 17-17." },
    // 55' - Essai Maddocks (Pau) 17-22
    { minute: 55, type: "ESSAI", isUsap: false,
      description: "Essai de Jack Maddocks (Pau). 17-22." },
    { minute: 56, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Joe Simmonds (Pau). 17-24." },
    // 62' - Essai Ezeala (Pau) 17-29
    { minute: 62, type: "ESSAI", isUsap: false,
      description: "2e essai de Samuel Ezeala (Pau). 17-29." },
    { minute: 62, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Joe Simmonds (Pau). 17-32." },
    // 70' - Pénalité Simmonds (Pau) 17-35
    { minute: 70, type: "PENALITE", isUsap: false,
      description: "Pénalité de Joe Simmonds (Pau). 17-35." },
    // 74' - Essai Tuilagi (USAP) 22-35
    { minute: 74, type: "ESSAI", playerLastName: "Tuilagi", isUsap: true,
      description: "Essai de Posolo Tuilagi (USAP). 22-35." },
    { minute: 75, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 24-35." },
    // 76' - Essai Daubagna (Pau) 24-39 (non transformé)
    { minute: 76, type: "ESSAI", isUsap: false,
      description: "Essai de Thibault Daubagna (Pau). Non transformé. 24-39." },
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

    const side = evt.isUsap ? "USAP" : "PAU";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // -------------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 24 - 39 Pau");
  console.log("  Mi-temps : USAP 14 - 7 Pau");
  console.log("  Arbitre : Adrien Descottes");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition Pau : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  1 carton jaune : Dubois (38')");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

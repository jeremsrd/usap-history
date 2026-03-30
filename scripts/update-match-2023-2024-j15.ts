/**
 * Mise à jour du match Stade Français - USAP (J15 Top 14, 17/02/2024)
 * Score : Stade Français 32 - 19 USAP
 *
 * L'USAP mène 16-7 à la pause grâce à 3 pénalités d'Allan et un essai
 * de Lam, mais s'effondre en 2e mi-temps. Le Stade Français inscrit
 * 25 points (3E, 2T, 2P) pour l'emporter avec le bonus offensif.
 *
 * Essais USAP : Lam (30')
 * Essais SF : ~20' (1e MT), ~43', ~67', ~75' (2e MT)
 * CJ : aucun documenté
 *
 * Sources : top14.lnr.fr (compositions), francebleu.fr (résumé, HT 16-7),
 *   allrugby.com (arbitre Thomas Charabas), all.rugby (timeline)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j15.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 49, subOut: 49 },
  { num: 3, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 4, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 7, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 61, subOut: 61 },
  { num: 10, firstName: "Tommaso", lastName: "Allan", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acebes", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Apisai", lastName: "Naqalevu", position: Position.CENTRE, isStarter: true, minutesPlayed: 68, subOut: 68 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Louis", lastName: "Dupichot", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 31, subIn: 49 },
  { num: 17, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Lucas", lastName: "Velarte", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 0 },
  { num: 19, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 0 },
  { num: 20, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 21, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 19, subIn: 61 },
  { num: 22, firstName: "Job", lastName: "Poulet", position: Position.CENTRE, isStarter: false, minutesPlayed: 12, subIn: 68 },
  { num: 23, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 26, subIn: 54 },
];

// === COMPOSITION STADE FRANÇAIS (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Moses Alo Emile", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Mickael Ivaldi", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Paul Alo Emile", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Pierre-Henri Azagoh", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Tanginoa Halaifonua", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Mathieu Hirigoyen", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Romain Briatte", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Giovanni Habel-Kuffner", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Rory Kockott", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Zack Henry", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Lester Etien", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Julien Delbouis", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Jeremy Ward", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Joseph Marchant", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Kylan Hamdaoui", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Lucas Peyresblanques", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Clément Castets", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Juan-John Van Der Mescht", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Ryan Chapuis", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Jules Gimbert", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Pierre Boudehent", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Léo Barré", position: Position.ARRIERE, isStarter: false },
  { num: 23, name: "Hugo Ndiaye", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match Stade Français - USAP (J15, 17/02/2024) ===\n");

  // 1. Trouver le match
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 15, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // 2. Arbitre
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Thomas", "Charabas");

  // 3. Mettre à jour les infos générales du match
  console.log("\n--- Match (infos générales) ---");

  const venue = await prisma.venue.findFirst({ where: { name: { contains: "Jean-Bouin" } } });

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      venueId: venue?.id ?? undefined,
      // Mi-temps (USAP menait 16-7)
      halfTimeUsap: 16,
      halfTimeOpponent: 7,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 4,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Stade Français
      triesOpponent: 4,
      conversionsOpponent: 3,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Défaite cruelle à Jean-Bouin après avoir mené 16-7 à la pause. " +
        "Allan parfait au pied en 1e MT avec 3 pénalités (11', 16', 41'), " +
        "et Lam inscrit le seul essai catalan (30'). " +
        "Mais le Stade Français réagit furieusement en 2e période : " +
        "en moins de 15 minutes, les Parisiens reprennent l'avantage (17-16). " +
        "Henry convertit avec succès et le SF inscrit 3 essais supplémentaires " +
        "pour s'imposer 32-19 avec le bonus offensif. " +
        "Allan sauve l'honneur avec une 4e pénalité (58') mais c'est insuffisant.",
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

    // Lam : 1 essai (30')
    if (p.lastName === "Lam") { tries = 1; totalPoints = 5; }
    // Allan : 1 transformation + 4 pénalités = 2 + 12 = 14 pts
    if (p.lastName === "Allan") { conversions = 1; penalties = 4; totalPoints = 14; }

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
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null,
        subOut: (p as any).subOut ?? null,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [
      totalPoints > 0 ? `(${totalPoints} pts)` : "",
      sub,
      `[${p.minutesPlayed}']`,
    ].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // 5. Composition Stade Français (adversaire)
  console.log("\n--- Composition Stade Français ---");

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
    { minute: 11, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 0-3." },
    { minute: 16, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 0-6." },
    { minute: 20, type: "ESSAI", isUsap: false,
      description: "Essai du Stade Français. 5-6." },
    { minute: 21, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Zack Henry (Stade Français). 7-6." },
    { minute: 30, type: "ESSAI", playerLastName: "Lam", isUsap: true,
      description: "Essai de Seilala Lam (USAP). 7-11." },
    { minute: 31, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 7-13." },
    { minute: 41, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 7-16. Score à la pause." },

    // === MI-TEMPS : Stade Français 7 - 16 USAP ===

    // === SECONDE MI-TEMPS ===
    { minute: 43, type: "ESSAI", isUsap: false,
      description: "Essai du Stade Français. Début du renversement. 12-16." },
    { minute: 44, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Zack Henry (Stade Français). 14-16." },
    { minute: 47, type: "PENALITE", isUsap: false,
      description: "Pénalité de Zack Henry (Stade Français). Paris repasse devant ! 17-16." },
    { minute: 58, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 17-19." },
    { minute: 60, type: "PENALITE", isUsap: false,
      description: "Pénalité de Zack Henry (Stade Français). 20-19." },
    { minute: 67, type: "ESSAI", isUsap: false,
      description: "Essai du Stade Français. Paris accélère. 25-19." },
    { minute: 75, type: "ESSAI", isUsap: false,
      description: "Essai du Stade Français. Bonus offensif ! 30-19." },
    { minute: 76, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Zack Henry (Stade Français). 32-19. Score final." },
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

    const side = evt.isUsap ? "USAP" : "SFP";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // Résumé
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Stade Français 32 - 19 USAP (extérieur)");
  console.log("  Mi-temps : SF 7 - USAP 16");
  console.log("  Arbitre : Thomas Charabas");
  console.log("  Stade : Jean-Bouin");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition SF : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  Essai USAP : Lam (30')");
  console.log("  Allan : 1T + 4P = 14 pts");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

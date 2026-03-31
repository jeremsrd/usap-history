/**
 * Création et mise à jour du match USAP - Toulon (J20 Top 14, 28/03/2026)
 * Score : USAP 36 - 20 Toulon
 *
 * Belle victoire à Aimé-Giral avec bonus offensif (5 essais) !
 * L'USAP domine en 1ère MT grâce à Yato (8'), Ecochard (25') et
 * Oviedo (34'), menant 24-10 à la pause. Toulon revient à 24-20
 * (Shioshvili 51', Ludlam 56') mais Allan (74') et Forner (81')
 * scellent la victoire dans le dernier quart d'heure.
 * Urdapilleta : 3 transformations + 1 pénalité = 9 pts.
 *
 * Sources : espn.com, allrugby.com, top14.lnr.fr, francebleu.fr,
 *   rugbyscope.fr
 *
 * Usage : npx tsx scripts/update-match-2025-2026-j20.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import {
  generateMatchSlug,
  generatePlayerSlug,
  generateRefereeSlug,
} from "../src/lib/slugs";

const prisma = new PrismaClient();

enum MatchResult {
  VICTOIRE = "VICTOIRE",
  DEFAITE = "DEFAITE",
  NUL = "NUL",
}

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true },
  { num: 3, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, firstName: "Peceli", lastName: "Yato", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, firstName: "Adrien", lastName: "Warion", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, firstName: "Max", lastName: "Hicks", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, firstName: "Benjamin", lastName: "Urdapilleta", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, firstName: "Théo", lastName: "Forner", position: Position.AILIER, isStarter: true },
  { num: 12, firstName: "Diego", lastName: "Mascarenc", position: Position.CENTRE, isStarter: true },
  { num: 13, firstName: "Eneriko", lastName: "Buliruarua", position: Position.CENTRE, isStarter: true },
  { num: 14, firstName: "Jefferson", lastName: "Joseph", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Mayron", lastName: "Fahy", position: Position.ARRIERE, isStarter: true },
  // Remplaçants
  { num: 16, firstName: "Sama", lastName: "Malolo", position: Position.TALONNEUR, isStarter: false },
  { num: 17, firstName: "Bruce", lastName: "Devaux", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, firstName: "Matteo", lastName: "Le Corvec", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, firstName: "James", lastName: "Hall", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, firstName: "Tommaso", lastName: "Allan", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, firstName: "Jordan", lastName: "Petaia", position: Position.CENTRE, isStarter: false },
  { num: 23, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: false },
];

// === COMPOSITION TOULON (adversaire) ===
const RCT_SQUAD = [
  { num: 1, name: "Dany Priso", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Gianmarco Lucchesi", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Beka Gigashvili", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Corentin Mezouel", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Brian Alainu'uese", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Lewis Ludlam", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Jules Coulon", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Mikheili Shioshvili", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Ben White", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Tomás Albornoz", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Mathis Ferté", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Antoine Frisch", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Ignacio Brex", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Setariki Tuicuvu", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Melvyn Jaminet", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Pierre Damond", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Jarrett Gros", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Giorgi Javakhia", position: Position.PILIER_DROIT, isStarter: false },
  { num: 19, name: "Matthew Halagahu", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 20, name: "Zeno Mercer", position: Position.NUMERO_HUIT, isStarter: false },
  { num: 21, name: "Mateo Domon", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Mathieu Nonu", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Kyle Sinckler", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Création match USAP - Toulon (J20, 28/03/2026) ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver la saison, compétition, adversaire, stade
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });
  const top14 = await prisma.competition.findFirstOrThrow({
    where: { shortName: "Top 14" },
  });
  const opponent = await prisma.opponent.findFirstOrThrow({
    where: { name: { contains: "Toulon" } },
  });
  const venue = await prisma.venue.findFirst({
    where: { name: { contains: "Giral" } },
  });

  console.log(`Saison : ${season.label}`);
  console.log(`Adversaire : ${opponent.name}`);
  console.log(`Stade : ${venue?.name}\n`);

  // -------------------------------------------------------------------------
  // 2. Créer ou trouver le match
  // -------------------------------------------------------------------------
  console.log("--- Création du match ---");

  let match = await prisma.match.findFirst({
    where: { seasonId: season.id, matchday: 20, competitionId: top14.id },
  });

  if (match) {
    console.log(`  Match existant : ${match.slug} (${match.id})`);
  } else {
    const slug = generateMatchSlug({
      competitionShortName: top14.shortName,
      competitionName: top14.name,
      opponentShortName: opponent.shortName,
      opponentName: opponent.name,
      isHome: true,
      matchday: 20,
      round: null,
      date: new Date("2026-03-28"),
    });

    match = await prisma.match.create({
      data: {
        slug,
        date: new Date("2026-03-28"),
        seasonId: season.id,
        competitionId: top14.id,
        matchday: 20,
        isHome: true,
        venueId: venue?.id ?? null,
        opponentId: opponent.id,
        scoreUsap: 36,
        scoreOpponent: 20,
        result: MatchResult.VICTOIRE,
        bonusOffensif: true,
        bonusDefensif: false,
      },
    });
    console.log(`  Match créé : ${match.slug} (${match.id})`);
  }

  // -------------------------------------------------------------------------
  // 3. Arbitre
  // -------------------------------------------------------------------------
  console.log("\n--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Thomas", "Charabas");

  // -------------------------------------------------------------------------
  // 4. Mettre à jour les infos générales du match
  // -------------------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score : USAP 36 - 20 Toulon (domicile)
   * Mi-temps : USAP 24 - 10 Toulon
   *
   * USAP : 5E(Yato 8', Ecochard 25', Oviedo 34', Allan 74', Forner 81')
   *      + 4T(Urdapilleta×3 9' 27' 35', Allan 82') + 1P(Urdapilleta ~5') = 25+8+3 = 36
   * RCT : 3E(Alainu'uese 14', Shioshvili 51', Ludlam 56')
   *      + 1T(Jaminet 15') + 1P(Jaminet ~30') = 15+2+3 = 20
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:35",
      refereeId,
      halfTimeUsap: 24,
      halfTimeOpponent: 10,
      triesUsap: 5,
      conversionsUsap: 4,
      penaltiesUsap: 1,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      triesOpponent: 3,
      conversionsOpponent: 1,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      bonusOffensif: true,
      report:
        "Belle victoire de l'USAP à Aimé-Giral avec bonus offensif (5 essais) ! " +
        "Les Catalans démarrent fort : pénalité d'Urdapilleta (5'), puis Yato ouvre " +
        "le compteur d'essais (8'). Alainu'uese répond pour Toulon (14') mais Ecochard " +
        "(25') et Oviedo (34') creusent l'écart. Mi-temps 24-10. En seconde période, " +
        "Toulon revient à 24-20 avec Shioshvili (51') et Ludlam (56'), mais Allan entré " +
        "en jeu inscrit un essai précieux (74') et Forner scelle le bonus en fin de match (81'). " +
        "Victoire capitale dans la course au maintien.",
    },
  });
  console.log("  Match mis à jour");

  // -------------------------------------------------------------------------
  // 5. Composition USAP (23 joueurs)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition USAP ---");
  const deleted = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);

    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;

    // Yato : 1 essai (8')
    if (p.lastName === "Yato") { tries = 1; totalPoints = 5; }
    // Ecochard : 1 essai (25')
    if (p.lastName === "Ecochard") { tries = 1; totalPoints = 5; }
    // Oviedo : 1 essai (34')
    if (p.lastName === "Oviedo") { tries = 1; totalPoints = 5; }
    // Allan : 1 essai (74') + 1 transformation (82') = 7 pts
    if (p.lastName === "Allan") { tries = 1; conversions = 1; totalPoints = 7; }
    // Forner : 1 essai (81')
    if (p.lastName === "Forner") { tries = 1; totalPoints = 5; }
    // Urdapilleta : 3 transformations + 1 pénalité = 9 pts
    if (p.lastName === "Urdapilleta") { conversions = 3; penalties = 1; totalPoints = 9; }

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
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const extra = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName}${extra}`);
  }

  // -------------------------------------------------------------------------
  // 6. Composition Toulon (adversaire)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition Toulon ---");

  for (const p of RCT_SQUAD) {
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
  // 7. Liens joueurs-saison
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
  // 8. Événements du match (timeline)
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
    // 5' - Pénalité Urdapilleta (USAP) 3-0
    { minute: 5, type: "PENALITE", playerLastName: "Urdapilleta", isUsap: true,
      description: "Pénalité de Benjamin Urdapilleta (USAP). 3-0." },
    // 8' - Essai Yato (USAP) 8-0
    { minute: 8, type: "ESSAI", playerLastName: "Yato", isUsap: true,
      description: "Essai de Peceli Yato (USAP). 8-0." },
    // 9' - Transformation Urdapilleta (USAP) 10-0
    { minute: 9, type: "TRANSFORMATION", playerLastName: "Urdapilleta", isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). 10-0." },
    // 14' - Essai Alainu'uese (Toulon) 10-5
    { minute: 14, type: "ESSAI", isUsap: false,
      description: "Essai de Brian Alainu'uese (Toulon). 10-5." },
    // 15' - Transformation Jaminet (Toulon) 10-7
    { minute: 15, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Melvyn Jaminet (Toulon). 10-7." },
    // 25' - Essai Ecochard (USAP) 15-7
    { minute: 25, type: "ESSAI", playerLastName: "Ecochard", isUsap: true,
      description: "Essai de Tom Ecochard (USAP). 15-7." },
    // 27' - Transformation Urdapilleta (USAP) 17-7
    { minute: 27, type: "TRANSFORMATION", playerLastName: "Urdapilleta", isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). 17-7." },
    // 30' - Pénalité Jaminet (Toulon) 17-10
    { minute: 30, type: "PENALITE", isUsap: false,
      description: "Pénalité de Melvyn Jaminet (Toulon). 17-10." },
    // 34' - Essai Oviedo (USAP) 22-10
    { minute: 34, type: "ESSAI", playerLastName: "Oviedo", isUsap: true,
      description: "Essai de Joaquin Oviedo (USAP). 22-10." },
    // 35' - Transformation Urdapilleta (USAP) 24-10
    { minute: 35, type: "TRANSFORMATION", playerLastName: "Urdapilleta", isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). 24-10." },

    // === MI-TEMPS : USAP 24 - 10 Toulon ===

    // === SECONDE MI-TEMPS ===
    // 51' - Essai Shioshvili (Toulon) 24-15
    { minute: 51, type: "ESSAI", isUsap: false,
      description: "Essai de Mikheili Shioshvili (Toulon). 24-15." },
    // 56' - Essai Ludlam (Toulon) 24-20
    { minute: 56, type: "ESSAI", isUsap: false,
      description: "Essai de Lewis Ludlam (Toulon). Toulon revient à 4 points. 24-20." },
    // 74' - Essai Allan (USAP) 29-20
    { minute: 74, type: "ESSAI", playerLastName: "Allan", isUsap: true,
      description: "Essai de Tommaso Allan (USAP). L'USAP reprend le large. 29-20." },
    // 81' - Essai Forner (USAP) 34-20
    { minute: 81, type: "ESSAI", playerLastName: "Forner", isUsap: true,
      description: "Essai de Théo Forner (USAP). Bonus offensif ! 34-20." },
    // 82' - Transformation Allan (USAP) 36-20
    { minute: 82, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 36-20. Score final." },
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

    const side = evt.isUsap ? "USAP" : "RCT";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // -------------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 36 - 20 Toulon (domicile)");
  console.log("  Mi-temps : USAP 24 - 10 Toulon");
  console.log("  Arbitre : Thomas Charabas");
  console.log("  Stade : Aimé-Giral");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition Toulon : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  5 essais USAP : Yato, Ecochard, Oviedo, Allan, Forner");
  console.log("  BONUS OFFENSIF !");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

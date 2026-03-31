/**
 * Mise à jour du match USAP - Toulon (J5 Top 14, 04/11/2023)
 * Score : USAP 26 - 22 RC Toulon
 *
 * Première victoire de la saison pour l'USAP ! Biggar sort sur blessure (11').
 * Allan buteur décisif avec 4 pénalités et 2 transformations (16 pts).
 * Essais : Velarte (32'), Veredamu (70') / Ollivon (9'), Luc (27'), Serin (80').
 *
 * Sources : top14.lnr.fr, itsrugby.fr, francebleu.fr, blog-rct.com, dailymotion
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j5.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2023-2024/j5/10283-perpignan-toulon/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 59, subOut: 59 },
  { num: 3, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 59, subOut: 59 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 28, subOut: 28 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 21, subOut: 21 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 50, subOut: 50 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Alistair", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Mathieu", lastName: "Acebes", position: Position.CENTRE, isStarter: true, isCaptain: true, minutesPlayed: 70, subOut: 70 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 21, subIn: 59 },       // remplace Lam 59'
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 28, subIn: 52 },  // remplace Tetrashvili 52'
  { num: 18, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 28, subIn: 52 },    // remplace Labouteley 52'
  { num: 19, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 52, subIn: 28 }, // remplace Sobela 28'
  { num: 20, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 59, subIn: 21 },     // remplace Oviedo 21'
  { num: 21, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 30, subIn: 50 }, // remplace Ecochard 50'
  { num: 22, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: false, minutesPlayed: 10, subIn: 70 },    // remplace Acebes 70'
  { num: 23, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 21, subIn: 59 },    // remplace Ceccarelli 59'
];

// === COMPOSITION TOULON (adversaire) ===
const TOULON_SQUAD = [
  { num: 1, name: "Jean-Baptiste Gros", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Teddy Baubigny", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Beka Gigashvili", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Matthias Halagahu", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Komiti Junior Alainuuese", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Esteban Abadie", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Charles Ollivon", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, isCaptain: true },
  { num: 8, name: "Selevasio Tolofua", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Benjamin White", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Dan Biggar", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Gabin Villière", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Duncan Paia'aua", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Waisea Vuidravuwalu", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Gaël Dréan", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Aymeric Luc", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Christopher Tolofua", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Bruce Devaux", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Adrien Warion", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Cornell Du Preez", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Enzo Hervé", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 21, name: "Baptiste Serin", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Setariki Tuicuvu", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Kieran Brookes", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Toulon (J5, 04/11/2023) ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver le match
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 5, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // -------------------------------------------------------------------------
  // 2. Arbitre
  // -------------------------------------------------------------------------
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Thomas", "Charabas");

  // -------------------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // -------------------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score : USAP 26 - 22 RC Toulon
   * Mi-temps : USAP 16 - 15 RC Toulon
   *
   * USAP : 2E 2T 4P 0D = 10+4+12 = 26
   * Toulon : 3E 2T 1P 0D = 15+4+3 = 22
   */
  // Stade (Aimé-Giral, domicile)
  const venue = await prisma.venue.findFirst({ where: { name: { contains: "Giral" } } });

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      venueId: venue?.id ?? undefined,
      // Mi-temps
      halfTimeUsap: 16,
      halfTimeOpponent: 15,
      // Détail scoring USAP
      triesUsap: 2,
      conversionsUsap: 2,
      penaltiesUsap: 4,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Toulon
      triesOpponent: 3,
      conversionsOpponent: 2,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Vidéo
      videoUrl: "https://www.dailymotion.com/video/x8pdi23",
      // Rapport
      report:
        "Première victoire de la saison pour l'USAP ! Face à un Toulon privé de Biggar dès la 11e minute " +
        "(blessure), les Catalans s'imposent dans un match accroché. Allan, impérial au pied (4/4 aux pénalités, " +
        "2 transformations, 16 pts), lance l'USAP avec deux pénalités (6', 17'). Toulon réplique par des essais " +
        "d'Ollivon (9') et Luc (27') pour mener 15-13, mais Allan remet l'USAP devant à la pause (16-15). " +
        "En seconde période, une nouvelle pénalité d'Allan (59') puis l'essai de Veredamu (70') font le break. " +
        "Serin réduit l'écart in extremis (80') mais l'USAP tient bon. 13 000 spectateurs à Aimé-Giral.",
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

    // Velarte : 1 essai (32') — remplaçant entré à 21'
    if (p.lastName === "Velarte") { tries = 1; totalPoints = 5; }
    // Veredamu : 1 essai (70')
    if (p.lastName === "Veredamu") { tries = 1; totalPoints = 5; }
    // Allan : 2 transformations + 4 pénalités = 16 pts
    if (p.lastName === "Allan") { conversions = 2; penalties = 4; totalPoints = 16; }

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
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null,
        subOut: (p as any).subOut ?? null,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [
      p.isCaptain ? "(C)" : "",
      totalPoints > 0 ? `(${totalPoints} pts)` : "",
      sub,
      `[${p.minutesPlayed}']`,
    ].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // -------------------------------------------------------------------------
  // 5. Composition Toulon (adversaire)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition Toulon ---");

  for (const p of TOULON_SQUAD) {
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
    // 6' - Pénalité Allan (USAP) 3-0
    { minute: 6, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 3-0." },
    // 9' - Essai Ollivon (Toulon) 3-5
    { minute: 9, type: "ESSAI", isUsap: false,
      description: "Essai de Charles Ollivon (Toulon). Non transformé. 3-5." },
    // 17' - Pénalité Allan (USAP) 6-5
    { minute: 17, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 6-5." },
    // 27' - Essai Luc (Toulon) 6-10, transformation Hervé 6-12
    { minute: 27, type: "ESSAI", isUsap: false,
      description: "Essai d'Aymeric Luc (Toulon). 6-10." },
    { minute: 28, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation d'Enzo Hervé (Toulon). 6-12." },
    // 32' - Essai Velarte (USAP) 11-12, transformation Allan 13-12
    { minute: 32, type: "ESSAI", playerLastName: "Velarte", isUsap: true,
      description: "Essai de Lucas Velarte (USAP). 11-12." },
    { minute: 33, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 13-12." },
    // 37' - Pénalité Hervé (Toulon) 13-15
    { minute: 37, type: "PENALITE", isUsap: false,
      description: "Pénalité d'Enzo Hervé (Toulon). 13-15." },
    // 40' - Pénalité Allan (USAP) 16-15
    { minute: 40, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 16-15." },
    // === MI-TEMPS : USAP 16 - 15 Toulon ===
    // 59' - Pénalité Allan (USAP) 19-15
    { minute: 59, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 19-15." },
    // 70' - Essai Veredamu (USAP) 24-15, transformation Allan 26-15
    { minute: 70, type: "ESSAI", playerLastName: "Veredamu", isUsap: true,
      description: "Essai de Tavite Veredamu (USAP). 24-15." },
    { minute: 71, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 26-15." },
    // 80' - Essai Serin (Toulon) 26-20, transformation Hervé 26-22
    { minute: 80, type: "ESSAI", isUsap: false,
      description: "Essai de Baptiste Serin (Toulon). 26-20." },
    { minute: 80, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation d'Enzo Hervé (Toulon). 26-22." },
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

    const side = evt.isUsap ? "USAP" : "TLN";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // -------------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 26 - 22 RC Toulon");
  console.log("  Mi-temps : USAP 16 - 15 Toulon");
  console.log("  Arbitre : Thomas Charabas");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition Toulon : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  Première victoire de la saison !");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

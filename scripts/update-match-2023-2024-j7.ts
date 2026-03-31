/**
 * Mise à jour du match USAP - Montpellier (J7 Top 14, 18/11/2023)
 * Score : USAP 23 - 16 Montpellier
 *
 * Victoire de l'USAP à Aimé-Giral face au MHR, première depuis 2013 !
 * Match marqué par 3 cartons jaunes (Tuilagi 5', Stooke 35', Latu 40').
 * Essai de pénalité accordé à l'USAP après le CJ de Latu.
 * Crossdale scelle la victoire à la 71' sur passe au pied de McIntyre.
 *
 * Essais USAP : Pénalité (40'), Crossdale (71')
 * Essai Montpellier : Garbisi (16')
 *
 * Sources : top14.lnr.fr, itsrugby.fr, francebleu.fr, usap.fr
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j7.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2023-2024/j7/10298-perpignan-montpellier/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 49, subOut: 49 },
  { num: 3, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 49, subOut: 49 },
  { num: 4, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 49, subOut: 49 },
  { num: 8, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 74, subOut: 74 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 74, subOut: 74 },
  { num: 11, firstName: "Alistair", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 31, subIn: 49 },              // remplace Lam 49'
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 18, subIn: 62 },         // remplace Tetrashvili 62'
  { num: 18, firstName: "Mathieu", lastName: "Tanguy", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 31, subIn: 49 },          // remplace Ceccarelli 49'
  { num: 19, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 31, subIn: 49 }, // remplace Brazo 49'
  { num: 20, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 6, subIn: 74 },             // remplace Fa'aso'o 74'
  { num: 21, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 23, subIn: 57 },        // remplace Ecochard 57'
  { num: 22, firstName: "Mathieu", lastName: "Acebes", position: Position.CENTRE, isStarter: false, minutesPlayed: 6, subIn: 74 },                 // remplace McIntyre 74'
  { num: 23, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 18, subIn: 62 },             // remplace ??? 62'
];

// === COMPOSITION MONTPELLIER (adversaire) ===
const MHR_SQUAD = [
  { num: 1, name: "Enzo Forletta", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Silatolu Latu", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Henry Thomas", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Elliott Stooke", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Paul Willemse", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Yacouba Camara", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Lenni Nouchi", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Sam Simmonds", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Cobus Reinach", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Paolo Garbisi", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "George Bridge", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Arthur Vincent", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Thomas Darmon", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Gabriel Ngandebe", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Julien Tisseron", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Vano Karkadze", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Baptiste Erdocio", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Bastien Chalureau", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Alexandre Bécognée", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Benoît Paillaugue", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Louis Carbonel", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Alexandre De Nardi", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "George Tu'inukuafe", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Montpellier (J7, 18/11/2023) ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver le match
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 7, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // -------------------------------------------------------------------------
  // 2. Arbitre
  // -------------------------------------------------------------------------
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Pierre-Baptiste", "Nuchy");

  // -------------------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // -------------------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score : USAP 23 - 16 Montpellier
   * Mi-temps : USAP 16 - 10 Montpellier
   *
   * USAP : 1E 1EP 1T 3P 0D = 5+5+2+9 = 21... non
   * USAP : 1E(Crossdale) + 1EP + 2T(Allan) + 3P(Allan) = 5+5+4+9 = 23
   * MHR : 1E(Garbisi) + 1T(Tisseron) + 3P(Garbisi) = 5+2+9 = 16
   *
   * CJ Tuilagi (5'), CJ Stooke (35'), CJ Latu (40')
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
      halfTimeOpponent: 10,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 2,
      penaltiesUsap: 3,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 1,
      // Détail scoring Montpellier
      triesOpponent: 1,
      conversionsOpponent: 1,
      penaltiesOpponent: 3,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Victoire de l'USAP à Aimé-Giral face à Montpellier, la première depuis 2013 ! " +
        "Match tendu malgré un CJ précoce de Tuilagi (5'). Allan maintient l'USAP au score au pied " +
        "(3 pénalités). Garbisi répond par un essai transformé (16') mais l'USAP obtient un essai " +
        "de pénalité (40') après le CJ de Latu, menant 16-10 à la pause. En seconde période, " +
        "Garbisi réduit l'écart (42', 47') mais Crossdale scelle la victoire à la 71' sur une " +
        "superbe passe au pied de McIntyre. Patrick Sobela élu homme du match.",
      // Vidéo
      videoUrl: "https://www.youtube.com/watch?v=kIkpr9cxj3g",
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

    // Allan : 3 pénalités (13', 20', 33') + 2 transformations (40' EP, 71' Crossdale) = 9+4 = 13 pts
    if (p.lastName === "Allan" && p.num === 15) { penalties = 3; conversions = 2; totalPoints = 13; }
    // Crossdale : 1 essai (71')
    if (p.lastName === "Crossdale") { tries = 1; totalPoints = 5; }
    // Tuilagi : CJ 5'
    if (p.lastName === "Tuilagi") { yellowCard = true; yellowCardMin = 5; }

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
  // 5. Composition Montpellier (adversaire)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition Montpellier ---");

  for (const p of MHR_SQUAD) {
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
    // 5' - CJ Tuilagi (USAP)
    { minute: 5, type: "CARTON_JAUNE", playerLastName: "Tuilagi", isUsap: true,
      description: "Carton jaune Posolo Tuilagi (USAP). USAP à 14." },
    // 6' - Pénalité Garbisi (MHR) 0-3
    { minute: 6, type: "PENALITE", isUsap: false,
      description: "Pénalité de Paolo Garbisi (MHR). 0-3." },
    // 13' - Pénalité Allan (USAP) 3-3
    { minute: 13, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 3-3." },
    // 16' - Essai Garbisi (MHR) + Conv Tisseron 3-10
    { minute: 16, type: "ESSAI", isUsap: false,
      description: "Essai de Paolo Garbisi (MHR). 3-8." },
    { minute: 17, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Julien Tisseron (MHR). 3-10." },
    // 20' - Pénalité Allan (USAP) 6-10
    { minute: 20, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 6-10." },
    // 33' - Pénalité Allan (USAP) 9-10
    { minute: 33, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 9-10." },
    // 35' - CJ Stooke (MHR)
    { minute: 35, type: "CARTON_JAUNE", isUsap: false,
      description: "Carton jaune Elliott Stooke (MHR). MHR à 14." },
    // 40' - CJ Latu (MHR) + Essai de pénalité USAP + Conv Allan 16-10
    { minute: 40, type: "CARTON_JAUNE", isUsap: false,
      description: "Carton jaune Silatolu Latu (MHR). Essai de pénalité accordé à l'USAP." },
    { minute: 40, type: "ESSAI_PENALITE", isUsap: true,
      description: "Essai de pénalité (USAP). 14-10." },
    { minute: 40, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 16-10." },
    // === MI-TEMPS : USAP 16 - 10 MHR ===
    // 42' - Pénalité Garbisi (MHR) 16-13
    { minute: 42, type: "PENALITE", isUsap: false,
      description: "Pénalité de Paolo Garbisi (MHR). 16-13." },
    // 47' - Pénalité Garbisi (MHR) 16-16
    { minute: 47, type: "PENALITE", isUsap: false,
      description: "Pénalité de Paolo Garbisi (MHR). 16-16." },
    // 71' - Essai Crossdale (USAP) + Conv Allan 23-16
    { minute: 71, type: "ESSAI", playerLastName: "Crossdale", isUsap: true,
      description: "Essai d'Alistair Crossdale (USAP). Passe au pied de McIntyre. 21-16." },
    { minute: 72, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 23-16." },
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

    const side = evt.isUsap ? "USAP" : "MHR";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // -------------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 23 - 16 Montpellier (domicile)");
  console.log("  Mi-temps : USAP 16 - 10 MHR");
  console.log("  Arbitre : Pierre-Baptiste Nuchy");
  console.log("  Stade : Aimé-Giral");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition MHR : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  3 CJ : Tuilagi (5'), Stooke (35'), Latu (40')");
  console.log("  Sobela homme du match");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

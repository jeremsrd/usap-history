/**
 * Mise à jour du match Racing 92 - USAP (J3 Top 14, 02/09/2023)
 * Score : Racing 92 59 - 10 USAP
 *
 * 2 cartons jaunes USAP : Velarte (19'), Joly (63')
 *
 * Sources : top14.lnr.fr, lequipe.fr, defense-92.fr, dailymotion
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j3.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug, generateVenueSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2023-2024/j3/10275-racing-92-perpignan/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, firstName: "Jérémy", lastName: "Maurouard", position: Position.TALONNEUR, isStarter: true },
  { num: 3, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, isCaptain: true },
  { num: 11, firstName: "Alistair", lastName: "Crossdale", position: Position.AILIER, isStarter: true },
  { num: 12, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true },
  { num: 13, firstName: "Mathieu", lastName: "Acebes", position: Position.CENTRE, isStarter: true },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Louis", lastName: "Dupichot", position: Position.ARRIERE, isStarter: true },
  // Remplaçants
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, firstName: "Apisai", lastName: "Naqalevu", position: Position.CENTRE, isStarter: false },
  { num: 22, firstName: "Boris", lastName: "Goutard", position: Position.AILIER, isStarter: false },
  { num: 23, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: false },
];

// === COMPOSITION RACING 92 (adversaire) ===
const RACING_SQUAD = [
  { num: 1, name: "Eddy Ben Arous", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Janick Tarrit", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Thomas Laclayat", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Baptiste Chouzenoux", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Fabien Sanconnie", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Ibrahim Diallo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Maxime Baudonne", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Jordan Joseph", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Nolann Le Garrec", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Antoine Gibert", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Wame Naituvi", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Henry Chavancy", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Olivier Klemenczak", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Donovan Taofifénua", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Max Spring", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Camille Chat", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Thomas Moukoro Abouem", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Semisi Veikoso Poloniati", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Anthime Hémery", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Clovis Le Bail", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Tristan James Tedder", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Francis Saili", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Cedate Gomes Sa", position: Position.PILIER_DROIT, isStarter: false },
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

async function findOrCreateVenue(
  name: string,
  city: string,
  capacity?: number,
): Promise<string> {
  const existing = await prisma.venue.findFirst({
    where: { name: { contains: name.split(" ")[0], mode: "insensitive" } },
  });
  if (existing) {
    console.log(`  [stade] Existe : ${existing.name}`);
    return existing.id;
  }
  const france = await prisma.country.findFirst({ where: { code: "FR" } });
  const venue = await prisma.venue.create({
    data: {
      name,
      city,
      countryId: france?.id,
      capacity,
      isHomeGround: false,
      slug: `temp-${Date.now()}`,
    },
  });
  await prisma.venue.update({
    where: { id: venue.id },
    data: { slug: generateVenueSlug(name, venue.id) },
  });
  console.log(`  [stade] Créé : ${name}`);
  return venue.id;
}

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log("=== Mise à jour match Racing 92 - USAP (J3, 02/09/2023) ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver le match
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 3, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  Racing 92 ${match.scoreOpponent} - ${match.scoreUsap} USAP\n`);

  // -------------------------------------------------------------------------
  // 2. Stade & Arbitre
  // -------------------------------------------------------------------------
  console.log("--- Stade & Arbitre ---");
  const venueId = await findOrCreateVenue("Paris La Défense Arena", "Nanterre", 32000);
  const refereeId = await findOrCreateReferee("Vivien", "Praderie");

  // -------------------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // -------------------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score : Racing 92 59 - 10 USAP
   * Mi-temps : Racing 40 - 0 USAP
   *
   * Racing : 9E 7T 0P 0D = 45+14 = 59
   * USAP : 2E 0T 0P 0D = 10
   *
   * 2 cartons jaunes USAP : Velarte (19'), Joly (63')
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      venueId,
      refereeId,
      attendance: null, // Non communiqué
      // Mi-temps
      halfTimeUsap: 0,
      halfTimeOpponent: 40,
      // Détail scoring USAP
      triesUsap: 2,
      conversionsUsap: 0,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Racing 92
      triesOpponent: 9,
      conversionsOpponent: 7,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Vidéo
      videoUrl: "https://www.dailymotion.com/video/x8np45v",
      // Rapport
      report:
        "Apocalypse à La Défense Arena. L'USAP subit la pire défaite de son début de saison " +
        "avec 9 essais encaissés et 40-0 à la mi-temps. " +
        "Cartons jaunes pour Velarte (19') et Joly (63'). " +
        "Dubois (47') et Velarte (57') sauvent l'honneur en seconde période. " +
        "3e défaite consécutive, 0 point au classement.",
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

    // Stats individuelles
    let tries = 0, totalPoints = 0;
    let yellowCard = false, yellowCardMin: number | null = null;
    let redCard = false, redCardMin: number | null = null;

    // Dubois : 1 essai (47')
    if (p.lastName === "Dubois") { tries = 1; totalPoints = 5; }
    // Velarte : 1 essai (57') + CJ (19')
    if (p.lastName === "Velarte") { tries = 1; totalPoints = 5; yellowCard = true; yellowCardMin = 19; }
    // Joly : CJ (63')
    if (p.lastName === "Joly") { yellowCard = true; yellowCardMin = 63; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
        tries, conversions: 0, penalties: 0, totalPoints,
        yellowCard, yellowCardMin,
        redCard, redCardMin,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const extra = [
      p.isCaptain ? "(C)" : "",
      totalPoints > 0 ? `(${totalPoints} pts)` : "",
      yellowCard ? `[CJ ${yellowCardMin}']` : "",
      redCard ? `[CR ${redCardMin}']` : "",
    ].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // -------------------------------------------------------------------------
  // 5. Composition Racing 92 (adversaire)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition Racing 92 ---");

  for (const p of RACING_SQUAD) {
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
    // 10' - Essai Gibert (Racing) 5-0
    { minute: 10, type: "ESSAI", isUsap: false,
      description: "Essai d'Antoine Gibert (Racing 92). 5-0." },
    { minute: 11, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Nolann Le Garrec (Racing 92). 7-0." },
    // 14' - Essai Jordan Joseph (Racing) 12-0
    { minute: 14, type: "ESSAI", isUsap: false,
      description: "Essai de Jordan Joseph (Racing 92). 12-0." },
    { minute: 15, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Nolann Le Garrec (Racing 92). 14-0." },
    // 19' - CJ Velarte (USAP)
    { minute: 19, type: "CARTON_JAUNE", playerLastName: "Velarte", isUsap: true,
      description: "Carton jaune Lucas Velarte (USAP)." },
    // 20' - Essai Laclayat (Racing) 19-0
    { minute: 20, type: "ESSAI", isUsap: false,
      description: "Essai de Thomas Laclayat (Racing 92). 19-0." },
    { minute: 21, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Nolann Le Garrec (Racing 92). 21-0." },
    // 27' - Essai Jordan Joseph (Racing) 26-0
    { minute: 27, type: "ESSAI", isUsap: false,
      description: "2e essai de Jordan Joseph (Racing 92). 26-0." },
    { minute: 28, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Nolann Le Garrec (Racing 92). 28-0." },
    // 33' - Essai Naituvi (Racing) non transformé 33-0
    { minute: 33, type: "ESSAI", isUsap: false,
      description: "Essai de Wame Naituvi (Racing 92). Non transformé. 33-0." },
    // 39' - 6e essai Racing 38-0
    { minute: 39, type: "ESSAI", isUsap: false,
      description: "6e essai du Racing 92. 38-0." },
    // === MI-TEMPS : Racing 40 - 0 USAP ===
    // 6 essais + 5 conv en 1ère MT = 30+10 = 40
    { minute: 40, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation (Racing 92). 40-0 à la mi-temps." },
    // 43' - Essai Laclayat (Racing) reprise 2e MT
    { minute: 43, type: "ESSAI", isUsap: false,
      description: "Essai de Thomas Laclayat (Racing 92). 45-0." },
    { minute: 44, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Nolann Le Garrec (Racing 92). 47-0." },
    // 47' - Essai Dubois (USAP) non transformé
    { minute: 47, type: "ESSAI", playerLastName: "Dubois", isUsap: true,
      description: "Essai de Lucas Dubois (USAP). Non transformé. 47-5." },
    // 57' - Essai Velarte (USAP) non transformé
    { minute: 57, type: "ESSAI", playerLastName: "Velarte", isUsap: true,
      description: "Essai de Lucas Velarte (USAP). Non transformé. 47-10." },
    // 63' - CJ Joly (USAP)
    { minute: 63, type: "CARTON_JAUNE", playerLastName: "Joly", isUsap: true,
      description: "Carton jaune Arthur Joly (USAP)." },
    // 64' - Essai Naituvi (Racing) non conv
    { minute: 64, type: "ESSAI", isUsap: false,
      description: "Essai de Wame Naituvi (Racing 92). Non transformé. 52-10." },
    // 70' - Essai Gomes Sa (Racing)
    { minute: 70, type: "ESSAI", isUsap: false,
      description: "Essai de Cedate Gomes Sa (Racing 92). 57-10." },
    { minute: 71, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Tristan Tedder (Racing 92). 59-10." },
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

  // -------------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Racing 92 59 - 10 USAP");
  console.log("  Mi-temps : Racing 40 - 0 USAP");
  console.log("  Arbitre : Vivien Praderie");
  console.log("  Stade : Paris La Défense Arena");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition Racing 92 : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  2 cartons jaunes USAP : Velarte (19'), Joly (63')");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

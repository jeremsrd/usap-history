/**
 * Mise à jour du match La Rochelle - USAP (J3 Top 14, 17/09/2022)
 * Score : USAP 8 - La Rochelle 43
 *
 * Lourde défaite à Marcel-Deflandre. Équipe très remaniée côté USAP.
 * La Rochelle inscrit 7 essais dont un doublé de Harry Glynn (première
 * titularisation). L'USAP est submergé dès le début (26-3 à la pause).
 * Seul Ramasibana sauve l'honneur (essai 57'). McIntyre 1 pénalité (40').
 * Deux cartons jaunes USAP : Tadjer (30') et Goutard (70').
 *
 * Essais La Rochelle : Alldritt (4'), Glynn (20', 39'), Bourgarit (32'),
 *   Colombe (73'), Favre (76'), Bourdeau (79')
 * Essai USAP : Ramasibana (57')
 * Pénalité USAP : McIntyre (40')
 * CJ : Tadjer (30', USAP), Goutard (70', USAP)
 *
 * Sources : top14.lnr.fr (compositions), itsrugby.fr (score par minute),
 *   staderochelais.com (résumé officiel), allrugby.com (évolution score)
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j3.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP (équipe très remaniée) ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 51, subOut: 51, yellowCard: true, yellowCardMin: 30 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 4, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 5, firstName: "Andrei", lastName: "Mahu", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Taniela", lastName: "Ramasibana", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Ewan", lastName: "Bertheau", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 41, subOut: 41 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 56, subOut: 56 },
  { num: 11, firstName: "Théo", lastName: "Forner", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "George", lastName: "Tilsley", position: Position.CENTRE, isStarter: true, minutesPlayed: 66, subOut: 66 },
  { num: 13, firstName: "Dorian", lastName: "Laborde", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Eddie", lastName: "Sawailau", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80, yellowCard: true, yellowCardMin: 70 },
  // Remplaçants
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 17, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Valentin", lastName: "Moro", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 19, firstName: "Posolo", lastName: "Tuilagi", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 39, subIn: 41 },
  { num: 20, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 21, firstName: "Patricio", lastName: "Fernandez", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 24, subIn: 56 },
  { num: 22, firstName: "Nino", lastName: "Séguela", position: Position.CENTRE, isStarter: false, minutesPlayed: 14, subIn: 66 },
  { num: 23, firstName: "Siosiaia", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 29, subIn: 51 },
];

// === COMPOSITION LA ROCHELLE (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Léo Aouf", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Pierre Bourgarit", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Uini Atonio", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Rémi Picquette", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Will Skelton", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Rémi Bourdeau", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Paul Boudehent", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Grégory Alldritt", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Jules Le Bail", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Harry Glynn", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Jules Favre", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Jonathan Danty", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Ulupano Seuteni", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Teddy Thomas", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Dillyn Leyds", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Samuel Lagrange", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Thierry Paiva", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Romain Sazy", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Noé Della Schiava", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Thomas Berjon", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Pierre Boudehent", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 22, name: "Martin Alonso Muñoz", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Georges-Henri Colombe", position: Position.PILIER_DROIT, isStarter: false },
];

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

async function findOrCreatePlayer(firstName: string, lastName: string, position: Position): Promise<string> {
  const existing = await prisma.player.findFirst({
    where: { firstName: { equals: firstName, mode: "insensitive" }, lastName: { equals: lastName, mode: "insensitive" } },
  });
  if (existing) return existing.id;
  const player = await prisma.player.create({
    data: { firstName, lastName, position, isActive: false, slug: `temp-${Date.now()}-${Math.random()}` },
  });
  await prisma.player.update({ where: { id: player.id }, data: { slug: generatePlayerSlug(firstName, lastName, player.id) } });
  console.log(`  [joueur] Créé : ${firstName} ${lastName}`);
  return player.id;
}

async function findOrCreateReferee(firstName: string, lastName: string): Promise<string> {
  const existing = await prisma.referee.findFirst({
    where: { firstName: { equals: firstName, mode: "insensitive" }, lastName: { equals: lastName, mode: "insensitive" } },
  });
  if (existing) { console.log(`  [arbitre] Existe : ${firstName} ${lastName}`); return existing.id; }
  const referee = await prisma.referee.create({ data: { firstName, lastName, slug: `temp-${Date.now()}` } });
  await prisma.referee.update({ where: { id: referee.id }, data: { slug: generateRefereeSlug(firstName, lastName, referee.id) } });
  console.log(`  [arbitre] Créé : ${firstName} ${lastName}`);
  return referee.id;
}

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log("=== Mise à jour match La Rochelle - USAP (J3, 17/09/2022) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 3, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Benoît", "Rousselet");

  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({ where: { name: { contains: "Deflandre" } } });
  if (!venue) {
    venue = await prisma.venue.create({
      data: { name: "Stade Marcel-Deflandre", city: "La Rochelle", capacity: 16000 },
    });
    console.log("  [stade] Créé : Stade Marcel-Deflandre");
  } else {
    console.log(`  [stade] Existe : ${venue.name}`);
  }

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      venueId: venue.id,
      halfTimeUsap: 3,
      halfTimeOpponent: 26,
      // USAP : 1E + 0T + 1P = 5+0+3 = 8
      triesUsap: 1, conversionsUsap: 0, penaltiesUsap: 1, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // La Rochelle : 7E + 4T = 35+8 = 43
      triesOpponent: 7, conversionsOpponent: 4, penaltiesOpponent: 0, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Lourde défaite à Marcel-Deflandre. L'USAP, très remanié, est submergé d'entrée. " +
        "Alldritt ouvre le bal dès la 4' (essai transformé par Le Bail, 7-0). " +
        "Harry Glynn, pour sa première titularisation, intercepte et file à l'essai (20', 12-0). " +
        "Carton jaune Tadjer (30') : Bourgarit en profite immédiatement (32', transformé, 19-0). " +
        "Glynn signe le doublé (39', transformé, 26-0). McIntyre sauve l'honneur avant la pause (pénalité, 40', 26-3). " +
        "En 2e MT, Ramasibana marque le seul essai catalan (57', non transformé, 26-8). " +
        "Carton jaune Goutard (70'). La Rochelle déroule en fin de match : " +
        "Colombe (73'), Favre (76', transformé) et Bourdeau (79'). Score final : 43-8.",
    },
  });
  console.log("  Match mis à jour");

  // Composition USAP
  console.log("\n--- Composition USAP ---");
  const deleted = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);
    let tries = 0, penalties = 0, totalPoints = 0;
    const yellowCard = (p as any).yellowCard ?? false;
    const yellowCardMin = (p as any).yellowCardMin ?? null;

    // McIntyre : 1P = 3 pts
    if (p.lastName === "McIntyre") { penalties = 1; totalPoints = 3; }
    // Ramasibana : 1E = 5 pts
    if (p.lastName === "Ramasibana") { tries = 1; totalPoints = 5; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain: false, positionPlayed: p.position,
        tries, conversions: 0, penalties, totalPoints,
        yellowCard, yellowCardMin,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", yellowCard ? `[CJ ${yellowCardMin}']` : "", sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // Composition La Rochelle
  console.log("\n--- Composition Stade Rochelais ---");
  for (const p of OPP_SQUAD) {
    await prisma.matchPlayer.create({
      data: { matchId: match.id, isOpponent: true, opponentPlayerName: p.name, shirtNumber: p.num, isStarter: p.isStarter, isCaptain: false, positionPlayed: p.position },
    });
    console.log(`  ${p.isStarter ? "TIT" : "REM"} ${String(p.num).padStart(2, " ")}. ${p.name}`);
  }

  // Liens joueurs-saison
  console.log("\n--- Liens joueurs-saison ---");
  let linkedCount = 0;
  for (const p of USAP_SQUAD) {
    const player = await prisma.player.findFirst({ where: { firstName: { equals: p.firstName, mode: "insensitive" }, lastName: { equals: p.lastName, mode: "insensitive" } } });
    if (!player) continue;
    const exists = await prisma.seasonPlayer.findFirst({ where: { seasonId: season.id, playerId: player.id } });
    if (!exists) { await prisma.seasonPlayer.create({ data: { seasonId: season.id, playerId: player.id, position: p.position } }); linkedCount++; }
  }
  console.log(`  ${linkedCount} nouveau(x) lien(s) joueur-saison créé(s)`);

  // Événements
  console.log("\n--- Événements du match ---");
  const deletedEvents = await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
  if (deletedEvents.count > 0) console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events: Array<{ minute: number; type: string; playerLastName?: string; isUsap: boolean; description: string }> = [
    // === 1ère MI-TEMPS ===
    { minute: 4, type: "ESSAI", isUsap: false, description: "Essai de Grégory Alldritt (La Rochelle). 5-0." },
    { minute: 4, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Jules Le Bail (La Rochelle). 7-0." },
    { minute: 20, type: "ESSAI", isUsap: false, description: "Essai de Harry Glynn (La Rochelle). Interception pour sa 1re titularisation ! 12-0." },
    { minute: 30, type: "CARTON_JAUNE", playerLastName: "Tadjer", isUsap: true, description: "Carton jaune Mike Tadjer (USAP)." },
    { minute: 32, type: "ESSAI", isUsap: false, description: "Essai de Pierre Bourgarit (La Rochelle). En supériorité numérique. 17-0." },
    { minute: 32, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Jules Le Bail (La Rochelle). 19-0." },
    { minute: 39, type: "ESSAI", isUsap: false, description: "Essai de Harry Glynn (La Rochelle). Doublé ! 24-0." },
    { minute: 39, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Jules Le Bail (La Rochelle). 26-0." },
    { minute: 40, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 26-3." },
    // === MI-TEMPS : La Rochelle 26 - 3 USAP ===
    // === 2e MI-TEMPS ===
    { minute: 57, type: "ESSAI", playerLastName: "Ramasibana", isUsap: true, description: "Essai de Taniela Ramasibana (USAP). Non transformé. 26-8." },
    { minute: 70, type: "CARTON_JAUNE", playerLastName: "Goutard", isUsap: true, description: "Carton jaune Boris Goutard (USAP)." },
    { minute: 73, type: "ESSAI", isUsap: false, description: "Essai de Georges-Henri Colombe (La Rochelle). Non transformé. 31-8." },
    { minute: 76, type: "ESSAI", isUsap: false, description: "Essai de Jules Favre (La Rochelle). 36-8." },
    { minute: 76, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Thomas Berjon (La Rochelle). 38-8." },
    { minute: 79, type: "ESSAI", isUsap: false, description: "Essai de Rémi Bourdeau (La Rochelle). Non transformé. 43-8. Score final." },
  ];

  for (const evt of events) {
    let playerId: string | null = null;
    if (evt.isUsap && evt.playerLastName) {
      const player = await prisma.player.findFirst({ where: { lastName: { equals: evt.playerLastName, mode: "insensitive" } } });
      playerId = player?.id ?? null;
    }
    await prisma.matchEvent.create({
      data: { matchId: match.id, minute: evt.minute, type: evt.type as any, playerId, isUsap: evt.isUsap, description: evt.description },
    });
    const side = evt.isUsap ? "USAP" : "LR";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : La Rochelle 43 - 8 USAP (extérieur)");
  console.log("  Mi-temps : La Rochelle 26 - 3 USAP");
  console.log("  Arbitre : Benoît Rousselet");
  console.log("  USAP : McIntyre 1P (3 pts), Ramasibana 1E (5 pts)");
  console.log("  La Rochelle : 7 essais (Alldritt, Glynn x2, Bourgarit, Colombe, Favre, Bourdeau)");
  console.log("  2 CJ USAP : Tadjer (30'), Goutard (70')");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

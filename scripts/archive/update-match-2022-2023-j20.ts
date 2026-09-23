/**
 * Mise à jour du match USAP - Aviron Bayonnais (J20 Top 14, 04/03/2023)
 * Score : USAP 34 - 27 Aviron Bayonnais
 *
 * Victoire à domicile avec 4 essais. CJ Yann David (7').
 * McIntyre E (7', T McIntyre, 7-3). Crossdale E (18', T McIntyre, 14-3).
 * Buliruarua E Bayonne (22', T Lopez, 14-10).
 * Dubois E (24', T McIntyre, 21-10). Lopez P (29', 21-13).
 * Galletier E (39', T McIntyre, 28-13). Mi-temps : 28-13.
 * van Jaarsveld E Bayonne (46', T Lopez, 28-20).
 * Orabé E Bayonne (52', T Lopez, 28-27).
 * McIntyre P (68', 31-27). Tedder P (80', 34-27).
 *
 * Essais USAP : McIntyre (7'), Crossdale (18'), Dubois (24'), Galletier (39')
 * Transformations USAP : McIntyre (8', 19', 25', 40')
 * Pénalités USAP : McIntyre (68'), Tedder (80')
 * Essais Bayonne : Buliruarua (22'), van Jaarsveld (46'), Orabé (52')
 * Transformations Bayonne : Lopez (23', 47', 53')
 * Pénalités Bayonne : Lopez (7', 29')
 * CJ : Yann David (7', Bayonne)
 *
 * Sources : itsrugby.fr, allrugby.com, francebleu.fr, top14.lnr.fr
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j20.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 49, subOut: 49 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 49, subOut: 49 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 71, subOut: 71 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 6, firstName: "Brad", lastName: "Shields", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 80 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Ali", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 71, subOut: 71 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tristan", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 31, subIn: 49 },
  { num: 17, firstName: "Maafu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 31, subIn: 49 },
  { num: 18, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 26, subIn: 54 },
  { num: 19, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 26, subIn: 54 },
  { num: 20, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 26, subIn: 54 },
  { num: 21, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 0 },
  { num: 22, firstName: "Eddie", lastName: "Sawailau", position: Position.AILIER, isStarter: false, minutesPlayed: 9, subIn: 71 },
  { num: 23, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 9, subIn: 71 },
];

// === COMPOSITION AVIRON BAYONNAIS (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Swan Cormenier", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Facundo Bosch", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Pascal Cotet", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Denis Marchois", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Thomas Ceyte", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Pierre Huguet", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Baptiste Héguy", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Afa Amosa", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Maxime Machenaud", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Camille Lopez", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Marland Yarde", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Yann David", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Sireli Maqala", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Bastien Pourailly", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Yohan Orabé", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Torsten van Jaarsveld", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Quentin Béthune", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Manuel Leindekar", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Uzair Cassiem", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Guillaume Rouet", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Thomas Dolhagaray", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Eneriko Buliruarua", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Pieter Ernst Scholtz", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Aviron Bayonnais (J20, 04/03/2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 20, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Adrien", "Marbot");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:15",
      refereeId,
      halfTimeUsap: 28,
      halfTimeOpponent: 13,
      // USAP : 4E + 4T + 2P = 20+8+6 = 34
      triesUsap: 4, conversionsUsap: 4, penaltiesUsap: 2, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Bayonne : 3E + 3T + 2P = 15+6+6 = 27
      triesOpponent: 3, conversionsOpponent: 3, penaltiesOpponent: 2, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "L'USAP domine la première mi-temps avec 4 essais. CJ Yann David (7'). " +
        "McIntyre ouvre le score par un essai (7', T McIntyre, 7-3). " +
        "Crossdale (18', T McIntyre, 14-3), Dubois (24', T McIntyre, 21-10) " +
        "et Galletier (39', T McIntyre, 28-13) enfoncent le clou. " +
        "Mi-temps : 28-13. Bayonne revient fort en 2e période avec van Jaarsveld (46', T Lopez, 28-20) " +
        "et Orabé (52', T Lopez, 28-27). L'USAP tremble mais McIntyre (P 68', 31-27) " +
        "et Tedder (P 80', 34-27) assurent la victoire dans les dernières minutes.",
    },
  });
  console.log("  Match mis à jour");

  // Composition USAP
  console.log("\n--- Composition USAP ---");
  const deleted = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);
    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;
    const isCaptain = (p as any).isCaptain ?? false;

    // McIntyre : 1E (7') + 4T + 1P (68') = 5+8+3 = 16 pts
    if (p.lastName === "McIntyre") { tries = 1; conversions = 4; penalties = 1; totalPoints = 16; }
    // Crossdale : 1E (18') = 5 pts
    if (p.lastName === "Crossdale") { tries = 1; totalPoints = 5; }
    // Dubois : 1E (24') = 5 pts
    if (p.lastName === "Dubois") { tries = 1; totalPoints = 5; }
    // Galletier : 1E (39') = 5 pts
    if (p.lastName === "Galletier") { tries = 1; totalPoints = 5; }
    // Tedder : 1P (80') = 3 pts
    if (p.lastName === "Tedder") { penalties = 1; totalPoints = 3; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard: false, yellowCardMin: null, redCard: false, redCardMin: null,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", isCaptain ? "(C)" : "", sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // Composition Bayonne
  console.log("\n--- Composition Aviron Bayonnais ---");
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
    { minute: 7, type: "PENALITE", isUsap: false, description: "Pénalité de Camille Lopez (Bayonne). 0-3." },
    { minute: 7, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Yann David (Bayonne)." },
    { minute: 7, type: "ESSAI", playerLastName: "McIntyre", isUsap: true, description: "Essai de Jake McIntyre (USAP). 5-3." },
    { minute: 8, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 7-3." },
    { minute: 18, type: "ESSAI", playerLastName: "Crossdale", isUsap: true, description: "Essai d'Alistair Crossdale (USAP). 12-3." },
    { minute: 19, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 14-3." },
    { minute: 22, type: "ESSAI", isUsap: false, description: "Essai d'Eneriko Buliruarua (Bayonne). 14-8." },
    { minute: 23, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Camille Lopez (Bayonne). 14-10." },
    { minute: 24, type: "ESSAI", playerLastName: "Dubois", isUsap: true, description: "Essai de Lucas Dubois (USAP). 19-10." },
    { minute: 25, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 21-10." },
    { minute: 29, type: "PENALITE", isUsap: false, description: "Pénalité de Camille Lopez (Bayonne). 21-13." },
    { minute: 39, type: "ESSAI", playerLastName: "Galletier", isUsap: true, description: "Essai de Kélian Galletier (USAP). 26-13." },
    { minute: 40, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 28-13." },
    // === MI-TEMPS : USAP 28 - 13 Bayonne ===
    // === 2e MI-TEMPS ===
    { minute: 46, type: "ESSAI", isUsap: false, description: "Essai de Torsten van Jaarsveld (Bayonne). 28-18." },
    { minute: 47, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Camille Lopez (Bayonne). 28-20." },
    { minute: 52, type: "ESSAI", isUsap: false, description: "Essai de Yohan Orabé (Bayonne). 28-25." },
    { minute: 53, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Camille Lopez (Bayonne). 28-27." },
    { minute: 68, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 31-27." },
    { minute: 80, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 34-27. Victoire assurée !" },
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
    const side = evt.isUsap ? "USAP" : "BAY";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 34 - 27 Aviron Bayonnais (domicile)");
  console.log("  Mi-temps : 28-13");
  console.log("  Arbitre : Adrien Marbot");
  console.log("  McIntyre 16 pts (1E + 4T + 1P), Crossdale 5 pts (1E), Dubois 5 pts (1E)");
  console.log("  Galletier 5 pts (1E), Tedder 3 pts (1P)");
  console.log("  Bayonne : Buliruarua 1E, van Jaarsveld 1E, Orabé 1E, Lopez 3T+2P");
  console.log("  CJ : Yann David (7' Bayonne)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

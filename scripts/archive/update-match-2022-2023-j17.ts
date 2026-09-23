/**
 * Mise à jour du match Brive - USAP (J17 Top 14, 04/02/2023)
 * Score : Brive 22 - USAP 24
 *
 * Victoire héroïque à Brive ! Bituniyata E (12', T Sanchez, 7-0).
 * Deghmache E (15', T McIntyre, 7-7). McIntyre P (20', 7-10).
 * CJ Esteban Abadie (21'). DG Sanchez (34', 10-10). Mi-temps : 10-10.
 * Sanchez P (44', 13-10), P (49', 16-10), P (54', 19-10).
 * CJ Ferté (57') → essai de pénalité USAP (57', 19-17).
 * DG Carbonneau (65', 22-17). Sawailau E (75', T McIntyre, 22-24) !
 * L'USAP s'impose in extremis !
 *
 * Essais USAP : Deghmache (15'), essai de pénalité (57'), Sawailau (75')
 * Transformations USAP : McIntyre (16', 76')
 * Pénalité USAP : McIntyre (20')
 * Essai Brive : Bituniyata (12')
 * Transformation Brive : Sanchez (13')
 * Pénalités Brive : Sanchez (44', 49', 54')
 * Drops Brive : Sanchez (34'), Carbonneau (65')
 * CJ : Esteban Abadie (21', Brive), Ferté (57', Brive)
 *
 * Sources : allrugby.com, vibrez-rugby.com, francebleu.fr, top14.lnr.fr, allezbriverugby.com
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j17.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 80 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 50, subOut: 50 },
  { num: 6, firstName: "Brad", lastName: "Shields", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 50, subOut: 50 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Ali", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Eddie", lastName: "Sawailau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 72, subOut: 72 },
  { num: 15, firstName: "Tristan", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 0 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 26, subIn: 54 },
  { num: 18, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 30, subIn: 50 },
  { num: 19, firstName: "Joaquín", lastName: "Oviedo", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 30, subIn: 50 },
  { num: 20, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 26, subIn: 54 },
  { num: 21, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 22, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: false, minutesPlayed: 8, subIn: 72 },
  { num: 23, firstName: "Maafu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 26, subIn: 54 },
];

// === COMPOSITION BRIVE (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Daniel Brennan", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Motu Matu'u", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Marcel van der Merwe", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Tevita Ratuva", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Lucas Paulos", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Retief Marais", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Saïd Hireche", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Esteban Abadie", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Paul Abadie", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Nicolás Sánchez", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Axel Müller", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Nico Lee", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Setariki Tuicuvu", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Setareki Bituniyata", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Mathis Ferté", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Nathan Fraissenon", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Tietie Tuimauga", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Andrés Zafra", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Sasha Gué", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Léo Carbonneau", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Enzo Hervé", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Sammy Arnold", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Francisco Coria Marchetti", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match Brive - USAP (J17, 04/02/2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 17, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Ludovic", "Cayre");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      halfTimeUsap: 10,
      halfTimeOpponent: 10,
      videoUrl: "https://www.youtube.com/watch?v=DCyK39PXpR4",
      // USAP : 2E + 1EP + 2T + 1P = 10+7+4+3 = 24
      triesUsap: 2, conversionsUsap: 2, penaltiesUsap: 1, dropGoalsUsap: 0, penaltyTriesUsap: 1,
      // Brive : 1E + 1T + 3P + 2DG = 5+2+9+6 = 22
      triesOpponent: 1, conversionsOpponent: 1, penaltiesOpponent: 3, dropGoalsOpponent: 2, penaltyTriesOpponent: 0,
      report:
        "Victoire héroïque à Brive ! Bituniyata ouvre le score (12', T Sanchez, 7-0). " +
        "Deghmache réplique immédiatement (15', T McIntyre, 7-7). McIntyre P (20', 7-10). " +
        "CJ Esteban Abadie (21'). DG Sanchez (34', 10-10). Mi-temps : 10-10. " +
        "Sanchez aligne 3 pénalités consécutives (44', 49', 54' : 19-10). " +
        "CJ Ferté (57') : essai de pénalité pour l'USAP (19-17). " +
        "DG Carbonneau (65', 22-17). L'USAP semble condamnée mais Sawailau " +
        "marque l'essai de la victoire (75', T McIntyre, 22-24) ! " +
        "Succès capital dans la course au maintien.",
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

    // Deghmache : 1E (15') = 5 pts
    if (p.lastName === "Deghmache") { tries = 1; totalPoints = 5; }
    // Sawailau : 1E (75') = 5 pts
    if (p.lastName === "Sawailau") { tries = 1; totalPoints = 5; }
    // McIntyre : 2T (16', 76') + 1P (20') = 4+3 = 7 pts
    if (p.lastName === "McIntyre") { conversions = 2; penalties = 1; totalPoints = 7; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard: false, yellowCardMin: null,
        redCard: false, redCardMin: null,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", isCaptain ? "(C)" : "", sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // Composition Brive
  console.log("\n--- Composition CA Brive ---");
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
    { minute: 12, type: "ESSAI", isUsap: false, description: "Essai de Setareki Bituniyata (Brive). 5-0." },
    { minute: 13, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Nicolás Sánchez (Brive). 7-0." },
    { minute: 15, type: "ESSAI", playerLastName: "Deghmache", isUsap: true, description: "Essai de Sadek Deghmache (USAP). 7-5." },
    { minute: 16, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 7-7." },
    { minute: 20, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 7-10." },
    { minute: 21, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Esteban Abadie (Brive)." },
    { minute: 34, type: "DROP", isUsap: false, description: "Drop de Nicolás Sánchez (Brive). 10-10." },
    // === MI-TEMPS : Brive 10 - 10 USAP ===
    // === 2e MI-TEMPS ===
    { minute: 44, type: "PENALITE", isUsap: false, description: "Pénalité de Nicolás Sánchez (Brive). 13-10." },
    { minute: 49, type: "PENALITE", isUsap: false, description: "Pénalité de Nicolás Sánchez (Brive). 16-10." },
    { minute: 54, type: "PENALITE", isUsap: false, description: "Pénalité de Nicolás Sánchez (Brive). 19-10." },
    { minute: 57, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Mathis Ferté (Brive)." },
    { minute: 57, type: "ESSAI_PENALITE", isUsap: true, description: "Essai de pénalité accordé à l'USAP. 19-17." },
    { minute: 65, type: "DROP", isUsap: false, description: "Drop de Léo Carbonneau (Brive). 22-17." },
    { minute: 75, type: "ESSAI", playerLastName: "Sawailau", isUsap: true, description: "Essai d'Eddie Sawailau (USAP). Essai de la victoire ! 22-22." },
    { minute: 76, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 22-24." },
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
    const side = evt.isUsap ? "USAP" : "CAB";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Brive 22 - 24 USAP (extérieur)");
  console.log("  Mi-temps : 10-10");
  console.log("  Arbitre : Ludovic Cayre");
  console.log("  Deghmache 5 pts (1E), Sawailau 5 pts (1E), McIntyre 7 pts (2T + 1P), + 1 essai de pénalité");
  console.log("  Brive : Bituniyata 1E, Sánchez 1T+3P+1DG, Carbonneau 1DG");
  console.log("  CJ : Esteban Abadie (21' Brive), Ferté (57' Brive)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

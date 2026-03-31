/**
 * Mise à jour du match USAP - Newcastle (Challenge Cup Poule J4, 21/01/2024)
 * Score : USAP 23 - Newcastle 32
 *
 * Défaite à domicile malgré un avantage à la mi-temps (13-9).
 * L'USAP mène grâce à Rodor (pénalité 1'), Granell (essai 25') et
 * Dubois (essai 34'). Mais Newcastle renverse tout en 2e MT avec
 * O'Sullivan (53'), Redshaw (66') et 6 pénalités de Johnson (22 pts perso).
 * Dupichot sauve l'honneur (75'). 4e défaite en 4 matchs, USAP éliminée.
 *
 * Sources : epcrugby.com (compositions, stats), itsrugby.fr (marqueurs)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-cc4.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 45, subOut: 45 },
  { num: 2, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 61, subOut: 61 },
  { num: 3, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 56, subOut: 56 },
  { num: 4, firstName: "Bastien", lastName: "Chinarro", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 26, subOut: 26 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 40, subOut: 40 },
  { num: 6, firstName: "Samuel", lastName: "M'Foudi", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 8, firstName: "Valentin", lastName: "Moro", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 10, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 11, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Apisai", lastName: "Naqalevu", position: Position.CENTRE, isStarter: true, minutesPlayed: 56, subOut: 56 },
  { num: 13, firstName: "Job", lastName: "Poulet", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Maxim", lastName: "Granell", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Louis", lastName: "Dupichot", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 35, subIn: 45 },
  { num: 17, firstName: "Vakhtang", lastName: "Jincharadze", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 19, subIn: 61 },
  { num: 18, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 24, subIn: 56 },
  { num: 19, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 54, subIn: 26 },
  { num: 20, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 40, subIn: 40 },
  { num: 21, firstName: "Jean-Pascal", lastName: "Barraqué", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 28, subIn: 52 },
  { num: 22, firstName: "Mathieu", lastName: "Ugena", position: Position.CENTRE, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 23, firstName: "Freddy", lastName: "Duguivalu", position: Position.CENTRE, isStarter: false, minutesPlayed: 24, subIn: 56 },
];

// === COMPOSITION NEWCASTLE (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Adam Brocklebank", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Bryan Byrne", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Murray McCallum", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "John Hawkins", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Sebastian de Chaves", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Pedro Rubiolo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Sam Cross", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Freddie Lockwood", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Josh Barton", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Louie Johnson", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Ben Stevenson", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Cameron Hutchison", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Matias Moroni", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Ben Redshaw", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Elliott Obatoyinbo", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Michael van Vuuren", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Mark Dormer", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Eduardo Bello", position: Position.PILIER_DROIT, isStarter: false },
  { num: 19, name: "John Kelly", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 20, name: "Josh Bainbridge", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, name: "Hugh O'Sullivan", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Rory Jennings", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 23, name: "Oli Spencer", position: Position.CENTRE, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Newcastle (CC Poule J4, 21/01/2024) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2023, endYear: 2024 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, round: "Poule J4", competition: { type: "CHALLENGE_EUROPE" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Federico", "Vedovelli");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "14:00",
      refereeId,
      halfTimeUsap: 13,
      halfTimeOpponent: 9,
      // USAP : 3E + 1T + 2P = 15+2+6 = 23
      triesUsap: 3, conversionsUsap: 1, penaltiesUsap: 2, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Newcastle : 2E + 2T + 6P = 10+4+18 = 32
      triesOpponent: 2, conversionsOpponent: 2, penaltiesOpponent: 6, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Défaite à domicile malgré un avantage à la mi-temps. " +
        "Rodor ouvre au pied (1') mais Johnson répond avec 3 pénalités (4', 14', 18'). " +
        "Granell (25') et Dubois (34') marquent les 2 essais non transformés de l'USAP " +
        "pour mener 13-9 à la pause. " +
        "En 2e MT, Rodor ajoute une pénalité (52') mais Newcastle renverse tout : " +
        "O'Sullivan (53') et Redshaw (66') marquent 2 essais transformés par Johnson, " +
        "qui ajoute 3 pénalités supplémentaires (65', 70', 74') pour un total personnel " +
        "de 22 points. Dupichot (75', transformé par Barraqué) sauve l'honneur " +
        "mais c'est insuffisant. 4e défaite en 4 matchs, l'USAP est éliminée.",
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
    const yellowCard = false;
    const yellowCardMin: number | null = null;
    const isCaptain = (p as any).isCaptain ?? false;

    if (p.lastName === "Granell") { tries = 1; totalPoints = 5; }
    if (p.lastName === "Dubois") { tries = 1; totalPoints = 5; }
    if (p.lastName === "Dupichot") { tries = 1; totalPoints = 5; }
    // Rodor : 2P = 6 pts
    if (p.lastName === "Rodor" && p.isStarter) { penalties = 2; totalPoints = 6; }
    // Barraqué : 1T = 2 pts
    if (p.lastName === "Barraqué") { conversions = 1; totalPoints = 2; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard, yellowCardMin,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", isCaptain ? "(C)" : "", sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // Composition Newcastle
  console.log("\n--- Composition Newcastle Falcons ---");
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
    { minute: 1, type: "PENALITE", playerLastName: "Rodor", isUsap: true, description: "Pénalité de Matteo Rodor (USAP). 3-0." },
    { minute: 4, type: "PENALITE", isUsap: false, description: "Pénalité de Louie Johnson (Newcastle). 3-3." },
    { minute: 14, type: "PENALITE", isUsap: false, description: "Pénalité de Louie Johnson (Newcastle). 3-6." },
    { minute: 18, type: "PENALITE", isUsap: false, description: "Pénalité de Louie Johnson (Newcastle). 3-9." },
    { minute: 25, type: "ESSAI", playerLastName: "Granell", isUsap: true, description: "Essai de Maxim Granell (USAP). 8-9." },
    { minute: 34, type: "ESSAI", playerLastName: "Dubois", isUsap: true, description: "Essai de Lucas Dubois (USAP). 13-9." },
    // === MI-TEMPS : USAP 13 - 9 Newcastle ===
    { minute: 52, type: "PENALITE", playerLastName: "Rodor", isUsap: true, description: "Pénalité de Matteo Rodor (USAP). 16-9." },
    { minute: 53, type: "ESSAI", isUsap: false, description: "Essai de Hugh O'Sullivan (Newcastle). 16-14." },
    { minute: 53, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Louie Johnson (Newcastle). 16-16." },
    { minute: 65, type: "PENALITE", isUsap: false, description: "Pénalité de Louie Johnson (Newcastle). 16-19." },
    { minute: 66, type: "ESSAI", isUsap: false, description: "Essai de Ben Redshaw (Newcastle). 16-24." },
    { minute: 66, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Louie Johnson (Newcastle). 16-26." },
    { minute: 70, type: "PENALITE", isUsap: false, description: "Pénalité de Louie Johnson (Newcastle). 16-29." },
    { minute: 74, type: "PENALITE", isUsap: false, description: "Pénalité de Louie Johnson (Newcastle). 16-32." },
    { minute: 75, type: "ESSAI", playerLastName: "Dupichot", isUsap: true, description: "Essai de Louis Dupichot (USAP). 21-32." },
    { minute: 75, type: "TRANSFORMATION", playerLastName: "Barraqué", isUsap: true, description: "Transformation de Jean-Pascal Barraqué (USAP). 23-32. Score final." },
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
    const side = evt.isUsap ? "USAP" : "NEW";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 23 - 32 Newcastle (domicile)");
  console.log("  Mi-temps : USAP 13 - 9 Newcastle");
  console.log("  Arbitre : Federico Vedovelli");
  console.log("  Johnson 22 pts (6P + 2T), Rodor 6 pts (2P)");
  console.log("  4e défaite en CC, USAP éliminée");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

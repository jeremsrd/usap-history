/**
 * Mise à jour du match Pau - USAP (J26 Top 14, 08/06/2024)
 * Score : Pau 36 - USAP 24
 *
 * Défaite au Hameau lors de la dernière journée. Pau impose un 21-0
 * en début de match (Maddocks, Attissogbe, Gailleton). L'USAP réagit
 * par Dupichot (35') et Boyer Gallardo (40') pour revenir à 21-10.
 * En 2e MT, Oviedo (43') ramène l'USAP à 21-17 mais un essai de
 * pénalité (60') et Whitelock (78') scellent la victoire de Pau.
 * Dubois (74') sauve l'honneur. Dernier match de la saison régulière.
 *
 * Essais USAP : Dupichot (35'), Boyer Gallardo (40'), Oviedo (43'), Dubois (74')
 * Essais Pau : Maddocks (12'), Attissogbe (19'), Gailleton (26'),
 *              essai de pénalité (60'), Whitelock (78')
 * CJ : Corato (33', Pau), Lotrian (33', USAP), Fa'aso'o (60', USAP),
 *      Simmonds (69', Pau)
 *
 * Sources : top14.lnr.fr (feuille officielle), allrugby.com (compositions),
 *   itsrugby.fr (statistiques), francebleu.fr (résumé),
 *   usap-forum.com (arbitre Pierre Brousset)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j26.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 61, subOut: 61, yellowCard: true, yellowCardMin: 33 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 58, subOut: 58 },
  { num: 3, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 70, subOut: 70 },
  { num: 4, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 40, subOut: 40 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 40, subOut: 40 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 58, subOut: 58 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 61, subOut: 61 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 61, subOut: 61 },
  { num: 15, firstName: "Louis", lastName: "Dupichot", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 22, subIn: 58 },
  { num: 17, firstName: "Lorencio", lastName: "Boyer Gallardo", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 19, subIn: 61 },
  { num: 18, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 40, subIn: 40 },
  { num: 19, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 22, subIn: 58, yellowCard: true, yellowCardMin: 60 },
  { num: 20, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 40, subIn: 40 },
  { num: 21, firstName: "Job", lastName: "Poulet", position: Position.CENTRE, isStarter: false, minutesPlayed: 19, subIn: 61 },
  { num: 22, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 19, subIn: 61 },
  { num: 23, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 10, subIn: 70 },
];

// === COMPOSITION PAU (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Hugo Parrou", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Lucas Rey", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Nicolas Corato", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Guillaume Ducat", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Samuel Whitelock", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Sacha Zegueur", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Reece Hewat", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Beka Gorgadze", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Thibault Daubagna", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Joe Simmonds", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Thomas Carol", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Nathan Decron", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Emilien Gailleton", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Théo Attissogbe", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Jack Maddocks", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Axel Desperes", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 17, name: "Youri Delhommel", position: Position.TALONNEUR, isStarter: false },
  { num: 18, name: "Siate Tokolahi", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 19, name: "Martin Puech", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Thibaut Hamonou", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, name: "Dan Robson", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Jale Vatubua", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Ignacio Calles", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match Pau - USAP (J26, 08/06/2024) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2023, endYear: 2024 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 26, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Pierre", "Brousset");

  console.log("\n--- Match (infos générales) ---");
  const venue = await prisma.venue.findFirst({ where: { name: { contains: "Hameau" } } });

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "21:05",
      refereeId,
      venueId: venue?.id ?? undefined,
      videoUrl: "https://www.youtube.com/watch?v=dpuUU23NoNU",
      halfTimeUsap: 10,
      halfTimeOpponent: 21,
      // USAP : 4E + 2T = 20+4 = 24
      triesUsap: 4, conversionsUsap: 2, penaltiesUsap: 0, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Pau : 4E + 3T + 1P + 1EP = 20+6+3+7 = 36
      triesOpponent: 4, conversionsOpponent: 3, penaltiesOpponent: 1, dropGoalsOpponent: 0, penaltyTriesOpponent: 1,
      report:
        "Défaite au Hameau pour la dernière journée de la saison. " +
        "Pau inflige un 21-0 en 26 minutes : Maddocks (12'), Attissogbe (19') " +
        "et Gailleton (26'). L'USAP réagit par Dupichot (35') et Boyer Gallardo " +
        "(40') pour revenir à 21-10 à la pause. " +
        "En 2e MT, Oviedo (43') transformé par McIntyre ramène l'USAP à 21-17. " +
        "Mais un essai de pénalité (60', CJ Fa'aso'o) redonne de l'air à Pau (31-17). " +
        "Dubois (74', transformé par Rodor) réduit l'écart à 31-24 avant que " +
        "Whitelock ne scelle la victoire paloise en fin de match (78'). " +
        "4 cartons jaunes dans un match houleux (CJ Corato et Lotrian à 33', " +
        "CJ Fa'aso'o 60', CJ Simmonds 69').",
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
    const yellowCard = (p as any).yellowCard ?? false;
    const yellowCardMin = (p as any).yellowCardMin ?? null;
    const isCaptain = (p as any).isCaptain ?? false;

    if (p.lastName === "Dupichot") { tries = 1; totalPoints = 5; }
    if (p.lastName === "Boyer Gallardo") { tries = 1; totalPoints = 5; }
    if (p.lastName === "Oviedo") { tries = 1; totalPoints = 5; }
    if (p.lastName === "Dubois") { tries = 1; totalPoints = 5; }
    // McIntyre : 1T = 2 pts
    if (p.lastName === "McIntyre") { conversions = 1; totalPoints = 2; }
    // Rodor : 1T = 2 pts
    if (p.lastName === "Rodor") { conversions = 1; totalPoints = 2; }

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
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", yellowCard ? `[CJ ${yellowCardMin}']` : "", isCaptain ? "(C)" : "", sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // Composition Pau
  console.log("\n--- Composition Section Paloise ---");
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
    { minute: 12, type: "ESSAI", isUsap: false, description: "Essai de Jack Maddocks (Pau). 5-0." },
    { minute: 12, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Joe Simmonds (Pau). 7-0." },
    { minute: 19, type: "ESSAI", isUsap: false, description: "Essai de Théo Attissogbe (Pau). 12-0." },
    { minute: 19, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Joe Simmonds (Pau). 14-0." },
    { minute: 26, type: "ESSAI", isUsap: false, description: "Essai d'Emilien Gailleton (Pau). 19-0." },
    { minute: 26, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Joe Simmonds (Pau). 21-0." },
    { minute: 33, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Nicolas Corato (Pau)." },
    { minute: 33, type: "CARTON_JAUNE", playerLastName: "Lotrian", isUsap: true, description: "Carton jaune Sacha Lotrian (USAP). Double CJ simultané." },
    { minute: 35, type: "ESSAI", playerLastName: "Dupichot", isUsap: true, description: "Essai de Louis Dupichot (USAP). 21-5." },
    { minute: 40, type: "ESSAI", playerLastName: "Boyer Gallardo", isUsap: true, description: "Essai de Lorencio Boyer Gallardo (USAP). 21-10." },
    // === MI-TEMPS : Pau 21 - 10 USAP ===
    { minute: 43, type: "ESSAI", playerLastName: "Oviedo", isUsap: true, description: "Essai de Joaquin Oviedo (USAP). 21-15." },
    { minute: 43, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 21-17." },
    { minute: 54, type: "PENALITE", isUsap: false, description: "Pénalité de Joe Simmonds (Pau). 24-17." },
    { minute: 60, type: "CARTON_JAUNE", playerLastName: "Fa'aso'o", isUsap: true, description: "Carton jaune So'otala Fa'aso'o (USAP)." },
    { minute: 60, type: "ESSAI_PENALITE", isUsap: false, description: "Essai de pénalité (Pau). 31-17." },
    { minute: 69, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Joe Simmonds (Pau)." },
    { minute: 74, type: "ESSAI", playerLastName: "Dubois", isUsap: true, description: "Essai de Lucas Dubois (USAP). 31-22." },
    { minute: 74, type: "TRANSFORMATION", playerLastName: "Rodor", isUsap: true, description: "Transformation de Matteo Rodor (USAP). 31-24." },
    { minute: 78, type: "ESSAI", isUsap: false, description: "Essai de Samuel Whitelock (Pau). 36-24. Score final." },
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
    const side = evt.isUsap ? "USAP" : "PAU";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Pau 36 - 24 USAP (extérieur)");
  console.log("  Mi-temps : Pau 21 - 10 USAP");
  console.log("  Arbitre : Pierre Brousset");
  console.log("  4 CJ : Corato (33'), Lotrian (33'), Fa'aso'o (60'), Simmonds (69')");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

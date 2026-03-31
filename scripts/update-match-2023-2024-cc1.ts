/**
 * Mise à jour du match USAP - Lions (Challenge Cup Poule J1, 10/12/2023)
 * Score : USAP 12 - Lions 28
 *
 * Défaite à domicile pour l'entrée en Challenge Cup. Les Lions s'imposent
 * grâce à Hendrikse, impérial au pied (7 pénalités + 1 transformation).
 * L'USAP ne marque que 4 pénalités par Barraqué. Un seul essai dans le match :
 * Maxwane pour les Lions (9'). Score mi-temps : USAP 12 - Lions 16.
 *
 * USAP : 4 pénalités Barraqué
 * Lions : 1E Maxwane (9') + 1T + 7P Hendrikse
 *
 * Sources : epcrugby.com (compositions, stats), itsrugby.fr (marqueurs)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-cc1.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 2, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 3, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 8, firstName: "Ewan", lastName: "Bertheau", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 65, subOut: 65 },
  { num: 10, firstName: "Alexandre", lastName: "Perez", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 11, firstName: "Louis", lastName: "Dupichot", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Freddy", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 35, subOut: 35 },
  { num: 15, firstName: "Jean-Pascal", lastName: "Barraqué", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Vakhtang", lastName: "Jincharadze", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 18, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 19, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 0 },
  { num: 20, firstName: "Valentin", lastName: "Moro", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 0 },
  { num: 21, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 28, subIn: 52 },
  { num: 22, firstName: "Eddie", lastName: "Sawailau", position: Position.CENTRE, isStarter: false, minutesPlayed: 15, subIn: 65 },
  { num: 23, firstName: "Boris", lastName: "Goutard", position: Position.AILIER, isStarter: false, minutesPlayed: 45, subIn: 35 },
];

// === COMPOSITION LIONS (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Corné Fourie", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Jaco Visagie", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Ruan Smith", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Etienne Oosthuizen", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Raynard Roets", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "JC Pretorius", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Ruhan Straeuli", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Hanru Sirgel", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Nico Steyn", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Jordan Hendrikse", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Boldwin Hansen", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Zander du Plessis", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Erich Cronjé", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Rabz Maxwane", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Andries Coetzee", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Morne Brandon", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Morgan Naude", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Conrad van Vuuren", position: Position.PILIER_DROIT, isStarter: false },
  { num: 19, name: "Izan Esterhuizen", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 20, name: "Travis Gordon", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, name: "Johan Mulder", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Gianni Lombard", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 23, name: "Rynhardt Jonker", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Lions (CC Poule J1, 10/12/2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2023, endYear: 2024 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, round: "Poule J1", competition: { type: "CHALLENGE_EUROPE" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Adam", "Leal");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "14:00",
      refereeId,
      halfTimeUsap: 12,
      halfTimeOpponent: 16,
      // USAP : 4P = 12
      triesUsap: 0, conversionsUsap: 0, penaltiesUsap: 4, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Lions : 1E + 1T + 7P = 5+2+21 = 28
      triesOpponent: 1, conversionsOpponent: 1, penaltiesOpponent: 7, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Défaite à domicile pour l'entrée en Challenge Cup. " +
        "Match dominé par les buteurs. Barraqué inscrit 4 pénalités pour l'USAP " +
        "(6', 18', 30', 35') mais Hendrikse est impérial au pied pour les Lions " +
        "avec 7 pénalités et une transformation. Le seul essai du match est signé " +
        "Maxwane (9'), seul moment de folie dans un match verrouillé. " +
        "Score mi-temps : 12-16. Les Lions prennent le large en 2e MT grâce à " +
        "5 pénalités supplémentaires de Hendrikse.",
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

    // Barraqué : 4P = 12 pts
    if (p.lastName === "Barraqué") { penalties = 4; totalPoints = 12; }

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

  // Composition Lions
  console.log("\n--- Composition Lions ---");
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
    { minute: 2, type: "PENALITE", isUsap: false, description: "Pénalité de Jordan Hendrikse (Lions). 0-3." },
    { minute: 6, type: "PENALITE", playerLastName: "Barraqué", isUsap: true, description: "Pénalité de Jean-Pascal Barraqué (USAP). 3-3." },
    { minute: 9, type: "ESSAI", isUsap: false, description: "Essai de Rabz Maxwane (Lions). 3-8." },
    { minute: 9, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Jordan Hendrikse (Lions). 3-10." },
    { minute: 18, type: "PENALITE", playerLastName: "Barraqué", isUsap: true, description: "Pénalité de Jean-Pascal Barraqué (USAP). 6-10." },
    { minute: 30, type: "PENALITE", playerLastName: "Barraqué", isUsap: true, description: "Pénalité de Jean-Pascal Barraqué (USAP). 9-10." },
    { minute: 33, type: "PENALITE", isUsap: false, description: "Pénalité de Jordan Hendrikse (Lions). 9-13." },
    { minute: 35, type: "PENALITE", playerLastName: "Barraqué", isUsap: true, description: "Pénalité de Jean-Pascal Barraqué (USAP). 12-13." },
    // === MI-TEMPS : USAP 12 - 16 Lions (pénalité Hendrikse juste avant la pause) ===
    { minute: 40, type: "PENALITE", isUsap: false, description: "Pénalité de Jordan Hendrikse (Lions). 12-16." },
    { minute: 43, type: "PENALITE", isUsap: false, description: "Pénalité de Jordan Hendrikse (Lions). 12-19." },
    { minute: 46, type: "PENALITE", isUsap: false, description: "Pénalité de Jordan Hendrikse (Lions). 12-22." },
    { minute: 60, type: "PENALITE", isUsap: false, description: "Pénalité de Jordan Hendrikse (Lions). 12-25." },
    { minute: 64, type: "PENALITE", isUsap: false, description: "Pénalité de Jordan Hendrikse (Lions). 12-28. Score final." },
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
    const side = evt.isUsap ? "USAP" : "LIONS";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 12 - 28 Lions (domicile)");
  console.log("  Mi-temps : USAP 12 - 16 Lions");
  console.log("  Arbitre : Adam Leal");
  console.log("  Barraqué 4P (12 pts), Hendrikse 7P+1T (23 pts)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

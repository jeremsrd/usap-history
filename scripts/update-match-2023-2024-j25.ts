/**
 * Mise à jour du match USAP - Bordeaux (J25 Top 14, 01/06/2024)
 * Score : USAP 37 - Bordeaux 30
 *
 * Victoire bonifiée à Aimé-Giral ! L'USAP inscrit 4 essais en 17 minutes
 * (16'-33') pour mener 31-16 à la pause. Ruiz, Ecochard, Oviedo et Crossdale
 * marquent. Bordeaux revient en 2e MT (Penaud, Samu) mais l'USAP tient bon.
 * Allan parfait au pied (4T + 3P).
 *
 * Essais USAP : Ruiz (16'), Ecochard (22'), Oviedo (28'), Crossdale (33')
 * Essais UBB : Uberti (17'), Penaud (59'), Samu (70')
 * CJ : Petti (28', UBB)
 *
 * Sources : ubbrugby.com (compositions, mi-temps 31-16), allrugby.com (score),
 *   xvovalie.com (compositions), bordeaux-gazette.com (résumé),
 *   eurosport.fr (résumé)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j25.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 3, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 56, subOut: 56 },
  { num: 4, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquin", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Ali", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jeronimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 26, subIn: 54 },
  { num: 17, firstName: "Lorencio", lastName: "Boyer Gallardo", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 26, subIn: 54 },
  { num: 18, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 19, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 20, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 21, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: false, minutesPlayed: 0 },
  { num: 22, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: false, minutesPlayed: 0 },
  { num: 23, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 24, subIn: 56 },
];

// === COMPOSITION BORDEAUX (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Ugo Boniface", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Maxime Lamothe", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Carlu Johann Sadie", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Guido Petti", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Cyril Cazeaux", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Bastien Vergnes-Taillefer", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Mahamadou Diaby", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Tevita Tatafu", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Maxime Lucu", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Matthieu Jalibert", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Pablo Uberti", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Ben Tapuai", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Yoram Moefana", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Damian Penaud", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Louis Bielle-Biarrey", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Romain Latterrade", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Thierry Paiva", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Thomas Jolmès", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Antoine Miquel", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Pete Samu", position: Position.NUMERO_HUIT, isStarter: false },
  { num: 21, name: "Yann Lesgourgues", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Madosh Tambwe", position: Position.AILIER, isStarter: false },
  { num: 23, name: "Ben Tameifuna", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Bordeaux (J25, 01/06/2024) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2023, endYear: 2024 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 25, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Thomas", "Charabas");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      videoUrl: "https://www.youtube.com/watch?v=dpuUU23NoNU",
      halfTimeUsap: 31,
      halfTimeOpponent: 16,
      // USAP : 4E + 4T + 3P = 20+8+9 = 37
      triesUsap: 4, conversionsUsap: 4, penaltiesUsap: 3, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // UBB : 3E + 3T + 3P = 15+6+9 = 30
      triesOpponent: 3, conversionsOpponent: 3, penaltiesOpponent: 3, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Victoire bonifiée magnifique à Aimé-Giral face à l'UBB ! " +
        "Jalibert ouvre au pied (2 pénalités, 0-6) mais l'USAP se réveille. " +
        "4 essais en 17 minutes : Ruiz (16'), Ecochard (22'), Oviedo (28', pendant " +
        "le CJ de Petti) et Crossdale (33'). Allan parfait au pied (4T). " +
        "Score mi-temps : 31-16. En 2e MT, Allan continue au pied (3P) pendant que " +
        "Bordeaux tente le retour avec Penaud (superbe course de 50m, 59') et Samu (70'). " +
        "Score final 37-30. Bonus offensif pour l'USAP.",
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

    if (p.lastName === "Ruiz") { tries = 1; totalPoints = 5; }
    if (p.lastName === "Ecochard") { tries = 1; totalPoints = 5; }
    if (p.lastName === "Oviedo") { tries = 1; totalPoints = 5; }
    if (p.lastName === "Crossdale") { tries = 1; totalPoints = 5; }
    // Allan : 4T + 3P = 8+9 = 17 pts
    if (p.lastName === "Allan") { conversions = 4; penalties = 3; totalPoints = 17; }

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

  // Composition Bordeaux
  console.log("\n--- Composition Union Bordeaux-Bègles ---");
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
    { minute: 5, type: "PENALITE", isUsap: false, description: "Pénalité de Matthieu Jalibert (UBB). 0-3." },
    { minute: 11, type: "PENALITE", isUsap: false, description: "Pénalité de Matthieu Jalibert (UBB). 0-6." },
    { minute: 16, type: "ESSAI", playerLastName: "Ruiz", isUsap: true, description: "Essai d'Ignacio Ruiz (USAP). 5-6." },
    { minute: 16, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true, description: "Transformation de Tommaso Allan (USAP). 7-6." },
    { minute: 17, type: "ESSAI", isUsap: false, description: "Essai de Pablo Uberti (UBB). Réponse immédiate ! 7-11." },
    { minute: 17, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Matthieu Jalibert (UBB). 7-13." },
    { minute: 22, type: "ESSAI", playerLastName: "Ecochard", isUsap: true, description: "Essai de Tom Ecochard (USAP). 12-13." },
    { minute: 22, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true, description: "Transformation de Tommaso Allan (USAP). 14-13." },
    { minute: 28, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Guido Petti (UBB)." },
    { minute: 28, type: "ESSAI", playerLastName: "Oviedo", isUsap: true, description: "Essai de Joaquin Oviedo (USAP). En supériorité numérique ! 19-13." },
    { minute: 28, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true, description: "Transformation de Tommaso Allan (USAP). 21-13." },
    { minute: 33, type: "ESSAI", playerLastName: "Crossdale", isUsap: true, description: "Essai d'Ali Crossdale (USAP). 4e essai, bonus offensif ! 26-13." },
    { minute: 33, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true, description: "Transformation de Tommaso Allan (USAP). 28-13." },
    { minute: 35, type: "PENALITE", isUsap: false, description: "Pénalité de Matthieu Jalibert (UBB). 28-16." },
    { minute: 40, type: "PENALITE", playerLastName: "Allan", isUsap: true, description: "Pénalité de Tommaso Allan (USAP). 31-16." },
    // === MI-TEMPS : USAP 31 - 16 UBB ===
    { minute: 59, type: "ESSAI", isUsap: false, description: "Essai de Damian Penaud (UBB). Course de 50m ! 31-21." },
    { minute: 60, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Matthieu Jalibert (UBB). 31-23." },
    { minute: 63, type: "PENALITE", playerLastName: "Allan", isUsap: true, description: "Pénalité de Tommaso Allan (USAP). 34-23." },
    { minute: 69, type: "PENALITE", playerLastName: "Allan", isUsap: true, description: "Pénalité de Tommaso Allan (USAP). 37-23." },
    { minute: 70, type: "ESSAI", isUsap: false, description: "Essai de Pete Samu (UBB). 37-28." },
    { minute: 70, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Matthieu Jalibert (UBB). 37-30. Score final." },
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
    const side = evt.isUsap ? "USAP" : "UBB";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 37 - 30 Bordeaux (domicile)");
  console.log("  Mi-temps : USAP 31 - 16 UBB");
  console.log("  Arbitre : Thomas Charabas");
  console.log("  Allan : 4T + 3P = 17 pts");
  console.log("  4 essais USAP en 17 minutes !");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

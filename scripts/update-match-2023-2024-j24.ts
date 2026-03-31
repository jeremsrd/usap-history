/**
 * Mise à jour du match Bayonne - USAP (J24 Top 14, 18/05/2024)
 * Score : Bayonne 23 - USAP 20
 *
 * Défaite à Jean Dauger malgré un retour en fin de match.
 * Bayonne mène 10-6 à la pause grâce à un doublé de Hodge.
 * En 2e MT, Bayonne creuse à 23-13 (3 pénalités Lopez) avant
 * qu'Acébès (47') et Lam (73') réduisent l'écart à 23-20.
 * L'USAP obtient le bonus défensif.
 * Maintien officiel de l'USAP acquis avant le match (défaite MHR vs Toulouse).
 *
 * Essais USAP : Acébès (47'), Lam (73')
 * Essais Bayonne : Hodge (17', 42')
 * Buteur USAP : McIntyre (2P), Allan (2T)
 * Buteur Bayonne : Lopez (2T + 3P)
 *
 * Sources : allrugby.com (compositions, score), skysports.com (marqueurs),
 *   francebleu.fr (mi-temps 10-6), usap-forum.com (arbitre Luc Ramos)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j24.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 3, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 4, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 58, subOut: 58 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 41, subOut: 41 },
  { num: 6, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 30, subOut: 30 },
  { num: 7, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 58, subOut: 58 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 66, subOut: 66 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 13, firstName: "Apisai", lastName: "Naqalevu", position: Position.CENTRE, isStarter: true, minutesPlayed: 50, subOut: 50 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 26, subIn: 54 },
  { num: 18, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 22, subIn: 58 },
  { num: 19, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 50, subIn: 30 },
  { num: 20, firstName: "Lucas", lastName: "Velarte", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 0 },
  { num: 21, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: false, minutesPlayed: 30, subIn: 50 },
  { num: 22, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 14, subIn: 66 },
  { num: 23, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 20, subIn: 60 },
];

// === COMPOSITION BAYONNE (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Matis Perchaud", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Facundo Bosch", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Luke Tagi", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Thomas Ceyte", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Lucas Paulos", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Pierre Huguet", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Baptiste Héguy", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Uzair Cassiem", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Maxime Machenaud", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Camille Lopez", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Rémy Baget", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Guillaume Martocq", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Reece Hodge", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Arnaud Erbinartegaray", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Cheikh Tiberghien", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Vincent Giudicelli", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Swan Cormenier", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Arthur Iturria", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Rémi Bourdeau", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Gela Aprasidze", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Tom Spring", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Sireli Maqala", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Tevita Tatafu", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match Bayonne - USAP (J24, 18/05/2024) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2023, endYear: 2024 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 24, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Luc", "Ramos");

  console.log("\n--- Match (infos générales) ---");
  const venue = await prisma.venue.findFirst({ where: { name: { contains: "Dauger" } } });

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      venueId: venue?.id ?? undefined,
      videoUrl: "https://www.youtube.com/watch?v=3ur9OWm7oXs",
      halfTimeUsap: 6,
      halfTimeOpponent: 10,
      // USAP : 2E + 2T + 2P = 10+4+6 = 20
      triesUsap: 2, conversionsUsap: 2, penaltiesUsap: 2, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Bayonne : 2E + 2T + 3P = 10+4+9 = 23
      triesOpponent: 2, conversionsOpponent: 2, penaltiesOpponent: 3, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Défaite à Jean Dauger malgré un retour en fin de match. " +
        "L'USAP avait officiellement obtenu son maintien avant le coup d'envoi " +
        "grâce à la défaite de Montpellier face à Toulouse. " +
        "McIntyre ouvre au pied (pénalité 5') mais Lopez répond (13'). " +
        "Hodge inscrit un doublé (17', 42') pour donner l'avantage à Bayonne. " +
        "Score mi-temps : 10-6. En 2e MT, Lopez creuse l'écart avec 3 pénalités " +
        "(50', 57') pour mener 23-13. L'USAP réagit par Acébès (47', transformé par Allan) " +
        "puis Lam (73', transformé par Allan) pour revenir à 23-20. " +
        "Bonus défensif pour l'USAP. Bayonne sécurise son maintien.",
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

    if (p.lastName === "Acébès") { tries = 1; totalPoints = 5; }
    if (p.lastName === "Lam") { tries = 1; totalPoints = 5; }
    // McIntyre : 2P = 6 pts
    if (p.lastName === "McIntyre") { penalties = 2; totalPoints = 6; }
    // Allan : 2T = 4 pts
    if (p.lastName === "Allan") { conversions = 2; totalPoints = 4; }

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
    { minute: 5, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 0-3." },
    { minute: 13, type: "PENALITE", isUsap: false, description: "Pénalité de Camille Lopez (Bayonne). 3-3." },
    { minute: 17, type: "ESSAI", isUsap: false, description: "Essai de Reece Hodge (Bayonne). 8-3." },
    { minute: 18, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Camille Lopez (Bayonne). 10-3." },
    { minute: 21, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 10-6." },
    // === MI-TEMPS : Bayonne 10 - 6 USAP ===
    { minute: 42, type: "ESSAI", isUsap: false, description: "Essai de Reece Hodge (Bayonne). Doublé ! 15-6." },
    { minute: 43, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Camille Lopez (Bayonne). 17-6." },
    { minute: 47, type: "ESSAI", playerLastName: "Acébès", isUsap: true, description: "Essai de Mathieu Acébès (USAP). 17-11." },
    { minute: 48, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true, description: "Transformation de Tommaso Allan (USAP). 17-13." },
    { minute: 50, type: "PENALITE", isUsap: false, description: "Pénalité de Camille Lopez (Bayonne). 20-13." },
    { minute: 57, type: "PENALITE", isUsap: false, description: "Pénalité de Camille Lopez (Bayonne). 23-13." },
    { minute: 73, type: "ESSAI", playerLastName: "Lam", isUsap: true, description: "Essai de Seilala Lam (USAP). 23-18." },
    { minute: 74, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true, description: "Transformation de Tommaso Allan (USAP). 23-20. Score final." },
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
  console.log("  Score : Bayonne 23 - 20 USAP (extérieur)");
  console.log("  Mi-temps : Bayonne 10 - 6 USAP");
  console.log("  Arbitre : Luc Ramos");
  console.log("  Hodge doublé pour Bayonne, Acébès + Lam pour USAP");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

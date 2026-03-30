/**
 * Mise à jour du match Montpellier - USAP (J22 Top 14, 27/04/2024)
 * Score : Montpellier 20 - 25 USAP
 *
 * Victoire dans le derby catalan au GGL Stadium devant 4000
 * supporters catalans ! MHR mène 10-5 à la pause mais l'USAP
 * renverse le match en 2e MT grâce à McIntyre (doublé + pieds).
 * Montpellier réduit deux fois à 14 (CJ Chalureau, CJ Verhaeghe).
 *
 * Essais USAP : Dubois (34'), McIntyre (51', 62')
 * Essais MHR : Janse Van Rensburg (19'), Bridge (45')
 * CJ : McIntyre (23', USAP), Chiocci (40', USAP),
 *      Chalureau (49', MHR), Verhaeghe (59', MHR)
 *
 * Sources : top14.lnr.fr (compositions), itsrugby.fr (marqueurs),
 *   allrugby.com (arbitre Pierre Brousset), francebleu.fr (HT 10-5)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j22.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 3, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 56, subOut: 56 },
  { num: 4, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquin", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jeronimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, isCaptain: true, minutesPlayed: 67, subOut: 67 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Louis", lastName: "Dupichot", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 19, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 20, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 0 },
  { num: 21, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 22, firstName: "Apisai", lastName: "Naqalevu", position: Position.CENTRE, isStarter: false, minutesPlayed: 13, subIn: 67 },
  { num: 23, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 24, subIn: 56 },
];

// === COMPOSITION MONTPELLIER (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Baptiste Erdocio", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Christopher Tolofua", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Luka Japaridze", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Florian Verhaeghe", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Bastien Chalureau", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Nicolaas Janse Van Rensburg", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Yacouba Camara", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Sam Simmonds", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Cobus Reinach", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Louis Carbonel", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "George Bridge", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Jan Serfontein", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Arthur Vincent", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Gabriel Ngandebe", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Anthony Bouthier", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Vano Karkadze", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Luca Tabarot", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Tyler Duguid", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Clément Doumenc", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Léo Coly", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Thomas Darmon", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Benjamin Lam", position: Position.AILIER, isStarter: false },
  { num: 23, name: "Lasha Macharashvili", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match Montpellier - USAP (J22, 27/04/2024) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2023, endYear: 2024 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 22, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Pierre", "Brousset");

  console.log("\n--- Match (infos générales) ---");
  const venue = await prisma.venue.findFirst({ where: { name: { contains: "GGL" } } });

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      venueId: venue?.id ?? undefined,
      halfTimeUsap: 5,
      halfTimeOpponent: 10,
      // USAP : 3E + 2T + 2P = 15+4+6 = 25
      triesUsap: 3, conversionsUsap: 2, penaltiesUsap: 2, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // MHR : 2E + 2T + 2P = 10+4+6 = 20
      triesOpponent: 2, conversionsOpponent: 2, penaltiesOpponent: 2, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Victoire dans le derby catalan au GGL Stadium ! Plus de 4000 supporters " +
        "catalans font le déplacement. Montpellier ouvre le score par Carbonel (pen 11') " +
        "et Janse Van Rensburg (essai 19') pour mener 10-0. CJ McIntyre (23') " +
        "puis Dubois réduit l'écart (34', 10-5). CJ Chiocci à la 40e. " +
        "En 2e MT, Bridge marque pour le MHR (45', 17-5) mais l'USAP réagit : " +
        "pénalité McIntyre, puis CJ Chalureau (49') et CJ Verhaeghe (59') " +
        "laissent Montpellier à 14 à deux reprises. McIntyre en profite pour " +
        "inscrire un doublé (51', 62') et ses pénalités scellent la victoire 25-20.",
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
    let yellowCard = false, yellowCardMin: number | null = null;
    const isCaptain = (p as any).isCaptain ?? false;

    if (p.lastName === "Dubois") { tries = 1; totalPoints = 5; }
    // McIntyre : 2E + 2T + 2P = 10+4+6 = 20 pts
    if (p.lastName === "McIntyre") { tries = 2; conversions = 2; penalties = 2; totalPoints = 20; yellowCard = true; yellowCardMin = 23; }
    if (p.lastName === "Chiocci") { yellowCard = true; yellowCardMin = 40; }

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

  // Composition Montpellier
  console.log("\n--- Composition Montpellier ---");
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
    { minute: 11, type: "PENALITE", isUsap: false, description: "Pénalité de Louis Carbonel (MHR). 3-0." },
    { minute: 19, type: "ESSAI", isUsap: false, description: "Essai de Nicolaas Janse Van Rensburg (MHR). 8-0." },
    { minute: 20, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Louis Carbonel (MHR). 10-0." },
    { minute: 23, type: "CARTON_JAUNE", playerLastName: "McIntyre", isUsap: true, description: "Carton jaune Jake McIntyre (USAP). USAP à 14." },
    { minute: 34, type: "ESSAI", playerLastName: "Dubois", isUsap: true, description: "Essai de Lucas Dubois (USAP). 10-5." },
    { minute: 40, type: "CARTON_JAUNE", playerLastName: "Chiocci", isUsap: true, description: "Carton jaune Xavier Chiocci (USAP). USAP encore à 14." },
    // === MI-TEMPS : MHR 10 - 5 USAP ===
    { minute: 45, type: "ESSAI", isUsap: false, description: "Essai de George Bridge (MHR). 15-5." },
    { minute: 46, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Louis Carbonel (MHR). 17-5." },
    { minute: 48, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 17-8." },
    { minute: 49, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Bastien Chalureau (MHR). MHR à 14." },
    { minute: 51, type: "ESSAI", playerLastName: "McIntyre", isUsap: true, description: "Essai de Jake McIntyre (USAP). 17-13." },
    { minute: 52, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 17-15." },
    { minute: 54, type: "PENALITE", isUsap: false, description: "Pénalité de Louis Carbonel (MHR). 20-15." },
    { minute: 59, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Florian Verhaeghe (MHR). MHR encore à 14." },
    { minute: 60, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 20-18." },
    { minute: 62, type: "ESSAI", playerLastName: "McIntyre", isUsap: true, description: "Essai de Jake McIntyre (USAP). Doublé ! 20-23." },
    { minute: 63, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 20-25. Score final." },
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
    const side = evt.isUsap ? "USAP" : "MHR";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Montpellier 20 - 25 USAP (extérieur)");
  console.log("  Mi-temps : MHR 10 - 5 USAP");
  console.log("  Arbitre : Pierre Brousset");
  console.log("  McIntyre : 2E + 2T + 2P = 20 pts");
  console.log("  4 cartons jaunes (2 USAP, 2 MHR)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

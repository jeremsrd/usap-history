/**
 * Mise à jour du match Ospreys - USAP (Challenge Cup Poule J3, 12/01/2024)
 * Score : Ospreys 25 - USAP 3
 *
 * Défaite sévère à Swansea. L'USAP ne marque qu'une pénalité de McIntyre (46').
 * Hopkins inscrit un doublé (40', 51') et Giles complète (62').
 * Edwards assure au pied (2P + 2T). L'USAP réduite à 13 joueurs en début
 * de 2e MT avec les CJ de Roelofse (43') et Deghmache (49').
 *
 * Sources : epcrugby.com (compositions, stats), ruck.co.uk (résumé détaillé),
 *   ospreysrugby.com (résumé)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-cc3.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 3, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 55, subOut: 55, yellowCard: true, yellowCardMin: 43 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 8, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 65, subOut: 65, yellowCard: true, yellowCardMin: 49 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Apisai", lastName: "Naqalevu", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Eddie", lastName: "Sawailau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Boris", lastName: "Goutard", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Louis", lastName: "Dupichot", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 18, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 19, firstName: "Bastien", lastName: "Chinarro", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 0 },
  { num: 20, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 0 },
  { num: 21, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 0 },
  { num: 22, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 15, subIn: 65 },
  { num: 23, firstName: "Jean-Pascal", lastName: "Barraqué", position: Position.ARRIERE, isStarter: false, minutesPlayed: 0 },
];

// === COMPOSITION OSPREYS (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Gareth Thomas", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Sam Parry", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Tom Botha", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "James Fender", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Adam Beard", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "James Ratti", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Dewi Lake", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Morgan Morse", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Luke Davies", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Dan Edwards", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Keelan Giles", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Owen Watkin", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Keiran Williams", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Mat Protheroe", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Iestyn Hopkins", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Ethan Lewis", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Garyn Phillips", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Ben Warren", position: Position.PILIER_DROIT, isStarter: false },
  { num: 19, name: "Lewis Jones", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 20, name: "Will Hickey", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, name: "Cameron Jones", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Jack Walsh", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 23, name: "Luke Scully", position: Position.CENTRE, isStarter: false },
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
  console.log("=== Mise à jour match Ospreys - USAP (CC Poule J3, 12/01/2024) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2023, endYear: 2024 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, round: "Poule J3", competition: { type: "CHALLENGE_EUROPE" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Morné", "Ferreira");

  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({ where: { name: { contains: "Swansea", mode: "insensitive" } } });
  if (!venue) {
    let wales = await prisma.country.findFirst({ where: { code: "WA" } });
    if (!wales) {
      wales = await prisma.country.create({ data: { name: "Pays de Galles", code: "WA", slug: "pays-de-galles" } });
    }
    venue = await prisma.venue.create({
      data: { name: "Swansea.com Stadium", slug: "swansea-com-stadium", city: "Swansea", countryId: wales.id, capacity: 20520 },
    });
    console.log(`  Créé : ${venue.name}`);
  } else {
    console.log(`  Existe : ${venue.name}`);
  }

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "21:00",
      refereeId,
      venueId: venue.id,
      halfTimeUsap: 0,
      halfTimeOpponent: 8,
      // USAP : 1P = 3
      triesUsap: 0, conversionsUsap: 0, penaltiesUsap: 1, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Ospreys : 3E + 2T + 2P = 15+4+6 = 25
      triesOpponent: 3, conversionsOpponent: 2, penaltiesOpponent: 2, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Défaite sévère à Swansea. Match à oublier pour les Catalans. " +
        "Les Ospreys mènent 8-0 à la pause (pénalité Edwards 34' et essai Hopkins 40'). " +
        "En 2e MT, l'USAP coule : CJ Roelofse (43') et CJ Deghmache (49') " +
        "réduisent les Catalans à 13 pendant 6 minutes. " +
        "McIntyre sauve l'honneur avec une pénalité (46') entre les deux jaunes. " +
        "Hopkins inscrit un doublé (51') et Giles enfonce le clou (62'). " +
        "Edwards parfait au pied (2P + 2T). Score final : 25-3.",
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

    // McIntyre : 1P = 3 pts
    if (p.lastName === "McIntyre") { penalties = 1; totalPoints = 3; }

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

  // Composition Ospreys
  console.log("\n--- Composition Ospreys ---");
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
    { minute: 34, type: "PENALITE", isUsap: false, description: "Pénalité de Dan Edwards (Ospreys). 3-0." },
    { minute: 40, type: "ESSAI", isUsap: false, description: "Essai d'Iestyn Hopkins (Ospreys). Course de 80m sur ballon perdu ! 8-0." },
    // === MI-TEMPS : Ospreys 8 - 0 USAP ===
    { minute: 43, type: "CARTON_JAUNE", playerLastName: "Roelofse", isUsap: true, description: "Carton jaune Nemo Roelofse (USAP). USAP à 14." },
    { minute: 44, type: "PENALITE", isUsap: false, description: "Pénalité de Dan Edwards (Ospreys). 11-0." },
    { minute: 46, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 11-3." },
    { minute: 49, type: "CARTON_JAUNE", playerLastName: "Deghmache", isUsap: true, description: "Carton jaune Sadek Deghmache (USAP). USAP à 13 !" },
    { minute: 51, type: "ESSAI", isUsap: false, description: "Essai d'Iestyn Hopkins (Ospreys). Doublé ! 16-3." },
    { minute: 52, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Dan Edwards (Ospreys). 18-3." },
    { minute: 62, type: "ESSAI", isUsap: false, description: "Essai de Keelan Giles (Ospreys). 23-3." },
    { minute: 64, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Dan Edwards (Ospreys). 25-3. Score final." },
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
    const side = evt.isUsap ? "USAP" : "OSP";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Ospreys 25 - 3 USAP (extérieur)");
  console.log("  Mi-temps : Ospreys 8 - 0 USAP");
  console.log("  Arbitre : Morné Ferreira");
  console.log("  2 CJ USAP : Roelofse (43'), Deghmache (49')");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

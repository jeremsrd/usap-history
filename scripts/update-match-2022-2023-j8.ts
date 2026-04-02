/**
 * Mise à jour du match Bayonne - USAP (J8 Top 14, 22/10/2022)
 * Score : Bayonne 24 - USAP 20
 *
 * Défaite cruelle à Jean-Dauger. L'USAP mène 6-17 à la pause grâce
 * à deux essais rapides de Tilsley (34') et Taumoepeau (37'), tous deux
 * transformés par Tedder. Mais l'indiscipline coûte cher en 2e MT :
 * CJ Acébès (44') puis CJ Bachelier (52'), l'USAP joue à 13 pendant
 * 2 minutes. Bayonne en profite : Germain 2P (44', 48') puis Cassiem
 * essai (71', T Germain) et Germain essai (75', NT) pour un 24-17.
 * Tedder arrache le bonus défensif d'une pénalité (79', 24-20).
 *
 * Essais USAP : Tilsley (34'), Taumoepeau (37')
 * Transformations USAP : Tedder (34', 37')
 * Pénalités USAP : Tedder (20', 79')
 * Essais Bayonne : Cassiem (71'), Germain (75')
 * Transformation Bayonne : Germain (71')
 * Pénalités Bayonne : Germain (8', 17', 44', 48')
 * CJ : Acébès (44', USAP), Bachelier (52', USAP)
 *
 * Sources : itsrugby.fr (compositions), allrugby.com (arbitres, stats),
 *   top14.lnr.fr (feuille de match), francebleu.fr (résumé)
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j8.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 4, firstName: "Will", lastName: "Witty", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 5, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80, yellowCard: true, yellowCardMin: 52 },
  { num: 7, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 8, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 69, subOut: 69 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, isCaptain: true, minutesPlayed: 80, yellowCard: true, yellowCardMin: 44 },
  { num: 12, firstName: "George", lastName: "Tilsley", position: Position.CENTRE, isStarter: true, minutesPlayed: 61, subOut: 61 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tristan", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 26, subIn: 54 },
  { num: 17, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 26, subIn: 54 },
  { num: 19, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 11, subIn: 69 },
  { num: 20, firstName: "Joaquín", lastName: "Oviedo", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 21, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 22, firstName: "Dorian", lastName: "Laborde", position: Position.CENTRE, isStarter: false, minutesPlayed: 19, subIn: 61 },
  { num: 23, firstName: "Maafu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 23, subIn: 57 },
];

// === COMPOSITION BAYONNE (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Matis Perchaud", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Facundo Bosch", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Pascal Cotet", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Manuel Leindekar", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Thomas Ceyte", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Afaesetiti Amosa", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Pierre Huguet", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Uzair Cassiem", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Maxime Machenaud", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Camille Lopez", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Rémy Baget", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Guillaume Martocq", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Sireli Maqala", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Martín Bogado", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Gaëtan Germain", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Torsten van Jaarsveld", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Christopher Talakai", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Denis Marchois", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Mateaki Kafatolu", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Guillaume Rouet", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Jason Robertson", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Eneriko Buliruarua", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Pieter Scholtz", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match Bayonne - USAP (J8, 22/10/2022) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 8, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Tual", "Trainini");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      halfTimeUsap: 17,
      halfTimeOpponent: 6,
      // USAP : 2E + 2T + 2P = 10+4+6 = 20
      triesUsap: 2, conversionsUsap: 2, penaltiesUsap: 2, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Bayonne : 2E + 1T + 4P = 10+2+12 = 24
      triesOpponent: 2, conversionsOpponent: 1, penaltiesOpponent: 4, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Défaite cruelle au Stade Jean-Dauger. L'USAP domine la 1re mi-temps : " +
        "après les pénalités de Germain (8', 17') et Tedder (20', 3-6), deux essais éclairs " +
        "de Tilsley (34') et Taumoepeau (37'), tous deux transformés par Tedder, " +
        "portent le score à 6-17 à la pause. Mais l'indiscipline catalane coûte cher " +
        "en 2e mi-temps : carton jaune Acébès (44') puis Bachelier (52'), l'USAP joue " +
        "à 13 pendant 2 minutes. Germain en profite au pied (44', 48', 12-17). " +
        "Bayonne renverse le match dans les 10 dernières minutes : essai de Cassiem (71', " +
        "transformé par Germain, 19-17) puis essai de Germain (75', non transformé, 24-17). " +
        "Tedder arrache le bonus défensif d'une pénalité à la 79' (24-20). Score final : 24-20.",
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
    const hasYellowCard = (p as any).yellowCard ?? false;
    const yellowCardMin = (p as any).yellowCardMin ?? null;

    // Tedder : 2P (20', 79') + 2T (34', 37') = 6+4 = 10 pts
    if (p.lastName === "Tedder") { penalties = 2; conversions = 2; totalPoints = 10; }
    // Tilsley : 1E (34') = 5 pts
    if (p.lastName === "Tilsley") { tries = 1; totalPoints = 5; }
    // Taumoepeau : 1E (37') = 5 pts
    if (p.lastName === "Taumoepeau") { tries = 1; totalPoints = 5; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard: hasYellowCard, yellowCardMin,
        redCard: false, redCardMin: null,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const yc = hasYellowCard ? `(CJ ${yellowCardMin}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", isCaptain ? "(C)" : "", yc, sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
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
    { minute: 8, type: "PENALITE", isUsap: false, description: "Pénalité de Gaëtan Germain (Bayonne). 3-0." },
    { minute: 17, type: "PENALITE", isUsap: false, description: "Pénalité de Gaëtan Germain (Bayonne). 6-0." },
    { minute: 20, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 6-3." },
    { minute: 34, type: "ESSAI", playerLastName: "Tilsley", isUsap: true, description: "Essai de George Tilsley (USAP). 6-8." },
    { minute: 34, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 6-10." },
    { minute: 37, type: "ESSAI", playerLastName: "Taumoepeau", isUsap: true, description: "Essai d'Afusipa Taumoepeau (USAP). 6-15." },
    { minute: 37, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 6-17." },
    // === MI-TEMPS : Bayonne 6 - 17 USAP ===
    // === 2e MI-TEMPS ===
    { minute: 44, type: "CARTON_JAUNE", playerLastName: "Acébès", isUsap: true, description: "Carton jaune Mathieu Acébès (USAP)." },
    { minute: 44, type: "PENALITE", isUsap: false, description: "Pénalité de Gaëtan Germain (Bayonne). 9-17." },
    { minute: 48, type: "PENALITE", isUsap: false, description: "Pénalité de Gaëtan Germain (Bayonne). 12-17." },
    { minute: 52, type: "CARTON_JAUNE", playerLastName: "Bachelier", isUsap: true, description: "Carton jaune Lucas Bachelier (USAP). L'USAP réduit à 13." },
    { minute: 71, type: "ESSAI", isUsap: false, description: "Essai d'Uzair Cassiem (Bayonne). 17-17." },
    { minute: 71, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Gaëtan Germain (Bayonne). 19-17." },
    { minute: 75, type: "ESSAI", isUsap: false, description: "Essai de Gaëtan Germain (Bayonne). Non transformé. 24-17." },
    { minute: 79, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). Bonus défensif. 24-20." },
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
  console.log("  Score : Bayonne 24 - 20 USAP (extérieur)");
  console.log("  Mi-temps : Bayonne 6 - 17 USAP");
  console.log("  Arbitre : Tual Trainini");
  console.log("  Tedder 10 pts (2P + 2T), Tilsley 1E (5 pts), Taumoepeau 1E (5 pts)");
  console.log("  CJ : Acébès (44'), Bachelier (52')");
  console.log("  Bayonne : Germain 4P+1T+1E (17 pts), Cassiem 1E (5 pts)");
  console.log("  Bonus défensif arraché à la 79'");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

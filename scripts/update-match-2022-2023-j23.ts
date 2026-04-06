/**
 * Mise à jour du match USAP - Racing 92 (J23 Top 14, 22/04/2023)
 * Score : USAP 30 - 21 Racing 92
 *
 * Remontada à Aimé-Giral ! Double CR Mamea Lemalu/Bresler (23').
 * Oviedo E (8', 5-0). Russell P (14', 5-3).
 * Taofifenua E Racing (33', 5-8). Russell P (38', 5-11).
 * McIntyre P (40', 8-11). Mi-temps : 8-11.
 * Chouzenoux E Racing (47', 8-16). Lotrian E (50', 13-16).
 * Crossdale E (55', T Tedder, 20-16). Fickou E Racing (58', 20-21).
 * Oviedo E (65', T Tedder, 27-21). Tedder P (75', 30-21).
 *
 * Essais USAP : Oviedo (8', 65'), Lotrian (50'), Crossdale (55')
 * Transformations USAP : Tedder (56', 66')
 * Pénalités USAP : McIntyre (40'), Tedder (75')
 * Essais Racing : Taofifenua (33'), Chouzenoux (47'), Fickou (58')
 * Pénalités Racing : Russell (14', 38')
 * CR : Mamea Lemalu (23', USAP), Bresler (23', Racing)
 *
 * Sources : itsrugby.fr, allrugby.com, all.rugby, eurosport.fr, top14.lnr.fr
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j23.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 48, subOut: 48 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 63, subOut: 63 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 63, subOut: 63 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Brad", lastName: "Shields", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Joaquín", lastName: "Oviedo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 69, subOut: 69 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 23, redCard: true, redCardMin: 23 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 77, subOut: 77 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Ali", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 71, subOut: 71 },
  { num: 12, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Eddie", lastName: "Sawailau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tristan", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: false, minutesPlayed: 28, subIn: 52 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 32, subIn: 48 },
  { num: 18, firstName: "Siua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 17, subIn: 63 },
  { num: 19, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 17, subIn: 63 },
  { num: 20, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 13, subIn: 67 },
  { num: 21, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 11, subIn: 69 },
  { num: 22, firstName: "Théo", lastName: "Forner", position: Position.AILIER, isStarter: false, minutesPlayed: 9, subIn: 71 },
  { num: 23, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 3, subIn: 77 },
];

// === COMPOSITION RACING 92 (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Guram Gogichashvili", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Janick Tarrit", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Trevor Nyakane", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Fabien Sanconnie", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Anton Bresler", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Ibrahim Diallo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Baptiste Chouzenoux", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Maxime Baudonne", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Nolann Le Garrec", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Finn Russell", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Vinaya Habosi", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Henry Chavancy", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Gaël Fickou", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Donovan Taofifenua", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Warrick Gelant", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Cameron Woki", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 17, name: "Francis Saili", position: Position.CENTRE, isStarter: false },
  { num: 18, name: "Thomas Moukoro", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 19, name: "Peniami Narisia", position: Position.PILIER_DROIT, isStarter: false },
  { num: 20, name: "Ali Oz", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, name: "Antoine Gibert", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Max Spring", position: Position.ARRIERE, isStarter: false },
  { num: 23, name: "Hassane Kolingar", position: Position.PILIER_GAUCHE, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Racing 92 (J23, 22/04/2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 23, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Adrien", "Descottes");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      halfTimeUsap: 8,
      halfTimeOpponent: 11,
      // USAP : 4E + 2T + 2P = 20+4+6 = 30
      triesUsap: 4, conversionsUsap: 2, penaltiesUsap: 2, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Racing : 3E + 0T + 2P = 15+0+6 = 21
      triesOpponent: 3, conversionsOpponent: 0, penaltiesOpponent: 2, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Remontada incroyable à Aimé-Giral ! Oviedo ouvre le score (8', 5-0). " +
        "Russell répond par 2 pénalités (14', 38') et Taofifenua inscrit un essai (33', 5-8). " +
        "Double carton rouge simultané : Mamea Lemalu et Bresler sont exclus (23'). " +
        "McIntyre P (40', 8-11). Mi-temps : 8-11. " +
        "Chouzenoux creuse l'écart pour le Racing (47', 8-16). " +
        "Mais l'USAP, portée par Aimé-Giral, renverse tout : " +
        "Lotrian (50', 13-16), Crossdale (55', T Tedder, 20-16). " +
        "Fickou ramène le Racing devant (58', 20-21) mais Oviedo signe un doublé décisif (65', T Tedder, 27-21). " +
        "Tedder scelle la victoire sur pénalité (75', 30-21).",
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
    const redCard = (p as any).redCard ?? false;
    const redCardMin = (p as any).redCardMin ?? null;

    // Oviedo : 2E (8', 65') = 10 pts
    if (p.lastName === "Oviedo") { tries = 2; totalPoints = 10; }
    // Lotrian : 1E (50') = 5 pts
    if (p.lastName === "Lotrian") { tries = 1; totalPoints = 5; }
    // Crossdale : 1E (55') = 5 pts
    if (p.lastName === "Crossdale") { tries = 1; totalPoints = 5; }
    // McIntyre : 1P (40') = 3 pts
    if (p.lastName === "McIntyre") { penalties = 1; totalPoints = 3; }
    // Tedder : 2T (56', 66') + 1P (75') = 4+3 = 7 pts
    if (p.lastName === "Tedder") { conversions = 2; penalties = 1; totalPoints = 7; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard: false, yellowCardMin: null, redCard, redCardMin,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const cards = redCard ? `CR(${redCardMin}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", cards, isCaptain ? "(C)" : "", sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // Composition Racing 92
  console.log("\n--- Composition Racing 92 ---");
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
    { minute: 8, type: "ESSAI", playerLastName: "Oviedo", isUsap: true, description: "Essai de Joaquín Oviedo (USAP). 5-0." },
    { minute: 14, type: "PENALITE", isUsap: false, description: "Pénalité de Finn Russell (Racing 92). 5-3." },
    { minute: 23, type: "CARTON_ROUGE", playerLastName: "Mamea Lemalu", isUsap: true, description: "Carton rouge Genesis Mamea Lemalu (USAP). Plaquage dangereux." },
    { minute: 23, type: "CARTON_ROUGE", isUsap: false, description: "Carton rouge Anton Bresler (Racing 92). Incident simultané." },
    { minute: 33, type: "ESSAI", isUsap: false, description: "Essai de Donovan Taofifenua (Racing 92). 5-8." },
    { minute: 38, type: "PENALITE", isUsap: false, description: "Pénalité de Finn Russell (Racing 92). 5-11." },
    { minute: 40, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 8-11." },
    // === MI-TEMPS : USAP 8 - 11 Racing 92 ===
    // === 2e MI-TEMPS ===
    { minute: 47, type: "ESSAI", isUsap: false, description: "Essai de Baptiste Chouzenoux (Racing 92). 8-16." },
    { minute: 50, type: "ESSAI", playerLastName: "Lotrian", isUsap: true, description: "Essai de Sacha Lotrian (USAP). 13-16." },
    { minute: 55, type: "ESSAI", playerLastName: "Crossdale", isUsap: true, description: "Essai d'Alistair Crossdale (USAP). 18-16." },
    { minute: 56, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 20-16." },
    { minute: 58, type: "ESSAI", isUsap: false, description: "Essai de Gaël Fickou (Racing 92). 20-21." },
    { minute: 65, type: "ESSAI", playerLastName: "Oviedo", isUsap: true, description: "Essai de Joaquín Oviedo (USAP). Doublé ! 25-21." },
    { minute: 66, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 27-21." },
    { minute: 75, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 30-21." },
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
    const side = evt.isUsap ? "USAP" : "R92";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 30 - 21 Racing 92 (domicile)");
  console.log("  Mi-temps : 8-11");
  console.log("  Arbitre : Adrien Descottes");
  console.log("  Oviedo 10 pts (2E), Lotrian 5 pts (1E), Crossdale 5 pts (1E)");
  console.log("  McIntyre 3 pts (1P), Tedder 7 pts (2T + 1P)");
  console.log("  Racing : Taofifenua 1E, Chouzenoux 1E, Fickou 1E, Russell 2P");
  console.log("  CR : Mamea Lemalu (23' USAP), Bresler (23' Racing)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

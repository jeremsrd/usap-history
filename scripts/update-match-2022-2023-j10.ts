/**
 * Mise à jour du match Racing 92 - USAP (J10 Top 14, 05/11/2022)
 * Score : Racing 92 44 - USAP 20
 *
 * L'USAP menait 13-14 à la pause grâce aux essais de Tedder (12')
 * et Goutard (29'), tous deux transformés. Mais l'entrée de Finn Russell
 * à la mi-temps change tout : Baudonne E (42'), puis Tedder recolle
 * à 20-20 (2P ~50', ~55'). Russell P (~58'), puis Russell E (61'),
 * Wade E (70'), Lauret E (78'), tous transformés par Russell.
 * Score final : 44-20, l'USAP s'effondre dans les 20 dernières minutes.
 *
 * Essais USAP : Tedder (12'), Goutard (29')
 * Transformations USAP : Tedder (12', 29')
 * Pénalités USAP : Tedder (~50', ~55')
 * Essais Racing : Lauret (32', 78'), Baudonne (42'), Russell (61'), Wade (70')
 * Transformations Racing : Gibert (32'), Russell (42', 61', 70', 78')
 * Pénalités Racing : Gibert (~5', ~20'), Russell (~58')
 *
 * Sources : top14.lnr.fr (compositions), allrugby.com (fiche match),
 *   francebleu.fr (résumé), wikipedia (saison Racing 92)
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j10.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 80 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 10, firstName: "Tristan", lastName: "Tedder", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Edward", lastName: "Sawailau", position: Position.AILIER, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 12, firstName: "George", lastName: "Tilsley", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Mathieu", lastName: "Acébès", position: Position.CENTRE, isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 19, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 20, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 21, firstName: "Patricio", lastName: "Fernández", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 0 },
  { num: 22, firstName: "Nino", lastName: "Séguéla", position: Position.AILIER, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 23, firstName: "Siosiua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 29, subIn: 51 },
];

// === COMPOSITION RACING 92 (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Hassane Kolingar", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Camille Chat", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Biyi Alo", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Boris Palu", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Fabien Sanconnie", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Wenceslas Lauret", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Baptiste Chouzenoux", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Anthime Hemery", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Nolann Le Garrec", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Antoine Gibert", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Christian Wade", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Henry Chavancy", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Francis Saili", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Louis Dupichot", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Warrick Gelant", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Janick Tarrit", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Eddy Ben Arous", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Anton Bresler", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Maxime Baudonne", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Max Spring", position: Position.NUMERO_HUIT, isStarter: false },
  { num: 21, name: "Finn Russell", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Olivier Klemenczak", position: Position.AILIER, isStarter: false },
  { num: 23, name: "Cedate Gomes Sa", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match Racing 92 - USAP (J10, 05/11/2022) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 10, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Vincent", "Blasco-Baqué");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      halfTimeUsap: 14,
      halfTimeOpponent: 13,
      videoUrl: "https://www.youtube.com/watch?v=oBFc4LRLJEI",
      // USAP : 2E + 2T + 2P = 10+4+6 = 20
      triesUsap: 2, conversionsUsap: 2, penaltiesUsap: 2, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Racing : 5E + 5T + 3P = 25+10+9 = 44
      triesOpponent: 5, conversionsOpponent: 5, penaltiesOpponent: 3, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "L'USAP réalise une excellente 1re mi-temps à la Défense Arena. Tedder inscrit un essai " +
        "(12', transformé) et Goutard double la mise (29', transformé) : 6-14 USAP. Lauret réduit " +
        "pour le Racing (32', T Gibert, 13-14). Mi-temps : 13-14 en faveur de l'USAP. " +
        "Mais l'entrée de Finn Russell à la mi-temps change la donne. Baudonne marque dès la 42' " +
        "(T Russell, 20-14). Tedder recolle à 20-20 de 2 pénalités (~50', ~55'). " +
        "Puis le Racing accélère : Russell P (~58', 23-20), Russell E (61', T, 30-20), " +
        "Wade E (70', T Russell, 37-20), Lauret E (78', T Russell, 44-20). " +
        "L'USAP s'effondre totalement dans les 20 dernières minutes. Score final : 44-20.",
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

    // Tedder : 1E (12') + 2T (12', 29') + 2P (~50', ~55') = 5+4+6 = 15 pts
    if (p.lastName === "Tedder") { tries = 1; conversions = 2; penalties = 2; totalPoints = 15; }
    // Goutard : 1E (29') = 5 pts
    if (p.lastName === "Goutard") { tries = 1; totalPoints = 5; }

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

  // Composition Racing
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
    { minute: 5, type: "PENALITE", isUsap: false, description: "Pénalité d'Antoine Gibert (Racing 92). 3-0." },
    { minute: 12, type: "ESSAI", playerLastName: "Tedder", isUsap: true, description: "Essai de Tristan Tedder (USAP). 3-5." },
    { minute: 12, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 3-7." },
    { minute: 20, type: "PENALITE", isUsap: false, description: "Pénalité d'Antoine Gibert (Racing 92). 6-7." },
    { minute: 29, type: "ESSAI", playerLastName: "Goutard", isUsap: true, description: "Essai de Boris Goutard (USAP). 6-12." },
    { minute: 29, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 6-14." },
    { minute: 32, type: "ESSAI", isUsap: false, description: "Essai de Wenceslas Lauret (Racing 92). 11-14." },
    { minute: 32, type: "TRANSFORMATION", isUsap: false, description: "Transformation d'Antoine Gibert (Racing 92). 13-14." },
    // === MI-TEMPS : Racing 13 - 14 USAP ===
    // === 2e MI-TEMPS ===
    { minute: 42, type: "ESSAI", isUsap: false, description: "Essai de Maxime Baudonne (Racing 92). 18-14." },
    { minute: 42, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Finn Russell (Racing 92). 20-14." },
    { minute: 50, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 20-17." },
    { minute: 55, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 20-20." },
    { minute: 58, type: "PENALITE", isUsap: false, description: "Pénalité de Finn Russell (Racing 92). 23-20." },
    { minute: 61, type: "ESSAI", isUsap: false, description: "Essai de Finn Russell (Racing 92). 28-20." },
    { minute: 61, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Finn Russell (Racing 92). 30-20." },
    { minute: 70, type: "ESSAI", isUsap: false, description: "Essai de Christian Wade (Racing 92). 35-20." },
    { minute: 70, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Finn Russell (Racing 92). 37-20." },
    { minute: 78, type: "ESSAI", isUsap: false, description: "Essai de Wenceslas Lauret (Racing 92). 42-20." },
    { minute: 78, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Finn Russell (Racing 92). 44-20." },
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
  console.log("  Score : Racing 92 44 - 20 USAP (extérieur)");
  console.log("  Mi-temps : Racing 13 - 14 USAP (l'USAP menait !)");
  console.log("  Arbitre : Vincent Blasco-Baqué");
  console.log("  Tedder 15 pts (1E + 2T + 2P), Goutard 1E (5 pts)");
  console.log("  Racing : Lauret 2E, Russell 1E+4T+1P, Wade 1E, Baudonne 1E, Gibert 1T+2P");
  console.log("  Effondrement USAP en 2e MT après l'entrée de Finn Russell");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

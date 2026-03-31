/**
 * Mise à jour du match Benetton - USAP (Challenge Cup Poule J2, 16/12/2023)
 * Score : Benetton 29 - USAP 7
 *
 * Lourde défaite à Trévise. Benetton domine de bout en bout avec
 * 3 essais d'Umaga (15', 36', 48') et 1 essai de Smith (80').
 * Smith assure les transformations (3). L'USAP sauve l'honneur par
 * Rodor (75') transformé par Montgaillard. Double carton jaune à 29'
 * (Negri pour Benetton, Bachelier pour USAP).
 *
 * Sources : epcrugby.com (compositions, stats), itsrugby.fr (marqueurs)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-cc2.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 2, firstName: "Vakhtang", lastName: "Jincharadze", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80, yellowCard: true, yellowCardMin: 29 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Valentin", lastName: "Moro", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 80 },
  { num: 10, firstName: "Jean-Pascal", lastName: "Barraqué", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Eddie", lastName: "Sawailau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Louis", lastName: "Dupichot", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 18, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 19, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 0 },
  { num: 20, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 0 },
  { num: 21, firstName: "Ewan", lastName: "Bertheau", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 0 },
  { num: 22, firstName: "Lenny", lastName: "Viola", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 0 },
  { num: 23, firstName: "Nicola", lastName: "Bozzo", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 0 },
];

// === COMPOSITION BENETTON (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Mirco Spagnolo", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Bautista Bernasconi", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Tiziano Pasquali", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Edoardo Iachizzi", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Eli Snyman", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Alessandro Izekor", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Sebastian Negri", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Lorenzo Cannone", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Andy Uren", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Jacob Umaga", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Onisi Ratave", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Paolo Odogwu", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Nacho Brex", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Edoardo Padovani", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Rhyno Smith", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Siua Maile", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Federico Zani", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Filippo Alongi", position: Position.PILIER_DROIT, isStarter: false },
  { num: 19, name: "Niccolò Cannone", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 20, name: "Riccardo Favretto", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, name: "Henry Stowers", position: Position.NUMERO_HUIT, isStarter: false },
  { num: 22, name: "Nicolò Casilio", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 23, name: "Leonardo Marin", position: Position.DEMI_OUVERTURE, isStarter: false },
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
  console.log("=== Mise à jour match Benetton - USAP (CC Poule J2, 16/12/2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2023, endYear: 2024 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, round: "Poule J2", competition: { type: "CHALLENGE_EUROPE" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Eoghan", "Cross");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:15",
      refereeId,
      halfTimeUsap: 0,
      halfTimeOpponent: 17,
      // USAP : 1E + 1T = 7
      triesUsap: 1, conversionsUsap: 1, penaltiesUsap: 0, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Benetton : 4E + 3T + 1P = 20+6+3 = 29
      triesOpponent: 4, conversionsOpponent: 3, penaltiesOpponent: 1, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Lourde défaite à Trévise. Benetton domine de bout en bout. " +
        "Umaga inscrit un triplé (15', 36', 48') et une pénalité (32'). " +
        "Smith assure 3 transformations et clôt le match avec un essai (80'). " +
        "17-0 à la pause, l'USAP ne parvient jamais à exister. " +
        "Double carton jaune simultané à 29' (Negri pour Benetton, Bachelier pour l'USAP). " +
        "Rodor sauve l'honneur en fin de match (75'), transformé par Montgaillard.",
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

    if (p.lastName === "Rodor") { tries = 1; totalPoints = 5; }
    if (p.lastName === "Montgaillard") { conversions = 1; totalPoints = 2; }

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

  // Composition Benetton
  console.log("\n--- Composition Benetton ---");
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
    { minute: 15, type: "ESSAI", isUsap: false, description: "Essai de Jacob Umaga (Benetton). 0-5." },
    { minute: 15, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Rhyno Smith (Benetton). 0-7." },
    { minute: 29, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Sebastian Negri (Benetton)." },
    { minute: 29, type: "CARTON_JAUNE", playerLastName: "Bachelier", isUsap: true, description: "Carton jaune Lucas Bachelier (USAP). Double CJ simultané." },
    { minute: 32, type: "PENALITE", isUsap: false, description: "Pénalité de Jacob Umaga (Benetton). 0-10." },
    { minute: 36, type: "ESSAI", isUsap: false, description: "Essai de Jacob Umaga (Benetton). Doublé ! 0-15." },
    { minute: 36, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Rhyno Smith (Benetton). 0-17." },
    // === MI-TEMPS : USAP 0 - 17 Benetton ===
    { minute: 48, type: "ESSAI", isUsap: false, description: "Essai de Jacob Umaga (Benetton). Triplé ! 0-22." },
    { minute: 48, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Rhyno Smith (Benetton). 0-24." },
    { minute: 75, type: "ESSAI", playerLastName: "Rodor", isUsap: true, description: "Essai de Matteo Rodor (USAP). L'honneur est sauf. 5-24." },
    { minute: 75, type: "TRANSFORMATION", playerLastName: "Montgaillard", isUsap: true, description: "Transformation de Victor Montgaillard (USAP). 7-24." },
    { minute: 80, type: "ESSAI", isUsap: false, description: "Essai de Rhyno Smith (Benetton). Record EPCR pour Benetton ! 7-29." },
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
    const side = evt.isUsap ? "USAP" : "BEN";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Benetton 29 - 7 USAP (extérieur)");
  console.log("  Mi-temps : Benetton 17 - 0 USAP");
  console.log("  Arbitre : Eoghan Cross");
  console.log("  Umaga triplé, Smith 3T + 1E");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

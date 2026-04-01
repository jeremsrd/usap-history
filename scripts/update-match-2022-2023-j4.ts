/**
 * Mise à jour du match USAP - RC Toulon (J4 Top 14, 24/09/2022)
 * Score : USAP 19 - Toulon 13
 *
 * Première victoire de la saison à Aimé-Giral ! Tedder magistral au pied
 * (14 pts : 4P + 1T). Acébès inscrit le seul essai catalan (19').
 * L'USAP mène 16-6 à la pause et tient malgré un essai toulonnais
 * en fin de match (Smaïli 79', transformé par Dréan).
 *
 * Essai USAP : Acébès (19')
 * Pénalités USAP : Tedder (6', 31', 40', 48')
 * Essai Toulon : Smaïli (79')
 * CJ : Mamea Lemalu (37', USAP), Dréan (39', Toulon)
 *
 * Sources : top14.lnr.fr (compositions), itsrugby.fr (score par minute),
 *   rctoulon.com (résumé), francebleu.fr (live)
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j4.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 63, subOut: 63 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 3, firstName: "Siosiua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 63, subOut: 63 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 71, subOut: 71 },
  { num: 5, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 6, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 64, subOut: 64 },
  { num: 7, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 41, subOut: 41, yellowCard: true, yellowCardMin: 37 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 70, subOut: 70 },
  { num: 10, firstName: "Tristan", lastName: "Tedder", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 63, subOut: 63 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 12, firstName: "George", lastName: "Tilsley", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Alivereti", lastName: "Duguivalu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Lucas", lastName: "Dubois", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 17, firstName: "Lucas", lastName: "Velarte", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 28, subIn: 52 },
  { num: 18, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 39, subIn: 41 },
  { num: 19, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 17, subIn: 63 },
  { num: 20, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 17, subIn: 63 },
  { num: 21, firstName: "Shahn", lastName: "Eru", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 16, subIn: 64 },
  { num: 22, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 10, subIn: 70 },
  { num: 23, firstName: "Andrei", lastName: "Mahu", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 9, subIn: 71 },
];

// === COMPOSITION TOULON (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Dany Priso", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Christopher Tolofua", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Kieran Brookes", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Sitaleki Timani", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Mathieu Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Swan Rebbadj", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Raphaël Lakafia", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Mathieu Bastareaud", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Benoît Paillaugue", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Baptiste Serin", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Gaël Dréan", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Jérémy Sinzelle", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Atila Septar", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Jiuta Wainiqolo", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Aymeric Luc", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Mathieu Smaïli", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Brian Alainu'uese", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 18, name: "Emerick Setiano", position: Position.PILIER_DROIT, isStarter: false },
  { num: 19, name: "Facundo Isa", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Teddy Baubigny", position: Position.TALONNEUR, isStarter: false },
  { num: 21, name: "Cornell du Preez", position: Position.NUMERO_HUIT, isStarter: false },
  { num: 22, name: "Bruce Devaux", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Thomas Salles", position: Position.PILIER_GAUCHE, isStarter: false },
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
  console.log("=== Mise à jour match USAP - RC Toulon (J4, 24/09/2022) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 4, competition: { shortName: "Top 14" } },
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
      kickoffTime: "15:00",
      refereeId,
      halfTimeUsap: 16,
      halfTimeOpponent: 6,
      videoUrl: "https://www.youtube.com/watch?v=pVRMPZnPx-Y",
      // USAP : 1E + 1T + 4P = 5+2+12 = 19
      triesUsap: 1, conversionsUsap: 1, penaltiesUsap: 4, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Toulon : 1E + 1T + 1P = 5+2+3 + 3P(Serin+Paillaugue) = ... non
      // Toulon : 1E + 1T + 1P(Serin) + 1P(Paillaugue) = 5+2+3+3 = 13
      triesOpponent: 1, conversionsOpponent: 1, penaltiesOpponent: 2, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Première victoire de la saison à Aimé-Giral ! Tedder magistral au pied (14 pts). " +
        "Serin ouvre le score pour Toulon (pénalité, 4') mais Tedder réplique aussitôt (6'). " +
        "Acébès inscrit le seul essai du match côté catalan (19', transformé par Tedder, 10-3). " +
        "Tedder creuse l'écart avec deux pénalités supplémentaires (31', 40'). " +
        "Carton jaune Mamea Lemalu (37') mais Dréan est aussi exclu temporairement (39'). " +
        "Paillaugue réduit le score (pénalité, 39', 13-6). Mi-temps : 16-6. " +
        "En 2e MT, Tedder ajoute une 4e pénalité (48', 19-6). " +
        "Toulon revient en fin de match par Smaïli (essai 79', transformé par Dréan, 19-13) " +
        "mais c'est trop tard. Score final : 19-13.",
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

    // Tedder : 4P + 1T = 12+2 = 14 pts
    if (p.lastName === "Tedder") { penalties = 4; conversions = 1; totalPoints = 14; }
    // Acébès : 1E = 5 pts
    if (p.lastName === "Acébès") { tries = 1; totalPoints = 5; }

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

  // Composition Toulon
  console.log("\n--- Composition RC Toulon ---");
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
    { minute: 4, type: "PENALITE", isUsap: false, description: "Pénalité de Baptiste Serin (Toulon). 0-3." },
    { minute: 6, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 3-3." },
    { minute: 19, type: "ESSAI", playerLastName: "Acébès", isUsap: true, description: "Essai de Mathieu Acébès (USAP). 8-3." },
    { minute: 19, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 10-3." },
    { minute: 31, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 13-3." },
    { minute: 37, type: "CARTON_JAUNE", playerLastName: "Mamea Lemalu", isUsap: true, description: "Carton jaune Genesis Mamea Lemalu (USAP). Charge à l'épaule." },
    { minute: 39, type: "PENALITE", isUsap: false, description: "Pénalité de Benoît Paillaugue (Toulon). 13-6." },
    { minute: 39, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Gaël Dréan (Toulon). Passe en avant volontaire." },
    { minute: 40, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 16-6." },
    // === MI-TEMPS : USAP 16 - 6 Toulon ===
    // === 2e MI-TEMPS ===
    { minute: 48, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 19-6." },
    { minute: 79, type: "ESSAI", isUsap: false, description: "Essai de Mathieu Smaïli (Toulon). 19-11." },
    { minute: 79, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Gaël Dréan (Toulon). 19-13. Score final." },
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
    const side = evt.isUsap ? "USAP" : "RCT";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 19 - 13 RC Toulon (domicile)");
  console.log("  Mi-temps : USAP 16 - 6 Toulon");
  console.log("  Arbitre : Thomas Charabas");
  console.log("  Tedder 14 pts (4P + 1T), Acébès 1E (5 pts)");
  console.log("  Première victoire de la saison !");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

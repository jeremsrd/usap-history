/**
 * Mise à jour du match RC Toulon - USAP (J22 Top 14, 15/04/2023)
 * Score : Toulon 37 - 15 USAP
 *
 * Lourde défaite à Mayol. Sawailau ouvre le score (9', T Tedder, 0-7).
 * Biggar P (14', 3-7), P (23', 6-7). Biggar E (27', T, 13-7).
 * Biggar E (33', T, 20-7). CR Fa'asalele (38'). Mi-temps : 20-7.
 * Tedder P (46', 20-10). Domon E (51', T, 27-10).
 * CJ Fakatika (62'). Serin E (66', 32-10).
 * Montgaillard E (73', 32-15). West E (80', T Parisse, 37-15).
 *
 * Essais USAP : Sawailau (9'), Montgaillard (73')
 * Transformation USAP : Tedder (10')
 * Pénalité USAP : Tedder (46')
 * Essais Toulon : Biggar (27', 33'), Domon (51'), Serin (66'), West (80')
 * Transformations Toulon : 5 (sur 5 essais)
 * Pénalités Toulon : Biggar (14', 23')
 * CR : Fa'asalele (38', USAP)
 * CJ : Fakatika (62', USAP)
 *
 * Sources : itsrugby.fr, allrugby.com, francebleu.fr, blog-rct.com, top14.lnr.fr
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j22.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 53, subOut: 53 },
  { num: 2, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 48, subOut: 48 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 48, subOut: 48 },
  { num: 4, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 38, redCard: true, redCardMin: 38 },
  { num: 5, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 48, subOut: 48 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 48, subOut: 48 },
  { num: 7, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 48, subOut: 48 },
  { num: 10, firstName: "Tristan", lastName: "Tedder", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Dorian", lastName: "Laborde", position: Position.CENTRE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 13, firstName: "Eddie", lastName: "Sawailau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Théo", lastName: "Forner", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Lucas", lastName: "Dubois", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 32, subIn: 48 },
  { num: 17, firstName: "Siua", lastName: "Halanukonuka", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 32, subIn: 48 },
  { num: 18, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 32, subIn: 48 },
  { num: 19, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 32, subIn: 48 },
  { num: 20, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 32, subIn: 48 },
  { num: 21, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 27, subIn: 53, yellowCard: true, yellowCardMin: 62 },
  { num: 22, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 23, firstName: "Nino", lastName: "Séguéla", position: Position.AILIER, isStarter: false, minutesPlayed: 0 },
];

// === COMPOSITION RC TOULON (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Bruce Devaux", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Christopher Tolofua", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Beka Gigashvili", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Mathieu Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Brian Alainu'uese", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Mattéo Le Corvec", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Mathieu Bastareaud", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Sergio Parisse", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Benoît Paillaugue", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Dan Biggar", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Aymeric Luc", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Maëlan Rabut", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Jérémy Sinzelle", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Gaël Dréan", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Marius Domon", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Waisea Nayacalevu", position: Position.CENTRE, isStarter: false },
  { num: 17, name: "Facundo Isa", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 18, name: "Dany Priso", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 19, name: "Teddy Baubigny", position: Position.TALONNEUR, isStarter: false },
  { num: 20, name: "Kieran Brookes", position: Position.PILIER_DROIT, isStarter: false },
  { num: 21, name: "Baptiste Serin", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Matthias Halagahu", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 23, name: "Ihaia West", position: Position.DEMI_OUVERTURE, isStarter: false },
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
  console.log("=== Mise à jour match Toulon - USAP (J22, 15/04/2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 22, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Jérémy", "Rozier");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      halfTimeUsap: 7,
      halfTimeOpponent: 20,
      videoUrl: "https://www.dailymotion.com/embed/video/x8k52nn",
      // USAP : 2E + 1T + 1P = 10+2+3 = 15
      triesUsap: 2, conversionsUsap: 1, penaltiesUsap: 1, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Toulon : 5E + 5T + 2P = 25+10+6 = 41? Non, 37. Recalcul : 5E + 3T + 2P = 25+6+6 = 37
      triesOpponent: 5, conversionsOpponent: 3, penaltiesOpponent: 2, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Lourde défaite à Mayol, aggravée par le carton rouge de Fa'asalele. " +
        "Sawailau ouvre pourtant le score (9', T Tedder, 0-7). " +
        "Biggar ramène Toulon au pied (P 14', P 23', 6-7) puis inscrit deux essais (27', 33', 20-7). " +
        "Fa'asalele est exclu (CR 38'). Mi-temps : 20-7. " +
        "Tedder réduit sur pénalité (46', 20-10) mais Toulon est impitoyable : " +
        "Domon (51'), Serin (66') creusent l'écart. CJ Fakatika (62'). " +
        "Montgaillard sauve l'honneur (73', 32-15) avant le dernier essai de West (80', T Parisse, 37-15).",
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
    const yellowCard = (p as any).yellowCard ?? false;
    const yellowCardMin = (p as any).yellowCardMin ?? null;
    const redCard = (p as any).redCard ?? false;
    const redCardMin = (p as any).redCardMin ?? null;

    // Sawailau : 1E (9') = 5 pts
    if (p.lastName === "Sawailau") { tries = 1; totalPoints = 5; }
    // Tedder : 1T (10') + 1P (46') = 2+3 = 5 pts
    if (p.lastName === "Tedder") { conversions = 1; penalties = 1; totalPoints = 5; }
    // Montgaillard : 1E (73') = 5 pts
    if (p.lastName === "Montgaillard") { tries = 1; totalPoints = 5; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard, yellowCardMin, redCard, redCardMin,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const cards = [redCard ? `CR(${redCardMin}')` : "", yellowCard ? `CJ(${yellowCardMin}')` : ""].filter(Boolean).join(" ");
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", cards, isCaptain ? "(C)" : "", sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
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
    { minute: 9, type: "ESSAI", playerLastName: "Sawailau", isUsap: true, description: "Essai d'Eddie Sawailau (USAP). 0-5." },
    { minute: 10, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 0-7." },
    { minute: 14, type: "PENALITE", isUsap: false, description: "Pénalité de Dan Biggar (Toulon). 3-7." },
    { minute: 23, type: "PENALITE", isUsap: false, description: "Pénalité de Dan Biggar (Toulon). 6-7." },
    { minute: 27, type: "ESSAI", isUsap: false, description: "Essai de Dan Biggar (Toulon). 11-7." },
    { minute: 28, type: "TRANSFORMATION", isUsap: false, description: "Transformation (Toulon). 13-7." },
    { minute: 33, type: "ESSAI", isUsap: false, description: "Essai de Dan Biggar (Toulon). Doublé ! 18-7." },
    { minute: 34, type: "TRANSFORMATION", isUsap: false, description: "Transformation (Toulon). 20-7." },
    { minute: 38, type: "CARTON_ROUGE", playerLastName: "Fa'asalele", isUsap: true, description: "Carton rouge Piula Fa'asalele (USAP). Plaquage dangereux." },
    // === MI-TEMPS : Toulon 20 - 7 USAP ===
    // === 2e MI-TEMPS ===
    { minute: 46, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 20-10." },
    { minute: 51, type: "ESSAI", isUsap: false, description: "Essai de Marius Domon (Toulon). 25-10." },
    { minute: 52, type: "TRANSFORMATION", isUsap: false, description: "Transformation (Toulon). 27-10." },
    { minute: 62, type: "CARTON_JAUNE", playerLastName: "Fakatika", isUsap: true, description: "Carton jaune Akato Fakatika (USAP)." },
    { minute: 66, type: "ESSAI", isUsap: false, description: "Essai de Baptiste Serin (Toulon). 32-10." },
    { minute: 73, type: "ESSAI", playerLastName: "Montgaillard", isUsap: true, description: "Essai de Victor Montgaillard (USAP). 32-15." },
    { minute: 80, type: "ESSAI", isUsap: false, description: "Essai d'Ihaia West (Toulon). 37-15." },
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
  console.log("  Score : Toulon 37 - 15 USAP (extérieur)");
  console.log("  Mi-temps : 20-7");
  console.log("  Arbitre : Jérémy Rozier");
  console.log("  Sawailau 5 pts (1E), Tedder 5 pts (1T + 1P), Montgaillard 5 pts (1E)");
  console.log("  Toulon : Biggar 2E+2P, Domon 1E, Serin 1E, West 1E");
  console.log("  CR : Fa'asalele (38' USAP), CJ : Fakatika (62' USAP)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

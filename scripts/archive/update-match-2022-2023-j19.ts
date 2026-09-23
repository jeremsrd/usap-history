/**
 * Mise à jour du match UBB - USAP (J19 Top 14, 25/02/2023)
 * Score : UBB 43 - USAP 7
 *
 * Lourde défaite à Chaban-Delmas. L'USAP aligne une équipe remaniée.
 * Holmes P (5', 3-0). Cordero E (12', T Holmes, 10-0).
 * CJ Moreaux (12'). Vergnes Taillefer E (18', T Holmes, 17-0).
 * Tameifuna E (25', T Gimbert, 24-0). Diaby E (33', T Holmes, 31-0).
 * Mi-temps : 31-0.
 * Laborde E (63', T Perez, 31-7).
 * Cordero E (70', 36-7). Cordero E (78', T Holmes, 43-7).
 *
 * Essai USAP : Laborde (63')
 * Transformation USAP : Perez (64')
 * Essais UBB : Cordero (12', 70', 78'), Vergnes Taillefer (18'), Tameifuna (25'), Diaby (33')
 * Transformations UBB : Holmes (13', 19', 34', 79'), Gimbert (26')
 * Pénalité UBB : Holmes (5')
 * CJ : Moreaux (12', USAP)
 *
 * Sources : allrugby.com, itsrugby.fr, francebleu.fr, ubbrugby.com, top14.lnr.fr
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j19.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 2, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 3, firstName: "Maafu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 49, subOut: 49 },
  { num: 4, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 49, subOut: 49, yellowCard: true, yellowCardMin: 12 },
  { num: 6, firstName: "Taniela", lastName: "Ramasibana", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 49, subOut: 49 },
  { num: 7, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 9, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 69, subOut: 69 },
  { num: 10, firstName: "Alexandre", lastName: "Perez", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Patricio", lastName: "Fernandez", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Dorian", lastName: "Laborde", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Eddie", lastName: "Sawailau", position: Position.AILIER, isStarter: true, minutesPlayed: 66, subOut: 66 },
  { num: 15, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 18, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 31, subIn: 49 },
  { num: 19, firstName: "Valentin", lastName: "Moro", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 20, firstName: "Lucas", lastName: "Velarte", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 31, subIn: 49 },
  { num: 21, firstName: "Lenny", lastName: "Viola", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 11, subIn: 69 },
  { num: 22, firstName: "Keanu", lastName: "Desrues", position: Position.ARRIERE, isStarter: false, minutesPlayed: 14, subIn: 66 },
  { num: 23, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 31, subIn: 49 },
];

// === COMPOSITION UBB (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Jefferson Poirot", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Maxime Lamothe", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Ben Tameifuna", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Thomas Jolmès", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Alban Roussel", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Mahamadou Diaby", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Antoine Miquel", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Bastien Vergnes Taillefer", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Jules Gimbert", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Zack Holmes", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Santiago Cordero", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Tani Vili", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Nicolas Depoortère", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Louis Bielle-Biarrey", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Nans Ducuing", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Clément Maynadier", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Lekso Kaulashvili", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Jandré Marais", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Tom Willis", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Maxime Lucu", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Matéo Garcia", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Pablo Uberti", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Vadim Cobilas", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match UBB - USAP (J19, 25/02/2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 19, competition: { shortName: "Top 14" } },
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
      halfTimeUsap: 0,
      halfTimeOpponent: 31,
      // USAP : 1E + 1T = 5+2 = 7
      triesUsap: 1, conversionsUsap: 1, penaltiesUsap: 0, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // UBB : 6E + 5T + 1P = 30+10+3 = 43
      triesOpponent: 6, conversionsOpponent: 5, penaltiesOpponent: 1, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Humiliation à Chaban-Delmas. L'USAP, qui aligne une équipe très remaniée, " +
        "est submergée dès l'entame. Holmes ouvre au pied (P 5', 3-0). " +
        "Cordero inscrit le 1er essai (12', T Holmes, 10-0). CJ Moreaux (12'). " +
        "Vergnes Taillefer (18', T Holmes, 17-0), Tameifuna (25', T Gimbert, 24-0) " +
        "et Diaby (33', T Holmes, 31-0) achèvent la 1ère mi-temps. Mi-temps : 31-0. " +
        "Laborde sauve l'honneur en 2e période (63', T Perez, 31-7). " +
        "Cordero signe un triplé (70', 78') pour le score final de 43-7.",
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

    // Laborde : 1E (63') = 5 pts
    if (p.lastName === "Laborde") { tries = 1; totalPoints = 5; }
    // Perez : 1T (64') = 2 pts
    if (p.lastName === "Perez") { conversions = 1; totalPoints = 2; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard, yellowCardMin, redCard: false, redCardMin: null,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const cards = yellowCard ? `CJ(${yellowCardMin}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", cards, isCaptain ? "(C)" : "", sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // Composition UBB
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
    { minute: 5, type: "PENALITE", isUsap: false, description: "Pénalité de Zack Holmes (UBB). 3-0." },
    { minute: 12, type: "ESSAI", isUsap: false, description: "Essai de Santiago Cordero (UBB). 8-0." },
    { minute: 12, type: "CARTON_JAUNE", playerLastName: "Moreaux", isUsap: true, description: "Carton jaune Victor Moreaux (USAP)." },
    { minute: 13, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Zack Holmes (UBB). 10-0." },
    { minute: 18, type: "ESSAI", isUsap: false, description: "Essai de Bastien Vergnes Taillefer (UBB). 15-0." },
    { minute: 19, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Zack Holmes (UBB). 17-0." },
    { minute: 25, type: "ESSAI", isUsap: false, description: "Essai de Ben Tameifuna (UBB). 22-0." },
    { minute: 26, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Jules Gimbert (UBB). 24-0." },
    { minute: 33, type: "ESSAI", isUsap: false, description: "Essai de Mahamadou Diaby (UBB). 29-0." },
    { minute: 34, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Zack Holmes (UBB). 31-0." },
    // === MI-TEMPS : UBB 31 - 0 USAP ===
    // === 2e MI-TEMPS ===
    { minute: 63, type: "ESSAI", playerLastName: "Laborde", isUsap: true, description: "Essai de Dorian Laborde (USAP). 31-5." },
    { minute: 64, type: "TRANSFORMATION", playerLastName: "Perez", isUsap: true, description: "Transformation d'Alexandre Perez (USAP). 31-7." },
    { minute: 70, type: "ESSAI", isUsap: false, description: "Essai de Santiago Cordero (UBB). Doublé ! 36-7." },
    { minute: 78, type: "ESSAI", isUsap: false, description: "Essai de Santiago Cordero (UBB). Triplé ! 41-7." },
    { minute: 79, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Zack Holmes (UBB). 43-7." },
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
  console.log("  Score : UBB 43 - 7 USAP (extérieur)");
  console.log("  Mi-temps : 31-0");
  console.log("  Arbitre : Thomas Charabas");
  console.log("  Laborde 5 pts (1E), Perez 2 pts (1T)");
  console.log("  UBB : Cordero 3E (triplé), Vergnes Taillefer 1E, Tameifuna 1E, Diaby 1E");
  console.log("  Holmes 4T+1P, Gimbert 1T");
  console.log("  CJ : Moreaux (12' USAP)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

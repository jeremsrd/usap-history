/**
 * Mise à jour du match Montpellier - USAP (J13 Top 14, 23/12/2022)
 * Score : Montpellier 38 - USAP 10
 *
 * Lourde défaite au GGL Stadium. L'USAP est dépassée d'entrée :
 * Carbonel aligne 2P (7', 10', 6-0) puis Coly E (20', T Carbonel, 13-0).
 * CJ Bridge (9'). 2 nouvelles P Carbonel (30', 39'). Mi-temps : 19-0.
 * McIntyre P (41', 19-3). Carbonel E (49', T par ses soins, 26-3).
 * McIntyre E de l'honneur USAP (54', T McIntyre, 26-10).
 * CJ Bécognée (63'). Garbisi E (65', non transformé, 31-10).
 * Bridge E (75', T Garbisi, 38-10). CJ Garbisi (77').
 *
 * Essai USAP : McIntyre (54')
 * Transformation USAP : McIntyre (55')
 * Pénalité USAP : McIntyre (41')
 * Essais Montpellier : Coly (20'), Carbonel (49'), Garbisi (65'), Bridge (75')
 * Transformations Montpellier : Carbonel ×2 (20', 49'), Garbisi (75')
 * Pénalités Montpellier : Carbonel ×4 (7', 10', 30', 39')
 * CJ : Bridge (9', MHR), Bécognée (63', MHR), Garbisi (77', MHR)
 *
 * Sources : allrugby.com (fiche match, stats joueurs), top14.lnr.fr (feuille de match),
 *   lnr.fr (vidéos essais Carbonel / McIntyre), francebleu.fr, wikipedia
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j13.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 3, firstName: "Siosiua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 4, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 6, firstName: "Brad", lastName: "Shields", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 7, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, isCaptain: true, minutesPlayed: 68, subOut: 68 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "George", lastName: "Tilsley", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tristan", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 26, subIn: 54 },
  { num: 19, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 26, subIn: 54 },
  { num: 20, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 26, subIn: 54 },
  { num: 21, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 22, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: false, minutesPlayed: 12, subIn: 68 },
  { num: 23, firstName: "Maafu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 29, subIn: 51 },
];

// === COMPOSITION MONTPELLIER (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Enzo Forletta", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Curtis Langdon", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Mohamed Haouas", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Bastien Chalureau", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Paul Willemse", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Yacouba Camara", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Alexandre Bécognée", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Zach Mercer", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Léo Coly", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Louis Carbonel", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "George Bridge", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Paolo Garbisi", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Pierre Lucas", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Julien Tisseron", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Anthony Bouthier", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Brandon Paenga-Amosa", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Simon-Pierre Chauvac", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Marco Tauleigne", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 19, name: "Clément Doumenc", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Gela Aprasidze", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Vincent Rattez", position: Position.AILIER, isStarter: false },
  { num: 22, name: "Thomas Darmon", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 23, name: "Titi Lamositele", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match Montpellier - USAP (J13, 23/12/2022) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 13, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Sébastien", "Minéry");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "18:45",
      refereeId,
      halfTimeUsap: 0,
      halfTimeOpponent: 19,
      videoUrl: null,
      // USAP : 1E + 1T + 1P = 5+2+3 = 10
      triesUsap: 1, conversionsUsap: 1, penaltiesUsap: 1, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Montpellier : 4E + 3T + 4P = 20+6+12 = 38
      triesOpponent: 4, conversionsOpponent: 3, penaltiesOpponent: 4, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Lourde défaite au GGL Stadium. L'USAP est dépassée d'entrée : Carbonel aligne " +
        "2P (7', 10', 6-0) avant l'essai de Coly (20', T Carbonel, 13-0). CJ Bridge (9'). " +
        "2 nouvelles P Carbonel (30', 39'). Mi-temps : 19-0. McIntyre réduit l'écart sur " +
        "pénalité (41', 19-3). Carbonel inscrit un essai personnel (49', T par ses soins, 26-3). " +
        "McIntyre marque l'essai de l'honneur pour l'USAP (54', T McIntyre, 26-10). " +
        "CJ Bécognée (63'). Garbisi enfonce le clou (E 65', non transformé, 31-10) puis " +
        "Bridge scelle le score (75', T Garbisi, 38-10). CJ Garbisi (77'). " +
        "Trois cartons jaunes montpelliérains mais cela ne suffit pas à l'USAP.",
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

    // McIntyre : 1E (54') + 1T (55') + 1P (41') = 5+2+3 = 10 pts
    if (p.lastName === "McIntyre") { tries = 1; conversions = 1; penalties = 1; totalPoints = 10; }

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

  // Composition Montpellier
  console.log("\n--- Composition Montpellier Hérault Rugby ---");
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
    { minute: 7, type: "PENALITE", isUsap: false, description: "Pénalité de Louis Carbonel (Montpellier). 3-0." },
    { minute: 9, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune George Bridge (Montpellier)." },
    { minute: 10, type: "PENALITE", isUsap: false, description: "Pénalité de Louis Carbonel (Montpellier). 6-0." },
    { minute: 20, type: "ESSAI", isUsap: false, description: "Essai de Léo Coly (Montpellier). 11-0." },
    { minute: 20, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Louis Carbonel (Montpellier). 13-0." },
    { minute: 30, type: "PENALITE", isUsap: false, description: "Pénalité de Louis Carbonel (Montpellier). 16-0." },
    { minute: 39, type: "PENALITE", isUsap: false, description: "Pénalité de Louis Carbonel (Montpellier). 19-0." },
    // === MI-TEMPS : Montpellier 19 - 0 USAP ===
    // === 2e MI-TEMPS ===
    { minute: 41, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 19-3." },
    { minute: 49, type: "ESSAI", isUsap: false, description: "Essai de Louis Carbonel (Montpellier). 24-3." },
    { minute: 49, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Louis Carbonel (Montpellier). 26-3." },
    { minute: 54, type: "ESSAI", playerLastName: "McIntyre", isUsap: true, description: "Essai de Jake McIntyre (USAP). Essai de l'honneur. 26-8." },
    { minute: 55, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 26-10." },
    { minute: 63, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Alexandre Bécognée (Montpellier)." },
    { minute: 65, type: "ESSAI", isUsap: false, description: "Essai de Paolo Garbisi (Montpellier). Non transformé. 31-10." },
    { minute: 75, type: "ESSAI", isUsap: false, description: "Essai de George Bridge (Montpellier). 36-10." },
    { minute: 75, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Paolo Garbisi (Montpellier). 38-10." },
    { minute: 77, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Paolo Garbisi (Montpellier)." },
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
  console.log("  Score : Montpellier 38 - 10 USAP (extérieur)");
  console.log("  Mi-temps : Montpellier 19 - 0 USAP");
  console.log("  Arbitre : Sébastien Minéry");
  console.log("  McIntyre 10 pts (1E + 1T + 1P)");
  console.log("  MHR : Carbonel 4P+1E+2T, Coly 1E, Garbisi 1E+1T, Bridge 1E");
  console.log("  CJ : Bridge (9' MHR), Bécognée (63' MHR), Garbisi (77' MHR)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

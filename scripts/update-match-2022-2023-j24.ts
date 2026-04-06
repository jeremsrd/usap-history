/**
 * Mise à jour du match Lyon OU - USAP (J24 Top 14, 06/05/2023)
 * Score : Lyon 41 - 31 USAP
 *
 * Match spectaculaire au Matmut Stadium. L'USAP aligne une équipe remaniée.
 * Laborde P (4', 0-3). Berdeu P Lyon (4', 3-3). Godwin E Lyon (7', T Berdeu, 10-3).
 * Marchand E Lyon (11', T Berdeu, 17-3). Brazo E (16', T Laborde, 17-10).
 * Berdeu P Lyon (24', 20-10). CJ Saginadze (30').
 * Saginadze E Lyon (30', T Doussain, 27-10). Laborde P (37', 27-13).
 * Mi-temps : 24-16.
 * Laborde P (41', 24-19). Laborde P (44', 24-22). Rodor E (45', 24-27).
 * CJ Botha (51'). CJ Lotrian (60'). CJ Allen (61').
 * Séguéla E (67', T Laborde, 27-31). Couilloud E Lyon (77', T Doussain, 34-31).
 * CJ Labouteley (79'). Gomez Kodela E Lyon (79', T Doussain, 41-31).
 * CJ Guillard (80').
 *
 * Essais USAP : Brazo (16'), Rodor (45'), Séguéla (67')
 * Transformations USAP : Laborde (17', 68')
 * Pénalités USAP : Laborde (4', 37', 41', 44')
 * Essais Lyon : Godwin (7'), Marchand (11'), Saginadze (30'), Couilloud (77'), Gomez Kodela (79')
 * Transformations Lyon : Berdeu (9', 13'), Doussain (32', 78', 80')
 * Pénalités Lyon : Berdeu (4', 24')
 *
 * Sources : allrugby.com, lyonmag.com, top14.lnr.fr, dailymotion.com
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j24.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 60, subOut: 60, yellowCard: true, yellowCardMin: 60 },
  { num: 2, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 3, firstName: "Maafu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 4, firstName: "Taniela", lastName: "Ramasibana", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Andreï", lastName: "Mahu", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 80 },
  { num: 10, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Dorian", lastName: "Laborde", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "George", lastName: "Tilsley", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Nino", lastName: "Séguéla", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 18, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 19, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 25, subIn: 55, yellowCard: true, yellowCardMin: 79 },
  { num: 20, firstName: "Valentin", lastName: "Moro", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 0 },
  { num: 21, firstName: "Alexandre", lastName: "Perez", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 0 },
  { num: 22, firstName: "Eddie", lastName: "Sawailau", position: Position.CENTRE, isStarter: false, minutesPlayed: 0 },
  { num: 23, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
];

// === COMPOSITION LYON OU (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Sébastien Taofifenua", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Guillaume Marchand", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Demba Bamba", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Killian Géraci", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Romain Taofifenua", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Dylan Cretin", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Beka Saginadze", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Arno Botha", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Baptiste Couilloud", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Léo Berdeu", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Ethan Dumortier", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Josua Tuisova", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Kyle Godwin", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Tavite Veredamu", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Toby Arnold", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Yanis Charcosset", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Feao Fotuaika", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Félix Lambey", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Liam Allen", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Jean-Marc Doussain", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Thibaut Regard", position: Position.CENTRE, isStarter: false },
  { num: 22, name: "Mickaël Guillard", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 23, name: "Francisco Gomez Kodela", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match Lyon OU - USAP (J24, 06/05/2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 24, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Pierre-Baptiste", "Nuchy");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      halfTimeUsap: 16,
      halfTimeOpponent: 24,
      videoUrl: "https://www.dailymotion.com/video/x8kqv54",
      // USAP : 3E + 2T + 4P = 15+4+12 = 31
      triesUsap: 3, conversionsUsap: 2, penaltiesUsap: 4, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Lyon : 5E + 5T + 2P = 25+10+6 = 41
      triesOpponent: 5, conversionsOpponent: 5, penaltiesOpponent: 2, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Match spectaculaire au Matmut Stadium avec une équipe USAP remaniée. " +
        "Lyon domine l'entame : Godwin (7', T Berdeu) et Marchand (11', T Berdeu) signent un 17-3. " +
        "Brazo réduit l'écart (16', T Laborde, 17-10). Berdeu P (24', 20-10). " +
        "Saginadze enfonce le clou avant la mi-temps (30', T Doussain, 27-10). " +
        "Mi-temps : 24-16 après les pénalités de Laborde. " +
        "L'USAP revient à 24-27 en début de 2e période grâce aux pénalités de Laborde " +
        "et l'essai de Rodor (45'). Séguéla donne même l'avantage (67', T Laborde, 27-31). " +
        "Mais Lyon finit en trombe : Couilloud sur interception (77') " +
        "et Gomez Kodela (79') scellent le 41-31. Match ponctué de nombreux cartons jaunes.",
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

    // Brazo : 1E (16') = 5 pts
    if (p.lastName === "Brazo") { tries = 1; totalPoints = 5; }
    // Rodor : 1E (45') = 5 pts
    if (p.lastName === "Rodor") { tries = 1; totalPoints = 5; }
    // Séguéla : 1E (67') = 5 pts
    if (p.lastName === "Séguéla") { tries = 1; totalPoints = 5; }
    // Laborde : 2T (17', 68') + 4P (4', 37', 41', 44') = 4+12 = 16 pts
    if (p.lastName === "Laborde") { conversions = 2; penalties = 4; totalPoints = 16; }

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

  // Composition Lyon
  console.log("\n--- Composition Lyon OU ---");
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
    { minute: 4, type: "PENALITE", playerLastName: "Laborde", isUsap: true, description: "Pénalité de Dorian Laborde (USAP). 0-3." },
    { minute: 4, type: "PENALITE", isUsap: false, description: "Pénalité de Léo Berdeu (Lyon). 3-3." },
    { minute: 7, type: "ESSAI", isUsap: false, description: "Essai de Kyle Godwin (Lyon). 8-3." },
    { minute: 9, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Léo Berdeu (Lyon). 10-3." },
    { minute: 11, type: "ESSAI", isUsap: false, description: "Essai de Guillaume Marchand (Lyon). 15-3." },
    { minute: 13, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Léo Berdeu (Lyon). 17-3." },
    { minute: 16, type: "ESSAI", playerLastName: "Brazo", isUsap: true, description: "Essai d'Alan Brazo (USAP). 17-8." },
    { minute: 17, type: "TRANSFORMATION", playerLastName: "Laborde", isUsap: true, description: "Transformation de Dorian Laborde (USAP). 17-10." },
    { minute: 24, type: "PENALITE", isUsap: false, description: "Pénalité de Léo Berdeu (Lyon). 20-10." },
    { minute: 30, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Beka Saginadze (Lyon)." },
    { minute: 30, type: "ESSAI", isUsap: false, description: "Essai de Beka Saginadze (Lyon). 25-10." },
    { minute: 32, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Jean-Marc Doussain (Lyon). 27-10." },
    { minute: 37, type: "PENALITE", playerLastName: "Laborde", isUsap: true, description: "Pénalité de Dorian Laborde (USAP). 27-13." },
    // Mi-temps approximative : Lyon 24 - 16 USAP
    // === 2e MI-TEMPS ===
    { minute: 41, type: "PENALITE", playerLastName: "Laborde", isUsap: true, description: "Pénalité de Dorian Laborde (USAP). 27-16." },
    { minute: 44, type: "PENALITE", playerLastName: "Laborde", isUsap: true, description: "Pénalité de Dorian Laborde (USAP). 27-19." },
    { minute: 45, type: "ESSAI", playerLastName: "Rodor", isUsap: true, description: "Essai de Matteo Rodor (USAP). 27-24." },
    { minute: 51, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Arno Botha (Lyon)." },
    { minute: 60, type: "CARTON_JAUNE", playerLastName: "Lotrian", isUsap: true, description: "Carton jaune Sacha Lotrian (USAP)." },
    { minute: 61, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Liam Allen (Lyon)." },
    { minute: 67, type: "ESSAI", playerLastName: "Séguéla", isUsap: true, description: "Essai de Nino Séguéla (USAP). 27-29." },
    { minute: 68, type: "TRANSFORMATION", playerLastName: "Laborde", isUsap: true, description: "Transformation de Dorian Laborde (USAP). 27-31." },
    { minute: 77, type: "ESSAI", isUsap: false, description: "Essai de Baptiste Couilloud (Lyon). Interception à 60m ! 32-31." },
    { minute: 78, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Jean-Marc Doussain (Lyon). 34-31." },
    { minute: 79, type: "CARTON_JAUNE", playerLastName: "Labouteley", isUsap: true, description: "Carton jaune Tristan Labouteley (USAP)." },
    { minute: 79, type: "ESSAI", isUsap: false, description: "Essai de Francisco Gomez Kodela (Lyon). 39-31." },
    { minute: 80, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Jean-Marc Doussain (Lyon). 41-31." },
    { minute: 80, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Mickaël Guillard (Lyon)." },
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
    const side = evt.isUsap ? "USAP" : "LOU";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Lyon 41 - 31 USAP (extérieur)");
  console.log("  Mi-temps : 24-16");
  console.log("  Arbitre : Pierre-Baptiste Nuchy");
  console.log("  Brazo 5 pts (1E), Rodor 5 pts (1E), Séguéla 5 pts (1E), Laborde 16 pts (2T + 4P)");
  console.log("  Lyon : Godwin 1E, Marchand 1E, Saginadze 1E, Couilloud 1E, Gomez Kodela 1E");
  console.log("  CJ : Saginadze (30' Lyon), Botha (51' Lyon), Lotrian (60' USAP)");
  console.log("  CJ : Allen (61' Lyon), Labouteley (79' USAP), Guillard (80' Lyon)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

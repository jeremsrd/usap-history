/**
 * Mise à jour du match USAP - Lyon (J21 Top 14, 20/04/2024)
 * Score : USAP 51 - 20 Lyon
 *
 * Festival à Aimé-Giral ! 7 essais pour l'USAP malgré un début
 * difficile (Lyon ouvre le score par Ioane dès la 2e minute).
 * McIntyre dirige le jeu à la perfection (19 pts).
 * L'USAP déroule complètement en 2e MT (31 points).
 *
 * Essais USAP : Veredamu (9'), McIntyre (17'), Ecochard (46'),
 *   Tuilagi (62'), Ceccarelli (68'), Deghmache (74'), Dubois (77')
 * Essais Lyon : Ioane (2'), Couilloud (8'), Maraku (57')
 * CJ : Rey (45', Lyon)
 *
 * Sources : top14.lnr.fr (compositions), itsrugby.fr (marqueurs),
 *   allrugby.com (arbitre Adrien Descottes), francebleu.fr (résumé)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j21.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 3, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 56, subOut: 56 },
  { num: 4, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 65, subOut: 65 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, isCaptain: true, minutesPlayed: 67, subOut: 67 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Louis", lastName: "Dupichot", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 19, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 20, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 0 },
  { num: 21, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 15, subIn: 65 },
  { num: 22, firstName: "Apisai", lastName: "Naqalevu", position: Position.CENTRE, isStarter: false, minutesPlayed: 13, subIn: 67 },
  { num: 23, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 24, subIn: 56 },
];

// === COMPOSITION LYON (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Jérôme Rey", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Liam Coltman", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Feao Fotuaika", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Félix Lambey", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Romain Taofifénua", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Mickaël Guillard", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Beka Saginadze", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Arno Botha", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Baptiste Couilloud", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Léo Berdeu", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Monty Ioane", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Josiah Maraku", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Alfred Parisien", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Vincent Rattez", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Davit Niniashvili", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Yanis Charcosset", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Vivien Devisme", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Joel Kpoku", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Maxime Gouzou", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Martin Page-Relo", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Paddy Jackson", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Kyle Godwin", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Demba Bamba", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Lyon (J21, 20/04/2024) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2023, endYear: 2024 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 21, competition: { shortName: "Top 14" } },
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
      halfTimeUsap: 20,
      halfTimeOpponent: 13,
      // USAP : 7E + 5T + 2P = 35+10+6 = 51
      triesUsap: 7, conversionsUsap: 5, penaltiesUsap: 2, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Lyon : 3E + 1T + 1P = 15+2+3 = 20
      triesOpponent: 3, conversionsOpponent: 1, penaltiesOpponent: 1, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      bonusOffensif: true, bonusDefensif: false,
      report:
        "Festival à Aimé-Giral ! Lyon ouvre le score par Ioane dès la 2e minute (0-5) " +
        "puis Couilloud ajoute un essai (7-10). Mais l'USAP réagit par Veredamu (9') " +
        "et McIntyre (17') pour reprendre les commandes. 20-13 à la pause. " +
        "En 2e MT, l'USAP déroule : Ecochard (46'), Tuilagi (62'), Ceccarelli (68'), " +
        "Deghmache (74') et Dubois (77') inscrivent 5 essais supplémentaires ! " +
        "McIntyre parfait maître du jeu avec 19 pts (1E, 4T, 2P). " +
        "CJ Rey (45', Lyon). Score final : 51-20, plus large victoire de la saison.",
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

    if (p.lastName === "Veredamu") { tries = 1; totalPoints = 5; }
    if (p.lastName === "McIntyre") { tries = 1; conversions = 5; penalties = 2; totalPoints = 19; }
    if (p.lastName === "Ecochard") { tries = 1; totalPoints = 5; }
    if (p.lastName === "Tuilagi") { tries = 1; totalPoints = 5; }
    if (p.lastName === "Ceccarelli") { tries = 1; totalPoints = 5; }
    if (p.lastName === "Deghmache" && p.num === 21) { tries = 1; totalPoints = 5; }
    if (p.lastName === "Dubois") { tries = 1; totalPoints = 5; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", isCaptain ? "(C)" : "", sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // Composition Lyon
  console.log("\n--- Composition Lyon ---");
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
    { minute: 2, type: "ESSAI", isUsap: false, description: "Essai de Monty Ioane (Lyon). Entrée en matière éclair. 0-5." },
    { minute: 8, type: "ESSAI", isUsap: false, description: "Essai de Baptiste Couilloud (Lyon). 0-10." },
    { minute: 9, type: "ESSAI", playerLastName: "Veredamu", isUsap: true, description: "Essai de Tavite Veredamu (USAP). Réponse immédiate. 5-10." },
    { minute: 10, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 7-10." },
    { minute: 17, type: "ESSAI", playerLastName: "McIntyre", isUsap: true, description: "Essai de Jake McIntyre (USAP). 12-10." },
    { minute: 18, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 14-10." },
    { minute: 25, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 17-10." },
    { minute: 30, type: "PENALITE", isUsap: false, description: "Pénalité de Léo Berdeu (Lyon). 17-13." },
    { minute: 37, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 20-13." },
    // === MI-TEMPS : USAP 20 - 13 Lyon ===
    { minute: 45, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Jérôme Rey (Lyon). Lyon à 14." },
    { minute: 46, type: "ESSAI", playerLastName: "Ecochard", isUsap: true, description: "Essai de Tom Ecochard (USAP). 25-13." },
    { minute: 47, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 27-13." },
    { minute: 57, type: "ESSAI", isUsap: false, description: "Essai de Josiah Maraku (Lyon). 27-18." },
    { minute: 58, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Léo Berdeu (Lyon). 27-20." },
    { minute: 62, type: "ESSAI", playerLastName: "Tuilagi", isUsap: true, description: "Essai de Posolo Tuilagi (USAP). 32-20." },
    { minute: 68, type: "ESSAI", playerLastName: "Ceccarelli", isUsap: true, description: "Essai de Pietro Ceccarelli (USAP). Le pilier à l'essai ! 37-20." },
    { minute: 69, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 39-20." },
    { minute: 74, type: "ESSAI", playerLastName: "Deghmache", isUsap: true, description: "Essai de Sadek Deghmache (USAP). 44-20." },
    { minute: 77, type: "ESSAI", playerLastName: "Dubois", isUsap: true, description: "Essai de Lucas Dubois (USAP). 7e essai ! 49-20." },
    { minute: 78, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 51-20. Score final." },
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
  console.log("  Score : USAP 51 - 20 Lyon (domicile)");
  console.log("  Mi-temps : USAP 20 - 13 Lyon");
  console.log("  7 essais USAP — Bonus offensif");
  console.log("  McIntyre : 1E + 5T + 2P = 19 pts");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

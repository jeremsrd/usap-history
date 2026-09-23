/**
 * Mise à jour du match USAP - Montpellier HR (J21 Top 14, 25/03/2023)
 * Score : USAP 22 - 23 Montpellier
 *
 * Défaite cruelle à domicile. L'USAP mène 22-10 avant de s'effondrer.
 * Joly E (6', 5-0). Garbisi P MHR (11', 5-3). Tedder P (13', 8-3).
 * Mi-temps : 8-3.
 * Oviedo E (41', T Tedder, 15-3). Reinach E MHR (46', T Garbisi, 15-10).
 * Mamea Lemalu E (49', T Tedder, 22-10). Garbisi P MHR (53', 22-13).
 * Coly E MHR (71', T Garbisi, 22-20). Garbisi P MHR (77', 22-23).
 *
 * Essais USAP : Joly (6'), Oviedo (41'), Mamea Lemalu (49')
 * Transformations USAP : Tedder (43', 50')
 * Pénalité USAP : Tedder (13')
 * Essais MHR : Reinach (46'), Coly (71')
 * Transformations MHR : Garbisi (47', 72')
 * Pénalités MHR : Garbisi (11', 53', 77')
 *
 * Note : match à domicile (Aimé-Giral), corrige isHome dans la BDD.
 *
 * Sources : allrugby.com, all.rugby, espn.com, francebleu.fr, top14.lnr.fr
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j21.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 6, firstName: "Brad", lastName: "Shields", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Joaquín", lastName: "Oviedo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 65, subOut: 65 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Ali", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tristan", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 17, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 18, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 19, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 20, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 0 },
  { num: 21, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 15, subIn: 65 },
  { num: 22, firstName: "Eddie", lastName: "Sawailau", position: Position.CENTRE, isStarter: false, minutesPlayed: 0 },
  { num: 23, firstName: "Maafu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
];

// === COMPOSITION MONTPELLIER HR (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Grégory Fichten", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Vincent Giudicelli", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Titi Lamositele", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Bastien Chalureau", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Tyler Duguid", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Nicolaas Janse van Rensburg", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Masivesi Dakuwaqa", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Zach Mercer", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Cobus Reinach", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Paolo Garbisi", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "George Bridge", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Jan Serfontein", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Thomas Darmon", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Vincent Rattez", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Anthony Bouthier", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Brandon Paenga-Amosa", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Enzo Forletta", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Elliott Stooke", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Lenni Nouchi", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Léo Coly", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Pierre Lucas", position: Position.CENTRE, isStarter: false },
  { num: 22, name: "Louis Carbonel", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 23, name: "Henry Thomas", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Montpellier HR (J21, 25/03/2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 21, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Pierre", "Brousset");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      isHome: true, // Correction : match à Aimé-Giral, pas à Montpellier
      halfTimeUsap: 8,
      halfTimeOpponent: 3,
      // USAP : 3E + 2T + 1P = 15+4+3 = 22
      triesUsap: 3, conversionsUsap: 2, penaltiesUsap: 1, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // MHR : 2E + 2T + 3P = 10+4+9 = 23
      triesOpponent: 2, conversionsOpponent: 2, penaltiesOpponent: 3, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Défaite cruelle à domicile. L'USAP mène longtemps avant de craquer en fin de match. " +
        "Joly ouvre le score par un essai (6', 5-0, T manquée). Garbisi P MHR (11', 5-3). " +
        "Tedder P (13', 8-3). Mi-temps : 8-3. " +
        "L'USAP accélère en 2e période : Oviedo E (41', T Tedder, 15-3), " +
        "Mamea Lemalu E (49', T Tedder, 22-10). L'USAP semble avoir fait le plus dur. " +
        "Mais Montpellier revient : Reinach E (46', T Garbisi, 15-10), " +
        "Garbisi P (53', 22-13), Coly E (71', T Garbisi, 22-20). " +
        "Garbisi arrache la victoire sur une pénalité à la 77e (22-23). " +
        "Défaite terrible pour l'USAP qui s'écroule après avoir mené 22-10.",
    },
  });
  console.log("  Match mis à jour (isHome corrigé à true)");

  // Composition USAP
  console.log("\n--- Composition USAP ---");
  const deleted = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);
    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;
    const isCaptain = (p as any).isCaptain ?? false;

    // Joly : 1E (6') = 5 pts
    if (p.lastName === "Joly") { tries = 1; totalPoints = 5; }
    // Oviedo : 1E (41') = 5 pts
    if (p.lastName === "Oviedo") { tries = 1; totalPoints = 5; }
    // Mamea Lemalu : 1E (49') = 5 pts
    if (p.lastName === "Mamea Lemalu") { tries = 1; totalPoints = 5; }
    // Tedder : 2T (43', 50') + 1P (13') = 4+3 = 7 pts
    if (p.lastName === "Tedder") { conversions = 2; penalties = 1; totalPoints = 7; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard: false, yellowCardMin: null, redCard: false, redCardMin: null,
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
  console.log("\n--- Composition Montpellier HR ---");
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
    { minute: 6, type: "ESSAI", playerLastName: "Joly", isUsap: true, description: "Essai d'Arthur Joly (USAP). 5-0." },
    { minute: 11, type: "PENALITE", isUsap: false, description: "Pénalité de Paolo Garbisi (Montpellier). 5-3." },
    { minute: 13, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 8-3." },
    // === MI-TEMPS : USAP 8 - 3 Montpellier ===
    // === 2e MI-TEMPS ===
    { minute: 41, type: "ESSAI", playerLastName: "Oviedo", isUsap: true, description: "Essai de Joaquín Oviedo (USAP). 13-3." },
    { minute: 43, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 15-3." },
    { minute: 46, type: "ESSAI", isUsap: false, description: "Essai de Cobus Reinach (Montpellier). 15-8." },
    { minute: 47, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Paolo Garbisi (Montpellier). 15-10." },
    { minute: 49, type: "ESSAI", playerLastName: "Mamea Lemalu", isUsap: true, description: "Essai de Genesis Mamea Lemalu (USAP). 20-10." },
    { minute: 50, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 22-10." },
    { minute: 53, type: "PENALITE", isUsap: false, description: "Pénalité de Paolo Garbisi (Montpellier). 22-13." },
    { minute: 71, type: "ESSAI", isUsap: false, description: "Essai de Léo Coly (Montpellier). 22-18." },
    { minute: 72, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Paolo Garbisi (Montpellier). 22-20." },
    { minute: 77, type: "PENALITE", isUsap: false, description: "Pénalité de Paolo Garbisi (Montpellier). 22-23. Montpellier passe devant !" },
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
  console.log("  Score : USAP 22 - 23 Montpellier (domicile, Aimé-Giral)");
  console.log("  Mi-temps : 8-3");
  console.log("  Arbitre : Pierre Brousset");
  console.log("  Joly 5 pts (1E), Oviedo 5 pts (1E), Mamea Lemalu 5 pts (1E), Tedder 7 pts (2T + 1P)");
  console.log("  MHR : Reinach 1E, Coly 1E, Garbisi 2T+3P");
  console.log("  Note : isHome corrigé de false à true");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

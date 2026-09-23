/**
 * Mise à jour du match USAP - Section Paloise (J18 Top 14, 18/02/2023)
 * Score : USAP 49 - 29 Section Paloise
 *
 * Festival offensif à Aimé-Giral ! L'USAP inscrit 6 essais pour une victoire bonifiée.
 * McIntyre P (5', 3-0). Tedder E (9', T McIntyre, 10-0).
 * Maddocks E Pau (12', T Henry, 10-7). Deghmache E (18', T McIntyre, 17-7).
 * Henry P (25', 17-10). McIntyre P (30', 20-10).
 * De la Fuente E (36', T McIntyre, 27-10). McIntyre P (39', 30-10).
 * Mi-temps : 30-10.
 * Laporte E Pau (41', 30-15). Tedder E (44', T McIntyre, 37-15).
 * CJ Zegueur (49'). Sawailau E (58', 42-15).
 * Auradou E Pau (65', T Henry, 42-22). Colombet E Pau (68', T Henry, 42-29).
 * Dubois E (81', 47-29). McIntyre T (82', 49-29).
 *
 * Essais USAP : Tedder (9', 44'), Deghmache (18'), de la Fuente (36'), Sawailau (58'), Dubois (81')
 * Transformations USAP : McIntyre (10', 19', 37', 45', 82') — 5/6
 * Pénalités USAP : McIntyre (5', 30', 39')
 * Essais Pau : Maddocks (12'), Laporte (41'), Auradou (65'), Colombet (68')
 * Transformations Pau : Henry (13', 66', 69') — 3/4
 * Pénalité Pau : Henry (25')
 * CJ : Zegueur (49', Pau)
 *
 * Sources : allrugby.com, blog-rct.com, itsrugby.fr, top14.lnr.fr, francebleu.fr
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j18.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 6, firstName: "Brad", lastName: "Shields", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 40, subOut: 40 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Ali", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tristan", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, minutesPlayed: 57, subOut: 57 },
  // Remplaçants
  { num: 16, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 28, subIn: 52 },
  { num: 18, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 19, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 20, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 40, subIn: 40 },
  { num: 21, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 22, firstName: "Eddie", lastName: "Sawailau", position: Position.AILIER, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 23, firstName: "Maafu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
];

// === COMPOSITION SECTION PALOISE (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Ignacio Calles", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Lucas Rey", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Siate Tokolahi", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Hugo Auradou", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Fabrice Metz", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Martin Puech", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Reece Hewat", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Jordan Joseph", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Thibault Daubagna", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Zack Henry", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Daniel Ikpefan", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Jale Vatubua", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Tumua Manu", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Clément Laporte", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Jack Maddocks", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Romain Ruffenach", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Rémi Sénéca", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Lekima Tagitagivalu", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Sacha Zegueur", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Dan Robson", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Émilien Gailleton", position: Position.CENTRE, isStarter: false },
  { num: 22, name: "Mathias Colombet", position: Position.ARRIERE, isStarter: false },
  { num: 23, name: "Nicolas Corato", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Section Paloise (J18, 18/02/2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 18, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Luc", "Ramos");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      halfTimeUsap: 30,
      halfTimeOpponent: 10,
      videoUrl: "https://www.youtube.com/watch?v=_MUgcQy9YdE",
      // USAP : 6E + 5T + 3P = 30+10+9 = 49
      triesUsap: 6, conversionsUsap: 5, penaltiesUsap: 3, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Pau : 4E + 3T + 1P = 20+6+3 = 29
      triesOpponent: 4, conversionsOpponent: 3, penaltiesOpponent: 1, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Festival offensif à Aimé-Giral ! McIntyre ouvre le score à la pénalité (5', 3-0). " +
        "Tedder inscrit le premier essai (9', T McIntyre, 10-0). Maddocks réduit l'écart pour Pau (12', T Henry, 10-7). " +
        "Deghmache relance l'USAP (18', T McIntyre, 17-7). Henry P (25', 17-10). McIntyre P (30', 20-10). " +
        "De la Fuente enfonce le clou (36', T McIntyre, 27-10). McIntyre P (39', 30-10). Mi-temps : 30-10. " +
        "Laporte marque pour Pau dès la reprise (41', 30-15). Tedder signe un doublé (44', T McIntyre, 37-15). " +
        "CJ Zegueur (49'). Sawailau, entré en jeu, inscrit le 5e essai (58', 42-15). " +
        "Pau réagit avec Auradou (65', T Henry, 42-22) et Colombet (68', T Henry, 42-29). " +
        "Dubois scelle le festival en fin de match (81', T McIntyre, 49-29). " +
        "Victoire bonifiée pour l'USAP avec 6 essais !",
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

    // Tedder : 2E (9', 44') = 10 pts
    if (p.lastName === "Tedder") { tries = 2; totalPoints = 10; }
    // Deghmache : 1E (18') = 5 pts
    if (p.lastName === "Deghmache") { tries = 1; totalPoints = 5; }
    // de la Fuente : 1E (36') = 5 pts
    if (p.lastName === "de la Fuente") { tries = 1; totalPoints = 5; }
    // Sawailau : 1E (58') = 5 pts
    if (p.lastName === "Sawailau") { tries = 1; totalPoints = 5; }
    // Dubois : 1E (81') = 5 pts
    if (p.lastName === "Dubois") { tries = 1; totalPoints = 5; }
    // McIntyre : 5T (10', 19', 37', 45', 82') + 3P (5', 30', 39') = 10+9 = 19 pts
    if (p.lastName === "McIntyre") { conversions = 5; penalties = 3; totalPoints = 19; }

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

  // Composition Section Paloise
  console.log("\n--- Composition Section Paloise ---");
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
    { minute: 5, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 3-0." },
    { minute: 9, type: "ESSAI", playerLastName: "Tedder", isUsap: true, description: "Essai de Tristan Tedder (USAP). 8-0." },
    { minute: 10, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 10-0." },
    { minute: 12, type: "ESSAI", isUsap: false, description: "Essai de Jack Maddocks (Pau). 10-5." },
    { minute: 13, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Zack Henry (Pau). 10-7." },
    { minute: 18, type: "ESSAI", playerLastName: "Deghmache", isUsap: true, description: "Essai de Sadek Deghmache (USAP). 15-7." },
    { minute: 19, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 17-7." },
    { minute: 25, type: "PENALITE", isUsap: false, description: "Pénalité de Zack Henry (Pau). 17-10." },
    { minute: 30, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 20-10." },
    { minute: 36, type: "ESSAI", playerLastName: "de la Fuente", isUsap: true, description: "Essai de Jerónimo de la Fuente (USAP). 25-10." },
    { minute: 37, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 27-10." },
    { minute: 39, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 30-10." },
    // === MI-TEMPS : USAP 30 - 10 Pau ===
    // === 2e MI-TEMPS ===
    { minute: 41, type: "ESSAI", isUsap: false, description: "Essai de Clément Laporte (Pau). 30-15." },
    { minute: 44, type: "ESSAI", playerLastName: "Tedder", isUsap: true, description: "Essai de Tristan Tedder (USAP). Doublé ! 35-15." },
    { minute: 45, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 37-15." },
    { minute: 49, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Sacha Zegueur (Pau)." },
    { minute: 58, type: "ESSAI", playerLastName: "Sawailau", isUsap: true, description: "Essai d'Eddie Sawailau (USAP). 42-15." },
    { minute: 65, type: "ESSAI", isUsap: false, description: "Essai de Hugo Auradou (Pau). 42-20." },
    { minute: 66, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Zack Henry (Pau). 42-22." },
    { minute: 68, type: "ESSAI", isUsap: false, description: "Essai de Mathias Colombet (Pau). 42-27." },
    { minute: 69, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Zack Henry (Pau). 42-29." },
    { minute: 81, type: "ESSAI", playerLastName: "Dubois", isUsap: true, description: "Essai de Lucas Dubois (USAP). 47-29." },
    { minute: 82, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 49-29." },
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
    const side = evt.isUsap ? "USAP" : "PAU";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 49 - 29 Section Paloise (domicile)");
  console.log("  Mi-temps : 30-10");
  console.log("  Arbitre : Luc Ramos");
  console.log("  Tedder 10 pts (2E), Deghmache 5 pts (1E), de la Fuente 5 pts (1E)");
  console.log("  Sawailau 5 pts (1E), Dubois 5 pts (1E), McIntyre 19 pts (5T + 3P)");
  console.log("  Pau : Maddocks 1E, Laporte 1E, Auradou 1E, Colombet 1E, Henry 3T+1P");
  console.log("  CJ : Zegueur (49' Pau)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

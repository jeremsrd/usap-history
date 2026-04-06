/**
 * Mise à jour du match USAP - Stade Toulousain (J25 Top 14, 13/05/2023)
 * Score : USAP 26 - 21 Stade Toulousain
 *
 * Victoire cruciale pour le maintien ! Toulouse remanié (sans Dupont ni R. Ntamack).
 * Ramos P Toulouse (5', 0-3). Tedder P (9', 3-3).
 * McIntyre E (14', 8-3). Tedder T (15', 10-3).
 * Dubois E (20', 15-3). Tedder T (21', 17-3).
 * Lebel E Toulouse (30', 17-8). Ramos E Toulouse (34', T Ramos, 17-15).
 * Mi-temps : 17-15.
 * Ramos P Toulouse (46', 17-18). Tedder P (50', 20-18).
 * Ramos P Toulouse (54', 20-21). Tedder P (60', 23-21). Tedder P (64', 26-21).
 *
 * Essais USAP : McIntyre (14'), Dubois (20')
 * Transformations USAP : Tedder (15', 21')
 * Pénalités USAP : Tedder (9', 50', 60', 64')
 * Essais Toulouse : Lebel (30'), Ramos (34')
 * Transformation Toulouse : Ramos (35')
 * Pénalités Toulouse : Ramos (5', 46', 54')
 *
 * Sources : allrugby.com, itsrugby.fr, francebleu.fr, top14.lnr.fr, stadetoulousain.fr
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j25.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 6, firstName: "Brad", lastName: "Shields", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, isCaptain: true, minutesPlayed: 60, subOut: 60 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 76, subOut: 76 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "George", lastName: "Tilsley", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Dorian", lastName: "Laborde", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Eddie", lastName: "Sawailau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tristan", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 18, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 19, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 20, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 21, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 4, subIn: 76 },
  { num: 22, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: false, minutesPlayed: 0 },
  { num: 23, firstName: "Siua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 20, subIn: 60 },
];

// === COMPOSITION STADE TOULOUSAIN (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "David Ainu'u", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Julien Marchand", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Paul Mallez", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Joshua Brennan", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Richie Arnold", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Alban Placines", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "François Cros", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Alexandre Roumat", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Paul Graou", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Thomas Ramos", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Matthis Lebel", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Santiago Chocobares", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Pierre Fouyssac", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Arthur Retière", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Juan Cruz Mallía", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Peato Mauvaka", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Cyril Baille", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Dorian Aldegheri", position: Position.PILIER_DROIT, isStarter: false },
  { num: 19, name: "Rynhardt Elstadt", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Jack Willis", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, name: "Théo Ntamack", position: Position.CENTRE, isStarter: false },
  { num: 22, name: "Paul Costes", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Lucas Tauzin", position: Position.AILIER, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Stade Toulousain (J25, 13/05/2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 25, competition: { shortName: "Top 14" } },
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
      halfTimeUsap: 17,
      halfTimeOpponent: 15,
      // USAP : 2E + 2T + 4P = 10+4+12 = 26
      triesUsap: 2, conversionsUsap: 2, penaltiesUsap: 4, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Toulouse : 2E + 1T + 3P = 10+2+9 = 21
      triesOpponent: 2, conversionsOpponent: 1, penaltiesOpponent: 3, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Victoire cruciale qui assure le maintien de l'USAP en Top 14 ! " +
        "Toulouse, déjà qualifié en demi-finales, aligne une équipe remaniée (sans Dupont ni R. Ntamack). " +
        "Tedder est impérial au pied avec 16 points. " +
        "Ramos P (5', 0-3). Tedder P (9', 3-3). McIntyre E (14', T Tedder, 10-3). " +
        "Dubois E (20', T Tedder, 17-3). L'USAP domine nettement. " +
        "Toulouse réagit : Lebel E (30', 17-8), Ramos E + T (34', 17-15). Mi-temps : 17-15. " +
        "Ramos passe devant sur pénalité (46', 17-18). Tedder répond (50', 20-18). " +
        "Ramos reprend l'avantage (54', 20-21). Tedder P (60', 23-21) puis P (64', 26-21). " +
        "L'USAP tient bon et s'assure le maintien combiné à la défaite de Brive.",
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

    // McIntyre : 1E (14') = 5 pts
    if (p.lastName === "McIntyre") { tries = 1; totalPoints = 5; }
    // Dubois : 1E (20') = 5 pts
    if (p.lastName === "Dubois") { tries = 1; totalPoints = 5; }
    // Tedder : 2T (15', 21') + 4P (9', 50', 60', 64') = 4+12 = 16 pts
    if (p.lastName === "Tedder") { conversions = 2; penalties = 4; totalPoints = 16; }

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

  // Composition Toulouse
  console.log("\n--- Composition Stade Toulousain ---");
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
    { minute: 5, type: "PENALITE", isUsap: false, description: "Pénalité de Thomas Ramos (Toulouse). 0-3." },
    { minute: 9, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 3-3." },
    { minute: 14, type: "ESSAI", playerLastName: "McIntyre", isUsap: true, description: "Essai de Jake McIntyre (USAP). 8-3." },
    { minute: 15, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 10-3." },
    { minute: 20, type: "ESSAI", playerLastName: "Dubois", isUsap: true, description: "Essai de Lucas Dubois (USAP). 15-3." },
    { minute: 21, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 17-3." },
    { minute: 30, type: "ESSAI", isUsap: false, description: "Essai de Matthis Lebel (Toulouse). 17-8." },
    { minute: 34, type: "ESSAI", isUsap: false, description: "Essai de Thomas Ramos (Toulouse). 17-13." },
    { minute: 35, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Thomas Ramos (Toulouse). 17-15." },
    // === MI-TEMPS : USAP 17 - 15 Toulouse ===
    // === 2e MI-TEMPS ===
    { minute: 46, type: "PENALITE", isUsap: false, description: "Pénalité de Thomas Ramos (Toulouse). 17-18." },
    { minute: 50, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 20-18." },
    { minute: 54, type: "PENALITE", isUsap: false, description: "Pénalité de Thomas Ramos (Toulouse). 20-21." },
    { minute: 60, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 23-21." },
    { minute: 64, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 26-21. Score final !" },
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
    const side = evt.isUsap ? "USAP" : "ST";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 26 - 21 Stade Toulousain (domicile)");
  console.log("  Mi-temps : 17-15");
  console.log("  Arbitre : Thomas Charabas");
  console.log("  McIntyre 5 pts (1E), Dubois 5 pts (1E), Tedder 16 pts (2T + 4P)");
  console.log("  Toulouse : Lebel 1E, Ramos 1E+1T+3P");
  console.log("  Victoire qui assure le maintien de l'USAP !");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

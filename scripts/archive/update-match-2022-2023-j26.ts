/**
 * Mise à jour du match Castres Olympique - USAP (J26 Top 14, 28/05/2023)
 * Score : Castres 26 - 16 USAP
 *
 * Défaite au Pierre-Fabre, l'USAP jouera le barrage.
 * Urdapilleta P (7', 3-0). Urdapilleta P (17', 6-0).
 * Fernandez E Castres (30', T Urdapilleta, 13-0).
 * CJ Lotrian (34'). Tedder P (37', 13-3). Tedder P (40', 13-6).
 * Mi-temps : 13-6.
 * Forner E (44', T Rodor, 13-13). Rodor P (48', 13-16).
 * Urdapilleta P (50', 16-16). Urdapilleta P (56', 19-16).
 * Zeghdar E Castres (75', T Urdapilleta, 26-16).
 *
 * Essais USAP : Forner (44')
 * Transformation USAP : Rodor (45')
 * Pénalités USAP : Tedder (37', 40'), Rodor (48')
 * Essais Castres : Fernandez (30'), Zeghdar (75')
 * Transformations Castres : Urdapilleta (31', 76')
 * Pénalités Castres : Urdapilleta (7', 17', 50', 56')
 * CJ : Lotrian (34', USAP)
 *
 * Sources : allrugby.com, francebleu.fr, vent-dautan.fr, top14.lnr.fr
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j26.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 55, subOut: 55, yellowCard: true, yellowCardMin: 34 },
  { num: 2, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 3, firstName: "Maafu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 4, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Lucas", lastName: "Velarte", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 80 },
  { num: 10, firstName: "Tristan", lastName: "Tedder", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "George", lastName: "Tilsley", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Eddie", lastName: "Sawailau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Théo", lastName: "Forner", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 17, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 18, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 19, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 0 },
  { num: 20, firstName: "Joaquín", lastName: "Oviedo", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 21, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 22, firstName: "Alivereti", lastName: "Duguivalu", position: Position.AILIER, isStarter: false, minutesPlayed: 0 },
  { num: 23, firstName: "Siua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
];

// === COMPOSITION CASTRES OLYMPIQUE (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Quentin Walcker", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Pierre Colonna", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Wilfrid Hounkpatin", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Florent Vanverberghe", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Leone Nakarawa", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Mathieu Babillot", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Baptiste Delaporte", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Baptiste Cope", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Jérémy Fernandez", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Benjamin Urdapilleta", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Josaia Raisuqe", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Adrea Cocagi", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Adrien Séguret", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Geoffrey Palis", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Julien Dumora", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Brice Humbert", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Antoine Tichit", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Gauthier Maravat", position: Position.PILIER_DROIT, isStarter: false },
  { num: 19, name: "Kévin Kornath", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 20, name: "Vilimoni Botitu", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, name: "Julien Blanc", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Antoine Zeghdar", position: Position.AILIER, isStarter: false },
  { num: 23, name: "Aurélien Azar", position: Position.ARRIERE, isStarter: false },
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
  console.log("=== Mise à jour match Castres - USAP (J26, 28/05/2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 26, competition: { shortName: "Top 14" } },
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
      kickoffTime: "21:05",
      refereeId,
      halfTimeUsap: 6,
      halfTimeOpponent: 13,
      videoUrl: "https://www.dailymotion.com/video/x8lcif6",
      // USAP : 1E + 1T + 3P = 5+2+9 = 16
      triesUsap: 1, conversionsUsap: 1, penaltiesUsap: 3, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Castres : 2E + 2T + 4P = 10+4+12 = 26
      triesOpponent: 2, conversionsOpponent: 2, penaltiesOpponent: 4, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Défaite à Castres qui condamne l'USAP au barrage de maintien. " +
        "Castres domine la 1ère mi-temps grâce à Urdapilleta (P 7', P 17', 6-0) " +
        "et l'essai de Fernandez (30', T Urdapilleta, 13-0). CJ Lotrian (34'). " +
        "Tedder réduit l'écart sur 2 pénalités (37', 40', 13-6). Mi-temps : 13-6. " +
        "L'USAP revient en trombe : Forner E (44', T Rodor, 13-13), " +
        "Rodor P (48', 13-16). L'USAP mène ! " +
        "Mais Urdapilleta reprend la main (P 50', 16-16 puis P 56', 19-16). " +
        "Zeghdar scelle le sort des Catalans (75', T Urdapilleta, 26-16). " +
        "L'USAP devra disputer un barrage à Grenoble.",
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

    // Forner : 1E (44') = 5 pts
    if (p.lastName === "Forner") { tries = 1; totalPoints = 5; }
    // Tedder : 2P (37', 40') = 6 pts
    if (p.lastName === "Tedder") { penalties = 2; totalPoints = 6; }
    // Rodor : 1T (45') + 1P (48') = 2+3 = 5 pts
    if (p.lastName === "Rodor") { conversions = 1; penalties = 1; totalPoints = 5; }

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

  // Composition Castres
  console.log("\n--- Composition Castres Olympique ---");
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
    { minute: 7, type: "PENALITE", isUsap: false, description: "Pénalité de Benjamin Urdapilleta (Castres). 3-0." },
    { minute: 17, type: "PENALITE", isUsap: false, description: "Pénalité de Benjamin Urdapilleta (Castres). 6-0." },
    { minute: 30, type: "ESSAI", isUsap: false, description: "Essai de Jérémy Fernandez (Castres). 11-0." },
    { minute: 31, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Benjamin Urdapilleta (Castres). 13-0." },
    { minute: 34, type: "CARTON_JAUNE", playerLastName: "Lotrian", isUsap: true, description: "Carton jaune Sacha Lotrian (USAP)." },
    { minute: 37, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 13-3." },
    { minute: 40, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 13-6." },
    // === MI-TEMPS : Castres 13 - 6 USAP ===
    // === 2e MI-TEMPS ===
    { minute: 44, type: "ESSAI", playerLastName: "Forner", isUsap: true, description: "Essai de Théo Forner (USAP). 13-11." },
    { minute: 45, type: "TRANSFORMATION", playerLastName: "Rodor", isUsap: true, description: "Transformation de Matteo Rodor (USAP). 13-13." },
    { minute: 48, type: "PENALITE", playerLastName: "Rodor", isUsap: true, description: "Pénalité de Matteo Rodor (USAP). 13-16." },
    { minute: 50, type: "PENALITE", isUsap: false, description: "Pénalité de Benjamin Urdapilleta (Castres). 16-16." },
    { minute: 56, type: "PENALITE", isUsap: false, description: "Pénalité de Benjamin Urdapilleta (Castres). 19-16." },
    { minute: 75, type: "ESSAI", isUsap: false, description: "Essai d'Antoine Zeghdar (Castres). 24-16." },
    { minute: 76, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Benjamin Urdapilleta (Castres). 26-16." },
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
    const side = evt.isUsap ? "USAP" : "CO";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Castres 26 - 16 USAP (extérieur)");
  console.log("  Mi-temps : 13-6");
  console.log("  Arbitre : Luc Ramos");
  console.log("  Forner 5 pts (1E), Tedder 6 pts (2P), Rodor 5 pts (1T + 1P)");
  console.log("  Castres : Fernandez 1E, Zeghdar 1E, Urdapilleta 2T+4P");
  console.log("  CJ : Lotrian (34' USAP)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

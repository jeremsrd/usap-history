/**
 * Mise à jour du match USAP - UBB (J11 Top 14, 26/11/2022)
 * Score : USAP 23 - UBB 20
 *
 * Victoire à Aimé-Giral dans un match haletant. L'UBB mène 14-3
 * (Tameifuna E 9' + Jalibert E 24', tous deux transformés) mais l'USAP
 * revient grâce à Taumoepeau (E 28', T Tedder) et Tedder (P 21', P 38').
 * Mi-temps : 13-14 (UBB mène d'un point). Nombreux cartons jaunes
 * en 2e MT : Acébès (53'), Douglas (59'), Shields (79').
 * Tedder P (60') redonne l'avantage (16-14). Jalibert 2P (55', 68')
 * pour 16-20 UBB. Tilsley inscrit l'essai de la victoire (71',
 * T Tedder, 23-20). Score final : 23-20.
 *
 * Essais USAP : Taumoepeau (28'), Tilsley (71')
 * Transformations USAP : Tedder (28', 71')
 * Pénalités USAP : Tedder (21', 38', 60')
 * Essais UBB : Tameifuna (9'), Jalibert (24')
 * Transformations UBB : Jalibert (9', 24')
 * Pénalités UBB : Jalibert (55', 68')
 * CJ : Marais (39', UBB), Acébès (53', USAP), Douglas (59', UBB),
 *      Shields (79', USAP)
 *
 * Sources : itsrugby.fr (compositions), ubbrugby.com (arbitres, compo UBB),
 *   francebleu.fr (résumé), allrugby.com (fiche match)
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j11.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 73, subOut: 73 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 45, subOut: 45 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 5, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 50, subOut: 50 },
  { num: 7, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 74, subOut: 74 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, isCaptain: true, minutesPlayed: 80, yellowCard: true, yellowCardMin: 53 },
  { num: 12, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "George", lastName: "Tilsley", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tristan", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 7, subIn: 73 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 19, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 30, subIn: 50 },
  { num: 20, firstName: "Brad", lastName: "Shields", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 20, subIn: 60, yellowCard: true, yellowCardMin: 79 },
  { num: 21, firstName: "Alivereti", lastName: "Duguivalu", position: Position.AILIER, isStarter: false, minutesPlayed: 0 },
  { num: 22, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 6, subIn: 74 },
  { num: 23, firstName: "Siosiua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 35, subIn: 45 },
];

// === COMPOSITION UBB (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Jefferson Poirot", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Clément Maynadier", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Ben Tameifuna", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Kane Douglas", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Jandré Marais", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Pierre Bochaton", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Mahamadou Diaby", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Antoine Miquel", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Maxime Lucu", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Matthieu Jalibert", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Madosh Tambwe", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Yoram Moefana", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Jean-Baptiste Dubié", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Santiago Cordero", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Romain Buros", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Maxime Lamothe", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Lekso Kaulashvili", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Alban Roussel", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Thomas Willis", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Yann Lesgourgues", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Zack Holmes", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Louis Bielle-Biarrey", position: Position.AILIER, isStarter: false },
  { num: 23, name: "Sipili Falatea", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - UBB (J11, 26/11/2022) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 11, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Adrien", "Marbot");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "15:00",
      refereeId,
      halfTimeUsap: 13,
      halfTimeOpponent: 14,
      videoUrl: "https://www.youtube.com/watch?v=cMcPkG8pOCo",
      // USAP : 2E + 2T + 3P = 10+4+9 = 23
      triesUsap: 2, conversionsUsap: 2, penaltiesUsap: 3, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // UBB : 2E + 2T + 2P = 10+4+6 = 20
      triesOpponent: 2, conversionsOpponent: 2, penaltiesOpponent: 2, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Victoire à domicile dans un match haletant. L'UBB prend les devants : " +
        "Tameifuna (E 9', T Jalibert) puis Jalibert lui-même (E 24', T, 3-14). " +
        "L'USAP réagit : Tedder P (21'), Taumoepeau E (28', T Tedder), Tedder P (38'). " +
        "Mi-temps : 13-14, l'UBB mène d'un point. Match très indiscipliné en 2e MT : " +
        "CJ Acébès (53'), CJ Douglas (59'), CJ Shields (79'). " +
        "Tedder P (60') redonne l'avantage (16-14). Jalibert en profite " +
        "des infériorités catalanes avec 2 pénalités (55', 68', 16-20). " +
        "Tilsley inscrit l'essai décisif à la 71' (T Tedder, 23-20). " +
        "L'USAP tient bon jusqu'au bout malgré le CJ de Shields (79'). Score final : 23-20.",
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
    const hasYellowCard = (p as any).yellowCard ?? false;
    const yellowCardMin = (p as any).yellowCardMin ?? null;

    // Tedder : 2T (28', 71') + 3P (21', 38', 60') = 4+9 = 13 pts
    if (p.lastName === "Tedder") { conversions = 2; penalties = 3; totalPoints = 13; }
    // Taumoepeau : 1E (28') = 5 pts
    if (p.lastName === "Taumoepeau") { tries = 1; totalPoints = 5; }
    // Tilsley : 1E (71') = 5 pts
    if (p.lastName === "Tilsley") { tries = 1; totalPoints = 5; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard: hasYellowCard, yellowCardMin,
        redCard: false, redCardMin: null,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const yc = hasYellowCard ? `(CJ ${yellowCardMin}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", isCaptain ? "(C)" : "", yc, sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
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
    { minute: 9, type: "ESSAI", isUsap: false, description: "Essai de Ben Tameifuna (UBB). 0-5." },
    { minute: 9, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Matthieu Jalibert (UBB). 0-7." },
    { minute: 21, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 3-7." },
    { minute: 24, type: "ESSAI", isUsap: false, description: "Essai de Matthieu Jalibert (UBB). 3-12." },
    { minute: 24, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Matthieu Jalibert (UBB). 3-14." },
    { minute: 28, type: "ESSAI", playerLastName: "Taumoepeau", isUsap: true, description: "Essai d'Afusipa Taumoepeau (USAP). 8-14." },
    { minute: 28, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 10-14." },
    { minute: 38, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 13-14." },
    { minute: 39, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Jandré Marais (UBB)." },
    // === MI-TEMPS : USAP 13 - 14 UBB ===
    // === 2e MI-TEMPS ===
    { minute: 53, type: "CARTON_JAUNE", playerLastName: "Acébès", isUsap: true, description: "Carton jaune Mathieu Acébès (USAP)." },
    { minute: 55, type: "PENALITE", isUsap: false, description: "Pénalité de Matthieu Jalibert (UBB). 13-17." },
    { minute: 59, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Kane Douglas (UBB)." },
    { minute: 60, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 16-17." },
    { minute: 68, type: "PENALITE", isUsap: false, description: "Pénalité de Matthieu Jalibert (UBB). 16-20." },
    { minute: 71, type: "ESSAI", playerLastName: "Tilsley", isUsap: true, description: "Essai de George Tilsley (USAP). Essai décisif. 21-20." },
    { minute: 71, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 23-20." },
    { minute: 79, type: "CARTON_JAUNE", playerLastName: "Shields", isUsap: true, description: "Carton jaune Brad Shields (USAP). L'USAP tient le score." },
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
  console.log("  Score : USAP 23 - 20 UBB (domicile)");
  console.log("  Mi-temps : USAP 13 - 14 UBB");
  console.log("  Arbitre : Adrien Marbot");
  console.log("  Tedder 13 pts (2T + 3P), Taumoepeau 1E, Tilsley 1E (décisif 71')");
  console.log("  CJ : Marais (39', UBB), Acébès (53'), Douglas (59', UBB), Shields (79')");
  console.log("  4e victoire de la saison !");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

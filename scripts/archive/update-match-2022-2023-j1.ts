/**
 * Mise à jour du match Pau - USAP (J1 Top 14, 03/09/2022)
 * Score : Pau 16 - USAP 14
 *
 * Défaite cruelle au Hameau pour l'ouverture de la saison.
 * L'USAP mène 14-6 à 10 minutes de la fin grâce à des essais
 * de Tedder (interception 47') et Dubois (58'). Mais deux cartons
 * jaunes (Bachelier 73', Fia 80') permettent à Pau de renverser :
 * essai de Jordan Joseph (74') et pénalité de Henry (77') pour
 * s'imposer 16-14.
 *
 * Essais USAP : Tedder (47'), Dubois (58')
 * Essais Pau : Joseph (74')
 * CJ : Colombet (37', Pau), Bachelier (73', USAP), Fia (80', USAP)
 *
 * Sources : top14.lnr.fr (compositions), francebleu.fr (résumé, mi-temps 3-0),
 *   forum sectionpaloise.com (arbitre Pierre-Baptiste Nuchy)
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j1.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 2, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 3, firstName: "Siosiua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80, yellowCard: true, yellowCardMin: 73 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 10, firstName: "Tristan", lastName: "Tedder", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 65, subOut: 65 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 12, firstName: "George", lastName: "Tilsley", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Alivereti", lastName: "Duguivalu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Lucas", lastName: "Dubois", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 18, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 19, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 20, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 21, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 15, subIn: 65 },
  { num: 22, firstName: "Théo", lastName: "Forner", position: Position.ARRIERE, isStarter: false, minutesPlayed: 0 },
  { num: 23, firstName: "Siosiaia", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 25, subIn: 55, yellowCard: true, yellowCardMin: 80 },
];

// === COMPOSITION PAU (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Siegfried Fisiihoi", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Lucas Rey", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Nicolas Corato", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Guillaume Ducat", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Mickael Capelli", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Reece Hewat", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Luke Whitelock", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Beka Gorgadze", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Thibault Daubagna", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Zack Henry", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Mathias Colombet", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Jale Vatubua", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Eliott Roudil", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Thomas Carol", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Clément Laporte", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Youri Delhommel", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Ignacio Calles", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Lekima Tagitagivalu", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Martin Puech", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Jordan Joseph", position: Position.NUMERO_HUIT, isStarter: false },
  { num: 21, name: "Clovis Le Bail", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Thibault Debaes", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 23, name: "Guram Papidze", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match Pau - USAP (J1, 03/09/2022) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 1, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Pierre-Baptiste", "Nuchy");

  console.log("\n--- Stade ---");
  const venue = await prisma.venue.findFirst({ where: { name: { contains: "Hameau" } } });

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      venueId: venue?.id ?? undefined,
      halfTimeUsap: 0,
      halfTimeOpponent: 3,
      // USAP : 2E + 2T = 10+4 = 14
      triesUsap: 2, conversionsUsap: 2, penaltiesUsap: 0, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Pau : 1E + 1T + 3P = 5+2+9 = 16
      triesOpponent: 1, conversionsOpponent: 1, penaltiesOpponent: 3, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      videoUrl: "https://www.youtube.com/watch?v=kVZMr9bwYEQ",
      report:
        "Défaite cruelle au Hameau pour l'ouverture de la saison. " +
        "Première mi-temps terne : seule une pénalité de Henry (28') départage les équipes (3-0). " +
        "En 2e MT, l'USAP se réveille : Tedder intercepte une passe de Henry et file " +
        "à l'essai (47'), transformé. Dubois double la mise (58') sur un beau mouvement " +
        "des trois-quarts. L'USAP mène 14-6 à 10 minutes de la fin. " +
        "Mais l'indiscipline fait tout basculer : CJ Bachelier (73') puis CJ Fia (80'). " +
        "Jordan Joseph (entrant) en profite pour inscrire l'essai de Pau (74', transformé). " +
        "Henry scelle la victoire à la 77e (pénalité). Score final : 16-14.",
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
    const yellowCard = (p as any).yellowCard ?? false;
    const yellowCardMin = (p as any).yellowCardMin ?? null;
    const isCaptain = (p as any).isCaptain ?? false;

    // Tedder : 1E + 2T = 5+4 = 9 pts
    if (p.lastName === "Tedder") { tries = 1; conversions = 2; totalPoints = 9; }
    if (p.lastName === "Dubois") { tries = 1; totalPoints = 5; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard, yellowCardMin,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", yellowCard ? `[CJ ${yellowCardMin}']` : "", isCaptain ? "(C)" : "", sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // Composition Pau
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
    { minute: 28, type: "PENALITE", isUsap: false, description: "Pénalité de Zack Henry (Pau). 3-0." },
    { minute: 37, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Mathias Colombet (Pau)." },
    // === MI-TEMPS : Pau 3 - 0 USAP ===
    { minute: 47, type: "ESSAI", playerLastName: "Tedder", isUsap: true, description: "Essai de Tristan Tedder (USAP). Interception d'une passe de Henry ! 3-5." },
    { minute: 47, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 3-7." },
    { minute: 53, type: "PENALITE", isUsap: false, description: "Pénalité de Zack Henry (Pau). 6-7." },
    { minute: 58, type: "ESSAI", playerLastName: "Dubois", isUsap: true, description: "Essai de Lucas Dubois (USAP). Beau mouvement des trois-quarts. 6-12." },
    { minute: 58, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 6-14." },
    { minute: 73, type: "CARTON_JAUNE", playerLastName: "Bachelier", isUsap: true, description: "Carton jaune Lucas Bachelier (USAP). USAP à 14." },
    { minute: 74, type: "ESSAI", isUsap: false, description: "Essai de Jordan Joseph (Pau). USAP en infériorité ! 11-14." },
    { minute: 74, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Zack Henry (Pau). 13-14." },
    { minute: 77, type: "PENALITE", isUsap: false, description: "Pénalité de Zack Henry (Pau). 16-14. Score final." },
    { minute: 80, type: "CARTON_JAUNE", playerLastName: "Fia", isUsap: true, description: "Carton jaune Siosiaia Fia (USAP). 2e CJ catalan." },
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
  console.log("  Score : Pau 16 - 14 USAP (extérieur)");
  console.log("  Mi-temps : Pau 3 - 0 USAP");
  console.log("  Arbitre : Pierre-Baptiste Nuchy");
  console.log("  Tedder 9 pts (1E + 2T), Dubois 1E");
  console.log("  2 CJ USAP : Bachelier (73'), Fia (80')");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

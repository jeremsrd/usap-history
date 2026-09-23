/**
 * Mise à jour du match Clermont - USAP (J15 Top 14, 07/01/2023)
 * Score : Clermont 31 - USAP 20
 *
 * L'USAP prend les devants avec un essai de Mamea Lemalu (12', T McIntyre, 0-7).
 * Mais 2 CJ en 3 minutes (Labouteley 17', Deghmache 20') : à 13 contre 15,
 * Clermont en profite : Raka E (22', T Plisson, 7-7), Tixeront E (29', T Plisson, 14-7).
 * P McIntyre (40', 14-10). Mi-temps : 14-10.
 * P McIntyre (50', 14-13). P Plisson (58', 17-13).
 * Tilsley E (62', T McIntyre, 17-20) : l'USAP repasse devant !
 * Mais Jauneau E (73', T Belleau, 24-20) puis Delguy E sur interception (79', T Belleau, 31-20).
 *
 * Essais USAP : Mamea Lemalu (12'), Tilsley (62')
 * Transformations USAP : McIntyre (13', 63')
 * Pénalités USAP : McIntyre (40', 50')
 * Essais Clermont : Raka (22'), Tixeront (29'), Jauneau (73'), Delguy (79')
 * Transformations Clermont : Plisson (23', 30'), Belleau (73', 79')
 * Pénalité Clermont : Plisson (58')
 * CJ : Labouteley (17', USAP), Deghmache (20', USAP)
 *
 * Sources : allrugby.com, vibrez-rugby.com, francebleu.fr, itsrugby.fr, top14.lnr.fr
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j15.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 46, subOut: 46 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Brad", lastName: "Shields", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 64, subOut: 64 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Ali", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "George", lastName: "Tilsley", position: Position.CENTRE, isStarter: true, minutesPlayed: 67, subOut: 67 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 18, firstName: "Taniela", lastName: "Ramasibana", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 0 },
  { num: 19, firstName: "Posolo", lastName: "Tuilagi", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 16, subIn: 64 },
  { num: 20, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 21, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 0 },
  { num: 22, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: false, minutesPlayed: 13, subIn: 67 },
  { num: 23, firstName: "Maafu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 34, subIn: 46 },
];

// === COMPOSITION CLERMONT (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Etienne Falgoux", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Yohan Beheregaray", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Rabah Slimani", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Miles Amatosero", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Tomás Lavanini", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Alexandre Fischer", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Killian Tixeront", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Fritz Lee", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Sébastien Bézy", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Jules Plisson", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Alivereti Raka", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Ioane Simone", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Samuel Ezeala", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Bautista Delguy", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Alex Newsome", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Adrien Pélissié", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Daniel Bibi Biziwu", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Edward Annandale", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Judicaël Cancoriet", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Baptiste Jauneau", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Anthony Belleau", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Cheikh Tiberghien", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Davit Kubriashvili", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match Clermont - USAP (J15, 07/01/2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 15, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Vincent", "Blasco-Baqué");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      halfTimeUsap: 10,
      halfTimeOpponent: 14,
      videoUrl: "https://www.youtube.com/watch?v=Rcl7gvmEWuo",
      // USAP : 2E + 2T + 2P = 10+4+6 = 20
      triesUsap: 2, conversionsUsap: 2, penaltiesUsap: 2, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Clermont : 4E + 4T + 1P = 20+8+3 = 31
      triesOpponent: 4, conversionsOpponent: 4, penaltiesOpponent: 1, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "L'USAP prend les devants grâce à un essai de Mamea Lemalu (12', T McIntyre, 0-7). " +
        "Mais les Catalans écopent de 2 cartons jaunes en 3 minutes (Labouteley 17', " +
        "Deghmache 20') : à 13 contre 15, Clermont en profite avec Raka (22', T Plisson, 7-7) " +
        "puis Tixeront (29', T Plisson, 14-7). McIntyre réduit sur P (40', 14-10). Mi-temps : 14-10. " +
        "McIntyre rapproche l'USAP sur P (50', 14-13). Plisson P (58', 17-13). " +
        "Tilsley marque et McIntyre transforme : l'USAP repasse devant (62', 17-20) ! " +
        "Mais Clermont réagit en fin de match : Jauneau E (73', T Belleau, 24-20) " +
        "puis Delguy sur interception (79', T Belleau, 31-20). Défaite cruelle.",
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
    let yellowCard = false, yellowCardMin: number | null = null;
    const isCaptain = (p as any).isCaptain ?? false;

    // Mamea Lemalu : 1E (12') = 5 pts
    if (p.lastName === "Mamea Lemalu") { tries = 1; totalPoints = 5; }
    // Tilsley : 1E (62') = 5 pts
    if (p.lastName === "Tilsley") { tries = 1; totalPoints = 5; }
    // McIntyre : 2T (13', 63') + 2P (40', 50') = 4+6 = 10 pts
    if (p.lastName === "McIntyre") { conversions = 2; penalties = 2; totalPoints = 10; }
    // Labouteley : CJ (17')
    if (p.lastName === "Labouteley") { yellowCard = true; yellowCardMin = 17; }
    // Deghmache : CJ (20')
    if (p.lastName === "Deghmache") { yellowCard = true; yellowCardMin = 20; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard, yellowCardMin: yellowCardMin ?? null,
        redCard: false, redCardMin: null,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const card = yellowCard ? `(CJ ${yellowCardMin}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", isCaptain ? "(C)" : "", card, sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // Composition Clermont
  console.log("\n--- Composition ASM Clermont Auvergne ---");
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
    { minute: 12, type: "ESSAI", playerLastName: "Mamea Lemalu", isUsap: true, description: "Essai de Genesis Mamea Lemalu (USAP). 0-5." },
    { minute: 13, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 0-7." },
    { minute: 17, type: "CARTON_JAUNE", playerLastName: "Labouteley", isUsap: true, description: "Carton jaune Tristan Labouteley (USAP). Fautes répétées." },
    { minute: 20, type: "CARTON_JAUNE", playerLastName: "Deghmache", isUsap: true, description: "Carton jaune Sadek Deghmache (USAP). Anti-jeu. USAP à 13." },
    { minute: 22, type: "ESSAI", isUsap: false, description: "Essai d'Alivereti Raka (Clermont). 5-7." },
    { minute: 23, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Jules Plisson (Clermont). 7-7." },
    { minute: 29, type: "ESSAI", isUsap: false, description: "Essai de Killian Tixeront (Clermont). 12-7." },
    { minute: 30, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Jules Plisson (Clermont). 14-7." },
    { minute: 40, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 14-10." },
    // === MI-TEMPS : Clermont 14 - 10 USAP ===
    // === 2e MI-TEMPS ===
    { minute: 50, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 14-13." },
    { minute: 58, type: "PENALITE", isUsap: false, description: "Pénalité de Jules Plisson (Clermont). 17-13." },
    { minute: 62, type: "ESSAI", playerLastName: "Tilsley", isUsap: true, description: "Essai de George Tilsley (USAP). L'USAP repasse devant ! 17-18." },
    { minute: 63, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 17-20." },
    { minute: 73, type: "ESSAI", isUsap: false, description: "Essai de Baptiste Jauneau (Clermont) sur rebond favorable. 22-20." },
    { minute: 73, type: "TRANSFORMATION", isUsap: false, description: "Transformation d'Anthony Belleau (Clermont). 24-20." },
    { minute: 79, type: "ESSAI", isUsap: false, description: "Essai de Bautista Delguy (Clermont) sur interception. 29-20." },
    { minute: 79, type: "TRANSFORMATION", isUsap: false, description: "Transformation d'Anthony Belleau (Clermont). 31-20." },
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
    const side = evt.isUsap ? "USAP" : "ASM";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Clermont 31 - 20 USAP (extérieur)");
  console.log("  Mi-temps : Clermont 14 - 10 USAP");
  console.log("  Arbitre : Vincent Blasco-Baqué");
  console.log("  Mamea Lemalu 5 pts (1E), Tilsley 5 pts (1E), McIntyre 10 pts (2T + 2P)");
  console.log("  Clermont : Raka, Tixeront, Jauneau, Delguy (4E + 4T + 1P = 31)");
  console.log("  CJ : Labouteley (17'), Deghmache (20')");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

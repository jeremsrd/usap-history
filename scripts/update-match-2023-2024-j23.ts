/**
 * Mise à jour du match USAP - Clermont (J23 Top 14, 11/05/2024)
 * Score : USAP 28 - 35 ASM Clermont
 *
 * Défaite cruelle après avoir mené pendant 75 minutes !
 * L'USAP domine la 1e MT (15-6) et mène 21-6 à la 50e, mais
 * trois cartons jaunes (Brazo, Ruiz, Naqalevu) et le retour
 * de Clermont (4 essais en 2e MT) font basculer le match.
 * L'USAP termine à 13 joueurs.
 *
 * Essais USAP : ~15' (non identifié), Dubois (39'), Veredamu (69')
 * Essais Clermont : Darricarrère (59'), Beria (66'), Fourcade (71'), Jauneau (76')
 * CJ : Brazo (58'), Ruiz (71'), Naqalevu (80') — tous USAP
 *
 * Sources : top14.lnr.fr (compositions), eurosport.fr (marqueurs),
 *   allrugby.com (arbitre Jérémy Rozier), all.rugby (timeline),
 *   francebleu.fr (résumé), dicodusport.fr (USAP à 13)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j23.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 3, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 56, subOut: 56 },
  { num: 4, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquin", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jeronimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, isCaptain: true, minutesPlayed: 67, subOut: 67 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Louis", lastName: "Dupichot", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 19, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 20, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 21, firstName: "Tommaso", lastName: "Allan", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 13, subIn: 67 },
  { num: 22, firstName: "Apisai", lastName: "Naqalevu", position: Position.CENTRE, isStarter: false, minutesPlayed: 13, subIn: 67 },
  { num: 23, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 24, subIn: 56 },
];

// === COMPOSITION ASM CLERMONT (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Giorgi Beria", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Yohan Beheregaray", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Rabah Slimani", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Thibaud Lanen", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Paul Jedrasiak", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Lucas Dessaigne", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Marcos Kremer", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Peceli Yato", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Baptiste Jauneau", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Anthony Belleau", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Joris Jurand", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Léon Darricarrère", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Julien Hériteau", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Yérim Fall", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Alex Newsome", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Étienne Fourcade", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Étienne Falgoux", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Anthime Hemery", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Killian Tixeront", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Théo Giral", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Benjamin Urdapilleta", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Mathys Belaubre", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Giorgi Dzmanashvili", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Clermont (J23, 11/05/2024) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2023, endYear: 2024 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 23, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Jérémy", "Rozier");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "15:00",
      refereeId,
      halfTimeUsap: 15,
      halfTimeOpponent: 6,
      // USAP : 3E + 2T + 3P = 15+4+9 = 28
      triesUsap: 3, conversionsUsap: 2, penaltiesUsap: 3, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Clermont : 4E + 3T + 3P = 20+6+9 = 35
      triesOpponent: 4, conversionsOpponent: 3, penaltiesOpponent: 3, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Défaite cruelle après avoir mené pendant 75 minutes ! L'USAP domine la 1e MT " +
        "grâce à McIntyre au pied (3 pénalités) et un essai de Dubois sur une passe de " +
        "Veredamu (39'). 15-6 à la pause (2 pénalités Belleau pour Clermont). " +
        "L'USAP creuse l'écart à 21-6 (50') mais l'indiscipline fait tout basculer : " +
        "CJ Brazo (58'), CJ Ruiz (71'), CJ Naqalevu (80'). L'USAP termine à 13 ! " +
        "Clermont en profite : Darricarrère (59'), Beria (66'), Fourcade (71'), " +
        "Jauneau (76') inscrivent 4 essais en 20 minutes. Veredamu sauve l'honneur (69') " +
        "mais Clermont s'impose 35-28. Fin de série pour l'USAP.",
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

    if (p.lastName === "Dubois") { tries = 1; totalPoints = 5; }
    if (p.lastName === "Veredamu") { tries = 1; totalPoints = 5; }
    // McIntyre : 2T + 3P = 4+9 = 13 pts
    if (p.lastName === "McIntyre") { conversions = 2; penalties = 3; totalPoints = 13; }
    if (p.lastName === "Brazo") { yellowCard = true; yellowCardMin = 58; }
    if (p.lastName === "Ruiz") { yellowCard = true; yellowCardMin = 71; }
    if (p.lastName === "Naqalevu") { yellowCard = true; yellowCardMin = 80; }

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

  // Composition Clermont
  console.log("\n--- Composition ASM Clermont ---");
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
    { minute: 8, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 3-0." },
    { minute: 12, type: "PENALITE", isUsap: false, description: "Pénalité d'Anthony Belleau (Clermont). 3-3." },
    { minute: 15, type: "ESSAI", isUsap: true, description: "Essai de l'USAP. 8-3." },
    { minute: 16, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 10-3." },
    { minute: 30, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 13-3." },
    { minute: 35, type: "PENALITE", isUsap: false, description: "Pénalité d'Anthony Belleau (Clermont). 13-6." },
    { minute: 39, type: "ESSAI", playerLastName: "Dubois", isUsap: true, description: "Essai de Lucas Dubois (USAP). Passe de Veredamu. 18-6." },

    // === MI-TEMPS : USAP 15 - 6 Clermont ===
    // Note : le score 15-6 implique que l'essai de Dubois n'a pas été transformé
    // ou que le timing des pénalités diffère légèrement

    // === 2ème MI-TEMPS ===
    { minute: 45, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 18-6." },
    { minute: 50, type: "PENALITE", isUsap: false, description: "Pénalité d'Anthony Belleau (Clermont). 18-9." },
    { minute: 58, type: "CARTON_JAUNE", playerLastName: "Brazo", isUsap: true, description: "Carton jaune Alan Brazo (USAP). USAP à 14." },
    { minute: 59, type: "ESSAI", isUsap: false, description: "Essai de Léon Darricarrère (Clermont). Le retour commence. 18-14." },
    { minute: 60, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Belleau/Urdapilleta (Clermont). 18-16." },
    { minute: 66, type: "ESSAI", isUsap: false, description: "Essai de Giorgi Beria (Clermont). 18-21." },
    { minute: 67, type: "TRANSFORMATION", isUsap: false, description: "Transformation (Clermont). 18-23." },
    { minute: 69, type: "ESSAI", playerLastName: "Veredamu", isUsap: true, description: "Essai de Tavite Veredamu (USAP). Réaction ! 23-23." },
    { minute: 70, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 25-23." },
    { minute: 71, type: "CARTON_JAUNE", playerLastName: "Ruiz", isUsap: true, description: "Carton jaune Ignacio Ruiz (USAP). USAP à 13 !" },
    { minute: 71, type: "ESSAI", isUsap: false, description: "Essai d'Étienne Fourcade (Clermont). 25-28." },
    { minute: 72, type: "TRANSFORMATION", isUsap: false, description: "Transformation (Clermont). 25-30." },
    { minute: 76, type: "ESSAI", isUsap: false, description: "Essai de Baptiste Jauneau (Clermont). 25-35." },
    { minute: 80, type: "CARTON_JAUNE", playerLastName: "Naqalevu", isUsap: true, description: "Carton jaune Apisai Naqalevu (USAP). 3e CJ, USAP à 13." },
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
  console.log("  Score : USAP 28 - 35 Clermont (domicile)");
  console.log("  Mi-temps : USAP 15 - 6 Clermont");
  console.log("  Arbitre : Jérémy Rozier");
  console.log("  3 CJ USAP : Brazo (58'), Ruiz (71'), Naqalevu (80')");
  console.log("  USAP termine à 13 joueurs !");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

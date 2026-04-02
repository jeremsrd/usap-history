/**
 * Mise à jour du match USAP - Clermont (J7 Top 14, 15/10/2022)
 * Score : USAP 10 - Clermont 20
 *
 * Défaite à domicile face à des Clermontois solides au pied.
 * Belleau inscrit 5 pénalités (2', 7', 11', 46', 65'). L'USAP souffre
 * de sa propre indiscipline : CJ Bachelier (17'), CJ Lam (37').
 * Mi-temps : 3-9. Delguy inscrit le seul essai de Clermont (71', NT).
 * Acébès sauve l'honneur dans les dernières minutes (essai 77',
 * transformé par Tedder). Score final : 10-20.
 *
 * Essai USAP : Acébès (77')
 * Transformation USAP : Tedder (77')
 * Pénalité USAP : Tedder (10')
 * Essai Clermont : Delguy (71', NT)
 * Pénalités Clermont : Belleau (2', 7', 11', 46', 65')
 * CJ : Bachelier (17', USAP), Lam (37', USAP)
 *
 * Sources : itsrugby.fr (compositions), allrugby.com (arbitres),
 *   top14.lnr.fr (feuille de match), francebleu.fr (résumé),
 *   asm-rugby.com (compte-rendu)
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j7.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 37, subOut: 37, yellowCard: true, yellowCardMin: 37 },
  { num: 3, firstName: "Siosiua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 4, firstName: "Will", lastName: "Witty", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 53, subOut: 53 },
  { num: 5, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 48, subOut: 48 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 17, subOut: 17, yellowCard: true, yellowCardMin: 17 },
  { num: 7, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 10, firstName: "Tristan", lastName: "Tedder", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 12, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 14, firstName: "Alivereti", lastName: "Duguivalu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Lucas", lastName: "Dubois", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 43, subIn: 37 },
  { num: 17, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Maafu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 19, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 63, subIn: 17 },
  { num: 20, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 32, subIn: 48 },
  { num: 21, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 22, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 27, subIn: 53 },
  { num: 23, firstName: "George", lastName: "Tilsley", position: Position.CENTRE, isStarter: false, minutesPlayed: 20, subIn: 60 },
];

// === COMPOSITION CLERMONT (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Étienne Falgoux", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Yohan Beheregaray", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Cristian Ojovan", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Paul Jedrasiak", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Sébastien Vahaamahina", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Arthur Iturria", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Jacobus Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Fritz Lee", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Sébastien Bézy", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Anthony Belleau", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Alivereti Raka", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Irae Simone", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Damian Penaud", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Bautista Delguy", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Cheick Tiberghien", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Adrien Pélissié", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Giorgi Beria", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Tomas Lavanini", position: Position.PILIER_DROIT, isStarter: false },
  { num: 19, name: "Killian Tixeront", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 20, name: "Baptiste Jauneau", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, name: "Jules Plisson", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Conor O'Connor", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Giorgi Dzmanashvili", position: Position.ARRIERE, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Clermont (J7, 15/10/2022) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 7, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Julien", "Castaignède");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      halfTimeUsap: 3,
      halfTimeOpponent: 9,
      // USAP : 1E + 1T + 1P = 5+2+3 = 10
      triesUsap: 1, conversionsUsap: 1, penaltiesUsap: 1, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Clermont : 1E + 0T + 5P = 5+0+15 = 20
      triesOpponent: 1, conversionsOpponent: 0, penaltiesOpponent: 5, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Défaite à domicile face à des Clermontois très efficaces au pied. " +
        "Anthony Belleau punit l'indiscipline catalane avec 5 pénalités (2', 7', 11', 46', 65'). " +
        "L'USAP se tire une balle dans le pied : carton jaune pour Bachelier (17', fautes répétées) " +
        "puis pour Lam (37', anti-jeu). Tedder limite les dégâts d'une pénalité (10', 3-6). " +
        "Mi-temps : 3-9. Clermont accélère en 2e mi-temps, Belleau creuse l'écart (46', 65', 3-15) " +
        "avant l'essai de Delguy (71', non transformé, 3-20). Acébès sauve l'honneur dans les " +
        "dernières minutes (essai 77', transformé par Tedder, 10-20). Score final : 10-20.",
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

    // Tedder : 1P (10') + 1T (77') = 5 pts
    if (p.lastName === "Tedder") { penalties = 1; conversions = 1; totalPoints = 5; }
    // Acébès : 1E (77') = 5 pts
    if (p.lastName === "Acébès") { tries = 1; totalPoints = 5; }

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
    { minute: 2, type: "PENALITE", isUsap: false, description: "Pénalité d'Anthony Belleau (Clermont). 0-3." },
    { minute: 7, type: "PENALITE", isUsap: false, description: "Pénalité d'Anthony Belleau (Clermont). 0-6." },
    { minute: 10, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 3-6." },
    { minute: 11, type: "PENALITE", isUsap: false, description: "Pénalité d'Anthony Belleau (Clermont). 3-9." },
    { minute: 17, type: "CARTON_JAUNE", playerLastName: "Bachelier", isUsap: true, description: "Carton jaune Lucas Bachelier (USAP). Fautes répétées." },
    { minute: 37, type: "CARTON_JAUNE", playerLastName: "Lam", isUsap: true, description: "Carton jaune Seilala Lam (USAP). Anti-jeu." },
    // === MI-TEMPS : USAP 3 - 9 Clermont ===
    // === 2e MI-TEMPS ===
    { minute: 46, type: "PENALITE", isUsap: false, description: "Pénalité d'Anthony Belleau (Clermont). 3-12." },
    { minute: 65, type: "PENALITE", isUsap: false, description: "Pénalité d'Anthony Belleau (Clermont). 3-15." },
    { minute: 71, type: "ESSAI", isUsap: false, description: "Essai de Bautista Delguy (Clermont). Non transformé. 3-20." },
    { minute: 77, type: "ESSAI", playerLastName: "Acébès", isUsap: true, description: "Essai de Mathieu Acébès (USAP). 8-20." },
    { minute: 77, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 10-20." },
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
  console.log("  Score : USAP 10 - 20 Clermont (domicile)");
  console.log("  Mi-temps : USAP 3 - 9 Clermont");
  console.log("  Arbitre : Julien Castaignède");
  console.log("  Tedder 5 pts (1P + 1T), Acébès 1E (5 pts)");
  console.log("  CJ : Bachelier (17'), Lam (37')");
  console.log("  Clermont : Belleau 5P (15 pts), Delguy 1E NT (5 pts)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

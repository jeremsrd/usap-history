/**
 * Mise à jour du match USAP - Lyon (J9 Top 14, 29/10/2022)
 * Score : USAP 28 - Lyon 21
 *
 * Victoire à Aimé-Giral malgré un CJ controversé d'Ecochard (17',
 * plaquage haut sur Niniashvili — le TMO suggérait le rouge, Dufort
 * donne le jaune). Ironie : l'USAP à 14 marque 2 essais (Acébès 22',
 * Tedder 25' sur interception). McIntyre ouvre le score (P 8').
 * Mi-temps : 15-7. En 2e MT, McIntyre P (46'), Deghmache E (49',
 * T McIntyre) portent le score à 25-7. Lyon revient à 25-21
 * (3 essais transformés : 33'+T, 54'+T, 65'+T). McIntyre P (77')
 * scelle la victoire : 28-21.
 *
 * Essais USAP : Acébès (22'), Tedder (25'), Deghmache (49')
 * Transformations USAP : McIntyre (23', 51')
 * Pénalités USAP : McIntyre (8', 46', 77')
 * Essais Lyon : 33', 54', 65' (tous transformés)
 * CJ : Ecochard (17', USAP)
 *
 * Sources : top14.lnr.fr (compositions), lourugby.fr (chronologie),
 *   francebleu.fr (résumé, polémique arbitrage), allrugby.com (compos)
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j9.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 48, subOut: 48 },
  { num: 6, firstName: "Joaquín", lastName: "Oviedo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 53, subOut: 53 },
  { num: 7, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 41, subOut: 41, yellowCard: true, yellowCardMin: 17 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tristan", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 17, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 32, subIn: 48 },
  { num: 19, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 27, subIn: 53 },
  { num: 20, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 21, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 39, subIn: 41 },
  { num: 22, firstName: "George", lastName: "Tilsley", position: Position.CENTRE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 23, firstName: "Maafu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 29, subIn: 51 },
];

// === COMPOSITION LYON (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Hamza Kaabeche", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Yanis Charcosset", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Feao Fotuaika", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Joel Kpoku", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Temo Mayanavanua", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Patrick Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Beka Saginadze", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Maxime Gouzou", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Jean-Marc Doussain", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Fletcher Smith", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Josua Tuisova", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Kyle Godwin", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Josiah Maraku", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Thibaut Regard", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Davit Niniashvili", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Guillaume Marchand", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Jérôme Rey", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Mickaël Guillard", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Félix Lambey", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 20, name: "Jonathan Pélissié", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, name: "Théo William", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Alfred Parisien", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Paulo Tafili", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Lyon (J9, 29/10/2022) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 9, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Jonathan", "Dufort");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      halfTimeUsap: 15,
      halfTimeOpponent: 7,
      videoUrl: "https://www.youtube.com/watch?v=lIW4GpM7_gg",
      // USAP : 3E + 2T + 3P = 15+4+9 = 28
      triesUsap: 3, conversionsUsap: 2, penaltiesUsap: 3, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Lyon : 3E + 3T = 15+6 = 21
      triesOpponent: 3, conversionsOpponent: 3, penaltiesOpponent: 0, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Victoire à Aimé-Giral dans un match marqué par un arbitrage controversé. " +
        "McIntyre ouvre le score (P 8', 3-0). Ecochard reçoit un carton jaune (17') pour " +
        "plaquage haut sur Niniashvili — le TMO suggérait le rouge, Dufort donne le jaune. " +
        "Paradoxe : l'USAP à 14 marque 2 essais en 3 minutes ! Acébès (22', T McIntyre) " +
        "puis Tedder sur interception (25', non transformé, 15-0). Lyon réduit avant la pause " +
        "(essai 33' + T, 15-7). En 2e MT, McIntyre P (46') et Deghmache E (49', T McIntyre) " +
        "portent le score à 25-7. Lyon revient à 25-21 avec 3 essais tous transformés (54', 65'). " +
        "McIntyre scelle la victoire d'une dernière pénalité (77', 28-21). Lyon pester contre " +
        "l'arbitrage après le match.",
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

    // McIntyre : 3P (8', 46', 77') + 2T (23', 51') = 9+4 = 13 pts
    if (p.lastName === "McIntyre") { penalties = 3; conversions = 2; totalPoints = 13; }
    // Acébès : 1E (22') = 5 pts
    if (p.lastName === "Acébès") { tries = 1; totalPoints = 5; }
    // Tedder : 1E (25') = 5 pts
    if (p.lastName === "Tedder") { tries = 1; totalPoints = 5; }
    // Deghmache : 1E (49') = 5 pts
    if (p.lastName === "Deghmache") { tries = 1; totalPoints = 5; }

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

  // Composition Lyon
  console.log("\n--- Composition Lyon OU ---");
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
    { minute: 17, type: "CARTON_JAUNE", playerLastName: "Ecochard", isUsap: true, description: "Carton jaune Tom Ecochard (USAP). Plaquage haut sur Niniashvili, TMO suggérait le rouge." },
    { minute: 22, type: "ESSAI", playerLastName: "Acébès", isUsap: true, description: "Essai de Mathieu Acébès (USAP). En infériorité numérique. 8-0." },
    { minute: 23, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 10-0." },
    { minute: 25, type: "ESSAI", playerLastName: "Tedder", isUsap: true, description: "Essai de Tristan Tedder (USAP) sur interception. En infériorité numérique. Non transformé. 15-0." },
    { minute: 33, type: "ESSAI", isUsap: false, description: "Essai de Lyon. 15-5." },
    { minute: 35, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Lyon. 15-7." },
    // === MI-TEMPS : USAP 15 - 7 Lyon ===
    // === 2e MI-TEMPS ===
    { minute: 46, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 18-7." },
    { minute: 49, type: "ESSAI", playerLastName: "Deghmache", isUsap: true, description: "Essai de Sadek Deghmache (USAP). 23-7." },
    { minute: 51, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 25-7." },
    { minute: 54, type: "ESSAI", isUsap: false, description: "Essai de Lyon. 25-12." },
    { minute: 55, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Lyon. 25-14." },
    { minute: 65, type: "ESSAI", isUsap: false, description: "Essai de Lyon. 25-19." },
    { minute: 66, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Lyon. 25-21." },
    { minute: 77, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). Score final. 28-21." },
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
  console.log("  Score : USAP 28 - 21 Lyon (domicile)");
  console.log("  Mi-temps : USAP 15 - 7 Lyon");
  console.log("  Arbitre : Jonathan Dufort");
  console.log("  McIntyre 13 pts (3P + 2T), Acébès 1E, Tedder 1E, Deghmache 1E");
  console.log("  CJ : Ecochard (17') — 2 essais USAP en infériorité !");
  console.log("  3e victoire de la saison");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

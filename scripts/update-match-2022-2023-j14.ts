/**
 * Mise à jour du match USAP - La Rochelle (J14 Top 14, 31/12/2022)
 * Score : USAP 10 - La Rochelle 29
 *
 * Défaite bonifiée des Rochelais à Aimé-Giral pour la Saint-Sylvestre.
 * McIntyre ouvre le score sur P (17', 3-0) mais Thomas E (21', T Hastoy, 3-7),
 * Leyds E (22', 3-12), Kerr-Barlow E (27', 3-17), Thomas E (35', 3-22).
 * Acébès CR pour coup de tête sur Danty (39'). Mi-temps : 3-22.
 * Fa'asalele E (47', T McIntyre, 10-22). Boudehent E en contre (78', T, 10-29).
 * CJ Atonio (47'), CJ Ecochard (78'), CJ Tilsley (79').
 *
 * Essai USAP : Fa'asalele (47')
 * Transformation USAP : McIntyre (47')
 * Pénalité USAP : McIntyre (17')
 * Essais La Rochelle : Thomas ×2 (21', 35'), Leyds (22'), Kerr-Barlow (27'), Boudehent (78')
 * Transformations La Rochelle : Hastoy (21'), conversion (78')
 * CR : Acébès (39', USAP) — coup de tête sur Danty
 * CJ : Atonio (47', LR), Ecochard (78', USAP), Tilsley (79', USAP)
 *
 * Sources : allrugby.com, staderochelais.com, francebleu.fr, top14.lnr.fr
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j14.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 40, subOut: 40 },
  { num: 2, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 40, subOut: 40 },
  { num: 3, firstName: "Siosiua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 40, subOut: 40 },
  { num: 4, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 6, firstName: "Brad", lastName: "Shields", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 7, firstName: "Joaquín", lastName: "Oviedo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 79, subOut: 79 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 54, subOut: 54 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, isCaptain: true, minutesPlayed: 39 },
  { num: 12, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: true, minutesPlayed: 56, subOut: 56 },
  // Remplaçants
  { num: 16, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 40, subIn: 40 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 40, subIn: 40 },
  { num: 18, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 19, firstName: "Lucas", lastName: "Velarte", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 20, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 26, subIn: 54 },
  { num: 21, firstName: "George", lastName: "Tilsley", position: Position.AILIER, isStarter: false, minutesPlayed: 1, subIn: 79 },
  { num: 22, firstName: "Ali", lastName: "Crossdale", position: Position.ARRIERE, isStarter: false, minutesPlayed: 24, subIn: 56 },
  { num: 23, firstName: "Maafu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 40, subIn: 40 },
];

// === COMPOSITION LA ROCHELLE (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Thierry Païva", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Samuel Lagrange", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Uini Atonio", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Romain Sazy", position: Position.DEUXIEME_LIGNE, isStarter: true, isCaptain: true },
  { num: 5, name: "Will Skelton", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Rémi Bourdeau", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Kyle Hatherell", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Paul Boudehent", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Tawera Kerr-Barlow", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Antoine Hastoy", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Pierre Boudehent", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Jonathan Danty", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Raymond Rhule", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Teddy Thomas", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Dillyn Leyds", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Quentin Lespiaucq-Brettes", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Reda Wardi", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Rémi Picquette", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Ultan Dillane", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 20, name: "Thomas Berjon", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Pierre Popelin", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Jules Favre", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Georges-Henri Colombe", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - La Rochelle (J14, 31/12/2022) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 14, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Pierre-Baptiste", "Nuchy");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      halfTimeUsap: 3,
      halfTimeOpponent: 22,
      videoUrl: "https://www.youtube.com/watch?v=FfweA81mj70",
      // USAP : 1E + 1T + 1P = 5+2+3 = 10
      triesUsap: 1, conversionsUsap: 1, penaltiesUsap: 1, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // La Rochelle : 5E + 2T = 25+4 = 29
      triesOpponent: 5, conversionsOpponent: 2, penaltiesOpponent: 0, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Défaite à domicile pour la Saint-Sylvestre. McIntyre ouvre le score sur pénalité " +
        "(17', 3-0) mais La Rochelle déroule : Thomas E (21', T Hastoy, 3-7), Leyds E " +
        "(22', 3-12), Kerr-Barlow E (27', 3-17), Thomas double (35', 3-22). " +
        "Acébès exclu pour un coup de tête sur Danty (39', carton rouge). Mi-temps : 3-22. " +
        "À 14 contre 15, l'USAP montre du caractère : Fa'asalele E (47', T McIntyre, 10-22). " +
        "Mais Boudehent scelle le match en contre (78', T, 10-29). " +
        "Bonus offensif La Rochelle (5 essais). L'USAP termine lanterne rouge.",
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
    let redCard = false, redCardMin: number | null = null;
    const isCaptain = (p as any).isCaptain ?? false;

    // Fa'asalele : 1E (47') = 5 pts
    if (p.lastName === "Fa'asalele") { tries = 1; totalPoints = 5; }
    // McIntyre : 1T (47') + 1P (17') = 2+3 = 5 pts
    if (p.lastName === "McIntyre") { conversions = 1; penalties = 1; totalPoints = 5; }
    // Acébès : CR (39')
    if (p.lastName === "Acébès") { redCard = true; redCardMin = 39; }
    // Ecochard : CJ (78')
    if (p.lastName === "Ecochard") { yellowCard = true; yellowCardMin = 78; }
    // Tilsley : CJ (79')
    if (p.lastName === "Tilsley") { yellowCard = true; yellowCardMin = 79; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard, yellowCardMin: yellowCardMin ?? null,
        redCard, redCardMin: redCardMin ?? null,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const card = redCard ? `(CR ${redCardMin}')` : yellowCard ? `(CJ ${yellowCardMin}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", isCaptain ? "(C)" : "", card, sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // Composition La Rochelle
  console.log("\n--- Composition Stade Rochelais ---");
  for (const p of OPP_SQUAD) {
    await prisma.matchPlayer.create({
      data: { matchId: match.id, isOpponent: true, opponentPlayerName: p.name, shirtNumber: p.num, isStarter: p.isStarter, isCaptain: (p as any).isCaptain ?? false, positionPlayed: p.position },
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
    { minute: 17, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 3-0." },
    { minute: 21, type: "ESSAI", isUsap: false, description: "Essai de Teddy Thomas (La Rochelle). 3-5." },
    { minute: 21, type: "TRANSFORMATION", isUsap: false, description: "Transformation d'Antoine Hastoy (La Rochelle). 3-7." },
    { minute: 22, type: "ESSAI", isUsap: false, description: "Essai de Dillyn Leyds (La Rochelle). Non transformé. 3-12." },
    { minute: 27, type: "ESSAI", isUsap: false, description: "Essai de Tawera Kerr-Barlow (La Rochelle). Non transformé. 3-17." },
    { minute: 35, type: "ESSAI", isUsap: false, description: "Essai de Teddy Thomas (La Rochelle), doublé. Non transformé. 3-22." },
    { minute: 39, type: "CARTON_ROUGE", playerLastName: "Acébès", isUsap: true, description: "Carton rouge Mathieu Acébès (USAP) pour coup de tête sur Jonathan Danty." },
    // === MI-TEMPS : USAP 3 - 22 La Rochelle ===
    // === 2e MI-TEMPS ===
    { minute: 47, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Uini Atonio (La Rochelle)." },
    { minute: 47, type: "ESSAI", playerLastName: "Fa'asalele", isUsap: true, description: "Essai de Piula Fa'asalele (USAP). 8-22." },
    { minute: 47, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 10-22." },
    { minute: 78, type: "CARTON_JAUNE", playerLastName: "Ecochard", isUsap: true, description: "Carton jaune Tom Ecochard (USAP)." },
    { minute: 78, type: "ESSAI", isUsap: false, description: "Essai de Paul Boudehent (La Rochelle) en contre. 10-27." },
    { minute: 78, type: "TRANSFORMATION", isUsap: false, description: "Transformation (La Rochelle). 10-29." },
    { minute: 79, type: "CARTON_JAUNE", playerLastName: "Tilsley", isUsap: true, description: "Carton jaune George Tilsley (USAP)." },
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
    const side = evt.isUsap ? "USAP" : "SR";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 10 - 29 La Rochelle (domicile)");
  console.log("  Mi-temps : USAP 3 - 22 La Rochelle");
  console.log("  Arbitre : Pierre-Baptiste Nuchy");
  console.log("  Fa'asalele 5 pts (1E), McIntyre 5 pts (1T + 1P)");
  console.log("  La Rochelle : Thomas ×2, Leyds, Kerr-Barlow, Boudehent (5E + 2T = 29)");
  console.log("  CR : Acébès (39') — CJ : Atonio (47' LR), Ecochard (78'), Tilsley (79')");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

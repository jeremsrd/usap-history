/**
 * Mise à jour du match USAP - Stade Français (J16 Top 14, 28/01/2023)
 * Score : USAP 31 - Stade Français 24
 *
 * Victoire cruciale pour le maintien ! Halanukonuka sort sur blessure dès la 14'.
 * Segonds P (6', 0-3), McIntyre E (12', T, 7-3), Segonds P (18', 7-6),
 * McIntyre P (24', 10-6), Segonds DG (32', 10-9), Ward E (37', 10-14).
 * CJ Chapuis (41'). Tilsley E (41', T McIntyre, 17-14). Mi-temps : 17-14.
 * Fa'asalele E (46', T McIntyre, 24-14). CJ Hirigoyen (54').
 * Mamea Lemalu E (55', T McIntyre, 31-14).
 * Etien E (60', 31-19). Essai refusé SF (66'). CR Tilsley (68').
 * Tui E (74', 31-24). L'USAP tient à 14 !
 *
 * Essais USAP : McIntyre (12'), Tilsley (41'), Fa'asalele (46'), Mamea Lemalu (55')
 * Transformations USAP : McIntyre ×4 (12', 41', 46', 55')
 * Pénalité USAP : McIntyre (24')
 * Essais SF : Ward (37'), Etien (60'), Tui (74')
 * Pénalités SF : Segonds (6', 18')
 * Drop SF : Segonds (32')
 * CJ : Chapuis (41', SF), Hirigoyen (54', SF)
 * CR : Tilsley (68', USAP)
 *
 * Sources : allrugby.com, itsrugby.fr, francebleu.fr, top14.lnr.fr, eurosport.fr
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j16.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 3, firstName: "Siosiua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 14, subOut: 14 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 72, subOut: 72 },
  { num: 5, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Brad", lastName: "Shields", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 7, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 66, subOut: 66 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 61, subOut: 61 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Ali", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "George", lastName: "Tilsley", position: Position.AILIER, isStarter: true, minutesPlayed: 68 },
  { num: 15, firstName: "Tristan", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 18, firstName: "Andrei", lastName: "Mahu", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 8, subIn: 72 },
  { num: 19, firstName: "Posolo", lastName: "Tuilagi", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 20, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 14, subIn: 66 },
  { num: 21, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 19, subIn: 61 },
  { num: 22, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: false, minutesPlayed: 0 },
  { num: 23, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 66, subIn: 14 },
];

// === COMPOSITION STADE FRANÇAIS (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Clément Castets", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Mickaël Ivaldi", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Giorgi Melikidze", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Marcos Kremer", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Sitaleki Timani", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Romain Briatte", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Ryan Chapuis", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Giovanni Habel-Küffner", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "James Hall", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Joris Segonds", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Lester Etien", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Alex Arrate", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Jeremy Ward", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Sione Tui", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Léo Barré", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Lucas Peyresblanques", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Moses Alo-Emile", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Juan Martín Scelzo", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Mathieu Hirigoyen", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Morgan Parra", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Paolo Odogwu", position: Position.CENTRE, isStarter: false },
  { num: 22, name: "Kylan Hamdaoui", position: Position.ARRIERE, isStarter: false },
  { num: 23, name: "Paul Alo-Emile", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Stade Français (J16, 28/01/2023) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 16, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Pierre", "Brousset");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      halfTimeUsap: 17,
      halfTimeOpponent: 14,
      videoUrl: null,
      // USAP : 4E + 4T + 1P = 20+8+3 = 31
      triesUsap: 4, conversionsUsap: 4, penaltiesUsap: 1, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Stade Français : 3E + 0T + 2P + 1DG = 15+0+6+3 = 24
      triesOpponent: 3, conversionsOpponent: 0, penaltiesOpponent: 2, dropGoalsOpponent: 1, penaltyTriesOpponent: 0,
      report:
        "Victoire cruciale pour le maintien face au Stade Français (2e) ! " +
        "Halanukonuka sort sur blessure dès la 14', remplacé par Joly. " +
        "Segonds ouvre sur P (6', 0-3). McIntyre réplique par un essai transformé (12', 7-3). " +
        "Segonds P (18', 7-6). McIntyre P (24', 10-6). Segonds DG (32', 10-9). " +
        "Ward E pour le SF (37', 10-14). CJ Chapuis (41'). " +
        "Tilsley marque juste avant la pause (41', T McIntyre, 17-14). " +
        "L'USAP accélère en 2e mi-temps : Fa'asalele E (46', T McIntyre, 24-14), " +
        "CJ Hirigoyen (54'), puis Mamea Lemalu E (55', T McIntyre, 31-14). " +
        "Etien réduit l'écart (60', 31-19). Essai refusé au SF à la 66' malgré " +
        "l'aplatissement d'Hirigoyen (touche contestée). CR Tilsley (68'). " +
        "Tui E (74', 31-24). L'USAP tient à 14 contre 15 !",
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

    // McIntyre : 1E (12') + 4T (12', 41', 46', 55') + 1P (24') = 5+8+3 = 16 pts
    if (p.lastName === "McIntyre") { tries = 1; conversions = 4; penalties = 1; totalPoints = 16; }
    // Tilsley : 1E (41') = 5 pts + CR (68')
    if (p.lastName === "Tilsley") { tries = 1; totalPoints = 5; redCard = true; redCardMin = 68; }
    // Fa'asalele : 1E (46') = 5 pts
    if (p.lastName === "Fa'asalele") { tries = 1; totalPoints = 5; }
    // Mamea Lemalu : 1E (55') = 5 pts
    if (p.lastName === "Mamea Lemalu") { tries = 1; totalPoints = 5; }

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

  // Composition Stade Français
  console.log("\n--- Composition Stade Français Paris ---");
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
    { minute: 6, type: "PENALITE", isUsap: false, description: "Pénalité de Joris Segonds (Stade Français). 0-3." },
    { minute: 12, type: "ESSAI", playerLastName: "McIntyre", isUsap: true, description: "Essai de Jake McIntyre (USAP). 5-3." },
    { minute: 12, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 7-3." },
    { minute: 18, type: "PENALITE", isUsap: false, description: "Pénalité de Joris Segonds (Stade Français). 7-6." },
    { minute: 24, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 10-6." },
    { minute: 32, type: "DROP", isUsap: false, description: "Drop de Joris Segonds (Stade Français). 10-9." },
    { minute: 37, type: "ESSAI", isUsap: false, description: "Essai de Jeremy Ward (Stade Français). Non transformé. 10-14." },
    { minute: 41, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Ryan Chapuis (Stade Français)." },
    { minute: 41, type: "ESSAI", playerLastName: "Tilsley", isUsap: true, description: "Essai de George Tilsley (USAP). 15-14." },
    { minute: 41, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 17-14." },
    // === MI-TEMPS : USAP 17 - 14 Stade Français ===
    // === 2e MI-TEMPS ===
    { minute: 46, type: "ESSAI", playerLastName: "Fa'asalele", isUsap: true, description: "Essai de Piula Fa'asalele (USAP). 22-14." },
    { minute: 46, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 24-14." },
    { minute: 54, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Mathieu Hirigoyen (Stade Français)." },
    { minute: 55, type: "ESSAI", playerLastName: "Mamea Lemalu", isUsap: true, description: "Essai de Genesis Mamea Lemalu (USAP). 29-14." },
    { minute: 55, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true, description: "Transformation de Jake McIntyre (USAP). 31-14." },
    { minute: 60, type: "ESSAI", isUsap: false, description: "Essai de Lester Etien (Stade Français). Non transformé. 31-19." },
    { minute: 68, type: "CARTON_ROUGE", playerLastName: "Tilsley", isUsap: true, description: "Carton rouge George Tilsley (USAP). USAP à 14." },
    { minute: 74, type: "ESSAI", isUsap: false, description: "Essai de Sione Tui (Stade Français). Non transformé. 31-24." },
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
    const side = evt.isUsap ? "USAP" : "SF";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 31 - 24 Stade Français (domicile)");
  console.log("  Mi-temps : USAP 17 - 14 Stade Français");
  console.log("  Arbitre : Pierre Brousset");
  console.log("  McIntyre 16 pts (1E + 4T + 1P), Tilsley 5 pts (1E), Fa'asalele 5 pts (1E), Mamea Lemalu 5 pts (1E)");
  console.log("  SF : Ward, Etien, Tui (3E + 0T + 2P + 1DG = 24)");
  console.log("  CJ : Chapuis (41' SF), Hirigoyen (54' SF) — CR : Tilsley (68' USAP)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

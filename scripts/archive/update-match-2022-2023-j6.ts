/**
 * Mise à jour du match Stade Français - USAP (J6 Top 14, 08/10/2022)
 * Score : Stade Français 52 - USAP 3
 *
 * Lourde défaite au Stade Jean-Bouin. Mahu blessé dès la 5', l'USAP
 * encaisse 3 essais en 19 minutes (Naivalu 4', Melikidze 9', Barré 19').
 * Carton rouge de Velarte (21', entré 14' pour Witty) : l'USAP joue à 14
 * pendant près de 60 minutes. Macalou (30') et Gabrillagues (40') aggravent :
 * 35-3 à la pause. En 2e MT : Hamdaoui (46'), van der Mescht (64', 70').
 * Seul McIntyre sauve l'honneur (pénalité, 7').
 * Plus large défaite de la saison (49 points d'écart).
 *
 * Essai USAP : aucun
 * Pénalité USAP : McIntyre (7')
 * Essais SFP : Naivalu (4'), Melikidze (9'), Barré (19'), Macalou (30'),
 *   Gabrillagues (40'), Hamdaoui (46'), van der Mescht (64', 70')
 * Transformations SFP : Barré ×6
 * CR : Velarte (21', USAP)
 *
 * Sources : itsrugby.fr (compositions, stats), allrugby.com (arbitres),
 *   top14.lnr.fr (feuille de match), francebleu.fr (résumé)
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j6.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 3, firstName: "Siosiua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 41, subOut: 41 },
  { num: 4, firstName: "Will", lastName: "Witty", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 14, subOut: 14 },
  { num: 5, firstName: "Andrei", lastName: "Mahu", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 5, subOut: 5 },
  { num: 6, firstName: "Tristan", lastName: "Labouteley", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Théo", lastName: "Forner", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  // Remplaçants
  { num: 16, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 39, subIn: 41 },
  { num: 19, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 75, subIn: 5 },
  { num: 20, firstName: "Lucas", lastName: "Velarte", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 7, subIn: 14, redCard: true, redCardMin: 21 },
  { num: 21, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 22, firstName: "Tristan", lastName: "Tedder", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 23, firstName: "Brayden", lastName: "Wiliame", position: Position.CENTRE, isStarter: false, minutesPlayed: 29, subIn: 51 },
];

// === COMPOSITION STADE FRANÇAIS (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Clément Castets", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Mickaël Ivaldi", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Giorgi Melikidze", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Paul Gabrillagues", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Baptiste Pesenti", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Romain Briatte", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Sekou Macalou", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Giovanni Habel-Kuffner", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Arthur Coville", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Léo Barré", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Lester Etien", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Julien Delbouis", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Sefanaia Naivalu", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Nadir Megdoud", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Kylan Hamdaoui", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Lucas Peyresblanques", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Sergo Abramishvili", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Nemo Roelofse", position: Position.PILIER_DROIT, isStarter: false },
  { num: 19, name: "JJ van der Mescht", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 20, name: "Marcos Kremer", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, name: "James Hall", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Jeremy Ward", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Mathieu Hirigoyen", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
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
  console.log("=== Mise à jour match Stade Français - USAP (J6, 08/10/2022) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 6, competition: { shortName: "Top 14" } },
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
      kickoffTime: "17:00",
      refereeId,
      halfTimeUsap: 3,
      halfTimeOpponent: 35,
      videoUrl: "https://www.youtube.com/watch?v=ynq9GGn5n2k",
      // USAP : 0E + 0T + 1P = 3
      triesUsap: 0, conversionsUsap: 0, penaltiesUsap: 1, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // SFP : 8E + 6T + 0P = 40+12 = 52
      triesOpponent: 8, conversionsOpponent: 6, penaltiesOpponent: 0, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Lourde défaite au Stade Jean-Bouin. Mahu se blesse dès la 5' (remplacé par Eru). " +
        "Le Stade Français enfonce le clou d'entrée : Naivalu (4'), Melikidze (9'), Barré (19'), " +
        "trois essais transformés en 19 minutes (21-3). Carton rouge de Velarte (21', entré à la 14' " +
        "pour Witty) : l'USAP joue à 14 pendant près de 60 minutes. Macalou (30') et Gabrillagues (40') " +
        "portent le score à 35-3 à la pause, tous les essais transformés par Barré. " +
        "En seconde mi-temps, Hamdaoui (46', transformé) puis van der Mescht par deux fois (64', 70', " +
        "non transformés) achèvent la correction. Seule la pénalité de McIntyre (7') sauve l'honneur. " +
        "Score final : 52-3, plus large défaite de la saison (49 points d'écart).",
    },
  });
  console.log("  Match mis à jour");

  // Composition USAP
  console.log("\n--- Composition USAP ---");
  const deleted = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);
    let penalties = 0, totalPoints = 0;
    const isCaptain = (p as any).isCaptain ?? false;
    const hasRedCard = (p as any).redCard ?? false;
    const redCardMin = (p as any).redCardMin ?? null;

    // McIntyre : 1P = 3 pts
    if (p.lastName === "McIntyre") { penalties = 1; totalPoints = 3; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries: 0, conversions: 0, penalties, totalPoints,
        yellowCard: false, yellowCardMin: null,
        redCard: hasRedCard, redCardMin,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const red = hasRedCard ? `(CR ${redCardMin}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", isCaptain ? "(C)" : "", red, sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
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
    { minute: 4, type: "ESSAI", isUsap: false, description: "Essai de Sefanaia Naivalu (Stade Français). 5-0." },
    { minute: 4, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Léo Barré (Stade Français). 7-0." },
    { minute: 7, type: "PENALITE", playerLastName: "McIntyre", isUsap: true, description: "Pénalité de Jake McIntyre (USAP). 7-3." },
    { minute: 9, type: "ESSAI", isUsap: false, description: "Essai de Giorgi Melikidze (Stade Français). 12-3." },
    { minute: 9, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Léo Barré (Stade Français). 14-3." },
    { minute: 19, type: "ESSAI", isUsap: false, description: "Essai de Léo Barré (Stade Français). 19-3." },
    { minute: 19, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Léo Barré (Stade Français). 21-3." },
    { minute: 21, type: "CARTON_ROUGE", playerLastName: "Velarte", isUsap: true, description: "Carton rouge de Lucas Velarte (USAP). L'USAP réduit à 14." },
    { minute: 30, type: "ESSAI", isUsap: false, description: "Essai de Sekou Macalou (Stade Français). 26-3." },
    { minute: 30, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Léo Barré (Stade Français). 28-3." },
    { minute: 40, type: "ESSAI", isUsap: false, description: "Essai de Paul Gabrillagues (Stade Français). 33-3." },
    { minute: 40, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Léo Barré (Stade Français). 35-3." },
    // === MI-TEMPS : Stade Français 35 - 3 USAP ===
    // === 2e MI-TEMPS ===
    { minute: 46, type: "ESSAI", isUsap: false, description: "Essai de Kylan Hamdaoui (Stade Français). 40-3." },
    { minute: 46, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Léo Barré (Stade Français). 42-3." },
    { minute: 64, type: "ESSAI", isUsap: false, description: "Essai de JJ van der Mescht (Stade Français). Non transformé. 47-3." },
    { minute: 70, type: "ESSAI", isUsap: false, description: "Essai de JJ van der Mescht (Stade Français). Non transformé. 52-3." },
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
    const side = evt.isUsap ? "USAP" : "SFP";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Stade Français 52 - 3 USAP (extérieur)");
  console.log("  Mi-temps : Stade Français 35 - 3 USAP");
  console.log("  Arbitre : Adrien Marbot");
  console.log("  McIntyre 3 pts (1P)");
  console.log("  CR : Velarte (21', USAP)");
  console.log("  SFP : 8E (Naivalu, Melikidze, Barré, Macalou, Gabrillagues, Hamdaoui, van der Mescht ×2) + 6T Barré");
  console.log("  Plus large défaite de la saison (49 pts d'écart)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

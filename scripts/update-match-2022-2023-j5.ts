/**
 * Mise à jour du match USAP - Castres (J5 Top 14, 01/10/2022)
 * Score : USAP 14 - Castres 10
 *
 * Deuxième victoire consécutive à Aimé-Giral ! L'USAP domine la 1re MT
 * (14-0 à la pause). Tedder 3 pénalités (7', 23', 30') et essai de
 * Taumoepeau (39', non transformé, en supériorité après CJ Babillot 35').
 * Castres revient en 2e MT (Dumora P 54', Cocagi E 59' + Dumora T).
 * Nakosi manque l'essai de la victoire sur la dernière action, stoppé
 * par Goutard (entré à la 76').
 *
 * Essai USAP : Taumoepeau (39')
 * Pénalités USAP : Tedder (7', 23', 30')
 * Essai Castres : Cocagi (59')
 * CJ : Babillot (35', Castres)
 *
 * Sources : top14.lnr.fr (compositions, arbitres), itsrugby.fr (score par minute),
 *   allrugby.com (évolution score), francebleu.fr (résumé)
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j5.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 3, firstName: "Siosiua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 4, firstName: "Will", lastName: "Witty", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 53, subOut: 53 },
  { num: 5, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 48, subOut: 48 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 48, subOut: 48 },
  { num: 8, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 10, firstName: "Tristan", lastName: "Tedder", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 76, subOut: 76 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 76, subOut: 76 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Alivereti", lastName: "Duguivalu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Lucas", lastName: "Dubois", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 17, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 32, subIn: 48 },
  { num: 18, firstName: "Shahn", lastName: "Eru", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 32, subIn: 48 },
  { num: 19, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 27, subIn: 53 },
  { num: 20, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 21, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: false, minutesPlayed: 4, subIn: 76 },
  { num: 22, firstName: "George", lastName: "Tilsley", position: Position.CENTRE, isStarter: false, minutesPlayed: 4, subIn: 76 },
  { num: 23, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 29, subIn: 51 },
];

// === COMPOSITION CASTRES (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Quentin Walcker", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Paula Ngauamo", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Aurélien Azar", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Gauthier Maravat", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Florent Vanverberghe", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Mathieu Babillot", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Nick Champion de Crespigny", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Leone Nakarawa", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Santiago Arata", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Louis Le Brun", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Filipo Nakosi", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Vilimoni Botitu", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Thomas Combezou", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Thomas Larregain", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Julien Dumora", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Gaëtan Barlot", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Wayan de Benedittis", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Wilfrid Hounkpatin", position: Position.PILIER_DROIT, isStarter: false },
  { num: 19, name: "Asier Usarraga", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 20, name: "Tom Staniforth", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 21, name: "Baptiste Delaporte", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Adréa Cocagi", position: Position.AILIER, isStarter: false },
  { num: 23, name: "Gauthier Doubrère", position: Position.CENTRE, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Castres (J5, 01/10/2022) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 5, competition: { shortName: "Top 14" } },
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
      halfTimeUsap: 14,
      halfTimeOpponent: 0,
      // USAP : 1E + 0T + 3P = 5+0+9 = 14
      triesUsap: 1, conversionsUsap: 0, penaltiesUsap: 3, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Castres : 1E + 1T + 1P = 5+2+3 = 10
      triesOpponent: 1, conversionsOpponent: 1, penaltiesOpponent: 1, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Deuxième victoire consécutive à Aimé-Giral ! L'USAP domine la 1re mi-temps. " +
        "Tedder ouvre le score (pénalité, 7') puis creuse l'écart (23', 30', 9-0). " +
        "Carton jaune Babillot (35') : Taumoepeau en profite pour marquer l'essai (39', non transformé, 14-0). " +
        "Mi-temps : 14-0. Castres effectue 6 changements dès la 44' et revient : " +
        "Dumora réduit le score (pénalité, 54', 14-3), puis Cocagi marque l'essai (59', transformé par Dumora, 14-10). " +
        "Fin de match sous pression castraise. Sur la dernière action, Nakosi manque l'essai " +
        "de la victoire, stoppé in extremis par Goutard (entré à la 76'). Score final : 14-10.",
    },
  });
  console.log("  Match mis à jour");

  // Composition USAP
  console.log("\n--- Composition USAP ---");
  const deleted = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);
    let tries = 0, penalties = 0, totalPoints = 0;
    const isCaptain = (p as any).isCaptain ?? false;

    // Tedder : 3P = 9 pts
    if (p.lastName === "Tedder") { penalties = 3; totalPoints = 9; }
    // Taumoepeau : 1E = 5 pts
    if (p.lastName === "Taumoepeau") { tries = 1; totalPoints = 5; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions: 0, penalties, totalPoints,
        yellowCard: false, yellowCardMin: null,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", isCaptain ? "(C)" : "", sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
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
    { minute: 7, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 3-0." },
    { minute: 23, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 6-0." },
    { minute: 30, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 9-0." },
    { minute: 35, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Mathieu Babillot (Castres)." },
    { minute: 39, type: "ESSAI", playerLastName: "Taumoepeau", isUsap: true, description: "Essai d'Afusipa Taumoepeau (USAP). En supériorité numérique. Non transformé. 14-0." },
    // === MI-TEMPS : USAP 14 - 0 Castres ===
    // === 2e MI-TEMPS ===
    { minute: 54, type: "PENALITE", isUsap: false, description: "Pénalité de Julien Dumora (Castres). 14-3." },
    { minute: 59, type: "ESSAI", isUsap: false, description: "Essai d'Adréa Cocagi (Castres). 14-8." },
    { minute: 59, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Julien Dumora (Castres). 14-10." },
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
  console.log("  Score : USAP 14 - 10 Castres (domicile)");
  console.log("  Mi-temps : USAP 14 - 0 Castres");
  console.log("  Arbitre : Pierre Brousset");
  console.log("  Tedder 9 pts (3P), Taumoepeau 1E (5 pts)");
  console.log("  CJ : Babillot (35', Castres)");
  console.log("  2e victoire consécutive !");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

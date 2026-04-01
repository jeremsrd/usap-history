/**
 * Mise à jour du match USAP - CA Brive (J2 Top 14, 10/09/2022)
 * Score : USAP 6 - Brive 17
 *
 * Défaite à domicile, première victoire de Brive à Perpignan depuis 1971.
 * L'USAP n'inscrit aucun essai. Tedder marque 2 pénalités (14', 23').
 * Brive s'impose grâce à 3 essais : Jurand (18'), Van Eerten (38', remplaçant
 * entré dès la 5' pour Paulos sur protocole commotion) et Sanga (78').
 *
 * Essais Brive : Jurand (18'), Van Eerten (38'), Sanga (78')
 * Pénalités USAP : Tedder (14', 23')
 * CJ : Ratuva (65', Brive)
 *
 * Sources : top14.lnr.fr (compositions, arbitres), itsrugby.fr (score par minute),
 *   allezbriverugby.com (résumé détaillé), francebleu.fr (contexte)
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j2.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 3, firstName: "Siosiua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Andrei", lastName: "Mahu", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Piula", lastName: "Fa'asalele", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 58, subOut: 58 },
  { num: 10, firstName: "Tristan", lastName: "Tedder", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 65, subOut: 65 },
  { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 12, firstName: "Brayden", lastName: "Wiliame", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Alivereti", lastName: "Duguivalu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Lucas", lastName: "Dubois", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 18, firstName: "Victor", lastName: "Moreaux", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 19, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 20, firstName: "Taniela", lastName: "Ramasibana", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 0 },
  { num: 21, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 22, subIn: 58 },
  { num: 22, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 15, subIn: 65 },
  { num: 23, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 0 },
];

// === COMPOSITION BRIVE (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Wesley Tapueluelu", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Motu Matu'u", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Pietro Ceccarelli", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Tevita Ratuva", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Lucas Paulos", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Esteban Abadie", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Sasha Gue", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Abraham Papali'i", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Vasil Lobzhanidze", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Stuart Olding", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Joris Jurand", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Sammy Arnold", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Nico Lee", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Setariki Tuicuvu", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Thomas Laranjeira", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Vano Karkadze", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 17, name: "Nathan Fraissenon", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Renger Van Eerten", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Matthieu Voisin", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Enzo Sanga", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, name: "Enzo Hervé", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Guillaume Galletier", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 23, name: "Luka Japaridze", position: Position.TALONNEUR, isStarter: false },
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
  console.log("=== Mise à jour match USAP - CA Brive (J2, 10/09/2022) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 2, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Luc", "Ramos");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      halfTimeUsap: 6,
      halfTimeOpponent: 12,
      videoUrl: "https://www.dailymotion.com/video/x8dmmla",
      // USAP : 0E + 2P = 6
      triesUsap: 0, conversionsUsap: 0, penaltiesUsap: 2, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Brive : 3E + 1T = 15+2 = 17
      triesOpponent: 3, conversionsOpponent: 1, penaltiesOpponent: 0, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Défaite à domicile face à Brive, qui s'impose à Perpignan pour la première fois depuis 1971. " +
        "L'USAP ouvre le score par Tedder (pénalité, 14') mais Jurand réplique côté briviste (essai non transformé, 18'). " +
        "Tedder remet l'USAP devant (pénalité, 23', 6-5). Mais Brive prend le large avant la pause : " +
        "Van Eerten, entré dès la 5' pour Paulos (protocole commotion), marque en 2e ligne (38', transformé par Laranjeira). " +
        "Mi-temps : 6-12. En 2e MT, l'USAP ne parvient pas à inscrire d'essai malgré la domination territoriale. " +
        "Carton jaune Ratuva (65') mais Brive tient bon. Sanga enfonce le clou à la 78' (essai non transformé). " +
        "Score final : 6-17. Soirée frustrante pour les Catalans.",
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

    // Tedder : 2P = 6 pts
    if (p.lastName === "Tedder") { penalties = 2; totalPoints = 6; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries: 0, conversions: 0, penalties, totalPoints,
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

  // Composition Brive
  console.log("\n--- Composition CA Brive ---");
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
    { minute: 14, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 3-0." },
    { minute: 18, type: "ESSAI", isUsap: false, description: "Essai de Joris Jurand (Brive). Non transformé. 3-5." },
    { minute: 23, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 6-5." },
    { minute: 38, type: "ESSAI", isUsap: false, description: "Essai de Renger Van Eerten (Brive). Entré dès la 5' sur protocole commotion de Paulos. 6-10." },
    { minute: 39, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Thomas Laranjeira (Brive). 6-12." },
    // === MI-TEMPS : USAP 6 - 12 Brive ===
    // === 2e MI-TEMPS ===
    { minute: 65, type: "CARTON_JAUNE", isUsap: false, description: "Carton jaune Tevita Ratuva (Brive). Hors-jeu volontaire." },
    { minute: 78, type: "ESSAI", isUsap: false, description: "Essai d'Enzo Sanga (Brive). Non transformé. 6-17. Score final." },
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
    const side = evt.isUsap ? "USAP" : "BRIVE";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 6 - 17 CA Brive (domicile)");
  console.log("  Mi-temps : USAP 6 - 12 Brive");
  console.log("  Arbitre : Luc Ramos");
  console.log("  Tedder 6 pts (2P)");
  console.log("  Brive : 3 essais (Jurand, Van Eerten, Sanga)");
  console.log("  1re victoire de Brive à Perpignan depuis 1971");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

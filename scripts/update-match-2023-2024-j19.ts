/**
 * Mise à jour du match Oyonnax - USAP (J19 Top 14, 23/03/2024)
 * Score : Oyonnax 14 - 15 USAP
 *
 * Victoire arrachée d'un point à Charles-Mathon ! L'USAP est menée
 * 14-8 à la pause après 2 essais d'Oyonnax. L'essai décisif de
 * Crossdale (53') après une course de 30m éliminant 5 défenseurs
 * offre la victoire aux Catalans. Lam, Tuilagi et Allan blessés.
 *
 * Essais USAP : Veredamu (14'), Crossdale (53')
 * Essais Oyonnax : Durand (12'), Godener (17')
 * CJ : Vaotoa (33', Oyonnax)
 *
 * Sources : top14.lnr.fr (compositions), itsrugby.fr (marqueurs),
 *   allrugby.com (arbitre Pierre Brousset), francebleu.fr (résumé)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j19.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 40, subOut: 40 },
  { num: 3, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 56, subOut: 56 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 6, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Alistair", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: true, minutesPlayed: 70, subOut: 70 },
  // Remplaçants
  { num: 16, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 40, subIn: 40 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 19, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 20, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 0 },
  { num: 21, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 22, firstName: "Mathieu", lastName: "Acebes", position: Position.CENTRE, isStarter: false, minutesPlayed: 10, subIn: 70 },
  { num: 23, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 24, subIn: 56 },
];

// === COMPOSITION OYONNAX (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Tommy Raynaud", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Teddy Durand", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Christopher Vaotoa", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Phoenix Battye", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Ewan Johnson", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Kevin Lebreton", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Loïc Crédoz", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Loïc Godener", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Charlie Cassang", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Domingo Miotti", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Enzo Reybier", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Théo Millet", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Chris Farrell", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Gavin Stark", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Justin Bouraux", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Tom Gélédan", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Pierre Bordenave", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Stéphane Lebas", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Sione Mafi", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Amine El Khattabi", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Lucas Mensa", position: Position.CENTRE, isStarter: false },
  { num: 22, name: "Darren Sweetnam", position: Position.AILIER, isStarter: false },
  { num: 23, name: "Beka Mirtskhulava", position: Position.PILIER_DROIT, isStarter: false },
];

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

async function findOrCreatePlayer(
  firstName: string,
  lastName: string,
  position: Position,
): Promise<string> {
  const existing = await prisma.player.findFirst({
    where: {
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
  });
  if (existing) return existing.id;

  const player = await prisma.player.create({
    data: {
      firstName,
      lastName,
      position,
      isActive: false,
      slug: `temp-${Date.now()}-${Math.random()}`,
    },
  });
  await prisma.player.update({
    where: { id: player.id },
    data: { slug: generatePlayerSlug(firstName, lastName, player.id) },
  });
  console.log(`  [joueur] Créé : ${firstName} ${lastName}`);
  return player.id;
}

async function findOrCreateReferee(
  firstName: string,
  lastName: string,
): Promise<string> {
  const existing = await prisma.referee.findFirst({
    where: {
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
  });
  if (existing) {
    console.log(`  [arbitre] Existe : ${firstName} ${lastName}`);
    return existing.id;
  }
  const referee = await prisma.referee.create({
    data: {
      firstName,
      lastName,
      slug: `temp-${Date.now()}`,
    },
  });
  await prisma.referee.update({
    where: { id: referee.id },
    data: { slug: generateRefereeSlug(firstName, lastName, referee.id) },
  });
  console.log(`  [arbitre] Créé : ${firstName} ${lastName}`);
  return referee.id;
}

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log("=== Mise à jour match Oyonnax - USAP (J19, 23/03/2024) ===\n");

  // 1. Trouver le match
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 19, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // 2. Arbitre
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Pierre", "Brousset");

  // 3. Mettre à jour les infos générales du match
  console.log("\n--- Match (infos générales) ---");

  const venue = await prisma.venue.findFirst({ where: { name: { contains: "Mathon" } } });

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      venueId: venue?.id ?? undefined,
      // Mi-temps (Oyonnax menait 14-8)
      halfTimeUsap: 8,
      halfTimeOpponent: 14,
      // Détail scoring USAP : 2E + 1T + 1P = 10+2+3 = 15
      triesUsap: 2,
      conversionsUsap: 1,
      penaltiesUsap: 1,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Oyonnax : 2E + 2T = 10+4 = 14
      triesOpponent: 2,
      conversionsOpponent: 2,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Victoire arrachée d'un point à Charles-Mathon dans un match de la peur ! " +
        "Oyonnax ouvre le score par Durand (12') et Godener (17') pour mener 14-5. " +
        "Veredamu avait réduit l'écart (14') mais l'USAP ne parvient qu'à inscrire " +
        "une pénalité d'Allan avant la pause (14-8). " +
        "En 2e MT, l'USAP pousse mais c'est Crossdale qui délivre les Catalans " +
        "à la 53e : course de 30 mètres, 5 défenseurs éliminés, essai de folie ! " +
        "McIntyre transforme : 14-15. L'USAP tient jusqu'au bout malgré les " +
        "blessures de Lam, Tuilagi et Allan. Victoire capitale pour le maintien.",
    },
  });
  console.log("  Match mis à jour");

  // 4. Composition USAP (23 joueurs)
  console.log("\n--- Composition USAP ---");
  const deleted = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);

    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;

    // Veredamu : 1 essai (14')
    if (p.lastName === "Veredamu") { tries = 1; totalPoints = 5; }
    // Crossdale : 1 essai (53')
    if (p.lastName === "Crossdale") { tries = 1; totalPoints = 5; }
    // Allan : 1 pénalité = 3 pts
    if (p.lastName === "Allan") { penalties = 1; totalPoints = 3; }
    // McIntyre : 1 transformation = 2 pts
    if (p.lastName === "McIntyre") { conversions = 1; totalPoints = 2; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: false,
        positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null,
        subOut: (p as any).subOut ?? null,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [
      totalPoints > 0 ? `(${totalPoints} pts)` : "",
      sub,
      `[${p.minutesPlayed}']`,
    ].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // 5. Composition Oyonnax (adversaire)
  console.log("\n--- Composition Oyonnax ---");

  for (const p of OPP_SQUAD) {
    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        isOpponent: true,
        opponentPlayerName: p.name,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: false,
        positionPlayed: p.position,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.name}`);
  }

  // 6. Liens joueurs-saison
  console.log("\n--- Liens joueurs-saison ---");
  let linkedCount = 0;
  for (const p of USAP_SQUAD) {
    const player = await prisma.player.findFirst({
      where: {
        firstName: { equals: p.firstName, mode: "insensitive" },
        lastName: { equals: p.lastName, mode: "insensitive" },
      },
    });
    if (!player) continue;
    const exists = await prisma.seasonPlayer.findFirst({
      where: { seasonId: season.id, playerId: player.id },
    });
    if (!exists) {
      await prisma.seasonPlayer.create({
        data: { seasonId: season.id, playerId: player.id, position: p.position },
      });
      linkedCount++;
    }
  }
  console.log(`  ${linkedCount} nouveau(x) lien(s) joueur-saison créé(s)`);

  // 7. Événements du match (timeline)
  console.log("\n--- Événements du match ---");
  const deletedEvents = await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
  if (deletedEvents.count > 0) console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events: Array<{
    minute: number;
    type: string;
    playerLastName?: string;
    isUsap: boolean;
    description: string;
  }> = [
    // === PREMIÈRE MI-TEMPS ===
    { minute: 12, type: "ESSAI", isUsap: false,
      description: "Essai de Teddy Durand (Oyonnax). 5-0." },
    { minute: 13, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Domingo Miotti (Oyonnax). 7-0." },
    { minute: 14, type: "ESSAI", playerLastName: "Veredamu", isUsap: true,
      description: "Essai de Tavite Veredamu (USAP). Réponse immédiate. 7-5." },
    { minute: 17, type: "ESSAI", isUsap: false,
      description: "Essai de Loïc Godener (Oyonnax). 12-5." },
    { minute: 18, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Domingo Miotti (Oyonnax). 14-5." },
    { minute: 25, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 14-8." },
    { minute: 33, type: "CARTON_JAUNE", isUsap: false,
      description: "Carton jaune Christopher Vaotoa (Oyonnax). Oyonnax à 14." },

    // === MI-TEMPS : Oyonnax 14 - 8 USAP ===

    // === SECONDE MI-TEMPS ===
    { minute: 53, type: "ESSAI", playerLastName: "Crossdale", isUsap: true,
      description: "Essai d'Alistair Crossdale (USAP) ! Course de 30m, 5 défenseurs éliminés. 14-13." },
    { minute: 54, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true,
      description: "Transformation de Jake McIntyre (USAP). 14-15 ! L'USAP passe devant." },
  ];

  for (const evt of events) {
    let playerId: string | null = null;
    if (evt.isUsap && evt.playerLastName) {
      const player = await prisma.player.findFirst({
        where: { lastName: { equals: evt.playerLastName, mode: "insensitive" } },
      });
      playerId = player?.id ?? null;
    }

    await prisma.matchEvent.create({
      data: {
        matchId: match.id,
        minute: evt.minute,
        type: evt.type as any,
        playerId,
        isUsap: evt.isUsap,
        description: evt.description,
      },
    });

    const side = evt.isUsap ? "USAP" : "OYO";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // Résumé
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Oyonnax 14 - 15 USAP (extérieur)");
  console.log("  Mi-temps : Oyonnax 14 - 8 USAP");
  console.log("  Arbitre : Pierre Brousset");
  console.log("  Stade : Charles-Mathon");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition Oyonnax : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  Essais USAP : Veredamu (14'), Crossdale (53')");
  console.log("  Essai Crossdale : course de 30m, 5 défenseurs éliminés !");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

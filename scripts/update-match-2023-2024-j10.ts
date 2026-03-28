/**
 * Mise à jour du match USAP - Bayonne (J10 Top 14, 22/12/2023)
 * Score : USAP 36 - 10 Bayonne
 *
 * Belle victoire avec bonus offensif à Aimé-Giral avant Noël.
 * 6 essais pour l'USAP, dominatrice dans tous les secteurs.
 * Bayonne très indiscipliné (12 pénalités).
 * Mi-temps : 24-10.
 *
 * Essais USAP : Lam (6'), Allan (14'), Oviedo (29'), McIntyre (35'),
 *   Veredamu (56'), Taumoepeau (68')
 * Essai Bayonne : Paulos (21')
 *
 * Sources : top14.lnr.fr (compositions), itsrugby.fr (stats),
 *   francebleu.fr, sectionpaloise.com (arbitre)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j10.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2023-2024/j10/10318-perpignan-bayonne/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 3, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 4, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 8, firstName: "Joaquin", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 11, firstName: "Alistair", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jeronimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 28, subIn: 52 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 28, subIn: 52 },
  { num: 18, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 19, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 20, firstName: "Ewan", lastName: "Bertheau", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 21, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 22, firstName: "Mathieu", lastName: "Acebes", position: Position.CENTRE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 23, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 28, subIn: 52 },
];

// === COMPOSITION BAYONNE (adversaire) ===
// Source : top14.lnr.fr
const BAY_SQUAD = [
  { num: 1, name: "Matis Perchaud", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Vincent Giudicelli", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Tevita Tatafu", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Thomas Ceyte", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Lucas Paulos", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Pierre Huguet", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Arthur Iturria", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Uzair Cassiem", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Guillaume Rouet", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Camille Lopez", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Nadir Megdoud", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Federico Mori", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Guillaume Martocq", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Aurélien Callandret", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Cheikh Tiberghien", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Thomas Acquier", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Swan Cormenier", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Denis Marchois", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Rémi Bourdeau", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Maxime Machenaud", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Thomas Dolhagaray", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Reece Hodge", position: Position.ARRIERE, isStarter: false },
  { num: 23, name: "Luke Tagi", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Bayonne (J10, 22/12/2023) ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver le match
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 10, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // -------------------------------------------------------------------------
  // 2. Arbitre
  // -------------------------------------------------------------------------
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Luc", "Ramos");

  // -------------------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // -------------------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score : USAP 36 - 10 Bayonne (domicile)
   * Mi-temps : USAP 24 - 10 Bayonne
   *
   * USAP : 6E(Lam 6', Allan 14', Oviedo 29', McIntyre 35',
   *   Veredamu 56', Taumoepeau 68') + 3T(Allan) = 30+6 = 36
   * BAY : 1E(Paulos 21') + 1T(Lopez) + 1P(Lopez 10') = 5+2+3 = 10
   *
   * CJ : Ceyte (35', Bayonne)
   */
  const venue = await prisma.venue.findFirst({ where: { name: { contains: "Giral" } } });

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "21:05",
      refereeId,
      venueId: venue?.id ?? undefined,
      // Mi-temps
      halfTimeUsap: 24,
      halfTimeOpponent: 10,
      // Détail scoring USAP
      triesUsap: 6,
      conversionsUsap: 3,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Bayonne
      triesOpponent: 1,
      conversionsOpponent: 1,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Belle victoire de l'USAP avec bonus offensif à Aimé-Giral avant les fêtes. " +
        "Les Catalans signent 6 essais face à un Bayonne très indiscipliné (12 pénalités). " +
        "Lam ouvre le score dès la 6' sur le premier ballon, Allan enchaîne à la 14'. " +
        "Bayonne répond par Paulos (21') mais Oviedo (29') et McIntyre (35') creusent " +
        "l'écart avant la pause (24-10). En seconde période, Veredamu (56') et " +
        "Taumoepeau (68') scellent le bonus offensif. L'USAP domine malgré seulement " +
        "35% de possession, profitant de chaque erreur bayonnaise.",
    },
  });
  console.log("  Match mis à jour");

  // -------------------------------------------------------------------------
  // 4. Composition USAP (23 joueurs)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition USAP ---");
  const deleted = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);

    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;
    let yellowCard = false, yellowCardMin: number | null = null;

    // Lam : 1 essai (6')
    if (p.lastName === "Lam" && p.num === 2) { tries = 1; totalPoints = 5; }
    // Allan : 1 essai (14') + 3 transformations = 5+6 = 11 pts
    if (p.lastName === "Allan" && p.num === 15) { tries = 1; conversions = 3; totalPoints = 11; }
    // Oviedo : 1 essai (29')
    if (p.lastName === "Oviedo") { tries = 1; totalPoints = 5; }
    // McIntyre : 1 essai (35')
    if (p.lastName === "McIntyre") { tries = 1; totalPoints = 5; }
    // Veredamu : 1 essai (56')
    if (p.lastName === "Veredamu") { tries = 1; totalPoints = 5; }
    // Taumoepeau : 1 essai (68')
    if (p.lastName === "Taumoepeau") { tries = 1; totalPoints = 5; }

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
        yellowCard, yellowCardMin,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null,
        subOut: (p as any).subOut ?? null,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [
      totalPoints > 0 ? `(${totalPoints} pts)` : "",
      yellowCard ? `[CJ ${yellowCardMin}']` : "",
      sub,
      `[${p.minutesPlayed}']`,
    ].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // -------------------------------------------------------------------------
  // 5. Composition Bayonne (adversaire)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition Bayonne ---");

  for (const p of BAY_SQUAD) {
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

  // -------------------------------------------------------------------------
  // 6. Liens joueurs-saison
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 7. Événements du match (timeline)
  // -------------------------------------------------------------------------
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
    // 6' - Essai Lam (USAP) 5-0
    { minute: 6, type: "ESSAI", playerLastName: "Lam", isUsap: true,
      description: "Essai de Seilala Lam (USAP). Premier ballon, premier essai. 5-0." },
    // 7' - Transformation Allan (USAP) 7-0
    { minute: 7, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 7-0." },
    // 10' - Pénalité Lopez (Bayonne) 7-3
    { minute: 10, type: "PENALITE", isUsap: false,
      description: "Pénalité de Camille Lopez (Bayonne). 7-3." },
    // 14' - Essai Allan (USAP) 12-3
    { minute: 14, type: "ESSAI", playerLastName: "Allan", isUsap: true,
      description: "Essai de Tommaso Allan (USAP). 12-3." },
    // 21' - Essai Paulos (Bayonne) 12-8
    { minute: 21, type: "ESSAI", isUsap: false,
      description: "Essai de Lucas Paulos (Bayonne). Percée d'Iturria. 12-8." },
    // 22' - Transformation Lopez (Bayonne) 12-10
    { minute: 22, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Camille Lopez (Bayonne). 12-10." },
    // 29' - Essai Oviedo (USAP) 17-10
    { minute: 29, type: "ESSAI", playerLastName: "Oviedo", isUsap: true,
      description: "Essai de Joaquin Oviedo (USAP). 17-10." },
    // 30' - Transformation Allan (USAP) 19-10
    { minute: 30, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 19-10." },
    // 35' - CJ Ceyte (Bayonne)
    { minute: 35, type: "CARTON_JAUNE", isUsap: false,
      description: "Carton jaune Thomas Ceyte (Bayonne). Bayonne à 14." },
    // 35' - Essai McIntyre (USAP) 24-10
    { minute: 35, type: "ESSAI", playerLastName: "McIntyre", isUsap: true,
      description: "Essai de Jake McIntyre (USAP). 24-10." },

    // === MI-TEMPS : USAP 24 - 10 Bayonne ===

    // === SECONDE MI-TEMPS ===
    // 56' - Essai Veredamu (USAP) 29-10
    { minute: 56, type: "ESSAI", playerLastName: "Veredamu", isUsap: true,
      description: "Essai de Tavite Veredamu (USAP). Orchestré par Crossdale. 29-10." },
    // 68' - Essai Taumoepeau (USAP) 34-10
    { minute: 68, type: "ESSAI", playerLastName: "Taumoepeau", isUsap: true,
      description: "Essai d'Afusipa Taumoepeau (USAP). Bonus offensif ! 34-10." },
    // 69' - Transformation Allan (USAP) 36-10
    { minute: 69, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 36-10. Score final." },
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

    const side = evt.isUsap ? "USAP" : "BAY";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // -------------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 36 - 10 Bayonne (domicile)");
  console.log("  Mi-temps : USAP 24 - 10 Bayonne");
  console.log("  Arbitre : Luc Ramos");
  console.log("  Stade : Aimé-Giral");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition Bayonne : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  6 essais USAP : Lam, Allan, Oviedo, McIntyre, Veredamu, Taumoepeau");
  console.log("  Bonus offensif USAP");
  console.log("  1 CJ : Ceyte (35', Bayonne)");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

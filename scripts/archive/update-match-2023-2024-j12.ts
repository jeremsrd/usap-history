/**
 * Mise à jour du match USAP - Oyonnax (J12 Top 14, 06/01/2024)
 * Score : USAP 27 - 12 Oyonnax
 *
 * 3e victoire consécutive ! L'USAP sort de la zone rouge.
 * Oyonnax très indiscipliné avec 3 CJ (Bettencourt 5', Vaotoa 7',
 * Picault 36'). L'USAP mène 14-0 après 20' grâce à Veredamu et
 * Van Tonder. Fa'aso'o scelle le bonus en 2e MT.
 * Van Tonder élu homme du match.
 *
 * Essais USAP : Veredamu (15'), Van Tonder (19'), Fa'aso'o (55')
 * Essais Oyonnax : Bettencourt (40'), Bouraux (76')
 *
 * Sources : top14.lnr.fr (compositions), itsrugby.fr (stats),
 *   francebleu.fr, oyonnaxrugby.com, sectionpaloise.com (arbitre)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j12.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2023-2024/j12/10332-perpignan-oyonnax/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 3, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 4, firstName: "Jacobus", lastName: "Van Tonder", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 6, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Alistair", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 70, subOut: 70 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 28, subIn: 52 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 28, subIn: 52 },
  { num: 18, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 19, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 20, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 21, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 22, firstName: "Mathieu", lastName: "Acebes", position: Position.CENTRE, isStarter: false, minutesPlayed: 10, subIn: 70 },
  { num: 23, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 28, subIn: 52 },
];

// === COMPOSITION OYONNAX (adversaire) ===
// Source : top14.lnr.fr
const OYO_SQUAD = [
  { num: 1, name: "Tommy Raynaud", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Teddy Durand", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Christopher Vaotoa", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Phoenix Battye", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Sitiveni Mafi", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Wandrille Picault", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Loïc Credoz", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Rory Grice", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Jonathan Ruru", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Domingo Miotti", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Gavin Stark", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Théo Millet", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Pedro Bettencourt", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Maxime Salles", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Darren Sweetnam", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Manu Leiataua", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Antoine Abraham", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Kevin Lebreton", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 19, name: "Loïc Godener", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Charlie Cassang", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Justin Bouraux", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Victor Lebas", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 23, name: "Thibault Berthaud", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Oyonnax (J12, 06/01/2024) ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver le match
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 12, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // -------------------------------------------------------------------------
  // 2. Arbitre
  // -------------------------------------------------------------------------
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Adrien", "Marbot");

  // -------------------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // -------------------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score : USAP 27 - 12 Oyonnax (domicile)
   * Mi-temps : USAP 14 - 7 Oyonnax
   *
   * USAP : 3E(Veredamu 15', Van Tonder 19', Fa'aso'o 55')
   *      + 3T(Allan) + 2P(McIntyre 70', 79') = 15+6+6 = 27
   * OYO : 2E(Bettencourt 40', Bouraux 76') + 1T(Miotti) = 10+2 = 12
   *
   * 3 CJ Oyonnax : Bettencourt (5'), Vaotoa (7'), Picault (36')
   */
  const venue = await prisma.venue.findFirst({ where: { name: { contains: "Giral" } } });

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      venueId: venue?.id ?? undefined,
      // Mi-temps
      halfTimeUsap: 14,
      halfTimeOpponent: 7,
      // Détail scoring USAP
      triesUsap: 3,
      conversionsUsap: 3,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Oyonnax
      triesOpponent: 2,
      conversionsOpponent: 1,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Troisième victoire consécutive pour l'USAP qui sort de la zone rouge ! " +
        "Oyonnax très indiscipliné avec 3 cartons jaunes en première période " +
        "(Bettencourt 5', Vaotoa 7', Picault 36'), jouant parfois à 13 contre 15. " +
        "L'USAP en profite avec Veredamu (15') et Van Tonder (19') pour mener 14-0. " +
        "Bettencourt réduit l'écart juste avant la pause (40'). En seconde période, " +
        "Fa'aso'o enfonce le clou (55') et McIntyre ajoute 2 pénalités (70', 79'). " +
        "Bouraux sauve l'honneur pour Oyonnax (76'). Van Tonder élu homme du match.",
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

    // Veredamu : 1 essai (15')
    if (p.lastName === "Veredamu") { tries = 1; totalPoints = 5; }
    // Van Tonder : 1 essai (19')
    if (p.lastName === "Van Tonder") { tries = 1; totalPoints = 5; }
    // Fa'aso'o : 1 essai (55')
    if (p.lastName === "Fa'aso'o") { tries = 1; totalPoints = 5; }
    // Allan : 3 transformations = 6 pts
    if (p.lastName === "Allan" && p.num === 15) { conversions = 3; totalPoints = 6; }
    // McIntyre : 2 pénalités = 6 pts
    if (p.lastName === "McIntyre") { penalties = 2; totalPoints = 6; }

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

  // -------------------------------------------------------------------------
  // 5. Composition Oyonnax (adversaire)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition Oyonnax ---");

  for (const p of OYO_SQUAD) {
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
    // 5' - CJ Bettencourt (Oyonnax)
    { minute: 5, type: "CARTON_JAUNE", isUsap: false,
      description: "Carton jaune Pedro Bettencourt (Oyonnax). Oyonnax à 14." },
    // 7' - CJ Vaotoa (Oyonnax)
    { minute: 7, type: "CARTON_JAUNE", isUsap: false,
      description: "Carton jaune Christopher Vaotoa (Oyonnax). Oyonnax à 13 !" },
    // 15' - Essai Veredamu (USAP) 5-0
    { minute: 15, type: "ESSAI", playerLastName: "Veredamu", isUsap: true,
      description: "Essai de Tavite Veredamu (USAP). L'USAP profite de la supériorité. 5-0." },
    // 16' - Transformation Allan (USAP) 7-0
    { minute: 16, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 7-0." },
    // 19' - Essai Van Tonder (USAP) 12-0
    { minute: 19, type: "ESSAI", playerLastName: "Van Tonder", isUsap: true,
      description: "Essai de Jacobus Van Tonder (USAP). 12-0." },
    // 20' - Transformation Allan (USAP) 14-0
    { minute: 20, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 14-0." },
    // 36' - CJ Picault (Oyonnax)
    { minute: 36, type: "CARTON_JAUNE", isUsap: false,
      description: "Carton jaune Wandrille Picault (Oyonnax). 3e CJ pour Oyonnax !" },
    // 40' - Essai Bettencourt (Oyonnax) 14-5
    { minute: 40, type: "ESSAI", isUsap: false,
      description: "Essai de Pedro Bettencourt (Oyonnax). 14-5." },
    // 40' - Transformation Miotti (Oyonnax) 14-7
    { minute: 40, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Domingo Miotti (Oyonnax). 14-7." },

    // === MI-TEMPS : USAP 14 - 7 Oyonnax ===

    // === SECONDE MI-TEMPS ===
    // 55' - Essai Fa'aso'o (USAP) 19-7
    { minute: 55, type: "ESSAI", playerLastName: "Fa'aso'o", isUsap: true,
      description: "Essai de So'otala Fa'aso'o (USAP). 19-7." },
    // 56' - Transformation Allan (USAP) 21-7
    { minute: 56, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 21-7." },
    // 70' - Pénalité McIntyre (USAP) 24-7
    { minute: 70, type: "PENALITE", playerLastName: "McIntyre", isUsap: true,
      description: "Pénalité de Jake McIntyre (USAP). 24-7." },
    // 76' - Essai Bouraux (Oyonnax) 24-12
    { minute: 76, type: "ESSAI", isUsap: false,
      description: "Essai de Justin Bouraux (Oyonnax). 24-12." },
    // 79' - Pénalité McIntyre (USAP) 27-12
    { minute: 79, type: "PENALITE", playerLastName: "McIntyre", isUsap: true,
      description: "Pénalité de Jake McIntyre (USAP). 27-12. Score final." },
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

  // -------------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 27 - 12 Oyonnax (domicile)");
  console.log("  Mi-temps : USAP 14 - 7 Oyonnax");
  console.log("  Arbitre : Adrien Marbot");
  console.log("  Stade : Aimé-Giral");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition Oyonnax : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  Essais USAP : Veredamu (15'), Van Tonder (19'), Fa'aso'o (55')");
  console.log("  3 CJ Oyonnax : Bettencourt (5'), Vaotoa (7'), Picault (36')");
  console.log("  3e victoire consécutive, l'USAP sort de la zone rouge");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

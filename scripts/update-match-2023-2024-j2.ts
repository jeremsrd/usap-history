/**
 * Mise à jour du match Clermont - USAP (J2 Top 14, 26/08/2023)
 * Score : ASM Clermont 38 - 14 USAP
 *
 * Sources : top14.lnr.fr, asm-rugby.com, itsrugby.fr, francebleu.fr, allrugby.com
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j2.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2023-2024/j2/10263-clermont-perpignan/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 46 },
  { num: 2, firstName: "Jérémy", lastName: "Maurouard", position: Position.TALONNEUR, isStarter: true, subOut: 52 },
  { num: 3, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: true, subOut: 55 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 51 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 51 },
  { num: 7, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 51 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 52 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, subOut: 36 },
  { num: 11, firstName: "Alivereti", lastName: "Duguivalu", position: Position.AILIER, isStarter: true },
  { num: 12, firstName: "Apisai", lastName: "Naqalevu", position: Position.CENTRE, isStarter: true },
  { num: 13, firstName: "Mathieu", lastName: "Acebes", position: Position.CENTRE, isStarter: true, isCaptain: true },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: true },
  // Remplaçants
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, subIn: 52 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 46 },
  { num: 18, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 51 },
  { num: 19, firstName: "Lucas", lastName: "Velarte", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 51 },
  { num: 20, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 51 },
  { num: 21, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 52 },
  { num: 22, firstName: "Jean-Pascal", lastName: "Barraqué", position: Position.DEMI_OUVERTURE, isStarter: false, subIn: 36 },
  { num: 23, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: false, subIn: 55 },
];

// === COMPOSITION CLERMONT (adversaire) ===
const CLERMONT_SQUAD = [
  { num: 1, firstName: "Étienne", lastName: "Falgoux", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, firstName: "Étienne", lastName: "Fourcade", position: Position.TALONNEUR, isStarter: true, subOut: 59 },
  { num: 3, firstName: "Rabah", lastName: "Slimani", position: Position.PILIER_DROIT, isStarter: true, subOut: 49 },
  { num: 4, firstName: "Thibaud", lastName: "Lanen", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, firstName: "Rob", lastName: "Simmons", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 59 },
  { num: 6, firstName: "Lucas", lastName: "Dessaigne", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, firstName: "Peceli", lastName: "Yato", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 51 },
  { num: 8, firstName: "Caleb", lastName: "Timu", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, firstName: "Baptiste", lastName: "Jauneau", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 32 },
  { num: 10, firstName: "Benjamin", lastName: "Urdapilleta", position: Position.DEMI_OUVERTURE, isStarter: true, subOut: 62 },
  { num: 11, firstName: "Alivereti", lastName: "Raka", position: Position.AILIER, isStarter: true },
  { num: 12, firstName: "Pierre", lastName: "Fouyssac", position: Position.CENTRE, isStarter: true, subOut: 62 },
  { num: 13, firstName: "Irae", lastName: "Simone", position: Position.CENTRE, isStarter: true },
  { num: 14, firstName: "Joris", lastName: "Jurand", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Alex", lastName: "Newsome", position: Position.ARRIERE, isStarter: true },
  { num: 16, firstName: "Jean-Maxence", lastName: "Jules-Rosette", position: Position.TALONNEUR, isStarter: false, subIn: 59 },
  { num: 17, firstName: "Daniel", lastName: "Bibi Biziwu", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 49 },
  { num: 18, firstName: "Paul", lastName: "Jedrasiak", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 59 },
  { num: 19, firstName: "Killian", lastName: "Tixeront", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 51 },
  { num: 20, firstName: "Sébastien", lastName: "Bézy", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 32 },
  { num: 21, firstName: "Anthony", lastName: "Belleau", position: Position.DEMI_OUVERTURE, isStarter: false, subIn: 62 },
  { num: 22, firstName: "Julien", lastName: "Hériteau", position: Position.CENTRE, isStarter: false, subIn: 62 },
  { num: 23, firstName: "Cristian", lastName: "Ojovan", position: Position.PILIER_DROIT, isStarter: false, subIn: 49 },
];

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

async function findOrCreatePlayer(
  firstName: string,
  lastName: string,
  position: Position,
): Promise<string> {
  // Recherche exacte insensible à la casse
  let existing = await prisma.player.findFirst({
    where: {
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
  });
  // Recherche par nom de famille seul (pour les accents/variantes de prénom)
  if (!existing) {
    existing = await prisma.player.findFirst({
      where: {
        lastName: { equals: lastName, mode: "insensitive" },
        position,
      },
    });
  }
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

async function findOrCreateVenue(
  name: string,
  city: string,
  capacity: number | null,
): Promise<string> {
  const existing = await prisma.venue.findFirst({
    where: { name: { contains: name.split(" ").slice(-1)[0], mode: "insensitive" } },
  });
  if (existing) {
    console.log(`  [stade] Existe : ${existing.name}`);
    return existing.id;
  }

  const france = await prisma.country.findFirst({ where: { code: "FR" } });
  const venue = await prisma.venue.create({
    data: {
      name,
      city,
      countryId: france?.id,
      capacity,
      isHomeGround: false,
    },
  });
  console.log(`  [stade] Créé : ${name}`);
  return venue.id;
}

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log("=== Mise à jour match Clermont - USAP (J2, 26/08/2023) ===\n");

  // -----------------------------------------------------------------------
  // 1. Trouver le match
  // -----------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 2,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  ${match.opponent.name} ${match.scoreOpponent} - ${match.scoreUsap} USAP\n`);

  // -----------------------------------------------------------------------
  // 2. Stade Marcel-Michelin
  // -----------------------------------------------------------------------
  console.log("--- Stade ---");
  const venueId = await findOrCreateVenue("Stade Marcel-Michelin", "Clermont-Ferrand", 18000);

  // -----------------------------------------------------------------------
  // 3. Arbitre : Benoît Rousselet
  // -----------------------------------------------------------------------
  console.log("\n--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Benoît", "Rousselet");

  // -----------------------------------------------------------------------
  // 4. Mise à jour des infos générales
  // -----------------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score :
   *   3-0  (21') Urdapilleta pen
   *   10-0 (29') Fouyssac try + Urdapilleta conv
   *   --- MI-TEMPS : Clermont 10 - USAP 0 ---
   *   17-0 (47') Jurand try + Urdapilleta conv
   *   24-0 (56') Dessaigne try + Urdapilleta conv
   *   31-0 (63') Jurand try + Belleau conv
   *   31-7 (71') Montgaillard try USAP + conv
   *   38-7 (75') Yato try + Urdapilleta conv
   *   38-14 (80') Ecochard try USAP + conv
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      venueId,
      refereeId,
      attendance: 13674,
      videoUrl: "https://www.dailymotion.com/video/x8nis4j",
      // Mi-temps
      halfTimeUsap: 0,
      halfTimeOpponent: 10,
      // Détail scoring USAP
      triesUsap: 2,
      conversionsUsap: 2,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Clermont
      triesOpponent: 5,
      conversionsOpponent: 5,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Lourde défaite à Marcel-Michelin pour la 2e journée. L'USAP est dominée dès la première mi-temps " +
        "(10-0) et le score s'alourdit en seconde période. Clermont inscrit 5 essais dont un doublé de Jurand. " +
        "L'USAP sauve l'honneur en fin de match par Montgaillard (71') et Ecochard (80'). " +
        "Carton jaune pour Goutard (54'). McIntyre sort blessé à la 36e minute, remplacé par Barraqué.",
    },
  });
  console.log("  Match mis à jour");

  // -----------------------------------------------------------------------
  // 5. Composition USAP (23 joueurs)
  // -----------------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  const deletedMP = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deletedMP.count > 0) console.log(`  ${deletedMP.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);

    let tries = 0, conversions = 0, totalPoints = 0;
    let yellowCard = false, yellowCardMin: number | null = null;
    let minutesPlayed: number | null = null;

    // Montgaillard : 1 essai (71')
    if (p.lastName === "Montgaillard") {
      tries = 1;
      totalPoints = 5;
    }
    // Ecochard : 1 essai (80')
    if (p.lastName === "Ecochard") {
      tries = 1;
      totalPoints = 5;
    }
    // Goutard : carton jaune (54')
    if (p.lastName === "Goutard") {
      yellowCard = true;
      yellowCardMin = 54;
    }

    // Calcul minutes jouées
    if (p.isStarter) {
      minutesPlayed = (p as any).subOut ? (p as any).subOut : 80;
    } else if ((p as any).subIn) {
      minutesPlayed = 80 - (p as any).subIn;
    } else {
      minutesPlayed = 0; // Remplaçant non entré
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
        tries,
        conversions,
        penalties: 0,
        totalPoints,
        yellowCard,
        yellowCardMin,
        subIn: (p as any).subIn ?? null,
        subOut: (p as any).subOut ?? null,
        minutesPlayed,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const extra = [
      p.isCaptain ? "(C)" : "",
      totalPoints > 0 ? `(${totalPoints} pts)` : "",
      yellowCard ? `[CJ ${yellowCardMin}']` : "",
      minutesPlayed !== null && minutesPlayed < 80 && minutesPlayed > 0 ? `${minutesPlayed}'` : "",
    ].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // -----------------------------------------------------------------------
  // 6. Composition Clermont (adversaire)
  // -----------------------------------------------------------------------
  console.log("\n--- Composition Clermont (adversaire) ---");

  for (const p of CLERMONT_SQUAD) {
    let minutesPlayed: number | null = null;
    if (p.isStarter) {
      minutesPlayed = (p as any).subOut ? (p as any).subOut : 80;
    } else if ((p as any).subIn) {
      minutesPlayed = 80 - (p as any).subIn;
    } else {
      minutesPlayed = 0;
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId: null,
        isOpponent: true,
        opponentPlayerName: `${p.firstName} ${p.lastName}`,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        positionPlayed: p.position,
        subIn: (p as any).subIn ?? null,
        subOut: (p as any).subOut ?? null,
        minutesPlayed,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName}`);
  }

  // -----------------------------------------------------------------------
  // 7. Liens joueurs-saison
  // -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
  // 8. Événements du match
  // -----------------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvts = await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
  if (deletedEvts.count > 0) console.log(`  ${deletedEvts.count} événement(s) supprimé(s)`);

  // Résoudre les IDs des joueurs USAP pour les événements
  const montgaillard = await prisma.player.findFirst({ where: { lastName: "Montgaillard" } });
  const ecochard = await prisma.player.findFirst({ where: { lastName: "Ecochard" } });
  const goutard = await prisma.player.findFirst({ where: { lastName: "Goutard" } });

  const events = [
    // 1ère mi-temps
    { minute: 21, type: "PENALITE", isUsap: false, playerId: null,
      description: "Pénalité de Benjamin Urdapilleta (Clermont). 3-0." },
    { minute: 29, type: "ESSAI", isUsap: false, playerId: null,
      description: "Essai de Pierre Fouyssac (Clermont). 8-0." },
    { minute: 29, type: "TRANSFORMATION", isUsap: false, playerId: null,
      description: "Transformation de Benjamin Urdapilleta (Clermont). 10-0." },
    // 2ème mi-temps
    { minute: 47, type: "ESSAI", isUsap: false, playerId: null,
      description: "Essai de Joris Jurand (Clermont). 15-0." },
    { minute: 47, type: "TRANSFORMATION", isUsap: false, playerId: null,
      description: "Transformation de Benjamin Urdapilleta (Clermont). 17-0." },
    { minute: 54, type: "CARTON_JAUNE", isUsap: true, playerId: goutard?.id ?? null,
      description: "Carton jaune Boris Goutard (USAP)." },
    { minute: 56, type: "ESSAI", isUsap: false, playerId: null,
      description: "Essai de Lucas Dessaigne (Clermont). 22-0." },
    { minute: 56, type: "TRANSFORMATION", isUsap: false, playerId: null,
      description: "Transformation de Benjamin Urdapilleta (Clermont). 24-0." },
    { minute: 63, type: "ESSAI", isUsap: false, playerId: null,
      description: "2e essai de Joris Jurand (Clermont). 29-0." },
    { minute: 63, type: "TRANSFORMATION", isUsap: false, playerId: null,
      description: "Transformation d'Anthony Belleau (Clermont). 31-0." },
    { minute: 71, type: "ESSAI", isUsap: true, playerId: montgaillard?.id ?? null,
      description: "Essai de Victor Montgaillard (USAP). 31-5." },
    { minute: 71, type: "TRANSFORMATION", isUsap: true, playerId: null,
      description: "Transformation USAP. 31-7." },
    { minute: 75, type: "ESSAI", isUsap: false, playerId: null,
      description: "Essai de Peceli Yato (Clermont). 36-7." },
    { minute: 75, type: "TRANSFORMATION", isUsap: false, playerId: null,
      description: "Transformation de Benjamin Urdapilleta (Clermont). 38-7." },
    { minute: 80, type: "ESSAI", isUsap: true, playerId: ecochard?.id ?? null,
      description: "Essai de Tom Ecochard (USAP). 38-12." },
    { minute: 80, type: "TRANSFORMATION", isUsap: true, playerId: null,
      description: "Transformation USAP. 38-14." },
  ];

  for (const evt of events) {
    await prisma.matchEvent.create({
      data: {
        matchId: match.id,
        minute: evt.minute,
        type: evt.type as any,
        playerId: evt.playerId,
        isUsap: evt.isUsap,
        description: evt.description,
      },
    });

    const side = evt.isUsap ? "USAP" : "ASM";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // -----------------------------------------------------------------------
  // Résumé
  // -----------------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Clermont 38 - 14 USAP");
  console.log("  Mi-temps : Clermont 10 - 0 USAP");
  console.log("  Arbitre : Benoît Rousselet");
  console.log("  Affluence : 13 674");
  console.log("  Stade : Marcel-Michelin");
  console.log("  Composition : 23 USAP + 23 Clermont");
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

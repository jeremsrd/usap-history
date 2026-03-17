/**
 * Script de mise à jour du match Toulon - USAP (J13 Top 14, 28/12/2025)
 * Score final : Toulon 31 - USAP 16
 * Mi-temps : Toulon 7 - USAP 10
 *
 * L'USAP mène à la mi-temps grâce à un essai de Granell (20') et une pénalité
 * de Reus (28'). Mais Toulon accélère en 2e période : Alainu'uesa (46'),
 * Villière (50'), Alainu'uesa de nouveau (75') et Dréan (77') inscrivent
 * 4 essais pour le bonus offensif. Reus ajoute 2 pénalités en 2e période
 * mais l'écart est trop grand.
 *
 * Arbitre : Jonathan Dufort
 *
 * Sources : top14.lnr.fr, rugby-transferts.com, francebleu.fr, allrugby.com
 *
 * Exécution : npx tsx scripts/update-match-j13-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match Toulon - USAP (J13, 28/12/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J13 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 13,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Jonathan Dufort
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Dufort", mode: "insensitive" } },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Jonathan",
        lastName: "Dufort",
        slug: "jonathan-dufort",
      },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName}`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 1b. Stade : Stade Mayol (Toulon)
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Mayol", mode: "insensitive" } },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade Mayol",
        slug: "stade-mayol",
        city: "Toulon",
        capacity: 18000,
      },
    });
    console.log(`  Créé : ${venue.name}`);
  } else {
    console.log(`  Existe : ${venue.name} (${venue.id})`);
  }

  // ---------------------------------------------------------------
  // 2. Résolution des joueurs USAP
  // ---------------------------------------------------------------
  console.log("\n--- Résolution joueurs USAP ---");

  async function findPlayer(lastName: string, firstName?: string): Promise<string> {
    const where: Record<string, unknown> = {
      lastName: { equals: lastName, mode: "insensitive" },
    };
    if (firstName) {
      where.firstName = { equals: firstName, mode: "insensitive" };
    }
    const player = await prisma.player.findFirst({ where });
    if (!player) {
      throw new Error(`Joueur non trouvé : ${firstName || ""} ${lastName}`);
    }
    return player.id;
  }

  const PLAYER_IDS: Record<string, string> = {};
  const usapNames = [
    "Beria", "Ruiz", "Ceccarelli", "Chinarro", "Warion",
    "Hicks", "Le Corvec", "Velarte", "Ecochard", "Reus",
    "Granell", "De La Fuente", "Duguivalu", "Petaia", "Forner",
    "Lotrian", "Tetrashvili", "Yato", "Tanguy",
    "Diaby", "Aprasidze", "Aucagne", "Brookes",
  ];

  for (const name of usapNames) {
    try {
      if (name === "De La Fuente") {
        PLAYER_IDS[name] = await findPlayer(name, "Jerónimo");
      } else if (name === "Le Corvec") {
        PLAYER_IDS[name] = await findPlayer(name, "Mattéo");
      } else if (name === "Lotrian") {
        PLAYER_IDS[name] = await findPlayer(name, "Mathys");
      } else {
        PLAYER_IDS[name] = await findPlayer(name);
      }
      console.log(`  ✓ ${name}`);
    } catch {
      console.log(`  ✗ ${name} — NON TROUVÉ`);
    }
  }

  // ---------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (Toulon - USAP) :
   * 16' Essai Ludlam (RCT) → 5-0
   * 16' Transfo Domon (RCT) → 7-0
   * 20' Essai Granell (USAP) → 7-5
   * 20' Transfo Reus (USAP) → 7-7
   * 28' Pénalité Reus (USAP) → 7-10
   * MI-TEMPS : Toulon 7 - USAP 10
   * 46' Essai Alainu'uesa (RCT) → 12-10
   * 46' Transfo Domon (RCT) → 14-10
   * 50' Essai Villière (RCT) → 19-10
   * 50' Transfo Domon (RCT) → 21-10
   * 55' Pénalité Reus (USAP) → 21-13
   * 60' Pénalité Reus (USAP) → 21-16
   * 75' Essai Alainu'uesa (RCT), non transformé → 26-16
   * 77' Essai Dréan (RCT), non transformé → 31-16
   *
   * USAP : 1E + 1T + 3P = 5 + 2 + 9 = 16 points
   * Toulon : 5E + 3T = 25 + 6 = 31 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "18:00",
      refereeId: referee.id,
      venueId: venue.id,
      halfTimeUsap: 10,
      halfTimeOpponent: 7,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 3,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Toulon
      triesOpponent: 5,
      conversionsOpponent: 3,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "L'USAP prend les devants à Mayol ! Granell ouvre le score d'un essai, transformé par Reus " +
        "(20', 7-7), puis Reus passe une pénalité (28', 7-10). Les Catalans mènent à la pause. " +
        "Mais Toulon accélère en 2e période : Alainu'uese marque dès la reprise (46', 14-10), " +
        "Villière enfonce le clou (50', 21-10). Reus maintient l'espoir avec 2 pénalités (55', 60' " +
        "→ 21-16) mais Alainu'uese récidive (75', 26-16) et Dréan scelle le bonus offensif " +
        "toulonnais après une passe au pied d'Albornoz (77', 31-16). Malgré une 1re mi-temps " +
        "encourageante, l'USAP craque physiquement en fin de match. L'USAP reste lanterne rouge.",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, stade, rapport)");

  // ---------------------------------------------------------------
  // 4. Composition USAP (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: match.id, isOpponent: false },
  });
  console.log(`  ${deleted.count} entrée(s) USAP supprimée(s)`);

  const USAP_SQUAD = [
    // Titulaires
    { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true, minutesPlayed: 56 },
    { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 56 },
    { num: 3, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 56 },
    { num: 4, lastName: "Chinarro", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 65 },
    { num: 6, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 7, lastName: "Le Corvec", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 8, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 65 },
    { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 60 },
    { num: 10, lastName: "Reus", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 60,
      conversions: 1, penalties: 3, totalPoints: 11 }, // 1T(2) + 3P(9) = 11
    { num: 11, lastName: "Granell", position: "AILIER" as const, isStarter: true, minutesPlayed: 80,
      tries: 1, totalPoints: 5 }, // Essai 20'
    { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Petaia", position: "AILIER" as const, isStarter: true, minutesPlayed: 60 },
    { num: 15, lastName: "Forner", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Lotrian", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 24 },          // entré 56'
    { num: 17, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 24 },  // entré 56'
    { num: 18, lastName: "Yato", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 15 },        // entré 65'
    { num: 19, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 0 },       // non entré
    { num: 20, lastName: "Diaby", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 15 }, // entré 65'
    { num: 21, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 20 },    // entré 60'
    { num: 22, lastName: "Aucagne", position: "DEMI_OUVERTURE" as const, isStarter: false, minutesPlayed: 20 },     // entré 60'
    { num: 23, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 24 },       // entré 56'
  ];

  for (const p of USAP_SQUAD) {
    const playerId = PLAYER_IDS[p.lastName];
    if (!playerId) {
      console.log(`  ⚠ Joueur non trouvé : ${p.lastName}`);
      continue;
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: (p as { isCaptain?: boolean }).isCaptain ?? false,
        positionPlayed: p.position,
        tries: (p as { tries?: number }).tries ?? 0,
        conversions: (p as { conversions?: number }).conversions ?? 0,
        penalties: (p as { penalties?: number }).penalties ?? 0,
        dropGoals: 0,
        totalPoints: (p as { totalPoints?: number }).totalPoints ?? 0,
        minutesPlayed: p.minutesPlayed,
        yellowCard: false,
        yellowCardMin: null,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    const pts = (p as { totalPoints?: number }).totalPoints ? ` (${(p as { totalPoints?: number }).totalPoints} pts)` : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts} [${p.minutesPlayed}']`);
  }

  const totalPointsUSAP = USAP_SQUAD.reduce((sum, p) => sum + ((p as { totalPoints?: number }).totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsUSAP} (attendu : 16)`);
  if (totalPointsUSAP !== 16) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  // ---------------------------------------------------------------
  // 5. Événements du match
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: match.id },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events = [
    // === 1re mi-temps ===
    {
      minute: 16, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Lewis Ludlam (Toulon). Le flanker anglais ouvre le score. 5-0.",
    },
    {
      minute: 16, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Marius Domon (Toulon). 7-0.",
    },
    {
      minute: 20, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Granell"], isUsap: true,
      description: "Essai de Maxim Granell (USAP). 7-5.",
    },
    {
      minute: 20, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Transformation de Hugo Reus (USAP). Égalisation 7-7.",
    },
    {
      minute: 28, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Pénalité de Hugo Reus (USAP). Les Catalans passent devant. 7-10.",
    },

    // === MI-TEMPS : Toulon 7 - USAP 10 ===

    // === 2e mi-temps ===
    {
      minute: 46, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Komiti Alainu'uese (Toulon). Le 2e ligne remplaçant marque dès la reprise. 12-10.",
    },
    {
      minute: 46, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Marius Domon (Toulon). 14-10.",
    },
    {
      minute: 50, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Gabin Villière (Toulon). L'ailier international accélère. 19-10.",
    },
    {
      minute: 50, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Marius Domon (Toulon). 21-10.",
    },
    {
      minute: 55, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Pénalité de Hugo Reus (USAP). 21-13.",
    },
    {
      minute: 60, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Pénalité de Hugo Reus (USAP). 21-16.",
    },
    {
      minute: 75, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Komiti Alainu'uese (Toulon). Doublé pour le 2e ligne. Non transformé. 26-16.",
    },
    {
      minute: 77, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Gaël Dréan (Toulon). Après une passe au pied d'Albornoz. Non transformé. Bonus offensif pour Toulon. 31-16.",
    },
  ];

  for (const evt of events) {
    await prisma.matchEvent.create({
      data: {
        matchId: match.id,
        minute: evt.minute,
        type: evt.type,
        playerId: evt.playerId,
        isUsap: evt.isUsap,
        description: evt.description,
      },
    });
    const side = evt.isUsap ? "USAP" : "RCT ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Stade Mayol (Toulon)");
  console.log("  Arbitre : Jonathan Dufort");
  console.log("  Score mi-temps : Toulon 7 - USAP 10");
  console.log("  Score final : Toulon 31 - USAP 16");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
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

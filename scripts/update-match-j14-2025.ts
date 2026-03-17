/**
 * Script de mise à jour du match USAP - Toulouse (J14 Top 14, 03/01/2026)
 * Score final : USAP 30 - Toulouse 27
 * Mi-temps : USAP 11 - Toulouse 21
 *
 * L'EXPLOIT ! L'USAP renverse le Stade Toulousain, champion en titre, à
 * Aimé-Giral. Menés 11-21 à la mi-temps puis 16-27 à 10 minutes de la fin,
 * les Catalans marquent 2 essais dans les 10 dernières minutes par Yato (70')
 * et Oviedo (75') pour arracher une victoire historique 30-27. Granell avait
 * ouvert le score (11'). Ruiz marque en début de 2e mi-temps (44'). Aucagne
 * et Urdapilleta assurent au pied. L'USAP quitte la dernière place du classement.
 *
 * Arbitre : Adrien Marbot
 *
 * Sources : top14.lnr.fr, francebleu.fr, sports.orange.fr, stadetoulousain.fr
 *
 * Exécution : npx tsx scripts/update-match-j14-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match USAP - Toulouse (J14, 03/01/2026) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J14 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 14,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Adrien Marbot
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Marbot", mode: "insensitive" } },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Adrien",
        lastName: "Marbot",
        slug: "adrien-marbot",
      },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName}`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 1b. Stade : Aimé-Giral (domicile)
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  const venue = await prisma.venue.findFirst({
    where: { name: { contains: "Aimé-Giral", mode: "insensitive" } },
  });
  if (!venue) {
    throw new Error("Stade Aimé-Giral non trouvé en base");
  }
  console.log(`  Existe : ${venue.name} (${venue.id})`);

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
    "Tetrashvili", "Malolo", "Brookes", "Van Tonder", "Tanguy",
    "Hicks", "Ritchie", "Velarte", "Hall", "Urdapilleta",
    "Granell", "De La Fuente", "Duguivalu", "Forner", "Aucagne",
    "Ruiz", "Devaux", "Yato", "Oviedo",
    "Ecochard", "Reus", "Poulet", "Ceccarelli",
  ];

  for (const name of usapNames) {
    try {
      if (name === "De La Fuente") {
        PLAYER_IDS[name] = await findPlayer(name, "Jerónimo");
      } else if (name === "Van Tonder") {
        PLAYER_IDS[name] = await findPlayer(name, "Jacobus");
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
   * Évolution du score (USAP - Toulouse) :
   *  6' Pénalité Aucagne (USAP) → 3-0
   * 11' Essai Granell (USAP), non transformé → 8-0
   * 15' Pénalité Urdapilleta (USAP) → 11-0
   * 20' Essai Thomas (ST) + Transfo Gourgues → 11-7
   * 30' Essai Bertrand (ST) + Transfo Gourgues → 11-14
   * 38' Essai Gourgues (ST) + Transfo Gourgues → 11-21
   * MI-TEMPS : USAP 11 - Toulouse 21
   * 44' Essai Ruiz (USAP) + Transfo Urdapilleta → 18-21
   * 50' Pénalité Gourgues (ST) → 18-24
   * 55' Pénalité Gourgues (ST) → 18-27
   * 60' Pénalité manquée
   * 70' Essai Yato (USAP) + Transfo Urdapilleta → 25-27
   * 75' Essai Oviedo (USAP), non transformé → 30-27
   *
   * USAP : 4E + 2T + 2P = 20 + 4 + 6 = 30 points
   * Toulouse : 3E + 3T + 2P = 15 + 6 + 6 = 27 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "14:30",
      refereeId: referee.id,
      venueId: venue.id,
      halfTimeUsap: 11,
      halfTimeOpponent: 21,
      // Détail scoring USAP
      triesUsap: 4,
      conversionsUsap: 2,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Toulouse
      triesOpponent: 3,
      conversionsOpponent: 3,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: true,
      bonusDefensif: false,
      // Rapport
      report:
        "L'EXPLOIT ! L'USAP renverse le Stade Toulousain, champion en titre, dans un Aimé-Giral " +
        "en ébullition (30-27). Pourtant, la situation semblait désespérée : menés 11-21 à la pause " +
        "après 3 essais toulousains (Thomas, Bertrand, Gourgues), les Catalans n'avaient répondu " +
        "que par un essai de Granell (11') et des pénalités d'Aucagne (6') et Urdapilleta (15'). " +
        "Ruiz relance l'USAP en début de 2e période (44', 18-21) mais Gourgues creuse à nouveau " +
        "l'écart avec 2 pénalités (18-27). Quasi résignés à 10 minutes de la fin, les Catalans " +
        "chavirent quand Yato marque entre les poteaux (70', 25-27) puis Oviedo conclut un ballon " +
        "porté irrésistible (75', 30-27). Aimé-Giral explose. L'USAP quitte enfin la dernière " +
        "place du classement. Toulouse était venu avec une équipe remaniée mais l'exploit n'en " +
        "est pas moins remarquable.",
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
    { num: 1, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: true, minutesPlayed: 56 },
    { num: 2, lastName: "Malolo", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 44 },
    { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 56 },
    { num: 4, lastName: "Van Tonder", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 6, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 7, lastName: "Ritchie", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 8, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 56 },
    { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 60 },
    { num: 10, lastName: "Urdapilleta", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 60,
      conversions: 2, penalties: 1, totalPoints: 7 }, // 2T(4) + 1P(3) = 7
    { num: 11, lastName: "Granell", position: "AILIER" as const, isStarter: true, minutesPlayed: 80,
      tries: 1, totalPoints: 5 }, // Essai 11'
    { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Forner", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 15, lastName: "Aucagne", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80,
      penalties: 1, totalPoints: 3 }, // 1P(3)
    // Remplaçants
    { num: 16, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 36,
      tries: 1, totalPoints: 5 }, // Essai 44', entré ~44'
    { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 24 },     // entré 56'
    { num: 18, lastName: "Yato", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 24,
      tries: 1, totalPoints: 5 }, // Essai 70', entré 56'
    { num: 19, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: false, minutesPlayed: 24,
      tries: 1, totalPoints: 5 }, // Essai 75', entré 56'
    { num: 20, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 20 },   // entré 60'
    { num: 21, lastName: "Reus", position: "DEMI_OUVERTURE" as const, isStarter: false, minutesPlayed: 20 },      // entré 60'
    { num: 22, lastName: "Poulet", position: "CENTRE" as const, isStarter: false, minutesPlayed: 0 },             // non entré
    { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 24 },   // entré 56'
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
  console.log(`\n  Vérification : total points individuels = ${totalPointsUSAP} (attendu : 30)`);
  if (totalPointsUSAP !== 30) {
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
      minute: 6, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne (USAP). Les Catalans ouvrent le score. 3-0.",
    },
    {
      minute: 11, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Granell"], isUsap: true,
      description: "Essai de Maxim Granell (USAP). 8-0.",
    },
    {
      minute: 15, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Pénalité de Benjamin Urdapilleta (USAP). 11-0.",
    },
    {
      minute: 20, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Teddy Thomas (Toulouse). 11-5.",
    },
    {
      minute: 20, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Kalvin Gourgues (Toulouse). 11-7.",
    },
    {
      minute: 30, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Benjamin Bertrand (Toulouse). Le pilier passe en force. 11-12.",
    },
    {
      minute: 30, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Kalvin Gourgues (Toulouse). 11-14.",
    },
    {
      minute: 38, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Kalvin Gourgues (Toulouse). L'ouvreur marque lui-même. 11-19.",
    },
    {
      minute: 38, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Kalvin Gourgues (Toulouse). 11-21.",
    },

    // === MI-TEMPS : USAP 11 - Toulouse 21 ===

    // === 2e mi-temps ===
    {
      minute: 44, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Ruiz"], isUsap: true,
      description: "Essai d'Ignacio Ruiz (USAP). Le talonneur remplaçant relance les Catalans. 16-21.",
    },
    {
      minute: 44, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). 18-21.",
    },
    {
      minute: 50, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Kalvin Gourgues (Toulouse). 18-24.",
    },
    {
      minute: 55, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Kalvin Gourgues (Toulouse). L'écart se creuse. 18-27.",
    },
    {
      minute: 70, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Yato"], isUsap: true,
      description: "Essai de Peceli Yato (USAP). Le Fidjien marque entre les poteaux. Aimé-Giral s'enflamme. 23-27.",
    },
    {
      minute: 70, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). 25-27.",
    },
    {
      minute: 75, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Oviedo"], isUsap: true,
      description: "Essai de Joaquín Oviedo (USAP) ! Le n°8 conclut un ballon porté irrésistible. Aimé-Giral explose ! 30-27.",
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
    const side = evt.isUsap ? "USAP" : "ST  ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Aimé-Giral (Perpignan) — domicile");
  console.log("  Arbitre : Adrien Marbot");
  console.log("  Score mi-temps : USAP 11 - Toulouse 21");
  console.log("  Score final : USAP 30 - Toulouse 27");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length}`);
  console.log("  🏆 EXPLOIT : victoire contre le champion en titre !");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

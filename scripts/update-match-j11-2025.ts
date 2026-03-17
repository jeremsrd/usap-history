/**
 * Script de mise à jour du match Castres - USAP (J11 Top 14, 29/11/2025)
 * Score final : Castres 23 - USAP 7
 * Mi-temps : 7-7
 *
 * 11e défaite consécutive pour l'USAP. Dubois ouvre le score d'un essai
 * après mêlée à 5 mètres, transformé par Urdapilleta (25', 0-7). Carton jaune
 * pour Ruiz (30') sur infraction en maul. Ramototabua égalise pour Castres
 * d'un essai en force, transformé par Popelin (31', 7-7). Mi-temps 7-7.
 * En 2e période, Popelin creuse l'écart avec 3 pénalités (46', 51', 66' → 16-7).
 * Goodhue intercepte et traverse tout le terrain pour le 2e essai castrais
 * transformé par Chabouni (80', 23-7). L'USAP reste lanterne rouge avec
 * un seul point au classement.
 *
 * Arbitre : Vincent Blasco-Baqué
 *
 * Sources : top14.lnr.fr, castres-olympique.com, francebleu.fr, vibrez-rugby.com
 *
 * Exécution : npx tsx scripts/update-match-j11-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match Castres - USAP (J11, 29/11/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J11 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 11,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Vincent Blasco-Baqué
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Blasco", mode: "insensitive" } },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Vincent",
        lastName: "Blasco-Baqué",
        slug: "vincent-blasco-baque",
      },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName}`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 1b. Stade : Stade Pierre Fabre (Castres)
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Pierre Fabre", mode: "insensitive" } },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade Pierre Fabre",
        slug: "stade-pierre-fabre",
        city: "Castres",
        capacity: 11500,
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
    "Tetrashvili", "Ruiz", "Brookes", "Van Tonder", "Tanguy",
    "Hicks", "Ritchie", "Oviedo", "Ecochard", "Urdapilleta",
    "Joseph", "Paia'aua", "De La Fuente", "Petaia", "Dubois",
    "Malolo", "Beria", "Chinarro", "Diaby",
    "Hall", "Kretchmann", "Duguivalu", "Roelofse",
  ];

  for (const name of usapNames) {
    try {
      if (name === "De La Fuente") {
        PLAYER_IDS[name] = await findPlayer(name, "Jerónimo");
      } else if (name === "Dubois") {
        PLAYER_IDS[name] = await findPlayer(name, "Lucas");
      } else if (name === "Van Tonder") {
        PLAYER_IDS[name] = await findPlayer(name, "Jacobus");
      } else if (name === "Joseph") {
        PLAYER_IDS[name] = await findPlayer(name, "Jefferson-Lee");
      } else if (name === "Paia'aua") {
        PLAYER_IDS[name] = await findPlayer(name, "Duncan");
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
   * Évolution du score (Castres - USAP) :
   * 25' Essai Dubois (USAP) → 0-5
   * 25' Transfo Urdapilleta (USAP) → 0-7
   * 30' Carton jaune Ruiz (USAP)
   * 31' Essai Ramototabua (CO) → 5-7
   * 31' Transfo Popelin (CO) → 7-7
   * MI-TEMPS : Castres 7 - USAP 7
   * 46' Pénalité Popelin (CO) → 10-7
   * 51' Pénalité Popelin (CO) → 13-7
   * 66' Pénalité Popelin (CO) → 16-7
   * 80' Essai Goodhue (CO) → 21-7
   * 80' Transfo Chabouni (CO) → 23-7
   *
   * USAP : 1E + 1T = 5 + 2 = 7 points
   * Castres : 2E + 2T + 3P = 10 + 4 + 9 = 23 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:35",
      refereeId: referee.id,
      venueId: venue.id,
      halfTimeUsap: 7,
      halfTimeOpponent: 7,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Castres
      triesOpponent: 2,
      conversionsOpponent: 2,
      penaltiesOpponent: 3,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Vidéo
      videoUrl: "https://www.youtube.com/watch?v=WRrFU-mmXZM",
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Onzième défaite consécutive pour l'USAP, battue à Castres sur le score de 23-7. " +
        "Pourtant, les Catalans ont fait jeu égal en première période. Dubois ouvre le score " +
        "d'un essai après une mêlée à 5 mètres, transformé par Urdapilleta (25', 0-7). Mais " +
        "Ruiz écope d'un carton jaune pour infraction en maul (30') et Ramototabua en profite " +
        "pour égaliser d'un essai en force, transformé par Popelin (31', 7-7). Mi-temps 7-7. " +
        "En seconde période, l'indiscipline de l'USAP est sanctionnée : Popelin enchaîne trois " +
        "pénalités (46', 51', 66') pour porter le score à 16-7. En toute fin de match, Goodhue " +
        "intercepte un ballon et traverse tout le terrain pour inscrire le 2e essai castrais, " +
        "transformé par Chabouni (80', 23-7). L'USAP reste lanterne rouge du Top 14 avec un " +
        "seul point au classement.",
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
    { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 56, yellowCard: true, yellowCardMinute: 30 },
    { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 56 },
    { num: 4, lastName: "Van Tonder", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 6, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 7, lastName: "Ritchie", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 65 },
    { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 80 },
    { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 60 },
    { num: 10, lastName: "Urdapilleta", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 60,
      conversions: 1, totalPoints: 2 }, // Transfo essai Dubois
    { num: 11, lastName: "Joseph", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "Paia'aua", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 13, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 14, lastName: "Petaia", position: "AILIER" as const, isStarter: true, minutesPlayed: 60 },
    { num: 15, lastName: "Dubois", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80,
      tries: 1, totalPoints: 5 }, // Essai 25'
    // Remplaçants
    { num: 16, lastName: "Malolo", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 24 },          // entré 56'
    { num: 17, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 24 },       // entré 56'
    { num: 18, lastName: "Chinarro", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 0 },    // non entré
    { num: 19, lastName: "Diaby", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 15 }, // entré 65'
    { num: 20, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 20 },        // entré 60'
    { num: 21, lastName: "Kretchmann", position: "DEMI_OUVERTURE" as const, isStarter: false, minutesPlayed: 20 }, // entré 60'
    { num: 22, lastName: "Duguivalu", position: "AILIER" as const, isStarter: false, minutesPlayed: 20 },          // entré 60'
    { num: 23, lastName: "Roelofse", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 24 },     // entré 56'
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
        penalties: 0,
        dropGoals: 0,
        totalPoints: (p as { totalPoints?: number }).totalPoints ?? 0,
        minutesPlayed: p.minutesPlayed,
        yellowCard: (p as { yellowCard?: boolean }).yellowCard ?? false,
        yellowCardMin: (p as { yellowCardMinute?: number }).yellowCardMinute ?? null,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    const yc = (p as { yellowCard?: boolean }).yellowCard ? " [CJ]" : "";
    const pts = (p as { totalPoints?: number }).totalPoints ? ` (${(p as { totalPoints?: number }).totalPoints} pts)` : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${yc} [${p.minutesPlayed}']`);
  }

  const totalPointsUSAP = USAP_SQUAD.reduce((sum, p) => sum + ((p as { totalPoints?: number }).totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsUSAP} (attendu : 7)`);
  if (totalPointsUSAP !== 7) {
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
      minute: 25, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Dubois"], isUsap: true,
      description: "Essai de Lucas Dubois (USAP). L'arrière conclut après une mêlée à 5 mètres. 0-5.",
    },
    {
      minute: 25, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). 0-7.",
    },
    {
      minute: 30, type: "CARTON_JAUNE" as const,
      playerId: PLAYER_IDS["Ruiz"], isUsap: true,
      description: "Carton jaune pour Ignacio Ruiz (USAP). Infraction en maul.",
    },
    {
      minute: 31, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Veresa Ramototabua (Castres). Le n°8 passe en force derrière la mêlée. 5-7.",
    },
    {
      minute: 31, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Pierre Popelin (Castres). 7-7.",
    },

    // === MI-TEMPS : Castres 7 - USAP 7 ===

    // === 2e mi-temps ===
    {
      minute: 46, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Pierre Popelin (Castres). L'ouvreur castrais ouvre le score en 2e période. 10-7.",
    },
    {
      minute: 51, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Pierre Popelin (Castres). L'USAP est sanctionnée pour son indiscipline. 13-7.",
    },
    {
      minute: 66, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Pierre Popelin (Castres). 3e pénalité du buteur castrais. 16-7.",
    },
    {
      minute: 80, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Jack Goodhue (Castres). Le centre néo-zélandais intercepte et traverse tout le terrain. 21-7.",
    },
    {
      minute: 80, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Théo Chabouni (Castres). Score final 23-7.",
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
    const side = evt.isUsap ? "USAP" : "CO  ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Stade Pierre Fabre (Castres)");
  console.log("  Arbitre : Vincent Blasco-Baqué");
  console.log("  Score mi-temps : Castres 7 - USAP 7");
  console.log("  Score final : Castres 23 - USAP 7");
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

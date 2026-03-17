/**
 * Script de mise à jour du match USAP - Clermont (J12 Top 14, 20/12/2025)
 * Score final : USAP 26 - Clermont 20
 * Mi-temps : USAP 16 - Clermont 6
 *
 * PREMIÈRE VICTOIRE DE LA SAISON ! Après 11 défaites consécutives, l'USAP
 * s'impose enfin à Aimé-Giral. Joseph ouvre le score d'un essai en contre-attaque
 * sur 75 mètres (7', 7-0) mais écope d'un carton rouge pour plaquage dangereux
 * sur Delguy (20'). L'USAP joue à 14 pendant plus d'une heure mais tient bon.
 * Urdapilleta porte l'équipe avec 16 points au pied (4P + 2T). Buliruarua
 * marque le 2e essai catalan (47'). Jauneau (43') et Delguy (72') répondent
 * pour Clermont mais c'est insuffisant.
 *
 * Arbitre : Thomas Charabas
 *
 * Sources : top14.lnr.fr, francebleu.fr, xvovalie.com, lerugbynistere.fr
 *
 * Exécution : npx tsx scripts/update-match-j12-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match USAP - Clermont (J12, 20/12/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J12 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 12,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Thomas Charabas
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Charabas", mode: "insensitive" } },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Thomas",
        lastName: "Charabas",
        slug: "thomas-charabas",
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
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Aimé-Giral", mode: "insensitive" } },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade Aimé-Giral",
        slug: "stade-aime-giral",
        city: "Perpignan",
        capacity: 14500,
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
    "Tetrashvili", "Malolo", "Brookes", "Yato", "Tanguy",
    "Van Tonder", "Ritchie", "Oviedo", "Hall", "Urdapilleta",
    "Joseph", "Buliruarua", "Duguivalu", "Petaia", "Forner",
    "Ruiz", "Beria", "Warion", "Le Corvec",
    "Hicks", "Ecochard", "Reus", "Roelofse",
  ];

  for (const name of usapNames) {
    try {
      if (name === "Van Tonder") {
        PLAYER_IDS[name] = await findPlayer(name, "Jacobus");
      } else if (name === "Joseph") {
        PLAYER_IDS[name] = await findPlayer(name, "Jefferson-Lee");
      } else if (name === "Le Corvec") {
        PLAYER_IDS[name] = await findPlayer(name, "Mattéo");
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
   * Évolution du score (USAP - Clermont) :
   *  7' Essai Joseph (USAP) → 5-0
   *  7' Transfo Urdapilleta (USAP) → 7-0
   * 10' Pénalité Urdapilleta (USAP) → 10-0
   * 15' Pénalité Plummer (ASM) → 10-3
   * 20' Carton rouge Joseph (USAP)
   * 28' Pénalité Urdapilleta (USAP) → 13-3
   * 35' Pénalité Plummer (ASM) → 13-6
   * 38' Pénalité Urdapilleta (USAP) → 16-6
   * MI-TEMPS : USAP 16 - Clermont 6
   * 43' Essai Jauneau (ASM) → 16-11
   * 44' Transfo Plummer (ASM) → 16-13
   * 52' Pénalité Urdapilleta (USAP) → 19-13
   * 47' Essai Buliruarua (USAP) → 24-13
   * 47' Transfo Urdapilleta (USAP) → 26-13
   * 72' Essai Delguy (ASM) → 26-18
   * 72' Transfo Plummer (ASM) → 26-20
   *
   * USAP : 2E + 2T + 4P = 10 + 4 + 12 = 26 points
   * Clermont : 2E + 2T + 2P = 10 + 4 + 6 = 20 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:35",
      refereeId: referee.id,
      venueId: venue.id,
      halfTimeUsap: 16,
      halfTimeOpponent: 6,
      // Détail scoring USAP
      triesUsap: 2,
      conversionsUsap: 2,
      penaltiesUsap: 4,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Clermont
      triesOpponent: 2,
      conversionsOpponent: 2,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Vidéo
      videoUrl: "https://www.youtube.com/watch?v=2jlXtZWiFrs",
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "PREMIÈRE VICTOIRE DE LA SAISON ! Après 11 défaites consécutives, l'USAP s'impose enfin " +
        "à Aimé-Giral face à Clermont (26-20), et ce malgré une infériorité numérique pendant " +
        "plus d'une heure. Jefferson-Lee Joseph ouvre le score d'un superbe essai en contre-attaque " +
        "sur 75 mètres (7', 7-0) mais écope d'un carton rouge pour un plaquage dangereux sur " +
        "Delguy (20'). Réduits à 14, les Catalans ne lâchent rien. Benjamin Urdapilleta, " +
        "impérial, porte l'équipe avec 16 points au pied (4 pénalités + 2 transformations) " +
        "et initie l'essai de Buliruarua d'une chandelle millimétrée (47', 26-13). " +
        "Clermont réagit par Jauneau (43') et Delguy (72') mais ne parvient pas à renverser " +
        "la rencontre. Jamie Ritchie est élu homme du match pour sa performance héroïque " +
        "en 3e ligne. Aimé-Giral explose de joie au coup de sifflet final.",
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
    { num: 2, lastName: "Malolo", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 56 },
    { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 56 },
    { num: 4, lastName: "Yato", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 65 },
    { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 6, lastName: "Van Tonder", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 7, lastName: "Ritchie", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 80 },
    { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 60 },
    { num: 10, lastName: "Urdapilleta", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 80,
      conversions: 2, penalties: 4, totalPoints: 16 }, // 2T(4) + 4P(12) = 16
    { num: 11, lastName: "Joseph", position: "AILIER" as const, isStarter: true, minutesPlayed: 20,
      tries: 1, totalPoints: 5, redCard: true, redCardMinute: 20 }, // Essai 7', CR 20'
    { num: 12, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80,
      tries: 1, totalPoints: 5 }, // Essai 47'
    { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Petaia", position: "AILIER" as const, isStarter: true, minutesPlayed: 60 },
    { num: 15, lastName: "Forner", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 24 },           // entré 56'
    { num: 17, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 24 },      // entré 56'
    { num: 18, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 15 },    // entré 65'
    { num: 19, lastName: "Le Corvec", position: "NUMERO_HUIT" as const, isStarter: false, minutesPlayed: 0 },     // non entré
    { num: 20, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 0 }, // non entré
    { num: 21, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 20 },   // entré 60'
    { num: 22, lastName: "Reus", position: "DEMI_OUVERTURE" as const, isStarter: false, minutesPlayed: 20 },      // entré 60'
    { num: 23, lastName: "Roelofse", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 24 },    // entré 56'
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
        isCaptain: false,
        positionPlayed: p.position,
        tries: (p as { tries?: number }).tries ?? 0,
        conversions: (p as { conversions?: number }).conversions ?? 0,
        penalties: (p as { penalties?: number }).penalties ?? 0,
        dropGoals: 0,
        totalPoints: (p as { totalPoints?: number }).totalPoints ?? 0,
        minutesPlayed: p.minutesPlayed,
        yellowCard: false,
        yellowCardMin: null,
        redCard: (p as { redCard?: boolean }).redCard ?? false,
        redCardMin: (p as { redCardMinute?: number }).redCardMinute ?? null,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const rc = (p as { redCard?: boolean }).redCard ? " [CR]" : "";
    const pts = (p as { totalPoints?: number }).totalPoints ? ` (${(p as { totalPoints?: number }).totalPoints} pts)` : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${pts}${rc} [${p.minutesPlayed}']`);
  }

  const totalPointsUSAP = USAP_SQUAD.reduce((sum, p) => sum + ((p as { totalPoints?: number }).totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsUSAP} (attendu : 26)`);
  if (totalPointsUSAP !== 26) {
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
      minute: 7, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Joseph"], isUsap: true,
      description: "Essai de Jefferson-Lee Joseph (USAP). Superbe contre-attaque catalane sur 75 mètres. 5-0.",
    },
    {
      minute: 7, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). 7-0.",
    },
    {
      minute: 10, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Pénalité de Benjamin Urdapilleta (USAP). 10-0.",
    },
    {
      minute: 15, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Harrison Plummer (Clermont). 10-3.",
    },
    {
      minute: 20, type: "CARTON_ROUGE" as const,
      playerId: PLAYER_IDS["Joseph"], isUsap: true,
      description: "Carton rouge pour Jefferson-Lee Joseph (USAP). Plaquage dangereux sur Bautista Delguy. L'USAP réduite à 14.",
    },
    {
      minute: 28, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Pénalité de Benjamin Urdapilleta (USAP). 13-3.",
    },
    {
      minute: 35, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Harrison Plummer (Clermont). 13-6.",
    },
    {
      minute: 38, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Pénalité de Benjamin Urdapilleta (USAP). 16-6.",
    },

    // === MI-TEMPS : USAP 16 - Clermont 6 ===

    // === 2e mi-temps ===
    {
      minute: 43, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Baptiste Jauneau (Clermont). Le demi de mêlée marque au pied des poteaux. 16-11.",
    },
    {
      minute: 43, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Harrison Plummer (Clermont). 16-13.",
    },
    {
      minute: 47, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Buliruarua"], isUsap: true,
      description: "Essai d'Eneriko Buliruarua (USAP). Après une chandelle millimétrée d'Urdapilleta. 21-13.",
    },
    {
      minute: 47, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). 23-13.",
    },
    {
      minute: 52, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Pénalité de Benjamin Urdapilleta (USAP). 26-13.",
    },
    {
      minute: 72, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Bautista Delguy (Clermont). L'ailier argentin relance le suspense. 26-18.",
    },
    {
      minute: 72, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Harrison Plummer (Clermont). 26-20.",
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
    const side = evt.isUsap ? "USAP" : "ASM ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Aimé-Giral (Perpignan) — domicile");
  console.log("  Arbitre : Thomas Charabas");
  console.log("  Score mi-temps : USAP 16 - Clermont 6");
  console.log("  Score final : USAP 26 - Clermont 20");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length}`);
  console.log("  🎉 PREMIÈRE VICTOIRE DE LA SAISON !");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

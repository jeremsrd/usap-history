/**
 * Script de mise à jour du match Racing 92 - USAP (J16 Top 14, 31/01/2026)
 * Score final : Racing 92 37 - USAP 31
 * Mi-temps : Racing 92 20 - USAP 14
 *
 * Match fou à La Défense Arena. Le Racing démarre en trombe avec 2 essais en 5 minutes
 * (Tarrit 3', James 5') pour mener 14-0. L'USAP réagit par Chinarro (8') puis un essai
 * de pénalité (22') pour revenir à 14-14. Gibert remet le Racing devant avec 2 pénalités
 * (20-14 à la pause). Tuisova est expulsé (37', rouge) mais le Racing creuse l'écart
 * à 15 contre 14 : Gogichashvili (56'), pénalité Gibert (61'), Taofifenua (66') → 37-17.
 * L'USAP se réveille en fin de match : Joseph (75'), Chinarro doublé (77') → 37-31.
 * Un dernier essai est refusé à la vidéo. Défaite frustrante sans point de bonus.
 *
 * Arbitre : non confirmé
 *
 * Sources : top14.lnr.fr, defense-92.fr, allrugby.com, blog-rct.com
 *
 * Exécution : npx tsx scripts/update-match-j16-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match Racing 92 - USAP (J16, 31/01/2026) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J16 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 16,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Stade : Paris La Défense Arena (extérieur)
  // ---------------------------------------------------------------
  console.log("--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Défense Arena", mode: "insensitive" } },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Paris La Défense Arena",
        city: "Nanterre",
        capacity: 32000,
        slug: "paris-la-defense-arena",
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

  // Créer les joueurs USAP qui n'existent peut-être pas encore
  async function findOrCreatePlayer(firstName: string, lastName: string, position: Position): Promise<string> {
    let player = await prisma.player.findFirst({
      where: { lastName: { equals: lastName, mode: "insensitive" } },
    });
    if (!player) {
      const slug = `${firstName}-${lastName}`
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      player = await prisma.player.create({
        data: { firstName, lastName, slug, position, isActive: true },
      });
      console.log(`  [NEW] ${firstName} ${lastName}`);
    }
    return player.id;
  }

  const PLAYER_IDS: Record<string, string> = {};

  // Joueurs existants
  const existingPlayers = [
    "Devaux", "Montgaillard", "Tanguy", "Chinarro", "Velarte",
    "Hall", "Granell", "De La Fuente", "Duguivalu", "Joseph", "Forner",
    "Malolo", "Yato", "Tuilagi", "Urdapilleta", "Poulet", "Ceccarelli",
  ];

  for (const name of existingPlayers) {
    try {
      if (name === "De La Fuente") {
        PLAYER_IDS[name] = await findPlayer(name, "Jerónimo");
      } else {
        PLAYER_IDS[name] = await findPlayer(name);
      }
      console.log(`  ✓ ${name}`);
    } catch {
      console.log(`  ✗ ${name} — NON TROUVÉ`);
    }
  }

  // Joueurs potentiellement nouveaux
  PLAYER_IDS["Roelofse"] = await findOrCreatePlayer("Nemo", "Roelofse", "PILIER_DROIT");
  PLAYER_IDS["Warion"] = await findOrCreatePlayer("Adrien", "Warion", "DEUXIEME_LIGNE");
  PLAYER_IDS["Le Corvec"] = await findOrCreatePlayer("Mattéo", "Le Corvec", "TROISIEME_LIGNE_AILE");
  PLAYER_IDS["Reus"] = await findOrCreatePlayer("Hugo", "Reus", "DEMI_OUVERTURE");
  PLAYER_IDS["Beria"] = await findOrCreatePlayer("Giorgi", "Beria", "PILIER_GAUCHE");
  PLAYER_IDS["Diaby"] = await findOrCreatePlayer("Mahamadou", "Diaby", "TROISIEME_LIGNE_AILE");

  // ---------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (Racing - USAP) :
   *  3' Essai Tarrit (Racing) + Transfo Gibert (4') → 7-0
   *  5' Essai James (Racing) + Transfo Gibert (6') → 14-0
   *  8' Essai Chinarro (USAP) + Transfo Reus (9') → 14-7
   * 14' Carton jaune Carbonneau (Racing)
   * 22' Carton jaune Taofifenua (Racing) + Essai de pénalité (USAP) → 14-14
   * 25' Pénalité Gibert (Racing) → 17-14
   * 28' Pénalité Gibert (Racing) → 20-14
   * MI-TEMPS : Racing 20 - USAP 14
   * 37' Carton rouge Tuisova (Racing) — Racing à 14
   * 47' Pénalité Reus (USAP) → 20-17
   * 55' Carton jaune Tuilagi (USAP) — USAP à 14 aussi temporairement
   * 56' Essai Gogichashvili (Racing) + Transfo Gibert (57') → 27-17
   * 61' Pénalité Gibert (Racing) → 30-17
   * 66' Essai Taofifenua (Racing) + Transfo Gibert (67') → 37-17
   * 75' Essai Joseph (USAP) + Transfo Reus (76') → 37-24
   * 77' Essai Chinarro (USAP) + Transfo Reus (78') → 37-31
   * 80' Essai refusé USAP à la vidéo
   *
   * Racing : 4E + 4T + 3P = 20 + 8 + 9 = 37 points
   * USAP : 3E + 1EP + 3T + 1P = 15 + 7 + 6 + 3 = 31 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:35",
      venueId: venue.id,
      halfTimeUsap: 14,
      halfTimeOpponent: 20,
      // Détail scoring USAP
      triesUsap: 3,
      conversionsUsap: 3,
      penaltiesUsap: 1,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 1,
      // Détail scoring Racing
      triesOpponent: 4,
      conversionsOpponent: 4,
      penaltiesOpponent: 3,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Vidéo
      videoUrl: "https://www.youtube.com/watch?v=eJdC4qggqcE",
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Match fou à la Paris La Défense Arena. Le Racing démarre en trombe avec deux essais en " +
        "cinq minutes par Tarrit (3') et James (5') pour mener 14-0. L'USAP ne panique pas : " +
        "Chinarro réplique immédiatement (8', 14-7) puis un essai de pénalité ramène les Catalans " +
        "à hauteur (22', 14-14). Gibert remet le Racing devant avec deux pénalités (20-14 à la pause). " +
        "Tuisova est expulsé pour un geste dangereux (37') mais paradoxalement, le Racing, à 14, " +
        "se montre plus efficace : Gogichashvili (56'), pénalité Gibert (61'), Taofifenua (66') " +
        "portent le score à 37-17. L'USAP, qui joue pourtant à 15 contre 14, semble résignée " +
        "avant un réveil spectaculaire dans les 10 dernières minutes : Joseph (75') puis Chinarro " +
        "pour le doublé (77') ramènent l'USAP à 37-31. Un dernier essai est refusé à la vidéo " +
        "dans les dernières secondes. Défaite frustrante, sans bonus, malgré une fin de match héroïque.",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, stade, rapport)");

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
    { num: 1, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: true, minutesPlayed: 56 },
    { num: 2, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 56 },
    { num: 3, lastName: "Roelofse", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 56 },
    { num: 4, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 6, lastName: "Chinarro", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80,
      tries: 2, totalPoints: 10 }, // Doublé 8', 77'
    { num: 7, lastName: "Le Corvec", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 60 },
    { num: 8, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 80 },
    { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 60 },
    { num: 10, lastName: "Reus", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 80,
      conversions: 3, penalties: 1, totalPoints: 9 }, // 3T(6) + 1P(3) = 9
    { num: 11, lastName: "Granell", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Joseph", position: "AILIER" as const, isStarter: true, minutesPlayed: 80,
      tries: 1, totalPoints: 5 }, // Essai 75'
    { num: 15, lastName: "Forner", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Malolo", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 24 },            // entré 56'
    { num: 17, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 24 },          // entré 56'
    { num: 18, lastName: "Yato", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 20 },          // entré 60'
    { num: 19, lastName: "Tuilagi", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 24,
      yellowCard: true, yellowCardMin: 55 }, // Carton jaune 55', entré 56' environ
    { num: 20, lastName: "Diaby", position: "NUMERO_HUIT" as const, isStarter: false, minutesPlayed: 20 },            // entré 60'
    { num: 21, lastName: "Urdapilleta", position: "DEMI_OUVERTURE" as const, isStarter: false, minutesPlayed: 0 },    // non entré
    { num: 22, lastName: "Poulet", position: "CENTRE" as const, isStarter: false, minutesPlayed: 0 },                  // non entré
    { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 24 },       // entré 56'
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
        yellowCard: (p as { yellowCard?: boolean }).yellowCard ?? false,
        yellowCardMin: (p as { yellowCardMin?: number }).yellowCardMin ?? null,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    const pts = (p as { totalPoints?: number }).totalPoints ? ` (${(p as { totalPoints?: number }).totalPoints} pts)` : "";
    const yc = (p as { yellowCard?: boolean }).yellowCard ? " 🟨" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${yc} [${p.minutesPlayed}']`);
  }

  // L'essai de pénalité (7 pts) n'est attribué à aucun joueur individuellement
  const totalPointsUSAP = USAP_SQUAD.reduce((sum, p) => sum + ((p as { totalPoints?: number }).totalPoints ?? 0), 0);
  const totalWithPenaltyTry = totalPointsUSAP + 7; // +7 pour l'essai de pénalité
  console.log(`\n  Vérification : total points individuels = ${totalPointsUSAP} + 7 (essai pénalité) = ${totalWithPenaltyTry} (attendu : 31)`);
  if (totalWithPenaltyTry !== 31) {
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
      minute: 3, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Janick Tarrit (Racing 92). Début de match tonitruant des Ciel et Blanc. 5-0.",
    },
    {
      minute: 4, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation d'Antoine Gibert (Racing 92). 7-0.",
    },
    {
      minute: 5, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Samuel James (Racing 92). Deuxième essai en 5 minutes ! 12-0.",
    },
    {
      minute: 6, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation d'Antoine Gibert (Racing 92). 14-0.",
    },
    {
      minute: 8, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Chinarro"], isUsap: true,
      description: "Essai de Bastien Chinarro (USAP). Réaction immédiate des Catalans. 14-5.",
    },
    {
      minute: 9, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Transformation d'Hugo Reus (USAP). 14-7.",
    },
    {
      minute: 14, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton jaune pour Léo Carbonneau (Racing 92). Racing à 14 temporairement.",
    },
    {
      minute: 22, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton jaune pour Romain Taofifenua (Racing 92).",
    },
    {
      minute: 22, type: "ESSAI_PENALITE" as const,
      playerId: null, isUsap: true,
      description: "Essai de pénalité accordé à l'USAP. Les Catalans reviennent à hauteur. 14-14.",
    },
    {
      minute: 25, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité d'Antoine Gibert (Racing 92). 17-14.",
    },
    {
      minute: 28, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité d'Antoine Gibert (Racing 92). 20-14.",
    },

    // === MI-TEMPS : Racing 20 - USAP 14 ===

    // === 2e mi-temps ===
    {
      minute: 37, type: "CARTON_ROUGE" as const,
      playerId: null, isUsap: false,
      description: "Carton rouge pour Josua Tuisova (Racing 92). Geste dangereux. Racing à 14 pour le reste du match.",
    },
    {
      minute: 47, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Pénalité d'Hugo Reus (USAP). 20-17.",
    },
    {
      minute: 55, type: "CARTON_JAUNE" as const,
      playerId: PLAYER_IDS["Tuilagi"], isUsap: true,
      description: "Carton jaune pour Posolo Tuilagi (USAP). Les deux équipes à 14 temporairement.",
    },
    {
      minute: 56, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Guram Gogichashvili (Racing 92). Le Racing marque malgré l'infériorité numérique. 25-17.",
    },
    {
      minute: 57, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation d'Antoine Gibert (Racing 92). 27-17.",
    },
    {
      minute: 61, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité d'Antoine Gibert (Racing 92). 30-17.",
    },
    {
      minute: 66, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Romain Taofifenua (Racing 92). De retour après son carton jaune, il inscrit l'essai. 35-17.",
    },
    {
      minute: 67, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation d'Antoine Gibert (Racing 92). 37-17.",
    },
    {
      minute: 75, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Joseph"], isUsap: true,
      description: "Essai de Jefferson Lee Joseph (USAP). Les Catalans se réveillent enfin. 37-22.",
    },
    {
      minute: 76, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Transformation d'Hugo Reus (USAP). 37-24.",
    },
    {
      minute: 77, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Chinarro"], isUsap: true,
      description: "Essai de Bastien Chinarro (USAP) ! Doublé pour le troisième ligne. L'USAP revient à 6 points. 37-29.",
    },
    {
      minute: 78, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Transformation d'Hugo Reus (USAP). 37-31. Plus que 6 points d'écart !",
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
    const side = evt.isUsap ? "USAP" : "R92 ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Paris La Défense Arena (Nanterre) — extérieur");
  console.log("  Score mi-temps : Racing 20 - USAP 14");
  console.log("  Score final : Racing 92 37 - USAP 31");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length}`);
  console.log("  ❌ Défaite sans bonus — essai refusé à la vidéo dans les dernières secondes");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Script de mise à jour du match Stade Français - USAP (J18 Top 14, 28/02/2026)
 * Score final : Stade Français 42 - USAP 21
 * Mi-temps : Stade Français 28 - USAP 0
 *
 * Lourde défaite à Jean-Bouin. L'USAP est amorphe en 1re mi-temps, dominée
 * dans tous les secteurs, et encaisse 4 essais (28-0). Le Staff opère des
 * changements à la pause et les Catalans montrent un tout autre visage en 2e :
 * Velarte (49'), Joseph (62'), Velarte doublé (80'), mais c'est trop tard.
 * Allan assure 3/3 aux transformations en sortie de banc.
 *
 * Sources : top14.lnr.fr, francebleu.fr, rugbyscope.fr
 *
 * Exécution : npx tsx scripts/update-match-j18-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match Stade Français - USAP (J18, 28/02/2026) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 18,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Stade : Jean-Bouin (extérieur)
  // ---------------------------------------------------------------
  console.log("--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Jean-Bouin", mode: "insensitive" } },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade Jean-Bouin",
        city: "Paris",
        capacity: 20000,
        slug: "stade-jean-bouin",
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

  const existingPlayers = [
    "Tetrashvili", "Lotrian", "Ceccarelli", "Warion", "Tanguy",
    "Chinarro", "Van Tonder", "Yato", "Ecochard", "Reus",
    "Forner", "De La Fuente", "Duguivalu", "Joseph", "Tedder",
    "Malolo", "Devaux", "Tuilagi", "Hicks", "Hall", "Velarte", "Brookes",
  ];

  for (const name of existingPlayers) {
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

  // Joueur potentiellement nouveau
  PLAYER_IDS["Allan"] = await findOrCreatePlayer("Tommaso", "Allan", "DEMI_OUVERTURE");

  // ---------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (SF - USAP) :
   *  6' Essai Tanga Mangene (SF) + Transfo Carbonel (7') → 7-0
   * 21' Essai Ward (SF) + Transfo Carbonel (22') → 14-0
   * 30' Essai Vili (SF) + Transfo Carbonel (31') → 21-0
   * 37' Essai Hirigoyen (SF) + Transfo Carbonel (38') → 28-0
   * MI-TEMPS : SF 28 - USAP 0
   * 49' Essai Velarte (USAP) + Transfo Allan (50') → 28-7
   * 56' Essai Motassi (SF) + Transfo Carbonel (56') → 35-7
   * 59' Carton jaune Nicotera (SF)
   * 62' Essai Joseph (USAP) + Transfo Allan (62') → 35-14
   * 73' Essai Halaifonua (SF) + Transfo Carbonel (73') → 42-14
   * 80' Essai Velarte (USAP) + Transfo Allan (80') → 42-21
   *
   * SF : 6E + 6T = 30 + 12 = 42 points
   * USAP : 3E + 3T = 15 + 6 = 21 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:35",
      venueId: venue.id,
      halfTimeUsap: 0,
      halfTimeOpponent: 28,
      // Détail scoring USAP
      triesUsap: 3,
      conversionsUsap: 3,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring SF
      triesOpponent: 6,
      conversionsOpponent: 6,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Lourde défaite à Jean-Bouin (42-21). L'USAP est méconnaissable en première mi-temps, " +
        "dominée dans tous les secteurs du jeu, incapable de mettre la moindre pression sur les " +
        "Parisiens. Le Stade Français déroule avec 4 essais (Tanga Mangene 6', Ward 21', Vili 30', " +
        "Hirigoyen 37') pour mener 28-0 à la pause, un score sans appel. Carbonel réussit toutes " +
        "ses transformations. Au retour des vestiaires, le staff catalan opère des changements " +
        "et l'USAP montre un tout autre visage. Velarte relance l'espoir (49', 28-7) mais Motassi " +
        "coupe court au suspense (56', 35-7). Joseph profite du carton jaune de Nicotera (59') " +
        "pour marquer (62', 35-14). Halaifonua enfonce le clou (73', 42-14) avant un dernier " +
        "essai d'orgueil de Velarte pour le doublé (80', 42-21). Allan réussit ses 3 transformations " +
        "en sortie de banc. Une défaite qui stoppe l'élan de l'USAP après la belle série à domicile.",
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
    { num: 1, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: true, minutesPlayed: 56 },
    { num: 2, lastName: "Lotrian", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 46 },
    { num: 3, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 46 },
    { num: 4, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 6, lastName: "Chinarro", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 7, lastName: "Van Tonder", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 60 },
    { num: 8, lastName: "Yato", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 80 },
    { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 46 },
    { num: 10, lastName: "Reus", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 46 },
    { num: 11, lastName: "Forner", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Joseph", position: "AILIER" as const, isStarter: true, minutesPlayed: 80,
      tries: 1, totalPoints: 5 }, // Essai 62'
    { num: 15, lastName: "Tedder", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Malolo", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 34 },             // entré 46'
    { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 24 },          // entré 56'
    { num: 18, lastName: "Tuilagi", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 34 },          // entré 46'
    { num: 19, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 20 },    // entré 60'
    { num: 20, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 34 },            // entré 46'
    { num: 21, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: false, minutesPlayed: 34,
      conversions: 3, totalPoints: 6 }, // 3T(6), entré 46'
    { num: 22, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: false, minutesPlayed: 34,
      tries: 2, totalPoints: 10 }, // Doublé 49', 80', entré 46'
    { num: 23, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 34 },          // entré 46'
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
  console.log(`\n  Vérification : total points individuels = ${totalPointsUSAP} (attendu : 21)`);
  if (totalPointsUSAP !== 21) {
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
      minute: 6, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Yoan Tanga Mangene (Stade Français). Les Parisiens ouvrent le score rapidement. 5-0.",
    },
    {
      minute: 7, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Louis Carbonel (Stade Français). 7-0.",
    },
    {
      minute: 21, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Jérémy Ward (Stade Français). 12-0.",
    },
    {
      minute: 22, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Louis Carbonel (Stade Français). 14-0.",
    },
    {
      minute: 30, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Tani Vili (Stade Français). Le centre enfonce une défense catalane aux abois. 19-0.",
    },
    {
      minute: 31, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Louis Carbonel (Stade Français). 21-0.",
    },
    {
      minute: 37, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Mathieu Hirigoyen (Stade Français). 4e essai, le bonus offensif est acquis avant la pause. 26-0.",
    },
    {
      minute: 38, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Louis Carbonel (Stade Français). 28-0.",
    },

    // === MI-TEMPS : SF 28 - USAP 0 ===

    // === 2e mi-temps ===
    {
      minute: 49, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Essai de Lucas Velarte (USAP). Le remplaçant relance les Catalans en sortie de vestiaires. 28-5.",
    },
    {
      minute: 50, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 28-7.",
    },
    {
      minute: 56, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Thibaut Motassi (Stade Français). Le remplaçant coupe court au suspense. 33-7.",
    },
    {
      minute: 56, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Louis Carbonel (Stade Français). 35-7.",
    },
    {
      minute: 59, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton jaune pour Giacomo Nicotera (Stade Français).",
    },
    {
      minute: 62, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Joseph"], isUsap: true,
      description: "Essai de Jefferson Lee Joseph (USAP). En supériorité numérique, les Catalans marquent. 35-12.",
    },
    {
      minute: 62, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 35-14.",
    },
    {
      minute: 73, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Tanginoa Halaifonua (Stade Français). Le remplaçant enfonce le clou. 40-14.",
    },
    {
      minute: 73, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Louis Carbonel (Stade Français). 6/6 aux transformations. 42-14.",
    },
    {
      minute: 80, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Essai de Lucas Velarte (USAP). Doublé d'orgueil pour le n°8. 42-19.",
    },
    {
      minute: 80, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 3/3 aux transformations. Score final 42-21.",
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
    const side = evt.isUsap ? "USAP" : "SF  ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Jean-Bouin (Paris) — extérieur");
  console.log("  Score mi-temps : SF 28 - USAP 0");
  console.log("  Score final : Stade Français 42 - USAP 21");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length}`);
  console.log("  ❌ Lourde défaite — 28-0 à la pause, réaction d'orgueil en 2e mi-temps");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

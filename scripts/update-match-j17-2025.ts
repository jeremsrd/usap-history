/**
 * Script de mise à jour du match USAP - Section Paloise (J17 Top 14, 22/02/2026)
 * Score final : USAP 40 - Pau 24
 * Mi-temps : USAP 30 - Pau 17
 *
 * L'USAP régale Aimé-Giral avec 5 essais contre le dauphin palois !
 * Duguivalu ouvre le bal dès la 4e minute, Tanguy enchaîne (12'), puis
 * Joseph inscrit un doublé (20', 35'). Malgré les essais de Montoya (8')
 * et Grandidier-Nkanang juste avant la pause (41'), l'USAP mène 30-17.
 * En 2e mi-temps, Velarte valide le bonus offensif (78'). Urdapilleta
 * assure au pied avec 3 transformations et 3 pénalités (15 pts).
 * 4e victoire consécutive à domicile, l'USAP confirme sa remontée.
 *
 * Sources : top14.lnr.fr, francebleu.fr, blog-rct.com, dicodusport.fr
 *
 * Exécution : npx tsx scripts/update-match-j17-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match USAP - Pau (J17, 22/02/2026) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J17 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 17,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Stade : Aimé-Giral (domicile)
  // ---------------------------------------------------------------
  console.log("--- Stade ---");
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
    "Tetrashvili", "Malolo", "Ceccarelli", "Chinarro", "Tanguy",
    "Le Corvec", "Yato", "Ecochard", "Urdapilleta",
    "Forner", "De La Fuente", "Duguivalu", "Joseph",
    "Montgaillard", "Devaux", "Hicks", "Velarte", "Reus",
    "Diaby",
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
  PLAYER_IDS["Tedder"] = await findOrCreatePlayer("Tristan", "Tedder", "ARRIERE");
  PLAYER_IDS["Lotrian"] = await findOrCreatePlayer("Mathys", "Lotrian", "TALONNEUR");
  PLAYER_IDS["Buliruarua"] = await findOrCreatePlayer("Eneriko", "Buliruarua", "AILIER");
  PLAYER_IDS["Fakatika"] = await findOrCreatePlayer("Akato", "Fakatika", "PILIER_DROIT");

  // ---------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (USAP - Pau) :
   *  4' Essai Duguivalu (USAP) + Transfo Urdapilleta → 7-0
   *  8' Essai Montoya (Pau) + Transfo Despérès → 7-7
   * 12' Essai Tanguy (USAP), non transformé → 12-7
   * 16' Pénalité Urdapilleta (USAP) → 15-7
   * 20' Essai Joseph (USAP) + Transfo Urdapilleta → 22-7
   * 28' Pénalité Despérès (Pau) → 22-10
   * 35' Essai Joseph (USAP), non transformé → 27-10
   * 38' Pénalité Urdapilleta (USAP) → 30-10
   * 41' Essai Grandidier-Nkanang (Pau) + Transfo Despérès → 30-17
   * MI-TEMPS : USAP 30 - Pau 17
   * 55' Pénalité Urdapilleta (USAP) → 33-17
   * 74' Essai Etchebehere (Pau) + Transfo Arfeuil → 33-24
   * 78' Essai Velarte (USAP) + Transfo Urdapilleta → 40-24
   *
   * USAP : 5E + 3T + 3P = 25 + 6 + 9 = 40 points
   * Pau : 3E + 3T + 1P = 15 + 6 + 3 = 24 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "18:15",
      venueId: venue.id,
      halfTimeUsap: 30,
      halfTimeOpponent: 17,
      // Détail scoring USAP
      triesUsap: 5,
      conversionsUsap: 3,
      penaltiesUsap: 3,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Pau
      triesOpponent: 3,
      conversionsOpponent: 3,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: true,
      bonusDefensif: false,
      // Rapport
      report:
        "L'USAP régale un Aimé-Giral conquis en s'offrant le scalp de la Section Paloise, " +
        "dauphin du championnat, dans un match en retard de la 17e journée (40-24). " +
        "Libérés collectivement et audacieux, les Catalans imposent un rythme inédit. " +
        "Duguivalu ouvre le bal dès la 4e minute (7-0). Pau égalise par Montoya (8', 7-7) " +
        "mais l'USAP déroule ensuite : Tanguy (12'), puis un doublé de Joseph (20', 35') " +
        "portent le score à 30-10 avant que Grandidier-Nkanang ne réduise l'écart juste " +
        "avant la pause (30-17). En deuxième période, Urdapilleta gère parfaitement le tempo " +
        "avec une pénalité (55', 33-17). Etchebehere relance les espoirs palois (74', 33-24) " +
        "mais Velarte clôt les débats d'un essai en fin de match (78', 40-24). " +
        "Urdapilleta termine avec 15 points au pied (3T + 3P). Quatrième victoire " +
        "consécutive à domicile, l'USAP confirme sa spectaculaire remontée au classement.",
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
    { num: 2, lastName: "Malolo", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 56 },
    { num: 3, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 56 },
    { num: 4, lastName: "Chinarro", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80,
      tries: 1, totalPoints: 5 }, // Essai 12'
    { num: 6, lastName: "Diaby", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 65 },
    { num: 7, lastName: "Le Corvec", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 8, lastName: "Yato", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 80 },
    { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 60 },
    { num: 10, lastName: "Urdapilleta", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 80,
      conversions: 3, penalties: 3, totalPoints: 15 }, // 3T(6) + 3P(9) = 15
    { num: 11, lastName: "Forner", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80,
      tries: 1, totalPoints: 5 }, // Essai 4'
    { num: 14, lastName: "Joseph", position: "AILIER" as const, isStarter: true, minutesPlayed: 80,
      tries: 2, totalPoints: 10 }, // Doublé 20', 35'
    { num: 15, lastName: "Tedder", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Lotrian", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 24 },            // entré 56'
    { num: 17, lastName: "Montgaillard", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 24 },    // entré 56' (comme talonneur en J15, ici en pilier?)
    { num: 18, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 24 },          // entré 56'
    { num: 19, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 15 },    // entré 65'
    { num: 20, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: false, minutesPlayed: 24,
      tries: 1, totalPoints: 5 }, // Essai 78', entré 56'
    { num: 21, lastName: "Reus", position: "DEMI_OUVERTURE" as const, isStarter: false, minutesPlayed: 20 },           // entré 60'
    { num: 22, lastName: "Buliruarua", position: "AILIER" as const, isStarter: false, minutesPlayed: 0 },              // non entré
    { num: 23, lastName: "Fakatika", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 24 },         // entré 56'
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
  console.log(`\n  Vérification : total points individuels = ${totalPointsUSAP} (attendu : 40)`);
  if (totalPointsUSAP !== 40) {
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
      minute: 4, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Duguivalu"], isUsap: true,
      description: "Essai d'Alivereti Duguivalu (USAP). Ouverture du score précoce des Catalans. 5-0.",
    },
    {
      minute: 4, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). 7-0.",
    },
    {
      minute: 8, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Julián Montoya (Pau). Le talonneur argentin réplique immédiatement. 7-5.",
    },
    {
      minute: 8, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation d'Axel Despérès (Pau). 7-7.",
    },
    {
      minute: 12, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Tanguy"], isUsap: true,
      description: "Essai de Mathieu Tanguy (USAP). Le deuxième ligne marque à son tour. Non transformé. 12-7.",
    },
    {
      minute: 16, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Pénalité de Benjamin Urdapilleta (USAP). 15-7.",
    },
    {
      minute: 20, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Joseph"], isUsap: true,
      description: "Essai de Jefferson Lee Joseph (USAP). L'ailier fidjien entre en scène. 20-7.",
    },
    {
      minute: 20, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). 22-7.",
    },
    {
      minute: 28, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité d'Axel Despérès (Pau). 22-10.",
    },
    {
      minute: 35, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Joseph"], isUsap: true,
      description: "Essai de Jefferson Lee Joseph (USAP) ! Doublé pour l'ailier. Non transformé. 27-10.",
    },
    {
      minute: 38, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Pénalité de Benjamin Urdapilleta (USAP). 30-10.",
    },
    {
      minute: 41, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai d'Aaron Grandidier-Nkanang (Pau). L'ailier marque juste avant la pause. 30-15.",
    },
    {
      minute: 41, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation d'Axel Despérès (Pau). 30-17.",
    },

    // === MI-TEMPS : USAP 30 - Pau 17 ===

    // === 2e mi-temps ===
    {
      minute: 55, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Pénalité de Benjamin Urdapilleta (USAP). 33-17.",
    },
    {
      minute: 74, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai d'Alexandre Etchebehere (Pau). Le remplaçant relance les Palois. 33-22.",
    },
    {
      minute: 74, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Grégoire Arfeuil (Pau). 33-24.",
    },
    {
      minute: 78, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Essai de Lucas Velarte (USAP). Le remplaçant valide le bonus offensif en fin de match. 38-24.",
    },
    {
      minute: 78, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). Score final 40-24.",
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
    const side = evt.isUsap ? "USAP" : "PAU ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Aimé-Giral (Perpignan) — domicile");
  console.log("  Score mi-temps : USAP 30 - Pau 17");
  console.log("  Score final : USAP 40 - Pau 24");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length}`);
  console.log("  ✅ Victoire avec bonus offensif — 4e victoire consécutive à domicile !");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

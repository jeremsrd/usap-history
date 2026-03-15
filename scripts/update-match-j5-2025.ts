/**
 * Script de mise à jour du match USAP - Stade Français (J5 Top 14, 04/10/2025)
 * Score final : USAP 11 - Stade Français 28
 * Mi-temps : USAP 3 - Stade Français 21
 *
 * 5e défaite consécutive à domicile. Ward ouvre le score dès la 2e minute,
 * Nene enfonce le clou (15'), Allan réduit d'une pénalité (33') mais Ward
 * s'offre un doublé (35'). 3-21 à la pause. Buliruarua marque en début de 2e MT
 * (42'), Allan passe une 2e pénalité (51') mais Barré tue le match (60') après
 * un carton jaune de Brookes. Devaux aussi cartonné dans les arrêts de jeu.
 * Le Stade Français met fin à 19 défaites consécutives à l'extérieur.
 *
 * Arbitre : Ludovic Cayre
 *
 * Sources : top14.lnr.fr, allrugby.com, vibrez-rugby.com, francebleu.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j5-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match USAP - Stade Français (J5, 04/10/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J5 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 5,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Ludovic Cayre
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: "Cayre" },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Ludovic",
        lastName: "Cayre",
        slug: "ludovic-cayre",
      },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName}`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName}`);
  }

  // ---------------------------------------------------------------
  // 2. Résolution des joueurs USAP
  // ---------------------------------------------------------------
  console.log("\n--- Résolution joueurs USAP ---");

  const VENUE_ID = "cmm6wnybf000d1uihl8hsk9e1"; // Stade Aimé-Giral

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
    "Devaux", "Malolo", "Brookes", "Yato", "Tanguy",
    "Diaby", "Ritchie", "Hicks", "Ecochard", "Allan",
    "Granell", "De La Fuente", "Buliruarua", "Duguivalu", "Forner",
    "Lotrian", "Beria", "Warion", "Le Corvec", "Van Tonder",
    "Hall", "Tedder", "Roelofse",
  ];

  for (const name of usapNames) {
    try {
      if (name === "Le Corvec") {
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
   * Évolution du score (USAP - Stade Français) :
   *  2' Essai Ward (SF) → 0-5, Transfo Henry → 0-7
   * 15' Essai Nene (SF) → 0-12, Transfo Henry → 0-14
   * 33' Pénalité Allan (USAP) → 3-14
   * 35' Essai Ward (SF) → 3-19, Transfo Henry → 3-21
   * MI-TEMPS : USAP 3 - Stade Français 21
   * 42' Essai Buliruarua (USAP) → 8-21 (transfo manquée Allan)
   * 51' Pénalité Allan (USAP) → 11-21
   * 60' Carton jaune Brookes (USAP)
   * 60' Essai Barré (SF) → 11-26, Transfo Henry → 11-28
   * 80+' Carton jaune Devaux (USAP)
   *
   * USAP : 1E + 0T + 2P = 5 + 0 + 6 = 11 points
   * Stade Français : 4E + 4T = 20 + 8 = 28 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:35",
      refereeId: referee.id,
      venueId: VENUE_ID,
      attendance: null,
      halfTimeUsap: 3,
      halfTimeOpponent: 21,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 0,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Stade Français
      triesOpponent: 4,
      conversionsOpponent: 4,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Vidéo
      videoUrl: "https://www.dailymotion.com/video/x9rovua",
      // Rapport
      report:
        "Lourde défaite à domicile face au Stade Français (11-28), 5e revers consécutif. " +
        "Ward ouvre le score dès la 2e minute sur un mouvement collectif parisien, puis Nene " +
        "enfonce le clou (15'). Allan réduit d'une pénalité (33') mais Ward s'offre un doublé " +
        "juste avant la pause (35'). Score sans appel à la mi-temps : 3-21. En seconde période, " +
        "Forner trouve la faille et sert Buliruarua pour l'unique essai catalan (42'). Allan " +
        "ajoute une pénalité (51') mais le Stade Français ne tremble jamais. Brookes prend un " +
        "carton jaune pour mêlée fautive (60') et Barré en profite immédiatement pour aplatir " +
        "le 4e essai parisien, synonyme de bonus offensif. Devaux est aussi cartonné dans les " +
        "arrêts de jeu. Le Stade Français met fin à 19 défaites consécutives à l'extérieur " +
        "en Top 14. L'USAP reste à 0 point, lanterne rouge.",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, rapport, vidéo)");

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
    { num: 1, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: true, minutesPlayed: 80, yellowCard: true, yellowCardMinute: 80 },
    { num: 2, lastName: "Malolo", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 50 },
    { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 70, yellowCard: true, yellowCardMinute: 60 },
    { num: 4, lastName: "Yato", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 56 },
    { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 55 },
    { num: 6, lastName: "Diaby", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 55 },
    { num: 7, lastName: "Ritchie", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 8, lastName: "Hicks", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 80 },
    { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 60 },
    { num: 10, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 65 },
    { num: 11, lastName: "Granell", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 13, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Duguivalu", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 15, lastName: "Forner", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Lotrian", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 30 },       // entré ~50'
    { num: 17, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 0 },       // non entré (Devaux joue 80')
    { num: 18, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 25 },    // entré ~55'
    { num: 19, lastName: "Le Corvec", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 25 }, // entré ~55'
    { num: 20, lastName: "Van Tonder", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 24 }, // entré ~56'
    { num: 21, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 20 },       // entré ~60'
    { num: 22, lastName: "Tedder", position: "DEMI_OUVERTURE" as const, isStarter: false, minutesPlayed: 15 },    // entré ~65'
    { num: 23, lastName: "Roelofse", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 10 },    // entré ~70'
  ];

  for (const p of USAP_SQUAD) {
    const playerId = PLAYER_IDS[p.lastName];
    if (!playerId) {
      console.log(`  ⚠ Joueur non trouvé : ${p.lastName}`);
      continue;
    }

    let tries = 0,
      conversions = 0,
      penalties = 0,
      totalPoints = 0;

    if (p.lastName === "Buliruarua") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Allan") {
      penalties = 2;
      totalPoints = 6;
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
        tries,
        conversions,
        penalties,
        totalPoints,
        minutesPlayed: p.minutesPlayed,
        yellowCard: (p as { yellowCard?: boolean }).yellowCard ?? false,
        yellowCardMin: (p as { yellowCardMinute?: number }).yellowCardMinute ?? null,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    const yc = (p as { yellowCard?: boolean }).yellowCard ? " [CJ]" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${yc} [${p.minutesPlayed}']`);
  }

  const totalPtsUsap = 5 + 6;
  console.log(`\n  Vérification : total points individuels = ${totalPtsUsap} (attendu : 11)`);

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
      minute: 2, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Jérémy Ward (Stade Français). Mouvement collectif rapide, Ward conclut. 0-5.",
    },
    {
      minute: 3, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Zack Henry (Stade Français). 0-7.",
    },
    {
      minute: 15, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Noah Nene (Stade Français). Les Parisiens capitalisent sur une pénaltouche. 0-12.",
    },
    {
      minute: 16, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Zack Henry (Stade Français). 0-14.",
    },
    {
      minute: 33, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. Premiers points de l'USAP. 3-14.",
    },
    {
      minute: 35, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Jérémy Ward (Stade Français), son doublé. 3-19.",
    },
    {
      minute: 36, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Zack Henry (Stade Français). 3-21.",
    },

    // === MI-TEMPS : USAP 3 - Stade Français 21 ===

    // === 2e mi-temps ===
    {
      minute: 42, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Buliruarua"], isUsap: true,
      description: "Essai d'Eneriko Buliruarua ! Forner trouve la faille et sert Buliruarua. 8-21.",
    },
    {
      minute: 43, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation manquée de Tommaso Allan. 8-21.",
    },
    {
      minute: 51, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. 11-21.",
    },
    {
      minute: 60, type: "CARTON_JAUNE" as const,
      playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Carton jaune pour Kieran Brookes. Mêlée fautive. USAP à 14.",
    },
    {
      minute: 60, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Léo Barré (Stade Français). Paris profite de la supériorité numérique. Bonus offensif. 11-26.",
    },
    {
      minute: 61, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Zack Henry (Stade Français). Score final : 11-28.",
    },
    {
      minute: 80, type: "CARTON_JAUNE" as const,
      playerId: PLAYER_IDS["Devaux"], isUsap: true,
      description: "Carton jaune pour Bruce Devaux dans les arrêts de jeu.",
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
  console.log("  Stade : Aimé-Giral (Perpignan) — domicile");
  console.log("  Arbitre : Ludovic Cayre");
  console.log("  Score mi-temps : USAP 3 - Stade Français 21");
  console.log("  Score final : USAP 11 - Stade Français 28");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length}`);
  console.log("  Vidéo : https://www.dailymotion.com/video/x9rovua");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

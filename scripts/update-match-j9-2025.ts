/**
 * Script de mise à jour du match Pau - USAP (J9 Top 14, 01/11/2025)
 * Score final : Pau 27 - USAP 23
 * Mi-temps : Pau 15 - USAP 6
 *
 * 9e défaite consécutive pour l'USAP mais avec un bonus défensif arraché.
 * Despérès ouvre au pied (7', 3-0) puis Maddocks marque le 1er essai palois
 * transformé par Despérès (18', 10-0). Allan réduit par pénalité (31', 10-3).
 * Arfeuil creuse l'écart avec un essai non transformé (37', 15-3). Allan remet
 * 3 points (41', 15-6). Mi-temps.
 * Daubagna enfonce le clou (44', 20-6, transfo Despérès 22-6). Veredamu relance
 * l'USAP d'un essai transformé par Allan (47', 22-13). Gailleton marque le 4e
 * essai palois (58', 27-13). Le Corvec, entré en jeu, inscrit un essai transformé
 * par Allan (64', 27-20). Allan arrache le bonus défensif d'une dernière pénalité
 * (69', 27-23). Première de Chinarro et Dvali en Top 14.
 *
 * Arbitre : Benjamin Hernandez
 *
 * Sources : top14.lnr.fr, espn.com, allrugby.com, francebleu.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j9-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match Pau - USAP (J9, 01/11/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J9 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 9,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Benjamin Hernandez
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Hernandez", mode: "insensitive" } },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Benjamin",
        lastName: "Hernandez",
        slug: "benjamin-hernandez",
      },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName}`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 1b. Stade : Stade du Hameau (Pau)
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { slug: "stade-du-hameau" },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade du Hameau",
        slug: "stade-du-hameau",
        city: "Pau",
        capacity: 14566,
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
    "Beria", "Lotrian", "Ceccarelli", "Chinarro", "Tuilagi",
    "Ritchie", "Hicks", "Oviedo", "Ecochard", "Allan",
    "Granell", "De La Fuente", "Buliruarua", "Veredamu", "Dubois",
    "Ruiz", "Devaux", "Tanguy", "Le Corvec", "Dvali",
    "Aprasidze", "Poulet", "Fakatika",
  ];

  for (const name of usapNames) {
    try {
      if (name === "Le Corvec") {
        PLAYER_IDS[name] = await findPlayer(name, "Mattéo");
      } else if (name === "Lotrian") {
        PLAYER_IDS[name] = await findPlayer(name, "Mathys");
      } else if (name === "Allan") {
        PLAYER_IDS[name] = await findPlayer(name, "Tommaso");
      } else if (name === "De La Fuente") {
        PLAYER_IDS[name] = await findPlayer(name, "Jerónimo");
      } else if (name === "Dubois") {
        PLAYER_IDS[name] = await findPlayer(name, "Lucas");
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
   * Évolution du score (Pau - USAP) :
   *  7' Pénalité Despérès (PAU) → 3-0
   * 18' Essai Maddocks (PAU) → 8-0
   * 19' Transfo Despérès (PAU) → 10-0
   * 31' Pénalité Allan (USAP) → 10-3
   * 37' Essai Arfeuil (PAU) → 15-3
   * 41' Pénalité Allan (USAP) → 15-6
   * MI-TEMPS : Pau 15 - USAP 6
   * 44' Essai Daubagna (PAU) → 20-6
   * 45' Transfo Despérès (PAU) → 22-6
   * 47' Essai Veredamu (USAP) → 22-11
   * 47' Transfo Allan (USAP) → 22-13
   * 58' Essai Gailleton (PAU) → 27-13
   * 64' Essai Le Corvec (USAP) → 27-18
   * 65' Transfo Allan (USAP) → 27-20
   * 69' Pénalité Allan (USAP) → 27-23
   *
   * Pau : 4E + 2T + 1P = 20 + 4 + 3 = 27 points
   * USAP : 2E + 2T + 3P = 10 + 4 + 9 = 23 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:35",
      refereeId: referee.id,
      venueId: venue.id,
      halfTimeUsap: 6,
      halfTimeOpponent: 15,
      // Détail scoring USAP
      triesUsap: 2,
      conversionsUsap: 2,
      penaltiesUsap: 3,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Pau
      triesOpponent: 4,
      conversionsOpponent: 2,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: true,
      // Vidéo
      videoUrl: "https://www.youtube.com/watch?v=TSoSm9d2Krg",
      // Rapport
      report:
        "Neuvième défaite consécutive pour l'USAP mais un bonus défensif arraché au courage. " +
        "Despérès ouvre le score au pied (7', 3-0) avant que Maddocks ne marque le premier essai " +
        "palois, transformé par Despérès (18', 10-0). Allan répond par une pénalité (31', 10-3) " +
        "mais Arfeuil enfonce le clou pour Pau (37', 15-3). Allan réduit encore l'écart avant " +
        "la pause (41', 15-6). En seconde période, Daubagna creuse l'écart à 22-6 après un essai " +
        "transformé par Despérès (44'-45'). Veredamu relance l'USAP d'un superbe essai transformé " +
        "par Allan (47', 22-13). Gailleton semble tuer le match avec le 4e essai palois (58', 27-13). " +
        "Mais l'USAP ne lâche rien : Le Corvec, entré en jeu, marque un essai transformé par Allan " +
        "(64', 27-20) puis Allan arrache le bonus défensif d'une dernière pénalité (69', 27-23). " +
        "Match de caractère des Catalans qui n'ont jamais baissé les bras. Première apparition en " +
        "Top 14 pour Bastien Chinarro et Andro Dvali.",
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
    { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true, minutesPlayed: 52 },
    { num: 2, lastName: "Lotrian", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 56 },
    { num: 3, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 52 },
    { num: 4, lastName: "Chinarro", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 62 },
    { num: 5, lastName: "Tuilagi", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 6, lastName: "Ritchie", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 7, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 56 },
    { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 80 },
    { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 62 },
    { num: 10, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 11, lastName: "Granell", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 13, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 15, lastName: "Dubois", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 24 },           // entré 56'
    { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 28 },     // entré 52'
    { num: 18, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 0 },     // non entré
    { num: 19, lastName: "Le Corvec", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 18 }, // entré 62'
    { num: 20, lastName: "Dvali", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 24 }, // entré 56'
    { num: 21, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 18 },  // entré 62'
    { num: 22, lastName: "Poulet", position: "CENTRE" as const, isStarter: false, minutesPlayed: 0 },             // non entré
    { num: 23, lastName: "Fakatika", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 28 },    // entré 52'
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

    if (p.lastName === "Veredamu") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Le Corvec") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Allan") {
      conversions = 2;
      penalties = 3;
      totalPoints = 13;
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
        yellowCard: false,
        yellowCardMin: null,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts} [${p.minutesPlayed}']`);
  }

  const totalPtsUsap = 5 + 5 + 13;
  console.log(`\n  Vérification : total points individuels = ${totalPtsUsap} (attendu : 23)`);

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
      minute: 7, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité d'Axel Despérès (Pau). Le demi d'ouverture palois ouvre le score. 3-0.",
    },
    {
      minute: 18, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Jack Maddocks (Pau). L'arrière australien conclut une belle action paloise. 8-0.",
    },
    {
      minute: 19, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation d'Axel Despérès (Pau). 10-0.",
    },
    {
      minute: 31, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. L'USAP ouvre enfin son compteur. 10-3.",
    },
    {
      minute: 37, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Grégoire Arfeuil (Pau). L'ailier palois creuse l'écart. Essai non transformé. 15-3.",
    },
    {
      minute: 40, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton jaune pour Beka Gorgadze (Pau). Le N°8 géorgien est exclu temporairement.",
    },
    {
      minute: 41, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan juste avant la pause. 15-6.",
    },

    // === MI-TEMPS : Pau 15 - USAP 6 ===

    // === 2e mi-temps ===
    {
      minute: 44, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Thibault Daubagna (Pau). Le demi de mêlée palois profite d'un ballon rapide. 20-6.",
    },
    {
      minute: 45, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation d'Axel Despérès (Pau). 22-6.",
    },
    {
      minute: 47, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Veredamu"], isUsap: true,
      description: "Essai de Tavite Veredamu ! L'ailier fidjien relance l'USAP. 22-11.",
    },
    {
      minute: 47, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. 22-13.",
    },
    {
      minute: 58, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai d'Émilien Gailleton (Pau). Le remplaçant marque le 4e essai palois, bonus offensif pour Pau. 27-13.",
    },
    {
      minute: 64, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Le Corvec"], isUsap: true,
      description: "Essai de Mattéo Le Corvec ! Le 2e ligne, entré en jeu, marque un essai précieux. 27-18.",
    },
    {
      minute: 65, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. L'USAP revient à 7 points. 27-20.",
    },
    {
      minute: 69, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan ! L'USAP arrache le bonus défensif en revenant à 4 points. 27-23.",
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
  console.log("  Stade : Stade du Hameau (Pau) — extérieur");
  console.log("  Arbitre : Benjamin Hernandez");
  console.log("  Score mi-temps : Pau 15 - USAP 6");
  console.log("  Score final : Pau 27 - USAP 23");
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

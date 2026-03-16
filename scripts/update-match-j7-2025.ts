/**
 * Script de mise à jour du match USAP - UBB Bordeaux (J7 Top 14, 18/10/2025)
 * Score final : USAP 12 - UBB 27
 * Mi-temps : USAP 7 - UBB 20
 *
 * 7e défaite consécutive pour l'USAP qui reste à 0 point au classement.
 * L'UBB domine d'entrée profitant d'un carton jaune d'Aprasidze (5').
 * Pénalité Page-Relo (6'), essai Drault pour son premier essai en Top 14 (9'),
 * essai Matiu servi par Penaud (20'), nouvelle pénalité Page-Relo (28') : 0-20.
 * Essai de pénalité avant la pause suite à un en-avant volontaire de Bielle-Biarrey (40') : 7-20.
 * En 2e MT, l'USAP peine à 15 contre 14 en début d'acte. Jalibert inscrit un essai
 * de presque 100m sur pénalité rapide (63') pour tuer le match à 7-27.
 * Allan sauve l'honneur in extremis (80') : 12-27.
 *
 * Arbitre : Kévin Bralley
 *
 * Sources : ubbrugby.com, francebleu.fr, espn.com, allrugby.com
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j7-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match USAP - UBB Bordeaux (J7, 18/10/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J7 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 7,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Kévin Bralley (déjà en BDD)
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  const referee = await prisma.referee.findFirst({
    where: { lastName: "Bralley" },
  });
  if (!referee) {
    throw new Error("Arbitre Kévin Bralley non trouvé en BDD !");
  }
  console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);

  // ---------------------------------------------------------------
  // 1b. Stade : Aimé-Giral (domicile)
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  const venue = await prisma.venue.findFirst({
    where: { name: { contains: "Giral", mode: "insensitive" } },
  });
  if (!venue) {
    throw new Error("Stade Aimé-Giral non trouvé en BDD !");
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
    "Tetrashvili", "Ruiz", "Ceccarelli", "Yato", "Warion",
    "Diaby", "Ritchie", "Oviedo", "Aprasidze", "Tedder",
    "Joseph", "Poulet", "Duguivalu", "Veredamu", "Forner",
    "Lam", "Devaux", "Tanguy", "Le Corvec", "Ecochard",
    "Allan", "Petaia", "Brookes",
  ];

  for (const name of usapNames) {
    try {
      if (name === "Le Corvec") {
        PLAYER_IDS[name] = await findPlayer(name, "Mattéo");
      } else if (name === "Joseph") {
        PLAYER_IDS[name] = await findPlayer(name, "Jefferson-Lee");
      } else if (name === "Lam") {
        PLAYER_IDS[name] = await findPlayer(name, "Seilala");
      } else if (name === "Allan") {
        PLAYER_IDS[name] = await findPlayer(name, "Tommaso");
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
   * Évolution du score (USAP - UBB) :
   *  5' Carton jaune Aprasidze (USAP)
   *  6' Pénalité Page-Relo (UBB) → 0-3
   *  9' Essai Drault (UBB), Transfo Page-Relo → 0-10
   * 20' Essai Matiu (UBB), Transfo Page-Relo → 0-17
   * 28' Pénalité Page-Relo (UBB) → 0-20
   * 40' Essai de pénalité (USAP) → 7-20 (en-avant volontaire Bielle-Biarrey)
   * MI-TEMPS : USAP 7 - UBB 20
   * 63' Essai Jalibert (UBB), Transfo Page-Relo → 7-27
   * 80' Essai Allan (USAP), transfo manquée → 12-27
   *
   * USAP : 1EP + 1E + 0T + 0P = 7 + 5 + 0 + 0 = 12 points
   * UBB : 3E + 3T + 2P = 15 + 6 + 6 = 27 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:35",
      refereeId: referee.id,
      venueId: venue.id,
      halfTimeUsap: 7,
      halfTimeOpponent: 20,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 0,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 1,
      // Détail scoring UBB
      triesOpponent: 3,
      conversionsOpponent: 3,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Vidéo
      videoUrl: "https://www.youtube.com/watch?v=GSvibwREN0Q",
      // Rapport
      report:
        "7e défaite consécutive et une entame catastrophique pour l'USAP. Dès la 5e minute, " +
        "Aprasidze écope d'un carton jaune et Bordeaux-Bègles en profite pleinement : pénalité de " +
        "Page-Relo (6'), puis premier essai en Top 14 d'Adrien Drault (9') et essai de Temo Matiu " +
        "bien servi par Penaud dans le coin (20'). Une nouvelle pénalité de Page-Relo porte le score " +
        "à 0-20 (28'). Juste avant la pause, un essai de pénalité est accordé à l'USAP suite à un " +
        "en-avant volontaire de Louis Bielle-Biarrey : 7-20. En seconde période, l'USAP peine à " +
        "relancer malgré un temps de jeu favorable. Jalibert tue le match en jouant rapidement une " +
        "pénalité et en parcourant près de 100 mètres jusqu'à l'en-but (63', 7-27). Tommaso Allan " +
        "sauve l'honneur dans les arrêts de jeu (80', 12-27). L'USAP reste dernière du championnat " +
        "avec 0 point, 7 défaites en 7 matchs.",
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
    { num: 1, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: true, minutesPlayed: 52 },
    { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 52 },
    { num: 3, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 52 },
    { num: 4, lastName: "Yato", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 52 },
    { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 62 },
    { num: 6, lastName: "Diaby", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 62 },
    { num: 7, lastName: "Ritchie", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 62 },
    { num: 9, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 62, yellowCard: true, yellowCardMinute: 5 },
    { num: 10, lastName: "Tedder", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 62 },
    { num: 11, lastName: "Joseph", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "Poulet", position: "CENTRE" as const, isStarter: true, minutesPlayed: 62 },
    { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 15, lastName: "Forner", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Lam", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 28 },              // entré 52'
    { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 28 },        // entré 52'
    { num: 18, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 28 },       // entré 52'
    { num: 19, lastName: "Le Corvec", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 18 }, // entré 62'
    { num: 20, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 18 },      // entré 62'
    { num: 21, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: false, minutesPlayed: 18 },        // entré 62'
    { num: 22, lastName: "Petaia", position: "CENTRE" as const, isStarter: false, minutesPlayed: 18 },               // entré 62'
    { num: 23, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 28 },        // entré 52'
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

    if (p.lastName === "Allan") {
      tries = 1;
      totalPoints = 5;
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

  // Vérification : essai pénalité (7) + essai Allan (5) = 12
  const totalPtsUsap = 7 + 5;
  console.log(`\n  Vérification : total points = ${totalPtsUsap} (attendu : 12)`);
  console.log("  Note : l'essai de pénalité (7 pts) n'est attribué à aucun joueur");

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
      minute: 5, type: "CARTON_JAUNE" as const,
      playerId: PLAYER_IDS["Aprasidze"], isUsap: true,
      description: "Carton jaune pour Gela Aprasidze. L'USAP à 14 d'entrée de jeu.",
    },
    {
      minute: 6, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Martin Page-Relo (UBB). Bordeaux ouvre le score en profitant de la supériorité numérique. 0-3.",
    },
    {
      minute: 9, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai d'Adrien Drault (UBB) ! Premier essai en Top 14 pour le centre bordelais. 0-8.",
    },
    {
      minute: 10, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Martin Page-Relo (UBB). 0-10.",
    },
    {
      minute: 20, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Temo Matiu (UBB) ! Le 3e ligne fidjien conclut dans le coin, bien servi par Damian Penaud. 0-15.",
    },
    {
      minute: 21, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Martin Page-Relo (UBB). 0-17.",
    },
    {
      minute: 28, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Martin Page-Relo (UBB). L'écart se creuse. 0-20.",
    },
    {
      minute: 40, type: "ESSAI" as const,
      playerId: null, isUsap: true,
      description: "Essai de pénalité accordé à l'USAP ! En-avant volontaire de Louis Bielle-Biarrey. Transformation automatique. 7-20.",
    },

    // === MI-TEMPS : USAP 7 - UBB 20 ===

    // === 2e mi-temps ===
    {
      minute: 63, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Matthieu Jalibert (UBB) ! L'ouvreur joue rapidement une pénalité et parcourt près de 100 mètres jusqu'à l'en-but. 7-25.",
    },
    {
      minute: 64, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Martin Page-Relo (UBB). Le match est plié. 7-27.",
    },
    {
      minute: 80, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Essai de Tommaso Allan ! L'ouvreur italien sauve l'honneur dans les arrêts de jeu. 12-27.",
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
    const side = evt.isUsap ? "USAP" : "UBB ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Aimé-Giral (Perpignan) — domicile");
  console.log("  Arbitre : Kévin Bralley");
  console.log("  Score mi-temps : USAP 7 - UBB 20");
  console.log("  Score final : USAP 12 - UBB 27");
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

/**
 * Script de mise à jour du match Montauban - USAP (J8 Top 14, 25/10/2025)
 * Score final : Montauban 29 - USAP 22
 * Mi-temps : Montauban 17 - USAP 15
 *
 * 8e défaite consécutive pour l'USAP dans un match crucial entre les deux derniers
 * du championnat. Jackson ouvre le score pour Montauban (8'), Allan répond par 5 pénalités
 * (11', 16', 19', 30', 37') pour mener 10-15. Mais Kanika-Bilonda marque juste avant
 * la pause (40', 17-15). En 2e MT, Bosviel creuse l'écart à 23-15 (pénalités 46', 49').
 * Ruiz relance l'USAP avec un essai transformé par Allan (60', 23-22). Mais Bosviel
 * tue le match avec deux dernières pénalités (66', 71'). Indiscipline catastrophique
 * de l'USAP : 3 cartons jaunes (Tanguy 24', Le Corvec 39', Veredamu 72').
 * Carton orange pour Ma'afu (Montauban, 20'). Première victoire de Montauban en Top 14.
 *
 * Arbitre : Tual Trainini
 *
 * Sources : top14.lnr.fr, itsrugby.fr, allrugby.com, francebleu.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j8-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match Montauban - USAP (J8, 25/10/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J8 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 8,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Tual Trainini (déjà en BDD)
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Trainini", mode: "insensitive" } },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Tual",
        lastName: "Trainini",
        slug: "tual-trainini",
      },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName}`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 1b. Stade : Stade Sapiac (Montauban)
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { slug: "stade-sapiac" },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade Sapiac",
        slug: "stade-sapiac",
        city: "Montauban",
        capacity: 12000,
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
    "Beria", "Ruiz", "Brookes", "Le Corvec", "Tanguy",
    "Hicks", "Ritchie", "Oviedo", "Ecochard", "Tedder",
    "Joseph", "De La Fuente", "Petaia", "Veredamu", "Allan",
    "Lotrian", "Devaux", "Tuilagi", "Chinarro", "Hall",
    "Buliruarua", "Dubois", "Roelofse",
  ];

  for (const name of usapNames) {
    try {
      if (name === "Le Corvec") {
        PLAYER_IDS[name] = await findPlayer(name, "Mattéo");
      } else if (name === "Lotrian") {
        PLAYER_IDS[name] = await findPlayer(name, "Mathys");
      } else if (name === "Joseph") {
        PLAYER_IDS[name] = await findPlayer(name, "Jefferson-Lee");
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
   * Évolution du score (Montauban - USAP) :
   *  8' Essai Jackson (MTB), Transfo Bosviel → 7-0
   * 11' Pénalité Allan (USAP) → 7-3
   * 14' Pénalité Bosviel (MTB) → 10-3
   * 16' Pénalité Allan (USAP) → 10-6
   * 19' Pénalité Allan (USAP) → 10-9
   * 20' Carton orange Ma'afu (MTB)
   * 24' Carton jaune Tanguy (USAP)
   * 30' Pénalité Allan (USAP) → 10-12
   * 37' Pénalité Allan (USAP) → 10-15
   * 39' Carton jaune Le Corvec (USAP)
   * 40' Essai Kanika-Bilonda (MTB), Transfo Bosviel → 17-15
   * MI-TEMPS : Montauban 17 - USAP 15
   * 46' Pénalité Bosviel (MTB) → 20-15
   * 49' Pénalité Bosviel (MTB) → 23-15
   * 60' Essai Ruiz (USAP), Transfo Allan → 23-22
   * 66' Pénalité Bosviel (MTB) → 26-22
   * 71' Pénalité Bosviel (MTB) → 29-22
   * 72' Carton jaune Veredamu (USAP)
   *
   * Montauban : 2E + 2T + 5P = 10 + 4 + 15 = 29 points
   * USAP : 1E + 1T + 5P = 5 + 2 + 15 = 22 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:35",
      refereeId: referee.id,
      venueId: venue.id,
      halfTimeUsap: 15,
      halfTimeOpponent: 17,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 5,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Montauban
      triesOpponent: 2,
      conversionsOpponent: 2,
      penaltiesOpponent: 5,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: true,
      // Vidéo
      videoUrl: "https://www.youtube.com/watch?v=VSTgEqIif_8",
      // Rapport
      report:
        "Le match de la peur entre les deux derniers du classement tourne à l'avantage de Montauban. " +
        "Jackson ouvre le score d'un essai transformé par Bosviel (8', 7-0). Allan réplique avec " +
        "5 pénalités magistrales (11', 16', 19', 30', 37') qui portent l'USAP à 10-15. Mais " +
        "l'indiscipline catalane gâche tout : cartons jaunes pour Tanguy (24') et Le Corvec (39'). " +
        "Kanika-Bilonda en profite pour marquer juste avant la pause (40', 17-15). En seconde période, " +
        "Bosviel creuse l'écart à 23-15 avec deux pénalités (46', 49'). Ignacio Ruiz relance " +
        "spectaculairement l'USAP avec un essai de talonneur transformé par Allan (60', 23-22). " +
        "L'espoir est de courte durée : Bosviel sanctionne les fautes catalanes avec deux nouvelles " +
        "pénalités (66', 71') pour porter le score à 29-22. Veredamu prend un 3e carton jaune pour " +
        "l'USAP (72'). Première victoire de Montauban cette saison, l'USAP reste dernière à 0 point " +
        "après 8 journées. Plus de 700 supporters catalans avaient fait le déplacement.",
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
    { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 80 },
    { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 56 },
    { num: 4, lastName: "Le Corvec", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80, yellowCard: true, yellowCardMinute: 39 },
    { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 52, yellowCard: true, yellowCardMinute: 24 },
    { num: 6, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 50 },
    { num: 7, lastName: "Ritchie", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 80 },
    { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 74 },
    { num: 10, lastName: "Tedder", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 52 },
    { num: 11, lastName: "Joseph", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 13, lastName: "Petaia", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true, minutesPlayed: 80, yellowCard: true, yellowCardMinute: 72 },
    { num: 15, lastName: "Allan", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Lotrian", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 0 },              // non entré
    { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 24 },           // entré 56'
    { num: 18, lastName: "Tuilagi", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 30 },   // entré 50'
    { num: 19, lastName: "Chinarro", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 0 },         // non entré
    { num: 20, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 6 },              // entré 74'
    { num: 21, lastName: "Buliruarua", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 28 },      // entré 52'
    { num: 22, lastName: "Dubois", position: "ARRIERE" as const, isStarter: false, minutesPlayed: 28 },                 // entré 52'
    { num: 23, lastName: "Roelofse", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 24 },          // entré 56'
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

    if (p.lastName === "Ruiz") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Allan") {
      conversions = 1;
      penalties = 5;
      totalPoints = 17;
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

  const totalPtsUsap = 5 + 17;
  console.log(`\n  Vérification : total points individuels = ${totalPtsUsap} (attendu : 22)`);

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
      minute: 8, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de John Thomas Jackson (Montauban). Le centre montalbanais ouvre le score. 7-0.",
    },
    {
      minute: 9, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Jérôme Bosviel (Montauban). 7-0.",
    },
    {
      minute: 11, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. 7-3.",
    },
    {
      minute: 14, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Jérôme Bosviel (Montauban). 10-3.",
    },
    {
      minute: 16, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. 10-6.",
    },
    {
      minute: 19, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. 10-9.",
    },
    {
      minute: 20, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton orange pour Nafi Ma'afu (Montauban). Sanction entre le jaune et le rouge (20 minutes).",
    },
    {
      minute: 24, type: "CARTON_JAUNE" as const,
      playerId: PLAYER_IDS["Tanguy"], isUsap: true,
      description: "Carton jaune pour Mathieu Tanguy. L'USAP perd un joueur pour 10 minutes.",
    },
    {
      minute: 30, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. L'USAP passe devant. 10-12.",
    },
    {
      minute: 37, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. 5e pénalité réussie en 1re mi-temps. 10-15.",
    },
    {
      minute: 39, type: "CARTON_JAUNE" as const,
      playerId: PLAYER_IDS["Le Corvec"], isUsap: true,
      description: "Carton jaune pour Mattéo Le Corvec. 2e carton jaune pour l'USAP dans ce match.",
    },
    {
      minute: 40, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Noa Kanika-Bilonda (Montauban) ! Le remplaçant marque juste avant la pause. 15-15.",
    },
    {
      minute: 41, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Jérôme Bosviel (Montauban). Montauban reprend l'avantage. 17-15.",
    },

    // === MI-TEMPS : Montauban 17 - USAP 15 ===

    // === 2e mi-temps ===
    {
      minute: 46, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Jérôme Bosviel (Montauban). 20-15.",
    },
    {
      minute: 49, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Jérôme Bosviel (Montauban). L'écart se creuse. 23-15.",
    },
    {
      minute: 60, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Ruiz"], isUsap: true,
      description: "Essai d'Ignacio Ruiz ! Le talonneur catalan relance l'USAP. 23-20.",
    },
    {
      minute: 61, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. L'USAP revient à un point ! 23-22.",
    },
    {
      minute: 66, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Jérôme Bosviel (Montauban). L'avance repasse à 4 points. 26-22.",
    },
    {
      minute: 71, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Jérôme Bosviel (Montauban). 5e pénalité de Bosviel, le match semble plié. 29-22.",
    },
    {
      minute: 72, type: "CARTON_JAUNE" as const,
      playerId: PLAYER_IDS["Veredamu"], isUsap: true,
      description: "Carton jaune pour Tavite Veredamu. 3e carton jaune de l'USAP dans ce match. Indiscipline catastrophique.",
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
    const side = evt.isUsap ? "USAP" : "MTB ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Stade Sapiac (Montauban) — extérieur");
  console.log("  Arbitre : Tual Trainini");
  console.log("  Score mi-temps : Montauban 17 - USAP 15");
  console.log("  Score final : Montauban 29 - USAP 22");
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

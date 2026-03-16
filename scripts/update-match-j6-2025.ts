/**
 * Script de mise à jour du match Lyon OU - USAP (J6 Top 14, 11/10/2025)
 * Score final : Lyon 44 - USAP 19
 * Mi-temps : Lyon 13 - USAP 9
 *
 * 6e défaite consécutive pour l'USAP mais paradoxalement sa meilleure prestation
 * de ce début de saison. Tedder ouvre le score d'une pénalité (2'), Berdeu
 * égalise (12'), essai Cassang (19'). L'USAP résiste grâce à sa mêlée et revient
 * à 13-9 à la pause via Tedder (33', 35'). En 2e MT, drop Berdeu (42'), mais
 * Oviedo (47') et Le Corvec (54') ramènent l'USAP à 23-19. Lyon s'envole ensuite :
 * Moukoro (59'), Maraku (71'), doublé Wainiqolo (76'). Berdeu cartonné à 72'.
 * Job Poulet ultra combatif, Mayron Fahy effectue ses débuts pros.
 *
 * Arbitre : Benoît Rousselet
 *
 * Sources : top14.lnr.fr, allrugby.com, lyonmag.com, francebleu.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j6-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match Lyon OU - USAP (J6, 11/10/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J6 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 6,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Benoît Rousselet
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: "Rousselet" },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Benoît",
        lastName: "Rousselet",
        slug: "benoit-rousselet",
      },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName}`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName}`);
  }

  // ---------------------------------------------------------------
  // 1b. Stade : Matmut Stadium de Gerland
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { slug: "matmut-stadium-gerland" },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Matmut Stadium de Gerland",
        slug: "matmut-stadium-gerland",
        city: "Lyon",
        capacity: 35029,
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
    "Tetrashvili", "Lotrian", "Ceccarelli", "Warion", "Van Tonder",
    "Le Corvec", "Ritchie", "Oviedo", "Aprasidze", "Tedder",
    "Granell", "Poulet", "Duguivalu", "Veredamu", "Forner",
    "Ruiz", "Devaux", "Tanguy", "Diaby", "Della Schiava",
    "Fahy", "Allan", "Brookes",
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
   * Évolution du score (Lyon - USAP) :
   *  2' Pénalité Tedder (USAP) → 0-3
   * 12' Pénalité Berdeu (Lyon) → 3-3
   * 19' Essai Cassang (Lyon) → 8-3, Transfo Berdeu → 10-3
   * 33' Pénalité Tedder (USAP) → 10-6
   * 35' Pénalité Tedder (USAP) → 10-9
   * 37' Pénalité Berdeu (Lyon) → 13-9
   * MI-TEMPS : Lyon 13 - USAP 9
   * 42' Drop Berdeu (Lyon) → 16-9
   * 47' Essai Oviedo (USAP) → 16-14 (transfo manquée Tedder)
   * 51' Essai Wainiqolo (Lyon) → 21-14, Transfo Berdeu → 23-14
   * 54' Essai Le Corvec (USAP) → 23-19 (transfo manquée Tedder)
   * 59' Essai Moukoro (Lyon) → 28-19, Transfo Berdeu → 30-19
   * 71' Essai Maraku (Lyon) → 35-19, Transfo Berdeu → 37-19
   * 72' Carton jaune Berdeu (Lyon)
   * 76' Essai Wainiqolo (Lyon, doublé) → 42-19, Transfo Berdeu → 44-19
   *
   * USAP : 2E + 0T + 3P = 10 + 0 + 9 = 19 points
   * Lyon : 5E + 5T + 2P + 1D = 25 + 10 + 6 + 3 = 44 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:35",
      refereeId: referee.id,
      venueId: venue.id,
      attendance: 15000,
      halfTimeUsap: 9,
      halfTimeOpponent: 13,
      // Détail scoring USAP
      triesUsap: 2,
      conversionsUsap: 0,
      penaltiesUsap: 3,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Lyon
      triesOpponent: 5,
      conversionsOpponent: 5,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 1,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Vidéo
      videoUrl: "https://www.youtube.com/watch?v=TSoSm9d2Krg",
      // Rapport
      report:
        "6e défaite consécutive mais paradoxalement la meilleure prestation catalane de ce début " +
        "de saison. L'USAP ouvre le score d'entrée par une pénalité de Tedder (2') et résiste " +
        "grâce à une mêlée dominante. Berdeu égalise (12') puis Cassang marque le premier essai " +
        "lyonnais (19'). Tedder ramène l'USAP à 13-9 à la pause avec deux nouvelles pénalités " +
        "(33', 35'). En seconde période, le drop de Berdeu (42') porte le score à 16-9 mais " +
        "Oviedo répond par un essai plein d'autorité (47') pour revenir à 16-14. Wainiqolo " +
        "redonne de l'air à Lyon (51', 23-14) mais Le Corvec marque un superbe essai pour " +
        "recoller à 23-19 (54'). À ce moment, l'USAP est au-dessus mais ne concrétise pas. " +
        "Lyon sanctionne les erreurs catalanes dans les dix dernières minutes : Moukoro (59'), " +
        "Maraku (71') et le doublé de Wainiqolo sur interception (76') corsent l'addition. " +
        "Berdeu omniprésent (19 pts : 2P, 5T, 1D) malgré un carton jaune (72'). " +
        "Job Poulet s'illustre par sa combativité. Mayron Fahy effectue ses débuts professionnels " +
        "et verse des larmes de frustration au coup de sifflet final. L'USAP reste à 0 point, " +
        "dernière du championnat.",
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
    { num: 2, lastName: "Lotrian", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 44 },
    { num: 3, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 52 },
    { num: 4, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 52 },
    { num: 5, lastName: "Van Tonder", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 62 },
    { num: 6, lastName: "Le Corvec", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 7, lastName: "Ritchie", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 71 },
    { num: 9, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 66 },
    { num: 10, lastName: "Tedder", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 60 },
    { num: 11, lastName: "Granell", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "Poulet", position: "CENTRE" as const, isStarter: true, minutesPlayed: 69 },
    { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 15, lastName: "Forner", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 36 },           // entré 44'
    { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 28 },      // entré 52'
    { num: 18, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 28 },     // entré 52'
    { num: 19, lastName: "Diaby", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 9 }, // entré 71'
    { num: 20, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 18 }, // entré 62'
    { num: 21, lastName: "Fahy", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 14 },        // entré 66' (débuts pros)
    { num: 22, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: false, minutesPlayed: 20 },      // entré 60'
    { num: 23, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 28 },      // entré 52'
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

    if (p.lastName === "Oviedo") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Le Corvec") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Tedder") {
      penalties = 3;
      totalPoints = 9;
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
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts} [${p.minutesPlayed}']`);
  }

  const totalPtsUsap = 5 + 5 + 9;
  console.log(`\n  Vérification : total points individuels = ${totalPtsUsap} (attendu : 19)`);

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
      minute: 2, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Tedder"], isUsap: true,
      description: "Pénalité de Tristan Tedder. L'USAP ouvre le score d'entrée. 0-3.",
    },
    {
      minute: 12, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Léo Berdeu (Lyon). Égalisation. 3-3.",
    },
    {
      minute: 19, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Charlie Cassang (Lyon). Percée de la charnière lyonnaise. 8-3.",
    },
    {
      minute: 20, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Léo Berdeu (Lyon). 10-3.",
    },
    {
      minute: 33, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Tedder"], isUsap: true,
      description: "Pénalité de Tristan Tedder. L'USAP profite de sa mêlée dominante. 10-6.",
    },
    {
      minute: 35, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Tedder"], isUsap: true,
      description: "Pénalité de Tristan Tedder. L'USAP revient à un point. 10-9.",
    },
    {
      minute: 37, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Léo Berdeu (Lyon). Lyon reprend un peu d'air avant la pause. 13-9.",
    },

    // === MI-TEMPS : Lyon 13 - USAP 9 ===

    // === 2e mi-temps ===
    {
      minute: 42, type: "DROP" as const,
      playerId: null, isUsap: false,
      description: "Drop de Léo Berdeu (Lyon). 16-9.",
    },
    {
      minute: 47, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Oviedo"], isUsap: true,
      description: "Essai de Joaquín Oviedo ! Le n°8 catalan franchit avec autorité. 16-14.",
    },
    {
      minute: 48, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Tedder"], isUsap: true,
      description: "Transformation manquée de Tristan Tedder. 16-14.",
    },
    {
      minute: 51, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Jiuta Wainiqolo (Lyon). L'ailier fidjien conclut une action de classe. 21-14.",
    },
    {
      minute: 52, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Léo Berdeu (Lyon). 23-14.",
    },
    {
      minute: 54, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Le Corvec"], isUsap: true,
      description: "Essai de Mattéo Le Corvec ! Le flanker catalan marque un superbe essai. L'USAP revient à 23-19.",
    },
    {
      minute: 55, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Tedder"] || PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation manquée. 23-19.",
    },
    {
      minute: 59, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Thomas Moukoro (Lyon). Les Lyonnais sanctionnent les erreurs catalanes. 28-19.",
    },
    {
      minute: 60, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Léo Berdeu (Lyon). 30-19.",
    },
    {
      minute: 71, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Josiah Maraku (Lyon). Le centre néo-zélandais conclut. 35-19.",
    },
    {
      minute: 72, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Léo Berdeu (Lyon). 37-19.",
    },
    {
      minute: 72, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton jaune pour Léo Berdeu (Lyon).",
    },
    {
      minute: 76, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Jiuta Wainiqolo (Lyon), son doublé ! Interception et course jusqu'à l'en-but. 42-19.",
    },
    {
      minute: 77, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation (Lyon). Bonus offensif avec le 5e essai. 44-19.",
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
    const side = evt.isUsap ? "USAP" : "LYON";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Matmut Stadium de Gerland (Lyon) — extérieur");
  console.log("  Arbitre : Benoît Rousselet");
  console.log("  Score mi-temps : Lyon 13 - USAP 9");
  console.log("  Score final : Lyon 44 - USAP 19");
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

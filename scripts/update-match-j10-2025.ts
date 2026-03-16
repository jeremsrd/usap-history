/**
 * Script de mise à jour du match USAP - Montpellier (J10 Top 14, 22/11/2025)
 * Score final : USAP 0 - Montpellier 28
 * Mi-temps : USAP 0 - Montpellier 13
 *
 * 10e défaite consécutive pour l'USAP, la pire de la série. Match délocalisé
 * au Stade Raoul-Barrière de Béziers suite à la suspension d'Aimé-Giral
 * (incidents lors de USAP-Racing 92, J3). Premier match sous la direction
 * de Laurent Labit (remplace Franck Azéma). Urdapilleta manque une pénalité
 * d'entrée (5'). Miotti ouvre pour Montpellier (15', 0-3). Tolofua marque
 * le 1er essai transformé par Miotti (33', 0-10). Miotti ajoute une pénalité
 * (39', 0-13). Mi-temps. Hounkpatin enfonce le clou (47', 0-18). Hogg passe
 * un drop (68', 0-21) puis transforme l'essai de Becognée (76', 0-28).
 * Tuilagi sort sur blessure (entorse genou, 32'). Carton jaune Dubois (73').
 * Première victoire à l'extérieur de Montpellier cette saison.
 *
 * Arbitre : Ludovic Cayre
 *
 * Sources : top14.lnr.fr, espn.com, allrugby.com, francebleu.fr
 *
 * Exécution : npx tsx scripts/update-match-j10-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match USAP - Montpellier (J10, 22/11/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J10 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 10,
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
    where: { lastName: { contains: "Cayre", mode: "insensitive" } },
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
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 1b. Stade : Stade Raoul-Barrière (Béziers) — match délocalisé
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Raoul", mode: "insensitive" } },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade Raoul-Barrière",
        slug: "stade-raoul-barriere",
        city: "Béziers",
        capacity: 15000,
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
    "Beria", "Montgaillard", "Ceccarelli", "Chinarro", "Tuilagi",
    "Hicks", "Van Tonder", "Le Corvec", "Ecochard", "Urdapilleta",
    "Granell", "De La Fuente", "Buliruarua", "Veredamu", "Dubois",
    "Lotrian", "Devaux", "Tanguy", "Dvali",
    "Hall", "Kretchmann", "Poulet", "Brookes",
  ];

  for (const name of usapNames) {
    try {
      if (name === "Le Corvec") {
        PLAYER_IDS[name] = await findPlayer(name, "Mattéo");
      } else if (name === "Lotrian") {
        PLAYER_IDS[name] = await findPlayer(name, "Mathys");
      } else if (name === "De La Fuente") {
        PLAYER_IDS[name] = await findPlayer(name, "Jerónimo");
      } else if (name === "Dubois") {
        PLAYER_IDS[name] = await findPlayer(name, "Lucas");
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

  // ---------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (USAP - Montpellier) :
   *  5' Pénalité manquée Urdapilleta (USAP)
   * 15' Pénalité Miotti (MHR) → 0-3
   * 33' Essai Tolofua (MHR) → 0-8
   * 34' Transfo Miotti (MHR) → 0-10
   * 39' Pénalité Miotti (MHR) → 0-13
   * MI-TEMPS : USAP 0 - Montpellier 13
   * 47' Essai Hounkpatin (MHR), non transformé → 0-18
   * 68' Drop Hogg (MHR) → 0-21
   * 76' Essai Becognée (MHR) → 0-26
   * 76' Transfo Hogg (MHR) → 0-28
   *
   * USAP : 0 point
   * Montpellier : 3E + 2T + 2P + 1D = 15 + 4 + 6 + 3 = 28 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:35",
      refereeId: referee.id,
      venueId: venue.id,
      halfTimeUsap: 0,
      halfTimeOpponent: 13,
      // Détail scoring USAP
      triesUsap: 0,
      conversionsUsap: 0,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Montpellier
      triesOpponent: 3,
      conversionsOpponent: 2,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 1,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Vidéo — pas de lien fourni pour le moment
      // Rapport
      report:
        "La pire performance de la série noire : l'USAP ne marque aucun point face à Montpellier. " +
        "Match délocalisé au Stade Raoul-Barrière de Béziers suite à la suspension d'Aimé-Giral " +
        "(incidents J3 contre le Racing 92). Premier match sous la direction de Laurent Labit, " +
        "qui a remplacé Franck Azéma. Urdapilleta manque une pénalité d'entrée (5'). Miotti ouvre " +
        "le score pour Montpellier d'une pénalité (15', 0-3). Tolofua marque le premier essai " +
        "transformé par Miotti (33', 0-10). Coup dur pour l'USAP : Tuilagi sort sur blessure " +
        "(entorse du genou, 32'), remplacé par Tanguy. Miotti ajoute une pénalité avant la pause " +
        "(39', 0-13). En seconde période, Hounkpatin enfonce le clou avec un essai non transformé " +
        "(47', 0-18). Stuart Hogg passe un drop (68', 0-21) puis transforme l'essai de Becognée " +
        "(76', 0-28). Carton jaune pour Dubois (73'). Dixième défaite consécutive, l'USAP est " +
        "toujours lanterne rouge sans la moindre victoire. Première victoire à l'extérieur de " +
        "Montpellier cette saison.",
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
    { num: 2, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 56 },
    { num: 3, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 56 },
    { num: 4, lastName: "Chinarro", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 5, lastName: "Tuilagi", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 32 },
    { num: 6, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 7, lastName: "Van Tonder", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 8, lastName: "Le Corvec", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 80 },
    { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 61 },
    { num: 10, lastName: "Urdapilleta", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 53 },
    { num: 11, lastName: "Granell", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 13, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 15, lastName: "Dubois", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80, yellowCard: true, yellowCardMinute: 73 },
    // Remplaçants
    { num: 16, lastName: "Lotrian", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 24 },         // entré 56'
    { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 24 },      // entré 56'
    { num: 18, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 48 },     // entré 32' (blessure Tuilagi)
    { num: 19, lastName: "Dvali", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 0 }, // non entré
    { num: 20, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 19 },        // entré 61'
    { num: 21, lastName: "Kretchmann", position: "DEMI_OUVERTURE" as const, isStarter: false, minutesPlayed: 27 }, // entré 53'
    { num: 22, lastName: "Poulet", position: "CENTRE" as const, isStarter: false, minutesPlayed: 0 },              // non entré
    { num: 23, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 24 },      // entré 56'
  ];

  for (const p of USAP_SQUAD) {
    const playerId = PLAYER_IDS[p.lastName];
    if (!playerId) {
      console.log(`  ⚠ Joueur non trouvé : ${p.lastName}`);
      continue;
    }

    // Aucun point marqué par l'USAP dans ce match
    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: (p as { isCaptain?: boolean }).isCaptain ?? false,
        positionPlayed: p.position,
        tries: 0,
        conversions: 0,
        penalties: 0,
        dropGoals: 0,
        totalPoints: 0,
        minutesPlayed: p.minutesPlayed,
        yellowCard: (p as { yellowCard?: boolean }).yellowCard ?? false,
        yellowCardMin: (p as { yellowCardMinute?: number }).yellowCardMinute ?? null,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    const yc = (p as { yellowCard?: boolean }).yellowCard ? " [CJ]" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${yc} [${p.minutesPlayed}']`);
  }

  console.log(`\n  Vérification : total points individuels = 0 (attendu : 0)`);

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
      minute: 15, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Domingo Miotti (Montpellier). L'ouvreur argentin ouvre le score. 0-3.",
    },
    {
      minute: 32, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Tuilagi"], isUsap: true,
      description: "Sortie sur blessure de Posolo Tuilagi (entorse du genou). Remplacé par Mathieu Tanguy.",
    },
    {
      minute: 33, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Christopher Tolofua (Montpellier). Le talonneur conclut un maul puissant. 0-8.",
    },
    {
      minute: 34, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Domingo Miotti (Montpellier). 0-10.",
    },
    {
      minute: 39, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Domingo Miotti (Montpellier). L'écart se creuse avant la pause. 0-13.",
    },

    // === MI-TEMPS : USAP 0 - Montpellier 13 ===

    // === 2e mi-temps ===
    {
      minute: 47, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Wilfrid Hounkpatin (Montpellier). Le pilier droit s'échappe pour le 2e essai héraultais. Non transformé. 0-18.",
    },
    {
      minute: 68, type: "DROP" as const,
      playerId: null, isUsap: false,
      description: "Drop de Stuart Hogg (Montpellier). L'Écossais entre en jeu et réussit un drop. 0-21.",
    },
    {
      minute: 73, type: "CARTON_JAUNE" as const,
      playerId: PLAYER_IDS["Dubois"], isUsap: true,
      description: "Carton jaune pour Lucas Dubois. L'arrière catalan est exclu temporairement.",
    },
    {
      minute: 76, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai d'Alexandre Becognée (Montpellier). Le 3e ligne remplaçant enfonce le clou. 0-26.",
    },
    {
      minute: 76, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Stuart Hogg (Montpellier). Le score final est sans appel. 0-28.",
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
    const side = evt.isUsap ? "USAP" : "MHR ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Stade Raoul-Barrière (Béziers) — domicile délocalisé");
  console.log("  Arbitre : Ludovic Cayre");
  console.log("  Score mi-temps : USAP 0 - Montpellier 13");
  console.log("  Score final : USAP 0 - Montpellier 28");
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

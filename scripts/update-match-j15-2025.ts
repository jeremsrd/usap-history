/**
 * Script de mise à jour du match USAP - Montauban (J15 Top 14, 24/01/2026)
 * Score final : USAP 31 - Montauban 8
 * Mi-temps : USAP 21 - Montauban 3
 *
 * Sous la pluie, l'USAP domine Montauban de bout en bout à Aimé-Giral.
 * Duguivalu ouvre le score dès la première relance (15'), Yato inscrit un doublé
 * (20', 29') pour offrir le bonus offensif provisoire dès la pause (21-3).
 * Urdapilleta assure au pied (4/4 aux transformations + 1 pénalité).
 * Tuilagi valide le bonus offensif définitif en 2e mi-temps (65').
 * Ahmed sauve l'honneur pour Montauban avec un essai non transformé (~48').
 * Victoire capitale dans la course au maintien : l'USAP repousse Montauban
 * à 7 points au classement.
 *
 * Arbitre : Ludovic Cayre
 *
 * Sources : top14.lnr.fr, francebleu.fr, sports.orange.fr, allrugby.com
 *
 * Exécution : npx tsx scripts/update-match-j15-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match USAP - Montauban (J15, 24/01/2026) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J15 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 15,
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
  // 1b. Stade : Aimé-Giral (domicile)
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
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

  const PLAYER_IDS: Record<string, string> = {};
  const usapNames = [
    "Tetrashvili", "Malolo", "Brookes", "Yato", "Tanguy",
    "Hicks", "Ritchie", "Oviedo", "Hall", "Urdapilleta",
    "Joseph", "De La Fuente", "Duguivalu", "Forner", "Aucagne",
    "Montgaillard", "Devaux", "Tuilagi", "Chinarro",
    "Velarte", "Ecochard", "Poulet", "Ceccarelli",
  ];

  for (const name of usapNames) {
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

  // ---------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (USAP - Montauban) :
   * 15' Essai Duguivalu (USAP) + Transfo Urdapilleta → 7-0
   * 20' Essai Yato (USAP) + Transfo Urdapilleta → 14-0
   * 24' Pénalité Fortunel (Montauban) → 14-3
   * 29' Essai Yato (USAP) + Transfo Urdapilleta → 21-3
   * MI-TEMPS : USAP 21 - Montauban 3
   * 48' Essai Ahmed (Montauban), non transformé → 21-8
   * 51' Pénalité Urdapilleta (USAP) → 24-8
   * 65' Essai Tuilagi (USAP) + Transfo Urdapilleta → 31-8
   *
   * USAP : 4E + 4T + 1P = 20 + 8 + 3 = 31 points
   * Montauban : 1E + 0T + 1P = 5 + 0 + 3 = 8 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:35",
      refereeId: referee.id,
      venueId: venue.id,
      halfTimeUsap: 21,
      halfTimeOpponent: 3,
      // Détail scoring USAP
      triesUsap: 4,
      conversionsUsap: 4,
      penaltiesUsap: 1,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Montauban
      triesOpponent: 1,
      conversionsOpponent: 0,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: true,
      bonusDefensif: false,
      // Rapport
      report:
        "Sous la pluie d'Aimé-Giral, l'USAP domine Montauban de bout en bout dans un match " +
        "capital pour le maintien (31-8). Dès la première relance catalane, Duguivalu élimine " +
        "deux défenseurs pour ouvrir le score (15', 7-0 après la transformation d'Urdapilleta). " +
        "Peceli Yato, impérial, inscrit un doublé (20', 29') et l'USAP rentre aux vestiaires " +
        "avec le bonus offensif provisoire en poche (21-3). Fortunel avait réduit l'écart d'une " +
        "pénalité (24'). En deuxième mi-temps, Ahmed sauve l'honneur montalbanais d'un essai " +
        "non transformé (48', 21-8) mais Urdapilleta remet les choses au clair d'une pénalité (51') " +
        "avant que Tuilagi, entré en jeu, ne valide définitivement le bonus offensif (65', 31-8). " +
        "Victoire essentielle : l'USAP repousse Montauban à 7 points au classement et enchaîne " +
        "une deuxième victoire consécutive après l'exploit contre Toulouse.",
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
    { num: 4, lastName: "Yato", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80,
      tries: 2, totalPoints: 10 }, // Doublé 20', 29'
    { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 6, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 7, lastName: "Ritchie", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 56 },
    { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 60 },
    { num: 10, lastName: "Urdapilleta", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 80,
      conversions: 4, penalties: 1, totalPoints: 11 }, // 4T(8) + 1P(3) = 11
    { num: 11, lastName: "Joseph", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80,
      tries: 1, totalPoints: 5 }, // Essai 15'
    { num: 14, lastName: "Forner", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 15, lastName: "Aucagne", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 24 },       // entré 56'
    { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 24 },         // entré 56'
    { num: 18, lastName: "Tuilagi", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 24,
      tries: 1, totalPoints: 5 }, // Essai bonus 65', entré 56'
    { num: 19, lastName: "Chinarro", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 0 },       // non entré
    { num: 20, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: false, minutesPlayed: 24 },          // entré 56'
    { num: 21, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 20 },       // entré 60'
    { num: 22, lastName: "Poulet", position: "CENTRE" as const, isStarter: false, minutesPlayed: 0 },                 // non entré
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
  console.log(`\n  Vérification : total points individuels = ${totalPointsUSAP} (attendu : 31)`);
  if (totalPointsUSAP !== 31) {
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
      minute: 15, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Duguivalu"], isUsap: true,
      description: "Essai d'Alivereti Duguivalu (USAP). Sur la première relance catalane, il élimine deux défenseurs pour aplatir. 5-0.",
    },
    {
      minute: 15, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). 7-0.",
    },
    {
      minute: 20, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Yato"], isUsap: true,
      description: "Essai de Peceli Yato (USAP). Le Fidjien enfonce la défense montalbanaise. 12-0.",
    },
    {
      minute: 20, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). 14-0.",
    },
    {
      minute: 24, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Thomas Fortunel (Montauban). 14-3.",
    },
    {
      minute: 29, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Yato"], isUsap: true,
      description: "Essai de Peceli Yato (USAP). Doublé pour le deuxième ligne fidjien après une série de pick and go. Bonus offensif provisoire ! 19-3.",
    },
    {
      minute: 29, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). 21-3.",
    },

    // === MI-TEMPS : USAP 21 - Montauban 3 ===

    // === 2e mi-temps ===
    {
      minute: 48, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Stéphane Ahmed (Montauban). L'ailier sauve l'honneur montalbanais. Non transformé. 21-8.",
    },
    {
      minute: 51, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Pénalité de Benjamin Urdapilleta (USAP). 24-8.",
    },
    {
      minute: 65, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Tuilagi"], isUsap: true,
      description: "Essai de Posolo Tuilagi (USAP). Le remplaçant valide définitivement le bonus offensif. 29-8.",
    },
    {
      minute: 65, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Urdapilleta"], isUsap: true,
      description: "Transformation de Benjamin Urdapilleta (USAP). 4/4 aux transformations. 31-8.",
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
  console.log("  Stade : Aimé-Giral (Perpignan) — domicile");
  console.log("  Arbitre : Ludovic Cayre");
  console.log("  Score mi-temps : USAP 21 - Montauban 3");
  console.log("  Score final : USAP 31 - Montauban 8");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length}`);
  console.log("  ✅ Victoire avec bonus offensif — 2e victoire consécutive !");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

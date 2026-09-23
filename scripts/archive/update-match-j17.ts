/**
 * Script de mise à jour du match Section Paloise - USAP (J17 Top 14, 22/02/2025)
 * Score final : Pau 23 - USAP 6
 * Mi-temps : Pau 10 - USAP 6
 *
 * Lourde défaite à Pau. L'USAP mène 0-6 grâce à 2 pénalités de Delpy (4', 29')
 * mais Pau renverse le match en fin de 1ère mi-temps : essai Ruffenach (34'),
 * transfo + pénalité Simmonds (10-6 à la pause). En 2e mi-temps, l'USAP est
 * étouffé par la défense paloise (95% plaquages) et ne marque plus. Simmonds
 * creuse l'écart (2 pén.) puis Grandidier-Nkanang conclut (79'). CJ Joseph (64').
 *
 * Sources : top14.lnr.fr, allrugby.com, espn.com, itsrugby.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j17.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsga003d1umrs0i2csjn"; // Match J17 Pau-USAP 2024-2025

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Labouteley", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true, isCaptain: true },
  { num: 6, lastName: "Ortombina", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Delpy", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Joseph", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: true },
  { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Dupichot", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Lam", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: false },
  { num: 22, lastName: "Barraqué", position: "ARRIERE" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

// === IDs des joueurs (depuis la BDD) ===
const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Labouteley: "cmmby9pfj001t1ucd75p7hi07",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  Ortombina: "cmmf5o37500001u4h31rrnppn",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  Delpy: "cmmby9tcw004h1ucd3hmy7wmy",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Dupichot: "cmmby9t3k004b1ucdtmx0zek2",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Tetrashvili: "cmmby9ogb00151ucdz3vqd429",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Barraque: "", // sera créé
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

async function main() {
  console.log("=== Mise à jour match Pau - USAP (J17, 22/02/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Création joueur Barraque + venue Stade du Hameau
  // ---------------------------------------------------------------
  console.log("--- Joueur Barraque ---");
  let barraque = await prisma.player.findFirst({
    where: { lastName: { contains: "Barraqué", mode: "insensitive" } },
  });
  if (!barraque) {
    barraque = await prisma.player.create({
      data: {
        firstName: "Jean-Pascal",
        lastName: "Barraqué",
        slug: `temp-${Date.now()}`,
        position: "ARRIERE",
        birthDate: new Date("1997-03-16"),
      },
    });
    await prisma.player.update({
      where: { id: barraque.id },
      data: { slug: `jean-pascal-barraque-${barraque.id}` },
    });
    console.log(`  Créé : Jean-Pascal Barraque (${barraque.id})`);
  } else {
    console.log(`  Existe : ${barraque.firstName} ${barraque.lastName} (${barraque.id})`);
  }
  PLAYER_IDS["Barraqué"] = barraque.id;

  console.log("\n--- Venue ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Hameau", mode: "insensitive" } },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade du Hameau",
        city: "Pau",
        capacity: 14588,
        slug: `temp-${Date.now()}`,
      },
    });
    await prisma.venue.update({
      where: { id: venue.id },
      data: { slug: `stade-du-hameau-${venue.id}` },
    });
    console.log(`  Créé : Stade du Hameau (${venue.id})`);
  } else {
    console.log(`  Existe : ${venue.name} (${venue.id})`);
  }

  // Arbitre Cayre existe déjà
  const referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Cayre", mode: "insensitive" } },
  });
  console.log(`\n--- Arbitre ---`);
  console.log(`  ${referee?.firstName} ${referee?.lastName} (${referee?.id})`);

  // ---------------------------------------------------------------
  // 1. Mise à jour du match (infos générales)
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-02-22"),
      kickoffTime: "16:30",
      venueId: venue.id,
      refereeId: referee?.id,
      halfTimeUsap: 6,
      halfTimeOpponent: 10,
      // Détail scoring USAP
      triesUsap: 0,
      conversionsUsap: 0,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Pau
      triesOpponent: 2,
      conversionsOpponent: 2,
      penaltiesOpponent: 3,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Lourde défaite à Pau sous la pluie. L'USAP, privé de plusieurs cadres (Allan, De La Fuente, Ecochard, Hicks, Oviedo, Crossdale), aligne une composition remaniée avec Delpy à l'ouverture et Tanguy capitaine. Les Catalans entament bien le match grâce à 2 pénalités de Delpy (4' et 29', 0-6). Mais Pau renverse la tendance en fin de 1ère mi-temps : essai de Ruffenach sur ballon porté (34'), transformation et pénalité de Simmonds (10-6 à la pause). En 2e période, l'USAP est étouffé par la défense paloise (95% de plaquages réussis) et ne marque plus un point. Simmonds creuse l'écart avec 2 pénalités (57', 63'). Joseph écope d'un carton jaune (64'). Grandidier-Nkanang conclut dans les dernières minutes (79', transformé par Simmonds, 23-6). Défaite sèche sans bonus défensif, l'USAP n'a pas réussi à franchir la ligne paloise.",
    },
  });
  console.log("  Match mis à jour (date, score mi-temps, scoring, arbitre, stade, rapport)");

  // ---------------------------------------------------------------
  // 2. Composition USAP (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  const deletedPlayers = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID, isOpponent: false },
  });
  console.log(`  ${deletedPlayers.count} entrée(s) USAP supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = PLAYER_IDS[p.lastName];
    if (!playerId) {
      console.error(`  ERREUR: ID introuvable pour ${p.lastName}`);
      continue;
    }

    let tries = 0,
      conversions = 0,
      penalties = 0,
      totalPoints = 0;
    let yellowCard = false,
      yellowCardMin: number | null = null;

    // Stats individuelles
    if (p.lastName === "Delpy") {
      penalties = 2;
      totalPoints = 6; // 2×3
    } else if (p.lastName === "Joseph") {
      yellowCard = true;
      yellowCardMin = 64;
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: MATCH_ID,
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
        yellowCard,
        yellowCardMin,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    const card = yellowCard ? ` [CJ ${yellowCardMin}']` : "";
    console.log(
      `  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${card}`
    );
  }

  // ---------------------------------------------------------------
  // 3. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: MATCH_ID },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events = [
    // 4' - Pénalité Delpy → Pau 0 - USAP 3
    {
      minute: 4,
      type: "PENALITE",
      playerId: PLAYER_IDS["Delpy"],
      isUsap: true,
      description: "Pénalité de Valentin Delpy. Pau 0 - USAP 3.",
    },

    // 29' - Pénalité Delpy → Pau 0 - USAP 6
    {
      minute: 29,
      type: "PENALITE",
      playerId: PLAYER_IDS["Delpy"],
      isUsap: true,
      description: "Pénalité de Valentin Delpy. Pau 0 - USAP 6.",
    },

    // 34' - Essai Ruffenach (Pau) → Pau 5 - USAP 6
    {
      minute: 34,
      type: "ESSAI",
      playerId: null,
      isUsap: false,
      description: "Essai de Romain Ruffenach (Pau) sur ballon porté. Pau 5 - USAP 6.",
    },

    // 35' - Transformation Simmonds (Pau) → Pau 7 - USAP 6
    {
      minute: 35,
      type: "TRANSFORMATION",
      playerId: null,
      isUsap: false,
      description: "Transformation de Joe Simmonds (Pau). Pau 7 - USAP 6.",
    },

    // 40' - Pénalité Simmonds (Pau) → Pau 10 - USAP 6
    {
      minute: 40,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité de Joe Simmonds (Pau). Pau 10 - USAP 6.",
    },

    // === MI-TEMPS : Pau 10 - USAP 6 ===

    // 46' - Remplacement Hall → Aprasidze
    {
      minute: 46,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Hall"],
      isUsap: true,
      description: "Sortie de James Hall",
    },
    {
      minute: 46,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Aprasidze"],
      isUsap: true,
      description: "Entrée de Gela Aprasidze en remplacement de Hall",
    },

    // 49' - Remplacement Fa'aso'o → Velarte
    {
      minute: 49,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Fa'aso'o"],
      isUsap: true,
      description: "Sortie de So'otala Fa'aso'o",
    },
    {
      minute: 49,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Velarte"],
      isUsap: true,
      description: "Entrée de Lucas Velarte en remplacement de Fa'aso'o",
    },

    // 54' - Remplacement Ruiz → Lam
    {
      minute: 54,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Ruiz"],
      isUsap: true,
      description: "Sortie d'Ignacio Ruiz",
    },
    {
      minute: 54,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Lam"],
      isUsap: true,
      description: "Entrée de Seilala Lam en remplacement de Ruiz",
    },

    // 57' - Pénalité Simmonds (Pau) → Pau 13 - USAP 6
    {
      minute: 57,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité de Joe Simmonds (Pau). Pau 13 - USAP 6.",
    },

    // 57' - Remplacement Dupichot → Barraque
    {
      minute: 57,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Dupichot"],
      isUsap: true,
      description: "Sortie de Louis Dupichot",
    },
    {
      minute: 57,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Barraqué"],
      isUsap: true,
      description: "Entrée de Jean-Pascal Barraque en remplacement de Dupichot",
    },

    // 57' - Remplacement Naqalevu → Buliruarua
    {
      minute: 57,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Naqalevu"],
      isUsap: true,
      description: "Sortie d'Apisai Naqalevu",
    },
    {
      minute: 57,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Buliruarua"],
      isUsap: true,
      description: "Entrée d'Eneriko Buliruarua en remplacement de Naqalevu",
    },

    // 57' - Remplacement Tanguy → Warion
    {
      minute: 57,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Tanguy"],
      isUsap: true,
      description: "Sortie de Mathieu Tanguy (capitaine)",
    },
    {
      minute: 57,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Warion"],
      isUsap: true,
      description: "Entrée d'Adrien Warion en remplacement de Tanguy",
    },

    // 57' - Remplacement Ortombina → Fa'aso'o (retour)
    {
      minute: 57,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Ortombina"],
      isUsap: true,
      description: "Sortie d'Alessandro Ortombina",
    },
    {
      minute: 57,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Fa'aso'o"],
      isUsap: true,
      description: "Retour de So'otala Fa'aso'o en remplacement d'Ortombina (remplacement tactique)",
    },

    // 59' - Remplacement Brookes → Ceccarelli
    {
      minute: 59,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Brookes"],
      isUsap: true,
      description: "Sortie de Kieran Brookes",
    },
    {
      minute: 59,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Ceccarelli"],
      isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes",
    },

    // 59' - Remplacement Beria → Tetrashvili
    {
      minute: 59,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Beria"],
      isUsap: true,
      description: "Sortie de Giorgi Beria",
    },
    {
      minute: 59,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Tetrashvili"],
      isUsap: true,
      description: "Entrée de Giorgi Tetrashvili en remplacement de Beria",
    },

    // 63' - Pénalité Simmonds (Pau) → Pau 16 - USAP 6
    {
      minute: 63,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité de Joe Simmonds (Pau). Pau 16 - USAP 6.",
    },

    // 64' - Carton jaune Joseph
    {
      minute: 64,
      type: "CARTON_JAUNE",
      playerId: PLAYER_IDS["Joseph"],
      isUsap: true,
      description: "Carton jaune pour Jefferson-Lee Joseph.",
    },

    // 75' - Remplacement Aprasidze → Hall (retour)
    {
      minute: 75,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Aprasidze"],
      isUsap: true,
      description: "Sortie de Gela Aprasidze",
    },
    {
      minute: 75,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Hall"],
      isUsap: true,
      description: "Retour de James Hall en remplacement d'Aprasidze",
    },

    // 79' - Essai Grandidier-Nkanang (Pau) → Pau 21 - USAP 6
    {
      minute: 79,
      type: "ESSAI",
      playerId: null,
      isUsap: false,
      description: "Essai d'Aaron Grandidier-Nkanang (Pau). Pau 21 - USAP 6.",
    },

    // 80' - Transformation Simmonds (Pau) → Pau 23 - USAP 6
    {
      minute: 80,
      type: "TRANSFORMATION",
      playerId: null,
      isUsap: false,
      description: "Transformation de Joe Simmonds (Pau). Pau 23 - USAP 6. Score final.",
    },
  ];

  for (const evt of events) {
    await prisma.matchEvent.create({
      data: {
        matchId: MATCH_ID,
        minute: evt.minute,
        type: evt.type,
        playerId: evt.playerId,
        isUsap: evt.isUsap,
        description: evt.description,
      },
    });
    const team = evt.isUsap ? "USAP" : "PAU ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  // Fa'aso'o : sort à 49', retour à 57' → 49 + (80-57) = 49 + 23 = 72
  // Hall : sort à 46', retour à 75' → 46 + (80-75) = 46 + 5 = 51
  const minutesMap: Record<string, number> = {
    // Titulaires
    Beria: 59,
    Ruiz: 54,
    Brookes: 59,
    Labouteley: 80,
    Tanguy: 57,
    Ortombina: 57,
    "Della Schiava": 80,
    "Fa'aso'o": 72,       // 49 + 23 (sort à 49', retour à 57')
    Hall: 51,             // 46 + 5 (sort à 46', retour à 75')
    Delpy: 80,
    Joseph: 80,
    Naqalevu: 57,
    Duguivalu: 80,
    Veredamu: 80,
    Dupichot: 57,
    // Remplaçants
    Lam: 26,              // entre à 54'
    Tetrashvili: 21,      // entre à 59'
    Warion: 23,           // entre à 57'
    Velarte: 31,          // entre à 49'
    Aprasidze: 29,        // entre à 46', sort à 75'
    Buliruarua: 23,       // entre à 57'
    Barraque: 23,         // entre à 57'
    Ceccarelli: 21,       // entre à 59'
  };

  for (const [lastName, minutes] of Object.entries(minutesMap)) {
    const playerId = PLAYER_IDS[lastName];
    if (!playerId) continue;

    const playerSquad = USAP_SQUAD.find((p) => p.lastName === lastName);
    const isStarter = playerSquad?.isStarter ?? false;

    let subIn: number | null = null;
    let subOut: number | null = null;

    if (!isStarter) {
      const entry = events.find(
        (e) => e.type === "REMPLACEMENT_ENTREE" && e.playerId === playerId
      );
      subIn = entry?.minute ?? null;
    }

    const exit = events.find(
      (e) => e.type === "REMPLACEMENT_SORTIE" && e.playerId === playerId
    );
    subOut = exit?.minute ?? null;

    await prisma.matchPlayer.updateMany({
      where: { matchId: MATCH_ID, playerId },
      data: { minutesPlayed: minutes, subIn, subOut },
    });
    console.log(`  ${lastName}: ${minutes}' ${subIn ? `(entrée ${subIn}')` : ""} ${subOut ? `(sortie ${subOut}')` : ""}`);
  }

  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Stade du Hameau (Pau) — extérieur");
  console.log(`  Arbitre : Ludovic Cayre (${referee?.id})`);
  console.log("  Score mi-temps : Pau 10 - USAP 6");
  console.log("  Score final : Pau 23 - USAP 6");
  console.log("  Bonus offensif : NON");
  console.log("  Bonus défensif : NON");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs USAP (15 titulaires + 8 remplaçants)`);
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * Script de mise à jour du match USAP - Aviron Bayonnais (J15 Top 14, 25/01/2025)
 * Score final : USAP 16 - Bayonne 11
 * Mi-temps : 6-6
 *
 * Victoire à domicile dans un match haché. Score 6-6 à la pause (buteurs imprécis
 * des deux côtés). En 2e mi-temps, essai d'Ecochard à la 48' malgré l'infériorité
 * numérique (CJ Aucagne 39'). Bruni réduit l'écart (58', non transformé, 13-11).
 * Allan met l'USAP à l'abri à la 78' (pénalité). CJ Naqalevu à la 79' (plaquage haut),
 * l'USAP défend à 14 dans les dernières minutes.
 *
 * Sources : top14.lnr.fr, allrugby.com, itsrugby.fr, francebleu.fr, rugbypass.com
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j15.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsej00391umr652lsctk"; // Match J15 USAP-Bayonne 2024-2025

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Labouteley", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Joseph", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Aucagne", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Lam", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Roelofse", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: false },
  { num: 20, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: false },
  { num: 22, lastName: "Crossdale", position: "ARRIERE" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

// === IDs des joueurs (depuis la BDD) ===
const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Labouteley: "cmmby9pfj001t1ucd75p7hi07",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Hicks: "cmmf3v3b300001ufyqblsuba1",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  Aucagne: "cmmby9riq00381ucdzmy4nusa",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Roelofse: "cmmby9pb4001q1ucdi9hhgjrr",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Crossdale: "cmmby9rsc003e1ucdli6st6ho",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

async function main() {
  console.log("=== Mise à jour match USAP - Bayonne (J15, 25/01/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Création arbitre Pierre-Baptiste Nuchy
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Nuchy", mode: "insensitive" } },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Pierre-Baptiste",
        lastName: "Nuchy",
        slug: `temp-${Date.now()}`,
      },
    });
    await prisma.referee.update({
      where: { id: referee.id },
      data: { slug: `pierre-baptiste-nuchy-${referee.id}` },
    });
    console.log(`  Créé : Pierre-Baptiste Nuchy (${referee.id})`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // Venue = Stade Aimé-Giral (match à domicile)
  const venue = await prisma.venue.findFirst({
    where: { name: { contains: "Giral", mode: "insensitive" } },
  });
  console.log(`\n--- Venue ---`);
  console.log(`  ${venue?.name} (${venue?.id})`);

  // ---------------------------------------------------------------
  // 1. Mise à jour du match (infos générales)
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-01-25"),
      kickoffTime: "16:00",
      venueId: venue?.id,
      refereeId: referee.id,
      halfTimeUsap: 6,
      halfTimeOpponent: 6,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 3,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Bayonne
      triesOpponent: 1,
      conversionsOpponent: 0,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Victoire à domicile dans un match haché et brouillon. Première mi-temps fermée avec de nombreuses approximations des deux côtés (en-avant, touches pas droites, pénalités en mêlée). Les buteurs sont en difficulté : Allan tape le poteau (10'), Aucagne manque la cible (12'), Lopez frappe la barre (30'), Tiberghien tente de plus de 55m sans succès (37'). Score 6-6 à la pause (pén. Tiberghien 8', pén. Allan 21', pén. Aucagne 29', pén. Lopez 40'). Carton jaune pour Aucagne juste avant la mi-temps (39', faute cynique dans ses 22m). Paradoxalement, c'est en infériorité numérique que l'USAP inscrit le premier essai par Tom Ecochard (48'), belle combinaison petit côté impliquant Allan et Joseph. L'USAP domine la mêlée. Bruni réduit l'écart pour Bayonne (58', non transformé, 13-11). Allan met l'USAP à l'abri d'une pénalité (78', 16-11). Fin de match dramatique : carton jaune pour Naqalevu (79', plaquage haut sur Maqala, les deux joueurs restent au sol). L'USAP défend sa ligne à 14 dans les dernières minutes, Bayonne finit sur la ligne mais perd le ballon sur un en-avant à la sirène.",
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
    if (p.lastName === "Ecochard") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Allan") {
      conversions = 1;
      penalties = 2; // pén. 21' et 78' (Aucagne a tiré celle de la 29')
      totalPoints = 8; // 1×2 + 2×3
    } else if (p.lastName === "Aucagne") {
      penalties = 1; // pén. 29'
      totalPoints = 3;
      yellowCard = true;
      yellowCardMin = 39;
    } else if (p.lastName === "Naqalevu") {
      yellowCard = true;
      yellowCardMin = 79;
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
    // 8' - Pénalité Tiberghien (Bayonne) → USAP 0 - Bayonne 3
    {
      minute: 8,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité de Cheikh Tiberghien (Bayonne). USAP 0 - Bayonne 3.",
    },

    // 21' - Pénalité Allan → USAP 3 - Bayonne 3
    {
      minute: 21,
      type: "PENALITE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité de Tommaso Allan. USAP 3 - Bayonne 3.",
    },

    // 29' - Pénalité Aucagne → USAP 6 - Bayonne 3
    {
      minute: 29,
      type: "PENALITE",
      playerId: PLAYER_IDS["Aucagne"],
      isUsap: true,
      description: "Pénalité d'Antoine Aucagne. USAP 6 - Bayonne 3.",
    },

    // 39' - Carton jaune Aucagne
    {
      minute: 39,
      type: "CARTON_JAUNE",
      playerId: PLAYER_IDS["Aucagne"],
      isUsap: true,
      description: "Carton jaune pour Antoine Aucagne (faute cynique dans les 22m de l'USAP).",
    },

    // 40' - Pénalité Lopez (Bayonne) → USAP 6 - Bayonne 6
    {
      minute: 40,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité de Camille Lopez (Bayonne). USAP 6 - Bayonne 6.",
    },

    // === MI-TEMPS : USAP 6 - Bayonne 6 ===

    // 48' - Essai Ecochard → USAP 11 - Bayonne 6
    {
      minute: 48,
      type: "ESSAI",
      playerId: PLAYER_IDS["Ecochard"],
      isUsap: true,
      description: "Essai de Tom Ecochard, belle combinaison petit côté avec Allan et Joseph. USAP en infériorité numérique. USAP 11 - Bayonne 6.",
    },

    // 48' - Transformation Allan → USAP 13 - Bayonne 6
    {
      minute: 48,
      type: "TRANSFORMATION",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Transformation de Tommaso Allan. USAP 13 - Bayonne 6.",
    },

    // 50' - Remplacement Warion → Tanguy
    {
      minute: 50,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Warion"],
      isUsap: true,
      description: "Sortie d'Adrien Warion",
    },
    {
      minute: 50,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Tanguy"],
      isUsap: true,
      description: "Entrée de Mathieu Tanguy en remplacement de Warion",
    },

    // 56' - Remplacement Ruiz → Lam
    {
      minute: 56,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Ruiz"],
      isUsap: true,
      description: "Sortie d'Ignacio Ruiz",
    },
    {
      minute: 56,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Lam"],
      isUsap: true,
      description: "Entrée de Seilala Lam en remplacement de Ruiz",
    },

    // 56' - Remplacement Oviedo → Fa'aso'o
    {
      minute: 56,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Oviedo"],
      isUsap: true,
      description: "Sortie de Joaquin Oviedo",
    },
    {
      minute: 56,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Fa'aso'o"],
      isUsap: true,
      description: "Entrée de So'otala Fa'aso'o en remplacement d'Oviedo",
    },

    // 58' - Essai Bruni (Bayonne) → USAP 13 - Bayonne 11
    {
      minute: 58,
      type: "ESSAI",
      playerId: null,
      isUsap: false,
      description: "Essai de Rodrigo Bruni (Bayonne), non transformé. USAP 13 - Bayonne 11.",
    },

    // 63' - Remplacement Beria → Roelofse
    {
      minute: 63,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Beria"],
      isUsap: true,
      description: "Sortie de Giorgi Beria",
    },
    {
      minute: 63,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Roelofse"],
      isUsap: true,
      description: "Entrée de Nemo Roelofse en remplacement de Beria",
    },

    // 64' - Remplacement Brookes → Ceccarelli
    {
      minute: 64,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Brookes"],
      isUsap: true,
      description: "Sortie de Kieran Brookes",
    },
    {
      minute: 64,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Ceccarelli"],
      isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes",
    },

    // 68' - Remplacement Joseph → Naqalevu
    {
      minute: 68,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Joseph"],
      isUsap: true,
      description: "Sortie de Jefferson-Lee Joseph",
    },
    {
      minute: 68,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Naqalevu"],
      isUsap: true,
      description: "Entrée d'Apisai Naqalevu en remplacement de Joseph",
    },

    // 68' - Remplacement Ecochard → Aprasidze
    {
      minute: 68,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Ecochard"],
      isUsap: true,
      description: "Sortie de Tom Ecochard",
    },
    {
      minute: 68,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Aprasidze"],
      isUsap: true,
      description: "Entrée de Gela Aprasidze en remplacement d'Ecochard",
    },

    // 77' - Remplacement Velarte → Oviedo (retour)
    {
      minute: 77,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Velarte"],
      isUsap: true,
      description: "Sortie de Lucas Velarte",
    },
    {
      minute: 77,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Oviedo"],
      isUsap: true,
      description: "Retour de Joaquin Oviedo en remplacement de Velarte",
    },

    // 77' - Remplacement Duguivalu → Crossdale
    {
      minute: 77,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Duguivalu"],
      isUsap: true,
      description: "Sortie d'Alivereti Duguivalu",
    },
    {
      minute: 77,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Crossdale"],
      isUsap: true,
      description: "Entrée d'Alistair Crossdale en remplacement de Duguivalu",
    },

    // 78' - Pénalité Allan → USAP 16 - Bayonne 11
    {
      minute: 78,
      type: "PENALITE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité de Tommaso Allan. USAP 16 - Bayonne 11. Score final.",
    },

    // 79' - Carton jaune Naqalevu
    {
      minute: 79,
      type: "CARTON_JAUNE",
      playerId: PLAYER_IDS["Naqalevu"],
      isUsap: true,
      description: "Carton jaune pour Apisai Naqalevu (plaquage haut sur Sireli Maqala). Les deux joueurs restent au sol.",
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
    const team = evt.isUsap ? "USAP" : "BAY ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesMap: Record<string, number> = {
    // Titulaires
    Beria: 63,          // sort à 63'
    Ruiz: 56,           // sort à 56'
    Brookes: 64,        // sort à 64'
    Labouteley: 80,
    Warion: 50,         // sort à 50'
    Velarte: 77,        // sort à 77'
    Hicks: 80,
    Oviedo: 56,         // sort à 56', retour à 77' → 56 + 3 = 59... non, il sort à 56 et rentre à 77
    Ecochard: 68,       // sort à 68'
    Allan: 80,
    Veredamu: 80,
    "De La Fuente": 80,
    Duguivalu: 77,      // sort à 77'
    Joseph: 68,         // sort à 68'
    Aucagne: 80,
    // Remplaçants
    Lam: 24,            // entre à 56' → 80-56 = 24
    Roelofse: 17,       // entre à 63' → 80-63 = 17
    Tanguy: 30,         // entre à 50' → 80-50 = 30
    "Fa'aso'o": 24,     // entre à 56' → 80-56 = 24
    Aprasidze: 12,      // entre à 68' → 80-68 = 12
    Naqalevu: 12,       // entre à 68' → 80-68 = 12
    Crossdale: 3,       // entre à 77' → 80-77 = 3
    Ceccarelli: 16,     // entre à 64' → 80-64 = 16
  };

  // Correction Oviedo : sort à 56', retour à 77' → 56 + (80-77) = 59
  minutesMap["Oviedo"] = 59;

  for (const [lastName, minutes] of Object.entries(minutesMap)) {
    const playerId = PLAYER_IDS[lastName];
    if (!playerId) continue;

    const playerSquad = USAP_SQUAD.find((p) => p.lastName === lastName);
    const isStarter = playerSquad?.isStarter ?? false;

    // Calcul subIn/subOut
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
  console.log("  Stade : Aimé-Giral (Perpignan) — domicile");
  console.log(`  Arbitre : Pierre-Baptiste Nuchy (${referee.id})`);
  console.log("  Score mi-temps : USAP 6 - Bayonne 6");
  console.log("  Score final : USAP 16 - Bayonne 11");
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

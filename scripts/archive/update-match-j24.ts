/**
 * Script de mise à jour du match ASM Clermont - USAP (J24 Top 14, 17/05/2025)
 * Score final : Clermont 31 - USAP 13
 * Mi-temps : Clermont 10 - USAP 3
 *
 * Lourde défaite au Michelin. L'USAP ouvre le score par Allan (pénalité 11')
 * mais deux CJ consécutifs (McIntyre 31', Duguivalu 36') coûtent cher :
 * Raka en profite (38'). 10-3 à la pause. En 2e MT, Delpy relance (pén 42')
 * mais Simone (49') et un essai de pénalité (51', CJ Naqalevu) enfoncent
 * les Catalans (24-6). Dubois réduit le score (60', transfo Delpy) pour son
 * retour après 7 mois de blessure. Simone clôt (79'). 31-13.
 * 3 CJ côté USAP (McIntyre, Duguivalu, Naqalevu), tous pour antijeu.
 *
 * Sources : top14.lnr.fr, allrugby.com, espn.com, francebleu.fr, minutesports.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j24.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsmj003r1umru5pefzc8";

const USAP_SQUAD = [
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Van Tonder", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Tuilagi", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Sobela", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "McIntyre", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Duguivalu", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Dubois", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Allan", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Lam", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Hicks", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 20, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "Delpy", position: "DEMI_OUVERTURE" as const, isStarter: false },
  { num: 22, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Roelofse", position: "PILIER_DROIT" as const, isStarter: false },
];

const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
  "Van Tonder": "cmmby9qj4002k1ucdmg0rggp5",
  Tuilagi: "cmmby9pso00221ucdwnmxzccc",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  McIntyre: "cmmby9ro0003b1ucd388eacr8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Dubois: "cmmby9rwn003h1ucdavvw842q",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Tetrashvili: "cmmby9ogb00151ucdz3vqd429",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  Hicks: "cmmf3v3b300001ufyqblsuba1",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Delpy: "cmmby9tcw004h1ucd3hmy7wmy",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Roelofse: "cmmby9pb4001q1ucdi9hhgjrr",
};

async function main() {
  console.log("=== Mise à jour match ASM Clermont - USAP (J24, 17/05/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Créer le stade Marcel-Michelin s'il n'existe pas
  // ---------------------------------------------------------------
  let venue = await prisma.venue.findFirst({ where: { name: { contains: "Michelin" } } });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade Marcel-Michelin",
        slug: "stade-marcel-michelin",
        city: "Clermont-Ferrand",
        capacity: 19000,
      },
    });
    console.log("  Stade Marcel-Michelin créé:", venue.id);
  }

  // ---------------------------------------------------------------
  // 1. Mise à jour du match
  // ---------------------------------------------------------------
  console.log("--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-05-17"),
      kickoffTime: "16:30",
      venueId: venue.id,
      refereeId: "cmmf2aovc00011u8463trvhe7", // Kévin Bralley
      halfTimeUsap: 3,
      halfTimeOpponent: 10,
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      triesOpponent: 3,
      conversionsOpponent: 3,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 1,
      bonusOffensif: false,
      bonusDefensif: false,
      report:
        "Lourde défaite au Stade Marcel-Michelin. L'USAP ouvre le score par Allan (pénalité 11', 0-3) mais deux cartons jaunes consécutifs pour antijeu (McIntyre 31', Duguivalu 36') coûtent cher. Réduits à 13, les Catalans encaissent l'essai de Raka transformé par Urdapilleta (38', 10-3). Mi-temps 10-3. En début de 2e période, Delpy (entré pour Allan) relance avec une pénalité (42', 10-6). Mais Clermont accélère : essai de Simone transformé (49', 17-6), puis Naqalevu prend un 3e CJ pour antijeu dans ses 5 mètres et l'arbitre Bralley accorde un essai de pénalité (51', 24-6). Lucas Dubois, de retour après 7 mois de blessure (péroné/cheville), marque un bel essai (60'), transformé par Delpy (24-13). L'USAP espère le bonus défensif mais Simone clôt le match sur un dernier essai transformé par Urdapilleta à la sirène (79', 31-13). L'USAP retombe 13e avec 40 points.",
    },
  });
  console.log("  Match mis à jour");

  // ---------------------------------------------------------------
  // 2. Composition USAP
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  await prisma.matchPlayer.deleteMany({ where: { matchId: MATCH_ID, isOpponent: false } });

  for (const p of USAP_SQUAD) {
    const playerId = PLAYER_IDS[p.lastName];
    if (!playerId) { console.error(`  ERREUR: ${p.lastName}`); continue; }

    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;
    let yellowCard = false;
    let yellowCardMin: number | null = null;

    if (p.lastName === "Allan") { penalties = 1; totalPoints = 3; }
    else if (p.lastName === "Delpy") { conversions = 1; penalties = 1; totalPoints = 5; }
    else if (p.lastName === "Dubois") { tries = 1; totalPoints = 5; }
    else if (p.lastName === "McIntyre") { yellowCard = true; yellowCardMin = 31; }
    else if (p.lastName === "Duguivalu") { yellowCard = true; yellowCardMin = 36; }
    else if (p.lastName === "Naqalevu") { yellowCard = true; yellowCardMin = 51; }

    await prisma.matchPlayer.create({
      data: {
        matchId: MATCH_ID,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: (p as { isCaptain?: boolean }).isCaptain ?? false,
        positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard, yellowCardMin,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    const yc = yellowCard ? ` [CJ ${yellowCardMin}']` : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${yc}`);
  }

  // ---------------------------------------------------------------
  // 3. Événements du match
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  await prisma.matchEvent.deleteMany({ where: { matchId: MATCH_ID } });

  const events = [
    // 11' - Pénalité Allan (USAP)
    { minute: 11, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. Clermont 0 - USAP 3." },

    // 24' - Ruiz → Lam
    { minute: 24, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Ruiz"], isUsap: true,
      description: "Sortie d'Ignacio Ruiz" },
    { minute: 24, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Entrée de Seilala Lam en remplacement de Ruiz" },

    // 31' - CJ McIntyre (antijeu)
    { minute: 31, type: "CARTON_JAUNE", playerId: PLAYER_IDS["McIntyre"], isUsap: true,
      description: "Carton jaune pour Jake McIntyre (antijeu)." },

    // 33' - Pénalité Urdapilleta (Clermont)
    { minute: 33, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Benjamin Urdapilleta (ASM Clermont). Clermont 3 - USAP 3." },

    // 36' - CJ Duguivalu (antijeu)
    { minute: 36, type: "CARTON_JAUNE", playerId: PLAYER_IDS["Duguivalu"], isUsap: true,
      description: "Carton jaune pour Alivereti Duguivalu (antijeu). USAP réduit à 13." },

    // 38' - Essai Raka + Transfo Urdapilleta (Clermont)
    { minute: 38, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai d'Alivereti Raka (ASM Clermont) en profitant de la supériorité numérique. Clermont 8 - USAP 3." },
    { minute: 39, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Benjamin Urdapilleta (ASM Clermont). Clermont 10 - USAP 3." },

    // 38' - Allan → Delpy
    { minute: 38, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Sortie de Tommaso Allan" },
    { minute: 38, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Entrée de Valentin Delpy en remplacement d'Allan" },

    // MI-TEMPS 10-3

    // 41' - Ceccarelli → Roelofse
    { minute: 41, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Sortie de Pietro Ceccarelli" },
    { minute: 41, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Roelofse"], isUsap: true,
      description: "Entrée de Nemo Roelofse en remplacement de Ceccarelli" },

    // 42' - Pénalité Delpy (USAP)
    { minute: 42, type: "PENALITE", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Pénalité de Valentin Delpy. Clermont 10 - USAP 6." },

    // 49' - Essai Simone + Transfo Urdapilleta (Clermont)
    { minute: 49, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai d'Irae Simone (ASM Clermont). Clermont 15 - USAP 6." },
    { minute: 49, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Benjamin Urdapilleta (ASM Clermont). Clermont 17 - USAP 6." },

    // 50' - Van Tonder → Hicks, Tuilagi → Tanguy, Buliruarua → Naqalevu
    { minute: 50, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Van Tonder"], isUsap: true,
      description: "Sortie de Jacobus Van Tonder" },
    { minute: 50, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Hicks"], isUsap: true,
      description: "Entrée de Maxwell Hicks en remplacement de Van Tonder" },
    { minute: 50, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Tuilagi"], isUsap: true,
      description: "Sortie de Posolo Tuilagi" },
    { minute: 50, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Tanguy"], isUsap: true,
      description: "Entrée de Mathieu Tanguy en remplacement de Tuilagi" },
    { minute: 50, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Buliruarua"], isUsap: true,
      description: "Sortie d'Eneriko Buliruarua" },
    { minute: 50, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Naqalevu"], isUsap: true,
      description: "Entrée d'Apisai Naqalevu en remplacement de Buliruarua" },

    // 51' - CJ Naqalevu + Essai de pénalité (Clermont)
    { minute: 51, type: "CARTON_JAUNE", playerId: PLAYER_IDS["Naqalevu"], isUsap: true,
      description: "Carton jaune pour Apisai Naqalevu (antijeu dans ses 5 mètres). 3e CJ pour l'USAP." },
    { minute: 51, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de pénalité accordé par l'arbitre Kévin Bralley (7 points automatiques). Clermont 24 - USAP 6." },

    // 53' - Beria → Tetrashvili, Hall → Aprasidze
    { minute: 53, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Beria"], isUsap: true,
      description: "Sortie de Giorgi Beria" },
    { minute: 53, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Tetrashvili"], isUsap: true,
      description: "Entrée de Giorgi Tetrashvili en remplacement de Beria" },
    { minute: 53, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Hall"], isUsap: true,
      description: "Sortie de James Hall" },
    { minute: 53, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Aprasidze"], isUsap: true,
      description: "Entrée de Gela Aprasidze en remplacement de Hall" },

    // 60' - Essai Dubois (USAP) + 61' Transfo Delpy
    { minute: 60, type: "ESSAI", playerId: PLAYER_IDS["Dubois"], isUsap: true,
      description: "Essai de Lucas Dubois, de retour après 7 mois de blessure (péroné/cheville). Clermont 24 - USAP 11." },
    { minute: 61, type: "TRANSFORMATION", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Transformation de Valentin Delpy. Clermont 24 - USAP 13." },

    // 64' - Sobela sort (Van Tonder revient de HIA)
    { minute: 64, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Sobela"], isUsap: true,
      description: "Sortie de Patrick Sobela" },

    // 71' - De La Fuente sort (Buliruarua revient de HIA)
    { minute: 71, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["De La Fuente"], isUsap: true,
      description: "Sortie de Jerónimo De La Fuente" },

    // 73' - Velarte sort (Tuilagi revient de HIA)
    { minute: 73, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Sortie de Lucas Velarte" },

    // 79' - Essai Simone + Transfo Urdapilleta (Clermont)
    { minute: 79, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai d'Irae Simone (ASM Clermont), son doublé. Belle inspiration de Sébastien Bézy. Clermont 29 - USAP 13." },
    { minute: 80, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Benjamin Urdapilleta (ASM Clermont) à la sirène. Score final : Clermont 31 - USAP 13." },
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
    const team = evt.isUsap ? "USAP" : "CLR ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  // Van Tonder, Tuilagi, Buliruarua sortis à 50' (HIA) puis revenus (64', 73', 71')
  const minutesMap: Record<string, number> = {
    Beria: 53, Ruiz: 24, Ceccarelli: 41, "Van Tonder": 66, Tuilagi: 57,
    Sobela: 64, "Della Schiava": 80, Velarte: 73, Hall: 53, McIntyre: 80,
    Duguivalu: 80, "De La Fuente": 71, Buliruarua: 59, Dubois: 80, Allan: 38,
    Lam: 56, Tetrashvili: 27, Tanguy: 30, Hicks: 14, Aprasidze: 27,
    Delpy: 42, Naqalevu: 30, Roelofse: 39,
  };

  for (const [lastName, minutes] of Object.entries(minutesMap)) {
    const playerId = PLAYER_IDS[lastName];
    if (!playerId) continue;
    if (minutes === 0) {
      console.log(`  ${lastName}: non utilisé`);
      continue;
    }
    const isStarter = USAP_SQUAD.find((p) => p.lastName === lastName)?.isStarter ?? false;
    let subIn: number | null = null;
    let subOut: number | null = null;
    if (!isStarter) {
      const entry = events.find((e) => e.type === "REMPLACEMENT_ENTREE" && e.playerId === playerId);
      subIn = entry?.minute ?? null;
    }
    const exit = events.find((e) => e.type === "REMPLACEMENT_SORTIE" && e.playerId === playerId);
    subOut = exit?.minute ?? null;
    await prisma.matchPlayer.updateMany({
      where: { matchId: MATCH_ID, playerId },
      data: { minutesPlayed: minutes, subIn, subOut },
    });
    console.log(`  ${lastName}: ${minutes}' ${subIn ? `(entrée ${subIn}')` : ""} ${subOut ? `(sortie ${subOut}')` : ""}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score mi-temps : Clermont 10 - USAP 3");
  console.log("  Score final : Clermont 31 - USAP 13");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs`);
  console.log(`  Événements : ${events.length}`);
  console.log("  3 CJ USAP : McIntyre (31'), Duguivalu (36'), Naqalevu (51')");
  console.log("  Retour de Lucas Dubois après 7 mois de blessure (essai)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

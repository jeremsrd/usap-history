/**
 * Script de mise à jour du match USAP - Racing 92 (J21 Top 14, 19/04/2025)
 * Score final : USAP 28 - Racing 92 24
 * Mi-temps : USAP 9 - Racing 7
 *
 * Victoire cruciale pour le maintien à Aimé-Giral. Allan auteur de 23 pts
 * (7 pén., 1 transfo). Essai spectaculaire de Duguivalu (51') élu essai
 * du week-end en Top 14 (course de 80m). McIntyre sort blessé dès la 9'.
 * Habosi (Racing) expulsé : 2 CJ (44', 69'). CJ Tuilagi (74').
 * Kaitu'u marque 2 essais en fin de match pour Racing mais l'USAP tient.
 *
 * Sources : top14.lnr.fr, allrugby.com, espn.com, itsrugby.fr, france3.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j21.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsjw003l1umr8iso0umg";

const USAP_SQUAD = [
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Lam", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Orie", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Sobela", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "McIntyre", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Duguivalu", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Allan", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Tuilagi", position: "PILIER_DROIT" as const, isStarter: false },
  { num: 19, lastName: "Hicks", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 20, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 21, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 22, lastName: "Delpy", position: "DEMI_OUVERTURE" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Orie: "cmmby9pk0001w1ucdhzjt30qx",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  McIntyre: "cmmby9ro0003b1ucd388eacr8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Devaux: "cmmby9obz00121ucdcgxy6k3w",
  Tuilagi: "cmmby9pso00221ucdwnmxzccc",
  Hicks: "cmmf3v3b300001ufyqblsuba1",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Delpy: "cmmby9tcw004h1ucd3hmy7wmy",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

async function main() {
  console.log("=== Mise à jour match USAP - Racing 92 (J21, 19/04/2025) ===\n");

  // ---------------------------------------------------------------
  // 1. Mise à jour du match
  // ---------------------------------------------------------------
  console.log("--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-04-19"),
      kickoffTime: "16:30",
      venueId: "cmm6wnybf000d1uihl8hsk9e1", // Aimé-Giral
      refereeId: "cmmf2aovc00011u8463trvhe7", // Kévin Bralley
      halfTimeUsap: 9,
      halfTimeOpponent: 7,
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 7,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      triesOpponent: 3,
      conversionsOpponent: 3,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      bonusOffensif: false,
      bonusDefensif: false,
      report:
        "Victoire cruciale pour le maintien à Aimé-Giral face au Racing 92. Coup dur dès la 9e minute avec la sortie sur blessure de McIntyre, remplacé par Delpy. Allan prend les commandes du jeu et de la botte depuis l'arrière. Première mi-temps serrée : Allan passe 3 pénalités (15', 19', 35') contre un essai de Romain Taofifénua pour le Racing transformé par Le Garrec (28', 6-7). USAP devant 9-7 à la pause. En 2e période, Allan enfonce le clou avec une 4e pénalité (42', 12-7). Le moment clé arrive à la 51' : sur une action de 80 mètres, Duguivalu conclut un essai spectaculaire élu essai du week-end en Top 14, transformé par Allan (19-7). Habosi (Racing) prend un premier carton jaune (44'), puis est expulsé pour un 2e carton jaune (69'). Allan continue de punir l'indiscipline du Racing (pén. 57', 62', 69'). L'USAP mène 28-7 mais Kaitu'u inscrit 2 essais (60', 75') et Le Garrec ajoute une pénalité (65') pour revenir à 28-24. Tuilagi prend un CJ (74'). Fin de match tendue mais l'USAP résiste. Victoire décisive dans la course au maintien.",
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

    if (p.lastName === "Allan") { penalties = 7; conversions = 1; totalPoints = 23; }
    else if (p.lastName === "Duguivalu") { tries = 1; totalPoints = 5; }
    else if (p.lastName === "Tuilagi") { yellowCard = true; yellowCardMin = 74; }

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
    const cj = yellowCard ? ` [CJ ${yellowCardMin}']` : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${cj}`);
  }

  // ---------------------------------------------------------------
  // 3. Événements du match
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  await prisma.matchEvent.deleteMany({ where: { matchId: MATCH_ID } });

  const events = [
    // 1ère mi-temps

    // 9' - McIntyre sort blessé
    { minute: 9, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["McIntyre"], isUsap: true,
      description: "Sortie de Jake McIntyre (blessure)" },
    { minute: 9, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Entrée de Valentin Delpy en remplacement de McIntyre (blessure)" },

    { minute: 15, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. USAP 3 - Racing 0." },
    { minute: 19, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. USAP 6 - Racing 0." },

    { minute: 28, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Romain Taofifénua (Racing 92) en force après une touche et maul. USAP 6 - Racing 5." },
    { minute: 29, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Nolann Le Garrec (Racing 92). USAP 6 - Racing 7." },

    { minute: 35, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. USAP 9 - Racing 7. Score à la mi-temps." },

    // MI-TEMPS 9-7

    { minute: 42, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. USAP 12 - Racing 7." },

    // 44' - CJ Habosi (Racing)
    { minute: 44, type: "CARTON_JAUNE", playerId: null, isUsap: false,
      description: "Carton jaune pour Vinaya Habosi (Racing 92)." },

    // 47' - Lam → Ruiz
    { minute: 47, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Sortie de Seilala Lam" },
    { minute: 47, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Ruiz"], isUsap: true,
      description: "Entrée d'Ignacio Ruiz en remplacement de Lam" },

    // 50' - Orie → Hicks
    { minute: 50, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Orie"], isUsap: true,
      description: "Sortie de Marvin Orie" },
    { minute: 50, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Hicks"], isUsap: true,
      description: "Entrée de Maxwell Hicks en remplacement d'Orie" },

    // 51' - Essai Duguivalu + 52' Transfo Allan
    { minute: 51, type: "ESSAI", playerId: PLAYER_IDS["Duguivalu"], isUsap: true,
      description: "Essai spectaculaire d'Alivereti Duguivalu après une course de plus de 80 mètres. Élu essai du week-end en Top 14. USAP 17 - Racing 7." },
    { minute: 52, type: "TRANSFORMATION", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. USAP 19 - Racing 7." },

    { minute: 57, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. USAP 22 - Racing 7." },

    // 60' - Essai Kaitu'u (Racing)
    { minute: 60, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Feleti Kaitu'u (Racing 92). USAP 22 - Racing 12." },
    { minute: 60, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Nolann Le Garrec (Racing 92). USAP 22 - Racing 14." },

    // 61' - Brookes → Ceccarelli, Beria → Devaux
    { minute: 61, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Sortie de Kieran Brookes" },
    { minute: 61, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes" },
    { minute: 61, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Beria"], isUsap: true,
      description: "Sortie de Giorgi Beria" },
    { minute: 61, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Devaux"], isUsap: true,
      description: "Entrée de Bruce Devaux en remplacement de Beria" },

    // 62' - Fa'aso'o → Velarte
    { minute: 62, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Fa'aso'o"], isUsap: true,
      description: "Sortie de So'otala Fa'aso'o" },
    { minute: 62, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Entrée de Lucas Velarte en remplacement de Fa'aso'o" },

    { minute: 62, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. USAP 25 - Racing 14." },

    // 65' - Pénalité Le Garrec (Racing)
    { minute: 65, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Nolann Le Garrec (Racing 92). USAP 25 - Racing 17." },

    // 69' - CR Habosi (2e CJ) + Pénalité Allan
    { minute: 69, type: "CARTON_JAUNE", playerId: null, isUsap: false,
      description: "2e carton jaune pour Vinaya Habosi (Racing 92) = carton rouge. Racing à 14." },
    { minute: 69, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. USAP 28 - Racing 17." },

    // 70' - Della Schiava → Tuilagi
    { minute: 70, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Della Schiava"], isUsap: true,
      description: "Sortie de Noé Della Schiava" },
    { minute: 70, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Tuilagi"], isUsap: true,
      description: "Entrée de Posolo Tuilagi en remplacement de Della Schiava" },

    // 74' - CJ Tuilagi
    { minute: 74, type: "CARTON_JAUNE", playerId: PLAYER_IDS["Tuilagi"], isUsap: true,
      description: "Carton jaune pour Posolo Tuilagi (USAP)." },

    // 75' - Essai Kaitu'u (Racing)
    { minute: 75, type: "ESSAI", playerId: null, isUsap: false,
      description: "2e essai de Feleti Kaitu'u (Racing 92). USAP 28 - Racing 22." },
    { minute: 76, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Nolann Le Garrec (Racing 92). USAP 28 - Racing 24." },

    // 76' - Hall → Aprasidze
    { minute: 76, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Hall"], isUsap: true,
      description: "Sortie de James Hall" },
    { minute: 76, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Aprasidze"], isUsap: true,
      description: "Entrée de Gela Aprasidze en remplacement de Hall" },
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
    const team = evt.isUsap ? "USAP" : "RAC ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesMap: Record<string, number> = {
    Beria: 61, Lam: 47, Brookes: 61, Orie: 50, Warion: 80,
    Sobela: 80, "Della Schiava": 70, "Fa'aso'o": 62, Hall: 76, McIntyre: 9,
    Duguivalu: 80, "De La Fuente": 80, Buliruarua: 80, Veredamu: 80, Allan: 80,
    Ruiz: 33, Devaux: 19, Tuilagi: 10, Hicks: 30, Velarte: 18,
    Aprasidze: 4, Delpy: 71, Ceccarelli: 19,
  };

  for (const [lastName, minutes] of Object.entries(minutesMap)) {
    const playerId = PLAYER_IDS[lastName];
    if (!playerId) continue;
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
  console.log("  Score mi-temps : USAP 9 - Racing 7");
  console.log("  Score final : USAP 28 - Racing 24");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs`);
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

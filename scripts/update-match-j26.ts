/**
 * Script de mise à jour du match USAP - Stade Toulousain (J26 Top 14, 07/06/2025)
 * Score final : USAP 42 - Stade Toulousain 35
 * Mi-temps : USAP 7 - Stade Toulousain 21
 *
 * Dernière journée de saison régulière à Aimé-Giral. L'USAP menée 7-21 à la pause
 * réalise une remontada exceptionnelle en 2e mi-temps grâce à 5 essais (Joseph x2,
 * Lotrian x2, Duguivalu). Tuilagi avait marqué le seul essai de la 1re MT (37').
 * Allan parfait aux pieds (4/4 transfos), Delpy enchaîne (2/2 transfos).
 * Van Tonder sort sur blessure à la 8' (remplacé par Brazo).
 * Côté Toulouse, Ntamack (essai + 3 transfos), Delibes et Graou marquent avant la pause.
 * Castro-Ferreira (66') et Galtier (80') réduisent l'écart en fin de match.
 * Capuozzo sort sur blessure (cheville gauche, inquiétude avant la demi-finale).
 * Malgré cette victoire, l'USAP reste 13e (Stade Français bat Castres 21-10).
 * L'USAP jouera l'access match à Grenoble la semaine suivante.
 *
 * Sources : top14.lnr.fr, allrugby.com, francebleu.fr, rugbypass.com, xvovalie.com
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j26.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsod003v1umrwqyzi6ba";

const USAP_SQUAD = [
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Lam", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Roelofse", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Tuilagi", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Van Tonder", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 13, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 14, lastName: "Joseph", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Dubois", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Lotrian", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Oviedo", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Brazo", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "Delpy", position: "DEMI_OUVERTURE" as const, isStarter: false },
  { num: 22, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: false },
];

const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Roelofse: "cmmby9pb4001q1ucdi9hhgjrr",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  Tuilagi: "cmmby9pso00221ucdwnmxzccc",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  "Van Tonder": "cmmby9qj4002k1ucdmg0rggp5",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  Dubois: "cmmby9rwn003h1ucdavvw842q",
  Lotrian: "cmmjos9mf00001u6rl2qfe0jc",
  Devaux: "cmmby9obz00121ucdcgxy6k3w",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Brazo: "cmmby9q5t002b1ucdgw3ikj36",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Delpy: "cmmby9tcw004h1ucd3hmy7wmy",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
};

async function main() {
  console.log("=== Mise à jour match USAP - Stade Toulousain (J26, 07/06/2025) ===\n");

  // ---------------------------------------------------------------
  // 1. Mise à jour du match
  // ---------------------------------------------------------------
  console.log("--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-06-07"),
      kickoffTime: "21:05",
      venueId: "cmm6wnybf000d1uihl8hsk9e1", // Stade Aimé-Giral
      refereeId: "cmmc8h10i00001uvcjrg5a061", // Ludovic Cayre
      halfTimeUsap: 7,
      halfTimeOpponent: 21,
      triesUsap: 6,
      conversionsUsap: 6,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      triesOpponent: 5,
      conversionsOpponent: 5,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      bonusOffensif: true,
      bonusDefensif: false,
      report:
        "Dernière journée de saison régulière à Aimé-Giral, et quelle soirée ! Menée 7-21 à la pause après les essais de Ntamack (12'), Delibes (24') et Graou (39'), l'USAP ne s'est jamais résignée. Tuilagi avait sonné la révolte avant la pause (37', 7-14) mais Graou avait immédiatement répondu (39', 7-21). En deuxième mi-temps, les Catalans réalisent une remontada historique : Joseph ouvre le bal (51', 14-21), puis Lotrian, pour ses débuts à Aimé-Giral, inscrit un doublé (58', 21-21 puis 62', 28-21). Castro-Ferreira ramène Toulouse à hauteur (66', 28-28), mais Duguivalu (68', 35-28) et Joseph pour son doublé (74', 42-28) assurent la victoire. Galtier réduit l'écart en fin de match (80', 42-35). Allan parfait au pied (4/4 transfos), relayé par Delpy (2/2). Van Tonder sort sur blessure dès la 8'. Côté toulousain, Capuozzo quitte le terrain blessé à la cheville, inquiétude avant la demi-finale. Malgré cette victoire 42-35 et le bonus offensif, l'USAP reste 13e car le Stade Français a battu Castres (21-10). Direction Grenoble pour l'access match.",
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

    if (p.lastName === "Tuilagi") { tries = 1; totalPoints = 5; }
    else if (p.lastName === "Joseph") { tries = 2; totalPoints = 10; }
    else if (p.lastName === "Lotrian") { tries = 2; totalPoints = 10; }
    else if (p.lastName === "Duguivalu") { tries = 1; totalPoints = 5; }
    else if (p.lastName === "Allan") { conversions = 4; totalPoints = 8; }
    else if (p.lastName === "Delpy") { conversions = 2; totalPoints = 4; }

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
    // 8' - Van Tonder sort sur blessure → Brazo entre
    { minute: 8, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Van Tonder"], isUsap: true,
      description: "Sortie de Jacobus Van Tonder (blessure)." },
    { minute: 8, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Brazo"], isUsap: true,
      description: "Entrée d'Alan Brazo en remplacement de Van Tonder." },

    // 12' - Essai Ntamack (Toulouse)
    { minute: 12, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Romain Ntamack (Stade Toulousain). USAP 0 - Toulouse 5." },
    { minute: 13, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Romain Ntamack (Stade Toulousain). USAP 0 - Toulouse 7." },

    // 24' - Essai Delibes (Toulouse)
    { minute: 24, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Dimitri Delibes (Stade Toulousain). USAP 0 - Toulouse 12." },
    { minute: 24, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Romain Ntamack (Stade Toulousain). USAP 0 - Toulouse 14." },

    // 24' - Roelofse → Brookes
    { minute: 24, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Roelofse"], isUsap: true,
      description: "Sortie de Nemo Roelofse." },
    { minute: 24, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Entrée de Kieran Brookes en remplacement de Roelofse." },

    // 37' - Essai Tuilagi (USAP)
    { minute: 37, type: "ESSAI", playerId: PLAYER_IDS["Tuilagi"], isUsap: true,
      description: "Essai de Posolo Tuilagi. USAP 5 - Toulouse 14." },
    { minute: 38, type: "TRANSFORMATION", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. USAP 7 - Toulouse 14." },

    // 39' - Essai Graou (Toulouse)
    { minute: 39, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Paul Graou (Stade Toulousain). USAP 7 - Toulouse 19." },
    { minute: 40, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Romain Ntamack (Stade Toulousain). USAP 7 - Toulouse 21." },

    // MI-TEMPS 7-21

    // 51' - Essai Joseph (USAP)
    { minute: 51, type: "ESSAI", playerId: PLAYER_IDS["Joseph"], isUsap: true,
      description: "Essai de Jefferson-Lee Joseph. La remontée commence ! USAP 12 - Toulouse 21." },
    { minute: 52, type: "TRANSFORMATION", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. USAP 14 - Toulouse 21." },

    // 51' - Changements première ligne : Beria → Devaux, Lam → Lotrian
    { minute: 51, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Beria"], isUsap: true,
      description: "Sortie de Giorgi Beria." },
    { minute: 51, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Devaux"], isUsap: true,
      description: "Entrée de Bruce Devaux en remplacement de Beria." },
    { minute: 51, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Sortie de Seilala Lam." },
    { minute: 51, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Lotrian"], isUsap: true,
      description: "Entrée de Mathys Lotrian en remplacement de Lam." },

    // 58' - Essai Lotrian (USAP)
    { minute: 58, type: "ESSAI", playerId: PLAYER_IDS["Lotrian"], isUsap: true,
      description: "Essai de Mathys Lotrian pour ses débuts à Aimé-Giral ! USAP 19 - Toulouse 21." },
    { minute: 59, type: "TRANSFORMATION", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. Égalisation ! USAP 21 - Toulouse 21." },

    // 62' - Essai Lotrian (USAP) — doublé !
    { minute: 62, type: "ESSAI", playerId: PLAYER_IDS["Lotrian"], isUsap: true,
      description: "Doublé de Mathys Lotrian ! L'USAP passe devant ! USAP 26 - Toulouse 21." },
    { minute: 63, type: "TRANSFORMATION", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan (4/4). USAP 28 - Toulouse 21." },

    // 65' - Allan → Delpy, De La Fuente → Naqalevu
    { minute: 65, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Sortie de Tommaso Allan." },
    { minute: 65, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Entrée de Valentin Delpy en remplacement d'Allan." },
    { minute: 65, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["De La Fuente"], isUsap: true,
      description: "Sortie de Jerónimo De La Fuente." },
    { minute: 65, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Naqalevu"], isUsap: true,
      description: "Entrée d'Apisai Naqalevu en remplacement de De La Fuente." },

    // 66' - Essai Castro-Ferreira (Toulouse)
    { minute: 66, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Mathis Castro-Ferreira (Stade Toulousain). USAP 28 - Toulouse 26." },
    { minute: 67, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation (Stade Toulousain). Égalisation ! USAP 28 - Toulouse 28." },

    // 68' - Essai Duguivalu (USAP)
    { minute: 68, type: "ESSAI", playerId: PLAYER_IDS["Duguivalu"], isUsap: true,
      description: "Essai d'Alivereti Duguivalu. L'USAP reprend la tête ! USAP 33 - Toulouse 28." },
    { minute: 69, type: "TRANSFORMATION", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Transformation de Valentin Delpy. USAP 35 - Toulouse 28." },

    // 74' - Essai Joseph (USAP) — doublé !
    { minute: 74, type: "ESSAI", playerId: PLAYER_IDS["Joseph"], isUsap: true,
      description: "Doublé de Jefferson-Lee Joseph ! USAP 40 - Toulouse 28." },

    // 74' - Hall → Aprasidze
    { minute: 74, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Hall"], isUsap: true,
      description: "Sortie de James Hall." },
    { minute: 74, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Aprasidze"], isUsap: true,
      description: "Entrée de Gela Aprasidze en remplacement de Hall." },

    { minute: 75, type: "TRANSFORMATION", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Transformation de Valentin Delpy (2/2). USAP 42 - Toulouse 28." },

    // 80' - Essai Galtier (Toulouse)
    { minute: 80, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Mathieu Galtier (Stade Toulousain). Essai de consolation. USAP 42 - Toulouse 33." },
    { minute: 80, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Paul Graou (Stade Toulousain). Score final : USAP 42 - Toulouse 35." },
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
    const team = evt.isUsap ? "USAP" : "TOU ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesMap: Record<string, number> = {
    Beria: 51, Lam: 51, Roelofse: 24, Tanguy: 80, Tuilagi: 80,
    "Della Schiava": 80, "Van Tonder": 8, Velarte: 80, Hall: 74, Allan: 65,
    Veredamu: 80, Duguivalu: 80, "De La Fuente": 65, Joseph: 80, Dubois: 80,
    Lotrian: 29, Devaux: 29, Oviedo: 0, Brazo: 72, Aprasidze: 6,
    Delpy: 15, Naqalevu: 15, Brookes: 56,
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
  console.log("  Score mi-temps : USAP 7 - Toulouse 21");
  console.log("  Score final : USAP 42 - Toulouse 35");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs`);
  console.log(`  Événements : ${events.length}`);
  console.log("  Essais USAP : Tuilagi (37'), Joseph (51', 74'), Lotrian (58', 62'), Duguivalu (68')");
  console.log("  Transfos : Allan 4/4, Delpy 2/2");
  console.log("  Essais Toulouse : Ntamack (12'), Delibes (24'), Graou (39'), Castro-Ferreira (66'), Galtier (80')");
  console.log("  Van Tonder sorti sur blessure (8')");
  console.log("  Bonus offensif : OUI (6 essais)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

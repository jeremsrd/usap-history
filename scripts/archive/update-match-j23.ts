/**
 * Script de mise à jour du match USAP - Stade Français (J23 Top 14, 10/05/2025)
 * Score final : USAP 20 - Stade Français 18
 * Mi-temps : USAP 3 - Stade Français 10
 *
 * Match de la peur pour le maintien entre le 12e et le 13e (37 pts chacun).
 * L'USAP mené 3-10 à la pause remonte grâce à un essai de pénalité (43'),
 * un essai construit sur 60m par Velarte (61') et la pénalité décisive
 * d'Allan (75'). 3 CJ pour le Stade Français (Pesenti 5', Nicotera 42',
 * Azagoh 74'). Allan rate 2 tentatives avant de passer la bonne.
 *
 * Sources : top14.lnr.fr, allrugby.com, espn.com, itsrugby.fr, rugbypass.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j23.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxslo003p1umrvc8pr1cd";

const USAP_SQUAD = [
  { num: 1, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Van Tonder", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Sobela", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "McIntyre", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Duguivalu", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Delpy", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Lam", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Tuilagi", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Hicks", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 20, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: false },
  { num: 22, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

const PLAYER_IDS: Record<string, string> = {
  Devaux: "cmmby9obz00121ucdcgxy6k3w",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  "Van Tonder": "cmmby9qj4002k1ucdmg0rggp5",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  McIntyre: "cmmby9ro0003b1ucd388eacr8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Delpy: "cmmby9tcw004h1ucd3hmy7wmy",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Tuilagi: "cmmby9pso00221ucdwnmxzccc",
  Hicks: "cmmf3v3b300001ufyqblsuba1",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

async function main() {
  console.log("=== Mise à jour match USAP - Stade Français (J23, 10/05/2025) ===\n");

  // ---------------------------------------------------------------
  // 1. Mise à jour du match
  // ---------------------------------------------------------------
  console.log("--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-05-10"),
      kickoffTime: "16:30",
      venueId: "cmm6wnybf000d1uihl8hsk9e1", // Aimé-Giral
      refereeId: "cmmcafble00001u4e59hp7yan", // Pierre Brousset
      halfTimeUsap: 3,
      halfTimeOpponent: 10,
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 1,
      triesOpponent: 2,
      conversionsOpponent: 1,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      bonusOffensif: false,
      bonusDefensif: false,
      report:
        "Match de la peur pour le maintien entre le 12e et le 13e du Top 14 (37 pts chacun). Début difficile : Pesenti (SF) prend un CJ (5') mais l'USAP n'en profite pas. Henry passe une pénalité (20', 0-3). McIntyre égalise (24', 3-3). Dakuwaqa marque pour le Stade Français juste avant la pause, transformé par Henry (40', 3-10). Dès la reprise, Nicotera prend un CJ (42') et l'arbitre Brousset accorde un essai de pénalité (43', 10-10). Mais Hall passe le ballon directement dans les bras de Macalou sur un lancer en touche à 5m (47', 10-15). Allan entre à la 57' pour Delpy et se montre décisif : impliqué dans un superbe essai construit sur 60 mètres sans passer par le sol, offload de Buliruarua, conclu par Velarte (61', 17-15 après transformation). Henry repasse le SF devant sur pénalité (64', 17-18). Azagoh prend un 3e CJ pour Paris (74'). Allan rate 2 tentatives de pénalité (67', 72') avant de passer la bonne, la plus importante (75', 20-18). Henry rate une dernière pénalité (78'). Victoire cruciale, l'USAP remonte 12e avec 40 pts.",
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

    if (p.lastName === "McIntyre") { penalties = 1; totalPoints = 3; }
    else if (p.lastName === "Velarte") { tries = 1; totalPoints = 5; }
    else if (p.lastName === "Allan") { conversions = 1; penalties = 1; totalPoints = 5; }

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
        yellowCard: false, yellowCardMin: null,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}`);
  }

  // ---------------------------------------------------------------
  // 3. Événements du match
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  await prisma.matchEvent.deleteMany({ where: { matchId: MATCH_ID } });

  const events = [
    // 5' - CJ Pesenti (SF)
    { minute: 5, type: "CARTON_JAUNE", playerId: null, isUsap: false,
      description: "Carton jaune pour Baptiste Pesenti (Stade Français)." },

    // 12' - Brookes → Ceccarelli
    { minute: 12, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Sortie de Kieran Brookes" },
    { minute: 12, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes" },

    // 20' - Pénalité Henry (SF)
    { minute: 20, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Zack Henry (Stade Français). USAP 0 - SF 3." },

    // 24' - Pénalité McIntyre (USAP)
    { minute: 24, type: "PENALITE", playerId: PLAYER_IDS["McIntyre"], isUsap: true,
      description: "Pénalité de Jake McIntyre. USAP 3 - SF 3." },

    // 40' - Essai Dakuwaqa (SF)
    { minute: 40, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Peniasi Dakuwaqa (Stade Français). USAP 3 - SF 8." },
    { minute: 42, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Zack Henry (Stade Français). USAP 3 - SF 10." },

    // 42' - CJ Nicotera (SF)
    { minute: 42, type: "CARTON_JAUNE", playerId: null, isUsap: false,
      description: "Carton jaune pour Giacomo Nicotera (Stade Français)." },

    // MI-TEMPS 3-10

    // 43' - Essai de pénalité
    { minute: 43, type: "ESSAI", playerId: null, isUsap: true,
      description: "Essai de pénalité accordé par l'arbitre Pierre Brousset (7 points automatiques). USAP 10 - SF 10." },

    // 47' - Essai Macalou (SF)
    { minute: 47, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Sekou Macalou (Stade Français) sur un lancer en touche de l'USAP passé directement dans ses bras par James Hall. USAP 10 - SF 15." },

    // 50' - Tanguy → Tuilagi
    { minute: 50, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Tanguy"], isUsap: true,
      description: "Sortie de Mathieu Tanguy" },
    { minute: 50, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Tuilagi"], isUsap: true,
      description: "Entrée de Posolo Tuilagi en remplacement de Tanguy" },

    // 53' - Devaux → Beria, Van Tonder → Hicks
    { minute: 53, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Devaux"], isUsap: true,
      description: "Sortie de Bruce Devaux" },
    { minute: 53, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Beria"], isUsap: true,
      description: "Entrée de Giorgi Beria en remplacement de Devaux" },
    { minute: 53, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Van Tonder"], isUsap: true,
      description: "Sortie de Jacobus Van Tonder" },
    { minute: 53, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Hicks"], isUsap: true,
      description: "Entrée de Maxwell Hicks en remplacement de Van Tonder" },

    // 57' - Delpy → Allan
    { minute: 57, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Sortie de Valentin Delpy" },
    { minute: 57, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Entrée de Tommaso Allan en remplacement de Delpy" },

    // 61' - Essai Velarte + 62' Transfo Allan
    { minute: 61, type: "ESSAI", playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Essai de Lucas Velarte après une action de 60 mètres sans passer par le sol, offload décisif de Buliruarua. USAP 15 - SF 15." },
    { minute: 62, type: "TRANSFORMATION", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. USAP 17 - SF 15." },

    // 64' - Ruiz → Lam, Buliruarua → Naqalevu
    { minute: 64, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Ruiz"], isUsap: true,
      description: "Sortie d'Ignacio Ruiz" },
    { minute: 64, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Entrée de Seilala Lam en remplacement de Ruiz" },
    { minute: 64, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Buliruarua"], isUsap: true,
      description: "Sortie d'Eneriko Buliruarua" },
    { minute: 64, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Naqalevu"], isUsap: true,
      description: "Entrée d'Apisai Naqalevu en remplacement de Buliruarua" },

    // 64' - Pénalité Henry (SF)
    { minute: 64, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Zack Henry (Stade Français). USAP 17 - SF 18." },

    // 74' - CJ Azagoh (SF)
    { minute: 74, type: "CARTON_JAUNE", playerId: null, isUsap: false,
      description: "Carton jaune pour Pierre-Henri Azagoh (Stade Français). 3e carton jaune parisien." },

    // 75' - Pénalité Allan (USAP) - la décisive
    { minute: 75, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité décisive de Tommaso Allan après 2 tentatives ratées (67', 72'). USAP 20 - SF 18. Score final." },
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
    const team = evt.isUsap ? "USAP" : "SF  ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesMap: Record<string, number> = {
    Devaux: 53, Ruiz: 64, Brookes: 12, "Van Tonder": 53, Tanguy: 50,
    Sobela: 80, "Della Schiava": 80, Velarte: 80, Hall: 80, McIntyre: 80,
    Duguivalu: 80, "De La Fuente": 80, Buliruarua: 64, Veredamu: 80, Delpy: 57,
    Lam: 16, Beria: 27, Tuilagi: 30, Hicks: 27, Aprasidze: 0,
    Allan: 23, Naqalevu: 16, Ceccarelli: 68,
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
  console.log("  Score mi-temps : USAP 3 - SF 10");
  console.log("  Score final : USAP 20 - SF 18");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs (1 non utilisé)`);
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

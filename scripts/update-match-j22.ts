/**
 * Script de mise à jour du match Montpellier - USAP (J22 Top 14, 26/04/2025)
 * Score final : Montpellier 19 - USAP 13
 * Mi-temps : Montpellier 16 - USAP 10
 *
 * Défaite au GGL Stadium malgré 75% de possession. Stuart Hogg (MHR) auteur
 * de 11 pts (2 pén., 1 drop, 1 transfo). Essai de Velarte (30') pour l'USAP.
 * HIA de Brookes (7'-13'). Bloc de 6 remplacements à la 62e. Touche
 * dysfonctionnelle de l'USAP en fin de match. Pas de carton dans le match.
 * Ruiz retourne sur le terrain à la 76' (réglementation première ligne).
 *
 * Sources : top14.lnr.fr, allrugby.com, espn.com, itsrugby.fr, eurosport.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j22.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsks003n1umrw0re9l48";

const USAP_SQUAD = [
  { num: 1, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Orie", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Delpy", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Joseph", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Allan", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Lam", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Tuilagi", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Sobela", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 21, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 22, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

const PLAYER_IDS: Record<string, string> = {
  Devaux: "cmmby9obz00121ucdcgxy6k3w",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Orie: "cmmby9pk0001w1ucdhzjt30qx",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Hicks: "cmmf3v3b300001ufyqblsuba1",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  Delpy: "cmmby9tcw004h1ucd3hmy7wmy",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Tuilagi: "cmmby9pso00221ucdwnmxzccc",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

async function main() {
  console.log("=== Mise à jour match Montpellier - USAP (J22, 26/04/2025) ===\n");

  // Créer le GGL Stadium
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "GGL", mode: "insensitive" } },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "GGL Stadium",
        city: "Montpellier",
        capacity: 15600,
        slug: "ggl-stadium-temp",
      },
    });
    await prisma.venue.update({
      where: { id: venue.id },
      data: { slug: `ggl-stadium-${venue.id}` },
    });
    console.log(`Venue créé : ${venue.name} (${venue.id})`);
  } else {
    console.log(`Venue existant : ${venue.name} (${venue.id})`);
  }

  // ---------------------------------------------------------------
  // 1. Mise à jour du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-04-26"),
      kickoffTime: "16:30",
      venueId: venue.id,
      refereeId: "cmmhxreb500001usokg85idh4", // Vincent Blasco-Baqué
      halfTimeUsap: 10,
      halfTimeOpponent: 16,
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      triesOpponent: 1,
      conversionsOpponent: 1,
      penaltiesOpponent: 3,
      dropGoalsOpponent: 1,
      penaltyTriesOpponent: 0,
      bonusOffensif: false,
      bonusDefensif: true,
      report:
        "Défaite au GGL Stadium malgré une possession largement en faveur de l'USAP (75%). Stuart Hogg (MHR) en grande forme : 2 pénalités (9', 17'), un drop goal (22') et la transformation de l'essai de Lenni Nouchi (23'-24') pour mener 16-3. Velarte répond en inscrivant un essai (30'), transformé par Allan (16-10 à la mi-temps). En 2e période, le match se ferme. Bouthier (MHR) passe une pénalité (64', 19-10), Allan répond (67', 19-13). L'USAP pousse en fin de match mais la touche catalane dysfonctionne complètement, empêchant toute relance. Brookes sort pour HIA dès la 7e (remplacé temporairement par Ceccarelli, retour à la 13e). Bloc massif de 6 remplacements à la 62e (toute la première et deuxième ligne changées). Ruiz revient sur le terrain à la 76e (réglementation première ligne). Aucun carton dans le match. L'USAP prend le bonus défensif mais reste sous pression pour le maintien, 13e avec un seul point d'avance sur Vannes.",
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

    if (p.lastName === "Velarte") { tries = 1; totalPoints = 5; }
    else if (p.lastName === "Allan") { conversions = 1; penalties = 2; totalPoints = 8; }

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
    // 7' - HIA Brookes → Ceccarelli (temp)
    { minute: 7, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Sortie de Kieran Brookes (HIA - protocole commotion)" },
    { minute: 7, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Entrée temporaire de Pietro Ceccarelli (remplacement HIA de Brookes)" },

    { minute: 9, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Stuart Hogg (Montpellier). Montpellier 3 - USAP 0." },

    { minute: 12, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. Montpellier 3 - USAP 3." },

    // 13' - Retour Brookes (HIA OK)
    { minute: 13, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Retour de Kieran Brookes (HIA validé, protocole commotion passé)" },
    { minute: 13, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Sortie de Pietro Ceccarelli (fin du remplacement temporaire HIA)" },

    { minute: 17, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Stuart Hogg (Montpellier). Montpellier 6 - USAP 3." },

    { minute: 22, type: "PENALITE", playerId: null, isUsap: false,
      description: "Drop goal de Stuart Hogg (Montpellier). Montpellier 9 - USAP 3." },

    { minute: 23, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Lenni Nouchi (Montpellier). Montpellier 14 - USAP 3." },
    { minute: 24, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Stuart Hogg (Montpellier). Montpellier 16 - USAP 3." },

    // 30' - Essai Velarte
    { minute: 30, type: "ESSAI", playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Essai de Lucas Velarte. Montpellier 16 - USAP 8." },
    { minute: 31, type: "TRANSFORMATION", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. Montpellier 16 - USAP 10. Score à la mi-temps." },

    // MI-TEMPS 16-10

    // 53' - Hicks → Della Schiava
    { minute: 53, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Hicks"], isUsap: true,
      description: "Sortie de Maxwell Hicks" },
    { minute: 53, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Della Schiava"], isUsap: true,
      description: "Entrée de Noé Della Schiava en remplacement de Hicks" },

    // 62' - Bloc massif de 6 remplacements
    { minute: 62, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Sortie de Kieran Brookes (remplacement permanent)" },
    { minute: 62, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement définitif de Brookes" },
    { minute: 62, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Devaux"], isUsap: true,
      description: "Sortie de Bruce Devaux" },
    { minute: 62, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Beria"], isUsap: true,
      description: "Entrée de Giorgi Beria en remplacement de Devaux" },
    { minute: 62, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Ruiz"], isUsap: true,
      description: "Sortie d'Ignacio Ruiz" },
    { minute: 62, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Entrée de Seilala Lam en remplacement de Ruiz" },
    { minute: 62, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Orie"], isUsap: true,
      description: "Sortie de Marvin Orie" },
    { minute: 62, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Tuilagi"], isUsap: true,
      description: "Entrée de Posolo Tuilagi en remplacement d'Orie" },
    { minute: 62, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Tanguy"], isUsap: true,
      description: "Sortie de Mathieu Tanguy" },
    { minute: 62, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Sobela"], isUsap: true,
      description: "Entrée de Patrick Sobela en remplacement de Tanguy (repositionné en 3e ligne)" },
    { minute: 62, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Buliruarua"], isUsap: true,
      description: "Sortie d'Eneriko Buliruarua" },
    { minute: 62, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Naqalevu"], isUsap: true,
      description: "Entrée d'Apisai Naqalevu en remplacement de Buliruarua" },

    // 64' - Pénalité Bouthier (MHR)
    { minute: 64, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité d'Anthony Bouthier (Montpellier). Montpellier 19 - USAP 10." },

    // 65' - Hall → Aprasidze
    { minute: 65, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Hall"], isUsap: true,
      description: "Sortie de James Hall" },
    { minute: 65, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Aprasidze"], isUsap: true,
      description: "Entrée de Gela Aprasidze en remplacement de Hall" },

    // 67' - Pénalité Allan
    { minute: 67, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. Montpellier 19 - USAP 13. Score final." },

    // 76' - Lam → Ruiz (retour, réglementation première ligne)
    { minute: 76, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Sortie de Seilala Lam" },
    { minute: 76, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Ruiz"], isUsap: true,
      description: "Retour d'Ignacio Ruiz sur le terrain (réglementation première ligne)" },
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
    const team = evt.isUsap ? "USAP" : "MHR ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  // Cas spéciaux :
  // - Brookes : HIA 7'-13' puis sort 62' → 7 + 49 = 56 min
  // - Ceccarelli : HIA temp 7'-13' puis permanent 62'-80' → 6 + 18 = 24 min
  // - Ruiz : sort 62', revient 76' → 62 + 4 = 66 min
  // - Lam : entre 62', sort 76' → 14 min
  const minutesMap: Record<string, number> = {
    Devaux: 62, Ruiz: 66, Brookes: 56, Orie: 62, Tanguy: 62,
    Velarte: 80, Hicks: 53, "Fa'aso'o": 80, Hall: 65, Delpy: 80,
    Joseph: 80, "De La Fuente": 80, Buliruarua: 62, Veredamu: 80, Allan: 80,
    Lam: 14, Beria: 18, Tuilagi: 18, Sobela: 18, "Della Schiava": 27,
    Aprasidze: 15, Naqalevu: 18, Ceccarelli: 24,
  };

  for (const [lastName, minutes] of Object.entries(minutesMap)) {
    const playerId = PLAYER_IDS[lastName];
    if (!playerId) continue;
    const isStarter = USAP_SQUAD.find((p) => p.lastName === lastName)?.isStarter ?? false;
    let subIn: number | null = null;
    let subOut: number | null = null;

    // Cas spéciaux
    if (lastName === "Brookes") { subOut = 62; }
    else if (lastName === "Ruiz") { subOut = 62; }
    else if (lastName === "Ceccarelli") { subIn = 62; }
    else if (lastName === "Lam") { subIn = 62; subOut = 76; }
    else {
      if (!isStarter) {
        const entry = events.find((e) => e.type === "REMPLACEMENT_ENTREE" && e.playerId === playerId);
        subIn = entry?.minute ?? null;
      }
      const exit = events.find((e) => e.type === "REMPLACEMENT_SORTIE" && e.playerId === playerId);
      subOut = exit?.minute ?? null;
    }

    await prisma.matchPlayer.updateMany({
      where: { matchId: MATCH_ID, playerId },
      data: { minutesPlayed: minutes, subIn, subOut },
    });
    console.log(`  ${lastName}: ${minutes}' ${subIn ? `(entrée ${subIn}')` : ""} ${subOut ? `(sortie ${subOut}')` : ""}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score mi-temps : Montpellier 16 - USAP 10");
  console.log("  Score final : Montpellier 19 - USAP 13");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs`);
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

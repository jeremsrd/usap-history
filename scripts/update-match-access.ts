/**
 * Script de mise à jour du match FC Grenoble - USAP (Access Match Top 14, 14/06/2025)
 * Score final : Grenoble 11 - USAP 13
 * Mi-temps : Grenoble 8 - USAP 7
 *
 * Match de barrage d'accession au Top 14 au Stade des Alpes devant ~20 000 spectateurs.
 * L'USAP ouvre le score par Veredamu dès la 2' (0-7), mais Grenoble revient par Lainault (24')
 * et prend l'avantage sur une pénalité de Davies (38', 8-7 MT). Scénario renversant en 2e MT :
 * Allan remet l'USAP devant (65', pen, 8-10), Trouilloud redonne l'avantage à Grenoble
 * (74', pen, 11-10), avant qu'Allan ne scelle le maintien à la 77' (pen, 11-13).
 * Grenoble, champion de Pro D2 avec 98 points, échoue pour la 3e fois consécutive
 * en access match. L'USAP reste en Top 14 pour une 5e saison consécutive.
 *
 * Sources : top14.lnr.fr, allrugby.com, eurosport.fr, itsrugby.co.uk, dicodusport.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-access.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxstm00471umruprhmzrd";

const USAP_SQUAD = [
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Lam", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Tuilagi", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Van Tonder", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Joseph", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Dubois", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Lotrian", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: false },
  { num: 20, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "Delpy", position: "DEMI_OUVERTURE" as const, isStarter: false },
  { num: 22, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  Tuilagi: "cmmby9pso00221ucdwnmxzccc",
  "Van Tonder": "cmmby9qj4002k1ucdmg0rggp5",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Dubois: "cmmby9rwn003h1ucdavvw842q",
  Lotrian: "cmmjos9mf00001u6rl2qfe0jc",
  Devaux: "cmmby9obz00121ucdcgxy6k3w",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Delpy: "cmmby9tcw004h1ucd3hmy7wmy",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

async function main() {
  console.log("=== Mise à jour match Grenoble - USAP (Access Match, 14/06/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Création du venue si nécessaire
  // ---------------------------------------------------------------
  console.log("--- Venue ---");

  let venue = await prisma.venue.findFirst({ where: { name: { contains: "Alpes" } } });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade des Alpes",
        slug: "stade-des-alpes",
        city: "Grenoble",
        capacity: 20068,
        countryId: (await prisma.country.findFirst({ where: { code: "FR" } }))!.id,
      },
    });
    console.log(`  Venue créé : ${venue.name} (${venue.id})`);
  } else {
    console.log(`  Venue existant : ${venue.name} (${venue.id})`);
  }

  // ---------------------------------------------------------------
  // 1. Mise à jour du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-06-14"),
      kickoffTime: "18:00",
      venueId: venue.id,
      refereeId: "cmmetod8a000092cknio7hqts", // Thomas Charabas
      halfTimeUsap: 7,
      halfTimeOpponent: 8,
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      triesOpponent: 1,
      conversionsOpponent: 0,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      bonusOffensif: false,
      bonusDefensif: false,
      attendance: 20000,
      report:
        "Match couperet au Stade des Alpes pour le maintien en Top 14. Sous une chaleur écrasante (35°C), " +
        "l'USAP surprend Grenoble d'entrée : dès la 2e minute, un superbe mouvement collectif libère Veredamu " +
        "qui file à l'essai, transformé par Allan (0-7). Grenoble, champion de Pro D2 avec 98 points, réagit : " +
        "deux essais refusés par la vidéo à Hulleu (15', 19'), puis Lainault aplatit en force après une mêlée " +
        "à 5 mètres (24', 5-7, essai non transformé). Davies redonne l'avantage aux Isérois sur pénalité " +
        "juste avant la pause (38', 8-7). En deuxième mi-temps, les débats restent fermés. Allan remet " +
        "l'USAP devant sur pénalité (65', 8-10). Davies manque une pénalité pour Grenoble (70'). " +
        "Trouilloud redonne l'avantage au FCG sur pénalité (74', 11-10). À 5 minutes de la fin, l'USAP " +
        "est menée et joue sa survie en Top 14. Allan, d'un sang-froid remarquable, passe la pénalité " +
        "de la délivrance à la 77e minute (11-13). Score final : Grenoble 11 - USAP 13. Grenoble échoue " +
        "pour la 3e fois consécutive en access match. L'USAP assure sa 5e saison consécutive dans l'élite, " +
        "portée par ses 3 000 supporters présents au Stade des Alpes.",
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

    if (p.lastName === "Veredamu") { tries = 1; totalPoints = 5; }
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
    // 2' - Essai Veredamu (USAP)
    { minute: 2, type: "ESSAI", playerId: PLAYER_IDS["Veredamu"], isUsap: true,
      description: "Essai de Tavite Veredamu après un superbe mouvement collectif. Grenoble 0 - USAP 5." },
    { minute: 2, type: "TRANSFORMATION", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. Grenoble 0 - USAP 7." },

    // 24' - Essai Lainault (Grenoble, non transformé)
    { minute: 24, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Thomas Lainault (FC Grenoble), en force après une mêlée à 5 mètres. Non transformé. Grenoble 5 - USAP 7." },

    // 38' - Pénalité Davies (Grenoble)
    { minute: 38, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Sam Davies (FC Grenoble). Grenoble passe devant juste avant la pause. Grenoble 8 - USAP 7." },

    // MI-TEMPS : Grenoble 8 - USAP 7

    // 43' - Triple changement USAP : Beria → Devaux, Oviedo → Velarte, Tanguy → Warion
    { minute: 43, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Beria"], isUsap: true,
      description: "Sortie de Giorgi Beria." },
    { minute: 43, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Devaux"], isUsap: true,
      description: "Entrée de Bruce Devaux en remplacement de Beria." },
    { minute: 43, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Oviedo"], isUsap: true,
      description: "Sortie de Joaquín Oviedo." },
    { minute: 43, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Entrée de Lucas Velarte en remplacement d'Oviedo." },
    { minute: 43, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Tanguy"], isUsap: true,
      description: "Sortie de Mathieu Tanguy." },
    { minute: 43, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Warion"], isUsap: true,
      description: "Entrée d'Adrien Warion en remplacement de Tanguy." },

    // 47' - Dubois → Delpy
    { minute: 47, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Dubois"], isUsap: true,
      description: "Sortie de Lucas Dubois." },
    { minute: 47, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Entrée de Valentin Delpy en remplacement de Dubois." },

    // 59' - Brookes → Ceccarelli, Lam → Lotrian
    { minute: 59, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Sortie de Kieran Brookes." },
    { minute: 59, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes." },
    { minute: 59, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Sortie de Seilala Lam." },
    { minute: 59, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Lotrian"], isUsap: true,
      description: "Entrée de Mathys Lotrian en remplacement de Lam." },

    // 60' - Duguivalu → Buliruarua, Hall → Aprasidze
    { minute: 60, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Duguivalu"], isUsap: true,
      description: "Sortie d'Alivereti Duguivalu." },
    { minute: 60, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Buliruarua"], isUsap: true,
      description: "Entrée d'Eneriko Buliruarua en remplacement de Duguivalu." },
    { minute: 60, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Hall"], isUsap: true,
      description: "Sortie de James Hall." },
    { minute: 60, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Aprasidze"], isUsap: true,
      description: "Entrée de Gela Aprasidze en remplacement de Hall." },

    // 65' - Pénalité Allan (USAP)
    { minute: 65, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. L'USAP repasse devant. Grenoble 8 - USAP 10." },

    // 74' - Pénalité Trouilloud (Grenoble)
    { minute: 74, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Trouilloud (FC Grenoble). Grenoble reprend l'avantage. Grenoble 11 - USAP 10." },

    // 77' - Pénalité Allan (USAP) — LA DÉLIVRANCE
    { minute: 77, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan ! La délivrance ! L'USAP se maintient en Top 14. Grenoble 11 - USAP 13." },
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
    const team = evt.isUsap ? "USAP" : "GRE ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesMap: Record<string, number> = {
    Beria: 43, Lam: 59, Brookes: 59, Tanguy: 43, Tuilagi: 80,
    "Van Tonder": 80, "Della Schiava": 80, Oviedo: 43, Hall: 60, Allan: 80,
    Joseph: 80, "De La Fuente": 80, Duguivalu: 60, Veredamu: 80, Dubois: 47,
    Lotrian: 21, Devaux: 37, Warion: 37, Velarte: 37, Aprasidze: 20,
    Delpy: 33, Buliruarua: 20, Ceccarelli: 21,
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
  console.log("  Score mi-temps : Grenoble 8 - USAP 7");
  console.log("  Score final : Grenoble 11 - USAP 13");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs (tous utilisés sauf aucun)`);
  console.log(`  Événements : ${events.length}`);
  console.log("  Essai USAP : Veredamu (2')");
  console.log("  Buteur : Allan (1 transfo, 2 pén = 8 pts)");
  console.log("  Grenoble : Lainault essai (24'), Davies pén (38'), Trouilloud pén (74')");
  console.log("  L'USAP SE MAINTIENT EN TOP 14 !");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

/**
 * Script de mise à jour du match Toulon - USAP (J19 Top 14, 22/03/2025)
 * Score final : Toulon 40 - USAP 19
 * Mi-temps : Toulon 16 - USAP 9
 *
 * Lourde défaite au Stade Mayol sous la pluie battante. L'USAP, très remanié
 * (Montgaillard capitaine, sans De La Fuente, Allan, Crossdale, Veredamu),
 * résiste jusqu'à la mi-temps (16-9) grâce à la botte de Delpy (3 pén.).
 * Toulon accélère en 2e période : Rebbadj (52'), Lucchesi (65'), Jaminet (80+3')
 * pour le bonus offensif. Oviedo marque l'essai de l'honneur (71') en profitant
 * du CJ de White. Retour de Jaminet après 280 jours sans titularisation, auteur
 * de 25 pts. 3e défaite consécutive pour l'USAP, 13e au classement.
 *
 * Sources : top14.lnr.fr, allrugby.com, espn.com, itsrugby.fr, eurosport.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j19.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsi1003h1umryrkss5ga";

const USAP_SQUAD = [
  { num: 1, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: true, isCaptain: true },
  { num: 3, lastName: "Roelofse", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Hicks", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Sobela", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Delpy", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Granell", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true },
  { num: 13, lastName: "Poulet", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Joseph", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Dupichot", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Labouteley", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: false },
  { num: 21, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 22, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Fakatika", position: "PILIER_DROIT" as const, isStarter: false },
];

const PLAYER_IDS: Record<string, string> = {
  Tetrashvili: "cmmby9ogb00151ucdz3vqd429",
  Montgaillard: "cmmby9op3001b1ucd027i2f17",
  Roelofse: "cmmby9pb4001q1ucdi9hhgjrr",
  Hicks: "cmmf3v3b300001ufyqblsuba1",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  Delpy: "cmmby9tcw004h1ucd3hmy7wmy",
  Granell: "cmmf2aopb00001u843lhf8foj",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Poulet: "cmmby9shz003w1ucdzl5zpnhv",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  Dupichot: "cmmby9t3k004b1ucdtmx0zek2",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Devaux: "cmmby9obz00121ucdcgxy6k3w",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Labouteley: "cmmby9pfj001t1ucd75p7hi07",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Fakatika: "cmmby9p6p001n1ucdxt02xbuc",
};

async function main() {
  console.log("=== Mise à jour match Toulon - USAP (J19, 22/03/2025) ===\n");

  // ---------------------------------------------------------------
  // 1. Mise à jour du match
  // ---------------------------------------------------------------
  console.log("--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-03-22"),
      kickoffTime: "21:05",
      venueId: "cmm9df4y200011ucsq9gg00tx", // Stade Mayol
      refereeId: "cmmc4gfxu00021u4gib57di7f", // Vivien Praderie
      halfTimeUsap: 9,
      halfTimeOpponent: 16,
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 4,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      triesOpponent: 4,
      conversionsOpponent: 4,
      penaltiesOpponent: 4,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      bonusOffensif: false,
      bonusDefensif: false,
      report:
        "Lourde défaite au Stade Mayol sous une pluie battante, pelouse à la limite de l'impraticable. L'USAP se présente très remanié, sans De La Fuente, Allan, Crossdale ni Veredamu. Montgaillard capitaine. Match précédé d'une minute d'applaudissements en hommage à Nicolas Haddad. En 1ère mi-temps, duel de buteurs entre Jaminet (2 pén., 6-0 à la 17') et Delpy (2 pén., 6-6 à la 28'). L'USAP manque le premier essai par Granell, sauvé par un retour magistral de Fainga'anuku. Facundo Isa ouvre le score en essai après une touche bien exploitée (31', 13-6). Delpy réduit à 13-9 (37') mais Tetrashvili prend un carton jaune pour accumulation de fautes en mêlée, et Jaminet passe la pénalité (40', 16-9). En 2e mi-temps, Toulon accélère : pénalité Jaminet (44', 19-9), puis Delpy répond (50', 19-12). Rayan Rebbadj marque son premier essai sous les couleurs du RCT (52', 26-12), puis Lucchesi en force sur ballon porté (65', 33-12). Oviedo profite du carton jaune de White pour inscrire l'essai de l'honneur, transformé par Ecochard (71', 33-19). Dans les arrêts de jeu, Jaminet s'offre le 4e essai du bonus offensif (80+3', 40-19). 3e défaite consécutive, l'USAP reste 13e avec 30 points.",
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

    if (p.lastName === "Delpy") { penalties = 4; totalPoints = 12; }
    else if (p.lastName === "Oviedo") { tries = 1; totalPoints = 5; }
    else if (p.lastName === "Ecochard") { conversions = 1; totalPoints = 2; }

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
        yellowCard: p.lastName === "Tetrashvili",
        yellowCardMin: p.lastName === "Tetrashvili" ? 40 : null,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    const cj = p.lastName === "Tetrashvili" ? " [CJ 40']" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${cj}`);
  }

  // ---------------------------------------------------------------
  // 3. Événements du match
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  await prisma.matchEvent.deleteMany({ where: { matchId: MATCH_ID } });

  const events = [
    // 1ère mi-temps
    { minute: 11, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Melvyn Jaminet (Toulon). Toulon 3 - USAP 0." },
    { minute: 17, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Melvyn Jaminet (Toulon). Toulon 6 - USAP 0." },
    { minute: 19, type: "PENALITE", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Pénalité de Valentin Delpy (35 m). Toulon 6 - USAP 3." },
    { minute: 28, type: "PENALITE", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Pénalité de Valentin Delpy. Toulon 6 - USAP 6." },

    // 30' - Roelofse → Fakatika (blessure probable)
    { minute: 30, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Roelofse"], isUsap: true,
      description: "Sortie de Nemo Roelofse (blessure probable)" },
    { minute: 30, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Fakatika"], isUsap: true,
      description: "Entrée d'Akato Fakatika en remplacement de Roelofse" },

    { minute: 31, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Facundo Isa (Toulon) après une touche bien exploitée, parti sur le côté fermé. Toulon 11 - USAP 6." },
    { minute: 32, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Melvyn Jaminet (Toulon). Toulon 13 - USAP 6." },

    { minute: 37, type: "PENALITE", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Pénalité de Valentin Delpy. Toulon 13 - USAP 9." },

    // 40' - CJ Tetrashvili
    { minute: 40, type: "CARTON_JAUNE", playerId: PLAYER_IDS["Tetrashvili"], isUsap: true,
      description: "Carton jaune pour Giorgi Tetrashvili (accumulation de fautes en mêlée)." },

    { minute: 40, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Melvyn Jaminet (Toulon). Toulon 16 - USAP 9. Score à la mi-temps." },

    // MI-TEMPS 16-9

    // 40' - Montgaillard → Ruiz, Tanguy → Warion, Velarte → Oviedo
    { minute: 40, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Montgaillard"], isUsap: true,
      description: "Sortie de Victor Montgaillard (capitaine)" },
    { minute: 40, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Ruiz"], isUsap: true,
      description: "Entrée d'Ignacio Ruiz en remplacement de Montgaillard" },
    { minute: 40, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Tanguy"], isUsap: true,
      description: "Sortie de Mathieu Tanguy" },
    { minute: 40, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Warion"], isUsap: true,
      description: "Entrée d'Adrien Warion en remplacement de Tanguy" },
    { minute: 40, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Sortie de Lucas Velarte" },
    { minute: 40, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Oviedo"], isUsap: true,
      description: "Entrée de Joaquin Oviedo en remplacement de Velarte" },

    // 44' - Pénalité Jaminet
    { minute: 44, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Melvyn Jaminet (Toulon). Toulon 19 - USAP 9." },

    // 50' - Tetrashvili → Devaux + Pénalité Delpy
    { minute: 50, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Tetrashvili"], isUsap: true,
      description: "Sortie de Giorgi Tetrashvili (après purge du carton jaune)" },
    { minute: 50, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Devaux"], isUsap: true,
      description: "Entrée de Bruce Devaux en remplacement de Tetrashvili" },

    { minute: 50, type: "PENALITE", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Pénalité de Valentin Delpy. Toulon 19 - USAP 12." },

    // 52' - Essai Rebbadj
    { minute: 52, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Rayan Rebbadj (Toulon), premier essai sous les couleurs du RCT, servi par Dréan après une belle action collective. Toulon 24 - USAP 12." },
    { minute: 53, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Melvyn Jaminet (Toulon). Toulon 26 - USAP 12." },

    // 55' - Delpy → Ecochard
    { minute: 55, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Sortie de Valentin Delpy" },
    { minute: 55, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Ecochard"], isUsap: true,
      description: "Entrée de Tom Ecochard en remplacement de Delpy" },

    // 60' - Sobela → Duguivalu, Della Schiava → Labouteley
    { minute: 60, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Sobela"], isUsap: true,
      description: "Sortie de Patrick Sobela" },
    { minute: 60, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Duguivalu"], isUsap: true,
      description: "Entrée d'Alivereti Duguivalu en remplacement de Sobela" },
    { minute: 60, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Della Schiava"], isUsap: true,
      description: "Sortie de Noé Della Schiava" },
    { minute: 60, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Labouteley"], isUsap: true,
      description: "Entrée de Tristan Labouteley en remplacement de Della Schiava" },

    // 65' - Essai Lucchesi
    { minute: 65, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Gianmarco Lucchesi (Toulon) en force sur ballon porté, de retour après le Tournoi des Six Nations. Toulon 31 - USAP 12." },
    { minute: 65, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Melvyn Jaminet (Toulon). Toulon 33 - USAP 12." },

    // 70' - CJ White (Toulon)
    { minute: 70, type: "CARTON_JAUNE", playerId: null, isUsap: false,
      description: "Carton jaune pour Ben White (Toulon, hors-jeu)." },

    // 71' - Essai Oviedo + Transfo Ecochard
    { minute: 71, type: "ESSAI", playerId: PLAYER_IDS["Oviedo"], isUsap: true,
      description: "Essai de Joaquin Oviedo en force, profitant de la supériorité numérique après le carton jaune de White. Toulon 33 - USAP 17." },
    { minute: 71, type: "TRANSFORMATION", playerId: PLAYER_IDS["Ecochard"], isUsap: true,
      description: "Transformation de Tom Ecochard. Toulon 33 - USAP 19." },

    // 80+3' - Essai Jaminet
    { minute: 83, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Melvyn Jaminet (Toulon) dans les arrêts de jeu, après une longue séquence devant la ligne catalane. 4e essai toulonnais, bonus offensif acquis. Toulon 38 - USAP 19." },
    { minute: 83, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Melvyn Jaminet (Toulon) en coin. Score final : Toulon 40 - USAP 19." },
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
    const team = evt.isUsap ? "USAP" : "TLN ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesMap: Record<string, number> = {
    Tetrashvili: 50, Montgaillard: 40, Roelofse: 30, Hicks: 80, Tanguy: 40,
    Sobela: 60, "Della Schiava": 60, Velarte: 40, Hall: 80, Delpy: 55,
    Granell: 80, Buliruarua: 80, Poulet: 80, Joseph: 80, Dupichot: 80,
    Ruiz: 40, Devaux: 30, Warion: 40, Labouteley: 20, Oviedo: 40,
    Ecochard: 25, Duguivalu: 20, Fakatika: 50,
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
  console.log("  Score mi-temps : Toulon 16 - USAP 9");
  console.log("  Score final : Toulon 40 - USAP 19");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs`);
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

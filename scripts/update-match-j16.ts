/**
 * Script de mise à jour du match USAP - Castres Olympique (J16 Top 14, 15/02/2025)
 * Score final : USAP 20 - Castres 20 (match nul)
 * Mi-temps : USAP 14 - Castres 10
 *
 * Match nul frustrant à domicile. L'USAP mène 9-0 grâce à 3 pénalités d'Allan
 * puis Veredamu inscrit un essai (non transformé, 14-3). Raisuqe réduit l'écart
 * juste avant la pause (14-10). En 2e mi-temps, Allan passe 2 nouvelles pénalités
 * mais Ardron (essai transformé) et Le Brun (pénalité) égalisent. En-avant catalan
 * après la sirène sur une action qui aurait pu offrir la victoire.
 *
 * Sources : top14.lnr.fr, allrugby.com, espn.com, francebleu.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j16.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsfe003b1umruu9jcnh0"; // Match J16 USAP-Castres 2024-2025

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Joseph", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Crossdale", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Roelofse", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Labouteley", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: false },
  { num: 20, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: false },
  { num: 22, lastName: "Dupichot", position: "ARRIERE" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

// === IDs des joueurs (depuis la BDD) ===
const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Hicks: "cmmf3v3b300001ufyqblsuba1",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Crossdale: "cmmby9rsc003e1ucdli6st6ho",
  Montgaillard: "cmmby9op3001b1ucd027i2f17",
  Roelofse: "cmmby9pb4001q1ucdi9hhgjrr",
  Labouteley: "cmmby9pfj001t1ucd75p7hi07",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Dupichot: "cmmby9t3k004b1ucdtmx0zek2",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

async function main() {
  console.log("=== Mise à jour match USAP - Castres (J16, 15/02/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Création arbitre Benoît Rousselet
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Rousselet", mode: "insensitive" } },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Benoît",
        lastName: "Rousselet",
        slug: `temp-${Date.now()}`,
      },
    });
    await prisma.referee.update({
      where: { id: referee.id },
      data: { slug: `benoit-rousselet-${referee.id}` },
    });
    console.log(`  Créé : Benoît Rousselet (${referee.id})`);
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
      date: new Date("2025-02-15"),
      kickoffTime: "16:30",
      venueId: venue?.id,
      refereeId: referee.id,
      attendance: 14232,
      halfTimeUsap: 14,
      halfTimeOpponent: 10,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 0,
      penaltiesUsap: 5,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Castres
      triesOpponent: 2,
      conversionsOpponent: 2,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Match nul frustrant à domicile devant 14 232 spectateurs. L'USAP domine la première mi-temps grâce à sa supériorité en mêlée. Allan ouvre le score de 3 pénalités consécutives (14', 19', 24') pour mener 9-0, profitant notamment du carton jaune de Chilachava (18'). Le Brun réduit d'une pénalité (30', 9-3). Sur une penaltouche bien exploitée, Veredamu conclut dans le coin après un bon travail de Crossdale (35', 14-3), mais Allan manque la transformation. Juste avant la pause, Castres exécute parfaitement une combinaison en touche et Raisuqe finit dans l'en-but, Le Brun transforme (14-10). En seconde mi-temps, Allan passe une 4e pénalité (53', 17-10) mais Ardron répond immédiatement par un essai transformé par Le Brun (55', 17-17). Allan remet l'USAP devant d'une 5e pénalité (58', 20-17). Le Brun égalise d'une pénalité dans le dernier quart d'heure (76', 20-20). Après la sirène, les Catalans ont la balle de match : la percée d'Allan puis de Veredamu aurait pu offrir la victoire, mais un ultime en-avant scelle le sort du match. Statistiques : possession USAP 56%-44%, mêlées gagnées 7-4.",
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
    if (p.lastName === "Allan") {
      penalties = 5;
      totalPoints = 15; // 5×3 = 15
    } else if (p.lastName === "Veredamu") {
      tries = 1;
      totalPoints = 5;
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
    console.log(
      `  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}`
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
    // 14' - Pénalité Allan → USAP 3 - Castres 0
    {
      minute: 14,
      type: "PENALITE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité de Tommaso Allan. USAP 3 - Castres 0.",
    },

    // 18' - Carton jaune Chilachava (Castres)
    {
      minute: 18,
      type: "CARTON_JAUNE",
      playerId: null,
      isUsap: false,
      description: "Carton jaune pour Levan Chilachava (Castres). 3e carton jaune de la saison.",
    },

    // 19' - Pénalité Allan → USAP 6 - Castres 0
    {
      minute: 19,
      type: "PENALITE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité de Tommaso Allan (Castres à 14). USAP 6 - Castres 0.",
    },

    // 24' - Pénalité Allan → USAP 9 - Castres 0
    {
      minute: 24,
      type: "PENALITE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité de Tommaso Allan. USAP 9 - Castres 0.",
    },

    // 30' - Pénalité Le Brun (Castres) → USAP 9 - Castres 3
    {
      minute: 30,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité de Louis Le Brun (Castres). USAP 9 - Castres 3.",
    },

    // 35' - Essai Veredamu → USAP 14 - Castres 3
    {
      minute: 35,
      type: "ESSAI",
      playerId: PLAYER_IDS["Veredamu"],
      isUsap: true,
      description: "Essai de Tavite Veredamu dans le coin après une penaltouche bien exploitée et un bon travail de Crossdale. Non transformé. USAP 14 - Castres 3.",
    },

    // 40' - Essai Raisuqe (Castres) → USAP 14 - Castres 8
    {
      minute: 40,
      type: "ESSAI",
      playerId: null,
      isUsap: false,
      description: "Essai de Josaia Raisuqe (Castres) sur combinaison en touche. USAP 14 - Castres 8.",
    },

    // 40' - Transformation Le Brun (Castres) → USAP 14 - Castres 10
    {
      minute: 40,
      type: "TRANSFORMATION",
      playerId: null,
      isUsap: false,
      description: "Transformation de Louis Le Brun (Castres). USAP 14 - Castres 10.",
    },

    // === MI-TEMPS : USAP 14 - Castres 10 ===

    // 53' - Pénalité Allan → USAP 17 - Castres 10
    {
      minute: 53,
      type: "PENALITE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité de Tommaso Allan (mêlée sanctionnée). USAP 17 - Castres 10.",
    },

    // 55' - Essai Ardron (Castres) → USAP 17 - Castres 15
    {
      minute: 55,
      type: "ESSAI",
      playerId: null,
      isUsap: false,
      description: "Essai de Tyler Ardron (Castres). USAP 17 - Castres 15.",
    },

    // 55' - Transformation Le Brun (Castres) → USAP 17 - Castres 17
    {
      minute: 55,
      type: "TRANSFORMATION",
      playerId: null,
      isUsap: false,
      description: "Transformation de Louis Le Brun (Castres). USAP 17 - Castres 17.",
    },

    // 56' - Remplacement Beria → Roelofse
    {
      minute: 56,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Beria"],
      isUsap: true,
      description: "Sortie de Giorgi Beria",
    },
    {
      minute: 56,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Roelofse"],
      isUsap: true,
      description: "Entrée de Nemo Roelofse en remplacement de Beria",
    },

    // 56' - Remplacement Brookes → Ceccarelli
    {
      minute: 56,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Brookes"],
      isUsap: true,
      description: "Sortie de Kieran Brookes",
    },
    {
      minute: 56,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Ceccarelli"],
      isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes",
    },

    // 58' - Pénalité Allan → USAP 20 - Castres 17
    {
      minute: 58,
      type: "PENALITE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité de Tommaso Allan. USAP 20 - Castres 17.",
    },

    // 62' - Remplacement Oviedo → Fa'aso'o
    {
      minute: 62,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Oviedo"],
      isUsap: true,
      description: "Sortie de Joaquin Oviedo",
    },
    {
      minute: 62,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Fa'aso'o"],
      isUsap: true,
      description: "Entrée de So'otala Fa'aso'o en remplacement d'Oviedo",
    },

    // 64' - Remplacement Warion → Labouteley
    {
      minute: 64,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Warion"],
      isUsap: true,
      description: "Sortie d'Adrien Warion",
    },
    {
      minute: 64,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Labouteley"],
      isUsap: true,
      description: "Entrée de Tristan Labouteley en remplacement de Warion",
    },

    // 65' - Remplacement Ecochard → Hall
    {
      minute: 65,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Ecochard"],
      isUsap: true,
      description: "Sortie de Tom Ecochard",
    },
    {
      minute: 65,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Hall"],
      isUsap: true,
      description: "Entrée de James Hall en remplacement d'Ecochard",
    },

    // 68' - Remplacement Joseph → Buliruarua
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
      playerId: PLAYER_IDS["Buliruarua"],
      isUsap: true,
      description: "Entrée d'Eneriko Buliruarua en remplacement de Joseph",
    },

    // 72' - Remplacement Crossdale → Dupichot
    {
      minute: 72,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Crossdale"],
      isUsap: true,
      description: "Sortie d'Alistair Crossdale",
    },
    {
      minute: 72,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Dupichot"],
      isUsap: true,
      description: "Entrée de Louis Dupichot en remplacement de Crossdale",
    },

    // 76' - Pénalité Le Brun (Castres) → USAP 20 - Castres 20
    {
      minute: 76,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité de Louis Le Brun (Castres). USAP 20 - Castres 20. Égalisation.",
    },

    // 79' - Remplacement Ruiz → Montgaillard
    {
      minute: 79,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Ruiz"],
      isUsap: true,
      description: "Sortie d'Ignacio Ruiz",
    },
    {
      minute: 79,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Montgaillard"],
      isUsap: true,
      description: "Entrée de Victor Montgaillard en remplacement de Ruiz",
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
    const team = evt.isUsap ? "USAP" : "CAST";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesMap: Record<string, number> = {
    // Titulaires
    Beria: 56,
    Ruiz: 79,
    Brookes: 56,
    Warion: 64,
    Tanguy: 80,
    Velarte: 80,
    Hicks: 80,
    Oviedo: 62,
    Ecochard: 65,
    Allan: 80,
    Joseph: 68,
    "De La Fuente": 80,
    Duguivalu: 80,
    Veredamu: 80,
    Crossdale: 72,
    // Remplaçants
    Montgaillard: 1,    // entre à 79'
    Roelofse: 24,       // entre à 56'
    Labouteley: 16,     // entre à 64'
    "Fa'aso'o": 18,     // entre à 62'
    Hall: 15,           // entre à 65'
    Buliruarua: 12,     // entre à 68'
    Dupichot: 8,        // entre à 72'
    Ceccarelli: 24,     // entre à 56'
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
  console.log("  Stade : Aimé-Giral (Perpignan) — domicile");
  console.log(`  Arbitre : Benoît Rousselet (${referee.id})`);
  console.log("  Affluence : 14 232 spectateurs");
  console.log("  Score mi-temps : USAP 14 - Castres 10");
  console.log("  Score final : USAP 20 - Castres 20 (match nul)");
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

/**
 * Script de mise à jour du match Lyon OU - USAP (J14 Top 14, 04/01/2025)
 * Score final : Lyon 17 - USAP 12
 * Mi-temps : Lyon 17 - USAP 3
 *
 * Défaite à Lyon sous une pluie battante. L'USAP est dominé en 1ère mi-temps
 * (17-3) mais revient en 2e période grâce à 3 pénalités d'Allan et une
 * indiscipline lyonnaise (3 cartons jaunes). Bonus défensif décroché.
 * Lyon met fin à une série de 7 matchs sans victoire.
 *
 * Sources : top14.lnr.fr, espn.com, allrugby.com, itsrugby.fr, francebleu.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j14.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsdn00371umrbhfx333a"; // Match J14 Lyon-USAP 2024-2025

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Lam", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Labouteley", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Oviedo", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Duguivalu", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Dupichot", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Bachelier", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 19, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "McIntyre", position: "DEMI_OUVERTURE" as const, isStarter: false },
  { num: 22, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: false },
];

// === IDs des joueurs (depuis la BDD) ===
const PLAYER_IDS: Record<string, string> = {
  Devaux: "cmmby9obz00121ucdcgxy6k3w",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
  Labouteley: "cmmby9pfj001t1ucd75p7hi07",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Hicks: "cmmf3v3b300001ufyqblsuba1",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Dupichot: "cmmby9t3k004b1ucdtmx0zek2",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Bachelier: "cmmby9q1g00281ucdpzfoultm",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  McIntyre: "cmmby9ro0003b1ucd388eacr8",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
};

async function main() {
  console.log("=== Mise à jour match Lyon OU - USAP (J14, 04/01/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Création venue Matmut Stadium de Gerland + arbitre Trainini
  // ---------------------------------------------------------------
  console.log("--- Venue ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Gerland", mode: "insensitive" } },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Matmut Stadium de Gerland",
        city: "Lyon",
        slug: `temp-${Date.now()}`,
      },
    });
    await prisma.venue.update({
      where: { id: venue.id },
      data: { slug: `matmut-stadium-gerland-${venue.id}` },
    });
    console.log(`  Créé : Matmut Stadium de Gerland (${venue.id})`);
  } else {
    console.log(`  Existe : ${venue.name} (${venue.id})`);
  }

  console.log("\n--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Trainini", mode: "insensitive" } },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Tual",
        lastName: "Trainini",
        slug: `temp-${Date.now()}`,
      },
    });
    await prisma.referee.update({
      where: { id: referee.id },
      data: { slug: `tual-trainini-${referee.id}` },
    });
    console.log(`  Créé : Tual Trainini (${referee.id})`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 1. Mise à jour du match (infos générales)
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-01-04"),
      kickoffTime: "16:30",
      venueId: venue.id,
      refereeId: referee.id,
      halfTimeUsap: 3,
      halfTimeOpponent: 17,
      // Détail scoring USAP
      triesUsap: 0,
      conversionsUsap: 0,
      penaltiesUsap: 4,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Lyon
      triesOpponent: 2,
      conversionsOpponent: 2,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: true,
      // Rapport
      report:
        "Défaite à Lyon sous une pluie battante. L'USAP est dominé en première mi-temps avec 2 essais lyonnais (Shvangiradze 22', Marchand 39') et une pénalité de Berdeu. Seule une pénalité d'Allan (5') au tableau d'affichage pour les Catalans : 17-3 à la pause. En 2e mi-temps, la donne change radicalement. L'USAP fait rentrer toute sa première ligne (Beria, Ruiz, Brookes) et domine la mêlée. Lyon cumule 3 cartons jaunes (Ainsley 42', Ioane 48', Méliande 67') et ne marque plus un point. Allan enchaîne 3 pénalités (45', 56', 68') pour revenir à 17-12, mais l'USAP ne parvient pas à concrétiser malgré la domination. Bonus défensif décroché (défaite de 5 points). Lyon met fin à 7 matchs sans victoire.",
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
      penalties = 4;
      totalPoints = 12; // 4×3 = 12
    } else if (p.lastName === "Naqalevu") {
      yellowCard = true;
      yellowCardMin = 38;
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
    // 5' - Pénalité Allan → Lyon 0 - USAP 3
    {
      minute: 5,
      type: "PENALITE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité de Tommaso Allan. Lyon 0 - USAP 3.",
    },

    // 22' - Essai Shvangiradze (Lyon) → Lyon 5 - USAP 3
    {
      minute: 22,
      type: "ESSAI",
      playerId: null,
      isUsap: false,
      description: "Essai de Beka Shvangiradze (Lyon). Lyon 5 - USAP 3.",
    },

    // 23' - Transformation Berdeu (Lyon) → Lyon 7 - USAP 3
    {
      minute: 23,
      type: "TRANSFORMATION",
      playerId: null,
      isUsap: false,
      description: "Transformation de Léo Berdeu (Lyon). Lyon 7 - USAP 3.",
    },

    // 27' - Pénalité Berdeu (Lyon) → Lyon 10 - USAP 3
    {
      minute: 27,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité de Léo Berdeu (Lyon). Lyon 10 - USAP 3.",
    },

    // 38' - Carton jaune Naqalevu
    {
      minute: 38,
      type: "CARTON_JAUNE",
      playerId: PLAYER_IDS["Naqalevu"],
      isUsap: true,
      description: "Carton jaune pour Apisai Naqalevu (fautes répétées).",
    },

    // 39' - Essai Marchand (Lyon) → Lyon 15 - USAP 3
    {
      minute: 39,
      type: "ESSAI",
      playerId: null,
      isUsap: false,
      description: "Essai de Guillaume Marchand (Lyon). Lyon 15 - USAP 3.",
    },

    // 40' - Transformation Berdeu (Lyon) → Lyon 17 - USAP 3
    {
      minute: 40,
      type: "TRANSFORMATION",
      playerId: null,
      isUsap: false,
      description: "Transformation de Léo Berdeu (Lyon). Lyon 17 - USAP 3.",
    },

    // === MI-TEMPS : Lyon 17 - USAP 3 ===

    // 41' - Remplacement Devaux → Beria
    {
      minute: 41,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Devaux"],
      isUsap: true,
      description: "Sortie de Bruce Devaux",
    },
    {
      minute: 41,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Beria"],
      isUsap: true,
      description: "Entrée de Giorgi Beria en remplacement de Devaux",
    },

    // 41' - Remplacement Lam → Ruiz
    {
      minute: 41,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Lam"],
      isUsap: true,
      description: "Sortie de Seilala Lam",
    },
    {
      minute: 41,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Ruiz"],
      isUsap: true,
      description: "Entrée d'Ignacio Ruiz en remplacement de Lam",
    },

    // 41' - Remplacement Ceccarelli → Brookes
    {
      minute: 41,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Ceccarelli"],
      isUsap: true,
      description: "Sortie de Pietro Ceccarelli",
    },
    {
      minute: 41,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Brookes"],
      isUsap: true,
      description: "Entrée de Kieran Brookes en remplacement de Ceccarelli",
    },

    // 41' - Remplacement Buliruarua → Naqalevu
    {
      minute: 41,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Buliruarua"],
      isUsap: true,
      description: "Sortie d'Eneriko Buliruarua",
    },
    {
      minute: 41,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Naqalevu"],
      isUsap: true,
      description: "Entrée d'Apisai Naqalevu en remplacement de Buliruarua",
    },

    // 45' - Pénalité Allan → Lyon 17 - USAP 6
    {
      minute: 45,
      type: "PENALITE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité de Tommaso Allan. Lyon 17 - USAP 6.",
    },

    // 49' - Remplacement Hall → Ecochard
    {
      minute: 49,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Hall"],
      isUsap: true,
      description: "Sortie de James Hall",
    },
    {
      minute: 49,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Ecochard"],
      isUsap: true,
      description: "Entrée de Tom Ecochard en remplacement de Hall",
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

    // 53' - Remplacement Hicks → Bachelier
    {
      minute: 53,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Hicks"],
      isUsap: true,
      description: "Sortie de Maxwell Hicks",
    },
    {
      minute: 53,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Bachelier"],
      isUsap: true,
      description: "Entrée de Lucas Bachelier en remplacement de Hicks",
    },

    // 56' - Pénalité Allan → Lyon 17 - USAP 9
    {
      minute: 56,
      type: "PENALITE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité de Tommaso Allan. Lyon 17 - USAP 9.",
    },

    // 63' - Remplacement Dupichot → McIntyre
    {
      minute: 63,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Dupichot"],
      isUsap: true,
      description: "Sortie de Louis Dupichot",
    },
    {
      minute: 63,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["McIntyre"],
      isUsap: true,
      description: "Entrée de Jake McIntyre en remplacement de Dupichot",
    },

    // 68' - Pénalité Allan → Lyon 17 - USAP 12
    {
      minute: 68,
      type: "PENALITE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité de Tommaso Allan. Lyon 17 - USAP 12. Score final.",
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
    const team = evt.isUsap ? "USAP" : "LYON";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesMap: Record<string, number> = {
    Devaux: 41,         // sort à 41' (mi-temps)
    Lam: 41,            // sort à 41'
    Ceccarelli: 41,     // sort à 41'
    Labouteley: 80,
    Warion: 80,
    Oviedo: 80,
    Hicks: 53,          // sort à 53'
    "Fa'aso'o": 49,     // sort à 49'
    Hall: 49,           // sort à 49'
    Allan: 80,
    Duguivalu: 80,
    "De La Fuente": 80,
    Buliruarua: 41,     // sort à 41'
    Veredamu: 80,
    Dupichot: 63,       // sort à 63'
    Ruiz: 39,           // entre à 41'
    Beria: 39,          // entre à 41'
    Bachelier: 27,      // entre à 53'
    Velarte: 31,        // entre à 49'
    Ecochard: 31,       // entre à 49'
    McIntyre: 17,       // entre à 63'
    Naqalevu: 39,       // entre à 41'
    Brookes: 39,        // entre à 41'
  };

  for (const [lastName, minutes] of Object.entries(minutesMap)) {
    const playerId = PLAYER_IDS[lastName];
    if (!playerId) continue;
    await prisma.matchPlayer.updateMany({
      where: { matchId: MATCH_ID, playerId },
      data: {
        minutesPlayed: minutes,
        subIn: USAP_SQUAD.find((p) => p.lastName === lastName)?.isStarter
          ? null
          : (() => {
              const entry = events.find(
                (e) => e.type === "REMPLACEMENT_ENTREE" && e.playerId === playerId
              );
              return entry?.minute ?? null;
            })(),
        subOut: (() => {
          const exit = events.find(
            (e) => e.type === "REMPLACEMENT_SORTIE" && e.playerId === playerId
          );
          return exit?.minute ?? null;
        })(),
      },
    });
    console.log(`  ${lastName}: ${minutes}'`);
  }

  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Matmut Stadium de Gerland (Lyon) — extérieur");
  console.log(`  Arbitre : Tual Trainini (${referee.id})`);
  console.log("  Score mi-temps : Lyon 17 - USAP 3");
  console.log("  Score final : Lyon 17 - USAP 12");
  console.log("  Bonus défensif : OUI (défaite de 5 points)");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs USAP (15 titulaires + 8 remplaçants)`);
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

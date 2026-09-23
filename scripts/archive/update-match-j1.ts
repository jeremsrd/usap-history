/**
 * Script de mise à jour du match Bayonne - USAP (J1 Top 14, 07/09/2024)
 * Ajoute : stade, arbitre, score mi-temps, détail scoring,
 *          composition USAP (23 joueurs), événements du match
 *
 * Sources : top14.lnr.fr, eurosport.fr, francebleu.fr, allrugby.com
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs14002h1umrcekoub4a"; // Match J1 Bayonne-USAP 2024-2025

// === COMPOSITION USAP ===
// Titulaires (1-15) et remplaçants (16-23)
// Source : top14.lnr.fr/feuille-de-match/2024-2025/j1/10871-bayonne-perpignan/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Lam", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Orie", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Sobela", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Van Tonder", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "McIntyre", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Crossdale", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Allan", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Tuilagi", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Bachelier", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: false },
  { num: 21, lastName: "Joseph", position: "AILIER" as const, isStarter: false },
  { num: 22, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: false },
];

// IDs des joueurs USAP (récupérés de la base)
const PLAYER_IDS: Record<string, string> = {
  Devaux: "cmmby9obz00121ucdcgxy6k3w",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
  Orie: "cmmby9pk0001w1ucdhzjt30qx",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
  "Van Tonder": "cmmby9qj4002k1ucdmg0rggp5",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  McIntyre: "cmmby9ro0003b1ucd388eacr8",
  Crossdale: "cmmby9rsc003e1ucdli6st6ho",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Montgaillard: "cmmby9op3001b1ucd027i2f17",
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Tuilagi: "cmmby9pso00221ucdwnmxzccc",
  Bachelier: "cmmby9q1g00281ucdpzfoultm",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
};

async function main() {
  console.log("=== Mise à jour match Bayonne - USAP (J1, 07/09/2024) ===\n");

  // ---------------------------------------------------------------
  // 1. Créer le Stade Jean-Dauger (si absent)
  // ---------------------------------------------------------------
  console.log("--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Jean-Dauger" } },
  });
  if (!venue) {
    // Récupérer le pays France
    const france = await prisma.country.findFirst({ where: { code: "FR" } });
    venue = await prisma.venue.create({
      data: {
        name: "Stade Jean-Dauger",
        city: "Bayonne",
        countryId: france?.id,
        capacity: 18032,
        yearOpened: 1938,
        isHomeGround: false,
        notes: "Stade de l'Aviron Bayonnais.",
      },
    });
    console.log(`  Créé : ${venue.name} (${venue.id})`);
  } else {
    console.log(`  Existe : ${venue.name} (${venue.id})`);
  }

  // ---------------------------------------------------------------
  // 2. Créer l'arbitre Luc Ramos (si absent)
  // ---------------------------------------------------------------
  console.log("\n--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: "Ramos" },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Luc",
        lastName: "Ramos",
        slug: "luc-ramos",
      },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score evolution (Bayonne - Perpignan) :
   * 0-0 → 0-5 → 0-7 → 5-7 → 7-7 → 7-10 → 7-13 → 7-16
   *   → 12-16 → 12-19 → 15-19 → 18-19 → 21-19
   *
   * Mi-temps estimée : Bayonne 7 - Perpignan 16
   *
   * Perpignan (USAP) : 1E 1T 4P = 7 + 12 = 19
   * Bayonne : 2E 1T 3P = 12 + 9 = 21
   */
  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      kickoffTime: "14:30",
      venueId: venue.id,
      refereeId: referee.id,
      // Mi-temps (convention : score USAP en premier)
      halfTimeUsap: 16,
      halfTimeOpponent: 7,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 4,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Bayonne (adversaire)
      triesOpponent: 2,
      conversionsOpponent: 1,
      penaltiesOpponent: 3,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Infos complémentaires
      report:
        "Première journée de la saison 2024-2025. L'USAP mène pendant 77 minutes " +
        "grâce à un essai de Crossdale (7') et 4 pénalités d'Allan, mais Bayonne " +
        "renverse le match dans les dernières minutes avec une pénalité de Segonds (77'). " +
        "Défaite 21-19 avec bonus défensif. Carton jaune pour Crossdale (en-avant volontaire, 11'). " +
        "Duel Tuilagi : Posolo (remplaçant USAP) face à son oncle Manu (centre Bayonne).",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, stade, rapport)");

  // ---------------------------------------------------------------
  // 4. Composition USAP (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  // Nettoyage des éventuels MatchPlayer existants
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID },
  });
  console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = PLAYER_IDS[p.lastName];
    if (!playerId) {
      console.log(`  ⚠ Joueur non trouvé : ${p.lastName}`);
      continue;
    }

    // Stats individuelles pour le match
    let tries = 0,
      conversions = 0,
      penalties = 0,
      totalPoints = 0;
    let yellowCard = false,
      yellowCardMin: number | null = null;

    // Crossdale : 1 essai (7'), carton jaune (11')
    if (p.lastName === "Crossdale") {
      tries = 1;
      totalPoints = 5;
      yellowCard = true;
      yellowCardMin = 11;
    }

    // Allan : 1 transformation (9') + 4 pénalités (19', 24', 27', 43')
    if (p.lastName === "Allan") {
      conversions = 1;
      penalties = 4;
      totalPoints = 2 + 12; // 14 points au pied
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: MATCH_ID,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.lastName === "De La Fuente",
        positionPlayed: p.position,
        tries,
        conversions,
        penalties,
        totalPoints,
        yellowCard,
        yellowCardMin,
      },
    });
    console.log(
      `  ${p.isStarter ? "TIT" : "REM"} ${String(p.num).padStart(2, " ")}. ${p.lastName}` +
        (totalPoints > 0 ? ` (${totalPoints} pts)` : "") +
        (yellowCard ? ` [CJ ${yellowCardMin}']` : "") +
        (p.lastName === "De La Fuente" ? " (C)" : "")
    );
  }

  // ---------------------------------------------------------------
  // 5. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  // Nettoyage
  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: MATCH_ID },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  // Événements chronologiques
  // Sources : eurosport.fr (scoring), francebleu.fr (cartons, récit)
  const events = [
    // USAP events (isUsap: true)
    {
      minute: 7,
      type: "ESSAI" as const,
      playerId: PLAYER_IDS["Crossdale"],
      isUsap: true,
      description: "Essai de Crossdale après relais Duguivalu-Veredamu-Allan. 0-5.",
    },
    {
      minute: 9,
      type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Transformation d'Allan. 0-7.",
    },
    {
      minute: 11,
      type: "CARTON_JAUNE" as const,
      playerId: PLAYER_IDS["Crossdale"],
      isUsap: true,
      description: "Carton jaune Crossdale pour en-avant volontaire sur interception.",
    },
    {
      minute: 19,
      type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité d'Allan. 7-10.",
    },
    {
      minute: 24,
      type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité d'Allan. 7-13.",
    },
    {
      minute: 27,
      type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité d'Allan. 7-16.",
    },
    {
      minute: 43,
      type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité d'Allan. 12-19.",
    },
    // Bayonne events (isUsap: false) — pas de playerId car adversaires non en base
    {
      minute: 12,
      type: "ESSAI" as const,
      playerId: null,
      isUsap: false,
      description: "Essai de Sireli Maqala (Bayonne) en supériorité numérique. 5-7.",
    },
    {
      minute: 13,
      type: "TRANSFORMATION" as const,
      playerId: null,
      isUsap: false,
      description: "Transformation de Camille Lopez (Bayonne). 7-7.",
    },
    {
      minute: 27,
      type: "CARTON_JAUNE" as const,
      playerId: null,
      isUsap: false,
      description: "Carton jaune Andy Bordelai (Bayonne).",
    },
    {
      minute: 36,
      type: "ESSAI" as const,
      playerId: null,
      isUsap: false,
      description: "2e essai bayonnais (non converti). 12-16.",
    },
    {
      minute: 46,
      type: "PENALITE" as const,
      playerId: null,
      isUsap: false,
      description: "Pénalité de Camille Lopez (Bayonne). 15-19.",
    },
    {
      minute: 50,
      type: "CARTON_JAUNE" as const,
      playerId: null,
      isUsap: false,
      description: "Carton jaune Yohan Orabé (Bayonne).",
    },
    {
      minute: 61,
      type: "PENALITE" as const,
      playerId: null,
      isUsap: false,
      description: "Pénalité de Camille Lopez (Bayonne). 18-19.",
    },
    {
      minute: 77,
      type: "PENALITE" as const,
      playerId: null,
      isUsap: false,
      description: "Pénalité de Joris Segonds (Bayonne) à 50 mètres. 21-19. Bayonne passe devant.",
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
    const side = evt.isUsap ? "USAP" : "BAY";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Stade Jean-Dauger");
  console.log("  Arbitre : Luc Ramos");
  console.log("  Score mi-temps : Bayonne 7 - USAP 16");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length} (essais, pénalités, cartons)`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

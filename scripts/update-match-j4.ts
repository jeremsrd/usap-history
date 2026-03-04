/**
 * Script de mise à jour du match USAP - Clermont (J4 Top 14, 28/09/2024)
 * Score final : USAP 33 - 3 Clermont
 * Mi-temps : USAP 18 - 3
 *
 * Première victoire de la saison pour l'USAP avec bonus offensif (4 essais).
 * Antoine Aucagne homme du match (18 pts : 1E, 2T, 3P).
 * Grave blessure de Posolo Tuilagi (fracture tibia-péroné, 17').
 *
 * Sources : top14.lnr.fr, allrugby.com, eurosport.fr, francebleu.fr
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs4u002n1umrpa2sded8"; // Match J4 USAP-Clermont 2024-2025

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2024-2025/j4/10897-perpignan-clermont/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Lam", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Orie", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Tuilagi", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Van Tonder", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Bachelier", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "McIntyre", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Dubois", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Joseph", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Aucagne", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Fakatika", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Brazo", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: false },
  { num: 21, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 22, lastName: "Veredamu", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

// IDs des joueurs USAP (récupérés de la base)
const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Orie: "cmmby9pk0001w1ucdhzjt30qx",
  Tuilagi: "cmmby9pso00221ucdwnmxzccc",
  "Van Tonder": "cmmby9qj4002k1ucdmg0rggp5",
  Bachelier: "cmmby9q1g00281ucdpzfoultm",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  McIntyre: "cmmby9ro0003b1ucd388eacr8",
  Dubois: "cmmby9rwn003h1ucdavvw842q",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  Aucagne: "cmmby9riq00381ucdzmy4nusa",
  Montgaillard: "cmmby9op3001b1ucd027i2f17",
  Fakatika: "cmmby9p6p001n1ucdxt02xbuc",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Brazo: "cmmby9q5t002b1ucdgw3ikj36",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("=== Mise à jour match USAP - Clermont (J4, 28/09/2024) ===\n");

  // ---------------------------------------------------------------
  // 1. Stade Aimé-Giral (devrait déjà exister)
  // ---------------------------------------------------------------
  console.log("--- Stade ---");
  const venue = await prisma.venue.findFirst({
    where: { name: { contains: "Giral" } },
  });
  if (venue) {
    console.log(`  Existe : ${venue.name} (${venue.id})`);
  } else {
    console.log("  ⚠ Stade Aimé-Giral non trouvé !");
    return;
  }

  // ---------------------------------------------------------------
  // 2. Créer l'arbitre Ludovic Cayre (si absent)
  // ---------------------------------------------------------------
  console.log("\n--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: "Cayre" },
  });
  if (!referee) {
    const refSlugBase = slugify("Ludovic Cayre");
    referee = await prisma.referee.create({
      data: {
        firstName: "Ludovic",
        lastName: "Cayre",
        slug: refSlugBase,
      },
    });
    referee = await prisma.referee.update({
      where: { id: referee.id },
      data: { slug: `${refSlugBase}-${referee.id}` },
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
   * Évolution du score (USAP - Clermont) :
   * 11' Essai Aucagne → 5-0
   * 12' Transfo Aucagne → 7-0
   * 19' Essai Naqalevu → 12-0
   * 28' Pénalité Belleau (CLR) → 12-3
   * 31' Pénalité Aucagne → 15-3
   * 40' Pénalité Aucagne → 18-3
   * MI-TEMPS : 18-3
   * 45' Pénalité Aucagne → 21-3
   * 62' Essai Joseph → 26-3
   * 63' Transfo Aucagne → 28-3
   * 79' Essai Montgaillard → 33-3
   *
   * USAP : 4E + 2T + 3P = 20 + 4 + 9 = 33 points
   * Clermont : 1P = 3 points
   */
  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      kickoffTime: "14:30",
      venueId: venue.id,
      refereeId: referee.id,
      attendance: 14000,
      halfTimeUsap: 18,
      halfTimeOpponent: 3,
      // Détail scoring USAP
      triesUsap: 4,
      conversionsUsap: 2,
      penaltiesUsap: 3,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Clermont
      triesOpponent: 0,
      conversionsOpponent: 0,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Première victoire de la saison pour l'USAP avec un bonus offensif contre l'ASM " +
        "Clermont (33-3). Match parfait des Catalans devant leur public à Aimé-Giral. " +
        "Antoine Aucagne, aligné à l'arrière, est l'homme du match avec 18 points (1 essai, " +
        "2 transformations, 3 pénalités). Seule ombre au tableau : la grave blessure de " +
        "Posolo Tuilagi (fracture tibia-péroné) sur un plaquage à la 17e minute.",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, stade, rapport)");

  // ---------------------------------------------------------------
  // 4. Composition USAP (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID, isOpponent: false },
  });
  console.log(`  ${deleted.count} entrée(s) USAP supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = PLAYER_IDS[p.lastName];
    if (!playerId) {
      console.log(`  ⚠ Joueur non trouvé : ${p.lastName}`);
      continue;
    }

    let tries = 0,
      conversions = 0,
      penalties = 0,
      totalPoints = 0;

    // Stats individuelles
    if (p.lastName === "Aucagne") {
      tries = 1;
      conversions = 2;
      penalties = 3;
      totalPoints = 18; // 1E(5) + 2T(4) + 3P(9) = 18
    }
    if (p.lastName === "Naqalevu") {
      tries = 1;
      totalPoints = 5;
    }
    if (p.lastName === "Joseph") {
      tries = 1;
      totalPoints = 5;
    }
    if (p.lastName === "Montgaillard") {
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
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}`);
  }

  // ---------------------------------------------------------------
  // 5. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: MATCH_ID },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events = [
    // 1re mi-temps
    {
      minute: 11, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Essai d'Antoine Aucagne. 5-0.",
    },
    {
      minute: 12, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Transformation d'Antoine Aucagne. 7-0.",
    },
    {
      minute: 17, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Tuilagi"], isUsap: true,
      description: "Sortie sur blessure de Posolo Tuilagi (fracture tibia-péroné). Remplacé par Warion.",
    },
    {
      minute: 17, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Warion"], isUsap: true,
      description: "Entrée d'Adrien Warion en remplacement de Tuilagi (blessure).",
    },
    {
      minute: 19, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Naqalevu"], isUsap: true,
      description: "Essai d'Apisai Naqalevu. 12-0.",
    },
    {
      minute: 28, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité d'Anthony Belleau (Clermont). 12-3.",
    },
    {
      minute: 31, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. 15-3.",
    },
    {
      minute: 40, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. 18-3. Mi-temps.",
    },
    // 2e mi-temps
    {
      minute: 45, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. 21-3.",
    },
    {
      minute: 62, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Joseph"], isUsap: true,
      description: "Essai de Jefferson-Lee Joseph. 26-3.",
    },
    {
      minute: 63, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Transformation d'Antoine Aucagne. 28-3.",
    },
    {
      minute: 79, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Montgaillard"], isUsap: true,
      description: "Essai de Victor Montgaillard. 33-3. Bonus offensif.",
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
    const side = evt.isUsap ? "USAP" : "CLR";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Aimé-Giral (Perpignan)");
  console.log("  Arbitre : Ludovic Cayre");
  console.log("  Score mi-temps : USAP 18 - Clermont 3");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length} (essais, pénalités, blessure)`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

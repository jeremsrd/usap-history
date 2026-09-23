/**
 * Script de mise à jour du match USAP - LOU Rugby (J7 Top 14, 19/10/2024)
 * Score final : USAP 29 - 26 LOU
 * Mi-temps : USAP 19 - 9 LOU
 *
 * Victoire à Aimé-Giral dans un match à rebondissements. L'USAP mène 22-16
 * grâce au pied d'Allan (5 pénalités) et un essai de Veredamu. Lyon revient
 * et passe devant 22-26 (essais Parisien et Couilloud). Deux cartons jaunes
 * pour Lyon (Parisien, Radradra) sur la même action permettent à Fa'aso'o
 * de marquer l'essai de la victoire (69'). Blessure de Dubois (fracture jambe).
 * 11 changements dans le XV par rapport à J6.
 *
 * Sources : top14.lnr.fr, allrugby.com, francebleu.fr, espn.com, lourugby.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j7.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs7h002t1umrliehntag"; // Match J7 USAP-Lyon 2024-2025

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Orie", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Brazo", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true, isCaptain: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Dubois", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true },
  { num: 13, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Aucagne", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Sobela", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Fa'aso'o", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 21, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 22, lastName: "Dupichot", position: "AILIER" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

// IDs des joueurs USAP (récupérés de la base)
const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Orie: "cmmby9pk0001w1ucdhzjt30qx",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Brazo: "cmmby9q5t002b1ucdgw3ikj36",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Dubois: "cmmby9rwn003h1ucdavvw842q",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Aucagne: "cmmby9riq00381ucdzmy4nusa",
  Montgaillard: "cmmby9op3001b1ucd027i2f17",
  Tetrashvili: "cmmby9ogb00151ucdz3vqd429",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Dupichot: "cmmby9t3k004b1ucdtmx0zek2",
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
  console.log("=== Mise à jour match USAP - LOU Rugby (J7, 19/10/2024) ===\n");

  // ---------------------------------------------------------------
  // 1. Créer l'arbitre Thomas Charabas (si absent)
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: "Charabas" },
  });
  if (!referee) {
    const refSlugBase = slugify("Thomas Charabas");
    referee = await prisma.referee.create({
      data: {
        firstName: "Thomas",
        lastName: "Charabas",
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
  // 2. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (USAP - LOU) :
   *  7' Pénalité Allan (USAP) → 3-0
   *  9' Pénalité Berdeu (LOU) → 3-3
   * 19' Pénalité Berdeu (LOU) → 3-6
   * 22' Pénalité Allan (USAP) → 6-6
   * 25' Pénalité Berdeu (LOU) → 6-9
   * 30' Pénalité Allan (USAP) → 9-9
   * 36' Pénalité Allan (USAP) → 12-9
   * 40' Blessure Dubois → Dupichot
   * 45' Essai Veredamu (USAP) → 17-9
   * 46' Transfo Allan (USAP) → 19-9
   * MI-TEMPS : 19-9
   * 46' Essai Parisien (LOU) → 19-14
   * 47' Transfo Berdeu (LOU) → 19-16
   * 51' Pénalité Allan (USAP) → 22-16
   * 61' Essai Couilloud (LOU) → 22-21
   * 62' Transfo Berdeu (LOU) → 22-23
   * 67' Pénalité Berdeu (LOU) → 22-26
   * 68' Carton jaune Parisien (LOU)
   * 68' Carton jaune Radradra (LOU) → Lyon à 13
   * 69' Essai Fa'aso'o (USAP) → 27-26
   * 70' Transfo Allan (USAP) → 29-26
   *
   * USAP : 2E + 2T + 5P = 10 + 4 + 15 = 29 points
   * LOU : 2E + 2T + 4P = 10 + 4 + 12 = 26 points
   */
  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      kickoffTime: "16:30",
      refereeId: referee.id,
      attendance: 14000,
      halfTimeUsap: 19,
      halfTimeOpponent: 9,
      // Détail scoring USAP
      triesUsap: 2,
      conversionsUsap: 2,
      penaltiesUsap: 5,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring LOU
      triesOpponent: 2,
      conversionsOpponent: 2,
      penaltiesOpponent: 4,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Victoire à rebondissements à Aimé-Giral (29-26). 11 changements dans le XV après la " +
        "déroute à Bordeaux. Tommaso Allan impérial au pied (5 pénalités, 2 transformations, 19 pts). " +
        "L'USAP mène 22-16 mais Lyon revient et passe devant 22-26 grâce aux essais de Parisien (46') " +
        "et Couilloud (61') et une pénalité de Berdeu (67'). Deux cartons jaunes pour Lyon (Parisien et " +
        "Radradra, 68') sur la même action permettent à l'USAP de réagir. Essai libérateur de Fa'aso'o " +
        "(69') transformé par Allan (70') pour le score final 29-26. Blessure de Lucas Dubois (probable " +
        "fracture jambe gauche) juste avant la mi-temps.",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, rapport)");

  // ---------------------------------------------------------------
  // 3. Composition USAP (23 joueurs)
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
    if (p.lastName === "Veredamu") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Fa'aso'o") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Allan") {
      conversions = 2;
      penalties = 5;
      totalPoints = 2 * 2 + 5 * 3; // 4 + 15 = 19
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
  // 4. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: MATCH_ID },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events = [
    // === 1re mi-temps ===
    {
      minute: 7, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. 3-0.",
    },
    {
      minute: 9, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Léo Berdeu (LOU). 3-3.",
    },
    {
      minute: 19, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Léo Berdeu (LOU). 3-6.",
    },
    {
      minute: 22, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. 6-6.",
    },
    {
      minute: 25, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Léo Berdeu (LOU). 6-9.",
    },
    {
      minute: 30, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. 9-9.",
    },
    {
      minute: 36, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. 12-9.",
    },
    // 40' Dubois blessé → Dupichot
    {
      minute: 40, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Dubois"], isUsap: true,
      description: "Sortie de Lucas Dubois (blessure, probable fracture jambe gauche). Remplacé par Louis Dupichot.",
    },
    {
      minute: 40, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Dupichot"], isUsap: true,
      description: "Entrée de Louis Dupichot en remplacement de Dubois (blessure).",
    },
    // 45' Essai Veredamu (dernier ballon de la 1re mi-temps)
    {
      minute: 45, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Veredamu"], isUsap: true,
      description: "Essai de Tavite Veredamu sur le dernier ballon de la première mi-temps. 17-9.",
    },
    {
      minute: 46, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. 19-9. Mi-temps.",
    },
    // === 2e mi-temps ===
    {
      minute: 46, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai d'Alfred Parisien (LOU). 19-14.",
    },
    {
      minute: 47, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Léo Berdeu (LOU). 19-16.",
    },
    {
      minute: 51, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. 22-16.",
    },
    // 52' Remplacements
    {
      minute: 52, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Sortie de Lucas Velarte. Remplacé par Patrick Sobela.",
    },
    {
      minute: 52, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Sobela"], isUsap: true,
      description: "Entrée de Patrick Sobela en remplacement de Velarte.",
    },
    {
      minute: 52, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Warion"], isUsap: true,
      description: "Sortie d'Adrien Warion (HIA). Remplacé temporairement par Mathieu Tanguy.",
    },
    {
      minute: 52, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Tanguy"], isUsap: true,
      description: "Entrée de Mathieu Tanguy en remplacement temporaire de Warion (HIA).",
    },
    // 56' Vague de remplacements
    {
      minute: 56, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Tanguy"], isUsap: true,
      description: "Sortie de Mathieu Tanguy. Remplacé par So'otala Fa'aso'o.",
    },
    {
      minute: 56, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Fa'aso'o"], isUsap: true,
      description: "Entrée de So'otala Fa'aso'o en remplacement de Tanguy.",
    },
    {
      minute: 56, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Ecochard"], isUsap: true,
      description: "Sortie de Tom Ecochard. Remplacé par Gela Aprasidze.",
    },
    {
      minute: 56, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Aprasidze"], isUsap: true,
      description: "Entrée de Gela Aprasidze en remplacement d'Ecochard.",
    },
    {
      minute: 56, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Sortie de Kieran Brookes. Remplacé par Pietro Ceccarelli.",
    },
    {
      minute: 56, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes.",
    },
    // 61' Essai Couilloud + remplacement Beria
    {
      minute: 61, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Baptiste Couilloud (LOU). 22-21.",
    },
    {
      minute: 61, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Beria"], isUsap: true,
      description: "Sortie de Giorgi Beria. Remplacé par Giorgi Tetrashvili.",
    },
    {
      minute: 61, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Tetrashvili"], isUsap: true,
      description: "Entrée de Giorgi Tetrashvili en remplacement de Beria.",
    },
    {
      minute: 62, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Léo Berdeu (LOU). 22-23.",
    },
    {
      minute: 67, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Léo Berdeu (LOU). 22-26. Lyon passe devant.",
    },
    // 68' Deux cartons jaunes Lyon sur la même action
    {
      minute: 68, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton jaune pour Alfred Parisien (LOU). Deux cartons sur la même action, Lyon à 13.",
    },
    {
      minute: 68, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton jaune pour Semi Radradra (LOU). Lyon réduit à 13 joueurs.",
    },
    // 69' Essai de la victoire
    {
      minute: 69, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Fa'aso'o"], isUsap: true,
      description: "Essai de So'otala Fa'aso'o ! L'USAP repasse devant. 27-26.",
    },
    {
      minute: 70, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. 29-26.",
    },
    // 75' Dernier remplacement
    {
      minute: 75, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Oviedo"], isUsap: true,
      description: "Sortie de Joaquin Oviedo. Warion revient sur le terrain après HIA.",
    },
    {
      minute: 75, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Warion"], isUsap: true,
      description: "Retour d'Adrien Warion sur le terrain (HIA passé) en remplacement d'Oviedo.",
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
    const side = evt.isUsap ? "USAP" : "LOU ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Aimé-Giral (Perpignan) — domicile");
  console.log("  Arbitre : Thomas Charabas");
  console.log("  Score mi-temps : USAP 19 - LOU 9");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

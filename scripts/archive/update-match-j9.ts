/**
 * Script de mise à jour du match USAP - RC Vannes (J9 Top 14, 02/11/2024)
 * Score final : USAP 32 - 13 Vannes
 * Mi-temps : USAP 10 - 3 Vannes
 *
 * Victoire bonifiée à Aimé-Giral. De la Fuente ouvre le score dès la 4e minute.
 * Première mi-temps frustrante (deux essais refusés par la vidéo pour Buliruarua
 * et Ruiz). L'USAP accélère en 2e mi-temps : essais de Buliruarua (51'),
 * Granell (62') et Fa'aso'o (77') pour le bonus offensif. Aucagne impérial
 * au pied (3 transformations, 2 pénalités, 14 pts).
 *
 * Sources : top14.lnr.fr, itsrugby.fr, francebleu.fr, minutesports.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j9.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs98002x1umrihzr6yqu"; // Match J9 USAP-Vannes 2024-2025

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Labouteley", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Brazo", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Granell", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Aucagne", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Lam", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Fa'aso'o", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 19, lastName: "Bachelier", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "Kretchmann", position: "CENTRE" as const, isStarter: false },
  { num: 22, lastName: "Dupichot", position: "AILIER" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

// IDs des joueurs USAP
const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Labouteley: "cmmby9pfj001t1ucd75p7hi07",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Brazo: "cmmby9q5t002b1ucdgw3ikj36",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Granell: "cmmf2aopb00001u843lhf8foj",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Aucagne: "cmmby9riq00381ucdzmy4nusa",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Tetrashvili: "cmmby9ogb00151ucdz3vqd429",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Bachelier: "cmmby9q1g00281ucdpzfoultm",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Kretchmann: "", // sera créé dynamiquement
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
  console.log("=== Mise à jour match USAP - RC Vannes (J9, 02/11/2024) ===\n");

  // ---------------------------------------------------------------
  // 0. Créer le joueur Gabin Kretchmann (si absent)
  // ---------------------------------------------------------------
  console.log("--- Joueur Kretchmann ---");
  let kretchmann = await prisma.player.findFirst({
    where: { lastName: "Kretchmann" },
  });
  if (!kretchmann) {
    const slugBase = slugify("Gabin Kretchmann");
    kretchmann = await prisma.player.create({
      data: {
        firstName: "Gabin",
        lastName: "Kretchmann",
        slug: slugBase,
        position: "CENTRE",
        isActive: true,
      },
    });
    kretchmann = await prisma.player.update({
      where: { id: kretchmann.id },
      data: { slug: `${slugBase}-${kretchmann.id}` },
    });
    console.log(`  Créé : ${kretchmann.firstName} ${kretchmann.lastName} (${kretchmann.id})`);
  } else {
    console.log(`  Existe : ${kretchmann.firstName} ${kretchmann.lastName} (${kretchmann.id})`);
  }
  PLAYER_IDS["Kretchmann"] = kretchmann.id;

  // ---------------------------------------------------------------
  // 1. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  const REFEREE_ID = "cmmc8h10i00001uvcjrg5a061"; // Ludovic Cayre
  const VENUE_ID = "cmm6wnybf000d1uihl8hsk9e1"; // Aimé-Giral

  /**
   * Évolution du score (USAP - Vannes) :
   *  4' Essai De la Fuente (USAP) → 5-0
   *  4' Transfo Aucagne (USAP) → 7-0
   *  8' Pénalité Lafage (VAN) → 7-3
   * 18' Pénalité Aucagne (USAP) → 10-3
   * MI-TEMPS : 10-3
   * 43' Pénalité Aucagne (USAP) → 13-3
   * 48' Pénalité Lafage (VAN) → 13-6
   * 51' Essai Buliruarua (USAP) → 18-6
   * 51' Transfo Aucagne (USAP) → 20-6
   * 62' Essai Granell (USAP) → 25-6
   * 66' Essai Rayasi (VAN) → 25-11
   * 66' Transfo Debaës (VAN) → 25-13
   * 77' Essai Fa'aso'o (USAP) → 30-13
   * 78' Transfo Aucagne (USAP) → 32-13
   *
   * USAP : 4E + 3T + 2P = 20 + 6 + 6 = 32 points
   * VAN : 1E + 1T + 2P = 5 + 2 + 6 = 13 points
   */
  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      kickoffTime: "15:00",
      refereeId: REFEREE_ID,
      venueId: VENUE_ID,
      attendance: 13500,
      halfTimeUsap: 10,
      halfTimeOpponent: 3,
      // Détail scoring USAP
      triesUsap: 4,
      conversionsUsap: 3,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Vannes
      triesOpponent: 1,
      conversionsOpponent: 1,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: true,
      bonusDefensif: false,
      // Rapport
      report:
        "Victoire bonifiée à Aimé-Giral (32-13). De la Fuente ouvre le score dès la 4e minute " +
        "sur une belle conduite au pied. Première mi-temps frustrante : deux essais refusés par la " +
        "vidéo (Buliruarua et Ruiz). Score serré à la pause (10-3). L'USAP accélère en 2e mi-temps " +
        "avec les essais de Buliruarua (51'), Granell (62', 2e match consécutif comme marqueur) " +
        "et Fa'aso'o (77') pour le précieux bonus offensif. Antoine Aucagne impérial au pied " +
        "(3 transformations, 2 pénalités, 14 pts). 5 points pris au classement, l'USAP s'éloigne " +
        "de la zone rouge.",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, rapport)");

  // ---------------------------------------------------------------
  // 2. Composition USAP (23 joueurs)
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
    if (p.lastName === "De La Fuente") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Buliruarua") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Granell") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Fa'aso'o") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Aucagne") {
      conversions = 3;
      penalties = 2;
      totalPoints = 3 * 2 + 2 * 3; // 6 + 6 = 12
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
  // 3. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: MATCH_ID },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events = [
    // === 1re mi-temps ===
    {
      minute: 4, type: "ESSAI" as const,
      playerId: PLAYER_IDS["De La Fuente"], isUsap: true,
      description: "Essai de Jerónimo de la Fuente ! Belle conduite au pied pour ouvrir le score. 5-0.",
    },
    {
      minute: 4, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Transformation d'Antoine Aucagne. 7-0.",
    },
    {
      minute: 8, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Maxime Lafage (Vannes). 7-3.",
    },
    {
      minute: 18, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. 10-3.",
    },
    // === 2e mi-temps ===
    {
      minute: 43, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. 13-3.",
    },
    {
      minute: 48, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Maxime Lafage (Vannes). 13-6.",
    },
    {
      minute: 51, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Buliruarua"], isUsap: true,
      description: "Essai d'Eneriko Buliruarua en bout de ligne, servi par Allan. 18-6.",
    },
    {
      minute: 51, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Transformation d'Antoine Aucagne. 20-6.",
    },
    // 53' Remplacement Beria → Tetrashvili
    {
      minute: 53, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Beria"], isUsap: true,
      description: "Sortie de Giorgi Beria. Remplacé par Giorgi Tetrashvili.",
    },
    {
      minute: 53, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Tetrashvili"], isUsap: true,
      description: "Entrée de Giorgi Tetrashvili en remplacement de Beria.",
    },
    // 57' Oviedo → Fa'aso'o
    {
      minute: 57, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Oviedo"], isUsap: true,
      description: "Sortie de Joaquín Oviedo. Remplacé par So'otala Fa'aso'o.",
    },
    {
      minute: 57, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Fa'aso'o"], isUsap: true,
      description: "Entrée de So'otala Fa'aso'o en remplacement d'Oviedo.",
    },
    // 60' Brookes → Ceccarelli
    {
      minute: 60, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Sortie de Kieran Brookes. Remplacé par Pietro Ceccarelli.",
    },
    {
      minute: 60, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes.",
    },
    {
      minute: 62, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Granell"], isUsap: true,
      description: "Essai de Maxim Granell ! Après un 50-22 d'Aucagne, le jeune ailier conclut. 25-6.",
    },
    // 62' Ruiz → Lam
    {
      minute: 62, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Ruiz"], isUsap: true,
      description: "Sortie d'Ignacio Ruiz. Remplacé par Seilala Lam.",
    },
    {
      minute: 62, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Entrée de Seilala Lam en remplacement de Ruiz.",
    },
    // 65' Allan → Dupichot
    {
      minute: 65, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Sortie de Tommaso Allan. Remplacé par Louis Dupichot.",
    },
    {
      minute: 65, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Dupichot"], isUsap: true,
      description: "Entrée de Louis Dupichot en remplacement d'Allan.",
    },
    {
      minute: 66, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Salesi Rayasi (Vannes). Beau crochet intérieur. 25-11.",
    },
    {
      minute: 66, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Thibault Debaës (Vannes). 25-13.",
    },
    // 67' Ecochard → Aprasidze, Brazo → Bachelier
    {
      minute: 67, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Ecochard"], isUsap: true,
      description: "Sortie de Tom Ecochard. Remplacé par Gela Aprasidze.",
    },
    {
      minute: 67, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Aprasidze"], isUsap: true,
      description: "Entrée de Gela Aprasidze en remplacement d'Ecochard.",
    },
    {
      minute: 67, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Brazo"], isUsap: true,
      description: "Sortie d'Alan Brazo. Remplacé par Lucas Bachelier.",
    },
    {
      minute: 67, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Bachelier"], isUsap: true,
      description: "Entrée de Lucas Bachelier en remplacement de Brazo.",
    },
    {
      minute: 77, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Fa'aso'o"], isUsap: true,
      description: "Essai de So'otala Fa'aso'o ! L'essai du bonus offensif pour la joie d'Aimé-Giral. 30-13.",
    },
    {
      minute: 78, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Transformation d'Antoine Aucagne. 32-13.",
    },
    // 78' Carton jaune Gorrissen (Vannes)
    {
      minute: 78, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton jaune pour Francisco Gorrissen (Vannes).",
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
    const side = evt.isUsap ? "USAP" : "VAN ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesPlayed: Record<string, number> = {
    Beria: 53,
    Ruiz: 62,
    Brookes: 60,
    Labouteley: 80,
    Warion: 80,
    Velarte: 80,
    Brazo: 67,
    Oviedo: 57,
    Ecochard: 67,
    Allan: 65,
    Granell: 80,
    "De La Fuente": 80,
    Buliruarua: 80,
    Veredamu: 80,
    Aucagne: 80,
    Lam: 18,       // entre 62'
    Tetrashvili: 27, // entre 53'
    "Fa'aso'o": 23,  // entre 57'
    Bachelier: 13,   // entre 67'
    Aprasidze: 13,   // entre 67'
    Kretchmann: 0,   // non utilisé
    Dupichot: 15,    // entre 65'
    Ceccarelli: 20,  // entre 60'
  };

  for (const [lastName, minutes] of Object.entries(minutesPlayed)) {
    const playerId = PLAYER_IDS[lastName];
    if (!playerId) continue;
    await prisma.matchPlayer.updateMany({
      where: { matchId: MATCH_ID, playerId, isOpponent: false },
      data: { minutesPlayed: minutes },
    });
    console.log(`  ${lastName}: ${minutes}'`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Aimé-Giral (Perpignan) — domicile");
  console.log("  Arbitre : Ludovic Cayre");
  console.log("  Score mi-temps : USAP 10 - Vannes 3");
  console.log("  Score final : USAP 32 - Vannes 13");
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

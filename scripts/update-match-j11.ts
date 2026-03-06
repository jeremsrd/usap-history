/**
 * Script de mise à jour du match USAP - RC Toulon (J11 Top 14, 30/11/2024)
 * Score final : USAP 13 - Toulon 22
 * Mi-temps : USAP 6 - Toulon 12
 *
 * Première défaite à domicile de la saison pour l'USAP. Duel de buteurs
 * en 1re mi-temps entre Kretchmann (2P) et Hervé (1DG + 3P). Carton jaune
 * de Tetrashvili (49') suivi immédiatement de l'essai de Priso (51').
 * Oviedo sauve l'honneur avec un essai en solo (55'). Première titularisation
 * de Kretchmann en Top 14. Hervé auteur d'un drop goal (premier drop de Toulon
 * depuis avril 2019). Aucagne entre en jeu à la 51' et transforme l'essai d'Oviedo.
 *
 * Sources : top14.lnr.fr, itsrugby.fr, allrugby.com, rctoulon.com, espn.com
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j11.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsb000311umrp2cff2nb"; // Match J11 USAP-Toulon 2024-2025

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Labouteley", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Fa'aso'o", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Kretchmann", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Crossdale", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Dupichot", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Lam", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Boyer Gallardo", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Sobela", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Bachelier", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 21, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 22, lastName: "Aucagne", position: "DEMI_OUVERTURE" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

// === IDs des joueurs (depuis la BDD) ===
const PLAYER_IDS: Record<string, string> = {
  Tetrashvili: "cmmby9ogb00151ucdz3vqd429",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Labouteley: "cmmby9pfj001t1ucd75p7hi07",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Hicks: "cmmf3v3b300001ufyqblsuba1",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  Kretchmann: "cmmf2trcs00001upl5gwhqicw",
  Crossdale: "cmmby9rsc003e1ucdli6st6ho",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Dupichot: "cmmby9t3k004b1ucdtmx0zek2",
  Lam: "cmmby9oko00181ucd95s3xupu",
  "Boyer Gallardo": "cmmby9o7j000z1ucdwq4kp2mh",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
  Bachelier: "cmmby9q1g00281ucdpzfoultm",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  Aucagne: "cmmby9riq00381ucdzmy4nusa",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

const REFEREE_ID = "cmmf2aovc00011u8463trvhe7"; // Kévin Bralley
const VENUE_ID = "cmm6wnybf000d1uihl8hsk9e1"; // Aimé-Giral

async function main() {
  console.log("=== Mise à jour match USAP - RC Toulon (J11, 30/11/2024) ===\n");

  // ---------------------------------------------------------------
  // 1. Mise à jour du match (infos générales)
  // ---------------------------------------------------------------
  console.log("--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      kickoffTime: "21:05",
      attendance: 14000,
      venueId: VENUE_ID,
      refereeId: REFEREE_ID,
      halfTimeUsap: 6,
      halfTimeOpponent: 12,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Toulon
      triesOpponent: 1,
      conversionsOpponent: 1,
      penaltiesOpponent: 4,
      dropGoalsOpponent: 1,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Première défaite à domicile de la saison. Duel de buteurs en 1re mi-temps entre Kretchmann (2P, 6 pts) et Hervé (1DG + 3P, 12 pts). Carton jaune de Tetrashvili (49') immédiatement suivi de l'essai de Priso (51'). Oviedo sauve l'honneur avec un essai en solo (55'). Première titularisation en Top 14 du jeune Kretchmann au poste de demi d'ouverture. Toulon signe sa première victoire à Aimé-Giral depuis mars 2019.",
    },
  });
  console.log(
    "  Match mis à jour (score mi-temps, scoring, arbitre, stade, rapport)"
  );

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
      totalPoints = 0,
      yellowCard = false,
      yellowCardMin: number | null = null;

    // Stats individuelles
    if (p.lastName === "Kretchmann") {
      penalties = 2;
      totalPoints = 6;
    } else if (p.lastName === "Oviedo") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Aucagne") {
      conversions = 1;
      totalPoints = 2;
    } else if (p.lastName === "Tetrashvili") {
      yellowCard = true;
      yellowCardMin = 49;
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
    const card = yellowCard ? " [JAUNE]" : "";
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
    // 6' - Drop Hervé (Toulon) → 0-3
    {
      minute: 6,
      type: "DROP",
      playerId: null,
      isUsap: false,
      description: "Drop goal d'Enzo Hervé (Toulon). 0-3.",
    },
    // 10' - Pénalité Kretchmann → 3-3
    {
      minute: 10,
      type: "PENALITE",
      playerId: PLAYER_IDS["Kretchmann"],
      isUsap: true,
      description: "Pénalité de Gabin Kretchmann",
    },
    // 19' - Pénalité Hervé (Toulon) → 3-6
    {
      minute: 19,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité d'Enzo Hervé (Toulon). 3-6.",
    },
    // 24' - Pénalité Kretchmann → 6-6
    {
      minute: 24,
      type: "PENALITE",
      playerId: PLAYER_IDS["Kretchmann"],
      isUsap: true,
      description: "Pénalité de Gabin Kretchmann",
    },
    // 29' - Pénalité Hervé (Toulon) → 6-9
    {
      minute: 29,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité d'Enzo Hervé (Toulon). 6-9.",
    },
    // 40' - Pénalité Hervé (Toulon) → 6-12
    {
      minute: 40,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité d'Enzo Hervé (Toulon). 6-12.",
    },

    // === MI-TEMPS : USAP 6 - Toulon 12 ===

    // 49' - Carton jaune Tetrashvili
    {
      minute: 49,
      type: "CARTON_JAUNE",
      playerId: PLAYER_IDS["Tetrashvili"],
      isUsap: true,
      description: "Carton jaune pour Giorgi Tetrashvili",
    },

    // 51' - Remplacement Kretchmann → Aucagne
    {
      minute: 51,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Kretchmann"],
      isUsap: true,
      description: "Sortie de Gabin Kretchmann",
    },
    {
      minute: 51,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Aucagne"],
      isUsap: true,
      description: "Entrée d'Antoine Aucagne en remplacement de Kretchmann",
    },
    // 51' - Remplacement Fa'aso'o → Tanguy
    {
      minute: 51,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Fa'aso'o"],
      isUsap: true,
      description: "Sortie de So'otala Fa'aso'o",
    },
    {
      minute: 51,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Tanguy"],
      isUsap: true,
      description: "Entrée de Mathieu Tanguy en remplacement de Fa'aso'o",
    },
    // 51' - Remplacement Velarte → Boyer Gallardo
    {
      minute: 51,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Velarte"],
      isUsap: true,
      description: "Sortie de Lucas Velarte",
    },
    {
      minute: 51,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Boyer Gallardo"],
      isUsap: true,
      description:
        "Entrée de Lorenço Boyer Gallardo en remplacement de Velarte",
    },

    // 51' - Essai Priso (Toulon) → 6-17
    {
      minute: 51,
      type: "ESSAI",
      playerId: null,
      isUsap: false,
      description: "Essai de Dany Priso (Toulon). 6-17.",
    },
    // 52' - Transformation Hervé (Toulon) → 6-19
    {
      minute: 52,
      type: "TRANSFORMATION",
      playerId: null,
      isUsap: false,
      description: "Transformation d'Enzo Hervé (Toulon). 6-19.",
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
    // 53' - Remplacement Brookes → Ceccarelli
    {
      minute: 53,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Brookes"],
      isUsap: true,
      description: "Sortie de Kieran Brookes",
    },
    {
      minute: 53,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Ceccarelli"],
      isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes",
    },

    // 54' - Pénalité Hervé (Toulon) → 6-22
    {
      minute: 54,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité d'Enzo Hervé (Toulon). 6-22.",
    },

    // 55' - Remplacement Ruiz → Lam
    {
      minute: 55,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Ruiz"],
      isUsap: true,
      description: "Sortie d'Ignacio Ruiz",
    },
    {
      minute: 55,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Lam"],
      isUsap: true,
      description: "Entrée de Seilala Lam en remplacement de Ruiz",
    },

    // 55' - Essai Oviedo → 11-22
    {
      minute: 55,
      type: "ESSAI",
      playerId: PLAYER_IDS["Oviedo"],
      isUsap: true,
      description:
        "Essai de Joaquin Oviedo ! Crochet dévastateur pour l'essai en solo",
    },
    // 56' - Transformation Aucagne → 13-22
    {
      minute: 56,
      type: "TRANSFORMATION",
      playerId: PLAYER_IDS["Aucagne"],
      isUsap: true,
      description: "Transformation d'Antoine Aucagne. 13-22.",
    },

    // 59' - Remplacement Ecochard → Hall
    {
      minute: 59,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Ecochard"],
      isUsap: true,
      description: "Sortie de Tom Ecochard",
    },
    {
      minute: 59,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Hall"],
      isUsap: true,
      description: "Entrée de James Hall en remplacement d'Ecochard",
    },
    // 60' - Remplacement Tetrashvili → Sobela
    {
      minute: 60,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Tetrashvili"],
      isUsap: true,
      description:
        "Sortie de Giorgi Tetrashvili (après retour de carton jaune)",
    },
    {
      minute: 60,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Sobela"],
      isUsap: true,
      description: "Entrée de Patrick Sobela en remplacement de Tetrashvili",
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
    const team = evt.isUsap ? "USAP" : "TLN ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesMap: Record<string, number> = {
    Tetrashvili: 60, // Titulaire, carton jaune 49', sort à 60'
    Ruiz: 55, // Titulaire, sort à 55'
    Brookes: 53, // Titulaire, sort à 53'
    Labouteley: 80, // Titulaire, joue 80'
    "Fa'aso'o": 51, // Titulaire, sort à 51'
    Velarte: 51, // Titulaire, sort à 51'
    Hicks: 53, // Titulaire, sort à 53'
    Oviedo: 80, // Titulaire, joue 80'
    Ecochard: 59, // Titulaire, sort à 59'
    Kretchmann: 51, // Titulaire, sort à 51'
    Crossdale: 80, // Titulaire, joue 80'
    "De La Fuente": 80, // Titulaire, joue 80'
    Duguivalu: 80, // Titulaire, joue 80'
    Veredamu: 80, // Titulaire, joue 80'
    Dupichot: 80, // Titulaire, joue 80'
    Lam: 25, // Entre à 55'
    "Boyer Gallardo": 29, // Entre à 51'
    Tanguy: 29, // Entre à 51'
    Sobela: 20, // Entre à 60'
    Bachelier: 27, // Entre à 53'
    Hall: 21, // Entre à 59'
    Aucagne: 29, // Entre à 51'
    Ceccarelli: 27, // Entre à 53'
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
              // Trouver la minute d'entrée
              const entry = events.find(
                (e) =>
                  e.type === "REMPLACEMENT_ENTREE" && e.playerId === playerId
              );
              return entry?.minute ?? null;
            })(),
        subOut: (() => {
          const exit = events.find(
            (e) =>
              e.type === "REMPLACEMENT_SORTIE" && e.playerId === playerId
          );
          return exit?.minute ?? null;
        })(),
      },
    });
    console.log(`  ${lastName}: ${minutes}'`);
  }

  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Aimé-Giral (Perpignan) — domicile");
  console.log("  Arbitre : Kévin Bralley");
  console.log("  Score mi-temps : USAP 6 - Toulon 12");
  console.log("  Score final : USAP 13 - Toulon 22");
  console.log(
    `  Composition : ${USAP_SQUAD.length} joueurs USAP (15 titulaires + 8 remplaçants)`
  );
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

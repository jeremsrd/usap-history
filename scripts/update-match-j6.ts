/**
 * Script de mise à jour du match UBB - USAP (J6 Top 14, 12/10/2024)
 * Score final : UBB 66 - 12 USAP
 * Mi-temps : UBB 31 - 0 USAP
 *
 * Défaite historique à Bordeaux. 10 changements dans le XV par rapport à J5.
 * Montgaillard capitaine. Carton rouge de Naqalevu (44') pour plaquage
 * dangereux sur Depoortere (fracture orbitaire). Crossdale sorti sur blessure (34').
 * Bouthier fait ses débuts (51', remplace Della Schiava).
 *
 * Sources : itsrugby.fr, all.rugby, eurosport.fr, francebleu.fr, lnr.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j6.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs6m002r1umrlrrtnd1z"; // Match J6 UBB-USAP 2024-2025

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Boyer Gallardo", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: true, isCaptain: true },
  { num: 3, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Labouteley", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Sobela", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Aucagne", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Crossdale", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: true },
  { num: 13, lastName: "Baraque", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Dupichot", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Jintcharadze", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Orie", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Bachelier", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Bouthier", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 21, lastName: "Deghmache", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 22, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Fakatika", position: "PILIER_DROIT" as const, isStarter: false },
];

// IDs des joueurs USAP (récupérés de la base)
const PLAYER_IDS: Record<string, string> = {
  "Boyer Gallardo": "cmmby9o7j000z1ucdwq4kp2mh",
  Montgaillard: "cmmby9op3001b1ucd027i2f17",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
  Labouteley: "cmmby9pfj001t1ucd75p7hi07",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Aucagne: "cmmby9riq00381ucdzmy4nusa",
  Crossdale: "cmmby9rsc003e1ucdli6st6ho",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Baraque: "cmmby9sma003z1ucdk53umhd6",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Dupichot: "cmmby9t3k004b1ucdtmx0zek2",
  Jintcharadze: "cmmc6lnvv00031uujj3985da4",
  Tetrashvili: "cmmby9ogb00151ucdz3vqd429",
  Orie: "cmmby9pk0001w1ucdhzjt30qx",
  Bachelier: "cmmby9q1g00281ucdpzfoultm",
  // Bouthier sera créé dynamiquement
  Deghmache: "cmmby9r5f002z1ucddjqpjyiq",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Fakatika: "cmmby9p6p001n1ucdxt02xbuc",
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
  console.log("=== Mise à jour match UBB - USAP (J6, 12/10/2024) ===\n");

  // ---------------------------------------------------------------
  // 0. Créer Bouthier s'il n'existe pas
  // ---------------------------------------------------------------
  console.log("--- Vérification Bouthier ---");
  let bouthier = await prisma.player.findFirst({
    where: { lastName: "Bouthier" },
  });
  if (!bouthier) {
    // Créer d'abord avec un slug temporaire, puis mettre à jour avec le CUID
    const bouthierSlugBase = slugify("Antoine Bouthier");
    bouthier = await prisma.player.create({
      data: {
        firstName: "Antoine",
        lastName: "Bouthier",
        slug: bouthierSlugBase + "-temp",
        position: "TROISIEME_LIGNE_AILE",
        isActive: true,
        birthDate: new Date("2004-06-22"),
        height: 197,
        weight: 95,
      },
    });
    // Mettre à jour le slug avec le vrai CUID (nécessaire pour la page joueur)
    bouthier = await prisma.player.update({
      where: { id: bouthier.id },
      data: { slug: `${bouthierSlugBase}-${bouthier.id}` },
    });
    console.log(`  Créé : Antoine Bouthier (${bouthier.id})`);

    // Lier à la saison 2024-2025
    const season = await prisma.season.findFirst({ where: { label: "2024-2025" } });
    if (season) {
      await prisma.playerSeason.create({
        data: { playerId: bouthier.id, seasonId: season.id, shirtNumber: 20 },
      });
      console.log("  Lié à la saison 2024-2025");
    }
  } else {
    console.log(`  Existe : Antoine Bouthier (${bouthier.id})`);
  }
  PLAYER_IDS["Bouthier"] = bouthier.id;

  // ---------------------------------------------------------------
  // 1. Stade Chaban-Delmas (créer si absent)
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Chaban" } },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade Chaban-Delmas",
        city: "Bordeaux",
        capacity: 31100,
      },
    });
    console.log(`  Créé : ${venue.name} (${venue.id})`);
  } else {
    console.log(`  Existe : ${venue.name} (${venue.id})`);
  }

  // ---------------------------------------------------------------
  // 2. Créer l'arbitre Evan Urruzmendi (si absent)
  // ---------------------------------------------------------------
  console.log("\n--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: "Urruzmendi" },
  });
  if (!referee) {
    const refSlugBase = slugify("Evan Urruzmendi");
    referee = await prisma.referee.create({
      data: {
        firstName: "Evan",
        lastName: "Urruzmendi",
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
   * Évolution du score (UBB - USAP) :
   * 11' Essai Tatafu (UBB) → 5-0
   * 19' Essai Poirot (UBB) → 10-0
   * 28' Essai Reybier (UBB) → 15-0
   * 29' Transfo Jalibert → 17-0
   * 33' Essai Jalibert (UBB, interception) → 22-0
   * 34' Transfo Jalibert → 24-0
   * 40' Essai Jalibert (UBB, interception) → 29-0
   * 41' Transfo Jalibert → 31-0
   * MI-TEMPS : 31-0
   * 44' CARTON ROUGE Naqalevu (USAP)
   * 48' Essai Reybier (UBB) → 36-0
   * 49' Transfo Garcia → 38-0
   * 52' Essai Perchaud (UBB) → 43-0
   * 53' Transfo Garcia → 45-0
   * 56' Essai Buliruarua (USAP) → 45-5
   * 60' Essai Dupichot (USAP) → 45-10
   * 60' Transfo Aucagne → 45-12
   * 63' Essai Samu (UBB) → 50-12
   * 64' Transfo Garcia → 52-12
   * 70' Essai Buros (UBB) → 57-12
   * 71' Transfo Garcia → 59-12
   * 77' Carton jaune Perchaud (UBB)
   * 80' Essai Buros (UBB) → 64-12
   * 81' Transfo Garcia → 66-12
   *
   * UBB : 10E + 8T = 50 + 16 = 66 points
   * USAP : 2E + 1T = 10 + 2 = 12 points
   */
  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      kickoffTime: "16:30",
      venueId: venue.id,
      refereeId: referee.id,
      attendance: 31000,
      halfTimeUsap: 0,
      halfTimeOpponent: 31,
      // Détail scoring USAP
      triesUsap: 2,
      conversionsUsap: 1,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring UBB
      triesOpponent: 10,
      conversionsOpponent: 8,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Déroute historique à Chaban-Delmas (66-12). L'UBB, leader du Top 14, " +
        "inflige une correction aux Catalans avec 10 essais. Bordeaux mène déjà 31-0 à la mi-temps " +
        "grâce à 5 essais dont 2 de Jalibert sur interception. Carton rouge pour Naqalevu (44') " +
        "suite à un plaquage dangereux sur Depoortere (fracture orbitaire), réduisant l'USAP à 14. " +
        "Les Catalans sauvent l'honneur avec 2 essais de Buliruarua (56') et Dupichot (60'). " +
        "10 changements dans le XV de départ par rapport à la victoire contre Pau.",
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
    let redCard = false,
      redCardMin: number | null = null;

    // Stats individuelles
    if (p.lastName === "Buliruarua") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Dupichot") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Aucagne") {
      conversions = 1;
      totalPoints = 2;
    } else if (p.lastName === "Naqalevu") {
      redCard = true;
      redCardMin = 44;
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
        redCard,
        redCardMin,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    const rc = redCard ? ` [CR ${redCardMin}']` : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${rc}`);
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
    // === 1re mi-temps ===
    {
      minute: 11, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Tevita Tatafu (UBB). 5-0.",
    },
    {
      minute: 19, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Jefferson Poirot (UBB). 10-0.",
    },
    {
      minute: 28, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai d'Enzo Reybier (UBB). 15-0.",
    },
    {
      minute: 29, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Matthieu Jalibert (UBB). 17-0.",
    },
    {
      minute: 33, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Matthieu Jalibert (UBB) sur interception. 22-0.",
    },
    {
      minute: 34, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Matthieu Jalibert (UBB). 24-0.",
    },
    // 34' Crossdale → Buliruarua (blessure)
    {
      minute: 34, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Crossdale"], isUsap: true,
      description: "Sortie d'Alistair Crossdale (blessure). Remplacé par Eneriko Buliruarua.",
    },
    {
      minute: 34, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Buliruarua"], isUsap: true,
      description: "Entrée d'Eneriko Buliruarua en remplacement de Crossdale.",
    },
    {
      minute: 40, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Matthieu Jalibert (UBB) sur interception. 29-0.",
    },
    {
      minute: 41, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Matthieu Jalibert (UBB). 31-0.",
    },
    // === 2e mi-temps ===
    {
      minute: 44, type: "CARTON_ROUGE" as const,
      playerId: PLAYER_IDS["Naqalevu"], isUsap: true,
      description: "Carton rouge pour Apisai Naqalevu. Plaquage dangereux à la tête de Nicolas Depoortere (UBB). USAP à 14.",
    },
    // 47' Vague de remplacements (5 changements)
    {
      minute: 47, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Boyer Gallardo"], isUsap: true,
      description: "Sortie de Lorenço Boyer Gallardo. Remplacé par Giorgi Tetrashvili.",
    },
    {
      minute: 47, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Tetrashvili"], isUsap: true,
      description: "Entrée de Giorgi Tetrashvili en remplacement de Boyer Gallardo.",
    },
    {
      minute: 47, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Sortie de Pietro Ceccarelli. Remplacé par Akato Fakatika.",
    },
    {
      minute: 47, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Fakatika"], isUsap: true,
      description: "Entrée d'Akato Fakatika en remplacement de Ceccarelli.",
    },
    {
      minute: 47, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Aprasidze"], isUsap: true,
      description: "Sortie de Gela Aprasidze. Remplacé par Sadek Deghmache.",
    },
    {
      minute: 47, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Deghmache"], isUsap: true,
      description: "Entrée de Sadek Deghmache en remplacement d'Aprasidze.",
    },
    {
      minute: 47, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Sobela"], isUsap: true,
      description: "Sortie de Patrick Sobela. Remplacé par Lucas Bachelier.",
    },
    {
      minute: 47, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Bachelier"], isUsap: true,
      description: "Entrée de Lucas Bachelier en remplacement de Sobela.",
    },
    {
      minute: 47, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Montgaillard"], isUsap: true,
      description: "Sortie de Victor Montgaillard. Remplacé par Vakhtang Jintcharadze.",
    },
    {
      minute: 47, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Jintcharadze"], isUsap: true,
      description: "Entrée de Vakhtang Jintcharadze en remplacement de Montgaillard.",
    },
    {
      minute: 48, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai d'Enzo Reybier (UBB). 36-0.",
    },
    {
      minute: 49, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Mateo Garcia (UBB). 38-0.",
    },
    // 51' Derniers remplacements
    {
      minute: 51, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Tanguy"], isUsap: true,
      description: "Sortie de Mathieu Tanguy. Remplacé par Marvin Orie.",
    },
    {
      minute: 51, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Orie"], isUsap: true,
      description: "Entrée de Marvin Orie en remplacement de Tanguy.",
    },
    {
      minute: 51, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Della Schiava"], isUsap: true,
      description: "Sortie de Noé Della Schiava. Remplacé par Antoine Bouthier.",
    },
    {
      minute: 51, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Bouthier"], isUsap: true,
      description: "Entrée d'Antoine Bouthier en remplacement de Della Schiava. Débuts sous le maillot sang et or.",
    },
    {
      minute: 52, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Matis Perchaud (UBB). 43-0.",
    },
    {
      minute: 53, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Mateo Garcia (UBB). 45-0.",
    },
    {
      minute: 56, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Buliruarua"], isUsap: true,
      description: "Essai d'Eneriko Buliruarua. L'USAP marque enfin. 45-5.",
    },
    {
      minute: 60, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Dupichot"], isUsap: true,
      description: "Essai de Louis Dupichot. 45-10.",
    },
    {
      minute: 60, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Transformation d'Antoine Aucagne. 45-12.",
    },
    {
      minute: 63, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Pete Samu (UBB). 50-12.",
    },
    {
      minute: 64, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Mateo Garcia (UBB). 52-12.",
    },
    {
      minute: 70, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Romain Buros (UBB). 57-12.",
    },
    {
      minute: 71, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Mateo Garcia (UBB). 59-12.",
    },
    {
      minute: 77, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton jaune pour Matis Perchaud (UBB).",
    },
    {
      minute: 80, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Romain Buros (UBB). 64-12.",
    },
    {
      minute: 81, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Mateo Garcia (UBB). Score final 66-12.",
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
    const side = evt.isUsap ? "USAP" : "UBB ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Chaban-Delmas (Bordeaux)");
  console.log("  Arbitre : Evan Urruzmendi");
  console.log("  Score mi-temps : UBB 31 - USAP 0");
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

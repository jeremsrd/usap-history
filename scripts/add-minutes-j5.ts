/**
 * Script d'ajout des minutes jouées pour le match USAP - Pau (J5 Top 14, 05/10/2024)
 *
 * Remplacements USAP reconstitués (source : eurosport.fr) :
 *  42' Lam → Ruiz
 *  42' Della Schiava → Oviedo
 *  42' Aucagne → Allan
 *  47' Fa'aso'o → Orie
 *  59' Beria → Fakatika
 *  Non utilisés : Aprasidze, Buliruarua, Ceccarelli
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-minutes-j5.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs5q002p1umrstyi2ctn"; // Match J5 USAP-Pau 2024-2025

// IDs des joueurs USAP
const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Warion: "cmmby9px000251ucddkb7y9j3",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Brazo: "cmmby9q5t002b1ucdgw3ikj36",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  Aucagne: "cmmby9riq00381ucdzmy4nusa",
  Dubois: "cmmby9rwn003h1ucdavvw842q",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  Dupichot: "cmmby9t3k004b1ucdtmx0zek2",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Fakatika: "cmmby9p6p001n1ucdxt02xbuc",
  Orie: "cmmby9pk0001w1ucdhzjt30qx",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

// Remplacements
const REPLACEMENTS = [
  { out: "Lam", in: "Ruiz", min: 42 },
  { out: "Della Schiava", in: "Oviedo", min: 42 },
  { out: "Aucagne", in: "Allan", min: 42 },
  { out: "Fa'aso'o", in: "Orie", min: 47 },
  { out: "Beria", in: "Fakatika", min: 59 },
];

// Titulaires qui jouent 80 minutes complètes
const FULL_MATCH_STARTERS = [
  "Brookes",
  "Warion",
  "Brazo",
  "Velarte",
  "Ecochard",
  "Dubois",
  "De La Fuente",
  "Naqalevu",
  "Joseph",
  "Dupichot",
];

// Remplaçants non utilisés
const UNUSED_SUBS = ["Aprasidze", "Buliruarua", "Ceccarelli"];

async function main() {
  console.log(
    "=== Ajout des minutes jouées - USAP vs Pau (J5, 05/10/2024) ===\n"
  );

  // ---------------------------------------------------------------
  // 1. Titulaires 80 minutes
  // ---------------------------------------------------------------
  console.log("--- Titulaires 80 minutes ---");
  for (const name of FULL_MATCH_STARTERS) {
    const playerId = PLAYER_IDS[name];
    const mp = await prisma.matchPlayer.findFirst({
      where: { matchId: MATCH_ID, playerId, isOpponent: false },
    });
    if (mp) {
      await prisma.matchPlayer.update({
        where: { id: mp.id },
        data: { minutesPlayed: 80 },
      });
      console.log(`  ${name} : 80'`);
    } else {
      console.log(`  ⚠ ${name} non trouvé`);
    }
  }

  // ---------------------------------------------------------------
  // 2. Remplaçants non utilisés (0 minutes)
  // ---------------------------------------------------------------
  console.log("\n--- Remplaçants non utilisés ---");
  for (const name of UNUSED_SUBS) {
    const playerId = PLAYER_IDS[name];
    const mp = await prisma.matchPlayer.findFirst({
      where: { matchId: MATCH_ID, playerId, isOpponent: false },
    });
    if (mp) {
      await prisma.matchPlayer.update({
        where: { id: mp.id },
        data: { minutesPlayed: 0 },
      });
      console.log(`  ${name} : 0'`);
    }
  }

  // ---------------------------------------------------------------
  // 3. Remplacements
  // ---------------------------------------------------------------
  console.log("\n--- Remplacements ---");
  for (const rep of REPLACEMENTS) {
    const outId = PLAYER_IDS[rep.out];
    const inId = PLAYER_IDS[rep.in];

    const outMp = await prisma.matchPlayer.findFirst({
      where: { matchId: MATCH_ID, playerId: outId, isOpponent: false },
    });
    if (outMp) {
      await prisma.matchPlayer.update({
        where: { id: outMp.id },
        data: { subOut: rep.min, minutesPlayed: rep.min },
      });
    }

    const inMp = await prisma.matchPlayer.findFirst({
      where: { matchId: MATCH_ID, playerId: inId, isOpponent: false },
    });
    if (inMp) {
      await prisma.matchPlayer.update({
        where: { id: inMp.id },
        data: { subIn: rep.min, minutesPlayed: 80 - rep.min },
      });
    }

    console.log(`  ${rep.min}' ${rep.out} → ${rep.in} (${rep.out}: ${rep.min}', ${rep.in}: ${80 - rep.min}')`);
  }

  // ---------------------------------------------------------------
  // 4. Événements de remplacement
  // ---------------------------------------------------------------
  console.log("\n--- Événements de remplacement ---");

  const replacementEvents = [
    {
      minute: 42,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Lam"],
      isUsap: true,
      description: "Sortie de Seilala Lam. Remplacé par Isaac Ruiz.",
    },
    {
      minute: 42,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Ruiz"],
      isUsap: true,
      description: "Entrée d'Isaac Ruiz en remplacement de Lam.",
    },
    {
      minute: 42,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Della Schiava"],
      isUsap: true,
      description: "Sortie de Noé Della Schiava. Remplacé par Juan Manuel Oviedo.",
    },
    {
      minute: 42,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Oviedo"],
      isUsap: true,
      description: "Entrée de Juan Manuel Oviedo en remplacement de Della Schiava.",
    },
    {
      minute: 42,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Aucagne"],
      isUsap: true,
      description: "Sortie d'Antoine Aucagne. Remplacé par Tommaso Allan.",
    },
    {
      minute: 42,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Entrée de Tommaso Allan en remplacement d'Aucagne.",
    },
    {
      minute: 47,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Fa'aso'o"],
      isUsap: true,
      description: "Sortie de So'otala Fa'aso'o. Remplacé par Marvin Orie.",
    },
    {
      minute: 47,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Orie"],
      isUsap: true,
      description: "Entrée de Marvin Orie en remplacement de Fa'aso'o.",
    },
    {
      minute: 59,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Beria"],
      isUsap: true,
      description: "Sortie de Giorgi Beria. Remplacé par Akato Fakatika.",
    },
    {
      minute: 59,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Fakatika"],
      isUsap: true,
      description: "Entrée d'Akato Fakatika en remplacement de Beria.",
    },
  ];

  for (const evt of replacementEvents) {
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
    console.log(`  ${String(evt.minute).padStart(2, " ")}' ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Titulaires 80' : 10 joueurs");
  console.log("  Remplacements : 5 (3 non utilisés : Aprasidze, Buliruarua, Ceccarelli)");
  console.log(`  Événements ajoutés : ${replacementEvents.length}`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

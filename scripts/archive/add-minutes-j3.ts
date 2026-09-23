/**
 * Script d'ajout des minutes jouées pour le match Castres - USAP (J3 Top 14, 21/09/2024)
 *
 * Remplacements USAP reconstitués (sources : eurosport.fr, allrugby.com) :
 *  48' Duguivalu → Naqalevu
 *  56' Aprasidze → Ecochard
 *  59' Warion → Labouteley
 *  59' Velarte → Fa'aso'o
 *  61' Montgaillard → Jintcharadze
 *  61' Beria → Fakatika
 *  61' Dupichot → McIntyre
 *  61' Brookes → Roelofse
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-minutes-j3.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs3y002l1umr5v46hgpc"; // Match J3 Castres-USAP 2024-2025

// IDs des joueurs USAP
const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Montgaillard: "cmmby9op3001b1ucd027i2f17",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Tuilagi: "cmmby9pso00221ucdwnmxzccc",
  Warion: "cmmby9px000251ucddkb7y9j3",
  "Van Tonder": "cmmby9qj4002k1ucdmg0rggp5",
  Brazo: "cmmby9q5t002b1ucdgw3ikj36",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Aucagne: "cmmby9riq00381ucdzmy4nusa",
  Dubois: "cmmby9rwn003h1ucdavvw842q",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  Dupichot: "cmmby9t3k004b1ucdtmx0zek2",
  Labouteley: "cmmby9pfj001t1ucd75p7hi07",
  Fakatika: "cmmby9p6p001n1ucdxt02xbuc",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  McIntyre: "cmmby9ro0003b1ucd388eacr8",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Roelofse: "cmmby9pb4001q1ucdi9hhgjrr",
};

// Jintcharadze : ID à récupérer dynamiquement (créé par update-match-j3.ts)
let JINTCHARADZE_ID = "";

// Remplacements : { out: joueur sorti, in: joueur entré, minute }
const REPLACEMENTS = [
  { out: "Duguivalu", in: "Naqalevu", min: 48 },
  { out: "Aprasidze", in: "Ecochard", min: 56 },
  { out: "Warion", in: "Labouteley", min: 59 },
  { out: "Velarte", in: "Fa'aso'o", min: 59 },
  { out: "Montgaillard", in: "Jintcharadze", min: 61 },
  { out: "Beria", in: "Fakatika", min: 61 },
  { out: "Dupichot", in: "McIntyre", min: 61 },
  { out: "Brookes", in: "Roelofse", min: 61 },
];

// Titulaires qui jouent 80 minutes complètes
const FULL_MATCH_STARTERS = [
  "Tuilagi",
  "Van Tonder",
  "Brazo",
  "Aucagne",
  "Dubois",
  "Buliruarua",
  "Joseph",
];

async function main() {
  console.log(
    "=== Ajout des minutes jouées - Castres vs USAP (J3, 21/09/2024) ===\n"
  );

  // Récupérer l'ID de Jintcharadze
  const jintcharadze = await prisma.player.findFirst({
    where: { lastName: "Jintcharadze" },
  });
  if (!jintcharadze) {
    console.error("⚠ Jintcharadze non trouvé en base ! Lancez d'abord update-match-j3.ts");
    return;
  }
  JINTCHARADZE_ID = jintcharadze.id;
  PLAYER_IDS["Jintcharadze"] = JINTCHARADZE_ID;
  console.log(`  Jintcharadze trouvé : ${JINTCHARADZE_ID}`);

  // ---------------------------------------------------------------
  // 1. Mettre à jour les titulaires qui jouent 80 minutes
  // ---------------------------------------------------------------
  console.log("\n--- Titulaires 80 minutes ---");
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
  // 2. Mettre à jour les remplacements
  // ---------------------------------------------------------------
  console.log("\n--- Remplacements ---");
  for (const rep of REPLACEMENTS) {
    const outId = PLAYER_IDS[rep.out];
    const inId = PLAYER_IDS[rep.in];

    // Joueur sorti
    const outMp = await prisma.matchPlayer.findFirst({
      where: { matchId: MATCH_ID, playerId: outId, isOpponent: false },
    });
    if (outMp) {
      await prisma.matchPlayer.update({
        where: { id: outMp.id },
        data: { subOut: rep.min, minutesPlayed: rep.min },
      });
    }

    // Joueur entré
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
  // 3. Ajouter les événements de remplacement dans la timeline
  // ---------------------------------------------------------------
  console.log("\n--- Événements de remplacement ---");

  const replacementEvents = [
    {
      minute: 48,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Duguivalu"],
      isUsap: true,
      description: "Sortie d'Alivereti Duguivalu. Remplacé par Apisai Naqalevu.",
    },
    {
      minute: 48,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Naqalevu"],
      isUsap: true,
      description: "Entrée d'Apisai Naqalevu en remplacement de Duguivalu.",
    },
    {
      minute: 56,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Aprasidze"],
      isUsap: true,
      description: "Sortie de Gela Aprasidze. Remplacé par Tom Ecochard.",
    },
    {
      minute: 56,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Ecochard"],
      isUsap: true,
      description: "Entrée de Tom Ecochard en remplacement d'Aprasidze.",
    },
    {
      minute: 59,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Warion"],
      isUsap: true,
      description: "Sortie d'Adrien Warion. Remplacé par Théo Labouteley.",
    },
    {
      minute: 59,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Labouteley"],
      isUsap: true,
      description: "Entrée de Théo Labouteley en remplacement de Warion.",
    },
    {
      minute: 59,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Velarte"],
      isUsap: true,
      description: "Sortie de Lucas Velarte. Remplacé par So'otala Fa'aso'o.",
    },
    {
      minute: 59,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Fa'aso'o"],
      isUsap: true,
      description: "Entrée de So'otala Fa'aso'o en remplacement de Velarte.",
    },
    {
      minute: 61,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Montgaillard"],
      isUsap: true,
      description: "Sortie de Victor Montgaillard. Remplacé par Vakhtang Jintcharadze.",
    },
    {
      minute: 61,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: JINTCHARADZE_ID,
      isUsap: true,
      description: "Entrée de Vakhtang Jintcharadze en remplacement de Montgaillard.",
    },
    {
      minute: 61,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Beria"],
      isUsap: true,
      description: "Sortie de Giorgi Beria. Remplacé par Akato Fakatika.",
    },
    {
      minute: 61,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Fakatika"],
      isUsap: true,
      description: "Entrée d'Akato Fakatika en remplacement de Beria.",
    },
    {
      minute: 61,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Dupichot"],
      isUsap: true,
      description: "Sortie de Louis Dupichot. Remplacé par Jake McIntyre.",
    },
    {
      minute: 61,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["McIntyre"],
      isUsap: true,
      description: "Entrée de Jake McIntyre en remplacement de Dupichot.",
    },
    {
      minute: 61,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Brookes"],
      isUsap: true,
      description: "Sortie de Kieran Brookes. Remplacé par Nemo Roelofse.",
    },
    {
      minute: 61,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Roelofse"],
      isUsap: true,
      description: "Entrée de Nemo Roelofse en remplacement de Brookes.",
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
  console.log("  Titulaires 80' : 7 joueurs (Tuilagi, Van Tonder, Brazo, Aucagne, Dubois, Buliruarua, Joseph)");
  console.log("  Remplacements : 8 (tous les remplaçants utilisés)");
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

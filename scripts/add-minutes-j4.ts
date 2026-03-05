/**
 * Script d'ajout des minutes jouées pour le match USAP - Clermont (J4 Top 14, 28/09/2024)
 *
 * Remplacements USAP reconstitués (sources : allrugby.com, eurosport.fr) :
 *  17' Tuilagi → Warion (blessure fracture tibia-péroné)
 *  39' Van Tonder → Brazo
 *  52' Bachelier → Fa'aso'o
 *  54' Ecochard → Aprasidze
 *  55' Lam → Montgaillard
 *  58' Brookes → Ceccarelli
 *  67' Beria → Fakatika
 *  Veredamu non utilisé.
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-minutes-j4.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs4u002n1umrpa2sded8"; // Match J4 USAP-Clermont 2024-2025

// IDs des joueurs USAP
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

// Remplacements : { out: joueur sorti, in: joueur entré, minute }
const REPLACEMENTS = [
  { out: "Tuilagi", in: "Warion", min: 17 },
  { out: "Van Tonder", in: "Brazo", min: 39 },
  { out: "Bachelier", in: "Fa'aso'o", min: 52 },
  { out: "Ecochard", in: "Aprasidze", min: 54 },
  { out: "Lam", in: "Montgaillard", min: 55 },
  { out: "Brookes", in: "Ceccarelli", min: 58 },
  { out: "Beria", in: "Fakatika", min: 67 },
];

// Titulaires qui jouent 80 minutes complètes
const FULL_MATCH_STARTERS = [
  "Orie",
  "Velarte",
  "McIntyre",
  "Dubois",
  "De La Fuente",
  "Naqalevu",
  "Joseph",
  "Aucagne",
];

async function main() {
  console.log(
    "=== Ajout des minutes jouées - USAP vs Clermont (J4, 28/09/2024) ===\n"
  );

  // ---------------------------------------------------------------
  // 1. Mettre à jour les titulaires qui jouent 80 minutes
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
  // 2. Veredamu : non utilisé (0 minutes)
  // ---------------------------------------------------------------
  console.log("\n--- Remplaçant non utilisé ---");
  const veredamuMp = await prisma.matchPlayer.findFirst({
    where: { matchId: MATCH_ID, playerId: PLAYER_IDS["Veredamu"], isOpponent: false },
  });
  if (veredamuMp) {
    await prisma.matchPlayer.update({
      where: { id: veredamuMp.id },
      data: { minutesPlayed: 0 },
    });
    console.log("  Veredamu : 0' (non utilisé)");
  }

  // ---------------------------------------------------------------
  // 3. Mettre à jour les remplacements
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
  // 4. Ajouter les événements de remplacement (sauf Tuilagi/Warion déjà présents)
  // ---------------------------------------------------------------
  console.log("\n--- Événements de remplacement ---");

  // Le remplacement Tuilagi→Warion (17') est déjà dans la timeline du match
  // On ajoute seulement les autres
  const replacementEvents = [
    {
      minute: 39,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Van Tonder"],
      isUsap: true,
      description: "Sortie de Jacobus Van Tonder. Remplacé par Alan Brazo.",
    },
    {
      minute: 39,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Brazo"],
      isUsap: true,
      description: "Entrée d'Alan Brazo en remplacement de Van Tonder.",
    },
    {
      minute: 52,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Bachelier"],
      isUsap: true,
      description: "Sortie de Lucas Bachelier. Remplacé par So'otala Fa'aso'o.",
    },
    {
      minute: 52,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Fa'aso'o"],
      isUsap: true,
      description: "Entrée de So'otala Fa'aso'o en remplacement de Bachelier.",
    },
    {
      minute: 54,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Ecochard"],
      isUsap: true,
      description: "Sortie de Tom Ecochard. Remplacé par Gela Aprasidze.",
    },
    {
      minute: 54,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Aprasidze"],
      isUsap: true,
      description: "Entrée de Gela Aprasidze en remplacement d'Ecochard.",
    },
    {
      minute: 55,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Lam"],
      isUsap: true,
      description: "Sortie de Seilala Lam. Remplacé par Victor Montgaillard.",
    },
    {
      minute: 55,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Montgaillard"],
      isUsap: true,
      description: "Entrée de Victor Montgaillard en remplacement de Lam.",
    },
    {
      minute: 58,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Brookes"],
      isUsap: true,
      description: "Sortie de Kieran Brookes. Remplacé par Pietro Ceccarelli.",
    },
    {
      minute: 58,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Ceccarelli"],
      isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes.",
    },
    {
      minute: 67,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Beria"],
      isUsap: true,
      description: "Sortie de Giorgi Beria. Remplacé par Akato Fakatika.",
    },
    {
      minute: 67,
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
  console.log("  Titulaires 80' : 8 joueurs (Orie, Velarte, McIntyre, Dubois, De La Fuente, Naqalevu, Joseph, Aucagne)");
  console.log("  Remplacements : 7 (Veredamu non utilisé)");
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

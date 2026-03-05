/**
 * Script d'ajout des minutes jouées pour le match USAP - Montpellier (J2 Top 14, 14/09/2024)
 *
 * Remplacements USAP reconstitués (sources : allrugby.com, itsrugby.fr) :
 *  22' Ceccarelli → Brookes
 *  35' Lam → Montgaillard
 *  36' Devaux → Beria
 *  54' Allan → Joseph
 *  57' Ecochard → Aprasidze
 *  60' Sobela → Bachelier
 *  60' Tuilagi → Warion
 *  68' Duguivalu → Buliruarua
 *  73' Crossdale sort blessé (pas de remplaçant, USAP finit à 14)
 *
 * Exécution : npx tsx scripts/add-minutes-j2.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs31002j1umro8j79pb1"; // Match J2 USAP-Montpellier 2024-2025

// IDs des joueurs USAP
const PLAYER_IDS: Record<string, string> = {
  Devaux: "cmmby9obz00121ucdcgxy6k3w",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
  Orie: "cmmby9pk0001w1ucdhzjt30qx",
  Tuilagi: "cmmby9pso00221ucdwnmxzccc",
  "Van Tonder": "cmmby9qj4002k1ucdmg0rggp5",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
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
  Warion: "cmmby9px000251ucddkb7y9j3",
  Bachelier: "cmmby9q1g00281ucdpzfoultm",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
};

// Remplacements : { out: joueur sorti, in: joueur entré, minute }
const REPLACEMENTS = [
  { out: "Ceccarelli", in: "Brookes", min: 22 },
  { out: "Lam", in: "Montgaillard", min: 35 },
  { out: "Devaux", in: "Beria", min: 36 },
  { out: "Allan", in: "Joseph", min: 54 },
  { out: "Ecochard", in: "Aprasidze", min: 57 },
  { out: "Sobela", in: "Bachelier", min: 60 },
  { out: "Tuilagi", in: "Warion", min: 60 },
  { out: "Duguivalu", in: "Buliruarua", min: 68 },
];

// Crossdale sort blessé à 73' sans remplacement
const INJURY_EXIT = { player: "Crossdale", min: 73 };

// Titulaires qui jouent 80 minutes complètes (pas remplacés)
const FULL_MATCH_STARTERS = [
  "Orie",
  "Van Tonder",
  "Fa'aso'o",
  "McIntyre",
  "De La Fuente",
  "Veredamu",
];

async function main() {
  console.log(
    "=== Ajout des minutes jouées - USAP vs Montpellier (J2, 14/09/2024) ===\n"
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
  // 3. Crossdale : sorti blessé à 73' sans remplacement
  // ---------------------------------------------------------------
  console.log("\n--- Sortie sur blessure ---");
  const crossdaleId = PLAYER_IDS[INJURY_EXIT.player];
  const crossdaleMp = await prisma.matchPlayer.findFirst({
    where: { matchId: MATCH_ID, playerId: crossdaleId, isOpponent: false },
  });
  if (crossdaleMp) {
    await prisma.matchPlayer.update({
      where: { id: crossdaleMp.id },
      data: {
        subOut: INJURY_EXIT.min,
        minutesPlayed: INJURY_EXIT.min,
        notes: "Sorti sur blessure, pas de remplaçant (tous les remplaçants déjà utilisés). USAP finit à 14.",
      },
    });
    console.log(`  ${INJURY_EXIT.min}' ${INJURY_EXIT.player} sort blessé (${INJURY_EXIT.min}', pas de remplaçant)`);
  }

  // ---------------------------------------------------------------
  // 4. Ajouter les événements de remplacement dans la timeline
  // ---------------------------------------------------------------
  console.log("\n--- Événements de remplacement ---");

  const replacementEvents = [
    {
      minute: 22,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Ceccarelli"],
      isUsap: true,
      description: "Sortie de Pietro Ceccarelli. Remplacé par Kieran Brookes.",
    },
    {
      minute: 22,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Brookes"],
      isUsap: true,
      description: "Entrée de Kieran Brookes en remplacement de Ceccarelli.",
    },
    {
      minute: 35,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Lam"],
      isUsap: true,
      description: "Sortie de Seilala Lam (blessure). Remplacé par Victor Montgaillard.",
    },
    {
      minute: 35,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Montgaillard"],
      isUsap: true,
      description: "Entrée de Victor Montgaillard en remplacement de Lam.",
    },
    {
      minute: 36,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Devaux"],
      isUsap: true,
      description: "Sortie de Bruce Devaux (blessure). Remplacé par Giorgi Beria.",
    },
    {
      minute: 36,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Beria"],
      isUsap: true,
      description: "Entrée de Giorgi Beria en remplacement de Devaux.",
    },
    {
      minute: 54,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Sortie de Tommaso Allan (blessure). Remplacé par Jefferson Joseph.",
    },
    {
      minute: 54,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Joseph"],
      isUsap: true,
      description: "Entrée de Jefferson Joseph en remplacement d'Allan.",
    },
    {
      minute: 57,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Ecochard"],
      isUsap: true,
      description: "Sortie de Tom Ecochard. Remplacé par Gela Aprasidze.",
    },
    {
      minute: 57,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Aprasidze"],
      isUsap: true,
      description: "Entrée de Gela Aprasidze en remplacement d'Ecochard.",
    },
    {
      minute: 60,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Sobela"],
      isUsap: true,
      description: "Sortie de Patrick Sobela. Remplacé par Lucas Bachelier.",
    },
    {
      minute: 60,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Bachelier"],
      isUsap: true,
      description: "Entrée de Lucas Bachelier en remplacement de Sobela.",
    },
    {
      minute: 60,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Tuilagi"],
      isUsap: true,
      description: "Sortie de Posolo Tuilagi (blessure). Remplacé par Adrien Warion.",
    },
    {
      minute: 60,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Warion"],
      isUsap: true,
      description: "Entrée d'Adrien Warion en remplacement de Tuilagi.",
    },
    {
      minute: 68,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Duguivalu"],
      isUsap: true,
      description: "Sortie d'Alivereti Duguivalu. Remplacé par Riko Buliruarua.",
    },
    {
      minute: 68,
      type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Buliruarua"],
      isUsap: true,
      description: "Entrée de Riko Buliruarua en remplacement de Duguivalu.",
    },
    {
      minute: 73,
      type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Crossdale"],
      isUsap: true,
      description:
        "Sortie d'Ali Crossdale sur blessure. Pas de remplaçant disponible, USAP finit à 14.",
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
  console.log("  Titulaires 80' : 6 joueurs (Orie, Van Tonder, Fa'aso'o, McIntyre, De La Fuente, Veredamu)");
  console.log("  Remplacements : 8 (tous les remplaçants utilisés)");
  console.log("  Sortie blessure sans remplacement : Crossdale (73')");
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

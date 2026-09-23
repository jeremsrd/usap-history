/**
 * Script d'ajout des minutes jouées pour le match UBB - USAP (J6 Top 14, 12/10/2024)
 *
 * Remplacements USAP reconstitués (source : itsrugby.fr, all.rugby) :
 *  34' Crossdale → Buliruarua (blessure)
 *  44' Naqalevu CARTON ROUGE (pas de remplacement)
 *  47' Boyer Gallardo → Tetrashvili
 *  47' Ceccarelli → Fakatika
 *  47' Aprasidze → Deghmache
 *  47' Sobela → Bachelier
 *  47' Montgaillard → Jintcharadze
 *  51' Tanguy → Orie
 *  51' Della Schiava → Bouthier
 *  Non utilisés : aucun (tous les 8 remplaçants ont joué)
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-minutes-j6.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs6m002r1umrlrrtnd1z"; // Match J6 UBB-USAP 2024-2025

// IDs des joueurs USAP
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
  // Bouthier sera récupéré dynamiquement
  Deghmache: "cmmby9r5f002z1ucddjqpjyiq",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Fakatika: "cmmby9p6p001n1ucdxt02xbuc",
};

// Remplacements
const REPLACEMENTS = [
  { out: "Crossdale", in: "Buliruarua", min: 34 },
  { out: "Boyer Gallardo", in: "Tetrashvili", min: 47 },
  { out: "Ceccarelli", in: "Fakatika", min: 47 },
  { out: "Aprasidze", in: "Deghmache", min: 47 },
  { out: "Sobela", in: "Bachelier", min: 47 },
  { out: "Montgaillard", in: "Jintcharadze", min: 47 },
  { out: "Tanguy", in: "Orie", min: 51 },
  { out: "Della Schiava", in: "Bouthier", min: 51 },
];

// Titulaires qui jouent 80 minutes complètes
const FULL_MATCH_STARTERS = [
  "Labouteley",
  "Fa'aso'o",
  "Aucagne",
  "Baraque",
  "Veredamu",
  "Dupichot",
];

async function main() {
  console.log(
    "=== Ajout des minutes jouées - UBB vs USAP (J6, 12/10/2024) ===\n"
  );

  // Récupérer l'ID de Bouthier (créé par update-match-j6.ts)
  const bouthier = await prisma.player.findFirst({
    where: { lastName: "Bouthier" },
  });
  if (!bouthier) {
    console.error("⚠ Bouthier non trouvé en base ! Lancez d'abord update-match-j6.ts");
    return;
  }
  PLAYER_IDS["Bouthier"] = bouthier.id;
  console.log(`  Bouthier trouvé : ${bouthier.id}`);

  // ---------------------------------------------------------------
  // 1. Titulaires 80 minutes
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
  // 2. Naqalevu : carton rouge à 44' (joue 44 minutes)
  // ---------------------------------------------------------------
  console.log("\n--- Carton rouge ---");
  const naqalevuMp = await prisma.matchPlayer.findFirst({
    where: { matchId: MATCH_ID, playerId: PLAYER_IDS["Naqalevu"], isOpponent: false },
  });
  if (naqalevuMp) {
    await prisma.matchPlayer.update({
      where: { id: naqalevuMp.id },
      data: { minutesPlayed: 44 },
    });
    console.log("  Naqalevu : 44' (carton rouge)");
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
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Titulaires 80' : 6 joueurs (Labouteley, Fa'aso'o, Aucagne, Baraque, Veredamu, Dupichot)");
  console.log("  Carton rouge : Naqalevu (44')");
  console.log("  Remplacements : 8 (tous les remplaçants utilisés)");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

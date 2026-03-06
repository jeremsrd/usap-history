/**
 * Script d'ajout des minutes jouées pour le match USAP - LOU Rugby (J7 Top 14, 19/10/2024)
 *
 * Remplacements USAP reconstitués (sources : all.rugby, lourugby.fr, francebleu.fr) :
 *  40' Dubois → Dupichot (blessure jambe gauche)
 *  52' Velarte → Sobela
 *  52' Warion → Tanguy (HIA temporaire)
 *  53' Dupichot → Aprasidze (HIA temporaire, 1 minute)
 *  53' Aprasidze → Dupichot (Dupichot passe HIA, retour)
 *  56' Tanguy → Fa'aso'o
 *  56' Ecochard → Aprasidze
 *  56' Brookes → Ceccarelli
 *  61' Beria → Tetrashvili
 *  75' Oviedo → Warion (retour HIA, Warion passe l'évaluation)
 *  Non utilisé : Montgaillard
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-minutes-j7.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs7h002t1umrliehntag"; // Match J7 USAP-Lyon 2024-2025

// IDs des joueurs USAP
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

// Remplacements permanents
const REPLACEMENTS = [
  { out: "Dubois", in: "Dupichot", min: 40 },
  { out: "Velarte", in: "Sobela", min: 52 },
  { out: "Ecochard", in: "Aprasidze", min: 56 },
  { out: "Brookes", in: "Ceccarelli", min: 56 },
  { out: "Beria", in: "Tetrashvili", min: 61 },
];

// Titulaires qui jouent 80 minutes complètes
const FULL_MATCH_STARTERS = [
  "Ruiz",
  "Orie",
  "Brazo",
  "Allan",
  "De La Fuente",
  "Buliruarua",
  "Veredamu",
  "Aucagne",
];

async function main() {
  console.log(
    "=== Ajout des minutes jouées - USAP vs LOU (J7, 19/10/2024) ===\n"
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
  // 2. Remplacements permanents classiques
  // ---------------------------------------------------------------
  console.log("\n--- Remplacements permanents ---");
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
  // 3. Cas spéciaux : Warion (HIA), Tanguy, Fa'aso'o, Oviedo
  // ---------------------------------------------------------------
  console.log("\n--- Cas spéciaux (HIA Warion) ---");

  // Warion : sort à 52' (HIA), revient à 75' pour remplacer Oviedo
  // Temps total sur le terrain : 52 + (80-75) = 57 minutes
  const warionMp = await prisma.matchPlayer.findFirst({
    where: { matchId: MATCH_ID, playerId: PLAYER_IDS["Warion"], isOpponent: false },
  });
  if (warionMp) {
    await prisma.matchPlayer.update({
      where: { id: warionMp.id },
      data: { subOut: 52, minutesPlayed: 57 },
    });
    console.log("  Warion : 57' (0-52' + 75'-80', HIA à 52', retour à 75')");
  }

  // Tanguy : entre à 52' (HIA temp pour Warion), sort à 56'
  // Temps sur le terrain : 4 minutes
  const tanguyMp = await prisma.matchPlayer.findFirst({
    where: { matchId: MATCH_ID, playerId: PLAYER_IDS["Tanguy"], isOpponent: false },
  });
  if (tanguyMp) {
    await prisma.matchPlayer.update({
      where: { id: tanguyMp.id },
      data: { subIn: 52, subOut: 56, minutesPlayed: 4 },
    });
    console.log("  Tanguy : 4' (52'-56', remplacement temporaire HIA)");
  }

  // Fa'aso'o : entre à 56' (remplace Tanguy), joue jusqu'à 80'
  const faasooMp = await prisma.matchPlayer.findFirst({
    where: { matchId: MATCH_ID, playerId: PLAYER_IDS["Fa'aso'o"], isOpponent: false },
  });
  if (faasooMp) {
    await prisma.matchPlayer.update({
      where: { id: faasooMp.id },
      data: { subIn: 56, minutesPlayed: 24 },
    });
    console.log("  Fa'aso'o : 24' (56'-80')");
  }

  // Oviedo : sort à 75' (remplacé par le retour de Warion)
  const oviedoMp = await prisma.matchPlayer.findFirst({
    where: { matchId: MATCH_ID, playerId: PLAYER_IDS["Oviedo"], isOpponent: false },
  });
  if (oviedoMp) {
    await prisma.matchPlayer.update({
      where: { id: oviedoMp.id },
      data: { subOut: 75, minutesPlayed: 75 },
    });
    console.log("  Oviedo : 75' (sort à 75')");
  }

  // Dupichot : entre à 40' pour Dubois blessé, joue jusqu'à 80'
  // (courte sortie HIA 52'-53' non comptabilisée)
  const dupichotMp = await prisma.matchPlayer.findFirst({
    where: { matchId: MATCH_ID, playerId: PLAYER_IDS["Dupichot"], isOpponent: false },
  });
  if (dupichotMp) {
    await prisma.matchPlayer.update({
      where: { id: dupichotMp.id },
      data: { subIn: 40, minutesPlayed: 40 },
    });
    console.log("  Dupichot : 40' (40'-80', HIA temp 52'-53' non comptabilisé)");
  }

  // Montgaillard : non utilisé
  console.log("\n--- Non utilisé ---");
  console.log("  Montgaillard : 0' (resté sur le banc)");

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Titulaires 80' : 8 joueurs");
  console.log("  Remplacements permanents : 5");
  console.log("  Cas spéciaux HIA : Warion (52'-75'), Dupichot (52'-53')");
  console.log("  Non utilisé : Montgaillard");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

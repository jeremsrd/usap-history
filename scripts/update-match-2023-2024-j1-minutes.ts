/**
 * Mise à jour des minutes jouées et remplacements — J1 2023-2024
 * USAP 7 - 29 Stade Français Paris (19/08/2023)
 *
 * + Correction capitaine : McIntyre (et non Barraque)
 *
 * Sources : itsrugby.fr, top14.lnr.fr
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j1-minutes.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// =============================================================================
// DONNÉES DE REMPLACEMENTS
// =============================================================================

// USAP : 8 remplacements
// Source : itsrugby.fr/match-stat-238070.html
const USAP_SUBS: Array<{
  outLastName: string;
  inLastName: string;
  minute: number;
}> = [
  { outLastName: "Tetrashvili", inLastName: "Lotrian", minute: 28 },
  { outLastName: "Van Tonder", inLastName: "Brazo", minute: 40 },
  { outLastName: "Joly", inLastName: "Fakatika", minute: 41 },
  { outLastName: "Maurouard", inLastName: "Montgaillard", minute: 49 },
  { outLastName: "Naqalevu", inLastName: "Acebes", minute: 49 },
  { outLastName: "Labouteley", inLastName: "Eru", minute: 52 },
  { outLastName: "Veredamu", inLastName: "Dubois", minute: 52 },
  { outLastName: "McIntyre", inLastName: "Rodor", minute: 60 },
];

// Stade Français : 7 remplacements (Alo-Emile non entré)
const SF_SUBS: Array<{
  outLastName: string;
  inLastName: string;
  minute: number;
}> = [
  { outLastName: "Kakovin", inLastName: "Abramishvili", minute: 28 },
  { outLastName: "Gimbert", inLastName: "Kockott", minute: 55 },
  { outLastName: "Etien", inLastName: "Boudehent", minute: 55 },
  { outLastName: "Ivaldi", inLastName: "Peyresblanques", minute: 58 },
  { outLastName: "Azagoh", inLastName: "Van der Mescht", minute: 59 },
  { outLastName: "Barré", inLastName: "Hamdaoui", minute: 61 },
  { outLastName: "Pesenti", inLastName: "Chapuis", minute: 61 },
];

// =============================================================================
// HELPERS
// =============================================================================

async function findMatchPlayer(matchId: string, lastName: string, isOpponent: boolean) {
  return prisma.matchPlayer.findFirst({
    where: {
      matchId,
      isOpponent,
      player: { lastName: { equals: lastName, mode: "insensitive" } },
    },
    include: { player: true },
  });
}

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log("=== Minutes jouées & capitaine — J1 2023-2024 ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 1,
      competition: { shortName: "Top 14" },
    },
  });
  console.log(`Match : ${match.id}\n`);

  // -----------------------------------------------------------------------
  // 1. Corriger le capitaine : McIntyre (pas Barraque)
  // -----------------------------------------------------------------------
  console.log("--- Capitaine ---");

  // Retirer le capitanat de Barraque
  const barraque = await findMatchPlayer(match.id, "Barraque", false);
  if (barraque?.isCaptain) {
    await prisma.matchPlayer.update({
      where: { id: barraque.id },
      data: { isCaptain: false },
    });
    console.log("  Barraque : capitaine retiré");
  }

  // Mettre McIntyre capitaine
  const mcintyre = await findMatchPlayer(match.id, "McIntyre", false);
  if (mcintyre) {
    await prisma.matchPlayer.update({
      where: { id: mcintyre.id },
      data: { isCaptain: true },
    });
    console.log("  McIntyre : capitaine ✓");
  }

  // -----------------------------------------------------------------------
  // 2. Minutes jouées USAP
  // -----------------------------------------------------------------------
  console.log("\n--- USAP : minutes jouées ---");

  // Récupérer tous les MatchPlayer USAP
  const usapPlayers = await prisma.matchPlayer.findMany({
    where: { matchId: match.id, isOpponent: false },
    include: { player: true },
    orderBy: { shirtNumber: "asc" },
  });

  for (const mp of usapPlayers) {
    const lastName = mp.player.lastName;

    // Vérifier si le joueur sort (titulaire remplacé)
    const subOutInfo = USAP_SUBS.find(
      (s) => s.outLastName.toLowerCase() === lastName.toLowerCase()
    );
    // Vérifier si le joueur entre (remplaçant)
    const subInInfo = USAP_SUBS.find(
      (s) => s.inLastName.toLowerCase() === lastName.toLowerCase()
    );

    let minutesPlayed: number;
    let subIn: number | null = null;
    let subOut: number | null = null;

    if (mp.isStarter && subOutInfo) {
      // Titulaire remplacé
      subOut = subOutInfo.minute;
      minutesPlayed = subOutInfo.minute;
    } else if (mp.isStarter) {
      // Titulaire qui joue 80 min
      minutesPlayed = 80;
    } else if (subInInfo) {
      // Remplaçant entré en jeu
      subIn = subInInfo.minute;
      minutesPlayed = 80 - subInInfo.minute;
    } else {
      // Remplaçant non entré
      minutesPlayed = 0;
    }

    await prisma.matchPlayer.update({
      where: { id: mp.id },
      data: { minutesPlayed, subIn, subOut },
    });

    const label = mp.isStarter ? "TIT" : "REM";
    const detail = subOut
      ? `→ sort ${subOut}'`
      : subIn
        ? `← entre ${subIn}'`
        : minutesPlayed === 80
          ? "80'"
          : "non entré";
    console.log(
      `  ${label} ${String(mp.shirtNumber).padStart(2, " ")}. ${mp.player.firstName} ${lastName} — ${minutesPlayed} min ${detail}`
    );
  }

  // -----------------------------------------------------------------------
  // 3. Minutes jouées Stade Français
  // -----------------------------------------------------------------------
  console.log("\n--- Stade Français : minutes jouées ---");

  const sfPlayers = await prisma.matchPlayer.findMany({
    where: { matchId: match.id, isOpponent: true },
    include: { player: true },
    orderBy: { shirtNumber: "asc" },
  });

  for (const mp of sfPlayers) {
    const lastName = mp.player.lastName;

    const subOutInfo = SF_SUBS.find(
      (s) => s.outLastName.toLowerCase() === lastName.toLowerCase()
    );
    const subInInfo = SF_SUBS.find(
      (s) => s.inLastName.toLowerCase() === lastName.toLowerCase()
    );

    let minutesPlayed: number;
    let subIn: number | null = null;
    let subOut: number | null = null;

    if (mp.isStarter && subOutInfo) {
      subOut = subOutInfo.minute;
      minutesPlayed = subOutInfo.minute;
    } else if (mp.isStarter) {
      minutesPlayed = 80;
    } else if (subInInfo) {
      subIn = subInInfo.minute;
      minutesPlayed = 80 - subInInfo.minute;
    } else {
      minutesPlayed = 0;
    }

    await prisma.matchPlayer.update({
      where: { id: mp.id },
      data: { minutesPlayed, subIn, subOut },
    });

    const label = mp.isStarter ? "TIT" : "REM";
    const detail = subOut
      ? `→ sort ${subOut}'`
      : subIn
        ? `← entre ${subIn}'`
        : minutesPlayed === 80
          ? "80'"
          : "non entré";
    console.log(
      `  ${label} ${String(mp.shirtNumber).padStart(2, " ")}. ${mp.player.firstName} ${lastName} — ${minutesPlayed} min ${detail}`
    );
  }

  console.log("\n=== Terminé ===");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

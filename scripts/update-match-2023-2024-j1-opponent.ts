/**
 * Ajout de la composition du Stade Français pour le match J1 2023-2024
 * USAP 7 - 29 Stade Français Paris (19/08/2023)
 *
 * Sources : top14.lnr.fr, eurosport.fr, skysports.com
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j1-opponent.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION STADE FRANÇAIS ===
const SF_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Vasil", lastName: "Kakovin", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, firstName: "Mickaël", lastName: "Ivaldi", position: Position.TALONNEUR, isStarter: true },
  { num: 3, firstName: "Giorgi", lastName: "Melikidze", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, firstName: "Pierre-Henri", lastName: "Azagoh", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, firstName: "Baptiste", lastName: "Pesenti", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, firstName: "Paul", lastName: "Gabrillagues", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, firstName: "Romain", lastName: "Briatte", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, firstName: "Mathieu", lastName: "Hirigoyen", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, firstName: "Jules", lastName: "Gimbert", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, firstName: "Joris", lastName: "Segonds", position: Position.DEMI_OUVERTURE, isStarter: true, isCaptain: true },
  { num: 11, firstName: "Lester", lastName: "Etien", position: Position.AILIER, isStarter: true },
  { num: 12, firstName: "Julien", lastName: "Delbouis", position: Position.CENTRE, isStarter: true },
  { num: 13, firstName: "Jeremy", lastName: "Ward", position: Position.CENTRE, isStarter: true },
  { num: 14, firstName: "Peniasi", lastName: "Dakuwaqa", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Léo", lastName: "Barré", position: Position.ARRIERE, isStarter: true },
  // Remplaçants
  { num: 16, firstName: "Lucas", lastName: "Peyresblanques", position: Position.TALONNEUR, isStarter: false },
  { num: 17, firstName: "Sergo", lastName: "Abramishvili", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, firstName: "Juan John", lastName: "Van der Mescht", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, firstName: "Ryan", lastName: "Chapuis", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, firstName: "Rory", lastName: "Kockott", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, firstName: "Pierre", lastName: "Boudehent", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, firstName: "Kylan", lastName: "Hamdaoui", position: Position.ARRIERE, isStarter: false },
  { num: 23, firstName: "Moses", lastName: "Alo-Emile", position: Position.PILIER_DROIT, isStarter: false },
];

/** Trouve ou crée un joueur adversaire */
async function findOrCreateOpponentPlayer(
  firstName: string,
  lastName: string,
  position: Position,
): Promise<string> {
  const existing = await prisma.player.findFirst({
    where: {
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
  });
  if (existing) return existing.id;

  const player = await prisma.player.create({
    data: {
      firstName,
      lastName,
      position,
      isActive: false,
      slug: `temp-${Date.now()}-${Math.random()}`,
    },
  });
  await prisma.player.update({
    where: { id: player.id },
    data: { slug: generatePlayerSlug(firstName, lastName, player.id) },
  });
  console.log(`  [nouveau] ${firstName} ${lastName}`);
  return player.id;
}

async function main() {
  console.log("=== Composition Stade Français — J1 2023-2024 ===\n");

  // Trouver le match
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 1,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });
  console.log(`Match : ${match.slug} (${match.id})\n`);

  // Supprimer les éventuels MatchPlayer adverses existants
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: match.id, isOpponent: true },
  });
  if (deleted.count > 0) console.log(`${deleted.count} entrée(s) adverses supprimée(s)\n`);

  // Créer les 23 joueurs + MatchPlayer
  for (const p of SF_SQUAD) {
    const playerId = await findOrCreateOpponentPlayer(p.firstName, p.lastName, p.position);

    // Stats individuelles
    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;
    let yellowCard = false, yellowCardMin: number | null = null;

    // Ivaldi : 1 essai (5') = 5 pts
    if (p.lastName === "Ivaldi") {
      tries = 1;
      totalPoints = 5;
    }
    // Segonds : 2 transformations + 5 pénalités = 4 + 15 = 19 pts
    // Correction : 1 transformation (5') + 5 pénalités (26', 32', 52', 66', 70')
    if (p.lastName === "Segonds") {
      conversions = 1;
      penalties = 5;
      totalPoints = 2 + 15; // 17 pts
    }
    // Dakuwaqa : 1 essai (78') + carton jaune (14') = 5 pts
    if (p.lastName === "Dakuwaqa") {
      tries = 1;
      totalPoints = 5;
      yellowCard = true;
      yellowCardMin = 14;
    }
    // Barré : 1 transformation (79') = 2 pts
    if (p.lastName === "Barré") {
      conversions = 1;
      totalPoints = 2;
    }
    // Pesenti : carton jaune (20')
    if (p.lastName === "Pesenti") {
      yellowCard = true;
      yellowCardMin = 20;
    }
    // Abramishvili : carton jaune (80')
    if (p.lastName === "Abramishvili") {
      yellowCard = true;
      yellowCardMin = 80;
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: true,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
        tries,
        conversions,
        penalties,
        totalPoints,
        yellowCard,
        yellowCardMin,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const extras = [
      p.isCaptain ? "(C)" : "",
      totalPoints > 0 ? `${totalPoints} pts` : "",
      yellowCard ? `CJ ${yellowCardMin}'` : "",
    ].filter(Boolean).join(", ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName}${extras ? ` [${extras}]` : ""}`);
  }

  console.log("\n=== Terminé ===");
  console.log("  23 joueurs Stade Français ajoutés");
  console.log("  Marqueurs : Ivaldi (5 pts), Segonds (17 pts), Dakuwaqa (5 pts), Barré (2 pts)");
  console.log("  Cartons jaunes : Dakuwaqa (14'), Pesenti (20'), Abramishvili (80')");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

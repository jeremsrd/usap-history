/**
 * Ajout de la composition de Clermont pour le match J4 (28/09/2024)
 * USAP 33 - 3 ASM Clermont Auvergne
 *
 * Crée les 23 joueurs clermontois puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr/feuille-de-match/2024-2025/j4/10897-perpignan-clermont/compositions
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs4u002n1umrpa2sded8";

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Composition Clermont — source LNR officielle
const CLERMONT_SQUAD: {
  num: number;
  firstName: string;
  lastName: string;
  position: Position;
  isStarter: boolean;
  isCaptain?: boolean;
  tries?: number;
  conversions?: number;
  penalties?: number;
  totalPoints?: number;
  yellowCard?: boolean;
  yellowCardMin?: number;
}[] = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: "PILIER_GAUCHE", isStarter: true },
  { num: 2, firstName: "Etienne", lastName: "Fourcade", position: "TALONNEUR", isStarter: true },
  { num: 3, firstName: "Michael", lastName: "Ala'alatoa", position: "PILIER_DROIT", isStarter: true },
  { num: 4, firstName: "Thibaud", lastName: "Lanen", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 5, firstName: "Oskar", lastName: "Rixen", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 6, firstName: "Anthime", lastName: "Hemery", position: "TROISIEME_LIGNE_AILE", isStarter: true },
  { num: 7, firstName: "Pita-Gus", lastName: "Sowakula", position: "TROISIEME_LIGNE_AILE", isStarter: true },
  { num: 8, firstName: "Fritz", lastName: "Lee", position: "NUMERO_HUIT", isStarter: true, isCaptain: true },
  { num: 9, firstName: "Sebastien", lastName: "Bezy", position: "DEMI_DE_MELEE", isStarter: true },
  {
    num: 10, firstName: "Anthony", lastName: "Belleau", position: "DEMI_OUVERTURE", isStarter: true,
    penalties: 1, totalPoints: 3,
  },
  { num: 11, firstName: "Alivereti", lastName: "Raka", position: "AILIER", isStarter: true },
  { num: 12, firstName: "George", lastName: "Moala", position: "CENTRE", isStarter: true },
  { num: 13, firstName: "Leon", lastName: "Darricarrere", position: "CENTRE", isStarter: true },
  { num: 14, firstName: "Joris", lastName: "Jurand", position: "AILIER", isStarter: true },
  { num: 15, firstName: "Kylan", lastName: "Hamdaoui", position: "ARRIERE", isStarter: true },
  // Remplaçants
  { num: 16, firstName: "Barnabe", lastName: "Massa", position: "TALONNEUR", isStarter: false },
  { num: 17, firstName: "Giorgi", lastName: "Akhaladze", position: "PILIER_GAUCHE", isStarter: false },
  { num: 18, firstName: "Thomas", lastName: "Ceyte", position: "DEUXIEME_LIGNE", isStarter: false },
  { num: 19, firstName: "Peceli", lastName: "Yato", position: "TROISIEME_LIGNE_AILE", isStarter: false },
  { num: 20, firstName: "Baptiste", lastName: "Jauneau", position: "DEMI_DE_MELEE", isStarter: false },
  { num: 21, firstName: "Benjamin", lastName: "Urdapilleta", position: "DEMI_OUVERTURE", isStarter: false },
  { num: 22, firstName: "Irae", lastName: "Simone", position: "CENTRE", isStarter: false },
  { num: 23, firstName: "Cristian", lastName: "Ojovan", position: "PILIER_DROIT", isStarter: false },
];

async function main() {
  console.log("=== Ajout composition Clermont — J4 (28/09/2024) ===\n");

  // Nettoyage des MatchPlayer adverses existants
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID, isOpponent: true },
  });
  console.log(`${deleted.count} entrée(s) adverses supprimée(s)\n`);

  for (const p of CLERMONT_SQUAD) {
    const slug = slugify(`${p.firstName}-${p.lastName}`);
    let player = await prisma.player.findFirst({
      where: { lastName: p.lastName, firstName: p.firstName },
    });

    if (!player) {
      player = await prisma.player.create({
        data: {
          firstName: p.firstName,
          lastName: p.lastName,
          slug: slug + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          position: p.position,
          isActive: false,
        },
      });
      console.log(`  [NEW] ${p.firstName} ${p.lastName} (${player.id})`);
    } else {
      console.log(`  [OK]  ${p.firstName} ${p.lastName} (${player.id})`);
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: MATCH_ID,
        playerId: player.id,
        isOpponent: true,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
        tries: p.tries ?? 0,
        conversions: p.conversions ?? 0,
        penalties: p.penalties ?? 0,
        totalPoints: p.totalPoints ?? 0,
        yellowCard: p.yellowCard ?? false,
        yellowCardMin: p.yellowCardMin ?? null,
      },
    });

    const marker = p.isStarter ? "TIT" : "REM";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const yc = p.yellowCard ? ` [CJ ${p.yellowCardMin}']` : "";
    const cap = p.isCaptain ? " (C)" : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName} ${p.lastName}${cap}${pts}${yc}`);
  }

  console.log(`\n=== Terminé : ${CLERMONT_SQUAD.length} joueurs clermontois ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

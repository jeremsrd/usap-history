/**
 * Ajout de la composition de Pau pour le match J5 (05/10/2024)
 * USAP 11 - 10 Section Paloise
 *
 * Crée les 23 joueurs palois puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr/feuille-de-match/2024-2025/j5/10904-perpignan-pau/compositions
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs5q002p1umrstyi2ctn";

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Composition Pau — source LNR officielle
const PAU_SQUAD: {
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
  { num: 1, firstName: "Daniel", lastName: "Bibi Biziwu", position: "PILIER_GAUCHE", isStarter: true },
  { num: 2, firstName: "Romain", lastName: "Ruffenach", position: "TALONNEUR", isStarter: true },
  { num: 3, firstName: "Harry", lastName: "Williams", position: "PILIER_DROIT", isStarter: true },
  { num: 4, firstName: "Hugo", lastName: "Auradou", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 5, firstName: "Thomas", lastName: "Jolmes", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 6, firstName: "Lekima", lastName: "Tagitagivalu", position: "TROISIEME_LIGNE_AILE", isStarter: true },
  {
    num: 7, firstName: "Sacha", lastName: "Zegueur", position: "TROISIEME_LIGNE_AILE", isStarter: true,
    yellowCard: true, yellowCardMin: 67,
  },
  { num: 8, firstName: "Beka", lastName: "Gorgadze", position: "NUMERO_HUIT", isStarter: true, isCaptain: true },
  { num: 9, firstName: "Dan", lastName: "Robson", position: "DEMI_DE_MELEE", isStarter: true },
  {
    num: 10, firstName: "Joe", lastName: "Simmonds", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 1, penalties: 1, totalPoints: 5, // 1T(2) + 1P(3) = 5
  },
  { num: 11, firstName: "Aaron", lastName: "Grandidier-Nkanang", position: "AILIER", isStarter: true },
  { num: 12, firstName: "Nathan", lastName: "Decron", position: "CENTRE", isStarter: true },
  { num: 13, firstName: "Olivier", lastName: "Klemenczak", position: "CENTRE", isStarter: true },
  {
    num: 14, firstName: "Clement", lastName: "Laporte", position: "AILIER", isStarter: true,
    tries: 1, totalPoints: 5,
  },
  { num: 15, firstName: "Jack", lastName: "Maddocks", position: "ARRIERE", isStarter: true },
  // Remplaçants
  { num: 16, firstName: "Youri", lastName: "Delhommel", position: "TALONNEUR", isStarter: false },
  { num: 17, firstName: "Guram", lastName: "Papidze", position: "PILIER_GAUCHE", isStarter: false },
  { num: 18, firstName: "Remi", lastName: "Picquette", position: "PILIER_DROIT", isStarter: false },
  { num: 19, firstName: "Joel", lastName: "Kpoku", position: "DEUXIEME_LIGNE", isStarter: false },
  { num: 20, firstName: "Thibault", lastName: "Daubagna", position: "DEMI_DE_MELEE", isStarter: false },
  { num: 21, firstName: "Tumua", lastName: "Manu", position: "CENTRE", isStarter: false },
  { num: 22, firstName: "Theo", lastName: "Attissogbe", position: "AILIER", isStarter: false },
  { num: 23, firstName: "Jon", lastName: "Zabala Arrieta", position: "PILIER_DROIT", isStarter: false },
];

async function main() {
  console.log("=== Ajout composition Pau — J5 (05/10/2024) ===\n");

  // Nettoyage des MatchPlayer adverses existants
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID, isOpponent: true },
  });
  console.log(`${deleted.count} entrée(s) adverses supprimée(s)\n`);

  for (const p of PAU_SQUAD) {
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

  console.log(`\n=== Terminé : ${PAU_SQUAD.length} joueurs palois ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

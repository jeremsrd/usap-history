/**
 * Ajout de la composition de Castres pour le match J3 (21/09/2024)
 * Castres 27 - 12 USAP
 *
 * Crée les 23 joueurs castrais puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr/feuille-de-match/2024-2025/j3/10885-castres-perpignan/compositions
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs3y002l1umr5v46hgpc";

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Composition Castres — source LNR officielle
const CASTRES_SQUAD: {
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
  { num: 1, firstName: "Quentin", lastName: "Walcker", position: "PILIER_GAUCHE", isStarter: true },
  { num: 2, firstName: "Gaëtan", lastName: "Barlot", position: "TALONNEUR", isStarter: true },
  { num: 3, firstName: "Will", lastName: "Collier", position: "PILIER_DROIT", isStarter: true },
  { num: 4, firstName: "Guillaume", lastName: "Ducat", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 5, firstName: "Florent", lastName: "Vanverberghe", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 6, firstName: "Mathieu", lastName: "Babillot", position: "TROISIEME_LIGNE_AILE", isStarter: true, isCaptain: true },
  { num: 7, firstName: "Baptiste", lastName: "Delaporte", position: "TROISIEME_LIGNE_AILE", isStarter: true },
  {
    num: 8, firstName: "Abraham", lastName: "Papali'i", position: "NUMERO_HUIT", isStarter: true,
    tries: 1, totalPoints: 5, yellowCard: true, yellowCardMin: 40,
  },
  { num: 9, firstName: "Jérémy", lastName: "Fernandez", position: "DEMI_DE_MELEE", isStarter: true },
  {
    num: 10, firstName: "Louis", lastName: "Le Brun", position: "DEMI_OUVERTURE", isStarter: true,
    penalties: 1, conversions: 1, totalPoints: 5, // 1P(3) + 1T(2) = 5
  },
  { num: 11, firstName: "Nathanaël", lastName: "Hulleu", position: "AILIER", isStarter: true },
  { num: 12, firstName: "Jack", lastName: "Goodhue", position: "CENTRE", isStarter: true },
  { num: 13, firstName: "Vilimoni", lastName: "Botitu", position: "CENTRE", isStarter: true },
  { num: 14, firstName: "Christian", lastName: "Ambadiang", position: "AILIER", isStarter: true },
  {
    num: 15, firstName: "Geoffrey", lastName: "Palis", position: "ARRIERE", isStarter: true,
    tries: 1, totalPoints: 5,
  },
  // Remplaçants
  { num: 16, firstName: "Loris", lastName: "Zarantonello", position: "TALONNEUR", isStarter: false },
  {
    num: 17, firstName: "Loïs", lastName: "Guerois Galisson", position: "PILIER_GAUCHE", isStarter: false,
    tries: 1, totalPoints: 5,
  },
  { num: 18, firstName: "Gauthier", lastName: "Maravat", position: "DEUXIEME_LIGNE", isStarter: false },
  { num: 19, firstName: "Baptiste", lastName: "Cope", position: "TROISIEME_LIGNE_AILE", isStarter: false },
  { num: 20, firstName: "Santiago", lastName: "Arata", position: "DEMI_DE_MELEE", isStarter: false },
  {
    num: 21, firstName: "Pierre", lastName: "Popelin", position: "DEMI_OUVERTURE", isStarter: false,
    conversions: 2, penalties: 1, totalPoints: 7, // 2T(4) + 1P(3) = 7
  },
  { num: 22, firstName: "Adrien", lastName: "Seguret", position: "CENTRE", isStarter: false },
  { num: 23, firstName: "Nicolas", lastName: "Corato", position: "AILIER", isStarter: false },
];

async function main() {
  console.log("=== Ajout composition Castres — J3 (21/09/2024) ===\n");

  // Nettoyage des MatchPlayer adverses existants
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID, isOpponent: true },
  });
  console.log(`${deleted.count} entrée(s) adverses supprimée(s)\n`);

  for (const p of CASTRES_SQUAD) {
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

  console.log(`\n=== Terminé : ${CASTRES_SQUAD.length} joueurs castrais ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Ajout de la composition de Bayonne pour le match J1 (07/09/2024)
 * Bayonne 21 - 19 USAP
 *
 * Crée les 23 joueurs bayonnais puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr/feuille-de-match/2024-2025/j1/10871-bayonne-perpignan/compositions
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs14002h1umrcekoub4a";

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Composition Bayonne — source LNR officielle
const BAYONNE_SQUAD: {
  num: number;
  firstName: string;
  lastName: string;
  position: Position;
  isStarter: boolean;
  isCaptain?: boolean;
  // Stats individuelles pour ce match
  tries?: number;
  conversions?: number;
  penalties?: number;
  totalPoints?: number;
  yellowCard?: boolean;
  yellowCardMin?: number;
}[] = [
  // Titulaires
  { num: 1, firstName: "Andy", lastName: "Bordelai", position: "PILIER_GAUCHE", isStarter: true, yellowCard: true, yellowCardMin: 27 },
  { num: 2, firstName: "Facundo", lastName: "Bosch", position: "TALONNEUR", isStarter: true },
  { num: 3, firstName: "Tevita", lastName: "Tatafu", position: "PILIER_DROIT", isStarter: true },
  { num: 4, firstName: "Semisi", lastName: "Poloniati", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 5, firstName: "Lucas", lastName: "Paulos Adler", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 6, firstName: "Rodrigo", lastName: "Bruni", position: "TROISIEME_LIGNE_AILE", isStarter: true },
  { num: 7, firstName: "Arthur", lastName: "Iturria", position: "TROISIEME_LIGNE_AILE", isStarter: true },
  { num: 8, firstName: "Uzair", lastName: "Cassiem", position: "NUMERO_HUIT", isStarter: true, isCaptain: true },
  { num: 9, firstName: "Baptiste", lastName: "Germain", position: "DEMI_DE_MELEE", isStarter: true },
  {
    num: 10, firstName: "Camille", lastName: "Lopez", position: "DEMI_OUVERTURE", isStarter: true,
    tries: 1, conversions: 1, penalties: 2, totalPoints: 13, // 1E(5) + 1T(2) + 2P(6) = 13
  },
  { num: 11, firstName: "Nadir", lastName: "Megdoud", position: "AILIER", isStarter: true },
  { num: 12, firstName: "Arnaud", lastName: "Erbinartegaray", position: "CENTRE", isStarter: true },
  {
    num: 13, firstName: "Sireli", lastName: "Maqala", position: "CENTRE", isStarter: true,
    tries: 1, totalPoints: 5,
  },
  { num: 14, firstName: "Aurélien", lastName: "Callandret", position: "AILIER", isStarter: true },
  { num: 15, firstName: "Yohan", lastName: "Orabé", position: "ARRIERE", isStarter: true, yellowCard: true, yellowCardMin: 50 },
  // Remplaçants
  { num: 16, firstName: "Vincent", lastName: "Giudicelli", position: "TALONNEUR", isStarter: false },
  { num: 17, firstName: "Pierre", lastName: "Castillon", position: "PILIER_GAUCHE", isStarter: false },
  { num: 18, firstName: "Baptiste", lastName: "Heguy", position: "DEUXIEME_LIGNE", isStarter: false },
  { num: 19, firstName: "Giovanni", lastName: "Habel-Kuffner", position: "TROISIEME_LIGNE_AILE", isStarter: false },
  { num: 20, firstName: "Maxime", lastName: "Machenaud", position: "DEMI_DE_MELEE", isStarter: false },
  {
    num: 21, firstName: "Joris", lastName: "Segonds", position: "DEMI_OUVERTURE", isStarter: false,
    penalties: 1, totalPoints: 3,
  },
  { num: 22, firstName: "Tom", lastName: "Spring", position: "CENTRE", isStarter: false },
  { num: 23, firstName: "Luke", lastName: "Tagi", position: "PILIER_DROIT", isStarter: false },
];

async function main() {
  console.log("=== Ajout composition Bayonne — J1 (07/09/2024) ===\n");

  // Nettoyage des MatchPlayer adverses existants
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID, isOpponent: true },
  });
  console.log(`${deleted.count} entrée(s) adverses supprimée(s)\n`);

  for (const p of BAYONNE_SQUAD) {
    // Créer ou trouver le joueur
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

    // Créer le MatchPlayer
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

  console.log(`\n=== Terminé : ${BAYONNE_SQUAD.length} joueurs bayonnais ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

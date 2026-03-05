/**
 * Ajout de la composition de l'UBB pour le match J6 (12/10/2024)
 * UBB 66 - 12 USAP
 *
 * Crée les 23 joueurs bordelais puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : itsrugby.fr, lnr.fr, all.rugby
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs6m002r1umrlrrtnd1z";

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Composition UBB — source itsrugby.fr / LNR officielle
const UBB_SQUAD: {
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
  {
    num: 1, firstName: "Jefferson", lastName: "Poirot", position: "PILIER_GAUCHE", isStarter: true,
    isCaptain: true, tries: 1, totalPoints: 5,
  },
  { num: 2, firstName: "Maxime", lastName: "Lamothe", position: "TALONNEUR", isStarter: true },
  { num: 3, firstName: "Carlu Johann", lastName: "Sadie", position: "PILIER_DROIT", isStarter: true },
  { num: 4, firstName: "Guido", lastName: "Petti", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 5, firstName: "Cyril", lastName: "Cazeaux", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 6, firstName: "Pierre", lastName: "Bochaton", position: "TROISIEME_LIGNE_AILE", isStarter: true },
  { num: 7, firstName: "Bastien", lastName: "Vergnes Taillefer", position: "TROISIEME_LIGNE_AILE", isStarter: true },
  {
    num: 8, firstName: "Tevita", lastName: "Tatafu", position: "NUMERO_HUIT", isStarter: true,
    tries: 1, totalPoints: 5,
  },
  { num: 9, firstName: "Yann", lastName: "Lesgourgues", position: "DEMI_DE_MELEE", isStarter: true },
  {
    num: 10, firstName: "Matthieu", lastName: "Jalibert", position: "DEMI_OUVERTURE", isStarter: true,
    tries: 2, conversions: 3, totalPoints: 16, // 2E(10) + 3T(6) = 16
  },
  {
    num: 11, firstName: "Enzo", lastName: "Reybier", position: "AILIER", isStarter: true,
    tries: 2, totalPoints: 10,
  },
  { num: 12, firstName: "Yoram", lastName: "Moefana", position: "CENTRE", isStarter: true },
  { num: 13, firstName: "Nicolas", lastName: "Depoortere", position: "CENTRE", isStarter: true },
  { num: 14, firstName: "Damian", lastName: "Penaud", position: "AILIER", isStarter: true },
  {
    num: 15, firstName: "Romain", lastName: "Buros", position: "ARRIERE", isStarter: true,
    tries: 2, totalPoints: 10,
  },
  // Remplaçants
  { num: 16, firstName: "Connor", lastName: "Sa", position: "TALONNEUR", isStarter: false },
  { num: 17, firstName: "Sipili", lastName: "Falatea", position: "PILIER_GAUCHE", isStarter: false },
  { num: 18, firstName: "Jonny", lastName: "Gray", position: "DEUXIEME_LIGNE", isStarter: false },
  {
    num: 19, firstName: "Pete", lastName: "Samu", position: "TROISIEME_LIGNE_AILE", isStarter: false,
    tries: 1, totalPoints: 5,
  },
  {
    num: 20, firstName: "Matis", lastName: "Perchaud", position: "TROISIEME_LIGNE_AILE", isStarter: false,
    tries: 1, totalPoints: 5, yellowCard: true, yellowCardMin: 77,
  },
  { num: 21, firstName: "Marko", lastName: "Gazzotti", position: "TROISIEME_LIGNE_AILE", isStarter: false },
  {
    num: 22, firstName: "Mateo", lastName: "Garcia", position: "DEMI_OUVERTURE", isStarter: false,
    conversions: 5, totalPoints: 10, // 5T(10) = 10
  },
  { num: 23, firstName: "Maxime", lastName: "Lucu", position: "DEMI_DE_MELEE", isStarter: false },
];

async function main() {
  console.log("=== Ajout composition UBB — J6 (12/10/2024) ===\n");

  // Nettoyage des MatchPlayer adverses existants
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID, isOpponent: true },
  });
  console.log(`${deleted.count} entrée(s) adverses supprimée(s)\n`);

  for (const p of UBB_SQUAD) {
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

  console.log(`\n=== Terminé : ${UBB_SQUAD.length} joueurs bordelais ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

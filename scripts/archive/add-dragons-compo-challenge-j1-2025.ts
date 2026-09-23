/**
 * Ajout de la composition des Dragons RFC pour le match J1 Challenge Cup (07/12/2025)
 * USAP 41 - Dragons 17
 *
 * Source : epcrugby.com, stars-actu.fr
 *
 * Essais : Westwood (~50'), Austin (~65', ~75')
 * Transformations : O'Brien (~50')
 * Carton jaune : Carter (60')
 *
 * Dragons : 3E + 1T = 15 + 2 = 17 points
 *
 * Exécution : npx tsx scripts/add-dragons-compo-challenge-j1-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const DRAGONS_SQUAD: {
  num: number;
  firstName: string;
  lastName: string;
  position: Position;
  isStarter: boolean;
  isCaptain?: boolean;
  tries?: number;
  conversions?: number;
  penalties?: number;
  dropGoals?: number;
  totalPoints?: number;
  minutesPlayed?: number;
  yellowCard?: boolean;
  yellowCardMin?: number;
}[] = [
  // Titulaires
  { num: 1, firstName: "Rodrigo", lastName: "Martinez", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
  { num: 2, firstName: "Sam", lastName: "Scarfe", position: "TALONNEUR", isStarter: true, minutesPlayed: 56 },
  { num: 3, firstName: "Lloyd", lastName: "Yendle", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
  { num: 4, firstName: "Matthew", lastName: "Screech", position: "DEUXIEME_LIGNE", isStarter: true, isCaptain: true, minutesPlayed: 80 },
  {
    num: 5, firstName: "Ben", lastName: "Carter", position: "DEUXIEME_LIGNE", isStarter: true,
    minutesPlayed: 80, yellowCard: true, yellowCardMin: 60,
  },
  { num: 6, firstName: "Shane", lastName: "Lewis-Hughes", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 65 },
  { num: 7, firstName: "Taine", lastName: "Young", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Mackenzie", lastName: "Martin", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 65 },
  { num: 9, firstName: "Rhodri", lastName: "Williams", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 60 },
  {
    num: 10, firstName: "Angus", lastName: "O'Brien", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 1, totalPoints: 2, // Transfo ~50'
    minutesPlayed: 60,
  },
  { num: 11, firstName: "Rio", lastName: "Dyer", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  {
    num: 12, firstName: "Joe", lastName: "Westwood", position: "CENTRE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai ~50'
    minutesPlayed: 80,
  },
  { num: 13, firstName: "David", lastName: "Richards", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Fili", lastName: "Inisi", position: "AILIER", isStarter: true, minutesPlayed: 60 },
  { num: 15, firstName: "Cai", lastName: "Evans", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },

  // Remplaçants
  {
    num: 16, firstName: "Will", lastName: "Austin", position: "TALONNEUR", isStarter: false,
    tries: 2, totalPoints: 10, // Doublé ~65', ~75'
    minutesPlayed: 24,
  },
  { num: 17, firstName: "Dale", lastName: "Kelleher-Griffiths", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },
  { num: 18, firstName: "Rhys", lastName: "Hunt", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },
  { num: 19, firstName: "Brandon", lastName: "Langton", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 15 },
  { num: 20, firstName: "Harrison", lastName: "Keddie", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 15 },
  { num: 21, firstName: "Che", lastName: "Hope", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 },
  { num: 22, firstName: "Tinus", lastName: "de Beer", position: "DEMI_OUVERTURE", isStarter: false, minutesPlayed: 20 },
  { num: 23, firstName: "Evan", lastName: "Rosser", position: "AILIER", isStarter: false, minutesPlayed: 20 },
];

async function main() {
  console.log("=== Ajout composition Dragons RFC — J1 Challenge Cup (07/12/2025) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      round: "Poule J1",
      competition: { shortName: "Challenge Européen" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — ${match.round} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: match.id, isOpponent: true },
  });
  console.log(`${deleted.count} entrée(s) adverses supprimée(s)\n`);

  for (const p of DRAGONS_SQUAD) {
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
        matchId: match.id,
        playerId: player.id,
        isOpponent: true,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
        tries: p.tries ?? 0,
        conversions: p.conversions ?? 0,
        penalties: p.penalties ?? 0,
        dropGoals: p.dropGoals ?? 0,
        totalPoints: p.totalPoints ?? 0,
        minutesPlayed: p.minutesPlayed ?? null,
        yellowCard: p.yellowCard ?? false,
        yellowCardMin: p.yellowCardMin ?? null,
      },
    });

    const marker = p.isStarter ? "TIT" : "REM";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const cap = p.isCaptain ? " (C)" : "";
    const yc = p.yellowCard ? " 🟨" : "";
    const min = p.minutesPlayed != null ? ` [${p.minutesPlayed}']` : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName} ${p.lastName}${cap}${pts}${yc}${min}`);
  }

  const totalPointsDRA = DRAGONS_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsDRA} (attendu : 17)`);
  if (totalPointsDRA !== 17) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${DRAGONS_SQUAD.length} joueurs Dragons RFC ajoutés ===`);
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

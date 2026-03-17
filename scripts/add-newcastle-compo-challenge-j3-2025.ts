/**
 * Ajout de la composition de Newcastle pour le match J3 Challenge Cup (10/01/2026)
 * Newcastle 26 - USAP 19
 *
 * Source : epcrugby.com, espn.com, allrugby.com, ruck.co.uk
 *
 * Essais : Wade (19'), Arnold (22'), Obatoyinbo (45'), McGuigan (59')
 * Transformations : Grayson x3 (20', 23', 59')
 * Carton jaune : Grayson (31')
 *
 * Newcastle : 4E + 3T = 20 + 6 = 26 points
 *
 * Exécution : npx tsx scripts/add-newcastle-compo-challenge-j3-2025.ts
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

const NEWCASTLE_SQUAD: {
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
  minutesPlayed?: number;
  yellowCard?: boolean;
  yellowCardMin?: number;
}[] = [
  // Titulaires
  { num: 1, firstName: "Murray", lastName: "McCallum", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
  { num: 2, firstName: "George", lastName: "McGuigan", position: "TALONNEUR", isStarter: true, isCaptain: true,
    tries: 1, totalPoints: 5, minutesPlayed: 65 }, // Essai 59'
  { num: 3, firstName: "Richard", lastName: "Palframan", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
  { num: 4, firstName: "Tim", lastName: "Cardall", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Sebastian", lastName: "de Chaves", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Oscar", lastName: "Usher", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 65 },
  { num: 7, firstName: "Tom", lastName: "Christie", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 65 },
  { num: 8, firstName: "Tom", lastName: "Gordon", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Simon", lastName: "Benitez Cruz", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 60 },
  { num: 10, firstName: "Ethan", lastName: "Grayson", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 3, totalPoints: 6, minutesPlayed: 80,
    yellowCard: true, yellowCardMin: 31 }, // 3T/4 + CJ 31'
  { num: 11, firstName: "Oliver", lastName: "Spencer", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Sammy", lastName: "Arnold", position: "CENTRE", isStarter: true,
    tries: 1, totalPoints: 5, minutesPlayed: 80 }, // Essai 22'
  { num: 13, firstName: "Alex", lastName: "Hearle", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Christian", lastName: "Wade", position: "AILIER", isStarter: true,
    tries: 1, totalPoints: 5, minutesPlayed: 80 }, // Essai 19'
  { num: 15, firstName: "Elliott", lastName: "Obatoyinbo", position: "ARRIERE", isStarter: true,
    tries: 1, totalPoints: 5, minutesPlayed: 80 }, // Essai 45'

  // Remplaçants
  { num: 16, firstName: "Ollie", lastName: "Fletcher", position: "TALONNEUR", isStarter: false, minutesPlayed: 15 },
  { num: 17, firstName: "Adam", lastName: "Brocklebank", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },
  { num: 18, firstName: "Luan", lastName: "de Bruin", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },
  { num: 19, firstName: "Finn", lastName: "Baker", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 15 },
  { num: 20, firstName: "Cameron", lastName: "Neild", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 15 },
  { num: 21, firstName: "James", lastName: "Elliott", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 },
  { num: 22, firstName: "Cammy", lastName: "Hutchison", position: "DEMI_OUVERTURE", isStarter: false, minutesPlayed: 0 },
  { num: 23, firstName: "Nathan", lastName: "Greenwood", position: "CENTRE", isStarter: false, minutesPlayed: 0 },
];

async function main() {
  console.log("=== Ajout composition Newcastle — J3 Challenge Cup (10/01/2026) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      round: "Poule J3",
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

  for (const p of NEWCASTLE_SQUAD) {
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
        dropGoals: 0,
        totalPoints: p.totalPoints ?? 0,
        minutesPlayed: p.minutesPlayed ?? null,
        yellowCard: p.yellowCard ?? false,
        yellowCardMin: p.yellowCardMin ?? null,
        redCard: false,
        redCardMin: null,
      },
    });

    const marker = p.isStarter ? "TIT" : "REM";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const cap = p.isCaptain ? " (C)" : "";
    const yc = p.yellowCard ? " 🟨" : "";
    const min = p.minutesPlayed != null ? ` [${p.minutesPlayed}']` : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName} ${p.lastName}${cap}${pts}${yc}${min}`);
  }

  const totalPointsNEW = NEWCASTLE_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsNEW} (attendu : 26)`);
  if (totalPointsNEW !== 26) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${NEWCASTLE_SQUAD.length} joueurs Newcastle ajoutés ===`);
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

/**
 * Ajout de la composition du RC Toulon pour le match J13 (28/12/2025)
 * Toulon 31 - USAP 16
 *
 * Crée les 23 joueurs de Toulon puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr, rctoulon.com, rugby-transferts.com
 *
 * Essais : Ludlam (16'), Alainu'uese (46', 75'), Villière (50'), Dréan (77')
 * Transformations : Domon (16', 46', 50')
 *
 * Toulon : 5E + 3T = 25 + 6 = 31 points
 *
 * Exécution : npx tsx scripts/add-toulon-compo-j13-2025.ts
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

const RCT_SQUAD: {
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
}[] = [
  // Titulaires
  { num: 1, firstName: "Léo", lastName: "Ametlla", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
  { num: 2, firstName: "Teddy", lastName: "Baubigny", position: "TALONNEUR", isStarter: true, minutesPlayed: 56 },
  { num: 3, firstName: "Kyle", lastName: "Sinckler", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
  { num: 4, firstName: "David", lastName: "Ribbans", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Giorgi", lastName: "Javakhia", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  {
    num: 6, firstName: "Lewis", lastName: "Ludlam", position: "TROISIEME_LIGNE_AILE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 16'
    minutesPlayed: 80,
  },
  {
    num: 7, firstName: "Charles", lastName: "Ollivon", position: "TROISIEME_LIGNE_AILE", isStarter: true,
    isCaptain: true,
    minutesPlayed: 80,
  },
  { num: 8, firstName: "Zach", lastName: "Mercer", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Benjamin", lastName: "White", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 60 },
  { num: 10, firstName: "Paolo", lastName: "Garbisi", position: "DEMI_OUVERTURE", isStarter: true, minutesPlayed: 60 },
  { num: 11, firstName: "Mathis", lastName: "Ferté", position: "AILIER", isStarter: true, minutesPlayed: 60 },
  { num: 12, firstName: "Jérémy", lastName: "Sinzelle", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Mathieu", lastName: "Smaïli", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  {
    num: 14, firstName: "Gaël", lastName: "Dréan", position: "AILIER", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 77'
    minutesPlayed: 80,
  },
  {
    num: 15, firstName: "Marius", lastName: "Domon", position: "ARRIERE", isStarter: true,
    conversions: 3, totalPoints: 6, // 3T (16', 46', 50')
    minutesPlayed: 80,
  },

  // Remplaçants
  { num: 16, firstName: "Jeremy", lastName: "Toevalu", position: "TALONNEUR", isStarter: false, minutesPlayed: 24 },       // entré 56'
  { num: 17, firstName: "Daniel", lastName: "Brennan", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },    // entré 56'
  {
    num: 18, firstName: "Komiti", lastName: "Alainu'uese", position: "DEUXIEME_LIGNE", isStarter: false,
    tries: 2, totalPoints: 10, // Essais 46', 75'
    minutesPlayed: 35, // entré ~45'
  },
  { num: 19, firstName: "Esteban", lastName: "Abadie", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 0 }, // non entré
  { num: 20, firstName: "Tomás", lastName: "Albornoz", position: "DEMI_OUVERTURE", isStarter: false, minutesPlayed: 20 },      // entré 60'
  { num: 21, firstName: "Baptiste", lastName: "Serin", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 },       // entré 60'
  {
    num: 22, firstName: "Gabin", lastName: "Villière", position: "AILIER", isStarter: false,
    tries: 1, totalPoints: 5, // Essai 50'
    minutesPlayed: 20, // entré 60'
  },
  { num: 23, firstName: "Dany", lastName: "Priso", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },            // entré 56'
];

async function main() {
  console.log("=== Ajout composition RC Toulon — J13 (28/12/2025) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 13,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: match.id, isOpponent: true },
  });
  console.log(`${deleted.count} entrée(s) adverses supprimée(s)\n`);

  for (const p of RCT_SQUAD) {
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
      },
    });

    const marker = p.isStarter ? "TIT" : "REM";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const cap = p.isCaptain ? " (C)" : "";
    const min = p.minutesPlayed != null ? ` [${p.minutesPlayed}']` : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName} ${p.lastName}${cap}${pts}${min}`);
  }

  const totalPointsRCT = RCT_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsRCT} (attendu : 31)`);
  if (totalPointsRCT !== 31) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${RCT_SQUAD.length} joueurs Toulon ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

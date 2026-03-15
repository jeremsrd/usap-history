/**
 * Ajout de la composition du Stade Français Paris pour le match J5 (04/10/2025)
 * USAP 11 - Stade Français 28
 *
 * Crée les 23 joueurs du Stade Français puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr, allrugby.com, vibrez-rugby.com
 *
 * Essais : Ward (2', 35'), Nene (15'), Barré (60')
 * Transformations : Henry (3', 16', 36', 61')
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-stadefrancais-compo-j5-2025.ts
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

const SF_SQUAD: {
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
}[] = [
  // Titulaires
  { num: 1, firstName: "Moses", lastName: "Alo Emile", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 41 },
  { num: 2, firstName: "Alvaro", lastName: "Garcia", position: "TALONNEUR", isStarter: true, minutesPlayed: 41 },
  { num: 3, firstName: "Paul", lastName: "Alo Emile", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 46 },
  { num: 4, firstName: "Paul", lastName: "Gabrillagues", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 51 },
  { num: 5, firstName: "Baptiste", lastName: "Pesenti", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Sekou", lastName: "Macalou", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Ryan", lastName: "Chapuis", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Mathieu", lastName: "Hirigoyen", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 51 },
  { num: 9, firstName: "Paul", lastName: "Abadie", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 66 },
  {
    num: 10, firstName: "Zack", lastName: "Henry", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 4, totalPoints: 8, // 4 transfos
    minutesPlayed: 80,
  },
  { num: 11, firstName: "Samuel", lastName: "Ezeala", position: "AILIER", isStarter: true, minutesPlayed: 52 },
  {
    num: 12, firstName: "Noah", lastName: "Nene", position: "CENTRE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 15'
    minutesPlayed: 55,
  },
  {
    num: 13, firstName: "Jeremy", lastName: "Ward", position: "CENTRE", isStarter: true,
    isCaptain: true,
    tries: 2, totalPoints: 10, // Essais 2' et 35'
    minutesPlayed: 80,
  },
  { num: 14, firstName: "Charles", lastName: "Laloi", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Joe", lastName: "Jonas", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },

  // Remplaçants
  { num: 16, firstName: "Lucas", lastName: "Peyresblanques", position: "TALONNEUR", isStarter: false, minutesPlayed: 39 }, // entré 41'
  { num: 17, firstName: "Thierry", lastName: "Paiva", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 39 },    // entré 41'
  { num: 18, firstName: "Tanginoa", lastName: "Halaifonua", position: "NUMERO_HUIT", isStarter: false, minutesPlayed: 29 }, // entré 51'
  { num: 19, firstName: "Juan Martin", lastName: "Scelzo", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 29 }, // entré 51'
  { num: 20, firstName: "Andy", lastName: "Timo", position: "AILIER", isStarter: false, minutesPlayed: 28 },               // entré 52'
  { num: 21, firstName: "Thibaut", lastName: "Motassi", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 14 },   // entré 66'
  {
    num: 22, firstName: "Leo", lastName: "Barre", position: "DEMI_OUVERTURE", isStarter: false,
    tries: 1, totalPoints: 5, // Essai 60'
    minutesPlayed: 25, // entré 55'
  },
  { num: 23, firstName: "Giorgi", lastName: "Melikidze", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 34 },   // entré 46'
];

async function main() {
  console.log("=== Ajout composition Stade Français — J5 (04/10/2025) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 5,
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

  for (const p of SF_SQUAD) {
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

  const totalPointsSF = SF_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsSF} (attendu : 28)`);
  if (totalPointsSF !== 28) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${SF_SQUAD.length} joueurs Stade Français ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

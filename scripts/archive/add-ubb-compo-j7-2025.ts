/**
 * Ajout de la composition de l'UBB Bordeaux-Bègles pour le match J7 (18/10/2025)
 * USAP 12 - UBB 27
 *
 * Crée les 23 joueurs de l'UBB puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : ubbrugby.com, union-rugby.com, espn.com
 *
 * Essais : Drault (9'), Matiu (20'), Jalibert (63')
 * Transformations : Page-Relo (10', 21', 64')
 * Pénalités : Page-Relo (6', 28')
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-ubb-compo-j7-2025.ts
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
  dropGoals?: number;
  totalPoints?: number;
  minutesPlayed?: number;
  yellowCard?: boolean;
  yellowCardMinute?: number;
}[] = [
  // Titulaires
  { num: 1, firstName: "Jefferson", lastName: "Poirot", position: "PILIER_GAUCHE", isStarter: true, isCaptain: true, minutesPlayed: 52 },
  { num: 2, firstName: "Maxime", lastName: "Barlot", position: "TALONNEUR", isStarter: true, minutesPlayed: 52 },
  { num: 3, firstName: "Ben", lastName: "Sadie", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 52 },
  { num: 4, firstName: "Adam", lastName: "Coleman", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 62 },
  { num: 5, firstName: "Cyril", lastName: "Cazeaux", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  {
    num: 6, firstName: "Temo", lastName: "Matiu", position: "TROISIEME_LIGNE_AILE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 20'
    minutesPlayed: 62,
  },
  { num: 7, firstName: "Cameron", lastName: "Woki", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Mahamadou", lastName: "Gazzotti", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 62 },
  {
    num: 9, firstName: "Martin", lastName: "Page-Relo", position: "DEMI_DE_MELEE", isStarter: true,
    conversions: 3, penalties: 2, totalPoints: 12, // 3T(6) + 2P(6)
    minutesPlayed: 62,
  },
  {
    num: 10, firstName: "Matthieu", lastName: "Jalibert", position: "DEMI_OUVERTURE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 63'
    minutesPlayed: 80,
  },
  { num: 11, firstName: "Anga", lastName: "Rayasi", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  {
    num: 12, firstName: "Adrien", lastName: "Drault", position: "CENTRE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 9' (premier essai en Top 14)
    minutesPlayed: 80,
  },
  { num: 13, firstName: "Nicolas", lastName: "Uberti", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Damian", lastName: "Penaud", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Louis", lastName: "Bielle-Biarrey", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },

  // Remplaçants
  { num: 16, firstName: "Romain", lastName: "Lamothe", position: "TALONNEUR", isStarter: false, minutesPlayed: 28 },       // entré 52'
  { num: 17, firstName: "Thierry", lastName: "Perchaud", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 28 },  // entré 52'
  { num: 18, firstName: "Tevita", lastName: "Palu", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 18 },      // entré 62'
  { num: 19, firstName: "Richie", lastName: "Gray", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 18 },      // entré 62'
  { num: 20, firstName: "Marko", lastName: "Jacobs", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 18 }, // entré 62'
  { num: 21, firstName: "Clément", lastName: "Hutteau", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 18 },   // entré 62'
  { num: 22, firstName: "Joey", lastName: "Carbery", position: "DEMI_OUVERTURE", isStarter: false, minutesPlayed: 0 },      // non entré
  { num: 23, firstName: "Peni", lastName: "Falatea", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 28 },       // entré 52'
];

async function main() {
  console.log("=== Ajout composition UBB Bordeaux-Bègles — J7 (18/10/2025) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 7,
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
        yellowCardMin: p.yellowCardMinute ?? null,
      },
    });

    const marker = p.isStarter ? "TIT" : "REM";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const cap = p.isCaptain ? " (C)" : "";
    const yc = p.yellowCard ? " [CJ]" : "";
    const min = p.minutesPlayed != null ? ` [${p.minutesPlayed}']` : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName} ${p.lastName}${cap}${pts}${yc}${min}`);
  }

  const totalPointsUBB = UBB_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsUBB} (attendu : 27)`);
  if (totalPointsUBB !== 27) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${UBB_SQUAD.length} joueurs UBB ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

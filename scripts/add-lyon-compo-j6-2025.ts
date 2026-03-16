/**
 * Ajout de la composition du Lyon OU pour le match J6 (11/10/2025)
 * Lyon 44 - USAP 19
 *
 * Crée les 23 joueurs du LOU puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr, allrugby.com, lyonmag.com
 *
 * Essais : Cassang (19'), Wainiqolo (51', 76'), Moukoro (59'), Maraku (71')
 * Transformations : Berdeu (20', 52', 60', 72', 77')
 * Pénalités : Berdeu (12', 37')
 * Drop : Berdeu (42')
 * Carton jaune : Berdeu (72')
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-lyon-compo-j6-2025.ts
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

const LOU_SQUAD: {
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
  { num: 1, firstName: "Hamza", lastName: "Kaabèche", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 49 },
  { num: 2, firstName: "Guillaume", lastName: "Marchand", position: "TALONNEUR", isStarter: true, minutesPlayed: 62 },
  { num: 3, firstName: "Irakli", lastName: "Aptsiauri", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 69 },
  { num: 4, firstName: "Félix", lastName: "Lambey", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 49 },
  { num: 5, firstName: "Mickaël", lastName: "Guillard", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Dylan", lastName: "Cretin", position: "TROISIEME_LIGNE_AILE", isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 7, firstName: "Sam", lastName: "Simmonds", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Arno", lastName: "Botha", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 49 },
  {
    num: 9, firstName: "Charlie", lastName: "Cassang", position: "DEMI_DE_MELEE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 19'
    minutesPlayed: 68,
  },
  {
    num: 10, firstName: "Léo", lastName: "Berdeu", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 5, penalties: 2, dropGoals: 1, totalPoints: 19, // 5T(10) + 2P(6) + 1D(3)
    minutesPlayed: 80,
    yellowCard: true, yellowCardMinute: 72,
  },
  { num: 11, firstName: "Ethan", lastName: "Dumortier", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Théo", lastName: "Millet", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  {
    num: 13, firstName: "Josiah", lastName: "Maraku", position: "CENTRE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 71'
    minutesPlayed: 80,
  },
  {
    num: 14, firstName: "Jiuta", lastName: "Wainiqolo", position: "AILIER", isStarter: true,
    tries: 2, totalPoints: 10, // Essais 51', 76'
    minutesPlayed: 80,
  },
  { num: 15, firstName: "Gabin", lastName: "Lorre", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },

  // Remplaçants
  { num: 16, firstName: "Mathis", lastName: "Sarragallet", position: "TALONNEUR", isStarter: false, minutesPlayed: 18 },    // entré 62'
  {
    num: 17, firstName: "Thomas", lastName: "Moukoro", position: "PILIER_GAUCHE", isStarter: false,
    tries: 1, totalPoints: 5, // Essai 59'
    minutesPlayed: 31, // entré 49'
  },
  { num: 18, firstName: "Théo", lastName: "William", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 31 },     // entré 49'
  { num: 19, firstName: "Janse", lastName: "Roux", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 0 },  // non entré
  { num: 20, firstName: "Esteban", lastName: "Gonzalez", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 12 },  // entré 68'
  { num: 21, firstName: "Paddy", lastName: "Jackson", position: "DEMI_OUVERTURE", isStarter: false, minutesPlayed: 0 },     // non entré
  { num: 22, firstName: "Beka", lastName: "Shvangiradze", position: "NUMERO_HUIT", isStarter: false, minutesPlayed: 31 },   // entré 49'
  { num: 23, firstName: "Avé", lastName: "Maalo", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 11 },          // entré 69'
];

async function main() {
  console.log("=== Ajout composition Lyon OU — J6 (11/10/2025) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 6,
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

  for (const p of LOU_SQUAD) {
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

  const totalPointsLyon = LOU_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsLyon} (attendu : 44)`);
  if (totalPointsLyon !== 44) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${LOU_SQUAD.length} joueurs Lyon OU ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

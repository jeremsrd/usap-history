/**
 * Ajout de la composition du Racing 92 pour le match J16 (31/01/2026)
 * Racing 92 37 - USAP 31
 *
 * Crée les 23 joueurs du Racing 92 puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr
 *
 * Essais : Tarrit (3'), James (5'), Gogichashvili (56'), Taofifenua (66')
 * Transformations : Gibert (4', 6', 57', 67')
 * Pénalités : Gibert (25', 28', 61')
 * Cartons : Carbonneau 🟨14', Taofifenua 🟨22', Tuisova 🟥37'
 *
 * Racing : 4E + 4T + 3P = 20 + 8 + 9 = 37 points
 *
 * Exécution : npx tsx scripts/add-racing92-compo-j16-2025.ts
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

const R92_SQUAD: {
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
  redCard?: boolean;
  redCardMin?: number;
}[] = [
  // Titulaires
  {
    num: 1, firstName: "Edouard", lastName: "Jabea Njocke", position: "PILIER_GAUCHE", isStarter: true,
    minutesPlayed: 56,
  },
  {
    num: 2, firstName: "Janick", lastName: "Tarrit", position: "TALONNEUR", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 3'
    minutesPlayed: 56,
  },
  { num: 3, firstName: "Demba", lastName: "Bamba", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
  { num: 4, firstName: "Jonathan", lastName: "Hill", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  {
    num: 5, firstName: "Romain", lastName: "Taofifenua", position: "DEUXIEME_LIGNE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 66'
    minutesPlayed: 80,
    yellowCard: true, yellowCardMin: 22,
  },
  { num: 6, firstName: "Noa", lastName: "Zinzen", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 65 },
  {
    num: 7, firstName: "Fabien", lastName: "Sanconnie", position: "TROISIEME_LIGNE_AILE", isStarter: true,
    isCaptain: true, minutesPlayed: 80,
  },
  { num: 8, firstName: "Lekima", lastName: "Tagitagivalu", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 65 },
  {
    num: 9, firstName: "Léo", lastName: "Carbonneau", position: "DEMI_DE_MELEE", isStarter: true,
    minutesPlayed: 60,
    yellowCard: true, yellowCardMin: 14,
  },
  {
    num: 10, firstName: "Antoine", lastName: "Gibert", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 4, penalties: 3, totalPoints: 17, // 4T(8) + 3P(9) = 17
    minutesPlayed: 80,
  },
  { num: 11, firstName: "Max", lastName: "Spring", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  {
    num: 12, firstName: "Josua", lastName: "Tuisova", position: "CENTRE", isStarter: true,
    minutesPlayed: 37,
    redCard: true, redCardMin: 37,
  },
  { num: 13, firstName: "Gaël", lastName: "Fickou", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Wilfried", lastName: "Hulleu", position: "AILIER", isStarter: true, minutesPlayed: 60 },
  {
    num: 15, firstName: "Samuel", lastName: "James", position: "ARRIERE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 5'
    minutesPlayed: 80,
  },

  // Remplaçants
  { num: 16, firstName: "Yanis", lastName: "Basse", position: "TALONNEUR", isStarter: false, minutesPlayed: 24 },              // entré 56'
  {
    num: 17, firstName: "Guram", lastName: "Gogichashvili", position: "PILIER_GAUCHE", isStarter: false,
    tries: 1, totalPoints: 5, // Essai 56'
    minutesPlayed: 24,                                                                                                          // entré 56'
  },
  { num: 18, firstName: "Thomas", lastName: "Lainault", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 0 },      // non entré
  { num: 19, firstName: "Maxime", lastName: "Baudonne", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 15 }, // entré 65'
  { num: 20, firstName: "Nathan", lastName: "Hughes", position: "NUMERO_HUIT", isStarter: false, minutesPlayed: 15 },          // entré 65'
  { num: 21, firstName: "Gerónimo", lastName: "Prisciantelli", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 }, // entré 60'
  { num: 22, firstName: "Vinaya", lastName: "Habosi", position: "AILIER", isStarter: false, minutesPlayed: 20 },               // entré 60'
  { num: 23, firstName: "Daniel", lastName: "Tupou", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },          // entré 56'
];

async function main() {
  console.log("=== Ajout composition Racing 92 — J16 (31/01/2026) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 16,
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

  for (const p of R92_SQUAD) {
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
        redCard: p.redCard ?? false,
        redCardMin: p.redCardMin ?? null,
      },
    });

    const marker = p.isStarter ? "TIT" : "REM";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const cap = p.isCaptain ? " (C)" : "";
    const yc = p.yellowCard ? " 🟨" : "";
    const rc = p.redCard ? " 🟥" : "";
    const min = p.minutesPlayed != null ? ` [${p.minutesPlayed}']` : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName} ${p.lastName}${cap}${pts}${yc}${rc}${min}`);
  }

  const totalPointsR92 = R92_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsR92} (attendu : 37)`);
  if (totalPointsR92 !== 37) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${R92_SQUAD.length} joueurs Racing 92 ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

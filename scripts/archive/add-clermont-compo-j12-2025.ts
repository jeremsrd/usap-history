/**
 * Ajout de la composition de l'ASM Clermont Auvergne pour le match J12 (20/12/2025)
 * USAP 26 - Clermont 20
 *
 * Crée les 23 joueurs de Clermont puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr, francebleu.fr
 *
 * Essais : Jauneau (43'), Delguy (72')
 * Transformations : Plummer (43', 72')
 * Pénalités : Plummer (15', 35')
 *
 * Clermont : 2E + 2T + 2P = 10 + 4 + 6 = 20 points
 *
 * Exécution : npx tsx scripts/add-clermont-compo-j12-2025.ts
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

const ASM_SQUAD: {
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
  { num: 1, firstName: "Giorgi", lastName: "Akhaladze", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
  { num: 2, firstName: "Etienne", lastName: "Fourcade", position: "TALONNEUR", isStarter: true, minutesPlayed: 56 },
  { num: 3, firstName: "Cristian", lastName: "Ojovan", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
  { num: 4, firstName: "Thibaud", lastName: "Lanen", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Thomas", lastName: "Ceyte", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Killian", lastName: "Tixeront", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 65 },
  {
    num: 7, firstName: "Marcos", lastName: "Kremer", position: "TROISIEME_LIGNE_AILE", isStarter: true,
    isCaptain: true,
    minutesPlayed: 80,
  },
  { num: 8, firstName: "Pio", lastName: "Muarua", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 65 },
  {
    num: 9, firstName: "Baptiste", lastName: "Jauneau", position: "DEMI_DE_MELEE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 43'
    minutesPlayed: 60,
  },
  {
    num: 10, firstName: "Harrison", lastName: "Plummer", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 2, penalties: 2, totalPoints: 10, // 2T(4) + 2P(6) = 10
    minutesPlayed: 80,
  },
  { num: 11, firstName: "Alivereti", lastName: "Raka", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Lucas", lastName: "Tauzin", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Alivereti", lastName: "Loaloa", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  {
    num: 14, firstName: "Bautista", lastName: "Delguy", position: "AILIER", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 72'
    minutesPlayed: 80,
  },
  { num: 15, firstName: "Kylan", lastName: "Hamdaoui", position: "ARRIERE", isStarter: true, minutesPlayed: 60 },

  // Remplaçants
  { num: 16, firstName: "Léon", lastName: "Seilala Lam", position: "TALONNEUR", isStarter: false, minutesPlayed: 24 },       // entré 56'
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },       // entré 56'
  { num: 18, firstName: "Robert", lastName: "Simmons", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 0 },      // non entré
  { num: 19, firstName: "Selevasio", lastName: "Tolofua", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 15 }, // entré 65'
  { num: 20, firstName: "Lucas", lastName: "Zamora", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 },        // entré 60'
  { num: 21, firstName: "Irae Vincynt", lastName: "Simone", position: "DEMI_OUVERTURE", isStarter: false, minutesPlayed: 20 }, // entré 60'
  { num: 22, firstName: "Pita-Gus", lastName: "Sowakula", position: "NUMERO_HUIT", isStarter: false, minutesPlayed: 15 },     // entré 65'
  { num: 23, firstName: "Régis", lastName: "Montagne", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },       // entré 56'
];

async function main() {
  console.log("=== Ajout composition ASM Clermont — J12 (20/12/2025) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 12,
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

  for (const p of ASM_SQUAD) {
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
    const min = p.minutesPlayed != null ? ` [${p.minutesPlayed}']` : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName} ${p.lastName}${cap}${pts}${min}`);
  }

  const totalPointsASM = ASM_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsASM} (attendu : 20)`);
  if (totalPointsASM !== 20) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${ASM_SQUAD.length} joueurs Clermont ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

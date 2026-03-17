/**
 * Ajout de la composition de la Section Paloise pour le match J17 (22/02/2026)
 * USAP 40 - Pau 24
 *
 * Crée les 23 joueurs de Pau puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr
 *
 * Essais : Montoya (8'), Grandidier-Nkanang (41'), Etchebehere (74')
 * Transformations : Despérès (8', 41'), Arfeuil (74')
 * Pénalités : Despérès (28')
 *
 * Pau : 3E + 3T + 1P = 15 + 6 + 3 = 24 points
 *
 * Exécution : npx tsx scripts/add-pau-compo-j17-2025.ts
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

const PAU_SQUAD: {
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
  { num: 1, firstName: "Lekso", lastName: "Kaulashvili", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
  {
    num: 2, firstName: "Julián", lastName: "Montoya", position: "TALONNEUR", isStarter: true,
    isCaptain: true, tries: 1, totalPoints: 5, // Essai 8'
    minutesPlayed: 56,
  },
  { num: 3, firstName: "Thomas", lastName: "Laclayat", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
  { num: 4, firstName: "Thomas", lastName: "Jolmes", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Jimi", lastName: "Maximin", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Sacha", lastName: "Zegueur", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 65 },
  { num: 7, firstName: "Loïc", lastName: "Credoz", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Beka", lastName: "Gorgadze", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Daniel", lastName: "Robson", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 60 },
  {
    num: 10, firstName: "Axel", lastName: "Despérès", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 2, penalties: 1, totalPoints: 7, // 2T(4) + 1P(3) = 7
    minutesPlayed: 60,
  },
  {
    num: 11, firstName: "Aaron", lastName: "Grandidier-Nkanang", position: "AILIER", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 41'
    minutesPlayed: 80,
  },
  { num: 12, firstName: "Nathan", lastName: "Decron", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Jack", lastName: "Maddocks", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  {
    num: 14, firstName: "Grégoire", lastName: "Arfeuil", position: "AILIER", isStarter: true,
    conversions: 1, totalPoints: 2, // Transfo 74'
    minutesPlayed: 80,
  },
  { num: 15, firstName: "Aymeric", lastName: "Luc", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },

  // Remplaçants
  { num: 16, firstName: "Youri", lastName: "Delhommel", position: "TALONNEUR", isStarter: false, minutesPlayed: 24 },           // entré 56'
  {
    num: 17, firstName: "Alexandre", lastName: "Etchebehere", position: "PILIER_GAUCHE", isStarter: false,
    tries: 1, totalPoints: 5, // Essai 74'
    minutesPlayed: 24,                                                                                                           // entré 56'
  },
  { num: 18, firstName: "Hugo", lastName: "Auradou", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 0 },          // non entré
  { num: 19, firstName: "Luke", lastName: "Whitelock", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 15 }, // entré 65'
  { num: 20, firstName: "Reece", lastName: "Hewat", position: "NUMERO_HUIT", isStarter: false, minutesPlayed: 0 },              // non entré
  { num: 21, firstName: "Thomas", lastName: "Souverbie", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 },      // entré 60'
  { num: 22, firstName: "Clément", lastName: "Mondinat", position: "CENTRE", isStarter: false, minutesPlayed: 20 },             // entré 60'
  { num: 23, firstName: "Jon", lastName: "Zabala", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },             // entré 56'
];

async function main() {
  console.log("=== Ajout composition Section Paloise — J17 (22/02/2026) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 17,
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

  for (const p of PAU_SQUAD) {
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

  const totalPointsPau = PAU_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsPau} (attendu : 24)`);
  if (totalPointsPau !== 24) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${PAU_SQUAD.length} joueurs Section Paloise ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Ajout de la composition de la Section Paloise pour le match J9 (01/11/2025)
 * Pau 27 - USAP 23
 *
 * Crée les 23 joueurs de Pau puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr, espn.com, allrugby.com
 *
 * Essais : Maddocks (18'), Arfeuil (37'), Daubagna (44'), Gailleton (58')
 * Transformations : Despérès (19', 45')
 * Pénalités : Despérès (7')
 * Carton jaune : Gorgadze (40')
 *
 * Pau : 4E + 2T + 1P = 20 + 4 + 3 = 27 points
 *
 * Exécution : npx tsx scripts/add-pau-compo-j9-2025.ts
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
  yellowCard?: boolean;
  yellowCardMinute?: number;
}[] = [
  // Titulaires
  { num: 1, firstName: "Daniel", lastName: "Bibi Biziwu", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
  { num: 2, firstName: "Lucas", lastName: "Rey", position: "TALONNEUR", isStarter: true, minutesPlayed: 56 },
  { num: 3, firstName: "Guram", lastName: "Papidze", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
  { num: 4, firstName: "Thomas", lastName: "Jolmes", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Mickaël", lastName: "Capelli", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Loïc", lastName: "Credoz", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 56 },
  { num: 7, firstName: "Reece", lastName: "Hewat", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
  {
    num: 8, firstName: "Beka", lastName: "Gorgadze", position: "NUMERO_HUIT", isStarter: true,
    isCaptain: true, yellowCard: true, yellowCardMinute: 40,
    minutesPlayed: 80,
  },
  {
    num: 9, firstName: "Thibault", lastName: "Daubagna", position: "DEMI_DE_MELEE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 44'
    minutesPlayed: 56,
  },
  {
    num: 10, firstName: "Axel", lastName: "Despérès", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 2, penalties: 1, totalPoints: 7, // 2T(4) + 1P(3) = 7
    minutesPlayed: 80,
  },
  { num: 11, firstName: "Aymeric", lastName: "Luc", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Nathan", lastName: "Decron", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Tumua", lastName: "Manu", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  {
    num: 14, firstName: "Grégoire", lastName: "Arfeuil", position: "AILIER", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 37'
    minutesPlayed: 80,
  },
  {
    num: 15, firstName: "Jack", lastName: "Maddocks", position: "ARRIERE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 18'
    minutesPlayed: 80,
  },

  // Remplaçants
  { num: 16, firstName: "Julián", lastName: "Montoya", position: "TALONNEUR", isStarter: false, minutesPlayed: 24 },          // entré 56'
  { num: 17, firstName: "Hugo", lastName: "Parrou", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },         // entré 56'
  { num: 18, firstName: "Jimi", lastName: "Maximin", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 0 },        // non entré
  { num: 19, firstName: "Joel", lastName: "Kpoku", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 24 },   // entré 56'
  { num: 20, firstName: "Facundo", lastName: "Isa", position: "NUMERO_HUIT", isStarter: false, minutesPlayed: 0 },            // non entré
  { num: 21, firstName: "Thomas", lastName: "Souverbie", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 24 },    // entré 56'
  {
    num: 22, firstName: "Émilien", lastName: "Gailleton", position: "CENTRE", isStarter: false,
    tries: 1, totalPoints: 5, // Essai 58'
    minutesPlayed: 22, // entré ~58'
  },
  { num: 23, firstName: "Siate", lastName: "Tokolahi", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },       // entré 56'
];

async function main() {
  console.log("=== Ajout composition Section Paloise — J9 (01/11/2025) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 9,
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

  const totalPointsPau = PAU_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsPau} (attendu : 27)`);
  if (totalPointsPau !== 27) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${PAU_SQUAD.length} joueurs Pau ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

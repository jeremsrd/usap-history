/**
 * Ajout de la composition de Benetton pour le match J2 Challenge Cup (13/12/2025)
 * Benetton 44 - USAP 31
 *
 * Source : epcrugby.com, espn.com, skysports.com, allrugby.com
 *
 * Essais : Odogwu x2 (8', 24'), Izekor (19'), Bernasconi (49'), Mendy (59')
 * Transformations : Albornoz x3 (9', 19', 25'), Umaga x2 (50', 60')
 * Pénalités : Albornoz (14'), Umaga x2 (67', 78')
 *
 * Benetton : 5E + 5T + 3P = 25 + 10 + 9 = 44 points
 *
 * Exécution : npx tsx scripts/add-benetton-compo-challenge-j2-2025.ts
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

const BENETTON_SQUAD: {
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
  { num: 1, firstName: "Mirco", lastName: "Spagnolo", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
  { num: 2, firstName: "Bautista", lastName: "Bernasconi", position: "TALONNEUR", isStarter: true,
    tries: 1, totalPoints: 5, minutesPlayed: 56 }, // Essai 49'
  { num: 3, firstName: "Giosue", lastName: "Zilocchi", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
  { num: 4, firstName: "Niccolo", lastName: "Cannone", position: "DEUXIEME_LIGNE", isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 5, firstName: "Eli", lastName: "Snyman", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Alessandro", lastName: "Izekor", position: "TROISIEME_LIGNE_AILE", isStarter: true,
    tries: 1, totalPoints: 5, minutesPlayed: 65 }, // Essai 19'
  { num: 7, firstName: "Manuel", lastName: "Zuliani", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 65 },
  { num: 8, firstName: "So'otala", lastName: "Fa'aso'o", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Andy", lastName: "Uren", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 60 },
  { num: 10, firstName: "Tomas", lastName: "Albornoz", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 3, penalties: 1, totalPoints: 9, minutesPlayed: 56 }, // 3T(6) + 1P(3)
  { num: 11, firstName: "Ignacio", lastName: "Mendy", position: "AILIER", isStarter: true,
    tries: 1, totalPoints: 5, minutesPlayed: 80 }, // Essai 59'
  { num: 12, firstName: "Leonardo", lastName: "Marin", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Paolo", lastName: "Odogwu", position: "CENTRE", isStarter: true,
    tries: 2, totalPoints: 10, minutesPlayed: 80 }, // Doublé 8', 24' — Homme du match
  { num: 14, firstName: "Louis", lastName: "Lynagh", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Rhyno", lastName: "Smith", position: "ARRIERE", isStarter: true, minutesPlayed: 56 },

  // Remplaçants
  { num: 16, firstName: "Siua", lastName: "Maile", position: "TALONNEUR", isStarter: false, minutesPlayed: 24 },
  { num: 17, firstName: "Thomas", lastName: "Gallo", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },
  { num: 18, firstName: "Simone", lastName: "Ferrari", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },
  { num: 19, firstName: "Giulio", lastName: "Marini", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 15 },
  { num: 20, firstName: "Riccardo", lastName: "Favretto", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 15 },
  { num: 21, firstName: "Alessandro", lastName: "Garbisi", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 },
  { num: 22, firstName: "Jacob", lastName: "Umaga", position: "DEMI_OUVERTURE", isStarter: false,
    conversions: 2, penalties: 2, totalPoints: 10, minutesPlayed: 24 }, // 2T(4) + 2P(6)
  { num: 23, firstName: "Malakai", lastName: "Fekitoa", position: "CENTRE", isStarter: false, minutesPlayed: 24 },
];

async function main() {
  console.log("=== Ajout composition Benetton — J2 Challenge Cup (13/12/2025) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      round: "Poule J2",
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

  for (const p of BENETTON_SQUAD) {
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
      },
    });

    const marker = p.isStarter ? "TIT" : "REM";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const cap = p.isCaptain ? " (C)" : "";
    const min = p.minutesPlayed != null ? ` [${p.minutesPlayed}']` : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName} ${p.lastName}${cap}${pts}${min}`);
  }

  const totalPointsBEN = BENETTON_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsBEN} (attendu : 44)`);
  if (totalPointsBEN !== 44) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${BENETTON_SQUAD.length} joueurs Benetton ajoutés ===`);
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

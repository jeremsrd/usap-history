/**
 * Ajout de la composition des Lions (Johannesburg) pour le match J4 Challenge Cup (17/01/2026)
 * USAP 20 - Lions 20
 *
 * Source : epcrugby.com, espn.com, allrugby.com, rugby365.com
 *
 * Essai de pénalité (22'), Smith 2P+1T (8 pts), Botha 1E (5 pts)
 * Lions : 1EP + 1E + 1T + 2P = 7 + 5 + 2 + 6 = 20 points
 *
 * Exécution : npx tsx scripts/add-lions-compo-challenge-j4-2025.ts
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

const LIONS_SQUAD: {
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
  { num: 1, firstName: "Eddie", lastName: "Davids", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
  { num: 2, firstName: "Morne", lastName: "Brandon", position: "TALONNEUR", isStarter: true, minutesPlayed: 56 },
  { num: 3, firstName: "RF", lastName: "Schoeman", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
  { num: 4, firstName: "Etienne", lastName: "Oosthuizen", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Reinhard", lastName: "Nothnagel", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Renzo", lastName: "Du Plessis", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 65 },
  { num: 7, firstName: "Bathobele", lastName: "Hlekani", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 65 },
  { num: 8, firstName: "Francke", lastName: "Horn", position: "NUMERO_HUIT", isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 9, firstName: "Haashim", lastName: "Pead", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 60 },
  { num: 10, firstName: "Chris", lastName: "Smith", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 1, penalties: 2, totalPoints: 8, minutesPlayed: 80 }, // 1T(2) + 2P(6) = 8
  { num: 11, firstName: "Angelo", lastName: "Davids", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Henco", lastName: "van Wyk", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Erich", lastName: "Cronje", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Eduan", lastName: "Keyter", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Richard", lastName: "Kriel", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },

  // Remplaçants
  { num: 16, firstName: "PJ", lastName: "Botha", position: "TALONNEUR", isStarter: false,
    tries: 1, totalPoints: 5, minutesPlayed: 24 }, // Essai 64'
  { num: 17, firstName: "SJ", lastName: "Kotze", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },
  { num: 18, firstName: "Conraad", lastName: "van Vuuren", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },
  { num: 19, firstName: "Ruben", lastName: "Schoeman", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 15 },
  { num: 20, firstName: "Darrien-Lane", lastName: "Landsberg", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 15 },
  { num: 21, firstName: "Sibabalwe", lastName: "Mahashe", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 },
  { num: 22, firstName: "Nico", lastName: "Steyn", position: "DEMI_OUVERTURE", isStarter: false, minutesPlayed: 0 },
  { num: 23, firstName: "Bronson", lastName: "Mills", position: "CENTRE", isStarter: false, minutesPlayed: 0 },
];

async function main() {
  console.log("=== Ajout composition Lions — J4 Challenge Cup (17/01/2026) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      round: "Poule J4",
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

  for (const p of LIONS_SQUAD) {
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

  // Vérification : points individuels + essai de pénalité (7) = 20
  const totalPointsLions = LIONS_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  const totalWithPT = totalPointsLions + 7;
  console.log(`\n  Vérification : total points individuels = ${totalPointsLions} + 7 (essai pénalité) = ${totalWithPT} (attendu : 20)`);
  if (totalWithPT !== 20) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${LIONS_SQUAD.length} joueurs Lions ajoutés ===`);
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

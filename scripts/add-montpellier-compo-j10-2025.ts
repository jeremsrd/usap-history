/**
 * Ajout de la composition du Montpellier Hérault Rugby pour le match J10 (22/11/2025)
 * USAP 0 - Montpellier 28
 *
 * Crée les 23 joueurs de Montpellier puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr, espn.com, allrugby.com, francebleu.fr
 *
 * Essais : Tolofua (33'), Hounkpatin (47'), Becognée (76')
 * Transformations : Miotti (34'), Hogg (76')
 * Pénalités : Miotti (15', 39')
 * Drop : Hogg (68')
 *
 * Montpellier : 3E + 2T + 2P + 1D = 15 + 4 + 6 + 3 = 28 points
 *
 * Exécution : npx tsx scripts/add-montpellier-compo-j10-2025.ts
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

const MHR_SQUAD: {
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
  { num: 1, firstName: "Enzo", lastName: "Forletta", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
  {
    num: 2, firstName: "Christopher", lastName: "Tolofua", position: "TALONNEUR", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 33'
    minutesPlayed: 56,
  },
  {
    num: 3, firstName: "Wilfrid", lastName: "Hounkpatin", position: "PILIER_DROIT", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 47'
    minutesPlayed: 56,
  },
  { num: 4, firstName: "Bastien", lastName: "Chalureau", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Tyler", lastName: "Duguid", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Yacouba", lastName: "Camara", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 66 },
  {
    num: 7, firstName: "Lenni", lastName: "Nouchi", position: "TROISIEME_LIGNE_AILE", isStarter: true,
    isCaptain: true,
    minutesPlayed: 80,
  },
  { num: 8, firstName: "Billy", lastName: "Vunipola", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Léo", lastName: "Coly", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 56 },
  {
    num: 10, firstName: "Domingo", lastName: "Miotti", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 1, penalties: 2, totalPoints: 8, // 1T(2) + 2P(6) = 8
    minutesPlayed: 56,
  },
  { num: 11, firstName: "Maël", lastName: "Moustin", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Lennox", lastName: "Anyanwu", position: "CENTRE", isStarter: true, minutesPlayed: 72 },
  { num: 13, firstName: "Auguste", lastName: "Cadot", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Gabriel", lastName: "Ngandebe", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tom", lastName: "Banks", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },

  // Remplaçants
  { num: 16, firstName: "Ricky", lastName: "Riccitelli", position: "TALONNEUR", isStarter: false, minutesPlayed: 24 },          // entré 56'
  { num: 17, firstName: "Baptiste", lastName: "Erdocio", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },      // entré 56'
  { num: 18, firstName: "Marco", lastName: "Tauleigne", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 14 }, // entré 66'
  {
    num: 19, firstName: "Alexandre", lastName: "Bécognée", position: "TROISIEME_LIGNE_AILE", isStarter: false,
    tries: 1, totalPoints: 5, // Essai 76'
    minutesPlayed: 14, // entré ~66'
  },
  { num: 20, firstName: "Ali", lastName: "Price", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 24 },             // entré 56'
  {
    num: 21, firstName: "Stuart", lastName: "Hogg", position: "DEMI_OUVERTURE", isStarter: false,
    conversions: 1, dropGoals: 1, totalPoints: 5, // 1T(2) + 1D(3) = 5
    minutesPlayed: 24, // entré 56'
  },
  { num: 22, firstName: "Arthur", lastName: "Vincent", position: "CENTRE", isStarter: false, minutesPlayed: 8 },                // entré 72'
  { num: 23, firstName: "Mohamed", lastName: "Haouas", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },          // entré 56'
];

async function main() {
  console.log("=== Ajout composition Montpellier HRC — J10 (22/11/2025) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 10,
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

  for (const p of MHR_SQUAD) {
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

  const totalPointsMHR = MHR_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsMHR} (attendu : 28)`);
  if (totalPointsMHR !== 28) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${MHR_SQUAD.length} joueurs Montpellier ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

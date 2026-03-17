/**
 * Ajout de la composition du Stade Français Paris pour le match J18 (28/02/2026)
 * Stade Français 42 - USAP 21
 *
 * Crée les 23 joueurs du SF puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr
 *
 * Essais : Tanga Mangene (6'), Ward (21'), Vili (30'), Hirigoyen (37'),
 *          Motassi (56'), Halaifonua (73')
 * Transformations : Carbonel (7', 22', 31', 38', 56', 73') — 6/6
 * Carton jaune : Nicotera (59')
 *
 * SF : 6E + 6T = 30 + 12 = 42 points
 *
 * Exécution : npx tsx scripts/add-stadefrancais-compo-j18-2025.ts
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
  dropGoals?: number;
  totalPoints?: number;
  minutesPlayed?: number;
  yellowCard?: boolean;
  yellowCardMin?: number;
}[] = [
  // Titulaires
  { num: 1, firstName: "Moses", lastName: "Alo Emile", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
  {
    num: 2, firstName: "Giacomo", lastName: "Nicotera", position: "TALONNEUR", isStarter: true,
    minutesPlayed: 56,
    yellowCard: true, yellowCardMin: 59, // carton jaune au début du remplacement? Il est remplacé mais reçoit le jaune
  },
  { num: 3, firstName: "Giorgi", lastName: "Melikidze", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
  {
    num: 4, firstName: "Paul", lastName: "Gabrillagues", position: "DEUXIEME_LIGNE", isStarter: true,
    isCaptain: true, minutesPlayed: 80,
  },
  { num: 5, firstName: "Baptiste", lastName: "Pesenti", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Juan Martín", lastName: "Scelzo", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 65 },
  {
    num: 7, firstName: "Mathieu", lastName: "Hirigoyen", position: "TROISIEME_LIGNE_AILE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 37'
    minutesPlayed: 80,
  },
  {
    num: 8, firstName: "Yoan", lastName: "Tanga Mangene", position: "NUMERO_HUIT", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 6'
    minutesPlayed: 65,
  },
  { num: 9, firstName: "Tawera", lastName: "Kerr-Barlow", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 60 },
  {
    num: 10, firstName: "Louis", lastName: "Carbonel", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 6, totalPoints: 12, // 6/6 aux transformations
    minutesPlayed: 80,
  },
  { num: 11, firstName: "Lester", lastName: "Etien", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  {
    num: 12, firstName: "Tani", lastName: "Vili", position: "CENTRE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 30'
    minutesPlayed: 80,
  },
  {
    num: 13, firstName: "Jérémy", lastName: "Ward", position: "CENTRE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 21'
    minutesPlayed: 80,
  },
  { num: 14, firstName: "Peniasi", lastName: "Dakuwaqa", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Léo", lastName: "Barré", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },

  // Remplaçants
  { num: 16, firstName: "Lucas", lastName: "Peyresblanques", position: "TALONNEUR", isStarter: false, minutesPlayed: 24 },       // entré 56'
  { num: 17, firstName: "Thierry", lastName: "Paiva", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },          // entré 56'
  {
    num: 18, firstName: "Tanginoa", lastName: "Halaifonua", position: "DEUXIEME_LIGNE", isStarter: false,
    tries: 1, totalPoints: 5, // Essai 73'
    minutesPlayed: 24,                                                                                                             // entré 56'
  },
  { num: 19, firstName: "Pierre-Henri", lastName: "Azagoh", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 15 }, // entré 65'
  { num: 20, firstName: "Iakopo", lastName: "Mapu", position: "NUMERO_HUIT", isStarter: false, minutesPlayed: 15 },              // entré 65'
  {
    num: 21, firstName: "Thibaut", lastName: "Motassi", position: "DEMI_DE_MELEE", isStarter: false,
    tries: 1, totalPoints: 5, // Essai 56'
    minutesPlayed: 20,                                                                                                             // entré 60'
  },
  { num: 22, firstName: "Joseph", lastName: "Marchant", position: "CENTRE", isStarter: false, minutesPlayed: 0 },                // non entré
  { num: 23, firstName: "Paul", lastName: "Alo Emile Jr", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },       // entré 56'
];

async function main() {
  console.log("=== Ajout composition Stade Français — J18 (28/02/2026) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 18,
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
        dropGoals: p.dropGoals ?? 0,
        totalPoints: p.totalPoints ?? 0,
        minutesPlayed: p.minutesPlayed ?? null,
        yellowCard: p.yellowCard ?? false,
        yellowCardMin: p.yellowCardMin ?? null,
      },
    });

    const marker = p.isStarter ? "TIT" : "REM";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const cap = p.isCaptain ? " (C)" : "";
    const yc = p.yellowCard ? " 🟨" : "";
    const min = p.minutesPlayed != null ? ` [${p.minutesPlayed}']` : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName} ${p.lastName}${cap}${pts}${yc}${min}`);
  }

  const totalPointsSF = SF_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsSF} (attendu : 42)`);
  if (totalPointsSF !== 42) {
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

/**
 * Ajout de la composition du Castres Olympique pour le match J11 (29/11/2025)
 * Castres 23 - USAP 7
 *
 * Crée les 23 joueurs de Castres puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr, castres-olympique.com, vibrez-rugby.com
 *
 * Essais : Ramototabua (31'), Goodhue (80')
 * Transformations : Popelin (31'), Chabouni (80')
 * Pénalités : Popelin (46', 51', 66')
 *
 * Castres : 2E + 2T + 3P = 10 + 4 + 9 = 23 points
 *
 * Exécution : npx tsx scripts/add-castres-compo-j11-2025.ts
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

const CO_SQUAD: {
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
  { num: 1, firstName: "Quentin", lastName: "Walcker", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
  { num: 2, firstName: "Teddy", lastName: "Durand", position: "TALONNEUR", isStarter: true, minutesPlayed: 56 },
  { num: 3, firstName: "Aurélien", lastName: "Azar", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
  { num: 4, firstName: "Guillaume", lastName: "Ducat", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Florent", lastName: "Vanverberghe", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  {
    num: 6, firstName: "Mathieu", lastName: "Babillot", position: "TROISIEME_LIGNE_AILE", isStarter: true,
    isCaptain: true,
    minutesPlayed: 80,
  },
  { num: 7, firstName: "Baptiste", lastName: "Delaporte", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 65 },
  {
    num: 8, firstName: "Veresa", lastName: "Ramototabua", position: "NUMERO_HUIT", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 31'
    minutesPlayed: 80,
  },
  { num: 9, firstName: "Jérémy", lastName: "Fernandez", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 60 },
  {
    num: 10, firstName: "Pierre", lastName: "Popelin", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 1, penalties: 3, totalPoints: 11, // 1T(2) + 3P(9) = 11
    minutesPlayed: 60,
  },
  { num: 11, firstName: "Rémy", lastName: "Baget", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  {
    num: 12, firstName: "Jack", lastName: "Goodhue", position: "CENTRE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 80'
    minutesPlayed: 80,
  },
  { num: 13, firstName: "Adrea", lastName: "Cocagi", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Vuate", lastName: "Karawalevu", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  {
    num: 15, firstName: "Théo", lastName: "Chabouni", position: "ARRIERE", isStarter: true,
    conversions: 1, totalPoints: 2, // Transfo essai Goodhue 80'
    minutesPlayed: 80,
  },

  // Remplaçants
  { num: 16, firstName: "Loris", lastName: "Zarantonello", position: "TALONNEUR", isStarter: false, minutesPlayed: 24 },          // entré 56'
  { num: 17, firstName: "Loïs", lastName: "Guérois-Galisson", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },   // entré 56'
  { num: 18, firstName: "Gauthier", lastName: "Maravat", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 0 },        // non entré
  { num: 19, firstName: "Baptiste", lastName: "Cope", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 15 },    // entré 65'
  { num: 20, firstName: "Abraham", lastName: "Papalii", position: "NUMERO_HUIT", isStarter: false, minutesPlayed: 0 },            // non entré
  { num: 21, firstName: "Gauthier", lastName: "Doubrère", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 },       // entré 60'
  { num: 22, firstName: "Geoffrey", lastName: "Palis", position: "ARRIERE", isStarter: false, minutesPlayed: 20 },                // entré 60'
  { num: 23, firstName: "Levan", lastName: "Chilachava", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },          // entré 56'
];

async function main() {
  console.log("=== Ajout composition Castres Olympique — J11 (29/11/2025) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 11,
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

  for (const p of CO_SQUAD) {
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

  const totalPointsCO = CO_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsCO} (attendu : 23)`);
  if (totalPointsCO !== 23) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${CO_SQUAD.length} joueurs Castres ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

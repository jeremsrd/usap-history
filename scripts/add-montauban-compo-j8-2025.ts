/**
 * Ajout de la composition de l'US Montauban pour le match J8 (25/10/2025)
 * Montauban 29 - USAP 22
 *
 * Crée les 23 joueurs de Montauban puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr, itsrugby.fr, allrugby.com
 *
 * Essais : Jackson (8'), Kanika-Bilonda (40')
 * Transformations : Bosviel (9', 41')
 * Pénalités : Bosviel (14', 46', 49', 66', 71')
 * Carton orange : Ma'afu (20')
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-montauban-compo-j8-2025.ts
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

const MTB_SQUAD: {
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
  { num: 1, firstName: "Lucio", lastName: "Sordoni", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 52 },
  { num: 2, firstName: "Ru-Hann", lastName: "Greyling", position: "TALONNEUR", isStarter: true, minutesPlayed: 60 },
  { num: 3, firstName: "Thomas", lastName: "Bué", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 52 },
  { num: 4, firstName: "Tjiuee", lastName: "Uanivi", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 56 },
  {
    num: 5, firstName: "Nafi", lastName: "Ma'afu", position: "DEUXIEME_LIGNE", isStarter: true,
    yellowCard: true, yellowCardMinute: 20, // Carton orange (20 min)
    minutesPlayed: 80,
  },
  { num: 6, firstName: "Kyllian", lastName: "Ringuet", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 60 },
  { num: 7, firstName: "Frédéric", lastName: "Quercy", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Sikhumbuzo", lastName: "Notshe", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 60 },
  { num: 9, firstName: "Joe", lastName: "Powell", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 60 },
  {
    num: 10, firstName: "Jérôme", lastName: "Bosviel", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 2, penalties: 5, totalPoints: 19, // 2T(4) + 5P(15) = 19
    minutesPlayed: 80,
  },
  { num: 11, firstName: "Paul", lastName: "Vallée", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Maxime", lastName: "Espeut", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  {
    num: 13, firstName: "John Thomas", lastName: "Jackson", position: "CENTRE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 8'
    minutesPlayed: 80,
  },
  { num: 14, firstName: "Josua", lastName: "Vici", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Baptiste", lastName: "Mouchous", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },

  // Remplaçants
  { num: 16, firstName: "Vaea", lastName: "Fifita", position: "TALONNEUR", isStarter: false, minutesPlayed: 20 },             // entré 60'
  { num: 17, firstName: "Simon", lastName: "Renda", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 28 },          // entré 52'
  { num: 18, firstName: "Lucas", lastName: "Seyrolle", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 24 },      // entré 56'
  { num: 19, firstName: "Valentin", lastName: "Simutoga", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 20 }, // entré 60'
  { num: 20, firstName: "Clément", lastName: "Bitz", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 },         // entré 60'
  { num: 21, firstName: "Hugo", lastName: "Zabalza", position: "CENTRE", isStarter: false, minutesPlayed: 20 },                // entré 60'
  {
    num: 22, firstName: "Noa", lastName: "Kanika-Bilonda", position: "TROISIEME_LIGNE_AILE", isStarter: false,
    tries: 1, totalPoints: 5, // Essai 40'
    minutesPlayed: 40, // entré en cours de 1re MT
  },
  { num: 23, firstName: "Thomas", lastName: "Teyssières", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 28 },     // entré 52'
];

async function main() {
  console.log("=== Ajout composition US Montauban — J8 (25/10/2025) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 8,
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

  for (const p of MTB_SQUAD) {
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
    const yc = p.yellowCard ? " [CO]" : ""; // carton orange
    const min = p.minutesPlayed != null ? ` [${p.minutesPlayed}']` : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName} ${p.lastName}${cap}${pts}${yc}${min}`);
  }

  const totalPointsMTB = MTB_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsMTB} (attendu : 29)`);
  if (totalPointsMTB !== 29) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${MTB_SQUAD.length} joueurs Montauban ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

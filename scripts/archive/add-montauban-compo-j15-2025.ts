/**
 * Ajout de la composition de l'US Montauban pour le match J15 (24/01/2026)
 * USAP 31 - Montauban 8
 *
 * Crée les 23 joueurs de Montauban puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr
 *
 * Essais : Ahmed (~48')
 * Pénalités : Fortunel (24')
 *
 * Montauban : 1E + 0T + 1P = 5 + 0 + 3 = 8 points
 *
 * Exécution : npx tsx scripts/add-montauban-compo-j15-2025.ts
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
}[] = [
  // Titulaires
  { num: 1, firstName: "Thomas", lastName: "Bué", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
  { num: 2, firstName: "Kevin", lastName: "Firmin", position: "TALONNEUR", isStarter: true, minutesPlayed: 56 },
  { num: 3, firstName: "Sione", lastName: "Mafileo", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
  { num: 4, firstName: "Karl", lastName: "Wilkins", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Nafitalai", lastName: "Ma'afu", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 56 },
  { num: 6, firstName: "Vaea", lastName: "Fifita", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 65 },
  { num: 7, firstName: "Kyllian", lastName: "Ringuet", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Tyrone", lastName: "Viiga", position: "NUMERO_HUIT", isStarter: true, isCaptain: true, minutesPlayed: 80 },
  { num: 9, firstName: "Joseph", lastName: "Powell", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 60 },
  {
    num: 10, firstName: "Thomas", lastName: "Fortunel", position: "DEMI_OUVERTURE", isStarter: true,
    penalties: 1, totalPoints: 3, // Pénalité 24'
    minutesPlayed: 60,
  },
  { num: 11, firstName: "Maxime", lastName: "Espeut", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Simon", lastName: "Renda", position: "CENTRE", isStarter: true, minutesPlayed: 60 },
  { num: 13, firstName: "John", lastName: "Jackson", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  {
    num: 14, firstName: "Stéphane", lastName: "Ahmed", position: "AILIER", isStarter: true,
    tries: 1, totalPoints: 5, // Essai ~48'
    minutesPlayed: 80,
  },
  { num: 15, firstName: "Baptiste", lastName: "Mouchous", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },

  // Remplaçants
  { num: 16, firstName: "Jérémie", lastName: "Maurouard", position: "TALONNEUR", isStarter: false, minutesPlayed: 24 },         // entré 56'
  { num: 17, firstName: "Lucas", lastName: "Seyrolle", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },        // entré 56'
  { num: 18, firstName: "Noa-Isaac", lastName: "Kanika-Bilonda", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 24 }, // entré 56'
  { num: 19, firstName: "Tjiuee", lastName: "Uanivi", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 15 },  // entré 65'
  { num: 20, firstName: "Hugo", lastName: "Zabalza", position: "NUMERO_HUIT", isStarter: false, minutesPlayed: 20 },            // entré 60'
  { num: 21, firstName: "Jérôme", lastName: "Bosviel", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 },        // entré 60'
  { num: 22, firstName: "Maxime", lastName: "Mathy", position: "CENTRE", isStarter: false, minutesPlayed: 20 },                 // entré 60'
  { num: 23, firstName: "Facundo", lastName: "Pomponio", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },       // entré 56'
];

async function main() {
  console.log("=== Ajout composition US Montauban — J15 (24/01/2026) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 15,
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
      },
    });

    const marker = p.isStarter ? "TIT" : "REM";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const cap = p.isCaptain ? " (C)" : "";
    const min = p.minutesPlayed != null ? ` [${p.minutesPlayed}']` : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName} ${p.lastName}${cap}${pts}${min}`);
  }

  const totalPointsMTB = MTB_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsMTB} (attendu : 8)`);
  if (totalPointsMTB !== 8) {
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

/**
 * Ajout de la composition du Stade Rochelais pour le match J4 (27/09/2025)
 * La Rochelle 31 - USAP 8
 *
 * Crée les 23 joueurs du Stade Rochelais puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr, allrugby.com, vibrez-rugby.com
 *
 * Essais : Favre (17'), Jegou (53'), Penverne (56'), Botia (80')
 * Transformations : West (18'), Le Garrec (54', 57', 81')
 * Pénalité : Le Garrec (48')
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-larochelle-compo-j4-2025.ts
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

// Composition Stade Rochelais — sources : top14.lnr.fr, allrugby.com
const LAROCHELLE_SQUAD: {
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
  { num: 1, firstName: "Reda", lastName: "Wardi", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 46 },
  { num: 2, firstName: "Quentin", lastName: "Lespiaucq", position: "TALONNEUR", isStarter: true, minutesPlayed: 46 },
  { num: 3, firstName: "Karl", lastName: "Sorin", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 46 },
  { num: 4, firstName: "Paul", lastName: "Boudehent", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Kane", lastName: "Douglas", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 46 },
  { num: 6, firstName: "Judicael", lastName: "Cancoriet", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
  {
    num: 7, firstName: "Oscar", lastName: "Jegou", position: "TROISIEME_LIGNE_AILE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 53'
    minutesPlayed: 54,
  },
  {
    num: 8, firstName: "Gregory", lastName: "Alldritt", position: "NUMERO_HUIT", isStarter: true,
    isCaptain: true,
    minutesPlayed: 80,
  },
  {
    num: 9, firstName: "Nolann", lastName: "Le Garrec", position: "DEMI_DE_MELEE", isStarter: true,
    conversions: 3, penalties: 1, totalPoints: 9, // 3T(6) + 1P(3) = 9
    minutesPlayed: 80,
  },
  {
    num: 10, firstName: "Ihaia", lastName: "West", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 1, totalPoints: 2, // Transfo Favre (18')
    minutesPlayed: 80,
  },
  {
    num: 11, firstName: "Jules", lastName: "Favre", position: "AILIER", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 17'
    minutesPlayed: 80,
  },
  { num: 12, firstName: "Ulupano", lastName: "Seuteni", position: "CENTRE", isStarter: true, minutesPlayed: 69 },
  { num: 13, firstName: "Semi", lastName: "Lagivala", position: "CENTRE", isStarter: true, minutesPlayed: 54 },
  { num: 14, firstName: "Nathan", lastName: "Bollengier", position: "AILIER", isStarter: true, minutesPlayed: 54 },
  { num: 15, firstName: "Davit", lastName: "Niniashvili", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },

  // Remplaçants
  { num: 16, firstName: "Nikolozi", lastName: "Sutidze", position: "TALONNEUR", isStarter: false, minutesPlayed: 34 }, // entré 46'
  {
    num: 17, firstName: "Louis", lastName: "Penverne", position: "PILIER_GAUCHE", isStarter: false,
    tries: 1, totalPoints: 5, // Essai 56'
    minutesPlayed: 34, // entré 46'
  },
  { num: 18, firstName: "Thomas", lastName: "Lavault", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 34 }, // entré 46'
  {
    num: 19, firstName: "Levani", lastName: "Botia", position: "TROISIEME_LIGNE_AILE", isStarter: false,
    tries: 1, totalPoints: 5, // Essai 80'
    minutesPlayed: 26, // entré 54'
  },
  { num: 20, firstName: "Thomas", lastName: "Berjon", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 26 }, // entré 54'
  { num: 21, firstName: "Ugo", lastName: "Pacome", position: "CENTRE", isStarter: false, minutesPlayed: 0 },
  { num: 22, firstName: "Jack", lastName: "Nowell", position: "AILIER", isStarter: false, minutesPlayed: 26 }, // entré 54'
  { num: 23, firstName: "Aleksandre", lastName: "Kuntelia", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 34 }, // entré 46'
];

async function main() {
  console.log("=== Ajout composition Stade Rochelais — J4 (27/09/2025) ===\n");

  // Trouver le match J4
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 4,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // Nettoyage des MatchPlayer adverses existants
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: match.id, isOpponent: true },
  });
  console.log(`${deleted.count} entrée(s) adverses supprimée(s)\n`);

  for (const p of LAROCHELLE_SQUAD) {
    // Créer ou trouver le joueur
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

    // Créer le MatchPlayer
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

  // Vérification des totaux
  const totalPointsLR = LAROCHELLE_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsLR} (attendu : 31)`);
  if (totalPointsLR !== 31) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${LAROCHELLE_SQUAD.length} joueurs Stade Rochelais ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

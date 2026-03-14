/**
 * Ajout de la composition du Racing 92 pour le match J3 (20/09/2025)
 * USAP 15 - Racing 92 28
 *
 * Crée les 23 joueurs du Racing puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : racing92.fr/feuille-de-match, allrugby.com
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-racing92-compo-j3-2025.ts
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

// Composition Racing 92 — sources : racing92.fr, allrugby.com
const RACING_SQUAD: {
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
  { num: 1, firstName: "Hassane", lastName: "Kolingar", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 59 },
  { num: 2, firstName: "Janick", lastName: "Tarrit", position: "TALONNEUR", isStarter: true, minutesPlayed: 80 },
  { num: 3, firstName: "Demba", lastName: "Bamba", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 80 },
  { num: 4, firstName: "Jonny", lastName: "Hill", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 51 },
  { num: 5, firstName: "Will", lastName: "Rowlands", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Shingi", lastName: "Manyarara", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 59 },
  { num: 7, firstName: "Maxime", lastName: "Baudonne", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
  {
    num: 8, firstName: "Jordan", lastName: "Joseph", position: "NUMERO_HUIT", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 30'
    minutesPlayed: 80,
  },
  { num: 9, firstName: "Kléo", lastName: "Labarbe", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 58 },
  {
    num: 10, firstName: "Ugo", lastName: "Seunes", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 2, penalties: 2, totalPoints: 10, // 2T(4) + 2P(6) = 10
    minutesPlayed: 59,
  },
  {
    num: 11, firstName: "Vinaya", lastName: "Habosi", position: "AILIER", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 37'
    minutesPlayed: 80,
  },
  { num: 12, firstName: "Josua", lastName: "Tuisova", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  {
    num: 13, firstName: "Gaël", lastName: "Fickou", position: "CENTRE", isStarter: true,
    isCaptain: true,
    minutesPlayed: 80,
  },
  {
    num: 14, firstName: "Wilfried", lastName: "Hulleu", position: "AILIER", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 15'
    minutesPlayed: 80,
  },
  { num: 15, firstName: "Sam", lastName: "James", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },

  // Remplaçants
  { num: 16, firstName: "Yacine", lastName: "Basse", position: "TALONNEUR", isStarter: false, minutesPlayed: 0 },
  { num: 17, firstName: "Guram", lastName: "Gogichashvili", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 21 }, // entré 59'
  { num: 18, firstName: "Fabien", lastName: "Sanconnie", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 21 }, // entré 59'
  { num: 19, firstName: "Thomas", lastName: "Lainault", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 29 }, // entré 51'
  { num: 20, firstName: "Nicky", lastName: "Hughes", position: "NUMERO_HUIT", isStarter: false, minutesPlayed: 0 },
  {
    num: 21, firstName: "Max", lastName: "Spring", position: "DEMI_DE_MELEE", isStarter: false,
    penalties: 1, totalPoints: 3, // Pénalité 59'
    minutesPlayed: 22, // entré 58'
  },
  { num: 22, firstName: "Joey", lastName: "Manu", position: "CENTRE", isStarter: false, minutesPlayed: 21 }, // entré 59'
  { num: 23, firstName: "Giorgi", lastName: "Kharaishvili", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 0 },
];

async function main() {
  console.log("=== Ajout composition Racing 92 — J3 (20/09/2025) ===\n");

  // Trouver le match J3
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 3,
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

  for (const p of RACING_SQUAD) {
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
  const totalPointsRacing = RACING_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsRacing} (attendu : 28)`);
  if (totalPointsRacing !== 28) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${RACING_SQUAD.length} joueurs Racing 92 ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Ajout de la composition du Stade Toulousain pour le match J14 (03/01/2026)
 * USAP 30 - Toulouse 27
 *
 * Crée les 23 joueurs de Toulouse puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr, stadetoulousain.fr
 *
 * Essais : Thomas (20'), Bertrand (30'), Gourgues (38')
 * Transformations : Gourgues (20', 30', 38')
 * Pénalités : Gourgues (50', 55')
 *
 * Toulouse : 3E + 3T + 2P = 15 + 6 + 6 = 27 points
 *
 * Exécution : npx tsx scripts/add-toulouse-compo-j14-2025.ts
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

const ST_SQUAD: {
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
  {
    num: 1, firstName: "Benjamin", lastName: "Bertrand", position: "PILIER_GAUCHE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 30'
    minutesPlayed: 56,
  },
  { num: 2, firstName: "Thomas", lastName: "Lacombre", position: "TALONNEUR", isStarter: true, minutesPlayed: 56 },
  { num: 3, firstName: "Dorian", lastName: "Aldegheri", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
  { num: 4, firstName: "Efrain", lastName: "Elias", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Emmanuel", lastName: "Meafou", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Mathis", lastName: "Castro-Ferreira", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 65 },
  { num: 7, firstName: "Léo", lastName: "Banos", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Théo", lastName: "Ntamack", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 65 },
  { num: 9, firstName: "Paul", lastName: "Graou", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 60 },
  {
    num: 10, firstName: "Kalvin", lastName: "Gourgues", position: "DEMI_OUVERTURE", isStarter: true,
    tries: 1, conversions: 3, penalties: 2, totalPoints: 17, // 1E(5) + 3T(6) + 2P(6) = 17
    minutesPlayed: 80,
  },
  { num: 11, firstName: "Dimitri", lastName: "Delibes", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Lucas", lastName: "Vignères", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Paul", lastName: "Costes", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  {
    num: 14, firstName: "Teddy", lastName: "Thomas", position: "AILIER", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 20'
    minutesPlayed: 60,
  },
  { num: 15, firstName: "Thomas", lastName: "Alary", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },

  // Remplaçants
  { num: 16, firstName: "Peato", lastName: "Mauvaka", position: "TALONNEUR", isStarter: false, minutesPlayed: 24 },              // entré 56'
  { num: 17, firstName: "Paul", lastName: "Mallez", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },            // entré 56'
  { num: 18, firstName: "Clément", lastName: "Vergé", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 0 },          // non entré
  { num: 19, firstName: "Roméo", lastName: "Bonnard-Martin", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 15 }, // entré 65'
  { num: 20, firstName: "Alexandre", lastName: "Roumat", position: "NUMERO_HUIT", isStarter: false, minutesPlayed: 15 },         // entré 65'
  { num: 21, firstName: "Naoto", lastName: "Saito", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 },            // entré 60'
  { num: 22, firstName: "Jérémy", lastName: "Némor", position: "AILIER", isStarter: false, minutesPlayed: 20 },                  // entré 60'
  { num: 23, firstName: "Georges-Henri", lastName: "Colombe", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },   // entré 56'
];

async function main() {
  console.log("=== Ajout composition Stade Toulousain — J14 (03/01/2026) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 14,
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

  for (const p of ST_SQUAD) {
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

  const totalPointsST = ST_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsST} (attendu : 27)`);
  if (totalPointsST !== 27) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${ST_SQUAD.length} joueurs Toulouse ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

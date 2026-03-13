/**
 * Ajout de la composition du Stade Toulousain pour le match J2 (13/09/2025)
 * Toulouse 31 - USAP 13
 *
 * Crée les 23 joueurs toulousains puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr/feuille-de-match/2025-2026/j2/11319-toulouse-perpignan/compositions
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-toulouse-compo-j2-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmnerl8r002r1uj5h9r6ioiy"; // Match J2 Toulouse-USAP 2025-2026

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Composition Stade Toulousain — source LNR officielle
const TOULOUSE_SQUAD: {
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
  yellowCard?: boolean;
  yellowCardMin?: number;
  minutesPlayed?: number;
}[] = [
  // Titulaires
  { num: 1, firstName: "Rodrigue", lastName: "Neti", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 53 },
  { num: 2, firstName: "Guillaume", lastName: "Cramont", position: "TALONNEUR", isStarter: true, minutesPlayed: 53 },
  { num: 3, firstName: "Joël", lastName: "Merkler Perez", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 53 },
  { num: 4, firstName: "Joshua", lastName: "Brennan", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
  {
    num: 5, firstName: "Thibaud", lastName: "Flament", position: "DEUXIEME_LIGNE", isStarter: true,
    tries: 1, totalPoints: 5, minutesPlayed: 80,
  },
  { num: 6, firstName: "Léo", lastName: "Banos", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 53 },
  {
    num: 7, firstName: "Anthony", lastName: "Jelonch", position: "TROISIEME_LIGNE_AILE", isStarter: true,
    isCaptain: true, minutesPlayed: 80,
  },
  { num: 8, firstName: "Alexandre", lastName: "Roumat", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Naoto", lastName: "Saito", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 53 },
  {
    num: 10, firstName: "Romain", lastName: "Ntamack", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 1, totalPoints: 2, // Transfo du 4e essai (57')
    minutesPlayed: 80,
  },
  { num: 11, firstName: "Matthis", lastName: "Lebel", position: "AILIER", isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Kalvin", lastName: "Gourgues", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
  {
    num: 13, firstName: "Pierre-Louis", lastName: "Barassi", position: "CENTRE", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 20'
    minutesPlayed: 80,
  },
  {
    num: 14, firstName: "Dimitri", lastName: "Delibes", position: "AILIER", isStarter: true,
    tries: 1, totalPoints: 5, // Essai 47'
    minutesPlayed: 80,
  },
  {
    num: 15, firstName: "Thomas", lastName: "Ramos", position: "ARRIERE", isStarter: true,
    conversions: 3, penalties: 1, totalPoints: 9, // 3T(6) + 1P(3) = 9
    minutesPlayed: 80,
  },
  // Remplaçants — entrés à la 53' (source Eurosport)
  { num: 16, firstName: "Julien", lastName: "Marchand", position: "TALONNEUR", isStarter: false, minutesPlayed: 27 },
  { num: 17, firstName: "Cyril", lastName: "Baille", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 27 },
  {
    num: 18, firstName: "Clément", lastName: "Vergé", position: "DEUXIEME_LIGNE", isStarter: false,
    tries: 1, totalPoints: 5, // Essai 57'
    minutesPlayed: 27,
  },
  { num: 19, firstName: "Jack", lastName: "Willis", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 27 },
  { num: 20, firstName: "Paul", lastName: "Graou", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 27 },
  { num: 21, firstName: "Célian", lastName: "Pouzelgues", position: "CENTRE", isStarter: false, minutesPlayed: 0 },
  { num: 22, firstName: "Blair", lastName: "Kinghorn", position: "ARRIERE", isStarter: false, minutesPlayed: 27 },
  { num: 23, firstName: "Dorian", lastName: "Aldegheri", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 27 },
];

async function main() {
  console.log("=== Ajout composition Stade Toulousain — J2 (13/09/2025) ===\n");

  // Nettoyage des MatchPlayer adverses existants
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID, isOpponent: true },
  });
  console.log(`${deleted.count} entrée(s) adverses supprimée(s)\n`);

  for (const p of TOULOUSE_SQUAD) {
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
        matchId: MATCH_ID,
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
        yellowCard: p.yellowCard ?? false,
        yellowCardMin: p.yellowCardMin ?? null,
        minutesPlayed: p.minutesPlayed ?? null,
      },
    });

    const marker = p.isStarter ? "TIT" : "REM";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const yc = p.yellowCard ? ` [CJ ${p.yellowCardMin}']` : "";
    const cap = p.isCaptain ? " (C)" : "";
    const min = p.minutesPlayed != null ? ` [${p.minutesPlayed}']` : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName} ${p.lastName}${cap}${pts}${yc}${min}`);
  }

  // Vérification des totaux
  const totalPointsToulouse = TOULOUSE_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsToulouse} (attendu : 31)`);
  if (totalPointsToulouse !== 31) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  console.log(`\n=== Terminé : ${TOULOUSE_SQUAD.length} joueurs toulousains ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

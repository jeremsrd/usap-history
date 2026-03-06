/**
 * Ajout de la composition du LOU Rugby pour le match J7 (19/10/2024)
 * USAP 29 - 26 LOU
 *
 * Crée les 23 joueurs lyonnais puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr, all.rugby, lourugby.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-lou-compo-j7.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs7h002t1umrliehntag";

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Composition LOU Rugby — source LNR officielle / all.rugby
const LOU_SQUAD: {
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
}[] = [
  // Titulaires
  { num: 1, firstName: "Hamza", lastName: "Kaabeche", position: "PILIER_GAUCHE", isStarter: true },
  { num: 2, firstName: "Guillaume", lastName: "Marchand", position: "TALONNEUR", isStarter: true },
  { num: 3, firstName: "Jermaine", lastName: "Ainsley", position: "PILIER_DROIT", isStarter: true },
  { num: 4, firstName: "Mickaël", lastName: "Guillard", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 5, firstName: "Tomas", lastName: "Lavanini", position: "DEUXIEME_LIGNE", isStarter: true },
  {
    num: 6, firstName: "Steeve", lastName: "Blanc-Mappaz", position: "TROISIEME_LIGNE_AILE", isStarter: true,
    isCaptain: true,
  },
  { num: 7, firstName: "Dylan", lastName: "Cretin", position: "TROISIEME_LIGNE_AILE", isStarter: true },
  { num: 8, firstName: "Beka", lastName: "Shvangiradze", position: "NUMERO_HUIT", isStarter: true },
  {
    num: 9, firstName: "Baptiste", lastName: "Couilloud", position: "DEMI_DE_MELEE", isStarter: true,
    tries: 1, totalPoints: 5,
  },
  {
    num: 10, firstName: "Léo", lastName: "Berdeu", position: "DEMI_OUVERTURE", isStarter: true,
    conversions: 2, penalties: 4, totalPoints: 16, // 2T(4) + 4P(12) = 16
  },
  { num: 11, firstName: "Monty", lastName: "Ioane", position: "AILIER", isStarter: true },
  { num: 12, firstName: "Josiah", lastName: "Maraku", position: "CENTRE", isStarter: true },
  {
    num: 13, firstName: "Alfred", lastName: "Parisien", position: "CENTRE", isStarter: true,
    tries: 1, totalPoints: 5, yellowCard: true, yellowCardMin: 68,
  },
  { num: 14, firstName: "Davit", lastName: "Niniashvili", position: "AILIER", isStarter: true },
  { num: 15, firstName: "Alexandre", lastName: "Tchaptchet", position: "ARRIERE", isStarter: true },
  // Remplaçants
  { num: 16, firstName: "Samuel", lastName: "Matavesi", position: "TALONNEUR", isStarter: false },
  { num: 17, firstName: "Sébastien", lastName: "Taofifenua", position: "PILIER_GAUCHE", isStarter: false },
  { num: 18, firstName: "Félix", lastName: "Lambey", position: "DEUXIEME_LIGNE", isStarter: false },
  { num: 19, firstName: "Maxime", lastName: "Gouzou", position: "TROISIEME_LIGNE_AILE", isStarter: false },
  { num: 20, firstName: "Esteban", lastName: "Gonzalez", position: "DEMI_DE_MELEE", isStarter: false },
  { num: 21, firstName: "Paddy", lastName: "Jackson", position: "DEMI_OUVERTURE", isStarter: false },
  {
    num: 22, firstName: "Semi", lastName: "Radradra", position: "CENTRE", isStarter: false,
    yellowCard: true, yellowCardMin: 68,
  },
  { num: 23, firstName: "Cedate", lastName: "Gomes Sa", position: "PILIER_DROIT", isStarter: false },
];

async function main() {
  console.log("=== Ajout composition LOU Rugby — J7 (19/10/2024) ===\n");

  // Nettoyage des MatchPlayer adverses existants
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID, isOpponent: true },
  });
  console.log(`${deleted.count} entrée(s) adverses supprimée(s)\n`);

  for (const p of LOU_SQUAD) {
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
      },
    });

    const marker = p.isStarter ? "TIT" : "REM";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const yc = p.yellowCard ? ` [CJ ${p.yellowCardMin}']` : "";
    const cap = p.isCaptain ? " (C)" : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName} ${p.lastName}${cap}${pts}${yc}`);
  }

  console.log(`\n=== Terminé : ${LOU_SQUAD.length} joueurs lyonnais ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

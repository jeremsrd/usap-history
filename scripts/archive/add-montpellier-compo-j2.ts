/**
 * Ajout de la composition de Montpellier pour le match J2 (14/09/2024)
 * USAP 7 - 26 Montpellier
 *
 * Crée les 23 joueurs montpelliérains puis les ajoute comme MatchPlayer (isOpponent: true)
 * Source : top14.lnr.fr/feuille-de-match/2024-2025/j2/10883-perpignan-montpellier/compositions
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs31002j1umro8j79pb1";

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Composition Montpellier — source LNR officielle
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
  yellowCard?: boolean;
  yellowCardMin?: number;
}[] = [
  // Titulaires
  { num: 1, firstName: "Enzo", lastName: "Forletta", position: "PILIER_GAUCHE", isStarter: true },
  { num: 2, firstName: "Vano", lastName: "Karkadze", position: "TALONNEUR", isStarter: true },
  { num: 3, firstName: "Luka", lastName: "Japaridze", position: "PILIER_DROIT", isStarter: true },
  { num: 4, firstName: "Yacouba", lastName: "Camara", position: "DEUXIEME_LIGNE", isStarter: true, yellowCard: true, yellowCardMin: 40 },
  { num: 5, firstName: "Tyler", lastName: "Duguid", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 6, firstName: "Lenni", lastName: "Nouchi", position: "TROISIEME_LIGNE_AILE", isStarter: true, isCaptain: true },
  {
    num: 7, firstName: "Alexandre", lastName: "Bécognée", position: "TROISIEME_LIGNE_AILE", isStarter: true,
    tries: 1, totalPoints: 5,
  },
  { num: 8, firstName: "Viliami", lastName: "Vunipola", position: "NUMERO_HUIT", isStarter: true },
  {
    num: 9, firstName: "Léo", lastName: "Coly", position: "DEMI_DE_MELEE", isStarter: true,
    conversions: 1, totalPoints: 2,
  },
  {
    num: 10, firstName: "Domingo", lastName: "Miotti", position: "DEMI_OUVERTURE", isStarter: true,
    penalties: 3, dropGoals: 1, conversions: 1, totalPoints: 14, // 3P(9) + 1DG(3) + 1T(2) = 14
  },
  {
    num: 11, firstName: "George", lastName: "Bridge", position: "AILIER", isStarter: true,
  },
  { num: 12, firstName: "Arthur", lastName: "Vincent", position: "CENTRE", isStarter: true },
  { num: 13, firstName: "Thomas", lastName: "Darmon", position: "CENTRE", isStarter: true },
  {
    num: 14, firstName: "Madosh", lastName: "Tambwe", position: "AILIER", isStarter: true,
    tries: 1, totalPoints: 5,
  },
  { num: 15, firstName: "Thomas", lastName: "Vincent", position: "ARRIERE", isStarter: true },
  // Remplaçants
  { num: 16, firstName: "Christopher", lastName: "Tolofua", position: "TALONNEUR", isStarter: false },
  { num: 17, firstName: "Baptiste", lastName: "Erdocio", position: "PILIER_GAUCHE", isStarter: false },
  { num: 18, firstName: "Marco", lastName: "Tauleigne", position: "TROISIEME_LIGNE_AILE", isStarter: false },
  { num: 19, firstName: "Bastien", lastName: "Chalureau", position: "DEUXIEME_LIGNE", isStarter: false },
  { num: 20, firstName: "Sam", lastName: "Simmonds", position: "NUMERO_HUIT", isStarter: false },
  { num: 21, firstName: "Alexis", lastName: "Bernadet", position: "DEMI_DE_MELEE", isStarter: false },
  { num: 22, firstName: "Auguste", lastName: "Cadot", position: "CENTRE", isStarter: false },
  { num: 23, firstName: "Wilfrid", lastName: "Hounkpatin", position: "PILIER_DROIT", isStarter: false },
];

async function main() {
  console.log("=== Ajout composition Montpellier — J2 (14/09/2024) ===\n");

  // Nettoyage des MatchPlayer adverses existants
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID, isOpponent: true },
  });
  console.log(`${deleted.count} entrée(s) adverses supprimée(s)\n`);

  for (const p of MHR_SQUAD) {
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
      },
    });

    const marker = p.isStarter ? "TIT" : "REM";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const yc = p.yellowCard ? ` [CJ ${p.yellowCardMin}']` : "";
    const cap = p.isCaptain ? " (C)" : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName} ${p.lastName}${cap}${pts}${yc}`);
  }

  console.log(`\n=== Terminé : ${MHR_SQUAD.length} joueurs montpelliérains ajoutés ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

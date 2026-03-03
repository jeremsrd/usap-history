/**
 * Script pour remplir la composition Clermont de la finale 2009
 * USAP 22 - 13 Clermont, Stade de France, 6 juin 2009
 * Sources : top14.lnr.fr + itsrugby.fr
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/seed-finale-2009-clermont.ts
 */

import { PrismaClient } from "@prisma/client";
import type { Position } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmm6wnzhw00211uihelzrwpro";

// Composition Clermont - Titulaires
const TITULAIRES = [
  { num: 1, firstName: "Thomas", lastName: "Domingo", position: "PILIER_GAUCHE" as Position },
  { num: 2, firstName: "Mario", lastName: "Ledesma", position: "TALONNEUR" as Position, isCaptain: true },
  { num: 3, firstName: "Martin", lastName: "Scelzo", position: "PILIER_DROIT" as Position },
  { num: 4, firstName: "Julien", lastName: "Pierre", position: "DEUXIEME_LIGNE" as Position },
  { num: 5, firstName: "Thibaut", lastName: "Privat", position: "DEUXIEME_LIGNE" as Position },
  { num: 6, firstName: "Jamie", lastName: "Cudmore", position: "TROISIEME_LIGNE_AILE" as Position },
  { num: 7, firstName: "Alexandre", lastName: "Audebert", position: "TROISIEME_LIGNE_AILE" as Position },
  { num: 8, firstName: "Julien", lastName: "Bonnaire", position: "NUMERO_HUIT" as Position },
  { num: 9, firstName: "Pierre", lastName: "Mignoni", position: "DEMI_DE_MELEE" as Position },
  { num: 10, firstName: "Brock", lastName: "James", position: "DEMI_OUVERTURE" as Position },
  { num: 11, firstName: "Napolioni", lastName: "Nalaga", position: "AILIER" as Position },
  { num: 12, firstName: "Gonzalo", lastName: "Canale", position: "CENTRE" as Position },
  { num: 13, firstName: "Aurélien", lastName: "Rougerie", position: "CENTRE" as Position },
  { num: 14, firstName: "Benoît", lastName: "Baby", position: "AILIER" as Position },
  { num: 15, firstName: "Anthony", lastName: "Floch", position: "ARRIERE" as Position },
];

// Remplaçants (numérotation LNR officielle)
const REMPLACANTS = [
  { num: 16, firstName: "Benoît", lastName: "Cabello", position: "TALONNEUR" as Position },
  { num: 17, firstName: "Laurent", lastName: "Emmanuelli", position: "PILIER_GAUCHE" as Position },
  { num: 18, firstName: "Loïc", lastName: "Jacquet", position: "DEUXIEME_LIGNE" as Position },
  { num: 19, firstName: "Elvis", lastName: "Vermeulen", position: "TROISIEME_LIGNE_AILE" as Position },
  { num: 20, firstName: "John", lastName: "Senio", position: "CENTRE" as Position },
  { num: 21, firstName: "Pierre", lastName: "Garcia", position: "DEMI_DE_MELEE" as Position },
  { num: 22, firstName: "Seremaia", lastName: "Bai", position: "CENTRE" as Position },
  { num: 23, firstName: "Davit", lastName: "Zirakashvili", position: "PILIER_DROIT" as Position },
];

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function findOrCreatePlayer(
  firstName: string,
  lastName: string,
  position: Position,
): Promise<string> {
  const existing = await prisma.player.findFirst({
    where: {
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
  });

  if (existing) {
    console.log(`  [existe] ${firstName} ${lastName} (${existing.id})`);
    return existing.id;
  }

  const tempSlug = `${slugify(firstName)}-${slugify(lastName)}-${Date.now()}`;
  const player = await prisma.player.create({
    data: {
      firstName,
      lastName,
      position,
      isActive: false,
      slug: tempSlug,
    },
  });

  const slug = `${slugify(firstName)}-${slugify(lastName)}-${player.id}`;
  await prisma.player.update({
    where: { id: player.id },
    data: { slug },
  });

  console.log(`  [créé]   ${firstName} ${lastName} (${player.id})`);
  return player.id;
}

async function main() {
  console.log("=== Seed Finale 2009 : Composition CLERMONT ===\n");

  // Supprimer les matchPlayers adverses existants pour ce match
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID, isOpponent: true },
  });
  console.log(`Nettoyage : ${deleted.count} joueurs adverses supprimés\n`);

  const playerIds: Record<string, string> = {};

  // --- Titulaires ---
  console.log("--- Titulaires ---");
  for (const t of TITULAIRES) {
    const playerId = await findOrCreatePlayer(t.firstName, t.lastName, t.position);
    playerIds[`${t.firstName} ${t.lastName}`] = playerId;

    await prisma.matchPlayer.create({
      data: {
        matchId: MATCH_ID,
        playerId,
        shirtNumber: t.num,
        isStarter: true,
        isCaptain: t.isCaptain ?? false,
        isOpponent: true,
        positionPlayed: t.position,
        minutesPlayed: 80,
      },
    });
  }

  // --- Remplaçants ---
  console.log("\n--- Remplaçants ---");
  for (const r of REMPLACANTS) {
    const playerId = await findOrCreatePlayer(r.firstName, r.lastName, r.position);
    playerIds[`${r.firstName} ${r.lastName}`] = playerId;

    await prisma.matchPlayer.create({
      data: {
        matchId: MATCH_ID,
        playerId,
        shirtNumber: r.num,
        isStarter: false,
        isCaptain: false,
        isOpponent: true,
        positionPlayed: r.position,
      },
    });
  }

  // --- Stats individuelles ---
  console.log("\n--- Stats individuelles ---");

  // James : 1 transformation + 2 pénalités = 2 + 6 = 8 pts
  const jamesMp = await prisma.matchPlayer.findFirst({
    where: { matchId: MATCH_ID, playerId: playerIds["Brock James"] },
  });
  if (jamesMp) {
    await prisma.matchPlayer.update({
      where: { id: jamesMp.id },
      data: { conversions: 1, penalties: 2, totalPoints: 8, minutesPlayed: 80 },
    });
    console.log("  James : 1T 2P = 8 pts");
  }

  // Nalaga : 1 essai = 5 pts
  const nalagaMp = await prisma.matchPlayer.findFirst({
    where: { matchId: MATCH_ID, playerId: playerIds["Napolioni Nalaga"] },
  });
  if (nalagaMp) {
    await prisma.matchPlayer.update({
      where: { id: nalagaMp.id },
      data: { tries: 1, totalPoints: 5, minutesPlayed: 80 },
    });
    console.log("  Nalaga : 1E = 5 pts");
  }

  // --- Remplacements ---
  console.log("\n--- Remplacements ---");

  // Zirakashvili entré 31' (remplace Scelzo blessé)
  // Vermeulen entré 50'
  // Jacquet entré 55'
  // Cabello entré 66'
  // Emmanuelli entré 73'
  // Garcia entré 77'
  // Bai entré 77'
  // Senio entré 79'
  const replacements = [
    { out: "Martin Scelzo", inPlayer: "Davit Zirakashvili", min: 31 },
    { out: "Julien Bonnaire", inPlayer: "Elvis Vermeulen", min: 50 },
    { out: "Thibaut Privat", inPlayer: "Loïc Jacquet", min: 55 },
    { out: "Mario Ledesma", inPlayer: "Benoît Cabello", min: 66 },
    { out: "Thomas Domingo", inPlayer: "Laurent Emmanuelli", min: 73 },
    { out: "Pierre Mignoni", inPlayer: "Pierre Garcia", min: 77 },
    { out: "Gonzalo Canale", inPlayer: "Seremaia Bai", min: 77 },
    { out: "Aurélien Rougerie", inPlayer: "John Senio", min: 79 },
  ];

  for (const rep of replacements) {
    const outMp = await prisma.matchPlayer.findFirst({
      where: { matchId: MATCH_ID, playerId: playerIds[rep.out] },
    });
    if (outMp) {
      await prisma.matchPlayer.update({
        where: { id: outMp.id },
        data: { subOut: rep.min, minutesPlayed: rep.min },
      });
    }

    const inMp = await prisma.matchPlayer.findFirst({
      where: { matchId: MATCH_ID, playerId: playerIds[rep.inPlayer] },
    });
    if (inMp) {
      await prisma.matchPlayer.update({
        where: { id: inMp.id },
        data: { subIn: rep.min, minutesPlayed: 80 - rep.min },
      });
    }
    console.log(`  ${rep.out} -> ${rep.inPlayer} (${rep.min}')`);
  }

  console.log("\n=== Seed terminé avec succès ! ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

/**
 * Script pour remplir la finale 2009 USAP 22 - 13 Clermont
 * Stade de France, Saint-Denis, 6 juin 2009
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/seed-finale-2009.ts
 */

import { PrismaClient } from "@prisma/client";
import type { Position } from "@prisma/client";

const prisma = new PrismaClient();

// ID du match existant
const MATCH_ID = "cmm6wnzhw00211uihelzrwpro";

// Composition USAP - Titulaires
const TITULAIRES = [
  { num: 1, firstName: "Perry", lastName: "Freshwater", position: "PILIER_GAUCHE" as Position },
  { num: 2, firstName: "Marius", lastName: "Tincu", position: "TALONNEUR" as Position },
  { num: 3, firstName: "Nicolas", lastName: "Mas", position: "PILIER_DROIT" as Position, isCaptain: true },
  { num: 4, firstName: "Rimas", lastName: "Alvarez-Kairelis", position: "DEUXIEME_LIGNE" as Position },
  { num: 5, firstName: "Olivier", lastName: "Olibeau", position: "DEUXIEME_LIGNE" as Position },
  { num: 6, firstName: "Jean-Pierre", lastName: "Pérez", position: "TROISIEME_LIGNE_AILE" as Position },
  { num: 7, firstName: "Grégory", lastName: "Le Corvec", position: "TROISIEME_LIGNE_AILE" as Position },
  { num: 8, firstName: "Damien", lastName: "Chouly", position: "NUMERO_HUIT" as Position },
  { num: 9, firstName: "Nicolas", lastName: "Durand", position: "DEMI_DE_MELEE" as Position },
  { num: 10, firstName: "Gavin", lastName: "Hume", position: "DEMI_OUVERTURE" as Position },
  { num: 11, firstName: "Julien", lastName: "Candelon", position: "AILIER" as Position },
  { num: 12, firstName: "Maxime", lastName: "Mermoz", position: "CENTRE" as Position },
  { num: 13, firstName: "David", lastName: "Marty", position: "CENTRE" as Position },
  { num: 14, firstName: "Farid", lastName: "Sid", position: "AILIER" as Position },
  { num: 15, firstName: "Jérôme", lastName: "Porical", position: "ARRIERE" as Position },
];

// Remplaçants
const REMPLACANTS = [
  { num: 16, firstName: "Guilhem", lastName: "Guirado", position: "TALONNEUR" as Position },
  { num: 17, firstName: "Kisi", lastName: "Pulu", position: "PILIER_GAUCHE" as Position },
  { num: 18, firstName: "Gerrie", lastName: "Britz", position: "DEUXIEME_LIGNE" as Position },
  { num: 19, firstName: "Guillaume", lastName: "Vilaceca", position: "DEUXIEME_LIGNE" as Position },
  { num: 20, firstName: "David", lastName: "Mélé", position: "DEMI_DE_MELEE" as Position },
  { num: 21, firstName: "Jean-Philippe", lastName: "Grandclaude", position: "CENTRE" as Position },
  { num: 22, firstName: "Philip", lastName: "Burger", position: "AILIER" as Position },
  { num: 23, firstName: "Sébastien", lastName: "Bozzi", position: "PILIER_DROIT" as Position },
];

// Fonction slug
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
  // Chercher par nom
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

  // Créer avec slug temporaire, puis mettre à jour avec l'id
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

  // Mettre à jour le slug avec l'id réel
  const slug = `${slugify(firstName)}-${slugify(lastName)}-${player.id}`;
  await prisma.player.update({
    where: { id: player.id },
    data: { slug },
  });

  console.log(`  [créé]   ${firstName} ${lastName} (${player.id})`);
  return player.id;
}

async function main() {
  console.log("=== Seed Finale 2009 : USAP 22 - 13 Clermont ===\n");

  // Supprimer les matchPlayers et matchEvents existants pour ce match
  await prisma.matchPlayer.deleteMany({ where: { matchId: MATCH_ID } });
  await prisma.matchEvent.deleteMany({ where: { matchId: MATCH_ID } });
  console.log("Nettoyage des données existantes OK\n");

  // --- Créer les joueurs et la composition ---
  console.log("--- Titulaires ---");
  const playerIds: Record<string, string> = {};

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
        positionPlayed: t.position,
        minutesPlayed: 80, // par défaut, ajusté pour les sortis
      },
    });
  }

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
        positionPlayed: r.position,
      },
    });
  }

  // --- Mettre à jour les stats individuelles ---
  console.log("\n--- Stats individuelles ---");

  // Porical : 1 transfo + 4 pénalités = 2 + 12 = 14 pts
  const poricalMp = await prisma.matchPlayer.findFirst({
    where: { matchId: MATCH_ID, playerId: playerIds["Jérôme Porical"] },
  });
  if (poricalMp) {
    await prisma.matchPlayer.update({
      where: { id: poricalMp.id },
      data: { conversions: 1, penalties: 4, totalPoints: 14, minutesPlayed: 80 },
    });
    console.log("  Porical : 1T 4P = 14 pts");
  }

  // Marty : 1 essai = 5 pts, sorti 75e
  const martyMp = await prisma.matchPlayer.findFirst({
    where: { matchId: MATCH_ID, playerId: playerIds["David Marty"] },
  });
  if (martyMp) {
    await prisma.matchPlayer.update({
      where: { id: martyMp.id },
      data: { tries: 1, totalPoints: 5, subOut: 75, minutesPlayed: 75 },
    });
    console.log("  Marty : 1E = 5 pts, sorti 75e");
  }

  // Hume : 1 drop = 3 pts
  const humeMp = await prisma.matchPlayer.findFirst({
    where: { matchId: MATCH_ID, playerId: playerIds["Gavin Hume"] },
  });
  if (humeMp) {
    await prisma.matchPlayer.update({
      where: { id: humeMp.id },
      data: { dropGoals: 1, totalPoints: 3, minutesPlayed: 80 },
    });
    console.log("  Hume : 1D = 3 pts");
  }

  // Remplacements USAP :
  // Le Corvec sorti 57e -> Britz entré 57e
  // Freshwater sorti 59e -> Pulu entré 59e
  // Tincu sorti 59e -> Guirado entré 59e
  // Olibeau sorti 65e -> Vilaceca entré 65e (source dit 64e, on prend 65e)
  // Candelon sorti 77e -> Burger entré 77e
  // Mas sorti 77e -> Bozzi entré 77e
  // Durand sorti 78e -> Mélé entré 78e (source dit 76e)
  // Marty sorti 75e -> Grandclaude entré 75e

  const replacements = [
    { out: "Grégory Le Corvec", inPlayer: "Gerrie Britz", min: 57 },
    { out: "Perry Freshwater", inPlayer: "Kisi Pulu", min: 59 },
    { out: "Marius Tincu", inPlayer: "Guilhem Guirado", min: 59 },
    { out: "Olivier Olibeau", inPlayer: "Guillaume Vilaceca", min: 64 },
    { out: "David Marty", inPlayer: "Jean-Philippe Grandclaude", min: 75 },
    { out: "Julien Candelon", inPlayer: "Philip Burger", min: 77 },
    { out: "Nicolas Mas", inPlayer: "Sébastien Bozzi", min: 77 },
    { out: "Nicolas Durand", inPlayer: "David Mélé", min: 76 },
  ];

  for (const rep of replacements) {
    // Mettre à jour le titulaire (sorti)
    const outMp = await prisma.matchPlayer.findFirst({
      where: { matchId: MATCH_ID, playerId: playerIds[rep.out] },
    });
    if (outMp) {
      await prisma.matchPlayer.update({
        where: { id: outMp.id },
        data: { subOut: rep.min, minutesPlayed: rep.min },
      });
    }

    // Mettre à jour le remplaçant (entré)
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

  // --- Événements du match ---
  console.log("\n--- Événements ---");

  const events = [
    // 1ère mi-temps
    { minute: 11, type: "ESSAI" as const, isUsap: false, description: "Essai de Nalaga en coin après diagonale de James" },
    { minute: 11, type: "TRANSFORMATION" as const, isUsap: false, description: "Transformation James" },
    { minute: 15, type: "DROP" as const, isUsap: true, playerId: playerIds["Gavin Hume"], description: "Drop de Hume face aux poteaux" },
    { minute: 20, type: "PENALITE" as const, isUsap: false, description: "Pénalité James" },
    { minute: 40, type: "PENALITE" as const, isUsap: true, playerId: playerIds["Jérôme Porical"], description: "Pénalité Porical" },

    // 2ème mi-temps
    { minute: 45, type: "ESSAI" as const, isUsap: true, playerId: playerIds["David Marty"], description: "Essai de Marty" },
    { minute: 45, type: "TRANSFORMATION" as const, isUsap: true, playerId: playerIds["Jérôme Porical"], description: "Transformation Porical" },
    { minute: 50, type: "PENALITE" as const, isUsap: true, playerId: playerIds["Jérôme Porical"], description: "Pénalité Porical" },
    { minute: 55, type: "PENALITE" as const, isUsap: false, description: "Pénalité James" },
    { minute: 62, type: "PENALITE" as const, isUsap: true, playerId: playerIds["Jérôme Porical"], description: "Pénalité Porical" },
    { minute: 64, type: "PENALITE" as const, isUsap: true, playerId: playerIds["Jérôme Porical"], description: "Pénalité Porical" },

    // Remplacements USAP
    { minute: 57, type: "REMPLACEMENT_SORTIE" as const, isUsap: true, playerId: playerIds["Grégory Le Corvec"], description: "Le Corvec sort, Britz entre" },
    { minute: 59, type: "REMPLACEMENT_SORTIE" as const, isUsap: true, playerId: playerIds["Perry Freshwater"], description: "Freshwater sort, Pulu entre" },
    { minute: 59, type: "REMPLACEMENT_SORTIE" as const, isUsap: true, playerId: playerIds["Marius Tincu"], description: "Tincu sort, Guirado entre" },
    { minute: 64, type: "REMPLACEMENT_SORTIE" as const, isUsap: true, playerId: playerIds["Olivier Olibeau"], description: "Olibeau sort, Vilaceca entre" },
    { minute: 75, type: "REMPLACEMENT_SORTIE" as const, isUsap: true, playerId: playerIds["David Marty"], description: "Marty sort, Grandclaude entre" },
    { minute: 76, type: "REMPLACEMENT_SORTIE" as const, isUsap: true, playerId: playerIds["Nicolas Durand"], description: "Durand sort, Mélé entre" },
    { minute: 77, type: "REMPLACEMENT_SORTIE" as const, isUsap: true, playerId: playerIds["Julien Candelon"], description: "Candelon sort, Burger entre" },
    { minute: 77, type: "REMPLACEMENT_SORTIE" as const, isUsap: true, playerId: playerIds["Nicolas Mas"], description: "Mas sort, Bozzi entre" },
  ];

  for (const evt of events) {
    await prisma.matchEvent.create({
      data: {
        matchId: MATCH_ID,
        minute: evt.minute,
        type: evt.type,
        isUsap: evt.isUsap,
        playerId: evt.playerId ?? null,
        description: evt.description ?? null,
      },
    });
    const team = evt.isUsap ? "USAP" : "CLR";
    console.log(`  ${evt.minute}' [${team}] ${evt.type} - ${evt.description}`);
  }

  console.log("\n=== Seed terminé avec succès ! ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

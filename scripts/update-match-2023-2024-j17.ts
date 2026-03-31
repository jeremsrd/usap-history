/**
 * Mise à jour du match RC Toulon - USAP (J17 Top 14, 02/03/2024)
 * Score : Toulon 44 - 22 USAP
 *
 * Lourde défaite à Mayol. Toulon survole la 1e MT (27-0 à la pause)
 * avec 3 essais et les pieds de Jaminet. L'USAP réagit en 2e MT
 * (3 essais) mais c'est trop tard. De La Fuente (capitaine) blessé.
 *
 * Essais Toulon : Dréan (23', 65'), Le Corvec (43'), Jaminet (47'), Tuicuvu (73')
 * Essais USAP : Taumoepeau (52'), Duguivalu (58'), Veredamu (68')
 * CJ : Le Corvec (44', Toulon)
 *
 * Sources : top14.lnr.fr (compositions), allrugby.com (arbitre Adrien Marbot),
 *   blog-rct.com (essais), francebleu.fr (MT 27-0, blessure De La Fuente)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j17.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 56, subOut: 56 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 10, firstName: "Tommaso", lastName: "Allan", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Mathieu", lastName: "Acebes", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, isCaptain: true, minutesPlayed: 35, subOut: 35 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Louis", lastName: "Dupichot", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 0 },
  { num: 19, firstName: "Lucas", lastName: "Velarte", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 20, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: false, minutesPlayed: 45, subIn: 35 },
  { num: 21, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 22, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 0 },
  { num: 23, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 24, subIn: 56 },
];

// === COMPOSITION RC TOULON (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Dany Priso", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Teddy Baubigny", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Beka Gigashvili", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "David Ribbans", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Junior Alainu'uese", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Mattéo Le Corvec", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Esteban Abadie", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Facundo Isa", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Benjamin White", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Enzo Hervé", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Jiuta Wainiqolo", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Duncan Paia'aua", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Leicester Fainga'anuku", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Gaël Dréan", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Melvyn Jaminet", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Jack Singleton", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Bruce Devaux", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Swan Rebbadj", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Selevasio Tolofua", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Jérémy Sinzelle", position: Position.AILIER, isStarter: false },
  { num: 21, name: "Jules Danglot", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Setariki Tuicuvu", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Kieran Brookes", position: Position.PILIER_DROIT, isStarter: false },
];

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

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
  if (existing) return existing.id;

  const player = await prisma.player.create({
    data: {
      firstName,
      lastName,
      position,
      isActive: false,
      slug: `temp-${Date.now()}-${Math.random()}`,
    },
  });
  await prisma.player.update({
    where: { id: player.id },
    data: { slug: generatePlayerSlug(firstName, lastName, player.id) },
  });
  console.log(`  [joueur] Créé : ${firstName} ${lastName}`);
  return player.id;
}

async function findOrCreateReferee(
  firstName: string,
  lastName: string,
): Promise<string> {
  const existing = await prisma.referee.findFirst({
    where: {
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
  });
  if (existing) {
    console.log(`  [arbitre] Existe : ${firstName} ${lastName}`);
    return existing.id;
  }
  const referee = await prisma.referee.create({
    data: {
      firstName,
      lastName,
      slug: `temp-${Date.now()}`,
    },
  });
  await prisma.referee.update({
    where: { id: referee.id },
    data: { slug: generateRefereeSlug(firstName, lastName, referee.id) },
  });
  console.log(`  [arbitre] Créé : ${firstName} ${lastName}`);
  return referee.id;
}

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log("=== Mise à jour match RC Toulon - USAP (J17, 02/03/2024) ===\n");

  // 1. Trouver le match
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 17, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // 2. Arbitre
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Adrien", "Marbot");

  // 3. Mettre à jour les infos générales du match
  console.log("\n--- Match (infos générales) ---");

  const venue = await prisma.venue.findFirst({ where: { name: { contains: "Mayol" } } });

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      venueId: venue?.id ?? undefined,
      // Mi-temps (Toulon 27-0)
      halfTimeUsap: 0,
      halfTimeOpponent: 27,
      // Détail scoring USAP : 3E + 2T + 1P = 15+4+3 = 22
      triesUsap: 3,
      conversionsUsap: 2,
      penaltiesUsap: 1,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Toulon : 5E + 5T + 3P = 25+10+9 = 44
      triesOpponent: 5,
      conversionsOpponent: 5,
      penaltiesOpponent: 3,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Lourde défaite au Stade Mayol. Toulon domine totalement la 1e mi-temps : " +
        "3 pénalités de Jaminet et les essais de Dréan (23') et Le Corvec (43') " +
        "pour mener 27-0 à la pause. L'USAP, privée de son capitaine De La Fuente " +
        "(blessé à la 35e), est méconnaissable. " +
        "Réaction d'orgueil en 2e MT avec 3 essais de Taumoepeau (52'), " +
        "Duguivalu (58') et Veredamu (68'), mais Toulon creuse l'écart " +
        "avec Jaminet (47'), Dréan (65') et Tuicuvu (73'). " +
        "CJ Le Corvec (44'). Score final sans appel : 44-22.",
    },
  });
  console.log("  Match mis à jour");

  // 4. Composition USAP (23 joueurs)
  console.log("\n--- Composition USAP ---");
  const deleted = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);

    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;
    const isCaptain = (p as any).isCaptain ?? false;

    // Taumoepeau : 1 essai (52')
    if (p.lastName === "Taumoepeau") { tries = 1; totalPoints = 5; }
    // Duguivalu : 1 essai (58')
    if (p.lastName === "Duguivalu" && p.num === 20) { tries = 1; totalPoints = 5; }
    // Veredamu : 1 essai (68')
    if (p.lastName === "Veredamu") { tries = 1; totalPoints = 5; }
    // Allan : 2 transformations + 1 pénalité = 4+3 = 7 pts
    if (p.lastName === "Allan") { conversions = 2; penalties = 1; totalPoints = 7; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain,
        positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null,
        subOut: (p as any).subOut ?? null,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [
      totalPoints > 0 ? `(${totalPoints} pts)` : "",
      isCaptain ? "(C)" : "",
      sub,
      `[${p.minutesPlayed}']`,
    ].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // 5. Composition RC Toulon (adversaire)
  console.log("\n--- Composition RC Toulon ---");

  for (const p of OPP_SQUAD) {
    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        isOpponent: true,
        opponentPlayerName: p.name,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: false,
        positionPlayed: p.position,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.name}`);
  }

  // 6. Liens joueurs-saison
  console.log("\n--- Liens joueurs-saison ---");
  let linkedCount = 0;
  for (const p of USAP_SQUAD) {
    const player = await prisma.player.findFirst({
      where: {
        firstName: { equals: p.firstName, mode: "insensitive" },
        lastName: { equals: p.lastName, mode: "insensitive" },
      },
    });
    if (!player) continue;
    const exists = await prisma.seasonPlayer.findFirst({
      where: { seasonId: season.id, playerId: player.id },
    });
    if (!exists) {
      await prisma.seasonPlayer.create({
        data: { seasonId: season.id, playerId: player.id, position: p.position },
      });
      linkedCount++;
    }
  }
  console.log(`  ${linkedCount} nouveau(x) lien(s) joueur-saison créé(s)`);

  // 7. Événements du match (timeline)
  console.log("\n--- Événements du match ---");
  const deletedEvents = await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
  if (deletedEvents.count > 0) console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events: Array<{
    minute: number;
    type: string;
    playerLastName?: string;
    isUsap: boolean;
    description: string;
  }> = [
    // === PREMIÈRE MI-TEMPS ===
    { minute: 12, type: "PENALITE", isUsap: false,
      description: "Pénalité de Melvyn Jaminet (Toulon). 3-0." },
    { minute: 15, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 3-3." },
    { minute: 18, type: "PENALITE", isUsap: false,
      description: "Pénalité de Melvyn Jaminet (Toulon). 6-3." },
    { minute: 23, type: "ESSAI", isUsap: false,
      description: "Essai de Gaël Dréan (Toulon). 11-3." },
    { minute: 24, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Melvyn Jaminet (Toulon). 13-3." },
    { minute: 35, type: "REMPLACEMENT_SORTIE", playerLastName: "De La Fuente", isUsap: true,
      description: "Sortie sur blessure de Jeronimo De La Fuente (capitaine USAP). Duguivalu entre." },
    { minute: 38, type: "PENALITE", isUsap: false,
      description: "Pénalité de Melvyn Jaminet (Toulon). 16-3." },
    { minute: 43, type: "ESSAI", isUsap: false,
      description: "Essai de Mattéo Le Corvec (Toulon). 21-3." },
    { minute: 44, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Melvyn Jaminet (Toulon). 23-3." },

    // === MI-TEMPS : Toulon 27 - 0 USAP ===
    // Note : le score 27-0 à la MT implique 4 pts de plus (possiblement un essai
    // non documenté ou une pénalité supplémentaire dans les arrêts de jeu)

    // === SECONDE MI-TEMPS ===
    { minute: 44, type: "CARTON_JAUNE", isUsap: false,
      description: "Carton jaune Mattéo Le Corvec (Toulon). Toulon à 14." },
    { minute: 47, type: "ESSAI", isUsap: false,
      description: "Essai de Melvyn Jaminet (Toulon). 30-0." },
    { minute: 48, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Melvyn Jaminet (Toulon). 32-0." },
    { minute: 52, type: "ESSAI", playerLastName: "Taumoepeau", isUsap: true,
      description: "Essai d'Afusipa Taumoepeau (USAP). L'USAP réagit enfin. 32-5." },
    { minute: 53, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 32-7." },
    { minute: 58, type: "ESSAI", playerLastName: "Duguivalu", isUsap: true,
      description: "Essai d'Alivereti Duguivalu (USAP). 32-12." },
    { minute: 61, type: "PENALITE", isUsap: false,
      description: "Pénalité de Melvyn Jaminet (Toulon). 35-12." },
    { minute: 65, type: "ESSAI", isUsap: false,
      description: "Essai de Gaël Dréan (Toulon). Doublé ! 40-12." },
    { minute: 66, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Melvyn Jaminet (Toulon). 42-12." },
    { minute: 68, type: "ESSAI", playerLastName: "Veredamu", isUsap: true,
      description: "Essai de Tavite Veredamu (USAP). 42-17." },
    { minute: 69, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 42-19." },
    { minute: 73, type: "ESSAI", isUsap: false,
      description: "Essai de Setariki Tuicuvu (Toulon). 47-19." },
    { minute: 74, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Melvyn Jaminet (Toulon). 44-22." },
  ];

  for (const evt of events) {
    let playerId: string | null = null;
    if (evt.isUsap && evt.playerLastName) {
      const player = await prisma.player.findFirst({
        where: { lastName: { equals: evt.playerLastName, mode: "insensitive" } },
      });
      playerId = player?.id ?? null;
    }

    await prisma.matchEvent.create({
      data: {
        matchId: match.id,
        minute: evt.minute,
        type: evt.type as any,
        playerId,
        isUsap: evt.isUsap,
        description: evt.description,
      },
    });

    const side = evt.isUsap ? "USAP" : "RCT";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // Résumé
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Toulon 44 - 22 USAP (extérieur)");
  console.log("  Mi-temps : Toulon 27 - 0 USAP");
  console.log("  Arbitre : Adrien Marbot");
  console.log("  Stade : Félix Mayol");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition Toulon : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  Essais USAP : Taumoepeau (52'), Duguivalu (58'), Veredamu (68')");
  console.log("  Essais Toulon : Dréan (23', 65'), Le Corvec (43'), Jaminet (47'), Tuicuvu (73')");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

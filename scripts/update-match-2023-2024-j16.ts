/**
 * Mise à jour du match USAP - Stade Rochelais (J16 Top 14, 24/02/2024)
 * Score : USAP 27 - 15 Stade Rochelais
 *
 * Belle victoire à Aimé-Giral face au double champion d'Europe.
 * L'USAP profite du vent pour prendre le large (20-0 à la 34e).
 * La Rochelle revient à 20-15 au pied d'Hastoy (5 pénalités),
 * mais Velarte assure la victoire en fin de match (72').
 *
 * Essais USAP : Veredamu (20'), Allan (34'), Velarte (72')
 * Transformations : Allan x3
 * Pénalités USAP : Allan x2 (16', 33')
 * Pénalités La Rochelle : Hastoy x5 (38', 40', 46', 58', 62')
 *
 * Sources : top14.lnr.fr (compositions), itsrugby.fr (marqueurs),
 *   allrugby.com (arbitre Adrien Descottes), francebleu.fr (résumé)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j16.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 3, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 56, subOut: 56 },
  { num: 4, firstName: "Jacobus", lastName: "Van Tonder", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquin", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jeronimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, isCaptain: true, minutesPlayed: 67, subOut: 67 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 18, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 0 },
  { num: 19, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 0 },
  { num: 20, firstName: "Lucas", lastName: "Velarte", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 21, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 22, firstName: "Apisai", lastName: "Naqalevu", position: Position.CENTRE, isStarter: false, minutesPlayed: 13, subIn: 67 },
  { num: 23, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 24, subIn: 56 },
];

// === COMPOSITION STADE ROCHELAIS (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Louis Penverne", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Sacha Idoumi", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Georges-Henri Colombe", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Thomas Ployet", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Rémi Picquette", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Judicaël Cancoriet", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Levani Botia", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Yoan Tanga", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Tawera Kerr-Barlow", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Antoine Hastoy", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Raymond Rhule", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Jules Favre", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Ulupano Seuteni", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Teddy Thomas", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Brice Dulin", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Quentin Lespiaucq", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Joël Sclavi", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Matthias Haddad", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 19, name: "Oscar Jégou", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Thomas Berjon", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Ihaia West", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Simeli Daunivucu", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Aleksandre Kuntelia", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Stade Rochelais (J16, 24/02/2024) ===\n");

  // 1. Trouver le match
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 16, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // 2. Arbitre
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Adrien", "Descottes");

  // 3. Mettre à jour les infos générales du match
  console.log("\n--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      // Mi-temps
      halfTimeUsap: 20,
      halfTimeOpponent: 6,
      // Détail scoring USAP
      triesUsap: 3,
      conversionsUsap: 3,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring La Rochelle
      triesOpponent: 0,
      conversionsOpponent: 0,
      penaltiesOpponent: 5,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Belle victoire à Aimé-Giral face au double champion d'Europe en titre. " +
        "L'USAP profite du vent en 1e MT : pénalités d'Allan (16', 33') et essais de " +
        "Veredamu (20') et Allan (34') pour mener 20-0 à la 34e. Hastoy réduit au pied " +
        "avant la pause (20-6). En 2e MT, La Rochelle revient à 20-15 grâce à 3 nouvelles " +
        "pénalités d'Hastoy (46', 58', 62') mais l'USAP tient bon. " +
        "Velarte, entré en jeu, inscrit l'essai capital (72') pour sceller la victoire 27-15. " +
        "Allan impérial : 17 pts au pied et 1 essai. Aimé-Giral en feu.",
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

    // Veredamu : 1 essai (20')
    if (p.lastName === "Veredamu") { tries = 1; totalPoints = 5; }
    // Allan : 1 essai (34') + 3 transformations + 2 pénalités = 5+6+6 = 17 pts
    if (p.lastName === "Allan") { tries = 1; conversions = 3; penalties = 2; totalPoints = 17; }
    // Velarte : 1 essai (72')
    if (p.lastName === "Velarte") { tries = 1; totalPoints = 5; }

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

  // 5. Composition Stade Rochelais (adversaire)
  console.log("\n--- Composition Stade Rochelais ---");

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
    { minute: 16, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 3-0." },
    { minute: 20, type: "ESSAI", playerLastName: "Veredamu", isUsap: true,
      description: "Essai de Tavite Veredamu (USAP). 8-0." },
    { minute: 21, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 10-0." },
    { minute: 33, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 13-0." },
    { minute: 34, type: "ESSAI", playerLastName: "Allan", isUsap: true,
      description: "Essai de Tommaso Allan (USAP). 18-0." },
    { minute: 35, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 20-0." },
    { minute: 38, type: "PENALITE", isUsap: false,
      description: "Pénalité d'Antoine Hastoy (La Rochelle). 20-3." },
    { minute: 40, type: "PENALITE", isUsap: false,
      description: "Pénalité d'Antoine Hastoy (La Rochelle). 20-6. Score à la pause." },

    // === MI-TEMPS : USAP 20 - 6 La Rochelle ===

    // === SECONDE MI-TEMPS ===
    { minute: 46, type: "PENALITE", isUsap: false,
      description: "Pénalité d'Antoine Hastoy (La Rochelle). 20-9." },
    { minute: 58, type: "PENALITE", isUsap: false,
      description: "Pénalité d'Antoine Hastoy (La Rochelle). 20-12." },
    { minute: 62, type: "PENALITE", isUsap: false,
      description: "Pénalité d'Antoine Hastoy (La Rochelle). 20-15. Les Rochelais reviennent." },
    { minute: 72, type: "ESSAI", playerLastName: "Velarte", isUsap: true,
      description: "Essai de Lucas Velarte (USAP). Essai capital ! 25-15." },
    { minute: 73, type: "TRANSFORMATION", playerLastName: "Allan", isUsap: true,
      description: "Transformation de Tommaso Allan (USAP). 27-15. Score final." },
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

    const side = evt.isUsap ? "USAP" : "LR";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // Résumé
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 27 - 15 Stade Rochelais (domicile)");
  console.log("  Mi-temps : USAP 20 - 6 La Rochelle");
  console.log("  Arbitre : Adrien Descottes");
  console.log("  Stade : Aimé-Giral");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition La Rochelle : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  Essais USAP : Veredamu (20'), Allan (34'), Velarte (72')");
  console.log("  Allan : 1E + 3T + 2P = 17 pts");
  console.log("  Hastoy (LR) : 5 pénalités = 15 pts");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

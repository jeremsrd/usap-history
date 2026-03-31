/**
 * Mise à jour du match USAP - Castres (J20 Top 14, 30/03/2024)
 * Score : USAP 43 - 12 Castres
 *
 * Festival à Aimé-Giral ! 7 essais dont un doublé de Veredamu et
 * un doublé de McIntyre. USAP mène 17-7 à la pause puis accélère
 * en 2e MT avec 4 essais supplémentaires. Bonus offensif.
 * CJ Popelin (32', Castres).
 *
 * Essais USAP : Veredamu (12', 39'), Van Tonder (33'), Ruiz (42'),
 *   Ecochard (44'), McIntyre (49', 53')
 * Essais Castres : Popelin (27'), Hulleu (78')
 *
 * Sources : top14.lnr.fr (compositions), itsrugby.fr (marqueurs),
 *   allrugby.com (arbitre Thomas Charabas), francebleu.fr (résumé)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j20.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 80 },
  { num: 3, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 56, subOut: 56 },
  { num: 4, firstName: "Jacobus", lastName: "Van Tonder", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 5, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 60, subOut: 60 },
  { num: 6, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 55, subOut: 55 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 62, subOut: 62 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Alistair", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Apisai", lastName: "Naqalevu", position: Position.CENTRE, isStarter: true, minutesPlayed: 67, subOut: 67 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Lucas", lastName: "Dubois", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 17, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 20, subIn: 60 },
  { num: 18, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 25, subIn: 55 },
  { num: 19, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 24, subIn: 56 },
  { num: 20, firstName: "Mathieu", lastName: "Acebes", position: Position.AILIER, isStarter: false, minutesPlayed: 13, subIn: 67 },
  { num: 21, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 18, subIn: 62 },
  { num: 22, firstName: "Jean-Pascal", lastName: "Barraqué", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 0 },
  { num: 23, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 0 },
];

// === COMPOSITION CASTRES (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Quentin Walcker", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Pierre Colonna", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Henry Thomas", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Gauthier Maravat", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Thomas Staniforth", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Mathieu Babillot", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Baptiste Delaporte", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Abraham Papali'i", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Jérémy Fernandez", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Vilimoni Botitu", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Nathanael Hulleu", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Jack Goodhue", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Adrien Séguret", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Filipo Nakosi", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Pierre Popelin", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Antoine Tichit", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 17, name: "Levan Chilachava", position: Position.PILIER_DROIT, isStarter: false },
  { num: 18, name: "Leone Nakarawa", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Santiago Arata", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 20, name: "Loris Zarantonello", position: Position.TALONNEUR, isStarter: false },
  { num: 21, name: "Florent Vanverberghe", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 22, name: "Josaia Raisuqe", position: Position.AILIER, isStarter: false },
  { num: 23, name: "Joris Dupont", position: Position.CENTRE, isStarter: false },
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
  console.log("=== Mise à jour match USAP - Castres (J20, 30/03/2024) ===\n");

  // 1. Trouver le match
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 20, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // 2. Arbitre
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Thomas", "Charabas");

  // 3. Mettre à jour les infos générales du match
  console.log("\n--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      // Mi-temps
      halfTimeUsap: 17,
      halfTimeOpponent: 7,
      // Détail scoring USAP : 7E + 4T = 35+8 = 43
      triesUsap: 7,
      conversionsUsap: 4,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Castres : 2E + 1T = 10+2 = 12
      triesOpponent: 2,
      conversionsOpponent: 1,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: true,
      bonusDefensif: false,
      // Rapport
      report:
        "Festival à Aimé-Giral ! 7 essais pour l'USAP dans un match à sens unique. " +
        "Veredamu ouvre le bal (12') puis Van Tonder enfonce le clou (33') après " +
        "l'essai de Popelin pour Castres (27'). Veredamu signe le doublé (39') " +
        "pour mener 17-7 à la pause. L'USAP déroule en 2e MT : Ruiz (42'), " +
        "Ecochard (44'), puis McIntyre en doublé (49', 53') portent le score " +
        "à 43-7. Hulleu sauve l'honneur pour Castres (78'). " +
        "CJ Popelin (32'). Score final sans appel : 43-12.",
    },
  });
  console.log("  Match mis à jour");

  // 4. Composition USAP (23 joueurs)
  console.log("\n--- Composition USAP ---");
  const deleted = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);

    let tries = 0, conversions = 0, totalPoints = 0;

    // Veredamu : 2 essais (12', 39')
    if (p.lastName === "Veredamu") { tries = 2; totalPoints = 10; }
    // Van Tonder : 1 essai (33')
    if (p.lastName === "Van Tonder") { tries = 1; totalPoints = 5; }
    // Ruiz : 1 essai (42')
    if (p.lastName === "Ruiz") { tries = 1; totalPoints = 5; }
    // Ecochard : 1 essai (44')
    if (p.lastName === "Ecochard") { tries = 1; totalPoints = 5; }
    // McIntyre : 2 essais (49', 53') + 4 transformations = 10+8 = 18 pts
    if (p.lastName === "McIntyre") { tries = 2; conversions = 4; totalPoints = 18; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: false,
        positionPlayed: p.position,
        tries, conversions, totalPoints,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null,
        subOut: (p as any).subOut ?? null,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [
      totalPoints > 0 ? `(${totalPoints} pts)` : "",
      sub,
      `[${p.minutesPlayed}']`,
    ].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // 5. Composition Castres (adversaire)
  console.log("\n--- Composition Castres ---");

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
    { minute: 12, type: "ESSAI", playerLastName: "Veredamu", isUsap: true,
      description: "Essai de Tavite Veredamu (USAP). 5-0." },
    { minute: 27, type: "ESSAI", isUsap: false,
      description: "Essai de Pierre Popelin (Castres). 5-5." },
    { minute: 28, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Gauthier Maravat (Castres). 5-7." },
    { minute: 32, type: "CARTON_JAUNE", isUsap: false,
      description: "Carton jaune Pierre Popelin (Castres). Castres à 14." },
    { minute: 33, type: "ESSAI", playerLastName: "Van Tonder", isUsap: true,
      description: "Essai de Jacobus Van Tonder (USAP). 10-7." },
    { minute: 34, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true,
      description: "Transformation de Jake McIntyre (USAP). 12-7." },
    { minute: 39, type: "ESSAI", playerLastName: "Veredamu", isUsap: true,
      description: "Essai de Tavite Veredamu (USAP). Doublé ! 17-7." },

    // === MI-TEMPS : USAP 17 - 7 Castres ===

    // === SECONDE MI-TEMPS ===
    { minute: 42, type: "ESSAI", playerLastName: "Ruiz", isUsap: true,
      description: "Essai d'Ignacio Ruiz (USAP). 22-7." },
    { minute: 44, type: "ESSAI", playerLastName: "Ecochard", isUsap: true,
      description: "Essai de Tom Ecochard (USAP). 27-7." },
    { minute: 45, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true,
      description: "Transformation de Jake McIntyre (USAP). 29-7." },
    { minute: 49, type: "ESSAI", playerLastName: "McIntyre", isUsap: true,
      description: "Essai de Jake McIntyre (USAP). L'ouvreur en finisseur ! 34-7." },
    { minute: 50, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true,
      description: "Transformation de Jake McIntyre (USAP). 36-7." },
    { minute: 53, type: "ESSAI", playerLastName: "McIntyre", isUsap: true,
      description: "Essai de Jake McIntyre (USAP). Doublé ! 41-7." },
    { minute: 54, type: "TRANSFORMATION", playerLastName: "McIntyre", isUsap: true,
      description: "Transformation de Jake McIntyre (USAP). 43-7." },
    { minute: 78, type: "ESSAI", isUsap: false,
      description: "Essai de Nathanael Hulleu (Castres). 43-12. Score final." },
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

    const side = evt.isUsap ? "USAP" : "CO";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // Résumé
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 43 - 12 Castres (domicile)");
  console.log("  Mi-temps : USAP 17 - 7 Castres");
  console.log("  Arbitre : Thomas Charabas");
  console.log("  Stade : Aimé-Giral");
  console.log("  7 essais USAP — Bonus offensif");
  console.log("  Veredamu (12', 39'), Van Tonder (33'), Ruiz (42'),");
  console.log("  Ecochard (44'), McIntyre (49', 53')");
  console.log("  McIntyre : 2E + 4T = 18 pts");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

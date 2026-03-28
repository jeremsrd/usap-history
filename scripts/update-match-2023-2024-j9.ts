/**
 * Mise à jour du match La Rochelle - USAP (J9 Top 14, 02/12/2023)
 * Score : La Rochelle 35 - 6 USAP
 *
 * Lourde défaite à Marcel-Deflandre. L'USAP résiste bien en 1ère MT
 * (7-6 à la pause) mais craque en 2e MT avec 4 essais encaissés.
 * Les Rochelais font la différence avec leurs remplaçants (Hastoy,
 * Bourgarit, Danty, Kerr-Barlow entrés à la pause).
 * 2 CJ USAP : Crossdale (30'), Tuilagi (64').
 *
 * Essais La Rochelle : Favre (28'), Essai de pénalité (52'),
 *   Bourgarit (56'), Cancoriet (62'), Wardi (71')
 * Essais USAP : aucun
 *
 * Sources : top14.lnr.fr (compositions), skysports.com, allrugby.com,
 *   francebleu.fr, sectionpaloise.com (arbitre)
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j9.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2023-2024/j9/10315-la-rochelle-perpignan/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 3, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 4, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 7, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Joaquin", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 80 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Alistair", lastName: "Crossdale", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jeronimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 13, firstName: "Edward", lastName: "Sawailau", position: Position.CENTRE, isStarter: true, minutesPlayed: 73, subOut: 73 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 28, subIn: 52 },
  { num: 17, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 28, subIn: 52 },
  { num: 18, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 19, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 20, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 7, subIn: 73 },
  { num: 21, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 23, subIn: 57 },
  { num: 22, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: false, minutesPlayed: 7, subIn: 73 },
  { num: 23, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 28, subIn: 52 },
];

// === COMPOSITION LA ROCHELLE (adversaire) ===
// Source : top14.lnr.fr
const LR_SQUAD = [
  { num: 1, name: "Joël Sclavi", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Sacha Idoumi", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Uini Atonio", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Rémi Picquette", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Will Skelton", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Judicaël Cancoriet", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Ultan Dillane", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Paul Boudehent", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Teddy Iribaren", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Hugo Reus", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Dillyn Leyds", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Jules Favre", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Ihaia West", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Jack Nowell", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Brice Dulin", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Pierre Bourgarit", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Reda Wardi", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Thomas Lavault", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Yoan Tanga Mangene", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Tawera Kerr-Barlow", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, name: "Antoine Hastoy", position: Position.DEMI_OUVERTURE, isStarter: false },
  { num: 22, name: "Jonathan Danty", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Georges-Henri Colombe", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match La Rochelle - USAP (J9, 02/12/2023) ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver le match
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 9, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // -------------------------------------------------------------------------
  // 2. Arbitre
  // -------------------------------------------------------------------------
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Benoît", "Rousselet");

  // -------------------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // -------------------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score : La Rochelle 35 - 6 USAP (extérieur)
   * Mi-temps : La Rochelle 7 - 6 USAP
   *
   * LR : 4E(Favre 28', Bourgarit 56', Cancoriet 62', Wardi 71')
   *    + 1EP(52') + 4T(Reus 30', Hastoy 57' 63' 72') + auto conv EP
   *    = 20+5+2+8 = 35
   * USAP : 2P(Allan 8', 33') = 6
   *
   * CJ : Crossdale (30'), Tuilagi (64')
   */
  // Stade Marcel-Deflandre (extérieur)
  const venue = await prisma.venue.findFirst({ where: { name: { contains: "Deflandre" } } });

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      refereeId,
      venueId: venue?.id ?? undefined,
      // Mi-temps
      halfTimeUsap: 6,
      halfTimeOpponent: 7,
      // Détail scoring USAP
      triesUsap: 0,
      conversionsUsap: 0,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring La Rochelle
      triesOpponent: 4,
      conversionsOpponent: 4,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 1,
      // Rapport
      report:
        "Lourde défaite de l'USAP à Marcel-Deflandre. Les Catalans résistent bien en première " +
        "période (7-6 à la pause) grâce à 2 pénalités d'Allan, mais Favre ouvre la marque " +
        "pour La Rochelle (28'). Crossdale prend un carton jaune (30'). En seconde mi-temps, " +
        "La Rochelle accélère grâce à ses remplaçants de luxe (Hastoy, Bourgarit, Danty, " +
        "Kerr-Barlow entrés à la pause). Essai de pénalité (52'), puis Bourgarit (56'), " +
        "Cancoriet (62') et Wardi (71') enfoncent le clou. Tuilagi écopé d'un CJ (64'). " +
        "Défaite sans bonus défensif pour l'USAP.",
    },
  });
  console.log("  Match mis à jour");

  // -------------------------------------------------------------------------
  // 4. Composition USAP (23 joueurs)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition USAP ---");
  const deleted = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);

    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;
    let yellowCard = false, yellowCardMin: number | null = null;

    // Allan : 2 pénalités (8', 33') = 6 pts
    if (p.lastName === "Allan" && p.num === 15) { penalties = 2; totalPoints = 6; }
    // Crossdale : CJ 30'
    if (p.lastName === "Crossdale") { yellowCard = true; yellowCardMin = 30; }
    // Tuilagi : CJ 64'
    if (p.lastName === "Tuilagi") { yellowCard = true; yellowCardMin = 64; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: false,
        positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard, yellowCardMin,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null,
        subOut: (p as any).subOut ?? null,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const extra = [
      totalPoints > 0 ? `(${totalPoints} pts)` : "",
      yellowCard ? `[CJ ${yellowCardMin}']` : "",
      sub,
      `[${p.minutesPlayed}']`,
    ].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // -------------------------------------------------------------------------
  // 5. Composition La Rochelle (adversaire)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition La Rochelle ---");

  for (const p of LR_SQUAD) {
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

  // -------------------------------------------------------------------------
  // 6. Liens joueurs-saison
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 7. Événements du match (timeline)
  // -------------------------------------------------------------------------
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
    // 8' - Pénalité Allan (USAP) 0-3
    { minute: 8, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 0-3." },
    // 28' - Essai Favre (LR) 5-3
    { minute: 28, type: "ESSAI", isUsap: false,
      description: "Essai de Jules Favre (La Rochelle). 5-3." },
    // 30' - Transformation Reus (LR) 7-3
    { minute: 30, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Hugo Reus (La Rochelle). 7-3." },
    // 30' - CJ Crossdale (USAP)
    { minute: 30, type: "CARTON_JAUNE", playerLastName: "Crossdale", isUsap: true,
      description: "Carton jaune Alistair Crossdale (USAP). USAP à 14." },
    // 33' - Pénalité Allan (USAP) 7-6
    { minute: 33, type: "PENALITE", playerLastName: "Allan", isUsap: true,
      description: "Pénalité de Tommaso Allan (USAP). 7-6." },

    // === MI-TEMPS : La Rochelle 7 - 6 USAP ===

    // === SECONDE MI-TEMPS ===
    // 52' - Essai de pénalité (LR) 14-6
    { minute: 52, type: "ESSAI_PENALITE", isUsap: false,
      description: "Essai de pénalité (La Rochelle). Conversion automatique. 14-6." },
    // 56' - Essai Bourgarit (LR) 19-6
    { minute: 56, type: "ESSAI", isUsap: false,
      description: "Essai de Pierre Bourgarit (La Rochelle). 19-6." },
    // 57' - Transformation Hastoy (LR) 21-6
    { minute: 57, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation d'Antoine Hastoy (La Rochelle). 21-6." },
    // 62' - Essai Cancoriet (LR) 26-6
    { minute: 62, type: "ESSAI", isUsap: false,
      description: "Essai de Judicaël Cancoriet (La Rochelle). 26-6." },
    // 63' - Transformation Hastoy (LR) 28-6
    { minute: 63, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation d'Antoine Hastoy (La Rochelle). 28-6." },
    // 64' - CJ Tuilagi (USAP)
    { minute: 64, type: "CARTON_JAUNE", playerLastName: "Tuilagi", isUsap: true,
      description: "Carton jaune Posolo Tuilagi (USAP). USAP à 14." },
    // 71' - Essai Wardi (LR) 33-6
    { minute: 71, type: "ESSAI", isUsap: false,
      description: "Essai de Reda Wardi (La Rochelle). 33-6." },
    // 72' - Transformation Hastoy (LR) 35-6
    { minute: 72, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation d'Antoine Hastoy (La Rochelle). 35-6. Score final." },
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

  // -------------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : La Rochelle 35 - 6 USAP (extérieur)");
  console.log("  Mi-temps : La Rochelle 7 - 6 USAP");
  console.log("  Arbitre : Benoît Rousselet");
  console.log("  Stade : Marcel-Deflandre");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition La Rochelle : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  2 CJ USAP : Crossdale (30'), Tuilagi (64')");
  console.log("  USAP : 0 essai, 2 pénalités Allan");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

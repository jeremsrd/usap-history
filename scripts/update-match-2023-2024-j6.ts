/**
 * Mise à jour du match Toulouse - USAP (J6 Top 14, 11/11/2023)
 * Score : Stade Toulousain 43 - 34 USAP
 *
 * Match fou à 77 points ! L'USAP mène 3-3 puis encaisse 28 points d'affilée
 * après le carton jaune de Fa'aso'o (28'). Superbe réaction en 2e mi-temps
 * avec 4 essais mais insuffisant. Ramos 100% au pied (5T+1P).
 *
 * Essais USAP : Ruiz (46'), Van Tonder (49'), Acebes (63'), Deghmache (66')
 * Essais Toulouse : Capuozzo (19'), Jelonch (31'), Arnold (35'), Costes (40'),
 *                   Jaminet (43'), Mauvaka (51')
 *
 * Sources : top14.lnr.fr, eurosport.fr, francebleu.fr, allrugby.com,
 *           stadetoulousain.fr
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j6.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2023-2024/j6/10296-toulouse-perpignan/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 52, subOut: 52 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 4, firstName: "Marvin", lastName: "Orie", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 5, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 48, subOut: 48 },
  { num: 7, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80 },
  { num: 8, firstName: "Sootala", lastName: "Fa'aso'o", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 57, subOut: 57 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 80 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 36, subOut: 36 },
  { num: 11, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Edward", lastName: "Sawailau", position: Position.CENTRE, isStarter: true, minutesPlayed: 58, subOut: 58 },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "Louis", lastName: "Dupichot", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Jean-Pascal", lastName: "Barraque", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 23, subIn: 57 },          // remplace Ruiz 57'
  { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 28, subIn: 52 },    // remplace Lotrian 52'
  { num: 18, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 23, subIn: 57 },   // remplace Orie 57'
  { num: 19, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 32, subIn: 48 }, // remplace Bachelier 48'
  { num: 20, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 23, subIn: 57 },       // remplace Fa'aso'o 57'
  { num: 21, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_OUVERTURE, isStarter: false, minutesPlayed: 44, subIn: 36 },     // remplace McIntyre 36'
  { num: 22, firstName: "Mathieu", lastName: "Acebes", position: Position.CENTRE, isStarter: false, minutesPlayed: 22, subIn: 58 },           // remplace Sawailau 58'
  { num: 23, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 23, subIn: 57 },  // remplace Joly 57'
];

// === COMPOSITION TOULOUSE (adversaire) ===
const TOULOUSE_SQUAD = [
  { num: 1, name: "Rodrigue Neti", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Peato Mauvaka", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Dorian Aldegheri", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Richie Arnold", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Thibaud Flament", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Anthony Jelonch", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "François Cros", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Alexandre Roumat", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Paul Graou", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Thomas Ramos", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Arthur Retière", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Pierre-Louis Barassi", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Paul Costes", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Ange Capuozzo", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Melvyn Jaminet", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Ian Boubila", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "Cyril Baille", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Piula Faasalele", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Mathis Castro Ferreira", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Rynhardt Elstadt", position: Position.NUMERO_HUIT, isStarter: false },
  { num: 21, name: "Antoine Dupont", position: Position.DEMI_DE_MELEE, isStarter: false, isCaptain: true },
  { num: 22, name: "Sofiane Guitoune", position: Position.CENTRE, isStarter: false },
  { num: 23, name: "Owen Franks", position: Position.PILIER_DROIT, isStarter: false },
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
  console.log("=== Mise à jour match Toulouse - USAP (J6, 11/11/2023) ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver le match
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 6, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // -------------------------------------------------------------------------
  // 2. Arbitre
  // -------------------------------------------------------------------------
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Jérémy", "Rozier");

  // -------------------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // -------------------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score : Toulouse 43 - 34 USAP
   * Mi-temps : Toulouse 31 - 6 USAP
   *
   * Toulouse : 6E 5T 1P 0D = 30+10+3 = 43
   * USAP : 4E 4T 2P 0D = 20+8+6 = 34
   *
   * CJ Fa'aso'o (28')
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "15:00",
      refereeId,
      // Mi-temps
      halfTimeUsap: 6,
      halfTimeOpponent: 31,
      // Détail scoring USAP
      triesUsap: 4,
      conversionsUsap: 4,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Toulouse
      triesOpponent: 6,
      conversionsOpponent: 5,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Match fou à Ernest-Wallon avec 77 points et 10 essais ! L'USAP tient le coup (3-3, 10-6) " +
        "jusqu'au carton jaune de Fa'aso'o (28'). En infériorité numérique, les Catalans encaissent " +
        "trois essais en 10 minutes (Jelonch 31', Arnold 35', Costes 40') et se retrouvent menés 31-6 " +
        "à la pause. Jaminet enfonce le clou (43') pour 38-6. Mais l'USAP réagit superbement : Ruiz (46'), " +
        "Van Tonder (49'), Acebes (63') et Deghmache (66') inscrivent 4 essais pour un score final de 43-34. " +
        "Ramos impérial au pied (5/5 aux transformations + 1 pénalité). Rodor buteur USAP en 2e mi-temps " +
        "après la sortie de McIntyre (36'). Pas de bonus défensif mais un état d'esprit retrouvé.",
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

    // Ruiz : 1 essai (46')
    if (p.lastName === "Ruiz" && p.num === 2) { tries = 1; totalPoints = 5; }
    // Van Tonder : 1 essai (49')
    if (p.lastName === "Van Tonder") { tries = 1; totalPoints = 5; }
    // Acebes : 1 essai (63')
    if (p.lastName === "Acebes") { tries = 1; totalPoints = 5; }
    // Deghmache : 1 essai (66')
    if (p.lastName === "Deghmache") { tries = 1; totalPoints = 5; }
    // McIntyre : 2 pénalités = 6 pts (sorti 36')
    if (p.lastName === "McIntyre") { penalties = 2; totalPoints = 6; }
    // Rodor : 4 transformations = 8 pts (entré 36')
    if (p.lastName === "Rodor") { conversions = 4; totalPoints = 8; }
    // Fa'aso'o : CJ 28'
    if (p.lastName === "Fa'aso'o") { yellowCard = true; yellowCardMin = 28; }

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
  // 5. Composition Toulouse (adversaire)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition Toulouse ---");

  for (const p of TOULOUSE_SQUAD) {
    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        isOpponent: true,
        opponentPlayerName: p.name,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const cap = p.isCaptain ? " (C)" : "";
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.name}${cap}`);
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
    // 8' - Pénalité Ramos (TLS) 0-3
    { minute: 8, type: "PENALITE", isUsap: false,
      description: "Pénalité de Thomas Ramos (Toulouse). 0-3." },
    // 12' - Pénalité McIntyre (USAP) 3-3
    { minute: 12, type: "PENALITE", playerLastName: "McIntyre", isUsap: true,
      description: "Pénalité de Jake McIntyre (USAP). 3-3." },
    // 19' - Essai Capuozzo (TLS) + Conv Ramos 3-10
    { minute: 19, type: "ESSAI", isUsap: false,
      description: "Essai d'Ange Capuozzo (Toulouse). 3-8." },
    { minute: 20, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Thomas Ramos (Toulouse). 3-10." },
    // 25' - Pénalité McIntyre (USAP) 6-10
    { minute: 25, type: "PENALITE", playerLastName: "McIntyre", isUsap: true,
      description: "Pénalité de Jake McIntyre (USAP). 6-10." },
    // 28' - CJ Fa'aso'o (USAP)
    { minute: 28, type: "CARTON_JAUNE", playerLastName: "Fa'aso'o", isUsap: true,
      description: "Carton jaune Sootala Fa'aso'o (USAP). USAP à 14." },
    // 31' - Essai Jelonch (TLS) + Conv Ramos 6-17
    { minute: 31, type: "ESSAI", isUsap: false,
      description: "Essai d'Anthony Jelonch (Toulouse). 6-15." },
    { minute: 32, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Thomas Ramos (Toulouse). 6-17." },
    // 35' - Essai Arnold (TLS) + Conv Ramos 6-24
    { minute: 35, type: "ESSAI", isUsap: false,
      description: "Essai de Richie Arnold (Toulouse). 6-22." },
    { minute: 36, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Thomas Ramos (Toulouse). 6-24." },
    // 40' - Essai Costes (TLS) + Conv Ramos 6-31
    { minute: 40, type: "ESSAI", isUsap: false,
      description: "Essai de Paul Costes (Toulouse). 6-29." },
    { minute: 40, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Thomas Ramos (Toulouse). 6-31." },
    // === MI-TEMPS : USAP 6 - 31 Toulouse ===
    // 43' - Essai Jaminet (TLS) + Conv Ramos 6-38
    { minute: 43, type: "ESSAI", isUsap: false,
      description: "Essai de Melvyn Jaminet (Toulouse). 6-36." },
    { minute: 44, type: "TRANSFORMATION", isUsap: false,
      description: "Transformation de Thomas Ramos (Toulouse). 6-38." },
    // 46' - Essai Ruiz (USAP) + Conv Rodor 13-38
    { minute: 46, type: "ESSAI", playerLastName: "Ruiz", isUsap: true,
      description: "Essai d'Ignacio Ruiz (USAP). 11-38." },
    { minute: 47, type: "TRANSFORMATION", playerLastName: "Rodor", isUsap: true,
      description: "Transformation de Matteo Rodor (USAP). 13-38." },
    // 49' - Essai Van Tonder (USAP) + Conv Rodor 20-38
    { minute: 49, type: "ESSAI", playerLastName: "Van Tonder", isUsap: true,
      description: "Essai de Jacobus Van Tonder (USAP). 18-38." },
    { minute: 50, type: "TRANSFORMATION", playerLastName: "Rodor", isUsap: true,
      description: "Transformation de Matteo Rodor (USAP). 20-38." },
    // 51' - Essai Mauvaka (TLS) non transformé 20-43
    { minute: 51, type: "ESSAI", isUsap: false,
      description: "Essai de Peato Mauvaka (Toulouse). Non transformé. 20-43." },
    // 63' - Essai Acebes (USAP) + Conv Rodor 27-43
    { minute: 63, type: "ESSAI", playerLastName: "Acebes", isUsap: true,
      description: "Essai de Mathieu Acebes (USAP). 25-43." },
    { minute: 64, type: "TRANSFORMATION", playerLastName: "Rodor", isUsap: true,
      description: "Transformation de Matteo Rodor (USAP). 27-43." },
    // 66' - Essai Deghmache (USAP) + Conv Rodor 34-43
    { minute: 66, type: "ESSAI", playerLastName: "Deghmache", isUsap: true,
      description: "Essai de Sadek Deghmache (USAP). Superbe mouvement de 80m. 32-43." },
    { minute: 67, type: "TRANSFORMATION", playerLastName: "Rodor", isUsap: true,
      description: "Transformation de Matteo Rodor (USAP). 34-43." },
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

    const side = evt.isUsap ? "USAP" : "TLS";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // -------------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Toulouse 43 - 34 USAP (extérieur)");
  console.log("  Mi-temps : USAP 6 - 31 Toulouse");
  console.log("  Arbitre : Jérémy Rozier");
  console.log("  Composition USAP : 23 joueurs");
  console.log("  Composition Toulouse : 23 joueurs");
  console.log(`  Événements : ${events.length}`);
  console.log("  1 CJ : Fa'aso'o (28')");
  console.log("  77 points, 10 essais !");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

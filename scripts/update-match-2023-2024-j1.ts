/**
 * Mise à jour du match USAP - Stade Français (J1 Top 14, 19/08/2023)
 * Score : USAP 7 - 29 Stade Français Paris
 *
 * Ajoute : arbitre, score mi-temps, détail scoring,
 *          composition USAP (23 joueurs), événements du match
 *
 * Sources : top14.lnr.fr, skysports.com, itsrugby.fr, francebleu.fr, eurosport.fr
 *
 * Usage : npx tsx scripts/update-match-2023-2024-j1.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2023-2024/j1/10256-perpignan-paris/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, firstName: "Jérémy", lastName: "Maurouard", position: Position.TALONNEUR, isStarter: true },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, isCaptain: true },
  { num: 11, firstName: "Alistair", lastName: "Crossdale", position: Position.AILIER, isStarter: true },
  { num: 12, firstName: "Apisai", lastName: "Naqalevu", position: Position.CENTRE, isStarter: true },
  { num: 13, firstName: "Jean-Pascal", lastName: "Barraque", position: Position.CENTRE, isStarter: true },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Louis", lastName: "Dupichot", position: Position.ARRIERE, isStarter: true },
  // Remplaçants
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, firstName: "Alan", lastName: "Brazo", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, firstName: "Matteo", lastName: "Rodor", position: Position.NUMERO_HUIT, isStarter: false },
  { num: 21, firstName: "Mathieu", lastName: "Acebes", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: false },
  { num: 23, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT, isStarter: false },
];

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/** Trouve ou crée un joueur par nom */
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
      isActive: false, // Joueur historique (pas dans l'effectif actuel)
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

/** Trouve ou crée un arbitre */
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
  console.log("=== Mise à jour match USAP - Stade Français (J1, 19/08/2023) ===\n");

  // -------------------------------------------------------------------------
  // 1. Trouver le match
  // -------------------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2023, endYear: 2024 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 1,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // -------------------------------------------------------------------------
  // 2. Arbitre : Ludovic Cayre
  // -------------------------------------------------------------------------
  console.log("--- Arbitre ---");
  const refereeId = await findOrCreateReferee("Ludovic", "Cayre");

  // -------------------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // -------------------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score :
   *   0-7 (5') Ivaldi try + Segonds conv
   *   7-7 (20') Penalty try USAP
   *   7-10 (26') Segonds pen
   *   7-13 (32') Segonds pen
   *   --- MI-TEMPS : USAP 7 - 13 Stade Français ---
   *   7-16 (52') Segonds pen
   *   7-19 (66') Segonds pen
   *   7-22 (70') Segonds pen
   *   7-29 (78') Dakuwaqa try + Barré conv
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "18:10",
      refereeId,
      attendance: 14500,
      // Mi-temps
      halfTimeUsap: 7,
      halfTimeOpponent: 13,
      // Détail scoring USAP
      triesUsap: 0,
      conversionsUsap: 0,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 1,
      // Détail scoring Stade Français
      triesOpponent: 2,
      conversionsOpponent: 2,
      penaltiesOpponent: 5,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Ouverture de la saison 2023-2024 à Aimé-Giral devant un stade comble. " +
        "Le Stade Français ouvre le score dès la 5e minute par Ivaldi. L'USAP égalise sur essai de pénalité (20'). " +
        "Mais les Parisiens reprennent l'avantage grâce au pied de Segonds (5 pénalités) " +
        "et enfoncent le clou avec un essai de Dakuwaqa en fin de match. " +
        "Défaite nette 7-29. Carton jaune pour Fakatika (69'). " +
        "Début de saison difficile pour l'USAP qui enchaînera 4 défaites consécutives.",
    },
  });
  console.log("  Match mis à jour (mi-temps, scoring, arbitre, rapport)");

  // -------------------------------------------------------------------------
  // 4. Composition USAP (23 joueurs)
  // -------------------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  // Nettoyage
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: match.id },
  });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  // Trouver ou créer les joueurs + créer les MatchPlayer
  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);

    // Stats individuelles
    let yellowCard = false;
    let yellowCardMin: number | null = null;

    // Fakatika : carton jaune (69')
    if (p.lastName === "Fakatika") {
      yellowCard = true;
      yellowCardMin = 69;
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
        tries: 0,
        conversions: 0,
        penalties: 0,
        totalPoints: 0,
        yellowCard,
        yellowCardMin,
      },
    });

    const label = p.isStarter ? "TIT" : "REM";
    const extra = [
      p.isCaptain ? "(C)" : "",
      yellowCard ? `[CJ ${yellowCardMin}']` : "",
    ].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // -------------------------------------------------------------------------
  // 5. Lier les nouveaux joueurs à la saison 2023-2024
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

    const existingLink = await prisma.seasonPlayer.findFirst({
      where: { seasonId: season.id, playerId: player.id },
    });
    if (!existingLink) {
      await prisma.seasonPlayer.create({
        data: {
          seasonId: season.id,
          playerId: player.id,
          position: p.position,
        },
      });
      linkedCount++;
    }
  }
  console.log(`  ${linkedCount} nouveau(x) lien(s) joueur-saison créé(s)`);

  // -------------------------------------------------------------------------
  // 6. Événements du match (timeline)
  // -------------------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: match.id },
  });
  if (deletedEvents.count > 0) console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events: Array<{
    minute: number;
    type: string;
    playerLastName?: string;
    isUsap: boolean;
    description: string;
  }> = [
    // 5' - Essai Ivaldi (Stade Français) 0-5
    {
      minute: 5,
      type: "ESSAI",
      isUsap: false,
      description: "Essai de Mickaël Ivaldi (Stade Français). 0-5.",
    },
    {
      minute: 5,
      type: "TRANSFORMATION",
      isUsap: false,
      description: "Transformation de Joris Segonds (Stade Français). 0-7.",
    },
    // 14' - Carton jaune Dakuwaqa (Stade Français)
    {
      minute: 14,
      type: "CARTON_JAUNE",
      isUsap: false,
      description: "Carton jaune Peniasi Dakuwaqa (Stade Français).",
    },
    // 20' - Essai de pénalité USAP 7-7
    {
      minute: 20,
      type: "ESSAI_PENALITE",
      isUsap: true,
      description: "Essai de pénalité pour l'USAP. Carton jaune Pesenti (Stade Français). 7-7.",
    },
    // 20' - Carton jaune Pesenti (Stade Français)
    {
      minute: 20,
      type: "CARTON_JAUNE",
      isUsap: false,
      description: "Carton jaune Baptiste Pesenti (Stade Français) sur l'essai de pénalité.",
    },
    // 26' - Pénalité Segonds 7-10
    {
      minute: 26,
      type: "PENALITE",
      isUsap: false,
      description: "Pénalité de Joris Segonds (Stade Français). 7-10.",
    },
    // 32' - Pénalité Segonds 7-13
    {
      minute: 32,
      type: "PENALITE",
      isUsap: false,
      description: "Pénalité de Joris Segonds (Stade Français). 7-13.",
    },
    // --- MI-TEMPS ---
    // 52' - Pénalité Segonds 7-16
    {
      minute: 52,
      type: "PENALITE",
      isUsap: false,
      description: "Pénalité de Joris Segonds (Stade Français). 7-16.",
    },
    // 66' - Pénalité Segonds 7-19
    {
      minute: 66,
      type: "PENALITE",
      isUsap: false,
      description: "Pénalité de Joris Segonds (Stade Français). 7-19.",
    },
    // 69' - Carton jaune Fakatika (USAP)
    {
      minute: 69,
      type: "CARTON_JAUNE",
      playerLastName: "Fakatika",
      isUsap: true,
      description: "Carton jaune Akato Fakatika (USAP).",
    },
    // 70' - Pénalité Segonds 7-22
    {
      minute: 70,
      type: "PENALITE",
      isUsap: false,
      description: "Pénalité de Joris Segonds (Stade Français). 7-22.",
    },
    // 78' - Essai Dakuwaqa (Stade Français) 7-27
    {
      minute: 78,
      type: "ESSAI",
      isUsap: false,
      description: "Essai de Peniasi Dakuwaqa (Stade Français). 7-27.",
    },
    // 79' - Transformation Barré 7-29
    {
      minute: 79,
      type: "TRANSFORMATION",
      isUsap: false,
      description: "Transformation de Léo Barré (Stade Français). 7-29.",
    },
    // 80' - Carton jaune Abramishvili (Stade Français)
    {
      minute: 80,
      type: "CARTON_JAUNE",
      isUsap: false,
      description: "Carton jaune Sergo Abramishvili (Stade Français).",
    },
  ];

  for (const evt of events) {
    // Résoudre le playerId pour les événements USAP
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

    const side = evt.isUsap ? "USAP" : "SF";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  // -------------------------------------------------------------------------
  // Résumé
  // -------------------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : USAP 7 - 29 Stade Français");
  console.log("  Mi-temps : USAP 7 - 13 Stade Français");
  console.log("  Arbitre : Ludovic Cayre");
  console.log("  Affluence : ~14 500 (guichets fermés)");
  console.log("  Composition : 23 joueurs USAP");
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

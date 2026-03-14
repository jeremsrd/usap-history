/**
 * Script de mise à jour du match USAP - Racing 92 (J3 Top 14, 20/09/2025)
 * Score final : USAP 15 - Racing 92 28
 * Mi-temps : USAP 10 - Racing 22
 *
 * Défaite à domicile à Aimé-Giral. Tom Ecochard ouvre le score dès la 2e minute,
 * mais le Racing prend le contrôle avec 3 essais (Hulleu 15', Joseph 30', Habosi 37').
 * Allan répond d'une pénalité (13'). En 2e mi-temps, Malolo réduit l'écart (52') mais
 * le Racing assure au pied (Seunes, Spring). Incidents en fin de match (envahissement
 * de terrain, jets de bière) → sanctions LNR (50 000€ d'amende, fermeture d'Aimé-Giral).
 * Débuts de Jamie Ritchie sous le maillot sang et or.
 *
 * Arbitre : Pierre Brousset
 *
 * Sources : top14.lnr.fr, racing92.fr, allrugby.com, francebleu.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j3-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("=== Mise à jour match USAP - Racing 92 (J3, 20/09/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J3 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 3,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Pierre Brousset
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: "Brousset" },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Pierre",
        lastName: "Brousset",
        slug: "pierre-brousset",
      },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName}`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName}`);
  }

  // ---------------------------------------------------------------
  // 2. Résolution des joueurs USAP (par nom de famille)
  // ---------------------------------------------------------------
  console.log("\n--- Résolution joueurs USAP ---");

  async function findPlayer(lastName: string, firstName?: string): Promise<string> {
    const where: Record<string, unknown> = {
      lastName: { equals: lastName, mode: "insensitive" },
    };
    if (firstName) {
      where.firstName = { equals: firstName, mode: "insensitive" };
    }
    const player = await prisma.player.findFirst({ where });
    if (!player) {
      throw new Error(`Joueur non trouvé : ${firstName || ""} ${lastName}`);
    }
    return player.id;
  }

  const PLAYER_IDS: Record<string, string> = {};
  const usapNames = [
    "Beria", "Lotrian", "Brookes", "Van Tonder", "Warion",
    "Le Corvec", "Hicks", "Yato", "Ecochard", "Allan",
    "Buliruarua", "Duguivalu", "Paia'aua", "Veredamu", "Dubois",
    "Malolo", "Devaux", "Tanguy", "Ritchie", "Della Schiava",
    "Aprasidze", "De La Fuente", "Roelofse",
  ];

  for (const name of usapNames) {
    try {
      PLAYER_IDS[name] = await findPlayer(name);
      console.log(`  ✓ ${name}`);
    } catch {
      console.log(`  ✗ ${name} — NON TROUVÉ`);
    }
  }

  const VENUE_ID = "cmm6wnybf000d1uihl8hsk9e1"; // Stade Aimé-Giral

  // ---------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (USAP - Racing 92) :
   *  2' Essai Ecochard (USAP) → 5-0
   *  3' Transfo Allan (USAP) → 7-0
   * 13' Pénalité Allan (USAP) → 10-0
   * 15' Essai Hulleu (R92) → 10-5
   * 16' Transfo Seunes (R92) → 10-7
   * 21' Pénalité Seunes (R92) → 10-10
   * 30' Essai Joseph (R92) → 10-15
   * 31' Transfo Seunes (R92) → 10-17
   * 37' Essai Habosi (R92) → 10-22
   * MI-TEMPS : USAP 10 - Racing 22
   * 47' Pénalité Seunes (R92) → 10-25
   * 52' Essai Malolo (USAP) → 15-25
   * 59' Pénalité Spring (R92) → 15-28
   *
   * USAP : 2E + 1T + 1P = 10 + 2 + 3 = 15 points
   * Racing : 3E + 2T + 3P = 15 + 4 + 9 = 28 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "18:30",
      refereeId: referee.id,
      venueId: VENUE_ID,
      attendance: null, // Non confirmé
      halfTimeUsap: 10,
      halfTimeOpponent: 22,
      // Détail scoring USAP
      triesUsap: 2,
      conversionsUsap: 1,
      penaltiesUsap: 1,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Racing 92
      triesOpponent: 3,
      conversionsOpponent: 2,
      penaltiesOpponent: 3,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Défaite à domicile face au Racing 92 (15-28). Tom Ecochard ouvre le score dès la 2e minute, " +
        "et Allan porte l'avantage à 10-0 (pénalité 13'). Mais le Racing réagit avec trois essais " +
        "de Hulleu (15'), Jordan Joseph (30') et Habosi (37') pour mener 22-10 à la pause. " +
        "En seconde période, Malolo réduit l'écart (52') mais les pénalités de Seunes (47') " +
        "et Spring (59') scellent la victoire des Franciliens. Première de Jamie Ritchie " +
        "sous le maillot sang et or (entré à la 41'). Fin de match houleuse avec incidents " +
        "en tribunes (jets de bière, envahissement de terrain) qui vaudront à l'USAP " +
        "50 000€ d'amende et une fermeture d'Aimé-Giral.",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, rapport)");

  // ---------------------------------------------------------------
  // 4. Composition USAP (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  // Nettoyage des éventuels MatchPlayer USAP existants
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: match.id, isOpponent: false },
  });
  console.log(`  ${deleted.count} entrée(s) USAP supprimée(s)`);

  // Remplacements USAP (source : allrugby.com) :
  // 39' Brookes → Roelofse
  // 41' Beria → Devaux, Le Corvec → Ritchie
  // 48' Lotrian → Malolo
  // 50' Hicks → Della Schiava
  // 66' Yato → Tanguy
  // 76' Ecochard → Aprasidze
  const USAP_SQUAD = [
    // Titulaires
    { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true, minutesPlayed: 41 },
    { num: 2, lastName: "Lotrian", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 48 },
    { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 39 },
    { num: 4, lastName: "Van Tonder", position: "DEUXIEME_LIGNE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 6, lastName: "Le Corvec", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 41 },
    { num: 7, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 50 },
    { num: 8, lastName: "Yato", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 66 },
    { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 76 },
    { num: 10, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 11, lastName: "Buliruarua", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 13, lastName: "Paia'aua", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 15, lastName: "Dubois", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Malolo", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 32 },    // entré 48'
    { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 39 }, // entré 41'
    { num: 18, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 14 }, // entré 66'
    { num: 19, lastName: "Ritchie", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 39 }, // entré 41'
    { num: 20, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 30 }, // entré 50'
    { num: 21, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 4 },  // entré 76'
    { num: 22, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: false, minutesPlayed: 0 },  // non entré
    { num: 23, lastName: "Roelofse", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 41 }, // entré 39'
  ];

  for (const p of USAP_SQUAD) {
    const playerId = PLAYER_IDS[p.lastName];
    if (!playerId) {
      console.log(`  ⚠ Joueur non trouvé : ${p.lastName}`);
      continue;
    }

    let tries = 0,
      conversions = 0,
      penalties = 0,
      totalPoints = 0;

    // Stats individuelles
    if (p.lastName === "Ecochard") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Allan") {
      conversions = 1;
      penalties = 1;
      totalPoints = 1 * 2 + 1 * 3; // 2 + 3 = 5
    } else if (p.lastName === "Malolo") {
      tries = 1;
      totalPoints = 5;
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: (p as { isCaptain?: boolean }).isCaptain ?? false,
        positionPlayed: p.position,
        tries,
        conversions,
        penalties,
        totalPoints,
        minutesPlayed: p.minutesPlayed,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts} [${p.minutesPlayed}']`);
  }

  // Vérification total points USAP
  const totalPtsUsap = 5 + 5 + 5; // Ecochard 5 + Allan 5 + Malolo 5
  console.log(`\n  Vérification : total points individuels = ${totalPtsUsap} (attendu : 15)`);

  // ---------------------------------------------------------------
  // 5. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: match.id },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events = [
    // === 1re mi-temps ===
    {
      minute: 2, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Ecochard"], isUsap: true,
      description: "Essai de Tom Ecochard ! Ouverture du score rapide pour l'USAP. 5-0.",
    },
    {
      minute: 3, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. 7-0.",
    },
    {
      minute: 13, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. 10-0.",
    },
    {
      minute: 15, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Wilfried Hulleu (Racing 92). 10-5.",
    },
    {
      minute: 16, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation d'Ugo Seunes (Racing 92). 10-7.",
    },
    {
      minute: 21, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité d'Ugo Seunes (Racing 92). 10-10.",
    },
    {
      minute: 30, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Jordan Joseph (Racing 92). 10-15.",
    },
    {
      minute: 31, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation d'Ugo Seunes (Racing 92). 10-17.",
    },
    {
      minute: 37, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Vinaya Habosi (Racing 92). 10-22.",
    },

    // === 2e mi-temps ===
    // 39' Remplacement Brookes → Roelofse
    {
      minute: 39, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Sortie de Kieran Brookes. Remplacé par Nemo Roelofse.",
    },
    {
      minute: 39, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Roelofse"], isUsap: true,
      description: "Entrée de Nemo Roelofse en remplacement de Brookes.",
    },
    // 41' Double remplacement : Beria → Devaux, Le Corvec → Ritchie
    {
      minute: 41, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Beria"], isUsap: true,
      description: "Sortie de Giorgi Beria. Remplacé par Bruce Devaux.",
    },
    {
      minute: 41, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Devaux"], isUsap: true,
      description: "Entrée de Bruce Devaux en remplacement de Beria.",
    },
    {
      minute: 41, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Le Corvec"], isUsap: true,
      description: "Sortie de Mattéo Le Corvec. Remplacé par Jamie Ritchie.",
    },
    {
      minute: 41, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Ritchie"], isUsap: true,
      description: "Entrée de Jamie Ritchie en remplacement de Le Corvec. Débuts sous le maillot USAP.",
    },
    {
      minute: 47, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité d'Ugo Seunes (Racing 92). 10-25.",
    },
    // 48' Lotrian → Malolo
    {
      minute: 48, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Lotrian"], isUsap: true,
      description: "Sortie de Mathys Lotrian. Remplacé par Sama Malolo.",
    },
    {
      minute: 48, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Malolo"], isUsap: true,
      description: "Entrée de Sama Malolo en remplacement de Lotrian.",
    },
    // 50' Hicks → Della Schiava
    {
      minute: 50, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Hicks"], isUsap: true,
      description: "Sortie de Max Hicks. Remplacé par Noé Della Schiava.",
    },
    {
      minute: 50, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Della Schiava"], isUsap: true,
      description: "Entrée de Noé Della Schiava en remplacement de Hicks.",
    },
    {
      minute: 52, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Malolo"], isUsap: true,
      description: "Essai de Sama Malolo ! L'USAP revient dans le match. 15-25.",
    },
    {
      minute: 59, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Max Spring (Racing 92). 15-28.",
    },
    // 66' Yato → Tanguy
    {
      minute: 66, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Yato"], isUsap: true,
      description: "Sortie de Peceli Yato. Remplacé par Mathieu Tanguy.",
    },
    {
      minute: 66, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Tanguy"], isUsap: true,
      description: "Entrée de Mathieu Tanguy en remplacement de Yato.",
    },
    // 76' Ecochard → Aprasidze
    {
      minute: 76, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Ecochard"], isUsap: true,
      description: "Sortie de Tom Ecochard. Remplacé par Gela Aprasidze.",
    },
    {
      minute: 76, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Aprasidze"], isUsap: true,
      description: "Entrée de Gela Aprasidze en remplacement d'Ecochard.",
    },
  ];

  for (const evt of events) {
    await prisma.matchEvent.create({
      data: {
        matchId: match.id,
        minute: evt.minute,
        type: evt.type,
        playerId: evt.playerId,
        isUsap: evt.isUsap,
        description: evt.description,
      },
    });
    const side = evt.isUsap ? "USAP" : "R92 ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Aimé-Giral (Perpignan) — domicile");
  console.log("  Arbitre : Pierre Brousset");
  console.log("  Score mi-temps : USAP 10 - Racing 92 22");
  console.log("  Score final : USAP 15 - Racing 92 28");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
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

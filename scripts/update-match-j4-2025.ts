/**
 * Script de mise à jour du match La Rochelle - USAP (J4 Top 14, 27/09/2025)
 * Score final : La Rochelle 31 - USAP 8
 * Mi-temps : La Rochelle 7 - USAP 8
 *
 * Déplacement à Marcel-Deflandre. L'USAP mène 8-0 après un bon quart d'heure
 * (essai Granell 10', pénalité Aprasidze 15'). Favre répond pour La Rochelle (17').
 * Mi-temps 7-8 en faveur des Catalans. En 2e période, pénalité Le Garrec (48'),
 * carton jaune Tetrashvili (51') et La Rochelle déroule : Jegou (53'), Penverne (56'),
 * Botia (80'). De La Fuente repositionné en n°10. 4e défaite consécutive.
 *
 * Arbitre : Adrien Marbot
 *
 * Sources : top14.lnr.fr, allrugby.com, francebleu.fr, vibrez-rugby.com
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j4-2025.ts
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
  console.log("=== Mise à jour match La Rochelle - USAP (J4, 27/09/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J4 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 4,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Adrien Marbot
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: "Marbot" },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Adrien",
        lastName: "Marbot",
        slug: "adrien-marbot",
      },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName}`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName}`);
  }

  // ---------------------------------------------------------------
  // 1b. Stade Marcel-Deflandre
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { slug: "stade-marcel-deflandre" },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade Marcel-Deflandre",
        slug: "stade-marcel-deflandre",
        city: "La Rochelle",
        capacity: 16000,
      },
    });
    console.log(`  Créé : ${venue.name}`);
  } else {
    console.log(`  Existe : ${venue.name} (${venue.id})`);
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
    "Devaux", "Malolo", "Roelofse", "Warion", "Tanguy",
    "Diaby", "Ritchie", "Hicks", "Aprasidze", "De La Fuente",
    "Granell", "Poulet", "Buliruarua", "Joseph", "Forner",
    "Montgaillard", "Tetrashvili", "Le Corvec", "Yato", "Hall",
    "Kretchmann", "Duguivalu", "Ceccarelli",
  ];

  for (const name of usapNames) {
    try {
      // Utiliser le prénom pour les homonymes
      if (name === "Le Corvec") {
        PLAYER_IDS[name] = await findPlayer(name, "Mattéo");
      } else if (name === "Joseph") {
        PLAYER_IDS[name] = await findPlayer(name, "Jefferson-Lee");
      } else {
        PLAYER_IDS[name] = await findPlayer(name);
      }
      console.log(`  ✓ ${name}`);
    } catch {
      console.log(`  ✗ ${name} — NON TROUVÉ`);
    }
  }

  // ---------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (La Rochelle - USAP) :
   * 10' Essai Granell (USAP) → 0-5 (transfo manquée Aprasidze)
   * 15' Pénalité Aprasidze (USAP) → 0-8
   * 17' Essai Favre (La Rochelle) → 5-8
   * 18' Transfo West (La Rochelle) → 7-8
   * MI-TEMPS : La Rochelle 7 - USAP 8
   * 48' Pénalité Le Garrec (La Rochelle) → 10-8
   * 51' Carton jaune Tetrashvili (USAP) - effondrement mêlée
   * 53' Essai Jegou (La Rochelle) → 15-8
   * 54' Transfo Le Garrec (La Rochelle) → 17-8
   * 56' Essai Penverne (La Rochelle) → 22-8
   * 57' Transfo Le Garrec (La Rochelle) → 24-8
   * 80' Essai Botia (La Rochelle) → 29-8
   * 81' Transfo Le Garrec (La Rochelle) → 31-8
   *
   * La Rochelle : 4E + 4T + 1P = 20 + 8 + 3 = 31 points
   * USAP : 1E + 0T + 1P = 5 + 0 + 3 = 8 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "16:35",
      refereeId: referee.id,
      venueId: venue.id,
      attendance: null,
      halfTimeUsap: 8,
      halfTimeOpponent: 7,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 0,
      penaltiesUsap: 1,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring La Rochelle
      triesOpponent: 4,
      conversionsOpponent: 4,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Vidéo
      videoUrl: "https://www.dailymotion.com/video/x9rc8b2",
      // Rapport
      report:
        "Défaite à La Rochelle (8-31). L'USAP réalise un excellent premier quart d'heure : " +
        "Forner casse deux plaquages et lance Granell qui aplatit en coin (10'), puis Aprasidze " +
        "ajoute une pénalité (15') pour mener 8-0. Favre répond pour La Rochelle (17', transformé " +
        "par West). Mi-temps 7-8 en faveur des Catalans, très combatifs. En seconde période, " +
        "Le Garrec passe une pénalité (48') puis Tetrashvili prend un carton jaune pour " +
        "effondrement de mêlée (51'). En infériorité numérique, l'USAP craque : Jegou (53') " +
        "et Penverne (56') marquent coup sur coup. Botia aplatit le bonus offensif dans les " +
        "dernières secondes (80'). De La Fuente repositionné au poste de demi d'ouverture. " +
        "4e défaite consécutive, l'USAP reste à 0 point.",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, rapport, vidéo)");

  // ---------------------------------------------------------------
  // 4. Composition USAP (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  // Nettoyage des éventuels MatchPlayer USAP existants
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: match.id, isOpponent: false },
  });
  console.log(`  ${deleted.count} entrée(s) USAP supprimée(s)`);

  // Remplacements USAP :
  // 46' Devaux → Tetrashvili, Roelofse → Ceccarelli
  // 51' Carton jaune Tetrashvili (10 min)
  // 55' Malolo → Montgaillard, Tanguy → Yato, Poulet → Duguivalu
  // 56' Aprasidze → Hall, De La Fuente → Kretchmann
  // 64' Diaby → Le Corvec
  const USAP_SQUAD = [
    // Titulaires
    { num: 1, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: true, minutesPlayed: 46 },
    { num: 2, lastName: "Malolo", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 55 },
    { num: 3, lastName: "Roelofse", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 46 },
    { num: 4, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 55 },
    { num: 6, lastName: "Diaby", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 64 },
    { num: 7, lastName: "Ritchie", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 8, lastName: "Hicks", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 80 },
    { num: 9, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 56 },
    { num: 10, lastName: "De La Fuente", position: "DEMI_OUVERTURE" as const, isStarter: true, isCaptain: true, minutesPlayed: 56 },
    { num: 11, lastName: "Granell", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "Poulet", position: "CENTRE" as const, isStarter: true, minutesPlayed: 55 },
    { num: 13, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Joseph", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 15, lastName: "Forner", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 25 },    // entré 55'
    { num: 17, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 34, yellowCard: true, yellowCardMinute: 51 },  // entré 46'
    { num: 18, lastName: "Le Corvec", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 16 },  // entré 64'
    { num: 19, lastName: "Yato", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 25 },      // entré 55'
    { num: 20, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 24 },        // entré 56'
    { num: 21, lastName: "Kretchmann", position: "DEMI_OUVERTURE" as const, isStarter: false, minutesPlayed: 24 }, // entré 56'
    { num: 22, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: false, minutesPlayed: 25 },          // entré 55'
    { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 34 },   // entré 46'
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
    if (p.lastName === "Granell") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Aprasidze") {
      penalties = 1;
      totalPoints = 3;
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
        yellowCard: (p as { yellowCard?: boolean }).yellowCard ?? false,
        yellowCardMin: (p as { yellowCardMinute?: number }).yellowCardMinute ?? null,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    const yc = (p as { yellowCard?: boolean }).yellowCard ? " [CJ]" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${yc} [${p.minutesPlayed}']`);
  }

  // Vérification total points USAP
  const totalPtsUsap = 5 + 3; // Granell 5 + Aprasidze 3
  console.log(`\n  Vérification : total points individuels = ${totalPtsUsap} (attendu : 8)`);

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
      minute: 10, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Granell"], isUsap: true,
      description: "Essai de Maxim Granell ! Forner casse deux plaquages et lance Granell qui dépose Niniashvili et aplatit en coin. 0-5.",
    },
    {
      minute: 10, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Aprasidze"], isUsap: true,
      description: "Transformation manquée par Gela Aprasidze. 0-5.",
    },
    {
      minute: 15, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aprasidze"], isUsap: true,
      description: "Pénalité de Gela Aprasidze pleine axe. 0-8.",
    },
    {
      minute: 17, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Jules Favre (Stade Rochelais). Sortie rapide de Le Garrec, passe allongée de Bollengier, Favre conclut en coin. 5-8.",
    },
    {
      minute: 18, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation d'Ihaia West (Stade Rochelais). 7-8.",
    },

    // === MI-TEMPS : La Rochelle 7 - USAP 8 ===

    // === 2e mi-temps ===
    // 46' Remplacements front row
    {
      minute: 46, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Devaux"], isUsap: true,
      description: "Sortie de Bruce Devaux. Remplacé par Giorgi Tetrashvili.",
    },
    {
      minute: 46, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Tetrashvili"], isUsap: true,
      description: "Entrée de Giorgi Tetrashvili en remplacement de Devaux.",
    },
    {
      minute: 46, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Roelofse"], isUsap: true,
      description: "Sortie de Nemo Roelofse. Remplacé par Pietro Ceccarelli.",
    },
    {
      minute: 46, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Roelofse.",
    },
    {
      minute: 48, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Nolann Le Garrec (Stade Rochelais). La Rochelle passe devant pour la première fois. 10-8.",
    },
    {
      minute: 51, type: "CARTON_JAUNE" as const,
      playerId: PLAYER_IDS["Tetrashvili"], isUsap: true,
      description: "Carton jaune pour Giorgi Tetrashvili. Effondrement de mêlée. USAP à 14.",
    },
    {
      minute: 53, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai d'Oscar Jegou (Stade Rochelais). Série de pick and go à 5 mètres, Jegou plonge dans l'en-but. USAP à 14. 15-8.",
    },
    {
      minute: 54, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Nolann Le Garrec (Stade Rochelais). 17-8.",
    },
    // 55' Triple remplacement
    {
      minute: 55, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Malolo"], isUsap: true,
      description: "Sortie de Sama Malolo. Remplacé par Victor Montgaillard.",
    },
    {
      minute: 55, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Montgaillard"], isUsap: true,
      description: "Entrée de Victor Montgaillard en remplacement de Malolo.",
    },
    {
      minute: 55, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Tanguy"], isUsap: true,
      description: "Sortie de Mathieu Tanguy. Remplacé par Peceli Yato.",
    },
    {
      minute: 55, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Yato"], isUsap: true,
      description: "Entrée de Peceli Yato en remplacement de Tanguy.",
    },
    {
      minute: 55, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Poulet"], isUsap: true,
      description: "Sortie de Job Poulet. Remplacé par Alivereti Duguivalu.",
    },
    {
      minute: 55, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Duguivalu"], isUsap: true,
      description: "Entrée d'Alivereti Duguivalu en remplacement de Poulet.",
    },
    {
      minute: 56, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Louis Penverne (Stade Rochelais). Touche récupérée, Penverne force en puissance. USAP toujours à 14. 22-8.",
    },
    {
      minute: 57, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Nolann Le Garrec (Stade Rochelais). 24-8.",
    },
    // 56' Double remplacement charnière
    {
      minute: 56, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Aprasidze"], isUsap: true,
      description: "Sortie de Gela Aprasidze. Remplacé par James Hall.",
    },
    {
      minute: 56, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Hall"], isUsap: true,
      description: "Entrée de James Hall en remplacement d'Aprasidze.",
    },
    {
      minute: 56, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["De La Fuente"], isUsap: true,
      description: "Sortie de Jerónimo De La Fuente (cap.). Remplacé par Gabin Kretchmann.",
    },
    {
      minute: 56, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Kretchmann"], isUsap: true,
      description: "Entrée de Gabin Kretchmann en remplacement de De La Fuente.",
    },
    // 64' Dernier remplacement
    {
      minute: 64, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Diaby"], isUsap: true,
      description: "Sortie de Mahamadou Diaby. Remplacé par Mattéo Le Corvec.",
    },
    {
      minute: 64, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Le Corvec"], isUsap: true,
      description: "Entrée de Mattéo Le Corvec en remplacement de Diaby.",
    },
    {
      minute: 80, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Levani Botia (Stade Rochelais). Le vétéran (36 ans) aplatit en coin le 4e essai, synonyme de bonus offensif. 29-8.",
    },
    {
      minute: 81, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Nolann Le Garrec (Stade Rochelais) du bord de touche. Score final : 31-8.",
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
    const side = evt.isUsap ? "USAP" : "LR  ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Marcel-Deflandre (La Rochelle) — extérieur");
  console.log("  Arbitre : Adrien Marbot");
  console.log("  Score mi-temps : La Rochelle 7 - USAP 8");
  console.log("  Score final : La Rochelle 31 - USAP 8");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length}`);
  console.log("  Vidéo : https://www.dailymotion.com/video/x9rc8b2");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

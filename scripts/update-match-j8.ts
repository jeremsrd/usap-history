/**
 * Script de mise à jour du match Racing 92 - USAP (J8 Top 14, 26/10/2024)
 * Score final : Racing 92 30 - 23 USAP
 * Mi-temps : Racing 92 24 - 10 USAP
 *
 * Défaite à Paris La Défense Arena. Le Racing domine la 1re mi-temps avec
 * 3 essais transformés (Farrell, Le Garrec, Dayimani) et mène 24-3 après
 * 25 minutes. L'USAP revient en 2e mi-temps grâce aux essais de Montgaillard
 * (37') et Barraque (63'), les pénalités d'Aucagne (68', 78') ramenant
 * le score à 27-23. Pénalité décisive de Le Garrec (80') pour le 30-23.
 * Trois cartons jaunes pour le Racing (Laclayat, Taofifenua, Farrell).
 * Sortie sur blessure de Sobela dès la 9e minute.
 *
 * Sources : espn.com, top14.lnr.fr, allrugby.com, vibrez-rugby.com
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j8.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs8c002v1umrha3ioxqb"; // Match J8 Racing 92 - USAP 2024-2025

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Labouteley", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Bachelier", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Sobela", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Granell", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true },
  { num: 13, lastName: "Baraque", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Joseph", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Aucagne", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
  { num: 19, lastName: "Oviedo", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 20, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 21, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 22, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Brazo", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
];

// IDs des joueurs USAP (récupérés de la base)
const PLAYER_IDS: Record<string, string> = {
  Tetrashvili: "cmmby9ogb00151ucdz3vqd429",
  Montgaillard: "cmmby9op3001b1ucd027i2f17",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Labouteley: "cmmby9pfj001t1ucd75p7hi07",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Bachelier: "cmmby9q1g00281ucdpzfoultm",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Granell: "", // sera créé dynamiquement
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Baraque: "cmmby9sma003z1ucdk53umhd6",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  Aucagne: "cmmby9riq00381ucdzmy4nusa",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Brazo: "cmmby9q5t002b1ucdgw3ikj36",
};

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("=== Mise à jour match Racing 92 - USAP (J8, 26/10/2024) ===\n");

  // ---------------------------------------------------------------
  // 0. Créer le joueur Maxim Granell (si absent)
  // ---------------------------------------------------------------
  console.log("--- Joueur Granell ---");
  let granell = await prisma.player.findFirst({
    where: { lastName: "Granell" },
  });
  if (!granell) {
    const slugBase = slugify("Maxim Granell");
    granell = await prisma.player.create({
      data: {
        firstName: "Maxim",
        lastName: "Granell",
        slug: slugBase,
        position: "AILIER",
        isActive: true,
      },
    });
    granell = await prisma.player.update({
      where: { id: granell.id },
      data: { slug: `${slugBase}-${granell.id}` },
    });
    console.log(`  Créé : ${granell.firstName} ${granell.lastName} (${granell.id})`);
  } else {
    console.log(`  Existe : ${granell.firstName} ${granell.lastName} (${granell.id})`);
  }
  PLAYER_IDS["Granell"] = granell.id;

  // ---------------------------------------------------------------
  // 1. Créer l'arbitre Kévin Bralley (si absent)
  // ---------------------------------------------------------------
  console.log("\n--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: "Bralley" },
  });
  if (!referee) {
    const refSlugBase = slugify("Kévin Bralley");
    referee = await prisma.referee.create({
      data: {
        firstName: "Kévin",
        lastName: "Bralley",
        slug: refSlugBase,
      },
    });
    referee = await prisma.referee.update({
      where: { id: referee.id },
      data: { slug: `${refSlugBase}-${referee.id}` },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 1b. Créer le stade Paris La Défense Arena (si absent)
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Défense" } },
  });
  if (!venue) {
    const venueSlugBase = slugify("Paris La Défense Arena");
    venue = await prisma.venue.create({
      data: {
        name: "Paris La Défense Arena",
        slug: `temp-${Date.now()}`,
        city: "Nanterre",
        capacity: 40000,
      },
    });
    venue = await prisma.venue.update({
      where: { id: venue.id },
      data: { slug: `${venueSlugBase}-${venue.id}` },
    });
    console.log(`  Créé : ${venue.name} (${venue.id})`);
  } else {
    console.log(`  Existe : ${venue.name} (${venue.id})`);
  }

  // ---------------------------------------------------------------
  // 2. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (Racing 92 - USAP) :
   *  3' Pénalité Le Garrec (R92) → 3-0
   *  6' Essai Farrell (R92) → 8-0
   *  7' Transfo Le Garrec (R92) → 10-0
   * 12' Pénalité Aucagne (USAP) → 10-3
   * 17' Essai Le Garrec (R92) → 15-3
   * 17' Transfo Le Garrec (R92) → 17-3
   * 24' Essai Dayimani (R92) → 22-3
   * 25' Transfo Le Garrec (R92) → 24-3
   * 37' Essai Montgaillard (USAP) → 24-8
   * 37' Transfo Allan (USAP) → 24-10
   * MI-TEMPS : Racing 92 24 - 10 USAP
   * 50' Pénalité Le Garrec (R92) → 27-10
   * 57' Carton jaune Laclayat (R92)
   * 60' Carton jaune Taofifenua (R92)
   * 63' Essai Barraque (USAP) → 27-15
   * 64' Transfo Allan (USAP) → 27-17
   * 68' Pénalité Aucagne (USAP) → 27-20
   * 78' Carton jaune Farrell (R92)
   * 78' Pénalité Aucagne (USAP) → 27-23
   * 80' Pénalité Le Garrec (R92) → 30-23
   *
   * USAP : 2E + 2T + 3P = 10 + 4 + 9 = 23 points
   * R92 : 3E + 3T + 3P = 15 + 6 + 9 = 30 points
   */
  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      kickoffTime: "16:30",
      refereeId: referee.id,
      venueId: venue.id,
      attendance: 17000,
      halfTimeUsap: 10,
      halfTimeOpponent: 24,
      // Détail scoring USAP
      triesUsap: 2,
      conversionsUsap: 2,
      penaltiesUsap: 3,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Racing 92
      triesOpponent: 3,
      conversionsOpponent: 3,
      penaltiesOpponent: 3,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: true,
      // Rapport
      report:
        "Défaite à Paris La Défense Arena (23-30). Le Racing domine la 1re période avec " +
        "trois essais transformés (Farrell 6', Le Garrec 17', Dayimani 24') pour mener 24-3. " +
        "Pénalité d'Aucagne (12') et essai de Montgaillard juste avant la mi-temps (37') " +
        "ramènent l'USAP à 24-10. En 2e mi-temps, l'USAP revient dans le match grâce à l'essai " +
        "de Barraque (63') et aux pénalités d'Aucagne (68', 78') pour coller à 27-23. " +
        "Trois cartons jaunes pour le Racing (Laclayat 57', Taofifenua 60', Farrell 78'). " +
        "Pénalité décisive de Le Garrec à la 80e pour sceller le score 30-23. " +
        "Sortie sur blessure de Sobela dès la 9e minute, remplacé par Velarte. Point de bonus défensif.",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, stade, rapport)");

  // ---------------------------------------------------------------
  // 3. Composition USAP (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID, isOpponent: false },
  });
  console.log(`  ${deleted.count} entrée(s) USAP supprimée(s)`);

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
    if (p.lastName === "Montgaillard") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Baraque") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Allan") {
      conversions = 2;
      totalPoints = 2 * 2; // 4
    } else if (p.lastName === "Aucagne") {
      penalties = 3;
      totalPoints = 3 * 3; // 9
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: MATCH_ID,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: false,
        positionPlayed: p.position,
        tries,
        conversions,
        penalties,
        totalPoints,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${pts}`);
  }

  // ---------------------------------------------------------------
  // 4. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: MATCH_ID },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events = [
    // === 1re mi-temps ===
    {
      minute: 3, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Nolann Le Garrec (Racing 92). 3-0.",
    },
    {
      minute: 6, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai d'Owen Farrell (Racing 92). 8-0.",
    },
    {
      minute: 7, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Nolann Le Garrec (Racing 92). 10-0.",
    },
    // 9' Blessure Sobela → Velarte
    {
      minute: 9, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Sobela"], isUsap: true,
      description: "Sortie de Patrick Sobela (blessure). Remplacé par Lucas Velarte.",
    },
    {
      minute: 9, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Entrée de Lucas Velarte en remplacement de Sobela (blessure).",
    },
    {
      minute: 12, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. 10-3.",
    },
    {
      minute: 17, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Nolann Le Garrec (Racing 92). 15-3.",
    },
    {
      minute: 17, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Nolann Le Garrec (Racing 92). 17-3.",
    },
    {
      minute: 24, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Hacjivah Dayimani (Racing 92). 22-3.",
    },
    {
      minute: 25, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Nolann Le Garrec (Racing 92). 24-3.",
    },
    {
      minute: 37, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Montgaillard"], isUsap: true,
      description: "Essai de Victor Montgaillard ! L'USAP revient avant la pause. 24-8.",
    },
    {
      minute: 37, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. 24-10. Mi-temps.",
    },
    // === 2e mi-temps ===
    // 41' Remplacements
    {
      minute: 41, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Tetrashvili"], isUsap: true,
      description: "Sortie de Giorgi Tetrashvili. Remplacé par Giorgi Beria.",
    },
    {
      minute: 41, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Beria"], isUsap: true,
      description: "Entrée de Giorgi Beria en remplacement de Tetrashvili.",
    },
    {
      minute: 41, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Joseph"], isUsap: true,
      description: "Sortie de Jefferson-Lee Joseph. Remplacé par Jerónimo de la Fuente.",
    },
    {
      minute: 41, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["De La Fuente"], isUsap: true,
      description: "Entrée de Jerónimo de la Fuente en remplacement de Joseph.",
    },
    // 47' Vague de remplacements
    {
      minute: 47, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Ecochard"], isUsap: true,
      description: "Sortie de Tom Ecochard. Remplacé par James Hall.",
    },
    {
      minute: 47, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Hall"], isUsap: true,
      description: "Entrée de James Hall en remplacement d'Ecochard.",
    },
    {
      minute: 47, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Bachelier"], isUsap: true,
      description: "Sortie de Lucas Bachelier. Remplacé par Alan Brazo.",
    },
    {
      minute: 47, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Brazo"], isUsap: true,
      description: "Entrée d'Alan Brazo en remplacement de Bachelier.",
    },
    {
      minute: 47, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Labouteley"], isUsap: true,
      description: "Sortie de Tristan Labouteley. Remplacé par Joaquín Oviedo.",
    },
    {
      minute: 47, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Oviedo"], isUsap: true,
      description: "Entrée de Joaquín Oviedo en remplacement de Labouteley.",
    },
    {
      minute: 47, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Sortie de Kieran Brookes. Remplacé par Pietro Ceccarelli.",
    },
    {
      minute: 47, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes.",
    },
    {
      minute: 50, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Nolann Le Garrec (Racing 92). 27-10.",
    },
    // Cartons jaunes Racing
    {
      minute: 57, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton jaune pour Thomas Laclayat (Racing 92).",
    },
    {
      minute: 60, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton jaune pour Romain Taofifenua (Racing 92).",
    },
    {
      minute: 63, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Baraque"], isUsap: true,
      description: "Essai de Jean-Pascal Barraque ! L'USAP revient dans le match. 27-15.",
    },
    {
      minute: 64, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. 27-17.",
    },
    {
      minute: 68, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. 27-20.",
    },
    // 74' Labouteley revient
    {
      minute: 74, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Warion"], isUsap: true,
      description: "Sortie d'Adrien Warion. Remplacé par Tristan Labouteley.",
    },
    {
      minute: 74, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Labouteley"], isUsap: true,
      description: "Retour de Tristan Labouteley en remplacement de Warion.",
    },
    {
      minute: 78, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton jaune pour Owen Farrell (Racing 92). Geste d'humeur.",
    },
    {
      minute: 78, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. 27-23. L'USAP revient à 4 points !",
    },
    {
      minute: 80, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Nolann Le Garrec (Racing 92). Score final 30-23.",
    },
  ];

  for (const evt of events) {
    await prisma.matchEvent.create({
      data: {
        matchId: MATCH_ID,
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
  // 5. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  /**
   * Minutes jouées :
   * - Tetrashvili : 41' (titulaire, sort 41')
   * - Montgaillard : 80' (titulaire, joue tout le match)
   * - Brookes : 47' (titulaire, sort 47')
   * - Labouteley : 47' + 6' = 53' (titulaire sort 47', revient 74')
   * - Warion : 74' (titulaire, sort 74')
   * - Bachelier : 47' (titulaire, sort 47')
   * - Sobela : 9' (titulaire, blessé sort 9')
   * - Fa'aso'o : 80' (titulaire, joue tout le match)
   * - Ecochard : 47' (titulaire, sort 47')
   * - Allan : 80' (titulaire, joue tout le match)
   * - Granell : 80' (titulaire, joue tout le match)
   * - Buliruarua : 80' (titulaire, joue tout le match)
   * - Baraque : 80' (titulaire, joue tout le match)
   * - Joseph : 41' (titulaire, sort 41')
   * - Aucagne : 80' (titulaire, joue tout le match)
   * - Ruiz : 0' (remplaçant, non utilisé)
   * - Beria : 39' (entre 41', joue jusqu'à 80')
   * - Ceccarelli : 33' (entre 47', joue jusqu'à 80')
   * - Oviedo : 33' (entre 47', joue jusqu'à 80')
   * - Velarte : 71' (entre 9', joue jusqu'à 80')
   * - Hall : 33' (entre 47', joue jusqu'à 80')
   * - De La Fuente : 39' (entre 41', joue jusqu'à 80')
   * - Brazo : 33' (entre 47', joue jusqu'à 80')
   */
  const minutesPlayed: Record<string, number> = {
    Tetrashvili: 41,
    Montgaillard: 80,
    Brookes: 47,
    Labouteley: 53, // 47' titulaire + 6' (74'-80')
    Warion: 74,
    Bachelier: 47,
    Sobela: 9,
    "Fa'aso'o": 80,
    Ecochard: 47,
    Allan: 80,
    Granell: 80,
    Buliruarua: 80,
    Baraque: 80,
    Joseph: 41,
    Aucagne: 80,
    Ruiz: 0,
    Beria: 39,
    Ceccarelli: 33,
    Oviedo: 33,
    Velarte: 71,
    Hall: 33,
    "De La Fuente": 39,
    Brazo: 33,
  };

  for (const [lastName, minutes] of Object.entries(minutesPlayed)) {
    const playerId = PLAYER_IDS[lastName];
    if (!playerId) continue;
    await prisma.matchPlayer.updateMany({
      where: { matchId: MATCH_ID, playerId, isOpponent: false },
      data: { minutesPlayed: minutes },
    });
    console.log(`  ${lastName}: ${minutes}'`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Paris La Défense Arena (Nanterre) — extérieur");
  console.log("  Arbitre : Kévin Bralley");
  console.log("  Score mi-temps : Racing 92 24 - USAP 10");
  console.log("  Score final : Racing 92 30 - USAP 23");
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

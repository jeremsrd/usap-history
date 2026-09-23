/**
 * Script d'ajout du match USAP - Lyon OU (Top 14, 21/03/2026)
 * Score final : USAP 28 - Lyon OU 32
 * Mi-temps : 13-13
 *
 * Défaite à domicile (Aimé-Giral). 13 426 spectateurs.
 * Arbitre : Jérémy Rozier (Île-de-France).
 *
 * Pour l'USAP : 3 essais Hall (37'), Mascarenc (49'), Ruiz (60'),
 *   2 transformations Urdapilleta (38', 50'),
 *   3 pénalités Urdapilleta (13', 65'), Tedder (40+1').
 *
 * Pour Lyon : 4 essais S. Simmonds (20'), Lorre (62'), Chat (66'), Cretin (74'),
 *   3 transformations Berdeu (21'), Méliande (67', 75'),
 *   2 pénalités Lorre (6'), Berdeu (31').
 *
 * Carton jaune : S. Simmonds (Lyon, 47').
 *
 * Évolution du score : 0-3, 3-3, 3-10, 3-13, 10-13, 13-13 ;
 *   20-13, 25-13, 25-18, 25-25, 28-25, 28-32.
 *
 * USAP : 3E + 2T + 3P = 15 + 4 + 9 = 28 points
 * Lyon : 4E + 3T + 2P = 20 + 6 + 6 = 32 points
 *
 * Bonus offensif USAP : non (3 essais < 4)
 * Bonus défensif USAP : oui (défaite de 4 points ≤ 7)
 *
 * Exécution : npx tsx scripts/add-match-usap-lyon-21-03-2026.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

// =============================================
// CONFIGURATION — modifier la journée si besoin
// =============================================
const MATCHDAY: number | null = 19;

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// === COMPOSITION USAP ===
const USAP_SQUAD: {
  num: number;
  firstName: string;
  lastName: string;
  position: Position;
  isStarter: boolean;
  isCaptain?: boolean;
  tries?: number;
  conversions?: number;
  penalties?: number;
  totalPoints?: number;
}[] = [
  // Titulaires (du 1 au 15)
  { num: 1, firstName: "", lastName: "Devaux", position: "PILIER_GAUCHE", isStarter: true },
  { num: 2, firstName: "", lastName: "Malolo", position: "TALONNEUR", isStarter: true },
  { num: 3, firstName: "Kieran", lastName: "Brookes", position: "PILIER_DROIT", isStarter: true },
  { num: 4, firstName: "Posolo", lastName: "Tuilagi", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 5, firstName: "", lastName: "Yato", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 6, firstName: "", lastName: "Van Tonder", position: "TROISIEME_LIGNE_AILE", isStarter: true },
  { num: 7, firstName: "Lucas", lastName: "Velarte", position: "TROISIEME_LIGNE_AILE", isStarter: true, isCaptain: true },
  { num: 8, firstName: "", lastName: "Hicks", position: "NUMERO_HUIT", isStarter: true },
  { num: 9, firstName: "", lastName: "Hall", position: "DEMI_DE_MELEE", isStarter: true, tries: 1, totalPoints: 5 },
  { num: 10, firstName: "Joaquín", lastName: "Urdapilleta", position: "DEMI_OUVERTURE", isStarter: true, conversions: 2, penalties: 2, totalPoints: 10 },
  { num: 11, firstName: "", lastName: "Petaia", position: "AILIER", isStarter: true },
  { num: 12, firstName: "", lastName: "Mascarenc", position: "CENTRE", isStarter: true, tries: 1, totalPoints: 5 },
  { num: 13, firstName: "", lastName: "Duguivalu", position: "CENTRE", isStarter: true },
  { num: 14, firstName: "", lastName: "Joseph", position: "AILIER", isStarter: true },
  { num: 15, firstName: "", lastName: "Tedder", position: "ARRIERE", isStarter: true, penalties: 1, totalPoints: 3 },
  // Remplaçants
  { num: 16, firstName: "", lastName: "Ruiz", position: "TALONNEUR", isStarter: false, tries: 1, totalPoints: 5 },
  { num: 17, firstName: "Giorgi", lastName: "Tetrashvili", position: "PILIER_GAUCHE", isStarter: false },
  { num: 18, firstName: "Pietro", lastName: "Ceccarelli", position: "PILIER_DROIT", isStarter: false },
  { num: 19, firstName: "Adrien", lastName: "Warion", position: "DEUXIEME_LIGNE", isStarter: false },
  { num: 20, firstName: "", lastName: "Buliruarua", position: "CENTRE", isStarter: false },
  { num: 21, firstName: "Joaquín", lastName: "Oviedo", position: "TROISIEME_LIGNE_AILE", isStarter: false },
  { num: 22, firstName: "Tom", lastName: "Ecochard", position: "DEMI_DE_MELEE", isStarter: false },
  { num: 23, firstName: "", lastName: "Reus", position: "CENTRE", isStarter: false },
];

// === COMPOSITION LYON OU ===
const LYON_SQUAD: {
  num: number;
  firstName: string;
  lastName: string;
  position: Position;
  isStarter: boolean;
  isCaptain?: boolean;
  tries?: number;
  conversions?: number;
  penalties?: number;
  totalPoints?: number;
  yellowCard?: boolean;
  yellowCardMinute?: number;
}[] = [
  // Titulaires
  { num: 1, firstName: "Joël", lastName: "Rey", position: "PILIER_GAUCHE", isStarter: true },
  { num: 2, firstName: "Guillhem", lastName: "Marchand", position: "TALONNEUR", isStarter: true },
  { num: 3, firstName: "", lastName: "Aptsiauri", position: "PILIER_DROIT", isStarter: true },
  { num: 4, firstName: "", lastName: "Roux", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 5, firstName: "", lastName: "William", position: "DEUXIEME_LIGNE", isStarter: true },
  { num: 6, firstName: "", lastName: "Botha", position: "TROISIEME_LIGNE_AILE", isStarter: true },
  { num: 7, firstName: "Sam", lastName: "Simmonds", position: "TROISIEME_LIGNE_AILE", isStarter: true, isCaptain: true, tries: 1, totalPoints: 5, yellowCard: true, yellowCardMinute: 47 },
  { num: 8, firstName: "", lastName: "Cretin", position: "NUMERO_HUIT", isStarter: true, tries: 1, totalPoints: 5 },
  { num: 9, firstName: "", lastName: "Cassang", position: "DEMI_DE_MELEE", isStarter: true },
  { num: 10, firstName: "Léo", lastName: "Berdeu", position: "DEMI_OUVERTURE", isStarter: true, conversions: 1, penalties: 1, totalPoints: 5 },
  { num: 11, firstName: "Clément", lastName: "Mathiron", position: "AILIER", isStarter: true },
  { num: 12, firstName: "", lastName: "Millet", position: "CENTRE", isStarter: true },
  { num: 13, firstName: "", lastName: "Maraku", position: "CENTRE", isStarter: true },
  { num: 14, firstName: "", lastName: "Wainiqolo", position: "AILIER", isStarter: true },
  { num: 15, firstName: "", lastName: "Lorre", position: "ARRIERE", isStarter: true, tries: 1, penalties: 1, totalPoints: 8 },
  // Remplaçants
  { num: 16, firstName: "Camille", lastName: "Chat", position: "TALONNEUR", isStarter: false, tries: 1, totalPoints: 5 },
  { num: 17, firstName: "", lastName: "Moukoro", position: "PILIER_GAUCHE", isStarter: false },
  { num: 18, firstName: "", lastName: "Gomes Sa", position: "PILIER_DROIT", isStarter: false },
  { num: 19, firstName: "", lastName: "Guillard", position: "DEUXIEME_LIGNE", isStarter: false },
  { num: 20, firstName: "", lastName: "Allen", position: "TROISIEME_LIGNE_AILE", isStarter: false },
  { num: 21, firstName: "", lastName: "Gonzalez", position: "DEMI_DE_MELEE", isStarter: false },
  { num: 22, firstName: "", lastName: "Méliande", position: "DEMI_OUVERTURE", isStarter: false, conversions: 2, totalPoints: 4 },
  { num: 23, firstName: "", lastName: "Parisien", position: "CENTRE", isStarter: false },
  // Botha (2ème entrée) et William (2ème entrée) sont déjà dans les titulaires
];

async function main() {
  console.log("=== Ajout match USAP - Lyon OU (21/03/2026) ===\n");

  // ---------------------------------------------------------------
  // 1. Récupérer la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });
  console.log(`Saison : ${season.label} (${season.id})`);

  // ---------------------------------------------------------------
  // 2. Récupérer la compétition Top 14
  // ---------------------------------------------------------------
  const competition = await prisma.competition.findFirstOrThrow({
    where: { shortName: "Top 14" },
  });
  console.log(`Compétition : ${competition.name} (${competition.id})`);

  // ---------------------------------------------------------------
  // 3. Récupérer ou créer l'adversaire Lyon OU
  // ---------------------------------------------------------------
  let opponent = await prisma.opponent.findFirst({
    where: { name: { contains: "Lyon" } },
  });
  if (!opponent) {
    const france = await prisma.country.findFirst({ where: { code: "FR" } });
    opponent = await prisma.opponent.create({
      data: {
        name: "Lyon OU",
        shortName: "Lyon",
        city: "Lyon",
        slug: "lyon-ou",
        countryId: france?.id ?? null,
      },
    });
    console.log(`Adversaire créé : ${opponent.name} (${opponent.id})`);
  } else {
    console.log(`Adversaire : ${opponent.name} (${opponent.id})`);
  }

  // ---------------------------------------------------------------
  // 4. Récupérer le stade Aimé-Giral
  // ---------------------------------------------------------------
  const venue = await prisma.venue.findFirst({
    where: { name: { contains: "Giral" } },
  });
  console.log(`Stade : ${venue?.name ?? "Non trouvé"} (${venue?.id ?? "N/A"})`);

  // ---------------------------------------------------------------
  // 5. Créer l'arbitre Jérémy Rozier
  // ---------------------------------------------------------------
  let referee = await prisma.referee.findFirst({
    where: { lastName: "Rozier" },
  });
  if (!referee) {
    const refSlugBase = slugify("Jeremy Rozier");
    referee = await prisma.referee.create({
      data: {
        firstName: "Jérémy",
        lastName: "Rozier",
        slug: refSlugBase,
      },
    });
    referee = await prisma.referee.update({
      where: { id: referee.id },
      data: { slug: `${refSlugBase}-${referee.id}` },
    });
    console.log(`Arbitre créé : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  } else {
    console.log(`Arbitre : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 6. Vérifier que le match n'existe pas déjà
  // ---------------------------------------------------------------
  const existingMatch = await prisma.match.findFirst({
    where: {
      seasonId: season.id,
      opponentId: opponent.id,
      date: new Date("2026-03-21"),
    },
  });
  if (existingMatch) {
    console.log(`\n⚠ Match déjà existant (${existingMatch.id}). Suppression des données existantes...`);
    await prisma.matchEvent.deleteMany({ where: { matchId: existingMatch.id } });
    await prisma.matchPlayer.deleteMany({ where: { matchId: existingMatch.id } });
    await prisma.match.delete({ where: { id: existingMatch.id } });
    console.log("  Match supprimé pour recréation.");
  }

  // ---------------------------------------------------------------
  // 7. Générer le slug et créer le match
  // ---------------------------------------------------------------
  const matchDate = new Date("2026-03-21");
  const day = String(matchDate.getUTCDate()).padStart(2, "0");
  const month = String(matchDate.getUTCMonth() + 1).padStart(2, "0");
  const year = matchDate.getUTCFullYear();
  const dateSlug = `${day}-${month}-${year}`;

  const phaseSlug = MATCHDAY ? `j${MATCHDAY}` : "";
  const slug = ["top-14", "usap-vs-lyon", phaseSlug, dateSlug].filter(Boolean).join("-");

  const match = await prisma.match.create({
    data: {
      slug,
      date: matchDate,
      seasonId: season.id,
      competitionId: competition.id,
      matchday: MATCHDAY,
      isHome: true,
      venueId: venue?.id ?? null,
      isNeutralVenue: false,
      opponentId: opponent.id,
      refereeId: referee.id,
      scoreUsap: 28,
      scoreOpponent: 32,
      halfTimeUsap: 13,
      halfTimeOpponent: 13,
      result: "DEFAITE",
      attendance: 13426,
      // Détail scoring USAP
      triesUsap: 3,
      conversionsUsap: 2,
      penaltiesUsap: 3,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Lyon
      triesOpponent: 4,
      conversionsOpponent: 3,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: true,
      // Rapport
      report:
        "Défaite à domicile face à Lyon (28-32). L'USAP mène 25-13 au début du dernier quart " +
        "d'heure mais s'effondre : quatre essais lyonnais dont trois en 12 minutes (Lorre 62', " +
        "Chat 66', Cretin 74'). La pénalité d'Urdapilleta (65') ne suffit pas à enrayer la " +
        "remontée adverse. Score de 13-13 à la mi-temps. 13 426 spectateurs à Aimé-Giral.",
    },
  });
  console.log(`\nMatch créé : ${match.id} (slug: ${match.slug})`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} Lyon OU`);

  // ---------------------------------------------------------------
  // 8. Composition USAP (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  for (const p of USAP_SQUAD) {
    // Chercher le joueur USAP par nom de famille
    let player = await prisma.player.findFirst({
      where: { lastName: p.lastName },
    });

    if (!player && p.firstName) {
      player = await prisma.player.findFirst({
        where: { lastName: p.lastName, firstName: p.firstName },
      });
    }

    if (!player) {
      // Créer le joueur s'il n'existe pas
      const firstName = p.firstName || "?";
      player = await prisma.player.create({
        data: {
          firstName,
          lastName: p.lastName,
          slug: slugify(`${firstName}-${p.lastName}`) + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          position: p.position,
          isActive: true,
        },
      });
      console.log(`  [NEW] ${player.firstName} ${player.lastName} (${player.id})`);
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId: player.id,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
        tries: p.tries ?? 0,
        conversions: p.conversions ?? 0,
        penalties: p.penalties ?? 0,
        dropGoals: 0,
        totalPoints: p.totalPoints ?? 0,
      },
    });

    const marker = p.isStarter ? "TIT" : "REM";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const cap = p.isCaptain ? " (C)" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2)}. ${p.lastName}${cap}${pts}`);
  }

  // Vérification points USAP
  const totalUsap = USAP_SQUAD.reduce((s, p) => s + (p.totalPoints ?? 0), 0);
  console.log(`  Total individuel USAP : ${totalUsap} (attendu : 28)`);

  // ---------------------------------------------------------------
  // 9. Composition Lyon OU (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Composition Lyon OU ---");

  for (const p of LYON_SQUAD) {
    const slug = slugify(`${p.firstName || "x"}-${p.lastName}`);
    let player = await prisma.player.findFirst({
      where: { lastName: p.lastName, firstName: p.firstName },
    });

    if (!player) {
      // Chercher par nom seul si prénom vide
      if (!p.firstName) {
        player = await prisma.player.findFirst({
          where: { lastName: p.lastName },
        });
      }
    }

    if (!player) {
      const firstName = p.firstName || "?";
      player = await prisma.player.create({
        data: {
          firstName,
          lastName: p.lastName,
          slug: slug + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          position: p.position,
          isActive: false,
        },
      });
      console.log(`  [NEW] ${player.firstName} ${player.lastName} (${player.id})`);
    } else {
      console.log(`  [OK]  ${player.firstName} ${player.lastName} (${player.id})`);
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId: player.id,
        isOpponent: true,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
        tries: p.tries ?? 0,
        conversions: p.conversions ?? 0,
        penalties: p.penalties ?? 0,
        dropGoals: 0,
        totalPoints: p.totalPoints ?? 0,
        yellowCard: p.yellowCard ?? false,
        yellowCardMin: p.yellowCardMinute ?? null,
      },
    });

    const marker = p.isStarter ? "TIT" : "REM";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const cap = p.isCaptain ? " (C)" : "";
    const yc = p.yellowCard ? " [CJ]" : "";
    console.log(`       ${marker} ${String(p.num).padStart(2)}. ${p.firstName || "?"} ${p.lastName}${cap}${pts}${yc}`);
  }

  // Vérification points Lyon
  const totalLyon = LYON_SQUAD.reduce((s, p) => s + (p.totalPoints ?? 0), 0);
  console.log(`  Total individuel Lyon : ${totalLyon} (attendu : 32)`);

  // ---------------------------------------------------------------
  // 10. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  // Récupérer les IDs des joueurs USAP par nom
  const usapPlayers = await prisma.matchPlayer.findMany({
    where: { matchId: match.id, isOpponent: false },
    include: { player: true },
  });
  const usapById: Record<string, string> = {};
  for (const mp of usapPlayers) {
    usapById[mp.player.lastName] = mp.playerId;
  }

  // Récupérer les IDs des joueurs Lyon par nom
  const lyonPlayers = await prisma.matchPlayer.findMany({
    where: { matchId: match.id, isOpponent: true },
    include: { player: true },
  });
  const lyonById: Record<string, string> = {};
  for (const mp of lyonPlayers) {
    lyonById[mp.player.lastName] = mp.playerId;
  }

  const events = [
    // === 1ère mi-temps ===
    // 6' Pénalité Lorre (Lyon) → 0-3
    { minute: 6, type: "PENALITE" as const, playerId: lyonById["Lorre"], isUsap: false,
      description: "Pénalité de Lorre (Lyon). 0-3." },
    // 13' Pénalité Urdapilleta (USAP) → 3-3
    { minute: 13, type: "PENALITE" as const, playerId: usapById["Urdapilleta"], isUsap: true,
      description: "Pénalité d'Urdapilleta. 3-3." },
    // 20' Essai S. Simmonds (Lyon) → 3-8
    { minute: 20, type: "ESSAI" as const, playerId: lyonById["Simmonds"], isUsap: false,
      description: "Essai de Sam Simmonds (Lyon). 3-8." },
    // 21' Transformation Berdeu (Lyon) → 3-10
    { minute: 21, type: "TRANSFORMATION" as const, playerId: lyonById["Berdeu"], isUsap: false,
      description: "Transformation de Berdeu (Lyon). 3-10." },
    // 31' Pénalité Berdeu (Lyon) → 3-13
    { minute: 31, type: "PENALITE" as const, playerId: lyonById["Berdeu"], isUsap: false,
      description: "Pénalité de Berdeu (Lyon). 3-13." },
    // 37' Essai Hall (USAP) → 8-13
    { minute: 37, type: "ESSAI" as const, playerId: usapById["Hall"], isUsap: true,
      description: "Essai de Hall. 8-13." },
    // 38' Transformation Urdapilleta (USAP) → 10-13
    { minute: 38, type: "TRANSFORMATION" as const, playerId: usapById["Urdapilleta"], isUsap: true,
      description: "Transformation d'Urdapilleta. 10-13." },
    // 40+1 Pénalité Tedder (USAP) → 13-13
    { minute: 41, type: "PENALITE" as const, playerId: usapById["Tedder"], isUsap: true,
      description: "Pénalité de Tedder (40+1'). 13-13. Mi-temps." },

    // === Remplacements USAP 5' ===
    { minute: 5, type: "REMPLACEMENT_SORTIE" as const, playerId: usapById["Duguivalu"], isUsap: true,
      description: "Sortie de Duguivalu. Remplacé par Buliruarua." },
    { minute: 5, type: "REMPLACEMENT_ENTREE" as const, playerId: usapById["Buliruarua"], isUsap: true,
      description: "Entrée de Buliruarua en remplacement de Duguivalu." },

    // === Remplacements Lyon 45' ===
    { minute: 45, type: "REMPLACEMENT_SORTIE" as const, playerId: lyonById["Rey"], isUsap: false,
      description: "Sortie de J. Rey (Lyon). Remplacé par Moukoro." },
    { minute: 45, type: "REMPLACEMENT_ENTREE" as const, playerId: lyonById["Moukoro"], isUsap: false,
      description: "Entrée de Moukoro (Lyon)." },
    { minute: 45, type: "REMPLACEMENT_SORTIE" as const, playerId: lyonById["Marchand"], isUsap: false,
      description: "Sortie de G. Marchand (Lyon). Remplacé par Chat." },
    { minute: 45, type: "REMPLACEMENT_ENTREE" as const, playerId: lyonById["Chat"], isUsap: false,
      description: "Entrée de Chat (Lyon)." },
    { minute: 45, type: "REMPLACEMENT_SORTIE" as const, playerId: lyonById["Roux"], isUsap: false,
      description: "Sortie de Roux (Lyon). Remplacé par Guillard." },
    { minute: 45, type: "REMPLACEMENT_ENTREE" as const, playerId: lyonById["Guillard"], isUsap: false,
      description: "Entrée de Guillard (Lyon)." },
    { minute: 45, type: "REMPLACEMENT_SORTIE" as const, playerId: lyonById["Botha"], isUsap: false,
      description: "Sortie de Botha (Lyon). Remplacé par Allen." },
    { minute: 45, type: "REMPLACEMENT_ENTREE" as const, playerId: lyonById["Allen"], isUsap: false,
      description: "Entrée de Allen (Lyon)." },
    { minute: 45, type: "REMPLACEMENT_SORTIE" as const, playerId: lyonById["Cassang"], isUsap: false,
      description: "Sortie de Cassang (Lyon). Remplacé par Gonzalez." },
    { minute: 45, type: "REMPLACEMENT_ENTREE" as const, playerId: lyonById["Gonzalez"], isUsap: false,
      description: "Entrée de Gonzalez (Lyon)." },

    // === Carton jaune S. Simmonds 47' ===
    { minute: 47, type: "CARTON_JAUNE" as const, playerId: lyonById["Simmonds"], isUsap: false,
      description: "Carton jaune pour S. Simmonds (Lyon, cap.)." },

    // === Remplacements USAP 47' (gros bloc) ===
    { minute: 47, type: "REMPLACEMENT_SORTIE" as const, playerId: usapById["Devaux"], isUsap: true,
      description: "Sortie de Devaux. Remplacé par Tetrashvili." },
    { minute: 47, type: "REMPLACEMENT_ENTREE" as const, playerId: usapById["Tetrashvili"], isUsap: true,
      description: "Entrée de Tetrashvili." },
    { minute: 47, type: "REMPLACEMENT_SORTIE" as const, playerId: usapById["Malolo"], isUsap: true,
      description: "Sortie de Malolo. Remplacé par Ruiz." },
    { minute: 47, type: "REMPLACEMENT_ENTREE" as const, playerId: usapById["Ruiz"], isUsap: true,
      description: "Entrée de Ruiz." },
    { minute: 47, type: "REMPLACEMENT_SORTIE" as const, playerId: usapById["Brookes"], isUsap: true,
      description: "Sortie de Brookes. Remplacé par Ceccarelli." },
    { minute: 47, type: "REMPLACEMENT_ENTREE" as const, playerId: usapById["Ceccarelli"], isUsap: true,
      description: "Entrée de Ceccarelli." },
    { minute: 47, type: "REMPLACEMENT_SORTIE" as const, playerId: usapById["Tuilagi"], isUsap: true,
      description: "Sortie de Tuilagi. Remplacé par Warion." },
    { minute: 47, type: "REMPLACEMENT_ENTREE" as const, playerId: usapById["Warion"], isUsap: true,
      description: "Entrée de Warion." },
    { minute: 47, type: "REMPLACEMENT_SORTIE" as const, playerId: usapById["Velarte"], isUsap: true,
      description: "Sortie de Velarte (cap.). Remplacé par Oviedo." },
    { minute: 47, type: "REMPLACEMENT_ENTREE" as const, playerId: usapById["Oviedo"], isUsap: true,
      description: "Entrée d'Oviedo." },

    // === 2ème mi-temps scoring ===
    // 49' Essai Mascarenc (USAP) → 18-13
    { minute: 49, type: "ESSAI" as const, playerId: usapById["Mascarenc"], isUsap: true,
      description: "Essai de Mascarenc. 18-13." },
    // 50' Transformation Urdapilleta (USAP) → 20-13
    { minute: 50, type: "TRANSFORMATION" as const, playerId: usapById["Urdapilleta"], isUsap: true,
      description: "Transformation d'Urdapilleta. 20-13." },

    // === Remplacement Lyon 54' ===
    { minute: 54, type: "REMPLACEMENT_SORTIE" as const, playerId: lyonById["Maraku"], isUsap: false,
      description: "Sortie de Maraku (Lyon). Remplacé par Parisien." },
    { minute: 54, type: "REMPLACEMENT_ENTREE" as const, playerId: lyonById["Parisien"], isUsap: false,
      description: "Entrée de Parisien (Lyon)." },
    { minute: 54, type: "REMPLACEMENT_SORTIE" as const, playerId: lyonById["William"], isUsap: false,
      description: "Sortie de William (Lyon). Remplacé par Botha (changement de poste)." },

    // === Remplacement Lyon 59' ===
    { minute: 59, type: "REMPLACEMENT_SORTIE" as const, playerId: lyonById["Berdeu"], isUsap: false,
      description: "Sortie de Berdeu (Lyon). Remplacé par Méliande." },
    { minute: 59, type: "REMPLACEMENT_ENTREE" as const, playerId: lyonById["Méliande"], isUsap: false,
      description: "Entrée de Méliande (Lyon)." },

    // === Remplacements USAP 60' ===
    { minute: 60, type: "REMPLACEMENT_SORTIE" as const, playerId: usapById["Hall"], isUsap: true,
      description: "Sortie de Hall. Remplacé par Ecochard." },
    { minute: 60, type: "REMPLACEMENT_ENTREE" as const, playerId: usapById["Ecochard"], isUsap: true,
      description: "Entrée d'Ecochard." },

    // 60' Essai Ruiz (USAP) → 25-13
    { minute: 60, type: "ESSAI" as const, playerId: usapById["Ruiz"], isUsap: true,
      description: "Essai de Ruiz. 25-13." },

    // === Remplacement Lyon 60' ===
    { minute: 60, type: "REMPLACEMENT_SORTIE" as const, playerId: lyonById["Aptsiauri"], isUsap: false,
      description: "Sortie d'Aptsiauri (Lyon). Remplacé par Gomes Sa." },
    { minute: 60, type: "REMPLACEMENT_ENTREE" as const, playerId: lyonById["Gomes Sa"], isUsap: false,
      description: "Entrée de Gomes Sa (Lyon)." },

    // 62' Essai Lorre (Lyon) → 25-18
    { minute: 62, type: "ESSAI" as const, playerId: lyonById["Lorre"], isUsap: false,
      description: "Essai de Lorre (Lyon). 25-18." },

    // 65' Pénalité Urdapilleta (USAP) → 28-18
    { minute: 65, type: "PENALITE" as const, playerId: usapById["Urdapilleta"], isUsap: true,
      description: "Pénalité d'Urdapilleta. 28-18." },

    // === Remplacement USAP 65' ===
    { minute: 65, type: "REMPLACEMENT_SORTIE" as const, playerId: usapById["Mascarenc"], isUsap: true,
      description: "Sortie de Mascarenc. Remplacé par Reus." },
    { minute: 65, type: "REMPLACEMENT_ENTREE" as const, playerId: usapById["Reus"], isUsap: true,
      description: "Entrée de Reus." },

    // 66' Essai Chat (Lyon) → 28-23
    { minute: 66, type: "ESSAI" as const, playerId: lyonById["Chat"], isUsap: false,
      description: "Essai de Chat (Lyon). 28-23." },

    // === Remplacement Lyon 66' (Millet → Maraku retour) ===
    { minute: 66, type: "REMPLACEMENT_SORTIE" as const, playerId: lyonById["Millet"], isUsap: false,
      description: "Sortie de Millet (Lyon). Remplacé par Maraku (retour HIA)." },

    // 67' Transformation Méliande (Lyon) → 28-25
    { minute: 67, type: "TRANSFORMATION" as const, playerId: lyonById["Méliande"], isUsap: false,
      description: "Transformation de Méliande (Lyon). 28-25." },

    // === Remplacement USAP 67' (Yato → Tuilagi retour) ===
    { minute: 67, type: "REMPLACEMENT_SORTIE" as const, playerId: usapById["Yato"], isUsap: true,
      description: "Sortie de Yato. Tuilagi revient sur le terrain." },

    // 74' Essai Cretin (Lyon) → 28-30
    { minute: 74, type: "ESSAI" as const, playerId: lyonById["Cretin"], isUsap: false,
      description: "Essai de Cretin (Lyon). 28-30." },
    // 75' Transformation Méliande (Lyon) → 28-32
    { minute: 75, type: "TRANSFORMATION" as const, playerId: lyonById["Méliande"], isUsap: false,
      description: "Transformation de Méliande (Lyon). 28-32. Score final." },

    // === Remplacement Lyon 79' ===
    { minute: 79, type: "REMPLACEMENT_SORTIE" as const, playerId: lyonById["Guillard"], isUsap: false,
      description: "Sortie de Guillard (Lyon). Remplacé par William (retour)." },
  ];

  for (const evt of events) {
    if (!evt.playerId) {
      console.log(`  ⚠ Joueur non trouvé pour événement ${evt.minute}' ${evt.type} - ${evt.description}`);
    }
    await prisma.matchEvent.create({
      data: {
        matchId: match.id,
        minute: evt.minute,
        type: evt.type,
        playerId: evt.playerId ?? null,
        isUsap: evt.isUsap,
        description: evt.description,
      },
    });
    const side = evt.isUsap ? "USAP" : "LYON";
    console.log(`  ${String(evt.minute).padStart(2)}' [${side}] ${evt.type}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Résumé ===");
  console.log(`  Match : ${match.id}`);
  console.log(`  Slug  : ${match.slug}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} Lyon OU`);
  console.log(`  Mi-temps : ${match.halfTimeUsap} - ${match.halfTimeOpponent}`);
  console.log(`  Stade : Aimé-Giral — 13 426 spectateurs`);
  console.log(`  Arbitre : Jérémy Rozier`);
  console.log(`  Bonus : offensif=non, défensif=oui`);
  console.log(`  Joueurs USAP : ${USAP_SQUAD.length}`);
  console.log(`  Joueurs Lyon : ${LYON_SQUAD.length}`);
  console.log(`  Événements : ${events.length}`);
  console.log("\n=== Terminé ===");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

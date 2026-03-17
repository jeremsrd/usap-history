/**
 * Script de mise à jour du match USAP - Dragons RFC (J1 Challenge Cup, 07/12/2025)
 * Score final : USAP 41 - Dragons 17
 * Mi-temps : USAP 17 - Dragons 0
 *
 * Première victoire de la saison pour l'USAP ! Les Catalans dominent les
 * Dragons gallois grâce à 6 réalisations (5 essais + 1 essai de pénalité).
 * Hall ouvre le score, Kretchmann assure au pied (3T + 1P = 9 pts), Diaby
 * complète avant la pause (17-0). Malgré le carton rouge de Paia'aua pour
 * plaquage haut, l'USAP continue à marquer en 2e mi-temps : Joseph, Chinarro,
 * essai de pénalité (carton jaune Ben Carter), Le Corvec.
 * Affluence : 6215 spectateurs.
 * Arbitre : Federico Vedovelli (Italie)
 *
 * Sources : epcrugby.com, francebleu.fr, vibrez-rugby.com, allrugby.com
 *
 * Exécution : npx tsx scripts/update-match-challenge-j1-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match USAP - Dragons (J1 Challenge Cup, 07/12/2025) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      round: "Poule J1",
      competition: { shortName: "Challenge Européen" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — ${match.round} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Federico Vedovelli
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Vedovelli", mode: "insensitive" } },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Federico",
        lastName: "Vedovelli",
        slug: "federico-vedovelli",
      },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName}`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 1b. Stade : Aimé-Giral (domicile)
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  const venue = await prisma.venue.findFirst({
    where: { name: { contains: "Aimé-Giral", mode: "insensitive" } },
  });
  if (!venue) throw new Error("Stade Aimé-Giral non trouvé en base");
  console.log(`  Existe : ${venue.name} (${venue.id})`);

  // ---------------------------------------------------------------
  // 2. Résolution des joueurs USAP
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
    if (!player) throw new Error(`Joueur non trouvé : ${firstName || ""} ${lastName}`);
    return player.id;
  }

  async function findOrCreatePlayer(firstName: string, lastName: string, position: Position): Promise<string> {
    let player = await prisma.player.findFirst({
      where: { lastName: { equals: lastName, mode: "insensitive" } },
    });
    if (!player) {
      const slug = `${firstName}-${lastName}`
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
        + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      player = await prisma.player.create({
        data: { firstName, lastName, slug, position, isActive: true },
      });
      console.log(`  [NEW] ${firstName} ${lastName}`);
    }
    return player.id;
  }

  const PLAYER_IDS: Record<string, string> = {};

  // Joueurs existants
  const existing = [
    "Tetrashvili", "Malolo", "Roelofse", "Le Corvec", "Chinarro",
    "Diaby", "Ritchie", "Hall", "Joseph", "Duguivalu",
    "Montgaillard", "Devaux", "Fakatika", "Van Tonder", "Poulet",
  ];
  for (const name of existing) {
    try {
      if (name === "Van Tonder") {
        PLAYER_IDS[name] = await findPlayer(name, "Jacobus");
      } else {
        PLAYER_IDS[name] = await findPlayer(name);
      }
      console.log(`  ✓ ${name}`);
    } catch {
      console.log(`  ✗ ${name} — NON TROUVÉ`);
    }
  }

  // Joueurs potentiellement nouveaux
  PLAYER_IDS["Dvali"] = await findOrCreatePlayer("Lasha", "Dvali", "DEUXIEME_LIGNE");
  PLAYER_IDS["Kretchmann"] = await findOrCreatePlayer("Gabin", "Kretchmann", "DEMI_OUVERTURE");
  PLAYER_IDS["Paia'aua"] = await findOrCreatePlayer("Duncan", "Paia'aua", "CENTRE");
  PLAYER_IDS["Veredamu"] = await findOrCreatePlayer("Tavite", "Veredamu", "AILIER");
  PLAYER_IDS["Petaia"] = await findOrCreatePlayer("Jordan", "Petaia", "ARRIERE");
  PLAYER_IDS["Lagvilava"] = await findOrCreatePlayer("Davit", "Lagvilava", "DEUXIEME_LIGNE");
  PLAYER_IDS["Aprasidze"] = await findOrCreatePlayer("Gela", "Aprasidze", "DEMI_DE_MELEE");
  PLAYER_IDS["Fahy"] = await findOrCreatePlayer("Mercer", "Fahy", "AILIER");

  // ---------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (USAP - Dragons) :
   *  8' Essai Hall (USAP) + Transfo Kretchmann → 7-0
   * 20' Pénalité Kretchmann (USAP) → 10-0
   * 30' Essai Diaby (USAP) + Transfo Kretchmann → 17-0
   * 35' Carton rouge Paia'aua (USAP) — USAP à 14
   * MI-TEMPS : USAP 17 - Dragons 0
   * 45' Essai Joseph (USAP) + Transfo Kretchmann → 24-0
   * 50' Essai Westwood (Dragons) + Transfo O'Brien → 24-7
   * 55' Essai Chinarro (USAP), non transformé → 29-7
   * 60' CJ Carter (Dragons) + Essai de pénalité USAP → 36-7
   * 65' Essai Austin (Dragons), non transformé → 36-12
   * 70' Essai Le Corvec (USAP), non transformé → 41-12
   * 75' Essai Austin (Dragons), non transformé → 41-17
   *
   * USAP : 5E + 1EP + 3T + 1P = 25 + 7 + 6 + 3 = 41 points
   * Dragons : 3E + 1T = 15 + 2 = 17 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "14:00",
      refereeId: referee.id,
      venueId: venue.id,
      attendance: 6215,
      halfTimeUsap: 17,
      halfTimeOpponent: 0,
      // Détail scoring USAP
      triesUsap: 5,
      conversionsUsap: 3,
      penaltiesUsap: 1,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 1,
      // Détail scoring Dragons
      triesOpponent: 3,
      conversionsOpponent: 1,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: true,
      bonusDefensif: false,
      // Rapport
      report:
        "Première victoire de la saison pour l'USAP ! À Aimé-Giral, les Catalans dominent les " +
        "Dragons gallois 41-17 en ouverture de la Challenge Cup, devant 6215 spectateurs. " +
        "Hall ouvre le score rapidement (8'), Kretchmann assure au pied (1P + 3T = 9 pts), " +
        "puis Diaby enfonce le clou avant la pause (17-0). L'USAP doit jouer à 14 après le " +
        "carton rouge de Paia'aua pour plaquage haut sur Scarfe (35'), mais ne relâche pas " +
        "la pression. Joseph (45'), Chinarro (55') et un essai de pénalité après carton jaune " +
        "de Ben Carter (60') portent le score à 36-7. Les Dragons sauvent l'honneur par " +
        "Westwood (50') et un doublé d'Austin (65', 75'). Le Corvec complète la victoire (70'). " +
        "Un succès capital pour le moral après 11 défaites consécutives en Top 14.",
    },
  });
  console.log("  Match mis à jour");

  // ---------------------------------------------------------------
  // 4. Composition USAP (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: match.id, isOpponent: false },
  });
  console.log(`  ${deleted.count} entrée(s) USAP supprimée(s)`);

  const USAP_SQUAD = [
    // Titulaires
    { num: 1, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: true, minutesPlayed: 56 },
    { num: 2, lastName: "Malolo", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 56 },
    { num: 3, lastName: "Roelofse", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 56 },
    { num: 4, lastName: "Le Corvec", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80,
      tries: 1, totalPoints: 5 }, // Essai ~70'
    { num: 5, lastName: "Chinarro", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80,
      tries: 1, totalPoints: 5 }, // Essai ~55'
    { num: 6, lastName: "Diaby", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80,
      tries: 1, totalPoints: 5 }, // Essai ~30'
    { num: 7, lastName: "Ritchie", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 8, lastName: "Dvali", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 80 },
    { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 60,
      tries: 1, totalPoints: 5 }, // Essai ~8'
    { num: 10, lastName: "Kretchmann", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 80,
      conversions: 3, penalties: 1, totalPoints: 9 }, // 3T(6) + 1P(3) = 9
    { num: 11, lastName: "Joseph", position: "AILIER" as const, isStarter: true, minutesPlayed: 80,
      tries: 1, totalPoints: 5 }, // Essai ~45'
    { num: 12, lastName: "Paia'aua", position: "CENTRE" as const, isStarter: true, minutesPlayed: 35,
      redCard: true, redCardMin: 35 }, // Carton rouge plaquage haut
    { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 15, lastName: "Petaia", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 24 },        // entré 56'
    { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 24 },          // entré 56'
    { num: 18, lastName: "Fakatika", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 24 },         // entré 56'
    { num: 19, lastName: "Lagvilava", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 0 },       // non entré
    { num: 20, lastName: "Van Tonder", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 0 }, // non entré
    { num: 21, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 20 },       // entré 60'
    { num: 22, lastName: "Poulet", position: "CENTRE" as const, isStarter: false, minutesPlayed: 0 },                  // non entré
    { num: 23, lastName: "Fahy", position: "AILIER" as const, isStarter: false, minutesPlayed: 0 },                    // non entré
  ];

  for (const p of USAP_SQUAD) {
    const playerId = PLAYER_IDS[p.lastName];
    if (!playerId) {
      console.log(`  ⚠ Joueur non trouvé : ${p.lastName}`);
      continue;
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
        tries: (p as { tries?: number }).tries ?? 0,
        conversions: (p as { conversions?: number }).conversions ?? 0,
        penalties: (p as { penalties?: number }).penalties ?? 0,
        dropGoals: 0,
        totalPoints: (p as { totalPoints?: number }).totalPoints ?? 0,
        minutesPlayed: p.minutesPlayed,
        yellowCard: false,
        yellowCardMin: null,
        redCard: (p as { redCard?: boolean }).redCard ?? false,
        redCardMin: (p as { redCardMin?: number }).redCardMin ?? null,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    const pts = (p as { totalPoints?: number }).totalPoints ? ` (${(p as { totalPoints?: number }).totalPoints} pts)` : "";
    const rc = (p as { redCard?: boolean }).redCard ? " 🟥" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${rc} [${p.minutesPlayed}']`);
  }

  // L'essai de pénalité (7 pts) n'est attribué à aucun joueur
  const totalPointsUSAP = USAP_SQUAD.reduce((sum, p) => sum + ((p as { totalPoints?: number }).totalPoints ?? 0), 0);
  const totalWithPT = totalPointsUSAP + 7;
  console.log(`\n  Vérification : total points individuels = ${totalPointsUSAP} + 7 (essai pénalité) = ${totalWithPT} (attendu : 41)`);
  if (totalWithPT !== 41) {
    console.log("  ⚠ ATTENTION : le total ne correspond pas au score final !");
  }

  // ---------------------------------------------------------------
  // 5. Événements du match
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvents = await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events = [
    // === 1re mi-temps ===
    { minute: 8, type: "ESSAI" as const, playerId: PLAYER_IDS["Hall"], isUsap: true,
      description: "Essai de James Hall (USAP). Le demi de mêlée ouvre le score. 5-0." },
    { minute: 8, type: "TRANSFORMATION" as const, playerId: PLAYER_IDS["Kretchmann"], isUsap: true,
      description: "Transformation de Gabin Kretchmann (USAP). 7-0." },
    { minute: 20, type: "PENALITE" as const, playerId: PLAYER_IDS["Kretchmann"], isUsap: true,
      description: "Pénalité de Gabin Kretchmann (USAP). 10-0." },
    { minute: 30, type: "ESSAI" as const, playerId: PLAYER_IDS["Diaby"], isUsap: true,
      description: "Essai de Mahamadou Diaby (USAP). Le capitaine du jour enfonce le clou. 15-0." },
    { minute: 30, type: "TRANSFORMATION" as const, playerId: PLAYER_IDS["Kretchmann"], isUsap: true,
      description: "Transformation de Gabin Kretchmann (USAP). 17-0." },
    { minute: 35, type: "CARTON_ROUGE" as const, playerId: PLAYER_IDS["Paia'aua"], isUsap: true,
      description: "Carton rouge pour Duncan Paia'aua (USAP). Plaquage haut sur Sam Scarfe. USAP à 14." },
    // === MI-TEMPS : USAP 17 - Dragons 0 ===
    { minute: 45, type: "ESSAI" as const, playerId: PLAYER_IDS["Joseph"], isUsap: true,
      description: "Essai de Jefferson Lee Joseph (USAP). Malgré l'infériorité numérique, les Catalans marquent. 22-0." },
    { minute: 45, type: "TRANSFORMATION" as const, playerId: PLAYER_IDS["Kretchmann"], isUsap: true,
      description: "Transformation de Gabin Kretchmann (USAP). 24-0." },
    { minute: 50, type: "ESSAI" as const, playerId: null, isUsap: false,
      description: "Essai de Joe Westwood (Dragons). Les Gallois réagissent enfin. 24-5." },
    { minute: 50, type: "TRANSFORMATION" as const, playerId: null, isUsap: false,
      description: "Transformation d'Angus O'Brien (Dragons). 24-7." },
    { minute: 55, type: "ESSAI" as const, playerId: PLAYER_IDS["Chinarro"], isUsap: true,
      description: "Essai de Bastien Chinarro (USAP). Non transformé. 29-7." },
    { minute: 60, type: "CARTON_JAUNE" as const, playerId: null, isUsap: false,
      description: "Carton jaune pour Ben Carter (Dragons). Jeu déloyal sur la ligne." },
    { minute: 60, type: "ESSAI_PENALITE" as const, playerId: null, isUsap: true,
      description: "Essai de pénalité accordé à l'USAP. 36-7." },
    { minute: 65, type: "ESSAI" as const, playerId: null, isUsap: false,
      description: "Essai de Will Austin (Dragons). Non transformé. 36-12." },
    { minute: 70, type: "ESSAI" as const, playerId: PLAYER_IDS["Le Corvec"], isUsap: true,
      description: "Essai de Mattéo Le Corvec (USAP). Non transformé. 41-12." },
    { minute: 75, type: "ESSAI" as const, playerId: null, isUsap: false,
      description: "Essai de Will Austin (Dragons). Doublé pour l'ailier gallois. Non transformé. 41-17." },
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
    const side = evt.isUsap ? "USAP" : "DRA ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Aimé-Giral — domicile");
  console.log("  Arbitre : Federico Vedovelli (ITA)");
  console.log("  Affluence : 6215");
  console.log("  Score mi-temps : USAP 17 - Dragons 0");
  console.log("  Score final : USAP 41 - Dragons 17");
  console.log(`  Événements : ${events.length}`);
  console.log("  ✅ Première victoire de la saison ! Bonus offensif avec 6 réalisations.");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

/**
 * Script de mise à jour du match USAP - Lions (J4 Challenge Cup, 17/01/2026)
 * Score final : USAP 20 - Lions 20 (match nul)
 * Mi-temps : USAP 10 - Lions 10
 *
 * Match nul sous la pluie à Aimé-Giral. L'USAP ouvre le score par Aucagne au
 * pied (4'), mais les Lions répondent par un essai de pénalité (22', CJ Ruiz)
 * et une pénalité de Smith (25'). Oviedo marque pour l'USAP (29', transfo
 * Aucagne → 10-10 à la pause). En 2e mi-temps, Smith (58') et Botha (64')
 * portent les Lions à 20-10. Duguivalu (68') et une pénalité d'Aucagne (73')
 * permettent à l'USAP d'arracher le nul et la qualification en huitièmes.
 *
 * Arbitre : Filippo Russo (Italie)
 * Affluence : 9 845 spectateurs
 * Carton jaune : Ignacio Ruiz 🟨22' (maul effondré → essai de pénalité)
 *
 * Sources : epcrugby.com, espn.com, allrugby.com, rugby365.com, francebleu.fr
 *
 * Exécution : npx tsx scripts/update-match-challenge-j4-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match USAP - Lions (J4 Challenge Cup, 17/01/2026) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      round: "Poule J4",
      competition: { shortName: "Challenge Européen" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — ${match.round} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Filippo Russo (Italie)
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Russo", mode: "insensitive" } },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Filippo",
        lastName: "Russo",
        slug: "filippo-russo",
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
    "Tetrashvili", "Roelofse", "Chinarro", "Tuilagi", "Diaby",
    "Ritchie", "Aprasidze", "Duguivalu", "Paia'aua", "Petaia",
    "Malolo", "Ceccarelli", "Warion", "Tanguy", "Le Corvec",
    "Hall", "Reus",
  ];
  for (const name of existing) {
    try {
      PLAYER_IDS[name] = await findPlayer(name);
      console.log(`  ✓ ${name}`);
    } catch {
      console.log(`  ✗ ${name} — NON TROUVÉ`);
    }
  }

  // Joueurs potentiellement nouveaux
  PLAYER_IDS["Ruiz"] = await findOrCreatePlayer("Ignacio", "Ruiz", "TALONNEUR");
  PLAYER_IDS["Oviedo"] = await findOrCreatePlayer("Joaquin", "Oviedo", "NUMERO_HUIT");
  PLAYER_IDS["Aucagne"] = await findOrCreatePlayer("Antoine", "Aucagne", "DEMI_OUVERTURE");
  PLAYER_IDS["Mascarenc"] = await findOrCreatePlayer("Diego", "Mascarenc", "CENTRE");
  PLAYER_IDS["Forner"] = await findOrCreatePlayer("Theo", "Forner", "ARRIERE");
  PLAYER_IDS["Beria"] = await findOrCreatePlayer("Giorgi", "Beria", "PILIER_GAUCHE");

  // ---------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (USAP - Lions) :
   *  4' Pénalité Aucagne (USAP) → 3-0
   * 22' CJ Ruiz (USAP) + Essai de pénalité Lions → 3-7
   * 25' Pénalité Smith (Lions) → 3-10
   * 29' Essai Oviedo (USAP) → 8-10
   * 30' Transfo Aucagne (USAP) → 10-10
   * MI-TEMPS : USAP 10 - Lions 10
   * 58' Pénalité Smith (Lions) → 10-13
   * 64' Essai Botha (Lions) → 10-18
   * 65' Transfo Smith (Lions) → 10-20
   * 68' Essai Duguivalu (USAP) → 15-20
   * 69' Transfo Aucagne (USAP) → 17-20
   * 73' Pénalité Aucagne (USAP) → 20-20
   *
   * USAP : 2E + 2T + 2P = 10 + 4 + 6 = 20 points
   * Lions : 1E + 1EP + 1T + 2P = 5 + 7 + 2 + 6 = 20 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "18:30",
      refereeId: referee.id,
      venueId: venue.id,
      attendance: 9845,
      halfTimeUsap: 10,
      halfTimeOpponent: 10,
      // Détail scoring USAP
      triesUsap: 2,
      conversionsUsap: 2,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Lions
      triesOpponent: 1,
      conversionsOpponent: 1,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 1,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Match nul 20-20 sous la pluie à Aimé-Giral pour la dernière journée de poule. " +
        "Aucagne ouvre le score au pied (4'), mais un carton jaune de Ruiz pour maul " +
        "effondré offre un essai de pénalité aux Lions (22'). Smith ajoute une pénalité " +
        "(25') avant qu'Oviedo ne relance l'USAP (29', transfo Aucagne → 10-10 à la " +
        "pause). Les Lions prennent le large en 2e mi-temps par Smith (58') et Botha " +
        "(64') pour mener 20-10. Mais les Catalans ne lâchent rien : Duguivalu (68') " +
        "et une pénalité d'Aucagne (73') arrachent le match nul. Ce résultat suffit " +
        "à l'USAP pour se qualifier en huitièmes de finale de Challenge Cup. " +
        "Première pro pour Diego Mascarenc.",
      videoUrl: "https://www.youtube.com/watch?v=PONIgKr6dug",
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

  const USAP_SQUAD: {
    num: number;
    lastName: string;
    position: Position;
    isStarter: boolean;
    isCaptain?: boolean;
    tries?: number;
    conversions?: number;
    penalties?: number;
    totalPoints?: number;
    minutesPlayed?: number;
    yellowCard?: boolean;
    yellowCardMin?: number;
  }[] = [
    // Titulaires
    { num: 1, lastName: "Tetrashvili", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
    { num: 2, lastName: "Ruiz", position: "TALONNEUR", isStarter: true, minutesPlayed: 56,
      yellowCard: true, yellowCardMin: 22 }, // CJ 22' → essai de pénalité
    { num: 3, lastName: "Roelofse", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
    { num: 4, lastName: "Chinarro", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
    { num: 5, lastName: "Tuilagi", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
    { num: 6, lastName: "Diaby", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
    { num: 7, lastName: "Ritchie", position: "TROISIEME_LIGNE_AILE", isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT", isStarter: true,
      tries: 1, totalPoints: 5, minutesPlayed: 80 }, // Essai 29'
    { num: 9, lastName: "Aprasidze", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 60 },
    { num: 10, lastName: "Aucagne", position: "DEMI_OUVERTURE", isStarter: true,
      conversions: 2, penalties: 2, totalPoints: 10, minutesPlayed: 80 }, // 2T(4) + 2P(6) = 10
    { num: 11, lastName: "Duguivalu", position: "AILIER", isStarter: true,
      tries: 1, totalPoints: 5, minutesPlayed: 80 }, // Essai 68'
    { num: 12, lastName: "Paia'aua", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
    { num: 13, lastName: "Mascarenc", position: "CENTRE", isStarter: true, minutesPlayed: 80 }, // 1ère pro
    { num: 14, lastName: "Petaia", position: "AILIER", isStarter: true, minutesPlayed: 80 },
    { num: 15, lastName: "Forner", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Malolo", position: "TALONNEUR", isStarter: false, minutesPlayed: 24 },
    { num: 17, lastName: "Beria", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },
    { num: 18, lastName: "Ceccarelli", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },
    { num: 19, lastName: "Warion", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 0 },
    { num: 20, lastName: "Tanguy", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 0 },
    { num: 21, lastName: "Le Corvec", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 0 },
    { num: 22, lastName: "Hall", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 },
    { num: 23, lastName: "Reus", position: "DEMI_OUVERTURE", isStarter: false, minutesPlayed: 0 },
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
        isCaptain: p.isCaptain ?? false,
        positionPlayed: p.position,
        tries: p.tries ?? 0,
        conversions: p.conversions ?? 0,
        penalties: p.penalties ?? 0,
        dropGoals: 0,
        totalPoints: p.totalPoints ?? 0,
        minutesPlayed: p.minutesPlayed ?? null,
        yellowCard: p.yellowCard ?? false,
        yellowCardMin: p.yellowCardMin ?? null,
        redCard: false,
        redCardMin: null,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const cap = p.isCaptain ? " (C)" : "";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const yc = p.yellowCard ? " 🟨" : "";
    const min = p.minutesPlayed != null ? ` [${p.minutesPlayed}']` : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${yc}${min}`);
  }

  const totalPointsUSAP = USAP_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsUSAP} (attendu : 20)`);
  if (totalPointsUSAP !== 20) {
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
    { minute: 4, type: "PENALITE" as const, playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne (USAP). 3-0." },
    { minute: 22, type: "CARTON_JAUNE" as const, playerId: PLAYER_IDS["Ruiz"], isUsap: true,
      description: "Carton jaune pour Ignacio Ruiz (USAP). Maul effondré illégalement." },
    { minute: 22, type: "ESSAI_PENALITE" as const, playerId: null, isUsap: false,
      description: "Essai de pénalité accordé aux Lions après le maul effondré. 3-7." },
    { minute: 25, type: "PENALITE" as const, playerId: null, isUsap: false,
      description: "Pénalité de Chris Smith (Lions). 3-10." },
    { minute: 29, type: "ESSAI" as const, playerId: PLAYER_IDS["Oviedo"], isUsap: true,
      description: "Essai de Joaquin Oviedo (USAP). Le N°8 relance les Catalans. 8-10." },
    { minute: 30, type: "TRANSFORMATION" as const, playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Transformation d'Antoine Aucagne (USAP). 10-10." },
    // === MI-TEMPS : USAP 10 - Lions 10 ===
    { minute: 58, type: "PENALITE" as const, playerId: null, isUsap: false,
      description: "Pénalité de Chris Smith (Lions). 10-13." },
    { minute: 64, type: "ESSAI" as const, playerId: null, isUsap: false,
      description: "Essai de PJ Botha (Lions). Le talonneur remplaçant marque sur ballon porté. 10-18." },
    { minute: 65, type: "TRANSFORMATION" as const, playerId: null, isUsap: false,
      description: "Transformation de Chris Smith (Lions). 10-20." },
    { minute: 68, type: "ESSAI" as const, playerId: PLAYER_IDS["Duguivalu"], isUsap: true,
      description: "Essai d'Alivereti Duguivalu (USAP). L'ailier catalan relance l'USAP. 15-20." },
    { minute: 69, type: "TRANSFORMATION" as const, playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Transformation d'Antoine Aucagne (USAP). 17-20." },
    { minute: 73, type: "PENALITE" as const, playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne (USAP). Égalisation ! 20-20. L'USAP arrache le nul et la qualification." },
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
    const side = evt.isUsap ? "USAP" : "LION";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Aimé-Giral — domicile");
  console.log("  Arbitre : Filippo Russo (ITA)");
  console.log("  Affluence : 9845");
  console.log("  Score mi-temps : USAP 10 - Lions 10");
  console.log("  Score final : USAP 20 - Lions 20 (match nul)");
  console.log(`  Événements : ${events.length}`);
  console.log("  USAP qualifié en huitièmes de finale !");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

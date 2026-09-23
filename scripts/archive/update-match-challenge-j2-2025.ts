/**
 * Script de mise à jour du match Benetton - USAP (J2 Challenge Cup, 13/12/2025)
 * Score final : Benetton 44 - USAP 31
 * Mi-temps : Benetton 24 - USAP 20
 *
 * Match disputé à l'extérieur, au Stadio Comunale di Monigo (Trévise).
 * Benetton s'impose grâce à un doublé d'Odogwu et des réalisations d'Izekor,
 * Bernasconi et Mendy. L'USAP reste dans le match grâce à Reus au pied
 * (2T + 4P = 16 pts) et aux essais de Duguivalu, Poulet et Fahy.
 *
 * Arbitre : Ben Connor (Pays de Galles)
 * Affluence : 4 151 spectateurs
 *
 * Sources : epcrugby.com, espn.com, skysports.com, allrugby.com
 *
 * Exécution : npx tsx scripts/update-match-challenge-j2-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match Benetton - USAP (J2 Challenge Cup, 13/12/2025) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      round: "Poule J2",
      competition: { shortName: "Challenge Européen" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — ${match.round} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Ben Connor (Pays de Galles)
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Connor", mode: "insensitive" } },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Ben",
        lastName: "Connor",
        slug: "ben-connor",
      },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName}`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 1b. Stade : Stadio Comunale di Monigo (extérieur)
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Monigo", mode: "insensitive" } },
  });
  if (!venue) {
    // Trouver ou créer le pays Italie
    let italy = await prisma.country.findFirst({
      where: { name: { contains: "Italie", mode: "insensitive" } },
    });
    if (!italy) {
      italy = await prisma.country.create({
        data: { name: "Italie", code: "ITA", slug: "italie" },
      });
    }
    venue = await prisma.venue.create({
      data: {
        name: "Stadio Comunale di Monigo",
        slug: "stadio-comunale-di-monigo",
        city: "Trévise",
        countryId: italy.id,
        capacity: 8000,
      },
    });
    console.log(`  Créé : ${venue.name} (${venue.id})`);
  } else {
    console.log(`  Existe : ${venue.name} (${venue.id})`);
  }

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
    "Devaux", "Malolo", "Fakatika", "Yato", "Chinarro",
    "Hicks", "Diaby", "Dvali", "Aprasidze", "Reus",
    "Dubois", "Poulet", "Duguivalu", "Buliruarua", "Fahy",
    "Lotrian", "Lagvilava", "Taty", "Hall", "Kretchmann", "Veredamu",
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
  PLAYER_IDS["Boyer Gallardo"] = await findOrCreatePlayer("Lorencio", "Boyer Gallardo", "PILIER_GAUCHE");
  PLAYER_IDS["Ceccarelli"] = await findOrCreatePlayer("Pietro", "Ceccarelli", "PILIER_DROIT");

  // ---------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (Benetton - USAP) :
   *  3' Pénalité Reus (USAP) → 0-3
   *  8' Essai Odogwu (BEN) + Transfo Albornoz → 7-3
   * 14' Pénalité Albornoz (BEN) → 10-3
   * 16' Pénalité Reus (USAP) → 10-6
   * 19' Essai Izekor (BEN) + Transfo Albornoz → 17-6
   * 21' Essai Duguivalu (USAP) + Transfo Reus → 17-13
   * 24' Essai Odogwu (BEN) + Transfo Albornoz → 24-13
   * 34' Essai Poulet (USAP) + Transfo Reus → 24-20
   * MI-TEMPS : Benetton 24 - USAP 20
   * 46' Pénalité Reus (USAP) → 24-23
   * 49' Essai Bernasconi (BEN) + Transfo Umaga → 31-23
   * 53' Pénalité Reus (USAP) → 31-26
   * 59' Essai Mendy (BEN) + Transfo Umaga → 38-26
   * 63' Essai Fahy (USAP) → 38-31
   * 67' Pénalité Umaga (BEN) → 41-31
   * 78' Pénalité Umaga (BEN) → 44-31
   *
   * Benetton : 5E + 5T + 3P = 25 + 10 + 9 = 44 points
   * USAP : 3E + 2T + 4P = 15 + 4 + 12 = 31 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "14:00",
      refereeId: referee.id,
      venueId: venue.id,
      attendance: 4151,
      halfTimeUsap: 20,
      halfTimeOpponent: 24,
      // Détail scoring USAP
      triesUsap: 3,
      conversionsUsap: 2,
      penaltiesUsap: 4,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Benetton
      triesOpponent: 5,
      conversionsOpponent: 5,
      penaltiesOpponent: 3,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Défaite à Trévise pour la 2e journée de Challenge Cup. L'USAP fait la course " +
        "derrière tout le match mais ne lâche rien. Mené 24-13 après un doublé d'Odogwu " +
        "et un essai d'Izekor, les Catalans reviennent à 24-20 grâce à Duguivalu et " +
        "Poulet, avec Reus impeccable au pied (2T + 4P = 16 pts). En deuxième mi-temps, " +
        "Bernasconi (49') et Mendy (59') creusent l'écart pour Benetton, mais Fahy " +
        "maintient l'espoir (38-31). Deux pénalités d'Umaga dans le dernier quart " +
        "scellent la victoire italienne 44-31.",
      videoUrl: "https://www.youtube.com/watch?v=iYzIdNx3HIk",
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
  }[] = [
    // Titulaires
    { num: 1, lastName: "Devaux", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
    { num: 2, lastName: "Malolo", position: "TALONNEUR", isStarter: true, minutesPlayed: 56 },
    { num: 3, lastName: "Fakatika", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
    { num: 4, lastName: "Yato", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
    { num: 5, lastName: "Chinarro", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
    { num: 6, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 65 },
    { num: 7, lastName: "Diaby", position: "TROISIEME_LIGNE_AILE", isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 8, lastName: "Dvali", position: "NUMERO_HUIT", isStarter: true, minutesPlayed: 65 },
    { num: 9, lastName: "Aprasidze", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 60 },
    { num: 10, lastName: "Reus", position: "DEMI_OUVERTURE", isStarter: true,
      conversions: 2, penalties: 4, totalPoints: 16, minutesPlayed: 80 },
    { num: 11, lastName: "Dubois", position: "AILIER", isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "Poulet", position: "CENTRE", isStarter: true,
      tries: 1, totalPoints: 5, minutesPlayed: 80 },
    { num: 13, lastName: "Duguivalu", position: "CENTRE", isStarter: true,
      tries: 1, totalPoints: 5, minutesPlayed: 80 },
    { num: 14, lastName: "Buliruarua", position: "AILIER", isStarter: true, minutesPlayed: 60 },
    { num: 15, lastName: "Fahy", position: "ARRIERE", isStarter: true,
      tries: 1, totalPoints: 5, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Lotrian", position: "TALONNEUR", isStarter: false, minutesPlayed: 24 },
    { num: 17, lastName: "Boyer Gallardo", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },
    { num: 18, lastName: "Ceccarelli", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },
    { num: 19, lastName: "Lagvilava", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 15 },
    { num: 20, lastName: "Taty", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 15 },
    { num: 21, lastName: "Hall", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 },
    { num: 22, lastName: "Kretchmann", position: "DEMI_OUVERTURE", isStarter: false, minutesPlayed: 20 },
    { num: 23, lastName: "Veredamu", position: "AILIER", isStarter: false, minutesPlayed: 20 },
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
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const cap = p.isCaptain ? " (C)" : "";
    const pts = (p.totalPoints ?? 0) > 0 ? ` (${p.totalPoints} pts)` : "";
    const min = p.minutesPlayed != null ? ` [${p.minutesPlayed}']` : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${min}`);
  }

  const totalPointsUSAP = USAP_SQUAD.reduce((sum, p) => sum + (p.totalPoints ?? 0), 0);
  console.log(`\n  Vérification : total points individuels = ${totalPointsUSAP} (attendu : 31)`);
  if (totalPointsUSAP !== 31) {
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
    { minute: 3, type: "PENALITE" as const, playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Pénalité de Hugo Reus (USAP). 0-3." },
    { minute: 8, type: "ESSAI" as const, playerId: null, isUsap: false,
      description: "Essai de Paolo Odogwu (Benetton). Le centre italien ouvre le score. 5-3." },
    { minute: 9, type: "TRANSFORMATION" as const, playerId: null, isUsap: false,
      description: "Transformation de Tomas Albornoz (Benetton). 7-3." },
    { minute: 14, type: "PENALITE" as const, playerId: null, isUsap: false,
      description: "Pénalité de Tomas Albornoz (Benetton). 10-3." },
    { minute: 16, type: "PENALITE" as const, playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Pénalité de Hugo Reus (USAP). 10-6." },
    { minute: 19, type: "ESSAI" as const, playerId: null, isUsap: false,
      description: "Essai d'Alessandro Izekor (Benetton). 15-6." },
    { minute: 19, type: "TRANSFORMATION" as const, playerId: null, isUsap: false,
      description: "Transformation de Tomas Albornoz (Benetton). 17-6." },
    { minute: 21, type: "ESSAI" as const, playerId: PLAYER_IDS["Duguivalu"], isUsap: true,
      description: "Essai d'Alivereti Duguivalu (USAP). Les Catalans réagissent. 17-11." },
    { minute: 21, type: "TRANSFORMATION" as const, playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Transformation de Hugo Reus (USAP). 17-13." },
    { minute: 24, type: "ESSAI" as const, playerId: null, isUsap: false,
      description: "Essai de Paolo Odogwu (Benetton). Doublé pour le centre. 22-13." },
    { minute: 25, type: "TRANSFORMATION" as const, playerId: null, isUsap: false,
      description: "Transformation de Tomas Albornoz (Benetton). 24-13." },
    { minute: 34, type: "ESSAI" as const, playerId: PLAYER_IDS["Poulet"], isUsap: true,
      description: "Essai de Job Poulet (USAP). L'USAP revient dans le match. 24-18." },
    { minute: 35, type: "TRANSFORMATION" as const, playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Transformation de Hugo Reus (USAP). 24-20." },
    // === MI-TEMPS : Benetton 24 - USAP 20 ===
    { minute: 46, type: "PENALITE" as const, playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Pénalité de Hugo Reus (USAP). L'USAP revient à un point. 24-23." },
    { minute: 49, type: "ESSAI" as const, playerId: null, isUsap: false,
      description: "Essai de Bautista Bernasconi (Benetton). Le talonneur marque. 29-23." },
    { minute: 50, type: "TRANSFORMATION" as const, playerId: null, isUsap: false,
      description: "Transformation de Jacob Umaga (Benetton). 31-23." },
    { minute: 53, type: "PENALITE" as const, playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Pénalité de Hugo Reus (USAP). 31-26." },
    { minute: 59, type: "ESSAI" as const, playerId: null, isUsap: false,
      description: "Essai d'Ignacio Mendy (Benetton). 36-26." },
    { minute: 60, type: "TRANSFORMATION" as const, playerId: null, isUsap: false,
      description: "Transformation de Jacob Umaga (Benetton). 38-26." },
    { minute: 63, type: "ESSAI" as const, playerId: PLAYER_IDS["Fahy"], isUsap: true,
      description: "Essai de Mayron Fahy (USAP). Non transformé. 38-31." },
    { minute: 67, type: "PENALITE" as const, playerId: null, isUsap: false,
      description: "Pénalité de Jacob Umaga (Benetton). 41-31." },
    { minute: 78, type: "PENALITE" as const, playerId: null, isUsap: false,
      description: "Pénalité de Jacob Umaga (Benetton). Score final 44-31." },
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
    const side = evt.isUsap ? "USAP" : "BEN ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Stadio Comunale di Monigo — extérieur");
  console.log("  Arbitre : Ben Connor (WAL)");
  console.log("  Affluence : 4151");
  console.log("  Score mi-temps : Benetton 24 - USAP 20");
  console.log("  Score final : Benetton 44 - USAP 31");
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

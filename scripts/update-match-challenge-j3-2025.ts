/**
 * Script de mise à jour du match Newcastle - USAP (J3 Challenge Cup, 10/01/2026)
 * Score final : Newcastle 26 - USAP 19
 * Mi-temps : Newcastle 14 - USAP 12
 *
 * Défaite à Kingston Park. Newcastle l'emporte grâce à 4 essais (Wade, Arnold,
 * Obatoyinbo, McGuigan) avec 3 transformations de Grayson. L'USAP répond par
 * un essai de Yato et un doublé de Granell, mais ne parvient pas à revenir.
 * Bonus défensif obtenu (défaite de 7 points).
 *
 * Arbitre : Peter Martin (Irlande)
 * Cartons : Grayson 🟨31' (Newcastle), Petaia 🟨58' (USAP)
 *
 * Sources : epcrugby.com, espn.com, allrugby.com, vibrez-rugby.com, ruck.co.uk
 *
 * Exécution : npx tsx scripts/update-match-challenge-j3-2025.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Mise à jour match Newcastle - USAP (J3 Challenge Cup, 10/01/2026) ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      round: "Poule J3",
      competition: { shortName: "Challenge Européen" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — ${match.round} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Peter Martin (Irlande)
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Martin", mode: "insensitive" }, firstName: { contains: "Peter", mode: "insensitive" } },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Peter",
        lastName: "Martin",
        slug: "peter-martin",
      },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName}`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 1b. Stade : Kingston Park (extérieur)
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Kingston Park", mode: "insensitive" } },
  });
  if (!venue) {
    let england = await prisma.country.findFirst({
      where: { name: { contains: "Angleterre", mode: "insensitive" } },
    });
    if (!england) {
      england = await prisma.country.create({
        data: { name: "Angleterre", code: "ENG", slug: "angleterre" },
      });
    }
    venue = await prisma.venue.create({
      data: {
        name: "Kingston Park",
        slug: "kingston-park",
        city: "Newcastle upon Tyne",
        countryId: england.id,
        capacity: 10200,
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
    "Devaux", "Montgaillard", "Ceccarelli", "Yato", "Chinarro",
    "Diaby", "Velarte", "Reus", "Paia'aua", "Poulet",
    "Petaia", "Dubois", "Lotrian", "Boyer Gallardo", "Roelofse",
    "Tuilagi", "Tanguy", "Dvali", "Aprasidze", "Kretchmann",
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
  PLAYER_IDS["Warion"] = await findOrCreatePlayer("Adrien", "Warion", "DEUXIEME_LIGNE");
  PLAYER_IDS["Ecochard"] = await findOrCreatePlayer("Tom", "Ecochard", "DEMI_DE_MELEE");
  PLAYER_IDS["Granell"] = await findOrCreatePlayer("Maxim", "Granell", "AILIER");

  // ---------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (Newcastle - USAP) :
   * 12' Essai Yato (USAP), Reus rate la transfo → 0-5
   * 19' Essai Wade (Newcastle) → 5-5
   * 20' Transfo Grayson (Newcastle) → 7-5
   * 22' Essai Arnold (Newcastle) → 12-5
   * 23' Transfo Grayson (Newcastle) → 14-5
   * 31' CJ Grayson (Newcastle)
   * 33' Essai Granell (USAP) → 14-10
   * 34' Transfo Reus (USAP) → 14-12
   * MI-TEMPS : Newcastle 14 - USAP 12
   * 45' Essai Obatoyinbo (Newcastle), Grayson rate → 19-12
   * 58' CJ Petaia (USAP)
   * 59' Essai McGuigan (Newcastle) → 24-12
   * 59' Transfo Grayson (Newcastle) → 26-12
   * 65' Essai Granell (USAP) → 26-17
   * 66' Transfo Reus (USAP) → 26-19
   *
   * Newcastle : 4E + 3T = 20 + 6 = 26 points
   * USAP : 3E + 2T = 15 + 4 = 19 points
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "14:00",
      refereeId: referee.id,
      venueId: venue.id,
      halfTimeUsap: 12,
      halfTimeOpponent: 14,
      // Détail scoring USAP
      triesUsap: 3,
      conversionsUsap: 2,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Newcastle
      triesOpponent: 4,
      conversionsOpponent: 3,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: true,
      // Rapport
      report:
        "Défaite à Kingston Park pour la 3e journée de Challenge Cup. Newcastle " +
        "s'impose 26-19 grâce à 4 essais (Wade, Arnold, Obatoyinbo, McGuigan) bien " +
        "servis par le pied de Grayson (3T/4). L'USAP ouvre le score par Yato (12') " +
        "et Granell signe un doublé (33', 65') avec Reus à la transformation (2/3). " +
        "Malgré un carton jaune pour Petaia (58'), les Catalans décrochent le bonus " +
        "défensif en revenant à 7 points. Lucas Dubois échoue de peu dans les " +
        "dernières minutes pour l'essai égalisateur.",
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
    { num: 1, lastName: "Devaux", position: "PILIER_GAUCHE", isStarter: true, minutesPlayed: 56 },
    { num: 2, lastName: "Montgaillard", position: "TALONNEUR", isStarter: true, minutesPlayed: 56 },
    { num: 3, lastName: "Ceccarelli", position: "PILIER_DROIT", isStarter: true, minutesPlayed: 56 },
    { num: 4, lastName: "Yato", position: "DEUXIEME_LIGNE", isStarter: true,
      tries: 1, totalPoints: 5, minutesPlayed: 80 }, // Essai 12'
    { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE", isStarter: true, minutesPlayed: 80 },
    { num: 6, lastName: "Chinarro", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
    { num: 7, lastName: "Diaby", position: "TROISIEME_LIGNE_AILE", isStarter: true, minutesPlayed: 80 },
    { num: 8, lastName: "Velarte", position: "NUMERO_HUIT", isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE", isStarter: true, minutesPlayed: 60 },
    { num: 10, lastName: "Reus", position: "DEMI_OUVERTURE", isStarter: true,
      conversions: 2, totalPoints: 4, minutesPlayed: 80 }, // 2T/3
    { num: 11, lastName: "Granell", position: "AILIER", isStarter: true,
      tries: 2, totalPoints: 10, minutesPlayed: 80 }, // Doublé 33', 65'
    { num: 12, lastName: "Paia'aua", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
    { num: 13, lastName: "Poulet", position: "CENTRE", isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Petaia", position: "AILIER", isStarter: true, minutesPlayed: 80,
      yellowCard: true, yellowCardMin: 58 }, // CJ 58'
    { num: 15, lastName: "Dubois", position: "ARRIERE", isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Lotrian", position: "TALONNEUR", isStarter: false, minutesPlayed: 24 },
    { num: 17, lastName: "Boyer Gallardo", position: "PILIER_GAUCHE", isStarter: false, minutesPlayed: 24 },
    { num: 18, lastName: "Roelofse", position: "PILIER_DROIT", isStarter: false, minutesPlayed: 24 },
    { num: 19, lastName: "Tuilagi", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 30 },
    { num: 20, lastName: "Tanguy", position: "TROISIEME_LIGNE_AILE", isStarter: false, minutesPlayed: 0 },
    { num: 21, lastName: "Dvali", position: "DEUXIEME_LIGNE", isStarter: false, minutesPlayed: 0 },
    { num: 22, lastName: "Aprasidze", position: "DEMI_DE_MELEE", isStarter: false, minutesPlayed: 20 },
    { num: 23, lastName: "Kretchmann", position: "DEMI_OUVERTURE", isStarter: false, minutesPlayed: 0 },
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
  console.log(`\n  Vérification : total points individuels = ${totalPointsUSAP} (attendu : 19)`);
  if (totalPointsUSAP !== 19) {
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
    { minute: 12, type: "ESSAI" as const, playerId: PLAYER_IDS["Yato"], isUsap: true,
      description: "Essai de Peceli Yato (USAP). Le deuxième ligne fidjien ouvre le score. Reus rate la transformation. 0-5." },
    { minute: 19, type: "ESSAI" as const, playerId: null, isUsap: false,
      description: "Essai de Christian Wade (Newcastle). L'ailier anglais égalise. 5-5." },
    { minute: 20, type: "TRANSFORMATION" as const, playerId: null, isUsap: false,
      description: "Transformation d'Ethan Grayson (Newcastle). 7-5." },
    { minute: 22, type: "ESSAI" as const, playerId: null, isUsap: false,
      description: "Essai de Sammy Arnold (Newcastle). Le centre marque dans la foulée. 12-5." },
    { minute: 23, type: "TRANSFORMATION" as const, playerId: null, isUsap: false,
      description: "Transformation d'Ethan Grayson (Newcastle). 14-5." },
    { minute: 31, type: "CARTON_JAUNE" as const, playerId: null, isUsap: false,
      description: "Carton jaune pour Ethan Grayson (Newcastle). En-avant volontaire." },
    { minute: 33, type: "ESSAI" as const, playerId: PLAYER_IDS["Granell"], isUsap: true,
      description: "Essai de Maxim Granell (USAP). L'ailier catalan profite de la supériorité numérique. 14-10." },
    { minute: 34, type: "TRANSFORMATION" as const, playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Transformation de Hugo Reus (USAP). 14-12." },
    // === MI-TEMPS : Newcastle 14 - USAP 12 ===
    { minute: 45, type: "ESSAI" as const, playerId: null, isUsap: false,
      description: "Essai d'Elliott Obatoyinbo (Newcastle). Le fullback profite d'une relance. Grayson rate la transformation. 19-12." },
    { minute: 58, type: "CARTON_JAUNE" as const, playerId: PLAYER_IDS["Petaia"], isUsap: true,
      description: "Carton jaune pour Jordan Petaia (USAP). Plaquage illicite." },
    { minute: 59, type: "ESSAI" as const, playerId: null, isUsap: false,
      description: "Essai de George McGuigan (Newcastle). Le capitaine-talonneur marque en supériorité. 24-12." },
    { minute: 59, type: "TRANSFORMATION" as const, playerId: null, isUsap: false,
      description: "Transformation d'Ethan Grayson (Newcastle). 26-12." },
    { minute: 65, type: "ESSAI" as const, playerId: PLAYER_IDS["Granell"], isUsap: true,
      description: "Essai de Maxim Granell (USAP). Doublé pour l'ailier ! L'USAP revient. 26-17." },
    { minute: 66, type: "TRANSFORMATION" as const, playerId: PLAYER_IDS["Reus"], isUsap: true,
      description: "Transformation de Hugo Reus (USAP). 26-19. L'USAP décroche le bonus défensif." },
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
    const side = evt.isUsap ? "USAP" : "NEW ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Kingston Park — extérieur");
  console.log("  Arbitre : Peter Martin (IRL)");
  console.log("  Score mi-temps : Newcastle 14 - USAP 12");
  console.log("  Score final : Newcastle 26 - USAP 19");
  console.log(`  Événements : ${events.length}`);
  console.log("  Bonus défensif obtenu (défaite de 7 points).");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

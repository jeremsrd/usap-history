import { PrismaClient, Position, EventType } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxssq00451umrd7m0clvp";

async function main() {
  console.log(
    "=== Mise à jour match USAP - Racing 92 (Challenge Cup 8e de finale, 05/04/2025) ==="
  );

  // --- Venue (Aimé-Giral, déjà en BDD) ---
  const venue = await prisma.venue.findFirst({
    where: { name: { contains: "Giral", mode: "insensitive" } },
  });
  if (!venue) throw new Error("Venue Aimé-Giral introuvable !");
  console.log(`  Venue : ${venue.name} (${venue.id})`);

  // --- Arbitre (Gianluca Gnecchi, déjà créé en J3) ---
  const referee = await prisma.referee.findFirst({
    where: { lastName: "Gnecchi" },
  });
  if (!referee) throw new Error("Arbitre Gnecchi introuvable !");
  console.log(`  Arbitre : ${referee.firstName} ${referee.lastName} (${referee.id})`);

  // --- Récupération des joueurs ---
  console.log("\n--- Récupération des joueurs ---");

  const playerNames = [
    // Titulaires
    { first: "Bruce", last: "Devaux" },
    { first: "Seilala", last: "Lam" },
    { first: "Pietro", last: "Ceccarelli" },
    { first: "Tristan", last: "Labouteley" },
    { first: "Mathieu", last: "Tanguy" },
    { first: "Patrick", last: "Sobela" },
    { first: "Maxwell", last: "Hicks" },
    { first: "Lucas", last: "Velarte" },
    { first: "James", last: "Hall" },
    { first: "Jake", last: "McIntyre" },
    { first: "Alivereti", last: "Duguivalu" },
    { first: "Jerónimo", last: "De La Fuente" },
    { first: "Apisai", last: "Naqalevu" },
    { first: "Tavite", last: "Veredamu" },
    { first: "Tommaso", last: "Allan" },
    // Remplaçants
    { first: "Victor", last: "Montgaillard" },
    { first: "Giorgi", last: "Beria" },
    { first: "Akato", last: "Fakatika" },
    { first: "Adrien", last: "Warion" },
    { first: "Lucas", last: "Bachelier" },
    { first: "Gela", last: "Aprasidze" },
    { first: "Valentin", last: "Delpy" },
    { first: "Eneriko", last: "Buliruarua" },
  ];

  const players: Record<string, string> = {};

  for (const { first, last } of playerNames) {
    const player = await prisma.player.findFirst({
      where: {
        lastName: { equals: last, mode: "insensitive" },
        firstName: { contains: first.substring(0, 3), mode: "insensitive" },
      },
    });
    if (!player) throw new Error(`Joueur introuvable : ${first} ${last}`);
    const key = `${first} ${last}`;
    players[key] = player.id;
    console.log(`  ${first} ${last} → ${player.id}`);
  }

  // --- Nettoyage des données existantes ---
  console.log("\n--- Nettoyage des données existantes ---");

  await prisma.matchEvent.deleteMany({ where: { matchId: MATCH_ID } });
  console.log("  Events supprimés");

  await prisma.matchPlayer.deleteMany({ where: { matchId: MATCH_ID } });
  console.log("  MatchPlayers supprimés");

  // --- Mise à jour du match ---
  console.log("\n--- Mise à jour du match ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-04-05T21:00:00+02:00"),
      venue: { connect: { id: venue.id } },
      referee: { connect: { id: referee.id } },
      attendance: 9816,
      scoreUsap: 18,
      scoreOpponent: 24,
      halfTimeUsap: 11,
      halfTimeOpponent: 10,
      triesUsap: 2,
      conversionsUsap: 1,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      triesOpponent: 3,
      conversionsOpponent: 3,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      bonusOffensif: false,
      bonusDefensif: true, // défaite de 6 pts (< 7)
    },
  });
  console.log("  Match mis à jour ✓");

  // --- Composition USAP ---
  console.log("\n--- Création de la composition USAP ---");

  const composition = [
    // Titulaires
    { key: "Bruce Devaux", num: 1, pos: Position.PILIER_GAUCHE, starter: true, captain: false, subOut: 53, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Seilala Lam", num: 2, pos: Position.TALONNEUR, starter: true, captain: false, subOut: 53, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Pietro Ceccarelli", num: 3, pos: Position.PILIER_DROIT, starter: true, captain: false, subOut: 53, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Tristan Labouteley", num: 4, pos: Position.DEUXIEME_LIGNE, starter: true, captain: false, subOut: 49, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Mathieu Tanguy", num: 5, pos: Position.DEUXIEME_LIGNE, starter: true, captain: false, subOut: null as number | null, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Patrick Sobela", num: 6, pos: Position.TROISIEME_LIGNE_AILE, starter: true, captain: false, subOut: 66, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Maxwell Hicks", num: 7, pos: Position.TROISIEME_LIGNE_AILE, starter: true, captain: false, subOut: null as number | null, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Lucas Velarte", num: 8, pos: Position.NUMERO_HUIT, starter: true, captain: false, subOut: null as number | null, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "James Hall", num: 9, pos: Position.DEMI_DE_MELEE, starter: true, captain: false, subOut: 48, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Jake McIntyre", num: 10, pos: Position.DEMI_OUVERTURE, starter: true, captain: false, subOut: 63, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Alivereti Duguivalu", num: 11, pos: Position.AILIER, starter: true, captain: false, subOut: null as number | null, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Jeronimo De La Fuente", num: 12, pos: Position.CENTRE, starter: true, captain: true, subOut: 57, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Apisai Naqalevu", num: 13, pos: Position.CENTRE, starter: true, captain: false, subOut: null as number | null, tries: 0, conv: 0, pen: 0, yc: true, ycMin: 19 },
    { key: "Tavite Veredamu", num: 14, pos: Position.AILIER, starter: true, captain: false, subOut: null as number | null, tries: 1, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Tommaso Allan", num: 15, pos: Position.ARRIERE, starter: true, captain: false, subOut: null as number | null, tries: 1, conv: 1, pen: 2, yc: false, ycMin: null as number | null },
    // Remplaçants
    { key: "Victor Montgaillard", num: 16, pos: Position.TALONNEUR, starter: false, captain: false, subOut: null as number | null, subIn: 53, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Giorgi Beria", num: 17, pos: Position.PILIER_GAUCHE, starter: false, captain: false, subOut: null as number | null, subIn: 53, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Akato Fakatika", num: 18, pos: Position.PILIER_DROIT, starter: false, captain: false, subOut: null as number | null, subIn: 53, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Adrien Warion", num: 19, pos: Position.DEUXIEME_LIGNE, starter: false, captain: false, subOut: null as number | null, subIn: 49, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Lucas Bachelier", num: 20, pos: Position.TROISIEME_LIGNE_AILE, starter: false, captain: false, subOut: null as number | null, subIn: 66, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Gela Aprasidze", num: 21, pos: Position.DEMI_DE_MELEE, starter: false, captain: false, subOut: null as number | null, subIn: 48, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Valentin Delpy", num: 22, pos: Position.DEMI_OUVERTURE, starter: false, captain: false, subOut: null as number | null, subIn: 63, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
    { key: "Eneriko Buliruarua", num: 23, pos: Position.CENTRE, starter: false, captain: false, subOut: null as number | null, subIn: 57, tries: 0, conv: 0, pen: 0, yc: false, ycMin: null as number | null },
  ];

  for (const p of composition) {
    const totalPts = p.tries * 5 + p.conv * 2 + p.pen * 3;
    await prisma.matchPlayer.create({
      data: {
        matchId: MATCH_ID,
        playerId: players[p.key],
        shirtNumber: p.num,
        positionPlayed: p.pos,
        isStarter: p.starter,
        isCaptain: p.captain,
        subIn: p.starter ? 0 : (p as any).subIn || null,
        subOut: p.subOut,
        tries: p.tries,
        conversions: p.conv,
        penalties: p.pen,
        totalPoints: totalPts,
        yellowCard: p.yc,
        yellowCardMin: p.ycMin,
      },
    });
  }
  console.log(`  ${composition.length} joueurs créés ✓`);

  // --- Événements ---
  console.log("\n--- Création des événements ---");

  const events: Array<{
    type: EventType;
    minute: number;
    playerId: string | null;
    isUsap: boolean;
    description?: string;
    relatedPlayerId?: string | null;
  }> = [
    // Chronologie complète du match
    // 9' - Farrell pénalité → 0-3
    { type: EventType.PENALITE, minute: 9, playerId: null, isUsap: false, description: "Pénalité Owen Farrell" },
    // 14' - Allan pénalité → 3-3
    { type: EventType.PENALITE, minute: 14, playerId: players["Tommaso Allan"], isUsap: true, description: "Pénalité Tommaso Allan" },
    // 18' - Allan pénalité → 6-3
    { type: EventType.PENALITE, minute: 18, playerId: players["Tommaso Allan"], isUsap: true, description: "Pénalité Tommaso Allan" },
    // 19' - Naqalevu carton jaune
    { type: EventType.CARTON_JAUNE, minute: 19, playerId: players["Apisai Naqalevu"], isUsap: true, description: "Carton jaune Apisai Naqalevu" },
    // 24' - Bamba essai → 6-8
    { type: EventType.ESSAI, minute: 24, playerId: null, isUsap: false, description: "Essai Demba Bamba" },
    // 24' - Farrell transformation → 6-10
    { type: EventType.TRANSFORMATION, minute: 24, playerId: null, isUsap: false, description: "Transformation Owen Farrell" },
    // 36' - Allan essai → 11-10 (non transformé)
    { type: EventType.ESSAI, minute: 36, playerId: players["Tommaso Allan"], isUsap: true, description: "Essai Tommaso Allan" },
    // --- MI-TEMPS 11-10 ---
    // 42' - Joseph essai → 11-15
    { type: EventType.ESSAI, minute: 42, playerId: null, isUsap: false, description: "Essai Jordan Joseph" },
    // 43' - Farrell transformation → 11-17
    { type: EventType.TRANSFORMATION, minute: 43, playerId: null, isUsap: false, description: "Transformation Owen Farrell" },
    // 48' - Hall remplacé par Aprasidze
    { type: EventType.REMPLACEMENT_SORTIE, minute: 48, playerId: players["James Hall"], isUsap: true, description: "Hall remplacé par Aprasidze", relatedPlayerId: players["Gela Aprasidze"] },
    // 49' - Labouteley remplacé par Warion
    { type: EventType.REMPLACEMENT_SORTIE, minute: 49, playerId: players["Tristan Labouteley"], isUsap: true, description: "Labouteley remplacé par Warion", relatedPlayerId: players["Adrien Warion"] },
    // 53' - Triple remplacement première ligne
    { type: EventType.REMPLACEMENT_SORTIE, minute: 53, playerId: players["Bruce Devaux"], isUsap: true, description: "Devaux remplacé par Beria", relatedPlayerId: players["Giorgi Beria"] },
    { type: EventType.REMPLACEMENT_SORTIE, minute: 53, playerId: players["Seilala Lam"], isUsap: true, description: "Lam remplacé par Montgaillard", relatedPlayerId: players["Victor Montgaillard"] },
    { type: EventType.REMPLACEMENT_SORTIE, minute: 53, playerId: players["Pietro Ceccarelli"], isUsap: true, description: "Ceccarelli remplacé par Fakatika", relatedPlayerId: players["Akato Fakatika"] },
    // 54' - Veredamu essai → 16-17
    { type: EventType.ESSAI, minute: 54, playerId: players["Tavite Veredamu"], isUsap: true, description: "Essai Tavite Veredamu" },
    // 55' - Allan transformation → 18-17
    { type: EventType.TRANSFORMATION, minute: 55, playerId: players["Tommaso Allan"], isUsap: true, description: "Transformation Tommaso Allan" },
    // 57' - De la Fuente remplacé par Buliruarua
    { type: EventType.REMPLACEMENT_SORTIE, minute: 57, playerId: players["Jeronimo De La Fuente"], isUsap: true, description: "De la Fuente remplacé par Buliruarua", relatedPlayerId: players["Eneriko Buliruarua"] },
    // 63' - McIntyre remplacé par Delpy
    { type: EventType.REMPLACEMENT_SORTIE, minute: 63, playerId: players["Jake McIntyre"], isUsap: true, description: "McIntyre remplacé par Delpy", relatedPlayerId: players["Valentin Delpy"] },
    // 66' - Naituvi essai → 18-22
    { type: EventType.ESSAI, minute: 66, playerId: null, isUsap: false, description: "Essai Wame Naituvi" },
    // 66' - Sobela remplacé par Bachelier
    { type: EventType.REMPLACEMENT_SORTIE, minute: 66, playerId: players["Patrick Sobela"], isUsap: true, description: "Sobela remplacé par Bachelier", relatedPlayerId: players["Lucas Bachelier"] },
    // 67' - Le Garrec transformation → 18-24
    { type: EventType.TRANSFORMATION, minute: 67, playerId: null, isUsap: false, description: "Transformation Nolann Le Garrec" },
  ];

  for (const e of events) {
    await prisma.matchEvent.create({
      data: {
        matchId: MATCH_ID,
        type: e.type,
        minute: e.minute,
        playerId: e.playerId,
        isUsap: e.isUsap,
        description: e.description || null,
        relatedPlayerId: e.relatedPlayerId || null,
      },
    });
  }
  console.log(`  ${events.length} événements créés ✓`);

  // --- Vérification ---
  console.log("\n--- Vérification ---");

  const match = await prisma.match.findUnique({
    where: { id: MATCH_ID },
    include: {
      players: { orderBy: { shirtNumber: "asc" } },
      matchEvents: { orderBy: { minute: "asc" } },
      referee: true,
    },
  });

  if (match) {
    console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} Racing 92`);
    console.log(`  Mi-temps : USAP ${match.halfTimeUsap} - ${match.halfTimeOpponent} Racing 92`);
    console.log(`  Joueurs : ${match.players.length}`);
    console.log(`  Events : ${match.matchEvents.length}`);
    console.log(`  Arbitre : ${match.referee?.firstName} ${match.referee?.lastName}`);
    console.log(`  Affluence : ${match.attendance}`);
    console.log(`  Bonus offensif : ${match.bonusOffensif}`);
    console.log(`  Bonus défensif : ${match.bonusDefensif}`);

    // Vérifier les points USAP via type d'événement
    const pointsMap = { ESSAI: 5, TRANSFORMATION: 2, PENALITE: 3, DROP: 3 } as Record<string, number>;
    const usapPoints = match.matchEvents
      .filter((e) => e.isUsap && pointsMap[e.type])
      .reduce((sum, e) => sum + (pointsMap[e.type] || 0), 0);
    console.log(`  Total points USAP (calculé) : ${usapPoints} (attendu : ${match.scoreUsap})`);

    const oppPoints = match.matchEvents
      .filter((e) => !e.isUsap && pointsMap[e.type])
      .reduce((sum, e) => sum + (pointsMap[e.type] || 0), 0);
    console.log(`  Total points Racing 92 (calculé) : ${oppPoints} (attendu : ${match.scoreOpponent})`);
  }

  console.log("\n=== Terminé ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

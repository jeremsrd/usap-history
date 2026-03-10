/**
 * Script de mise à jour du match USAP - Connacht Rugby (Challenge Cup Poule J2, 15/12/2024)
 * Score final : USAP 18 - Connacht 31
 * Mi-temps : USAP 8 - Connacht 19
 *
 * Match disputé au Stade Aimé-Giral. Défaite de l'USAP face aux Irlandais du Connacht.
 * Deux essais encaissés dans les 11 premières minutes (Ralston 6', de Buitlear 11').
 * L'USAP réduit l'écart à 1 point (18-19, 52') grâce aux essais de Boyer Gallardo (18')
 * et Joseph (51') + 2 pénalités d'Aucagne. Mais le carton jaune de Warion (56') coûte cher :
 * Boyle marque à la 58' puis McBurney clôt le score à la 79'. 5 essais à 2 pour Connacht.
 * Premier match d'Andro Dvali avec l'USAP (N°8 géorgien).
 * Arbitre : Sara Cox (Angleterre).
 *
 * Sources : epcrugby.com, itsrugby.fr, espn.com, francebleu.fr
 *
 * Exécution : npx tsx scripts/update-match-challenge-j2.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsq3003z1umry5b9iqa7";

async function main() {
  console.log("=== Mise à jour match USAP - Connacht (Challenge Cup J2, 15/12/2024) ===\n");

  // ---------------------------------------------------------------
  // 0. Création des joueurs manquants
  // ---------------------------------------------------------------
  console.log("--- Création des données manquantes ---");

  const season = await prisma.season.findFirst({ where: { label: "2024-2025" } });

  // Créer la Géorgie si nécessaire
  let georgia = await prisma.country.findFirst({ where: { code: "GE" } });
  if (!georgia) {
    georgia = await prisma.country.create({
      data: { name: "Géorgie", code: "GE", continent: "EUROPE" },
    });
    console.log("  Pays créé : Géorgie");
  }

  // Arbitre : Sara Cox (Angleterre)
  let saraCox = await prisma.referee.findFirst({ where: { lastName: "Cox" } });
  if (!saraCox) {
    saraCox = await prisma.referee.create({
      data: { firstName: "Sara", lastName: "Cox", slug: "sara-cox" },
    });
    console.log(`  Arbitre créée : Sara Cox (${saraCox.id})`);
  } else {
    console.log(`  Arbitre existante : Sara Cox (${saraCox.id})`);
  }

  // Joueur : Andro Dvali (N°8 géorgien, premier match avec l'USAP)
  let dvali = await prisma.player.findFirst({ where: { lastName: { contains: "Dvali" } } });
  if (!dvali) {
    dvali = await prisma.player.create({
      data: {
        firstName: "Andro", lastName: "Dvali",
        slug: "andro-dvali",
        position: "NUMERO_HUIT",
        birthDate: new Date("2005-07-10"),
        nationalityId: georgia.id,
      },
    });
    await prisma.seasonPlayer.create({
      data: { seasonId: season!.id, playerId: dvali.id, position: "NUMERO_HUIT" },
    });
    console.log(`  Joueur créé : Andro Dvali (${dvali.id})`);
  } else {
    console.log(`  Joueur existant : Andro Dvali (${dvali.id})`);
  }

  // ---------------------------------------------------------------
  // 1. Récupération des IDs joueurs
  // ---------------------------------------------------------------
  console.log("\n--- Récupération des joueurs ---");

  const getPlayer = async (lastName: string, firstName?: string) => {
    const where: any = { lastName: { contains: lastName } };
    if (firstName) where.firstName = { contains: firstName };
    const p = await prisma.player.findFirst({ where, select: { id: true, firstName: true, lastName: true } });
    if (!p) throw new Error(`Joueur introuvable : ${firstName || ""} ${lastName}`);
    console.log(`  ${p.firstName} ${p.lastName} → ${p.id}`);
    return p.id;
  };

  // Titulaires
  const boyerGallardoId = await getPlayer("Boyer Gallardo");
  const lamId = await getPlayer("Lam", "Seilala");
  const roelofseId = await getPlayer("Roelofse");
  const ortombinaId = await getPlayer("Ortombina");
  const warionId = await getPlayer("Warion");
  const dellaSchiavaId = await getPlayer("Della Schiava");
  const hicksId = await getPlayer("Hicks");
  const dvaliId = dvali.id;
  const hallId = await getPlayer("Hall", "James");
  const aucagneId = await getPlayer("Aucagne");
  const granellId = await getPlayer("Granell");
  const naqalevuId = await getPlayer("Naqalevu");
  const buliruaruaId = await getPlayer("Buliruarua");
  const josephId = await getPlayer("Joseph", "Jefferson");
  const crossdaleId = await getPlayer("Crossdale");

  // Remplaçants
  const montgaillardId = await getPlayer("Montgaillard");
  const barcenillaId = await getPlayer("Barcenilla");
  const brookesId = await getPlayer("Brookes");
  const chinarroId = await getPlayer("Chinarro");
  const faasooId = await getPlayer("Fa'aso'o");
  const aprasidzeId = await getPlayer("Aprasidze");
  const allanId = await getPlayer("Allan", "Tommaso");
  const duguivaluId = await getPlayer("Duguivalu");

  // ---------------------------------------------------------------
  // 2. Nettoyage des données existantes
  // ---------------------------------------------------------------
  console.log("\n--- Nettoyage des données existantes ---");

  await prisma.matchEvent.deleteMany({ where: { matchId: MATCH_ID } });
  console.log("  Events supprimés");
  await prisma.matchPlayer.deleteMany({ where: { matchId: MATCH_ID } });
  console.log("  MatchPlayers supprimés");

  // ---------------------------------------------------------------
  // 3. Mise à jour du match
  // ---------------------------------------------------------------
  console.log("\n--- Mise à jour du match ---");

  const aimeGiral = await prisma.venue.findFirst({ where: { name: { contains: "Giral" } } });

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2024-12-15T14:00:00"),
      venue: { connect: { id: aimeGiral!.id } },
      referee: { connect: { id: saraCox!.id } },
      attendance: 8092,
      // Score final : USAP 18 - Connacht 31
      scoreUsap: 18,
      scoreOpponent: 31,
      halfTimeUsap: 8,
      halfTimeOpponent: 19,
      // Détail points USAP : 2 essais, 1 transformation, 2 pénalités
      triesUsap: 2,
      conversionsUsap: 1,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      // Détail points adversaire : 5 essais, 3 transformations, 0 pénalités
      triesOpponent: 5,
      conversionsOpponent: 3,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      // Pas de bonus
      bonusOffensif: false,
      bonusDefensif: false,
    },
  });
  console.log("  Match mis à jour ✓");

  // ---------------------------------------------------------------
  // 4. Composition USAP (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Création de la composition USAP ---");

  const players = [
    // Titulaires
    { playerId: boyerGallardoId, shirtNumber: 1, positionPlayed: "PILIER_GAUCHE", isStarter: true, isCaptain: false, tries: 1, conversions: 0, penalties: 0, totalPoints: 5, minutesPlayed: 61, subIn: null as number | null, subOut: 61 as number | null },
    { playerId: lamId, shirtNumber: 2, positionPlayed: "TALONNEUR", isStarter: true, isCaptain: true, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 61, subIn: null as number | null, subOut: 61 as number | null },
    { playerId: roelofseId, shirtNumber: 3, positionPlayed: "PILIER_DROIT", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 77, subIn: null as number | null, subOut: 77 as number | null },
    { playerId: ortombinaId, shirtNumber: 4, positionPlayed: "DEUXIEME_LIGNE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: warionId, shirtNumber: 5, positionPlayed: "DEUXIEME_LIGNE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: dellaSchiavaId, shirtNumber: 6, positionPlayed: "TROISIEME_LIGNE_AILE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: hicksId, shirtNumber: 7, positionPlayed: "TROISIEME_LIGNE_AILE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 66, subIn: null as number | null, subOut: 66 as number | null },
    { playerId: dvaliId, shirtNumber: 8, positionPlayed: "NUMERO_HUIT", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 52, subIn: null as number | null, subOut: 52 as number | null },
    { playerId: hallId, shirtNumber: 9, positionPlayed: "DEMI_DE_MELEE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 54, subIn: null as number | null, subOut: 54 as number | null },
    { playerId: aucagneId, shirtNumber: 10, positionPlayed: "DEMI_OUVERTURE", isStarter: true, isCaptain: false, tries: 0, conversions: 1, penalties: 2, totalPoints: 8, minutesPlayed: 54, subIn: null as number | null, subOut: 54 as number | null },
    { playerId: granellId, shirtNumber: 11, positionPlayed: "AILIER", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: naqalevuId, shirtNumber: 12, positionPlayed: "CENTRE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: buliruaruaId, shirtNumber: 13, positionPlayed: "CENTRE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 61, subIn: null as number | null, subOut: 61 as number | null },
    { playerId: josephId, shirtNumber: 14, positionPlayed: "AILIER", isStarter: true, isCaptain: false, tries: 1, conversions: 0, penalties: 0, totalPoints: 5, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: crossdaleId, shirtNumber: 15, positionPlayed: "ARRIERE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },

    // Remplaçants
    { playerId: montgaillardId, shirtNumber: 16, positionPlayed: "TALONNEUR", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 19, subIn: 61 as number | null, subOut: null as number | null },
    { playerId: barcenillaId, shirtNumber: 17, positionPlayed: "PILIER_DROIT", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 3, subIn: 77 as number | null, subOut: null as number | null },
    { playerId: brookesId, shirtNumber: 18, positionPlayed: "PILIER_GAUCHE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 19, subIn: 61 as number | null, subOut: null as number | null },
    { playerId: chinarroId, shirtNumber: 19, positionPlayed: "TROISIEME_LIGNE_AILE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 14, subIn: 66 as number | null, subOut: null as number | null },
    { playerId: faasooId, shirtNumber: 20, positionPlayed: "NUMERO_HUIT", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 28, subIn: 52 as number | null, subOut: null as number | null },
    { playerId: aprasidzeId, shirtNumber: 21, positionPlayed: "DEMI_DE_MELEE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 26, subIn: 54 as number | null, subOut: null as number | null },
    { playerId: allanId, shirtNumber: 22, positionPlayed: "DEMI_OUVERTURE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 26, subIn: 54 as number | null, subOut: null as number | null },
    { playerId: duguivaluId, shirtNumber: 23, positionPlayed: "CENTRE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 19, subIn: 61 as number | null, subOut: null as number | null },
  ];

  for (const p of players) {
    await prisma.matchPlayer.create({
      data: {
        matchId: MATCH_ID,
        playerId: p.playerId,
        shirtNumber: p.shirtNumber,
        positionPlayed: p.positionPlayed,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain,
        tries: p.tries,
        conversions: p.conversions,
        penalties: p.penalties,
        totalPoints: p.totalPoints,
        minutesPlayed: p.minutesPlayed,
        subIn: p.subIn,
        subOut: p.subOut,
      },
    });
  }
  console.log(`  ${players.length} joueurs créés ✓`);

  // ---------------------------------------------------------------
  // 5. Événements du match
  // ---------------------------------------------------------------
  console.log("\n--- Création des événements ---");

  const events = [
    // === 1ère mi-temps ===
    // 6' - Essai Ralston (Connacht) 0-5
    { minute: 6, type: "ESSAI", playerId: null, isUsap: false, description: "Essai de Byron Ralston (Connacht)" },
    // 7' - Transformation Carty (Connacht) 0-7
    { minute: 7, type: "TRANSFORMATION", playerId: null, isUsap: false, description: "Transformation de Jack Carty (Connacht)" },
    // 11' - Essai de Buitlear (Connacht) 0-12
    { minute: 11, type: "ESSAI", playerId: null, isUsap: false, description: "Essai d'Eoin de Buitlear (Connacht)" },
    // 12' - Transformation Carty (Connacht) 0-14
    { minute: 12, type: "TRANSFORMATION", playerId: null, isUsap: false, description: "Transformation de Jack Carty (Connacht)" },
    // 18' - Essai Boyer Gallardo (USAP) 5-14
    { minute: 18, type: "ESSAI", playerId: boyerGallardoId, isUsap: true, description: "Essai de Lorenço Boyer Gallardo" },
    // 28' - Pénalité Aucagne (USAP) 8-14
    { minute: 28, type: "PENALITE", playerId: aucagneId, isUsap: true, description: "Pénalité d'Antoine Aucagne" },
    // 37' - Essai Mullins (Connacht) 8-19
    { minute: 37, type: "ESSAI", playerId: null, isUsap: false, description: "Essai de Chay Mullins (Connacht)" },

    // === Mi-temps : USAP 8 - Connacht 19 ===

    // === 2ème mi-temps ===
    // 45' - Pénalité Aucagne (USAP) 11-19
    { minute: 45, type: "PENALITE", playerId: aucagneId, isUsap: true, description: "Pénalité d'Antoine Aucagne" },
    // 51' - Essai Joseph (USAP) 16-19
    { minute: 51, type: "ESSAI", playerId: josephId, isUsap: true, description: "Essai de Jefferson-Lee Joseph" },
    // 52' - Transformation Aucagne (USAP) 18-19
    { minute: 52, type: "TRANSFORMATION", playerId: aucagneId, isUsap: true, description: "Transformation d'Antoine Aucagne" },

    // --- Remplacements 52' ---
    // 52' - Dvali → Fa'aso'o
    { minute: 52, type: "REMPLACEMENT_SORTIE", playerId: dvaliId, isUsap: true, description: "Sortie d'Andro Dvali" },
    { minute: 52, type: "REMPLACEMENT_ENTREE", playerId: faasooId, isUsap: true, description: "Entrée de So'otala Fa'aso'o pour Dvali" },

    // --- Remplacements 54' ---
    // 54' - Hall → Aprasidze
    { minute: 54, type: "REMPLACEMENT_SORTIE", playerId: hallId, isUsap: true, description: "Sortie de James Hall" },
    { minute: 54, type: "REMPLACEMENT_ENTREE", playerId: aprasidzeId, isUsap: true, description: "Entrée de Gela Aprasidze pour Hall" },
    // 54' - Aucagne → Allan
    { minute: 54, type: "REMPLACEMENT_SORTIE", playerId: aucagneId, isUsap: true, description: "Sortie d'Antoine Aucagne" },
    { minute: 54, type: "REMPLACEMENT_ENTREE", playerId: allanId, isUsap: true, description: "Entrée de Tommaso Allan pour Aucagne" },

    // 56' - Carton jaune Warion
    { minute: 56, type: "CARTON_JAUNE", playerId: warionId, isUsap: true, description: "Carton jaune pour Adrien Warion" },

    // 58' - Essai Boyle (Connacht, profitant de la supériorité numérique) 18-24
    { minute: 58, type: "ESSAI", playerId: null, isUsap: false, description: "Essai de Paul Boyle (Connacht)" },
    // 58' - Transformation Carty (Connacht) 18-26
    { minute: 58, type: "TRANSFORMATION", playerId: null, isUsap: false, description: "Transformation de Jack Carty (Connacht)" },

    // --- Remplacements 61' (triple changement) ---
    // 61' - Boyer Gallardo → Brookes
    { minute: 61, type: "REMPLACEMENT_SORTIE", playerId: boyerGallardoId, isUsap: true, description: "Sortie de Lorenço Boyer Gallardo" },
    { minute: 61, type: "REMPLACEMENT_ENTREE", playerId: brookesId, isUsap: true, description: "Entrée de Kieran Brookes pour Boyer Gallardo" },
    // 61' - Lam → Montgaillard
    { minute: 61, type: "REMPLACEMENT_SORTIE", playerId: lamId, isUsap: true, description: "Sortie de Seilala Lam" },
    { minute: 61, type: "REMPLACEMENT_ENTREE", playerId: montgaillardId, isUsap: true, description: "Entrée de Victor Montgaillard pour Lam" },
    // 61' - Buliruarua → Duguivalu
    { minute: 61, type: "REMPLACEMENT_SORTIE", playerId: buliruaruaId, isUsap: true, description: "Sortie d'Eneriko Buliruarua" },
    { minute: 61, type: "REMPLACEMENT_ENTREE", playerId: duguivaluId, isUsap: true, description: "Entrée de Freddy Duguivalu pour Buliruarua" },

    // --- Remplacement 66' ---
    // 66' - Hicks → Chinarro
    { minute: 66, type: "REMPLACEMENT_SORTIE", playerId: hicksId, isUsap: true, description: "Sortie de Max Hicks" },
    { minute: 66, type: "REMPLACEMENT_ENTREE", playerId: chinarroId, isUsap: true, description: "Entrée de Bastien Chinarro pour Hicks" },

    // --- Remplacement 77' ---
    // 77' - Roelofse → Barcenilla
    { minute: 77, type: "REMPLACEMENT_SORTIE", playerId: roelofseId, isUsap: true, description: "Sortie de Nemo Roelofse" },
    { minute: 77, type: "REMPLACEMENT_ENTREE", playerId: barcenillaId, isUsap: true, description: "Entrée de Joan Barcenilla D'Onghia pour Roelofse" },

    // 79' - Essai McBurney (Connacht) 18-31
    { minute: 79, type: "ESSAI", playerId: null, isUsap: false, description: "Essai d'Adam McBurney (Connacht)" },
  ];

  for (const e of events) {
    await prisma.matchEvent.create({
      data: {
        matchId: MATCH_ID,
        minute: e.minute,
        type: e.type,
        playerId: e.playerId,
        isUsap: e.isUsap,
        description: e.description,
      },
    });
  }
  console.log(`  ${events.length} événements créés ✓`);

  // ---------------------------------------------------------------
  // 6. Vérification finale
  // ---------------------------------------------------------------
  console.log("\n--- Vérification ---");

  const match = await prisma.match.findUnique({
    where: { id: MATCH_ID },
    include: {
      players: { orderBy: { shirtNumber: "asc" } },
      matchEvents: { orderBy: { minute: "asc" } },
      referee: true,
    },
  });

  console.log(`  Score : USAP ${match!.scoreUsap} - ${match!.scoreOpponent} Connacht`);
  console.log(`  Mi-temps : USAP ${match!.halfTimeUsap} - ${match!.halfTimeOpponent} Connacht`);
  console.log(`  Joueurs : ${match!.players.length}`);
  console.log(`  Events : ${match!.matchEvents.length}`);
  console.log(`  Arbitre : ${match!.referee?.firstName} ${match!.referee?.lastName}`);
  console.log(`  Affluence : ${match!.attendance}`);

  // Vérification des points
  const usapPoints = match!.players.reduce((sum: number, p: any) => sum + p.totalPoints, 0);
  console.log(`  Total points joueurs USAP : ${usapPoints} (attendu : 18)`);

  console.log("\n=== Terminé ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

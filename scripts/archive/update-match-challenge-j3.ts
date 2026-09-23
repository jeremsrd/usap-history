/**
 * Script de mise à jour du match USAP - Cardiff Rugby (Challenge Cup Poule J3, 11/01/2025)
 * Score final : USAP 23 - Cardiff 20
 * Mi-temps : USAP 10 - Cardiff 3
 *
 * Match disputé au Stade Aimé-Giral. Première victoire européenne de l'USAP en 3 ans.
 * Vent fort (Tramontane) perturbant le jeu au pied. Allan ouvre le score sur pénalité (4')
 * puis inscrit l'essai du break à la 40' (10-3 à la pause). Cardiff revient à 10-10 (43'-44')
 * mais l'USAP creuse l'écart : penalty Allan (49'), essais Veredamu (50') et Velarte (62')
 * portent le score à 23-13. Carton jaune McIntyre (65'), Mulder réduit l'écart (69', 23-20).
 * L'USAP tient bon malgré l'infériorité numérique. De la Fuente capitaine.
 * Arbitre : Gianluca Gnecchi (Italie).
 *
 * Sources : epcrugby.com, espn.com, itsrugby.fr, francebleu.fr, skysports.com
 *
 * Exécution : npx tsx scripts/update-match-challenge-j3.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsqy00411umrpdu82xuc";

async function main() {
  console.log("=== Mise à jour match USAP - Cardiff (Challenge Cup J3, 11/01/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Création de l'arbitre si nécessaire
  // ---------------------------------------------------------------
  console.log("--- Création des données manquantes ---");

  let gnecchi = await prisma.referee.findFirst({ where: { lastName: "Gnecchi" } });
  if (!gnecchi) {
    gnecchi = await prisma.referee.create({
      data: { firstName: "Gianluca", lastName: "Gnecchi", slug: "gianluca-gnecchi" },
    });
    console.log(`  Arbitre créé : Gianluca Gnecchi (${gnecchi.id})`);
  } else {
    console.log(`  Arbitre existant : Gianluca Gnecchi (${gnecchi.id})`);
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
  const beriaId = await getPlayer("Beria");
  const montgaillardId = await getPlayer("Montgaillard");
  const roelofseId = await getPlayer("Roelofse");
  const orieId = await getPlayer("Orie");
  const tanguyId = await getPlayer("Tanguy");
  const dellaSchiavaId = await getPlayer("Della Schiava");
  const ortombinaId = await getPlayer("Ortombina");
  const velarteId = await getPlayer("Velarte");
  const aprasidzeId = await getPlayer("Aprasidze");
  const mcintyreId = await getPlayer("McIntyre");
  const toganiyadravaId = await getPlayer("Toganiyadrava");
  const delaFuenteId = await getPlayer("Fuente");
  const pouletId = await getPlayer("Poulet");
  const veredamuId = await getPlayer("Veredamu");
  const allanId = await getPlayer("Allan", "Tommaso");

  // Remplaçants
  const lamId = await getPlayer("Lam", "Seilala");
  const devauxId = await getPlayer("Devaux");
  const fakatikaId = await getPlayer("Fakatika");
  const labouteleyId = await getPlayer("Labouteley");
  const sobelaId = await getPlayer("Sobela");
  const ecochardId = await getPlayer("Ecochard");
  const aucagneId = await getPlayer("Aucagne");
  const naqalevuId = await getPlayer("Naqalevu");

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
      date: new Date("2025-01-11T14:00:00"),
      venue: { connect: { id: aimeGiral!.id } },
      referee: { connect: { id: gnecchi!.id } },
      // Score final : USAP 23 - Cardiff 20
      scoreUsap: 23,
      scoreOpponent: 20,
      halfTimeUsap: 10,
      halfTimeOpponent: 3,
      // Détail points USAP : 3 essais, 1 transformation, 2 pénalités
      triesUsap: 3,
      conversionsUsap: 1,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      // Détail points adversaire : 2 essais, 2 transformations, 2 pénalités
      triesOpponent: 2,
      conversionsOpponent: 2,
      penaltiesOpponent: 2,
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
    { playerId: beriaId, shirtNumber: 1, positionPlayed: "PILIER_GAUCHE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 54, subIn: null as number | null, subOut: 54 as number | null },
    { playerId: montgaillardId, shirtNumber: 2, positionPlayed: "TALONNEUR", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 54, subIn: null as number | null, subOut: 54 as number | null },
    { playerId: roelofseId, shirtNumber: 3, positionPlayed: "PILIER_DROIT", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 59, subIn: null as number | null, subOut: 59 as number | null },
    { playerId: orieId, shirtNumber: 4, positionPlayed: "DEUXIEME_LIGNE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 59, subIn: null as number | null, subOut: 59 as number | null },
    { playerId: tanguyId, shirtNumber: 5, positionPlayed: "DEUXIEME_LIGNE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: dellaSchiavaId, shirtNumber: 6, positionPlayed: "TROISIEME_LIGNE_AILE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: ortombinaId, shirtNumber: 7, positionPlayed: "TROISIEME_LIGNE_AILE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: velarteId, shirtNumber: 8, positionPlayed: "NUMERO_HUIT", isStarter: true, isCaptain: false, tries: 1, conversions: 0, penalties: 0, totalPoints: 5, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: aprasidzeId, shirtNumber: 9, positionPlayed: "DEMI_DE_MELEE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 59, subIn: null as number | null, subOut: 59 as number | null },
    { playerId: mcintyreId, shirtNumber: 10, positionPlayed: "DEMI_OUVERTURE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: toganiyadravaId, shirtNumber: 11, positionPlayed: "AILIER", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: delaFuenteId, shirtNumber: 12, positionPlayed: "CENTRE", isStarter: true, isCaptain: true, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: pouletId, shirtNumber: 13, positionPlayed: "CENTRE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: veredamuId, shirtNumber: 14, positionPlayed: "AILIER", isStarter: true, isCaptain: false, tries: 1, conversions: 0, penalties: 0, totalPoints: 5, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: allanId, shirtNumber: 15, positionPlayed: "ARRIERE", isStarter: true, isCaptain: false, tries: 1, conversions: 1, penalties: 2, totalPoints: 13, minutesPlayed: 59, subIn: null as number | null, subOut: 59 as number | null },

    // Remplaçants
    { playerId: lamId, shirtNumber: 16, positionPlayed: "TALONNEUR", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 26, subIn: 54 as number | null, subOut: null as number | null },
    { playerId: devauxId, shirtNumber: 17, positionPlayed: "PILIER_GAUCHE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 26, subIn: 54 as number | null, subOut: null as number | null },
    { playerId: fakatikaId, shirtNumber: 18, positionPlayed: "PILIER_DROIT", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 21, subIn: 59 as number | null, subOut: null as number | null },
    { playerId: labouteleyId, shirtNumber: 19, positionPlayed: "DEUXIEME_LIGNE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 21, subIn: 59 as number | null, subOut: null as number | null },
    { playerId: sobelaId, shirtNumber: 20, positionPlayed: "TROISIEME_LIGNE_AILE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 0, subIn: null as number | null, subOut: null as number | null },
    { playerId: ecochardId, shirtNumber: 21, positionPlayed: "DEMI_DE_MELEE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 21, subIn: 59 as number | null, subOut: null as number | null },
    { playerId: aucagneId, shirtNumber: 22, positionPlayed: "DEMI_OUVERTURE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 21, subIn: 59 as number | null, subOut: null as number | null },
    { playerId: naqalevuId, shirtNumber: 23, positionPlayed: "CENTRE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 0, subIn: null as number | null, subOut: null as number | null },
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
    // 4' - Pénalité Allan (USAP) 3-0
    { minute: 4, type: "PENALITE", playerId: allanId, isUsap: true, description: "Pénalité de Tommaso Allan" },
    // 36' - Pénalité de Beer (Cardiff) 3-3
    { minute: 36, type: "PENALITE", playerId: null, isUsap: false, description: "Pénalité de Tinus de Beer (Cardiff)" },
    // 40' - Essai Allan (USAP) 8-3
    { minute: 40, type: "ESSAI", playerId: allanId, isUsap: true, description: "Essai de Tommaso Allan" },
    // 42' - Transformation Allan (USAP) 10-3
    { minute: 42, type: "TRANSFORMATION", playerId: allanId, isUsap: true, description: "Transformation de Tommaso Allan" },

    // === Mi-temps : USAP 10 - Cardiff 3 ===

    // === 2ème mi-temps ===
    // 43' - Essai Lee-Lo (Cardiff) 10-8
    { minute: 43, type: "ESSAI", playerId: null, isUsap: false, description: "Essai de Rey Lee-Lo (Cardiff)" },
    // 44' - Transformation de Beer (Cardiff) 10-10
    { minute: 44, type: "TRANSFORMATION", playerId: null, isUsap: false, description: "Transformation de Tinus de Beer (Cardiff)" },
    // 49' - Pénalité Allan (USAP) 13-10
    { minute: 49, type: "PENALITE", playerId: allanId, isUsap: true, description: "Pénalité de Tommaso Allan" },
    // 50' - Essai Veredamu (USAP) 18-10
    { minute: 50, type: "ESSAI", playerId: veredamuId, isUsap: true, description: "Essai de Tavite Veredamu" },

    // --- Remplacements 54' ---
    // 54' - Montgaillard → Lam
    { minute: 54, type: "REMPLACEMENT_SORTIE", playerId: montgaillardId, isUsap: true, description: "Sortie de Victor Montgaillard" },
    { minute: 54, type: "REMPLACEMENT_ENTREE", playerId: lamId, isUsap: true, description: "Entrée de Seilala Lam pour Montgaillard" },
    // 54' - Beria → Devaux
    { minute: 54, type: "REMPLACEMENT_SORTIE", playerId: beriaId, isUsap: true, description: "Sortie de Giorgi Beria" },
    { minute: 54, type: "REMPLACEMENT_ENTREE", playerId: devauxId, isUsap: true, description: "Entrée de Bruce Devaux pour Beria" },

    // 54' - Pénalité de Beer (Cardiff) 18-13
    { minute: 54, type: "PENALITE", playerId: null, isUsap: false, description: "Pénalité de Tinus de Beer (Cardiff)" },

    // --- Remplacements 59' (quadruple changement) ---
    // 59' - Roelofse → Fakatika
    { minute: 59, type: "REMPLACEMENT_SORTIE", playerId: roelofseId, isUsap: true, description: "Sortie de Nemo Roelofse" },
    { minute: 59, type: "REMPLACEMENT_ENTREE", playerId: fakatikaId, isUsap: true, description: "Entrée d'Akato Fakatika pour Roelofse" },
    // 59' - Allan → Aucagne
    { minute: 59, type: "REMPLACEMENT_SORTIE", playerId: allanId, isUsap: true, description: "Sortie de Tommaso Allan" },
    { minute: 59, type: "REMPLACEMENT_ENTREE", playerId: aucagneId, isUsap: true, description: "Entrée d'Antoine Aucagne pour Allan" },
    // 59' - Aprasidze → Ecochard
    { minute: 59, type: "REMPLACEMENT_SORTIE", playerId: aprasidzeId, isUsap: true, description: "Sortie de Gela Aprasidze" },
    { minute: 59, type: "REMPLACEMENT_ENTREE", playerId: ecochardId, isUsap: true, description: "Entrée de Tom Ecochard pour Aprasidze" },
    // 59' - Orie → Labouteley
    { minute: 59, type: "REMPLACEMENT_SORTIE", playerId: orieId, isUsap: true, description: "Sortie de Marvin Orie" },
    { minute: 59, type: "REMPLACEMENT_ENTREE", playerId: labouteleyId, isUsap: true, description: "Entrée de Tristan Labouteley pour Orie" },

    // 62' - Essai Velarte (USAP, sur mêlée dominante) 23-13
    { minute: 62, type: "ESSAI", playerId: velarteId, isUsap: true, description: "Essai de Lucas Velarte sur mêlée dominante" },

    // 65' - Carton jaune McIntyre (USAP)
    { minute: 65, type: "CARTON_JAUNE", playerId: mcintyreId, isUsap: true, description: "Carton jaune pour Jake McIntyre" },

    // 69' - Essai Mulder (Cardiff, profitant de la supériorité numérique) 23-18
    { minute: 69, type: "ESSAI", playerId: null, isUsap: false, description: "Essai de Johan Mulder (Cardiff)" },
    // 70' - Transformation de Beer (Cardiff) 23-20
    { minute: 70, type: "TRANSFORMATION", playerId: null, isUsap: false, description: "Transformation de Tinus de Beer (Cardiff)" },
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

  console.log(`  Score : USAP ${match!.scoreUsap} - ${match!.scoreOpponent} Cardiff`);
  console.log(`  Mi-temps : USAP ${match!.halfTimeUsap} - ${match!.halfTimeOpponent} Cardiff`);
  console.log(`  Joueurs : ${match!.players.length}`);
  console.log(`  Events : ${match!.matchEvents.length}`);
  console.log(`  Arbitre : ${match!.referee?.firstName} ${match!.referee?.lastName}`);

  // Vérification des points
  const usapPoints = match!.players.reduce((sum: number, p: any) => sum + p.totalPoints, 0);
  console.log(`  Total points joueurs USAP : ${usapPoints} (attendu : 23)`);

  console.log("\n=== Terminé ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

/**
 * Script de mise à jour du match Zebre Parme - USAP (Challenge Cup Poule J4, 19/01/2025)
 * Score final : Zebre 21 - USAP 39
 * Mi-temps : Zebre 7 - USAP 14
 *
 * Match disputé au Stadio Sergio Lanfranchi à Parme. Large victoire de l'USAP qui
 * décroche sa qualification en huitièmes de finale à domicile. Aucagne impérial au
 * pied (5 pénalités + 2 transformations = 19 pts). Doublé de Naqalevu (56', 71').
 * Bonus offensif acquis dans les 10 dernières minutes grâce aux essais de Naqalevu
 * et Toganiyadrava (75'). McIntyre sort à la mi-temps, remplacé par Barraque.
 * Montgaillard capitaine. Lotrian non utilisé sur le banc.
 * Arbitre : Eoghan Cross (Irlande). Affluence : 1 817.
 *
 * Sources : epcrugby.com, itsrugby.fr, francebleu.fr, espn.com
 *
 * Exécution : npx tsx scripts/update-match-challenge-j4.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsru00431umr5r1mqzfc";

async function main() {
  console.log("=== Mise à jour match Zebre - USAP (Challenge Cup J4, 19/01/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Création des données manquantes
  // ---------------------------------------------------------------
  console.log("--- Création des données manquantes ---");

  // Venue : Stadio Sergio Lanfranchi (Parme)
  const italy = await prisma.country.findFirst({ where: { code: "IT" } });
  let lanfranchi = await prisma.venue.findFirst({ where: { name: { contains: "Lanfranchi" } } });
  if (!lanfranchi) {
    lanfranchi = await prisma.venue.create({
      data: {
        name: "Stadio Sergio Lanfranchi",
        slug: "stadio-sergio-lanfranchi",
        city: "Parme",
        capacity: 5000,
        countryId: italy!.id,
      },
    });
    console.log(`  Venue créé : ${lanfranchi.name} (${lanfranchi.id})`);
  } else {
    console.log(`  Venue existant : ${lanfranchi.name}`);
  }

  // Arbitre : Eoghan Cross (Irlande)
  let cross = await prisma.referee.findFirst({ where: { lastName: "Cross" } });
  if (!cross) {
    cross = await prisma.referee.create({
      data: { firstName: "Eoghan", lastName: "Cross", slug: "eoghan-cross" },
    });
    console.log(`  Arbitre créé : Eoghan Cross (${cross.id})`);
  } else {
    console.log(`  Arbitre existant : Eoghan Cross (${cross.id})`);
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
  const devauxId = await getPlayer("Devaux");
  const montgaillardId = await getPlayer("Montgaillard");
  const roelofseId = await getPlayer("Roelofse");
  const orieId = await getPlayer("Orie");
  const tanguyId = await getPlayer("Tanguy");
  const dellaSchiavaId = await getPlayer("Della Schiava");
  const sobelaId = await getPlayer("Sobela");
  const ortombinaId = await getPlayer("Ortombina");
  const aprasidzeId = await getPlayer("Aprasidze");
  const mcintyreId = await getPlayer("McIntyre");
  const toganiyadravaId = await getPlayer("Toganiyadrava");
  const naqalevuId = await getPlayer("Naqalevu");
  const buliruaruaId = await getPlayer("Buliruarua");
  const josephId = await getPlayer("Joseph", "Jefferson");
  const aucagneId = await getPlayer("Aucagne");

  // Remplaçants
  const lotrianId = await getPlayer("Lotrian", "Mathys");
  const beriaId = await getPlayer("Beria");
  const fakatikaId = await getPlayer("Fakatika");
  const chinarroId = await getPlayer("Chinarro");
  const bachelierId = await getPlayer("Bachelier");
  const hallId = await getPlayer("Hall", "James");
  const pouletId = await getPlayer("Poulet");
  const barraqueId = await getPlayer("Barraqué");

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

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-01-19T15:15:00"),
      venue: { connect: { id: lanfranchi!.id } },
      referee: { connect: { id: cross!.id } },
      attendance: 1817,
      // Score final : Zebre 21 - USAP 39
      scoreUsap: 39,
      scoreOpponent: 21,
      halfTimeUsap: 14,
      halfTimeOpponent: 7,
      // Détail points USAP : 4 essais, 2 transformations, 5 pénalités
      triesUsap: 4,
      conversionsUsap: 2,
      penaltiesUsap: 5,
      dropGoalsUsap: 0,
      // Détail points adversaire : 3 essais, 3 transformations
      triesOpponent: 3,
      conversionsOpponent: 3,
      penaltiesOpponent: 0,
      dropGoalsOpponent: 0,
      // Bonus offensif (4+ essais)
      bonusOffensif: true,
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
    { playerId: devauxId, shirtNumber: 1, positionPlayed: "PILIER_GAUCHE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 61, subIn: null as number | null, subOut: 61 as number | null },
    { playerId: montgaillardId, shirtNumber: 2, positionPlayed: "TALONNEUR", isStarter: true, isCaptain: true, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: roelofseId, shirtNumber: 3, positionPlayed: "PILIER_DROIT", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 61, subIn: null as number | null, subOut: 61 as number | null },
    { playerId: orieId, shirtNumber: 4, positionPlayed: "DEUXIEME_LIGNE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: tanguyId, shirtNumber: 5, positionPlayed: "DEUXIEME_LIGNE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: dellaSchiavaId, shirtNumber: 6, positionPlayed: "TROISIEME_LIGNE_AILE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 58, subIn: null as number | null, subOut: 58 as number | null },
    { playerId: sobelaId, shirtNumber: 7, positionPlayed: "TROISIEME_LIGNE_AILE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 67, subIn: null as number | null, subOut: 67 as number | null },
    { playerId: ortombinaId, shirtNumber: 8, positionPlayed: "NUMERO_HUIT", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: aprasidzeId, shirtNumber: 9, positionPlayed: "DEMI_DE_MELEE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 61, subIn: null as number | null, subOut: 61 as number | null },
    { playerId: mcintyreId, shirtNumber: 10, positionPlayed: "DEMI_OUVERTURE", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 40, subIn: null as number | null, subOut: 40 as number | null },
    { playerId: toganiyadravaId, shirtNumber: 11, positionPlayed: "AILIER", isStarter: true, isCaptain: false, tries: 1, conversions: 0, penalties: 0, totalPoints: 5, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: naqalevuId, shirtNumber: 12, positionPlayed: "CENTRE", isStarter: true, isCaptain: false, tries: 2, conversions: 0, penalties: 0, totalPoints: 10, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: buliruaruaId, shirtNumber: 13, positionPlayed: "CENTRE", isStarter: true, isCaptain: false, tries: 1, conversions: 0, penalties: 0, totalPoints: 5, minutesPlayed: 58, subIn: null as number | null, subOut: 58 as number | null },
    { playerId: josephId, shirtNumber: 14, positionPlayed: "AILIER", isStarter: true, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },
    { playerId: aucagneId, shirtNumber: 15, positionPlayed: "ARRIERE", isStarter: true, isCaptain: false, tries: 0, conversions: 2, penalties: 5, totalPoints: 19, minutesPlayed: 80, subIn: null as number | null, subOut: null as number | null },

    // Remplaçants
    { playerId: lotrianId, shirtNumber: 16, positionPlayed: "TALONNEUR", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 0, subIn: null as number | null, subOut: null as number | null },
    { playerId: beriaId, shirtNumber: 17, positionPlayed: "PILIER_GAUCHE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 19, subIn: 61 as number | null, subOut: null as number | null },
    { playerId: fakatikaId, shirtNumber: 18, positionPlayed: "PILIER_DROIT", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 19, subIn: 61 as number | null, subOut: null as number | null },
    { playerId: chinarroId, shirtNumber: 19, positionPlayed: "TROISIEME_LIGNE_AILE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 13, subIn: 67 as number | null, subOut: null as number | null },
    { playerId: bachelierId, shirtNumber: 20, positionPlayed: "TROISIEME_LIGNE_AILE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 22, subIn: 58 as number | null, subOut: null as number | null },
    { playerId: hallId, shirtNumber: 21, positionPlayed: "DEMI_DE_MELEE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 19, subIn: 61 as number | null, subOut: null as number | null },
    { playerId: pouletId, shirtNumber: 22, positionPlayed: "CENTRE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 22, subIn: 58 as number | null, subOut: null as number | null },
    { playerId: barraqueId, shirtNumber: 23, positionPlayed: "DEMI_OUVERTURE", isStarter: false, isCaptain: false, tries: 0, conversions: 0, penalties: 0, totalPoints: 0, minutesPlayed: 40, subIn: 40 as number | null, subOut: null as number | null },
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
    // 8' - Pénalité Aucagne (USAP) 0-3
    { minute: 8, type: "PENALITE", playerId: aucagneId, isUsap: true, description: "Pénalité d'Antoine Aucagne" },
    // 15' - Pénalité Aucagne (USAP) 0-6
    { minute: 15, type: "PENALITE", playerId: aucagneId, isUsap: true, description: "Pénalité d'Antoine Aucagne" },
    // 19' - Essai Buliruarua (USAP) 0-11
    { minute: 19, type: "ESSAI", playerId: buliruaruaId, isUsap: true, description: "Essai d'Eneriko Buliruarua" },
    // 28' - Pénalité Aucagne (USAP) 0-14
    { minute: 28, type: "PENALITE", playerId: aucagneId, isUsap: true, description: "Pénalité d'Antoine Aucagne" },
    // 35' - Essai Gregory (Zebre) 5-14
    { minute: 35, type: "ESSAI", playerId: null, isUsap: false, description: "Essai de Scott Gregory (Zebre)" },
    // 35' - Transformation Dominguez (Zebre) 7-14
    { minute: 35, type: "TRANSFORMATION", playerId: null, isUsap: false, description: "Transformation de Thomas Dominguez (Zebre)" },

    // === Mi-temps : Zebre 7 - USAP 14 ===

    // --- Remplacement 40' (mi-temps) ---
    // 40' - McIntyre → Barraque
    { minute: 40, type: "REMPLACEMENT_SORTIE", playerId: mcintyreId, isUsap: true, description: "Sortie de Jake McIntyre à la mi-temps" },
    { minute: 40, type: "REMPLACEMENT_ENTREE", playerId: barraqueId, isUsap: true, description: "Entrée de Jean-Pascal Barraque pour McIntyre" },

    // === 2ème mi-temps ===
    // 51' - Pénalité Aucagne (USAP) 7-17
    { minute: 51, type: "PENALITE", playerId: aucagneId, isUsap: true, description: "Pénalité d'Antoine Aucagne" },
    // 52' - Essai Licata (Zebre) 12-17
    { minute: 52, type: "ESSAI", playerId: null, isUsap: false, description: "Essai de Giovanni Licata (Zebre)" },
    // 52' - Transformation Montemauri (Zebre) 14-17
    { minute: 52, type: "TRANSFORMATION", playerId: null, isUsap: false, description: "Transformation de Giovanni Montemauri (Zebre)" },
    // 56' - Essai Naqalevu (USAP) 14-22
    { minute: 56, type: "ESSAI", playerId: naqalevuId, isUsap: true, description: "Essai d'Apisai Naqalevu" },
    // 56' - Transformation Aucagne (USAP) 14-24
    { minute: 56, type: "TRANSFORMATION", playerId: aucagneId, isUsap: true, description: "Transformation d'Antoine Aucagne" },

    // --- Remplacements 58' ---
    // 58' - Buliruarua → Poulet
    { minute: 58, type: "REMPLACEMENT_SORTIE", playerId: buliruaruaId, isUsap: true, description: "Sortie d'Eneriko Buliruarua" },
    { minute: 58, type: "REMPLACEMENT_ENTREE", playerId: pouletId, isUsap: true, description: "Entrée de Job Poulet pour Buliruarua" },
    // 58' - Della Schiava → Bachelier
    { minute: 58, type: "REMPLACEMENT_SORTIE", playerId: dellaSchiavaId, isUsap: true, description: "Sortie de Noé Della Schiava" },
    { minute: 58, type: "REMPLACEMENT_ENTREE", playerId: bachelierId, isUsap: true, description: "Entrée de Lucas Bachelier pour Della Schiava" },

    // --- Remplacements 61' (triple changement) ---
    // 61' - Devaux → Beria
    { minute: 61, type: "REMPLACEMENT_SORTIE", playerId: devauxId, isUsap: true, description: "Sortie de Bruce Devaux" },
    { minute: 61, type: "REMPLACEMENT_ENTREE", playerId: beriaId, isUsap: true, description: "Entrée de Giorgi Beria pour Devaux" },
    // 61' - Roelofse → Fakatika
    { minute: 61, type: "REMPLACEMENT_SORTIE", playerId: roelofseId, isUsap: true, description: "Sortie de Nemo Roelofse" },
    { minute: 61, type: "REMPLACEMENT_ENTREE", playerId: fakatikaId, isUsap: true, description: "Entrée d'Akato Fakatika pour Roelofse" },
    // 61' - Aprasidze → Hall
    { minute: 61, type: "REMPLACEMENT_SORTIE", playerId: aprasidzeId, isUsap: true, description: "Sortie de Gela Aprasidze" },
    { minute: 61, type: "REMPLACEMENT_ENTREE", playerId: hallId, isUsap: true, description: "Entrée de James Hall pour Aprasidze" },

    // 66' - Essai Nasove (Zebre) 19-24
    { minute: 66, type: "ESSAI", playerId: null, isUsap: false, description: "Essai de Rusiate Nasove (Zebre)" },
    // 66' - Transformation Montemauri (Zebre) 21-24
    { minute: 66, type: "TRANSFORMATION", playerId: null, isUsap: false, description: "Transformation de Giovanni Montemauri (Zebre)" },

    // --- Remplacement 67' ---
    // 67' - Sobela → Chinarro
    { minute: 67, type: "REMPLACEMENT_SORTIE", playerId: sobelaId, isUsap: true, description: "Sortie de Patrick Sobela" },
    { minute: 67, type: "REMPLACEMENT_ENTREE", playerId: chinarroId, isUsap: true, description: "Entrée de Bastien Chinarro pour Sobela" },

    // 71' - Essai Naqalevu (USAP, doublé) 21-29
    { minute: 71, type: "ESSAI", playerId: naqalevuId, isUsap: true, description: "Essai d'Apisai Naqalevu (doublé)" },
    // 71' - Transformation Aucagne (USAP) 21-31
    { minute: 71, type: "TRANSFORMATION", playerId: aucagneId, isUsap: true, description: "Transformation d'Antoine Aucagne" },
    // 75' - Essai Toganiyadrava (USAP, bonus offensif !) 21-36
    { minute: 75, type: "ESSAI", playerId: toganiyadravaId, isUsap: true, description: "Essai de Setareki Toganiyadrava, bonus offensif acquis" },
    // 80' - Pénalité Aucagne (USAP) 21-39
    { minute: 80, type: "PENALITE", playerId: aucagneId, isUsap: true, description: "Pénalité d'Antoine Aucagne" },
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

  console.log(`  Score : Zebre ${match!.scoreOpponent} - USAP ${match!.scoreUsap}`);
  console.log(`  Mi-temps : Zebre ${match!.halfTimeOpponent} - USAP ${match!.halfTimeUsap}`);
  console.log(`  Joueurs : ${match!.players.length}`);
  console.log(`  Events : ${match!.matchEvents.length}`);
  console.log(`  Arbitre : ${match!.referee?.firstName} ${match!.referee?.lastName}`);
  console.log(`  Affluence : ${match!.attendance}`);
  console.log(`  Bonus offensif : ${match!.bonusOffensif}`);

  // Vérification des points
  const usapPoints = match!.players.reduce((sum: number, p: any) => sum + p.totalPoints, 0);
  console.log(`  Total points joueurs USAP : ${usapPoints} (attendu : 39)`);

  console.log("\n=== Terminé ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

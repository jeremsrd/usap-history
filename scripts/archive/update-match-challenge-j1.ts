/**
 * Script de mise à jour du match Toyota Cheetahs - USAP (Challenge Cup Poule J1, 08/12/2024)
 * Score final : Cheetahs 20 - USAP 20
 * Mi-temps : Cheetahs 10 - USAP 17
 *
 * Match disputé au NRCA Stadium d'Amsterdam (terrain neutre des Cheetahs en Europe).
 * Large turnover de l'USAP (13 changements vs Toulon) avec des premières pro pour
 * Ortombina, Toganiyadrava et Barcenilla. L'USAP mène 17-10 à la pause grâce aux
 * essais d'Aucagne (5'), Toganiyadrava (31') et Poulet (40'). Les Cheetahs reviennent
 * à 20-17 en 2e MT (Maartens 65' + Wentzel pen 79'). Aucagne sauve le match nul
 * sur pénalité à l'ultime seconde (80', 20-20). Tanguy sort dès la 18' (blessure).
 *
 * Sources : allrugby.com, espn.com, francebleu.fr, epcrugby.com
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-challenge-j1.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsp9003x1umrv4hf1i31";

async function main() {
  console.log("=== Mise à jour match Cheetahs - USAP (Challenge Cup J1, 08/12/2024) ===\n");

  // ---------------------------------------------------------------
  // 0. Création des joueurs et venue manquants
  // ---------------------------------------------------------------
  console.log("--- Création des données manquantes ---");

  const france = await prisma.country.findFirst({ where: { code: "FR" } });
  const season = await prisma.season.findFirst({ where: { label: "2024-2025" } });

  // Venue NRCA Stadium Amsterdam
  let venue = await prisma.venue.findFirst({ where: { name: { contains: "NRCA" } } });
  if (!venue) {
    const netherlands = await prisma.country.findFirst({ where: { code: "NL" } });
    // Créer les Pays-Bas si nécessaire
    let nlId: string;
    if (!netherlands) {
      const nl = await prisma.country.create({
        data: { name: "Pays-Bas", code: "NL", continent: "EUROPE" },
      });
      nlId = nl.id;
      console.log("  Pays créé : Pays-Bas");
    } else {
      nlId = netherlands.id;
    }
    venue = await prisma.venue.create({
      data: {
        name: "NRCA Stadium",
        slug: "nrca-stadium-amsterdam",
        city: "Amsterdam",
        capacity: 4500,
        countryId: nlId,
      },
    });
    console.log(`  Venue créé : ${venue.name} (${venue.id})`);
  } else {
    console.log(`  Venue existant : ${venue.name}`);
  }

  // Joueur : Bastien Chinarro
  let chinarro = await prisma.player.findFirst({ where: { lastName: { contains: "Chinarro" } } });
  if (!chinarro) {
    chinarro = await prisma.player.create({
      data: {
        firstName: "Bastien", lastName: "Chinarro",
        slug: "bastien-chinarro",
        position: "DEUXIEME_LIGNE",
        birthDate: new Date("1998-09-15"),
        nationalityId: france!.id,
      },
    });
    await prisma.seasonPlayer.create({
      data: { seasonId: season!.id, playerId: chinarro.id, position: "DEUXIEME_LIGNE" },
    });
    console.log(`  Joueur créé : Bastien Chinarro (${chinarro.id})`);
  } else {
    console.log(`  Joueur existant : Chinarro`);
  }

  // Joueur : Setareki Toganiyadrava
  let toganiyadrava = await prisma.player.findFirst({ where: { lastName: { contains: "Toganiyadrava" } } });
  if (!toganiyadrava) {
    const fiji = await prisma.country.findFirst({ where: { code: "FJ" } });
    let fjId: string;
    if (!fiji) {
      const fj = await prisma.country.create({
        data: { name: "Fidji", code: "FJ", continent: "OCEANIE" },
      });
      fjId = fj.id;
      console.log("  Pays créé : Fidji");
    } else {
      fjId = fiji.id;
    }
    toganiyadrava = await prisma.player.create({
      data: {
        firstName: "Setareki", lastName: "Toganiyadrava",
        slug: "setareki-toganiyadrava",
        position: "AILIER",
        nationalityId: fjId,
      },
    });
    await prisma.seasonPlayer.create({
      data: { seasonId: season!.id, playerId: toganiyadrava.id, position: "AILIER" },
    });
    console.log(`  Joueur créé : Setareki Toganiyadrava (${toganiyadrava.id})`);
  } else {
    console.log(`  Joueur existant : Toganiyadrava`);
  }

  // Joueur : Joan Barcenilla D'Onghia
  let barcenilla = await prisma.player.findFirst({ where: { lastName: { contains: "Barcenilla" } } });
  if (!barcenilla) {
    barcenilla = await prisma.player.create({
      data: {
        firstName: "Joan", lastName: "Barcenilla D'Onghia",
        slug: "joan-barcenilla-donghia",
        position: "PILIER_GAUCHE",
        nationalityId: france!.id,
      },
    });
    await prisma.seasonPlayer.create({
      data: { seasonId: season!.id, playerId: barcenilla.id, position: "PILIER_GAUCHE" },
    });
    console.log(`  Joueur créé : Joan Barcenilla D'Onghia (${barcenilla.id})`);
  } else {
    console.log(`  Joueur existant : Barcenilla`);
  }

  // ---------------------------------------------------------------
  // IDs des joueurs
  // ---------------------------------------------------------------
  const PLAYER_IDS: Record<string, string> = {
    "Boyer Gallardo": "cmmby9o7j000z1ucdwq4kp2mh",
    Montgaillard: "cmmby9op3001b1ucd027i2f17",
    Roelofse: "cmmby9pb4001q1ucdi9hhgjrr",
    Chinarro: chinarro.id,
    Tanguy: "cmmby9pob001z1ucd9q2x11p8",
    "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
    Ortombina: "cmmf5o37500001u4h31rrnppn",
    "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
    Deghmache: "cmmby9r5f002z1ucddjqpjyiq",
    Aucagne: "cmmby9riq00381ucdzmy4nusa",
    Toganiyadrava: toganiyadrava.id,
    Naqalevu: "cmmby9sdp003t1ucd9uokugox",
    Poulet: "cmmby9shz003w1ucdzl5zpnhv",
    Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
    Dupichot: "cmmby9t3k004b1ucdtmx0zek2",
    Jintcharadze: "cmmc6lnvv00031uujj3985da4",
    Barcenilla: barcenilla.id,
    Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
    Hicks: "cmmf3v3b300001ufyqblsuba1",
    Velarte: "cmmby9qwd002t1ucdicuuybn0",
    Hall: "cmmby9re700351ucdmkgyg4k6",
    Kretchmann: "cmmf2trcs00001upl5gwhqicw",
    Buliruarua: "cmmby9sql00421ucdv9svv599",
  };

  const USAP_SQUAD = [
    { num: 1, lastName: "Boyer Gallardo", position: "PILIER_GAUCHE" as const, isStarter: true },
    { num: 2, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: true },
    { num: 3, lastName: "Roelofse", position: "PILIER_DROIT" as const, isStarter: true },
    { num: 4, lastName: "Chinarro", position: "DEUXIEME_LIGNE" as const, isStarter: true },
    { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true },
    { num: 6, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
    { num: 7, lastName: "Ortombina", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
    { num: 8, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: true },
    { num: 9, lastName: "Deghmache", position: "DEMI_DE_MELEE" as const, isStarter: true },
    { num: 10, lastName: "Aucagne", position: "DEMI_OUVERTURE" as const, isStarter: true },
    { num: 11, lastName: "Toganiyadrava", position: "AILIER" as const, isStarter: true },
    { num: 12, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: true },
    { num: 13, lastName: "Poulet", position: "CENTRE" as const, isStarter: true },
    { num: 14, lastName: "Joseph", position: "AILIER" as const, isStarter: true },
    { num: 15, lastName: "Dupichot", position: "ARRIERE" as const, isStarter: true },
    // Remplaçants
    { num: 16, lastName: "Jintcharadze", position: "TALONNEUR" as const, isStarter: false },
    { num: 17, lastName: "Barcenilla", position: "PILIER_GAUCHE" as const, isStarter: false },
    { num: 18, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
    { num: 19, lastName: "Hicks", position: "DEUXIEME_LIGNE" as const, isStarter: false },
    { num: 20, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: false },
    { num: 21, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: false },
    { num: 22, lastName: "Kretchmann", position: "CENTRE" as const, isStarter: false },
    { num: 23, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: false },
  ];

  // ---------------------------------------------------------------
  // 1. Mise à jour du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2024-12-08"),
      kickoffTime: "14:00",
      venueId: venue.id,
      halfTimeUsap: 17,
      halfTimeOpponent: 10,
      triesUsap: 3,
      conversionsUsap: 1,
      penaltiesUsap: 1,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      triesOpponent: 3,
      conversionsOpponent: 1,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      bonusOffensif: false,
      bonusDefensif: false,
      attendance: 4500,
      report:
        "Premier match de Challenge Cup à Amsterdam, terrain neutre des Cheetahs en Europe. " +
        "L'USAP aligne un large turnover (13 changements) avec des premières pro pour Ortombina, " +
        "Toganiyadrava et Barcenilla. Malgré une nette domination adverse en possession (60-40%), " +
        "les Catalans jouent juste contre le vent et mènent 17-10 à la pause grâce aux essais " +
        "d'Aucagne (5'), Toganiyadrava (31', transformé par Aucagne) et Poulet (40'). " +
        "En deuxième mi-temps, Maartens réduit l'écart (65', essai transformé, 17-17), " +
        "puis Wentzel donne l'avantage aux Cheetahs sur pénalité (79', 20-17). " +
        "Aucagne, d'un sang-froid remarquable, sauve le match nul à l'ultime seconde " +
        "sur pénalité (80', 20-20). Carton jaune pour Mgijima (Cheetahs, 60'). " +
        "Velarte auteur d'une grosse prestation après son entrée précoce (18').",
    },
  });
  console.log("  Match mis à jour");

  // ---------------------------------------------------------------
  // 2. Composition USAP
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  await prisma.matchPlayer.deleteMany({ where: { matchId: MATCH_ID, isOpponent: false } });

  for (const p of USAP_SQUAD) {
    const playerId = PLAYER_IDS[p.lastName];
    if (!playerId) { console.error(`  ERREUR: ${p.lastName}`); continue; }

    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;

    if (p.lastName === "Aucagne") { tries = 1; conversions = 1; penalties = 1; totalPoints = 10; }
    else if (p.lastName === "Toganiyadrava") { tries = 1; totalPoints = 5; }
    else if (p.lastName === "Poulet") { tries = 1; totalPoints = 5; }

    await prisma.matchPlayer.create({
      data: {
        matchId: MATCH_ID,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: false,
        positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${pts}`);
  }

  // ---------------------------------------------------------------
  // 3. Événements du match
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  await prisma.matchEvent.deleteMany({ where: { matchId: MATCH_ID } });

  const events = [
    // 5' - Essai Aucagne (USAP)
    { minute: 5, type: "ESSAI", playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Essai d'Antoine Aucagne. Non transformé. Cheetahs 0 - USAP 5." },

    // 10' - Essai Rudolph (Cheetahs)
    { minute: 10, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Jeandré Rudolph (Cheetahs). Non transformé. Cheetahs 5 - USAP 5." },

    // 17' - Essai Van der Westhuizen (Cheetahs)
    { minute: 17, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Louis van der Westhuizen (Cheetahs) sur maul. Non transformé. Cheetahs 10 - USAP 5." },

    // 18' - Tanguy → Velarte (sortie précoce)
    { minute: 18, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Tanguy"], isUsap: true,
      description: "Sortie précoce de Mathieu Tanguy." },
    { minute: 18, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Entrée de Lucas Velarte en remplacement de Tanguy." },

    // 31' - Essai Toganiyadrava (USAP)
    { minute: 31, type: "ESSAI", playerId: PLAYER_IDS["Toganiyadrava"], isUsap: true,
      description: "Essai de Setareki Toganiyadrava, bien servi en bout de ligne. Cheetahs 10 - USAP 10." },
    { minute: 32, type: "TRANSFORMATION", playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Transformation d'Antoine Aucagne. Cheetahs 10 - USAP 12." },

    // 40' - Essai Poulet (USAP)
    { minute: 40, type: "ESSAI", playerId: PLAYER_IDS["Poulet"], isUsap: true,
      description: "Essai de Job Poulet qui récupère un ballon au rebond sur un cross-kick raté des Cheetahs. Non transformé. Cheetahs 10 - USAP 17." },

    // MI-TEMPS : Cheetahs 10 - USAP 17

    // 47' - Deghmache → Hall, Roelofse → Ceccarelli
    { minute: 47, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Deghmache"], isUsap: true,
      description: "Sortie de Sadek Deghmache." },
    { minute: 47, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Hall"], isUsap: true,
      description: "Entrée de James Hall en remplacement de Deghmache." },
    { minute: 47, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Roelofse"], isUsap: true,
      description: "Sortie de Nemo Roelofse." },
    { minute: 47, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Roelofse." },

    // 57' - Montgaillard → Jintcharadze
    { minute: 57, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Montgaillard"], isUsap: true,
      description: "Sortie de Victor Montgaillard." },
    { minute: 57, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Jintcharadze"], isUsap: true,
      description: "Entrée de Vakhtang Jintcharadze en remplacement de Montgaillard." },

    // 59' - Dupichot → Kretchmann
    { minute: 59, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Dupichot"], isUsap: true,
      description: "Sortie de Louis Dupichot." },
    { minute: 59, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Kretchmann"], isUsap: true,
      description: "Entrée de Gabin Kretchmann en remplacement de Dupichot." },

    // 60' - Carton jaune Mgijima (Cheetahs)
    { minute: 60, type: "CARTON_JAUNE", playerId: null, isUsap: false,
      description: "Carton jaune pour Ali Mgijima (Cheetahs)." },

    // 65' - Essai Maartens (Cheetahs) + transformation
    { minute: 65, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Daniel Maartens (Cheetahs). Cheetahs 15 - USAP 17." },
    { minute: 66, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation (Cheetahs). Égalisation ! Cheetahs 17 - USAP 17." },

    // 66' - Chinarro → Hicks, Poulet → Buliruarua
    { minute: 66, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Chinarro"], isUsap: true,
      description: "Sortie de Bastien Chinarro." },
    { minute: 66, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Hicks"], isUsap: true,
      description: "Entrée de Max Hicks en remplacement de Chinarro." },
    { minute: 66, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Poulet"], isUsap: true,
      description: "Sortie de Job Poulet." },
    { minute: 66, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Buliruarua"], isUsap: true,
      description: "Entrée d'Eneriko Buliruarua en remplacement de Poulet." },

    // 79' - Pénalité Wentzel (Cheetahs)
    { minute: 79, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité d'Ethan Wentzel (Cheetahs). Cheetahs 20 - USAP 17." },

    // 80' - Pénalité Aucagne (USAP) — LE MATCH NUL !
    { minute: 80, type: "PENALITE", playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne à l'ultime seconde ! Le match nul est sauvé ! Cheetahs 20 - USAP 20." },
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
    const team = evt.isUsap ? "USAP" : "CHE ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesMap: Record<string, number> = {
    "Boyer Gallardo": 80, Montgaillard: 57, Roelofse: 47, Chinarro: 66, Tanguy: 18,
    "Della Schiava": 80, Ortombina: 80, "Fa'aso'o": 80, Deghmache: 47, Aucagne: 80,
    Toganiyadrava: 80, Naqalevu: 80, Poulet: 66, Joseph: 80, Dupichot: 59,
    Jintcharadze: 23, Barcenilla: 0, Ceccarelli: 33, Hicks: 14, Velarte: 62,
    Hall: 33, Kretchmann: 21, Buliruarua: 14,
  };

  for (const [lastName, minutes] of Object.entries(minutesMap)) {
    const playerId = PLAYER_IDS[lastName];
    if (!playerId) continue;
    if (minutes === 0) {
      console.log(`  ${lastName}: non utilisé`);
      continue;
    }
    const isStarter = USAP_SQUAD.find((p) => p.lastName === lastName)?.isStarter ?? false;
    let subIn: number | null = null;
    let subOut: number | null = null;
    if (!isStarter) {
      const entry = events.find((e) => e.type === "REMPLACEMENT_ENTREE" && e.playerId === playerId);
      subIn = entry?.minute ?? null;
    }
    const exit = events.find((e) => e.type === "REMPLACEMENT_SORTIE" && e.playerId === playerId);
    subOut = exit?.minute ?? null;
    await prisma.matchPlayer.updateMany({
      where: { matchId: MATCH_ID, playerId },
      data: { minutesPlayed: minutes, subIn, subOut },
    });
    console.log(`  ${lastName}: ${minutes}' ${subIn ? `(entrée ${subIn}')` : ""} ${subOut ? `(sortie ${subOut}')` : ""}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score mi-temps : Cheetahs 10 - USAP 17");
  console.log("  Score final : Cheetahs 20 - USAP 20");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs`);
  console.log(`  Événements : ${events.length}`);
  console.log("  Essais USAP : Aucagne (5'), Toganiyadrava (31'), Poulet (40')");
  console.log("  Buteur : Aucagne (1 transfo, 1 pén = 10 pts total)");
  console.log("  Pénalité de la dernière seconde pour le nul !");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

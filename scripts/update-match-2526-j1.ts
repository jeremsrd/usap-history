/**
 * Script de mise à jour du match USAP - Bayonne (J1 Top 14, 06/09/2025)
 * Ajoute : arbitre, score mi-temps, détail scoring,
 *          composition USAP (23 joueurs), composition Bayonne (23 joueurs),
 *          événements du match, cartons
 *
 * USAP 19 - 26 Bayonne (mi-temps : 14-10)
 * Stade Aimé-Giral, Perpignan — Arbitre : Luc Ramos
 *
 * Sources : top14.lnr.fr, allrugby.com, francebleu.fr, dicodusport.fr, lerugbynistere.fr
 *
 * Usage : npx tsx scripts/update-match-2526-j1.ts
 */

import { PrismaClient, Position } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("=== Mise à jour match USAP - Bayonne (J1, 06/09/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Trouver le match J1 de la saison 2025-2026
  // ---------------------------------------------------------------
  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: {
      seasonId: season.id,
      matchday: 1,
      competition: { shortName: "Top 14" },
    },
    include: { opponent: true },
  });

  console.log(`Match trouvé : ${match.id} — J${match.matchday} vs ${match.opponent.name}`);
  console.log(`  Score : USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.shortName}\n`);

  // ---------------------------------------------------------------
  // 1. Arbitre : Luc Ramos
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: "Ramos" },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Luc",
        lastName: "Ramos",
        slug: "luc-ramos",
      },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName}`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName}`);
  }

  // ---------------------------------------------------------------
  // 2. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score evolution (USAP - Bayonne) :
   * 0-0 → 0-3 → 0-10 → 5-10 → 7-10 → 12-10 → 14-10
   *   → 14-13 → 14-16 → 14-23 → 14-26 → 19-26
   *
   * Mi-temps : USAP 14 - 10 Bayonne
   *
   * USAP : 3E (Joseph, Buliruarua, Paia'aua) 2T (Tedder ×2) = 15 + 4 = 19
   * Bayonne : 2E (Capilla, Bruni) 2T (Segonds ×2) 4P (Segonds ×3, Tiberghien ×1) = 10 + 4 + 12 = 26
   */
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "15:00",
      refereeId: referee.id,
      // Mi-temps (convention : score USAP en premier)
      halfTimeUsap: 14,
      halfTimeOpponent: 10,
      // Détail scoring USAP
      triesUsap: 3,
      conversionsUsap: 2,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Bayonne
      triesOpponent: 2,
      conversionsOpponent: 2,
      penaltiesOpponent: 4,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Vidéo résumé
      videoUrl: "https://www.youtube.com/watch?v=oTa_-DRI720",
      // Infos complémentaires
      report:
        "Première journée de la saison 2025-2026. Bayonne ouvre le score par Segonds (9') " +
        "puis Capilla marque en coin (19'). L'USAP réagit en fin de première mi-temps avec " +
        "deux essais en 3 minutes de Joseph (37') et Buliruarua (40+1'), tous deux transformés " +
        "par Tedder. 14-10 à la pause. En seconde période, Bayonne reprend l'avantage au pied " +
        "(Tiberghien 43', Segonds 49') puis creuse l'écart avec l'essai de Bruni (59'). " +
        "Paia'aua réduit l'écart en fin de match (73') mais la transformation manquée scelle " +
        "le sort du match. 4 cartons jaunes côté bayonnais, 1 côté USAP. " +
        "Absents USAP : Oviedo, Ruiz, Ritchie, Petaia, Tuilagi (péroné).",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, rapport)");

  // ---------------------------------------------------------------
  // 3. Résolution des joueurs USAP (par nom de famille)
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
    if (!player) {
      throw new Error(`Joueur non trouvé : ${firstName || ""} ${lastName}`);
    }
    return player.id;
  }

  const PLAYER_IDS: Record<string, string> = {};
  const usapNames = [
    "Devaux", "Lotrian", "Brookes", "Yato", "Warion",
    "Della Schiava", "Diaby", "Velarte", "Hall", "McIntyre",
    "Dubois", "De La Fuente", "Buliruarua", "Joseph", "Tedder",
    "Lam", "Beria", "Van Tonder", "Tanguy", "Le Corvec",
    "Ecochard", "Paia'aua", "Roelofse",
  ];

  for (const name of usapNames) {
    try {
      PLAYER_IDS[name] = await findPlayer(name);
      console.log(`  ✓ ${name}`);
    } catch {
      console.log(`  ✗ ${name} — NON TROUVÉ`);
    }
  }

  // ---------------------------------------------------------------
  // 4. Composition USAP (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  // Nettoyage des éventuels MatchPlayer existants pour ce match
  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: match.id },
  });
  console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  // Minutes calculées à partir des remplacements AllRugby :
  // Velarte : 0-26 + 31-48 + 71-80 = 52 min (HIA à 26', retour 31', sorti 48', revenu 71')
  // Le Corvec : 26-31 + 57-80 = 28 min (HIA cover puis entrée définitive)
  const USAP_SQUAD = [
    // Titulaires
    { num: 1, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: true, minutesPlayed: 52 },
    { num: 2, lastName: "Lotrian", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 57 },
    { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 57 },
    { num: 4, lastName: "Yato", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 71 },
    { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 6, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 7, lastName: "Diaby", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 57 },
    { num: 8, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 52 },
    { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 52 },
    { num: 10, lastName: "McIntyre", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 26 },
    { num: 11, lastName: "Dubois", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true, minutesPlayed: 80 },
    { num: 13, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 14, lastName: "Joseph", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 15, lastName: "Tedder", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 80 },
    // Remplaçants
    { num: 16, lastName: "Lam", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 23 },
    { num: 17, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 28 },
    { num: 18, lastName: "Van Tonder", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 32 },
    { num: 19, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 0 },
    { num: 20, lastName: "Le Corvec", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 28 },
    { num: 21, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 28 },
    { num: 22, lastName: "Paia'aua", position: "CENTRE" as const, isStarter: false, minutesPlayed: 54 },
    { num: 23, lastName: "Roelofse", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 23 },
  ];

  for (const p of USAP_SQUAD) {
    const playerId = PLAYER_IDS[p.lastName];
    if (!playerId) {
      console.log(`  ⚠ Joueur non trouvé : ${p.lastName}`);
      continue;
    }

    // Stats individuelles
    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;
    let yellowCard = false, yellowCardMin: number | null = null;

    if (p.lastName === "Joseph") {
      tries = 1;
      totalPoints = 5;
    }
    if (p.lastName === "Buliruarua") {
      tries = 1;
      totalPoints = 5;
    }
    if (p.lastName === "Paia'aua") {
      tries = 1;
      totalPoints = 5;
    }
    if (p.lastName === "Tedder") {
      conversions = 2;
      totalPoints = 4;
    }
    if (p.lastName === "Ecochard") {
      yellowCard = true;
      yellowCardMin = 73;
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.lastName === "De La Fuente",
        positionPlayed: p.position,
        tries,
        conversions,
        penalties,
        totalPoints,
        yellowCard,
        yellowCardMin,
        minutesPlayed: p.minutesPlayed,
      },
    });
    console.log(
      `  ${p.isStarter ? "TIT" : "REM"} ${String(p.num).padStart(2, " ")}. ${p.lastName} (${p.minutesPlayed}')` +
        (totalPoints > 0 ? ` ${totalPoints} pts` : "") +
        (yellowCard ? ` [CJ ${yellowCardMin}']` : "") +
        (p.lastName === "De La Fuente" ? " (C)" : ""),
    );
  }

  // ---------------------------------------------------------------
  // 5. Composition Bayonne (23 joueurs adverses)
  // ---------------------------------------------------------------
  console.log("\n--- Composition Bayonne ---");

  // Minutes Bayonne (source AllRugby) :
  // Bordelai : 0-55 + 79-80 = 56 min (sorti 55', revenu 79')
  // Habel-Kuffner : 0-52 + 66-80 = 66 min (sorti 52', revenu 66')
  // Tiberghien : 0-52 + 71-80 = 61 min (sorti 52', revenu 71')
  const BAYONNE_SQUAD = [
    // Titulaires
    { num: 1, firstName: "Andy", lastName: "Bordelai", position: "PILIER_GAUCHE" as const, isStarter: true, minutesPlayed: 56 },
    { num: 2, firstName: "Facundo", lastName: "Bosch", position: "TALONNEUR" as const, isStarter: true, minutesPlayed: 80 },
    { num: 3, firstName: "Emerick", lastName: "Setiano", position: "PILIER_DROIT" as const, isStarter: true, minutesPlayed: 60 },
    { num: 4, firstName: "Arthur", lastName: "Iturria", position: "DEUXIEME_LIGNE" as const, isStarter: true, isCaptain: true, minutesPlayed: 36 },
    { num: 5, firstName: "Alexander", lastName: "Moon", position: "DEUXIEME_LIGNE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 6, firstName: "Rodrigo", lastName: "Bruni", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 66 },
    { num: 7, firstName: "Esteban", lastName: "Capilla", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true, minutesPlayed: 64 },
    { num: 8, firstName: "Giovanni", lastName: "Habel-Kuffner", position: "NUMERO_HUIT" as const, isStarter: true, minutesPlayed: 66 },
    { num: 9, firstName: "Maxime", lastName: "Machenaud", position: "DEMI_DE_MELEE" as const, isStarter: true, minutesPlayed: 60 },
    { num: 10, firstName: "Joris", lastName: "Segonds", position: "DEMI_OUVERTURE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 11, firstName: "Arnaud", lastName: "Erbinartegaray", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 12, firstName: "Manu", lastName: "Tuilagi", position: "CENTRE" as const, isStarter: true, minutesPlayed: 80 },
    { num: 13, firstName: "Guillaume", lastName: "Martocq", position: "CENTRE" as const, isStarter: true, minutesPlayed: 71 },
    { num: 14, firstName: "Tom", lastName: "Spring", position: "AILIER" as const, isStarter: true, minutesPlayed: 80 },
    { num: 15, firstName: "Cheikh", lastName: "Tiberghien", position: "ARRIERE" as const, isStarter: true, minutesPlayed: 61 },
    // Remplaçants
    { num: 16, firstName: "Lucas", lastName: "Martin", position: "TALONNEUR" as const, isStarter: false, minutesPlayed: 0 },
    { num: 17, firstName: "Swan", lastName: "Cormenier", position: "PILIER_GAUCHE" as const, isStarter: false, minutesPlayed: 24 },
    { num: 18, firstName: "Ewan", lastName: "Johnson", position: "DEUXIEME_LIGNE" as const, isStarter: false, minutesPlayed: 16 },
    { num: 19, firstName: "Baptiste", lastName: "Héguy", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 44 },
    { num: 20, firstName: "Alexandre", lastName: "Fischer", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false, minutesPlayed: 28 },
    { num: 21, firstName: "Herschel", lastName: "Jantjies", position: "DEMI_DE_MELEE" as const, isStarter: false, minutesPlayed: 20 },
    { num: 22, firstName: "Yohan", lastName: "Orabé", position: "AILIER" as const, isStarter: false, minutesPlayed: 28 },
    { num: 23, firstName: "Luke", lastName: "Tagi", position: "PILIER_DROIT" as const, isStarter: false, minutesPlayed: 20 },
  ];

  for (const p of BAYONNE_SQUAD) {
    // Créer ou trouver le joueur adverse
    const slug = slugify(`${p.firstName}-${p.lastName}`);
    let player = await prisma.player.findFirst({
      where: { lastName: p.lastName, firstName: p.firstName },
    });

    if (!player) {
      player = await prisma.player.create({
        data: {
          firstName: p.firstName,
          lastName: p.lastName,
          slug: slug + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          position: p.position,
          isActive: false,
        },
      });
      console.log(`  [NEW] ${p.firstName} ${p.lastName} (${player.id})`);
    } else {
      console.log(`  [OK]  ${p.firstName} ${p.lastName} (${player.id})`);
    }

    // Stats individuelles adverses
    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;
    let yellowCard = false, yellowCardMin: number | null = null;

    if (p.lastName === "Capilla") {
      tries = 1;
      totalPoints = 5;
      yellowCard = true;
      yellowCardMin = 19;
    }
    if (p.lastName === "Bruni") {
      tries = 1;
      totalPoints = 5;
      yellowCard = true;
      yellowCardMin = 59;
    }
    if (p.lastName === "Segonds") {
      conversions = 2;
      penalties = 3;
      totalPoints = 4 + 9; // 13 pts
      yellowCard = true;
      yellowCardMin = 38;
    }
    if (p.lastName === "Tiberghien") {
      penalties = 1;
      totalPoints = 3;
      yellowCard = true;
      yellowCardMin = 43;
    }
    if (p.lastName === "Erbinartegaray") {
      yellowCard = true;
      yellowCardMin = 40;
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId: player.id,
        isOpponent: true,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: p.isCaptain || false,
        positionPlayed: p.position,
        tries,
        conversions,
        penalties,
        totalPoints,
        yellowCard,
        yellowCardMin,
        minutesPlayed: p.minutesPlayed,
      },
    });
    console.log(
      `       ${p.isStarter ? "TIT" : "REM"} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} (${p.minutesPlayed}')` +
        (totalPoints > 0 ? ` ${totalPoints} pts` : "") +
        (yellowCard ? ` [CJ ${yellowCardMin}']` : "") +
        (p.isCaptain ? " (C)" : ""),
    );
  }

  // ---------------------------------------------------------------
  // 6. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  // Nettoyage
  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: match.id },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events = [
    // 1ère mi-temps
    { minute: 9, type: "PENALITE" as const, isUsap: false, description: "Pénalité de Joris Segonds (Bayonne). 0-3." },
    { minute: 19, type: "ESSAI" as const, isUsap: false, description: "Essai d'Esteban Capilla (Bayonne) en coin. 0-8." },
    { minute: 19, type: "CARTON_JAUNE" as const, isUsap: false, description: "Carton jaune Esteban Capilla (Bayonne)." },
    { minute: 20, type: "TRANSFORMATION" as const, isUsap: false, description: "Transformation de Joris Segonds (Bayonne). 0-10." },
    { minute: 37, type: "ESSAI" as const, isUsap: true, playerId: PLAYER_IDS["Joseph"], description: "Essai de Jefferson-Lee Joseph (USAP) en coin. 5-10." },
    { minute: 38, type: "TRANSFORMATION" as const, isUsap: true, playerId: PLAYER_IDS["Tedder"], description: "Transformation de Tristan Tedder (USAP). 7-10." },
    { minute: 38, type: "CARTON_JAUNE" as const, isUsap: false, description: "Carton jaune Joris Segonds (Bayonne)." },
    { minute: 40, type: "CARTON_JAUNE" as const, isUsap: false, description: "Carton jaune Arnaud Erbinartegaray (Bayonne)." },
    { minute: 41, type: "ESSAI" as const, isUsap: true, playerId: PLAYER_IDS["Buliruarua"], description: "Essai de Riko Buliruarua (USAP) dans les arrêts de jeu. 12-10." },
    { minute: 42, type: "TRANSFORMATION" as const, isUsap: true, playerId: PLAYER_IDS["Tedder"], description: "Transformation de Tristan Tedder (USAP). 14-10. Mi-temps." },

    // 2ème mi-temps
    { minute: 43, type: "PENALITE" as const, isUsap: false, description: "Pénalité de Cheikh Tiberghien (Bayonne). 14-13." },
    { minute: 43, type: "CARTON_JAUNE" as const, isUsap: false, description: "Carton jaune Cheikh Tiberghien (Bayonne)." },
    { minute: 49, type: "PENALITE" as const, isUsap: false, description: "Pénalité de Joris Segonds (Bayonne). 14-16." },
    { minute: 59, type: "ESSAI" as const, isUsap: false, description: "Essai de Rodrigo Bruni (Bayonne). 14-21." },
    { minute: 59, type: "CARTON_JAUNE" as const, isUsap: false, description: "Carton jaune Rodrigo Bruni (Bayonne)." },
    { minute: 60, type: "TRANSFORMATION" as const, isUsap: false, description: "Transformation de Joris Segonds (Bayonne). 14-23." },
    { minute: 65, type: "PENALITE" as const, isUsap: false, description: "Pénalité de Joris Segonds (Bayonne). 14-26." },
    { minute: 73, type: "ESSAI" as const, isUsap: true, playerId: PLAYER_IDS["Paia'aua"], description: "Essai de Duncan Paia'aua (USAP). 19-26." },
    { minute: 73, type: "CARTON_JAUNE" as const, isUsap: true, playerId: PLAYER_IDS["Ecochard"], description: "Carton jaune Tom Ecochard (USAP)." },
  ];

  for (const evt of events) {
    await prisma.matchEvent.create({
      data: {
        matchId: match.id,
        minute: evt.minute,
        type: evt.type,
        playerId: evt.playerId || null,
        isUsap: evt.isUsap,
        description: evt.description,
      },
    });
    const side = evt.isUsap ? "USAP" : "BAY";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Aimé-Giral (Perpignan)");
  console.log("  Arbitre : Luc Ramos");
  console.log("  TMO : Julien Castaignède");
  console.log("  Score mi-temps : USAP 14 - 10 Bayonne");
  console.log("  Score final : USAP 19 - 26 Bayonne");
  console.log("  Composition USAP : 23 joueurs (15 titulaires + 8 remplaçants)");
  console.log("  Composition Bayonne : 23 joueurs (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length}`);
  console.log("  Essais USAP : Joseph (37'), Buliruarua (41'), Paia'aua (73')");
  console.log("  Essais Bayonne : Capilla (19'), Bruni (59')");
  console.log("  Cartons jaunes : Capilla (19'), Segonds (38'), Erbinartegaray (40'),");
  console.log("                   Tiberghien (43'), Bruni (59'), Ecochard (73')");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

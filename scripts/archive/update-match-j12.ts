/**
 * Script de mise à jour du match Stade Français - USAP (J12 Top 14, 21/12/2024)
 * Score final : Stade Français 24 - USAP 7
 * Mi-temps : Stade Français 14 - USAP 7
 *
 * Lourde défaite à Jean-Bouin. L'USAP subit deux essais rapides de Marchant (19')
 * et Laloi (25') avant que Veredamu ne réduise l'écart (29'). En 2e mi-temps,
 * pénalité de Carbonel (46') puis essai de Weber (64') pendant le carton jaune
 * de Brookes (53'). Warion aussi averti (78'). 3e défaite consécutive sans
 * bonus. Première titularisation de Della Schiava en Top 14.
 *
 * Sources : top14.lnr.fr, espn.com, eurosport.fr, itsrugby.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j12.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsbv00331umrrz4hnfwz"; // Match J12 SF-USAP 2024-2025

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Hicks", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Crossdale", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Dupichot", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Lam", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Roelofse", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Ortombina", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 19, lastName: "Fa'aso'o", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 20, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "Aucagne", position: "DEMI_OUVERTURE" as const, isStarter: false },
  { num: 22, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

// === IDs des joueurs (depuis la BDD) ===
const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Hicks: "cmmf3v3b300001ufyqblsuba1",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Crossdale: "cmmby9rsc003e1ucdli6st6ho",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Dupichot: "cmmby9t3k004b1ucdtmx0zek2",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Roelofse: "cmmby9pb4001q1ucdi9hhgjrr",
  Ortombina: "", // sera rempli après création
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  Aucagne: "cmmby9riq00381ucdzmy4nusa",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

const REFEREE_ID = "cmmc2zp6h00021uhp55mbn1w7"; // Luc Ramos

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("=== Mise à jour match Stade Français - USAP (J12, 21/12/2024) ===\n");

  // ---------------------------------------------------------------
  // 0. Création joueur + stade manquants
  // ---------------------------------------------------------------

  // --- Ortombina ---
  console.log("--- Joueur Ortombina ---");
  let ortombina = await prisma.player.findFirst({
    where: { lastName: { contains: "Ortombina", mode: "insensitive" } },
  });
  if (!ortombina) {
    ortombina = await prisma.player.create({
      data: {
        firstName: "Alessandro",
        lastName: "Ortombina",
        position: "TROISIEME_LIGNE_AILE",
        isActive: true,
        slug: `temp-${Date.now()}`,
      },
    });
    await prisma.player.update({
      where: { id: ortombina.id },
      data: { slug: `alessandro-ortombina-${ortombina.id}` },
    });
    console.log(`  Créé : Alessandro Ortombina (${ortombina.id})`);
  } else {
    console.log(`  Existe : ${ortombina.firstName} ${ortombina.lastName} (${ortombina.id})`);
  }
  PLAYER_IDS["Ortombina"] = ortombina.id;

  // --- Stade Jean-Bouin ---
  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Jean-Bouin", mode: "insensitive" } },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade Jean-Bouin",
        city: "Paris",
        capacity: 20000,
        slug: `temp-${Date.now()}`,
      },
    });
    const venueSlugBase = slugify("stade-jean-bouin-paris");
    await prisma.venue.update({
      where: { id: venue.id },
      data: { slug: `${venueSlugBase}-${venue.id}` },
    });
    console.log(`  Créé : Stade Jean-Bouin (${venue.id})`);
  } else {
    console.log(`  Existe : ${venue.name} (${venue.id})`);
  }

  // ---------------------------------------------------------------
  // 1. Mise à jour du match (infos générales)
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      kickoffTime: "16:30",
      venueId: venue.id,
      refereeId: REFEREE_ID,
      halfTimeUsap: 7,
      halfTimeOpponent: 14,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Stade Français
      triesOpponent: 3,
      conversionsOpponent: 3,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Lourde défaite à Jean-Bouin. L'USAP subit deux essais rapides de Marchant (19') et Laloi (25') avant de réagir par Veredamu (29'). En 2e mi-temps, Carbonel alourdit le score d'une pénalité (46') puis Weber inscrit le 3e essai parisien (64') profitant de la supériorité numérique (carton jaune Brookes 53'). Warion aussi averti en fin de match (78'). 3e défaite consécutive sans bonus, 1 seul point pris en 6 déplacements cette saison.",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, stade, rapport)");

  // ---------------------------------------------------------------
  // 2. Composition USAP (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  const deletedPlayers = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID, isOpponent: false },
  });
  console.log(`  ${deletedPlayers.count} entrée(s) USAP supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = PLAYER_IDS[p.lastName];
    if (!playerId) {
      console.error(`  ERREUR: ID introuvable pour ${p.lastName}`);
      continue;
    }

    let tries = 0,
      conversions = 0,
      penalties = 0,
      totalPoints = 0,
      yellowCard = false,
      yellowCardMin: number | null = null;

    // Stats individuelles
    if (p.lastName === "Veredamu") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Allan") {
      conversions = 1;
      totalPoints = 2;
    } else if (p.lastName === "Brookes") {
      yellowCard = true;
      yellowCardMin = 53;
    } else if (p.lastName === "Warion") {
      yellowCard = true;
      yellowCardMin = 78;
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: MATCH_ID,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: (p as { isCaptain?: boolean }).isCaptain ?? false,
        positionPlayed: p.position,
        tries,
        conversions,
        penalties,
        totalPoints,
        yellowCard,
        yellowCardMin,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    const card = yellowCard ? " [JAUNE]" : "";
    console.log(
      `  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${card}`
    );
  }

  // ---------------------------------------------------------------
  // 3. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: MATCH_ID },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events = [
    // 19' - Essai Marchant (SF) → 0-7
    {
      minute: 19,
      type: "ESSAI",
      playerId: null,
      isUsap: false,
      description: "Essai de Joe Marchant (Stade Français). 0-7.",
    },
    // 19' - Transformation Carbonel (SF) → 0-7
    {
      minute: 19,
      type: "TRANSFORMATION",
      playerId: null,
      isUsap: false,
      description: "Transformation de Louis Carbonel (Stade Français).",
    },
    // 25' - Essai Laloi (SF) → 0-14
    {
      minute: 25,
      type: "ESSAI",
      playerId: null,
      isUsap: false,
      description: "Essai de Charles Laloi (Stade Français). 0-14.",
    },
    // 25' - Transformation Carbonel (SF)
    {
      minute: 25,
      type: "TRANSFORMATION",
      playerId: null,
      isUsap: false,
      description: "Transformation de Louis Carbonel (Stade Français). 0-14.",
    },
    // 29' - Essai Veredamu → 5-14
    {
      minute: 29,
      type: "ESSAI",
      playerId: PLAYER_IDS["Veredamu"],
      isUsap: true,
      description: "Essai de Tavite Veredamu !",
    },
    // 29' - Transformation Allan → 7-14
    {
      minute: 29,
      type: "TRANSFORMATION",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Transformation de Tommaso Allan. 7-14.",
    },

    // === MI-TEMPS : SF 14 - USAP 7 ===

    // 46' - Pénalité Carbonel (SF) → 7-17
    {
      minute: 46,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité de Louis Carbonel (Stade Français). 7-17.",
    },
    // 53' - Carton jaune Brookes
    {
      minute: 53,
      type: "CARTON_JAUNE",
      playerId: PLAYER_IDS["Brookes"],
      isUsap: true,
      description: "Carton jaune pour Kieran Brookes. Plaquage dangereux épaule dans la tête de Laloi.",
    },
    // 64' - Essai Weber (SF) → 7-22
    {
      minute: 64,
      type: "ESSAI",
      playerId: null,
      isUsap: false,
      description: "Essai de Brad Weber (Stade Français). 7-22.",
    },

    // 65' - Remplacement Della Schiava → Fa'aso'o
    {
      minute: 65,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Della Schiava"],
      isUsap: true,
      description: "Sortie de Noé Della Schiava",
    },
    {
      minute: 65,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Fa'aso'o"],
      isUsap: true,
      description: "Entrée de So'otala Fa'aso'o en remplacement de Della Schiava",
    },

    // 66' - Transformation Carbonel (SF) → 7-24
    {
      minute: 66,
      type: "TRANSFORMATION",
      playerId: null,
      isUsap: false,
      description: "Transformation de Louis Carbonel (Stade Français). 7-24.",
    },

    // 66' - Remplacement Duguivalu → Naqalevu
    {
      minute: 66,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Duguivalu"],
      isUsap: true,
      description: "Sortie d'Alivereti Duguivalu",
    },
    {
      minute: 66,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Naqalevu"],
      isUsap: true,
      description: "Entrée d'Apisai Naqalevu en remplacement de Duguivalu",
    },

    // 67' - Remplacements groupés (5 changements)
    {
      minute: 67,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Ecochard"],
      isUsap: true,
      description: "Sortie de Tom Ecochard",
    },
    {
      minute: 67,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Hall"],
      isUsap: true,
      description: "Entrée de James Hall en remplacement d'Ecochard",
    },
    {
      minute: 67,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Oviedo"],
      isUsap: true,
      description: "Sortie de Joaquin Oviedo",
    },
    {
      minute: 67,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Ortombina"],
      isUsap: true,
      description: "Entrée d'Alessandro Ortombina en remplacement d'Oviedo",
    },
    {
      minute: 67,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Brookes"],
      isUsap: true,
      description: "Sortie de Kieran Brookes",
    },
    {
      minute: 67,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Ceccarelli"],
      isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes",
    },
    {
      minute: 67,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Beria"],
      isUsap: true,
      description: "Sortie de Giorgi Beria",
    },
    {
      minute: 67,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Roelofse"],
      isUsap: true,
      description: "Entrée de Nemo Roelofse en remplacement de Beria",
    },
    {
      minute: 67,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Ruiz"],
      isUsap: true,
      description: "Sortie d'Ignacio Ruiz",
    },
    {
      minute: 67,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Lam"],
      isUsap: true,
      description: "Entrée de Seilala Lam en remplacement de Ruiz",
    },

    // 69' - Remplacement Allan → Aucagne
    {
      minute: 69,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Sortie de Tommaso Allan",
    },
    {
      minute: 69,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Aucagne"],
      isUsap: true,
      description: "Entrée d'Antoine Aucagne en remplacement d'Allan",
    },

    // 78' - Carton jaune Warion
    {
      minute: 78,
      type: "CARTON_JAUNE",
      playerId: PLAYER_IDS["Warion"],
      isUsap: true,
      description: "Carton jaune pour Adrien Warion",
    },
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
    const team = evt.isUsap ? "USAP" : "SF  ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesMap: Record<string, number> = {
    Beria: 67,
    Ruiz: 67,
    Brookes: 67,
    Hicks: 80,
    Warion: 80,
    Velarte: 80,
    "Della Schiava": 65,
    Oviedo: 67,
    Ecochard: 67,
    Allan: 69,
    Crossdale: 80,
    "De La Fuente": 80,
    Duguivalu: 66,
    Veredamu: 80,
    Dupichot: 80,
    Lam: 13,       // entre à 67'
    Roelofse: 13,  // entre à 67'
    Ortombina: 13, // entre à 67'
    "Fa'aso'o": 15, // entre à 65'
    Hall: 13,       // entre à 67'
    Aucagne: 11,    // entre à 69'
    Naqalevu: 14,   // entre à 66'
    Ceccarelli: 13, // entre à 67'
  };

  for (const [lastName, minutes] of Object.entries(minutesMap)) {
    const playerId = PLAYER_IDS[lastName];
    if (!playerId) continue;
    await prisma.matchPlayer.updateMany({
      where: { matchId: MATCH_ID, playerId },
      data: {
        minutesPlayed: minutes,
        subIn: USAP_SQUAD.find((p) => p.lastName === lastName)?.isStarter
          ? null
          : (() => {
              const entry = events.find(
                (e) => e.type === "REMPLACEMENT_ENTREE" && e.playerId === playerId
              );
              return entry?.minute ?? null;
            })(),
        subOut: (() => {
          const exit = events.find(
            (e) => e.type === "REMPLACEMENT_SORTIE" && e.playerId === playerId
          );
          return exit?.minute ?? null;
        })(),
      },
    });
    console.log(`  ${lastName}: ${minutes}'`);
  }

  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Jean-Bouin (Paris) — extérieur");
  console.log("  Arbitre : Luc Ramos");
  console.log("  Score mi-temps : SF 14 - USAP 7");
  console.log("  Score final : Stade Français 24 - USAP 7");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs USAP (15 titulaires + 8 remplaçants)`);
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

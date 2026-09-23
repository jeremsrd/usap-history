/**
 * Script de mise à jour du match USAP - Stade Rochelais (J13 Top 14, 29/12/2024)
 * Score final : USAP 21 - La Rochelle 13
 * Mi-temps : USAP 18 - La Rochelle 6
 *
 * Belle victoire à Aimé-Giral qui met fin à 3 défaites consécutives.
 * Crossdale sort sur blessure dès la 7' (remplacé par Naqalevu).
 * Veredamu inscrit un superbe essai (11'), Allan impérial au pied (11 pts).
 * Ruiz marque en maul (29'). La Rochelle réduit l'écart par Botia (52')
 * mais l'USAP tient bon. Victoire 21-13, retour à la 12e place.
 *
 * Sources : top14.lnr.fr, espn.com, allrugby.com, itsrugby.fr, francebleu.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j13.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxscs00351umrvr7w23b1"; // Match J13 USAP-La Rochelle 2024-2025

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Labouteley", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
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
  { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: false },
  { num: 19, lastName: "Bachelier", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
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
  Labouteley: "cmmby9pfj001t1ucd75p7hi07",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Hicks: "cmmf3v3b300001ufyqblsuba1",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Crossdale: "cmmby9rsc003e1ucdli6st6ho",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Dupichot: "cmmby9t3k004b1ucdtmx0zek2",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Devaux: "cmmby9obz00121ucdcgxy6k3w",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Bachelier: "cmmby9q1g00281ucdpzfoultm",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  Aucagne: "cmmby9riq00381ucdzmy4nusa",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

const VENUE_ID = "cmm6wnybf000d1uihl8hsk9e1"; // Stade Aimé-Giral

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("=== Mise à jour match USAP - La Rochelle (J13, 29/12/2024) ===\n");

  // ---------------------------------------------------------------
  // 0. Création arbitre manquant
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Blasco", mode: "insensitive" } },
  });
  if (!referee) {
    referee = await prisma.referee.create({
      data: {
        firstName: "Vincent",
        lastName: "Blasco-Baqué",
        slug: `temp-${Date.now()}`,
      },
    });
    await prisma.referee.update({
      where: { id: referee.id },
      data: { slug: `vincent-blasco-baque-${referee.id}` },
    });
    console.log(`  Créé : Vincent Blasco-Baqué (${referee.id})`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 1. Mise à jour du match (infos générales)
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2024-12-29"), // Correction : le match était le 29/12, pas le 28
      kickoffTime: "18:00",
      venueId: VENUE_ID,
      refereeId: referee.id,
      halfTimeUsap: 18,
      halfTimeOpponent: 6,
      // Détail scoring USAP
      triesUsap: 2,
      conversionsUsap: 1,
      penaltiesUsap: 3,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring La Rochelle
      triesOpponent: 1,
      conversionsOpponent: 1,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Belle victoire à Aimé-Giral pour terminer l'année civile. Crossdale sort sur blessure dès la 7', remplacé par Naqalevu. Veredamu ouvre le score avec un superbe essai individuel (11'). Allan impérial au pied avec 3 pénalités et une transformation (11 pts au total). Ruiz marque en maul depuis une touche dans les 5 mètres (29'). L'USAP mène 18-6 à la pause. En 2e mi-temps, Allan creuse l'écart à 21-6 (pénalité 43'). Botia réduit l'écart en puissance (52', transfo Hastoy). L'USAP tient bon et met fin à 3 défaites consécutives. Retour à la 12e place avec 23 points.",
    },
  });
  console.log("  Match mis à jour (date corrigée 29/12, score mi-temps, scoring, arbitre, stade, rapport)");

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
      totalPoints = 0;

    // Stats individuelles
    if (p.lastName === "Veredamu") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Ruiz") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Allan") {
      conversions = 1;
      penalties = 3;
      totalPoints = 11; // 1×2 + 3×3 = 11
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
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    console.log(
      `  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}`
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
    // 7' - Crossdale sort blessé → Naqalevu entre
    {
      minute: 7,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Crossdale"],
      isUsap: true,
      description: "Sortie d'Alistair Crossdale sur blessure",
    },
    {
      minute: 7,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Naqalevu"],
      isUsap: true,
      description: "Entrée d'Apisai Naqalevu en remplacement de Crossdale (blessure)",
    },

    // 8' - Pénalité Hastoy (LR) → 0-3
    {
      minute: 8,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité d'Antoine Hastoy (La Rochelle). 0-3.",
    },

    // 11' - Essai Veredamu → 5-3
    {
      minute: 11,
      type: "ESSAI",
      playerId: PLAYER_IDS["Veredamu"],
      isUsap: true,
      description: "Essai de Tavite Veredamu ! Superbe action individuelle. 5-3.",
    },

    // 14' - Pénalité Hastoy (LR) → 5-6
    {
      minute: 14,
      type: "PENALITE",
      playerId: null,
      isUsap: false,
      description: "Pénalité d'Antoine Hastoy (La Rochelle). 5-6.",
    },

    // 18' - Pénalité Allan → 8-6
    {
      minute: 18,
      type: "PENALITE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité de Tommaso Allan. 8-6.",
    },

    // 24' - Pénalité Allan → 11-6
    {
      minute: 24,
      type: "PENALITE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité de Tommaso Allan. 11-6.",
    },

    // 29' - Essai Ruiz → 16-6
    {
      minute: 29,
      type: "ESSAI",
      playerId: PLAYER_IDS["Ruiz"],
      isUsap: true,
      description: "Essai d'Ignacio Ruiz ! Maul depuis une touche dans les 5 mètres. 16-6.",
    },

    // 30' - Transformation Allan → 18-6
    {
      minute: 30,
      type: "TRANSFORMATION",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Transformation de Tommaso Allan. 18-6.",
    },

    // === MI-TEMPS : USAP 18 - La Rochelle 6 ===

    // 43' - Pénalité Allan → 21-6
    {
      minute: 43,
      type: "PENALITE",
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Pénalité de Tommaso Allan. 21-6.",
    },

    // 52' - Essai Botia (LR) → 21-11
    {
      minute: 52,
      type: "ESSAI",
      playerId: null,
      isUsap: false,
      description: "Essai de Levani Botia (La Rochelle) en puissance. 21-11.",
    },

    // 53' - Transformation Hastoy (LR) → 21-13
    {
      minute: 53,
      type: "TRANSFORMATION",
      playerId: null,
      isUsap: false,
      description: "Transformation d'Antoine Hastoy (La Rochelle). 21-13.",
    },

    // 57' - Remplacement Brookes → Ceccarelli
    {
      minute: 57,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Brookes"],
      isUsap: true,
      description: "Sortie de Kieran Brookes",
    },
    {
      minute: 57,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Ceccarelli"],
      isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes",
    },

    // 59' - Remplacement Velarte → Fa'aso'o
    {
      minute: 59,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Velarte"],
      isUsap: true,
      description: "Sortie de Lucas Velarte",
    },
    {
      minute: 59,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Fa'aso'o"],
      isUsap: true,
      description: "Entrée de So'otala Fa'aso'o en remplacement de Velarte",
    },

    // 68' - Remplacement Ecochard → Hall
    {
      minute: 68,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Ecochard"],
      isUsap: true,
      description: "Sortie de Tom Ecochard",
    },
    {
      minute: 68,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Hall"],
      isUsap: true,
      description: "Entrée de James Hall en remplacement d'Ecochard",
    },

    // 68' - Remplacement Ruiz → Lam
    {
      minute: 68,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Ruiz"],
      isUsap: true,
      description: "Sortie d'Ignacio Ruiz",
    },
    {
      minute: 68,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Lam"],
      isUsap: true,
      description: "Entrée de Seilala Lam en remplacement de Ruiz",
    },

    // 69' - Remplacement Hicks → Bachelier
    {
      minute: 69,
      type: "REMPLACEMENT_SORTIE",
      playerId: PLAYER_IDS["Hicks"],
      isUsap: true,
      description: "Sortie de Maxwell Hicks",
    },
    {
      minute: 69,
      type: "REMPLACEMENT_ENTREE",
      playerId: PLAYER_IDS["Bachelier"],
      isUsap: true,
      description: "Entrée de Lucas Bachelier en remplacement de Hicks",
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
    const team = evt.isUsap ? "USAP" : "LR  ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesMap: Record<string, number> = {
    Beria: 80,
    Ruiz: 68,
    Brookes: 57,
    Labouteley: 80,
    Warion: 80,
    Velarte: 59,
    Hicks: 69,
    Oviedo: 80,
    Ecochard: 68,
    Allan: 80,
    Crossdale: 7,       // sort blessé à 7'
    "De La Fuente": 80,
    Duguivalu: 80,
    Veredamu: 80,
    Dupichot: 80,
    Lam: 12,             // entre à 68'
    Devaux: 0,           // ne rentre pas
    "Fa'aso'o": 21,      // entre à 59'
    Bachelier: 11,       // entre à 69'
    Hall: 12,            // entre à 68'
    Aucagne: 0,          // ne rentre pas
    Naqalevu: 73,        // entre à 7'
    Ceccarelli: 23,      // entre à 57'
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
  console.log("  Stade : Aimé-Giral (Perpignan) — domicile");
  console.log(`  Arbitre : Vincent Blasco-Baqué (${referee.id})`);
  console.log("  Score mi-temps : USAP 18 - La Rochelle 6");
  console.log("  Score final : USAP 21 - La Rochelle 13");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs USAP (15 titulaires + 8 remplaçants)`);
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

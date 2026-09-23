/**
 * Script de mise à jour du match Castres - USAP (J3 Top 14, 21/09/2024)
 * Score final : Castres 27 - 12 USAP
 * Mi-temps : Castres 10 - 12 USAP
 *
 * L'USAP mène 3-12 à la mi-temps grâce à 4 pénalités d'Aucagne,
 * mais s'effondre en 2e mi-temps face au vent.
 *
 * Ajoute : stade, arbitre, score mi-temps, détail scoring,
 *          composition USAP (23 joueurs), événements du match
 *
 * Sources : top14.lnr.fr, allrugby.com, eurosport.fr, francebleu.fr
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs3y002l1umr5v46hgpc"; // Match J3 Castres-USAP 2024-2025

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2024-2025/j3/10885-castres-perpignan/compositions
const USAP_SQUAD = [
  // Titulaires — compo très différente de J2 (nombreuses blessures)
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Tuilagi", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Van Tonder", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Brazo", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Aucagne", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Dubois", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: true },
  { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Joseph", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Dupichot", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Jintcharadze", position: "TALONNEUR" as const, isStarter: false, needsCreate: true },
  { num: 17, lastName: "Labouteley", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Fakatika", position: "PILIER_DROIT" as const, isStarter: false },
  { num: 19, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: false },
  { num: 20, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "McIntyre", position: "DEMI_OUVERTURE" as const, isStarter: false },
  { num: 22, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Roelofse", position: "ARRIERE" as const, isStarter: false },
];

// IDs des joueurs USAP (récupérés de la base)
const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Montgaillard: "cmmby9op3001b1ucd027i2f17",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Tuilagi: "cmmby9pso00221ucdwnmxzccc",
  Warion: "cmmby9px000251ucddkb7y9j3",
  "Van Tonder": "cmmby9qj4002k1ucdmg0rggp5",
  Brazo: "cmmby9q5t002b1ucdgw3ikj36",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Aucagne: "cmmby9riq00381ucdzmy4nusa",
  Dubois: "cmmby9rwn003h1ucdavvw842q",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  Dupichot: "cmmby9t3k004b1ucdtmx0zek2",
  // Jintcharadze sera créé dans le script
  Labouteley: "cmmby9pfj001t1ucd75p7hi07",
  Fakatika: "cmmby9p6p001n1ucdxt02xbuc",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  McIntyre: "cmmby9ro0003b1ucd388eacr8",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Roelofse: "cmmby9pb4001q1ucdi9hhgjrr",
};

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("=== Mise à jour match Castres - USAP (J3, 21/09/2024) ===\n");

  // ---------------------------------------------------------------
  // 1. Créer le Stade Pierre Fabre (si absent)
  // ---------------------------------------------------------------
  console.log("--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Pierre Fabre" } },
  });
  if (!venue) {
    const france = await prisma.country.findFirst({ where: { code: "FR" } });
    venue = await prisma.venue.create({
      data: {
        name: "Stade Pierre Fabre",
        slug: "",
        city: "Castres",
        countryId: france?.id,
        capacity: 12300,
        yearOpened: 1997,
        isHomeGround: false,
        notes: "Stade du Castres Olympique. Anciennement Stade du Causse.",
      },
    });
    const slug = `${slugify(venue.name)}-${venue.id}`;
    venue = await prisma.venue.update({
      where: { id: venue.id },
      data: { slug },
    });
    console.log(`  Créé : ${venue.name} (${venue.id})`);
  } else {
    console.log(`  Existe : ${venue.name} (${venue.id})`);
  }

  // ---------------------------------------------------------------
  // 2. Créer l'arbitre Adrien Marbot (si absent)
  // ---------------------------------------------------------------
  console.log("\n--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: "Marbot" },
  });
  if (!referee) {
    const refSlugBase = slugify("Adrien Marbot");
    referee = await prisma.referee.create({
      data: {
        firstName: "Adrien",
        lastName: "Marbot",
        slug: refSlugBase,
      },
    });
    referee = await prisma.referee.update({
      where: { id: referee.id },
      data: { slug: `${refSlugBase}-${referee.id}` },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 3. Créer Jintcharadze (absent de la base)
  // ---------------------------------------------------------------
  console.log("\n--- Joueur manquant ---");
  let jintcharadze = await prisma.player.findFirst({
    where: { lastName: "Jintcharadze" },
  });
  if (!jintcharadze) {
    const jSlug = slugify("Vakhtang Jintcharadze");
    jintcharadze = await prisma.player.create({
      data: {
        firstName: "Vakhtang",
        lastName: "Jintcharadze",
        slug: jSlug + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        position: "TALONNEUR",
        isActive: true,
      },
    });
    console.log(`  Créé : Vakhtang Jintcharadze (${jintcharadze.id})`);
  } else {
    console.log(`  Existe : Vakhtang Jintcharadze (${jintcharadze.id})`);
  }
  PLAYER_IDS["Jintcharadze"] = jintcharadze.id;

  // ---------------------------------------------------------------
  // 4. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score evolution (Castres - USAP) :
   * 0-0 → 0-3 (Aucagne pen 7') → 0-6 (Aucagne pen 21')
   * → 3-6 (Le Brun pen 22') → 3-9 (Aucagne pen 26') → 3-12 (Aucagne pen 36')
   * → 8-12 (Papali'i essai 39') → 10-12 (Le Brun conv 40')
   * MI-TEMPS : 10-12
   * → 15-12 (Palis essai 59') → 17-12 (Popelin conv 60')
   * → 20-12 (Popelin pen 67')
   * → 25-12 (Guerois Galisson essai 83') → 27-12 (Popelin conv 84')
   *
   * USAP : 4P = 12 points
   * Castres : 3E + 3T + 2P = 15 + 6 + 6 = 27 points
   */
  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      kickoffTime: "16:30",
      venueId: venue.id,
      refereeId: referee.id,
      halfTimeUsap: 12,
      halfTimeOpponent: 10,
      // Détail scoring USAP
      triesUsap: 0,
      conversionsUsap: 0,
      penaltiesUsap: 4,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Castres
      triesOpponent: 3,
      conversionsOpponent: 3,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Infos complémentaires
      report:
        "3e défaite consécutive pour l'USAP en ce début de saison. Avec le vent en première " +
        "mi-temps, l'USAP mène 3-12 grâce à 4 pénalités d'Aucagne. Mais Castres réduit " +
        "l'écart par un essai de Papali'i juste avant la pause (10-12). En 2e période, face " +
        "au vent et sans ballon, l'USAP craque : essai de Palis (59'), puis un essai USAP de " +
        "maul roulant est refusé par la TMO. Castres enfonce le clou avec un bonus offensif " +
        "grâce à Guerois Galisson après la sirène (27-12).",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, stade, rapport)");

  // ---------------------------------------------------------------
  // 5. Composition USAP (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  const deleted = await prisma.matchPlayer.deleteMany({
    where: { matchId: MATCH_ID, isOpponent: false },
  });
  console.log(`  ${deleted.count} entrée(s) USAP supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = PLAYER_IDS[p.lastName];
    if (!playerId) {
      console.log(`  ⚠ Joueur non trouvé : ${p.lastName}`);
      continue;
    }

    let tries = 0,
      conversions = 0,
      penalties = 0,
      totalPoints = 0;
    let yellowCard = false,
      yellowCardMin: number | null = null;

    // Aucagne : 4 pénalités (7', 21', 26', 36')
    if (p.lastName === "Aucagne") {
      penalties = 4;
      totalPoints = 12;
    }

    // Roelofse : carton jaune (80')
    if (p.lastName === "Roelofse") {
      yellowCard = true;
      yellowCardMin = 80;
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: MATCH_ID,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: false, // Pas de capitaine clairement identifié dans cette compo remanié
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
    const yc = yellowCard ? ` [CJ ${yellowCardMin}']` : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${pts}${yc}`);
  }

  // ---------------------------------------------------------------
  // 6. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: MATCH_ID },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events = [
    // USAP penalties (1re mi-temps)
    {
      minute: 7, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. 0-3.",
    },
    {
      minute: 21, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. 0-6.",
    },
    // Castres penalty
    {
      minute: 22, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Louis Le Brun (Castres). 3-6.",
    },
    // USAP penalties suite
    {
      minute: 26, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. 3-9.",
    },
    {
      minute: 36, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. 3-12.",
    },
    // Castres essai + transfo
    {
      minute: 39, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai d'Abraham Papali'i (Castres). 8-12.",
    },
    {
      minute: 40, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Louis Le Brun (Castres). 10-12.",
    },
    // Carton jaune Papali'i à la mi-temps
    {
      minute: 40, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton jaune Abraham Papali'i (Castres) à la mi-temps.",
    },
    // 2e mi-temps — Castres prend le large
    {
      minute: 59, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Geoffrey Palis (Castres). 15-12.",
    },
    {
      minute: 60, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Pierre Popelin (Castres). 17-12.",
    },
    {
      minute: 67, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Pierre Popelin (Castres). 20-12.",
    },
    // Carton jaune Roelofse
    {
      minute: 80, type: "CARTON_JAUNE" as const,
      playerId: PLAYER_IDS["Roelofse"], isUsap: true,
      description: "Carton jaune Nemo Roelofse (USAP).",
    },
    // Bonus offensif Castres
    {
      minute: 83, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Loïs Guerois Galisson (Castres) après la sirène. 25-12.",
    },
    {
      minute: 84, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Pierre Popelin (Castres). 27-12. Bonus offensif.",
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
    const side = evt.isUsap ? "USAP" : "CO";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Stade Pierre Fabre (Castres)");
  console.log("  Arbitre : Adrien Marbot");
  console.log("  Score mi-temps : Castres 10 - USAP 12");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length} (essais, pénalités, cartons)`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

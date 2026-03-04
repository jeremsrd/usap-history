/**
 * Script de mise à jour du match USAP - Montpellier (J2 Top 14, 14/09/2024)
 * Match délocalisé à Béziers (Stade Raoul-Barrière) car Aimé-Giral en travaux
 *
 * Score final : USAP 7 - 26 Montpellier
 * Mi-temps : USAP 0 - 16 Montpellier
 *
 * Ajoute : stade (Béziers), arbitre, score mi-temps, détail scoring,
 *          composition USAP (23 joueurs), événements du match
 *
 * Sources : top14.lnr.fr, allrugby.com, francebleu.fr, itsrugby.fr
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs31002j1umro8j79pb1"; // Match J2 USAP-Montpellier 2024-2025

// === COMPOSITION USAP ===
// Source : top14.lnr.fr/feuille-de-match/2024-2025/j2/10883-perpignan-montpellier/compositions
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Lam", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Orie", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Tuilagi", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Van Tonder", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Sobela", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "McIntyre", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Crossdale", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Allan", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Bachelier", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: false },
  { num: 22, lastName: "Joseph", position: "AILIER" as const, isStarter: false },
  { num: 23, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: false },
];

// IDs des joueurs USAP (récupérés de la base)
const PLAYER_IDS: Record<string, string> = {
  Devaux: "cmmby9obz00121ucdcgxy6k3w",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
  Orie: "cmmby9pk0001w1ucdhzjt30qx",
  Tuilagi: "cmmby9pso00221ucdwnmxzccc",
  "Van Tonder": "cmmby9qj4002k1ucdmg0rggp5",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  McIntyre: "cmmby9ro0003b1ucd388eacr8",
  Crossdale: "cmmby9rsc003e1ucdli6st6ho",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Montgaillard: "cmmby9op3001b1ucd027i2f17",
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Bachelier: "cmmby9q1g00281ucdpzfoultm",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
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
  console.log("=== Mise à jour match USAP - Montpellier (J2, 14/09/2024) ===\n");

  // ---------------------------------------------------------------
  // 1. Créer le Stade Raoul-Barrière à Béziers (si absent)
  // ---------------------------------------------------------------
  console.log("--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Raoul-Barri" } },
  });
  if (!venue) {
    const france = await prisma.country.findFirst({ where: { code: "FR" } });
    venue = await prisma.venue.create({
      data: {
        name: "Stade Raoul-Barrière",
        slug: "", // Temporaire, mis à jour après
        city: "Béziers",
        countryId: france?.id,
        capacity: 18000,
        yearOpened: 1983,
        isHomeGround: false,
        notes: "Stade de l'AS Béziers Hérault. Utilisé par l'USAP pour ses matchs à domicile en début de saison 2024-2025 pendant les travaux d'Aimé-Giral.",
      },
    });
    // Mettre à jour le slug avec l'ID
    const slug = `${slugify(venue.name)}-${venue.id}`;
    venue = await prisma.venue.update({
      where: { id: venue.id },
      data: { slug },
    });
    console.log(`  Créé : ${venue.name} (${venue.id})`);
    console.log(`  Slug : ${venue.slug}`);
  } else {
    console.log(`  Existe : ${venue.name} (${venue.id})`);
  }

  // ---------------------------------------------------------------
  // 2. Créer l'arbitre Vivien Praderie (si absent)
  // ---------------------------------------------------------------
  console.log("\n--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: "Praderie" },
  });
  if (!referee) {
    const refSlugBase = slugify("Vivien Praderie");
    referee = await prisma.referee.create({
      data: {
        firstName: "Vivien",
        lastName: "Praderie",
        slug: refSlugBase, // Sera complété avec l'ID
      },
    });
    // Mettre à jour le slug avec l'ID
    referee = await prisma.referee.update({
      where: { id: referee.id },
      data: { slug: `${refSlugBase}-${referee.id}` },
    });
    console.log(`  Créé : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  } else {
    console.log(`  Existe : ${referee.firstName} ${referee.lastName} (${referee.id})`);
  }

  // ---------------------------------------------------------------
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Score evolution (USAP - Montpellier) :
   * 0-0 → 0-5 (Tambwe 11') → 0-7 (Coly conv 11') → 0-10 (Miotti DG 19')
   * → 0-13 (Miotti pen 29') → 0-16 (Miotti pen 40')
   * MI-TEMPS : 0-16
   * → 5-16 (Montgaillard? 47') → 7-16 (Allan conv 47')
   * → 7-19 (Miotti pen 62') → 7-24 (Bécognée 78') → 7-26 (Miotti conv 78')
   *
   * USAP : 1E + 1T = 5 + 2 = 7 points
   * Montpellier : 2E + 2T + 3P + 1DG = 10 + 4 + 9 + 3 = 26 points
   */
  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      kickoffTime: "16:30",
      venueId: venue.id,
      refereeId: referee.id,
      // Mi-temps (convention : score USAP en premier)
      halfTimeUsap: 0,
      halfTimeOpponent: 16,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Montpellier (adversaire)
      triesOpponent: 2,
      conversionsOpponent: 2,
      penaltiesOpponent: 3,
      dropGoalsOpponent: 1,
      penaltyTriesOpponent: 0,
      // Infos complémentaires
      report:
        "Deuxième journée de la saison 2024-2025, match délocalisé au Stade Raoul-Barrière " +
        "de Béziers en raison des travaux du Stade Aimé-Giral. L'USAP est dominée par Montpellier " +
        "et ne parvient pas à marquer en première mi-temps (0-16). Seul essai catalan inscrit en " +
        "début de 2e période par Montgaillard, profitant de l'infériorité numérique montpelliéraine " +
        "(carton jaune Camara). Lourde défaite 7-26, deuxième revers consécutif après Bayonne. " +
        "Nombreuses blessures côté perpignanais (Devaux, Lam, Crossdale, Allan, Tuilagi).",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, stade, rapport)");

  // ---------------------------------------------------------------
  // 4. Composition USAP (23 joueurs)
  // ---------------------------------------------------------------
  console.log("\n--- Composition USAP ---");

  // Nettoyage des éventuels MatchPlayer existants (USAP seulement)
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

    // Stats individuelles pour le match
    let tries = 0,
      conversions = 0,
      penalties = 0,
      totalPoints = 0;
    let yellowCard = false,
      yellowCardMin: number | null = null;

    // Montgaillard : 1 essai (~47')
    if (p.lastName === "Montgaillard") {
      tries = 1;
      totalPoints = 5;
    }

    // Allan : 1 transformation (~47')
    if (p.lastName === "Allan") {
      conversions = 1;
      totalPoints = 2;
    }

    await prisma.matchPlayer.create({
      data: {
        matchId: MATCH_ID,
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
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = p.lastName === "De La Fuente" ? " (C)" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}`);
  }

  // ---------------------------------------------------------------
  // 5. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  // Nettoyage
  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: MATCH_ID },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  /**
   * Chronologie reconstituée :
   * 11' Essai Tambwe (MHR) → 0-5
   * 11' Transformation Coly (MHR) → 0-7
   * 19' Drop Miotti (MHR) → 0-10
   * 29' Pénalité Miotti (MHR) → 0-13
   * 40' Pénalité Miotti (MHR) → 0-16
   * 40' Carton jaune Camara (MHR)
   * -- MI-TEMPS 0-16 --
   * 47' Essai Montgaillard (USAP) → 5-16
   * 47' Transformation Allan (USAP) → 7-16
   * 62' Pénalité Miotti (MHR) → 7-19
   * 78' Essai Bécognée (MHR) → 7-24
   * 78' Transformation Miotti (MHR) → 7-26
   */
  const events = [
    // Montpellier events (isUsap: false)
    {
      minute: 11,
      type: "ESSAI" as const,
      playerId: null,
      isUsap: false,
      description: "Essai de Madosh Tambwe (Montpellier). 0-5.",
    },
    {
      minute: 11,
      type: "TRANSFORMATION" as const,
      playerId: null,
      isUsap: false,
      description: "Transformation de Léo Coly (Montpellier). 0-7.",
    },
    {
      minute: 19,
      type: "DROP" as const,
      playerId: null,
      isUsap: false,
      description: "Drop de Domingo Miotti (Montpellier). 0-10.",
    },
    {
      minute: 29,
      type: "PENALITE" as const,
      playerId: null,
      isUsap: false,
      description: "Pénalité de Domingo Miotti (Montpellier). 0-13.",
    },
    {
      minute: 40,
      type: "PENALITE" as const,
      playerId: null,
      isUsap: false,
      description: "Pénalité de Domingo Miotti (Montpellier). 0-16.",
    },
    {
      minute: 40,
      type: "CARTON_JAUNE" as const,
      playerId: null,
      isUsap: false,
      description: "Carton jaune Yacouba Camara (Montpellier) juste avant la mi-temps.",
    },
    // USAP events (isUsap: true)
    {
      minute: 47,
      type: "ESSAI" as const,
      playerId: PLAYER_IDS["Montgaillard"],
      isUsap: true,
      description: "Essai de Victor Montgaillard en supériorité numérique (carton Camara). 5-16.",
    },
    {
      minute: 47,
      type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"],
      isUsap: true,
      description: "Transformation de Tommaso Allan. 7-16.",
    },
    // Suite Montpellier
    {
      minute: 62,
      type: "PENALITE" as const,
      playerId: null,
      isUsap: false,
      description: "Pénalité de Domingo Miotti (Montpellier). 7-19.",
    },
    {
      minute: 78,
      type: "ESSAI" as const,
      playerId: null,
      isUsap: false,
      description: "Essai d'Alexandre Bécognée (Montpellier). 7-24.",
    },
    {
      minute: 78,
      type: "TRANSFORMATION" as const,
      playerId: null,
      isUsap: false,
      description: "Transformation de Domingo Miotti (Montpellier). 7-26.",
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
    const side = evt.isUsap ? "USAP" : "MHR";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Stade Raoul-Barrière (Béziers)");
  console.log("  Arbitre : Vivien Praderie");
  console.log("  Score mi-temps : USAP 0 - Montpellier 16");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length} (essais, pénalités, drops, cartons)`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

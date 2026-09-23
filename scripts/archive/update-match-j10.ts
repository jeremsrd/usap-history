/**
 * Script de mise à jour du match Stade Toulousain - USAP (J10 Top 14, 23/11/2024)
 * Score final : Toulouse 41 - 9 USAP
 * Mi-temps : Toulouse 12 - 9 USAP
 *
 * Lourde défaite à Ernest-Wallon malgré un début de match courageux. L'USAP
 * ouvre le score par Aucagne (3') mais encaisse deux essais en 3 minutes
 * (Willis 5', Vergé 8'). Carton rouge pour Fakatika (25') pour déblayage
 * dangereux sur Banos. Réduits à 14, les Catalans résistent en 1re mi-temps
 * (12-9 à la pause grâce aux pénalités d'Aucagne et Kretchmann). Toulouse
 * déroule en 2e mi-temps avec 4 essais supplémentaires. Débuts en Top 14
 * du jeune Gabin Kretchmann (18 ans) qui inscrit une pénalité de 45 mètres.
 * Blessure de Brazo (genou) dès la 9e minute.
 *
 * Sources : top14.lnr.fr, allrugby.com, francebleu.fr, vibrez-rugby.com
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j10.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsa4002z1umrt6187d4g"; // Match J10 Toulouse-USAP 2024-2025

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Lam", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Fakatika", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Labouteley", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Brazo", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Fa'aso'o", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Aucagne", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Crossdale", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Joseph", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Montgaillard", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Boyer Gallardo", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Hicks", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Bachelier", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "Kretchmann", position: "DEMI_OUVERTURE" as const, isStarter: false },
  { num: 22, lastName: "Poulet", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: false },
];

// IDs des joueurs USAP
const PLAYER_IDS: Record<string, string> = {
  Tetrashvili: "cmmby9ogb00151ucdz3vqd429",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Fakatika: "cmmby9p6p001n1ucdxt02xbuc",
  Labouteley: "cmmby9pfj001t1ucd75p7hi07",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Brazo: "cmmby9q5t002b1ucdgw3ikj36",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  Aucagne: "cmmby9riq00381ucdzmy4nusa",
  Crossdale: "cmmby9rsc003e1ucdli6st6ho",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  Montgaillard: "cmmby9op3001b1ucd027i2f17",
  "Boyer Gallardo": "cmmby9o7j000z1ucdwq4kp2mh",
  Hicks: "", // sera créé dynamiquement
  Bachelier: "cmmby9q1g00281ucdpzfoultm",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  Kretchmann: "cmmf2trcs00001upl5gwhqicw",
  Poulet: "cmmby9shz003w1ucdzl5zpnhv",
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
  console.log("=== Mise à jour match Toulouse - USAP (J10, 23/11/2024) ===\n");

  // ---------------------------------------------------------------
  // 0. Créer le joueur Maxwell Hicks (si absent)
  // ---------------------------------------------------------------
  console.log("--- Joueur Hicks ---");
  let hicks = await prisma.player.findFirst({
    where: { lastName: "Hicks" },
  });
  if (!hicks) {
    const slugBase = slugify("Maxwell Hicks");
    hicks = await prisma.player.create({
      data: {
        firstName: "Maxwell",
        lastName: "Hicks",
        slug: slugBase,
        position: "DEUXIEME_LIGNE",
        isActive: true,
      },
    });
    hicks = await prisma.player.update({
      where: { id: hicks.id },
      data: { slug: `${slugBase}-${hicks.id}` },
    });
    console.log(`  Créé : ${hicks.firstName} ${hicks.lastName} (${hicks.id})`);
  } else {
    console.log(`  Existe : ${hicks.firstName} ${hicks.lastName} (${hicks.id})`);
  }
  PLAYER_IDS["Hicks"] = hicks.id;

  // ---------------------------------------------------------------
  // 1. Créer le stade Ernest-Wallon (si absent)
  // ---------------------------------------------------------------
  console.log("\n--- Stade ---");
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Wallon" } },
  });
  if (!venue) {
    const venueSlugBase = slugify("Stade Ernest-Wallon");
    venue = await prisma.venue.create({
      data: {
        name: "Stade Ernest-Wallon",
        slug: `temp-${Date.now()}`,
        city: "Toulouse",
        capacity: 19500,
      },
    });
    venue = await prisma.venue.update({
      where: { id: venue.id },
      data: { slug: `${venueSlugBase}-${venue.id}` },
    });
    console.log(`  Créé : ${venue.name} (${venue.id})`);
  } else {
    console.log(`  Existe : ${venue.name} (${venue.id})`);
  }

  // ---------------------------------------------------------------
  // 2. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  const REFEREE_ID = "cmmetod8a000092cknio7hqts"; // Thomas Charabas

  /**
   * Évolution du score (Toulouse - USAP) :
   *  3' Pénalité Aucagne (USAP) → 0-3
   *  5' Essai Willis (TOU) → 5-3
   *  8' Essai Vergé (TOU) → 10-3
   *  9' Transfo Ntamack (TOU) → 12-3
   * 25' CARTON ROUGE Fakatika (USAP)
   * 28' Pénalité Aucagne (USAP) → 12-6
   * 38' Pénalité Kretchmann (USAP) → 12-9
   * MI-TEMPS : Toulouse 12 - 9 USAP
   * 45' Pénalité Ntamack (TOU) → 15-9
   * 47' Essai Graou (TOU) → 20-9
   * 48' Transfo Ntamack (TOU) → 22-9
   * 55' Essai Vergé (TOU) → 27-9
   * 56' Transfo Ntamack (TOU) → 29-9
   * 68' Essai Cramont (TOU) → 34-9
   * 69' Transfo Ntamack (TOU) → 36-9
   * 75' Essai Ntamack (TOU) → 41-9
   *
   * USAP : 3P = 9 points
   * TOU : 6E + 4T + 1P = 30 + 8 + 3 = 41 points
   */
  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      kickoffTime: "16:30",
      refereeId: REFEREE_ID,
      venueId: venue.id,
      attendance: 18500,
      halfTimeUsap: 9,
      halfTimeOpponent: 12,
      // Détail scoring USAP
      triesUsap: 0,
      conversionsUsap: 0,
      penaltiesUsap: 3,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Toulouse
      triesOpponent: 6,
      conversionsOpponent: 4,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Rapport
      report:
        "Lourde défaite à Ernest-Wallon (9-41). L'USAP ouvre le score par Aucagne (3') mais " +
        "Willis (5') et Vergé (8') inscrivent deux essais en 3 minutes. Carton rouge pour " +
        "Fakatika (25') après un déblayage dangereux sur Banos. Réduits à 14, les Catalans " +
        "résistent en 1re mi-temps (12-9 à la pause) grâce aux pénalités d'Aucagne (28') et " +
        "du jeune Kretchmann (38', 45 mètres, débuts en Top 14 à 18 ans). Toulouse déroule " +
        "en 2e mi-temps avec 4 essais (Graou, Vergé, Cramont, Ntamack). Blessure de Brazo " +
        "(genou, sortie 9'). Fakatika suspendu 6 semaines.",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, stade, rapport)");

  // ---------------------------------------------------------------
  // 3. Composition USAP (23 joueurs)
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
      totalPoints = 0,
      redCard = false,
      redCardMin: number | null = null;

    // Stats individuelles
    if (p.lastName === "Aucagne") {
      penalties = 2;
      totalPoints = 2 * 3; // 6
    } else if (p.lastName === "Kretchmann") {
      penalties = 1;
      totalPoints = 3;
    } else if (p.lastName === "Fakatika") {
      redCard = true;
      redCardMin = 25;
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
        redCard,
        redCardMin,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    const card = redCard ? " [ROUGE]" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${card}`);
  }

  // ---------------------------------------------------------------
  // 4. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: MATCH_ID },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events = [
    // === 1re mi-temps ===
    // 2' Lam sort HIA → Montgaillard
    {
      minute: 2, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Sortie de Seilala Lam (HIA). Remplacé temporairement par Victor Montgaillard.",
    },
    {
      minute: 2, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Montgaillard"], isUsap: true,
      description: "Entrée de Victor Montgaillard en remplacement temporaire de Lam (HIA).",
    },
    {
      minute: 3, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. L'USAP ouvre le score. 0-3.",
    },
    {
      minute: 5, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Jack Willis (Toulouse). 5-3.",
    },
    {
      minute: 8, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Clément Vergé (Toulouse). 10-3.",
    },
    {
      minute: 9, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Romain Ntamack (Toulouse). 12-3.",
    },
    // 9' Brazo sort blessé → Bachelier
    {
      minute: 9, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Brazo"], isUsap: true,
      description: "Sortie d'Alan Brazo (blessure genou). Remplacé par Lucas Bachelier.",
    },
    {
      minute: 9, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Bachelier"], isUsap: true,
      description: "Entrée de Lucas Bachelier en remplacement de Brazo (blessure).",
    },
    // 14' Lam revient HIA → Montgaillard off
    {
      minute: 14, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Retour de Seilala Lam (HIA passé).",
    },
    {
      minute: 14, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Montgaillard"], isUsap: true,
      description: "Sortie de Victor Montgaillard (fin remplacement HIA temporaire).",
    },
    // 25' CARTON ROUGE Fakatika
    {
      minute: 25, type: "CARTON_ROUGE" as const,
      playerId: PLAYER_IDS["Fakatika"], isUsap: true,
      description: "Carton rouge pour Akato Fakatika ! Déblayage dangereux sur Léo Banos. USAP à 14.",
    },
    // 25' Reorganisation : Velarte sort, Brookes entre (renforcer la mêlée)
    {
      minute: 25, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Sortie de Lucas Velarte (réorganisation après carton rouge).",
    },
    {
      minute: 25, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Entrée de Kieran Brookes pour stabiliser la mêlée après le rouge de Fakatika.",
    },
    {
      minute: 28, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. L'USAP résiste à 14. 12-6.",
    },
    // 32' Warion → Hicks
    {
      minute: 32, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Warion"], isUsap: true,
      description: "Sortie d'Adrien Warion. Remplacé par Maxwell Hicks.",
    },
    {
      minute: 32, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Hicks"], isUsap: true,
      description: "Entrée de Maxwell Hicks en remplacement de Warion.",
    },
    // 34' Aucagne → Kretchmann (HIA)
    {
      minute: 34, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Sortie d'Antoine Aucagne (HIA). Remplacé par Gabin Kretchmann pour ses débuts en Top 14.",
    },
    {
      minute: 34, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Kretchmann"], isUsap: true,
      description: "Entrée de Gabin Kretchmann (18 ans) pour ses débuts en Top 14 !",
    },
    {
      minute: 38, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Kretchmann"], isUsap: true,
      description: "Pénalité de Gabin Kretchmann de 45 mètres ! Première réalisation en pro. 12-9.",
    },
    // === 2e mi-temps ===
    {
      minute: 45, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Romain Ntamack (Toulouse). 15-9.",
    },
    {
      minute: 47, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Paul Graou (Toulouse). 20-9.",
    },
    {
      minute: 48, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Romain Ntamack (Toulouse). 22-9.",
    },
    // 53' Duguivalu → Poulet
    {
      minute: 53, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Duguivalu"], isUsap: true,
      description: "Sortie d'Alivereti Duguivalu. Remplacé par Job Poulet.",
    },
    {
      minute: 53, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Poulet"], isUsap: true,
      description: "Entrée de Job Poulet en remplacement de Duguivalu.",
    },
    {
      minute: 55, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Clément Vergé (Toulouse, doublé). 27-9.",
    },
    {
      minute: 56, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Romain Ntamack (Toulouse). 29-9.",
    },
    // 56' Hall → Ecochard ; Lam → Montgaillard
    {
      minute: 56, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Hall"], isUsap: true,
      description: "Sortie de James Hall. Remplacé par Tom Ecochard.",
    },
    {
      minute: 56, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Ecochard"], isUsap: true,
      description: "Entrée de Tom Ecochard en remplacement de Hall.",
    },
    {
      minute: 56, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Sortie de Seilala Lam. Remplacé par Victor Montgaillard.",
    },
    {
      minute: 56, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Montgaillard"], isUsap: true,
      description: "Entrée de Victor Montgaillard en remplacement de Lam.",
    },
    {
      minute: 68, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Guillaume Cramont (Toulouse). 34-9.",
    },
    {
      minute: 69, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Romain Ntamack (Toulouse). 36-9.",
    },
    // 73' Veredamu → Aucagne (retour HIA)
    {
      minute: 73, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Veredamu"], isUsap: true,
      description: "Sortie de Tavite Veredamu. Remplacé par Antoine Aucagne (retour HIA).",
    },
    {
      minute: 73, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Retour d'Antoine Aucagne (HIA passé) en remplacement de Veredamu.",
    },
    {
      minute: 75, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Romain Ntamack (Toulouse). Score final 41-9.",
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
    const side = evt.isUsap ? "USAP" : "TOU ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // 5. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesPlayed: Record<string, number> = {
    Tetrashvili: 80,
    Lam: 44,           // 0-2 (HIA) + 14-56
    Fakatika: 25,       // carton rouge
    Labouteley: 80,
    Warion: 32,
    Velarte: 25,        // sort après rouge Fakatika
    Brazo: 9,           // blessure genou
    "Fa'aso'o": 80,
    Hall: 56,
    Aucagne: 41,        // 0-34 + 73-80 (retour HIA)
    Crossdale: 80,
    "De La Fuente": 80,
    Duguivalu: 53,
    Veredamu: 73,
    Joseph: 80,
    Montgaillard: 36,   // 2-14 + 56-80
    "Boyer Gallardo": 0, // non utilisé
    Hicks: 48,          // entre 32'
    Bachelier: 71,      // entre 9'
    Ecochard: 24,       // entre 56'
    Kretchmann: 46,     // entre 34'
    Poulet: 27,         // entre 53'
    Brookes: 55,        // entre 25'
  };

  for (const [lastName, minutes] of Object.entries(minutesPlayed)) {
    const playerId = PLAYER_IDS[lastName];
    if (!playerId) continue;
    await prisma.matchPlayer.updateMany({
      where: { matchId: MATCH_ID, playerId, isOpponent: false },
      data: { minutesPlayed: minutes },
    });
    console.log(`  ${lastName}: ${minutes}'`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Ernest-Wallon (Toulouse) — extérieur");
  console.log("  Arbitre : Thomas Charabas");
  console.log("  Score mi-temps : Toulouse 12 - USAP 9");
  console.log("  Score final : Toulouse 41 - USAP 9");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

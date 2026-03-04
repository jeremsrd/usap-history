/**
 * Script de mise à jour du match USAP - Pau (J5 Top 14, 05/10/2024)
 * Score final : USAP 11 - 10 Pau
 * Mi-temps : USAP 8 - 10 Pau
 *
 * Victoire dramatique sur le fil grâce à une pénalité d'Aucagne à la 80e.
 * Première apparition de Noé Della Schiava en Top 14.
 *
 * Sources : top14.lnr.fr, allrugby.com, francebleu.fr, itsrugby.fr
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxs5q002p1umrstyi2ctn"; // Match J5 USAP-Pau 2024-2025

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Lam", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Fa'aso'o", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Brazo", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Aucagne", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Dubois", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Joseph", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Dupichot", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Fakatika", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Orie", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: false },
  { num: 20, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: false },
  { num: 22, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

// IDs des joueurs USAP (récupérés de la base)
const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Warion: "cmmby9px000251ucddkb7y9j3",
  "Fa'aso'o": "cmmby9qnf002n1ucd8afco6qw",
  Brazo: "cmmby9q5t002b1ucdgw3ikj36",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  Aucagne: "cmmby9riq00381ucdzmy4nusa",
  Dubois: "cmmby9rwn003h1ucdavvw842q",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  Dupichot: "cmmby9t3k004b1ucdtmx0zek2",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Fakatika: "cmmby9p6p001n1ucdxt02xbuc",
  Orie: "cmmby9pk0001w1ucdhzjt30qx",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Aprasidze: "cmmby9r0r002w1ucd1qbfmagq",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Buliruarua: "cmmby9sql00421ucdv9svv599",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
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
  console.log("=== Mise à jour match USAP - Pau (J5, 05/10/2024) ===\n");

  // ---------------------------------------------------------------
  // 1. Stade Aimé-Giral (devrait déjà exister)
  // ---------------------------------------------------------------
  console.log("--- Stade ---");
  const venue = await prisma.venue.findFirst({
    where: { name: { contains: "Giral" } },
  });
  if (venue) {
    console.log(`  Existe : ${venue.name} (${venue.id})`);
  } else {
    console.log("  ⚠ Stade Aimé-Giral non trouvé !");
    return;
  }

  // ---------------------------------------------------------------
  // 2. Créer l'arbitre Pierre Brousset (si absent)
  // ---------------------------------------------------------------
  console.log("\n--- Arbitre ---");
  let referee = await prisma.referee.findFirst({
    where: { lastName: "Brousset" },
  });
  if (!referee) {
    const refSlugBase = slugify("Pierre Brousset");
    referee = await prisma.referee.create({
      data: {
        firstName: "Pierre",
        lastName: "Brousset",
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
  // 3. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (USAP - Pau) :
   * 13' Pénalité Aucagne → 3-0
   * 21' Pénalité Simmonds (Pau) → 3-3
   * 31' Essai Aucagne → 8-3
   * 39' Essai Laporte (Pau) + Transfo Simmonds → 8-10
   * MI-TEMPS : 8-10
   * 67' Carton jaune Zegueur (Pau)
   * 80' Pénalité Aucagne → 11-10
   *
   * USAP : 1E + 0T + 2P = 5 + 0 + 6 = 11 points
   * Pau : 1E + 1T + 1P = 5 + 2 + 3 = 10 points
   */
  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      kickoffTime: "16:30",
      venueId: venue.id,
      refereeId: referee.id,
      attendance: 14000,
      halfTimeUsap: 8,
      halfTimeOpponent: 10,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 0,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Pau
      triesOpponent: 1,
      conversionsOpponent: 1,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Rapport
      report:
        "Victoire dramatique de l'USAP sur le fil (11-10) grâce à une pénalité " +
        "d'Antoine Aucagne à la dernière minute. Menés 8-10 pendant toute la 2e mi-temps, " +
        "les Catalans arrachent la victoire dans les ultimes secondes. Un essai est d'abord " +
        "refusé par la TMO, mais l'arbitre Pierre Brousset accorde une pénalité. Aucagne, " +
        "à environ 40 mètres, ne tremble pas. Première titularisation de Noé Della Schiava " +
        "en Top 14.",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, stade, rapport)");

  // ---------------------------------------------------------------
  // 4. Composition USAP (23 joueurs)
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

    // Stats individuelles
    if (p.lastName === "Aucagne") {
      tries = 1;
      penalties = 2;
      totalPoints = 11; // 1E(5) + 2P(6) = 11
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
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}`);
  }

  // ---------------------------------------------------------------
  // 5. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: MATCH_ID },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events = [
    // 1re mi-temps
    {
      minute: 13, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne. 3-0.",
    },
    {
      minute: 21, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Joe Simmonds (Pau). 3-3.",
    },
    {
      minute: 31, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Essai d'Antoine Aucagne. 8-3.",
    },
    {
      minute: 39, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Clément Laporte (Pau). 8-8.",
    },
    {
      minute: 39, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Joe Simmonds (Pau). 8-10.",
    },
    // 2e mi-temps
    {
      minute: 67, type: "CARTON_JAUNE" as const,
      playerId: null, isUsap: false,
      description: "Carton jaune Sacha Zegueur (Pau).",
    },
    {
      minute: 80, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Aucagne"], isUsap: true,
      description: "Pénalité d'Antoine Aucagne à la dernière minute. 11-10. Victoire !",
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
    const side = evt.isUsap ? "USAP" : "PAU";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} - ${evt.description.split(".")[0]}`);
  }

  // ---------------------------------------------------------------
  // Résumé final
  // ---------------------------------------------------------------
  console.log("\n=== Mise à jour terminée ===");
  console.log("  Stade : Aimé-Giral (Perpignan)");
  console.log("  Arbitre : Pierre Brousset");
  console.log("  Score mi-temps : USAP 8 - Pau 10");
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

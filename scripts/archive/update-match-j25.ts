/**
 * Script de mise à jour du match Stade Rochelais - USAP (J25 Top 14, 31/05/2025)
 * Score final : La Rochelle 38 - USAP 15
 * Mi-temps : La Rochelle 17 - USAP 12
 *
 * Défaite à Marcel-Deflandre. L'USAP ouvre le score par Allan (pén 5') mais
 * Kerr-Barlow égalise puis dépasse (essais 9', 28'). Allan maintient les siens
 * au contact avec 5 pénalités (5', 26', 35', 40', 42'), 17-15 à la 42'.
 * Mais La Rochelle accélère en 2e MT : Bourgarit (52'), Paiva (68'), Leyds (76').
 * Hastoy impeccable (5/5 transfos + 1 pén, 13 pts). Sobéla sort sur blessure
 * (genou, fin de saison), McIntyre sort pour commotion. CJ Van Tonder (51').
 * L'USAP n'inscrit aucun essai. 13e au classement, access match en vue.
 *
 * Sources : top14.lnr.fr, allrugby.com, espn.co.uk, xvovalie.com, francebleu.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j25.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsnh003t1umrs41gfzk9";

const USAP_SQUAD = [
  { num: 1, lastName: "Tetrashvili", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Lotrian", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Tuilagi", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Van Tonder", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Sobela", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "McIntyre", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Dubois", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Allan", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Lam", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Velarte", position: "NUMERO_HUIT" as const, isStarter: false },
  { num: 20, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 21, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 22, lastName: "Delpy", position: "DEMI_OUVERTURE" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

const PLAYER_IDS: Record<string, string> = {
  Tetrashvili: "cmmby9ogb00151ucdz3vqd429",
  Lotrian: "", // sera rempli dynamiquement après création
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Tuilagi: "cmmby9pso00221ucdwnmxzccc",
  "Van Tonder": "cmmby9qj4002k1ucdmg0rggp5",
  Hicks: "cmmf3v3b300001ufyqblsuba1",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  McIntyre: "cmmby9ro0003b1ucd388eacr8",
  Dubois: "cmmby9rwn003h1ucdavvw842q",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  Delpy: "cmmby9tcw004h1ucd3hmy7wmy",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

async function main() {
  console.log("=== Mise à jour match Stade Rochelais - USAP (J25, 31/05/2025) ===\n");

  // ---------------------------------------------------------------
  // 0a. Créer Mathys Lotrian s'il n'existe pas (nouveau joueur USAP)
  // ---------------------------------------------------------------
  let lotrian = await prisma.player.findFirst({
    where: { lastName: "Lotrian", firstName: "Mathys" },
  });
  if (!lotrian) {
    lotrian = await prisma.player.create({
      data: {
        firstName: "Mathys",
        lastName: "Lotrian",
        slug: "mathys-lotrian",
        position: "TALONNEUR",
        isActive: true,
      },
    });
    console.log("  Joueur Mathys Lotrian créé:", lotrian.id);
  }
  PLAYER_IDS["Lotrian"] = lotrian.id;

  // ---------------------------------------------------------------
  // 0b. Créer le Stade Marcel-Deflandre s'il n'existe pas
  // ---------------------------------------------------------------
  let venue = await prisma.venue.findFirst({ where: { name: { contains: "Deflandre" } } });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade Marcel-Deflandre",
        slug: "stade-marcel-deflandre",
        city: "La Rochelle",
        capacity: 16000,
      },
    });
    console.log("  Stade Marcel-Deflandre créé:", venue.id);
  }

  // ---------------------------------------------------------------
  // 1. Mise à jour du match
  // ---------------------------------------------------------------
  console.log("--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-05-31"),
      kickoffTime: "16:30",
      venueId: venue.id,
      refereeId: "cmmetod8a000092cknio7hqts", // Thomas Charabas
      halfTimeUsap: 12,
      halfTimeOpponent: 17,
      triesUsap: 0,
      conversionsUsap: 0,
      penaltiesUsap: 5,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      triesOpponent: 5,
      conversionsOpponent: 5,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      bonusOffensif: false,
      bonusDefensif: false,
      report:
        "Défaite au Stade Marcel-Deflandre pour l'avant-dernière journée. L'USAP ouvre le score par Allan (pénalité 5', 0-3) mais Kerr-Barlow réplique d'un essai (9', 7-3) pour son dernier match à domicile. Hastoy ajoute une pénalité (24', 10-3) puis Allan réduit l'écart (26', 10-6). Kerr-Barlow signe un doublé (28', 17-6) mais les Catalans répondent par Allan (35', 17-9 ; 40', 17-12). Mi-temps 17-12. Allan recolle à 2 points (42', 17-15) mais l'USAP ne franchira jamais la ligne d'en-but. Cartons jaunes pour Boudehent (49', La Rochelle) et Van Tonder (51', USAP). Bourgarit enfonce le clou en force (52', 24-15). Sobéla sort sur blessure au genou (fin de saison) et McIntyre sur commotion. Paiva (68', 31-15) et Leyds (76', 38-15) finissent le travail. Hastoy parfait au pied (5/5 transfos + 1 pén). L'USAP reste 13e avec 40 points, condamnée à jouer l'access match.",
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
    let yellowCard = false;
    let yellowCardMin: number | null = null;

    if (p.lastName === "Allan") { penalties = 5; totalPoints = 15; }
    else if (p.lastName === "Van Tonder") { yellowCard = true; yellowCardMin = 51; }

    await prisma.matchPlayer.create({
      data: {
        matchId: MATCH_ID,
        playerId,
        isOpponent: false,
        shirtNumber: p.num,
        isStarter: p.isStarter,
        isCaptain: (p as { isCaptain?: boolean }).isCaptain ?? false,
        positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard, yellowCardMin,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    const yc = yellowCard ? ` [CJ ${yellowCardMin}']` : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}${yc}`);
  }

  // ---------------------------------------------------------------
  // 3. Événements du match
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  await prisma.matchEvent.deleteMany({ where: { matchId: MATCH_ID } });

  const events = [
    // 5' - Pénalité Allan (USAP)
    { minute: 5, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. La Rochelle 0 - USAP 3." },

    // 9' - Essai Kerr-Barlow (La Rochelle)
    { minute: 9, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Tawera Kerr-Barlow (Stade Rochelais). La Rochelle 5 - USAP 3." },
    { minute: 10, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation d'Antoine Hastoy (Stade Rochelais). La Rochelle 7 - USAP 3." },

    // 24' - Pénalité Hastoy (La Rochelle)
    { minute: 24, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité d'Antoine Hastoy (Stade Rochelais). La Rochelle 10 - USAP 3." },

    // 25' - Sobela sort sur blessure → Velarte entre
    { minute: 25, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Sobela"], isUsap: true,
      description: "Sortie de Patrick Sobéla (blessure au genou, fin de saison)." },
    { minute: 25, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Entrée de Lucas Velarte en remplacement de Sobéla." },

    // 26' - Pénalité Allan (USAP)
    { minute: 26, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. La Rochelle 10 - USAP 6." },

    // 28' - Essai Kerr-Barlow (La Rochelle)
    { minute: 28, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Tawera Kerr-Barlow (Stade Rochelais), son doublé. Dernier match à domicile. La Rochelle 15 - USAP 6." },
    { minute: 29, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation d'Antoine Hastoy (Stade Rochelais). La Rochelle 17 - USAP 6." },

    // 35' - Pénalité Allan (USAP)
    { minute: 35, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. La Rochelle 17 - USAP 9." },

    // 40' - Pénalité Allan (USAP)
    { minute: 40, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan juste avant la pause. La Rochelle 17 - USAP 12." },

    // MI-TEMPS 17-12

    // 42' - Pénalité Allan (USAP)
    { minute: 42, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan en début de 2e mi-temps. La Rochelle 17 - USAP 15." },

    // 49' - CJ Boudehent (La Rochelle)
    { minute: 49, type: "CARTON_JAUNE", playerId: null, isUsap: false,
      description: "Carton jaune pour Paul Boudehent (Stade Rochelais)." },

    // 50' - Front row change
    { minute: 50, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Lotrian"], isUsap: true,
      description: "Sortie de Mathys Lotrian." },
    { minute: 50, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Entrée de Seilala Lam en remplacement de Lotrian." },
    { minute: 50, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Tetrashvili"], isUsap: true,
      description: "Sortie de Giorgi Tetrashvili." },
    { minute: 50, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Beria"], isUsap: true,
      description: "Entrée de Giorgi Beria en remplacement de Tetrashvili." },
    { minute: 50, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Sortie de Kieran Brookes." },
    { minute: 50, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes." },

    // 51' - CJ Van Tonder (USAP)
    { minute: 51, type: "CARTON_JAUNE", playerId: PLAYER_IDS["Van Tonder"], isUsap: true,
      description: "Carton jaune pour Jacobus Van Tonder." },

    // 52' - Essai Bourgarit (La Rochelle)
    { minute: 52, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Pierre Bourgarit (Stade Rochelais), entré du banc. En force au ras de la mêlée. La Rochelle 22 - USAP 15." },
    { minute: 52, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation d'Antoine Hastoy (Stade Rochelais). La Rochelle 24 - USAP 15." },

    // 55' - McIntyre HIA → Delpy, Warion → Tanguy
    { minute: 55, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["McIntyre"], isUsap: true,
      description: "Sortie de Jake McIntyre (protocole commotion)." },
    { minute: 55, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Entrée de Valentin Delpy en remplacement de McIntyre." },
    { minute: 55, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Warion"], isUsap: true,
      description: "Sortie d'Adrien Warion." },
    { minute: 55, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Tanguy"], isUsap: true,
      description: "Entrée de Mathieu Tanguy en remplacement de Warion." },

    // 62' - Ecochard → Hall
    { minute: 62, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Ecochard"], isUsap: true,
      description: "Sortie de Tom Ecochard." },
    { minute: 62, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Hall"], isUsap: true,
      description: "Entrée de James Hall en remplacement d'Ecochard." },

    // 65' - Hicks → Della Schiava
    { minute: 65, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Hicks"], isUsap: true,
      description: "Sortie de Maxwell Hicks." },
    { minute: 65, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Della Schiava"], isUsap: true,
      description: "Entrée de Noé Della Schiava en remplacement de Hicks." },

    // 68' - Essai Paiva (La Rochelle)
    { minute: 68, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Thierry Paiva (Stade Rochelais), entré du banc. La Rochelle 29 - USAP 15." },
    { minute: 69, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation d'Antoine Hastoy (Stade Rochelais). La Rochelle 31 - USAP 15." },

    // 76' - Essai Leyds (La Rochelle)
    { minute: 76, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Dillyn Leyds (Stade Rochelais), entré du banc. La Rochelle 36 - USAP 15." },
    { minute: 77, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation d'Antoine Hastoy (Stade Rochelais). Score final : La Rochelle 38 - USAP 15." },
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
    Tetrashvili: 50, Lotrian: 50, Brookes: 50, Warion: 55, Tuilagi: 80,
    "Van Tonder": 80, Hicks: 65, Sobela: 25, Ecochard: 62, McIntyre: 55,
    Dubois: 80, "De La Fuente": 80, Duguivalu: 80, Veredamu: 80, Allan: 80,
    Lam: 30, Beria: 30, Tanguy: 25, Velarte: 55, "Della Schiava": 15,
    Hall: 18, Delpy: 25, Ceccarelli: 30,
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
  console.log("  Score mi-temps : La Rochelle 17 - USAP 12");
  console.log("  Score final : La Rochelle 38 - USAP 15");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs`);
  console.log(`  Événements : ${events.length}`);
  console.log("  5 pénalités Allan (5', 26', 35', 40', 42') = 15 pts");
  console.log("  0 essai USAP, 5 essais La Rochelle (Kerr-Barlow x2, Bourgarit, Paiva, Leyds)");
  console.log("  CJ : Van Tonder (51')");
  console.log("  Blessures : Sobéla (genou, fin de saison), McIntyre (commotion)");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

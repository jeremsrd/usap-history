/**
 * Script de mise à jour du match USAP - UBB Bordeaux-Bègles (J18 Top 14, 01/03/2025)
 * Score final : USAP 17 - UBB 29
 * Mi-temps : USAP 0 - UBB 19
 *
 * Défaite à domicile face à l'UBB. Essai d'Echegaray après 7 secondes (record
 * du Top 14). L'USAP encaisse 3 essais en 1ère mi-temps (0-19). Réaction en
 * 2e période avec 2 essais en 5 minutes (Oviedo 44', Velarte 49') mais l'UBB
 * reprend le contrôle (Jalibert pén. 57', Sa essai 64'). Essai De La Fuente
 * pour l'honneur (77'). UBB bonus offensif (4 essais).
 *
 * Sources : top14.lnr.fr, allrugby.com, espn.com, itsrugby.fr, francebleu.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j18.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsh6003f1umrvmeb26q8";

const USAP_SQUAD = [
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Lam", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Delpy", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Crossdale", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Allan", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Roelofse", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Orie", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Bachelier", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Sobela", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 21, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 22, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  Delpy: "cmmby9tcw004h1ucd3hmy7wmy",
  Crossdale: "cmmby9rsc003e1ucdli6st6ho",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Roelofse: "cmmby9pb4001q1ucdi9hhgjrr",
  Orie: "cmmby9pk0001w1ucdhzjt30qx",
  Bachelier: "cmmby9q1g00281ucdpzfoultm",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

async function main() {
  console.log("=== Mise à jour match USAP - UBB (J18, 01/03/2025) ===\n");

  const venue = await prisma.venue.findFirst({
    where: { name: { contains: "Giral", mode: "insensitive" } },
  });
  const referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Brousset", mode: "insensitive" } },
  });
  console.log(`Venue : ${venue?.name} (${venue?.id})`);
  console.log(`Arbitre : ${referee?.firstName} ${referee?.lastName} (${referee?.id})`);

  // ---------------------------------------------------------------
  // 1. Mise à jour du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-03-01"),
      kickoffTime: "21:05",
      venueId: venue?.id,
      refereeId: referee?.id,
      halfTimeUsap: 0,
      halfTimeOpponent: 19,
      triesUsap: 3,
      conversionsUsap: 1,
      penaltiesUsap: 0,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      triesOpponent: 4,
      conversionsOpponent: 3,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      bonusOffensif: false,
      bonusDefensif: false,
      report:
        "Défaite à domicile face à l'UBB, 2e du classement. Début catastrophique : essai d'Echegaray après seulement 7 secondes de jeu sur une erreur à la réception du coup d'envoi, nouveau record du Top 14 (ancien record : 11 secondes). L'UBB enfonce le clou avec Janse van Rensburg (8') et Falatea (28', après un contre de Gray sur un coup de pied d'Ecochard). Score à la pause : 0-19, Aimé-Giral sous le choc. Sortie précoce de Crossdale (24', blessure possible). Réaction d'orgueil en 2e mi-temps : Oviedo (44') et Velarte (49') inscrivent 2 essais en 5 minutes pour revenir à 12-19. L'USAP a même une mêlée à 5m mais un en-avant stoppe l'élan. Gray (UBB) prend un carton jaune mais Jalibert passe une pénalité (57', 12-22) puis Connor Sa marque sur ballon porté (64', 12-29). De La Fuente sauve l'honneur (77', 17-29) mais pas de bonus défensif. L'USAP rétrogradé avant-dernier du Top 14.",
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

    if (p.lastName === "Oviedo") { tries = 1; totalPoints = 5; }
    else if (p.lastName === "Velarte") { tries = 1; totalPoints = 5; }
    else if (p.lastName === "De La Fuente") { tries = 1; totalPoints = 5; }
    else if (p.lastName === "Allan") { conversions = 1; totalPoints = 2; }

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
        yellowCard: false, yellowCardMin: null,
      },
    });
    const marker = p.isStarter ? "TIT" : "REM";
    const pts = totalPoints > 0 ? ` (${totalPoints} pts)` : "";
    const cap = (p as { isCaptain?: boolean }).isCaptain ? " (C)" : "";
    console.log(`  ${marker} ${String(p.num).padStart(2, " ")}. ${p.lastName}${cap}${pts}`);
  }

  // ---------------------------------------------------------------
  // 3. Événements du match
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  await prisma.matchEvent.deleteMany({ where: { matchId: MATCH_ID } });

  const events = [
    { minute: 1, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Jon Echegaray (UBB) après 7 secondes de jeu sur erreur à la réception du coup d'envoi. Record du Top 14. USAP 0 - UBB 5." },
    { minute: 2, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Matthieu Jalibert (UBB). USAP 0 - UBB 7." },
    { minute: 8, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Rohan Janse van Rensburg (UBB) au pied du poteau. USAP 0 - UBB 12." },
    { minute: 9, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Matthieu Jalibert (UBB). USAP 0 - UBB 14." },

    // 24' - Sortie Crossdale (blessure)
    { minute: 24, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Crossdale"], isUsap: true,
      description: "Sortie d'Alistair Crossdale (blessure probable)" },
    { minute: 24, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Naqalevu"], isUsap: true,
      description: "Entrée d'Apisai Naqalevu en remplacement de Crossdale" },

    { minute: 28, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Sipili Falatea (UBB) après un contre de Jonny Gray sur un coup de pied d'Ecochard, relayé par Lucu. USAP 0 - UBB 19." },
    { minute: 28, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Matthieu Jalibert (UBB). USAP 0 - UBB 19." },

    // MI-TEMPS 0-19

    // 40' - Lam → Ruiz
    { minute: 40, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Sortie de Seilala Lam" },
    { minute: 40, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Ruiz"], isUsap: true,
      description: "Entrée d'Ignacio Ruiz en remplacement de Lam" },

    // 44' - Essai Oviedo
    { minute: 44, type: "ESSAI", playerId: PLAYER_IDS["Oviedo"], isUsap: true,
      description: "Essai de Joaquin Oviedo. Transformation ratée par Allan. USAP 5 - UBB 19." },

    // 48' - Warion → Orie
    { minute: 48, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Warion"], isUsap: true,
      description: "Sortie d'Adrien Warion" },
    { minute: 48, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Orie"], isUsap: true,
      description: "Entrée de Marvin Orie en remplacement de Warion" },

    // 49' - Essai Velarte + 50' Transfo Allan
    { minute: 49, type: "ESSAI", playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Essai de Lucas Velarte. USAP 10 - UBB 19." },
    { minute: 50, type: "TRANSFORMATION", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. USAP 12 - UBB 19." },

    // CJ Gray (UBB) ~52'
    { minute: 52, type: "CARTON_JAUNE", playerId: null, isUsap: false,
      description: "Carton jaune pour Jonny Gray (UBB, bras attrapé en l'air en touche)." },

    // 57' - Pénalité Jalibert
    { minute: 57, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Matthieu Jalibert (UBB). USAP 12 - UBB 22." },

    // 58' - Beria → Roelofse, Brookes → Ceccarelli, Velarte → Sobela
    { minute: 58, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Beria"], isUsap: true,
      description: "Sortie de Giorgi Beria" },
    { minute: 58, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Roelofse"], isUsap: true,
      description: "Entrée de Nemo Roelofse en remplacement de Beria" },
    { minute: 58, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Sortie de Kieran Brookes" },
    { minute: 58, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes" },
    { minute: 58, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Sortie de Lucas Velarte" },
    { minute: 58, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Sobela"], isUsap: true,
      description: "Entrée de Patrick Sobela en remplacement de Velarte" },

    // 64' - Essai Connor Sa + Transfo Jalibert
    { minute: 64, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Connor Sa (UBB) sur touche et ballon porté. Premier essai en Top 14. USAP 12 - UBB 27." },
    { minute: 64, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Matthieu Jalibert (UBB). USAP 12 - UBB 29." },

    // 65' - Ecochard → Hall
    { minute: 65, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Ecochard"], isUsap: true,
      description: "Sortie de Tom Ecochard" },
    { minute: 65, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Hall"], isUsap: true,
      description: "Entrée de James Hall en remplacement d'Ecochard" },

    // 70' - Oviedo → Bachelier
    { minute: 70, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Oviedo"], isUsap: true,
      description: "Sortie de Joaquin Oviedo" },
    { minute: 70, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Bachelier"], isUsap: true,
      description: "Entrée de Lucas Bachelier en remplacement d'Oviedo" },

    // 77' - Essai De La Fuente
    { minute: 77, type: "ESSAI", playerId: PLAYER_IDS["De La Fuente"], isUsap: true,
      description: "Essai de Jerónimo De La Fuente pour l'honneur. Transformation ratée par Allan. USAP 17 - UBB 29. Score final." },
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
    const team = evt.isUsap ? "USAP" : "UBB ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesMap: Record<string, number> = {
    Beria: 58, Lam: 40, Brookes: 58, Warion: 48, Tanguy: 80,
    Velarte: 58, "Della Schiava": 80, Oviedo: 70, Ecochard: 65, Delpy: 80,
    Crossdale: 24, "De La Fuente": 80, Duguivalu: 80, Veredamu: 80, Allan: 80,
    Ruiz: 40, Roelofse: 22, Orie: 32, Bachelier: 10, Sobela: 22,
    Hall: 15, Naqalevu: 56, Ceccarelli: 22,
  };

  for (const [lastName, minutes] of Object.entries(minutesMap)) {
    const playerId = PLAYER_IDS[lastName];
    if (!playerId) continue;
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
  console.log("  Score mi-temps : USAP 0 - UBB 19");
  console.log("  Score final : USAP 17 - UBB 29");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs`);
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

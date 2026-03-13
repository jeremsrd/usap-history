/**
 * Script de mise à jour du match Stade Toulousain - USAP (J2 Top 14, 13/09/2025)
 * Score final : Toulouse 31 - USAP 13
 * Mi-temps : Toulouse 14 - USAP 13
 *
 * Défaite à Ernest-Wallon. L'USAP résiste bien en 1re mi-temps grâce à
 * 2 pénalités d'Allan (5', 23') et un essai de Hicks (29') pour mener 14-13.
 * En 2e mi-temps, le banc toulousain fait la différence : 3 essais sans
 * réplique (Delibes, Vergé) et le BO pour le Stade. Carton jaune Diaby (68').
 *
 * Sources : top14.lnr.fr, all.rugby, francebleu.fr, eurosport.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j2-2025.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmnerl8r002r1uj5h9r6ioiy"; // Match J2 Toulouse-USAP 2025-2026

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Lotrian", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Van Tonder", position: "DEUXIEME_LIGNE" as const, isStarter: true, isCaptain: true },
  { num: 5, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Hicks", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Le Corvec", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Yato", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Joseph", position: "ARRIERE" as const, isStarter: true }, // Joseph posté à l'arrière malgré le #11
  { num: 12, lastName: "Paia'aua", position: "CENTRE" as const, isStarter: true },
  { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Dubois", position: "AILIER" as const, isStarter: true }, // Dubois posté ailier malgré le #15
  // Remplaçants
  { num: 16, lastName: "Malolo", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Diaby", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 19, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Aprasidze", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "Buliruarua", position: "CENTRE" as const, isStarter: false },
  { num: 22, lastName: "Poulet", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Roelofse", position: "PILIER_DROIT" as const, isStarter: false },
];

// IDs des joueurs USAP (vérifiés en BDD)
const PLAYER_IDS: Record<string, string> = {
  "Beria": "cmmby9o0c000w1ucd1zgaypmv",
  "Lotrian": "cmmjos9mf00001u6rl2qfe0jc",        // Mathys Lotrian
  "Brookes": "cmmby9oxz001h1ucdqbfwoxa8",
  "Van Tonder": "cmmby9qj4002k1ucdmg0rggp5",
  "Warion": "cmmby9px000251ucddkb7y9j3",
  "Hicks": "cmmnayb27001a1uwstwe35k6y",            // Max Hicks
  "Le Corvec": "cmmltrcbf00661uxdeln7nq76",        // Mattéo Le Corvec
  "Yato": "cmmc8i1z2001i1uxdeulv9wto",
  "Ecochard": "cmmby9r9u00321ucd6g8bkkd8",
  "Allan": "cmmby9sz800481ucd2bll4mvo",
  "Joseph": "cmmby9s0y003k1ucdd4pn5fk4",           // Jefferson-Lee Joseph
  "Paia'aua": "cmmnayctb002g1uwsy2z85sgb",
  "Duguivalu": "cmmby9suw00451ucdgp6z4u0r",
  "Veredamu": "cmmby9s55003n1ucd9oiuxc9e",
  "Dubois": "cmmby9rwn003h1ucdavvw842q",
  "Malolo": "cmmnay9nh000e1uwsp3u7jvlo",
  "Devaux": "cmmby9obz00121ucdcgxy6k3w",
  "Diaby": "cmmnayb6r001d1uws0txihrvp",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  "Aprasidze": "cmmby9r0r002w1ucd1qbfmagq",
  "Buliruarua": "cmmby9sql00421ucdv9svv599",
  "Poulet": "cmmby9shz003w1ucdzl5zpnhv",
  "Roelofse": "cmmby9pb4001q1ucdi9hhgjrr",
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
  console.log("=== Mise à jour match Toulouse - USAP (J2, 13/09/2025) ===\n");

  // ---------------------------------------------------------------
  // 0. Créer l'arbitre Benjamin Hernandez (si absent)
  // ---------------------------------------------------------------
  console.log("--- Arbitre ---");
  let hernandez = await prisma.referee.findFirst({
    where: { lastName: "Hernandez" },
  });
  if (!hernandez) {
    hernandez = await prisma.referee.create({
      data: {
        firstName: "Benjamin",
        lastName: "Hernandez",
      },
    });
    console.log(`  Créé : ${hernandez.firstName} ${hernandez.lastName} (${hernandez.id})`);
  } else {
    console.log(`  Existe : ${hernandez.firstName} ${hernandez.lastName} (${hernandez.id})`);
  }

  const REFEREE_ID = hernandez.id;
  const VENUE_ID = "cmmf3v3hx00011ufyau9jirl4"; // Stade Ernest-Wallon

  // ---------------------------------------------------------------
  // 1. Mettre à jour les infos générales du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  /**
   * Évolution du score (Toulouse - USAP) :
   *  5' Pénalité Allan (USAP) → 0-3
   * 20' Essai Barassi (TOU) + Transfo Ramos → 7-3
   * 23' Pénalité Allan (USAP) → 7-6
   * 26' Essai Flament (TOU) + Transfo Ramos → 14-6
   * 29' Essai Hicks (USAP) → 14-11
   * 30' Transfo Allan (USAP) → 14-13
   * MI-TEMPS : 14-13
   * 43' Pénalité Ramos (TOU) → 17-13
   * 47' Essai Delibes (TOU) + Transfo Ramos → 24-13
   * 57' Essai Vergé (TOU) + Transfo Ntamack → 31-13
   * 68' Carton jaune Diaby (USAP)
   *
   * Toulouse : 4E + 4T + 1P = 20 + 8 + 3 = 31 points
   * USAP : 1E + 1T + 2P = 5 + 2 + 6 = 13 points
   */
  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      kickoffTime: "16:35",
      refereeId: REFEREE_ID,
      venueId: VENUE_ID,
      attendance: null, // Non confirmé
      halfTimeUsap: 13,
      halfTimeOpponent: 14,
      // Détail scoring USAP
      triesUsap: 1,
      conversionsUsap: 1,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      // Détail scoring Toulouse
      triesOpponent: 4,
      conversionsOpponent: 4,
      penaltiesOpponent: 1,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      // Bonus
      bonusOffensif: false,
      bonusDefensif: false,
      // Vidéo
      videoUrl: "https://www.youtube.com/watch?v=eof1YklSY3s",
      // Rapport
      report:
        "Défaite à Ernest-Wallon (13-31). L'USAP réalise une excellente première mi-temps, " +
        "menant au score grâce à deux pénalités d'Allan (5', 23') et un essai de Max Hicks (29') " +
        "après un beau mouvement entre Duguivalu et Veredamu. Score serré à la pause (14-13). " +
        "En seconde période, l'entrée du banc toulousain (Marchand, Baille, Willis dès la 48e) " +
        "fait basculer le match. Trois essais sans réplique de Delibes (47'), Vergé (57') " +
        "et le bonus offensif pour le Stade. Carton jaune pour Diaby (68'). " +
        "L'USAP repart sans point du classement.",
    },
  });
  console.log("  Match mis à jour (score mi-temps, scoring, arbitre, vidéo, rapport)");

  // ---------------------------------------------------------------
  // 2. Composition USAP (23 joueurs)
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
    if (p.lastName === "Hicks") {
      tries = 1;
      totalPoints = 5;
    } else if (p.lastName === "Allan") {
      conversions = 1;
      penalties = 2;
      totalPoints = 1 * 2 + 2 * 3; // 2 + 6 = 8
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
  // 3. Événements du match (timeline)
  // ---------------------------------------------------------------
  console.log("\n--- Événements du match ---");

  const deletedEvents = await prisma.matchEvent.deleteMany({
    where: { matchId: MATCH_ID },
  });
  console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events = [
    // === 1re mi-temps ===
    {
      minute: 5, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. 0-3.",
    },
    {
      minute: 20, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Pierre-Louis Barassi (Toulouse). 5-3.",
    },
    {
      minute: 20, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Thomas Ramos (Toulouse). 7-3.",
    },
    {
      minute: 23, type: "PENALITE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan. 7-6.",
    },
    {
      minute: 26, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Thibaud Flament (Toulouse). 12-6.",
    },
    {
      minute: 26, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Thomas Ramos (Toulouse). 14-6.",
    },
    {
      minute: 29, type: "ESSAI" as const,
      playerId: PLAYER_IDS["Hicks"], isUsap: true,
      description: "Essai de Max Hicks ! Beau mouvement collectif entre Duguivalu et Veredamu. 14-11.",
    },
    {
      minute: 30, type: "TRANSFORMATION" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. 14-13.",
    },
    // === 2e mi-temps ===
    {
      minute: 43, type: "PENALITE" as const,
      playerId: null, isUsap: false,
      description: "Pénalité de Thomas Ramos (Toulouse). 17-13.",
    },
    // 47' Remplacement Lotrian → Malolo
    {
      minute: 47, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Lotrian"], isUsap: true,
      description: "Sortie de Mathys Lotrian. Remplacé par Sama Leonardo Malolo.",
    },
    {
      minute: 47, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Malolo"], isUsap: true,
      description: "Entrée de Sama Leonardo Malolo en remplacement de Lotrian.",
    },
    {
      minute: 47, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Dimitri Delibes (Toulouse). 22-13.",
    },
    {
      minute: 47, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Thomas Ramos (Toulouse). 24-13.",
    },
    // 50' Triple remplacement : Beria → Devaux, Duguivalu → Poulet, Brookes → Roelofse
    {
      minute: 50, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Beria"], isUsap: true,
      description: "Sortie de Giorgi Beria. Remplacé par Bruce Devaux.",
    },
    {
      minute: 50, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Devaux"], isUsap: true,
      description: "Entrée de Bruce Devaux en remplacement de Beria.",
    },
    {
      minute: 50, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Sortie de Kieran Brookes. Remplacé par Nemo Roelofse.",
    },
    {
      minute: 50, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Roelofse"], isUsap: true,
      description: "Entrée de Nemo Roelofse en remplacement de Brookes.",
    },
    {
      minute: 50, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Duguivalu"], isUsap: true,
      description: "Sortie d'Alivereti Duguivalu. Remplacé par Job Poulet.",
    },
    {
      minute: 50, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Poulet"], isUsap: true,
      description: "Entrée de Job Poulet en remplacement de Duguivalu.",
    },
    // 53' Van Tonder → Della Schiava
    {
      minute: 53, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Van Tonder"], isUsap: true,
      description: "Sortie de Jacobus Van Tonder (capitaine). Remplacé par Noé Della Schiava.",
    },
    {
      minute: 53, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Della Schiava"], isUsap: true,
      description: "Entrée de Noé Della Schiava en remplacement de Van Tonder.",
    },
    {
      minute: 57, type: "ESSAI" as const,
      playerId: null, isUsap: false,
      description: "Essai de Clément Vergé (Toulouse, remplaçant). 29-13.",
    },
    {
      minute: 57, type: "TRANSFORMATION" as const,
      playerId: null, isUsap: false,
      description: "Transformation de Romain Ntamack (Toulouse). 31-13.",
    },
    // 58' Allan → Buliruarua, Ecochard → Aprasidze
    {
      minute: 58, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Sortie de Tommaso Allan. Remplacé par Eneriko Buliruarua.",
    },
    {
      minute: 58, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Buliruarua"], isUsap: true,
      description: "Entrée d'Eneriko Buliruarua en remplacement d'Allan.",
    },
    {
      minute: 58, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Ecochard"], isUsap: true,
      description: "Sortie de Tom Ecochard. Remplacé par Gela Aprasidze.",
    },
    {
      minute: 58, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Aprasidze"], isUsap: true,
      description: "Entrée de Gela Aprasidze en remplacement d'Ecochard.",
    },
    // 67' Yato → Diaby
    {
      minute: 67, type: "REMPLACEMENT_SORTIE" as const,
      playerId: PLAYER_IDS["Yato"], isUsap: true,
      description: "Sortie de Peceli Yato. Remplacé par Mahamadou Diaby.",
    },
    {
      minute: 67, type: "REMPLACEMENT_ENTREE" as const,
      playerId: PLAYER_IDS["Diaby"], isUsap: true,
      description: "Entrée de Mahamadou Diaby en remplacement de Yato.",
    },
    // 68' Carton jaune Diaby
    {
      minute: 68, type: "CARTON_JAUNE" as const,
      playerId: PLAYER_IDS["Diaby"], isUsap: true,
      description: "Carton jaune pour Mahamadou Diaby.",
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
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  // Remplacements USAP (source : all.rugby) :
  // 47' Lotrian → Malolo
  // 50' Beria → Devaux, Brookes → Roelofse, Duguivalu → Poulet
  // 53' Van Tonder → Della Schiava
  // 58' Allan → Buliruarua, Ecochard → Aprasidze
  // 67' Yato → Diaby
  const minutesPlayed: Record<string, number> = {
    // Titulaires
    "Beria": 50,
    "Lotrian": 47,
    "Brookes": 50,
    "Van Tonder": 53,
    "Warion": 80,
    "Hicks": 80,
    "Le Corvec": 80,
    "Yato": 67,
    "Ecochard": 58,
    "Allan": 58,
    "Joseph": 80,
    "Paia'aua": 80,
    "Duguivalu": 50,
    "Veredamu": 80,
    "Dubois": 80,
    // Remplaçants
    "Malolo": 33,      // entre 47'
    "Devaux": 30,      // entre 50'
    "Diaby": 13,       // entre 67'
    "Della Schiava": 27, // entre 53'
    "Aprasidze": 22,   // entre 58'
    "Buliruarua": 22,  // entre 58'
    "Poulet": 30,      // entre 50'
    "Roelofse": 30,    // entre 50'
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
  console.log("  Arbitre : Benjamin Hernandez");
  console.log("  Score mi-temps : Toulouse 14 - USAP 13");
  console.log("  Score final : Toulouse 31 - USAP 13");
  console.log("  Composition : 23 joueurs USAP (15 titulaires + 8 remplaçants)");
  console.log(`  Événements : ${events.length}`);
  console.log("  Vidéo : https://www.youtube.com/watch?v=eof1YklSY3s");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

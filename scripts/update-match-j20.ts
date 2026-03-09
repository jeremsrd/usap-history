/**
 * Script de mise à jour du match Vannes - USAP (J20 Top 14, 29/03/2025)
 * Score final : Vannes 20 - USAP 20
 * Mi-temps : Vannes 10 - USAP 10
 *
 * Match nul arraché in extremis au Stade de la Rabine dans un duel crucial
 * pour le maintien. Vannes ouvre le score par Moukoro (8'). De La Fuente
 * égalise (19'). 10-10 à la mi-temps. Vannes mène 20-10 après l'essai
 * de Taccola (75'), mais Porch prend un CJ (75'). Lam réduit l'écart (77'),
 * Allan transforme puis passe la pénalité du nul à la dernière minute (80').
 *
 * Sources : top14.lnr.fr, allrugby.com, espn.com, itsrugby.fr
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/update-match-j20.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MATCH_ID = "cmmbzxsix003j1umrwu3re5ra";

const USAP_SQUAD = [
  { num: 1, lastName: "Beria", position: "PILIER_GAUCHE" as const, isStarter: true },
  { num: 2, lastName: "Ruiz", position: "TALONNEUR" as const, isStarter: true },
  { num: 3, lastName: "Brookes", position: "PILIER_DROIT" as const, isStarter: true },
  { num: 4, lastName: "Warion", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 5, lastName: "Tanguy", position: "DEUXIEME_LIGNE" as const, isStarter: true },
  { num: 6, lastName: "Sobela", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 7, lastName: "Della Schiava", position: "TROISIEME_LIGNE_AILE" as const, isStarter: true },
  { num: 8, lastName: "Oviedo", position: "NUMERO_HUIT" as const, isStarter: true },
  { num: 9, lastName: "Ecochard", position: "DEMI_DE_MELEE" as const, isStarter: true },
  { num: 10, lastName: "McIntyre", position: "DEMI_OUVERTURE" as const, isStarter: true },
  { num: 11, lastName: "Joseph", position: "AILIER" as const, isStarter: true },
  { num: 12, lastName: "De La Fuente", position: "CENTRE" as const, isStarter: true, isCaptain: true },
  { num: 13, lastName: "Duguivalu", position: "CENTRE" as const, isStarter: true },
  { num: 14, lastName: "Veredamu", position: "AILIER" as const, isStarter: true },
  { num: 15, lastName: "Delpy", position: "ARRIERE" as const, isStarter: true },
  // Remplaçants
  { num: 16, lastName: "Lam", position: "TALONNEUR" as const, isStarter: false },
  { num: 17, lastName: "Devaux", position: "PILIER_GAUCHE" as const, isStarter: false },
  { num: 18, lastName: "Hicks", position: "DEUXIEME_LIGNE" as const, isStarter: false },
  { num: 19, lastName: "Velarte", position: "TROISIEME_LIGNE_AILE" as const, isStarter: false },
  { num: 20, lastName: "Hall", position: "DEMI_DE_MELEE" as const, isStarter: false },
  { num: 21, lastName: "Allan", position: "DEMI_OUVERTURE" as const, isStarter: false },
  { num: 22, lastName: "Naqalevu", position: "CENTRE" as const, isStarter: false },
  { num: 23, lastName: "Ceccarelli", position: "PILIER_DROIT" as const, isStarter: false },
];

const PLAYER_IDS: Record<string, string> = {
  Beria: "cmmby9o0c000w1ucd1zgaypmv",
  Ruiz: "cmmby9otl001e1ucdlmazhtei",
  Brookes: "cmmby9oxz001h1ucdqbfwoxa8",
  Warion: "cmmby9px000251ucddkb7y9j3",
  Tanguy: "cmmby9pob001z1ucd9q2x11p8",
  Sobela: "cmmby9qem002h1ucdc7w9rskn",
  "Della Schiava": "cmmby9qa8002e1ucd7m6oglv7",
  Oviedo: "cmmby9qrx002q1ucd4gmoaqtw",
  Ecochard: "cmmby9r9u00321ucd6g8bkkd8",
  McIntyre: "cmmby9ro0003b1ucd388eacr8",
  Joseph: "cmmby9s0y003k1ucdd4pn5fk4",
  "De La Fuente": "cmmby9s9f003q1ucddwhqr3f8",
  Duguivalu: "cmmby9suw00451ucdgp6z4u0r",
  Veredamu: "cmmby9s55003n1ucd9oiuxc9e",
  Delpy: "cmmby9tcw004h1ucd3hmy7wmy",
  Lam: "cmmby9oko00181ucd95s3xupu",
  Devaux: "cmmby9obz00121ucdcgxy6k3w",
  Hicks: "cmmf3v3b300001ufyqblsuba1",
  Velarte: "cmmby9qwd002t1ucdicuuybn0",
  Hall: "cmmby9re700351ucdmkgyg4k6",
  Allan: "cmmby9sz800481ucd2bll4mvo",
  Naqalevu: "cmmby9sdp003t1ucd9uokugox",
  Ceccarelli: "cmmby9p2b001k1ucd3lgmjsyw",
};

async function main() {
  console.log("=== Mise à jour match Vannes - USAP (J20, 29/03/2025) ===\n");

  // Vérifier/créer le Stade de la Rabine
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: "Rabine", mode: "insensitive" } },
  });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        name: "Stade de la Rabine",
        city: "Vannes",
        capacity: 11800,
        slug: "stade-de-la-rabine-temp",
      },
    });
    await prisma.venue.update({
      where: { id: venue.id },
      data: { slug: `stade-de-la-rabine-${venue.id}` },
    });
    console.log(`Venue créé : ${venue.name} (${venue.id})`);
  } else {
    console.log(`Venue existant : ${venue.name} (${venue.id})`);
  }

  // Arbitre : Ludovic Cayre
  const referee = await prisma.referee.findFirst({
    where: { lastName: { contains: "Cayre", mode: "insensitive" } },
  });
  console.log(`Arbitre : ${referee?.firstName} ${referee?.lastName} (${referee?.id})`);

  // ---------------------------------------------------------------
  // 1. Mise à jour du match
  // ---------------------------------------------------------------
  console.log("\n--- Match (infos générales) ---");

  await prisma.match.update({
    where: { id: MATCH_ID },
    data: {
      date: new Date("2025-03-29"),
      kickoffTime: "16:30",
      venueId: venue.id,
      refereeId: referee?.id,
      halfTimeUsap: 10,
      halfTimeOpponent: 10,
      triesUsap: 2,
      conversionsUsap: 2,
      penaltiesUsap: 2,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      triesOpponent: 2,
      conversionsOpponent: 2,
      penaltiesOpponent: 2,
      dropGoalsOpponent: 0,
      penaltyTriesOpponent: 0,
      bonusOffensif: false,
      bonusDefensif: false,
      report:
        "Match nul arraché in extremis au Stade de la Rabine dans un duel crucial pour le maintien entre le 14e (Vannes, 28 pts) et le 13e (USAP, 30 pts). Vannes frappe en premier par Thomas Moukoro Abouem, essai de pilier en puissance (8', 7-0). L'USAP répond par une pénalité de Delpy (17', 7-3) puis un essai du capitaine De La Fuente, transformé par Delpy (19', 7-10). Lafage égalise sur pénalité avant la pause (33', 10-10). Domination stérile de l'USAP en début de 2e mi-temps, c'est Vannes qui reprend l'avantage par une pénalité de Lafage (53', 13-10). À la 75e, Robin Taccola marque pour Vannes (20-10), le match semble plié. Mais John Porch prend un carton jaune pour faute dans les airs (75'). Lam réduit l'écart immédiatement (77', 20-15), Allan transforme (78', 20-17), puis l'USAP joue après la sirène et obtient une pénalité que Tommaso Allan convertit pour arracher le nul (80', 20-20). Résultat précieux dans la course au maintien.",
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

    if (p.lastName === "De La Fuente") { tries = 1; totalPoints = 5; }
    else if (p.lastName === "Delpy") { penalties = 1; conversions = 1; totalPoints = 5; }
    else if (p.lastName === "Lam") { tries = 1; totalPoints = 5; }
    else if (p.lastName === "Allan") { conversions = 1; penalties = 1; totalPoints = 5; }

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
    // 1ère mi-temps
    { minute: 8, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Thomas Moukoro Abouem (Vannes), essai de pilier en puissance. Vannes 5 - USAP 0." },
    { minute: 9, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Maxime Lafage (Vannes). Vannes 7 - USAP 0." },

    { minute: 17, type: "PENALITE", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Pénalité de Valentin Delpy. Vannes 7 - USAP 3." },

    { minute: 19, type: "ESSAI", playerId: PLAYER_IDS["De La Fuente"], isUsap: true,
      description: "Essai du capitaine Jerónimo De La Fuente. Vannes 7 - USAP 8." },
    { minute: 20, type: "TRANSFORMATION", playerId: PLAYER_IDS["Delpy"], isUsap: true,
      description: "Transformation de Valentin Delpy. Vannes 7 - USAP 10." },

    // 29' - Ecochard → Hall
    { minute: 29, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Ecochard"], isUsap: true,
      description: "Sortie de Tom Ecochard" },
    { minute: 29, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Hall"], isUsap: true,
      description: "Entrée de James Hall en remplacement d'Ecochard" },

    { minute: 33, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Maxime Lafage (Vannes). Vannes 10 - USAP 10. Score à la mi-temps." },

    // MI-TEMPS 10-10

    // 50' - Warion → Hicks, Sobela → Velarte
    { minute: 50, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Warion"], isUsap: true,
      description: "Sortie d'Adrien Warion" },
    { minute: 50, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Hicks"], isUsap: true,
      description: "Entrée de Maxwell Hicks en remplacement de Warion" },
    { minute: 50, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Sobela"], isUsap: true,
      description: "Sortie de Patrick Sobela" },
    { minute: 50, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Velarte"], isUsap: true,
      description: "Entrée de Lucas Velarte en remplacement de Sobela" },

    // 52' - Brookes → Ceccarelli
    { minute: 52, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Brookes"], isUsap: true,
      description: "Sortie de Kieran Brookes" },
    { minute: 52, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Ceccarelli"], isUsap: true,
      description: "Entrée de Pietro Ceccarelli en remplacement de Brookes" },

    { minute: 53, type: "PENALITE", playerId: null, isUsap: false,
      description: "Pénalité de Maxime Lafage (Vannes). Vannes 13 - USAP 10." },

    // 58' - McIntyre → Allan
    { minute: 58, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["McIntyre"], isUsap: true,
      description: "Sortie de Jake McIntyre" },
    { minute: 58, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Entrée de Tommaso Allan en remplacement de McIntyre" },

    // 60' - Beria → Devaux, Ruiz → Lam
    { minute: 60, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Beria"], isUsap: true,
      description: "Sortie de Giorgi Beria" },
    { minute: 60, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Devaux"], isUsap: true,
      description: "Entrée de Bruce Devaux en remplacement de Beria" },
    { minute: 60, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Ruiz"], isUsap: true,
      description: "Sortie d'Ignacio Ruiz" },
    { minute: 60, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Entrée de Seilala Lam en remplacement de Ruiz" },

    // 66' - Joseph → Naqalevu
    { minute: 66, type: "REMPLACEMENT_SORTIE", playerId: PLAYER_IDS["Joseph"], isUsap: true,
      description: "Sortie de Jefferson-Lee Joseph" },
    { minute: 66, type: "REMPLACEMENT_ENTREE", playerId: PLAYER_IDS["Naqalevu"], isUsap: true,
      description: "Entrée d'Apisai Naqalevu en remplacement de Joseph" },

    // 75' - Essai Taccola + CJ Porch (Vannes)
    { minute: 75, type: "ESSAI", playerId: null, isUsap: false,
      description: "Essai de Robin Taccola (Vannes). Vannes 18 - USAP 10." },
    { minute: 75, type: "CARTON_JAUNE", playerId: null, isUsap: false,
      description: "Carton jaune pour John Porch (Vannes, faute dans les airs). Vannes à 14." },
    { minute: 76, type: "TRANSFORMATION", playerId: null, isUsap: false,
      description: "Transformation de Maxime Lafage (Vannes). Vannes 20 - USAP 10." },

    // 77' - Essai Lam
    { minute: 77, type: "ESSAI", playerId: PLAYER_IDS["Lam"], isUsap: true,
      description: "Essai de Seilala Lam, entré en jeu comme remplaçant, profite de la supériorité numérique. Vannes 20 - USAP 15." },
    { minute: 78, type: "TRANSFORMATION", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Transformation de Tommaso Allan. Vannes 20 - USAP 17." },

    // 80' - Pénalité Allan (nul)
    { minute: 80, type: "PENALITE", playerId: PLAYER_IDS["Allan"], isUsap: true,
      description: "Pénalité de Tommaso Allan après la sirène, l'USAP arrache le match nul in extremis. Score final : Vannes 20 - USAP 20." },
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
    const team = evt.isUsap ? "USAP" : "VAN ";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${team}] ${evt.type} - ${evt.description}`);
  }

  // ---------------------------------------------------------------
  // 4. Minutes jouées
  // ---------------------------------------------------------------
  console.log("\n--- Minutes jouées ---");

  const minutesMap: Record<string, number> = {
    Beria: 60, Ruiz: 60, Brookes: 52, Warion: 50, Tanguy: 80,
    Sobela: 50, "Della Schiava": 80, Oviedo: 80, Ecochard: 29, McIntyre: 58,
    Joseph: 66, "De La Fuente": 80, Duguivalu: 80, Veredamu: 80, Delpy: 80,
    Lam: 20, Devaux: 20, Hicks: 30, Velarte: 30, Hall: 51,
    Allan: 22, Naqalevu: 14, Ceccarelli: 28,
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
  console.log("  Score mi-temps : Vannes 10 - USAP 10");
  console.log("  Score final : Vannes 20 - USAP 20");
  console.log(`  Composition : ${USAP_SQUAD.length} joueurs`);
  console.log(`  Événements : ${events.length}`);
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());

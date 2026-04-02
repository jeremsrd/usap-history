/**
 * Mise à jour du match Toulouse - USAP (J12 Top 14, 03/12/2022)
 * Score : Toulouse 34 - USAP 13
 *
 * Défaite à Ernest-Wallon. L'USAP résiste 35 minutes (6-6) avant
 * de craquer en fin de 1re MT : Lebel E (34', T Ramos) et Roumat E
 * (39', T Ramos, sur coup franc vite joué par Mauvaka). Mi-temps : 20-6.
 * Willis E en début de 2e MT (51', T Ramos, 27-6). Montgaillard
 * (remplaçant) inscrit l'essai de l'honneur (63', T Tedder, 27-13).
 * Ntamack E (78') pour le bonus offensif toulousain. Score final : 34-13.
 *
 * Essai USAP : Montgaillard (63')
 * Transformation USAP : Tedder (63')
 * Pénalités USAP : Tedder (~3', ~18')
 * Essais Toulouse : Lebel (34'), Roumat (39'), Willis (51'), Ntamack (78')
 * Transformations Toulouse : Ramos ×4
 * Pénalités Toulouse : Ntamack (~8', ~15')
 * CJ : Galletier (39', USAP), Shields (50', USAP)
 *
 * Sources : allrugby.com (fiche match), francebleu.fr (résumé),
 *   top14.lnr.fr (feuille de match), stadetoulousain.fr (vidéo)
 *
 * Usage : npx tsx scripts/update-match-2022-2023-j12.ts
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

// === COMPOSITION USAP ===
const USAP_SQUAD = [
  // Titulaires
  { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, minutesPlayed: 32, subOut: 32 },
  { num: 2, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 3, firstName: "Siosiua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 4, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 5, firstName: "Victor", lastName: "Moreaux", position: Position.DEUXIEME_LIGNE, isStarter: true, minutesPlayed: 80 },
  { num: 6, firstName: "Brad", lastName: "Shields", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutesPlayed: 80, yellowCard: true, yellowCardMin: 50 },
  { num: 7, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, isCaptain: true, minutesPlayed: 59, subOut: 59, yellowCard: true, yellowCardMin: 39 },
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true, minutesPlayed: 51, subOut: 51 },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, minutesPlayed: 59, subOut: 59 },
  { num: 10, firstName: "Tristan", lastName: "Tedder", position: Position.DEMI_OUVERTURE, isStarter: true, minutesPlayed: 80 },
  { num: 11, firstName: "Alivereti", lastName: "Duguivalu", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 12, firstName: "Jerónimo", lastName: "de la Fuente", position: Position.CENTRE, isStarter: true, minutesPlayed: 59, subOut: 59 },
  { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true, minutesPlayed: 80 },
  { num: 14, firstName: "George", lastName: "Tilsley", position: Position.AILIER, isStarter: true, minutesPlayed: 80 },
  { num: 15, firstName: "Ali", lastName: "Crossdale", position: Position.ARRIERE, isStarter: true, minutesPlayed: 80 },
  // Remplaçants
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 17, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: false, minutesPlayed: 48, subIn: 32 },
  { num: 18, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 19, firstName: "Joaquín", lastName: "Oviedo", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, minutesPlayed: 29, subIn: 51 },
  { num: 20, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: false, minutesPlayed: 21, subIn: 59 },
  { num: 21, firstName: "Matteo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: false, minutesPlayed: 21, subIn: 59 },
  { num: 22, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: false, minutesPlayed: 21, subIn: 59 },
  { num: 23, firstName: "Maafu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: false, minutesPlayed: 29, subIn: 51 },
];

// === COMPOSITION TOULOUSE (adversaire) ===
const OPP_SQUAD = [
  { num: 1, name: "Rodrigue Neti", position: Position.PILIER_GAUCHE, isStarter: true },
  { num: 2, name: "Péato Mauvaka", position: Position.TALONNEUR, isStarter: true },
  { num: 3, name: "Dorian Aldegheri", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, name: "Richie Arnold", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Emmanuel Meafou", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Alban Placines", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, name: "Jack Willis", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Alexandre Roumat", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Martin Page-Relo", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Romain Ntamack", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Matthis Lebel", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Pita Ahki", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Dimitri Delibes", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Ange Capuozzo", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Thomas Ramos", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Julien Marchand", position: Position.TALONNEUR, isStarter: false },
  { num: 17, name: "David Ainu'u", position: Position.PILIER_GAUCHE, isStarter: false },
  { num: 18, name: "Yannick Youyoutte", position: Position.DEUXIEME_LIGNE, isStarter: false },
  { num: 19, name: "Rynhardt Elstadt", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 20, name: "Anthony Jelonch", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
  { num: 21, name: "Antoine Dupont", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 22, name: "Lucas Tauzin", position: Position.AILIER, isStarter: false },
  { num: 23, name: "Charlie Faumuina", position: Position.PILIER_DROIT, isStarter: false },
];

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

async function findOrCreatePlayer(firstName: string, lastName: string, position: Position): Promise<string> {
  const existing = await prisma.player.findFirst({
    where: { firstName: { equals: firstName, mode: "insensitive" }, lastName: { equals: lastName, mode: "insensitive" } },
  });
  if (existing) return existing.id;
  const player = await prisma.player.create({
    data: { firstName, lastName, position, isActive: false, slug: `temp-${Date.now()}-${Math.random()}` },
  });
  await prisma.player.update({ where: { id: player.id }, data: { slug: generatePlayerSlug(firstName, lastName, player.id) } });
  console.log(`  [joueur] Créé : ${firstName} ${lastName}`);
  return player.id;
}

async function findOrCreateReferee(firstName: string, lastName: string): Promise<string> {
  const existing = await prisma.referee.findFirst({
    where: { firstName: { equals: firstName, mode: "insensitive" }, lastName: { equals: lastName, mode: "insensitive" } },
  });
  if (existing) { console.log(`  [arbitre] Existe : ${firstName} ${lastName}`); return existing.id; }
  const referee = await prisma.referee.create({ data: { firstName, lastName, slug: `temp-${Date.now()}` } });
  await prisma.referee.update({ where: { id: referee.id }, data: { slug: generateRefereeSlug(firstName, lastName, referee.id) } });
  console.log(`  [arbitre] Créé : ${firstName} ${lastName}`);
  return referee.id;
}

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log("=== Mise à jour match Toulouse - USAP (J12, 03/12/2022) ===\n");

  const season = await prisma.season.findFirstOrThrow({ where: { startYear: 2022, endYear: 2023 } });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, matchday: 12, competition: { shortName: "Top 14" } },
    include: { opponent: true },
  });
  console.log(`Match trouvé : ${match.slug} (${match.id})`);
  console.log(`  USAP ${match.scoreUsap} - ${match.scoreOpponent} ${match.opponent.name}\n`);

  // Arbitre non identifié avec certitude — pas de mise à jour refereeId
  console.log("--- Arbitre ---");
  console.log("  ⚠ Arbitre non identifié — à compléter ultérieurement");

  console.log("\n--- Match (infos générales) ---");
  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "17:00",
      halfTimeUsap: 6,
      halfTimeOpponent: 20,
      videoUrl: "https://www.youtube.com/watch?v=KotDOgM-Le0",
      // USAP : 1E + 1T + 2P = 5+2+6 = 13
      triesUsap: 1, conversionsUsap: 1, penaltiesUsap: 2, dropGoalsUsap: 0, penaltyTriesUsap: 0,
      // Toulouse : 4E + 4T + 2P = 20+8+6 = 34
      triesOpponent: 4, conversionsOpponent: 4, penaltiesOpponent: 2, dropGoalsOpponent: 0, penaltyTriesOpponent: 0,
      report:
        "Défaite à Ernest-Wallon face au Stade Toulousain. L'USAP résiste pendant 35 minutes : " +
        "Tedder P (~3') et Ntamack 2P (~8', ~15') se répondent, 6-6. Mais Toulouse accélère " +
        "en fin de 1re MT : Lebel E (34', T Ramos, 13-6) puis Roumat profite d'un coup franc " +
        "vite joué par Mauvaka (39', T Ramos, 20-6). CJ Galletier (39'). Mi-temps : 20-6. " +
        "CJ Shields (50') puis Willis inscrit son 1er essai toulousain (51', T Ramos, 27-6). " +
        "Montgaillard, entré à la 51', marque l'essai de l'honneur (63', T Tedder, 27-13). " +
        "Ntamack clôt le score (E 78', T Ramos) pour le bonus offensif : 34-13.",
    },
  });
  console.log("  Match mis à jour");

  // Composition USAP
  console.log("\n--- Composition USAP ---");
  const deleted = await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  if (deleted.count > 0) console.log(`  ${deleted.count} entrée(s) supprimée(s)`);

  for (const p of USAP_SQUAD) {
    const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);
    let tries = 0, conversions = 0, penalties = 0, totalPoints = 0;
    const isCaptain = (p as any).isCaptain ?? false;
    const hasYellowCard = (p as any).yellowCard ?? false;
    const yellowCardMin = (p as any).yellowCardMin ?? null;

    // Tedder : 1T (63') + 2P (~3', ~18') = 2+6 = 8 pts
    if (p.lastName === "Tedder") { conversions = 1; penalties = 2; totalPoints = 8; }
    // Montgaillard : 1E (63') = 5 pts
    if (p.lastName === "Montgaillard") { tries = 1; totalPoints = 5; }

    await prisma.matchPlayer.create({
      data: {
        matchId: match.id, playerId, isOpponent: false, shirtNumber: p.num,
        isStarter: p.isStarter, isCaptain, positionPlayed: p.position,
        tries, conversions, penalties, totalPoints,
        yellowCard: hasYellowCard, yellowCardMin,
        redCard: false, redCardMin: null,
        minutesPlayed: p.minutesPlayed,
        subIn: (p as any).subIn ?? null, subOut: (p as any).subOut ?? null,
      },
    });
    const label = p.isStarter ? "TIT" : "REM";
    const sub = (p as any).subIn ? `(↑${(p as any).subIn}')` : (p as any).subOut ? `(↓${(p as any).subOut}')` : "";
    const yc = hasYellowCard ? `(CJ ${yellowCardMin}')` : "";
    const extra = [totalPoints > 0 ? `(${totalPoints} pts)` : "", isCaptain ? "(C)" : "", yc, sub, `[${p.minutesPlayed}']`].filter(Boolean).join(" ");
    console.log(`  ${label} ${String(p.num).padStart(2, " ")}. ${p.firstName} ${p.lastName} ${extra}`);
  }

  // Composition Toulouse
  console.log("\n--- Composition Stade Toulousain ---");
  for (const p of OPP_SQUAD) {
    await prisma.matchPlayer.create({
      data: { matchId: match.id, isOpponent: true, opponentPlayerName: p.name, shirtNumber: p.num, isStarter: p.isStarter, isCaptain: false, positionPlayed: p.position },
    });
    console.log(`  ${p.isStarter ? "TIT" : "REM"} ${String(p.num).padStart(2, " ")}. ${p.name}`);
  }

  // Liens joueurs-saison
  console.log("\n--- Liens joueurs-saison ---");
  let linkedCount = 0;
  for (const p of USAP_SQUAD) {
    const player = await prisma.player.findFirst({ where: { firstName: { equals: p.firstName, mode: "insensitive" }, lastName: { equals: p.lastName, mode: "insensitive" } } });
    if (!player) continue;
    const exists = await prisma.seasonPlayer.findFirst({ where: { seasonId: season.id, playerId: player.id } });
    if (!exists) { await prisma.seasonPlayer.create({ data: { seasonId: season.id, playerId: player.id, position: p.position } }); linkedCount++; }
  }
  console.log(`  ${linkedCount} nouveau(x) lien(s) joueur-saison créé(s)`);

  // Événements
  console.log("\n--- Événements du match ---");
  const deletedEvents = await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
  if (deletedEvents.count > 0) console.log(`  ${deletedEvents.count} événement(s) supprimé(s)`);

  const events: Array<{ minute: number; type: string; playerLastName?: string; isUsap: boolean; description: string }> = [
    // === 1ère MI-TEMPS ===
    { minute: 3, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 0-3." },
    { minute: 8, type: "PENALITE", isUsap: false, description: "Pénalité de Romain Ntamack (Toulouse). 3-3." },
    { minute: 15, type: "PENALITE", isUsap: false, description: "Pénalité de Romain Ntamack (Toulouse). 6-3." },
    { minute: 18, type: "PENALITE", playerLastName: "Tedder", isUsap: true, description: "Pénalité de Tristan Tedder (USAP). 6-6." },
    { minute: 34, type: "ESSAI", isUsap: false, description: "Essai de Matthis Lebel (Toulouse). 11-6." },
    { minute: 34, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Thomas Ramos (Toulouse). 13-6." },
    { minute: 39, type: "CARTON_JAUNE", playerLastName: "Galletier", isUsap: true, description: "Carton jaune Kélian Galletier (USAP)." },
    { minute: 39, type: "ESSAI", isUsap: false, description: "Essai d'Alexandre Roumat (Toulouse). Coup franc vite joué par Mauvaka. 18-6." },
    { minute: 39, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Thomas Ramos (Toulouse). 20-6." },
    // === MI-TEMPS : Toulouse 20 - 6 USAP ===
    // === 2e MI-TEMPS ===
    { minute: 50, type: "CARTON_JAUNE", playerLastName: "Shields", isUsap: true, description: "Carton jaune Brad Shields (USAP)." },
    { minute: 51, type: "ESSAI", isUsap: false, description: "Essai de Jack Willis (Toulouse). 1er essai avec le Stade. 25-6." },
    { minute: 51, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Thomas Ramos (Toulouse). 27-6." },
    { minute: 63, type: "ESSAI", playerLastName: "Montgaillard", isUsap: true, description: "Essai de Victor Montgaillard (USAP). Essai de l'honneur. 27-11." },
    { minute: 63, type: "TRANSFORMATION", playerLastName: "Tedder", isUsap: true, description: "Transformation de Tristan Tedder (USAP). 27-13." },
    { minute: 78, type: "ESSAI", isUsap: false, description: "Essai de Romain Ntamack (Toulouse). Bonus offensif. 32-13." },
    { minute: 78, type: "TRANSFORMATION", isUsap: false, description: "Transformation de Thomas Ramos (Toulouse). 34-13." },
  ];

  for (const evt of events) {
    let playerId: string | null = null;
    if (evt.isUsap && evt.playerLastName) {
      const player = await prisma.player.findFirst({ where: { lastName: { equals: evt.playerLastName, mode: "insensitive" } } });
      playerId = player?.id ?? null;
    }
    await prisma.matchEvent.create({
      data: { matchId: match.id, minute: evt.minute, type: evt.type as any, playerId, isUsap: evt.isUsap, description: evt.description },
    });
    const side = evt.isUsap ? "USAP" : "ST";
    console.log(`  ${String(evt.minute).padStart(2, " ")}' [${side}] ${evt.type} — ${evt.description.split(".")[0]}`);
  }

  console.log("\n=== Mise à jour terminée ===");
  console.log("  Score : Toulouse 34 - 13 USAP (extérieur)");
  console.log("  Mi-temps : Toulouse 20 - 6 USAP");
  console.log("  ⚠ Arbitre à compléter");
  console.log("  Tedder 8 pts (1T + 2P), Montgaillard 1E (5 pts)");
  console.log("  CJ : Galletier (39'), Shields (50')");
  console.log("  Toulouse : Ntamack 2P+1E, Ramos 4T, Lebel/Roumat/Willis/Ntamack 1E chacun");
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

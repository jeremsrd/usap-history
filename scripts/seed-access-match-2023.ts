/**
 * Barrage d'accession Top 14 / Pro D2 — Grenoble 19-33 USAP (03/06/2023)
 *
 * Dernier match des saisons modernes sans aucune feuille de match. L'USAP,
 * 13e du Top 14 2022-2023, se déplace au Stade des Alpes et conserve sa place
 * dans l'élite.
 *
 * Source : feuille de match officielle top14.lnr.fr
 *   (/feuille-de-match/2022-2023/access/10253-grenoble-perpignan), onglets
 *   « Compositions » et « Résumés & replays ».
 *
 * Ce script corrige aussi le classement du match. Il était rattaché à la
 * compétition « Championnat de France Top 14 » avec la phase « Barrage »,
 * alors que les barrages 2025 et 2026 sont sous « Barrages Top 14 / Pro D2 »
 * avec la phase « Access Match ». Conséquence : la saison 2022-2023 comptait
 * 27 matchs sous Top 14 pour 26 journées, ce qui fausse tout recalcul des
 * statistiques agrégées filtrant sur cette compétition. Le slug est régénéré
 * pour suivre la même forme que les deux autres barrages.
 *
 * À noter : la transformation de l'essai de Barthelemy (36e) n'est attribuée
 * à aucun buteur par la LNR. Elle est comptée au niveau du match
 * (conversionsOpponent) mais pas sur un joueur, d'où 17 des 19 points
 * grenoblois répartis. Les 33 points catalans le sont intégralement.
 *
 * Plusieurs joueurs sortent puis reviennent (première ligne, protocole
 * commotion). Le modèle n'ayant qu'un seul couple subIn/subOut, la règle
 * retenue est : sortie enregistrée seulement si le joueur n'est pas revenu,
 * entrée enregistrée à la première apparition.
 *
 * Usage : npx tsx scripts/seed-access-match-2023.ts
 *
 * Idempotent : recrée compositions et événements à chaque exécution.
 */

import { PrismaClient, Position, MatchResult } from "@prisma/client";
import { generateMatchSlug, generatePlayerSlug, generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

const DATE = new Date("2023-06-03");

interface PlayerData {
  num: number;
  firstName: string;
  lastName: string;
  position: Position;
  isStarter: boolean;
  tries?: number;
  conversions?: number;
  penalties?: number;
  dropGoals?: number;
  totalPoints?: number;
  subIn?: number;
  subOut?: number;
  yellowCardMin?: number;
}

// === COMPOSITION USAP (feuille de match LNR) ===
const USAP_SQUAD: PlayerData[] = [
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 51 },
  { num: 2, firstName: "Léon Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, tries: 1, totalPoints: 5, subOut: 61 },
  { num: 3, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_DROIT, isStarter: true, subOut: 61 },
  { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, tries: 1, totalPoints: 5, subOut: 70 },
  { num: 6, firstName: "Bradley", lastName: "Shields", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 70 },
  { num: 7, firstName: "Kelian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 59 },
  // sorti à la 47e, revenu à la 70e
  { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: true, tries: 1, totalPoints: 5, subOut: 70 },
  { num: 10, firstName: "Jake Aron", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, tries: 1, totalPoints: 5, yellowCardMin: 37 },
  // sorti à la 23e, revenu à la 35e
  { num: 11, firstName: "Mathieu", lastName: "Acebes", position: Position.AILIER, isStarter: true },
  { num: 12, firstName: "Dorian", lastName: "Laborde", position: Position.CENTRE, isStarter: true, penalties: 1, totalPoints: 3 },
  { num: 13, firstName: "Edward Dratai", lastName: "Sawaileau", position: Position.CENTRE, isStarter: true, subOut: 70 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Tristan James", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, conversions: 2, penalties: 2, totalPoints: 10 },
  { num: 16, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, subIn: 61 },
  { num: 17, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 51 },
  { num: 18, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 70 },
  { num: 19, firstName: "Joaquín", lastName: "Oviedo", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 47 },
  { num: 20, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 59 },
  { num: 21, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 70 },
  { num: 22, firstName: "George", lastName: "Tilsley", position: Position.AILIER, isStarter: false, subIn: 23 },
  { num: 23, firstName: "Siosiua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: false, subIn: 61 },
];

// === COMPOSITION FC GRENOBLE (feuille de match LNR) ===
const GRENOBLE_SQUAD: PlayerData[] = [
  { num: 1, firstName: "Zack", lastName: "Gauthier", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 48 },
  { num: 2, firstName: "Jean-Charles", lastName: "Orioli", position: Position.TALONNEUR, isStarter: true, subOut: 48 },
  // sorti à la 40e, revenu à la 75e
  { num: 3, firstName: "Irakli", lastName: "Aptsiauri", position: Position.PILIER_DROIT, isStarter: true },
  { num: 4, firstName: "Tanginoa Palu", lastName: "Halaifonua", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 76 },
  // sorti à la 48e, revenu à la 76e
  { num: 5, firstName: "Pio", lastName: "Muarua", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, firstName: "Antonin", lastName: "Berruyer", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, yellowCardMin: 23, subOut: 61 },
  { num: 7, firstName: "Steeve", lastName: "Blanc Mappaz", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, firstName: "Talalelei", lastName: "Gray", position: Position.NUMERO_HUIT, isStarter: true, subOut: 61 },
  { num: 9, firstName: "Felipe", lastName: "Ezcurra", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 58 },
  // sorti à la 66e, revenu à la 73e
  { num: 10, firstName: "Romain", lastName: "Barthelemy", position: Position.DEMI_OUVERTURE, isStarter: true, tries: 1, dropGoals: 1, totalPoints: 8 },
  { num: 11, firstName: "Lucas", lastName: "Dupont", position: Position.AILIER, isStarter: true },
  { num: 12, firstName: "Bautista", lastName: "Ezcurra", position: Position.CENTRE, isStarter: true },
  { num: 13, firstName: "Romain", lastName: "Trouilloud", position: Position.CENTRE, isStarter: true, penalties: 3, totalPoints: 9 },
  { num: 14, firstName: "Romain", lastName: "Fusier", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Julien", lastName: "Farnoux", position: Position.ARRIERE, isStarter: true, subOut: 73 },
  { num: 16, firstName: "Mathis", lastName: "Sarragallet", position: Position.TALONNEUR, isStarter: false, subIn: 48 },
  { num: 17, firstName: "Luka", lastName: "Goginava", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 48 },
  { num: 18, firstName: "José", lastName: "Duarte Madeira", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 48 },
  { num: 19, firstName: "Marnus", lastName: "Schoeman", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 61 },
  { num: 20, firstName: "Marko", lastName: "Gazzotti", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 61 },
  { num: 21, firstName: "Eric", lastName: "Escande", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 58 },
  { num: 22, firstName: "Thomas", lastName: "Fortunel", position: Position.DEMI_OUVERTURE, isStarter: false, subIn: 66 },
  { num: 23, firstName: "Samuel", lastName: "Nixon", position: Position.PILIER_DROIT, isStarter: false, subIn: 40 },
];

// === CHRONOLOGIE (faits de match LNR) ===
const EVENTS: Array<{ minute: number; type: string; isUsap: boolean; who: string }> = [
  { minute: 7, type: "ESSAI", isUsap: true, who: "Posolo Tuilagi" },
  { minute: 20, type: "PENALITE", isUsap: false, who: "Romain Trouilloud" },
  { minute: 22, type: "PENALITE", isUsap: true, who: "Tristan James Tedder" },
  { minute: 23, type: "CARTON_JAUNE", isUsap: false, who: "Antonin Berruyer" },
  { minute: 25, type: "DROP", isUsap: false, who: "Romain Barthelemy" },
  { minute: 30, type: "PENALITE", isUsap: true, who: "Tristan James Tedder" },
  { minute: 34, type: "PENALITE", isUsap: false, who: "Romain Trouilloud" },
  { minute: 36, type: "ESSAI", isUsap: false, who: "Romain Barthelemy" },
  { minute: 37, type: "CARTON_JAUNE", isUsap: true, who: "Jake Aron McIntyre" },
  { minute: 53, type: "ESSAI", isUsap: true, who: "Léon Seilala Lam" },
  { minute: 53, type: "TRANSFORMATION", isUsap: true, who: "Tristan James Tedder" },
  { minute: 57, type: "ESSAI", isUsap: true, who: "Sadek Deghmache" },
  { minute: 61, type: "PENALITE", isUsap: false, who: "Romain Trouilloud" },
  { minute: 66, type: "ESSAI", isUsap: true, who: "Jake Aron McIntyre" },
  { minute: 66, type: "TRANSFORMATION", isUsap: true, who: "Tristan James Tedder" },
  { minute: 78, type: "PENALITE", isUsap: true, who: "Dorian Laborde" },
];

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

let playerIndex: Map<string, string> | null = null;

async function getPlayerIndex(): Promise<Map<string, string>> {
  if (playerIndex) return playerIndex;
  const all = await prisma.player.findMany({
    select: { id: true, firstName: true, lastName: true },
  });
  playerIndex = new Map();
  for (const p of all) {
    const key = normalizeName(`${p.firstName} ${p.lastName}`);
    if (!playerIndex.has(key)) playerIndex.set(key, p.id);
  }
  return playerIndex;
}

async function findOrCreatePlayer(p: PlayerData, isUsap: boolean): Promise<string> {
  const index = await getPlayerIndex();
  const key = normalizeName(`${p.firstName} ${p.lastName}`);
  const existing = index.get(key);
  if (existing) return existing;

  const player = await prisma.player.create({
    data: {
      firstName: p.firstName,
      lastName: p.lastName,
      position: p.position,
      isActive: false,
      slug: `temp-${Date.now()}-${Math.random()}`,
    },
  });
  await prisma.player.update({
    where: { id: player.id },
    data: { slug: generatePlayerSlug(p.firstName, p.lastName, player.id) },
  });
  index.set(key, player.id);
  console.log(`    [${isUsap ? "joueur" : "adversaire"}] Créé : ${p.firstName} ${p.lastName}`);
  return player.id;
}

function minutesPlayed(p: PlayerData): number | null {
  if (p.isStarter) return p.subOut ?? 80;
  return p.subIn != null ? 80 - p.subIn : null;
}

const EVENT_LABELS: Record<string, string> = {
  ESSAI: "Essai",
  TRANSFORMATION: "Transformation",
  PENALITE: "Pénalité",
  DROP: "Drop",
  CARTON_JAUNE: "Carton jaune pour",
};

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log("=== Barrage 2023 : Grenoble 19-33 USAP ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2022, endYear: 2023 },
  });
  const barrages = await prisma.competition.findFirstOrThrow({
    where: { shortName: "Barrages" },
  });

  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, date: DATE, opponent: { name: { contains: "Grenoble" } } },
    include: { competition: true, opponent: true },
  });
  console.log(`Match : ${match.slug}`);

  // ---- Reclassement sous la compétition Barrages -------------------------
  if (match.competitionId !== barrages.id || match.round !== "Access Match") {
    const slug = generateMatchSlug({
      competitionShortName: barrages.shortName,
      competitionName: barrages.name,
      opponentShortName: match.opponent.shortName,
      opponentName: match.opponent.name,
      isHome: false,
      matchday: null,
      round: "Access Match",
      date: DATE,
    });
    console.log(`  [classement] "${match.competition.name}" / "${match.round}"`);
    console.log(`            → "${barrages.name}" / "Access Match"`);
    console.log(`  [slug]     → ${slug}`);
    await prisma.match.update({
      where: { id: match.id },
      data: { competitionId: barrages.id, round: "Access Match", matchday: null, slug },
    });
  }

  const refereeId = await (async () => {
    const existing = await prisma.referee.findFirst({
      where: { firstName: { equals: "Adrien", mode: "insensitive" }, lastName: { equals: "Descottes", mode: "insensitive" } },
    });
    if (existing) return existing.id;
    const r = await prisma.referee.create({ data: { firstName: "Adrien", lastName: "Descottes", slug: `temp-${Date.now()}` } });
    await prisma.referee.update({ where: { id: r.id }, data: { slug: generateRefereeSlug("Adrien", "Descottes", r.id) } });
    return r.id;
  })();

  await prisma.match.update({
    where: { id: match.id },
    data: {
      kickoffTime: "21:05",
      refereeId,
      result: MatchResult.VICTOIRE,
      triesUsap: 4,
      conversionsUsap: 2,
      penaltiesUsap: 3,
      dropGoalsUsap: 0,
      penaltyTriesUsap: 0,
      triesOpponent: 1,
      conversionsOpponent: 1,
      penaltiesOpponent: 3,
      dropGoalsOpponent: 1,
      penaltyTriesOpponent: 0,
      report:
        "L'USAP conserve sa place dans l'élite au Stade des Alpes. Posolo Tuilagi " +
        "lance parfaitement les Catalans dès la 7e minute, et Tristan Tedder " +
        "maintient l'avance au pied malgré les trois pénalités de Trouilloud et le " +
        "drop de Barthelemy. Grenoble passe devant juste avant la pause par " +
        "Barthelemy (36'), profitant du carton jaune de Jake McIntyre (37'). " +
        "Le second acte est catalan : Léon Lam (53') puis Sadek Deghmache (57') " +
        "renversent la rencontre, et McIntyre, revenu de sanction, scelle le " +
        "maintien à la 66e. Dorian Laborde ajoute une dernière pénalité (78'). " +
        "Victoire 33-19 et troisième access match remporté par l'USAP.",
    },
  });

  // ---- Compositions -------------------------------------------------------
  await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
  const ids: Record<string, string> = {};

  for (const [squad, isUsap] of [
    [USAP_SQUAD, true],
    [GRENOBLE_SQUAD, false],
  ] as const) {
    for (const p of squad) {
      const playerId = await findOrCreatePlayer(p, isUsap);
      ids[`${p.firstName} ${p.lastName}`] = playerId;

      await prisma.matchPlayer.create({
        data: {
          matchId: match.id,
          playerId,
          isOpponent: !isUsap,
          shirtNumber: p.num,
          isStarter: p.isStarter,
          positionPlayed: p.position,
          minutesPlayed: minutesPlayed(p),
          subIn: p.subIn ?? null,
          subOut: p.subOut ?? null,
          tries: p.tries ?? 0,
          conversions: p.conversions ?? 0,
          penalties: p.penalties ?? 0,
          dropGoals: p.dropGoals ?? 0,
          totalPoints: p.totalPoints ?? 0,
          yellowCard: p.yellowCardMin != null,
          yellowCardMin: p.yellowCardMin ?? null,
        },
      });

      if (isUsap) {
        const linked = await prisma.seasonPlayer.findFirst({
          where: { seasonId: season.id, playerId },
        });
        if (!linked) {
          await prisma.seasonPlayer.create({
            data: { seasonId: season.id, playerId, position: p.position },
          });
        }
      }
    }
  }

  const somme = (s: PlayerData[]) => s.reduce((a, p) => a + (p.totalPoints ?? 0), 0);
  console.log(`  Compositions : ${USAP_SQUAD.length} USAP / ${GRENOBLE_SQUAD.length} Grenoble`);
  console.log(`  Points répartis : USAP ${somme(USAP_SQUAD)}/33, Grenoble ${somme(GRENOBLE_SQUAD)}/19`);
  if (somme(GRENOBLE_SQUAD) !== 19) {
    console.log("    (l'écart de 2 pts est la transformation de la 36e, buteur non nommé par la LNR)");
  }

  // ---- Chronologie ---------------------------------------------------------
  await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
  let usapPts = 0;
  let oppPts = 0;
  const valeur: Record<string, number> = { ESSAI: 5, TRANSFORMATION: 2, PENALITE: 3, DROP: 3 };

  for (const e of EVENTS) {
    const v = valeur[e.type] ?? 0;
    if (e.isUsap) usapPts += v;
    else oppPts += v;
    const team = e.isUsap ? "USAP" : "Grenoble";
    const description =
      e.type === "CARTON_JAUNE"
        ? `${EVENT_LABELS[e.type]} ${e.who} (${team}).`
        : `${EVENT_LABELS[e.type]} de ${e.who} (${team}). ${oppPts}-${usapPts}.`;

    await prisma.matchEvent.create({
      data: {
        matchId: match.id,
        minute: e.minute,
        type: e.type as never,
        playerId: ids[e.who] ?? null,
        isUsap: e.isUsap,
        description,
      },
    });
  }
  console.log(`  Chronologie : ${EVENTS.length} événements`);

  console.log("\n=== Terminé ===");
  console.log("  Grenoble 19 - 33 USAP — maintien en Top 14");
  console.log("  Arbitre : Adrien Descottes");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

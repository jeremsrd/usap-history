/**
 * USAP 36 - 20 RC Toulon — J20 Top 14, 28/03/2026, Aimé-Giral, 16h35
 * Arbitre : Thomas Charabas. Mi-temps : 24-10.
 *
 * Réécriture complète de la saisie de ce match, qui était le dernier resté
 * sur l'ancienne convention : les Toulonnais y étaient de simples chaînes
 * `opponentPlayerName`, et les 23 Catalans n'avaient ni minutes ni
 * remplacements. La version précédente de ce script avait par ailleurs
 * inventé plusieurs noms côté Toulon (« Jarrett Gros » pour Jean-Baptiste
 * Gros, « Zeno Mercer » pour Zach Mercer, « Brian Alainu'uese » pour Komiti
 * Junior Alainuuese…) et recréé trois doublons de joueurs catalans déjà
 * fusionnés par merge-duplicate-players-2026.ts. Le script commence donc par
 * ce ménage avant de reconstruire la feuille.
 *
 * Sources :
 *   - top14.lnr.fr/feuille-de-match/2025-2026/j20/11446-perpignan-toulon
 *     /compositions   → compositions officielles et officiels de match
 *     /resumes-replays → faits de match et changements (entrant | sortant | minute)
 *   - API ESPN, event 602818 (league 270559) : chronologie minute par minute,
 *     qui découpe essai et transformation là où la LNR ne date que l'action
 *     complète. Attention, ESPN se trompe sur plusieurs noms toulonnais :
 *     la feuille LNR fait foi.
 *   - Résumé vidéo : YouTube ZhkQUqQWam8, identifiant vérifié via oembed.
 *
 * Ni la LNR ni ESPN ne donnent l'affluence : elle reste vide.
 * Aucun carton dans cette rencontre.
 *
 * Usage :
 *   npx tsx scripts/update-match-2025-2026-j20.ts --dry
 *   npx tsx scripts/update-match-2025-2026-j20.ts
 *
 * Idempotent : compositions et événements sont supprimés puis recréés, les
 * fusions et suppressions de fiches sont ignorées si elles ont déjà eu lieu.
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug } from "../src/lib/slugs";
import { computeBonuses } from "../src/lib/scoring";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

const MATCH_DATE = new Date("2026-03-28");

// =============================================================================
// MÉNAGE : fiches créées par l'ancienne version de ce script
// =============================================================================

interface Nom {
  firstName: string;
  lastName: string;
}

/**
 * Doublons à fusionner. Toutes ces paires ont été vérifiées à la main : même
 * personne, même club, la fiche absorbée n'existe que parce qu'un import a
 * cherché le joueur sur son nom exact plutôt que sur son nom normalisé.
 */
const DOUBLONS: Array<{ garder: Nom; absorber: Nom }> = [
  {
    garder: { firstName: "Maxwell", lastName: "Hicks" },
    absorber: { firstName: "Max", lastName: "Hicks" },
  },
  {
    garder: { firstName: "Jefferson-Lee", lastName: "Joseph" },
    absorber: { firstName: "Jefferson", lastName: "Joseph" },
  },
  {
    garder: { firstName: "Mattéo", lastName: "Le Corvec" },
    absorber: { firstName: "Matteo", lastName: "Le Corvec" },
  },
  {
    // Deux fiches d'un même pilier toulonnais, à un trait d'union près. Elles
    // ont le même nom normalisé : seul le nom exact les distingue.
    garder: { firstName: "Jean-Baptiste", lastName: "Gros" },
    absorber: { firstName: "Jean Baptiste", lastName: "Gros" },
  },
];

/**
 * Fiches fantômes : noms inventés par l'ancienne version, créés puis jamais
 * rattachés à quoi que ce soit. Le script vérifie qu'elles sont bien vides
 * avant de les supprimer.
 */
const FICHES_FANTOMES: Nom[] = [
  { firstName: "Corentin", lastName: "Mezouel" },
  { firstName: "Ignacio", lastName: "Brex" },
  { firstName: "Lewis", lastName: "Ludlam" },
  { firstName: "Ben", lastName: "White" },
  { firstName: "Jarrett", lastName: "Gros" },
  { firstName: "Matthew", lastName: "Halagahu" },
  { firstName: "Zeno", lastName: "Mercer" },
  { firstName: "Mateo", lastName: "Domon" },
  { firstName: "Mathieu", lastName: "Nonu" },
];

// =============================================================================
// COMPOSITIONS (feuille de match officielle LNR)
// =============================================================================

interface SquadEntry {
  num: number;
  firstName: string;
  lastName: string;
  /** Poste réellement tenu : numéro de maillot pour les titulaires, poste du
   *  joueur remplacé pour les entrants. */
  position: Position;
  isStarter: boolean;
  subIn?: number;
  subOut?: number;
  /** Minutes réellement jouées, retours en jeu compris. */
  minutes: number | null;
  tries?: number;
  conversions?: number;
  penalties?: number;
  points?: number;
  notes?: string;
}

/**
 * USAP. Les noms sont ceux déjà en base : la feuille LNR écrit « Maxwell
 * HICKS » ou « Jefferson Lee JOSEPH » là où les 39 autres feuilles du joueur
 * portent l'orthographe courante. On ne crée pas une fiche par variante.
 */
const USAP_SQUAD: SquadEntry[] = [
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 52, minutes: 52 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, subOut: 52, minutes: 52 },
  { num: 3, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: true, subOut: 52, subIn: 58, minutes: 74,
    notes: "Sorti à la 52e, revenu à la 58e à la place de Roelofse." },
  { num: 4, firstName: "Peceli", lastName: "Yato", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 54, subIn: 69, minutes: 65,
    notes: "Sorti à la 54e, revenu à la 69e à la place de Warion.", tries: 1, points: 5 },
  { num: 5, firstName: "Adrien", lastName: "Warion", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 69, minutes: 69 },
  { num: 6, firstName: "Maxwell", lastName: "Hicks", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutes: 80 },
  { num: 7, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 61, minutes: 61 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, minutes: 80, tries: 1, points: 5 },
  { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 41, minutes: 41, tries: 1, points: 5 },
  { num: 10, firstName: "Benjamin", lastName: "Urdapilleta", position: Position.DEMI_OUVERTURE, isStarter: true, subOut: 76, minutes: 76, conversions: 3, penalties: 1, points: 9 },
  { num: 11, firstName: "Théo", lastName: "Forner", position: Position.AILIER, isStarter: true, minutes: 80, tries: 1, points: 5 },
  { num: 12, firstName: "Diego", lastName: "Mascarenc", position: Position.CENTRE, isStarter: true, subOut: 18, minutes: 18 },
  { num: 13, firstName: "Eneriko", lastName: "Buliruarua", position: Position.CENTRE, isStarter: true, minutes: 80 },
  { num: 14, firstName: "Jefferson-Lee", lastName: "Joseph", position: Position.AILIER, isStarter: true, minutes: 80 },
  { num: 15, firstName: "Mayron", lastName: "Fahy", position: Position.ARRIERE, isStarter: true, subOut: 52, subIn: 76, minutes: 56,
    notes: "Sorti à la 52e, revenu à la 76e à la place d'Urdapilleta." },
  { num: 16, firstName: "Sama", lastName: "Malolo", position: Position.TALONNEUR, isStarter: false, subIn: 52, minutes: 28 },
  { num: 17, firstName: "Bruce", lastName: "Devaux", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 52, minutes: 28 },
  { num: 18, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 54, minutes: 26 },
  { num: 19, firstName: "Mattéo", lastName: "Le Corvec", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 61, minutes: 19 },
  { num: 20, firstName: "James", lastName: "Hall", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 41, minutes: 39 },
  { num: 21, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: false, subIn: 52, minutes: 28, tries: 1, conversions: 1, points: 7 },
  { num: 22, firstName: "Jordan", lastName: "Petaia", position: Position.CENTRE, isStarter: false, subIn: 18, minutes: 62 },
  { num: 23, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: false, subIn: 52, subOut: 58, minutes: 6,
    notes: "Entré à la 52e, ressorti à la 58e au retour de Ceccarelli." },
];

/**
 * RC Toulon. Orthographes de la feuille LNR, sauf pour les joueurs déjà
 * fichés autrement en base : Komiti Alainu'uese (LNR « Komiti junior
 * ALAINUUESE ») et Nacho Brex (LNR « Juan ignacio BREX »), tous deux
 * rencontrés sur des feuilles antérieures.
 */
const RCT_SQUAD: SquadEntry[] = [
  { num: 1, firstName: "Dany", lastName: "Priso Mouangue", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 49, minutes: 49 },
  { num: 2, firstName: "Gianmarco", lastName: "Lucchesi", position: Position.TALONNEUR, isStarter: true, subOut: 49, subIn: 76, minutes: 53,
    notes: "Sorti à la 49e, revenu à la 76e à la place de Shioshvili." },
  { num: 3, firstName: "Beka", lastName: "Gigashvili", position: Position.PILIER_DROIT, isStarter: true, subOut: 49, minutes: 49 },
  { num: 4, firstName: "Corentin", lastName: "Mezou", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 49, minutes: 49 },
  { num: 5, firstName: "Komiti", lastName: "Alainu'uese", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 49, minutes: 49, tries: 1, points: 5 },
  { num: 6, firstName: "Lewis Wesley", lastName: "Ludlam", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 58, minutes: 58, tries: 1, points: 5 },
  { num: 7, firstName: "Jules", lastName: "Coulon", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, minutes: 80 },
  { num: 8, firstName: "Mikheili", lastName: "Shioshvili", position: Position.NUMERO_HUIT, isStarter: true, subOut: 76, minutes: 76, tries: 1, points: 5 },
  { num: 9, firstName: "Benjamin", lastName: "White", position: Position.DEMI_DE_MELEE, isStarter: true, minutes: 80 },
  { num: 10, firstName: "Tomas", lastName: "Albornoz", position: Position.DEMI_OUVERTURE, isStarter: true, minutes: 80 },
  { num: 11, firstName: "Mathis", lastName: "Ferté", position: Position.AILIER, isStarter: true, minutes: 80 },
  { num: 12, firstName: "Antoine", lastName: "Frisch", position: Position.CENTRE, isStarter: true, subOut: 62, minutes: 62 },
  { num: 13, firstName: "Nacho", lastName: "Brex", position: Position.CENTRE, isStarter: true, minutes: 80 },
  { num: 14, firstName: "Setariki", lastName: "Tuicuvu", position: Position.AILIER, isStarter: true, minutes: 80 },
  { num: 15, firstName: "Melvyn", lastName: "Jaminet", position: Position.ARRIERE, isStarter: true, subOut: 62, minutes: 62, conversions: 1, penalties: 1, points: 5 },
  { num: 16, firstName: "Pierre", lastName: "Damond", position: Position.TALONNEUR, isStarter: false, subIn: 49, minutes: 31 },
  { num: 17, firstName: "Jean-Baptiste", lastName: "Gros", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 49, minutes: 31 },
  { num: 18, firstName: "Giorgi", lastName: "Javakhia", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 49, minutes: 31 },
  { num: 19, firstName: "Matthias", lastName: "Halagahu", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 49, minutes: 31 },
  { num: 20, firstName: "Zach", lastName: "Mercer", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 58, minutes: 22 },
  { num: 21, firstName: "Marius", lastName: "Domon", position: Position.ARRIERE, isStarter: false, subIn: 62, minutes: 18 },
  { num: 22, firstName: "Ma'a", lastName: "Nonu", position: Position.CENTRE, isStarter: false, subIn: 62, minutes: 18 },
  { num: 23, firstName: "Kyle", lastName: "Sinckler", position: Position.PILIER_DROIT, isStarter: false, subIn: 49, minutes: 31 },
];

// =============================================================================
// CHRONOLOGIE
// Minutes ESPN, qui datent séparément l'essai et sa transformation ; les
// scores courants sont ceux affichés par la LNR.
// =============================================================================

interface TimelineEvent {
  minute: number;
  type: "ESSAI" | "TRANSFORMATION" | "PENALITE";
  isUsap: boolean;
  /** Numéro de maillot de l'auteur, dans sa propre composition. */
  num: number;
  description: string;
}

const TIMELINE: TimelineEvent[] = [
  { minute: 3, type: "PENALITE", isUsap: true, num: 10, description: "Pénalité de Benjamin Urdapilleta (USAP). 3-0." },
  { minute: 8, type: "ESSAI", isUsap: true, num: 4, description: "Essai de Peceli Yato (USAP). 8-0." },
  { minute: 10, type: "TRANSFORMATION", isUsap: true, num: 10, description: "Transformation de Benjamin Urdapilleta (USAP). 10-0." },
  { minute: 15, type: "ESSAI", isUsap: false, num: 5, description: "Essai de Komiti Alainu'uese (Toulon). 10-5." },
  { minute: 15, type: "TRANSFORMATION", isUsap: false, num: 15, description: "Transformation de Melvyn Jaminet (Toulon). 10-7." },
  { minute: 26, type: "ESSAI", isUsap: true, num: 9, description: "Essai de Tom Ecochard (USAP). 15-7." },
  { minute: 27, type: "TRANSFORMATION", isUsap: true, num: 10, description: "Transformation de Benjamin Urdapilleta (USAP). 17-7." },
  { minute: 30, type: "PENALITE", isUsap: false, num: 15, description: "Pénalité de Melvyn Jaminet (Toulon). 17-10." },
  { minute: 34, type: "ESSAI", isUsap: true, num: 8, description: "Essai de Joaquín Oviedo (USAP). 22-10." },
  { minute: 35, type: "TRANSFORMATION", isUsap: true, num: 10, description: "Transformation de Benjamin Urdapilleta (USAP). 24-10." },
  { minute: 51, type: "ESSAI", isUsap: false, num: 8, description: "Essai de Mikheili Shioshvili (Toulon). 24-15." },
  { minute: 56, type: "ESSAI", isUsap: false, num: 6, description: "Essai de Lewis Wesley Ludlam (Toulon). Toulon revient à quatre points. 24-20." },
  { minute: 74, type: "ESSAI", isUsap: true, num: 21, description: "Essai de Tommaso Allan (USAP), entré en jeu. L'USAP reprend le large. 29-20." },
  { minute: 81, type: "ESSAI", isUsap: true, num: 11, description: "Essai de Théo Forner (USAP). 34-20." },
  { minute: 82, type: "TRANSFORMATION", isUsap: true, num: 21, description: "Transformation de Tommaso Allan (USAP). 36-20. Score final." },
];

const REPORT =
  "Victoire nette de l'USAP à Aimé-Giral. Urdapilleta ouvre le score sur pénalité (3') " +
  "avant que Yato ne marque le premier essai (8'). Alainu'uese répond pour Toulon (15'), " +
  "mais Ecochard (26') et Oviedo (34') creusent l'écart : 24-10 à la pause. " +
  "Les Toulonnais reviennent à quatre points en seconde période, par Shioshvili (51') " +
  "puis Ludlam (56'), avant qu'Allan, entré à l'heure de jeu, ne redonne de l'air aux " +
  "Catalans (74'). Forner conclut dans les arrêts de jeu (81'), transformation d'Allan. " +
  "Cinq essais à trois, mais pas de bonus offensif : le Top 14 en exige trois d'écart. " +
  "Un succès capital dans la course au maintien.";

// =============================================================================
// OUTILLAGE
// =============================================================================

/** Nom réduit à ses lettres, sans accent ni casse ni ponctuation. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
}

type PlayerRow = { id: string; firstName: string; lastName: string };

/**
 * Index de tous les joueurs par nom de famille normalisé, construit une fois.
 * Un `findFirst` sur le nom exact rate « Ferté » vs « Ferte » et crée un
 * doublon à chaque import : c'est exactement ce qui est arrivé ici.
 */
async function buildIndex(exclure: Set<string>): Promise<Map<string, PlayerRow[]>> {
  const all = await prisma.player.findMany({
    select: { id: true, firstName: true, lastName: true },
  });
  const index = new Map<string, PlayerRow[]>();
  for (const player of all) {
    if (exclure.has(player.id)) continue;
    const key = normalize(player.lastName);
    const bucket = index.get(key);
    if (bucket) bucket.push(player);
    else index.set(key, [player]);
  }
  return index;
}

function findInIndex(
  index: Map<string, PlayerRow[]>,
  firstName: string,
  lastName: string,
): PlayerRow | null {
  const bucket = index.get(normalize(lastName)) ?? [];
  const exact = bucket.filter(
    (p) => normalize(p.firstName) === normalize(firstName),
  );
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    throw new Error(
      `${firstName} ${lastName} : ${exact.length} fiches identiques, à arbitrer avant d'importer`,
    );
  }
  return null;
}

function addToIndex(index: Map<string, PlayerRow[]>, player: PlayerRow) {
  const key = normalize(player.lastName);
  const bucket = index.get(key);
  if (bucket) bucket.push(player);
  else index.set(key, [player]);
}

// =============================================================================
// MÉNAGE
// =============================================================================

/** Fiche portant exactement ce prénom et ce nom, ou `null`. */
async function findExact(nom: Nom): Promise<PlayerRow | null> {
  const rows = await prisma.player.findMany({
    where: { firstName: nom.firstName, lastName: nom.lastName },
    select: { id: true, firstName: true, lastName: true },
  });
  if (rows.length > 1) {
    throw new Error(
      `${nom.firstName} ${nom.lastName} : ${rows.length} fiches identiques, à arbitrer`,
    );
  }
  return rows[0] ?? null;
}

const libelle = (nom: Nom) => `${nom.firstName} ${nom.lastName}`;

async function fusionnerDoublons(): Promise<string[]> {
  console.log("--- Doublons de fiches ---");
  const retirees: string[] = [];

  for (const { garder, absorber } of DOUBLONS) {
    const keep = await findExact(garder);
    const drop = await findExact(absorber);

    if (!keep) {
      console.log(`  ⚠ ${libelle(garder)} introuvable — fusion ignorée`);
      continue;
    }
    if (!drop || drop.id === keep.id) {
      console.log(`  déjà fusionné : ${libelle(garder)} ← ${libelle(absorber)}`);
      continue;
    }

    // Deux lignes du même joueur sur un même match casseraient la feuille
    const keepMatches = new Set(
      (
        await prisma.matchPlayer.findMany({
          where: { playerId: keep.id },
          select: { matchId: true },
        })
      ).map((x) => x.matchId),
    );
    const collisions = (
      await prisma.matchPlayer.findMany({
        where: { playerId: drop.id },
        select: { matchId: true },
      })
    ).filter((x) => keepMatches.has(x.matchId));

    if (collisions.length > 0) {
      console.log(
        `  ⚠ ${libelle(garder)} ← ${libelle(absorber)} : ${collisions.length} match(s) portent les deux fiches — fusion annulée`,
      );
      continue;
    }

    const feuilles = await prisma.matchPlayer.count({ where: { playerId: drop.id } });
    const evenements = await prisma.matchEvent.count({ where: { playerId: drop.id } });
    const effectifs = await prisma.seasonPlayer.count({ where: { playerId: drop.id } });

    if (DRY_RUN) {
      console.log(
        `  ${libelle(garder)} ← ${libelle(absorber)} : ${feuilles} feuille(s), ${evenements} événement(s), ${effectifs} lien(s) effectif`,
      );
      retirees.push(drop.id);
      continue;
    }

    await prisma.matchPlayer.updateMany({
      where: { playerId: drop.id },
      data: { playerId: keep.id },
    });
    await prisma.matchEvent.updateMany({
      where: { playerId: drop.id },
      data: { playerId: keep.id },
    });
    await prisma.matchEvent.updateMany({
      where: { relatedPlayerId: drop.id },
      data: { relatedPlayerId: keep.id },
    });

    // season_players porte une contrainte d'unicité (seasonId, playerId)
    for (const lien of await prisma.seasonPlayer.findMany({
      where: { playerId: drop.id },
    })) {
      const existe = await prisma.seasonPlayer.findFirst({
        where: { seasonId: lien.seasonId, playerId: keep.id },
      });
      if (existe) await prisma.seasonPlayer.delete({ where: { id: lien.id } });
      else
        await prisma.seasonPlayer.update({
          where: { id: lien.id },
          data: { playerId: keep.id },
        });
    }

    for (const model of [
      "careerClub",
      "playerStint",
      "playerInternational",
      "playerAward",
    ] as const) {
      // @ts-expect-error accès dynamique aux modèles Prisma
      await prisma[model].updateMany({
        where: { playerId: drop.id },
        data: { playerId: keep.id },
      });
    }

    await prisma.player.delete({ where: { id: drop.id } });
    retirees.push(drop.id);
    console.log(
      `  fusionné : ${libelle(garder)} ← ${libelle(absorber)} (${feuilles} feuille(s), ${evenements} événement(s), ${effectifs} lien(s))`,
    );
  }

  return retirees;
}

async function supprimerFantomes(): Promise<string[]> {
  console.log("\n--- Fiches fantômes ---");
  const retirees: string[] = [];

  for (const nom of FICHES_FANTOMES) {
    const fiche = await findExact(nom);
    if (!fiche) {
      console.log(`  déjà supprimée : ${libelle(nom)}`);
      continue;
    }

    const compte = await prisma.player.findUnique({
      where: { id: fiche.id },
      select: {
        _count: {
          select: {
            matchAppearances: true,
            seasonSquads: true,
            careerClubs: true,
            usapStints: true,
            internationalCaps: true,
            awards: true,
          },
        },
      },
    });
    const rattachements = Object.values(compte!._count).reduce((a, b) => a + b, 0);
    const evenements = await prisma.matchEvent.count({
      where: { OR: [{ playerId: fiche.id }, { relatedPlayerId: fiche.id }] },
    });

    if (rattachements + evenements > 0) {
      console.log(
        `  ⚠ ${libelle(nom)} : ${rattachements} rattachement(s), ${evenements} événement(s) — conservée, à examiner`,
      );
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ${libelle(nom)} : fiche vide, serait supprimée`);
      retirees.push(fiche.id);
      continue;
    }

    await prisma.player.delete({ where: { id: fiche.id } });
    retirees.push(fiche.id);
    console.log(`  supprimée : ${libelle(nom)}`);
  }

  return retirees;
}

// =============================================================================
// SAISIE DE LA FEUILLE
// =============================================================================

async function resoudreJoueur(
  index: Map<string, PlayerRow[]>,
  entry: SquadEntry,
  isOpponent: boolean,
): Promise<string | null> {
  const existant = findInIndex(index, entry.firstName, entry.lastName);
  if (existant) return existant.id;

  if (DRY_RUN) {
    console.log(`  [joueur] à créer : ${entry.firstName} ${entry.lastName}`);
    return null;
  }

  const cree = await prisma.player.create({
    data: {
      firstName: entry.firstName,
      lastName: entry.lastName,
      position: entry.position,
      // isActive signifie « actuellement à l'USAP »
      isActive: !isOpponent,
      slug: `temp-${entry.num}-${normalize(entry.lastName)}`,
    },
  });
  await prisma.player.update({
    where: { id: cree.id },
    data: { slug: generatePlayerSlug(entry.firstName, entry.lastName, cree.id) },
  });
  addToIndex(index, { id: cree.id, firstName: entry.firstName, lastName: entry.lastName });
  console.log(`  [joueur] créé : ${entry.firstName} ${entry.lastName}`);
  return cree.id;
}

async function saisirComposition(
  index: Map<string, PlayerRow[]>,
  matchId: string,
  squad: SquadEntry[],
  isOpponent: boolean,
): Promise<Map<number, string>> {
  const parNumero = new Map<number, string>();

  for (const entry of squad) {
    const playerId = await resoudreJoueur(index, entry, isOpponent);
    if (playerId) parNumero.set(entry.num, playerId);
    if (DRY_RUN || !playerId) continue;

    await prisma.matchPlayer.create({
      data: {
        matchId,
        playerId,
        isOpponent,
        shirtNumber: entry.num,
        isStarter: entry.isStarter,
        isCaptain: false,
        positionPlayed: entry.position,
        minutesPlayed: entry.minutes,
        subIn: entry.subIn ?? null,
        subOut: entry.subOut ?? null,
        tries: entry.tries ?? 0,
        conversions: entry.conversions ?? 0,
        penalties: entry.penalties ?? 0,
        dropGoals: 0,
        totalPoints: entry.points ?? 0,
        notes: entry.notes ?? null,
      },
    });

    const role = entry.isStarter ? "TIT" : "REM";
    const points = entry.points ? ` — ${entry.points} pts` : "";
    console.log(
      `  ${role} ${String(entry.num).padStart(2)} ${entry.firstName} ${entry.lastName} (${entry.minutes}')${points}`,
    );
  }

  return parNumero;
}

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log(
    `=== USAP 36 - 20 Toulon — J20 2025-2026${DRY_RUN ? " (simulation)" : ""} ===\n`,
  );

  const retirees = new Set([
    ...(await fusionnerDoublons()),
    ...(await supprimerFantomes()),
  ]);

  // L'index ignore les fiches absorbées ou supprimées. En simulation elles
  // sont encore en base : sans cette exclusion, le --dry buterait sur des
  // doublons que le vrai passage aurait déjà résorbés.
  const index = await buildIndex(retirees);

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });
  const competition = await prisma.competition.findFirstOrThrow({
    where: { shortName: "Top 14" },
  });
  const match = await prisma.match.findFirstOrThrow({
    where: { seasonId: season.id, competitionId: competition.id, matchday: 20 },
  });

  if (match.date.getTime() !== MATCH_DATE.getTime()) {
    throw new Error(
      `Match trouvé au ${match.date.toISOString().slice(0, 10)}, attendu au 2026-03-28`,
    );
  }

  // ---- Contrôle : les points des joueurs retombent-ils sur le score ? ------
  const totalUsap = USAP_SQUAD.reduce((s, p) => s + (p.points ?? 0), 0);
  const totalRct = RCT_SQUAD.reduce((s, p) => s + (p.points ?? 0), 0);
  if (totalUsap !== 36 || totalRct !== 20) {
    throw new Error(
      `Somme des points incohérente : USAP ${totalUsap}/36, Toulon ${totalRct}/20`,
    );
  }
  console.log(`\nPoints par joueur : USAP ${totalUsap}, Toulon ${totalRct} ✔`);

  // ---- Compositions --------------------------------------------------------
  if (!DRY_RUN) {
    const supprimes = await prisma.matchPlayer.deleteMany({
      where: { matchId: match.id },
    });
    if (supprimes.count > 0) console.log(`\n${supprimes.count} ligne(s) de composition supprimée(s)`);
  }

  console.log("\n--- Composition USAP ---");
  const usapIds = await saisirComposition(index, match.id, USAP_SQUAD, false);
  console.log("\n--- Composition Toulon ---");
  const rctIds = await saisirComposition(index, match.id, RCT_SQUAD, true);

  // ---- Chronologie ---------------------------------------------------------
  console.log("\n--- Chronologie ---");
  if (!DRY_RUN) {
    const supprimes = await prisma.matchEvent.deleteMany({
      where: { matchId: match.id },
    });
    if (supprimes.count > 0) console.log(`  ${supprimes.count} événement(s) supprimé(s)`);

    for (const event of TIMELINE) {
      const playerId = (event.isUsap ? usapIds : rctIds).get(event.num);
      if (!playerId) {
        throw new Error(
          `Auteur introuvable pour l'événement ${event.minute}' ${event.type}`,
        );
      }
      await prisma.matchEvent.create({
        data: {
          matchId: match.id,
          minute: event.minute,
          type: event.type,
          playerId,
          isUsap: event.isUsap,
          description: event.description,
        },
      });
      console.log(
        `  ${String(event.minute).padStart(2)}' [${event.isUsap ? "USAP" : "RCT "}] ${event.type}`,
      );
    }
  }

  // ---- Match : bonus dérivés, jamais saisis --------------------------------
  const bonus = computeBonuses({
    competitionShortName: competition.shortName,
    seasonStartYear: season.startYear,
    // J20 de phase régulière : ce n'est pas un match couperet
    isKnockout: false,
    scoreUsap: 36,
    scoreOpponent: 20,
    triesUsap: 5,
    triesOpponent: 3,
  });
  console.log(
    `\nBonus calculés : offensif ${bonus.bonusOffensif}, défensif ${bonus.bonusDefensif}` +
      ` (barème ${bonus.rules?.tryBonus}, défaite ≤ ${bonus.rules?.losingMargin} pts)`,
  );

  if (!DRY_RUN) {
    await prisma.match.update({
      where: { id: match.id },
      data: {
        kickoffTime: "16:35",
        halfTimeUsap: 24,
        halfTimeOpponent: 10,
        triesUsap: 5,
        conversionsUsap: 4,
        penaltiesUsap: 1,
        dropGoalsUsap: 0,
        penaltyTriesUsap: 0,
        triesOpponent: 3,
        conversionsOpponent: 1,
        penaltiesOpponent: 1,
        dropGoalsOpponent: 0,
        penaltyTriesOpponent: 0,
        bonusOffensif: bonus.bonusOffensif,
        bonusDefensif: bonus.bonusDefensif,
        videoUrl: "https://www.youtube.com/watch?v=ZhkQUqQWam8",
        report: REPORT,
      },
    });
    console.log("Match mis à jour");

    // ---- Effectif de la saison --------------------------------------------
    let liens = 0;
    for (const entry of USAP_SQUAD) {
      const playerId = usapIds.get(entry.num);
      if (!playerId) continue;
      const existe = await prisma.seasonPlayer.findFirst({
        where: { seasonId: season.id, playerId },
      });
      if (existe) continue;
      await prisma.seasonPlayer.create({
        data: { seasonId: season.id, playerId, position: entry.position },
      });
      liens++;
    }
    console.log(`Effectif 2025-2026 : ${liens} nouveau(x) lien(s)`);

    // ---- Vérification finale ----------------------------------------------
    const lignes = await prisma.matchPlayer.findMany({
      where: { matchId: match.id },
      select: {
        isOpponent: true,
        playerId: true,
        opponentPlayerName: true,
        minutesPlayed: true,
        totalPoints: true,
      },
    });
    const somme = (opponent: boolean) =>
      lignes.filter((l) => l.isOpponent === opponent).reduce((s, l) => s + l.totalPoints, 0);
    const sansJoueur = lignes.filter((l) => !l.playerId).length;
    const sansMinutes = lignes.filter((l) => l.minutesPlayed === null).length;
    const ancienneConvention = lignes.filter((l) => l.opponentPlayerName !== null).length;

    console.log("\n--- Vérification ---");
    console.log(`  lignes : ${lignes.length} (attendu 46)`);
    console.log(`  sans fiche joueur : ${sansJoueur}`);
    console.log(`  sans minutes : ${sansMinutes}`);
    console.log(`  encore en opponentPlayerName : ${ancienneConvention}`);
    console.log(`  points : USAP ${somme(false)}/36, Toulon ${somme(true)}/20`);

    if (
      lignes.length !== 46 ||
      sansJoueur > 0 ||
      sansMinutes > 0 ||
      ancienneConvention > 0 ||
      somme(false) !== 36 ||
      somme(true) !== 20
    ) {
      throw new Error("Feuille incohérente après écriture — à examiner");
    }
  }

  console.log(
    `\n=== ${DRY_RUN ? "Simulation terminée — relancer sans --dry pour appliquer" : "Terminé"} ===`,
  );
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

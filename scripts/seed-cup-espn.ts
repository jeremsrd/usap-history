/**
 * Une campagne européenne d'avant 2020-2021, depuis ESPN : les rencontres,
 * les deux compositions et les réalisations par joueur.
 *
 * **La source n'est pas officielle, et le script est construit autour de ce
 * fait.** Cf. l'en-tête de `lib/espn.ts`. Rien ne s'écrit sans avoir été
 * recoupé :
 *
 *   - **les scores** sont confrontés au classement de poule de Wikipédia —
 *     victoires, nuls, défaites, points marqués et encaissés, bonus, total —
 *     avant la première écriture. Un seul écart, et rien n'est écrit ;
 *   - **les réalisations d'un camp** ne s'écrivent que si la somme des points
 *     de ses joueurs retombe sur son score. Sinon, ses compteurs restent à
 *     `null` — « la source ne le dit pas » —, ses lignes de composition
 *     portent zéro réalisation, et le match est signalé. C'est le cas de deux
 *     feuilles sur six en 2008-2009 ;
 *   - **les compositions** passent le contrôle des dossards de
 *     `lib/dossards.ts`, le seul instrument qui voie une feuille brouillée ;
 *   - **les identités** passent par `lib/joueurs.ts`, jamais par le seul
 *     patronyme. Après écriture, relancer `detect-duplicate-players.ts`.
 *
 * **Ce qui reste à `null`, et pourquoi.** Les minutes, les entrées et sorties
 * et la minute des cartons : ESPN ne les donne pas, et une minute ne
 * s'invente pas. Un carton est donc posé sans minute. Aucune chronologie
 * n'est écrite, pour la même raison. L'arbitre et l'affluence ne sont pas
 * dans la source.
 *
 * **Le bonus offensif d'un camp dont la feuille ne boucle pas ne se calcule
 * pas** : `computeBonuses` le rend faux et lève `triesMissing`. C'est le
 * garde-fou de poule qui tranche alors — le total de bonus offensifs du
 * classement dit s'il en manque un. Pour 2008-2009, il n'en manque pas :
 * Wikipédia en compte un, celui du 48-16 à Trévise, huit essais.
 *
 * Usage :
 *   npx tsx scripts/seed-cup-espn.ts 2008-2009 --dry
 *   npx tsx scripts/seed-cup-espn.ts 2008-2009
 *   npx tsx scripts/seed-cup-espn.ts 2008-2009 --match=2009-01-17
 *
 * Idempotent : une rencontre déjà créée est retrouvée sur la saison,
 * l'adversaire et le jour, puis mise à jour ; ses compositions sont effacées
 * et réécrites.
 */

import { PrismaClient, MatchResult, Prisma, type Position } from "@prisma/client";
import {
  chercherMatchsUsap,
  lireMatch,
  USAP_ESPN,
  type EspnEquipe,
  type EspnMatch,
  type Ligue,
} from "./lib/espn";
import { CLUBS_ESPN } from "./lib/clubs";
import { lirePageArchivee, lireCompteRendu2007 } from "./lib/erc";
import { POSTE_PAR_NUMERO, trouverOuCreerJoueur } from "./lib/joueurs";
import { trouverOuCreerArbitre } from "./lib/arbitres";
import { concordanceDesDossards } from "./lib/dossards";
import { terrainDuMatch } from "./lib/stades";
import { preserverAnnexes } from "./lib/saison";
import { computeBonuses } from "../src/lib/scoring";
import {
  generateMatchSlug,
  generateOpponentSlug,
  generateVenueSlug,
} from "../src/lib/slugs";

const prisma = new PrismaClient();

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry");
const SAISON = ARGS.find((a) => /^\d{4}-\d{4}$/.test(a));
const SEUL = ARGS.find((a) => a.startsWith("--match="))?.slice("--match=".length);

/** Le classement de poule, tel que Wikipédia le donne pour l'USAP. */
interface ClassementDePoule {
  joues: number;
  victoires: number;
  nuls: number;
  defaites: number;
  essaisPour: number;
  essaisContre: number;
  pour: number;
  contre: number;
  bonusOffensifs: number;
  bonusDefensifs: number;
  points: number;
}

interface Campagne {
  ligue: Ligue;
  /** `shortName` de la compétition en base. */
  competition: string;
  nouveauxAdversaires: Array<{ name: string; shortName: string; city: string; pays: string }>;
  /** Terrains à créer et rattacher, avec leur source dans le commentaire. */
  terrains: Array<{ club: string; stade: string; ville: string; capacite: number | null }>;
  /**
   * Terrains neutres à créer sans les rattacher à un club : c'est
   * `TERRAINS_PARTICULIERS` de `lib/stades.ts` qui les pose sur la date.
   */
  terrainsNeutres?: Array<{ stade: string; ville: string; capacite: number | null }>;
  poule: ClassementDePoule;
  /**
   * La phase finale telle que Wikipédia la donne, quand il y en a une : le
   * garde-fou de poule ne la couvre pas, chaque couperet a donc le sien.
   */
  phaseFinale?: Array<{
    tour: string;
    adversaire: string;
    scoreUsap: number;
    scoreOpponent: number;
    /** Ce que Wikipédia donne et qu'ESPN n'a pas ; écrit avec cette provenance. */
    arbitre?: string;
    affluence?: number;
  }>;
  /**
   * Les comptes rendus de l'ERC dans la Wayback Machine, par jour de match :
   * la page et l'instantané à demander — postérieur à la rencontre, sans quoi
   * l'archive rend la présentation d'avant-match. Quand une rencontre en a
   * un, ses compositions, réalisations et affluence viennent de là et non
   * d'ESPN : c'est l'organisateur lui-même. Cf. `lib/erc.ts`.
   */
  erc?: Record<string, { page: string; instantane: string }>;
  /** Ce qu'on sait de la campagne, pour le journal et pour la relecture. */
  note: string;
}

const CAMPAGNES: Record<string, Campagne> = {
  /**
   * Heineken Cup 2008-2009, poule 3 : Leicester, Ospreys, Perpignan, Trévise.
   * Troisième, à deux points des Ospreys : pas de phase finale. Classement
   * de la poule d'après la Wikipédia anglophone, « 2008–09 Heineken Cup ».
   * Welford Road d'après Wikipédia — l'USAP n'y a joué que ce 6 décembre.
   */
  "2008-2009": {
    ligue: "champions-cup",
    competition: "H-Cup",
    nouveauxAdversaires: [
      { name: "Leicester Tigers", shortName: "Leicester", city: "Leicester", pays: "ENG" },
    ],
    terrains: [
      { club: "Leicester", stade: "Welford Road Stadium", ville: "Leicester", capacite: 25849 },
    ],
    poule: {
      joues: 6,
      victoires: 4,
      nuls: 0,
      defaites: 2,
      essaisPour: 17,
      essaisContre: 10,
      pour: 154,
      contre: 120,
      bonusOffensifs: 1,
      bonusDefensifs: 1,
      points: 18,
    },
    note: "Heineken Cup, poule 3 — troisième, éliminée en poule",
  },
  /**
   * Heineken Cup 2009-2010, poule 1 : Munster, Northampton, Perpignan,
   * Trévise. Troisième, deux victoires à domicile, dont un 9-8 perdu à
   * Trévise et un 0-34 à Northampton. Classement d'après la Wikipédia
   * anglophone, « 2009–10 Heineken Cup ». Franklin's Gardens et Thomond Park
   * d'après Wikipédia.
   */
  "2009-2010": {
    ligue: "champions-cup",
    competition: "H-Cup",
    nouveauxAdversaires: [
      { name: "Northampton Saints", shortName: "Northampton", city: "Northampton", pays: "ENG" },
      { name: "Munster Rugby", shortName: "Munster", city: "Limerick", pays: "IE" },
    ],
    terrains: [
      { club: "Northampton", stade: "Franklin's Gardens", ville: "Northampton", capacite: 15249 },
      { club: "Munster", stade: "Thomond Park", ville: "Limerick", capacite: 25600 },
    ],
    poule: {
      joues: 6,
      victoires: 2,
      nuls: 0,
      defaites: 4,
      essaisPour: 12,
      essaisContre: 10,
      pour: 108,
      contre: 123,
      bonusOffensifs: 1,
      bonusDefensifs: 2,
      points: 11,
    },
    note: "Heineken Cup, poule 1 — troisième, éliminée en poule",
  },
  /**
   * Heineken Cup 2010-2011, poule 5 : Perpignan, Leicester, Scarlets,
   * Trévise. **Première de poule**, quatre bonus offensifs, un nul à Welford
   * Road ; quart de finale gagné 29-25 contre Toulon, délocalisé à
   * l'Estadi Cornellà-El Prat de Barcelone ; demi-finale perdue 7-23 contre
   * Northampton au Stadium MK de Milton Keynes. C'est la meilleure campagne
   * européenne de l'USAP depuis la finale de 2003. Classement et phase
   * finale d'après la Wikipédia anglophone, « 2010–11 Heineken Cup » ;
   * Parc y Scarlets d'après Wikipédia, les deux terrains neutres d'après
   * Wikipédia et ESPN, qui concordent.
   */
  "2010-2011": {
    ligue: "champions-cup",
    competition: "H-Cup",
    nouveauxAdversaires: [{ name: "Scarlets", shortName: "Scarlets", city: "Llanelli", pays: "WA" }],
    terrains: [{ club: "Scarlets", stade: "Parc y Scarlets", ville: "Llanelli", capacite: 14870 }],
    terrainsNeutres: [
      { stade: "Estadi Olímpic Lluís Companys", ville: "Barcelone", capacite: 55926 },
      { stade: "Stadium MK", ville: "Milton Keynes", capacite: 30500 },
    ],
    poule: {
      joues: 6,
      victoires: 4,
      nuls: 1,
      defaites: 1,
      essaisPour: 23,
      essaisContre: 9,
      pour: 196,
      contre: 112,
      bonusOffensifs: 4,
      bonusDefensifs: 0,
      points: 22,
    },
    phaseFinale: [
      {
        tour: "Quart de finale",
        adversaire: "Toulon",
        scoreUsap: 29,
        scoreOpponent: 25,
        arbitre: "Alain Rolland",
        affluence: 55000,
      },
      {
        tour: "Demi-finale",
        adversaire: "Northampton",
        scoreUsap: 7,
        scoreOpponent: 23,
        arbitre: "George Clancy",
        affluence: 18231,
      },
    ],
    note: "Heineken Cup, poule 5 — première, demi-finaliste",
  },
  /**
   * Challenge européen 2011-2012, poule 4 : Exeter, Perpignan, Dragons,
   * Cavalieri Prato. Deuxième derrière Exeter, à cinq points : pas de phase
   * finale. Classement d'après la Wikipédia anglophone, « 2011–12 European
   * Challenge Cup ». Sandy Park et le Stadio Lungobisenzio d'après
   * Wikipédia ; la capacité de Prato n'est pas donnée, elle reste vide.
   */
  "2011-2012": {
    ligue: "challenge-cup",
    competition: "Challenge Européen",
    nouveauxAdversaires: [
      { name: "Exeter Chiefs", shortName: "Exeter", city: "Exeter", pays: "ENG" },
      { name: "Cavalieri Prato", shortName: "Cavalieri Prato", city: "Prato", pays: "IT" },
    ],
    terrains: [
      { club: "Exeter", stade: "Sandy Park", ville: "Exeter", capacite: 15600 },
      { club: "Cavalieri Prato", stade: "Stadio Lungobisenzio", ville: "Prato", capacite: null },
    ],
    poule: {
      joues: 6,
      victoires: 4,
      nuls: 0,
      defaites: 2,
      essaisPour: 17,
      essaisContre: 9,
      pour: 153,
      contre: 112,
      bonusOffensifs: 2,
      bonusDefensifs: 0,
      points: 18,
    },
    note: "Challenge européen, poule 4 — deuxième, éliminée en poule",
  },
  /**
   * Heineken Cup 2007-2008, poule 1 : Perpignan, London Irish, Dragons,
   * Trévise. **Première de poule** avec 22 points, deux bonus offensifs, une
   * seule défaite à Reading ; quart de finale perdu 9-20 chez London Irish,
   * au Madejski Stadium. Classement et quart d'après la Wikipédia anglophone,
   * « 2007–08 Heineken Cup », qui donne l'arbitre et l'affluence du quart.
   * Feuilles à 22 joueurs. Le Madejski Stadium d'après Wikipédia.
   */
  "2007-2008": {
    ligue: "champions-cup",
    competition: "H-Cup",
    nouveauxAdversaires: [
      { name: "London Irish", shortName: "London Irish", city: "Reading", pays: "ENG" },
    ],
    terrains: [
      { club: "London Irish", stade: "Madejski Stadium", ville: "Reading", capacite: 24161 },
    ],
    poule: {
      joues: 6,
      victoires: 5,
      nuls: 0,
      defaites: 1,
      essaisPour: 20,
      essaisContre: 7,
      pour: 171,
      contre: 79,
      bonusOffensifs: 2,
      bonusDefensifs: 0,
      points: 22,
    },
    phaseFinale: [
      {
        tour: "Quart de finale",
        adversaire: "London Irish",
        scoreUsap: 9,
        scoreOpponent: 20,
        arbitre: "Alain Rolland",
        affluence: 16048,
      },
    ],
    // Les comptes rendus de l'ERC : six sur sept. **La première journée
    // manque** — Perpignan-Dragons du 9 novembre 2007 —, la page n'étant
    // archivée sous aucun identifiant voisin de ceux de sa journée
    // (12_7397 à 12_7412 lus un à un). Elle retombe sur ESPN, qui n'a
    // que le score.
    erc: {
      "2007-11-17": { page: "12_7454.php", instantane: "20071125" },
      "2007-12-09": { page: "12_7425.php", instantane: "20071215" },
      "2007-12-15": { page: "12_7435.php", instantane: "20071220" },
      "2008-01-12": { page: "12_8228.php", instantane: "20080201" },
      "2008-01-19": { page: "12_8239.php", instantane: "20080125" },
      "2008-04-05": { page: "12_8546.php", instantane: "20080412" },
    },
    note: "Heineken Cup, poule 1 — première, quart de finaliste",
  },
  /**
   * Challenge européen 2012-2013, poule 1 : Perpignan, Worcester, Rovigo,
   * Gernika. **Première de poule** avec 25 points — 293 marqués, un 79-12 à
   * Rovigo et un 90-12 contre Gernika —, quatre bonus offensifs et un
   * défensif au Sixways de Worcester, la seule défaite. Quart gagné 30-19
   * contre Toulouse et demi-finale perdue 22-25 contre le Stade Français,
   * tous deux à Aimé-Giral. Classement et phase finale d'après la Wikipédia
   * anglophone, « 2012–13 European Challenge Cup », qui donne arbitres et
   * affluences des couperets ; les trois terrains d'après Wikipédia.
   */
  "2012-2013": {
    ligue: "challenge-cup",
    competition: "Challenge Européen",
    nouveauxAdversaires: [
      { name: "Worcester Warriors", shortName: "Worcester", city: "Worcester", pays: "ENG" },
      { name: "Rugby Rovigo", shortName: "Rovigo", city: "Rovigo", pays: "IT" },
      { name: "Bizkaia Gernika", shortName: "Gernika", city: "Gernika", pays: "ES" },
    ],
    terrains: [
      { club: "Worcester", stade: "Sixways Stadium", ville: "Worcester", capacite: 11499 },
      { club: "Rovigo", stade: "Stadio Mario Battaglini", ville: "Rovigo", capacite: null },
      { club: "Gernika", stade: "Estadio Urbieta", ville: "Gernika", capacite: null },
    ],
    poule: {
      joues: 6,
      victoires: 5,
      nuls: 0,
      defaites: 1,
      essaisPour: 42,
      essaisContre: 5,
      pour: 293,
      contre: 89,
      bonusOffensifs: 4,
      bonusDefensifs: 1,
      points: 25,
    },
    phaseFinale: [
      {
        tour: "Quart de finale",
        adversaire: "Toulouse",
        scoreUsap: 30,
        scoreOpponent: 19,
        arbitre: "Alain Rolland",
        affluence: 12452,
      },
      {
        tour: "Demi-finale",
        adversaire: "Stade Français",
        scoreUsap: 22,
        scoreOpponent: 25,
        arbitre: "George Clancy",
        affluence: 12242,
      },
    ],
    note: "Challenge européen, poule 1 — première, demi-finaliste",
  },
  /**
   * Heineken Cup 2013-2014, poule 3 : Munster, Gloucester, Édimbourg,
   * Perpignan. Dernière avec 7 points, une seule victoire, contre Édimbourg ;
   * c'est la dernière campagne européenne avant la relégation. Classement
   * d'après la Wikipédia anglophone, « 2013–14 Heineken Cup » ; Murrayfield
   * d'après Wikipédia — Édimbourg y recevait alors.
   */
  "2013-2014": {
    ligue: "champions-cup",
    competition: "H-Cup",
    nouveauxAdversaires: [
      { name: "Edinburgh Rugby", shortName: "Edinburgh", city: "Édimbourg", pays: "SCT" },
    ],
    terrains: [
      { club: "Edinburgh", stade: "Murrayfield Stadium", ville: "Édimbourg", capacite: 67144 },
    ],
    poule: {
      joues: 6,
      victoires: 1,
      nuls: 0,
      defaites: 5,
      essaisPour: 10,
      essaisContre: 19,
      pour: 112,
      contre: 158,
      bonusOffensifs: 1,
      bonusDefensifs: 2,
      points: 7,
    },
    note: "Heineken Cup, poule 3 — dernière, éliminée en poule",
  },
  /**
   * Challenge européen 2018-2019, poule 3 : Sale, Connacht, Bordeaux-Bègles,
   * Perpignan. Dernière avec 3 points, un nul à Chaban-Delmas et cinq
   * défaites — la saison de la relégation. Classement d'après la Wikipédia
   * anglophone, « 2018–19 European Rugby Challenge Cup ». **ESPN ne libelle
   * pas les tours de cette saison** : ils sont numérotés par la date. L'AJ
   * Bell Stadium et le Sportsground d'après Wikipédia — Connacht n'avait pas
   * de terrain en base, l'USAP n'y était jamais allée.
   */
  "2018-2019": {
    ligue: "challenge-cup",
    competition: "Challenge Européen",
    nouveauxAdversaires: [{ name: "Sale Sharks", shortName: "Sale", city: "Salford", pays: "ENG" }],
    terrains: [
      { club: "Sale", stade: "AJ Bell Stadium", ville: "Salford", capacite: 12000 },
      { club: "Connacht", stade: "The Sportsground", ville: "Galway", capacite: 8129 },
    ],
    poule: {
      joues: 6,
      victoires: 0,
      nuls: 1,
      defaites: 5,
      essaisPour: 13,
      essaisContre: 27,
      pour: 117,
      contre: 197,
      bonusOffensifs: 0,
      bonusDefensifs: 1,
      points: 3,
    },
    note: "Challenge européen, poule 3 — dernière, éliminée en poule",
  },
};

// =============================================================================
// ADVERSAIRES ET TERRAINS
// =============================================================================

async function assurerAdversaires(campagne: Campagne) {
  for (const club of campagne.nouveauxAdversaires) {
    if (await prisma.opponent.findFirst({ where: { shortName: club.shortName } })) continue;
    if (DRY_RUN) {
      console.log(`  [adversaire] à créer : ${club.name}`);
      continue;
    }
    const pays = await prisma.country.findFirst({ where: { code: club.pays } });
    const cree = await prisma.opponent.create({
      data: {
        name: club.name,
        shortName: club.shortName,
        city: club.city,
        countryId: pays?.id ?? null,
        slug: `temp-${club.shortName.toLowerCase()}`,
      },
    });
    await prisma.opponent.update({
      where: { id: cree.id },
      data: { slug: generateOpponentSlug(club.name, cree.id) },
    });
    console.log(`  [adversaire] créé : ${club.name}`);
  }
  for (const t of campagne.terrains) {
    const club = await prisma.opponent.findFirst({
      where: { shortName: t.club },
      select: { id: true, venueId: true },
    });
    if (!club) {
      console.log(`  [stade] ${t.club} : club absent, rattachement différé`);
      continue;
    }
    if (club.venueId) continue;
    if (DRY_RUN) {
      console.log(`  [stade] à créer et rattacher : ${t.stade}, ${t.ville} → ${t.club}`);
      continue;
    }
    let stade = await prisma.venue.findFirst({ where: { name: t.stade }, select: { id: true } });
    if (!stade) {
      const cree = await prisma.venue.create({
        data: {
          name: t.stade,
          city: t.ville,
          capacity: t.capacite,
          slug: `temp-${t.club.toLowerCase()}`,
        },
      });
      stade = await prisma.venue.update({
        where: { id: cree.id },
        data: { slug: generateVenueSlug(t.stade, t.ville, cree.id) },
        select: { id: true },
      });
      console.log(`  [stade] créé : ${t.stade}, ${t.ville}`);
    }
    await prisma.opponent.update({ where: { id: club.id }, data: { venueId: stade.id } });
    console.log(`  [stade] ${t.club} → ${t.stade}`);
  }
  for (const t of campagne.terrainsNeutres ?? []) {
    if (await prisma.venue.findFirst({ where: { name: t.stade } })) continue;
    if (DRY_RUN) {
      console.log(`  [stade] à créer, terrain neutre : ${t.stade}, ${t.ville}`);
      continue;
    }
    const cree = await prisma.venue.create({
      data: { name: t.stade, city: t.ville, capacity: t.capacite, slug: `temp-${t.ville.toLowerCase()}` },
    });
    await prisma.venue.update({
      where: { id: cree.id },
      data: { slug: generateVenueSlug(t.stade, t.ville, cree.id) },
    });
    console.log(`  [stade] créé, terrain neutre : ${t.stade}, ${t.ville}`);
  }
}

// =============================================================================
// LECTURE ET CONTRÔLES
// =============================================================================

interface Realisations {
  essais: number;
  transformations: number;
  penalites: number;
  drops: number;
  total: number;
  /** Vrai si la somme des joueurs retombe sur le score du camp. */
  coherent: boolean;
}

/**
 * Réalisations d'un camp d'après ses joueurs — et le verdict. ESPN ne
 * connaît pas l'essai de pénalité : un écart de sept points en serait la
 * marque, mais ce serait une inférence, et le camp est alors simplement tenu
 * pour incohérent.
 */
function realisations(equipe: EspnEquipe): Realisations {
  const somme = (choix: (j: EspnEquipe["joueurs"][number]) => number) =>
    equipe.joueurs.reduce((s, j) => s + choix(j), 0);
  const r = {
    essais: somme((j) => j.essais),
    transformations: somme((j) => j.transformations),
    penalites: somme((j) => j.penalites),
    drops: somme((j) => j.drops),
  };
  // L'essai de pénalité d'avant 2017 vaut cinq points et se transformait :
  // il compte dans les essais et dans le total, sa transformation est déjà
  // sur la ligne du buteur.
  r.essais += equipe.essaisSansAuteur;
  const total = 5 * r.essais + 2 * r.transformations + 3 * r.penalites + 3 * r.drops;
  const points = somme((j) => j.points) + 5 * equipe.essaisSansAuteur;
  return {
    ...r,
    total,
    coherent: equipe.score != null && total === equipe.score && points === equipe.score,
  };
}

interface Rencontre {
  feuille: EspnMatch;
  jour: string;
  date: Date;
  kickoffTime: string;
  isHome: boolean;
  opponentNom: string;
  usap: EspnEquipe;
  adverse: EspnEquipe;
  realUsap: Realisations;
  realAdverse: Realisations;
  bonusOffensif: boolean;
  bonusDefensif: boolean;
  bonusIndecidable: boolean;
  resultat: MatchResult;
  alertes: string[];
  /** Camps dont la composition ne s'écrit pas — `false` l'USAP, `true` l'adversaire. */
  campsSansComposition: Set<boolean>;
}

async function lireCampagne(
  saison: string,
  campagne: Campagne,
  echecs: string[],
): Promise<Rencontre[]> {
  const resumes = await chercherMatchsUsap(saison, campagne.ligue);
  const rencontres: Rencontre[] = [];
  const startYear = Number(saison.slice(0, 4));

  // **ESPN ne libelle plus les tours en 2018-2019** : ses `notes` sont vides.
  // Quand aucune rencontre de la campagne n'en porte, les journées de poule se
  // numérotent par la date — une campagne sans phase finale n'a rien d'autre
  // à distinguer, et le garde-fou de poule vérifie qu'il y en a bien six.
  if (resumes.length > 0 && resumes.every((r) => !r.tour)) {
    resumes.forEach((r, i) => (r.tour = `Poule J${i + 1}`));
    console.log("  tours numérotés par la date : ESPN ne les libelle pas sur cette saison");
  }
  for (const resume of resumes) {
    const feuille = await lireMatch(campagne.ligue, resume.id);
    // Le tour vient du calendrier, la feuille ne le porte pas toujours.
    feuille.tour = resume.tour || feuille.tour;
    const isHome = feuille.domicile.id === USAP_ESPN;
    const usap = isHome ? feuille.domicile : feuille.exterieur;
    const adverse = isHome ? feuille.exterieur : feuille.domicile;
    const date = new Date(feuille.date || resume.date);
    const jour = date.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
    const etiquette = `${jour} ${adverse.nom}`;

    // **Sans composition, ESPN n'a pas de mi-temps non plus** : son 0-0 veut
    // dire « inconnu », et il faut le lire avant qu'un compte rendu de l'ERC
    // ne vienne remplir les joueurs — la mi-temps, elle, n'y est pas.
    if (usap.joueurs.length === 0 || adverse.joueurs.length === 0) {
      usap.miTemps = null;
      adverse.miTemps = null;
    }

    // **L'ERC prime sur ESPN quand on a son compte rendu.** Le score d'ESPN,
    // validé par la poule, sert de contrôle : un compte rendu qui ne le
    // redonne pas n'est pas celui de cette rencontre.
    const archive = campagne.erc?.[jour];
    if (archive) {
      const erc = lireCompteRendu2007(await lirePageArchivee(archive.page, archive.instantane));
      const ercUsap = isHome ? erc.domicile : erc.exterieur;
      const ercAdverse = isHome ? erc.exterieur : erc.domicile;
      if (ercUsap.score !== usap.score || ercAdverse.score !== adverse.score) {
        echecs.push(
          `${etiquette} : l'ERC donne ${erc.domicile.nom} ${erc.domicile.score}-${erc.exterieur.score} ` +
            `${erc.exterieur.nom}, ESPN ${usap.score}-${adverse.score} — « ${erc.titre} »`,
        );
        continue;
      }
      usap.joueurs = ercUsap.joueurs;
      usap.essaisSansAuteur = ercUsap.essaisSansAuteur;
      adverse.joueurs = ercAdverse.joueurs;
      adverse.essaisSansAuteur = ercAdverse.essaisSansAuteur;
      if (erc.affluence) feuille.affluence = erc.affluence;
      console.log(`  ERC ${archive.page} : « ${erc.titre} »${erc.affluence ? `, ${erc.affluence} spectateurs` : ""}`);
    }

    const opponentNom = CLUBS_ESPN[adverse.nom];
    if (!opponentNom) {
      echecs.push(`${etiquette} : club « ${adverse.nom} » inconnu de CLUBS_ESPN`);
      continue;
    }
    if (!/^Poule J\d+$|^(Quart|Demi|Finale)/.test(feuille.tour)) {
      echecs.push(`${etiquette} : tour « ${feuille.tour} » sans libellé connu`);
      continue;
    }
    if (usap.score == null || adverse.score == null) {
      echecs.push(`${etiquette} : score absent`);
      continue;
    }

    // **Une feuille sans composition n'est pas une feuille fausse.** ESPN
    // n'en publie aucune pour les deux matchs contre Prato de 2011-2012, ni
    // pour les sept de 2007-2008 : ni joueurs, ni mi-temps — son 0-0 y veut
    // dire « inconnu ». La rencontre est écrite avec son score, comme les
    // deux matchs de 2008-2009 dont la LNR corrompt la composition.
    //
    // **Et une composition qui n'aligne pas quinze titulaires est écartée,
    // elle seule.** Chez la LNR le match entier échoue ; chez ESPN les deux
    // listes sont indépendantes, les réalisations sont portées par le joueur
    // et non par le dossard, et le score est validé par la poule. Connacht le
    // 8 décembre 2018 et l'USAP le 11 janvier 2019 comptent vingt-quatre
    // noms dont deux sous le même numéro — un n°8, un n°6 —, et ESPN ne dit
    // pas lequel des deux hommes était sur le terrain.
    const alertes: string[] = [];
    const campsSansComposition = new Set<boolean>();
    for (const [camp, equipe, isOpponent] of [
      ["USAP", usap, false],
      [opponentNom, adverse, true],
    ] as const) {
      if (equipe.joueurs.length === 0) {
        alertes.push(`${camp} : aucune composition chez ESPN`);
        campsSansComposition.add(isOpponent);
        continue;
      }
      const titulaires = equipe.joueurs.filter((j) => j.isStarter).length;
      const numeros = new Set(equipe.joueurs.map((j) => j.numero));
      if (titulaires !== 15 || numeros.size !== equipe.joueurs.length) {
        alertes.push(
          `${camp} : ${titulaires} titulaires` +
            (numeros.size !== equipe.joueurs.length ? ", un dossard en double" : "") +
            " — composition écartée",
        );
        campsSansComposition.add(isOpponent);
      } else if (equipe.joueurs.length < 22) {
        alertes.push(`${camp} : ${equipe.joueurs.length} joueurs sur la feuille`);
      }
    }

    const realUsap = realisations(usap);
    const realAdverse = realisations(adverse);
    for (const [camp, r, equipe] of [
      ["USAP", realUsap, usap],
      [opponentNom, realAdverse, adverse],
    ] as const) {
      if (equipe.joueurs.length === 0) continue;
      if (!r.coherent) {
        alertes.push(
          `${camp} : ${r.total} points reconstitués pour ${equipe.score} au score — ` +
            "réalisations non écrites",
        );
      }
    }

    const isKnockout = !feuille.tour.startsWith("Poule");
    const bonus = computeBonuses({
      competitionShortName: campagne.competition,
      seasonStartYear: startYear,
      isKnockout,
      scoreUsap: usap.score,
      scoreOpponent: adverse.score,
      triesUsap: realUsap.coherent ? realUsap.essais : null,
      triesOpponent: realAdverse.coherent ? realAdverse.essais : null,
    });

    rencontres.push({
      feuille,
      jour,
      date,
      kickoffTime: date.toLocaleTimeString("fr-FR", {
        timeZone: "Europe/Paris",
        hour: "2-digit",
        minute: "2-digit",
      }),
      isHome,
      opponentNom,
      usap,
      adverse,
      realUsap,
      realAdverse,
      bonusOffensif: bonus.bonusOffensif,
      bonusDefensif: bonus.bonusDefensif,
      bonusIndecidable: bonus.triesMissing,
      resultat:
        usap.score > adverse.score
          ? MatchResult.VICTOIRE
          : usap.score < adverse.score
            ? MatchResult.DEFAITE
            : MatchResult.NUL,
      alertes,
      campsSansComposition,
    });
  }
  return rencontres;
}

/**
 * Un score peut-il résulter d'au moins quatre essais ? Cinq points l'essai,
 * deux la transformation — au plus une par essai —, trois la pénalité ou le
 * drop. On essaie chaque nombre d'essais possible, puis chaque nombre de
 * transformations : le reste doit être un multiple de trois.
 */
function peutPorterQuatreEssais(score: number): boolean {
  for (let essais = 4; 5 * essais <= score; essais++) {
    for (let transfos = 0; transfos <= essais && 5 * essais + 2 * transfos <= score; transfos++) {
      if ((score - 5 * essais - 2 * transfos) % 3 === 0) return true;
    }
  }
  return false;
}

/**
 * Le garde-fou : la poule reconstituée doit redonner le classement de
 * Wikipédia. Rend la liste des écarts, vide si tout retombe. Les essais ne
 * sont comparés que si toutes les feuilles du camp bouclent ; sinon ils sont
 * rendus en avertissement.
 */
function controlerLaPoule(
  rencontres: Rencontre[],
  officiel: ClassementDePoule,
): { ecarts: string[]; avertissements: string[] } {
  const poule = rencontres.filter((r) => r.feuille.tour.startsWith("Poule"));
  const v = poule.filter((r) => r.resultat === MatchResult.VICTOIRE).length;
  const n = poule.filter((r) => r.resultat === MatchResult.NUL).length;
  const d = poule.filter((r) => r.resultat === MatchResult.DEFAITE).length;
  const pour = poule.reduce((s, r) => s + r.usap.score!, 0);
  const contre = poule.reduce((s, r) => s + r.adverse.score!, 0);
  const bd = poule.filter((r) => r.bonusDefensif).length;

  // **Le classement tranche le bonus offensif d'une feuille muette**, à une
  // condition stricte : il manque exactement autant de bonus offensifs que de
  // rencontres où les essais de l'USAP sont inconnus. Chaque feuille muette
  // en porte alors un, et aucune autre lecture n'est possible — c'est le
  // raisonnement déjà tenu pour 2008-2009, où un seul BO et un seul match à
  // huit essais laissaient les deux feuilles muettes sans bonus. En 2010-2011
  // le classement en compte quatre, trois sont sur des feuilles qui bouclent,
  // et le 35-14 contre Trévise, seul muet, porte le quatrième. Le nombre
  // d'essais, lui, reste inconnu : `triesUsap` n'est pas touché.
  // **Un score qui ne peut pas contenir quatre essais n'est pas muet.** À
  // Worcester en 2012-2013, l'USAP marque 21 points sur une feuille qui ne
  // boucle pas : quatre essais font déjà vingt, et il n'existe aucune façon
  // de marquer le point restant. Le bonus y est donc exclu par l'arithmétique
  // seule, ce qui laisse deux feuilles muettes pour deux bonus manquants.
  const muets = poule.filter(
    (r) => r.bonusIndecidable && !r.bonusOffensif && peutPorterQuatreEssais(r.usap.score!),
  );
  const manquants = officiel.bonusOffensifs - poule.filter((r) => r.bonusOffensif).length;
  if (manquants > 0 && muets.length === manquants) {
    for (const r of muets) {
      r.bonusOffensif = true;
      r.alertes.push(
        "bonus offensif attribué par le classement : il en manque " +
          `${manquants} et ${manquants === 1 ? "cette feuille est la seule muette" : "ce sont les seules feuilles muettes"}`,
      );
    }
  }
  const bo = poule.filter((r) => r.bonusOffensif).length;
  const points = 4 * v + 2 * n + bo + bd;

  const ecarts = [
    poule.length !== officiel.joues ? `${poule.length} joués pour ${officiel.joues}` : null,
    v !== officiel.victoires ? `${v}V pour ${officiel.victoires}` : null,
    n !== officiel.nuls ? `${n}N pour ${officiel.nuls}` : null,
    d !== officiel.defaites ? `${d}D pour ${officiel.defaites}` : null,
    pour !== officiel.pour ? `${pour} marqués pour ${officiel.pour}` : null,
    contre !== officiel.contre ? `${contre} encaissés pour ${officiel.contre}` : null,
    bo !== officiel.bonusOffensifs ? `${bo} BO pour ${officiel.bonusOffensifs}` : null,
    bd !== officiel.bonusDefensifs ? `${bd} BD pour ${officiel.bonusDefensifs}` : null,
    points !== officiel.points ? `${points} points pour ${officiel.points}` : null,
  ].filter((e): e is string => e != null);

  const avertissements: string[] = [];
  for (const [camp, choix, attendu] of [
    ["marqués", (r: Rencontre) => r.realUsap, officiel.essaisPour],
    ["encaissés", (r: Rencontre) => r.realAdverse, officiel.essaisContre],
  ] as const) {
    const bouclent = poule.filter((r) => choix(r).coherent);
    const essais = bouclent.reduce((s, r) => s + choix(r).essais, 0);
    // Les colonnes d'essais de Wikipédia sont moins sûres que ses points :
    // en 2012-2013 elle compte cinq essais encaissés quand les trois feuilles
    // adverses qui bouclent en donnent six, chacune arithmétiquement juste.
    // Un écart d'essais se signale, il ne bloque pas.
    if (bouclent.length === poule.length) {
      if (essais !== attendu) {
        avertissements.push(`essais ${camp} : ${essais} sur les feuilles, ${attendu} au classement`);
      }
    } else {
      avertissements.push(
        `essais ${camp} : ${essais} sur ${bouclent.length} feuille(s) qui bouclent, ` +
          `${attendu} au classement — ${poule.length - bouclent.length} feuille(s) muette(s)`,
      );
    }
  }
  return { ecarts, avertissements };
}

/**
 * La phase finale reconstituée doit redonner celle de Wikipédia, couperet
 * par couperet : même tour, même adversaire, même score — et ni plus ni
 * moins de rencontres.
 */
function controlerLaPhaseFinale(
  rencontres: Rencontre[],
  officiels: NonNullable<Campagne["phaseFinale"]>,
): string[] {
  const couperets = rencontres.filter((r) => !r.feuille.tour.startsWith("Poule"));
  const ecarts: string[] = [];
  if (couperets.length !== officiels.length) {
    ecarts.push(`${couperets.length} couperet(s) chez ESPN pour ${officiels.length} attendu(s)`);
  }
  for (const o of officiels) {
    const r = couperets.find((c) => c.feuille.tour === o.tour);
    if (!r) {
      ecarts.push(`${o.tour} absent chez ESPN`);
      continue;
    }
    if (r.opponentNom !== o.adversaire || r.usap.score !== o.scoreUsap || r.adverse.score !== o.scoreOpponent) {
      ecarts.push(
        `${o.tour} : ${r.opponentNom} ${r.usap.score}-${r.adverse.score} chez ESPN, ` +
          `${o.adversaire} ${o.scoreUsap}-${o.scoreOpponent} attendu`,
      );
    }
  }
  return ecarts;
}

// =============================================================================
// ÉCRITURE
// =============================================================================

interface LigneAEcrire {
  isOpponent: boolean;
  playerId: string;
  shirtNumber: number;
  isStarter: boolean;
  isCaptain: boolean;
  positionPlayed: Position | null;
  tries: number;
  conversions: number;
  penalties: number;
  dropGoals: number;
  totalPoints: number;
  yellowCard: boolean;
  redCard: boolean;
}

/**
 * Les lignes d'un camp, fiches résolues par `lib/joueurs.ts`.
 *
 * **Deux passes, et l'ordre compte.** La première (`creer: false`) ne crée
 * rien : elle apparie les fiches connues, ce qui suffit au contrôle des
 * dossards — il ne regarde que celles-là. La seconde crée ce qui manque,
 * pour les seuls camps retenus. Sans cela, un camp écarté laissait derrière
 * lui les fiches de ses joueurs, sans aucune feuille : Trévise, le
 * 10 octobre 2009, en avait semé onze.
 */
async function resoudreCamp(
  camp: string,
  isOpponent: boolean,
  equipe: EspnEquipe,
  ecrireRealisations: boolean,
  creer: boolean,
): Promise<LigneAEcrire[]> {
  const lignes: LigneAEcrire[] = [];
  if (creer) console.log(`\n  --- ${camp} ---`);
  for (const j of equipe.joueurs) {
    const playerId = await trouverOuCreerJoueur(
      prisma,
      { firstName: j.firstName, lastName: j.lastName, numero: j.numero },
      { dryRun: DRY_RUN || !creer, journal: creer ? (m) => console.log(m) : () => {} },
    );
    // Le poste du banc ne se déduit pas du numéro : on reprend celui de la
    // fiche, faute de mieux — et jamais celui qu'ESPN écrit.
    let poste: Position | null = j.isStarter ? (POSTE_PAR_NUMERO[j.numero] ?? null) : null;
    if (!j.isStarter && playerId) {
      const fiche = await prisma.player.findUnique({
        where: { id: playerId },
        select: { position: true },
      });
      poste = fiche?.position ?? null;
    }
    const marques = ecrireRealisations
      ? [
          j.essais ? `${j.essais}E` : null,
          j.transformations ? `${j.transformations}T` : null,
          j.penalites ? `${j.penalites}P` : null,
          j.drops ? `${j.drops}D` : null,
        ]
          .filter(Boolean)
          .join(" ")
      : "";
    if (creer) console.log(
      `    n°${String(j.numero).padStart(2)} ${j.firstName} ${j.lastName}` +
        `${j.isCaptain ? " (cap)" : ""}${poste ? ` [${poste}]` : ""}` +
        `${marques ? ` — ${marques}` : ""}${j.jaunes ? " 🟨" : ""}${j.rouges ? " 🟥" : ""}`,
    );
    lignes.push({
      isOpponent,
      playerId,
      shirtNumber: j.numero,
      isStarter: j.isStarter,
      isCaptain: j.isCaptain,
      positionPlayed: poste,
      tries: ecrireRealisations ? j.essais : 0,
      conversions: ecrireRealisations ? j.transformations : 0,
      penalties: ecrireRealisations ? j.penalites : 0,
      dropGoals: ecrireRealisations ? j.drops : 0,
      totalPoints: ecrireRealisations ? j.points : 0,
      yellowCard: j.jaunes > 0,
      redCard: j.rouges > 0,
    });
  }
  return lignes;
}

async function main() {
  if (!SAISON || !(SAISON in CAMPAGNES)) {
    console.error(
      `Usage : npx tsx scripts/seed-cup-espn.ts <saison> [--dry] [--match=AAAA-MM-JJ]\n` +
        `Saisons connues : ${Object.keys(CAMPAGNES).join(", ")}`,
    );
    process.exit(1);
  }
  const campagne = CAMPAGNES[SAISON];
  console.log(
    `=== Coupe d'Europe ${SAISON} depuis ESPN${DRY_RUN ? " (simulation)" : ""} ===\n` +
      `${campagne.note}\n`,
  );

  const saison = await prisma.season.findFirstOrThrow({ where: { label: SAISON } });
  const competition = await prisma.competition.findFirstOrThrow({
    where: { shortName: campagne.competition },
  });
  await assurerAdversaires(campagne);

  const echecs: string[] = [];
  const rencontres = await lireCampagne(SAISON, campagne, echecs);

  console.log("");
  for (const r of rencontres) {
    const marques = (real: Realisations) =>
      real.coherent
        ? [
            real.essais ? `${real.essais}E` : null,
            real.transformations ? `${real.transformations}T` : null,
            real.penalites ? `${real.penalites}P` : null,
            real.drops ? `${real.drops}D` : null,
          ]
            .filter(Boolean)
            .join(" ") || "0"
        : "?";
    console.log(
      `${r.jour} ${r.kickoffTime} ${r.feuille.tour.padEnd(15)} ${r.isHome ? "H" : "A"} ` +
        `${r.opponentNom.padEnd(12)} ${r.usap.score}-${r.adverse.score}` +
        ` (mt ${r.usap.miTemps ?? "?"}-${r.adverse.miTemps ?? "?"})` +
        `${r.bonusOffensif ? " BO" : ""}${r.bonusDefensif ? " BD" : ""}${r.bonusIndecidable ? " BO?" : ""}` +
        ` | USAP ${marques(r.realUsap)} · ${r.opponentNom} ${marques(r.realAdverse)}`,
    );
    for (const a of r.alertes) console.log(`    ⚠ ${a}`);
  }

  // ---- Le garde-fou, avant toute écriture --------------------------------
  const { ecarts, avertissements } = controlerLaPoule(rencontres, campagne.poule);
  ecarts.push(...controlerLaPhaseFinale(rencontres, campagne.phaseFinale ?? []));
  const avertissementsPoule = avertissements.length;
  console.log("");
  for (const a of avertissements) console.log(`  ⚠ ${a}`);
  if (echecs.length > 0 || ecarts.length > 0) {
    for (const e of echecs) console.log(`  ⚠ ${e}`);
    if (ecarts.length > 0) {
      console.log(`  ⚠ écart avec le classement de poule (Wikipédia) : ${ecarts.join(", ")}`);
    }
    console.log("\nRien n'est écrit.");
    process.exitCode = 1;
    return;
  }
  console.log("  ✔ poule conforme au classement de Wikipédia");

  // ---- Écriture -----------------------------------------------------------
  let crees = 0;
  let majs = 0;
  let lignesEcrites = 0;
  for (const r of rencontres) {
    if (SEUL && r.jour !== SEUL) continue;
    const opponent = await prisma.opponent.findFirst({
      where: { OR: [{ shortName: r.opponentNom }, { name: r.opponentNom }] },
      select: { id: true },
    });
    // En simulation, un adversaire encore à créer n'empêche pas de relire les
    // compositions : c'est précisément le camp catalan qu'on veut relire.
    if (!opponent && !DRY_RUN) {
      throw new Error(`adversaire « ${r.opponentNom} » introuvable en base`);
    }

    console.log(`\n=== ${r.jour} ${r.isHome ? "USAP" : r.opponentNom} – ${r.isHome ? r.opponentNom : "USAP"} ===`);
    // Première passe, sans création : de quoi contrôler les dossards.
    const lignes = [
      ...(r.campsSansComposition.has(false)
        ? []
        : await resoudreCamp("USAP", false, r.usap, r.realUsap.coherent, false)),
      ...(r.campsSansComposition.has(true)
        ? []
        : await resoudreCamp(r.opponentNom, true, r.adverse, r.realAdverse.coherent, false)),
    ];

    // Le contrôle des dossards, sur les fiches déjà connues : en simulation
    // les fiches à créer n'ont pas d'identifiant et sont laissées de côté.
    //
    // **Un camp brouillé n'écarte que lui**, à la différence de la LNR, dont
    // les deux compositions viennent d'une même page. Chez ESPN les deux
    // listes sont indépendantes, et l'accident l'a montré : à Trévise le
    // 10 octobre 2009, il manque un pilier à la liste de Benetton et tous
    // les numéros suivants sont décalés d'un cran — 17 % d'accord —, quand
    // le camp catalan de la même feuille est à 93 %. La rencontre elle-même
    // est écrite dans tous les cas : son score est validé par la poule.
    const campsEcartes = new Set<boolean>(r.campsSansComposition);
    for (const [camp, isOpponent] of [
      ["USAP", false],
      [r.opponentNom, true],
    ] as const) {
      if (campsEcartes.has(isOpponent)) continue;
      const titulaires = lignes
        .filter((l) => l.isOpponent === isOpponent && l.isStarter && l.playerId)
        .map((l) => ({ playerId: l.playerId, numero: l.shirtNumber }));
      const bilan = await concordanceDesDossards(prisma, SAISON!, titulaires);
      if (bilan.taux == null) {
        console.log(`  dossards : ${camp} — trop peu de repères en base pour conclure`);
        continue;
      }
      console.log(
        `  dossards : ${camp} — ${(bilan.taux * 100).toFixed(0)} % d'accord ` +
          `avec le reste de la base, sur ${bilan.compares} titulaires`,
      );
      if (bilan.fabriques) {
        campsEcartes.add(isOpponent);
        avertissements.push(
          `${r.jour} ${r.opponentNom} : dossards de ${camp} incohérents avec la base — ` +
            "composition écartée, la rencontre est écrite sans elle",
        );
      }
    }
    // Seconde passe, avec création, pour les seuls camps retenus.
    const lignesRetenues = [
      ...(campsEcartes.has(false)
        ? []
        : await resoudreCamp("USAP", false, r.usap, r.realUsap.coherent, true)),
      ...(campsEcartes.has(true)
        ? []
        : await resoudreCamp(r.opponentNom, true, r.adverse, r.realAdverse.coherent, true)),
    ];
    if (DRY_RUN || !opponent) continue;

    const venueId = await terrainDuMatch(prisma, {
      opponentId: opponent.id,
      isHome: r.isHome,
      startYear: saison.startYear,
      jour: r.jour,
    });
    // Ce que Wikipédia donne d'un couperet et qu'ESPN n'a pas.
    const officiel = (campagne.phaseFinale ?? []).find((o) => o.tour === r.feuille.tour);
    const refereeId = officiel?.arbitre
      ? await trouverOuCreerArbitre(prisma, officiel.arbitre, false)
      : null;
    const donnees: Prisma.MatchUncheckedCreateInput = {
      slug: generateMatchSlug({
        competitionShortName: competition.shortName,
        competitionName: competition.name,
        opponentShortName: r.opponentNom,
        opponentName: r.opponentNom,
        isHome: r.isHome,
        matchday: null,
        round: r.feuille.tour,
        date: r.date,
      }),
      date: r.date,
      kickoffTime: r.kickoffTime,
      seasonId: saison.id,
      competitionId: competition.id,
      matchday: null,
      round: r.feuille.tour,
      isHome: r.isHome,
      venueId,
      opponentId: opponent.id,
      scoreUsap: r.usap.score,
      scoreOpponent: r.adverse.score,
      halfTimeUsap: r.usap.miTemps,
      halfTimeOpponent: r.adverse.miTemps,
      result: r.resultat,
      bonusOffensif: r.bonusOffensif,
      bonusDefensif: r.bonusDefensif,
      attendance: officiel?.affluence ?? r.feuille.affluence,
      ...(refereeId ? { refereeId } : {}),
      triesUsap: r.realUsap.coherent ? r.realUsap.essais : null,
      conversionsUsap: r.realUsap.coherent ? r.realUsap.transformations : null,
      penaltiesUsap: r.realUsap.coherent ? r.realUsap.penalites : null,
      dropGoalsUsap: r.realUsap.coherent ? r.realUsap.drops : null,
      penaltyTriesUsap: r.realUsap.coherent ? 0 : null,
      triesOpponent: r.realAdverse.coherent ? r.realAdverse.essais : null,
      conversionsOpponent: r.realAdverse.coherent ? r.realAdverse.transformations : null,
      penaltiesOpponent: r.realAdverse.coherent ? r.realAdverse.penalites : null,
      dropGoalsOpponent: r.realAdverse.coherent ? r.realAdverse.drops : null,
      penaltyTriesOpponent: r.realAdverse.coherent ? 0 : null,
    };

    const existant = await prisma.match.findFirst({
      where: {
        seasonId: saison.id,
        opponentId: opponent.id,
        date: { gte: new Date(`${r.jour}T00:00:00Z`), lt: new Date(`${r.jour}T23:59:59Z`) },
      },
      select: {
        id: true,
        halfTimeUsap: true,
        halfTimeOpponent: true,
        attendance: true,
        videoUrl: true,
        _count: { select: { players: true } },
      },
    });
    let matchId: string;
    if (existant) {
      await prisma.match.update({
        where: { id: existant.id },
        data: preserverAnnexes(donnees, existant),
      });
      matchId = existant.id;
      majs++;
      if (existant._count.players > 0) {
        await prisma.matchEvent.deleteMany({ where: { matchId } });
        await prisma.matchPlayer.deleteMany({ where: { matchId } });
        console.log(`  ${existant._count.players} ligne(s) effacée(s) avant réécriture`);
      }
    } else {
      matchId = (await prisma.match.create({ data: donnees, select: { id: true } })).id;
      crees++;
    }
    await prisma.matchPlayer.createMany({
      data: lignesRetenues.map((l) => ({ ...l, matchId })),
    });
    lignesEcrites += lignesRetenues.length;
  }

  console.log(
    `\n=== ${rencontres.length} rencontre(s) lue(s)` +
      (DRY_RUN ? "" : `, ${crees} créée(s), ${majs} mise(s) à jour, ${lignesEcrites} lignes écrites`) +
      `, ${echecs.length} en échec ===`,
  );
  for (const a of avertissements.slice(avertissementsPoule)) console.log(`  ⚠ ${a}`);
  for (const e of echecs) console.log(`  ⚠ ${e}`);
  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
  if (!DRY_RUN) {
    console.log(
      "\nÀ enchaîner :\n" +
        "  npx tsx scripts/detect-duplicate-players.ts\n" +
        "  npx tsx scripts/fix-bonus-points.ts --dry",
    );
  }
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

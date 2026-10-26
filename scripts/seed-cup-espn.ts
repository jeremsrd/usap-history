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
 * **Avant 2007-2008, sans ESPN.** ESPN ne remonte pas plus haut. Une
 * campagne porte alors son `calendrier`, d'après Wikipédia — jour, tour,
 * adversaire, score —, et les comptes rendus de l'ERC sont la seule source
 * des feuilles. Le score de Wikipédia sert de contrôle à celui de l'ERC, la
 * poule à tous les deux. Une rencontre sans compte rendu s'écrit avec son
 * jour et son score, attestée `CONCORDANT`. C'est le cas de 2006-2007 ;
 * 2005-2006 a ses sept comptes rendus, 2004-2005 un seul sur six, 2003-2004
 * aucun pour l'instant. Le bonus offensif d'une rencontre sans feuille peut
 * alors être tranché dans le calendrier, sur une autre source, avant que le
 * classement n'attribue le reste.
 *
 * **2001-2002, l'ancien site de l'ERC**, est la seule saison où la feuille
 * donne les minutes : entrées, sorties et exclusions, d'où un temps effectif
 * écrit, jaune déduit. Les entrants n'y ont pas de numéro (`shirtNumber`
 * `null`), et les prénoms n'y sont que des initiales : chaque nom de l'USAP
 * passe par `identites`, ou la rencontre ne s'écrit pas.
 *
 * Un joueur dont le nom complet est celui d'un autre homme déjà en base se
 * départage par le club de la feuille : `HOMONYMES_PARFAITS` de
 * `lib/joueurs.ts`.
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

import { PrismaClient, MatchResult, Prisma, EventType, type Position } from "@prisma/client";
import {
  chercherMatchsUsap,
  lireMatch,
  USAP_ESPN,
  LIGUES,
  type EspnEquipe,
  type EspnResume,
  type EspnJoueur,
  type EspnMatch,
  type Ligue,
} from "./lib/espn";
import { CLUBS_ESPN } from "./lib/clubs";
import { baremeDeMatch, pointsDesRealisations, pointsScaleFor, type Bareme, type PointsScale } from "../src/lib/scoring";
import {
  lirePageArchivee,
  lireCompteRendu2001,
  lireCompteRendu2004,
  lireCompteRendu2006,
  lireCompteRendu2007,
  lireMatchCentre,
  type ErcCompteRendu2001,
  type ErcCompteRendu2004,
  type ErcCompteRendu2006,
  type ErcEvenement,
} from "./lib/erc";
import { instantDeParis, journeeDeParis } from "./lib/dates";
import { attester } from "./lib/attestations";
import { normalize } from "./lib/noms";
import { POSTE_PAR_NUMERO, chercherJoueur, trouverOuCreerJoueur } from "./lib/joueurs";
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

/**
 * Un joueur de feuille : celui d'ESPN ou de l'ERC, ou celui de l'ERC de
 * 2001-2002 (`ErcJoueur2001`), dont les entrants n'ont pas de numéro et
 * dont la page donne les minutes des changements et des exclusions.
 */
type Joueur = Omit<EspnJoueur, "numero"> & {
  numero: number | null;
  entree?: number | null;
  sortie?: number | null;
  minutes?: number | null;
  minutesJaunes?: number[];
  /** Le prénom vient d'ailleurs que la feuille (`identites`) : sa source, attestée si la fiche est créée. */
  sourceDuPrenom?: string;
};
type Equipe = Omit<EspnEquipe, "joueurs"> & { joueurs: Joueur[] };

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
  /**
   * **Faute d'ESPN, le calendrier de Wikipédia.** ESPN ne remonte pas avant
   * 2007-2008 ; une campagne plus ancienne donne ici ses rencontres, avec
   * le nom du club tel que l'ERC l'écrit. Le score est celui de Wikipédia,
   * contrôlé par la poule, et le compte rendu de l'ERC, quand il existe,
   * doit le redonner. Sans compte rendu, la rencontre s'écrit avec son
   * score seul.
   */
  calendrier?: Array<{
    jour: string;
    tour: string;
    adversaire: string;
    isHome: boolean;
    scoreUsap: number;
    scoreOpponent: number;
    /** Décalage de l'heure locale du stade sur Paris, en heures : −1 au Royaume-Uni. */
    decalage?: number;
    /**
     * L'heure locale du coup d'envoi, quand le compte rendu ne la donne pas
     * et que le calendrier officiel de l'ERC l'écrit ; ramenée à Paris par
     * `decalage`.
     */
    heure?: string;
    /**
     * Le bonus offensif d'une rencontre sans feuille, quand une autre source
     * le tranche — jamais déduit du seul score. Sa démonstration en
     * commentaire, comme toute correction. Le classement de poule peut
     * ensuite attribuer les bonus qui restent.
     */
    bonusOffensif?: boolean;
    /** Ce que l'attestation doit ajouter sur la provenance du score. */
    note?: string;
  }>;
  /**
   * Les noms de l'ERC à corriger avant le rapprochement, « Prénom Nom » tel
   * que la page l'écrit → l'identité de la base. Une ligne n'entre ici qu'avec
   * sa démonstration en commentaire : c'est affirmer que la source se trompe,
   * ou qu'elle écrit le surnom d'une fiche déjà connue.
   */
  identites?: Record<string, { firstName: string; lastName: string; sourceDuPrenom?: string }>;
  /**
   * Les rencontres dont la composition adverse ne s'écrit pas encore, et la
   * raison : les réalisations des deux camps comptent toujours au match.
   */
  compositionsAdversesDifferees?: Record<string, string>;
  /** Ce qu'on sait de la campagne, pour le journal et pour la relecture. */
  note: string;
}

/** Sources des prénoms que les comptes rendus de 2001-2002 réduisent à l'initiale. */
const DE_MEMOIRE = "Jérémy, de mémoire (21 oct. 2026)";
/** Un article de la Wikipédia anglophone qui nomme le club du joueur. */
const wikipedia = (titre: string) => `Wikipédia anglophone, « ${titre} »`;
const GUIDE_1999_2000 = "Midi Olympique, guide de la saison 1999-2000, page Perpignan (photo transmise par Jérémy)";

const CAMPAGNES: Record<string, Campagne> = {
  /**
   * Heineken Cup 2001-2002, poule 1 : Leicester, Llanelli, Perpignan,
   * Calvisano. **Troisième** à 6 points, trois victoires et trois défaites ;
   * pas de phase finale. Classement d'après la Wikipédia anglophone,
   * « 2001–02 Heineken Cup pool stage » : sans bonus, à 2 points la
   * victoire, comme en 2002-2003.
   *
   * **Quatre comptes rendus de l'ERC sur six**, sur l'ancien site
   * (`english/fixturesresultspage/`, `lireCompteRendu2001`) : les deux
   * rencontres de janvier 2002, pages 11348 et 11351, ne sont pas archivées
   * et s'écrivent avec leur score. **Les heures viennent du calendrier
   * officiel de l'ERC** (`english/jspfiles/fixturesresultslist.jsp`, capture
   * du 7 octobre 2002), à l'heure du stade : 18:15 à Welford Road le 3
   * novembre, quand Wikipédia écrit 19:30 — l'organisateur prime.
   *
   * **Les compositions adverses passent elles aussi par `identites`**,
   * l'ERC n'écrivant que des initiales : Leicester et Llanelli depuis le
   * 26 octobre 2026, d'après Wikipédia. Celle de Calvisano attend
   * (`compositionsAdversesDifferees`) : quatorze de ses vingt-deux noms n'ont
   * pas de prénom connu.
   */
  "2001-2002": {
    ligue: "champions-cup",
    competition: "H-Cup",
    nouveauxAdversaires: [],
    terrains: [],
    poule: {
      joues: 6,
      victoires: 3,
      nuls: 0,
      defaites: 3,
      essaisPour: 19,
      essaisContre: 11,
      pour: 182,
      contre: 136,
      bonusOffensifs: 0,
      bonusDefensifs: 0,
      points: 6,
    },
    calendrier: [
      { jour: "2001-09-29", tour: "Poule J1", adversaire: "Ghial Amatori &Calvisano", isHome: true, scoreUsap: 56, scoreOpponent: 3, heure: "19:30" },
      { jour: "2001-10-05", tour: "Poule J2", adversaire: "Llanelli", isHome: false, scoreUsap: 6, scoreOpponent: 20, decalage: -1, heure: "18:45" },
      { jour: "2001-10-27", tour: "Poule J3", adversaire: "Leicester Tigers", isHome: true, scoreUsap: 30, scoreOpponent: 31, heure: "19:30" },
      { jour: "2001-11-03", tour: "Poule J4", adversaire: "Leicester Tigers", isHome: false, scoreUsap: 15, scoreOpponent: 54, decalage: -1, heure: "18:15" },
      { jour: "2002-01-04", tour: "Poule J5", adversaire: "Llanelli", isHome: true, scoreUsap: 42, scoreOpponent: 10, heure: "20:05" },
      { jour: "2002-01-12", tour: "Poule J6", adversaire: "Ghial Amatori & Calvisano", isHome: false, scoreUsap: 33, scoreOpponent: 18, heure: "14:30" },
    ],
    erc: {
      "2001-09-29": { page: "english/fixturesresultspage/11044.html", instantane: "20021008032347" },
      "2001-10-05": { page: "english/fixturesresultspage/11018.html", instantane: "20020604225636" },
      "2001-10-27": { page: "english/fixturesresultspage/11055.html", instantane: "20021008032249" },
      "2001-11-03": { page: "english/fixturesresultspage/11077.html", instantane: "20021008021415" },
    },
    identites: {
      // Prénoms donnés de mémoire par Jérémy le 21 oct. 2026. Rimas
      // Alvarez-Kairelis est le talonneur de la fiche USAP de 2004 à 2011.
      "R Alvarez-Kairelis": { firstName: "Rimas", lastName: "Alvarez-Kairelis", sourceDuPrenom: DE_MEMOIRE },
      "T Lacroix": { firstName: "Thierry", lastName: "Lacroix", sourceDuPrenom: DE_MEMOIRE },
      "T Lacrois": { firstName: "Thierry", lastName: "Lacroix", sourceDuPrenom: DE_MEMOIRE },
      "J-M Souverbie": { firstName: "Jean-Marc", lastName: "Souverbie", sourceDuPrenom: DE_MEMOIRE },
      "J Orengo": { firstName: "José", lastName: "Orengo", sourceDuPrenom: DE_MEMOIRE },
      "J Daniell": { firstName: "John", lastName: "Daniell", sourceDuPrenom: DE_MEMOIRE },
      "J Danielli": { firstName: "John", lastName: "Daniell", sourceDuPrenom: DE_MEMOIRE },
      "M dal Maso": { firstName: "Marc", lastName: "Dal Maso", sourceDuPrenom: DE_MEMOIRE },
      "M Dal Maso": { firstName: "Marc", lastName: "Dal Maso", sourceDuPrenom: DE_MEMOIRE },
      "R MacDonald": { firstName: "Robbie", lastName: "MacDonald", sourceDuPrenom: DE_MEMOIRE },
      // Fiches déjà en base, que Jérémy reconnaît le 21 oct. 2026 : à l'USAP
      // après 2004 (Loustau, Le Corvec, Mas), ou passés ensuite ailleurs —
      // Couttet à Brive, Thion à Biarritz, Murphy aux London Irish.
      "L Loustau": { firstName: "Ludovic", lastName: "Loustau" },
      "G le Corvec": { firstName: "Grégory", lastName: "Le Corvec" },
      "N Mas": { firstName: "Nicolas", lastName: "Mas" },
      "N Couttet": { firstName: "Nicolas", lastName: "Couttet" },
      "J Thion": { firstName: "Jerome", lastName: "Thion" },
      "P Murphy": { firstName: "Phil", lastName: "Murphy" },
      "P Giordani": { firstName: "Pascal", lastName: "Giordani" },
      "R Jechoux": { firstName: "Raphael", lastName: "Jechoux" },
      // Prénoms de l'effectif 1999-2000 (guide du Midi Olympique, cf.
      // set-naissances-effectif-1999-2000.ts) : même club deux saisons plus
      // tard, même initiale, aucun homonyme dans l'effectif.
      "F Cermeno": { firstName: "Frédéric", lastName: "Cermeno", sourceDuPrenom: GUIDE_1999_2000 },
      "F Sid": { firstName: "Farid", lastName: "Sid", sourceDuPrenom: GUIDE_1999_2000 },
      "D Plana": { firstName: "Didier", lastName: "Plana", sourceDuPrenom: GUIDE_1999_2000 },
      "B Bellot": { firstName: "Benoît", lastName: "Bellot", sourceDuPrenom: GUIDE_1999_2000 },
      "J Basset": { firstName: "Jacques", lastName: "Basset", sourceDuPrenom: GUIDE_1999_2000 },
      "R Peillard": { firstName: "Renaud", lastName: "Peillard", sourceDuPrenom: GUIDE_1999_2000 },
      "S de Besombes": { firstName: "Stéphane", lastName: "De Besombes", sourceDuPrenom: GUIDE_1999_2000 },
      "S De Besombes": { firstName: "Stéphane", lastName: "De Besombes", sourceDuPrenom: GUIDE_1999_2000 },
      "S Deroeux": { firstName: "Sylvain", lastName: "Deroeux", sourceDuPrenom: GUIDE_1999_2000 },
      "S Derouex": { firstName: "Sylvain", lastName: "Deroeux", sourceDuPrenom: GUIDE_1999_2000 },
      "P Meya": { firstName: "Pascal", lastName: "Meya", sourceDuPrenom: GUIDE_1999_2000 },
      "M Konieckiewicz": { firstName: "Michel", lastName: "Konieckiewicz", sourceDuPrenom: GUIDE_1999_2000 },
      "M Koniek": { firstName: "Michel", lastName: "Konieckiewicz", sourceDuPrenom: GUIDE_1999_2000 },
      "O Olibeau": { firstName: "Olivier", lastName: "Olibeau", sourceDuPrenom: GUIDE_1999_2000 },
      "B Goutta": { firstName: "Bernard", lastName: "Goutta", sourceDuPrenom: GUIDE_1999_2000 },
      // **Leicester et Llanelli**, cherchés le 26 oct. 2026 : un nom n'entre
      // ici que si l'article cité nomme le club, et l'initiale concorde. Les
      // fiches déjà en base (Geordan Murphy, Goode, Louis Deacon, Moody,
      // Peter Short, Harry Ellis, Freshwater, Chuter, Stephen Jones, Cooper,
      // Wyatt, Scott Morgan) sont reprises avec leur prénom ; leurs articles
      // donnent le même parcours que leurs feuilles.
      "T Stimpson": { firstName: "Tim", lastName: "Stimpson", sourceDuPrenom: wikipedia("Tim Stimpson") },
      "G Murphy": { firstName: "Geordan", lastName: "Murphy" },
      "G Gelderbloom": { firstName: "Glenn", lastName: "Gelderbloom", sourceDuPrenom: wikipedia("Glenn Gelderbloom") },
      "R Kafer": { firstName: "Rod", lastName: "Kafer", sourceDuPrenom: wikipedia("Rod Kafer") },
      // Ailier venu du XIII en 2000, quatre saisons à Leicester : aucun article
      // de Wikipédia, mais sa nécrologie.
      "S Booth": {
        firstName: "Steve",
        lastName: "Booth",
        sourceDuPrenom: "The Rugby Paper, « Former Leicester Tigers wing Steve Booth has died suddenly aged 42 »",
      },
      "A Goode": { firstName: "Andy", lastName: "Goode" },
      "J Hamilton": { firstName: "Jamie", lastName: "Hamilton", sourceDuPrenom: wikipedia("Jamie Hamilton (rugby union)") },
      "A Healey": { firstName: "Austin", lastName: "Healey", sourceDuPrenom: wikipedia("Austin Healey") },
      "G Rowntree": { firstName: "Graham", lastName: "Rowntree", sourceDuPrenom: wikipedia("Graham Rowntree") },
      "D West": { firstName: "Dorian", lastName: "West", sourceDuPrenom: wikipedia("Dorian West") },
      "D Garforth": { firstName: "Darren", lastName: "Garforth", sourceDuPrenom: wikipedia("Darren Garforth") },
      "L Deacon": { firstName: "Louis", lastName: "Deacon" },
      "B Kay": { firstName: "Ben", lastName: "Kay", sourceDuPrenom: wikipedia("Ben Kay") },
      "L Moody": { firstName: "Lewis", lastName: "Moody" },
      "J Kronfeld": { firstName: "Josh", lastName: "Kronfeld", sourceDuPrenom: wikipedia("Josh Kronfeld") },
      "N Back": { firstName: "Neil", lastName: "Back", sourceDuPrenom: wikipedia("Neil Back") },
      "P Short": { firstName: "Peter", lastName: "Short" },
      "O Smith": { firstName: "Ollie", lastName: "Smith", sourceDuPrenom: wikipedia("Ollie Smith (rugby union, born 1982)") },
      "H Ellis": { firstName: "Harry", lastName: "Ellis" },
      "P Freshwater": { firstName: "Perry", lastName: "Freshwater" },
      "G Chuter": { firstName: "George", lastName: "Chuter" },
      "R Cockerill": { firstName: "Richard", lastName: "Cockerill", sourceDuPrenom: wikipedia("Richard Cockerill") },
      "D Jelley": { firstName: "Derek", lastName: "Jelley", sourceDuPrenom: wikipedia("Derek Jelley") },
      // Le frère de Martin, n°8 de Leicester de 1994 à 2004.
      "W Johnson": { firstName: "Will", lastName: "Johnson", sourceDuPrenom: wikipedia("Will Johnson (rugby union, born 1974)") },
      "B Davies": { firstName: "Barry", lastName: "Davies", sourceDuPrenom: wikipedia("Barry Davies (rugby union, born 1981)") },
      "W Proctor": { firstName: "Wayne", lastName: "Proctor", sourceDuPrenom: wikipedia("Wayne Proctor") },
      "M Cardey": { firstName: "Matt", lastName: "Cardey", sourceDuPrenom: wikipedia("Matt Cardey") },
      "L Davies": { firstName: "Leigh", lastName: "Davies", sourceDuPrenom: wikipedia("Leigh Davies") },
      "S Finau": { firstName: "Salesi", lastName: "Finau", sourceDuPrenom: wikipedia("Salesi Finau") },
      "S Jones": { firstName: "Stephen", lastName: "Jones" },
      "G Bowen": { firstName: "Gareth", lastName: "Bowen", sourceDuPrenom: wikipedia("Gareth Bowen") },
      // Le seul Easterby à l'initiale G : le demi de mêlée irlandais. L'infobox
      // de Wikipédia le tient à Ebbw Vale jusqu'en 2003, l'IRFU le dit « former
      // Llanelli star » ; la feuille de l'ERC l'aligne à Llanelli.
      "G Easterby": { firstName: "Guy", lastName: "Easterby", sourceDuPrenom: wikipedia("Guy Easterby") },
      "M Madden": { firstName: "Martyn", lastName: "Madden", sourceDuPrenom: wikipedia("Martyn Madden") },
      "R McBryde": { firstName: "Robin", lastName: "McBryde", sourceDuPrenom: wikipedia("Robin McBryde") },
      "J Davies": { firstName: "John", lastName: "Davies", sourceDuPrenom: wikipedia("John Davies (rugby union, born 1969)") },
      "V Cooper": { firstName: "Vernon", lastName: "Cooper" },
      "L Gross": { firstName: "Luke", lastName: "Gross", sourceDuPrenom: wikipedia("Luke Gross") },
      "C Wyatt": { firstName: "Christopher", lastName: "Wyatt" },
      "D Jones": { firstName: "Dafydd", lastName: "Jones", sourceDuPrenom: wikipedia("Dafydd Jones") },
      "D Hodges": { firstName: "Dave", lastName: "Hodges", sourceDuPrenom: wikipedia("Dave Hodges (rugby union)") },
      // **Probable seulement** : il remplace le n°8 de la 55ᵉ à la 67ᵉ, et
      // Scott Morgan, deuxième ligne ou flanker, est passé de Neath à Llanelli
      // avant Bristol et Leeds — sans date. Fiche existante (Leeds, Dragons).
      "S Morgan": { firstName: "Scott", lastName: "Morgan" },
    },
    compositionsAdversesDifferees: {
      "2001-09-29":
        "quatorze Calvisanais sur vingt-deux sans prénom connu (Dragotto, Zitelli, Arboit, Scanziani, Bordes, Merli, " +
        "Castiglia, Macri, Davo, Mastrodomenico, Lanzi, Scotuzzi, Cairo, Ricciardo) ; Wikipédia ne les cite que par " +
        "leur nom — à chercher dans La Gazzetta dello Sport",
    },
    note: "Heineken Cup, poule 1 — troisième, éliminée en poule",
  },
  /**
   * Heineken Cup 2002-2003, poule 2 : Perpignan, Munster, Gloucester, Arix
   * Viadana. **Première de poule** à 8 points, devant Munster et Gloucester
   * à égalité ; quart gagné 26-19 à Llanelli, demi-finale gagnée 21-14 chez
   * le Leinster, **finale perdue 17-22 contre Toulouse** à Lansdowne Road.
   * Classement, calendrier et phase finale d'après la Wikipédia anglophone,
   * « 2002–03 Heineken Cup pool stage » et « 2002–03 Heineken Cup » ;
   * l'arbitre de la finale, Chris White, y est le seul nommé.
   *
   * **Sans bonus, à 2 points la victoire** : le classement n'a pas de
   * colonne bonus, et quatre victoires y font 8 points. `pointsScaleFor` le
   * sait depuis le 18 octobre 2026 pour les coupes d'Europe d'avant
   * 2003-2004.
   *
   * **Aucun compte rendu de l'ERC** : les captures du site s'arrêtent en
   * octobre 2002, avant les rencontres de l'USAP, et il ferme en avril 2003
   * (`siteclosed`). Les neuf rencontres s'écrivent avec leur score.
   *
   * Le Llanelli de 2002-2003 est rattaché aux Scarlets (`CLUBS_ESPN`), à
   * Stradey Park par `seed-stades-historiques.ts`. Demi-finale et finale à
   * Lansdowne Road par `TERRAINS_PARTICULIERS`. Stades créés : le
   * Zaffanella de Viadana, 6 000 places, et le RDS Arena du Leinster,
   * 20 600 places aujourd'hui, d'après Wikipédia.
   */
  "2002-2003": {
    ligue: "champions-cup",
    competition: "H-Cup",
    nouveauxAdversaires: [
      { name: "Rugby Viadana", shortName: "Viadana", city: "Viadana", pays: "IT" },
      { name: "Leinster Rugby", shortName: "Leinster", city: "Dublin", pays: "IE" },
    ],
    terrains: [
      { club: "Viadana", stade: "Stadio Luigi Zaffanella", ville: "Viadana", capacite: 6000 },
      { club: "Leinster", stade: "RDS Arena", ville: "Dublin", capacite: 20600 },
    ],
    poule: {
      joues: 6,
      victoires: 4,
      nuls: 0,
      defaites: 2,
      essaisPour: 23,
      essaisContre: 16,
      pour: 176,
      contre: 156,
      bonusOffensifs: 0,
      bonusDefensifs: 0,
      points: 8,
    },
    phaseFinale: [
      { tour: "Quart de finale", adversaire: "Scarlets", scoreUsap: 26, scoreOpponent: 19, affluence: 10800 },
      { tour: "Demi-finale", adversaire: "Leinster", scoreUsap: 21, scoreOpponent: 14, affluence: 37000 },
      { tour: "Finale", adversaire: "Toulouse", scoreUsap: 17, scoreOpponent: 22, arbitre: "Chris White", affluence: 28600 },
    ],
    calendrier: [
      { jour: "2002-10-12", tour: "Poule J1", adversaire: "Viadana", isHome: true, scoreUsap: 46, scoreOpponent: 27 },
      { jour: "2002-10-19", tour: "Poule J2", adversaire: "Munster", isHome: false, scoreUsap: 21, scoreOpponent: 30, decalage: -1 },
      { jour: "2002-12-08", tour: "Poule J3", adversaire: "Gloucester Rugby", isHome: false, scoreUsap: 16, scoreOpponent: 33, decalage: -1 },
      { jour: "2002-12-14", tour: "Poule J4", adversaire: "Gloucester Rugby", isHome: true, scoreUsap: 31, scoreOpponent: 23 },
      { jour: "2003-01-11", tour: "Poule J5", adversaire: "Munster", isHome: true, scoreUsap: 23, scoreOpponent: 8 },
      { jour: "2003-01-18", tour: "Poule J6", adversaire: "Viadana", isHome: false, scoreUsap: 39, scoreOpponent: 35 },
      { jour: "2003-04-16", tour: "Quart de finale", adversaire: "Llanelli", isHome: false, scoreUsap: 26, scoreOpponent: 19, decalage: -1 },
      { jour: "2003-04-27", tour: "Demi-finale", adversaire: "Leinster", isHome: false, scoreUsap: 21, scoreOpponent: 14, decalage: -1 },
      { jour: "2003-05-24", tour: "Finale", adversaire: "Stade Toulousain", isHome: false, scoreUsap: 17, scoreOpponent: 22, decalage: -1 },
    ],
    note: "Heineken Cup, poule 2 — première, finaliste",
  },
  /**
   * Heineken Cup 2003-2004, poule 6 : London Wasps, Celtic Warriors,
   * Perpignan, Calvisano. **Troisième** avec 15 points, deux bonus
   * offensifs et un défensif ; pas de phase finale. Classement et calendrier
   * d'après la Wikipédia francophone, « Coupe d'Europe de rugby à XV
   * 2003-2004 », que l'anglophone redonne (« 2003–04 Heineken Cup pool
   * stage »).
   *
   * **Aucun compte rendu de l'ERC n'est encore lu** : l'archive était hors
   * service le 18 octobre 2026, et les six rencontres s'écrivent avec leur
   * score. **Les deux bonus offensifs, le classement les pose seul** : 17,
   * 15, 7 et 6 points ne peuvent pas porter quatre essais, restent le 26-19
   * contre les Warriors et le 48-7 contre Calvisano, deux feuilles muettes
   * pour deux bonus. Le compte rendu « Perpignan v Calvisano » des archives
   * de l'EPCR semble redonner celui du 48-7 — quatre essais à la
   * demi-heure, Bourret, Marty, Goutta, Manas, 31-0 à la pause, puis un
   * retour de Calvisano, ce que le 45-0 de 2006 exclut —, mais il n'a été
   * vu que par un extrait de moteur de recherche, le site répondant 502.
   *
   * Les Celtic Warriors, région de Bridgend et de Pontypridd, n'ont vécu
   * que la saison 2003-2004 (liquidés le 1er juin 2004) ; ils jouent au
   * Brewery Field de Bridgend depuis novembre 2003. 8 000 places
   * aujourd'hui, d'après Wikipédia, qui en donnait 12 000 au temps des
   * Warriors. Wasps et Calvisano sont déjà en base avec leurs terrains.
   */
  "2003-2004": {
    ligue: "champions-cup",
    competition: "H-Cup",
    nouveauxAdversaires: [
      { name: "Celtic Warriors", shortName: "Celtic Warriors", city: "Bridgend", pays: "WA" },
    ],
    terrains: [
      { club: "Celtic Warriors", stade: "Brewery Field", ville: "Bridgend", capacite: 8000 },
    ],
    poule: {
      joues: 6,
      victoires: 3,
      nuls: 0,
      defaites: 3,
      essaisPour: 13,
      essaisContre: 11,
      pour: 119,
      contre: 115,
      bonusOffensifs: 2,
      bonusDefensifs: 1,
      points: 15,
    },
    calendrier: [
      { jour: "2003-12-07", tour: "Poule J1", adversaire: "London Wasps", isHome: false, scoreUsap: 7, scoreOpponent: 28, decalage: -1 },
      { jour: "2003-12-13", tour: "Poule J2", adversaire: "Celtic Warriors", isHome: true, scoreUsap: 26, scoreOpponent: 19 },
      { jour: "2004-01-10", tour: "Poule J3", adversaire: "Calvisano", isHome: true, scoreUsap: 48, scoreOpponent: 7 },
      { jour: "2004-01-17", tour: "Poule J4", adversaire: "Calvisano", isHome: false, scoreUsap: 17, scoreOpponent: 11 },
      { jour: "2004-01-23", tour: "Poule J5", adversaire: "Celtic Warriors", isHome: false, scoreUsap: 15, scoreOpponent: 16, decalage: -1 },
      { jour: "2004-02-01", tour: "Poule J6", adversaire: "London Wasps", isHome: true, scoreUsap: 6, scoreOpponent: 34 },
    ],
    note: "Heineken Cup, poule 6 — troisième",
  },
  /**
   * Heineken Cup 2004-2005, poule 5 : Newcastle Falcons, Perpignan, Newport
   * Gwent Dragons, Edinburgh. **Deuxième** avec 15 points, à égalité avec
   * les Dragons et devant eux à la différence de points ; pas de phase
   * finale. Classement et calendrier d'après la Wikipédia francophone,
   * « Coupe d'Europe de rugby à XV 2004-2005 », que l'anglophone redonne.
   *
   * Les trois adversaires et leurs terrains sont déjà en base.
   */
  "2004-2005": {
    ligue: "champions-cup",
    competition: "H-Cup",
    nouveauxAdversaires: [],
    terrains: [],
    poule: {
      joues: 6,
      victoires: 3,
      nuls: 0,
      defaites: 3,
      essaisPour: 15,
      essaisContre: 10,
      pour: 133,
      contre: 107,
      bonusOffensifs: 2,
      bonusDefensifs: 1,
      points: 15,
    },
    calendrier: [
      // **Pas de bonus offensif, et c'est le relevé des marqueurs de l'ERC qui
      // l'établit**, la page du match n'étant pas archivée. Après deux
      // journées (cup/25_3033, 3 novembre 2004), l'USAP n'a que trois
      // marqueurs pour ses 37 points : Giannantonio 16, Edmonds 13,
      // Laharrague 3. Ôté Newcastle-Perpignan, dont la feuille est lue
      // (Edmonds 8, Giannantonio 3, Laharrague 3), restent pour ce 23-0
      // Giannantonio 13, Edmonds 5 — un essai —, et cinq points sans auteur
      // nommé : un essai au plus. Le relevé des essais (cup/25_3183, 4
      // décembre) ne donne pas deux essais à Giannantonio : ses 13 points
      // en portent un au plus. Trois essais au plus, donc.
      { jour: "2004-10-22", tour: "Poule J1", adversaire: "Edinburgh", isHome: true, scoreUsap: 23, scoreOpponent: 0, bonusOffensif: false },
      { jour: "2004-10-31", tour: "Poule J2", adversaire: "Newcastle Falcons", isHome: false, scoreUsap: 14, scoreOpponent: 19, decalage: -1 },
      { jour: "2004-12-04", tour: "Poule J3", adversaire: "Dragons", isHome: false, scoreUsap: 14, scoreOpponent: 27, decalage: -1 },
      { jour: "2004-12-11", tour: "Poule J4", adversaire: "Dragons", isHome: true, scoreUsap: 32, scoreOpponent: 9 },
      // **33-12, et non 32-12 comme l'écrit la Wikipédia francophone** : le
      // tableau de match de l'anglophone (« 2004–05 Heineken Cup pool stage »)
      // donne 33-12, et c'est le seul score que les deux classements
      // admettent — 133 marqués par l'USAP, 104 encaissés par Newcastle. Le
      // compte rendu de l'ERC, repris par les archives de l'EPCR, le redonne
      // par le détail : 9-9 à la pause, trois pénalités par camp, puis quatre
      // essais pour le bonus — deux d'Alvarez Kairelis — et une pénalité de
      // Wilkinson. Sa page de 2005 n'est pas archivée. **Le bonus offensif
      // est dans le même compte rendu** : « the French club secured a crucial
      // bonus point », Newcastle menant ensuite la poule à 17 points devant
      // l'USAP et les Dragons à 15.
      {
        jour: "2005-01-08",
        tour: "Poule J5",
        adversaire: "Newcastle Falcons",
        isHome: true,
        scoreUsap: 33,
        scoreOpponent: 12,
        bonusOffensif: true,
        note:
          "Score de la Wikipédia anglophone, « 2004–05 Heineken Cup pool stage » (la francophone écrit 32-12, que les classements démentent) ; bonus offensif d'après le compte rendu de l'ERC repris par historical-stats.epcrugby.com, « Perpignan v Newcastle Falcons ».",
      },
      { jour: "2005-01-16", tour: "Poule J6", adversaire: "Edinburgh", isHome: false, scoreUsap: 17, scoreOpponent: 40, decalage: -1 },
    ],
    identites: {
      // L'ailier de Newcastle, n°14 le 31 octobre 2004, passé à Toulon en
      // 2009 : la fiche « Thomas May » que Toulon lui a donnée, n°12 le 5
      // novembre 2009 et n°20 le 4 novembre 2010.
      "Tom May": { firstName: "Thomas", lastName: "May" },
    },
    erc: {
      "2004-10-31": { page: "cup/25_3020.php", instantane: "20041031203511" },
    },
    note: "Heineken Cup, poule 5 — deuxième",
  },
  /**
   * Heineken Cup 2005-2006, poule 2 : Perpignan, Leeds Tykes, Cardiff
   * Blues, Calvisano. **Première de poule** avec 23 points, deux bonus
   * offensifs et un défensif, la seule défaite d'un point à Headingley ;
   * quart de finale perdu 10-19 contre Munster, reçu à Lansdowne Road.
   * Classement et calendrier d'après la Wikipédia francophone, « Coupe
   * d'Europe de rugby à XV 2005-2006 » ; arbitre et affluence du quart
   * d'après l'anglophone, « 2005–06 Heineken Cup », que l'ERC redonne.
   *
   * **Les sept comptes rendus de l'ERC sont archivés**, de la forme de
   * 2006-2007 (`lireCompteRendu2006`), avec leur chronologie complète.
   * Leurs adresses ne viennent pas de la CDX, hors service le 18 octobre
   * 2026, mais du tableau « Results so far » de Cardiff-Perpignan
   * (12_4626), qui renvoie à la page de chaque rencontre des deux clubs.
   *
   * Stades : l'Arms Park, 12 125 places aujourd'hui, est le terrain des
   * Blues hors 2009-2012 ; Headingley, 19 700 places pour sa tribune de
   * rugby ; San Michele, 5 000 places. Tous trois d'après Wikipédia, sous le
   * nom que l'ERC écrit.
   */
  "2005-2006": {
    ligue: "champions-cup",
    competition: "H-Cup",
    nouveauxAdversaires: [
      { name: "Leeds Tykes", shortName: "Leeds", city: "Leeds", pays: "ENG" },
      { name: "Rugby Calvisano", shortName: "Calvisano", city: "Calvisano", pays: "IT" },
    ],
    terrains: [
      { club: "Cardiff", stade: "Cardiff Arms Park", ville: "Cardiff", capacite: 12125 },
      { club: "Leeds", stade: "Headingley Stadium", ville: "Leeds", capacite: 19700 },
      { club: "Calvisano", stade: "Centro Sportivo San Michele", ville: "Calvisano", capacite: 5000 },
    ],
    // Lansdowne Road, démoli en 2007 : 48 000 places d'après Wikipédia.
    terrainsNeutres: [{ stade: "Lansdowne Road", ville: "Dublin", capacite: 48000 }],
    poule: {
      joues: 6,
      victoires: 5,
      nuls: 0,
      defaites: 1,
      essaisPour: 20,
      essaisContre: 5,
      pour: 160,
      contre: 52,
      bonusOffensifs: 2,
      bonusDefensifs: 1,
      points: 23,
    },
    phaseFinale: [
      {
        tour: "Quart de finale",
        adversaire: "Munster",
        scoreUsap: 10,
        scoreOpponent: 19,
        arbitre: "Nigel Whitehouse",
        affluence: 48500,
      },
    ],
    calendrier: [
      { jour: "2005-10-22", tour: "Poule J1", adversaire: "Calvisano", isHome: false, scoreUsap: 25, scoreOpponent: 6 },
      { jour: "2005-10-28", tour: "Poule J2", adversaire: "Cardiff Blues", isHome: true, scoreUsap: 37, scoreOpponent: 14 },
      { jour: "2005-12-11", tour: "Poule J3", adversaire: "Leeds Tykes", isHome: false, scoreUsap: 20, scoreOpponent: 21, decalage: -1 },
      { jour: "2005-12-17", tour: "Poule J4", adversaire: "Leeds Tykes", isHome: true, scoreUsap: 12, scoreOpponent: 8 },
      { jour: "2006-01-14", tour: "Poule J5", adversaire: "Cardiff Blues", isHome: false, scoreUsap: 21, scoreOpponent: 3, decalage: -1 },
      { jour: "2006-01-22", tour: "Poule J6", adversaire: "Calvisano", isHome: true, scoreUsap: 45, scoreOpponent: 0 },
      { jour: "2006-04-01", tour: "Quart de finale", adversaire: "Munster", isHome: false, scoreUsap: 10, scoreOpponent: 19, decalage: -1 },
    ],
    identites: {
      // Le deuxième ligne de Leeds, n°5 les 11 et 17 décembre 2005, passé aux
      // Wasps l'été suivant : la fiche que 2006-2007 lui a déjà donnée.
      "Tom Palmer": { firstName: "Thomas Philip", lastName: "Palmer" },
      // Une lettre de trop chez l'ERC : « Fredericio » n'est pas un prénom.
      // Federico Pucciariello, pilier international italien, seul de ce nom
      // en base, que la LNR écrit en toutes lettres à Bourgoin en 2004.
      "Fredericio Pucciariello": { firstName: "Federico", lastName: "Pucciariello" },
    },
    erc: {
      "2005-10-22": { page: "12_1108.php", instantane: "20060618" },
      "2005-10-28": { page: "12_1119.php", instantane: "20060618" },
      "2005-12-11": { page: "12_1135.php", instantane: "20060618" },
      "2005-12-17": { page: "12_4691.php", instantane: "20060618" },
      "2006-01-14": { page: "12_4626.php", instantane: "20060618" },
      "2006-01-22": { page: "12_4820.php", instantane: "20060618" },
      "2006-04-01": { page: "12_4920.php", instantane: "20060618" },
    },
    note: "Heineken Cup, poule 2 — première, quart de finaliste",
  },
  /**
   * Heineken Cup 2006-2007, poule 1 : Wasps, Perpignan, Castres, Trévise.
   * **Deuxième**, à cinq points des Wasps, futurs vainqueurs : pas de phase
   * finale. Classement et calendrier d'après la Wikipédia francophone,
   * « Coupe d'Europe de rugby à XV 2006-2007 ».
   *
   * **La première campagne sans ESPN**, qui ne remonte pas avant 2007-2008.
   * Les comptes rendus de l'ERC de cette saison ont leur propre forme
   * (`lireCompteRendu2006`) : arbitre, affluence, coup d'envoi, et une
   * chronologie quand elle est complète. Cinq sur six sont archivés. **Le
   * Perpignan-Trévise du 20 janvier 2007 manque** : sa page n'est sous aucun
   * des identifiants voisins de sa journée gardés par l'archive (12_5704 à
   * 12_5772, lus le 18 octobre 2026). Il s'écrit avec son score seul.
   *
   * Adams Park d'après la Wikipédia francophone, 10 137 places : les Wasps
   * y ont reçu de 2002 à 2014.
   */
  "2006-2007": {
    ligue: "champions-cup",
    competition: "H-Cup",
    nouveauxAdversaires: [{ name: "Wasps", shortName: "Wasps", city: "High Wycombe", pays: "ENG" }],
    terrains: [{ club: "Wasps", stade: "Adams Park", ville: "High Wycombe", capacite: 10137 }],
    poule: {
      joues: 6,
      victoires: 4,
      nuls: 0,
      defaites: 2,
      essaisPour: 19,
      essaisContre: 9,
      pour: 161,
      contre: 108,
      bonusOffensifs: 2,
      bonusDefensifs: 0,
      points: 18,
    },
    calendrier: [
      { jour: "2006-10-21", tour: "Poule J1", adversaire: "Benetton Treviso", isHome: false, scoreUsap: 25, scoreOpponent: 10 },
      { jour: "2006-10-28", tour: "Poule J2", adversaire: "London Wasps", isHome: true, scoreUsap: 19, scoreOpponent: 12 },
      { jour: "2006-12-09", tour: "Poule J3", adversaire: "Castres Olympique", isHome: false, scoreUsap: 28, scoreOpponent: 36 },
      { jour: "2006-12-15", tour: "Poule J4", adversaire: "Castres Olympique", isHome: true, scoreUsap: 30, scoreOpponent: 3 },
      { jour: "2007-01-13", tour: "Poule J5", adversaire: "London Wasps", isHome: false, scoreUsap: 14, scoreOpponent: 22, decalage: -1 },
      { jour: "2007-01-20", tour: "Poule J6", adversaire: "Benetton Treviso", isHome: true, scoreUsap: 45, scoreOpponent: 25 },
    ],
    identites: {
      // Deux lettres interverties par l'ERC le 15 décembre 2006 : Gerhard
      // Vosloo est le troisième ligne aile de Castres que la LNR porte dès le
      // 18 novembre 2006, même club, même saison, même poste, n° 6 ici aussi.
      "Gerhard Vooslo": { firstName: "Gerhard", lastName: "Vosloo" },
      // Le deuxième ligne anglais des Wasps, que la base connaît sous son état
      // civil depuis ses années au Stade Français (2008-2012) : Tom est son
      // diminutif, et la base n'a pas d'autre Palmer deuxième ligne.
      "Tom Palmer": { firstName: "Thomas Philip", lastName: "Palmer" },
    },
    erc: {
      "2006-10-21": { page: "12_5648.php", instantane: "20061030" },
      "2006-10-28": { page: "12_5663.php", instantane: "20061111" },
      "2006-12-09": { page: "12_5686.php", instantane: "20070502" },
      "2006-12-15": { page: "12_5710.php", instantane: "20070503" },
      "2007-01-13": { page: "12_5740.php", instantane: "20070218" },
    },
    note: "Heineken Cup, poule 1 — deuxième, éliminée en poule",
  },
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
    // Le Match Centre de l'ERC : l'archive n'en garde que 88 pages pour cette
    // saison, et l'USAP n'y a que sa deuxième journée et son quart de finale
    // avec une composition. Les autres restent à ESPN.
    // Le Match Centre de l'ERC, six pages sur huit. Les quatre journées de
    // décembre et janvier n'ont été archivées qu'en juin 2012, sous des
    // identifiants qu'aucune fenêtre de dates ne désignait : c'est par plage
    // d'identifiants qu'on les a retrouvées. La première journée (12438) et
    // la demi-finale (14340) n'ont que des pages sans composition.
    erc: {
      "2010-10-17": { page: "matchcentre/12889.php", instantane: "20101020072253" },
      "2010-12-11": { page: "matchcentre/13285.php", instantane: "20120609164042" },
      "2010-12-19": { page: "matchcentre/13406.php", instantane: "20120609165103" },
      "2011-01-15": { page: "matchcentre/13536.php", instantane: "20120612064140" },
      "2011-01-23": { page: "matchcentre/13623.php", instantane: "20120614072045" },
      "2011-04-09": { page: "matchcentre/14168.php", instantane: "20110412073435" },
    },
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
    // Le Match Centre de l'ERC, deux pages sur six : l'archive n'a ni le
    // déplacement à Newport, ni les deux Prato, ni la réception des Dragons.
    erc: {
      "2011-11-11": { page: "matchcentre/14966.php", instantane: "20111112184825" },
      "2012-01-21": { page: "matchcentre/16062.php", instantane: "20120124114122" },
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
    // Les pages Match Centre de l'ERC, retrouvées une à une dans l'archive
    // parmi les identifiants voisins de chaque journée — la page du club et
    // celles des poules ne les lient plus, leurs liens étaient dynamiques.
    // Six pages sur huit : celle du Worcester-Perpignan du 6 décembre 2012
    // (19713) n'est archivée qu'en présentation d'avant-match, et la
    // demi-finale n'a aucune page archivée — 20888, 20889 et 20945 à 20947
    // sont d'autres rencontres. Ces deux-là restent à ESPN.
    erc: {
      "2012-10-13": { page: "matchcentre/19178.php", instantane: "20121016221224" },
      "2012-10-20": { page: "matchcentre/19383.php", instantane: "20121023" },
      "2012-12-15": { page: "matchcentre/19944.php", instantane: "20121218" },
      "2013-01-12": { page: "matchcentre/20166.php", instantane: "20130115" },
      "2013-01-17": { page: "matchcentre/20340.php", instantane: "20130121" },
      "2013-04-05": { page: "matchcentre/20639.php", instantane: "20130409" },
    },
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
  /** Essais de pénalité compris : c'est le compte qui ouvre le bonus offensif. */
  essais: number;
  /** Dont essais de pénalité, que la base range à part, faute d'auteur. */
  essaisDePenalite: number;
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
 *
 * Les essais sans auteur des feuilles de l'ERC sont des essais de pénalité :
 * nommés comme tels de 2001 à 2008, et, sur le Match Centre de 2010-2013,
 * trahis par la transformation orpheline qui les suit dans la chronologie.
 */
function realisations(equipe: Equipe, bareme: Bareme): Realisations {
  const somme = (choix: (j: Joueur) => number) =>
    equipe.joueurs.reduce((s, j) => s + choix(j), 0);
  const r = {
    essais: somme((j) => j.essais),
    essaisDePenalite: equipe.essaisSansAuteur,
    transformations: somme((j) => j.transformations),
    penalites: somme((j) => j.penalites),
    drops: somme((j) => j.drops),
  };
  // L'essai de pénalité d'avant 2017 vaut cinq points et se transforme : sa
  // transformation est déjà sur la ligne du buteur, et elle y reste.
  const total = pointsDesRealisations(r, bareme);
  const points = somme((j) => j.points) + bareme.essaiDePenalite * r.essaisDePenalite;
  r.essais += r.essaisDePenalite;
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
  kickoffTime: string | null;
  isHome: boolean;
  opponentNom: string;
  usap: Equipe;
  adverse: Equipe;
  realUsap: Realisations;
  realAdverse: Realisations;
  bonusOffensif: boolean;
  bonusDefensif: boolean;
  bonusIndecidable: boolean;
  resultat: MatchResult;
  alertes: string[];
  /** Camps dont la composition ne s'écrit pas — `false` l'USAP, `true` l'adversaire. */
  campsSansComposition: Set<boolean>;
  /** L'arbitre selon l'ERC, quand sa page le donne. */
  arbitre: string | null;
  /** La page de l'ERC dont viennent les compositions, quand il y en a une. */
  pageErc: string | null;
  /** La chronologie selon l'ERC, quand sa page en a une ; `[domicile, extérieur]` pour les essais de pénalité. */
  chronologie: { evenements: ErcEvenement[]; essaisDePenalite: [number[], number[]] } | null;
}

/**
 * Les rencontres d'une campagne sans ESPN, telles que son calendrier les
 * donne : la forme d'un résumé ESPN, l'USAP reconnue par son identifiant.
 */
function resumesDuCalendrier(campagne: Campagne): EspnResume[] {
  return campagne.calendrier!.map((c, i) => {
    const usap = { id: USAP_ESPN, nom: "Perpignan", score: c.scoreUsap };
    const adverse = { id: -1 - i, nom: c.adversaire, score: c.scoreOpponent };
    return {
      id: -1 - i,
      // Midi de Paris : le jour se relit sans ambiguïté de fuseau.
      date: instantDeParis(c.jour, "12:00").toISOString(),
      tour: c.tour,
      domicile: c.isHome ? usap : adverse,
      exterieur: c.isHome ? adverse : usap,
    };
  });
}

/** La feuille d'une rencontre du calendrier, avant que l'ERC n'y verse ses joueurs. */
function feuilleSansJoueurs(resume: EspnResume, campagne: Campagne): EspnMatch {
  const equipe = (e: EspnResume["domicile"]) => ({ ...e, miTemps: null, essaisSansAuteur: 0, joueurs: [] });
  return {
    ...resume,
    ligue: LIGUES[campagne.ligue],
    stade: null,
    affluence: null,
    domicile: equipe(resume.domicile),
    exterieur: equipe(resume.exterieur),
  };
}

async function lireCampagne(
  saison: string,
  campagne: Campagne,
  echecs: string[],
): Promise<Rencontre[]> {
  const resumes = campagne.calendrier ? resumesDuCalendrier(campagne) : await chercherMatchsUsap(saison, campagne.ligue);
  const rencontres: Rencontre[] = [];
  const startYear = Number(saison.slice(0, 4));
  const bareme = baremeDeMatch(startYear);

  // **ESPN ne libelle plus les tours en 2018-2019** : ses `notes` sont vides.
  // Quand aucune rencontre de la campagne n'en porte, les journées de poule se
  // numérotent par la date — une campagne sans phase finale n'a rien d'autre
  // à distinguer, et le garde-fou de poule vérifie qu'il y en a bien six.
  if (resumes.length > 0 && resumes.every((r) => !r.tour)) {
    resumes.forEach((r, i) => (r.tour = `Poule J${i + 1}`));
    console.log("  tours numérotés par la date : ESPN ne les libelle pas sur cette saison");
  }
  for (const resume of resumes) {
    const feuille = campagne.calendrier ? feuilleSansJoueurs(resume, campagne) : await lireMatch(campagne.ligue, resume.id);
    // Le tour vient du calendrier, la feuille ne le porte pas toujours.
    feuille.tour = resume.tour || feuille.tour;
    const isHome = feuille.domicile.id === USAP_ESPN;
    // Les listes d'ESPN, gardées pour `harmoniserPrenoms` : les équipes
    // ci-dessous reçoivent celles de l'ERC.
    const espnUsap = (isHome ? feuille.domicile : feuille.exterieur).joueurs;
    const espnAdverse = (isHome ? feuille.exterieur : feuille.domicile).joueurs;
    const usap: Equipe = isHome ? feuille.domicile : feuille.exterieur;
    const adverse: Equipe = isHome ? feuille.exterieur : feuille.domicile;
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
    let arbitre: string | null = null;
    let chronologie: Rencontre["chronologie"] = null;
    let pageErc: string | null = null;
    const duCalendrier = campagne.calendrier?.find((c) => c.jour === jour);
    let kickoffTime: string | null = campagne.calendrier
      ? duCalendrier?.heure
        ? heureDeParis(duCalendrier.heure, duCalendrier.decalage)
        : null
      : date.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
    if (archive) {
      const brut = await lirePageArchivee(archive.page, archive.instantane);
      // Cinq formes de page, selon l'époque du site : cf. `lib/erc.ts`.
      const de2006 = brut.toString("latin1").includes('<tr class="line_result">');
      const de2004 = archive.page.startsWith("cup/");
      const de2001 = archive.page.startsWith("english/") ? lireCompteRendu2001(brut) : null;
      const centre = archive.page.startsWith("matchcentre/")
        ? lireMatchCentre(brut)
        : de2006
          ? lireCompteRendu2006(brut)
          : null;
      const erc = de2001
        ? { ...de2001, affluence: null }
        : centre ?? (de2004 ? lireCompteRendu2004(brut) : lireCompteRendu2007(brut));
      const ercUsap = isHome ? erc.domicile : erc.exterieur;
      const ercAdverse = isHome ? erc.exterieur : erc.domicile;
      if (ercUsap.score == null || ercUsap.joueurs.length === 0) {
        // L'instantané a saisi la présentation d'avant-match : rien à en
        // tirer, la rencontre reste à ESPN, et on le dit.
        console.log(`  ⚠ ERC ${archive.page} : présentation d'avant-match, « ${erc.titre} » — ESPN conservé`);
      } else if (ercUsap.score !== usap.score || ercAdverse.score !== adverse.score) {
        echecs.push(
          `${etiquette} : l'ERC donne ${erc.domicile.nom} ${erc.domicile.score}-${erc.exterieur.score} ` +
            `${erc.exterieur.nom}, ESPN ${usap.score}-${adverse.score} — « ${erc.titre} »`,
        );
        continue;
      } else {
        pageErc = archive.page;
        for (const j of [...ercUsap.joueurs, ...ercAdverse.joueurs]) {
          const juste = campagne.identites?.[`${j.firstName} ${j.lastName}`];
          if (juste) Object.assign(j, juste);
        }
        if (de2001) {
          // Ni ESPN à harmoniser, ni numéro au banc : les listes telles quelles.
          usap.joueurs = ercUsap.joueurs;
          adverse.joueurs = ercAdverse.joueurs;
          arbitre = de2001.arbitre;
          // **L'initiale ne fait pas une identité.** « P Murphy » désigne cinq
          // fiches en base : chaque nom de l'USAP passe par `identites`, avec
          // sa démonstration, ou la rencontre ne s'écrit pas.
          // Même règle pour l'adversaire, sauf composition différée.
          const sansIdentite = [...usap.joueurs, ...(campagne.compositionsAdversesDifferees?.[jour] ? [] : adverse.joueurs)]
            .filter((j) => /^[A-Z](?:-[A-Z])?$/.test(j.firstName));
          if (sansIdentite.length > 0) {
            echecs.push(
              `${etiquette} : ${sansIdentite.length} joueur(s) sans identité établie — ` +
                sansIdentite.map((j) => `${j.firstName} ${j.lastName}`).join(", "),
            );
          }
        } else {
          usap.joueurs = harmoniserPrenoms(ercUsap.joueurs as EspnJoueur[], espnUsap, `${etiquette} USAP`);
          adverse.joueurs = harmoniserPrenoms(ercAdverse.joueurs as EspnJoueur[], espnAdverse, `${etiquette} ${adverse.nom}`);
        }
        usap.essaisSansAuteur = ercUsap.essaisSansAuteur;
        adverse.essaisSansAuteur = ercAdverse.essaisSansAuteur;
        if (erc.affluence) feuille.affluence = erc.affluence;
        if (centre) {
          // Le Match Centre donne la mi-temps, l'arbitre et la chronologie ;
          // le compte rendu de 2006, l'arbitre, et les deux autres quand sa
          // chronologie est complète.
          usap.miTemps = (isHome ? centre.domicile : centre.exterieur).miTemps;
          adverse.miTemps = (isHome ? centre.exterieur : centre.domicile).miTemps;
          arbitre = centre.arbitre;
          if (centre.evenements.length > 0) {
            chronologie = { evenements: centre.evenements, essaisDePenalite: centre.essaisDePenaliteMinutes };
          }
        }
        // Les pages de 2001-2002 et 2004-2005 ne donnent que le jour : il doit être le nôtre.
        const jourErc = (erc as Partial<ErcCompteRendu2004 | ErcCompteRendu2001>).jour;
        if (jourErc && jourErc !== jour) {
          echecs.push(`${etiquette} : l'ERC date la rencontre du ${jourErc}`);
          continue;
        }
        // L'heure de l'ERC est celle du stade : ramenée à celle de Paris.
        const coupDEnvoi = (erc as Partial<ErcCompteRendu2006>).coupDEnvoi;
        if (coupDEnvoi && campagne.calendrier) {
          if (coupDEnvoi.jour !== jour) {
            echecs.push(`${etiquette} : l'ERC date la rencontre du ${coupDEnvoi.jour}`);
            continue;
          }
          kickoffTime = heureDeParis(coupDEnvoi.heure, duCalendrier?.decalage);
        }
        console.log(
          `  ERC ${archive.page} : « ${erc.titre} »` +
            (erc.affluence ? `, ${erc.affluence} spectateurs` : "") +
            (arbitre ? `, arbitre ${arbitre}` : "") +
            (chronologie ? `, ${chronologie.evenements.length} faits` : ""),
        );
      }
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
        alertes.push(`${camp} : aucune composition dans la source`);
        campsSansComposition.add(isOpponent);
        continue;
      }
      const differee = campagne.compositionsAdversesDifferees?.[jour];
      if (isOpponent && differee) {
        alertes.push(`${camp} : composition non écrite — ${differee}`);
        campsSansComposition.add(isOpponent);
        continue;
      }
      const titulaires = equipe.joueurs.filter((j) => j.isStarter).length;
      // Les entrants de 2001-2002 n'ont pas de numéro : seuls les numérotés comptent.
      const numerotes = equipe.joueurs.filter((j) => j.numero != null);
      const numeros = new Set(numerotes.map((j) => j.numero));
      if (titulaires !== 15 || numeros.size !== numerotes.length) {
        alertes.push(
          `${camp} : ${titulaires} titulaires` +
            (numeros.size !== numerotes.length ? ", un dossard en double" : "") +
            " — composition écartée",
        );
        campsSansComposition.add(isOpponent);
      } else if (equipe.joueurs.length < 22 && numerotes.length === equipe.joueurs.length) {
        alertes.push(`${camp} : ${equipe.joueurs.length} joueurs sur la feuille`);
      }
    }

    const realUsap = realisations(usap, bareme);
    const realAdverse = realisations(adverse, bareme);
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
    const tranche = campagne.calendrier?.find((c) => c.jour === jour)?.bonusOffensif;
    if (tranche != null && bonus.triesMissing) {
      bonus.bonusOffensif = tranche;
      bonus.triesMissing = false;
      alertes.push(`bonus offensif ${tranche ? "établi" : "exclu"} hors feuille : cf. le calendrier de la campagne`);
    }

    rencontres.push({
      feuille,
      jour,
      // Sans heure connue, minuit de Paris : cf. `docs/modele-de-donnees.md`.
      date: campagne.calendrier ? instantDeParis(jour, kickoffTime ?? "00:00") : date,
      kickoffTime,
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
      arbitre,
      pageErc,
      chronologie,
    });
  }
  return rencontres;
}

/** « 18:15 » au stade, une heure de moins qu'à Paris au Royaume-Uni : « 19:15 ». */
function heureDeParis(heure: string, decalage = 0): string {
  const [h, m] = heure.split(":").map(Number);
  return `${String(h - decalage).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Les joueurs de l'ERC, avec le prénom qu'ESPN leur donne.
 *
 * **L'ERC écrit les surnoms, ESPN l'état civil.** Les Basques de Gernika
 * sont « Goyo » Zabaloy, « Deccie » Cusack, « Kapu » Olaeta, « Pingui »
 * Monje sur le Match Centre, quand ESPN — et la base, depuis lui — porte
 * Gregorio, Declan, Iker. Les deux feuilles décrivent le même match : au
 * même dossard et sous le même patronyme, c'est le même homme, et l'état
 * civil vaut mieux que le surnom. Le dossard, les réalisations et le
 * brassard restent ceux de l'ERC, qui est l'organisateur. Un patronyme qui
 * diffère au même numéro se signale et garde l'ERC.
 */
function harmoniserPrenoms(erc: EspnJoueur[], espn: EspnJoueur[], etiquette: string): EspnJoueur[] {
  if (espn.length === 0) return erc;
  const parNumero = new Map(espn.map((j) => [j.numero, j]));
  const lettres = (n: string) => normalize(n).replace(/[^a-z]/g, "");
  // **Le dossard d'ESPN prime quand le même homme y porte un autre numéro.**
  // À Rovigo le 13 octobre 2012, le Match Centre permute trois paires entre
  // le terrain et le banc — Batlle au 23 et Michel au 11 côté catalan, Jones
  // et Tumiati, Calabrese et Duca côté italien — quand sa propre chronologie
  // donne deux essais à Batlle dans la première demi-heure, ce qu'un n°23
  // ne fait pas. La page de l'organisateur porte là l'équipe annoncée, ESPN
  // l'équipe alignée. Les réalisations restent celles de l'ERC.
  const parNom = new Map(espn.map((j) => [lettres(`${j.firstName} ${j.lastName}`), j]));
  const renumerotes = erc.map((j) => {
    const meme = parNom.get(lettres(`${j.firstName} ${j.lastName}`));
    if (!meme || meme.numero === j.numero) return j;
    console.log(
      `    ⚠ ${etiquette} : ${j.firstName} ${j.lastName} n°${j.numero} à l'ERC, n°${meme.numero} chez ESPN — le dossard d'ESPN est gardé`,
    );
    return { ...j, numero: meme.numero, isStarter: meme.numero <= 15 };
  });
  erc = renumerotes.sort((a, b) => a.numero - b.numero);
  return erc.map((j) => {
    const e = parNumero.get(j.numero);
    if (!e) return j;
    const memeHomme =
      // même patronyme, à un trait d'union près — « Tchale Watchou » ;
      lettres(e.lastName) === lettres(j.lastName) ||
      // l'un des deux noms complets finit par le patronyme de l'autre —
      // « Parrish Garcia Parrado » pour « Carlos | Garcia Parrado »,
      // « Oscar Astarloa » pour « Oscar | Astarloa Uriarte » ;
      lettres(`${e.firstName} ${e.lastName}`).endsWith(lettres(j.lastName)) ||
      lettres(`${j.firstName} ${j.lastName}`).endsWith(lettres(e.lastName)) ||
      lettres(e.lastName).startsWith(lettres(j.lastName)) ||
      // même prénom et patronymes qui commencent pareil sur cinq lettres —
      // « Etxebarria » pour « Etxeberria de la Rosa ».
      (lettres(e.firstName) === lettres(j.firstName) &&
        lettres(e.lastName).slice(0, 5) === lettres(j.lastName).slice(0, 5));
    if (memeHomme) {
      return normalize(`${e.firstName} ${e.lastName}`) === normalize(`${j.firstName} ${j.lastName}`)
        ? j
        : { ...j, firstName: e.firstName, lastName: e.lastName };
    }
    console.log(
      `    ⚠ ${etiquette} n°${j.numero} : « ${j.firstName} ${j.lastName} » à l'ERC, « ${e.firstName} ${e.lastName} » chez ESPN — l'ERC est gardé`,
    );
    return j;
  });
}

/**
 * Un score peut-il résulter d'au moins quatre essais ? Cinq points l'essai,
 * deux la transformation — au plus une par essai —, trois la pénalité ou le
 * drop. On essaie chaque nombre d'essais possible, puis chaque nombre de
 * transformations : le reste doit être un multiple de trois.
 */
function peutPorterQuatreEssais(score: number, bareme: Bareme): boolean {
  for (let essais = 4; bareme.essai * essais <= score; essais++) {
    for (let transfos = 0; transfos <= essais && bareme.essai * essais + bareme.transformation * transfos <= score; transfos++) {
      const reste = score - bareme.essai * essais - bareme.transformation * transfos;
      if (reste % bareme.penalite === 0 || reste % bareme.drop === 0) return true;
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
  bareme: Bareme,
  echelle: PointsScale,
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
    (r) => r.bonusIndecidable && !r.bonusOffensif && peutPorterQuatreEssais(r.usap.score!, bareme),
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
  const points = echelle.win * v + echelle.draw * n + echelle.loss * d + bo + bd;

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
// CHRONOLOGIE
// =============================================================================

/**
 * La ligne de temps d'après le Match Centre de l'ERC, dans la forme de
 * `seed-chronologie.ts` : « Essai de Machin (Club). 7-10. », score de l'USAP
 * en premier. Le joueur est retrouvé dans la composition écrite — la page
 * n'écrit que l'initiale et le patronyme, « D Mele » — et l'essai de
 * pénalité est posé à la minute de sa transformation orpheline. **Une
 * chronologie qui ne retombe pas sur le score n'est pas écrite** : une
 * minute ne s'invente pas, et un score courant faux vaut moins que rien.
 */
function chronologieDeLaBase(
  r: Rencontre,
  lignes: LigneAEcrire[],
  bareme: Bareme,
): Array<{ minute: number; type: EventType; isUsap: boolean; playerId: string | null; description: string }> | null {
  const { evenements, essaisDePenalite } = r.chronologie!;
  const POINTS = { essai: 5, transformation: 2, penalite: 3, drop: 3 } as const;
  const TYPES = {
    essai: EventType.ESSAI,
    transformation: EventType.TRANSFORMATION,
    penalite: EventType.PENALITE,
    drop: EventType.DROP,
  } as const;
  const LIBELLES = { essai: "Essai", transformation: "Transformation", penalite: "Pénalité", drop: "Drop" } as const;
  const de = (nom: string) => (/^[aeiouyàâéèêëîïôöûü]/i.test(nom) ? `d'${nom}` : `de ${nom}`);

  // Les noms complets, par camp, pour rendre à « D Mele » sa fiche.
  const nomsParLigne = new Map(lignes.map((l) => [l, l.playerId]));
  const retrouver = (nom: string, isUsap: boolean, equipe: Equipe) => {
    const [initiale, ...reste] = nom.split(/\s+/);
    const patronyme = normalize(reste.join(" "));
    const candidats = equipe.joueurs.filter(
      (j) =>
        normalize(j.lastName) === patronyme && normalize(j.firstName).startsWith(normalize(initiale).charAt(0)),
    );
    if (candidats.length !== 1) return { nom: null as string | null, playerId: null as string | null };
    const ligne = lignes.find((l) => l.isOpponent === !isUsap && l.shirtNumber === candidats[0].numero);
    return { nom: `${candidats[0].firstName} ${candidats[0].lastName}`, playerId: ligne ? nomsParLigne.get(ligne) ?? null : null };
  };

  type Fait = { minute: number; type: keyof typeof POINTS | "essai-de-penalite"; isUsap: boolean; nom: string | null; playerId: string | null };
  const faits: Fait[] = evenements.map((e) => {
    const isUsap = e.domicile === r.isHome;
    const { nom, playerId } = retrouver(e.nom, isUsap, isUsap ? r.usap : r.adverse);
    return { minute: e.minute, type: e.type, isUsap, nom, playerId };
  });
  // Autant d'essais de pénalité que l'écart des points en exige, et pas un
  // de plus : une transformation orpheline n'en est la trace que si le score
  // en réclame un.
  for (const [k, minutes] of essaisDePenalite.entries()) {
    const isUsap = (k === 0) === r.isHome;
    const attendus = (isUsap ? r.usap : r.adverse).essaisSansAuteur;
    for (const minute of minutes.slice(0, attendus)) {
      faits.push({ minute, type: "essai-de-penalite", isUsap, nom: null, playerId: null });
    }
  }
  faits.sort((a, b) => a.minute - b.minute || (a.type === "transformation" ? 1 : 0) - (b.type === "transformation" ? 1 : 0));

  let usap = 0;
  let adverse = 0;
  const club = (isUsap: boolean) => (isUsap ? "USAP" : r.opponentNom);
  const sortie = faits.map((f) => {
    const points = f.type === "essai-de-penalite" ? bareme.essaiDePenalite : POINTS[f.type];
    if (f.isUsap) usap += points;
    else adverse += points;
    const libelle =
      f.type === "essai-de-penalite"
        ? `Essai de pénalité (${club(f.isUsap)}).`
        : f.nom
          ? `${LIBELLES[f.type]} ${de(f.nom)} (${club(f.isUsap)}).`
          : `${LIBELLES[f.type]} (${club(f.isUsap)}).`;
    return {
      minute: f.minute,
      type: f.type === "essai-de-penalite" ? EventType.ESSAI_PENALITE : TYPES[f.type],
      isUsap: f.isUsap,
      playerId: f.playerId,
      description: `${libelle} ${usap}-${adverse}.`,
    };
  });
  if (usap !== r.usap.score || adverse !== r.adverse.score) {
    console.log(
      `  ⚠ chronologie non écrite : elle finit à ${usap}-${adverse} pour ${r.usap.score}-${r.adverse.score}`,
    );
    return null;
  }
  return sortie;
}

// =============================================================================
// ÉCRITURE
// =============================================================================

interface LigneAEcrire {
  isOpponent: boolean;
  playerId: string;
  /** `null` pour un entrant de 2001-2002, que l'ERC ne numérote pas. */
  shirtNumber: number | null;
  isStarter: boolean;
  isCaptain: boolean;
  positionPlayed: Position | null;
  /** Temps effectif, jaune déduit ; `null` quand la source ne donne pas les changements. */
  minutesPlayed: number | null;
  subIn: number | null;
  subOut: number | null;
  yellowCardMin: number | null;
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
  equipe: Equipe,
  ecrireRealisations: boolean,
  creer: boolean,
): Promise<LigneAEcrire[]> {
  const lignes: LigneAEcrire[] = [];
  if (creer) console.log(`\n  --- ${camp} ---`);
  for (const j of equipe.joueurs) {
    const officiel = { firstName: j.firstName, lastName: j.lastName, numero: j.numero ?? undefined, club: isOpponent ? camp : "USAP" };
    // Un prénom pris hors de la feuille s'atteste sur la fiche qu'il fait
    // naître, et sur elle seule : une fiche existante a déjà le sien.
    const existait = creer && j.sourceDuPrenom ? await chercherJoueur(prisma, officiel, () => {}) : null;
    const playerId = await trouverOuCreerJoueur(prisma, officiel, {
      dryRun: DRY_RUN || !creer,
      journal: creer ? (m) => console.log(m) : () => {},
    });
    if (creer && j.sourceDuPrenom && !existait) {
      await attester(
        prisma,
        { entite: "Player", entiteId: playerId || "(à créer)", champ: "firstName", degre: "PROBABLE", source: j.sourceDuPrenom },
        DRY_RUN,
      );
    }
    // Le poste du banc ne se déduit pas du numéro : on reprend celui de la
    // fiche, faute de mieux — et jamais celui qu'ESPN écrit.
    let poste: Position | null = j.isStarter && j.numero != null ? (POSTE_PAR_NUMERO[j.numero] ?? null) : null;
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
    const jaune = j.minutesJaunes?.[0] ?? null;
    if (creer) console.log(
      `    n°${String(j.numero ?? "–").padStart(2)} ${j.firstName} ${j.lastName}` +
        `${j.isCaptain ? " (cap)" : ""}${poste ? ` [${poste}]` : ""}` +
        `${j.entree != null ? ` ↑${j.entree}` : ""}${j.sortie != null ? ` ↓${j.sortie}` : ""}` +
        `${j.minutes != null ? ` ${j.minutes}'` : ""}` +
        `${marques ? ` — ${marques}` : ""}${j.jaunes ? ` 🟨${jaune != null ? jaune : ""}` : ""}${j.rouges ? " 🟥" : ""}`,
    );
    lignes.push({
      isOpponent,
      playerId,
      shirtNumber: j.numero,
      isStarter: j.isStarter,
      isCaptain: j.isCaptain,
      positionPlayed: poste,
      minutesPlayed: j.minutes ?? null,
      // Un titulaire remplacé à titre temporaire n'est pas sorti : seule sa
      // sortie définitive s'écrit, l'entrant temporaire porte la sienne.
      subIn: j.isStarter ? null : (j.entree ?? null),
      subOut: j.sortie ?? null,
      yellowCardMin: jaune,
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
    `=== Coupe d'Europe ${SAISON} depuis ${campagne.calendrier ? "Wikipédia et l'ERC" : "ESPN"}${DRY_RUN ? " (simulation)" : ""} ===\n` +
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
      `${r.jour} ${r.kickoffTime ?? "  :  "} ${r.feuille.tour.padEnd(15)} ${r.isHome ? "H" : "A"} ` +
        `${r.opponentNom.padEnd(12)} ${r.usap.score}-${r.adverse.score}` +
        ` (mt ${r.usap.miTemps ?? "?"}-${r.adverse.miTemps ?? "?"})` +
        `${r.bonusOffensif ? " BO" : ""}${r.bonusDefensif ? " BD" : ""}${r.bonusIndecidable ? " BO?" : ""}` +
        ` | USAP ${marques(r.realUsap)} · ${r.opponentNom} ${marques(r.realAdverse)}`,
    );
    for (const a of r.alertes) console.log(`    ⚠ ${a}`);
  }

  // ---- Le garde-fou, avant toute écriture --------------------------------
  const { ecarts, avertissements } = controlerLaPoule(
    rencontres,
    campagne.poule,
    baremeDeMatch(saison.startYear),
    pointsScaleFor(saison.startYear, campagne.competition),
  );
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
        .flatMap((l) =>
          l.isOpponent === isOpponent && l.isStarter && l.playerId && l.shirtNumber != null
            ? [{ playerId: l.playerId, numero: l.shirtNumber }]
            : [],
        );
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
    const nomArbitre = officiel?.arbitre ?? r.arbitre;
    const refereeId = nomArbitre ? await trouverOuCreerArbitre(prisma, nomArbitre, false) : null;
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
      triesUsap: r.realUsap.coherent ? r.realUsap.essais - r.realUsap.essaisDePenalite : null,
      conversionsUsap: r.realUsap.coherent ? r.realUsap.transformations : null,
      penaltiesUsap: r.realUsap.coherent ? r.realUsap.penalites : null,
      dropGoalsUsap: r.realUsap.coherent ? r.realUsap.drops : null,
      penaltyTriesUsap: r.realUsap.coherent ? r.realUsap.essaisDePenalite : null,
      triesOpponent: r.realAdverse.coherent ? r.realAdverse.essais - r.realAdverse.essaisDePenalite : null,
      conversionsOpponent: r.realAdverse.coherent ? r.realAdverse.transformations : null,
      penaltiesOpponent: r.realAdverse.coherent ? r.realAdverse.penalites : null,
      dropGoalsOpponent: r.realAdverse.coherent ? r.realAdverse.drops : null,
      penaltyTriesOpponent: r.realAdverse.coherent ? r.realAdverse.essaisDePenalite : null,
    };

    const existant = await prisma.match.findFirst({
      where: {
        seasonId: saison.id,
        opponentId: opponent.id,
        // Le jour de Paris : une rencontre sans heure est posée à minuit de
        // Paris, la veille en UTC.
        date: journeeDeParis(r.jour),
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

    // Une campagne sans ESPN porte sa provenance ici ; les autres sont
    // attestées par `seed-attestations.ts`.
    if (campagne.calendrier) {
      await attester(
        prisma,
        r.pageErc
          ? {
              entite: "Match",
              entiteId: matchId,
              degre: "OFFICIEL",
              source: "ERC, compte rendu officiel, par la Wayback Machine",
              sourceUrl: `http://web.archive.org/web/${campagne.erc![r.jour].instantane}/http://www.ercrugby.com/${/^(cup|english)\//.test(r.pageErc) ? "" : "eng/"}${r.pageErc}`,
              note: r.pageErc.startsWith("english/")
                ? "L'organisateur, dont le site n'existe plus qu'en archive ; score contrôlé par le classement de poule de Wikipédia. Minutes des changements et des exclusions d'après la page ; heure d'après le calendrier officiel de l'ERC. Cf. lib/erc.ts."
                : "L'organisateur, dont le site n'existe plus qu'en archive ; score contrôlé par le classement de poule de Wikipédia. Minutes de jeu non publiées. Cf. lib/erc.ts.",
            }
          : {
              entite: "Match",
              entiteId: matchId,
              degre: "CONCORDANT",
              source: `Wikipédia, « Coupe d'Europe de rugby à XV ${SAISON} »`,
              note:
                "Compte rendu de l'ERC introuvable dans l'archive : le jour et le score seuls, contrôlés par le classement de poule. " +
                (r.kickoffTime ? "Heure d'après le calendrier officiel de l'ERC ; pas de composition." : "Ni composition, ni heure.") +
                (campagne.calendrier.find((c) => c.jour === r.jour)?.note ? ` ${campagne.calendrier.find((c) => c.jour === r.jour)!.note}` : ""),
            },
      );
    }

    if (r.chronologie) {
      const evenements = chronologieDeLaBase(r, lignesRetenues, baremeDeMatch(saison.startYear));
      if (evenements) {
        await prisma.matchEvent.deleteMany({ where: { matchId } });
        await prisma.matchEvent.createMany({ data: evenements.map((e) => ({ ...e, matchId })) });
        console.log(`  chronologie : ${evenements.length} événements`);
      }
    }
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

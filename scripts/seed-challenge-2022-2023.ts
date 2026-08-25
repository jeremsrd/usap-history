/**
 * Compositions et chronologies des 4 matchs de poule de Challenge Européen
 * 2022-2023, seuls matchs des saisons modernes restés sans aucune feuille de
 * match — ni composition USAP, ni composition adverse, ni événement.
 *
 *   J1  09/12/2022  USAP     5-19  Bristol Bears     (Aimé-Giral)
 *   J2  16/12/2022  Glasgow 26-18  USAP              (Murrayfield)
 *   J3  14/01/2023  USAP    26-40  Glasgow Warriors  (Aimé-Giral)
 *   J4  20/01/2023  Bristol 33-19  USAP              (Ashton Gate)
 *
 * Source : feuilles de match allrugby.com (saison 2022-2023). L'API ESPN ne
 * couvre que la J4 pour cette saison-là, et le site de l'EPCR ne remonte pas
 * au-delà de 2023-2024.
 *
 * Corrige aussi le stade de la J2 : la base indiquait Scotstoun, or Glasgow
 * recevait à Murrayfield ce soir-là (concordant entre allrugby.com et ESPN).
 *
 * Limite connue : sur la J2, la feuille allrugby n'attribue que 19 des 26
 * points de Glasgow — un essai transformé manque. Les 7 points restants ne
 * sont donc rattachés à aucun joueur. Les sept autres totaux (USAP et
 * adverses) retombent exactement sur les scores officiels.
 *
 * Non disponibles chez cette source : arbitres, affluences, scores à la
 * mi-temps, résumés vidéo.
 *
 * Usage : npx tsx scripts/seed-challenge-2022-2023.ts
 *
 * Idempotent : recrée compositions et événements à chaque exécution. Ne
 * touche ni aux scores ni aux bonus déjà en base.
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug, slugify } from "../src/lib/slugs";

const prisma = new PrismaClient();

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

interface MatchData {
  round: string;
  date: string;
  isHome: boolean;
  opponentName: string;
  opponentLabel: string;
  /** Renseigné uniquement si le stade en base doit être corrigé. */
  venueFix?: { name: string; city: string; capacity?: number };
  scoreUsap: number;
  scoreOpponent: number;
  report: string;
  usapSquad: PlayerData[];
  oppSquad: PlayerData[];
  events: Array<{ minute: number; type: string; isUsap: boolean; who: string }>;
}

const MATCHES: MatchData[] = [
  // ---------------------------------------------------------------------------
  // Poule J1 — USAP 5-19 Bristol (2022-12-09)
  // ---------------------------------------------------------------------------
  {
    round: "Poule J1",
    date: "2022-12-09",
    isHome: true,
    opponentName: "Bristol Bears",
    opponentLabel: "Bristol",
    scoreUsap: 5,
    scoreOpponent: 19,
    report:
      "Entrée en lice ratée à Aimé-Giral. Bristol frappe d'entrée par Piutau (1') et déroule en première période avec Harding (11') et Jenkins (32'), MacGinty transformant deux fois. Les Catalans ne trouvent la faille que par leur deuxième ligne Shahn Eru, juste avant la pause (39'). Seconde période stérile des deux côtés : 5-19.",
    usapSquad: [
      { num: 1, firstName: "Sacha", lastName: "Lotrian", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 40 },
      { num: 2, firstName: "Lucas", lastName: "Velarte", position: Position.TALONNEUR, isStarter: true },
      { num: 3, firstName: "Ma'afu", lastName: "Fia", position: Position.PILIER_DROIT, isStarter: true },
      { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true },
      { num: 5, firstName: "Shahn", lastName: "Eru", position: Position.DEUXIEME_LIGNE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subOut: 49 },
      { num: 6, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
      { num: 7, firstName: "Brad", lastName: "Shields", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 49 },
      { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, subOut: 53 },
      { num: 9, firstName: "Mattéo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 65 },
      { num: 10, firstName: "Patricio", lastName: "Fernandez", position: Position.DEMI_OUVERTURE, isStarter: true },
      { num: 11, firstName: "Ali", lastName: "Crossdale", position: Position.AILIER, isStarter: true, subOut: 49 },
      { num: 12, firstName: "Eddie", lastName: "Sawailau", position: Position.CENTRE, isStarter: true },
      { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, subOut: 49 },
      { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true },
      { num: 15, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: true },
      { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, subIn: 49 },
      { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 40 },
      { num: 18, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT, isStarter: false },
      { num: 19, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 49 },
      { num: 20, firstName: "Valentin", lastName: "Moro", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 53 },
      { num: 21, firstName: "Lenny", lastName: "Viola", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 65 },
      { num: 22, firstName: "Dorian", lastName: "Laborde", position: Position.DEMI_OUVERTURE, isStarter: false, subIn: 49 },
      { num: 23, firstName: "Théo", lastName: "Forner", position: Position.CENTRE, isStarter: false, subIn: 49 },
    ],
    oppSquad: [
      { num: 1, firstName: "Yann", lastName: "Thomas", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 49 },
      { num: 2, firstName: "Harry", lastName: "Thacker", position: Position.TALONNEUR, isStarter: true },
      { num: 3, firstName: "Max", lastName: "Lahiff", position: Position.PILIER_DROIT, isStarter: true, subOut: 61 },
      { num: 4, firstName: "Chris", lastName: "Vui", position: Position.DEUXIEME_LIGNE, isStarter: true },
      { num: 5, firstName: "Joe", lastName: "Batley", position: Position.DEUXIEME_LIGNE, isStarter: true },
      { num: 6, firstName: "Steven", lastName: "Luatua", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 66 },
      { num: 7, firstName: "Jake", lastName: "Heenan", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 66 },
      { num: 8, firstName: "Fitz", lastName: "Harding", position: Position.NUMERO_HUIT, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 9, firstName: "Will", lastName: "Porter", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 73 },
      { num: 10, firstName: "AJ", lastName: "Aj Macginty", position: Position.DEMI_OUVERTURE, isStarter: true, tries: 0, conversions: 2, penalties: 0, dropGoals: 0, totalPoints: 4, subOut: 75 },
      { num: 11, firstName: "Luke", lastName: "Morahan", position: Position.AILIER, isStarter: true },
      { num: 12, firstName: "Joe", lastName: "Jenkins", position: Position.CENTRE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 13, firstName: "Semi", lastName: "Radradra", position: Position.CENTRE, isStarter: true },
      { num: 14, firstName: "Gabriel", lastName: "Ibitoye", position: Position.AILIER, isStarter: true },
      { num: 15, firstName: "Charles", lastName: "Piutau", position: Position.ARRIERE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subOut: 70 },
      { num: 16, firstName: "Jake", lastName: "Kerr", position: Position.TALONNEUR, isStarter: false },
      { num: 17, firstName: "Jake", lastName: "Woolmore", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 49 },
      { num: 18, firstName: "Jay", lastName: "Tyack", position: Position.PILIER_DROIT, isStarter: false, subIn: 61 },
      { num: 19, firstName: "Elliot", lastName: "Stooke", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 66 },
      { num: 20, firstName: "Dan", lastName: "Thomas", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subOut: 49 },
      { num: 21, firstName: "Tom", lastName: "Whiteley", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 73 },
      { num: 22, firstName: "Callum", lastName: "Sheedy", position: Position.DEMI_OUVERTURE, isStarter: false, subIn: 75 },
      { num: 23, firstName: "Ioan", lastName: "Lloyd", position: Position.CENTRE, isStarter: false, subIn: 70 },
    ],
    events: [
      { minute: 1, type: "ESSAI", isUsap: false, who: "Charles Piutau" },
      { minute: 2, type: "TRANSFORMATION", isUsap: false, who: "AJ Aj Macginty" },
      { minute: 11, type: "ESSAI", isUsap: false, who: "Fitz Harding" },
      { minute: 11, type: "TRANSFORMATION", isUsap: false, who: "AJ Aj Macginty" },
      { minute: 32, type: "ESSAI", isUsap: false, who: "Joe Jenkins" },
      { minute: 39, type: "ESSAI", isUsap: true, who: "Shahn Eru" },
    ],
  },
  // ---------------------------------------------------------------------------
  // Poule J2 — Glasgow 26-18 USAP (2022-12-16)
  // ---------------------------------------------------------------------------
  {
    round: "Poule J2",
    date: "2022-12-16",
    isHome: false,
    opponentName: "Glasgow Warriors",
    opponentLabel: "Glasgow",
    venueFix: { name: "Murrayfield", city: "Édimbourg", capacity: 67144 },
    scoreUsap: 18,
    scoreOpponent: 26,
    report:
      "Déplacement à Murrayfield, où Glasgow reçoit pour cette campagne européenne. Les Warriors mènent grâce à McLean (17') et Huw Jones (23'), tous deux transformés par Weir. L'USAP répond par Jake McIntyre (33') puis Lucas Dubois (59'), et Dorian Laborde entretient l'espoir au pied (deux pénalités et une transformation). Cancellière scelle le sort du match à la 77e. Défaite 18-26, dans un match où Posolo Tuilagi a été sanctionné d'un carton jaune (65').",
    usapSquad: [
      { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 46 },
      { num: 2, firstName: "Seilala", lastName: "Lam", position: Position.TALONNEUR, isStarter: true, subOut: 46 },
      { num: 3, firstName: "Siua", lastName: "Halanukonuka", position: Position.PILIER_DROIT, isStarter: true },
      { num: 4, firstName: "Tristan", lastName: "Labouteley", position: Position.DEUXIEME_LIGNE, isStarter: true },
      { num: 5, firstName: "Piula", lastName: "Fa'asalele", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 46 },
      { num: 6, firstName: "Kélian", lastName: "Galletier", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
      { num: 7, firstName: "Lucas", lastName: "Velarte", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
      { num: 8, firstName: "Genesis", lastName: "Mamea Lemalu", position: Position.NUMERO_HUIT, isStarter: true },
      { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 46 },
      { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 11, firstName: "Mathieu", lastName: "Acébès", position: Position.AILIER, isStarter: true },
      { num: 12, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true },
      { num: 13, firstName: "Dorian", lastName: "Laborde", position: Position.CENTRE, isStarter: true, tries: 0, conversions: 1, penalties: 2, dropGoals: 0, totalPoints: 8 },
      { num: 14, firstName: "George", lastName: "Tilsley", position: Position.AILIER, isStarter: true },
      { num: 15, firstName: "Tristan", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, subOut: 51 },
      { num: 16, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, subIn: 46 },
      { num: 17, firstName: "Arthur", lastName: "Joly", position: Position.PILIER_GAUCHE, isStarter: false },
      { num: 18, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_DROIT, isStarter: false, subIn: 46 },
      { num: 19, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 46, yellowCardMin: 65 },
      { num: 20, firstName: "Lucas", lastName: "Bachelier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
      { num: 21, firstName: "Sadek", lastName: "Deghmache", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 46 },
      { num: 22, firstName: "Lucas", lastName: "Dubois", position: Position.DEMI_OUVERTURE, isStarter: false, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 23, firstName: "Boris", lastName: "Goutard", position: Position.CENTRE, isStarter: false, subIn: 51 },
    ],
    oppSquad: [
      { num: 1, firstName: "Jamie", lastName: "Bhatti", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 67 },
      { num: 2, firstName: "George", lastName: "Turner", position: Position.TALONNEUR, isStarter: true, subOut: 67 },
      { num: 3, firstName: "Murphy", lastName: "Walker", position: Position.PILIER_DROIT, isStarter: true, subOut: 46 },
      { num: 4, firstName: "Lewis", lastName: "Bean", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 55 },
      { num: 5, firstName: "Richie", lastName: "Gray", position: Position.DEUXIEME_LIGNE, isStarter: true },
      { num: 6, firstName: "Matt", lastName: "Fagerson", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
      { num: 7, firstName: "Sione", lastName: "Vailanu", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
      { num: 8, firstName: "Jack", lastName: "Dempsey", position: Position.NUMERO_HUIT, isStarter: true },
      { num: 9, firstName: "George", lastName: "Horne", position: Position.DEMI_DE_MELEE, isStarter: true },
      { num: 10, firstName: "Duncan", lastName: "Weir", position: Position.DEMI_OUVERTURE, isStarter: true, tries: 0, conversions: 2, penalties: 0, dropGoals: 0, totalPoints: 4, subOut: 70 },
      { num: 11, firstName: "Rufus", lastName: "McLean", position: Position.AILIER, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 12, firstName: "Huw", lastName: "Jones", position: Position.CENTRE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 13, firstName: "Sione", lastName: "Tuipulotu", position: Position.CENTRE, isStarter: true },
      { num: 14, firstName: "Sebastián", lastName: "Cancelliere", position: Position.AILIER, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 15, firstName: "Josh", lastName: "McKay", position: Position.ARRIERE, isStarter: true },
      { num: 16, firstName: "Johnny", lastName: "Matthews", position: Position.TALONNEUR, isStarter: false, subIn: 67 },
      { num: 17, firstName: "Simon", lastName: "Berghan", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 46 },
      { num: 18, firstName: "Nathan", lastName: "McBeth", position: Position.PILIER_DROIT, isStarter: false, subIn: 67 },
      { num: 19, firstName: "JP", lastName: "Jp Du Preez", position: Position.DEUXIEME_LIGNE, isStarter: false },
      { num: 20, firstName: "Sintu", lastName: "Manjezi", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 55 },
      { num: 21, firstName: "Euan", lastName: "Ferrie", position: Position.DEMI_DE_MELEE, isStarter: false },
      { num: 22, firstName: "Ali", lastName: "Price", position: Position.DEMI_OUVERTURE, isStarter: false },
      { num: 23, firstName: "Tom", lastName: "Jordan", position: Position.CENTRE, isStarter: false, subIn: 70 },
    ],
    events: [
      { minute: 17, type: "ESSAI", isUsap: false, who: "Rufus McLean" },
      { minute: 19, type: "TRANSFORMATION", isUsap: false, who: "Duncan Weir" },
      { minute: 23, type: "ESSAI", isUsap: false, who: "Huw Jones" },
      { minute: 25, type: "TRANSFORMATION", isUsap: false, who: "Duncan Weir" },
      { minute: 33, type: "ESSAI", isUsap: true, who: "Jake McIntyre" },
      { minute: 56, type: "PENALITE", isUsap: true, who: "Dorian Laborde" },
      { minute: 59, type: "ESSAI", isUsap: true, who: "Lucas Dubois" },
      { minute: 61, type: "TRANSFORMATION", isUsap: true, who: "Dorian Laborde" },
      { minute: 65, type: "CARTON_JAUNE", isUsap: true, who: "Posolo Tuilagi" },
      { minute: 74, type: "PENALITE", isUsap: true, who: "Dorian Laborde" },
      { minute: 77, type: "ESSAI", isUsap: false, who: "Sebastián Cancelliere" },
    ],
  },
  // ---------------------------------------------------------------------------
  // Poule J3 — USAP 26-40 Glasgow (2023-01-14)
  // ---------------------------------------------------------------------------
  {
    round: "Poule J3",
    date: "2023-01-14",
    isHome: true,
    opponentName: "Glasgow Warriors",
    opponentLabel: "Glasgow",
    scoreUsap: 26,
    scoreOpponent: 40,
    report:
      "Match spectaculaire et fou à Aimé-Giral. L'USAP démarre pied au plancher avec Sawaileau (2') et Séguéla (11'), mais Glasgow renverse tout : Sam Johnson (7'), Richie Gray (15'), McDowall (22') et Matthews (32'), Duncan Weir transformant quatre fois. Mattéo Rodor, buteur du soir (un essai à la 53e et trois transformations), et Posolo Tuilagi (76') maintiennent les Catalans à flot, mais Ollie Smith (60') et McKay (63') achèvent la rencontre. 26-40, malgré deux cartons jaunes glaswégiens.",
    usapSquad: [
      { num: 1, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 48 },
      { num: 2, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: true, subOut: 48 },
      { num: 3, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_DROIT, isStarter: true, subOut: 48 },
      { num: 4, firstName: "Andreï", lastName: "Mahu", position: Position.DEUXIEME_LIGNE, isStarter: true },
      { num: 5, firstName: "Bastien", lastName: "Chinarro", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 48 },
      { num: 6, firstName: "Ewan", lastName: "Bertheau", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
      { num: 7, firstName: "Taniela", lastName: "Ramasibana", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
      { num: 8, firstName: "Valentin", lastName: "Moro", position: Position.NUMERO_HUIT, isStarter: true },
      { num: 9, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 40 },
      { num: 10, firstName: "Mattéo", lastName: "Rodor", position: Position.DEMI_OUVERTURE, isStarter: true, tries: 1, conversions: 3, penalties: 0, dropGoals: 0, totalPoints: 11 },
      { num: 11, firstName: "Eddie", lastName: "Sawailau", position: Position.AILIER, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 12, firstName: "Patricio", lastName: "Fernandez", position: Position.CENTRE, isStarter: true },
      { num: 13, firstName: "Afusipa", lastName: "Taumoepeau", position: Position.CENTRE, isStarter: true },
      { num: 14, firstName: "Nino", lastName: "Séguéla", position: Position.AILIER, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 15, firstName: "Boris", lastName: "Goutard", position: Position.ARRIERE, isStarter: true, subOut: 40 },
      { num: 16, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: false, subIn: 48 },
      { num: 17, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 48 },
      { num: 18, firstName: "Vakhtang", lastName: "Jintcharadze", position: Position.PILIER_DROIT, isStarter: false, subIn: 48 },
      { num: 19, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subIn: 48 },
      { num: 20, firstName: "Antoine", lastName: "Bouthier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false },
      { num: 21, firstName: "Alexandre", lastName: "Perez", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 40 },
      { num: 22, firstName: "Keanu", lastName: "Desrues", position: Position.DEMI_OUVERTURE, isStarter: false },
      { num: 23, firstName: "Lilian", lastName: "Pichon", position: Position.CENTRE, isStarter: false, subIn: 40 },
    ],
    oppSquad: [
      { num: 1, firstName: "Lucio", lastName: "Sordoni", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 48 },
      { num: 2, firstName: "Johnny", lastName: "Matthews", position: Position.TALONNEUR, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 3, firstName: "Nathan", lastName: "McBeth", position: Position.PILIER_DROIT, isStarter: true },
      { num: 4, firstName: "JP", lastName: "Jp Du Preez", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 48 },
      { num: 5, firstName: "Richie", lastName: "Gray", position: Position.DEUXIEME_LIGNE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subOut: 62 },
      { num: 6, firstName: "Euan", lastName: "Ferrie", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
      { num: 7, firstName: "Cameron", lastName: "Neild", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 48 },
      { num: 8, firstName: "Jack", lastName: "Dempsey", position: Position.NUMERO_HUIT, isStarter: true },
      { num: 9, firstName: "Jamie", lastName: "Dobie", position: Position.DEMI_DE_MELEE, isStarter: true },
      { num: 10, firstName: "Domingo", lastName: "Miotti", position: Position.DEMI_OUVERTURE, isStarter: true, tries: 0, conversions: 1, penalties: 0, dropGoals: 0, totalPoints: 2, subOut: 10 },
      { num: 11, firstName: "Cole", lastName: "Forbes", position: Position.AILIER, isStarter: true, yellowCardMin: 67 },
      { num: 12, firstName: "Stafford", lastName: "McDowall", position: Position.CENTRE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 13, firstName: "Sam", lastName: "Johnson", position: Position.CENTRE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subOut: 42 },
      { num: 14, firstName: "Ollie", lastName: "Smith", position: Position.AILIER, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 15, firstName: "Josh", lastName: "McKay", position: Position.ARRIERE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 16, firstName: "Angus", lastName: "Fraser", position: Position.TALONNEUR, isStarter: false },
      { num: 17, firstName: "Jamie", lastName: "Bhatti", position: Position.PILIER_GAUCHE, isStarter: false },
      { num: 18, firstName: "Simon", lastName: "Berghan", position: Position.PILIER_DROIT, isStarter: false, subIn: 48 },
      { num: 19, firstName: "Lewis", lastName: "Bean", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 48 },
      { num: 20, firstName: "Alex", lastName: "Samuel", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 62 },
      { num: 21, firstName: "Tom", lastName: "Gordon", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 48, yellowCardMin: 49 },
      { num: 22, firstName: "Sean", lastName: "Kennedy", position: Position.DEMI_OUVERTURE, isStarter: false, subIn: 42 },
      { num: 23, firstName: "Duncan", lastName: "Weir", position: Position.CENTRE, isStarter: false, tries: 0, conversions: 4, penalties: 0, dropGoals: 0, totalPoints: 8, subIn: 10 },
    ],
    events: [
      { minute: 2, type: "ESSAI", isUsap: true, who: "Eddie Sawailau" },
      { minute: 7, type: "ESSAI", isUsap: false, who: "Sam Johnson" },
      { minute: 8, type: "TRANSFORMATION", isUsap: false, who: "Domingo Miotti" },
      { minute: 11, type: "ESSAI", isUsap: true, who: "Nino Séguéla" },
      { minute: 13, type: "TRANSFORMATION", isUsap: true, who: "Mattéo Rodor" },
      { minute: 15, type: "ESSAI", isUsap: false, who: "Richie Gray" },
      { minute: 16, type: "TRANSFORMATION", isUsap: false, who: "Duncan Weir" },
      { minute: 22, type: "ESSAI", isUsap: false, who: "Stafford McDowall" },
      { minute: 23, type: "TRANSFORMATION", isUsap: false, who: "Duncan Weir" },
      { minute: 32, type: "ESSAI", isUsap: false, who: "Johnny Matthews" },
      { minute: 33, type: "TRANSFORMATION", isUsap: false, who: "Duncan Weir" },
      { minute: 49, type: "CARTON_JAUNE", isUsap: false, who: "Tom Gordon" },
      { minute: 53, type: "ESSAI", isUsap: true, who: "Mattéo Rodor" },
      { minute: 55, type: "TRANSFORMATION", isUsap: true, who: "Mattéo Rodor" },
      { minute: 60, type: "ESSAI", isUsap: false, who: "Ollie Smith" },
      { minute: 63, type: "ESSAI", isUsap: false, who: "Josh McKay" },
      { minute: 65, type: "TRANSFORMATION", isUsap: false, who: "Duncan Weir" },
      { minute: 67, type: "CARTON_JAUNE", isUsap: false, who: "Cole Forbes" },
      { minute: 76, type: "ESSAI", isUsap: true, who: "Posolo Tuilagi" },
      { minute: 77, type: "TRANSFORMATION", isUsap: true, who: "Mattéo Rodor" },
    ],
  },
  // ---------------------------------------------------------------------------
  // Poule J4 — Bristol 33-19 USAP (2023-01-20)
  // ---------------------------------------------------------------------------
  {
    round: "Poule J4",
    date: "2023-01-20",
    isHome: false,
    opponentName: "Bristol Bears",
    opponentLabel: "Bristol",
    scoreUsap: 19,
    scoreOpponent: 33,
    report:
      "Dernière journée à Ashton Gate. Crossdale ouvre le score pour l'USAP dès la 11e, transformé par Rodor, mais Bristol enchaîne par Randall (14'), Genge (19'), Thomas (23') et Naulago (27'), MacGinty étant impeccable au pied (4/4). Genge s'offre un doublé juste après la pause (41'). Séguéla (47') et Valentin Moro (53') sauvent l'honneur catalan. 19-33, l'USAP termine sa campagne européenne sans victoire.",
    usapSquad: [
      { num: 1, firstName: "Samir", lastName: "Bououda", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 51 },
      { num: 2, firstName: "Mike", lastName: "Tadjer", position: Position.TALONNEUR, isStarter: true, subOut: 54 },
      { num: 3, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT, isStarter: true, subOut: 54 },
      { num: 4, firstName: "Bastien", lastName: "Chinarro", position: Position.DEUXIEME_LIGNE, isStarter: true },
      { num: 5, firstName: "Andreï", lastName: "Mahu", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 72 },
      { num: 6, firstName: "Taniela", lastName: "Ramasibana", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
      { num: 7, firstName: "Ewan", lastName: "Bertheau", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
      { num: 8, firstName: "Valentin", lastName: "Moro", position: Position.NUMERO_HUIT, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 9, firstName: "Mattéo", lastName: "Rodor", position: Position.DEMI_DE_MELEE, isStarter: true, tries: 0, conversions: 2, penalties: 0, dropGoals: 0, totalPoints: 4 },
      { num: 10, firstName: "Alexandre", lastName: "Perez", position: Position.DEMI_OUVERTURE, isStarter: true, subOut: 49 },
      { num: 11, firstName: "Nino", lastName: "Séguéla", position: Position.AILIER, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subOut: 62 },
      { num: 12, firstName: "Patricio", lastName: "Fernandez", position: Position.CENTRE, isStarter: true },
      { num: 13, firstName: "Eddie", lastName: "Sawailau", position: Position.CENTRE, isStarter: true },
      { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true },
      { num: 15, firstName: "Ali", lastName: "Crossdale", position: Position.ARRIERE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subOut: 49 },
      { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, subIn: 54 },
      { num: 17, firstName: "Xavier", lastName: "Chiocci", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 51 },
      { num: 18, firstName: "Vakhtang", lastName: "Jintcharadze", position: Position.PILIER_DROIT, isStarter: false, subIn: 54 },
      { num: 19, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false },
      { num: 20, firstName: "Victor", lastName: "Moreaux", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 72 },
      { num: 21, firstName: "Lenny", lastName: "Viola", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 49 },
      { num: 22, firstName: "Keanu", lastName: "Desrues", position: Position.DEMI_OUVERTURE, isStarter: false, subIn: 62 },
      { num: 23, firstName: "Lilian", lastName: "Pichon", position: Position.CENTRE, isStarter: false, subIn: 49 },
    ],
    oppSquad: [
      { num: 1, firstName: "Ellis", lastName: "Genge", position: Position.PILIER_GAUCHE, isStarter: true, tries: 2, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 10, subOut: 73 },
      { num: 2, firstName: "Harry", lastName: "Thacker", position: Position.TALONNEUR, isStarter: true, subOut: 76 },
      { num: 3, firstName: "Kyle", lastName: "Sinckler", position: Position.PILIER_DROIT, isStarter: true },
      { num: 4, firstName: "Joe", lastName: "Batley", position: Position.DEUXIEME_LIGNE, isStarter: true },
      { num: 5, firstName: "Chris", lastName: "Vui", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 63 },
      { num: 6, firstName: "Dan", lastName: "Thomas", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 7, firstName: "Magnus", lastName: "Bradbury", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
      { num: 8, firstName: "Fitz", lastName: "Harding", position: Position.NUMERO_HUIT, isStarter: true, subOut: 73 },
      { num: 9, firstName: "Harry", lastName: "Randall", position: Position.DEMI_DE_MELEE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subOut: 53 },
      { num: 10, firstName: "AJ", lastName: "Aj Macginty", position: Position.DEMI_OUVERTURE, isStarter: true, tries: 0, conversions: 4, penalties: 0, dropGoals: 0, totalPoints: 8, subOut: 69 },
      { num: 11, firstName: "Ratu Siva", lastName: "Naulago", position: Position.AILIER, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
      { num: 12, firstName: "James", lastName: "Williams", position: Position.CENTRE, isStarter: true },
      { num: 13, firstName: "Semi", lastName: "Radradra", position: Position.CENTRE, isStarter: true },
      { num: 14, firstName: "Deago", lastName: "Bailey", position: Position.AILIER, isStarter: true, subOut: 33 },
      { num: 15, firstName: "Rich", lastName: "Lane", position: Position.ARRIERE, isStarter: true },
      { num: 16, firstName: "Fred", lastName: "Davies", position: Position.TALONNEUR, isStarter: false, subIn: 76 },
      { num: 17, firstName: "Max", lastName: "Lahiff", position: Position.PILIER_GAUCHE, isStarter: false },
      { num: 18, firstName: "Jake", lastName: "Woolmore", position: Position.PILIER_DROIT, isStarter: false, subIn: 73 },
      { num: 19, firstName: "John", lastName: "Hawkins", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 63 },
      { num: 20, firstName: "Jake", lastName: "Heenan", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 73 },
      { num: 21, firstName: "Andy", lastName: "Uren", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 53 },
      { num: 22, firstName: "Callum", lastName: "Sheedy", position: Position.DEMI_OUVERTURE, isStarter: false, subIn: 69 },
      { num: 23, firstName: "Jack", lastName: "Bates", position: Position.CENTRE, isStarter: false, subIn: 33 },
    ],
    events: [
      { minute: 11, type: "ESSAI", isUsap: true, who: "Ali Crossdale" },
      { minute: 12, type: "TRANSFORMATION", isUsap: true, who: "Mattéo Rodor" },
      { minute: 14, type: "ESSAI", isUsap: false, who: "Harry Randall" },
      { minute: 15, type: "TRANSFORMATION", isUsap: false, who: "AJ Aj Macginty" },
      { minute: 19, type: "ESSAI", isUsap: false, who: "Ellis Genge" },
      { minute: 20, type: "TRANSFORMATION", isUsap: false, who: "AJ Aj Macginty" },
      { minute: 23, type: "ESSAI", isUsap: false, who: "Dan Thomas" },
      { minute: 25, type: "TRANSFORMATION", isUsap: false, who: "AJ Aj Macginty" },
      { minute: 27, type: "ESSAI", isUsap: false, who: "Ratu Siva Naulago" },
      { minute: 41, type: "ESSAI", isUsap: false, who: "Ellis Genge" },
      { minute: 42, type: "TRANSFORMATION", isUsap: false, who: "AJ Aj Macginty" },
      { minute: 47, type: "ESSAI", isUsap: true, who: "Nino Séguéla" },
      { minute: 53, type: "ESSAI", isUsap: true, who: "Valentin Moro" },
      { minute: 54, type: "TRANSFORMATION", isUsap: true, who: "Mattéo Rodor" },
    ],
  },
];

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/** Nom comparable : sans accents, sans casse, sans ponctuation. */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Index des joueurs par nom normalisé, construit une fois. La recherche doit
 * porter sur le nom complet normalisé : un filtre SQL sur le seul nom de
 * famille rate les variantes d'accent et de ponctuation (voir CLAUDE.md).
 */
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

/** Convention du projet : USAP comme adversaires sont de vraies lignes Player. */
async function findOrCreatePlayer(
  p: PlayerData,
  isUsap: boolean,
): Promise<string> {
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

/** 80' pour un titulaire non remplacé, minute de sortie sinon, complément pour un entrant. */
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
  console.log("=== Challenge Européen 2022-2023 : feuilles de match ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2022, endYear: 2023 },
  });
  const competition = await prisma.competition.findFirstOrThrow({
    where: { shortName: "Challenge Européen" },
  });
  const france = await prisma.country.findFirst({ where: { code: "FR" } });

  for (const m of MATCHES) {
    console.log(`\n########## ${m.round} — ${m.opponentLabel} (${m.date}) ##########`);

    const match = await prisma.match.findFirstOrThrow({
      where: { seasonId: season.id, competitionId: competition.id, round: m.round },
    });

    // ---- Correction de stade, le cas échéant ------------------------------
    if (m.venueFix) {
      let venue = await prisma.venue.findFirst({ where: { name: m.venueFix.name } });
      if (!venue) {
        venue = await prisma.venue.create({
          data: {
            name: m.venueFix.name,
            city: m.venueFix.city,
            capacity: m.venueFix.capacity ?? null,
            countryId: null,
            slug: "temp",
          },
        });
        await prisma.venue.update({
          where: { id: venue.id },
          data: { slug: `${slugify(m.venueFix.name)}-${slugify(m.venueFix.city)}-${venue.id}` },
        });
        console.log(`  [stade] Créé : ${m.venueFix.name} (${m.venueFix.city})`);
      }
      if (match.venueId !== venue.id) {
        await prisma.match.update({ where: { id: match.id }, data: { venueId: venue.id } });
        console.log(`  [stade] Corrigé : ${m.venueFix.name}`);
      }
    }

    await prisma.match.update({ where: { id: match.id }, data: { report: m.report } });

    // ---- Compositions ------------------------------------------------------
    await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
    const ids: Record<string, string> = {};

    for (const [squad, isUsap] of [
      [m.usapSquad, true],
      [m.oppSquad, false],
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

        // Rattachement à l'effectif de la saison, côté USAP uniquement
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
    const [pu, po] = [somme(m.usapSquad), somme(m.oppSquad)];
    console.log(`  Compositions : ${m.usapSquad.length} USAP / ${m.oppSquad.length} ${m.opponentLabel}`);
    if (pu !== m.scoreUsap) console.log(`  ⚠ points USAP répartis : ${pu} au lieu de ${m.scoreUsap}`);
    if (po !== m.scoreOpponent)
      console.log(`  ⚠ points ${m.opponentLabel} répartis : ${po} au lieu de ${m.scoreOpponent}`);

    // ---- Chronologie -------------------------------------------------------
    await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
    let usapPts = 0;
    let oppPts = 0;
    const valeur: Record<string, number> = { ESSAI: 5, TRANSFORMATION: 2, PENALITE: 3, DROP: 3 };

    for (const e of m.events) {
      const v = valeur[e.type] ?? 0;
      if (e.isUsap) usapPts += v;
      else oppPts += v;
      const team = e.isUsap ? "USAP" : m.opponentLabel;
      const score = m.isHome ? `${usapPts}-${oppPts}` : `${oppPts}-${usapPts}`;
      const description =
        e.type === "CARTON_JAUNE"
          ? `${EVENT_LABELS[e.type]} ${e.who} (${team}).`
          : `${EVENT_LABELS[e.type]} de ${e.who} (${team}). ${score}.`;

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
    console.log(`  Chronologie : ${m.events.length} événements`);
  }

  console.log("\n=== Terminé : 4 matchs traités ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

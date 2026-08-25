/**
 * Fin de saison 2025-2026 de l'USAP — J21 à J26 du Top 14 + huitième de finale
 * de Challenge Européen.
 *
 * Complète la saison qui s'arrêtait à la J20 (USAP 36-20 Toulon, 28/03/2026).
 * L'access match du 14/06/2026 fait l'objet d'un script séparé
 * (scripts/seed-access-match-2026.ts).
 *
 * Récapitulatif :
 *   J21  18/04/2026  Montpellier      42-31  USAP    (défaite)
 *   J22  25/04/2026  USAP             29-31  La Rochelle (défaite, BD)
 *   J23  09/05/2026  Clermont         45-14  USAP    (défaite)
 *   J24  16/05/2026  Bordeaux-Bègles  37-32  USAP    (défaite, BD)
 *   J25  30/05/2026  USAP             29-27  Castres (victoire)
 *   J26  06/06/2026  Bayonne          52-7   USAP    (défaite)
 *   CC   04/04/2026  Montpellier      53-13  USAP    (8e de finale, élimination)
 *
 * Sources : ESPN (feuilles de match et chronologies), Wikipedia (classement
 *   final du Top 14 2025-2026), top14.lnr.fr.
 *
 * Non renseignés faute de source fiable : arbitres, affluences, URL des résumés
 * vidéo. À compléter dans un second temps.
 *
 * Usage : npx tsx scripts/seed-fin-saison-2025-2026.ts
 *
 * Idempotent : recrée compositions et événements à chaque exécution.
 */

import { PrismaClient, Position, MatchResult } from "@prisma/client";
import {
  generateMatchSlug,
  generatePlayerSlug,
  generateRefereeSlug,
} from "../src/lib/slugs";

const prisma = new PrismaClient();

interface UsapPlayerData {
  num: number;
  firstName: string;
  lastName: string;
  position: Position;
  isStarter: boolean;
  isCaptain?: boolean;
  tries?: number;
  conversions?: number;
  penalties?: number;
  dropGoals?: number;
  totalPoints?: number;
  subIn?: number;
  subOut?: number;
}

interface OpponentPlayerData {
  num: number;
  name: string;
  position: Position;
  isStarter: boolean;
  isCaptain?: boolean;
  subIn?: number;
  subOut?: number;
}

interface EventData {
  minute: number;
  type:
    | "ESSAI"
    | "TRANSFORMATION"
    | "PENALITE"
    | "DROP"
    | "ESSAI_PENALITE"
    | "CARTON_JAUNE"
    | "CARTON_ROUGE";
  isUsap: boolean;
  who: string;
}

interface MatchData {
  label: string;
  date: string;
  kickoffTime: string;
  competitionShortName: string;
  opponentName: string;
  opponentLabel: string; // nom court utilisé dans les descriptions d'événements
  venueName: string;
  matchday: number | null;
  round: string | null;
  isHome: boolean;
  scoreUsap: number;
  scoreOpponent: number;
  halfTimeUsap: number;
  halfTimeOpponent: number;
  triesUsap: number;
  conversionsUsap: number;
  penaltiesUsap: number;
  dropGoalsUsap: number;
  triesOpponent: number;
  conversionsOpponent: number;
  penaltiesOpponent: number;
  dropGoalsOpponent: number;
  bonusOffensif: boolean;
  bonusDefensif: boolean;
  /** Arbitre central, quand il a pu être sourcé. */
  referee?: { firstName: string; lastName: string };
  /** URL du résumé vidéo, quand elle a pu être sourcée. */
  videoUrl?: string;
  report: string;
  usapSquad: UsapPlayerData[];
  oppSquad: OpponentPlayerData[];
  events: EventData[];
}

const MATCHES: MatchData[] = [
  // ---------------------------------------------------------------------------
  // J21 — Montpellier Herault 42 - 31 Perpignan (2026-04-18)
  // ---------------------------------------------------------------------------
  {
    label: "J21",
    date: "2026-04-18",
    kickoffTime: "16:35",
    competitionShortName: "Top 14",
    opponentName: "Montpellier Hérault Rugby",
    opponentLabel: "Montpellier",
    venueName: "GGL Stadium",
    matchday: 21,
    round: null,
    isHome: false,
    scoreUsap: 31,
    scoreOpponent: 42,
    halfTimeUsap: 17,
    halfTimeOpponent: 30,
    triesUsap: 4, conversionsUsap: 4, penaltiesUsap: 1, dropGoalsUsap: 0,
    triesOpponent: 6, conversionsOpponent: 3, penaltiesOpponent: 2, dropGoalsOpponent: 0,
    bonusOffensif: false,
    bonusDefensif: false,
    referee: { firstName: "Julien", lastName: "Caulier" },
    videoUrl: "https://www.youtube.com/watch?v=9q4ZpEyyrnU",
    report:
      "Défaite logique au Septeo Stadium face à un Montpellier candidat au titre. L'USAP ouvre pourtant le score par Yato (10') et reste au contact grâce à Forner (30') et une pénalité d'Urdapilleta (38'), mais encaisse quatre essais avant la pause (Uelese ×2, Piccardo, Chalureau) et rentre aux vestiaires à 30-17. Les Catalans refusent de couler : Beria (59') puis Tedder (73'), tous deux transformés par Aucagne, ramènent l'écart à six points. Taofifenua (79') scelle la victoire héraultaise. Six essais à quatre, pas de bonus pour l'USAP.",
    usapSquad: [
  { num: 1, firstName: "Bruce", lastName: "Devaux", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 55 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, subOut: 62 },
  { num: 3, firstName: "Kieran", lastName: "Brookes", position: Position.PILIER_DROIT, isStarter: true, subOut: 62 },
  { num: 4, firstName: "Peceli", lastName: "Yato", position: Position.DEUXIEME_LIGNE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
  { num: 5, firstName: "Adrien", lastName: "Warion", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, firstName: "Bastien", lastName: "Chinarro", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 22 },
  { num: 7, firstName: "Mattéo", lastName: "Le Corvec", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, subOut: 62 },
  { num: 9, firstName: "James", lastName: "Hall", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 70 },
  { num: 10, firstName: "Benjamin", lastName: "Urdapilleta", position: Position.DEMI_OUVERTURE, isStarter: true, tries: 0, conversions: 2, penalties: 1, dropGoals: 0, totalPoints: 7, subOut: 50 },
  { num: 11, firstName: "Théo", lastName: "Forner", position: Position.AILIER, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
  { num: 12, firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, subOut: 77 },
  { num: 13, firstName: "Eneriko", lastName: "Buliruarua", position: Position.CENTRE, isStarter: true, subOut: 60 },
  { num: 14, firstName: "Jefferson-Lee", lastName: "Joseph", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Tristan James", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, subIn: 62 },
  { num: 17, firstName: "Giorgi", lastName: "Beria", position: Position.PILIER_GAUCHE, isStarter: false, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subIn: 55 },
  { num: 18, firstName: "Jonny", lastName: "Gray", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 62 },
  { num: 19, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 22 },
  { num: 20, firstName: "Gela", lastName: "Aprasidze", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 70 },
  { num: 21, firstName: "Antoine", lastName: "Aucagne", position: Position.DEMI_OUVERTURE, isStarter: false, tries: 0, conversions: 2, penalties: 0, dropGoals: 0, totalPoints: 4, subIn: 50 },
  { num: 22, firstName: "Diego", lastName: "Mascarenc", position: Position.CENTRE, isStarter: false, subIn: 60 },
  { num: 23, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false, subIn: 62 },
],
oppSquad: [
  { num: 1, name: "Baptiste Erdocio", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 56 },
  { num: 2, name: "Jordan Uelese", position: Position.TALONNEUR, isStarter: true, subOut: 50 },
  { num: 3, name: "Wilfrid Hounkpatin", position: Position.PILIER_DROIT, isStarter: true, subOut: 17 },
  { num: 4, name: "Florian Verhaeghe", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 70 },
  { num: 5, name: "Bastien Chalureau", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 50 },
  { num: 6, name: "Lenni Nouchi", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 50 },
  { num: 7, name: "Alexandre Becognee", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Billy Vunipola", position: Position.NUMERO_HUIT, isStarter: true, subOut: 70 },
  { num: 9, name: "Ali Price", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 70 },
  { num: 10, name: "Domingo Miotti", position: Position.DEMI_OUVERTURE, isStarter: true, subOut: 64 },
  { num: 11, name: "Donovan Taofifenua", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Justo Piccardo", position: Position.CENTRE, isStarter: true, subOut: 77 },
  { num: 13, name: "Auguste Cadot", position: Position.CENTRE, isStarter: true, subOut: 63 },
  { num: 14, name: "Gabriel Ngandebe", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Tom Banks", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Christopher Tolofua", position: Position.TALONNEUR, isStarter: false, subIn: 50 },
  { num: 17, name: "Enzo Forletta", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 56 },
  { num: 18, name: "Adam Beard", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 50 },
  { num: 19, name: "Yacouba Camara", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 50 },
  { num: 20, name: "Alexis Bernadet", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 70 },
  { num: 21, name: "Thomas Vincent", position: Position.DEMI_OUVERTURE, isStarter: false, subIn: 64 },
  { num: 22, name: "Arthur Vincent", position: Position.CENTRE, isStarter: false, subIn: 63 },
  { num: 23, name: "Mohamed Haouas", position: Position.PILIER_DROIT, isStarter: false, subIn: 17 },
],
events: [
  { minute: 3, type: "PENALITE", isUsap: false, who: "Domingo Miotti" }, // 3-0
  { minute: 10, type: "ESSAI", isUsap: true, who: "Peceli Yato" }, // 3-5
  { minute: 11, type: "TRANSFORMATION", isUsap: true, who: "Benjamin Urdapilleta" }, // 3-7
  { minute: 14, type: "ESSAI", isUsap: false, who: "Jordan Uelese" }, // 8-7
  { minute: 18, type: "ESSAI", isUsap: false, who: "Justo Piccardo" }, // 13-7
  { minute: 19, type: "TRANSFORMATION", isUsap: false, who: "Domingo Miotti" }, // 15-7
  { minute: 22, type: "CARTON_JAUNE", isUsap: false, who: "Bastien Chalureau" }, // 15-7
  { minute: 26, type: "PENALITE", isUsap: false, who: "Domingo Miotti" }, // 18-7
  { minute: 30, type: "ESSAI", isUsap: true, who: "Théo Forner" }, // 18-12
  { minute: 31, type: "TRANSFORMATION", isUsap: true, who: "Benjamin Urdapilleta" }, // 18-14
  { minute: 35, type: "ESSAI", isUsap: false, who: "Bastien Chalureau" }, // 23-14
  { minute: 36, type: "TRANSFORMATION", isUsap: false, who: "Domingo Miotti" }, // 25-14
  { minute: 38, type: "PENALITE", isUsap: true, who: "Benjamin Urdapilleta" }, // 25-17
  { minute: 42, type: "ESSAI", isUsap: false, who: "Jordan Uelese" }, // 30-17
  { minute: 59, type: "ESSAI", isUsap: true, who: "Giorgi Beria" }, // 30-22
  { minute: 59, type: "TRANSFORMATION", isUsap: true, who: "Antoine Aucagne" }, // 30-24
  { minute: 69, type: "ESSAI", isUsap: false, who: "Florian Verhaeghe" }, // 35-24
  { minute: 70, type: "TRANSFORMATION", isUsap: false, who: "Thomas Vincent" }, // 37-24
  { minute: 73, type: "ESSAI", isUsap: true, who: "Tristan James Tedder" }, // 37-29
  { minute: 74, type: "TRANSFORMATION", isUsap: true, who: "Antoine Aucagne" }, // 37-31
  { minute: 79, type: "ESSAI", isUsap: false, who: "Donovan Taofifenua" }, // 42-31
],
  },
  // ---------------------------------------------------------------------------
  // J22 — Perpignan 29 - 31 La Rochelle (2026-04-25)
  // ---------------------------------------------------------------------------
  {
    label: "J22",
    date: "2026-04-25",
    kickoffTime: "16:35",
    competitionShortName: "Top 14",
    opponentName: "Stade Rochelais",
    opponentLabel: "La Rochelle",
    venueName: "Stade Aimé-Giral",
    matchday: 22,
    round: null,
    isHome: true,
    scoreUsap: 29,
    scoreOpponent: 31,
    halfTimeUsap: 16,
    halfTimeOpponent: 19,
    triesUsap: 2, conversionsUsap: 2, penaltiesUsap: 5, dropGoalsUsap: 0,
    triesOpponent: 3, conversionsOpponent: 2, penaltiesOpponent: 4, dropGoalsOpponent: 0,
    bonusOffensif: false,
    bonusDefensif: true,
    referee: { firstName: "Evan", lastName: "Urruzmendi" },
    videoUrl: "https://www.youtube.com/watch?v=QkO8LK_Ivw8",
    report:
      "Crève-cœur à Aimé-Giral. Menée 16-19 à la pause malgré un essai de Forner (30'), l'USAP passe devant grâce à Yato (49') puis à trois pénalités d'Urdapilleta, impeccable au pied (5/5). À 29-28 à douze minutes de la fin, les Catalans tiennent leur victoire, mais Le Garrec, auteur de la totalité des points rochelais (2 essais, 2 transformations, 5 pénalités), passe la pénalité de la gagne à la 80e. Défaite 29-31 et point de bonus défensif.",
    usapSquad: [
  { num: 1, firstName: "Giorgi", lastName: "Beria", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 41 },
  { num: 2, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: true, subOut: 41 },
  { num: 3, firstName: "Kieran", lastName: "Brookes", position: Position.PILIER_DROIT, isStarter: true, subOut: 56 },
  { num: 4, firstName: "Mattéo", lastName: "Le Corvec", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 41 },
  { num: 5, firstName: "Jonny", lastName: "Gray", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 75 },
  { num: 6, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 41 },
  { num: 7, firstName: "Jamie", lastName: "Ritchie", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, firstName: "James", lastName: "Hall", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, firstName: "Benjamin", lastName: "Urdapilleta", position: Position.DEMI_OUVERTURE, isStarter: true, tries: 0, conversions: 2, penalties: 5, dropGoals: 0, totalPoints: 19 },
  { num: 11, firstName: "Théo", lastName: "Forner", position: Position.AILIER, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
  { num: 12, firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, subOut: 69 },
  { num: 13, firstName: "Job", lastName: "Poulet", position: Position.CENTRE, isStarter: true, subOut: 56 },
  { num: 14, firstName: "Jefferson-Lee", lastName: "Joseph", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Tristan James", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, subOut: 13 },
  { num: 16, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: false, subIn: 41 },
  { num: 17, firstName: "Bruce", lastName: "Devaux", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 41 },
  { num: 18, firstName: "Peceli", lastName: "Yato", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subIn: 41 },
  { num: 19, firstName: "Maxwell", lastName: "Hicks", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 41 },
  { num: 20, firstName: "Gela", lastName: "Aprasidze", position: Position.DEMI_DE_MELEE, isStarter: false },
  { num: 21, firstName: "Antoine", lastName: "Aucagne", position: Position.DEMI_OUVERTURE, isStarter: false, subIn: 13 },
  { num: 22, firstName: "Eneriko", lastName: "Buliruarua", position: Position.CENTRE, isStarter: false, subIn: 56 },
  { num: 23, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false, subIn: 56 },
],
oppSquad: [
  { num: 1, name: "Reda Wardi", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 56 },
  { num: 2, name: "Tolu Latu", position: Position.TALONNEUR, isStarter: true, subOut: 33 },
  { num: 3, name: "Joel Sclavi", position: Position.PILIER_DROIT, isStarter: true, subOut: 33 },
  { num: 4, name: "Charles Kante-Samba", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 51 },
  { num: 5, name: "Judicael Cancoriet", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 71 },
  { num: 6, name: "Paul Boudehent", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 51 },
  { num: 7, name: "Oscar Jegou", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Gregory Alldritt", position: Position.NUMERO_HUIT, isStarter: true, isCaptain: true, subOut: 62 },
  { num: 9, name: "Nolann Le Garrec", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, name: "Antoine Hastoy", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Dillyn Leyds", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Jules Favre", position: Position.CENTRE, isStarter: true, subOut: 75 },
  { num: 13, name: "Semi Lagivala", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Jack Nowell", position: Position.AILIER, isStarter: true, subOut: 39 },
  { num: 15, name: "Davit Niniashvili", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Quentin Lespiaucq", position: Position.TALONNEUR, isStarter: false, subIn: 33 },
  { num: 17, name: "Alexandre Kaddouri", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 56 },
  { num: 18, name: "Matthias Haddad", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 51 },
  { num: 19, name: "Levani Botia", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 51 },
  { num: 20, name: "Pierre Bourgarit", position: Position.TALONNEUR, isStarter: false, subIn: 64 },
  { num: 21, name: "Ulupano Seuteni", position: Position.AILIER, isStarter: false, subIn: 39 },
  { num: 22, name: "Ihaia West", position: Position.CENTRE, isStarter: false, subIn: 75 },
  { num: 23, name: "Aleksandre Kuntelia", position: Position.PILIER_DROIT, isStarter: false, subIn: 33 },
],
events: [
  { minute: 3, type: "PENALITE", isUsap: true, who: "Benjamin Urdapilleta" }, // 3-0
  { minute: 9, type: "ESSAI", isUsap: false, who: "Nolann Le Garrec" }, // 3-5
  { minute: 10, type: "TRANSFORMATION", isUsap: false, who: "Nolann Le Garrec" }, // 3-7
  { minute: 13, type: "PENALITE", isUsap: true, who: "Benjamin Urdapilleta" }, // 6-7
  { minute: 18, type: "ESSAI", isUsap: false, who: "Nolann Le Garrec" }, // 6-12
  { minute: 25, type: "PENALITE", isUsap: true, who: "Benjamin Urdapilleta" }, // 9-12
  { minute: 30, type: "ESSAI", isUsap: true, who: "Théo Forner" }, // 14-12
  { minute: 31, type: "TRANSFORMATION", isUsap: true, who: "Benjamin Urdapilleta" }, // 16-12
  { minute: 40, type: "ESSAI", isUsap: false, who: "Judicael Cancoriet" }, // 16-17
  { minute: 41, type: "TRANSFORMATION", isUsap: false, who: "Nolann Le Garrec" }, // 16-19
  { minute: 45, type: "PENALITE", isUsap: false, who: "Nolann Le Garrec" }, // 16-22
  { minute: 49, type: "ESSAI", isUsap: true, who: "Peceli Yato" }, // 21-22
  { minute: 50, type: "TRANSFORMATION", isUsap: true, who: "Benjamin Urdapilleta" }, // 23-22
  { minute: 53, type: "PENALITE", isUsap: false, who: "Nolann Le Garrec" }, // 23-25
  { minute: 58, type: "PENALITE", isUsap: true, who: "Benjamin Urdapilleta" }, // 26-25
  { minute: 64, type: "PENALITE", isUsap: false, who: "Nolann Le Garrec" }, // 26-28
  { minute: 68, type: "PENALITE", isUsap: true, who: "Benjamin Urdapilleta" }, // 29-28
  { minute: 80, type: "PENALITE", isUsap: false, who: "Nolann Le Garrec" }, // 29-31
],
  },
  // ---------------------------------------------------------------------------
  // J23 — Clermont Auvergne 45 - 14 Perpignan (2026-05-09)
  // ---------------------------------------------------------------------------
  {
    label: "J23",
    date: "2026-05-09",
    kickoffTime: "16:35",
    competitionShortName: "Top 14",
    opponentName: "ASM Clermont Auvergne",
    opponentLabel: "Clermont",
    venueName: "Stade Marcel-Michelin",
    matchday: 23,
    round: null,
    isHome: false,
    scoreUsap: 14,
    scoreOpponent: 45,
    halfTimeUsap: 7,
    halfTimeOpponent: 17,
    triesUsap: 2, conversionsUsap: 2, penaltiesUsap: 0, dropGoalsUsap: 0,
    triesOpponent: 6, conversionsOpponent: 6, penaltiesOpponent: 1, dropGoalsOpponent: 0,
    bonusOffensif: false,
    bonusDefensif: false,
    referee: { firstName: "Thomas", lastName: "Charabas" },
    videoUrl: "https://www.youtube.com/watch?v=5SlyiZv7sGg",
    report:
      "Démonstration clermontoise au Michelin. L'USAP ouvre le score par Granell (21') transformé par Urdapilleta, mais Clermont répond immédiatement par Delguy (24') et Massa (36') et vire en tête 17-7. La seconde période tourne à la correction : Plummer (42'), Loaloa (48'), Raka (67') et Dessaigne (71') alourdissent l'addition, Plummer signant un sans-faute au pied (6/6). Ceccarelli sauve l'honneur à la sirène (80'), transformé par Aucagne. 45-14.",
    usapSquad: [
  { num: 1, firstName: "Lorencio", lastName: "Boyer Gallardo", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 39 },
  { num: 2, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: true, subOut: 48 },
  { num: 3, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: true, subOut: 41 },
  { num: 4, firstName: "Jacobus", lastName: "Van Tonder", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 41 },
  { num: 5, firstName: "Adrien", lastName: "Warion", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, firstName: "Maxwell", lastName: "Hicks", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 58 },
  { num: 7, firstName: "Jamie", lastName: "Ritchie", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 59 },
  { num: 8, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: true, subOut: 58 },
  { num: 9, firstName: "James", lastName: "Hall", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 53 },
  { num: 10, firstName: "Benjamin", lastName: "Urdapilleta", position: Position.DEMI_OUVERTURE, isStarter: true, tries: 0, conversions: 1, penalties: 0, dropGoals: 0, totalPoints: 2, subOut: 48 },
  { num: 11, firstName: "Maxim", lastName: "Granell", position: Position.AILIER, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
  { num: 12, firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true, subOut: 59 },
  { num: 13, firstName: "Eneriko", lastName: "Buliruarua", position: Position.CENTRE, isStarter: true },
  { num: 14, firstName: "Jefferson-Lee", lastName: "Joseph", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Antoine", lastName: "Aucagne", position: Position.ARRIERE, isStarter: true, tries: 0, conversions: 1, penalties: 0, dropGoals: 0, totalPoints: 2 },
  { num: 16, firstName: "Mathys", lastName: "Lotrian", position: Position.TALONNEUR, isStarter: false, subIn: 48 },
  { num: 17, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 39 },
  { num: 18, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 41 },
  { num: 19, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: false, subIn: 58 },
  { num: 20, firstName: "Gela", lastName: "Aprasidze", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 53 },
  { num: 21, firstName: "Job", lastName: "Poulet", position: Position.CENTRE, isStarter: false, subIn: 59 },
  { num: 22, firstName: "Mayron", lastName: "Fahy", position: Position.ARRIERE, isStarter: false, subIn: 48 },
  { num: 23, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subIn: 41 },
],
oppSquad: [
  { num: 1, name: "Giorgi Akhaladze", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 55 },
  { num: 2, name: "Barnabe Massa", position: Position.TALONNEUR, isStarter: true, subOut: 55 },
  { num: 3, name: "Giga Tutisani", position: Position.PILIER_DROIT, isStarter: true, subOut: 59 },
  { num: 4, name: "Leo Michaux", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 51 },
  { num: 5, name: "Thomas Ceyte", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 64 },
  { num: 6, name: "Killian Tixeront", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 64 },
  { num: 7, name: "Anthime Hemery", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 75 },
  { num: 8, name: "Pita-Gus Sowakula", position: Position.NUMERO_HUIT, isStarter: true, subOut: 51 },
  { num: 9, name: "Baptiste Jauneau", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 59 },
  { num: 10, name: "Harry Plummer", position: Position.DEMI_OUVERTURE, isStarter: true, subOut: 75 },
  { num: 11, name: "Alivereti Raka", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Leon Darricarrere", position: Position.CENTRE, isStarter: true, subOut: 64 },
  { num: 13, name: "Alivereti Loaloa", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Bautista Delguy", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Kylan Hamdaoui", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Etienne Fourcade", position: Position.TALONNEUR, isStarter: false, subIn: 55 },
  { num: 17, name: "Etienne Falgoux", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 55 },
  { num: 18, name: "Pio Muarua", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 51 },
  { num: 19, name: "Selevasio Tolofua", position: Position.NUMERO_HUIT, isStarter: false, subIn: 51 },
  { num: 20, name: "Sebastien Bezy", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 59 },
  { num: 21, name: "Lucas Dessaigne", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 64 },
  { num: 22, name: "Irae Simone", position: Position.CENTRE, isStarter: false, subIn: 64 },
  { num: 23, name: "Giorgi Dzmanashvili", position: Position.PILIER_DROIT, isStarter: false, subIn: 59 },
],
events: [
  { minute: 21, type: "ESSAI", isUsap: true, who: "Maxim Granell" }, // 0-5
  { minute: 22, type: "TRANSFORMATION", isUsap: true, who: "Benjamin Urdapilleta" }, // 0-7
  { minute: 24, type: "ESSAI", isUsap: false, who: "Bautista Delguy" }, // 5-7
  { minute: 25, type: "TRANSFORMATION", isUsap: false, who: "Harry Plummer" }, // 7-7
  { minute: 29, type: "PENALITE", isUsap: false, who: "Harry Plummer" }, // 10-7
  { minute: 36, type: "ESSAI", isUsap: false, who: "Barnabe Massa" }, // 15-7
  { minute: 37, type: "TRANSFORMATION", isUsap: false, who: "Harry Plummer" }, // 17-7
  { minute: 42, type: "ESSAI", isUsap: false, who: "Harry Plummer" }, // 22-7
  { minute: 43, type: "TRANSFORMATION", isUsap: false, who: "Harry Plummer" }, // 24-7
  { minute: 48, type: "ESSAI", isUsap: false, who: "Alivereti Loaloa" }, // 29-7
  { minute: 49, type: "TRANSFORMATION", isUsap: false, who: "Harry Plummer" }, // 31-7
  { minute: 67, type: "ESSAI", isUsap: false, who: "Alivereti Raka" }, // 36-7
  { minute: 68, type: "TRANSFORMATION", isUsap: false, who: "Harry Plummer" }, // 38-7
  { minute: 71, type: "ESSAI", isUsap: false, who: "Lucas Dessaigne" }, // 43-7
  { minute: 72, type: "TRANSFORMATION", isUsap: false, who: "Harry Plummer" }, // 45-7
  { minute: 80, type: "ESSAI", isUsap: true, who: "Pietro Ceccarelli" }, // 45-12
  { minute: 81, type: "TRANSFORMATION", isUsap: true, who: "Antoine Aucagne" }, // 45-14
],
  },
  // ---------------------------------------------------------------------------
  // J24 — Bordeaux Begles 37 - 32 Perpignan (2026-05-16)
  // ---------------------------------------------------------------------------
  {
    label: "J24",
    date: "2026-05-16",
    kickoffTime: "16:35",
    competitionShortName: "Top 14",
    opponentName: "Union Bordeaux-Bègles",
    opponentLabel: "Bordeaux-Bègles",
    venueName: "Stade Chaban-Delmas",
    matchday: 24,
    round: null,
    isHome: false,
    scoreUsap: 32,
    scoreOpponent: 37,
    halfTimeUsap: 24,
    halfTimeOpponent: 12,
    triesUsap: 4, conversionsUsap: 3, penaltiesUsap: 2, dropGoalsUsap: 0,
    triesOpponent: 5, conversionsOpponent: 3, penaltiesOpponent: 2, dropGoalsOpponent: 0,
    bonusOffensif: false,
    bonusDefensif: true,
    referee: { firstName: "Tual", lastName: "Trainini" },
    videoUrl: "https://www.youtube.com/watch?v=UtA2XZnG9SY",
    report:
      "L'USAP passe tout près de l'exploit à Chaban-Delmas. Essai de Joseph dès la 1re minute, puis Ruiz (16') et McIntyre (27') : les Catalans mènent 24-12 à la pause, Tedder assurant un sans-faute au pied. Mais McIntyre est sanctionné d'un carton jaune juste avant la mi-temps et l'UBB revient en trombe : Bielle-Biarrey (42') et Cazeaux (45') recollent, Petaia (50') redonne l'avantage à l'USAP, avant que Bielle-Biarrey (57') puis deux pénalités de Lucu (67', 73') ne renversent définitivement le match. Défaite 32-37 avec le bonus défensif.",
    usapSquad: [
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 47 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subOut: 61 },
  { num: 3, firstName: "Kieran", lastName: "Brookes", position: Position.PILIER_DROIT, isStarter: true, subOut: 61 },
  { num: 4, firstName: "Jonny", lastName: "Gray", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 71 },
  { num: 5, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true, isCaptain: true, subOut: 50 },
  { num: 6, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 50 },
  { num: 7, firstName: "Maxwell", lastName: "Hicks", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 71 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, firstName: "James", lastName: "Hall", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 66 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subOut: 63 },
  { num: 11, firstName: "Théo", lastName: "Forner", position: Position.AILIER, isStarter: true },
  { num: 12, firstName: "Diego", lastName: "Mascarenc", position: Position.CENTRE, isStarter: true, subOut: 63 },
  { num: 13, firstName: "Eneriko", lastName: "Buliruarua", position: Position.CENTRE, isStarter: true, subOut: 45 },
  { num: 14, firstName: "Jefferson-Lee", lastName: "Joseph", position: Position.AILIER, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
  { num: 15, firstName: "Tristan James", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, tries: 0, conversions: 3, penalties: 2, dropGoals: 0, totalPoints: 12, subOut: 56 },
  { num: 16, firstName: "Victor", lastName: "Montgaillard", position: Position.TALONNEUR, isStarter: false, subIn: 61 },
  { num: 17, firstName: "Bruce", lastName: "Devaux", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 47 },
  { num: 18, firstName: "Adrien", lastName: "Warion", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 50 },
  { num: 19, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: false, subIn: 50 },
  { num: 20, firstName: "Gela", lastName: "Aprasidze", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 66 },
  { num: 21, firstName: "Antoine", lastName: "Aucagne", position: Position.DEMI_OUVERTURE, isStarter: false, subIn: 56 },
  { num: 22, firstName: "Jordan", lastName: "Petaia", position: Position.AILIER, isStarter: false, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subIn: 45 },
  { num: 23, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false, subIn: 61 },
],
oppSquad: [
  { num: 1, name: "Jefferson Poirot", position: Position.PILIER_GAUCHE, isStarter: true, isCaptain: true, subOut: 58 },
  { num: 2, name: "Connor Sa", position: Position.TALONNEUR, isStarter: true, subOut: 41 },
  { num: 3, name: "Carlu Sadie", position: Position.PILIER_DROIT, isStarter: true, subOut: 58 },
  { num: 4, name: "Lachlan Swinton", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Cyril Cazeaux", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Pierre Bochaton", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 68 },
  { num: 7, name: "Bastien Vergnes-Taillefer", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 41 },
  { num: 8, name: "Cameron Woki", position: Position.NUMERO_HUIT, isStarter: true, subOut: 74 },
  { num: 9, name: "Martin Page-Relo", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 41 },
  { num: 10, name: "Matthieu Jalibert", position: Position.DEMI_OUVERTURE, isStarter: true },
  { num: 11, name: "Madosh Tambwe", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Adrien Drault", position: Position.CENTRE, isStarter: true, subOut: 41 },
  { num: 13, name: "Damian Penaud", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Arthur Retiere", position: Position.AILIER, isStarter: true, subOut: 41 },
  { num: 15, name: "Romain Buros", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Gaetan Barlot", position: Position.TALONNEUR, isStarter: false, subIn: 41 },
  { num: 17, name: "Matis Perchaud", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 58 },
  { num: 18, name: "Adam Zapedowski", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 68 },
  { num: 19, name: "Marko Gazzotti", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 41 },
  { num: 20, name: "Maxime Lucu", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 41 },
  { num: 21, name: "Yoram Moefana", position: Position.CENTRE, isStarter: false, subIn: 41 },
  { num: 22, name: "Louis Bielle-Biarrey", position: Position.AILIER, isStarter: false, subIn: 41 },
  { num: 23, name: "Sipili Falatea", position: Position.PILIER_DROIT, isStarter: false, subIn: 58 },
],
events: [
  { minute: 1, type: "ESSAI", isUsap: true, who: "Jefferson-Lee Joseph" }, // 0-5
  { minute: 2, type: "TRANSFORMATION", isUsap: true, who: "Tristan James Tedder" }, // 0-7
  { minute: 10, type: "ESSAI", isUsap: false, who: "Cameron Woki" }, // 5-7
  { minute: 11, type: "TRANSFORMATION", isUsap: false, who: "Matthieu Jalibert" }, // 7-7
  { minute: 16, type: "ESSAI", isUsap: true, who: "Ignacio Ruiz" }, // 7-12
  { minute: 17, type: "TRANSFORMATION", isUsap: true, who: "Tristan James Tedder" }, // 7-14
  { minute: 27, type: "ESSAI", isUsap: true, who: "Jake McIntyre" }, // 7-19
  { minute: 28, type: "TRANSFORMATION", isUsap: true, who: "Tristan James Tedder" }, // 7-21
  { minute: 35, type: "ESSAI", isUsap: false, who: "Romain Buros" }, // 12-21
  { minute: 39, type: "PENALITE", isUsap: true, who: "Tristan James Tedder" }, // 12-24
  { minute: 41, type: "CARTON_JAUNE", isUsap: true, who: "Jake McIntyre" }, // 12-24
  { minute: 42, type: "ESSAI", isUsap: false, who: "Louis Bielle-Biarrey" }, // 17-24
  { minute: 43, type: "TRANSFORMATION", isUsap: false, who: "Maxime Lucu" }, // 19-24
  { minute: 45, type: "ESSAI", isUsap: false, who: "Cyril Cazeaux" }, // 24-24
  { minute: 46, type: "TRANSFORMATION", isUsap: false, who: "Maxime Lucu" }, // 26-24
  { minute: 50, type: "ESSAI", isUsap: true, who: "Jordan Petaia" }, // 26-29
  { minute: 57, type: "ESSAI", isUsap: false, who: "Louis Bielle-Biarrey" }, // 31-29
  { minute: 66, type: "PENALITE", isUsap: true, who: "Tristan James Tedder" }, // 31-32
  { minute: 67, type: "PENALITE", isUsap: false, who: "Maxime Lucu" }, // 34-32
  { minute: 73, type: "PENALITE", isUsap: false, who: "Maxime Lucu" }, // 37-32
  { minute: 81, type: "CARTON_JAUNE", isUsap: false, who: "Jefferson Poirot" }, // 37-32
],
  },
  // ---------------------------------------------------------------------------
  // J25 — Perpignan 29 - 27 Castres Olympique (2026-05-30)
  // ---------------------------------------------------------------------------
  {
    label: "J25",
    date: "2026-05-30",
    kickoffTime: "14:30",
    competitionShortName: "Top 14",
    opponentName: "Castres Olympique",
    opponentLabel: "Castres",
    venueName: "Stade Aimé-Giral",
    matchday: 25,
    round: null,
    isHome: true,
    scoreUsap: 29,
    scoreOpponent: 27,
    halfTimeUsap: 10,
    halfTimeOpponent: 17,
    triesUsap: 4, conversionsUsap: 3, penaltiesUsap: 1, dropGoalsUsap: 0,
    triesOpponent: 4, conversionsOpponent: 2, penaltiesOpponent: 1, dropGoalsOpponent: 0,
    bonusOffensif: false,
    bonusDefensif: false,
    referee: { firstName: "Kévin", lastName: "Bralley" },
    videoUrl: "https://www.youtube.com/watch?v=pp1Itk9bi8s",
    report:
      "Dernier match de la saison à Aimé-Giral, sans enjeu comptable pour personne : l'USAP est déjà condamnée à l'access match et Castres n'a plus rien à jouer. Les Catalans cherchent surtout de la confiance à deux semaines d'Aix. Menés 10-17 à la pause après les essais de Ramototabua (7'), Durand (32') et Botitu (37'), ils renversent le match en seconde période : Tuilagi (52'), de retour de blessure, puis Hicks (56') profitant du carton jaune de Durand. Castres repasse devant par Ramototabua (65') et mène encore 27-22 à une minute de la fin. Sur le dernier ballon, un gros travail de Jefferson-Lee Joseph et une ultime passe de Tommaso Allan libèrent Duguivalu, qui plonge entre les poteaux ; Kévin Bralley valide l'essai après un long recours à l'arbitrage vidéo, Urdapilleta transforme. 29-27. Trois des quatre essais catalans sont inscrits par des joueurs sur le départ (Allan, Hicks, Duguivalu).",
    usapSquad: [
  { num: 1, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 36 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, subOut: 41 },
  { num: 3, firstName: "Kieran", lastName: "Brookes", position: Position.PILIER_DROIT, isStarter: true, subOut: 36 },
  { num: 4, firstName: "Jonny", lastName: "Gray", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, firstName: "Mathieu", lastName: "Tanguy", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 49 },
  { num: 6, firstName: "Maxwell", lastName: "Hicks", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
  { num: 7, firstName: "Mattéo", lastName: "Le Corvec", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 41 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, firstName: "James", lastName: "Hall", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 51 },
  { num: 10, firstName: "Benjamin", lastName: "Urdapilleta", position: Position.DEMI_OUVERTURE, isStarter: true, tries: 0, conversions: 3, penalties: 1, dropGoals: 0, totalPoints: 9 },
  { num: 11, firstName: "Théo", lastName: "Forner", position: Position.AILIER, isStarter: true, subOut: 77 },
  { num: 12, firstName: "Jerónimo", lastName: "De La Fuente", position: Position.CENTRE, isStarter: true },
  { num: 13, firstName: "Alivereti", lastName: "Duguivalu", position: Position.CENTRE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5 },
  { num: 14, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: true, subOut: 49 },
  { num: 15, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subOut: 62 },
  { num: 16, firstName: "Sama", lastName: "Malolo", position: Position.TALONNEUR, isStarter: false, subIn: 41 },
  { num: 17, firstName: "Bruce", lastName: "Devaux", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 36 },
  { num: 18, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: false, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subIn: 49 },
  { num: 19, firstName: "Jacobus", lastName: "Van Tonder", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 41 },
  { num: 20, firstName: "Tom", lastName: "Ecochard", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 51 },
  { num: 21, firstName: "Jefferson-Lee", lastName: "Joseph", position: Position.AILIER, isStarter: false, subIn: 49 },
  { num: 22, firstName: "Jordan", lastName: "Petaia", position: Position.AILIER, isStarter: false, subIn: 62 },
  { num: 23, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false, subIn: 36 },
],
oppSquad: [
  { num: 1, name: "Lois Guerois-Galisson", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 60 },
  { num: 2, name: "Teddy Durand", position: Position.TALONNEUR, isStarter: true, subOut: 68 },
  { num: 3, name: "Will Collier", position: Position.PILIER_DROIT, isStarter: true, subOut: 49 },
  { num: 4, name: "Gauthier Maravat", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 55 },
  { num: 5, name: "Florent Vanverberghe", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 49 },
  { num: 6, name: "Mathieu Babillot", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 69 },
  { num: 7, name: "Baptiste Cope", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 41 },
  { num: 8, name: "Veresa Ramototabua", position: Position.NUMERO_HUIT, isStarter: true, subOut: 68 },
  { num: 9, name: "Gauthier Doubrere", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 53 },
  { num: 10, name: "Pierre Popelin", position: Position.DEMI_OUVERTURE, isStarter: true, subOut: 49 },
  { num: 11, name: "Remy Baget", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Adrea Cocagi", position: Position.CENTRE, isStarter: true, subOut: 72 },
  { num: 13, name: "Vilimoni Botitu", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Christian Ambadiang", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Theo Chabouni", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Pierre Colonna", position: Position.TALONNEUR, isStarter: false, subIn: 68 },
  { num: 17, name: "Atunaisa Sokobale", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 60 },
  { num: 18, name: "Tom Staniforth", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 49 },
  { num: 19, name: "Guillaume Ducat", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 55 },
  { num: 20, name: "Baptiste Delaporte", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 41 },
  { num: 21, name: "Colin Dupuy", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 53 },
  { num: 22, name: "Louis Le Brun", position: Position.DEMI_OUVERTURE, isStarter: false, subIn: 49 },
  { num: 23, name: "Nicolas Corato", position: Position.PILIER_DROIT, isStarter: false, subIn: 49 },
],
events: [
  { minute: 7, type: "ESSAI", isUsap: false, who: "Veresa Ramototabua" }, // 0-5
  { minute: 11, type: "ESSAI", isUsap: true, who: "Tommaso Allan" }, // 5-5
  { minute: 12, type: "TRANSFORMATION", isUsap: true, who: "Benjamin Urdapilleta" }, // 7-5
  { minute: 25, type: "PENALITE", isUsap: true, who: "Benjamin Urdapilleta" }, // 10-5
  { minute: 32, type: "ESSAI", isUsap: false, who: "Teddy Durand" }, // 10-10
  { minute: 32, type: "TRANSFORMATION", isUsap: false, who: "Pierre Popelin" }, // 10-12
  { minute: 37, type: "ESSAI", isUsap: false, who: "Vilimoni Botitu" }, // 10-17
  { minute: 52, type: "ESSAI", isUsap: true, who: "Posolo Tuilagi" }, // 15-17
  { minute: 52, type: "TRANSFORMATION", isUsap: true, who: "Benjamin Urdapilleta" }, // 17-17
  { minute: 56, type: "ESSAI", isUsap: true, who: "Maxwell Hicks" }, // 22-17
  { minute: 56, type: "CARTON_JAUNE", isUsap: false, who: "Teddy Durand" }, // 17-17
  { minute: 60, type: "PENALITE", isUsap: false, who: "Louis Le Brun" }, // 17-20
  { minute: 65, type: "ESSAI", isUsap: false, who: "Veresa Ramototabua" }, // 17-25
  { minute: 66, type: "TRANSFORMATION", isUsap: false, who: "Louis Le Brun" }, // 17-27
  { minute: 80, type: "ESSAI", isUsap: true, who: "Alivereti Duguivalu" }, // 22-27
  { minute: 81, type: "TRANSFORMATION", isUsap: true, who: "Benjamin Urdapilleta" }, // 24-27
],
  },
  // ---------------------------------------------------------------------------
  // J26 — Bayonne 52 - 7 Perpignan (2026-06-06)
  // ---------------------------------------------------------------------------
  {
    label: "J26",
    date: "2026-06-06",
    kickoffTime: "21:05",
    competitionShortName: "Top 14",
    opponentName: "Aviron Bayonnais",
    opponentLabel: "Bayonne",
    venueName: "Stade Jean-Dauger",
    matchday: 26,
    round: null,
    isHome: false,
    scoreUsap: 7,
    scoreOpponent: 52,
    halfTimeUsap: 0,
    halfTimeOpponent: 21,
    triesUsap: 1, conversionsUsap: 1, penaltiesUsap: 0, dropGoalsUsap: 0,
    triesOpponent: 8, conversionsOpponent: 6, penaltiesOpponent: 0, dropGoalsOpponent: 0,
    bonusOffensif: false,
    bonusDefensif: false,
    referee: { firstName: "Pierre", lastName: "Bru" },
    videoUrl: "https://www.youtube.com/watch?v=QGHqNXsStYY",
    report:
      "Dernière journée sans enjeu de classement pour l'USAP, déjà assurée de disputer l'access match, qui se déplace à Jean-Dauger avec une équipe très remaniée : Boyer Gallardo, Taty, Sol et Dubois sont alignés d'entrée, Aprasidze et McIntyre forment la charnière. Bayonne déroule : huit essais, dont un doublé de Spring et un de Martin, et un sans-faute de Segonds au pied (5/5). Lotrian sauve l'honneur catalan (48'), transformé par Tedder, lui-même sanctionné d'un carton jaune à la 79e. Défaite 7-52, la plus lourde de la saison, avec bonus offensif pour l'Aviron.",
    usapSquad: [
  { num: 1, firstName: "Lorencio", lastName: "Boyer Gallardo", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 46 },
  { num: 2, firstName: "Sama", lastName: "Malolo", position: Position.TALONNEUR, isStarter: true, subOut: 46 },
  { num: 3, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT, isStarter: true, subOut: 72 },
  { num: 4, firstName: "Adrien", lastName: "Warion", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 72 },
  { num: 6, firstName: "Simon", lastName: "Taty", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 55 },
  { num: 7, firstName: "Mattéo", lastName: "Le Corvec", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 66 },
  { num: 8, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, firstName: "Gela", lastName: "Aprasidze", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 73 },
  { num: 10, firstName: "Jake", lastName: "McIntyre", position: Position.DEMI_OUVERTURE, isStarter: true, subOut: 60 },
  { num: 11, firstName: "Simon", lastName: "Sol", position: Position.AILIER, isStarter: true },
  { num: 12, firstName: "Diego", lastName: "Mascarenc", position: Position.CENTRE, isStarter: true, subOut: 55 },
  { num: 13, firstName: "Eneriko", lastName: "Buliruarua", position: Position.CENTRE, isStarter: true, subOut: 64 },
  { num: 14, firstName: "Lucas", lastName: "Dubois", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Tristan James", lastName: "Tedder", position: Position.ARRIERE, isStarter: true, tries: 0, conversions: 1, penalties: 0, dropGoals: 0, totalPoints: 2, subOut: 60 },
  { num: 16, firstName: "Mathys", lastName: "Lotrian", position: Position.TALONNEUR, isStarter: false, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subIn: 46 },
  { num: 17, firstName: "Nemo", lastName: "Roelofse", position: Position.PILIER_DROIT, isStarter: false, subIn: 46 },
  { num: 18, firstName: "Thomas", lastName: "Serezat", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 55 },
  { num: 19, firstName: "Patrick", lastName: "Sobela", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 66 },
  { num: 20, firstName: "Mayron", lastName: "Fahy", position: Position.ARRIERE, isStarter: false, subIn: 60 },
  { num: 21, firstName: "Gabin", lastName: "Kretchmann", position: Position.CENTRE, isStarter: false, subIn: 60 },
  { num: 22, firstName: "Job", lastName: "Poulet", position: Position.CENTRE, isStarter: false, subIn: 55 },
  { num: 23, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: false },
],
oppSquad: [
  { num: 1, name: "Swan Cormenier", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 24 },
  { num: 2, name: "Lucas Martin", position: Position.TALONNEUR, isStarter: true, subOut: 55 },
  { num: 3, name: "Luke Tagi", position: Position.PILIER_DROIT, isStarter: true, subOut: 55 },
  { num: 4, name: "Ewan Johnson", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Alex Moon", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 64 },
  { num: 6, name: "Alexandre Fischer", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 57 },
  { num: 7, name: "Arthur Iturria", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 72 },
  { num: 8, name: "Esteban Capilla", position: Position.NUMERO_HUIT, isStarter: true },
  { num: 9, name: "Maxime Machenaud", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 46 },
  { num: 10, name: "Joris Segonds", position: Position.DEMI_OUVERTURE, isStarter: true, subOut: 71 },
  { num: 11, name: "Cheikh Tiberghien", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Manu Tuilagi", position: Position.CENTRE, isStarter: true, subOut: 60 },
  { num: 13, name: "Arnaud Erbinartegaray", position: Position.CENTRE, isStarter: true },
  { num: 14, name: "Tom Spring", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Yohan Orabe", position: Position.ARRIERE, isStarter: true, subOut: 55 },
  { num: 16, name: "Vincent Giudicelli", position: Position.TALONNEUR, isStarter: false, subIn: 55 },
  { num: 17, name: "Emerick Setiano", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 24 },
  { num: 18, name: "Lucas Paulos", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 64 },
  { num: 19, name: "Noa Traversier", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 57 },
  { num: 20, name: "Baptiste Germain", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 46 },
  { num: 21, name: "Federico Mori", position: Position.CENTRE, isStarter: false, subIn: 60 },
  { num: 22, name: "Victor Hannoun", position: Position.ARRIERE, isStarter: false, subIn: 55 },
  { num: 23, name: "Pascal Cotet", position: Position.PILIER_DROIT, isStarter: false, subIn: 55 },
],
events: [
  { minute: 1, type: "ESSAI", isUsap: false, who: "Tom Spring" }, // 5-0
  { minute: 2, type: "TRANSFORMATION", isUsap: false, who: "Joris Segonds" }, // 7-0
  { minute: 15, type: "ESSAI", isUsap: false, who: "Maxime Machenaud" }, // 12-0
  { minute: 17, type: "TRANSFORMATION", isUsap: false, who: "Joris Segonds" }, // 14-0
  { minute: 30, type: "ESSAI", isUsap: false, who: "Lucas Martin" }, // 19-0
  { minute: 31, type: "TRANSFORMATION", isUsap: false, who: "Joris Segonds" }, // 21-0
  { minute: 45, type: "ESSAI", isUsap: false, who: "Lucas Martin" }, // 26-0
  { minute: 46, type: "TRANSFORMATION", isUsap: false, who: "Joris Segonds" }, // 28-0
  { minute: 48, type: "ESSAI", isUsap: true, who: "Mathys Lotrian" }, // 28-5
  { minute: 49, type: "TRANSFORMATION", isUsap: true, who: "Tristan James Tedder" }, // 28-7
  { minute: 50, type: "ESSAI", isUsap: false, who: "Yohan Orabe" }, // 33-7
  { minute: 51, type: "TRANSFORMATION", isUsap: false, who: "Joris Segonds" }, // 35-7
  { minute: 62, type: "ESSAI", isUsap: false, who: "Federico Mori" }, // 40-7
  { minute: 69, type: "ESSAI", isUsap: false, who: "Tom Spring" }, // 45-7
  { minute: 79, type: "CARTON_JAUNE", isUsap: true, who: "Tristan James Tedder" }, // 45-7
  { minute: 80, type: "ESSAI", isUsap: false, who: "Vincent Giudicelli" }, // 50-7
  { minute: 81, type: "TRANSFORMATION", isUsap: false, who: "Baptiste Germain" }, // 52-7
],
  },
  // ---------------------------------------------------------------------------
  // Huitième de finale — Montpellier Herault 53 - 13 Perpignan (2026-04-04)
  // ---------------------------------------------------------------------------
  {
    label: "Huitième de finale",
    date: "2026-04-04",
    kickoffTime: "13:30",
    competitionShortName: "Challenge Européen",
    opponentName: "Montpellier Hérault Rugby",
    opponentLabel: "Montpellier",
    venueName: "GGL Stadium",
    matchday: null,
    round: "Huitième de finale",
    isHome: false,
    scoreUsap: 13,
    scoreOpponent: 53,
    halfTimeUsap: 6,
    halfTimeOpponent: 17,
    triesUsap: 1, conversionsUsap: 1, penaltiesUsap: 2, dropGoalsUsap: 0,
    triesOpponent: 9, conversionsOpponent: 4, penaltiesOpponent: 0, dropGoalsOpponent: 0,
    bonusOffensif: false,
    bonusDefensif: false,
    report:
      "Fin de parcours européen pour l'USAP, balayée au Septeo Stadium. Les Catalans mènent pourtant 6-5 après deux pénalités d'Aucagne (8', 25'), mais Montpellier inscrit neuf essais au total, dont un triplé de Rates. Ceccarelli marque le seul essai catalan (46'), transformé par Aucagne. Le carton jaune de Velarte (67') précède un dernier quart d'heure à sens unique. 53-13, l'USAP est éliminée en huitièmes de finale.",
    usapSquad: [
  { num: 1, firstName: "Giorgi", lastName: "Beria", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 53 },
  { num: 2, firstName: "Ignacio", lastName: "Ruiz", position: Position.TALONNEUR, isStarter: true, subOut: 60 },
  { num: 3, firstName: "Pietro", lastName: "Ceccarelli", position: Position.PILIER_DROIT, isStarter: true, tries: 1, conversions: 0, penalties: 0, dropGoals: 0, totalPoints: 5, subOut: 54 },
  { num: 4, firstName: "Adrien", lastName: "Warion", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, firstName: "Posolo", lastName: "Tuilagi", position: Position.DEUXIEME_LIGNE, isStarter: true, subOut: 60 },
  { num: 6, firstName: "Bastien", lastName: "Chinarro", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 7, firstName: "Mattéo", lastName: "Le Corvec", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 39 },
  { num: 8, firstName: "Joaquín", lastName: "Oviedo", position: Position.NUMERO_HUIT, isStarter: true, subOut: 66 },
  { num: 9, firstName: "James", lastName: "Hall", position: Position.DEMI_DE_MELEE, isStarter: true },
  { num: 10, firstName: "Antoine", lastName: "Aucagne", position: Position.DEMI_OUVERTURE, isStarter: true, tries: 0, conversions: 1, penalties: 2, dropGoals: 0, totalPoints: 8, subOut: 53 },
  { num: 11, firstName: "Théo", lastName: "Forner", position: Position.AILIER, isStarter: true, subOut: 62 },
  { num: 12, firstName: "Duncan", lastName: "Paia'aua", position: Position.CENTRE, isStarter: true },
  { num: 13, firstName: "Eneriko", lastName: "Buliruarua", position: Position.CENTRE, isStarter: true },
  { num: 14, firstName: "Maxim", lastName: "Granell", position: Position.AILIER, isStarter: true },
  { num: 15, firstName: "Mayron", lastName: "Fahy", position: Position.ARRIERE, isStarter: true },
  { num: 16, firstName: "Mathys", lastName: "Lotrian", position: Position.TALONNEUR, isStarter: false, subIn: 60 },
  { num: 17, firstName: "Giorgi", lastName: "Tetrashvili", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 53 },
  { num: 18, firstName: "Akato", lastName: "Fakatika", position: Position.PILIER_DROIT, isStarter: false, subIn: 54 },
  { num: 19, firstName: "Jonny", lastName: "Gray", position: Position.DEUXIEME_LIGNE, isStarter: false, subIn: 60 },
  { num: 20, firstName: "Maxwell", lastName: "Hicks", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 39 },
  { num: 21, firstName: "Lucas", lastName: "Velarte", position: Position.NUMERO_HUIT, isStarter: false, subIn: 66 },
  { num: 22, firstName: "Tavite", lastName: "Veredamu", position: Position.AILIER, isStarter: false, subIn: 62 },
  { num: 23, firstName: "Tommaso", lastName: "Allan", position: Position.ARRIERE, isStarter: false, subIn: 53 },
],
oppSquad: [
  { num: 1, name: "Enzo Forletta", position: Position.PILIER_GAUCHE, isStarter: true, subOut: 52 },
  { num: 2, name: "Lyam Akrab", position: Position.TALONNEUR, isStarter: true, subOut: 52 },
  { num: 3, name: "Wilfrid Hounkpatin", position: Position.PILIER_DROIT, isStarter: true, subOut: 52 },
  { num: 4, name: "Adam Beard", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 5, name: "Bastien Chalureau", position: Position.DEUXIEME_LIGNE, isStarter: true },
  { num: 6, name: "Yacouba Camara", position: Position.TROISIEME_LIGNE_AILE, isStarter: true, subOut: 66 },
  { num: 7, name: "Lenni Nouchi", position: Position.TROISIEME_LIGNE_AILE, isStarter: true },
  { num: 8, name: "Alexander Masibaka", position: Position.NUMERO_HUIT, isStarter: true, subOut: 56 },
  { num: 9, name: "Alexis Bernadet", position: Position.DEMI_DE_MELEE, isStarter: true, subOut: 48 },
  { num: 10, name: "Domingo Miotti", position: Position.DEMI_OUVERTURE, isStarter: true, subOut: 60 },
  { num: 11, name: "Melvyn Rates", position: Position.AILIER, isStarter: true },
  { num: 12, name: "Justo Piccardo", position: Position.CENTRE, isStarter: true },
  { num: 13, name: "Arthur Vincent", position: Position.CENTRE, isStarter: true, subOut: 69 },
  { num: 14, name: "Gabriel Ngandebe", position: Position.AILIER, isStarter: true },
  { num: 15, name: "Jon Echegaray", position: Position.ARRIERE, isStarter: true },
  { num: 16, name: "Ricky Riccitelli", position: Position.TALONNEUR, isStarter: false, subIn: 52 },
  { num: 17, name: "Valentin Welsch", position: Position.PILIER_GAUCHE, isStarter: false, subIn: 52 },
  { num: 18, name: "Mohamed Haouas", position: Position.PILIER_DROIT, isStarter: false, subIn: 52 },
  { num: 19, name: "Tyler Duguid", position: Position.TROISIEME_LIGNE_AILE, isStarter: false, subIn: 66 },
  { num: 20, name: "Billy Vunipola", position: Position.NUMERO_HUIT, isStarter: false, subIn: 56 },
  { num: 21, name: "Ali Price", position: Position.DEMI_DE_MELEE, isStarter: false, subIn: 48 },
  { num: 22, name: "Thomas Vincent", position: Position.DEMI_OUVERTURE, isStarter: false, subIn: 60 },
  { num: 23, name: "Auguste Cadot", position: Position.CENTRE, isStarter: false, subIn: 69 },
],
events: [
  { minute: 8, type: "PENALITE", isUsap: true, who: "Antoine Aucagne" }, // 0-3
  { minute: 14, type: "ESSAI", isUsap: false, who: "Melvyn Rates" }, // 5-3
  { minute: 25, type: "PENALITE", isUsap: true, who: "Antoine Aucagne" }, // 5-6
  { minute: 28, type: "ESSAI", isUsap: false, who: "Melvyn Rates" }, // 10-6
  { minute: 35, type: "ESSAI", isUsap: false, who: "Jon Echegaray" }, // 15-6
  { minute: 36, type: "TRANSFORMATION", isUsap: false, who: "Domingo Miotti" }, // 17-6
  { minute: 44, type: "ESSAI", isUsap: false, who: "Melvyn Rates" }, // 22-6
  { minute: 46, type: "ESSAI", isUsap: true, who: "Pietro Ceccarelli" }, // 22-11
  { minute: 47, type: "TRANSFORMATION", isUsap: true, who: "Antoine Aucagne" }, // 22-13
  { minute: 54, type: "ESSAI", isUsap: false, who: "Ali Price" }, // 27-13
  { minute: 58, type: "ESSAI", isUsap: false, who: "Justo Piccardo" }, // 32-13
  { minute: 67, type: "CARTON_JAUNE", isUsap: true, who: "Lucas Velarte" }, // 32-13
  { minute: 68, type: "ESSAI", isUsap: false, who: "Ricky Riccitelli" }, // 37-13
  { minute: 69, type: "TRANSFORMATION", isUsap: false, who: "Thomas Vincent" }, // 39-13
  { minute: 72, type: "ESSAI", isUsap: false, who: "Gabriel Ngandebe" }, // 44-13
  { minute: 73, type: "TRANSFORMATION", isUsap: false, who: "Thomas Vincent" }, // 46-13
  { minute: 75, type: "ESSAI", isUsap: false, who: "Ricky Riccitelli" }, // 51-13
  { minute: 76, type: "TRANSFORMATION", isUsap: false, who: "Thomas Vincent" }, // 53-13
],
  },
];

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/** Retrouve un joueur par nom, ou le crée s'il débute avec l'USAP. */
async function findOrCreatePlayer(
  firstName: string,
  lastName: string,
  position: Position,
): Promise<string> {
  const existing = await prisma.player.findFirst({
    where: {
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
  });
  if (existing) return existing.id;

  const player = await prisma.player.create({
    data: {
      firstName,
      lastName,
      position,
      isActive: true,
      slug: `temp-${Date.now()}-${Math.random()}`,
    },
  });
  await prisma.player.update({
    where: { id: player.id },
    data: { slug: generatePlayerSlug(firstName, lastName, player.id) },
  });
  console.log(`    [joueur] Créé : ${firstName} ${lastName}`);
  return player.id;
}

/** Retrouve un arbitre par nom, ou le crée. */
async function findOrCreateReferee(firstName: string, lastName: string): Promise<string> {
  const existing = await prisma.referee.findFirst({
    where: {
      firstName: { equals: firstName, mode: "insensitive" },
      lastName: { equals: lastName, mode: "insensitive" },
    },
  });
  if (existing) return existing.id;

  const referee = await prisma.referee.create({
    data: { firstName, lastName, slug: `temp-${Date.now()}` },
  });
  await prisma.referee.update({
    where: { id: referee.id },
    data: { slug: generateRefereeSlug(firstName, lastName, referee.id) },
  });
  console.log(`    [arbitre] Créé : ${firstName} ${lastName}`);
  return referee.id;
}

function computeResult(scoreUsap: number, scoreOpponent: number): MatchResult {
  if (scoreUsap > scoreOpponent) return MatchResult.VICTOIRE;
  if (scoreUsap < scoreOpponent) return MatchResult.DEFAITE;
  return MatchResult.NUL;
}

/** Score courant après chaque événement, pour alimenter les descriptions. */
function runningScore(m: MatchData, upTo: number): string {
  let usap = 0;
  let opp = 0;
  const pts = { ESSAI: 5, TRANSFORMATION: 2, PENALITE: 3, DROP: 3, ESSAI_PENALITE: 7 } as const;
  for (let i = 0; i <= upTo; i++) {
    const e = m.events[i];
    const v = pts[e.type as keyof typeof pts];
    if (!v) continue;
    if (e.isUsap) usap += v;
    else opp += v;
  }
  return m.isHome ? `${usap}-${opp}` : `${opp}-${usap}`;
}

const EVENT_LABELS: Record<string, string> = {
  ESSAI: "Essai",
  TRANSFORMATION: "Transformation",
  PENALITE: "Pénalité",
  DROP: "Drop",
  ESSAI_PENALITE: "Essai de pénalité",
  CARTON_JAUNE: "Carton jaune pour",
  CARTON_ROUGE: "Carton rouge pour",
};

// =============================================================================
// SCRIPT PRINCIPAL
// =============================================================================

async function main() {
  console.log("=== Fin de saison 2025-2026 : J21-J26 + 8e de Challenge ===\n");

  const season = await prisma.season.findFirstOrThrow({
    where: { startYear: 2025, endYear: 2026 },
  });

  for (const m of MATCHES) {
    console.log(`\n########## ${m.label} — ${m.opponentLabel} (${m.date}) ##########`);

    const competition = await prisma.competition.findFirstOrThrow({
      where: { shortName: m.competitionShortName },
    });
    const opponent = await prisma.opponent.findFirstOrThrow({
      where: { name: m.opponentName },
    });
    const venue = await prisma.venue.findFirst({ where: { name: m.venueName } });
    if (!venue) console.log(`  ⚠ stade introuvable : ${m.venueName}`);

    // ---- Match ------------------------------------------------------------
    const result = computeResult(m.scoreUsap, m.scoreOpponent);
    const refereeId = m.referee
      ? await findOrCreateReferee(m.referee.firstName, m.referee.lastName)
      : null;

    const common = {
      date: new Date(m.date),
      kickoffTime: m.kickoffTime,
      refereeId,
      videoUrl: m.videoUrl ?? null,
      seasonId: season.id,
      competitionId: competition.id,
      matchday: m.matchday,
      round: m.round,
      isHome: m.isHome,
      venueId: venue?.id ?? null,
      opponentId: opponent.id,
      scoreUsap: m.scoreUsap,
      scoreOpponent: m.scoreOpponent,
      halfTimeUsap: m.halfTimeUsap,
      halfTimeOpponent: m.halfTimeOpponent,
      result,
      bonusOffensif: m.bonusOffensif,
      bonusDefensif: m.bonusDefensif,
      triesUsap: m.triesUsap,
      conversionsUsap: m.conversionsUsap,
      penaltiesUsap: m.penaltiesUsap,
      dropGoalsUsap: m.dropGoalsUsap,
      penaltyTriesUsap: 0,
      triesOpponent: m.triesOpponent,
      conversionsOpponent: m.conversionsOpponent,
      penaltiesOpponent: m.penaltiesOpponent,
      dropGoalsOpponent: m.dropGoalsOpponent,
      penaltyTriesOpponent: 0,
      report: m.report,
    };

    let match = await prisma.match.findFirst({
      where: m.matchday
        ? { seasonId: season.id, competitionId: competition.id, matchday: m.matchday }
        : { seasonId: season.id, competitionId: competition.id, round: m.round },
    });

    if (match) {
      match = await prisma.match.update({ where: { id: match.id }, data: common });
      console.log(`  Match mis à jour : ${match.slug}`);
    } else {
      const slug = generateMatchSlug({
        competitionShortName: competition.shortName,
        competitionName: competition.name,
        opponentShortName: opponent.shortName,
        opponentName: opponent.name,
        isHome: m.isHome,
        matchday: m.matchday,
        round: m.round,
        date: new Date(m.date),
      });
      match = await prisma.match.create({ data: { slug, ...common } });
      console.log(`  Match créé : ${match.slug}`);
    }

    // ---- Composition USAP --------------------------------------------------
    await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
    const playerIds: Record<string, string> = {};

    for (const p of m.usapSquad) {
      const playerId = await findOrCreatePlayer(p.firstName, p.lastName, p.position);
      playerIds[`${p.firstName} ${p.lastName}`] = playerId;

      // Temps de jeu : 80' pour un titulaire non remplacé, sinon selon l'entrée/sortie
      const minutesPlayed = p.isStarter
        ? (p.subOut ?? 80)
        : p.subIn != null
          ? 80 - p.subIn
          : 0;

      await prisma.matchPlayer.create({
        data: {
          matchId: match.id,
          playerId,
          isOpponent: false,
          shirtNumber: p.num,
          isStarter: p.isStarter,
          isCaptain: p.isCaptain ?? false,
          positionPlayed: p.position,
          minutesPlayed,
          subIn: p.subIn ?? null,
          subOut: p.subOut ?? null,
          tries: p.tries ?? 0,
          conversions: p.conversions ?? 0,
          penalties: p.penalties ?? 0,
          dropGoals: p.dropGoals ?? 0,
          totalPoints: p.totalPoints ?? 0,
        },
      });

      // Lien joueur-saison
      const linked = await prisma.seasonPlayer.findFirst({
        where: { seasonId: season.id, playerId },
      });
      if (!linked) {
        await prisma.seasonPlayer.create({
          data: { seasonId: season.id, playerId, position: p.position },
        });
        console.log(`    [effectif] ${p.firstName} ${p.lastName} rattaché à la saison`);
      }
    }
    console.log(`  Composition USAP : ${m.usapSquad.length} joueurs`);

    // ---- Composition adverse ----------------------------------------------
    for (const p of m.oppSquad) {
      await prisma.matchPlayer.create({
        data: {
          matchId: match.id,
          isOpponent: true,
          opponentPlayerName: p.name,
          shirtNumber: p.num,
          isStarter: p.isStarter,
          isCaptain: p.isCaptain ?? false,
          positionPlayed: p.position,
          subIn: p.subIn ?? null,
          subOut: p.subOut ?? null,
        },
      });
    }
    console.log(`  Composition ${m.opponentLabel} : ${m.oppSquad.length} joueurs`);

    // ---- Cartons sur la feuille de match -----------------------------------
    for (const e of m.events) {
      if (e.type !== "CARTON_JAUNE" && e.type !== "CARTON_ROUGE") continue;
      const isYellow = e.type === "CARTON_JAUNE";
      const data = isYellow
        ? { yellowCard: true, yellowCardMin: e.minute }
        : { redCard: true, redCardMin: e.minute };
      const mp = await prisma.matchPlayer.findFirst({
        where: e.isUsap
          ? { matchId: match.id, isOpponent: false, playerId: playerIds[e.who] }
          : { matchId: match.id, isOpponent: true, opponentPlayerName: e.who },
      });
      if (mp) await prisma.matchPlayer.update({ where: { id: mp.id }, data });
    }

    // ---- Chronologie -------------------------------------------------------
    await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
    for (let i = 0; i < m.events.length; i++) {
      const e = m.events[i];
      const team = e.isUsap ? "USAP" : m.opponentLabel;
      const label = EVENT_LABELS[e.type];
      const isCard = e.type === "CARTON_JAUNE" || e.type === "CARTON_ROUGE";
      const description = isCard
        ? `${label} ${e.who} (${team}).`
        : `${label} de ${e.who} (${team}). ${runningScore(m, i)}.`;

      await prisma.matchEvent.create({
        data: {
          matchId: match.id,
          minute: e.minute,
          type: e.type,
          playerId: e.isUsap ? (playerIds[e.who] ?? null) : null,
          isUsap: e.isUsap,
          description,
        },
      });
    }
    console.log(`  Chronologie : ${m.events.length} événements`);
    console.log(
      `  Score : ${m.isHome ? "USAP" : m.opponentLabel} ` +
        `${m.isHome ? m.scoreUsap : m.scoreOpponent}-${m.isHome ? m.scoreOpponent : m.scoreUsap} ` +
        `${m.isHome ? m.opponentLabel : "USAP"} — ${result}`,
    );
  }

  console.log("\n=== Terminé : 7 matchs traités ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

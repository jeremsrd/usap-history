// =============================================================================
// Types principaux pour l'application USAP History
// =============================================================================

export type MatchResult = "VICTOIRE" | "DEFAITE" | "NUL";

export type Position =
  | "PILIER_GAUCHE"
  | "TALONNEUR"
  | "PILIER_DROIT"
  | "DEUXIEME_LIGNE"
  | "TROISIEME_LIGNE_AILE"
  | "NUMERO_HUIT"
  | "DEMI_DE_MELEE"
  | "DEMI_OUVERTURE"
  | "AILIER"
  | "CENTRE"
  | "ARRIERE";

export type Division =
  | "CHAMPIONNAT_1ERE_SERIE"
  | "CHAMPIONNAT_EXCELLENCE"
  | "GROUPE_A"
  | "PREMIERE_DIVISION"
  | "TOP_16"
  | "TOP_14"
  | "PRO_D2";

export type CompetitionType =
  | "CHAMPIONNAT"
  | "COUPE_EUROPE"
  | "CHALLENGE_EUROPE"
  | "COUPE_FRANCE"
  | "AMICAL"
  | "BARRAGES";

// Types UI (pour les composants, indépendants de Prisma)

export interface PlayerSummary {
  id: string;
  firstName: string;
  lastName: string;
  position: Position | null;
  photoUrl: string | null;
  birthDate: string | null;
}

export interface MatchSummary {
  id: string;
  date: string;
  opponentName: string;
  scoreUsap: number;
  scoreOpponent: number;
  result: MatchResult;
  competitionName: string;
  isHome: boolean;
}

export interface SeasonSummary {
  id: string;
  label: string;
  division: Division;
  finalRanking: number | null;
  champion: boolean;
  matchesPlayed: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
}

export interface StatEntry {
  label: string;
  value: number | string;
}

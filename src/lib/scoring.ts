// =============================================================================
// Barème de classement : points de match et bonus, par compétition et époque
// =============================================================================
//
// Les règles ont changé plusieurs fois. Une base qui remonte à 1902 ne peut
// donc pas appliquer une formule unique : le barème dépend de la compétition
// ET de la saison.
//
//   jusqu'en 2003-2004 championnats français : 3 points la victoire, 2 le nul,
//                      1 la défaite, AUCUN bonus. L'ancien barème récompensait
//                      la participation.
//
//   2004-2005          bascule complète vers le 4 / 2 / 0 international, avec
//                      introduction des bonus : 4 essais (quel que soit le
//                      résultat) et défaite de 7 points ou moins. Alignement
//                      sur l'hémisphère Sud et la Coupe du monde 2003.
//
//   2007-2008          la LNR adopte le différentiel de 3 essais pour le
//                      Top 14 et la Pro D2, afin d'empêcher les deux équipes
//                      de prendre le bonus offensif dans le même match.
//                      Le bonus défensif reste à 7 points.
//
//   2014-2015          le seuil défensif français passe de 7 à 5 points :
//                      à 5 points l'équipe menée n'est plus qu'à un essai de
//                      la victoire, ce qui l'incite à jouer plutôt qu'à gérer.
//
//   2026-2027          l'EPCR rejoint le différentiel de 3 essais pour ses
//                      coupes d'Europe. Le seuil défensif y reste à 7 points.
//
// Réserves, à lever avant d'attaquer les saisons anciennes (phase 4) :
//   - la saison d'application de 2004-2005 est attestée par les classements
//     d'époque (apparition d'une colonne bonus, et arithmétique : Toulon
//     champion de Pro D2 2004-05 avec 107 pts = 23 V ×4 + 1 N ×2 + 13 bonus,
//     là où Bayonne 2003-04 fait 74 pts = 21 V ×3 + 2 N ×2 + 7 D ×1). La date
//     de la décision du Comité directeur de la LNR, elle, n'est pas sourcée.
//   - la Wikipédia française laisse 2004-2007 dans le flou sur le seuil
//     défensif. C'était bien le standard 4 essais / 7 points, mais une source
//     primaire demanderait les règlements LNR de ces trois saisons, qui ne
//     sont plus en ligne.
//   - la date d'introduction des bonus dans les coupes d'Europe n'a pas été
//     vérifiée : le barème européen ci-dessous est supposé valable sur toute
//     la période couverte.
//
// Les matchs couperets (phases finales, barrages d'accession) n'attribuent
// aucun point de bonus.

export type TryBonusRule = "QUATRE_ESSAIS" | "DIFFERENTIEL_TROIS";

export interface BonusRules {
  tryBonus: TryBonusRule;
  /** Écart maximal, en points, ouvrant droit au bonus défensif. */
  losingMargin: number;
}

/** Compétitions européennes gérées par l'EPCR. */
function isEuropean(competitionShortName: string): boolean {
  return ["Challenge Européen", "H-Cup"].includes(competitionShortName);
}

/** Première saison où les championnats français attribuent des bonus. */
const PREMIERE_SAISON_BONUS_FR = 2004;

/** Compétitions sans points de bonus : matchs couperets par nature. */
function hasNoBonus(competitionShortName: string): boolean {
  return ["Barrages", "Du Manoir"].includes(competitionShortName);
}

/**
 * Barème applicable, ou `null` si la compétition ou la phase n'attribue pas
 * de bonus.
 *
 * @param seasonStartYear année de début de saison (2014 pour « 2014-2015 »)
 * @param isKnockout      phase finale : demi-finale, finale, huitième…
 */
export function bonusRulesFor(
  competitionShortName: string,
  seasonStartYear: number,
  isKnockout = false,
): BonusRules | null {
  if (isKnockout || hasNoBonus(competitionShortName)) return null;

  if (isEuropean(competitionShortName)) {
    return {
      tryBonus: seasonStartYear >= 2026 ? "DIFFERENTIEL_TROIS" : "QUATRE_ESSAIS",
      losingMargin: 7,
    };
  }

  // Championnats français : Top 14, Pro D2 et divisions historiques
  if (seasonStartYear < PREMIERE_SAISON_BONUS_FR) return null;

  return {
    tryBonus: seasonStartYear >= 2007 ? "DIFFERENTIEL_TROIS" : "QUATRE_ESSAIS",
    losingMargin: seasonStartYear >= 2014 ? 5 : 7,
  };
}

export interface BonusInput {
  competitionShortName: string;
  seasonStartYear: number;
  isKnockout?: boolean;
  scoreUsap: number;
  scoreOpponent: number;
  triesUsap: number | null;
  triesOpponent: number | null;
}

export interface BonusResult {
  bonusOffensif: boolean;
  bonusDefensif: boolean;
  /** Barème retenu, `null` si la rencontre n'attribue pas de bonus. */
  rules: BonusRules | null;
  /** Vrai si le nombre d'essais manque et empêche de trancher le bonus offensif. */
  triesMissing: boolean;
}

/**
 * Détermine les deux bonus d'une rencontre. Le bonus offensif ne peut pas être
 * calculé sans le détail des essais : dans ce cas il est renvoyé à `false` et
 * `triesMissing` est levé, à l'appelant de le signaler plutôt que de conclure.
 */
export function computeBonuses(input: BonusInput): BonusResult {
  const rules = bonusRulesFor(
    input.competitionShortName,
    input.seasonStartYear,
    input.isKnockout,
  );
  if (!rules) {
    return { bonusOffensif: false, bonusDefensif: false, rules: null, triesMissing: false };
  }

  const triesMissing = input.triesUsap == null || input.triesOpponent == null;

  const bonusOffensif = triesMissing
    ? false
    : rules.tryBonus === "DIFFERENTIEL_TROIS"
      ? input.triesUsap! - input.triesOpponent! >= 3
      : input.triesUsap! >= 4;

  const margin = input.scoreOpponent - input.scoreUsap;
  const bonusDefensif = margin > 0 && margin <= rules.losingMargin;

  return { bonusOffensif, bonusDefensif, rules, triesMissing };
}

export interface PointsScale {
  win: number;
  draw: number;
  loss: number;
}

/**
 * Barème de points d'un championnat français. Le 3 / 2 / 1 historique a laissé
 * place au 4 / 2 / 0 en 2004-2005, en même temps que l'arrivée des bonus.
 */
export function pointsScaleFor(seasonStartYear: number): PointsScale {
  return seasonStartYear < PREMIERE_SAISON_BONUS_FR
    ? { win: 3, draw: 2, loss: 1 }
    : { win: 4, draw: 2, loss: 0 };
}

/** Points de classement d'une rencontre, bonus compris. */
export function matchPoints(
  result: "VICTOIRE" | "NUL" | "DEFAITE",
  bonusOffensif: boolean,
  bonusDefensif: boolean,
  seasonStartYear: number,
): number {
  const scale = pointsScaleFor(seasonStartYear);
  const base =
    result === "VICTOIRE" ? scale.win : result === "NUL" ? scale.draw : scale.loss;
  return base + (bonusOffensif ? 1 : 0) + (bonusDefensif ? 1 : 0);
}

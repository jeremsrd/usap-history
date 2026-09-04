/**
 * La période d'exercice d'un dirigeant ou d'un entraîneur, **déduite des
 * saisons que la base lui attache**.
 *
 * `President.startYear` et `endYear` existent, mais deux présidents sur quatre
 * les ont vides ; `Coach` n'a pas de colonne de dates du tout. Les saisons,
 * elles, sont toujours là — c'est donc d'elles qu'on tire l'ordre des listes,
 * plutôt que d'un champ à moitié rempli qui faisait remonter en tête les
 * fiches sans année.
 *
 * **C'est la période couverte par la base, pas le mandat.** Marcel Dagrenat
 * paraît ainsi de 2004-2005 à 2006-2007 parce que l'archive de la LNR ne
 * remonte pas plus haut, et non parce qu'il aurait pris ses fonctions en 2004.
 */
export interface Periode {
  /** Première saison, par son libellé — « 2004-2005 ». */
  premiere: string;
  derniere: string;
  /** Années de début, pour le tri. */
  debut: number;
  fin: number;
}

export function periodeDesSaisons(
  saisons: Array<{ label: string; startYear: number }>,
): Periode | null {
  if (saisons.length === 0) return null;
  const triees = [...saisons].sort((a, b) => a.startYear - b.startYear);
  const premiere = triees[0];
  const derniere = triees[triees.length - 1];
  return {
    premiere: premiere.label,
    derniere: derniere.label,
    debut: premiere.startYear,
    fin: derniere.startYear,
  };
}

/** « 2012-2013 » pour une saison, « 2004-2005 → 2006-2007 » pour plusieurs. */
export function libellePeriode(periode: Periode | null): string | null {
  if (!periode) return null;
  return periode.premiere === periode.derniere
    ? periode.premiere
    : `${periode.premiere} → ${periode.derniere}`;
}

/**
 * Du plus récent au plus ancien, comme partout ailleurs sur le site. À
 * dernière saison égale, celui qui a commencé le plus tôt passe devant.
 */
export function duPlusRecent(a: Periode | null, b: Periode | null): number {
  if (!a) return b ? 1 : 0;
  if (!b) return -1;
  return b.fin - a.fin || a.debut - b.debut;
}

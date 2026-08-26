/**
 * Rapprochement des noms de joueurs entre une source et la base.
 *
 * Aucune source n'écrit un nom comme la précédente, et la base porte encore
 * les choix d'imports successifs. Les écarts rencontrés, tous réels :
 *
 *   accents et casse        « Bécognée » / « BECOGNEE »
 *   ponctuation             « Guerois-Galisson » / « Guerois Galisson »
 *   nom composé tronqué     « Priso » pour Priso Mouangue
 *   coupure différente      la LNR écrit « Levani Botia | VEIVUKE », la base
 *                           « Levani | Botia » — le nom de famille de l'un est
 *                           le prénom de l'autre
 *   second prénom ajouté    « Komiti Junior Alainuuese » / « Komiti Alainu'uese »
 *   diminutif               « Billy » pour Viliami Vunipola, « Harry » pour
 *                           Harrison Plummer, « Tom » pour Thomas Staniforth
 *
 * D'où la règle : comparer les **noms complets** mot à mot, jamais le seul nom
 * de famille, et accepter qu'un mot en abrège un autre.
 */

/** Sans accent, sans casse, sans ponctuation. */
export function normalize(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

/**
 * Mots significatifs d'un nom. On coupe sur les espaces et les traits d'union,
 * jamais sur l'apostrophe : « Alainu'uese » et « Ma'afu » sont d'un seul
 * tenant. Les mots de moins de trois lettres (« le », « de », « van ») sont
 * écartés, trop communs pour identifier quiconque.
 */
export function mots(nom: string): string[] {
  return nom
    .split(/[\s-]+/)
    .map(normalize)
    .filter((mot) => mot.length >= 3);
}

/** Un mot en vaut un autre s'il en est le début : « Nafi » pour « Nafitalai ». */
export function memeMot(a: string, b: string): boolean {
  return a === b || a.startsWith(b) || b.startsWith(a);
}

/** Mots de `nom` sans correspondant dans `reference`. */
export function motsOrphelins(nom: string, reference: string): string[] {
  const cibles = mots(reference);
  return mots(nom).filter((mot) => !cibles.some((cible) => memeMot(mot, cible)));
}

/** Nombre de mots communs, et longueur du plus long d'entre eux. */
export function proximite(
  a: string,
  b: string,
): { communs: number; plusLong: number } {
  const x = mots(a);
  const y = mots(b);
  let communs = 0;
  let plusLong = 0;
  for (const mot of x) {
    const trouve = y.find((autre) => memeMot(mot, autre));
    if (!trouve) continue;
    communs++;
    plusLong = Math.max(plusLong, Math.min(mot.length, trouve.length));
  }
  return { communs, plusLong };
}

/**
 * Assez proches pour être la même personne ? Deux mots communs suffisent ; un
 * seul aussi, s'il est assez long — les diminutifs sont légion sur les
 * feuilles officielles, et seul le nom de famille relie alors les deux
 * écritures.
 */
export function memeJoueur(a: string, b: string): boolean {
  // Deux noms identiques à l'accent près : inutile d'aller plus loin. Ce
  // raccourci rattrape les noms trop courts pour la règle des mots — « Ali
  // Oz » n'a qu'un mot d'au moins trois lettres, son prénom.
  if (normalize(a) === normalize(b)) return true;
  const { communs, plusLong } = proximite(a, b);
  return communs >= 2 || (communs >= 1 && plusLong >= 4);
}

/**
 * Meilleur candidat d'une liste, ou `null`. Le dossard départage : deux frères
 * peuvent figurer sur la même feuille.
 */
export function meilleurCandidat<T>(
  candidats: T[],
  nomDe: (candidat: T) => string,
  numeroDe: (candidat: T) => number | null,
  nomCherche: string,
  numeroCherche: number,
): T | null {
  let meilleur: T | null = null;
  let note = 0;
  for (const candidat of candidats) {
    const nom = nomDe(candidat);
    if (!memeJoueur(nom, nomCherche)) continue;
    const { communs, plusLong } = proximite(nom, nomCherche);
    const valeur =
      communs * 10 + plusLong + (numeroDe(candidat) === numeroCherche ? 5 : 0);
    if (valeur > note) {
      note = valeur;
      meilleur = candidat;
    }
  }
  return meilleur;
}

/**
 * Les langues du site.
 *
 * **Le catalan n'est pas encore traduit** : il est déclaré, ses adresses
 * fonctionnent, et il rend le français en attendant. C'est délibéré — poser le
 * segment de langue dans l'URL coûte d'autant plus cher que le site grandit,
 * et il valait mieux le faire pendant qu'il est petit.
 *
 * Le catalan visé est celui de **Catalunya Nord**, le rossellonais : l'USAP
 * est un club nord-catalan, et un supporter d'ici entend la différence avec le
 * catalan de Barcelone.
 */
export const LANGUES = ["fr", "ca"] as const;

export type Langue = (typeof LANGUES)[number];

export const LANGUE_PAR_DEFAUT: Langue = "fr";

/** Nom de chaque langue, dans cette langue — c'est l'usage d'un sélecteur. */
export const NOM_DE_LA_LANGUE: Record<Langue, string> = {
  fr: "Français",
  ca: "Català",
};

export function estUneLangue(valeur: string): valeur is Langue {
  return (LANGUES as readonly string[]).includes(valeur);
}

/**
 * Préfixe un chemin interne de la langue courante.
 *
 * Les liens externes, les ancres et les chemins déjà préfixés sont rendus tels
 * quels : sans cette précaution, `#points` deviendrait `/fr#points` et
 * casserait les ancres de la page des réalisateurs.
 */
export function cheminLocalise(chemin: string, langue: Langue): string {
  if (!chemin.startsWith("/")) return chemin;
  const premier = chemin.split("/")[1];
  if (premier && estUneLangue(premier)) return chemin;
  return chemin === "/" ? `/${langue}` : `/${langue}${chemin}`;
}

/** La langue lue en tête d'un chemin, ou la langue par défaut. */
export function langueDuChemin(chemin: string): Langue {
  const premier = chemin.split("/")[1] ?? "";
  return estUneLangue(premier) ? premier : LANGUE_PAR_DEFAUT;
}

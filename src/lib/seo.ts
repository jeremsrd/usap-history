import type { Metadata } from "next";
import { LANGUES, LANGUE_PAR_DEFAUT, type Langue } from "@/i18n/langues";

/**
 * Les liens `hreflang`, et l'adresse canonique qui va avec.
 *
 * **Le site vit en deux langues sous deux adresses** — `/fr/records` et
 * `/ca/records` disent la même chose. Sans `hreflang`, un moteur les prend
 * pour deux pages concurrentes et n'en garde qu'une : c'est le contenu
 * catalan qui disparaîtrait, étant le moins lié. La balise dit au contraire
 * « ce sont deux versions d'une même page, sers celle de la langue du
 * lecteur ».
 *
 * Trois choses à savoir avant de s'en servir :
 *
 * 1. **Le chemin se donne sans son segment de langue** — « /records », et non
 *    « /fr/records ». La fonction préfixe elle-même, pour les deux langues,
 *    comme `cheminLocalise()` le fait pour les liens du site. L'accueil est
 *    « / ».
 * 2. **Les adresses sont absolues**, `hreflang` n'acceptant rien d'autre, et
 *    **le domaine est écrit ici, non lu dans l'environnement.** C'était
 *    d'abord `NEXT_PUBLIC_SITE_URL` ; cette variable vaut `http://localhost:3000`
 *    dans le `.env` du dépôt, ne sert nulle part ailleurs dans `src/`, et rien
 *    ne garantit sa valeur chez l'hébergeur. Une canonique qui désignerait
 *    `localhost` ou le domaine de préproduction serait **pire que pas de
 *    `hreflang` du tout** : elle demanderait aux moteurs de désindexer le site.
 *    Un domaine est un fait du site, comme le sang et or — il change une fois
 *    par décennie, et alors on change cette ligne.
 * 3. **`x-default` désigne le français**, langue par défaut du site et cible
 *    de la redirection de `src/middleware.ts` : c'est la version servie à un
 *    lecteur dont aucune langue ne correspond.
 *
 * Chaque page publique appelle cette fonction dans son `generateMetadata`.
 * Une page qui ne le fait pas n'a **pas** de `hreflang` : Next.js ne fusionne
 * pas `alternates` depuis le layout, et il n'y aurait de toute façon rien à
 * hériter, le layout ignorant le chemin de la page.
 *
 * L'admin et la page de connexion en sont volontairement dépourvus : ce ne
 * sont pas des pages publiques, et l'admin n'est pas traduit.
 */
export const SITE_URL = "https://www.usaphistoria.cat";

/** L'adresse absolue d'une page, dans une langue donnée. */
export function adresseAbsolue(langue: Langue, chemin: string): string {
  return `${SITE_URL}/${langue}${chemin === "/" ? "" : chemin}`;
}

export function liensAlternatifs(langue: Langue, chemin: string): Metadata["alternates"] {
  return {
    canonical: adresseAbsolue(langue, chemin),
    languages: {
      ...Object.fromEntries(LANGUES.map((l) => [l, adresseAbsolue(l, chemin)])),
      "x-default": adresseAbsolue(LANGUE_PAR_DEFAUT, chemin),
    },
  };
}

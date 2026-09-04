import { LANGUE_PAR_DEFAUT, type Langue } from "./langues";
import { fr } from "./fr";

/**
 * Le dictionnaire, et la façon d'y puiser.
 *
 * **Le français est la source.** `fr.ts` porte toutes les phrases du site ;
 * les autres langues sont des réponses à celui-là, et une entrée qui leur
 * manque **retombe sur le français** plutôt que d'afficher une clé nue. Un
 * lecteur préfère une phrase dans la mauvaise langue à `joueurs.titre`.
 *
 * **Les clés sont explicites, non les phrases françaises elles-mêmes.** La
 * tentation était grande d'écrire `t("Joueurs")` et de faire du français sa
 * propre clé : c'est plus court, mais ce site porte des paragraphes entiers —
 * les réserves de couverture des classements en font trois lignes —, et une
 * clé de trois lignes ne se relit pas.
 *
 * **Le pluriel se demande à `Intl`**, non à un `n > 1 ? "s" : ""` recopié
 * partout. Les deux langues ne l'accordent pas pareil : le français écrit
 * « 0 joueur » au singulier, le catalan « 0 jugadors » au pluriel. La règle
 * appartient à la langue, pas à la page.
 */
export type Dictionnaire = typeof fr;

/** Une entrée : une phrase, ou ses formes de pluriel. */
export type Entree = string | { one: string; other: string };

const PAR_LANGUE: Record<Langue, () => Promise<{ default: unknown }>> = {
  fr: async () => ({ default: fr }),
  // Le catalan n'existe pas encore : il rend le français, et la page le sait.
  ca: async () => ({ default: fr }),
};

function descendre(objet: unknown, cle: string): unknown {
  return cle
    .split(".")
    .reduce<unknown>(
      (n, part) =>
        n && typeof n === "object" ? (n as Record<string, unknown>)[part] : undefined,
      objet,
    );
}

/** Remplace `{n}`, `{nom}`… par les valeurs fournies. */
function remplir(phrase: string, valeurs?: Record<string, string | number>): string {
  if (!valeurs) return phrase;
  return phrase.replace(/\{(\w+)\}/g, (entier, nom) =>
    nom in valeurs ? String(valeurs[nom]) : entier,
  );
}

export type Traduire = (
  cle: string,
  valeurs?: Record<string, string | number>,
) => string;

export async function dictionnaire(langue: Langue): Promise<Traduire> {
  const charge = await PAR_LANGUE[langue]();
  const table = charge.default;
  const pluriel = new Intl.PluralRules(langue);

  return (cle, valeurs) => {
    const trouve = descendre(table, cle) ?? descendre(fr, cle);
    if (trouve === undefined) {
      // Une clé absente est une faute de frappe, pas une traduction manquante :
      // la rendre visible plutôt que d'afficher du vide.
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[i18n] clé inconnue : ${cle}`);
      }
      return cle;
    }
    if (typeof trouve === "string") return remplir(trouve, valeurs);
    if (typeof trouve === "object" && trouve !== null && "other" in trouve) {
      const formes = trouve as { one: string; other: string };
      const n = Number(valeurs?.n ?? 0);
      const forme = pluriel.select(n) === "one" ? formes.one : formes.other;
      return remplir(forme, valeurs);
    }
    return cle;
  };
}

export { LANGUE_PAR_DEFAUT };

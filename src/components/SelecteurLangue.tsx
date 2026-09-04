"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  LANGUES,
  NOM_DE_LA_LANGUE,
  cheminEnLangue,
  langueDuChemin,
  type Langue,
} from "@/i18n/langues";
import { cn } from "@/lib/utils";

/**
 * Le passage d'une langue à l'autre, sans quitter la page qu'on lit.
 *
 * **Les drapeaux sont dessinés, non pris aux emoji.** Unicode n'a pas de
 * senyera : son jeu de drapeaux régionaux s'arrête à l'Angleterre, l'Écosse et
 * le pays de Galles. Rendre le catalan par 🇪🇸 serait faux — le catalan de ce
 * site est celui de Catalunya Nord, qui est en France. Deux SVG de quelques
 * lignes règlent la question, et rendent partout pareil.
 *
 * **Un drapeau seul ne se lit pas au clavier ni à voix haute** : chaque lien
 * porte le nom de sa langue en `aria-label` et en `title`, et un texte caché
 * pour les lecteurs d'écran.
 */
export default function SelecteurLangue({ titre }: { titre: string }) {
  const chemin = usePathname();
  const courante = langueDuChemin(chemin);

  return (
    <div className="flex items-center gap-1" title={titre}>
      {LANGUES.map((langue) => (
        <NextLink
          key={langue}
          href={cheminEnLangue(chemin, langue)}
          hrefLang={langue}
          aria-label={NOM_DE_LA_LANGUE[langue]}
          title={NOM_DE_LA_LANGUE[langue]}
          aria-current={langue === courante ? "true" : undefined}
          className={cn(
            "rounded-sm p-1 transition-opacity",
            langue === courante
              ? "opacity-100 ring-1 ring-usap-sang/40"
              : "opacity-45 hover:opacity-100",
          )}
        >
          <Drapeau langue={langue} />
          <span className="sr-only">{NOM_DE_LA_LANGUE[langue]}</span>
        </NextLink>
      ))}
    </div>
  );
}

/** Drapeaux de 21 × 14, bordés pour se détacher sur fond clair comme sombre. */
function Drapeau({ langue }: { langue: Langue }) {
  const cadre = "block rounded-[2px] ring-1 ring-black/15 dark:ring-white/25";

  if (langue === "fr") {
    return (
      <svg viewBox="0 0 21 14" width="21" height="14" className={cadre} aria-hidden="true">
        <rect width="7" height="14" fill="#002395" />
        <rect x="7" width="7" height="14" fill="#FFFFFF" />
        <rect x="14" width="7" height="14" fill="#ED2939" />
      </svg>
    );
  }

  // La senyera : quatre barres rouges sur or — les couleurs du club.
  return (
    <svg viewBox="0 0 21 14" width="21" height="14" className={cadre} aria-hidden="true">
      <rect width="21" height="14" fill="#FCDD09" />
      {[1, 3, 5, 7].map((bande) => (
        <rect key={bande} y={bande * (14 / 9)} width="21" height={14 / 9} fill="#DA121A" />
      ))}
    </svg>
  );
}

"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { LANGUES, cheminEnLangue, langueDuChemin } from "@/i18n/langues";
import { cn } from "@/lib/utils";

/**
 * Le passage d'une langue à l'autre, sans quitter la page qu'on lit.
 *
 * **Deux libellés plutôt que deux drapeaux.** Un drapeau désigne un État, non
 * une langue — et ici le raccourci serait doublement faux : le catalan se
 * parle des deux côtés de la frontière, et l'écusson qui conviendrait au
 * catalan de Perpignan est celui du club, déjà en tête de page. « FR » et
 * « CA » ne se confondent avec rien, et se lisent à toutes les tailles.
 */
export default function SelecteurLangue({ titre }: { titre: string }) {
  const chemin = usePathname();
  const courante = langueDuChemin(chemin);

  return (
    <div
      className="flex items-center rounded-md border border-border"
      title={titre}
    >
      {LANGUES.map((langue) => (
        <NextLink
          key={langue}
          href={cheminEnLangue(chemin, langue)}
          hrefLang={langue}
          aria-current={langue === courante ? "true" : undefined}
          className={cn(
            "px-2 py-1 text-xs font-semibold uppercase transition-colors first:rounded-l-md last:rounded-r-md",
            langue === courante
              ? "bg-usap-sang/15 text-usap-sang"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {langue}
        </NextLink>
      ))}
    </div>
  );
}

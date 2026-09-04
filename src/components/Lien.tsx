"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { cheminLocalise, langueDuChemin } from "@/i18n/langues";
import type { ComponentProps } from "react";

/**
 * `next/link`, préfixé de la langue courante.
 *
 * **Il remplace `next/link` partout dans les pages**, ce qui évite de réécrire
 * les cent six liens du site un à un — et surtout d'en oublier un. La langue se
 * lit dans l'adresse plutôt que dans un contexte : un lien n'a alors besoin de
 * rien d'autre que de sa propre page.
 */
export default function Lien({
  href,
  ...reste
}: Omit<ComponentProps<typeof NextLink>, "href"> & { href: string }) {
  const chemin = usePathname();
  return <NextLink href={cheminLocalise(href, langueDuChemin(chemin))} {...reste} />;
}

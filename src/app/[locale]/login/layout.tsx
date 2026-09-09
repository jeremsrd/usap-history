import type { Metadata } from "next";

/**
 * **La page de connexion ne s'indexe pas.** Elle n'avait ni balise `robots` ni en-tête `X-Robots-Tag`, et l'en-tête du site y menait depuis chacune de ses pages : elle aurait fini indexée.
 *
 * Ce n'est pas une mesure de sécurité : renommer l'adresse ne protégerait de rien, les robots essayant des milliers de chemins de toute façon. C'est de l'hygiène —
 * une page qui ne sert qu'à une personne n'a rien à faire dans un moteur de
 * recherche, et elle y attirerait des visites qui n'ont rien à y trouver.
 * `follow: false` va avec : rien à suivre depuis là.
 *
 * Le layout n'existe que pour porter cette métadonnée, Next.js ne la
 * fusionnant que depuis un segment de route.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";

/**
 * **L'administration ne s'indexe pas.** Elle n'a plus de lien dans l'en-tête depuis le 9 septembre 2026, mais son adresse reste devinable, et un moteur la trouverait par ailleurs.
 *
 * Ce n'est pas une mesure de sécurité : chaque page et chaque action y appellent `auth.getUser()` avant de lire ou d'écrire. C'est de l'hygiène —
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

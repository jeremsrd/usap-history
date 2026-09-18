import Link from "@/components/Lien";
import Signalement from "@/components/Signalement";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";

/**
 * Une page légale : un titre, puis des sections — un titre en encre sous son
 * filet, des paragraphes. Les deux pages du site, mentions légales et
 * politique de confidentialité, sont écrites le 14 septembre 2026 dans la
 * voix des listes, sans encadré ni icône ; tout leur texte vient du
 * dictionnaire, en français et en catalan.
 *
 * `sections` donne, par section, le préfixe de ses clés et son nombre de
 * paragraphes : `{ cle: "editeur", n: 3 }` lit `editeurTitre` puis
 * `editeurP1` à `editeurP3`. Le nombre est dit plutôt que sondé — une clé
 * absente est une faute pour le dictionnaire, qui la signale. Un `lien`
 * facultatif clôt la section d'un lien interne.
 *
 * **Elles portent le signalement d'erreur comme les autres pages**, demandé
 * par Jérémy le 18 septembre 2026 : elles n'affichent rien qui vienne de la
 * base, mais le lecteur qui arrive là cherche justement à qui écrire — et
 * l'adresse y est noyée dans un paragraphe de loi.
 */
export default async function PageLegale({
  langue,
  section,
  sections,
}: {
  langue: Langue;
  section: "mentions" | "confidentialite";
  sections: { cle: string; n: number; lien?: { href: string; libelle: string } }[];
}) {
  const t = await dictionnaire(langue);
  const paragraphes = (prefixe: string, n: number) => Array.from({ length: n }, (_, i) => t(`${section}.${prefixe}P${i + 1}`));
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <h1 className="mb-10 font-display text-5xl uppercase leading-none text-foreground sm:text-7xl">{t(`${section}.titre`)}</h1>
      {sections.map(({ cle, n, lien }) => (
        <section key={cle} className="mb-10 max-w-prose">
          <h2 className="mb-3 border-b border-foreground pb-1 font-display text-2xl uppercase leading-none text-foreground">
            {t(`${section}.${cle}Titre`)}
          </h2>
          {paragraphes(cle, n).map((p, i) => (
            <p key={i} className="mt-2 text-sm leading-relaxed text-foreground">
              {p}
            </p>
          ))}
          {lien && (
            <p className="mt-2 text-sm">
              <Link href={lien.href} className="text-usap-sang underline underline-offset-2 hover:text-foreground">
                {t(lien.libelle)}
              </Link>
            </p>
          )}
        </section>
      ))}
      <Signalement langue={langue} sujet={t(`${section}.titre`)} />
    </div>
  );
}

import Link from "@/components/Lien";
import { prisma } from "@/lib/prisma";
import { MATCH_JOUE } from "@/lib/matchs";
import { NAV_LINKS_MAIN, NAV_LINKS_MORE } from "@/lib/constants";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import { unstable_cache } from "next/cache";

/**
 * Le pied de page, refait le 10 septembre 2026 à la demande de Jérémy — le
 * dernier morceau de la couche partagée que le chantier design n'avait pas
 * touché. C'était une ligne grise centrée, la mention et rien d'autre.
 *
 * Il porte désormais trois choses que le site n'avait nulle part où dire, le
 * projet n'ayant pas de page « à propos » :
 *
 * 1. **le plan du site**, les quatorze entrées à plat — les huit du menu
 *    « Explorer » comprises, que le Header cache derrière un bouton et
 *    qu'aucun robot ne suit ;
 * 2. **d'où viennent les données**, source par compétition, avec le lien vers
 *    chacune : c'est la doctrine du projet en une colonne, et le pendant
 *    général de la section « Sources et arbitrages » que `Provenance` pose au
 *    pied des fiches ;
 * 3. **l'étendue de la base, lue dans la base** — rencontres, saisons,
 *    première et dernière —, avec la réserve de couverture. Ces chiffres ne
 *    s'écrivent pas en dur : ils bougent à chaque saison reprise, et un
 *    nombre recopié se périme sans qu'on s'en aperçoive.
 *
 * **Les mentions de droits sont ici et pas ailleurs** (arbitré par Jérémy le
 * 10 septembre 2026) : les écussons de club sont des marques déposées, et les
 * portraits appartiennent à leurs auteurs. Le crédit de chaque photo reste sur
 * la fiche du joueur — CC BY-SA l'exige nommément —, le pied dit ce qu'une
 * fiche ne peut pas répéter. La phrase « site non officiel » a été écartée du
 * même mouvement : elle se posera à part, si elle se pose.
 *
 * **Sa seule audace est le nom en grand**, dans la voix du dos de maillot :
 * c'est la même que celle des titres de page, à ceci près qu'ici elle clôt au
 * lieu d'ouvrir.
 */

/**
 * Les sources, dans l'ordre où le projet les interroge. **Les deux-points sont
 * dans le libellé, non dans le composant** : le français les fait précéder
 * d'une espace insécable, le catalan non — la ponctuation appartient à la
 * langue.
 */
const SOURCES = [
  { cle: "pied.donneesChampionnat", nom: "LNR", href: "https://www.lnr.fr" },
  { cle: "pied.donneesEurope", nom: "EPCR", href: "https://www.epcrugby.com" },
  { cle: "pied.donneesAvant", nom: "Gallica (BnF)", href: "https://gallica.bnf.fr" },
] as const;

/**
 * L'étendue de la base, mise en cache une heure.
 *
 * Le pied paraît sur les trente-six pages : sans ce cache, trois agrégats
 * partiraient à chaque chargement pour trois nombres qui ne bougent qu'au
 * rythme d'un match par semaine.
 */
const couverture = unstable_cache(
  async () => {
    const [rencontres, saisons] = await Promise.all([
      prisma.match.count({ where: MATCH_JOUE }),
      prisma.season.findMany({
        where: { matches: { some: {} } },
        select: { label: true },
        orderBy: { startYear: "asc" },
      }),
    ]);
    return {
      rencontres,
      saisons: saisons.length,
      premiere: saisons[0]?.label ?? "",
      derniere: saisons[saisons.length - 1]?.label ?? "",
    };
  },
  ["pied-couverture"],
  { revalidate: 3600 },
);

/** Le titre d'une colonne : la voix condensée des pages, sous son filet. */
function Titre({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 border-b-2 border-usap-sang pb-1 font-display text-2xl uppercase leading-none text-usap-sang">
      {children}
    </h2>
  );
}

export default async function Footer({ langue }: { langue: Langue }) {
  const t = await dictionnaire(langue);
  const { rencontres, saisons, premiere, derniere } = await couverture();
  const nombre = (n: number) => n.toLocaleString("fr-FR");

  const colonne = (liens: readonly { href: string; cle: string }[]) => (
    <ul className="space-y-1 text-sm">
      {liens.map((lien) => (
        <li key={lien.href}>
          <Link href={lien.href} className="text-muted-foreground hover:text-foreground">
            {t(lien.cle)}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <footer className="mt-16 border-t border-border bg-usap-carte">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        {/* Le nom, dans la voix du dos de maillot — la seule audace du pied. */}
        <p className="font-display text-5xl uppercase leading-none sm:text-6xl">
          <span className="text-usap-sang">USAP</span>{" "}
          <span className="text-usap-or">Historia</span>
        </p>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-foreground">
          {t("pied.couverture", {
            rencontres: nombre(rencontres),
            saisons: nombre(saisons),
            premiere,
            derniere,
          })}
        </p>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {t("pied.reserve")}
        </p>

        <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          <nav aria-label={t("pied.site")}>
            <Titre>{t("pied.site")}</Titre>
            {colonne(NAV_LINKS_MAIN)}
          </nav>

          <nav aria-label={t("nav.explorer")}>
            <Titre>{t("nav.explorer")}</Titre>
            {colonne(NAV_LINKS_MORE)}
          </nav>

          <section>
            <Titre>{t("pied.donnees")}</Titre>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {SOURCES.map((source) => (
                <li key={source.href}>
                  {t(source.cle)}{" "}
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground hover:text-usap-sang"
                  >
                    {source.nom}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <Titre>{t("pied.mentions")}</Titre>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("pied.mentionEcussons")}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("pied.mentionPortraits")}
            </p>
          </section>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          {t("pied.mention")}
        </p>
      </div>
    </footer>
  );
}

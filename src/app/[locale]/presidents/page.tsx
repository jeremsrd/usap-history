import Link from "@/components/Lien";
import { prisma } from "@/lib/prisma";
import { MATCH_JOUE } from "@/lib/matchs";
import { PALMARES } from "@/lib/constants";
import { duPlusRecent, periodeDesSaisons } from "@/lib/periodes";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";
import { liensAlternatifs } from "@/lib/seo";

/**
 * La liste des présidents, refaite le 7 septembre 2026. Quatre hommes
 * sur vingt-deux saisons : une épine n'aurait rien à structurer, et la
 * page est **une chronologie**, à la manière du palmarès — les années en
 * grand caractère condensé en tête de chaque ligne, en rouge quand c'est
 * le mandat que la fiche porte, en gris quand ce ne sont que les saisons
 * que la base couvre, ce qui n'est pas la même chose et que la réserve
 * dit. Puis le nom lié à sa fiche, les saisons, le bilan des rencontres
 * jouées sous sa présidence et le fait marquant, les titres en or.
 *
 * Aucun des quatre n'a de portrait : pas de colonne pour une case vide.
 *
 * Ce que la page ne fait plus : une grille de cartes centrées, chacune
 * sous la même icône Lucide dans un rond gris, avec le mandat en or.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Langue }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  return { title: t("presidents.metaTitre"), description: t("presidents.metaDescription"), alternates: liensAlternatifs(locale, "/presidents") };
}

export default async function PresidentsPage({ params }: Props) {
  const { locale } = await params;
  const t = await dictionnaire(locale);

  const presidents = await prisma.president.findMany({
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      startYear: true,
      endYear: true,
      seasons: { select: { id: true, label: true, startYear: true, endYear: true, promoted: true, relegated: true } },
    },
  });
  const matchs = await prisma.match.findMany({ where: MATCH_JOUE, select: { seasonId: true, result: true } });

  const est = (liste: readonly number[], annee: number) => liste.includes(annee);
  const parFait = (liste: Array<[string, number]>) => {
    const annees = new Map<string, number[]>();
    for (const [fait, annee] of liste) annees.set(fait, [...(annees.get(fait) ?? []), annee]);
    return [...annees.entries()].map(([fait, a]) => `${fait} ${a.sort().join(t("entraineurs.et"))}`);
  };
  const fiches = presidents
    .map((p) => {
      const ids = new Set(p.seasons.map((s) => s.id));
      const sous = matchs.filter((m) => ids.has(m.seasonId));
      const compte = (r: string) => sous.filter((m) => m.result === r).length;
      return {
        ...p,
        periode: periodeDesSaisons(p.seasons),
        matchs: sous.length,
        victoires: compte("VICTOIRE"),
        nuls: compte("NUL"),
        defaites: compte("DEFAITE"),
        titres: parFait([
          ...p.seasons.filter((s) => est(PALMARES.titresChampion, s.endYear)).map((s): [string, number] => [t("saisons.champion"), s.endYear]),
          ...p.seasons.filter((s) => est(PALMARES.titresProD2, s.endYear)).map((s): [string, number] => [t("saisons.championProD2"), s.endYear]),
        ]),
        reste: parFait([
          ...p.seasons.filter((s) => est(PALMARES.finales, s.endYear)).map((s): [string, number] => [t("saisons.finaliste"), s.endYear]),
          ...p.seasons.filter((s) => s.promoted && !est(PALMARES.titresProD2, s.endYear)).map((s): [string, number] => [t("saisons.promu"), s.endYear]),
          ...p.seasons.filter((s) => s.relegated).map((s): [string, number] => [t("saisons.relegue"), s.endYear]),
        ]),
      };
    })
    .sort((a, b) => duPlusRecent(a.periode, b.periode));
  const depuis = fiches.reduce<string | null>((min, f) => (f.periode && (!min || f.periode.premiere < min) ? f.periode.premiere : min), null);

  /** Les années de la ligne : le mandat en rouge, sinon la couverture en gris. */
  const annees = (f: (typeof fiches)[number]) =>
    f.startYear
      ? { texte: f.endYear ? t("presidents.mandat", { debut: f.startYear, fin: f.endYear }) : t("presidents.depuis", { annee: f.startYear }), mandat: true }
      : f.periode
        ? { texte: `${f.periode.premiere.slice(0, 4)}–${f.periode.derniere.slice(5)}`, mandat: false }
        : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12">
        <h1 className="font-display text-6xl uppercase leading-none text-usap-sang sm:text-8xl">{t("presidents.titre")}</h1>
        <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">{t("presidents.chapeau", { n: fiches.length, depuis: depuis ?? "" })}</p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("presidents.reserve")}</p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">{t("presidents.colAnnees")}</th>
              <th scope="col" className="py-2 pr-4 font-medium">{t("presidents.colPresident")}</th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("presidents.colSaisons")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("presidents.colMatchs")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("presidents.colVictoires")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("presidents.colNuls")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("presidents.colDefaites")}</th>
              <th scope="col" className="hidden py-2 font-medium md:table-cell">{t("presidents.colFait")}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {fiches.map((f) => {
              const a = annees(f);
              return (
                <tr key={f.id} className="border-b border-border hover:bg-muted">
                  <td className={`py-3 pr-4 whitespace-nowrap font-display text-2xl leading-none sm:text-4xl ${a?.mandat ? "text-usap-sang" : "text-muted-foreground"}`}>
                    {a?.texte ?? ""}
                  </td>
                  <td className="py-3 pr-4">
                    <Link href={`/presidents/${f.slug}`} className="text-lg text-foreground hover:text-usap-sang">
                      {f.firstName} <span className="font-semibold">{f.lastName}</span>
                    </Link>
                  </td>
                  <td className="hidden py-3 pr-3 text-right text-muted-foreground sm:table-cell">{f.seasons.length || ""}</td>
                  <td className="py-3 pr-3 text-right font-semibold text-foreground">{f.matchs || ""}</td>
                  <td className="py-3 pr-3 text-right text-usap-sang">{f.victoires || ""}</td>
                  <td className="py-3 pr-3 text-right text-foreground">{f.nuls || ""}</td>
                  <td className="py-3 pr-3 text-right text-muted-foreground">{f.defaites || ""}</td>
                  <td className="hidden py-3 md:table-cell">
                    {f.titres.length > 0 && <span className="font-semibold text-usap-or">{f.titres.join(", ")}</span>}
                    {f.titres.length > 0 && f.reste.length > 0 && <span className="text-muted-foreground">, </span>}
                    {f.reste.length > 0 && <span className="text-muted-foreground">{f.reste.join(", ")}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

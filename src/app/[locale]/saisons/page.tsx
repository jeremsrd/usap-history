import Link from "@/components/Lien";
import { prisma } from "@/lib/prisma";
import { MATCH_JOUE } from "@/lib/matchs";
import { DIVISIONS, PALMARES } from "@/lib/constants";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";

/**
 * La liste des saisons, refaite le 6 septembre 2026 dans l'identité posée
 * sur `/joueurs`. Sa seule audace est la même que là-bas : **l'épine des
 * décennies**, grosses années condensées en rouge, avec un index en tête —
 * c'est la structure réelle d'une liste de cent vingt saisons, et c'est
 * ainsi qu'on y cherche, « les années 50 ». Une ligne par saison :
 * division, classement, bilan et points du championnat, entraîneur, le
 * fait marquant en mots — champion, finaliste, promu, relégué —, et le
 * nombre de rencontres que la base porte, qui dit d'un coup d'œil où la
 * couverture s'arrête.
 *
 * Ce que la page ne fait plus : un trophée et deux flèches vertes et rouges
 * à côté du millésime, des V en vert et des D en rouge, un cadre arrondi
 * autour du tableau.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Langue }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  return { title: t("saisons.metaTitre"), description: t("saisons.metaDescription") };
}

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function SaisonsPage({ params }: Props) {
  const { locale } = await params;
  const t = await dictionnaire(locale);

  const seasons = await prisma.season.findMany({
    orderBy: { startYear: "desc" },
    select: {
      id: true,
      label: true,
      startYear: true,
      endYear: true,
      division: true,
      finalRanking: true,
      wins: true,
      draws: true,
      losses: true,
      totalPoints: true,
      promoted: true,
      relegated: true,
      coach: { select: { firstName: true, lastName: true, slug: true } },
      seasonCoaches: {
        where: { role: "ENTRAINEUR_PRINCIPAL" },
        orderBy: { displayOrder: "asc" },
        select: { coach: { select: { firstName: true, lastName: true, slug: true } } },
      },
      _count: { select: { matches: { where: MATCH_JOUE } } },
    },
  });

  // Par décennie, la plus récente en tête.
  const decennies = new Map<number, typeof seasons>();
  for (const s of seasons) {
    const d = Math.floor(s.startYear / 10) * 10;
    decennies.set(d, [...(decennies.get(d) ?? []), s]);
  }
  const documentees = seasons.filter((s) => s._count.matches > 0).length;

  const est = (liste: readonly number[], annee: number) => (liste as readonly number[]).includes(annee);
  /** Le fait marquant, en mots ; les titres sont en or. */
  const faitMarquant = (s: (typeof seasons)[number]) => {
    const titres = [
      est(PALMARES.titresChampion, s.endYear) && t("saisons.champion"),
      est(PALMARES.titresProD2, s.endYear) && t("saisons.championProD2"),
      est(PALMARES.challengeDuManoir, s.endYear) && t("saisons.manoir"),
    ].filter(Boolean) as string[];
    const reste = [
      est(PALMARES.finales, s.endYear) && t("saisons.finaliste"),
      est(PALMARES.finaleCoupeEurope, s.endYear) && t("saisons.finalisteEurope"),
      s.promoted && t("saisons.promu"),
      s.relegated && t("saisons.relegue"),
    ].filter(Boolean) as string[];
    return { titres, reste };
  };
  const entraineurs = (s: (typeof seasons)[number]) =>
    s.seasonCoaches.length > 0 ? s.seasonCoaches.map((sc) => sc.coach) : s.coach ? [s.coach] : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12">
        <h1 className="font-display text-7xl uppercase leading-none text-usap-sang sm:text-8xl">{t("saisons.titre")}</h1>
        <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">
          {t("saisons.chapeau", { n: seasons.length, documentees })}
        </p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("saisons.reserve")}</p>
      </header>

      <nav aria-label={t("saisons.indexAria")} className="mb-6 flex flex-wrap gap-x-1 font-display text-xl">
        {[...decennies.keys()].map((d) => (
          <a key={d} href={`#decennie-${d}`} className="px-1 text-foreground hover:text-usap-sang tabular-nums">
            {d}
          </a>
        ))}
      </nav>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">{t("saisons.colSaison")}</th>
              <th scope="col" className="py-2 pr-4 font-medium">{t("saisons.colDivision")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("saisons.colClassement")}</th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("saisons.colVictoires")}</th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("saisons.colNuls")}</th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("saisons.colDefaites")}</th>
              <th scope="col" className="hidden py-2 pr-4 text-right font-medium sm:table-cell">{t("saisons.colPoints")}</th>
              <th scope="col" className="hidden py-2 pr-4 font-medium lg:table-cell">{t("saisons.colEntraineur")}</th>
              <th scope="col" className="py-2 pr-4 font-medium">{t("saisons.colFait")}</th>
              <th scope="col" className="hidden py-2 text-right font-medium md:table-cell">{t("saisons.colRencontres")}</th>
            </tr>
          </thead>
          {[...decennies.entries()].map(([d, liste]) => (
            <tbody key={d} id={`decennie-${d}`} className="scroll-mt-20 tabular-nums">
              <tr>
                <th
                  scope="rowgroup"
                  colSpan={10}
                  className="border-b-2 border-usap-sang pt-8 pb-1 text-left font-display text-5xl leading-none text-usap-sang"
                  aria-label={t("saisons.decennie", { n: d })}
                >
                  {d}
                </th>
              </tr>
              {liste.map((s) => {
                const fait = faitMarquant(s);
                const coachs = entraineurs(s);
                return (
                  <tr key={s.id} className="border-b border-border hover:bg-muted">
                    <td className="py-1.5 pr-4 whitespace-nowrap">
                      <Link href={`/saisons/${s.label}`} className="font-semibold text-foreground hover:text-usap-sang">
                        {s.label}
                      </Link>
                    </td>
                    <td className="py-1.5 pr-4 whitespace-nowrap text-muted-foreground">{DIVISIONS[s.division] ?? s.division}</td>
                    <td className="py-1.5 pr-3 text-right whitespace-nowrap text-foreground">
                      {s.finalRanking == null ? "" : s.finalRanking === 1 ? t("saison.premier") : t("saison.rang", { n: s.finalRanking })}
                    </td>
                    <td className="hidden py-1.5 pr-3 text-right text-foreground sm:table-cell">{s.wins ?? ""}</td>
                    <td className="hidden py-1.5 pr-3 text-right text-muted-foreground sm:table-cell">{s.draws ?? ""}</td>
                    <td className="hidden py-1.5 pr-3 text-right text-muted-foreground sm:table-cell">{s.losses ?? ""}</td>
                    <td className="hidden py-1.5 pr-4 text-right font-semibold text-foreground sm:table-cell">{s.totalPoints ?? ""}</td>
                    <td className="hidden py-1.5 pr-4 text-muted-foreground lg:table-cell">
                      {coachs.map((c, i) => (
                        <span key={c.slug}>
                          <Link href={`/entraineurs/${c.slug}`} className="hover:text-usap-sang">
                            {c.firstName} {c.lastName}
                          </Link>
                          {i < coachs.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </td>
                    <td className="py-1.5 pr-4">
                      {fait.titres.length > 0 && <span className="font-semibold text-usap-or">{fait.titres.join(", ")}</span>}
                      {fait.reste.length > 0 && (
                        <span className="text-muted-foreground">
                          {fait.titres.length > 0 ? ", " : ""}
                          {fait.titres.length > 0 ? fait.reste.join(", ") : majuscule(fait.reste.join(", "))}
                        </span>
                      )}
                    </td>
                    <td className="hidden py-1.5 text-right text-muted-foreground md:table-cell">{s._count.matches || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

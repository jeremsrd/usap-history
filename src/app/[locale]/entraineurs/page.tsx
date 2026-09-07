import Link from "@/components/Lien";
import { prisma } from "@/lib/prisma";
import { MATCH_JOUE } from "@/lib/matchs";
import { PALMARES } from "@/lib/constants";
import { duPlusRecent, periodeDesSaisons } from "@/lib/periodes";
import { passagesDe, sequences, sousSonBanc } from "@/lib/staff";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";

/**
 * La liste des entraîneurs, refaite le 7 septembre 2026 sur le modèle de
 * la liste des saisons : **l'épine des rôles**, en rouge condensé — ceux
 * qui ont dirigé le banc, puis ceux qui n'y ont été qu'adjoints —, et sous
 * chacune ses hommes du plus récent au plus ancien. Une épine des
 * décennies a été essayée et défaite : vingt-deux saisons tiennent en
 * trois décennies, et un homme resté vingt ans sur le banc, Azéma de
 * 2005-2006 à 2025-2026, tombait dans les années 2000 en tête de liste.
 * Qui dirigeait le banc est la vraie question d'une liste d'entraîneurs. Une
 * ligne par entraîneur : le nom lié à sa fiche, ses rôles en mots, la
 * période que la base couvre, le nombre de saisons, et **le bilan des
 * rencontres jouées sous son banc** — matchs, victoires, nuls, défaites,
 * bornés à ses dates de prise et de fin de fonction —, que la grille de
 * cartes ne disait pas ; puis le fait marquant de ses saisons, les titres
 * en or. Gilbert Brutus, sans saison en base, vient en dernier sous son
 * propre en-tête.
 *
 * Aucun des vingt et un entraîneurs n'a de portrait : pas de colonne pour
 * une case vide à cent pour cent.
 *
 * Ce que la page ne fait plus : une grille de cartes centrées, chacune
 * sous la même icône Lucide dans un rond gris.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Langue }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  return { title: t("entraineurs.metaTitre"), description: t("entraineurs.metaDescription") };
}

const SAISON = { id: true, label: true, startYear: true, endYear: true, champion: true, promoted: true, relegated: true } as const;

export default async function EntraineursPage({ params }: Props) {
  const { locale } = await params;
  const t = await dictionnaire(locale);

  // Requêtes séquentielles : le pool de Supabase est étroit.
  const coaches = await prisma.coach.findMany({
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      seasons: { select: SAISON },
      seasonCoaches: { select: { season: { select: SAISON }, role: true, startDate: true, endDate: true, isInterim: true } },
    },
  });
  const matchs = await prisma.match.findMany({ where: MATCH_JOUE, select: { seasonId: true, date: true, result: true } });

  const est = (liste: readonly number[], annee: number) => liste.includes(annee);
  const fiches = coaches
    .map((c) => {
      const passages = passagesDe(c);
      const saisons = [...new Map(passages.map((p) => [p.season.id, p.season])).values()];
      const sous = sousSonBanc(passages, matchs);
      const compte = (r: string) => sous.filter((m) => m.result === r).length;
      const roles = [...new Set(passages.map((p) => p.role))];
      const parFait = (liste: Array<[string, number]>) => {
        const annees = new Map<string, number[]>();
        for (const [fait, annee] of liste) annees.set(fait, [...(annees.get(fait) ?? []), annee]);
        return [...annees.entries()].map(([fait, a]) => `${fait} ${a.sort().join(t("entraineurs.et"))}`);
      };
      const titres = parFait([
        ...saisons.filter((s) => est(PALMARES.titresChampion, s.endYear)).map((s): [string, number] => [t("saisons.champion"), s.endYear]),
        ...saisons.filter((s) => est(PALMARES.titresProD2, s.endYear)).map((s): [string, number] => [t("saisons.championProD2"), s.endYear]),
      ]);
      const reste = parFait([
        ...saisons.filter((s) => est(PALMARES.finales, s.endYear)).map((s): [string, number] => [t("saisons.finaliste"), s.endYear]),
        ...saisons.filter((s) => s.promoted && !est(PALMARES.titresProD2, s.endYear)).map((s): [string, number] => [t("saisons.promu"), s.endYear]),
        ...saisons.filter((s) => s.relegated).map((s): [string, number] => [t("saisons.relegue"), s.endYear]),
      ]);
      return {
        ...c,
        periode: periodeDesSaisons(saisons),
        // « 2005-2010, 2023-2026 » pour Azéma, et non « 2005-2026 » : les
        // séquences contiguës, pour ne pas écrire vingt ans d'un homme parti
        // treize ans entre les deux.
        sequences: sequences(saisons)
          .map((q) => (q.n === 1 ? q.premiere.label : `${q.premiere.label.slice(0, 4)}-${q.derniere.label.slice(5)}`))
          .join(", "),
        saisons: saisons.length,
        roles,
        matchs: sous.length,
        victoires: compte("VICTOIRE"),
        nuls: compte("NUL"),
        defaites: compte("DEFAITE"),
        titres,
        reste,
      };
    })
    .sort((a, b) => duPlusRecent(a.periode, b.periode));

  // L'épine : ceux qui ont dirigé le banc, puis ceux qui n'y ont été
  // qu'adjoints, du plus récent au plus ancien ; sans saison en base, un
  // en-tête à part, en dernier.
  const groupes = new Map<string, typeof fiches>();
  for (const f of fiches) {
    const cle = !f.periode ? "avant" : f.roles.includes("ENTRAINEUR_PRINCIPAL") ? "principaux" : "adjoints";
    groupes.set(cle, [...(groupes.get(cle) ?? []), f]);
  }
  const cles = ["principaux", "adjoints", "avant"].filter((c) => groupes.has(c));
  const libelle = (cle: string) => t(`entraineurs.${cle}`);
  const principaux = fiches.filter((f) => f.roles.includes("ENTRAINEUR_PRINCIPAL")).length;
  const depuis = fiches.reduce<string | null>((min, f) => (f.periode && (!min || f.periode.premiere < min) ? f.periode.premiere : min), null);

  const ROLES: Record<string, string> = {
    ENTRAINEUR_PRINCIPAL: t("entraineurs.principal"),
    ENTRAINEUR_ADJOINT: t("entraineurs.adjoint"),
    ENTRAINEUR_AVANTS: t("saison.roleAvants"),
    ENTRAINEUR_ARRIERES: t("saison.roleArrieres"),
    ENTRAINEUR_DEFENSE: t("saison.roleDefense"),
    PREPARATEUR_PHYSIQUE: t("saison.rolePrepa"),
    INTERIMAIRE: t("saison.roleInterimaire"),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12">
        <h1 className="font-display text-6xl uppercase leading-none text-usap-sang sm:text-8xl">{t("entraineurs.titre")}</h1>
        <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">
          {t("entraineurs.chapeau", { n: fiches.length, depuis: depuis ?? "", principaux })}
        </p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("entraineurs.reserve")}</p>
      </header>

      <nav aria-label={t("entraineurs.indexAria")} className="mb-6 flex flex-wrap gap-x-4 font-display text-xl">
        {cles.map((cle) => (
          <a key={cle} href={`#groupe-${cle}`} className="text-foreground hover:text-usap-sang">
            {libelle(cle)}
          </a>
        ))}
      </nav>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">{t("entraineurs.colEntraineur")}</th>
              <th scope="col" className="hidden py-2 pr-4 font-medium sm:table-cell">{t("entraineurs.colRoles")}</th>
              <th scope="col" className="py-2 pr-4 font-medium">{t("entraineurs.colPeriode")}</th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-medium md:table-cell">{t("entraineurs.colSaisons")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("entraineurs.colMatchs")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("entraineurs.colVictoires")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("entraineurs.colNuls")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("entraineurs.colDefaites")}</th>
              <th scope="col" className="hidden py-2 font-medium lg:table-cell">{t("entraineurs.colFait")}</th>
            </tr>
          </thead>
          {cles.map((cle) => (
            <tbody key={cle} id={`groupe-${cle}`} className="scroll-mt-20 tabular-nums">
              <tr>
                <th scope="rowgroup" colSpan={9} className="border-b-2 border-usap-sang pt-8 pb-1 text-left font-display text-4xl leading-none text-usap-sang sm:text-5xl">
                  {libelle(cle)}
                </th>
              </tr>
              {groupes.get(cle)!.map((f) => (
                <tr key={f.id} className="border-b border-border hover:bg-muted">
                  <td className="py-1.5 pr-4">
                    <Link href={`/entraineurs/${f.slug}`} className="text-foreground hover:text-usap-sang">
                      {f.firstName} <span className="font-semibold">{f.lastName}</span>
                    </Link>
                  </td>
                  <td className="hidden py-1.5 pr-4 text-muted-foreground sm:table-cell">{f.roles.map((r) => ROLES[r] ?? r.toLowerCase()).join(t("entraineurs.puis"))}</td>
                  <td className="py-1.5 pr-4 whitespace-nowrap text-muted-foreground">{f.sequences}</td>
                  <td className="hidden py-1.5 pr-3 text-right text-muted-foreground md:table-cell">{f.saisons || ""}</td>
                  <td className="py-1.5 pr-3 text-right font-semibold text-foreground">{f.matchs || ""}</td>
                  <td className="py-1.5 pr-3 text-right text-usap-sang">{f.victoires || ""}</td>
                  <td className="py-1.5 pr-3 text-right text-foreground">{f.nuls || ""}</td>
                  <td className="py-1.5 pr-3 text-right text-muted-foreground">{f.defaites || ""}</td>
                  <td className="hidden py-1.5 lg:table-cell">
                    {f.titres.length > 0 && <span className="font-semibold text-usap-or">{f.titres.join(", ")}</span>}
                    {f.titres.length > 0 && f.reste.length > 0 && <span className="text-muted-foreground">, </span>}
                    {f.reste.length > 0 && <span className="text-muted-foreground">{f.reste.join(", ")}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

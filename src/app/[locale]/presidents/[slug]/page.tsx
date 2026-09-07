import Link from "@/components/Lien";
import Provenance from "@/components/Provenance";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MATCH_JOUE, estJoue } from "@/lib/matchs";
import { PALMARES } from "@/lib/constants";
import { formatDateFR } from "@/lib/utils";
import { dictionnaire } from "@/i18n/dictionnaire";
import { cheminLocalise, type Langue } from "@/i18n/langues";
import type { Metadata } from "next";

/**
 * La fiche d'un président, refaite le 7 septembre 2026 dans l'identité
 * posée sur la fiche entraîneur. Le nom en rouge — c'est un homme du club
 * —, le mandat en une phrase quand la fiche le porte, et sinon les
 * saisons que la base couvre, avec la réserve qui dit que ce n'est pas la
 * même chose. Le titre décidé sous sa présidence en or ; sa seule audace
 * est **la frise des rencontres jouées sous sa présidence** — treize
 * saisons pour François Rivière, un mur de quatre cents lettres, et c'est
 * bien l'histoire d'un mandat. Le bilan tient en une phrase.
 *
 * Puis la saison par saison, avec l'entraîneur principal lié à sa fiche
 * et le fait marquant en mots ; la biographie quand la base en porte une ;
 * la provenance en pied.
 *
 * Ce que la page ne fait plus : trois cases de chiffres, un encadré or à
 * trophée, un emoji et deux flèches vertes et rouges à côté du millésime,
 * une silhouette grise à la place d'une photo qu'aucun président n'a.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Langue; slug: string }> };

function extractIdFromSlug(slug: string): string | null {
  const match = slug.match(/([a-z0-9]{25,})$/);
  return match ? match[1] : null;
}

const nombre = (n: number) => n.toLocaleString("fr-FR");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await dictionnaire(locale);
  const id = extractIdFromSlug(slug);
  const president = id ? await prisma.president.findUnique({ where: { id }, select: { firstName: true, lastName: true } }) : null;
  if (!president) return { title: t("president.introuvable") };
  const nom = `${president.firstName} ${president.lastName}`;
  return { title: t("president.metaTitre", { nom }), description: t("president.metaDescription", { nom }) };
}

export default async function PresidentDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await dictionnaire(locale);
  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const president = await prisma.president.findUnique({
    where: { id },
    include: {
      seasons: {
        orderBy: { startYear: "desc" },
        select: {
          id: true,
          label: true,
          startYear: true,
          endYear: true,
          division: true,
          finalRanking: true,
          champion: true,
          promoted: true,
          relegated: true,
          matchesPlayed: true,
          wins: true,
          draws: true,
          losses: true,
          pointsFor: true,
          pointsAgainst: true,
          coach: { select: { firstName: true, lastName: true, slug: true } },
        },
      },
    },
  });
  if (!president) notFound();
  if (president.slug !== slug) redirect(cheminLocalise(`/presidents/${president.slug}`, locale));

  const saisons = president.seasons;
  const rencontres = saisons.length
    ? await prisma.match.findMany({
        where: { ...MATCH_JOUE, seasonId: { in: saisons.map((s) => s.id) } },
        orderBy: { date: "asc" },
        select: {
          id: true,
          slug: true,
          date: true,
          scoreUsap: true,
          scoreOpponent: true,
          result: true,
          isHome: true,
          opponent: { select: { name: true, shortName: true } },
          season: { select: { label: true } },
        },
      })
    : [];
  const sous = rencontres.filter(estJoue);
  const compte = (r: string) => sous.filter((m) => m.result === r).length;
  const pour = sous.reduce((s, m) => s + m.scoreUsap, 0);
  const contre = sous.reduce((s, m) => s + m.scoreOpponent, 0);
  const premiere = sous[0];
  const derniere = sous[sous.length - 1];
  const plusAncienne = saisons[saisons.length - 1];
  const plusRecente = saisons[0];

  // Le mandat quand la fiche le porte ; sinon la couverture, et la réserve.
  const mandat = president.startYear
    ? president.endYear
      ? t("president.mandatDe", { debut: president.startYear, fin: president.endYear })
      : t("president.mandatDepuis", { annee: president.startYear })
    : null;
  const couverture = saisons.length ? t("president.couverture", { n: saisons.length, debut: plusAncienne.label, fin: plusRecente.label }) : null;

  // Le titre décidé sous sa présidence, en or.
  const est = (liste: readonly number[], annee: number) => liste.includes(annee);
  const annees = (liste: typeof saisons) => liste.map((s) => s.endYear).sort().join(t("entraineurs.et"));
  const champions = saisons.filter((s) => est(PALMARES.titresChampion, s.endYear));
  const proD2 = saisons.filter((s) => est(PALMARES.titresProD2, s.endYear));
  const promus = saisons.filter((s) => s.promoted && !est(PALMARES.titresProD2, s.endYear));
  const titres = [
    champions.length > 0 && t("president.titreChampion", { annees: annees(champions) }),
    proD2.length > 0 && t("president.titreProD2", { annees: annees(proD2) }),
    promus.length > 0 && t("president.titrePromu", { annees: annees(promus) }),
  ].filter(Boolean) as string[];
  const faitMarquant = (s: (typeof saisons)[number]) => ({
    titres: [
      est(PALMARES.titresChampion, s.endYear) && t("saisons.champion"),
      est(PALMARES.titresProD2, s.endYear) && t("saisons.championProD2"),
      est(PALMARES.challengeDuManoir, s.endYear) && t("saisons.manoir"),
    ].filter(Boolean) as string[],
    reste: [
      est(PALMARES.finales, s.endYear) && t("saisons.finaliste"),
      est(PALMARES.finaleCoupeEurope, s.endYear) && t("saisons.finalisteEurope"),
      s.promoted && t("saisons.promu"),
      s.relegated && t("saisons.relegue"),
    ].filter(Boolean) as string[],
  });

  const nomClub = (o: { name: string; shortName: string | null }) => o.shortName || o.name;
  const lettre = (result: string | null) =>
    result === "VICTOIRE"
      ? { texte: t("saison.lettreVictoire"), classe: "text-usap-sang" }
      : result === "NUL"
        ? { texte: t("saison.lettreNul"), classe: "text-foreground" }
        : { texte: t("saison.lettreDefaite"), classe: "text-muted-foreground" };
  const affiche = (m: (typeof sous)[number]) => (m.isHome ? `USAP – ${nomClub(m.opponent)}` : `${nomClub(m.opponent)} – USAP`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/presidents" className="hover:text-usap-sang">
          {t("president.filAriane")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">
          {president.firstName} {president.lastName}
        </span>
      </nav>

      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start">
        {president.photoUrl && (
          <div className="shrink-0">
            <Image src={president.photoUrl} alt="" width={160} height={160} className="h-40 w-40 rounded-xs object-cover" priority />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display text-3xl leading-none text-foreground sm:text-4xl">{president.firstName}</p>
          <h1 className="font-display text-6xl uppercase leading-[0.9] text-usap-sang sm:text-8xl">{president.lastName}</h1>
          {(mandat || couverture) && (
            <p className="mt-2 text-lg text-muted-foreground">
              {mandat && `${mandat} `}
              {couverture}
            </p>
          )}
          {!mandat && couverture && <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("president.reserveCouverture")}</p>}
          {titres.length > 0 && <p className="mt-4 font-display text-2xl uppercase text-usap-or">{titres.join(". ")}</p>}
          {sous.length > 0 && (
            <ol aria-label={t("president.friseAria")} className="mt-3 flex flex-wrap gap-x-1.5 font-display text-3xl leading-none sm:text-4xl">
              {sous.map((m) => {
                const l = lettre(m.result);
                return (
                  <li key={m.id}>
                    <Link
                      href={`/matchs/${m.slug}`}
                      title={`${formatDateFR(m.date)}, ${affiche(m)}, ${m.isHome ? m.scoreUsap : m.scoreOpponent}-${m.isHome ? m.scoreOpponent : m.scoreUsap}`}
                      className={`${l.classe} hover:text-usap-or`}
                    >
                      {l.texte}
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
          <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">
            {sous.length === 0
              ? t("president.aucune")
              : t(premiere.season.label === derniere.season.label ? "president.bilanUneSaison" : "president.bilan", {
                  n: sous.length,
                  debut: premiere.season.label,
                  fin: derniere.season.label,
                  v: t("saison.victoires", { n: compte("VICTOIRE") }),
                  nu: t("saison.nuls", { n: compte("NUL") }),
                  d: t("saison.defaites", { n: compte("DEFAITE") }),
                  pour: nombre(pour),
                  contre: nombre(contre),
                })}
          </p>
          {president.biography && <p className="mt-4 max-w-prose text-sm leading-relaxed text-foreground">{president.biography}</p>}
        </div>
      </header>

      {saisons.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 border-b-2 border-usap-sang pb-1 font-display text-3xl uppercase leading-none text-usap-sang">
            {t("president.saisonsTitre")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">{t("president.colSaison")}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{t("president.colDivision")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("president.colClassement")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("president.colMatchs")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("president.colVictoires")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("president.colNuls")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("president.colDefaites")}</th>
                  <th scope="col" className="hidden py-2 pr-3 text-right font-medium md:table-cell">{t("president.colPour")}</th>
                  <th scope="col" className="hidden py-2 pr-3 text-right font-medium md:table-cell">{t("president.colContre")}</th>
                  <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">{t("president.colEntraineur")}</th>
                  <th scope="col" className="hidden py-2 font-medium lg:table-cell">{t("president.colFait")}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {saisons.map((s) => {
                  const fait = faitMarquant(s);
                  return (
                    <tr key={s.id} className="border-b border-border hover:bg-muted">
                      <td className="py-1.5 pr-3 whitespace-nowrap">
                        <Link href={`/saisons/${s.label}`} className="font-semibold text-foreground hover:text-usap-sang">
                          {s.label}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-3 whitespace-nowrap text-muted-foreground">{t(`divisions.${s.division}`)}</td>
                      <td className="py-1.5 pr-3 text-right text-muted-foreground">
                        {s.finalRanking == null ? "" : s.finalRanking === 1 ? t("saison.premier") : t("saison.rang", { n: s.finalRanking })}
                      </td>
                      <td className="py-1.5 pr-3 text-right text-foreground">{s.matchesPlayed ?? ""}</td>
                      <td className="py-1.5 pr-3 text-right text-usap-sang">{s.wins ?? ""}</td>
                      <td className="py-1.5 pr-3 text-right text-foreground">{s.draws ?? ""}</td>
                      <td className="py-1.5 pr-3 text-right text-muted-foreground">{s.losses ?? ""}</td>
                      <td className="hidden py-1.5 pr-3 text-right text-foreground md:table-cell">{s.pointsFor ?? ""}</td>
                      <td className="hidden py-1.5 pr-3 text-right text-muted-foreground md:table-cell">{s.pointsAgainst ?? ""}</td>
                      <td className="hidden py-1.5 pr-3 whitespace-nowrap text-muted-foreground sm:table-cell">
                        {s.coach && (
                          <Link href={`/entraineurs/${s.coach.slug}`} className="hover:text-usap-sang">
                            {s.coach.firstName} {s.coach.lastName}
                          </Link>
                        )}
                      </td>
                      <td className="hidden py-1.5 lg:table-cell">
                        {fait.titres.length > 0 && <span className="font-semibold text-usap-or">{fait.titres.join(", ")}</span>}
                        {fait.titres.length > 0 && fait.reste.length > 0 && <span className="text-muted-foreground">, </span>}
                        {fait.reste.length > 0 && <span className="text-muted-foreground">{fait.reste.join(", ")}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("president.reserveBilans")}</p>
        </section>
      )}

      <Provenance entite="President" id={president.id} langue={locale} />
    </div>
  );
}

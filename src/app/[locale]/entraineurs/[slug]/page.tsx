import Link from "@/components/Lien";
import Provenance from "@/components/Provenance";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MATCH_JOUE, estJoue } from "@/lib/matchs";
import { PALMARES } from "@/lib/constants";
import { passagesDe, sequences, sousSonBanc, type Passage } from "@/lib/staff";
import { formatDateFR } from "@/lib/utils";
import { dictionnaire } from "@/i18n/dictionnaire";
import { LOCALE_INTL, cheminLocalise, type Langue } from "@/i18n/langues";
import type { Metadata } from "next";

/**
 * La fiche d'un entraîneur, refaite le 7 septembre 2026 dans l'identité
 * posée sur les autres fiches. Le nom est en rouge, comme celui d'un
 * joueur — c'est un homme du club. Sous le nom, ses rôles et leurs
 * périodes en une phrase, en séquences contiguës pour ne jamais écrire
 * « de 2005-2006 à 2025-2026 » d'un homme parti dix-huit ans entre les
 * deux ; puis le titre décidé sous son banc en or, comme sur la page de
 * saison. Sa seule audace est **la frise des rencontres jouées sous son
 * banc**, bornée à ses dates de prise et de fin de fonction : les
 * rencontres d'Azéma et de Labit en 2025-2026 ne se comptent pas deux
 * fois. Le bilan tient en une phrase.
 *
 * Puis **la saison par saison**, à la manière de la fiche joueur : rôle
 * avec ses dates au mois près, division, classement, bilan du championnat,
 * fait marquant en mots ; la biographie quand la base en porte une ; la
 * provenance en pied.
 *
 * Ce que la page ne fait plus : cinq cases de chiffres dont deux en vert
 * et rouge de Tailwind, un encadré or à trophée, un emoji et deux flèches
 * vertes et rouges à côté du millésime, une silhouette grise à la place
 * d'une photo qu'aucun entraîneur n'a.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Langue; slug: string }> };

function extractIdFromSlug(slug: string): string | null {
  const match = slug.match(/([a-z0-9]{25,})$/);
  return match ? match[1] : null;
}

const nombre = (n: number) => n.toLocaleString("fr-FR");
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await dictionnaire(locale);
  const id = extractIdFromSlug(slug);
  const coach = id ? await prisma.coach.findUnique({ where: { id }, select: { firstName: true, lastName: true } }) : null;
  if (!coach) return { title: t("entraineur.introuvable") };
  const nom = `${coach.firstName} ${coach.lastName}`;
  return { title: t("entraineur.metaTitre", { nom }), description: t("entraineur.metaDescription", { nom }) };
}

const SAISON = {
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
} as const;

export default async function EntraineurDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await dictionnaire(locale);
  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const coach = await prisma.coach.findUnique({
    where: { id },
    include: {
      seasons: { select: SAISON },
      seasonCoaches: { select: { season: { select: SAISON }, role: true, startDate: true, endDate: true, isInterim: true } },
    },
  });
  if (!coach) notFound();
  if (coach.slug !== slug) redirect(cheminLocalise(`/entraineurs/${coach.slug}`, locale));

  const passages = passagesDe(coach);
  const saisons = [...new Map(passages.map((p) => [p.season.id, p.season])).values()].sort((a, b) => b.startYear - a.startYear);

  // Les rencontres jouées pendant qu'il était sur le banc, à ses dates près.
  const rencontres = saisons.length
    ? await prisma.match.findMany({
        where: { ...MATCH_JOUE, seasonId: { in: saisons.map((s) => s.id) } },
        orderBy: { date: "asc" },
        select: {
          id: true,
          slug: true,
          seasonId: true,
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
  const sous = sousSonBanc(passages, rencontres).filter(estJoue);
  const compte = (r: string) => sous.filter((m) => m.result === r).length;
  const pour = sous.reduce((s, m) => s + m.scoreUsap, 0);
  const contre = sous.reduce((s, m) => s + m.scoreOpponent, 0);
  const borne = passages.some((p) => p.startDate || p.endDate);

  // Les rôles et leurs périodes, en une phrase.
  const ROLES: Record<string, string> = {
    ENTRAINEUR_PRINCIPAL: t("entraineur.rolePrincipal"),
    ENTRAINEUR_ADJOINT: t("saison.roleAdjoint"),
    ENTRAINEUR_AVANTS: t("saison.roleAvants"),
    ENTRAINEUR_ARRIERES: t("saison.roleArrieres"),
    ENTRAINEUR_DEFENSE: t("saison.roleDefense"),
    PREPARATEUR_PHYSIQUE: t("saison.rolePrepa"),
    INTERIMAIRE: t("saison.roleInterimaire"),
  };
  const parRole = new Map<string, Passage[]>();
  for (const p of passages) parRole.set(p.role, [...(parRole.get(p.role) ?? []), p]);
  const roleEnMots = ([role, liste]: [string, Passage[]]) =>
    `${ROLES[role] ?? role.toLowerCase()} ${sequences(liste.map((p) => p.season))
      .map((seq) => (seq.n === 1 ? t("entraineur.sequenceUne", { saison: seq.premiere.label }) : t("entraineur.sequence", { debut: seq.premiere.label, fin: seq.derniere.label })))
      .join(t("entraineur.puis"))}`;
  const presentation = [...parRole.entries()].map(roleEnMots).join(t("entraineur.roleEt"));

  // Le titre décidé sous son banc, en or.
  const est = (liste: readonly number[], annee: number) => liste.includes(annee);
  const annees = (liste: typeof saisons) => liste.map((s) => s.endYear).sort().join(t("entraineurs.et"));
  const champions = saisons.filter((s) => est(PALMARES.titresChampion, s.endYear));
  const proD2 = saisons.filter((s) => est(PALMARES.titresProD2, s.endYear));
  const promus = saisons.filter((s) => s.promoted && !est(PALMARES.titresProD2, s.endYear));
  const titres = [
    champions.length > 0 && t("entraineur.titreChampion", { annees: annees(champions) }),
    proD2.length > 0 && t("entraineur.titreProD2", { annees: annees(proD2) }),
    promus.length > 0 && t("entraineur.titrePromu", { annees: annees(promus) }),
  ].filter(Boolean) as string[];

  // Une prise ou une fin de fonction en cours de saison, au mois près.
  const mois = (d: Date) => d.toLocaleDateString(LOCALE_INTL[locale], { month: "long" });
  const periodeDe = (p: Passage) =>
    p.startDate && p.endDate
      ? t("saison.staffDe", { debut: mois(p.startDate), fin: mois(p.endDate) })
      : p.startDate
        ? t("saison.staffDepuis", { mois: mois(p.startDate) })
        : p.endDate
          ? t("saison.staffJusqua", { mois: mois(p.endDate) })
          : null;
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
  const premiere = sous[0];
  const derniere = sous[sous.length - 1];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/entraineurs" className="hover:text-usap-sang">
          {t("entraineur.filAriane")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">
          {coach.firstName} {coach.lastName}
        </span>
      </nav>

      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start">
        {coach.photoUrl && (
          <div className="shrink-0">
            <Image src={coach.photoUrl} alt="" width={160} height={160} className="h-40 w-40 rounded-xs object-cover" priority />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display text-3xl leading-none text-foreground sm:text-4xl">{coach.firstName}</p>
          <h1 className="font-display text-6xl uppercase leading-[0.9] text-usap-sang sm:text-8xl">{coach.lastName}</h1>
          {(presentation || coach.role) && (
            <p className="mt-2 text-lg text-muted-foreground">
              {coach.role && coach.role.toLowerCase() !== ROLES.ENTRAINEUR_PRINCIPAL && `${coach.role}. `}
              {presentation && `${majuscule(presentation)}.`}
            </p>
          )}
          {titres.length > 0 && <p className="mt-4 font-display text-2xl uppercase text-usap-or">{titres.join(". ")}</p>}
          {sous.length > 0 && (
            <ol aria-label={t("entraineur.friseAria")} className="mt-3 flex flex-wrap gap-x-1.5 font-display text-3xl leading-none sm:text-4xl">
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
              ? t("entraineur.aucune")
              : t(premiere.season.label === derniere.season.label ? "entraineur.bilanUneSaison" : "entraineur.bilan", {
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
          {borne && sous.length > 0 && <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("entraineur.bornes")}</p>}
          {coach.biography && <p className="mt-4 max-w-prose text-sm leading-relaxed text-foreground">{coach.biography}</p>}
        </div>
      </header>

      {passages.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 border-b-2 border-usap-sang pb-1 font-display text-3xl uppercase leading-none text-usap-sang">
            {t("entraineur.saisonsTitre")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">{t("entraineur.colSaison")}</th>
                  <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">{t("entraineur.colRole")}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{t("entraineur.colDivision")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("entraineur.colClassement")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("entraineur.colMatchs")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("entraineur.colVictoires")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("entraineur.colNuls")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("entraineur.colDefaites")}</th>
                  <th scope="col" className="hidden py-2 pr-3 text-right font-medium md:table-cell">{t("entraineur.colPour")}</th>
                  <th scope="col" className="hidden py-2 pr-3 text-right font-medium md:table-cell">{t("entraineur.colContre")}</th>
                  <th scope="col" className="hidden py-2 font-medium lg:table-cell">{t("entraineur.colFait")}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {[...passages].reverse().map((p) => {
                  const s = p.season;
                  const fait = faitMarquant(s);
                  const periode = periodeDe(p);
                  return (
                    <tr key={`${s.id}-${p.role}`} className="border-b border-border hover:bg-muted">
                      <td className="py-1.5 pr-3 whitespace-nowrap">
                        <Link href={`/saisons/${s.label}`} className="font-semibold text-foreground hover:text-usap-sang">
                          {s.label}
                        </Link>
                      </td>
                      <td className="hidden py-1.5 pr-3 text-muted-foreground sm:table-cell">
                        {ROLES[p.role] ?? p.role.toLowerCase()}
                        {p.isInterim && ` (${t("saison.roleInterimaire")})`}
                        {periode && `, ${periode}`}
                      </td>
                      <td className="py-1.5 pr-3 whitespace-nowrap text-muted-foreground">{t(`divisions.${s.division}`)}</td>
                      <td className="py-1.5 pr-3 text-right text-muted-foreground">{s.finalRanking == null ? "" : s.finalRanking === 1 ? t("saison.premier") : t("saison.rang", { n: s.finalRanking })}</td>
                      <td className="py-1.5 pr-3 text-right text-foreground">{s.matchesPlayed ?? ""}</td>
                      <td className="py-1.5 pr-3 text-right text-usap-sang">{s.wins ?? ""}</td>
                      <td className="py-1.5 pr-3 text-right text-foreground">{s.draws ?? ""}</td>
                      <td className="py-1.5 pr-3 text-right text-muted-foreground">{s.losses ?? ""}</td>
                      <td className="hidden py-1.5 pr-3 text-right text-foreground md:table-cell">{s.pointsFor ?? ""}</td>
                      <td className="hidden py-1.5 pr-3 text-right text-muted-foreground md:table-cell">{s.pointsAgainst ?? ""}</td>
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
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("entraineur.reserveBilans")}</p>
        </section>
      )}

      <Provenance entite="Coach" id={coach.id} langue={locale} />
    </div>
  );
}

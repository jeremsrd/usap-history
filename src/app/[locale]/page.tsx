import Link from "@/components/Lien";
import { prisma } from "@/lib/prisma";
import { MATCH_JOUE } from "@/lib/matchs";
import { formatDateFR } from "@/lib/utils";
import { PALMARES, DIVISIONS } from "@/lib/constants";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import { Prisma } from "@prisma/client";

/**
 * L'accueil, refait le 6 septembre 2026 dans l'identité posée sur les
 * fiches et la page de saison. Sa seule audace est le **palmarès écrit en
 * grand** : sous le titre, les sept années du Bouclier en or condensé,
 * chacune liée à sa saison — c'est ce qui fait ce club, et un site
 * d'histoire n'a pas de meilleure ouverture qu'une date. La phrase de
 * présentation dit la source et l'étendue de la base, en chiffres lus dans
 * la base elle-même.
 *
 * Puis, dans l'ordre où un supporter les cherche : le dernier match et le
 * prochain, en une ligne chacun ; la saison en cours avec sa frise des
 * résultats, la même que sur la page de saison ; ce jour dans l'histoire ;
 * et six entrées pour explorer, en texte.
 *
 * Ce que la page ne fait plus : un slogan centré sur un dégradé, un bouton
 * rouge, des cartes à icône pour les chiffres, des pastilles vertes et
 * rouges, des badges pour les années du palmarès, une grille de six cartes
 * à icône pour la navigation que le Header porte déjà.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Langue }> };

// Les rencontres jouées un même jour de l'année, par requête brute : Prisma
// ne sait pas filtrer sur le mois et le jour d'une date.
type CeJour = {
  slug: string;
  date: Date;
  score_usap: number;
  score_opponent: number;
  result: string;
  is_home: boolean;
  opponent_name: string;
  competition_name: string;
};

const nombre = (n: number) => n.toLocaleString("fr-FR");
const saisonDe = (annee: number) => `/saisons/${annee - 1}-${annee}`;
const listeAnnees = (annees: readonly number[]) =>
  annees.length > 1 ? `${annees.slice(0, -1).join(", ")} et ${annees[annees.length - 1]}` : String(annees[0]);

export default async function Home({ params }: Props) {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  const now = new Date();

  // Requêtes séquentielles : le pool de Supabase est étroit.
  const selectionRencontre = {
    slug: true,
    date: true,
    kickoffTime: true,
    scoreUsap: true,
    scoreOpponent: true,
    result: true,
    isHome: true,
    matchday: true,
    round: true,
    competition: { select: { name: true, shortName: true } },
    opponent: { select: { name: true, shortName: true } },
    venue: { select: { name: true, city: true, slug: true } },
  } as const;
  // Un match dont le score n'est pas saisi n'est pas « le dernier match » :
  // le calendrier d'une saison entre en base avant ses résultats.
  const dernier = await prisma.match.findFirst({
    where: { date: { lte: now }, ...MATCH_JOUE },
    orderBy: { date: "desc" },
    select: selectionRencontre,
  });
  const prochain = await prisma.match.findFirst({
    where: { date: { gt: now }, result: null },
    orderBy: { date: "asc" },
    select: selectionRencontre,
  });
  const saison = await prisma.season.findFirst({
    orderBy: { startYear: "desc" },
    select: {
      label: true,
      division: true,
      matches: {
        where: MATCH_JOUE,
        orderBy: { date: "asc" },
        select: { id: true, slug: true, date: true, result: true, isHome: true, scoreUsap: true, scoreOpponent: true, opponent: { select: { name: true, shortName: true } } },
      },
    },
  });
  // Les rencontres à venir ne sont pas des matchs référencés : la page des
  // statistiques compte de la même façon.
  const matchs = await prisma.match.count({ where: MATCH_JOUE });
  const joueurs = await prisma.player.count({
    where: {
      OR: [
        { careerClubs: { some: { isUsap: true } } },
        { matchAppearances: { some: { isOpponent: false } } },
        { seasonSquads: { some: {} } },
      ],
    },
  });
  const saisons = await prisma.season.count();
  const saisonsDocumentees = await prisma.season.count({ where: { matches: { some: MATCH_JOUE } } });

  let ceJour: CeJour[] = [];
  try {
    ceJour = await prisma.$queryRaw<CeJour[]>(
      Prisma.sql`
        SELECT m.slug, m.date, m.score_usap, m.score_opponent, m.result, m.is_home,
               COALESCE(o.short_name, o.name) AS opponent_name, COALESCE(c.short_name, c.name) AS competition_name
        FROM matches m
        JOIN opponents o ON m.opponent_id = o.id
        JOIN competitions c ON m.competition_id = c.id
        WHERE EXTRACT(MONTH FROM m.date) = ${now.getMonth() + 1}
          AND EXTRACT(DAY FROM m.date) = ${now.getDate()}
          AND m.result IS NOT NULL
        ORDER BY m.date DESC
      `,
    );
  } catch {
    // La requête brute échoue en silence : la section dit alors « aucune ».
  }
  const aujourdhui = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  const nomAdverse = (m: { opponent: { name: string; shortName: string | null } }) => m.opponent.shortName || m.opponent.name;
  const affiche = (m: { isHome: boolean; opponent: { name: string; shortName: string | null } }) =>
    m.isHome ? (
      <>
        <span className="font-semibold text-usap-sang">USAP</span> – {nomAdverse(m)}
      </>
    ) : (
      <>
        {nomAdverse(m)} – <span className="font-semibold text-usap-sang">USAP</span>
      </>
    );
  const intitule = (m: { matchday: number | null; round: string | null; competition: { name: string; shortName: string | null } }) => {
    const competition = m.competition.shortName || m.competition.name;
    return m.matchday
      ? t(m.matchday === 1 ? "match.journee" : "match.journeeN", { competition, n: m.matchday })
      : m.round
        ? t("match.tour", { competition, tour: m.round })
        : competition;
  };
  const lettre = (result: string | null) =>
    result === "VICTOIRE"
      ? { texte: "V", classe: "text-usap-sang" }
      : result === "NUL"
        ? { texte: "N", classe: "text-foreground" }
        : { texte: "D", classe: "text-muted-foreground" };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      {/* Le palmarès, écrit en grand */}
      <header className="mb-12">
        <h1 className="font-display text-4xl uppercase leading-none text-foreground sm:text-6xl">{t("accueil.titre")}</h1>
        <p className="mt-6 font-display text-2xl uppercase leading-none text-usap-sang">{t("accueil.champion")}</p>
        <ol className="mt-1 flex flex-wrap gap-x-5 font-display text-6xl leading-none text-usap-or tabular-nums sm:text-8xl">
          {PALMARES.titresChampion.map((annee) => (
            <li key={annee}>
              <Link href={saisonDe(annee)} className="hover:text-usap-sang">
                {annee}
              </Link>
            </li>
          ))}
        </ol>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {t("accueil.finaliste", { annees: listeAnnees(PALMARES.finales) })}, {t("accueil.proD2", { annees: listeAnnees(PALMARES.titresProD2) })},{" "}
          {t("accueil.manoir", { annees: listeAnnees(PALMARES.challengeDuManoir) })}, {t("accueil.europe", { annees: listeAnnees(PALMARES.finaleCoupeEurope) })}.{" "}
          <Link href="/palmares" className="underline hover:text-usap-sang">
            {t("accueil.palmares")}
          </Link>
        </p>
        <p className="mt-6 max-w-prose text-lg leading-snug text-foreground">
          {t("accueil.chapeau")}{" "}
          {t("accueil.chiffres", { matchs: nombre(matchs), joueurs: nombre(joueurs), saisons: saisonsDocumentees, total: saisons })}
        </p>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("accueil.reserve")}</p>
      </header>

      {/* Le dernier match, le prochain */}
      {(dernier || prochain) && (
        <section className="mb-10 grid gap-8 md:grid-cols-2">
          {dernier && (
            <div>
              <Titre>{t("accueil.dernierTitre")}</Titre>
              <p className="text-sm text-muted-foreground">
                {intitule(dernier)}, {t("match.le", { date: formatDateFR(dernier.date) })}.
              </p>
              <p className="mt-1 text-xl text-foreground">
                <Link href={`/matchs/${dernier.slug}`} className="hover:text-usap-sang">
                  {affiche(dernier)}
                </Link>
              </p>
              <p className="mt-1 font-display text-5xl leading-none text-foreground tabular-nums">
                <Link href={`/matchs/${dernier.slug}`} className="hover:text-usap-sang">
                  {dernier.isHome ? dernier.scoreUsap : dernier.scoreOpponent}
                  <span className="mx-2 text-muted-foreground">–</span>
                  {dernier.isHome ? dernier.scoreOpponent : dernier.scoreUsap}
                </Link>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {dernier.result === "VICTOIRE" ? t("match.victoire") : dernier.result === "NUL" ? t("match.nul") : t("match.defaite")}
                {dernier.venue && (
                  <>
                    ,{" "}
                    <Link href={`/stades/${dernier.venue.slug}`} className="hover:text-usap-sang">
                      {dernier.venue.name}, {dernier.venue.city}
                    </Link>
                  </>
                )}
                .
              </p>
            </div>
          )}
          {prochain && (
            <div>
              <Titre encre>{t("accueil.prochainTitre")}</Titre>
              <p className="text-sm text-muted-foreground">
                {intitule(prochain)}, {t("match.le", { date: formatDateFR(prochain.date) })}
                {prochain.kickoffTime ? ` ${t("match.a", { heure: prochain.kickoffTime })}` : ""}.
              </p>
              <p className="mt-1 text-xl text-foreground">
                <Link href={`/matchs/${prochain.slug}`} className="hover:text-usap-sang">
                  {affiche(prochain)}
                </Link>
              </p>
              <p className="mt-1 font-display text-5xl leading-none text-muted-foreground">{t("match.aVenir")}</p>
              {prochain.venue && (
                <p className="mt-1 text-sm text-muted-foreground">
                  <Link href={`/stades/${prochain.venue.slug}`} className="hover:text-usap-sang">
                    {prochain.venue.name}, {prochain.venue.city}
                  </Link>
                  .
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* La saison en cours, et sa frise */}
      {saison && (
        <section className="mb-10">
          <Titre>
            <Link href={`/saisons/${saison.label}`} className="hover:text-usap-or">
              {t("accueil.saisonTitre", { label: saison.label })}
            </Link>
          </Titre>
          <p className="text-sm text-muted-foreground">{DIVISIONS[saison.division] ?? saison.division}.</p>
          {saison.matches.length > 0 && (
            <ol aria-label={t("saison.friseAria")} className="mt-2 flex flex-wrap gap-x-1.5 font-display text-3xl leading-none sm:text-4xl">
              {saison.matches.map((m) => {
                const l = lettre(m.result);
                return (
                  <li key={m.id}>
                    <Link
                      href={`/matchs/${m.slug}`}
                      title={`${formatDateFR(m.date)}, ${m.isHome ? `USAP – ${nomAdverse(m)}` : `${nomAdverse(m)} – USAP`}, ${m.isHome ? m.scoreUsap : m.scoreOpponent}-${m.isHome ? m.scoreOpponent : m.scoreUsap}`}
                      className={`${l.classe} hover:text-usap-or`}
                    >
                      {l.texte}
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
          <p className="mt-2 text-sm">
            <Link href={`/saisons/${saison.label}`} className="text-muted-foreground underline hover:text-usap-sang">
              {t("accueil.saisonEntiere")}
            </Link>
          </p>
        </section>
      )}

      {/* Ce jour dans l'histoire */}
      <section className="mb-10">
        <Titre encre>
          {t("accueil.ceJourTitre")}
          <span className="ml-3 text-xl text-muted-foreground">{aujourdhui}</span>
        </Titre>
        {ceJour.length > 0 ? (
          <table className="w-full max-w-3xl border-collapse text-sm">
            <tbody className="tabular-nums">
              {ceJour.map((m) => {
                const l = lettre(m.result);
                return (
                  <tr key={m.slug} className="border-b border-border hover:bg-muted">
                    <td className="py-1.5 pr-4 font-display text-2xl leading-none text-usap-sang">{new Date(m.date).getFullYear()}</td>
                    <td className="py-1.5 pr-4">
                      <Link href={`/matchs/${m.slug}`} className="text-foreground hover:text-usap-sang">
                        {m.is_home ? (
                          <>
                            <span className="font-semibold text-usap-sang">USAP</span> – {m.opponent_name}
                          </>
                        ) : (
                          <>
                            {m.opponent_name} – <span className="font-semibold text-usap-sang">USAP</span>
                          </>
                        )}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">{m.competition_name}</span>
                    </td>
                    <td className="py-1.5 pr-3 text-right font-semibold text-foreground whitespace-nowrap">
                      {m.is_home ? m.score_usap : m.score_opponent} – {m.is_home ? m.score_opponent : m.score_usap}
                    </td>
                    <td className={`py-1.5 text-center font-bold ${l.classe}`}>{l.texte}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground">{t("accueil.ceJourAucun", { date: aujourdhui })}</p>
        )}
      </section>

      {/* Explorer */}
      <section>
        <Titre>{t("accueil.explorerTitre")}</Titre>
        <ul className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["/saisons", "nav.saisons", "accueil.explorerSaisons"],
              ["/matchs", "nav.matchs", "accueil.explorerMatchs"],
              ["/joueurs", "nav.joueurs", "accueil.explorerJoueurs"],
              ["/statistiques", "nav.statistiques", "accueil.explorerStatistiques"],
              ["/adversaires", "nav.adversaires", "accueil.explorerAdversaires"],
              ["/stades", "nav.stades", "accueil.explorerStades"],
            ] as const
          ).map(([href, nom, desc]) => (
            <li key={href}>
              <Link href={href} className="font-semibold text-foreground hover:text-usap-sang">
                {t(nom)}
              </Link>
              <span className="text-muted-foreground">, {t(desc)}.</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Le titre d'une section : la voix condensée de la liste, sous un filet. */
function Titre({ children, encre = false }: { children: React.ReactNode; encre?: boolean }) {
  return (
    <h2
      className={`mb-3 border-b-2 pb-1 font-display text-3xl uppercase leading-none ${
        encre ? "border-foreground text-foreground" : "border-usap-sang text-usap-sang"
      }`}
    >
      {children}
    </h2>
  );
}

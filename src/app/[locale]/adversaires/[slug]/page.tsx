import Link from "@/components/Lien";
import Provenance from "@/components/Provenance";
import { JoueurCellule } from "@/components/JoueurCellule";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { estJoue } from "@/lib/matchs";
import { formatDateFR } from "@/lib/utils";
import { dictionnaire } from "@/i18n/dictionnaire";
import { cheminLocalise, type Langue } from "@/i18n/langues";
import type { Metadata } from "next";

/**
 * La fiche d'un club adverse, refaite le 6 septembre 2026 dans l'identité
 * posée sur les autres fiches. Sa seule audace est **la frise des
 * confrontations** sous le nom du club — la même que sur la page de
 * saison, V en rouge, N en encre, D en gris, chaque lettre liée à sa
 * rencontre —, qui dit le tête-à-tête d'un coup d'œil, et le bilan en une
 * phrase avec le plus large succès et la plus lourde défaite liés à leur
 * rencontre. L'écusson garde sa place, à gauche du nom, en `logo-club`
 * pour le thème sombre ; le nom du club est en encre, le rouge étant celui
 * de l'USAP.
 *
 * Puis les confrontations en tableau, les réalisateurs catalans contre ce
 * club, et les joueurs passés par les deux maillots — tous, et non les
 * vingt premiers —, la provenance en pied.
 *
 * Ce que la page ne fait plus : sept cases de chiffres, deux cartes verte
 * et rouge pour les records, des pastilles pour les scores, des icônes
 * devant les titres, un drapeau en emoji, un bouclier gris à la place d'un
 * écusson manquant.
 */

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: Langue; slug: string }>;
};

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
  const opponent = id ? await prisma.opponent.findUnique({ where: { id }, select: { name: true, shortName: true } }) : null;
  if (!opponent) return { title: t("adversaire.introuvable") };
  const nom = opponent.shortName || opponent.name;
  return { title: t("adversaire.metaTitre", { nom }), description: t("adversaire.metaDescription", { nom }) };
}

export default async function AdversaireDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await dictionnaire(locale);
  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const opponent = await prisma.opponent.findUnique({
    where: { id },
    include: {
      country: { select: { name: true } },
      venue: { select: { name: true, slug: true } },
      formerNames: { orderBy: { usedFrom: "asc" } },
      matches: {
        orderBy: { date: "desc" },
        select: {
          id: true,
          slug: true,
          date: true,
          scoreUsap: true,
          scoreOpponent: true,
          result: true,
          isHome: true,
          matchday: true,
          round: true,
          season: { select: { label: true } },
          competition: { select: { shortName: true, name: true } },
          venue: { select: { name: true, slug: true } },
        },
      },
    },
  });
  if (!opponent) notFound();
  if (opponent.slug !== slug) redirect(cheminLocalise(`/adversaires/${opponent.slug}`, locale));

  const nom = opponent.shortName || opponent.name;

  // Le tête-à-tête, sur les rencontres jouées : une rencontre à venir n'a ni
  // score ni résultat, elle ne compte dans aucun bilan.
  const jouees = opponent.matches.filter(estJoue);
  const aVenir = opponent.matches.length - jouees.length;
  const victoires = jouees.filter((m) => m.result === "VICTOIRE");
  const defaites = jouees.filter((m) => m.result === "DEFAITE");
  const nuls = jouees.filter((m) => m.result === "NUL");
  const pour = jouees.reduce((s, m) => s + m.scoreUsap, 0);
  const contre = jouees.reduce((s, m) => s + m.scoreOpponent, 0);
  const plusLarge = victoires.length ? victoires.reduce((a, m) => (m.scoreUsap - m.scoreOpponent > a.scoreUsap - a.scoreOpponent ? m : a)) : null;
  const plusLourde = defaites.length ? defaites.reduce((a, m) => (m.scoreOpponent - m.scoreUsap > a.scoreOpponent - a.scoreUsap ? m : a)) : null;
  const premiere = jouees[jouees.length - 1];

  // Les réalisateurs catalans contre ce club, en une lecture des lignes.
  const lignes = await prisma.matchPlayer.findMany({
    where: { matchId: { in: jouees.map((m) => m.id) }, isOpponent: false, playerId: { not: null } },
    select: { playerId: true, totalPoints: true, tries: true },
  });
  const cumuls = new Map<string, { matchs: number; points: number; essais: number }>();
  for (const l of lignes) {
    const c = cumuls.get(l.playerId!) ?? { matchs: 0, points: 0, essais: 0 };
    c.matchs += 1;
    c.points += l.totalPoints;
    c.essais += l.tries;
    cumuls.set(l.playerId!, c);
  }
  const meilleursIds = [...cumuls.entries()]
    .filter(([, c]) => c.points > 0)
    .sort(([, a], [, b]) => b.points - a.points || b.essais - a.essais || a.matchs - b.matchs)
    .slice(0, 10)
    .map(([id]) => id);
  const selectionJoueur = { id: true, slug: true, firstName: true, lastName: true, photoUrl: true, isActive: true } as const;
  const meilleursJoueurs = meilleursIds.length ? await prisma.player.findMany({ where: { id: { in: meilleursIds } }, select: selectionJoueur }) : [];
  const realisateurs = meilleursIds.map((id) => ({ joueur: meilleursJoueurs.find((j) => j.id === id)!, cumul: cumuls.get(id)! }));

  // Passés par les deux clubs, d'après les carrières déduites des feuilles :
  // un passage chez l'adversaire, **et** un lien avéré avec l'USAP — la même
  // condition que la liste des joueurs. Sans la seconde, la page listait
  // tous les joueurs du club adverse, puisque `seed-carrieres.ts` écrit un
  // passage par club à chacun.
  const communs = await prisma.player.findMany({
    where: {
      careerClubs: { some: { opponentId: id } },
      OR: [
        { careerClubs: { some: { isUsap: true } } },
        { matchAppearances: { some: { isOpponent: false } } },
        { seasonSquads: { some: {} } },
      ],
    },
    select: selectionJoueur,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  // L'en-tête, en phrases.
  const periode = (fn: (typeof opponent.formerNames)[number]) =>
    fn.usedFrom && fn.usedUntil
      ? t("adversaire.de", { debut: fn.usedFrom, fin: fn.usedUntil })
      : fn.usedFrom
        ? t("adversaire.depuis", { debut: fn.usedFrom })
        : fn.usedUntil
          ? t("adversaire.jusqua", { fin: fn.usedUntil })
          : null;
  const faits = [
    [opponent.city, opponent.country?.name].filter(Boolean).join(", "),
    opponent.foundedYear && t("adversaire.fonde", { annee: opponent.foundedYear }),
    opponent.venue && (
      <Link key="stade" href={`/stades/${opponent.venue.slug}`} className="hover:text-usap-sang">
        {t("adversaire.stade", { stade: opponent.venue.name })}
      </Link>
    ),
  ].filter(Boolean) as (string | React.ReactElement)[];
  const score = (m: { scoreUsap: number; scoreOpponent: number; date: Date; slug: string }) => (
    <Link href={`/matchs/${m.slug}`} className="hover:text-usap-sang">
      {m.scoreUsap}-{m.scoreOpponent} {t("match.le", { date: formatDateFR(m.date) })}
    </Link>
  );
  const lettre = (result: string | null) =>
    result === "VICTOIRE"
      ? { texte: "V", classe: "text-usap-sang" }
      : result === "NUL"
        ? { texte: "N", classe: "text-foreground" }
        : result === "DEFAITE"
          ? { texte: "D", classe: "text-muted-foreground" }
          : null;
  const intitule = (m: (typeof opponent.matches)[number]) => {
    const c = m.competition.shortName || m.competition.name;
    return m.matchday ? `${c}, J${m.matchday}` : m.round ? `${c}, ${m.round}` : c;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/adversaires" className="hover:text-usap-sang">
          {t("adversaire.filAriane")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{nom}</span>
      </nav>

      {/* L'écusson, le nom, la frise des confrontations */}
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start">
        {opponent.logoUrl && (
          <div className="shrink-0">
            <Image src={opponent.logoUrl} alt={opponent.name} width={160} height={160} className="h-40 w-40 logo-club" priority />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-6xl uppercase leading-[0.9] text-foreground sm:text-8xl">{nom}</h1>
          {(opponent.officialName || opponent.name !== nom) && (
            <p className="mt-2 text-sm text-muted-foreground">
              {opponent.officialName && opponent.officialName !== opponent.name ? opponent.officialName : opponent.name}
              {!opponent.isActive && <span className="ml-3 font-semibold">{t("adversaire.disparu")}</span>}
            </p>
          )}
          {jouees.length > 0 && (
            <ol aria-label={t("adversaire.friseAria")} className="mt-3 flex flex-wrap gap-x-1.5 font-display text-3xl leading-none sm:text-4xl">
              {[...jouees].reverse().map((m) => {
                const l = lettre(m.result)!;
                return (
                  <li key={m.id}>
                    <Link
                      href={`/matchs/${m.slug}`}
                      title={`${formatDateFR(m.date)}, ${m.isHome ? `USAP – ${nom}` : `${nom} – USAP`}, ${m.isHome ? m.scoreUsap : m.scoreOpponent}-${m.isHome ? m.scoreOpponent : m.scoreUsap}`}
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
            {jouees.length === 0
              ? t("adversaire.aucune")
              : t(jouees.length === 1 ? "adversaire.bilanUne" : "adversaire.bilan", {
                  n: jouees.length,
                  saison: premiere.season.label,
                  v: t("saison.victoires", { n: victoires.length }),
                  nu: t("saison.nuls", { n: nuls.length }),
                  d: t("saison.defaites", { n: defaites.length }),
                  pour: nombre(pour),
                  contre: nombre(contre),
                })}
            {aVenir > 0 && ` ${t("adversaire.aVenir", { n: aVenir })}`}
          </p>
          {(plusLarge || plusLourde) && (
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {plusLarge && (
                <>
                  {t("adversaire.plusLarge", { score: "" }).trim()} {score(plusLarge)}
                  {plusLourde ? ", " : "."}
                </>
              )}
              {plusLourde && (
                <>
                  {plusLarge ? t("adversaire.plusLourde", { score: "" }).trim() : majuscule(t("adversaire.plusLourde", { score: "" }).trim())} {score(plusLourde)}.
                </>
              )}
            </p>
          )}
          {faits.length > 0 && (
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {faits.map((f, i) => (
                <span key={i}>
                  {i === 0 && typeof f === "string" ? majuscule(f) : f}
                  {i < faits.length - 1 ? ", " : "."}
                </span>
              ))}
            </p>
          )}
          {opponent.formerNames.length > 0 && (
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {t("adversaire.anciensNoms", {
                noms: opponent.formerNames.map((fn) => `${fn.name}${periode(fn) ? ` (${periode(fn)})` : ""}`).join(", "),
              })}
              .
            </p>
          )}
          {(opponent.primaryColor || opponent.secondaryColor) && (
            <p className="mt-2 flex items-center gap-1.5" aria-label={t("adversaire.couleurs")}>
              {/* Les couleurs du club sont une donnée, non un jeton du thème. */}
              {[opponent.primaryColor, opponent.secondaryColor].filter(Boolean).map((c) => (
                <span key={c} className="inline-block h-4 w-4 rounded-xs border border-border" style={{ backgroundColor: c! }} title={c!} />
              ))}
            </p>
          )}
        </div>
      </header>

      {/* Les confrontations */}
      {opponent.matches.length > 0 && (
        <section className="mb-10">
          <Titre>{t("adversaire.confrontationsTitre")}</Titre>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">{t("adversaire.colDate")}</th>
                  <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">{t("adversaire.colSaison")}</th>
                  <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">{t("adversaire.colCompetition")}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{t("adversaire.colRencontre")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("adversaire.colScore")}</th>
                  <th scope="col" className="py-2 pr-3 text-center font-medium">{t("adversaire.colResultat")}</th>
                  <th scope="col" className="hidden py-2 font-medium md:table-cell">{t("adversaire.colStade")}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {opponent.matches.map((m) => {
                  const joue = estJoue(m);
                  const l = lettre(m.result);
                  return (
                    <tr key={m.id} className="border-b border-border hover:bg-muted">
                      <td className="py-1.5 pr-3 whitespace-nowrap text-muted-foreground">{formatDateFR(m.date)}</td>
                      <td className="hidden py-1.5 pr-3 whitespace-nowrap sm:table-cell">
                        <Link href={`/saisons/${m.season.label}`} className="text-muted-foreground hover:text-usap-sang">
                          {m.season.label}
                        </Link>
                      </td>
                      <td className="hidden py-1.5 pr-3 whitespace-nowrap text-muted-foreground sm:table-cell">{intitule(m)}</td>
                      <td className="py-1.5 pr-3">
                        <Link href={`/matchs/${m.slug}`} className="text-foreground hover:text-usap-sang">
                          {m.isHome ? (
                            <>
                              <span className="font-semibold text-usap-sang">USAP</span> – {nom}
                            </>
                          ) : (
                            <>
                              {nom} – <span className="font-semibold text-usap-sang">USAP</span>
                            </>
                          )}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-3 text-right whitespace-nowrap">
                        {joue ? (
                          <span className="font-semibold text-foreground">
                            {m.isHome ? m.scoreUsap : m.scoreOpponent} – {m.isHome ? m.scoreOpponent : m.scoreUsap}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{t("saison.aVenir")}</span>
                        )}
                      </td>
                      <td className={`py-1.5 pr-3 text-center font-bold ${l?.classe ?? ""}`}>{l?.texte ?? ""}</td>
                      <td className="hidden py-1.5 whitespace-nowrap text-muted-foreground md:table-cell">
                        {m.venue && (
                          <Link href={`/stades/${m.venue.slug}`} className="hover:text-usap-sang">
                            {m.venue.name}
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="mb-10 grid gap-10 lg:grid-cols-[2fr_3fr]">
        {realisateurs.length > 0 && (
          <section>
            <Titre encre>{t("adversaire.realisateursTitre", { nom })}</Titre>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-2 font-medium" />
                  <th scope="col" className="py-2 pr-3 font-medium">{t("adversaire.colJoueur")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("adversaire.colMatchs")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("adversaire.colEssais")}</th>
                  <th scope="col" className="py-2 text-right font-medium">{t("adversaire.colPoints")}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {realisateurs.map((r, i) => (
                  <tr key={r.joueur.id} className="border-b border-border hover:bg-muted">
                    <td className="w-6 py-1 pr-2 text-right text-muted-foreground">{i + 1}</td>
                    <td className="py-1 pr-3">
                      <JoueurCellule
                        slug={r.joueur.slug}
                        firstName={r.joueur.firstName}
                        lastName={r.joueur.lastName}
                        photoUrl={r.joueur.photoUrl}
                        isActive={r.joueur.isActive}
                        libelleActuel={t("joueurs.actuel")}
                      />
                    </td>
                    <td className="py-1 pr-3 text-right text-muted-foreground">{r.cumul.matchs}</td>
                    <td className="py-1 pr-3 text-right text-foreground">{r.cumul.essais || ""}</td>
                    <td className="py-1 text-right font-semibold text-foreground">{r.cumul.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {communs.length > 0 && (
          <section>
            <Titre encre>
              {t("adversaire.communsTitre")}
              <span className="ml-3 text-xl text-muted-foreground">{communs.length}</span>
            </Titre>
            <p className="mb-3 max-w-prose text-sm text-muted-foreground">{t("adversaire.communsNote")}</p>
            <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {communs.map((j) => (
                <li key={j.id} className="border-b border-border py-1">
                  <JoueurCellule
                    slug={j.slug}
                    firstName={j.firstName}
                    lastName={j.lastName}
                    photoUrl={j.photoUrl}
                    isActive={j.isActive}
                    libelleActuel={t("joueurs.actuel")}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <Provenance entite="Opponent" id={opponent.id} />
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

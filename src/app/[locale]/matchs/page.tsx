import Link from "@/components/Lien";
import { prisma } from "@/lib/prisma";
import { MATCH_JOUE, estJoue } from "@/lib/matchs";
import { formatDateFR } from "@/lib/utils";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

/**
 * La liste des rencontres, refaite le 6 septembre 2026 dans l'identité
 * posée sur `/joueurs` et `/saisons`. Sa seule audace est la même que
 * là-bas : **l'épine des saisons**, le millésime en rouge condensé au-dessus
 * de ses rencontres, lié à sa page. Ce que la page gagne : **le bilan de la
 * sélection** — filtrer sur un adversaire donne les confrontations et leur
 * compte, victoires, nuls, défaites, points pour et contre —, et le
 * résultat comme un filtre en liens plutôt qu'un menu.
 *
 * Les filtres de saison, de compétition et d'adversaire restent des menus :
 * cent vingt saisons et soixante adversaires ne tiennent pas en liens.
 *
 * Ce que la page ne fait plus : des logos dans chaque ligne, des pastilles
 * vertes et rouges pour le score, un cadre arrondi, une colonne de saison
 * que l'épine remplace.
 */

export const dynamic = "force-dynamic";

const PAR_PAGE = 50;

type Props = {
  params: Promise<{ locale: Langue }>;
  searchParams: Promise<{ page?: string; saison?: string; competition?: string; adversaire?: string; resultat?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  return { title: t("matchs.metaTitre"), description: t("matchs.metaDescription") };
}

const nombre = (n: number) => n.toLocaleString("fr-FR");

export default async function MatchsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  const q = await searchParams;
  const page = Math.max(1, Number(q.page) || 1);
  const saison = q.saison || undefined;
  const competition = q.competition || undefined;
  const adversaire = q.adversaire || undefined;
  const resultat = q.resultat || undefined;

  const where: Prisma.MatchWhereInput = {};
  if (saison) where.season = { label: saison };
  if (competition) where.competitionId = competition;
  if (adversaire) where.opponentId = adversaire;
  if (resultat === "victoire") where.result = "VICTOIRE";
  else if (resultat === "defaite") where.result = "DEFAITE";
  else if (resultat === "nul") where.result = "NUL";
  else if (resultat === "a-venir") where.result = null;

  // Requêtes séquentielles : le pool de Supabase est étroit.
  const matches = await prisma.match.findMany({
    where,
    orderBy: { date: "desc" },
    skip: (page - 1) * PAR_PAGE,
    take: PAR_PAGE,
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
      competition: { select: { name: true, shortName: true } },
      opponent: { select: { name: true, shortName: true } },
      venue: { select: { name: true, slug: true } },
      season: { select: { label: true } },
    },
  });
  const total = await prisma.match.count({ where });
  // Le bilan de la sélection, sur ses rencontres jouées. `AND` et non un
  // étalement : `MATCH_JOUE` porte `result`, qu'un filtre de résultat porte
  // aussi, et le second écraserait le premier.
  const jouees: Prisma.MatchWhereInput = { AND: [where, MATCH_JOUE] };
  const bilan = await prisma.match.aggregate({
    where: jouees,
    _count: { id: true },
    _sum: { scoreUsap: true, scoreOpponent: true },
  });
  const parResultat = await prisma.match.groupBy({ by: ["result"], where: jouees, _count: { id: true } });
  const compte = (r: "VICTOIRE" | "NUL" | "DEFAITE") => parResultat.find((x) => x.result === r)?._count.id ?? 0;
  const aVenir = total - bilan._count.id;

  // De quand à quand, sur toute la base.
  const premiere = await prisma.match.findFirst({ orderBy: { date: "asc" }, select: { season: { select: { label: true } } } });
  const derniere = await prisma.match.findFirst({ where: MATCH_JOUE, orderBy: { date: "desc" }, select: { season: { select: { label: true } } } });
  const totalBase = await prisma.match.count();

  const seasons = await prisma.season.findMany({ where: { matches: { some: {} } }, orderBy: { startYear: "desc" }, select: { label: true } });
  const competitions = await prisma.competition.findMany({ where: { matches: { some: {} } }, orderBy: { name: "asc" }, select: { id: true, name: true, shortName: true } });
  // Triés sur le nom affiché : « Béziers » et non « AS Béziers ».
  const opponents = (await prisma.opponent.findMany({ where: { matches: { some: {} } }, select: { id: true, name: true, shortName: true } })).sort((a, b) =>
    (a.shortName || a.name).localeCompare(b.shortName || b.name, "fr"),
  );

  const lien = (modif: Partial<{ page: number; resultat: string | undefined }> = {}) => {
    const qs = new URLSearchParams();
    const p = modif.page ?? 1;
    if (p > 1) qs.set("page", String(p));
    if (saison) qs.set("saison", saison);
    if (competition) qs.set("competition", competition);
    if (adversaire) qs.set("adversaire", adversaire);
    const r = "resultat" in modif ? modif.resultat : resultat;
    if (r) qs.set("resultat", r);
    const s = qs.toString();
    return s ? `/matchs?${s}` : "/matchs";
  };
  const filtreActif = !!(saison || competition || adversaire || resultat);
  const totalPages = Math.max(1, Math.ceil(total / PAR_PAGE));

  // Par saison, la plus récente en tête — l'ordre des rencontres est déjà le bon.
  const groupes = new Map<string, typeof matches>();
  for (const m of matches) groupes.set(m.season.label, [...(groupes.get(m.season.label) ?? []), m]);

  const lettre = (result: string | null) =>
    result === "VICTOIRE"
      ? { texte: "V", classe: "text-usap-sang" }
      : result === "NUL"
        ? { texte: "N", classe: "text-foreground" }
        : result === "DEFAITE"
          ? { texte: "D", classe: "text-muted-foreground" }
          : null;
  const intitule = (m: (typeof matches)[number]) => {
    const c = m.competition.shortName || m.competition.name;
    return m.matchday ? `${c}, J${m.matchday}` : m.round ? `${c}, ${m.round}` : c;
  };
  const select = "rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12">
        <h1 className="font-display text-7xl uppercase leading-none text-usap-sang sm:text-8xl">{t("matchs.titre")}</h1>
        <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">
          {t("matchs.chapeau", { n: nombre(totalBase), debut: premiere?.season.label ?? "", fin: derniere?.season.label ?? "" })}
        </p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("matchs.reserve")}</p>
      </header>

      {/* Les filtres : trois menus, et le résultat en liens. */}
      <div className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-border pb-6">
        <form className="flex flex-wrap items-stretch gap-2">
          <select name="saison" defaultValue={saison ?? ""} aria-label={t("matchs.toutesSaisons")} className={select}>
            <option value="">{t("matchs.toutesSaisons")}</option>
            {seasons.map((s) => (
              <option key={s.label} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>
          <select name="competition" defaultValue={competition ?? ""} aria-label={t("matchs.toutesCompetitions")} className={select}>
            <option value="">{t("matchs.toutesCompetitions")}</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName || c.name}
              </option>
            ))}
          </select>
          <select name="adversaire" defaultValue={adversaire ?? ""} aria-label={t("matchs.tousAdversaires")} className={select}>
            <option value="">{t("matchs.tousAdversaires")}</option>
            {opponents.map((o) => (
              <option key={o.id} value={o.id}>
                {o.shortName || o.name}
              </option>
            ))}
          </select>
          {resultat && <input type="hidden" name="resultat" value={resultat} />}
          <button type="submit" className="rounded-sm bg-usap-sang px-4 py-2 text-sm font-semibold text-white hover:bg-foreground">
            {t("matchs.filtrer")}
          </button>
        </form>
        <nav aria-label={t("matchs.resultatAria")} className="flex flex-wrap gap-x-5 text-sm">
          {(
            [
              [undefined, "matchs.tous"],
              ["victoire", "matchs.victoires"],
              ["nul", "matchs.nuls"],
              ["defaite", "matchs.defaites"],
              ["a-venir", "matchs.aVenir"],
            ] as const
          ).map(([valeur, cle]) => (
            <Filtre key={cle} href={lien({ resultat: valeur })} actif={resultat === valeur}>
              {t(cle)}
            </Filtre>
          ))}
        </nav>
        {filtreActif && (
          <Link href="/matchs" className="text-sm text-muted-foreground underline hover:text-usap-sang">
            {t("matchs.reinitialiser")}
          </Link>
        )}
      </div>

      {/* Le bilan de la sélection */}
      <p className="mb-6 max-w-prose text-sm text-muted-foreground">
        {bilan._count.id > 0 &&
          t(bilan._count.id === 1 ? "matchs.bilanUne" : "matchs.bilan", {
            n: nombre(bilan._count.id),
            v: t("saison.victoires", { n: compte("VICTOIRE") }),
            nu: t("saison.nuls", { n: compte("NUL") }),
            d: t("saison.defaites", { n: compte("DEFAITE") }),
            pour: nombre(bilan._sum.scoreUsap ?? 0),
            contre: nombre(bilan._sum.scoreOpponent ?? 0),
          })}
        {aVenir > 0 && ` ${t("matchs.aVenirCompte", { n: aVenir })}`}
      </p>

      {matches.length === 0 ? (
        <p className="text-muted-foreground">{t("matchs.aucun")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 pr-3 font-medium">{t("matchs.colDate")}</th>
                <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">{t("matchs.colCompetition")}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t("matchs.colRencontre")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("matchs.colScore")}</th>
                <th scope="col" className="py-2 pr-3 text-center font-medium">{t("matchs.colResultat")}</th>
                <th scope="col" className="hidden py-2 font-medium md:table-cell">{t("matchs.colStade")}</th>
              </tr>
            </thead>
            {[...groupes.entries()].map(([label, liste]) => (
              <tbody key={label} className="tabular-nums">
                <tr>
                  <th scope="rowgroup" colSpan={6} className="border-b-2 border-usap-sang pt-8 pb-1 text-left font-display text-5xl leading-none text-usap-sang">
                    <Link href={`/saisons/${label}`} className="hover:text-usap-or">
                      {label}
                    </Link>
                  </th>
                </tr>
                {liste.map((m) => {
                  const joue = estJoue(m);
                  const l = lettre(m.result);
                  const opp = m.opponent.shortName || m.opponent.name;
                  return (
                    <tr key={m.id} className="border-b border-border hover:bg-muted">
                      <td className="py-1.5 pr-3 whitespace-nowrap text-muted-foreground">{formatDateFR(m.date)}</td>
                      <td className="hidden py-1.5 pr-3 whitespace-nowrap text-muted-foreground sm:table-cell">{intitule(m)}</td>
                      <td className="py-1.5 pr-3">
                        <Link href={`/matchs/${m.slug}`} className="text-foreground hover:text-usap-sang">
                          {m.isHome ? (
                            <>
                              <span className="font-semibold text-usap-sang">USAP</span> – {opp}
                            </>
                          ) : (
                            <>
                              {opp} – <span className="font-semibold text-usap-sang">USAP</span>
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
            ))}
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-8 flex flex-wrap items-baseline gap-x-6 text-sm text-muted-foreground">
          {page > 1 && (
            <Link href={lien({ page: page - 1 })} className="underline hover:text-usap-sang">
              {t("matchs.precedente")}
            </Link>
          )}
          <span>{t("matchs.page", { page, total: totalPages })}</span>
          {page < totalPages && (
            <Link href={lien({ page: page + 1 })} className="underline hover:text-usap-sang">
              {t("matchs.suivante")}
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

/** Un filtre est un lien : l'actif en rouge et souligné, les autres en encre. */
function Filtre({ href, actif, children }: { href: string; actif: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={actif ? "font-semibold text-usap-sang underline underline-offset-4" : "text-foreground hover:text-usap-sang"}
    >
      {children}
    </Link>
  );
}


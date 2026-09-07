import Link from "@/components/Lien";
import Provenance from "@/components/Provenance";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { estJoue } from "@/lib/matchs";
import { formatDateFR } from "@/lib/utils";
import { dictionnaire } from "@/i18n/dictionnaire";
import { cheminLocalise, type Langue } from "@/i18n/langues";
import type { Metadata } from "next";

/**
 * La fiche d'un arbitre, refaite le 7 septembre 2026 dans l'identité posée
 * sur les autres fiches. Le nom est en encre — le rouge est celui de
 * l'USAP, et un arbitre n'a pas de camp —, le prénom au-dessus, comme le
 * dos de maillot de la fiche joueur sans le numéro. Sa seule audace est
 * **la frise des rencontres sifflées**, la même que sur la page de saison
 * et la fiche stade : le bilan catalan sous son sifflet d'un coup d'œil.
 *
 * Le reste est dit en phrases : le bilan, la part de ses désignations à
 * domicile et à l'extérieur, et **les cartons qu'il a distribués** — jaunes
 * et rouges, des deux camps, comptés sur les feuilles de ses rencontres ;
 * c'est la seule donnée de la base qui soit propre à un arbitre. Puis les
 * rencontres en tableau, avec le stade, les cartons du match et
 * l'affluence ; la provenance en pied.
 *
 * Ce que la page ne fait plus : quatre cases de chiffres dont deux en vert
 * et rouge de Tailwind, une icône de calendrier devant le titre, une
 * silhouette grise à la place d'une photo qu'aucun arbitre n'a, des
 * pastilles pour les scores.
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
  const referee = id ? await prisma.referee.findUnique({ where: { id }, select: { firstName: true, lastName: true } }) : null;
  if (!referee) return { title: t("arbitre.introuvable") };
  const nom = `${referee.firstName} ${referee.lastName}`;
  return { title: t("arbitre.metaTitre", { nom }), description: t("arbitre.metaDescription", { nom }) };
}

export default async function ArbitreDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await dictionnaire(locale);
  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const referee = await prisma.referee.findUnique({
    where: { id },
    include: {
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
          attendance: true,
          competition: { select: { shortName: true, name: true } },
          opponent: { select: { shortName: true, name: true } },
          season: { select: { label: true } },
          venue: { select: { name: true, slug: true } },
          players: {
            where: { OR: [{ yellowCard: true }, { redCard: true }] },
            select: { isOpponent: true, yellowCard: true, redCard: true },
          },
        },
      },
    },
  });
  if (!referee) notFound();
  if (referee.slug !== slug) redirect(cheminLocalise(`/arbitres/${referee.slug}`, locale));

  // Le bilan de l'USAP sous son sifflet, sur les rencontres jouées.
  const jouees = referee.matches.filter(estJoue);
  const compte = (r: string) => jouees.filter((m) => m.result === r).length;
  const pour = jouees.reduce((s, m) => s + m.scoreUsap, 0);
  const contre = jouees.reduce((s, m) => s + m.scoreOpponent, 0);
  const premiere = jouees[jouees.length - 1];
  const derniere = jouees[0];
  const domicile = jouees.filter((m) => m.isHome).length;

  // Les cartons, des deux camps, lus sur les feuilles.
  const cartons = { jaunes: 0, rouges: 0, jaunesUsap: 0, rougesUsap: 0 };
  const cartonsDuMatch = (m: (typeof jouees)[number]) => {
    const c = { jaunes: 0, rouges: 0 };
    for (const p of m.players) {
      if (p.yellowCard) c.jaunes++;
      if (p.redCard) c.rouges++;
    }
    return c;
  };
  for (const m of jouees) {
    for (const p of m.players) {
      if (p.yellowCard) {
        cartons.jaunes++;
        if (!p.isOpponent) cartons.jaunesUsap++;
      }
      if (p.redCard) {
        cartons.rouges++;
        if (!p.isOpponent) cartons.rougesUsap++;
      }
    }
  }

  const nomClub = (o: { name: string; shortName: string | null }) => o.shortName || o.name;
  const lettre = (result: string | null) =>
    result === "VICTOIRE"
      ? { texte: "V", classe: "text-usap-sang" }
      : result === "NUL"
        ? { texte: "N", classe: "text-foreground" }
        : result === "DEFAITE"
          ? { texte: "D", classe: "text-muted-foreground" }
          : null;
  const affiche = (m: { isHome: boolean; opponent: { name: string; shortName: string | null } }) =>
    m.isHome ? `USAP – ${nomClub(m.opponent)}` : `${nomClub(m.opponent)} – USAP`;
  const intitule = (m: (typeof referee.matches)[number]) => {
    const c = m.competition.shortName || m.competition.name;
    return m.matchday ? `${c}, J${m.matchday}` : m.round ? `${c}, ${m.round}` : c;
  };
  // « 16 cartons jaunes et 1 rouge », sans jamais écrire « 0 rouge ».
  const enMots = (jaunes: number, rouges: number, long = false) =>
    [jaunes > 0 && t(long ? "arbitre.jaunes" : "arbitre.jaunesCourt", { n: jaunes }), rouges > 0 && t("arbitre.rouges", { n: rouges })]
      .filter(Boolean)
      .join(long ? " et " : ", ");
  const cartonsEnMots = (c: { jaunes: number; rouges: number }) => enMots(c.jaunes, c.rouges);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/arbitres" className="hover:text-usap-sang">
          {t("arbitre.filAriane")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">
          {referee.firstName} {referee.lastName}
        </span>
      </nav>

      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start">
        {referee.photoUrl && (
          <div className="shrink-0">
            <Image src={referee.photoUrl} alt="" width={160} height={160} className="h-40 w-40 rounded-xs object-cover" priority />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-foreground">
            <span className="block text-xl leading-none sm:text-2xl">{referee.firstName}</span>
            <span className="block font-display text-6xl uppercase leading-[0.9] sm:text-8xl">{referee.lastName}</span>
          </h1>
          {jouees.length > 0 && (
            <ol aria-label={t("arbitre.friseAria")} className="mt-3 flex flex-wrap gap-x-1.5 font-display text-3xl leading-none sm:text-4xl">
              {[...jouees].reverse().map((m) => {
                const l = lettre(m.result)!;
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
            {jouees.length === 0
              ? t("arbitre.aucune")
              : t(
                  jouees.length === 1 ? "arbitre.bilanUne" : premiere.season.label === derniere.season.label ? "arbitre.bilanUneSaison" : "arbitre.bilan",
                  {
                    n: jouees.length,
                    debut: premiere.season.label,
                    fin: derniere.season.label,
                    v: t("saison.victoires", { n: compte("VICTOIRE") }),
                    nu: t("saison.nuls", { n: compte("NUL") }),
                    d: t("saison.defaites", { n: compte("DEFAITE") }),
                    pour: nombre(pour),
                    contre: nombre(contre),
                  },
                )}
          </p>
          {jouees.length > 1 && (
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {t("arbitre.domicileExterieur", { dom: domicile, ext: jouees.length - domicile })}
            </p>
          )}
          {jouees.length > 0 && (
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {cartons.jaunes + cartons.rouges === 0
                ? t("arbitre.cartonsAucun")
                : cartons.jaunesUsap + cartons.rougesUsap === 0
                  ? t("arbitre.cartonsAucunUsap", { total: enMots(cartons.jaunes, cartons.rouges, true) })
                  : t("arbitre.cartons", { total: enMots(cartons.jaunes, cartons.rouges, true), usap: enMots(cartons.jaunesUsap, cartons.rougesUsap) })}
            </p>
          )}
        </div>
      </header>

      {referee.matches.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 border-b-2 border-usap-sang pb-1 font-display text-3xl uppercase leading-none text-usap-sang">
            {t("arbitre.rencontresTitre")}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">{t("arbitre.colDate")}</th>
                  <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">{t("arbitre.colSaison")}</th>
                  <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">{t("arbitre.colCompetition")}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{t("arbitre.colRencontre")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("arbitre.colScore")}</th>
                  <th scope="col" className="py-2 pr-3 text-center font-medium">{t("arbitre.colResultat")}</th>
                  <th scope="col" className="hidden py-2 pr-3 font-medium lg:table-cell">{t("arbitre.colStade")}</th>
                  <th scope="col" className="hidden py-2 pr-3 font-medium md:table-cell">{t("arbitre.colCartons")}</th>
                  <th scope="col" className="hidden py-2 text-right font-medium md:table-cell">{t("arbitre.colAffluence")}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {referee.matches.map((m) => {
                  const joue = estJoue(m);
                  const l = lettre(m.result);
                  const opp = nomClub(m.opponent);
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
                      <td className="hidden py-1.5 pr-3 whitespace-nowrap text-muted-foreground lg:table-cell">
                        {m.venue && (
                          <Link href={`/stades/${m.venue.slug}`} className="hover:text-usap-sang">
                            {m.venue.name}
                          </Link>
                        )}
                      </td>
                      <td className="hidden py-1.5 pr-3 whitespace-nowrap text-muted-foreground md:table-cell">{joue ? cartonsEnMots(cartonsDuMatch(m)) : ""}</td>
                      <td className="hidden py-1.5 text-right text-muted-foreground md:table-cell">{m.attendance ? nombre(m.attendance) : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Provenance entite="Referee" id={referee.id} />
    </div>
  );
}

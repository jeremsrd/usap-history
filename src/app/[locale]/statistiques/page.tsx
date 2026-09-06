import Link from "@/components/Lien";
import { JoueurCellule } from "@/components/JoueurCellule";
import { prisma } from "@/lib/prisma";
import { MATCH_JOUE, estJoue } from "@/lib/matchs";
import { formatDateFR } from "@/lib/utils";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";

/**
 * La page des statistiques, refaite le 6 septembre 2026 dans l'identité
 * posée sur les autres pages. C'est un carrefour : le bilan, les
 * classements courts qui mènent aux classements complets, les records, les
 * adversaires les plus rencontrés. Sa seule audace est **les trois scores
 * de record écrits en tableau d'affichage** — le plus large succès, la
 * plus lourde défaite, le plus gros score, chacun en grand caractère
 * condensé comme sur la fiche de match, avec sous chacun les quatre
 * suivants en lignes. Un record est un score, et il se lit comme tel.
 *
 * Ce que la page ne fait plus : quatre cases de chiffres à icône, des V
 * verts et des D rouges, des lignes de joueur en cartes, des cartes de
 * record, des flèches au bout des liens. **Et elle ne compte plus les
 * rencontres à venir** dans le tableau des adversaires, ce que faisait
 * l'ancien `groupBy` sans filtre.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Langue }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  return { title: t("statistiques.metaTitre"), description: t("statistiques.metaDescription") };
}

const nombre = (n: number) => n.toLocaleString("fr-FR");
const pourcent = (v: number, j: number) => (j > 0 ? `${Math.round((v / j) * 100)} %` : "");

const selectionJoueur = { id: true, slug: true, firstName: true, lastName: true, photoUrl: true, isActive: true } as const;
const selectionMatch = {
  slug: true,
  date: true,
  scoreUsap: true,
  scoreOpponent: true,
  isHome: true,
  opponent: { select: { name: true, shortName: true } },
  competition: { select: { shortName: true, name: true } },
} as const;

export default async function StatistiquesPage({ params }: Props) {
  const { locale } = await params;
  const t = await dictionnaire(locale);

  // ---- Le bilan, par camp -------------------------------------------------
  // Requêtes séquentielles : le pool de Supabase est étroit.
  const parCamp = await prisma.match.groupBy({ by: ["isHome", "result"], where: MATCH_JOUE, _count: { id: true } });
  const pointsParCamp = await prisma.match.groupBy({ by: ["isHome"], where: MATCH_JOUE, _sum: { scoreUsap: true, scoreOpponent: true } });
  const bilan = (camp?: boolean) => {
    const lignes = parCamp.filter((x) => camp === undefined || x.isHome === camp);
    const compte = (r: string) => lignes.filter((x) => x.result === r).reduce((s, x) => s + x._count.id, 0);
    const points = pointsParCamp.filter((x) => camp === undefined || x.isHome === camp);
    return {
      joues: lignes.reduce((s, x) => s + x._count.id, 0),
      victoires: compte("VICTOIRE"),
      nuls: compte("NUL"),
      defaites: compte("DEFAITE"),
      pour: points.reduce((s, x) => s + (x._sum.scoreUsap ?? 0), 0),
      contre: points.reduce((s, x) => s + (x._sum.scoreOpponent ?? 0), 0),
    };
  };
  const total = bilan();
  const premiere = await prisma.match.findFirst({ where: MATCH_JOUE, orderBy: { date: "asc" }, select: { season: { select: { label: true } } } });

  // ---- Les classements courts ---------------------------------------------
  // Prisma type ses `groupBy` clé par clé : trois branches écrites en clair
  // valent mieux qu'une clé calculée qu'il refuse.
  const classement = async (camp: boolean, cle: "totalPoints" | "tries" | "matchs") => {
    const where = { isOpponent: camp, playerId: { not: null } };
    const lignes: { playerId: string | null; valeur: number }[] =
      cle === "matchs"
        ? (await prisma.matchPlayer.groupBy({ by: ["playerId"], where, _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 10 })).map((a) => ({
            playerId: a.playerId,
            valeur: a._count.id,
          }))
        : cle === "totalPoints"
          ? (
              await prisma.matchPlayer.groupBy({
                by: ["playerId"],
                where,
                _sum: { totalPoints: true },
                orderBy: { _sum: { totalPoints: "desc" } },
                take: 10,
                having: { totalPoints: { _sum: { gt: 0 } } },
              })
            ).map((a) => ({ playerId: a.playerId, valeur: a._sum.totalPoints ?? 0 }))
          : (
              await prisma.matchPlayer.groupBy({
                by: ["playerId"],
                where,
                _sum: { tries: true },
                orderBy: { _sum: { tries: "desc" } },
                take: 10,
                having: { tries: { _sum: { gt: 0 } } },
              })
            ).map((a) => ({ playerId: a.playerId, valeur: a._sum.tries ?? 0 }));
    const joueurs = await prisma.player.findMany({ where: { id: { in: lignes.map((l) => l.playerId!) } }, select: selectionJoueur });
    return lignes.map((l) => ({ joueur: joueurs.find((j) => j.id === l.playerId)!, valeur: l.valeur }));
  };
  const realisateurs = await classement(false, "totalPoints");
  const capes = await classement(false, "matchs");
  const essais = await classement(false, "tries");
  const contreRealisateurs = await classement(true, "totalPoints");
  const contreEssais = await classement(true, "tries");

  // ---- Les records --------------------------------------------------------
  // Prisma ne trie pas sur un écart : on lit large, on trie en mémoire.
  const ecart = (m: { scoreUsap: number; scoreOpponent: number }) => m.scoreUsap - m.scoreOpponent;
  const plusLarges = (await prisma.match.findMany({ where: { result: "VICTOIRE" }, orderBy: { scoreUsap: "desc" }, take: 30, select: selectionMatch }))
    .filter(estJoue)
    .sort((a, b) => ecart(b) - ecart(a))
    .slice(0, 5);
  const plusLourdes = (await prisma.match.findMany({ where: { result: "DEFAITE" }, orderBy: { scoreOpponent: "desc" }, take: 30, select: selectionMatch }))
    .filter(estJoue)
    .sort((a, b) => ecart(a) - ecart(b))
    .slice(0, 5);
  const plusGros = (await prisma.match.findMany({ where: MATCH_JOUE, orderBy: { scoreUsap: "desc" }, take: 60, select: selectionMatch }))
    .filter(estJoue)
    .sort((a, b) => b.scoreUsap + b.scoreOpponent - (a.scoreUsap + a.scoreOpponent))
    .slice(0, 5);

  // ---- Les adversaires les plus rencontrés --------------------------------
  const parAdversaire = await prisma.match.groupBy({
    by: ["opponentId"],
    where: MATCH_JOUE,
    _count: { id: true },
    _sum: { scoreUsap: true, scoreOpponent: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });
  const ids = parAdversaire.map((o) => o.opponentId);
  const opponents = await prisma.opponent.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, shortName: true, slug: true } });
  const resultatsAdversaires = await prisma.match.groupBy({ by: ["opponentId", "result"], where: { ...MATCH_JOUE, opponentId: { in: ids } }, _count: { id: true } });
  const adversaires = parAdversaire.map((o) => {
    const compte = (r: string) => resultatsAdversaires.find((x) => x.opponentId === o.opponentId && x.result === r)?._count.id ?? 0;
    return {
      ...opponents.find((x) => x.id === o.opponentId)!,
      matchs: o._count.id,
      victoires: compte("VICTOIRE"),
      nuls: compte("NUL"),
      defaites: compte("DEFAITE"),
      pour: o._sum.scoreUsap ?? 0,
      contre: o._sum.scoreOpponent ?? 0,
    };
  });

  const nomClub = (o: { name: string; shortName: string | null }) => o.shortName || o.name;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12">
        <h1 className="font-display text-6xl uppercase leading-none text-usap-sang sm:text-8xl">{t("statistiques.titre")}</h1>
        <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">
          {t("statistiques.chapeau", {
            n: nombre(total.joues),
            saison: premiere?.season.label ?? "",
            v: t("saison.victoires", { n: total.victoires }),
            nu: t("saison.nuls", { n: total.nuls }),
            d: t("saison.defaites", { n: total.defaites }),
            pour: nombre(total.pour),
            contre: nombre(total.contre),
          })}
        </p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("statistiques.reserve")}</p>
      </header>

      {/* Le bilan */}
      <section className="mb-10">
        <Titre>{t("statistiques.bilanTitre")}</Titre>
        <table className="w-full max-w-3xl border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium" />
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("statistiques.colJoues")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("statistiques.colVictoires")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("statistiques.colNuls")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("statistiques.colDefaites")}</th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("statistiques.colPour")}</th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("statistiques.colContre")}</th>
              <th scope="col" className="py-2 text-right font-medium">{t("statistiques.colTaux")}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {(
              [
                ["statistiques.total", total, true],
                ["statistiques.domicile", bilan(true), false],
                ["statistiques.exterieur", bilan(false), false],
              ] as const
            ).map(([cle, b, gras]) => (
              <tr key={cle} className={`border-b border-border ${gras ? "font-semibold" : ""}`}>
                <td className="py-1.5 pr-4 text-foreground">{t(cle)}</td>
                <td className="py-1.5 pr-3 text-right text-foreground">{nombre(b.joues)}</td>
                <td className="py-1.5 pr-3 text-right text-usap-sang">{b.victoires}</td>
                <td className="py-1.5 pr-3 text-right text-foreground">{b.nuls}</td>
                <td className="py-1.5 pr-3 text-right text-muted-foreground">{b.defaites}</td>
                <td className="hidden py-1.5 pr-3 text-right text-foreground sm:table-cell">{nombre(b.pour)}</td>
                <td className="hidden py-1.5 pr-3 text-right text-muted-foreground sm:table-cell">{nombre(b.contre)}</td>
                <td className="py-1.5 text-right text-foreground">{pourcent(b.victoires, b.joues)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Les joueurs */}
      <section className="mb-10 grid gap-8 lg:grid-cols-3">
        <Classement titre={t("statistiques.realisateursTitre")} lignes={realisateurs} valeur={(n) => t("saison.valeurPoints", { n })} lien="/realisateurs#points" libelleLien={t("statistiques.classementComplet")} libelleActuel={t("joueurs.actuel")} />
        <Classement titre={t("statistiques.capesTitre")} lignes={capes} valeur={(n) => t("saison.valeurMatchs", { n })} lien="/centurions" libelleLien={t("statistiques.classementComplet")} libelleActuel={t("joueurs.actuel")} />
        <Classement titre={t("statistiques.essaisTitre")} lignes={essais} valeur={(n) => t("saison.valeurEssais", { n })} lien="/realisateurs#essais" libelleLien={t("statistiques.classementComplet")} libelleActuel={t("joueurs.actuel")} />
      </section>

      {/* Contre l'USAP */}
      {(contreRealisateurs.length > 0 || contreEssais.length > 0) && (
        <section className="mb-10">
          <Titre encre>{t("statistiques.contreTitre")}</Titre>
          <p className="mb-4 max-w-prose text-sm text-muted-foreground">{t("statistiques.contreNote")}</p>
          <div className="grid gap-8 lg:grid-cols-2">
            <Classement titre={t("statistiques.contreRealisateurs")} lignes={contreRealisateurs} valeur={(n) => t("saison.valeurPoints", { n })} libelleActuel={t("joueurs.actuel")} sous />
            <Classement titre={t("statistiques.contreEssais")} lignes={contreEssais} valeur={(n) => t("saison.valeurEssais", { n })} libelleActuel={t("joueurs.actuel")} sous />
          </div>
        </section>
      )}

      {/* Les records, en tableau d'affichage */}
      <section className="mb-10">
        <Titre>
          {t("statistiques.recordsTitre")}
          <Link href="/records" className="ml-3 text-base normal-case text-muted-foreground underline hover:text-usap-sang">
            {t("statistiques.tousLesRecords")}
          </Link>
        </Titre>
        <div className="grid gap-8 lg:grid-cols-3">
          {(
            [
              ["statistiques.plusLarges", plusLarges],
              ["statistiques.plusLourdes", plusLourdes],
              ["statistiques.plusGros", plusGros],
            ] as const
          ).map(([cle, liste]) => {
            const [tete, ...suite] = liste;
            if (!tete) return null;
            return (
              <div key={cle}>
                <h3 className="font-display text-2xl uppercase leading-none text-foreground">{t(cle)}</h3>
                <p className="mt-2 font-display text-5xl leading-none text-foreground tabular-nums">
                  <Link href={`/matchs/${tete.slug}`} className="hover:text-usap-sang">
                    {tete.isHome ? tete.scoreUsap : tete.scoreOpponent}
                    <span className="mx-2 text-muted-foreground">–</span>
                    {tete.isHome ? tete.scoreOpponent : tete.scoreUsap}
                  </Link>
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {tete.isHome ? (
                    <>
                      <span className="font-semibold text-usap-sang">USAP</span> – {nomClub(tete.opponent)}
                    </>
                  ) : (
                    <>
                      {nomClub(tete.opponent)} – <span className="font-semibold text-usap-sang">USAP</span>
                    </>
                  )}
                  <span className="text-muted-foreground">
                    , {tete.competition.shortName || tete.competition.name}, {formatDateFR(tete.date)}
                  </span>
                </p>
                <table className="mt-3 w-full border-collapse text-sm">
                  <tbody className="tabular-nums">
                    {suite.map((m) => (
                      <tr key={m.slug} className="border-b border-border hover:bg-muted">
                        <td className="py-1 pr-3 whitespace-nowrap text-muted-foreground">{formatDateFR(m.date)}</td>
                        <td className="py-1 pr-3">
                          <Link href={`/matchs/${m.slug}`} className="text-foreground hover:text-usap-sang">
                            {m.isHome ? (
                              <>
                                <span className="font-semibold text-usap-sang">USAP</span> – {nomClub(m.opponent)}
                              </>
                            ) : (
                              <>
                                {nomClub(m.opponent)} – <span className="font-semibold text-usap-sang">USAP</span>
                              </>
                            )}
                          </Link>
                        </td>
                        <td className="py-1 text-right whitespace-nowrap font-semibold text-foreground">
                          {m.isHome ? m.scoreUsap : m.scoreOpponent} – {m.isHome ? m.scoreOpponent : m.scoreUsap}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </section>

      {/* Les adversaires les plus rencontrés */}
      {adversaires.length > 0 && (
        <section className="mb-10">
          <Titre encre>
            {t("statistiques.adversairesTitre")}
            <Link href="/adversaires" className="ml-3 text-base normal-case text-muted-foreground underline hover:text-usap-sang">
              {t("statistiques.tousLesAdversaires")}
            </Link>
          </Titre>
          <table className="w-full max-w-3xl border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-medium">{t("statistiques.colAdversaire")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("statistiques.colMatchs")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("statistiques.colVictoires")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("statistiques.colNuls")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("statistiques.colDefaites")}</th>
                <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("statistiques.colPour")}</th>
                <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("statistiques.colContre")}</th>
                <th scope="col" className="py-2 text-right font-medium">{t("statistiques.colTaux")}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {adversaires.map((o) => (
                <tr key={o.id} className="border-b border-border hover:bg-muted">
                  <td className="py-1.5 pr-4">
                    <Link href={`/adversaires/${o.slug}`} className="font-semibold text-foreground hover:text-usap-sang">
                      {nomClub(o)}
                    </Link>
                  </td>
                  <td className="py-1.5 pr-3 text-right font-semibold text-foreground">{o.matchs}</td>
                  <td className="py-1.5 pr-3 text-right text-usap-sang">{o.victoires || ""}</td>
                  <td className="py-1.5 pr-3 text-right text-foreground">{o.nuls || ""}</td>
                  <td className="py-1.5 pr-3 text-right text-muted-foreground">{o.defaites || ""}</td>
                  <td className="hidden py-1.5 pr-3 text-right text-foreground sm:table-cell">{o.pour}</td>
                  <td className="hidden py-1.5 pr-3 text-right text-muted-foreground sm:table-cell">{o.contre}</td>
                  <td className="py-1.5 text-right text-foreground">{pourcent(o.victoires, o.matchs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
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

type LigneClassement = {
  joueur: { slug: string; firstName: string; lastName: string; photoUrl: string | null; isActive: boolean };
  valeur: number;
};

/** Un classement court : le rang, le joueur, la valeur, et le lien vers le classement complet. */
function Classement({
  titre,
  lignes,
  valeur,
  lien,
  libelleLien,
  libelleActuel,
  sous = false,
}: {
  titre: string;
  lignes: LigneClassement[];
  valeur: (n: number) => string;
  lien?: string;
  libelleLien?: string;
  libelleActuel: string;
  sous?: boolean;
}) {
  if (lignes.length === 0) return null;
  return (
    <div>
      {sous ? (
        <h3 className="mb-2 font-display text-2xl uppercase leading-none text-foreground">{titre}</h3>
      ) : (
        <Titre encre>{titre}</Titre>
      )}
      <table className="w-full border-collapse text-sm">
        <tbody className="tabular-nums">
          {lignes.map((l, i) => (
            <tr key={l.joueur.slug} className="border-b border-border hover:bg-muted">
              <td className="w-6 py-1 pr-2 text-right text-muted-foreground">{i + 1}</td>
              <td className="py-1 pr-3">
                <JoueurCellule
                  slug={l.joueur.slug}
                  firstName={l.joueur.firstName}
                  lastName={l.joueur.lastName}
                  photoUrl={l.joueur.photoUrl}
                  isActive={l.joueur.isActive}
                  libelleActuel={libelleActuel}
                />
              </td>
              <td className="py-1 text-right whitespace-nowrap font-semibold text-foreground">{valeur(l.valeur)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {lien && libelleLien && (
        <p className="mt-2 text-sm">
          <Link href={lien} className="text-muted-foreground underline hover:text-usap-sang">
            {libelleLien}
          </Link>
        </p>
      )}
    </div>
  );
}

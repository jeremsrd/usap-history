import Link from "@/components/Lien";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { MATCH_JOUE } from "@/lib/matchs";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

/**
 * La liste des clubs adverses, refaite le 6 septembre 2026 dans l'identité
 * posée sur `/joueurs`. Sa seule audace est **l'épine des pays** : la
 * France en tête, puis les autres par ordre alphabétique, chaque pays en
 * rouge condensé au-dessus de ses clubs — c'est la structure réelle d'une
 * liste d'adversaires d'un club qui joue le championnat et l'Europe. Une
 * ligne par club : l'écusson à la taille d'un portrait, le nom lié à sa
 * fiche, la ville, la période des confrontations, et **le tête-à-tête** —
 * matchs, victoires, nuls, défaites, points pour et contre —, que la grille
 * de cartes ne disait pas.
 *
 * Ce que la page ne fait plus : une grille de cartes centrées à écusson et
 * drapeau en emoji, un bouclier gris à la place d'un écusson manquant, des
 * pastilles pour le nombre de matchs, des puces de filtre.
 */

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: Langue }>;
  searchParams: Promise<{ q?: string; filtre?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  return { title: t("adversaires.metaTitre"), description: t("adversaires.metaDescription") };
}

/** Le millésime d'une saison d'après une date : une saison commence en été. */
const saisonDe = (d: Date) => {
  const debut = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${debut}-${debut + 1}`;
};

export default async function AdversairesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  const q = await searchParams;
  const recherche = q.q?.trim() || undefined;
  const filtre = q.filtre === "rencontres" || q.filtre === "disparus" ? q.filtre : undefined;

  const where: Prisma.OpponentWhereInput = {};
  if (filtre === "rencontres") where.matches = { some: {} };
  if (filtre === "disparus") where.isActive = false;
  if (recherche) {
    where.OR = [
      { name: { contains: recherche, mode: "insensitive" } },
      { shortName: { contains: recherche, mode: "insensitive" } },
      { city: { contains: recherche, mode: "insensitive" } },
    ];
  }

  // Requêtes séquentielles : le pool de Supabase est étroit.
  const opponents = await prisma.opponent.findMany({
    where,
    select: {
      id: true,
      slug: true,
      name: true,
      shortName: true,
      city: true,
      logoUrl: true,
      isActive: true,
      country: { select: { name: true } },
    },
  });
  const total = await prisma.opponent.count();
  const rencontres = await prisma.opponent.count({ where: { matches: { some: {} } } });
  const disparus = await prisma.opponent.count({ where: { isActive: false } });

  // Le tête-à-tête de chaque club, sur les rencontres jouées.
  const bilans = await prisma.match.groupBy({
    by: ["opponentId"],
    where: MATCH_JOUE,
    _count: { id: true },
    _sum: { scoreUsap: true, scoreOpponent: true },
    _min: { date: true },
    _max: { date: true },
  });
  const parResultat = await prisma.match.groupBy({ by: ["opponentId", "result"], where: MATCH_JOUE, _count: { id: true } });
  const bilanDe = (id: string) => {
    const b = bilans.find((x) => x.opponentId === id);
    if (!b) return null;
    const compte = (r: string) => parResultat.find((x) => x.opponentId === id && x.result === r)?._count.id ?? 0;
    return {
      matchs: b._count.id,
      victoires: compte("VICTOIRE"),
      nuls: compte("NUL"),
      defaites: compte("DEFAITE"),
      pour: b._sum.scoreUsap ?? 0,
      contre: b._sum.scoreOpponent ?? 0,
      premiere: saisonDe(b._min.date!),
      derniere: saisonDe(b._max.date!),
    };
  };

  // Par pays, la France en tête ; puis les clubs par leur nom affiché.
  const nom = (o: (typeof opponents)[number]) => o.shortName || o.name;
  const groupes = new Map<string, typeof opponents>();
  for (const o of opponents) {
    const pays = o.country?.name ?? t("adversaires.sansPays");
    groupes.set(pays, [...(groupes.get(pays) ?? []), o]);
  }
  const pays = [...groupes.keys()].sort((a, b) => (a === "France" ? -1 : b === "France" ? 1 : a.localeCompare(b, "fr")));
  for (const liste of groupes.values()) liste.sort((a, b) => nom(a).localeCompare(nom(b), "fr"));

  const filtreActif = !!(recherche || filtre);
  const lien = (f?: string) => {
    const qs = new URLSearchParams();
    if (recherche) qs.set("q", recherche);
    if (f) qs.set("filtre", f);
    const s = qs.toString();
    return s ? `/adversaires?${s}` : "/adversaires";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12">
        {/* Onze lettres : un cran de moins que « Joueurs » en mobile, sans quoi le S sort de l'écran. */}
        <h1 className="font-display text-6xl uppercase leading-none text-usap-sang sm:text-8xl">{t("adversaires.titre")}</h1>
        <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">{t("adversaires.chapeau", { n: total, rencontres })}</p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("adversaires.reserve")}</p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-border pb-6">
        <form className="flex items-stretch">
          <label htmlFor="q" className="sr-only">
            {t("adversaires.rechercher")}
          </label>
          <input
            id="q"
            type="search"
            name="q"
            placeholder={t("adversaires.rechercher")}
            defaultValue={recherche}
            className="w-56 rounded-l-sm border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
          {filtre && <input type="hidden" name="filtre" value={filtre} />}
          <button type="submit" className="rounded-r-sm bg-usap-sang px-4 py-2 text-sm font-semibold text-white hover:bg-foreground">
            {t("adversaires.lancerRecherche")}
          </button>
        </form>
        <nav aria-label={t("adversaires.filtreAria")} className="flex flex-wrap gap-x-6 text-sm">
          <span>
            <Filtre href={lien()} actif={!filtre}>
              {t("adversaires.tous")}
            </Filtre>
            <Compte n={total} />
          </span>
          <span>
            <Filtre href={lien("rencontres")} actif={filtre === "rencontres"}>
              {t("adversaires.rencontres")}
            </Filtre>
            <Compte n={rencontres} />
          </span>
          <span>
            <Filtre href={lien("disparus")} actif={filtre === "disparus"}>
              {t("adversaires.disparus")}
            </Filtre>
            <Compte n={disparus} />
          </span>
        </nav>
      </div>

      {filtreActif && (
        <p className="mb-3 text-sm text-muted-foreground">
          {t("adversaires.compte", { n: opponents.length })}
          {recherche && t("adversaires.pourRecherche", { q: recherche })}
          {opponents.length === 0 ? "" : "."}{" "}
          {opponents.length === 0 ? null : (
            <Link href="/adversaires" className="underline hover:text-usap-sang">
              {t("adversaires.reinitialiser")}
            </Link>
          )}
        </p>
      )}

      {opponents.length === 0 ? (
        <p className="text-muted-foreground">
          {t("adversaires.aucun")}{" "}
          <Link href="/adversaires" className="underline hover:text-usap-sang">
            {t("adversaires.reinitialiser")}
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 pr-2 font-medium">
                  <span className="sr-only">{t("adversaires.colEcusson")}</span>
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">{t("adversaires.colClub")}</th>
                <th scope="col" className="hidden py-2 pr-4 font-medium sm:table-cell">{t("adversaires.colVille")}</th>
                <th scope="col" className="hidden py-2 pr-4 font-medium md:table-cell">{t("adversaires.colPeriode")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("adversaires.colMatchs")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("adversaires.colVictoires")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("adversaires.colNuls")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("adversaires.colDefaites")}</th>
                <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("adversaires.colPour")}</th>
                <th scope="col" className="hidden py-2 text-right font-medium sm:table-cell">{t("adversaires.colContre")}</th>
              </tr>
            </thead>
            {pays.map((p) => (
              <tbody key={p} className="tabular-nums">
                <tr>
                  <th scope="rowgroup" colSpan={10} className="border-b-2 border-usap-sang pt-8 pb-1 text-left font-display text-5xl leading-none text-usap-sang">
                    {p}
                  </th>
                </tr>
                {groupes.get(p)!.map((o) => {
                  const b = bilanDe(o.id);
                  return (
                    <tr key={o.id} className="border-b border-border hover:bg-muted">
                      <td className="w-9 py-1.5 pr-2 align-middle">
                        {o.logoUrl && <Image src={o.logoUrl} alt="" width={28} height={28} className="h-7 w-7 logo-club" />}
                      </td>
                      <td className="py-1.5 pr-4">
                        <Link href={`/adversaires/${o.slug}`} className="font-semibold text-foreground hover:text-usap-sang">
                          {nom(o)}
                        </Link>
                        {!o.isActive && <span className="ml-2 text-xs text-muted-foreground">{t("adversaires.disparu")}</span>}
                      </td>
                      <td className="hidden py-1.5 pr-4 text-muted-foreground sm:table-cell">{o.city ?? ""}</td>
                      <td className="hidden py-1.5 pr-4 whitespace-nowrap text-muted-foreground md:table-cell">
                        {b ? (b.premiere === b.derniere ? b.premiere : `${b.premiere.slice(0, 4)}-${b.derniere.slice(5)}`) : ""}
                      </td>
                      <td className="py-1.5 pr-3 text-right font-semibold text-foreground">{b?.matchs ?? ""}</td>
                      <td className="py-1.5 pr-3 text-right text-usap-sang">{b?.victoires || ""}</td>
                      <td className="py-1.5 pr-3 text-right text-foreground">{b?.nuls || ""}</td>
                      <td className="py-1.5 pr-3 text-right text-muted-foreground">{b?.defaites || ""}</td>
                      <td className="hidden py-1.5 pr-3 text-right text-foreground sm:table-cell">{b?.pour ?? ""}</td>
                      <td className="hidden py-1.5 text-right text-muted-foreground sm:table-cell">{b?.contre ?? ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
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

function Compte({ n }: { n: number }) {
  return <span className="ml-1 text-muted-foreground tabular-nums">{n}</span>;
}

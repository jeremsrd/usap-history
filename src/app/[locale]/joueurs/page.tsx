import Link from "@/components/Lien";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { POSITIONS } from "@/lib/constants";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";
import type { Position } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * L'annuaire des joueurs — une liste dense, à la façon de lfchistory.net et
 * de cybervulcans.net, et non plus une grille de cartes.
 *
 * **L'épine alphabétique est la seule audace de la page.** La liste est triée
 * par nom : les lettres en sont la structure réelle, et c'est elle qu'on
 * grossit, en rouge et dans la voix condensée d'Archivo. Tout le reste se
 * tait — ni carte, ni pastille, ni portrait de remplacement : 286 joueurs
 * sur 351 n'ont pas de photo, et une icône répétée 286 fois faisait de la
 * page un mur de cercles gris. La case reste vide, ce qui est la vérité.
 *
 * Chaque ligne porte ce qu'un annuaire doit dire d'un homme : poste, période
 * sous le maillot et nombre de matchs, comptés comme sur sa fiche et sur la
 * page des centurions — une feuille sur une rencontre jouée.
 */

type Params = Promise<{ locale: Langue }>;
type Recherche = Promise<{ poste?: string; actif?: string; q?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const t = await dictionnaire((await params).locale);
  return {
    title: t("joueurs.metaTitre"),
    description: t("joueurs.metaDescription"),
  };
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** La lettre de classement d'un nom : sans accent, en capitale. */
function lettreDe(nom: string): string {
  const premiere = nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .charAt(0)
    .toUpperCase();
  return ALPHABET.includes(premiere) ? premiere : "#";
}

export default async function JoueursPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Recherche;
}) {
  const t = await dictionnaire((await params).locale);
  const filtres = await searchParams;
  const positionFilter =
    filtres.poste && filtres.poste in POSITIONS ? filtres.poste : undefined;
  const activeFilter = filtres.actif === "oui" ? "oui" : undefined;
  const searchQuery = filtres.q?.trim() || undefined;

  // Uniquement les joueurs liés à l'USAP : un passage, une carrière, un match
  // sous le maillot ou une ligne d'effectif de saison.
  const usapCondition = {
    OR: [
      { usapStints: { some: {} } },
      { careerClubs: { some: { isUsap: true } } },
      { matchAppearances: { some: { isOpponent: false } } },
      { seasonSquads: { some: {} } },
    ],
  };

  // La recherche s'ajoute à la condition USAP, elle ne la remplace pas : la
  // version précédente écrasait le `OR` et rendait aussi les adversaires.
  const where = {
    AND: [
      usapCondition,
      ...(positionFilter ? [{ position: positionFilter as Position }] : []),
      ...(activeFilter ? [{ isActive: true }] : []),
      ...(searchQuery
        ? [
            {
              OR: [
                { firstName: { contains: searchQuery, mode: "insensitive" as const } },
                { lastName: { contains: searchQuery, mode: "insensitive" as const } },
              ],
            },
          ]
        : []),
    ],
  };

  const [players, totalCount, activeCount, lignes] = await Promise.all([
    prisma.player.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        slug: true,
        firstName: true,
        lastName: true,
        position: true,
        photoUrl: true,
        isActive: true,
        nationality: { select: { name: true, code: true } },
      },
    }),
    prisma.player.count({ where: usapCondition }),
    prisma.player.count({ where: { ...usapCondition, isActive: true } }),
    // Un match se compte comme sur la fiche du joueur : une feuille sur une
    // rencontre jouée, sous le maillot catalan.
    prisma.matchPlayer.findMany({
      where: {
        isOpponent: false,
        playerId: { not: null },
        match: { result: { not: null } },
      },
      select: { playerId: true, match: { select: { date: true } } },
    }),
  ]);

  const bilans = new Map<string, { matchs: number; premier: number; dernier: number }>();
  for (const l of lignes) {
    const annee = l.match.date.getUTCFullYear();
    const b = bilans.get(l.playerId!) ?? { matchs: 0, premier: annee, dernier: annee };
    b.matchs++;
    if (annee < b.premier) b.premier = annee;
    if (annee > b.dernier) b.dernier = annee;
    bilans.set(l.playerId!, b);
  }

  // Les groupes, dans l'ordre des noms — une lettre absente n'a pas d'ancre.
  const groupes = new Map<string, typeof players>();
  for (const p of players) {
    const lettre = lettreDe(p.lastName);
    groupes.set(lettre, [...(groupes.get(lettre) ?? []), p]);
  }

  const filtreActif = Boolean(positionFilter || activeFilter || searchQuery);
  const lienPoste = (poste?: string) =>
    "/joueurs" +
    [poste && `poste=${poste}`, activeFilter && `actif=${activeFilter}`]
      .filter(Boolean)
      .map((q, i) => (i === 0 ? `?${q}` : `&${q}`))
      .join("");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12">
        <h1 className="font-display text-7xl uppercase leading-none text-usap-sang sm:text-8xl">
          {t("joueurs.titre")}
        </h1>
        <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">
          {t("joueurs.chapeau", { n: totalCount, actifs: activeCount })}
        </p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {t("joueurs.reserve")}
        </p>
      </header>

      {/* Les filtres sont des liens, pas des puces : l'actif est en rouge et
          souligné, les autres en encre, et le clavier voit chacun. */}
      <div className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-border pb-6">
        <form className="flex items-stretch">
          <label htmlFor="q" className="sr-only">
            {t("joueurs.rechercher")}
          </label>
          <input
            id="q"
            type="search"
            name="q"
            placeholder={t("joueurs.rechercher")}
            defaultValue={searchQuery}
            className="w-56 rounded-l-sm border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
          {positionFilter && <input type="hidden" name="poste" value={positionFilter} />}
          {activeFilter && <input type="hidden" name="actif" value={activeFilter} />}
          <button
            type="submit"
            className="rounded-r-sm bg-usap-sang px-4 py-2 text-sm font-semibold text-white hover:bg-foreground"
          >
            {t("joueurs.lancerRecherche")}
          </button>
        </form>

        <nav aria-label={t("joueurs.effectifActuel")} className="flex gap-6 text-sm">
          <span>
            <Filtre href={lienPoste(positionFilter)} actif={!activeFilter}>
              {t("joueurs.tous")}
            </Filtre>
            <Compte n={totalCount} />
          </span>
          <span>
            <Filtre
              href={positionFilter ? `/joueurs?poste=${positionFilter}&actif=oui` : "/joueurs?actif=oui"}
              actif={activeFilter === "oui"}
            >
              {t("joueurs.effectifActuel")}
            </Filtre>
            <Compte n={activeCount} />
          </span>
        </nav>
      </div>

      <nav
        aria-label={t("joueurs.entetePoste")}
        className="mb-8 flex flex-wrap gap-x-5 gap-y-2 text-sm"
      >
        {Object.entries(POSITIONS).map(([key, { label }]) => (
          <Filtre key={key} href={lienPoste(key)} actif={positionFilter === key}>
            {label}
          </Filtre>
        ))}
        {positionFilter && (
          <Filtre href={lienPoste()} actif={false}>
            {t("joueurs.tousLesPostes")}
          </Filtre>
        )}
      </nav>

      {/* Le compte du résultat, seulement quand un filtre l'a réduit : sans
          filtre, le chapeau le dit déjà. */}
      {filtreActif && (
        <p className="mb-3 text-sm text-muted-foreground">
          {t("joueurs.compte", { n: players.length })}
          {activeFilter && t("joueurs.dansEffectif")}
          {positionFilter && ` — ${POSITIONS[positionFilter].label}`}
          {searchQuery && t("joueurs.pourRecherche", { q: searchQuery })}
        </p>
      )}

      {players.length > 0 ? (
        <>
          <nav
            aria-label={t("joueurs.indexAria")}
            className="mb-6 flex flex-wrap gap-x-1 font-display text-xl"
          >
            {ALPHABET.map((lettre) =>
              groupes.has(lettre) ? (
                <a
                  key={lettre}
                  href={`#lettre-${lettre}`}
                  className="px-1 text-foreground hover:text-usap-sang"
                >
                  {lettre}
                </a>
              ) : (
                <span
                  key={lettre}
                  aria-label={t("joueurs.lettreVide", { lettre })}
                  className="px-1 text-border"
                >
                  {lettre}
                </span>
              ),
            )}
          </nav>

          <table className="w-full border-collapse text-sm">
            <thead className="sr-only">
              <tr>
                <th scope="col">{t("joueurs.entetePortrait")}</th>
                <th scope="col">{t("joueurs.enteteJoueur")}</th>
                <th scope="col">{t("joueurs.entetePoste")}</th>
                <th scope="col">{t("joueurs.entetePeriode")}</th>
                <th scope="col">{t("joueurs.enteteMatchs")}</th>
              </tr>
            </thead>
            {[...groupes.entries()].map(([lettre, joueurs]) => (
              <tbody key={lettre} id={`lettre-${lettre}`} className="scroll-mt-20">
                <tr>
                  <th
                    scope="rowgroup"
                    colSpan={5}
                    className="border-b-2 border-usap-sang pt-8 pb-1 text-left font-display text-5xl leading-none text-usap-sang"
                  >
                    {lettre}
                  </th>
                </tr>
                {joueurs.map((p) => {
                  const b = bilans.get(p.id);
                  return (
                    <tr key={p.id} className="border-b border-border hover:bg-muted">
                      <td className="w-9 py-1.5 pr-2 align-middle">
                        {p.photoUrl && (
                          <Image
                            src={p.photoUrl}
                            alt=""
                            width={28}
                            height={28}
                            className="h-7 w-7 rounded-xs object-cover"
                          />
                        )}
                      </td>
                      <td className="py-1.5 pr-4 align-middle">
                        <Link
                          href={`/joueurs/${p.slug}`}
                          className="text-foreground hover:text-usap-sang"
                        >
                          {p.firstName}{" "}
                          <span className="font-bold">{p.lastName}</span>
                        </Link>
                        {p.isActive && (
                          <span className="ml-2 text-xs font-semibold text-usap-sang">
                            {t("joueurs.actuel")}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 pr-4 align-middle text-muted-foreground">
                        {p.position ? POSITIONS[p.position]?.label ?? p.position : ""}
                      </td>
                      <td className="hidden py-1.5 pr-4 align-middle text-muted-foreground tabular-nums whitespace-nowrap sm:table-cell">
                        {b && (b.premier === b.dernier ? b.premier : `${b.premier}–${b.dernier}`)}
                      </td>
                      <td className="py-1.5 text-right align-middle tabular-nums">
                        {b ? (
                          <span className="font-semibold text-foreground">{b.matchs}</span>
                        ) : (
                          <span className="text-border">{t("joueurs.sansMatch")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </>
      ) : (
        <p className="border-t-2 border-usap-sang pt-6 text-foreground">
          {t("joueurs.aucun")}{" "}
          {filtreActif && (
            <Link href="/joueurs" className="font-semibold text-usap-sang underline">
              {t("joueurs.reinitialiser")}
            </Link>
          )}
        </p>
      )}
    </div>
  );
}

function Filtre({
  href,
  actif,
  children,
}: {
  href: string;
  actif: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={actif ? "true" : undefined}
      className={
        actif
          ? "font-semibold text-usap-sang underline decoration-2 underline-offset-4"
          : "text-foreground hover:text-usap-sang"
      }
    >
      {children}
    </Link>
  );
}

function Compte({ n }: { n: number }) {
  return <span className="ml-1.5 text-muted-foreground tabular-nums">{n}</span>;
}

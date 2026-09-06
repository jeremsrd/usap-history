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
 * La fiche d'un stade, refaite le 6 septembre 2026 dans l'identité posée
 * sur les autres fiches. Sa seule audace est **la frise des rencontres**
 * jouées là, sous le nom du stade — la même que sur la page de saison ; à
 * Aimé-Giral elle fait un mur de trois cents lettres, et c'est bien
 * l'histoire du lieu. Le bilan tient en une phrase, l'affluence en une
 * autre — moyenne, nombre de rencontres où elle est connue, record lié à sa
 * rencontre —, et qui reçoit là, aujourd'hui et avant, d'après
 * `OpponentVenue`, en une troisième. Le nom du stade est en encre, le
 * rouge étant celui de l'USAP.
 *
 * Puis les rencontres en tableau, avec l'arbitre et l'affluence ; les
 * filtres de saison et de compétition en menus, le résultat en liens, et
 * le compte de la sélection ; la provenance en pied.
 *
 * Ce que la page ne fait plus : quatre cases de chiffres vertes et rouges,
 * des icônes devant chaque fait, une épingle grise à la place d'une photo,
 * des pastilles pour les scores.
 */

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: Langue; slug: string }>;
  searchParams: Promise<{ saison?: string; competition?: string; resultat?: string }>;
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
  const venue = id ? await prisma.venue.findUnique({ where: { id }, select: { name: true, city: true } }) : null;
  if (!venue) return { title: t("stade.introuvable") };
  return { title: t("stade.metaTitre", { nom: venue.name, ville: venue.city }), description: t("stade.metaDescription", { nom: venue.name, ville: venue.city }) };
}

export default async function StadeDetailPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const t = await dictionnaire(locale);
  const q = await searchParams;
  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const venue = await prisma.venue.findUnique({
    where: { id },
    include: {
      country: { select: { name: true } },
      opponents: { select: { name: true, shortName: true, slug: true } },
      opponentStints: {
        orderBy: { untilSeason: "desc" },
        select: { fromSeason: true, untilSeason: true, opponent: { select: { name: true, shortName: true, slug: true } } },
      },
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
          competition: { select: { id: true, shortName: true, name: true } },
          opponent: { select: { shortName: true, name: true } },
          season: { select: { label: true } },
          referee: { select: { firstName: true, lastName: true, slug: true } },
        },
      },
    },
  });
  if (!venue) notFound();
  if (venue.slug !== slug) redirect(cheminLocalise(`/stades/${venue.slug}`, locale));

  // Le bilan de l'USAP ici, sur les rencontres jouées.
  const jouees = venue.matches.filter(estJoue);
  const aVenir = venue.matches.length - jouees.length;
  const compte = (r: string) => jouees.filter((m) => m.result === r).length;
  const pour = jouees.reduce((s, m) => s + m.scoreUsap, 0);
  const contre = jouees.reduce((s, m) => s + m.scoreOpponent, 0);
  const premiere = jouees[jouees.length - 1];
  const avecAffluence = jouees.filter((m) => m.attendance != null && m.attendance > 0);
  const record = avecAffluence.length ? avecAffluence.reduce((a, m) => (m.attendance! > a.attendance! ? m : a)) : null;
  const moyenne = avecAffluence.length ? Math.round(avecAffluence.reduce((s, m) => s + m.attendance!, 0) / avecAffluence.length) : null;

  // Les filtres, sur les rencontres déjà lues.
  const saison = q.saison || undefined;
  const competition = q.competition || undefined;
  const resultat = q.resultat || undefined;
  const saisons = [...new Set(venue.matches.map((m) => m.season.label))].sort((a, b) => b.localeCompare(a));
  const competitions = [...new Map(venue.matches.map((m) => [m.competition.id, m.competition])).values()].sort((a, b) =>
    (a.shortName || a.name).localeCompare(b.shortName || b.name, "fr"),
  );
  const selection = venue.matches.filter((m) => {
    if (saison && m.season.label !== saison) return false;
    if (competition && m.competition.id !== competition) return false;
    if (resultat === "victoire" && m.result !== "VICTOIRE") return false;
    if (resultat === "defaite" && m.result !== "DEFAITE") return false;
    if (resultat === "nul" && m.result !== "NUL") return false;
    if (resultat === "a-venir" && m.result !== null) return false;
    return true;
  });
  const filtreActif = !!(saison || competition || resultat);
  const lien = (r: string | undefined) => {
    const qs = new URLSearchParams();
    if (saison) qs.set("saison", saison);
    if (competition) qs.set("competition", competition);
    if (r) qs.set("resultat", r);
    const s = qs.toString();
    return s ? `/stades/${venue.slug}?${s}` : `/stades/${venue.slug}`;
  };

  // L'en-tête, en phrases.
  const faits = [
    [venue.city, venue.country?.name].filter(Boolean).join(", "),
    venue.capacity && t("stade.places", { n: nombre(venue.capacity) }),
    venue.yearOpened && t("stade.ouvert", { annee: venue.yearOpened }),
  ].filter(Boolean) as string[];
  const nomClub = (o: { name: string; shortName: string | null }) => o.shortName || o.name;
  const libelleSaison = (annee: number) => `${annee}-${annee + 1}`;
  const occupants = [
    venue.isHomeGround && t("stade.domicile"),
    ...venue.opponents.map((o) => (
      <Link key={o.slug} href={`/adversaires/${o.slug}`} className="hover:text-usap-sang">
        {t("stade.terrainDe", { club: nomClub(o) })}
      </Link>
    )),
    ...venue.opponentStints.map((s) => (
      <Link key={`${s.opponent.slug}-${s.untilSeason}`} href={`/adversaires/${s.opponent.slug}`} className="hover:text-usap-sang">
        {s.fromSeason && s.untilSeason
          ? t("stade.terrainDeEntre", { club: nomClub(s.opponent), debut: libelleSaison(s.fromSeason), fin: libelleSaison(s.untilSeason) })
          : s.untilSeason
            ? t("stade.terrainDeJusqua", { club: nomClub(s.opponent), saison: libelleSaison(s.untilSeason) })
            : s.fromSeason
              ? t("stade.terrainDeDepuis", { club: nomClub(s.opponent), saison: libelleSaison(s.fromSeason) })
              : t("stade.terrainDe", { club: nomClub(s.opponent) })}
      </Link>
    )),
  ].filter(Boolean) as (string | React.ReactElement)[];

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
  const intitule = (m: (typeof venue.matches)[number]) => {
    const c = m.competition.shortName || m.competition.name;
    return m.matchday ? `${c}, J${m.matchday}` : m.round ? `${c}, ${m.round}` : c;
  };
  const select = "rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/stades" className="hover:text-usap-sang">
          {t("stade.filAriane")}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{venue.name}</span>
      </nav>

      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start">
        {venue.photoUrl && (
          <div className="shrink-0">
            <Image src={venue.photoUrl} alt={venue.name} width={160} height={160} className="h-40 w-40 rounded-xs object-cover" priority />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-5xl uppercase leading-[0.9] text-foreground sm:text-7xl">{venue.name}</h1>
          {faits.length > 0 && <p className="mt-2 text-lg text-muted-foreground">{faits.join(", ")}.</p>}
          {jouees.length > 0 && (
            <ol aria-label={t("stade.friseAria")} className="mt-3 flex flex-wrap gap-x-1.5 font-display text-3xl leading-none sm:text-4xl">
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
              ? t("stade.aucune")
              : t(jouees.length === 1 ? "stade.bilanUne" : "stade.bilan", {
                  n: jouees.length,
                  saison: premiere.season.label,
                  v: t("saison.victoires", { n: compte("VICTOIRE") }),
                  nu: t("saison.nuls", { n: compte("NUL") }),
                  d: t("saison.defaites", { n: compte("DEFAITE") }),
                  pour: nombre(pour),
                  contre: nombre(contre),
                })}
            {aVenir > 0 && ` ${t("stade.aVenir", { n: aVenir })}`}
          </p>
          {record && moyenne != null && (
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {avecAffluence.length === 1
                ? t("stade.affluenceUne", { record: nombre(record.attendance!) })
                : t("stade.affluence", { moyenne: nombre(moyenne), n: avecAffluence.length, record: nombre(record.attendance!) })}{" "}
              <Link href={`/matchs/${record.slug}`} className="hover:text-usap-sang">
                le {formatDateFR(record.date)}, {affiche(record)}
              </Link>
              .
            </p>
          )}
          {occupants.length > 0 && (
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {occupants.map((o, i) => (
                <span key={i}>
                  {typeof o === "string" ? majuscule(o) : o}
                  {i < occupants.length - 1 ? ". " : "."}
                </span>
              ))}
            </p>
          )}
          {venue.notes && <p className="mt-4 max-w-prose text-sm leading-relaxed text-foreground">{venue.notes}</p>}
        </div>
      </header>

      {venue.matches.length > 0 && (
        <section className="mb-10">
          <Titre>{t("stade.rencontresTitre")}</Titre>
          <div className="mb-4 flex flex-wrap items-center gap-x-8 gap-y-4">
            <form className="flex flex-wrap items-stretch gap-2">
              <select name="saison" defaultValue={saison ?? ""} aria-label={t("stade.toutesSaisons")} className={select}>
                <option value="">{t("stade.toutesSaisons")}</option>
                {saisons.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select name="competition" defaultValue={competition ?? ""} aria-label={t("stade.toutesCompetitions")} className={select}>
                <option value="">{t("stade.toutesCompetitions")}</option>
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shortName || c.name}
                  </option>
                ))}
              </select>
              {resultat && <input type="hidden" name="resultat" value={resultat} />}
              <button type="submit" className="rounded-sm bg-usap-sang px-4 py-2 text-sm font-semibold text-white hover:bg-foreground">
                {t("stade.filtrer")}
              </button>
            </form>
            <nav aria-label={t("stade.resultatAria")} className="flex flex-wrap gap-x-5 text-sm">
              {(
                [
                  [undefined, "matchs.tous"],
                  ["victoire", "matchs.victoires"],
                  ["nul", "matchs.nuls"],
                  ["defaite", "matchs.defaites"],
                  ["a-venir", "matchs.aVenir"],
                ] as const
              ).map(([valeur, cle]) => (
                <Filtre key={cle} href={lien(valeur)} actif={resultat === valeur}>
                  {t(cle)}
                </Filtre>
              ))}
            </nav>
            {filtreActif && (
              <Link href={`/stades/${venue.slug}`} className="text-sm text-muted-foreground underline hover:text-usap-sang">
                {t("stade.reinitialiser")}
              </Link>
            )}
          </div>
          {filtreActif && (
            <p className="mb-3 text-sm text-muted-foreground">
              {selection.length === 0
                ? t("stade.aucuneSelection")
                : t(selection.length === 1 ? "stade.selectionUne" : "stade.selection", {
                    n: selection.length,
                    v: t("saison.victoires", { n: selection.filter((m) => m.result === "VICTOIRE").length }),
                    nu: t("saison.nuls", { n: selection.filter((m) => m.result === "NUL").length }),
                    d: t("saison.defaites", { n: selection.filter((m) => m.result === "DEFAITE").length }),
                  })}
            </p>
          )}
          {selection.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 font-medium">{t("stade.colDate")}</th>
                    <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">{t("stade.colSaison")}</th>
                    <th scope="col" className="hidden py-2 pr-3 font-medium sm:table-cell">{t("stade.colCompetition")}</th>
                    <th scope="col" className="py-2 pr-3 font-medium">{t("stade.colRencontre")}</th>
                    <th scope="col" className="py-2 pr-3 text-right font-medium">{t("stade.colScore")}</th>
                    <th scope="col" className="py-2 pr-3 text-center font-medium">{t("stade.colResultat")}</th>
                    <th scope="col" className="hidden py-2 pr-3 font-medium lg:table-cell">{t("stade.colArbitre")}</th>
                    <th scope="col" className="hidden py-2 text-right font-medium md:table-cell">{t("stade.colAffluence")}</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {selection.map((m) => {
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
                          {m.referee && (
                            <Link href={`/arbitres/${m.referee.slug}`} className="hover:text-usap-sang">
                              {m.referee.firstName} {m.referee.lastName}
                            </Link>
                          )}
                        </td>
                        <td className="hidden py-1.5 text-right text-muted-foreground md:table-cell">{m.attendance ? nombre(m.attendance) : ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <Provenance entite="Venue" id={venue.id} />
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

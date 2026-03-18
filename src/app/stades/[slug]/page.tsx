import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateFR } from "@/lib/utils";
import { Calendar, Filter, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    saison?: string;
    competition?: string;
    resultat?: string;
  }>;
};

/**
 * Extrait le CUID de la fin du slug stade.
 */
function extractIdFromSlug(slug: string): string | null {
  const match = slug.match(/([a-z0-9]{25,})$/);
  return match ? match[1] : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = extractIdFromSlug(slug);
  if (!id) return { title: "Stade introuvable - USAP Historia" };

  const venue = await prisma.venue.findUnique({
    where: { id },
    select: { name: true, city: true },
  });

  if (!venue) return { title: "Stade introuvable - USAP Historia" };

  return {
    title: `${venue.name} (${venue.city}) - USAP Historia`,
    description: `Fiche du ${venue.name} à ${venue.city}. Liste des matchs de l'USAP disputés dans ce stade.`,
  };
}

export default async function StadeDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const saisonFilter = sp.saison || undefined;
  const competitionFilter = sp.competition || undefined;
  const resultatFilter = sp.resultat || undefined;

  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const venue = await prisma.venue.findUnique({
    where: { id },
    include: {
      country: { select: { name: true, flagUrl: true } },
      matches: {
        orderBy: { date: "desc" },
        select: {
          slug: true,
          date: true,
          scoreUsap: true,
          scoreOpponent: true,
          result: true,
          isHome: true,
          matchday: true,
          round: true,
          attendance: true,
          seasonId: true,
          competitionId: true,
          competition: { select: { id: true, shortName: true, name: true } },
          opponent: { select: { shortName: true, name: true } },
          season: { select: { id: true, label: true } },
          referee: { select: { firstName: true, lastName: true, slug: true } },
        },
      },
    },
  });

  if (!venue) notFound();

  // Rediriger si le slug a changé
  if (venue.slug !== slug) {
    redirect(`/stades/${venue.slug}`);
  }

  // Saisons disponibles pour ce stade (pour le filtre)
  const seasonsInVenue = Array.from(
    new Map(
      venue.matches.map((m) => [m.season.id, m.season]),
    ).values(),
  ).sort((a, b) => b.label.localeCompare(a.label)); // Plus récentes en premier

  // Compétitions disponibles pour ce stade (pour le filtre)
  const competitionsInVenue = Array.from(
    new Map(
      venue.matches.map((m) => [m.competition.id, m.competition]),
    ).values(),
  ).sort((a, b) => (a.shortName || a.name).localeCompare(b.shortName || b.name));

  // Filtrage des matchs
  const filteredMatches = venue.matches.filter((m) => {
    if (saisonFilter && m.seasonId !== saisonFilter) return false;
    if (competitionFilter && m.competitionId !== competitionFilter) return false;
    if (resultatFilter === "victoire" && m.result !== "VICTOIRE") return false;
    if (resultatFilter === "defaite" && m.result !== "DEFAITE") return false;
    if (resultatFilter === "nul" && m.result !== "NUL") return false;
    return true;
  });

  const hasFilters = saisonFilter || competitionFilter || resultatFilter;

  // Stats agrégées (sur les matchs filtrés)
  const totalMatches = filteredMatches.length;
  const victories = filteredMatches.filter(
    (m) => m.result === "VICTOIRE",
  ).length;
  const defeats = filteredMatches.filter(
    (m) => m.result === "DEFAITE",
  ).length;
  const draws = filteredMatches.filter((m) => m.result === "NUL").length;

  // Construire le query string pour les filtres
  function buildFilterUrl(overrides: Record<string, string | undefined>): string {
    const qs = new URLSearchParams();
    const comp = overrides.competition !== undefined ? overrides.competition : competitionFilter;
    const res = overrides.resultat !== undefined ? overrides.resultat : resultatFilter;
    if (comp) qs.set("competition", comp);
    if (res) qs.set("resultat", res);
    const str = qs.toString();
    return str ? `/stades/${slug}?${str}` : `/stades/${slug}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Fil d'Ariane */}
      <div className="mb-6 text-sm text-muted-foreground">
        <Link href="/stades" className="hover:text-usap-sang">
          Stades
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{venue.name}</span>
      </div>

      {/* En-tête stade */}
      <div className="mb-10 rounded-lg border border-border bg-usap-carte p-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Photo */}
          <div className="flex shrink-0 justify-center sm:justify-start">
            {venue.photoUrl ? (
              <img
                src={venue.photoUrl}
                alt={venue.name}
                className="h-40 w-40 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-muted">
                <MapPin className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Infos principales */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold uppercase tracking-wider text-foreground">
              {venue.name}
            </h1>
            <p className="mt-1 text-lg text-usap-or">
              {venue.city}
              {venue.country && `, ${venue.country.name}`}
            </p>

            {/* Détails */}
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              {venue.capacity && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {venue.capacity.toLocaleString("fr-FR")} places
                </span>
              )}
              {venue.yearOpened && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Ouvert en {venue.yearOpened}
                </span>
              )}
              {venue.isHomeGround && (
                <span className="rounded bg-usap-sang/10 px-2 py-0.5 text-xs font-medium text-usap-sang">
                  Domicile USAP
                </span>
              )}
            </div>

            {/* Notes */}
            {venue.notes && (
              <p className="mt-3 text-sm text-muted-foreground">
                {venue.notes}
              </p>
            )}

            {/* Stats */}
            {totalMatches > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
                <StatBox label="Matchs joués" value={totalMatches} />
                <StatBox
                  label="Victoires USAP"
                  value={victories}
                  className="text-green-600"
                />
                <StatBox
                  label="Défaites USAP"
                  value={defeats}
                  className="text-red-500"
                />
                <StatBox label="Nuls" value={draws} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historique des matchs */}
      {venue.matches.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
            <Calendar className="h-6 w-6 text-usap-or" />
            Matchs disputés ({totalMatches}{hasFilters ? ` / ${venue.matches.length}` : ""})
          </h2>

          {/* Filtres */}
          <form className="mb-4 flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />

            {/* Saison */}
            <select
              name="saison"
              defaultValue={saisonFilter ?? ""}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-usap-or focus:outline-none"
            >
              <option value="">Toutes les saisons</option>
              {seasonsInVenue.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Compétition */}
            <select
              name="competition"
              defaultValue={competitionFilter ?? ""}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-usap-or focus:outline-none"
            >
              <option value="">Toutes les compétitions</option>
              {competitionsInVenue.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortName || c.name}
                </option>
              ))}
            </select>

            {/* Résultat */}
            <select
              name="resultat"
              defaultValue={resultatFilter ?? ""}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-usap-or focus:outline-none"
            >
              <option value="">Tous les résultats</option>
              <option value="victoire">Victoires</option>
              <option value="defaite">Défaites</option>
              <option value="nul">Nuls</option>
            </select>

            <button
              type="submit"
              className="rounded-lg bg-usap-sang px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-usap-sang/80"
            >
              Filtrer
            </button>

            {hasFilters && (
              <Link
                href={`/stades/${slug}`}
                className="text-sm text-muted-foreground hover:text-usap-sang"
              >
                Réinitialiser
              </Link>
            )}
          </form>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-semibold text-foreground">
                    Date
                  </th>
                  <th className="hidden px-3 py-2 text-left font-semibold text-foreground sm:table-cell">
                    Saison
                  </th>
                  <th className="hidden px-3 py-2 text-left font-semibold text-foreground sm:table-cell">
                    Compét.
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-foreground">
                    Match
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-foreground">
                    Score
                  </th>
                  <th className="hidden px-3 py-2 text-left font-semibold text-foreground md:table-cell">
                    Arbitre
                  </th>
                  <th className="hidden px-3 py-2 text-center font-semibold text-foreground md:table-cell">
                    Affluence
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                      Aucun match ne correspond aux filtres sélectionnés.
                    </td>
                  </tr>
                )}
                {filteredMatches.map((m) => {
                  const resultColor =
                    m.result === "VICTOIRE"
                      ? "bg-green-500/10 text-green-600"
                      : m.result === "DEFAITE"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-muted text-muted-foreground";
                  const oppName = m.opponent.shortName || m.opponent.name;

                  return (
                    <tr
                      key={m.slug}
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {formatDateFR(m.date)}
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2 text-muted-foreground sm:table-cell">
                        <Link
                          href={`/saisons/${m.season.label}`}
                          className="hover:text-usap-sang"
                        >
                          {m.season.label}
                        </Link>
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2 text-muted-foreground sm:table-cell">
                        {m.competition.shortName || m.competition.name}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/matchs/${m.slug}`}
                          className="font-medium text-foreground hover:text-usap-sang"
                        >
                          {m.isHome ? (
                            <>
                              <span className="font-bold">USAP</span> -{" "}
                              {oppName}
                            </>
                          ) : (
                            <>
                              {oppName} -{" "}
                              <span className="font-bold">USAP</span>
                            </>
                          )}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${resultColor}`}
                        >
                          {m.isHome
                            ? `${m.scoreUsap} - ${m.scoreOpponent}`
                            : `${m.scoreOpponent} - ${m.scoreUsap}`}
                        </span>
                      </td>
                      <td className="hidden px-3 py-2 text-muted-foreground md:table-cell">
                        {m.referee ? (
                          <Link
                            href={`/arbitres/${m.referee.slug}`}
                            className="hover:text-usap-sang"
                          >
                            {m.referee.firstName} {m.referee.lastName}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="hidden px-3 py-2 text-center text-muted-foreground md:table-cell">
                        {m.attendance
                          ? m.attendance.toLocaleString("fr-FR")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${className || "text-foreground"}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

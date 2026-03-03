import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateFR } from "@/lib/utils";
import { MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Matchs - USAP Historia",
  description:
    "Tous les matchs de l'USA Perpignan. Recherche par saison, compétition et adversaire.",
};

const PAGE_SIZE = 30;

export default async function MatchsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    saison?: string;
    competition?: string;
    adversaire?: string;
    resultat?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const saisonFilter = params.saison || undefined;
  const competitionFilter = params.competition || undefined;
  const adversaireFilter = params.adversaire || undefined;
  const resultatFilter = params.resultat || undefined;

  // Construire le where
  const where: Record<string, unknown> = {};

  if (saisonFilter) {
    const season = await prisma.season.findFirst({
      where: { label: saisonFilter },
      select: { id: true },
    });
    if (season) where.seasonId = season.id;
  }

  if (competitionFilter) {
    where.competitionId = competitionFilter;
  }

  if (adversaireFilter) {
    where.opponentId = adversaireFilter;
  }

  if (resultatFilter === "victoire") {
    where.result = "VICTOIRE";
  } else if (resultatFilter === "defaite") {
    where.result = "DEFAITE";
  } else if (resultatFilter === "nul") {
    where.result = "NUL";
  }

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        slug: true,
        date: true,
        scoreUsap: true,
        scoreOpponent: true,
        result: true,
        isHome: true,
        matchday: true,
        round: true,
        competition: { select: { id: true, name: true, shortName: true } },
        opponent: {
          select: { id: true, name: true, shortName: true, logoUrl: true },
        },
        venue: { select: { name: true, city: true } },
        season: { select: { label: true } },
      },
    }),
    prisma.match.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Données pour les filtres
  const [seasons, competitions, opponents] = await Promise.all([
    prisma.season.findMany({
      where: { matches: { some: {} } },
      orderBy: { startYear: "desc" },
      select: { label: true },
    }),
    prisma.competition.findMany({
      where: { matches: { some: {} } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, shortName: true },
    }),
    prisma.opponent.findMany({
      where: { matches: { some: {} } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, shortName: true },
    }),
  ]);

  // Construire le query string pour la pagination
  function buildQuery(p: number): string {
    const qs = new URLSearchParams();
    if (p > 1) qs.set("page", String(p));
    if (saisonFilter) qs.set("saison", saisonFilter);
    if (competitionFilter) qs.set("competition", competitionFilter);
    if (adversaireFilter) qs.set("adversaire", adversaireFilter);
    if (resultatFilter) qs.set("resultat", resultatFilter);
    const str = qs.toString();
    return str ? `/matchs?${str}` : "/matchs";
  }

  const hasFilters =
    saisonFilter || competitionFilter || adversaireFilter || resultatFilter;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold uppercase tracking-wider text-foreground">
        Matchs
      </h1>
      <p className="mb-8 text-muted-foreground">
        {total} match{total > 1 ? "s" : ""}
        {saisonFilter && ` en ${saisonFilter}`}
      </p>

      {/* Filtres */}
      <form className="mb-8 flex flex-wrap gap-3">
        {/* Saison */}
        <select
          name="saison"
          defaultValue={saisonFilter ?? ""}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-usap-or focus:outline-none"
        >
          <option value="">Toutes les saisons</option>
          {seasons.map((s) => (
            <option key={s.label} value={s.label}>
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
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.shortName || c.name}
            </option>
          ))}
        </select>

        {/* Adversaire */}
        <select
          name="adversaire"
          defaultValue={adversaireFilter ?? ""}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-usap-or focus:outline-none"
        >
          <option value="">Tous les adversaires</option>
          {opponents.map((o) => (
            <option key={o.id} value={o.id}>
              {o.shortName || o.name}
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
          className="rounded-lg bg-usap-sang px-4 py-2 text-sm font-medium text-white hover:bg-usap-sang/90"
        >
          Filtrer
        </button>

        {hasFilters && (
          <Link
            href="/matchs"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Réinitialiser
          </Link>
        )}
      </form>

      {/* Liste des matchs */}
      {matches.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-3 text-left font-semibold text-foreground">
                  Date
                </th>
                <th className="hidden px-3 py-3 text-left font-semibold text-foreground sm:table-cell">
                  Saison
                </th>
                <th className="px-3 py-3 text-left font-semibold text-foreground">
                  Compét.
                </th>
                <th className="px-3 py-3 text-left font-semibold text-foreground">
                  J.
                </th>
                <th className="px-3 py-3 text-left font-semibold text-foreground">
                  Match
                </th>
                <th className="px-3 py-3 text-center font-semibold text-foreground">
                  Score
                </th>
                <th className="hidden px-3 py-3 text-left font-semibold text-foreground md:table-cell">
                  Lieu
                </th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => {
                const resultColor =
                  match.result === "VICTOIRE"
                    ? "bg-green-500/10 text-green-600"
                    : match.result === "DEFAITE"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-muted text-muted-foreground";

                const oppName =
                  match.opponent.shortName || match.opponent.name;

                return (
                  <tr
                    key={match.slug}
                    className="border-b border-border transition-colors hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                      {formatDateFR(match.date)}
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-3 text-muted-foreground sm:table-cell">
                      <Link
                        href={`/saisons/${match.season.label}`}
                        className="hover:text-usap-sang"
                      >
                        {match.season.label}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                      {match.competition.shortName || match.competition.name}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {match.matchday
                        ? `J${match.matchday}`
                        : match.round || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/matchs/${match.slug}`}
                        className="font-medium text-foreground hover:text-usap-sang"
                      >
                        {match.isHome ? (
                          <>
                            <span className="font-bold">USAP</span> - {oppName}
                          </>
                        ) : (
                          <>
                            {oppName} -{" "}
                            <span className="font-bold">USAP</span>
                          </>
                        )}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${resultColor}`}
                      >
                        {match.isHome
                          ? `${match.scoreUsap} - ${match.scoreOpponent}`
                          : `${match.scoreOpponent} - ${match.scoreUsap}`}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-3 text-muted-foreground md:table-cell">
                      {match.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {match.venue.name}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-10 text-center text-muted-foreground">
          <p className="text-lg">Aucun match trouvé.</p>
          {hasFilters && (
            <Link
              href="/matchs"
              className="mt-2 inline-block text-sm text-usap-sang hover:underline"
            >
              Réinitialiser les filtres
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildQuery(page - 1)}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Précédent
            </Link>
          )}
          <span className="px-3 py-2 text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildQuery(page + 1)}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Suivant
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

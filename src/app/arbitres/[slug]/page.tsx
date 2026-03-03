import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateFR } from "@/lib/utils";
import { Calendar, User, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

/**
 * Extrait le CUID de la fin du slug arbitre.
 */
function extractIdFromSlug(slug: string): string | null {
  const match = slug.match(/([a-z0-9]{25,})$/);
  return match ? match[1] : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = extractIdFromSlug(slug);
  if (!id) return { title: "Arbitre introuvable - USAP Historia" };

  const referee = await prisma.referee.findUnique({
    where: { id },
    select: { firstName: true, lastName: true },
  });

  if (!referee) return { title: "Arbitre introuvable - USAP Historia" };

  return {
    title: `${referee.firstName} ${referee.lastName} — Arbitre - USAP Historia`,
    description: `Fiche de l'arbitre ${referee.firstName} ${referee.lastName}. Liste des matchs de l'USAP qu'il a arbitrés.`,
  };
}

export default async function ArbitreDetailPage({ params }: Props) {
  const { slug } = await params;

  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const referee = await prisma.referee.findUnique({
    where: { id },
    include: {
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
          competition: { select: { shortName: true, name: true } },
          opponent: { select: { shortName: true, name: true } },
          season: { select: { label: true } },
          venue: { select: { name: true, city: true } },
        },
      },
    },
  });

  if (!referee) notFound();

  // Rediriger si le slug a changé
  if (referee.slug !== slug) {
    redirect(`/arbitres/${referee.slug}`);
  }

  // Stats agrégées
  const totalMatches = referee.matches.length;
  const victories = referee.matches.filter(
    (m) => m.result === "VICTOIRE",
  ).length;
  const defeats = referee.matches.filter(
    (m) => m.result === "DEFAITE",
  ).length;
  const draws = referee.matches.filter((m) => m.result === "NUL").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Fil d'Ariane */}
      <div className="mb-6 text-sm text-muted-foreground">
        <Link href="/arbitres" className="hover:text-usap-sang">
          Arbitres
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">
          {referee.firstName} {referee.lastName}
        </span>
      </div>

      {/* En-tête arbitre */}
      <div className="mb-10 rounded-lg border border-border bg-usap-carte p-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Photo */}
          <div className="flex shrink-0 justify-center sm:justify-start">
            {referee.photoUrl ? (
              <img
                src={referee.photoUrl}
                alt={`${referee.firstName} ${referee.lastName}`}
                className="h-40 w-40 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-muted">
                <User className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Infos principales */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold uppercase tracking-wider text-foreground">
              {referee.firstName} {referee.lastName}
            </h1>
            <p className="mt-1 text-lg text-usap-or">Arbitre</p>

            {/* Stats */}
            {totalMatches > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
                <StatBox label="Matchs arbitrés" value={totalMatches} />
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

      {/* Historique des matchs arbitrés */}
      {referee.matches.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
            <Calendar className="h-6 w-6 text-usap-or" />
            Matchs arbitrés ({referee.matches.length})
          </h2>
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
                    Stade
                  </th>
                  <th className="hidden px-3 py-2 text-center font-semibold text-foreground md:table-cell">
                    Affluence
                  </th>
                </tr>
              </thead>
              <tbody>
                {referee.matches.map((m) => {
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
                        {m.venue ? `${m.venue.name}` : "—"}
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

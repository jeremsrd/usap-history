import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Calendar, User, Trophy } from "lucide-react";
import { DIVISIONS } from "@/lib/constants";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

function extractIdFromSlug(slug: string): string | null {
  const match = slug.match(/([a-z0-9]{25,})$/);
  return match ? match[1] : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = extractIdFromSlug(slug);
  if (!id) return { title: "Entraîneur introuvable - USAP Historia" };

  const coach = await prisma.coach.findUnique({
    where: { id },
    select: { firstName: true, lastName: true },
  });

  if (!coach) return { title: "Entraîneur introuvable - USAP Historia" };

  return {
    title: `${coach.firstName} ${coach.lastName} — Entraîneur - USAP Historia`,
    description: `Fiche de l'entraîneur ${coach.firstName} ${coach.lastName}. Saisons dirigées et bilan à l'USAP.`,
  };
}

export default async function EntraineurDetailPage({ params }: Props) {
  const { slug } = await params;

  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const coach = await prisma.coach.findUnique({
    where: { id },
    include: {
      seasons: {
        orderBy: { startYear: "desc" },
        select: {
          label: true,
          division: true,
          finalRanking: true,
          champion: true,
          promoted: true,
          relegated: true,
          matchesPlayed: true,
          wins: true,
          draws: true,
          losses: true,
          pointsFor: true,
          pointsAgainst: true,
        },
      },
    },
  });

  if (!coach) notFound();

  if (coach.slug !== slug) {
    redirect(`/entraineurs/${coach.slug}`);
  }

  // Stats agrégées sur toutes les saisons
  const totalSeasons = coach.seasons.length;
  const totalWins = coach.seasons.reduce((sum, s) => sum + (s.wins ?? 0), 0);
  const totalDraws = coach.seasons.reduce((sum, s) => sum + (s.draws ?? 0), 0);
  const totalLosses = coach.seasons.reduce(
    (sum, s) => sum + (s.losses ?? 0),
    0,
  );
  const totalMatches = coach.seasons.reduce(
    (sum, s) => sum + (s.matchesPlayed ?? 0),
    0,
  );
  const titles = coach.seasons.filter((s) => s.champion).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Fil d'Ariane */}
      <div className="mb-6 text-sm text-muted-foreground">
        <Link href="/entraineurs" className="hover:text-usap-sang">
          Entraîneurs
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">
          {coach.firstName} {coach.lastName}
        </span>
      </div>

      {/* En-tête */}
      <div className="mb-10 rounded-lg border border-border bg-usap-carte p-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="flex shrink-0 justify-center sm:justify-start">
            {coach.photoUrl ? (
              <img
                src={coach.photoUrl}
                alt={`${coach.firstName} ${coach.lastName}`}
                className="h-40 w-40 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-muted">
                <User className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold uppercase tracking-wider text-foreground">
              {coach.firstName} {coach.lastName}
            </h1>
            <p className="mt-1 text-lg text-usap-or">
              {coach.role || "Entraîneur"}
            </p>

            {coach.biography && (
              <p className="mt-4 text-sm text-muted-foreground">
                {coach.biography}
              </p>
            )}

            {totalSeasons > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-5">
                <StatBox label="Saisons" value={totalSeasons} />
                <StatBox label="Matchs" value={totalMatches} />
                <StatBox
                  label="Victoires"
                  value={totalWins}
                  className="text-green-600"
                />
                <StatBox
                  label="Nuls"
                  value={totalDraws}
                />
                <StatBox
                  label="Défaites"
                  value={totalLosses}
                  className="text-red-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Titres */}
      {titles > 0 && (
        <div className="mb-10 flex items-center gap-2 rounded-lg border border-usap-or/30 bg-usap-or/10 p-4">
          <Trophy className="h-6 w-6 text-usap-or" />
          <span className="font-bold text-foreground">
            {titles} titre{titles > 1 ? "s" : ""} de champion
          </span>
        </div>
      )}

      {/* Saisons dirigées */}
      {coach.seasons.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
            <Calendar className="h-6 w-6 text-usap-or" />
            Saisons dirigées ({coach.seasons.length})
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-semibold text-foreground">
                    Saison
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-foreground">
                    Division
                  </th>
                  <th className="hidden px-3 py-2 text-center font-semibold text-foreground sm:table-cell">
                    Class.
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-foreground">
                    MJ
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-foreground">
                    V
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-foreground">
                    N
                  </th>
                  <th className="px-3 py-2 text-center font-semibold text-foreground">
                    D
                  </th>
                  <th className="hidden px-3 py-2 text-center font-semibold text-foreground md:table-cell">
                    PF
                  </th>
                  <th className="hidden px-3 py-2 text-center font-semibold text-foreground md:table-cell">
                    PC
                  </th>
                </tr>
              </thead>
              <tbody>
                {coach.seasons.map((s) => (
                  <tr
                    key={s.label}
                    className="border-b border-border transition-colors hover:bg-muted/30"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/saisons/${s.label}`}
                        className="font-medium text-foreground hover:text-usap-sang"
                      >
                        {s.label}
                        {s.champion && (
                          <span className="ml-2 text-usap-or" title="Champion">
                            🏆
                          </span>
                        )}
                        {s.promoted && (
                          <span
                            className="ml-1 text-green-600"
                            title="Promu"
                          >
                            ↑
                          </span>
                        )}
                        {s.relegated && (
                          <span
                            className="ml-1 text-red-500"
                            title="Relégué"
                          >
                            ↓
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {DIVISIONS[s.division] ?? s.division}
                    </td>
                    <td className="hidden px-3 py-2 text-center text-muted-foreground sm:table-cell">
                      {s.finalRanking ? `${s.finalRanking}e` : "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground">
                      {s.matchesPlayed ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-center font-medium text-green-600">
                      {s.wins ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-center text-muted-foreground">
                      {s.draws ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-center font-medium text-red-500">
                      {s.losses ?? "—"}
                    </td>
                    <td className="hidden px-3 py-2 text-center text-muted-foreground md:table-cell">
                      {s.pointsFor ?? "—"}
                    </td>
                    <td className="hidden px-3 py-2 text-center text-muted-foreground md:table-cell">
                      {s.pointsAgainst ?? "—"}
                    </td>
                  </tr>
                ))}
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

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
  if (!id) return { title: "Président introuvable - USAP Historia" };

  const president = await prisma.president.findUnique({
    where: { id },
    select: { firstName: true, lastName: true },
  });

  if (!president) return { title: "Président introuvable - USAP Historia" };

  return {
    title: `${president.firstName} ${president.lastName} — Président - USAP Historia`,
    description: `Fiche du président ${president.firstName} ${president.lastName}. Mandat et saisons à la tête de l'USAP.`,
  };
}

export default async function PresidentDetailPage({ params }: Props) {
  const { slug } = await params;

  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const president = await prisma.president.findUnique({
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
          coach: { select: { firstName: true, lastName: true, slug: true } },
        },
      },
    },
  });

  if (!president) notFound();

  if (president.slug !== slug) {
    redirect(`/presidents/${president.slug}`);
  }

  const totalSeasons = president.seasons.length;
  const titles = president.seasons.filter((s) => s.champion).length;

  const period = president.startYear
    ? president.endYear
      ? `${president.startYear}–${president.endYear}`
      : `Depuis ${president.startYear}`
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Fil d'Ariane */}
      <div className="mb-6 text-sm text-muted-foreground">
        <Link href="/presidents" className="hover:text-usap-sang">
          Présidents
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">
          {president.firstName} {president.lastName}
        </span>
      </div>

      {/* En-tête */}
      <div className="mb-10 rounded-lg border border-border bg-usap-carte p-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="flex shrink-0 justify-center sm:justify-start">
            {president.photoUrl ? (
              <img
                src={president.photoUrl}
                alt={`${president.firstName} ${president.lastName}`}
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
              {president.firstName} {president.lastName}
            </h1>
            <p className="mt-1 text-lg text-usap-or">
              Président{period ? ` · ${period}` : ""}
            </p>

            {president.biography && (
              <p className="mt-4 text-sm text-muted-foreground">
                {president.biography}
              </p>
            )}

            {totalSeasons > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3">
                <StatBox label="Saisons" value={totalSeasons} />
                <StatBox
                  label={titles > 1 ? "Titres" : "Titre"}
                  value={titles}
                  className={titles > 0 ? "text-usap-or" : undefined}
                />
                <StatBox
                  label="Promotions"
                  value={president.seasons.filter((s) => s.promoted).length}
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
            {titles} titre{titles > 1 ? "s" : ""} de champion pendant son
            mandat
          </span>
        </div>
      )}

      {/* Saisons */}
      {president.seasons.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
            <Calendar className="h-6 w-6 text-usap-or" />
            Saisons ({president.seasons.length})
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
                  <th className="hidden px-3 py-2 text-left font-semibold text-foreground md:table-cell">
                    Entraîneur
                  </th>
                </tr>
              </thead>
              <tbody>
                {president.seasons.map((s) => (
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
                    <td className="hidden px-3 py-2 text-muted-foreground md:table-cell">
                      {s.coach ? (
                        <Link
                          href={`/entraineurs/${s.coach.slug}`}
                          className="hover:text-usap-sang"
                        >
                          {s.coach.firstName} {s.coach.lastName}
                        </Link>
                      ) : (
                        "—"
                      )}
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

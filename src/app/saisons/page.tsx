import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DIVISIONS } from "@/lib/constants";
import { Trophy, ArrowUp, ArrowDown } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saisons - USAP Historia",
  description:
    "Toutes les saisons de l'USA Perpignan depuis 1902. Classements, résultats et effectifs.",
};

export default async function SaisonsPage() {
  const seasons = await prisma.season.findMany({
    orderBy: { startYear: "desc" },
    include: {
      coach: { select: { firstName: true, lastName: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold uppercase tracking-wider text-foreground">
        Saisons
      </h1>
      <p className="mb-8 text-muted-foreground">
        {seasons.length} saisons depuis 1902
      </p>

      {/* Tableau des saisons */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                Saison
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                Division
              </th>
              <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell">
                Entraîneur
              </th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">
                Class.
              </th>
              <th className="hidden px-4 py-3 text-center font-semibold text-foreground md:table-cell">
                J
              </th>
              <th className="hidden px-4 py-3 text-center font-semibold text-foreground md:table-cell">
                V
              </th>
              <th className="hidden px-4 py-3 text-center font-semibold text-foreground md:table-cell">
                N
              </th>
              <th className="hidden px-4 py-3 text-center font-semibold text-foreground md:table-cell">
                D
              </th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">
                Bilan
              </th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((season) => (
              <tr
                key={season.id}
                className="border-b border-border transition-colors hover:bg-muted/30"
              >
                {/* Saison (lien) */}
                <td className="px-4 py-3">
                  <Link
                    href={`/saisons/${season.label}`}
                    className="flex items-center gap-2 font-medium text-usap-sang hover:underline"
                  >
                    {season.label}
                    {season.champion && (
                      <Trophy className="h-4 w-4 text-usap-or" />
                    )}
                    {season.promoted && (
                      <ArrowUp className="h-4 w-4 text-green-500" />
                    )}
                    {season.relegated && (
                      <ArrowDown className="h-4 w-4 text-red-500" />
                    )}
                  </Link>
                </td>

                {/* Division */}
                <td className="px-4 py-3 text-muted-foreground">
                  {DIVISIONS[season.division] ?? season.division}
                </td>

                {/* Entraîneur */}
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                  {season.coach
                    ? `${season.coach.firstName} ${season.coach.lastName}`
                    : "—"}
                </td>

                {/* Classement */}
                <td className="px-4 py-3 text-center font-medium text-foreground">
                  {season.finalRanking
                    ? `${season.finalRanking}${season.finalRanking === 1 ? "er" : "e"}`
                    : "—"}
                </td>

                {/* J/V/N/D (desktop) */}
                <td className="hidden px-4 py-3 text-center text-muted-foreground md:table-cell">
                  {season.matchesPlayed ?? "—"}
                </td>
                <td className="hidden px-4 py-3 text-center text-green-600 md:table-cell">
                  {season.wins ?? "—"}
                </td>
                <td className="hidden px-4 py-3 text-center text-muted-foreground md:table-cell">
                  {season.draws ?? "—"}
                </td>
                <td className="hidden px-4 py-3 text-center text-red-500 md:table-cell">
                  {season.losses ?? "—"}
                </td>

                {/* Bilan condensé (toujours visible) */}
                <td className="px-4 py-3 text-center text-muted-foreground">
                  {season.wins != null
                    ? `${season.wins}V ${season.draws ?? 0}N ${season.losses ?? 0}D`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

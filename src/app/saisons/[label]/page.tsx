import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DIVISIONS, POSITIONS } from "@/lib/constants";
import { formatDateFR, formatResult } from "@/lib/utils";
import Image from "next/image";
import {
  Trophy,
  ArrowUp,
  ArrowDown,
  MapPin,
  Users,
  Calendar,
  Target,
  Award,
} from "lucide-react";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ label: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { label } = await params;
  return {
    title: `Saison ${label} - USAP Historia`,
    description: `Détail de la saison ${label} de l'USA Perpignan : matchs, effectif, classement.`,
  };
}

export default async function SaisonDetailPage({ params }: Props) {
  const { label } = await params;

  const season = await prisma.season.findFirst({
    where: { label },
    include: {
      coach: true,
      president: true,
      matches: {
        orderBy: { date: "asc" },
        include: {
          competition: { select: { name: true, shortName: true, type: true } },
          opponent: {
            select: { name: true, shortName: true, logoUrl: true },
          },
          venue: { select: { name: true, city: true } },
        },
      },
      seasonPlayers: {
        include: {
          player: {
            select: {
              slug: true,
              firstName: true,
              lastName: true,
              position: true,
              photoUrl: true,
            },
          },
        },
        orderBy: { shirtNumber: "asc" },
      },
    },
  });

  if (!season) notFound();

  // IDs des matchs de la saison (pour filtrer les stats)
  const seasonMatchIds = season.matches.map((m) => m.id);

  // ── Statistiques individuelles de la saison ──────────────────────
  // Meilleurs marqueurs (par points)
  const topScorersAgg = await prisma.matchPlayer.groupBy({
    by: ["playerId"],
    where: { matchId: { in: seasonMatchIds }, isOpponent: false },
    _sum: { totalPoints: true },
    orderBy: { _sum: { totalPoints: "desc" } },
    take: 10,
    having: { totalPoints: { _sum: { gt: 0 } } },
  });

  const scorerIds = topScorersAgg.map((s) => s.playerId);
  const scorerPlayers = await prisma.player.findMany({
    where: { id: { in: scorerIds } },
    select: { id: true, slug: true, firstName: true, lastName: true, position: true, photoUrl: true },
  });
  const topScorers = topScorersAgg.map((agg) => {
    const player = scorerPlayers.find((p) => p.id === agg.playerId)!;
    return { ...player, totalPoints: agg._sum.totalPoints ?? 0 };
  });

  // Plus capés (nombre d'apparitions)
  const topAppsAgg = await prisma.matchPlayer.groupBy({
    by: ["playerId"],
    where: { matchId: { in: seasonMatchIds }, isOpponent: false },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const appIds = topAppsAgg.map((a) => a.playerId);
  const appPlayers = await prisma.player.findMany({
    where: { id: { in: appIds } },
    select: { id: true, slug: true, firstName: true, lastName: true, position: true, photoUrl: true },
  });
  const topApps = topAppsAgg.map((agg) => {
    const player = appPlayers.find((p) => p.id === agg.playerId)!;
    return { ...player, appearances: agg._count.id };
  });

  // Meilleurs marqueurs d'essais
  const topTriesAgg = await prisma.matchPlayer.groupBy({
    by: ["playerId"],
    where: { matchId: { in: seasonMatchIds }, isOpponent: false },
    _sum: { tries: true },
    orderBy: { _sum: { tries: "desc" } },
    take: 10,
    having: { tries: { _sum: { gt: 0 } } },
  });

  const tryIds = topTriesAgg.map((t) => t.playerId);
  const tryPlayers = await prisma.player.findMany({
    where: { id: { in: tryIds } },
    select: { id: true, slug: true, firstName: true, lastName: true, position: true, photoUrl: true },
  });
  const topTries = topTriesAgg.map((agg) => {
    const player = tryPlayers.find((p) => p.id === agg.playerId)!;
    return { ...player, tries: agg._sum.tries ?? 0 };
  });

  // Grouper les matchs par compétition
  const matchesByCompetition = new Map<
    string,
    typeof season.matches
  >();
  for (const match of season.matches) {
    const compName = match.competition.shortName || match.competition.name;
    const existing = matchesByCompetition.get(compName) || [];
    existing.push(match);
    matchesByCompetition.set(compName, existing);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Navigation fil d'Ariane */}
      <div className="mb-6 text-sm text-muted-foreground">
        <Link href="/saisons" className="hover:text-usap-sang">
          Saisons
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{season.label}</span>
      </div>

      {/* En-tête saison */}
      <div className="mb-10 rounded-lg border border-border bg-usap-carte p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold uppercase tracking-wider text-foreground">
              Saison {season.label}
              {season.champion && (
                <Trophy className="h-7 w-7 text-usap-or" />
              )}
              {season.promoted && (
                <ArrowUp className="h-6 w-6 text-green-500" />
              )}
              {season.relegated && (
                <ArrowDown className="h-6 w-6 text-red-500" />
              )}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {DIVISIONS[season.division] ?? season.division}
              {season.finalRanking && (
                <span>
                  {" "}
                  —{" "}
                  {season.finalRanking === 1
                    ? "1er"
                    : `${season.finalRanking}e`}
                </span>
              )}
            </p>
          </div>

          {/* Staff */}
          <div className="text-sm text-muted-foreground">
            {season.coach && (
              <p>
                <span className="font-medium text-foreground">
                  Entraîneur :
                </span>{" "}
                {season.coach.firstName} {season.coach.lastName}
              </p>
            )}
            {season.president && (
              <p>
                <span className="font-medium text-foreground">
                  Président :
                </span>{" "}
                {season.president.firstName} {season.president.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Stats agrégées */}
        {season.matchesPlayed != null && (
          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6 sm:grid-cols-6 md:grid-cols-9">
            <StatBox label="Joués" value={season.matchesPlayed} />
            <StatBox
              label="Victoires"
              value={season.wins}
              className="text-green-600"
            />
            <StatBox label="Nuls" value={season.draws} />
            <StatBox
              label="Défaites"
              value={season.losses}
              className="text-red-500"
            />
            <StatBox label="PF" value={season.pointsFor} />
            <StatBox label="PC" value={season.pointsAgainst} />
            {season.bonusOffensif != null && (
              <StatBox label="BO" value={season.bonusOffensif} />
            )}
            {season.bonusDefensif != null && (
              <StatBox label="BD" value={season.bonusDefensif} />
            )}
            {season.totalPoints != null && (
              <StatBox
                label="Points"
                value={season.totalPoints}
                className="font-bold text-usap-or"
              />
            )}
          </div>
        )}

        {season.notes && (
          <p className="mt-4 text-sm italic text-muted-foreground">
            {season.notes}
          </p>
        )}
      </div>

      {/* Matchs de la saison */}
      {season.matches.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
            <Calendar className="h-6 w-6 text-usap-or" />
            Matchs ({season.matches.length})
          </h2>

          {Array.from(matchesByCompetition.entries()).map(
            ([compName, matches]) => (
              <div key={compName} className="mb-8">
                <h3 className="mb-3 text-lg font-semibold text-usap-sang">
                  {compName}
                </h3>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-3 py-2 text-left font-semibold text-foreground">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-foreground">
                          J.
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-foreground">
                          Match
                        </th>
                        <th className="px-3 py-2 text-center font-semibold text-foreground">
                          Score
                        </th>
                        <th className="hidden px-3 py-2 text-left font-semibold text-foreground sm:table-cell">
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
                            key={match.id}
                            className="border-b border-border transition-colors hover:bg-muted/30"
                          >
                            <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                              {formatDateFR(match.date)}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {match.matchday
                                ? `J${match.matchday}`
                                : match.round || "—"}
                            </td>
                            <td className="px-3 py-2">
                              <Link
                                href={`/matchs/${match.slug}`}
                                className="font-medium text-foreground hover:text-usap-sang"
                              >
                                {match.isHome ? (
                                  <>
                                    <span className="font-bold">USAP</span>
                                    {" - "}
                                    {oppName}
                                  </>
                                ) : (
                                  <>
                                    {oppName}
                                    {" - "}
                                    <span className="font-bold">USAP</span>
                                  </>
                                )}
                              </Link>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <span
                                className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${resultColor}`}
                              >
                                {match.isHome
                                  ? `${match.scoreUsap} - ${match.scoreOpponent}`
                                  : `${match.scoreOpponent} - ${match.scoreUsap}`}
                              </span>
                            </td>
                            <td className="hidden whitespace-nowrap px-3 py-2 text-muted-foreground sm:table-cell">
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
              </div>
            ),
          )}
        </section>
      )}

      {/* Statistiques individuelles */}
      {(topScorers.length > 0 || topApps.length > 0 || topTries.length > 0) && (
        <section className="mb-10">
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
            <Target className="h-6 w-6 text-usap-or" />
            Statistiques individuelles
          </h2>

          <div className="grid gap-10 lg:grid-cols-3">
            {/* Meilleurs marqueurs */}
            {topScorers.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Target className="h-4 w-4 text-usap-or" />
                  Meilleurs marqueurs
                </h3>
                <div className="space-y-1">
                  {topScorers.map((p, i) => (
                    <PlayerRankRow
                      key={p.id}
                      rank={i + 1}
                      slug={p.slug}
                      firstName={p.firstName}
                      lastName={p.lastName}
                      position={p.position}
                      photoUrl={p.photoUrl}
                      stat={`${p.totalPoints} pts`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Plus capés */}
            {topApps.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Users className="h-4 w-4 text-usap-or" />
                  Plus capés
                </h3>
                <div className="space-y-1">
                  {topApps.map((p, i) => (
                    <PlayerRankRow
                      key={p.id}
                      rank={i + 1}
                      slug={p.slug}
                      firstName={p.firstName}
                      lastName={p.lastName}
                      position={p.position}
                      photoUrl={p.photoUrl}
                      stat={`${p.appearances} match${p.appearances > 1 ? "s" : ""}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Meilleurs marqueurs d'essais */}
            {topTries.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Award className="h-4 w-4 text-usap-or" />
                  Meilleurs marqueurs d&apos;essais
                </h3>
                <div className="space-y-1">
                  {topTries.map((p, i) => (
                    <PlayerRankRow
                      key={p.id}
                      rank={i + 1}
                      slug={p.slug}
                      firstName={p.firstName}
                      lastName={p.lastName}
                      position={p.position}
                      photoUrl={p.photoUrl}
                      stat={`${p.tries} essai${p.tries > 1 ? "s" : ""}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Effectif */}
      {season.seasonPlayers.length > 0 && (
        <section>
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
            <Users className="h-6 w-6 text-usap-or" />
            Effectif ({season.seasonPlayers.length})
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {season.seasonPlayers.map((sp) => (
              <Link
                key={sp.id}
                href={`/joueurs/${sp.player.slug}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-usap-carte p-3 transition-colors hover:border-usap-or/30"
              >
                {/* Numéro de maillot */}
                {sp.shirtNumber && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-usap-sang/10 text-sm font-bold text-usap-sang">
                    {sp.shirtNumber}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {sp.player.firstName} {sp.player.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sp.position
                      ? (POSITIONS[sp.position]?.label ?? sp.position)
                      : sp.player.position
                        ? (POSITIONS[sp.player.position]?.label ??
                          sp.player.position)
                        : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Message si aucun match ni effectif */}
      {season.matches.length === 0 && season.seasonPlayers.length === 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-10 text-center text-muted-foreground">
          <p className="text-lg">
            Aucune donnée disponible pour cette saison.
          </p>
          <p className="mt-2 text-sm">
            Les matchs et effectifs seront ajoutés progressivement.
          </p>
        </div>
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
  value: number | null | undefined;
  className?: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${className || "text-foreground"}`}>
        {value ?? "—"}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function PlayerRankRow({
  rank,
  slug,
  firstName,
  lastName,
  position,
  photoUrl,
  stat,
}: {
  rank: number;
  slug: string;
  firstName: string;
  lastName: string;
  position: string | null;
  photoUrl: string | null;
  stat: string;
}) {
  return (
    <Link
      href={`/joueurs/${slug}`}
      className="flex items-center gap-2 rounded border border-border bg-background px-3 py-2 text-sm transition-colors hover:border-usap-or/30"
    >
      <span className="w-6 shrink-0 text-center font-bold text-muted-foreground">
        {rank}
      </span>
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={`${firstName} ${lastName}`}
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}
      <span className="flex-1 truncate font-medium text-foreground">
        {firstName} {lastName}
      </span>
      {position && (
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {POSITIONS[position]?.label ?? position}
        </span>
      )}
      <span className="shrink-0 rounded bg-usap-sang/10 px-2 py-0.5 text-xs font-bold text-usap-sang">
        {stat}
      </span>
    </Link>
  );
}

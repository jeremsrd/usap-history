import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { POSITIONS } from "@/lib/constants";
import { formatDateFR } from "@/lib/utils";
import {
  Trophy,
  Users,
  Target,
  TrendingUp,
  MapPin,
  BarChart3,
  Award,
  Swords,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistiques - USAP Historia",
  description:
    "Statistiques historiques de l'USA Perpignan : meilleurs marqueurs, plus capés, records et bilans.",
};

export default async function StatistiquesPage() {
  // ── Compteurs globaux ──────────────────────────────────────────────
  // Nombre de joueurs USAP = joueurs ayant au moins 1 apparition non-adversaire
  const [totalMatches, totalSeasons] = await Promise.all([
    prisma.match.count(),
    prisma.season.count(),
  ]);

  const usapPlayerIds = await prisma.matchPlayer.findMany({
    where: { isOpponent: false, playerId: { not: null } },
    select: { playerId: true },
    distinct: ["playerId"],
  });
  const totalPlayers = usapPlayerIds.length;

  // ── Bilan global V/N/D ─────────────────────────────────────────────
  const [wins, draws, losses] = await Promise.all([
    prisma.match.count({ where: { result: "VICTOIRE" } }),
    prisma.match.count({ where: { result: "NUL" } }),
    prisma.match.count({ where: { result: "DEFAITE" } }),
  ]);

  // ── Bilan domicile / extérieur ─────────────────────────────────────
  const [homeWins, homeDraws, homeLosses, awayWins, awayDraws, awayLosses] =
    await Promise.all([
      prisma.match.count({ where: { isHome: true, result: "VICTOIRE" } }),
      prisma.match.count({ where: { isHome: true, result: "NUL" } }),
      prisma.match.count({ where: { isHome: true, result: "DEFAITE" } }),
      prisma.match.count({ where: { isHome: false, result: "VICTOIRE" } }),
      prisma.match.count({ where: { isHome: false, result: "NUL" } }),
      prisma.match.count({ where: { isHome: false, result: "DEFAITE" } }),
    ]);

  const homeTotal = homeWins + homeDraws + homeLosses;
  const awayTotal = awayWins + awayDraws + awayLosses;

  // ── Points totaux marqués/encaissés ────────────────────────────────
  const pointsAgg = await prisma.match.aggregate({
    _sum: { scoreUsap: true, scoreOpponent: true },
  });
  const totalPointsFor = pointsAgg._sum.scoreUsap ?? 0;
  const totalPointsAgainst = pointsAgg._sum.scoreOpponent ?? 0;

  // ── Meilleurs marqueurs USAP (top 10 par points) ───────────────────
  const topScorersAgg = await prisma.matchPlayer.groupBy({
    by: ["playerId"],
    where: { isOpponent: false, playerId: { not: null } },
    _sum: { totalPoints: true },
    orderBy: { _sum: { totalPoints: "desc" } },
    take: 10,
    having: { totalPoints: { _sum: { gt: 0 } } },
  });

  const topScorerIds = topScorersAgg.map((s) => s.playerId as string);
  const topScorerPlayers = await prisma.player.findMany({
    where: { id: { in: topScorerIds } },
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      position: true,
      photoUrl: true,
    },
  });

  const topScorers = topScorersAgg.map((agg) => {
    const player = topScorerPlayers.find((p) => p.id === agg.playerId)!;
    return { ...player, totalPoints: agg._sum.totalPoints ?? 0 };
  });

  // ── Plus capés USAP (top 10 par nombre de matchs) ──────────────────
  const topAppsAgg = await prisma.matchPlayer.groupBy({
    by: ["playerId"],
    where: { isOpponent: false, playerId: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const topAppIds = topAppsAgg.map((a) => a.playerId as string);
  const topAppPlayers = await prisma.player.findMany({
    where: { id: { in: topAppIds } },
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      position: true,
      photoUrl: true,
    },
  });

  const topApps = topAppsAgg.map((agg) => {
    const player = topAppPlayers.find((p) => p.id === agg.playerId)!;
    return { ...player, appearances: agg._count.id };
  });

  // ── Meilleurs essayeurs USAP (top 10) ──────────────────────────────
  const topTriesAgg = await prisma.matchPlayer.groupBy({
    by: ["playerId"],
    where: { isOpponent: false, playerId: { not: null } },
    _sum: { tries: true },
    orderBy: { _sum: { tries: "desc" } },
    take: 10,
    having: { tries: { _sum: { gt: 0 } } },
  });

  const topTryIds = topTriesAgg.map((t) => t.playerId as string);
  const topTryPlayers = await prisma.player.findMany({
    where: { id: { in: topTryIds } },
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      position: true,
      photoUrl: true,
    },
  });

  const topTries = topTriesAgg.map((agg) => {
    const player = topTryPlayers.find((p) => p.id === agg.playerId)!;
    return { ...player, tries: agg._sum.tries ?? 0 };
  });

  // ── Statistiques adverses (joueurs adverses contre l'USAP) ─────────
  const oppScorersAgg = await prisma.matchPlayer.groupBy({
    by: ["playerId"],
    where: { isOpponent: true, playerId: { not: null } },
    _sum: { totalPoints: true },
    orderBy: { _sum: { totalPoints: "desc" } },
    take: 10,
    having: { totalPoints: { _sum: { gt: 0 } } },
  });

  const oppScorerIds = oppScorersAgg.map((s) => s.playerId as string);
  const oppScorerPlayers = await prisma.player.findMany({
    where: { id: { in: oppScorerIds } },
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      position: true,
      photoUrl: true,
    },
  });
  const oppScorers = oppScorersAgg.map((agg) => {
    const player = oppScorerPlayers.find((p) => p.id === agg.playerId)!;
    return { ...player, totalPoints: agg._sum.totalPoints ?? 0 };
  });

  const oppTriesAgg = await prisma.matchPlayer.groupBy({
    by: ["playerId"],
    where: { isOpponent: true, playerId: { not: null } },
    _sum: { tries: true },
    orderBy: { _sum: { tries: "desc" } },
    take: 10,
    having: { tries: { _sum: { gt: 0 } } },
  });

  const oppTryIds = oppTriesAgg.map((t) => t.playerId as string);
  const oppTryPlayers = await prisma.player.findMany({
    where: { id: { in: oppTryIds } },
    select: {
      id: true,
      slug: true,
      firstName: true,
      lastName: true,
      position: true,
      photoUrl: true,
    },
  });
  const oppTries = oppTriesAgg.map((agg) => {
    const player = oppTryPlayers.find((p) => p.id === agg.playerId)!;
    return { ...player, tries: agg._sum.tries ?? 0 };
  });

  // ── Records de matchs ──────────────────────────────────────────────
  const matchSelect = {
    slug: true,
    date: true,
    scoreUsap: true,
    scoreOpponent: true,
    isHome: true,
    opponent: { select: { name: true, shortName: true } },
    competition: { select: { shortName: true, name: true } },
    venue: { select: { name: true } },
  } as const;

  // Plus grosse victoire (écart max)
  const biggestWins = await prisma.match.findMany({
    where: { result: "VICTOIRE" },
    orderBy: { scoreUsap: "desc" },
    take: 20,
    select: matchSelect,
  });
  // Trier par écart côté JS (Prisma ne supporte pas les colonnes calculées dans orderBy)
  const biggestWin = biggestWins
    .sort(
      (a, b) =>
        b.scoreUsap - b.scoreOpponent - (a.scoreUsap - a.scoreOpponent),
    )
    .slice(0, 5);

  // Plus grosse défaite (écart max)
  const biggestLosses = await prisma.match.findMany({
    where: { result: "DEFAITE" },
    orderBy: { scoreOpponent: "desc" },
    take: 20,
    select: matchSelect,
  });
  const biggestLoss = biggestLosses
    .sort(
      (a, b) =>
        b.scoreOpponent - b.scoreUsap - (a.scoreOpponent - a.scoreUsap),
    )
    .slice(0, 5);

  // Plus gros score total
  const highestScoring = await prisma.match.findMany({
    orderBy: [{ scoreUsap: "desc" }],
    take: 50,
    select: matchSelect,
  });
  const topHighScoring = highestScoring
    .sort(
      (a, b) =>
        b.scoreUsap + b.scoreOpponent - (a.scoreUsap + a.scoreOpponent),
    )
    .slice(0, 5);

  // ── Top adversaires (les plus affrontés) ───────────────────────────
  const opponentStats = await prisma.match.groupBy({
    by: ["opponentId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const oppIds = opponentStats.map((o) => o.opponentId);
  const opponents = await prisma.opponent.findMany({
    where: { id: { in: oppIds } },
    select: { id: true, name: true, shortName: true, logoUrl: true },
  });

  // Récupérer le bilan V/N/D par adversaire
  const oppResultCounts = await prisma.match.groupBy({
    by: ["opponentId", "result"],
    where: { opponentId: { in: oppIds } },
    _count: { id: true },
  });

  const topOpponents = opponentStats.map((stat) => {
    const opp = opponents.find((o) => o.id === stat.opponentId)!;
    const w =
      oppResultCounts.find(
        (r) => r.opponentId === stat.opponentId && r.result === "VICTOIRE",
      )?._count.id ?? 0;
    const d =
      oppResultCounts.find(
        (r) => r.opponentId === stat.opponentId && r.result === "NUL",
      )?._count.id ?? 0;
    const l =
      oppResultCounts.find(
        (r) => r.opponentId === stat.opponentId && r.result === "DEFAITE",
      )?._count.id ?? 0;
    return {
      ...opp,
      total: stat._count.id,
      wins: w,
      draws: d,
      losses: l,
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold uppercase tracking-wider text-foreground">
        Statistiques
      </h1>
      <p className="mb-10 text-muted-foreground">
        Les chiffres clés de l&apos;USAP depuis 1902.
      </p>

      {/* ── Compteurs globaux ─────────────────────────────── */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<Swords className="h-6 w-6 text-usap-or" />}
          value={totalMatches.toLocaleString("fr-FR")}
          label="Matchs joués"
        />
        <StatCard
          icon={<Users className="h-6 w-6 text-usap-or" />}
          value={totalPlayers.toLocaleString("fr-FR")}
          label="Joueurs USAP"
        />
        <StatCard
          icon={<BarChart3 className="h-6 w-6 text-usap-or" />}
          value={totalSeasons.toLocaleString("fr-FR")}
          label="Saisons"
        />
        <StatCard
          icon={<Target className="h-6 w-6 text-usap-or" />}
          value={totalPointsFor.toLocaleString("fr-FR")}
          label="Points marqués"
        />
      </div>

      {/* ── Bilan global ──────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
          <TrendingUp className="h-6 w-6 text-usap-or" />
          Bilan global
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-foreground">
                  &nbsp;
                </th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">
                  J
                </th>
                <th className="px-4 py-3 text-center font-semibold text-green-600">
                  V
                </th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                  N
                </th>
                <th className="px-4 py-3 text-center font-semibold text-red-500">
                  D
                </th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">
                  % Victoires
                </th>
              </tr>
            </thead>
            <tbody>
              <BilanRow
                label="Total"
                bold
                j={totalMatches}
                v={wins}
                n={draws}
                d={losses}
              />
              <BilanRow
                label="Domicile"
                j={homeTotal}
                v={homeWins}
                n={homeDraws}
                d={homeLosses}
              />
              <BilanRow
                label="Extérieur"
                j={awayTotal}
                v={awayWins}
                n={awayDraws}
                d={awayLosses}
              />
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>
            Points marqués :{" "}
            <strong className="text-foreground">
              {totalPointsFor.toLocaleString("fr-FR")}
            </strong>
          </span>
          <span>
            Points encaissés :{" "}
            <strong className="text-foreground">
              {totalPointsAgainst.toLocaleString("fr-FR")}
            </strong>
          </span>
          <span>
            Différence :{" "}
            <strong
              className={
                totalPointsFor - totalPointsAgainst >= 0
                  ? "text-green-600"
                  : "text-red-500"
              }
            >
              {totalPointsFor - totalPointsAgainst >= 0 ? "+" : ""}
              {(totalPointsFor - totalPointsAgainst).toLocaleString("fr-FR")}
            </strong>
          </span>
        </div>
      </section>

      {/* ── Classements joueurs ────────────────────────────── */}
      <div className="mb-10 grid gap-10 lg:grid-cols-3">
        {/* Meilleurs marqueurs */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold uppercase tracking-wider text-foreground">
            <Target className="h-5 w-5 text-usap-or" />
            Meilleurs marqueurs
          </h2>
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
        </section>

        {/* Plus capés */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold uppercase tracking-wider text-foreground">
            <Users className="h-5 w-5 text-usap-or" />
            Plus capés
          </h2>
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
                stat={`${p.appearances} matchs`}
              />
            ))}
          </div>
        </section>

        {/* Meilleurs essayeurs */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold uppercase tracking-wider text-foreground">
            <Award className="h-5 w-5 text-usap-or" />
            Meilleurs marqueurs d&apos;essais
          </h2>
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
                stat={`${p.tries} essais`}
              />
            ))}
          </div>
        </section>
      </div>

      {/* ── Statistiques adverses (contre l'USAP) ───────────── */}
      {(oppScorers.length > 0 || oppTries.length > 0) && (
        <div className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
            <Swords className="h-6 w-6 text-muted-foreground" />
            Contre l&apos;USAP
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Statistiques individuelles des joueurs adverses face à l&apos;USAP.
          </p>
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Meilleurs marqueurs adverses */}
            {oppScorers.length > 0 && (
              <section>
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold uppercase tracking-wider text-foreground">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  Meilleurs marqueurs adverses
                </h3>
                <div className="space-y-1">
                  {oppScorers.map((p, i) => (
                    <PlayerRankRow
                      key={p.id}
                      rank={i + 1}
                      slug={p.slug}
                      firstName={p.firstName}
                      lastName={p.lastName}
                      position={p.position}
                      photoUrl={p.photoUrl}
                      stat={`${p.totalPoints} pts`}
                      variant="opponent"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Meilleurs essayeurs adverses */}
            {oppTries.length > 0 && (
              <section>
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold uppercase tracking-wider text-foreground">
                  <Award className="h-5 w-5 text-muted-foreground" />
                  Meilleurs marqueurs d&apos;essais adverses
                </h3>
                <div className="space-y-1">
                  {oppTries.map((p, i) => (
                    <PlayerRankRow
                      key={p.id}
                      rank={i + 1}
                      slug={p.slug}
                      firstName={p.firstName}
                      lastName={p.lastName}
                      position={p.position}
                      photoUrl={p.photoUrl}
                      stat={`${p.tries} essais`}
                      variant="opponent"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* ── Records de matchs ─────────────────────────────── */}
      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
          <Trophy className="h-6 w-6 text-usap-or" />
          Records
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Plus grosses victoires */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase text-green-600">
              Plus grosses victoires
            </h3>
            <div className="space-y-2">
              {biggestWin.map((m) => (
                <MatchRecordCard key={m.slug} match={m} />
              ))}
            </div>
          </div>

          {/* Plus grosses défaites */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase text-red-500">
              Plus grosses défaites
            </h3>
            <div className="space-y-2">
              {biggestLoss.map((m) => (
                <MatchRecordCard key={m.slug} match={m} />
              ))}
            </div>
          </div>

          {/* Plus gros scores */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
              Plus gros scores cumulés
            </h3>
            <div className="space-y-2">
              {topHighScoring.map((m) => (
                <MatchRecordCard key={m.slug} match={m} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Top adversaires ───────────────────────────────── */}
      {topOpponents.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
            <Swords className="h-6 w-6 text-usap-or" />
            Adversaires les plus affrontés
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Adversaire
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">
                    J
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-green-600">
                    V
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                    N
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-red-500">
                    D
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">
                    %V
                  </th>
                </tr>
              </thead>
              <tbody>
                {topOpponents.map((opp) => (
                  <tr
                    key={opp.id}
                    className="border-b border-border transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-2 font-medium text-foreground">
                      {opp.shortName || opp.name}
                    </td>
                    <td className="px-4 py-2 text-center font-medium text-foreground">
                      {opp.total}
                    </td>
                    <td className="px-4 py-2 text-center text-green-600">
                      {opp.wins}
                    </td>
                    <td className="px-4 py-2 text-center text-muted-foreground">
                      {opp.draws}
                    </td>
                    <td className="px-4 py-2 text-center text-red-500">
                      {opp.losses}
                    </td>
                    <td className="px-4 py-2 text-center font-medium text-foreground">
                      {opp.total > 0
                        ? `${Math.round((opp.wins / opp.total) * 100)}%`
                        : "—"}
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

// ── Composants locaux ────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-usap-carte p-4 text-center">
      <div className="mb-2 flex justify-center">{icon}</div>
      <div className="text-2xl font-bold text-usap-or sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function BilanRow({
  label,
  bold,
  j,
  v,
  n,
  d,
}: {
  label: string;
  bold?: boolean;
  j: number;
  v: number;
  n: number;
  d: number;
}) {
  const pct = j > 0 ? Math.round((v / j) * 100) : 0;
  return (
    <tr className="border-b border-border">
      <td
        className={`px-4 py-2 ${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}
      >
        {label}
      </td>
      <td
        className={`px-4 py-2 text-center ${bold ? "font-bold text-foreground" : "text-foreground"}`}
      >
        {j}
      </td>
      <td className="px-4 py-2 text-center text-green-600">{v}</td>
      <td className="px-4 py-2 text-center text-muted-foreground">{n}</td>
      <td className="px-4 py-2 text-center text-red-500">{d}</td>
      <td className="px-4 py-2 text-center font-medium text-foreground">
        {pct}%
      </td>
    </tr>
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
  variant = "usap",
}: {
  rank: number;
  slug: string;
  firstName: string;
  lastName: string;
  position: string | null;
  photoUrl: string | null;
  stat: string;
  variant?: "usap" | "opponent";
}) {
  const statStyle =
    variant === "opponent"
      ? "bg-muted text-muted-foreground"
      : "bg-usap-sang/10 text-usap-sang";

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
      <span
        className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${statStyle}`}
      >
        {stat}
      </span>
    </Link>
  );
}

function MatchRecordCard({
  match,
}: {
  match: {
    slug: string;
    date: Date;
    scoreUsap: number;
    scoreOpponent: number;
    isHome: boolean;
    opponent: { name: string; shortName: string | null };
    competition: { shortName: string | null; name: string };
    venue: { name: string } | null;
  };
}) {
  const oppName = match.opponent.shortName || match.opponent.name;
  const scoreLine = match.isHome
    ? `USAP ${match.scoreUsap} - ${match.scoreOpponent} ${oppName}`
    : `${oppName} ${match.scoreOpponent} - ${match.scoreUsap} USAP`;

  return (
    <Link
      href={`/matchs/${match.slug}`}
      className="block rounded border border-border bg-background p-3 text-sm transition-colors hover:border-usap-or/30"
    >
      <div className="font-medium text-foreground">{scoreLine}</div>
      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
        <span>{formatDateFR(match.date)}</span>
        <span>{match.competition.shortName || match.competition.name}</span>
        {match.venue && (
          <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {match.venue.name}
          </span>
        )}
      </div>
    </Link>
  );
}

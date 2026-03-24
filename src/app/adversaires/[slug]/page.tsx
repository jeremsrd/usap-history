import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateFR, countryCodeToFlag } from "@/lib/utils";
import {
  Shield,
  Calendar,
  MapPin,
  Globe,
  Swords,
  Trophy,
  Users,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

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
  if (!id) return { title: "Adversaire introuvable - USAP Historia" };

  const opponent = await prisma.opponent.findUnique({
    where: { id },
    select: { name: true, shortName: true },
  });

  if (!opponent) return { title: "Adversaire introuvable - USAP Historia" };

  const displayName = opponent.shortName || opponent.name;

  return {
    title: `${displayName} - Adversaire - USAP Historia`,
    description: `Bilan USAP vs ${displayName}. Historique complet des confrontations, statistiques head-to-head.`,
  };
}

export default async function AdversaireDetailPage({ params }: Props) {
  const { slug } = await params;

  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const opponent = await prisma.opponent.findUnique({
    where: { id },
    include: {
      country: true,
      venue: true,
      formerNames: { orderBy: { usedFrom: "asc" } },
      matches: {
        orderBy: { date: "desc" },
        include: {
          season: { select: { label: true } },
          competition: { select: { shortName: true, name: true } },
          venue: { select: { name: true, city: true } },
        },
      },
    },
  });

  if (!opponent) notFound();

  if (opponent.slug !== slug) {
    redirect(`/adversaires/${opponent.slug}`);
  }

  const displayName = opponent.shortName || opponent.name;

  // Stats head-to-head calculees depuis les matchs
  const totalMatches = opponent.matches.length;
  const victories = opponent.matches.filter(
    (m) => m.result === "VICTOIRE",
  ).length;
  const defeats = opponent.matches.filter(
    (m) => m.result === "DEFAITE",
  ).length;
  const draws = opponent.matches.filter((m) => m.result === "NUL").length;
  const pointsFor = opponent.matches.reduce(
    (sum, m) => sum + m.scoreUsap,
    0,
  );
  const pointsAgainst = opponent.matches.reduce(
    (sum, m) => sum + m.scoreOpponent,
    0,
  );
  const winPct =
    totalMatches > 0 ? Math.round((victories / totalMatches) * 100) : 0;

  // Records : plus grosse victoire et plus lourde defaite
  const winsOnly = opponent.matches.filter((m) => m.result === "VICTOIRE");
  const lossesOnly = opponent.matches.filter((m) => m.result === "DEFAITE");

  const biggestWin = winsOnly.length > 0
    ? winsOnly.reduce((best, m) => {
        const gap = m.scoreUsap - m.scoreOpponent;
        const bestGap = best.scoreUsap - best.scoreOpponent;
        return gap > bestGap ? m : best;
      })
    : null;

  const biggestLoss = lossesOnly.length > 0
    ? lossesOnly.reduce((worst, m) => {
        const gap = m.scoreOpponent - m.scoreUsap;
        const worstGap = worst.scoreOpponent - worst.scoreUsap;
        return gap > worstGap ? m : worst;
      })
    : null;

  // Top 5 marqueurs USAP contre cet adversaire
  const topScorersAgg = await prisma.matchPlayer.groupBy({
    by: ["playerId"],
    where: {
      match: { opponentId: id },
      isOpponent: false,
      playerId: { not: null },
    },
    _sum: { totalPoints: true, tries: true },
    orderBy: { _sum: { totalPoints: "desc" } },
    take: 5,
    having: { totalPoints: { _sum: { gt: 0 } } },
  });

  const topScorerIds = topScorersAgg.map((s) => s.playerId as string);
  const topScorerPlayers =
    topScorerIds.length > 0
      ? await prisma.player.findMany({
          where: { id: { in: topScorerIds } },
          select: {
            id: true,
            slug: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        })
      : [];

  const topScorers = topScorersAgg.map((agg) => {
    const player = topScorerPlayers.find((p) => p.id === agg.playerId);
    return {
      ...player,
      totalPoints: agg._sum.totalPoints ?? 0,
      tries: agg._sum.tries ?? 0,
    };
  });

  // Joueurs passes par les deux clubs
  const sharedPlayers = await prisma.player.findMany({
    where: {
      careerClubs: {
        some: { opponentId: id },
      },
    },
    select: {
      slug: true,
      firstName: true,
      lastName: true,
      position: true,
      photoUrl: true,
    },
    orderBy: { lastName: "asc" },
    take: 20,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Fil d'Ariane */}
      <div className="mb-6 text-sm text-muted-foreground">
        <Link href="/adversaires" className="hover:text-usap-sang">
          Adversaires
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{displayName}</span>
      </div>

      {/* En-tete */}
      <div className="mb-10 rounded-lg border border-border bg-usap-carte p-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Logo */}
          <div className="flex shrink-0 justify-center sm:justify-start">
            {opponent.logoUrl ? (
              <Image
                src={opponent.logoUrl}
                alt={opponent.name}
                width={160}
                height={160}
                className="h-40 w-40 object-contain"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-muted">
                <Shield className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1">
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="text-3xl font-bold uppercase tracking-wider text-foreground">
                {opponent.name}
              </h1>
              {!opponent.isActive && (
                <span className="mt-1 rounded bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                  Club inactif
                </span>
              )}
            </div>

            {opponent.officialName &&
              opponent.officialName !== opponent.name && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {opponent.officialName}
                </p>
              )}

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {opponent.country && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  {countryCodeToFlag(opponent.country.code)}{" "}
                  {opponent.country.name}
                </span>
              )}
              {opponent.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {opponent.city}
                </span>
              )}
              {opponent.foundedYear && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Fond&eacute; en {opponent.foundedYear}
                </span>
              )}
              {opponent.venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {opponent.venue.name}
                </span>
              )}
            </div>

            {/* Couleurs du club */}
            {(opponent.primaryColor || opponent.secondaryColor) && (
              <div className="mt-3 flex items-center gap-2">
                {opponent.primaryColor && (
                  <span
                    className="inline-block h-5 w-5 rounded-full border border-border"
                    style={{ backgroundColor: opponent.primaryColor }}
                    title={`Couleur principale : ${opponent.primaryColor}`}
                  />
                )}
                {opponent.secondaryColor && (
                  <span
                    className="inline-block h-5 w-5 rounded-full border border-border"
                    style={{ backgroundColor: opponent.secondaryColor }}
                    title={`Couleur secondaire : ${opponent.secondaryColor}`}
                  />
                )}
              </div>
            )}

            {/* Anciens noms */}
            {opponent.formerNames.length > 0 && (
              <div className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium">Anciens noms :</span>{" "}
                {opponent.formerNames.map((fn, i) => (
                  <span key={fn.id}>
                    {i > 0 && ", "}
                    {fn.name}
                    {(fn.usedFrom || fn.usedUntil) && (
                      <span className="text-xs">
                        {" "}
                        ({fn.usedFrom ?? "?"}-{fn.usedUntil ?? "..."})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}

            {/* Bilan head-to-head */}
            {totalMatches > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-4 sm:grid-cols-7">
                <StatBox label="Matchs" value={totalMatches} />
                <StatBox
                  label="Victoires"
                  value={victories}
                  className="text-green-600"
                />
                <StatBox
                  label="D&eacute;faites"
                  value={defeats}
                  className="text-red-500"
                />
                <StatBox label="Nuls" value={draws} />
                <StatBox
                  label="Pts marqu&eacute;s"
                  value={pointsFor}
                  className="text-usap-or"
                />
                <StatBox label="Pts encaiss&eacute;s" value={pointsAgainst} />
                <StatBox label="% victoires" value={`${winPct}%`} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Records */}
      {(biggestWin || biggestLoss) && (
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
            <Trophy className="h-6 w-6 text-usap-or" />
            Records
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {biggestWin && (
              <Link
                href={`/matchs/${biggestWin.slug}`}
                className="rounded-lg border border-border bg-green-500/5 p-4 transition-colors hover:border-green-500/30"
              >
                <p className="text-sm font-semibold uppercase text-green-600">
                  Plus grosse victoire
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {biggestWin.scoreUsap} - {biggestWin.scoreOpponent}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateFR(biggestWin.date)} &mdash;{" "}
                  {biggestWin.competition.shortName ||
                    biggestWin.competition.name}
                </p>
              </Link>
            )}
            {biggestLoss && (
              <Link
                href={`/matchs/${biggestLoss.slug}`}
                className="rounded-lg border border-border bg-red-500/5 p-4 transition-colors hover:border-red-500/30"
              >
                <p className="text-sm font-semibold uppercase text-red-500">
                  Plus lourde d&eacute;faite
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {biggestLoss.scoreUsap} - {biggestLoss.scoreOpponent}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateFR(biggestLoss.date)} &mdash;{" "}
                  {biggestLoss.competition.shortName ||
                    biggestLoss.competition.name}
                </p>
              </Link>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Top marqueurs */}
        {topScorers.length > 0 && (
          <section className="lg:col-span-1">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
              <TrendingUp className="h-6 w-6 text-usap-or" />
              Top marqueurs
            </h2>
            <div className="space-y-2">
              {topScorers.map((scorer, i) =>
                scorer.slug ? (
                  <Link
                    key={scorer.slug}
                    href={`/joueurs/${scorer.slug}`}
                    className="flex items-center gap-2 rounded border border-border bg-background px-3 py-2 text-sm transition-colors hover:border-usap-or/30"
                  >
                    <span className="w-6 shrink-0 text-center font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate font-medium text-foreground">
                      {scorer.firstName} {scorer.lastName}
                    </span>
                    <span className="shrink-0 rounded bg-usap-or/10 px-2 py-0.5 text-xs font-bold text-usap-or">
                      {scorer.totalPoints} pts
                    </span>
                    {scorer.tries > 0 && (
                      <span className="shrink-0 rounded bg-usap-sang/10 px-2 py-0.5 text-xs font-bold text-usap-sang">
                        {scorer.tries} E
                      </span>
                    )}
                  </Link>
                ) : null,
              )}
            </div>
          </section>
        )}

        {/* Joueurs passes par les deux clubs */}
        {sharedPlayers.length > 0 && (
          <section className="lg:col-span-2">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
              <Users className="h-6 w-6 text-usap-or" />
              Pass&eacute;s par les deux clubs
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {sharedPlayers.map((p) => (
                <Link
                  key={p.slug}
                  href={`/joueurs/${p.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm transition-colors hover:border-usap-or/30"
                >
                  {p.photoUrl ? (
                    <Image
                      src={p.photoUrl}
                      alt={`${p.firstName} ${p.lastName}`}
                      width={32}
                      height={32}
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {p.firstName} {p.lastName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Historique des matchs */}
      {opponent.matches.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
            <Swords className="h-6 w-6 text-usap-or" />
            Tous les matchs ({opponent.matches.length})
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
                    Comp&eacute;t.
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
                </tr>
              </thead>
              <tbody>
                {opponent.matches.map((m) => {
                  const resultColor =
                    m.result === "VICTOIRE"
                      ? "bg-green-500/10 text-green-600"
                      : m.result === "DEFAITE"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-muted text-muted-foreground";

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
                              {displayName}
                            </>
                          ) : (
                            <>
                              {displayName} -{" "}
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
                        {m.venue ? m.venue.name : "\u2014"}
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
  value: number | string;
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

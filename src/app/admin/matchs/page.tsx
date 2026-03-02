import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import MatchList from "./MatchList";

export default async function AdminMatchsPage() {
  // Auth + rôle
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role === "VIEWER") redirect("/");

  // Données
  const [matches, seasons, competitions, opponents, venues, referees] =
    await Promise.all([
      prisma.match.findMany({
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          kickoffTime: true,
          seasonId: true,
          competitionId: true,
          opponentId: true,
          venueId: true,
          matchday: true,
          round: true,
          leg: true,
          isHome: true,
          isNeutralVenue: true,
          scoreUsap: true,
          scoreOpponent: true,
          halfTimeUsap: true,
          halfTimeOpponent: true,
          result: true,
          bonusOffensif: true,
          bonusDefensif: true,
          refereeId: true,
          attendance: true,
          report: true,
          manOfTheMatch: true,
          triesUsap: true,
          conversionsUsap: true,
          penaltiesUsap: true,
          dropGoalsUsap: true,
          penaltyTriesUsap: true,
          triesOpponent: true,
          conversionsOpponent: true,
          penaltiesOpponent: true,
          dropGoalsOpponent: true,
          penaltyTriesOpponent: true,
          season: { select: { label: true } },
          competition: { select: { name: true, shortName: true } },
          opponent: {
            select: { name: true, shortName: true, logoUrl: true },
          },
          venue: { select: { name: true, city: true } },
          referee: { select: { firstName: true, lastName: true } },
          _count: { select: { players: true, matchEvents: true } },
        },
      }),
      prisma.season.findMany({
        orderBy: { startYear: "desc" },
        select: { id: true, label: true },
      }),
      prisma.competition.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, shortName: true },
      }),
      prisma.opponent.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, shortName: true, logoUrl: true },
      }),
      prisma.venue.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, city: true },
      }),
      prisma.referee.findMany({
        orderBy: { lastName: "asc" },
        select: { id: true, firstName: true, lastName: true },
      }),
    ]);

  // Sérialiser les dates pour le client component
  const serializedMatches = matches.map((m) => ({
    ...m,
    date: m.date.toISOString().split("T")[0],
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Retour au dashboard
        </Link>
        <h1 className="text-2xl font-bold uppercase tracking-wider">
          <span className="text-usap-sang">Gestion</span>{" "}
          <span className="text-usap-or">des matchs</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Matchs de l&apos;USAP depuis 1902.
        </p>
      </div>

      {/* Liste */}
      <MatchList
        matches={serializedMatches}
        seasons={seasons}
        competitions={competitions}
        opponents={opponents}
        venues={venues}
        referees={referees}
      />
    </div>
  );
}

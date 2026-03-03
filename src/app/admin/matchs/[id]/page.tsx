import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Shield, Calendar, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import MatchPlayerManager from "./MatchPlayerManager";
import MatchEventManager from "./MatchEventManager";

const RESULT_LABELS: Record<string, string> = {
  VICTOIRE: "Victoire",
  DEFAITE: "Défaite",
  NUL: "Match nul",
};

const RESULT_STYLES: Record<string, string> = {
  VICTOIRE: "bg-green-500/10 text-green-600",
  DEFAITE: "bg-red-500/10 text-red-600",
  NUL: "bg-muted text-muted-foreground",
};

export default async function AdminMatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Auth + rôle
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role === "VIEWER") redirect("/");

  // Charger le match avec toutes les relations
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      season: { select: { label: true } },
      competition: { select: { name: true, shortName: true } },
      opponent: { select: { name: true, shortName: true, logoUrl: true } },
      venue: { select: { name: true, city: true } },
      referee: { select: { firstName: true, lastName: true } },
      players: {
        include: {
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
            },
          },
        },
        orderBy: [{ isStarter: "desc" }, { shirtNumber: "asc" }],
      },
      matchEvents: {
        orderBy: { minute: "asc" },
      },
    },
  });

  if (!match) notFound();

  // Tous les joueurs pour le sélecteur d'ajout
  const allPlayers = await prisma.player.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const matchDate = new Date(match.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Séparer composition USAP / Adversaire
  const usapPlayers = match.players.filter((mp) => !mp.isOpponent);
  const opponentPlayers = match.players.filter((mp) => mp.isOpponent);

  // Joueurs dans la compo (pour le sélecteur d'événements)
  const compositionPlayers = match.players.map((mp) => ({
    id: mp.player.id,
    firstName: mp.player.firstName,
    lastName: mp.player.lastName,
    isOpponent: mp.isOpponent,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/matchs"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Retour aux matchs
        </Link>

        {/* Match info card */}
        <div className="rounded-lg border border-border bg-usap-carte p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Score & Teams */}
            <div className="flex items-center gap-4">
              {/* USAP */}
              <div className="text-center">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  {match.isHome ? "DOM" : "EXT"}
                </div>
                <div className="mt-1 text-2xl font-bold text-usap-sang">
                  USAP
                </div>
              </div>

              {/* Score */}
              <div className="text-center">
                <div className="text-3xl font-black text-foreground">
                  {match.scoreUsap} - {match.scoreOpponent}
                </div>
                <span
                  className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-semibold ${RESULT_STYLES[match.result] ?? ""}`}
                >
                  {RESULT_LABELS[match.result] ?? match.result}
                </span>
              </div>

              {/* Adversaire */}
              <div className="flex items-center gap-2 text-center">
                {match.opponent.logoUrl ? (
                  <Image
                    src={match.opponent.logoUrl}
                    alt={match.opponent.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                    unoptimized
                  />
                ) : (
                  <Shield size={32} className="text-muted-foreground" />
                )}
                <div className="text-left">
                  <div className="text-lg font-bold text-foreground">
                    {match.opponent.shortName ?? match.opponent.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span className="capitalize">{matchDate}</span>
                {match.kickoffTime && <span>({match.kickoffTime})</span>}
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} />
                <span>
                  {match.competition.shortName ?? match.competition.name}
                </span>
                {match.matchday && <span>— J{match.matchday}</span>}
                {match.round && !match.matchday && (
                  <span>— {match.round}</span>
                )}
              </div>
              {match.venue && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>
                    {match.venue.name}, {match.venue.city}
                  </span>
                </div>
              )}
              {match.referee && (
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>
                    Arbitre : {match.referee.firstName}{" "}
                    {match.referee.lastName}
                  </span>
                </div>
              )}
              {match.attendance && (
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>
                    Affluence : {match.attendance.toLocaleString("fr-FR")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Saison */}
          <div className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
            Saison {match.season.label}
            {(match.bonusOffensif || match.bonusDefensif) && (
              <span className="ml-3">
                {match.bonusOffensif && (
                  <span className="mr-1 rounded bg-usap-or/20 px-1.5 py-0.5 text-xs font-medium text-usap-or">
                    Bonus offensif
                  </span>
                )}
                {match.bonusDefensif && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                    Bonus défensif
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Compositions + Événements */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Colonne gauche : Compositions */}
        <div className="space-y-8">
          {/* Composition USAP */}
          <MatchPlayerManager
            matchId={match.id}
            matchPlayers={usapPlayers}
            allPlayers={allPlayers}
          />

          {/* Composition Adversaire */}
          <MatchPlayerManager
            matchId={match.id}
            matchPlayers={opponentPlayers}
            allPlayers={allPlayers}
            isOpponent
            teamLabel={match.opponent.shortName ?? match.opponent.name}
          />
        </div>

        {/* Colonne droite : Événements */}
        <div>
          <MatchEventManager
            matchId={match.id}
            matchEvents={match.matchEvents}
            matchPlayers={compositionPlayers}
          />
        </div>
      </div>
    </div>
  );
}

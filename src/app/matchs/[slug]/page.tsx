import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { POSITIONS } from "@/lib/constants";
import { formatDateFR } from "@/lib/utils";
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  Award,
  User,
} from "lucide-react";
import type { Metadata } from "next";
import VideoEmbed from "@/components/VideoEmbed";
import ScoreEvolution from "@/components/ScoreEvolution";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const match = await prisma.match.findUnique({
    where: { slug },
    select: {
      date: true,
      scoreUsap: true,
      scoreOpponent: true,
      isHome: true,
      opponent: { select: { name: true, shortName: true } },
      competition: { select: { shortName: true, name: true } },
    },
  });

  if (!match) return { title: "Match introuvable - USAP Historia" };

  const opp = match.opponent.shortName || match.opponent.name;
  const score = match.isHome
    ? `USAP ${match.scoreUsap} - ${match.scoreOpponent} ${opp}`
    : `${opp} ${match.scoreOpponent} - ${match.scoreUsap} USAP`;

  return {
    title: `${score} - USAP Historia`,
    description: `${match.competition.shortName || match.competition.name} — ${score}, ${formatDateFR(match.date)}.`,
  };
}

export default async function MatchDetailPage({ params }: Props) {
  const { slug } = await params;

  const match = await prisma.match.findUnique({
    where: { slug },
    include: {
      season: { select: { label: true } },
      competition: true,
      opponent: {
        select: { name: true, shortName: true, logoUrl: true, city: true, slug: true },
      },
      venue: { select: { name: true, slug: true, city: true } },
      referee: true,
      players: {
        include: {
          player: {
            select: {
              slug: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
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

  const oppName = match.opponent.shortName || match.opponent.name;
  const usapPlayers = match.players.filter((p) => !p.isOpponent);
  const oppPlayers = match.players.filter((p) => p.isOpponent);
  const usapStarters = usapPlayers.filter((p) => p.isStarter);
  const usapSubstitutes = usapPlayers.filter((p) => !p.isStarter);
  const oppStarters = oppPlayers.filter((p) => p.isStarter);
  const oppSubstitutes = oppPlayers.filter((p) => !p.isStarter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Fil d'Ariane */}
      <div className="mb-6 flex flex-wrap gap-1 text-sm text-muted-foreground">
        <Link href="/matchs" className="hover:text-usap-sang">
          Matchs
        </Link>
        <span className="mx-1">/</span>
        <Link
          href={`/saisons/${match.season.label}`}
          className="hover:text-usap-sang"
        >
          {match.season.label}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">
          {match.isHome ? `USAP - ${oppName}` : `${oppName} - USAP`}
        </span>
      </div>

      {/* Score principal */}
      <div className="mb-10 rounded-lg border border-border bg-usap-carte p-6">
        {/* Compétition et date */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-usap-sang">
            {match.competition.shortName || match.competition.name}
            {match.matchday && ` — Journée ${match.matchday}`}
            {match.round && !match.matchday && ` — ${match.round}`}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatDateFR(match.date)}
            {match.kickoffTime && ` à ${match.kickoffTime}`}
          </span>
        </div>

        {/* Affichage score */}
        <div className="flex items-center justify-center gap-4 sm:gap-8">
          {/* Équipe domicile */}
          <div className="flex flex-col items-center gap-2">
            {match.isHome ? (
              <Image src="/images/usap/logo.png" alt="USAP" width={48} height={48} className="h-12 w-12" />
            ) : match.opponent.logoUrl ? (
              <Image src={match.opponent.logoUrl} alt={oppName} width={48} height={48} className="h-12 w-12 object-contain" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {(match.opponent.shortName || match.opponent.name).slice(0, 3).toUpperCase()}
              </div>
            )}
            <p className={`text-lg font-bold uppercase ${match.isHome ? "text-usap-sang" : "text-foreground"}`}>
              {match.isHome ? (
                "USAP"
              ) : (
                <Link href={`/adversaires/${match.opponent.slug}`} className="hover:underline">
                  {oppName}
                </Link>
              )}
            </p>
          </div>

          {/* Score */}
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-foreground sm:text-5xl">
              {match.isHome ? match.scoreUsap : match.scoreOpponent}
            </span>
            <span className="text-2xl text-muted-foreground">-</span>
            <span className="text-4xl font-bold text-foreground sm:text-5xl">
              {match.isHome ? match.scoreOpponent : match.scoreUsap}
            </span>
          </div>

          {/* Équipe extérieur */}
          <div className="flex flex-col items-center gap-2">
            {!match.isHome ? (
              <Image src="/images/usap/logo.png" alt="USAP" width={48} height={48} className="h-12 w-12" />
            ) : match.opponent.logoUrl ? (
              <Image src={match.opponent.logoUrl} alt={oppName} width={48} height={48} className="h-12 w-12 object-contain" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {(match.opponent.shortName || match.opponent.name).slice(0, 3).toUpperCase()}
              </div>
            )}
            <p className={`text-lg font-bold uppercase ${!match.isHome ? "text-usap-sang" : "text-foreground"}`}>
              {match.isHome ? (
                <Link href={`/adversaires/${match.opponent.slug}`} className="hover:underline">
                  {oppName}
                </Link>
              ) : (
                "USAP"
              )}
            </p>
          </div>
        </div>

        {/* Mi-temps */}
        {match.halfTimeUsap != null && match.halfTimeOpponent != null && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Mi-temps :{" "}
            {match.isHome
              ? `${match.halfTimeUsap} - ${match.halfTimeOpponent}`
              : `${match.halfTimeOpponent} - ${match.halfTimeUsap}`}
          </p>
        )}

        {/* Résultat badge */}
        <div className="mt-4 flex justify-center">
          <span
            className={`rounded px-3 py-1 text-sm font-bold ${
              match.result === "VICTOIRE"
                ? "bg-green-500/10 text-green-600"
                : match.result === "DEFAITE"
                  ? "bg-red-500/10 text-red-500"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {match.result === "VICTOIRE"
              ? "Victoire"
              : match.result === "DEFAITE"
                ? "Défaite"
                : "Match nul"}
          </span>
          {match.bonusOffensif && (
            <span className="ml-2 rounded bg-usap-or/10 px-2 py-1 text-xs font-medium text-usap-or">
              BO
            </span>
          )}
          {match.bonusDefensif && (
            <span className="ml-2 rounded bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">
              BD
            </span>
          )}
        </div>

        {/* Infos match */}
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
          {match.venue && (
            <Link
              href={`/stades/${match.venue.slug}`}
              className="flex items-center gap-1.5 hover:text-usap-sang"
            >
              <MapPin className="h-4 w-4" />
              {match.venue.name}, {match.venue.city}
            </Link>
          )}
          {match.attendance && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {match.attendance.toLocaleString("fr-FR")} spectateurs
            </span>
          )}
          {match.referee && (
            <Link
              href={`/arbitres/${match.referee.slug}`}
              className="flex items-center gap-1.5 hover:text-usap-sang"
            >
              <User className="h-4 w-4" />
              {match.referee.firstName} {match.referee.lastName}
            </Link>
          )}
          {match.manOfTheMatch && (
            <span className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-usap-or" />
              {match.manOfTheMatch}
            </span>
          )}
        </div>
      </div>

      {/* Détail scoring */}
      {(match.triesUsap != null || match.triesOpponent != null) && (
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold uppercase tracking-wider text-foreground">
            Détail du score
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    &nbsp;
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-usap-sang">
                    USAP
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">
                    {oppName}
                  </th>
                </tr>
              </thead>
              <tbody>
                <ScoreRow
                  label="Essais"
                  usap={match.triesUsap}
                  opp={match.triesOpponent}
                />
                <ScoreRow
                  label="Transformations"
                  usap={match.conversionsUsap}
                  opp={match.conversionsOpponent}
                />
                <ScoreRow
                  label="Pénalités"
                  usap={match.penaltiesUsap}
                  opp={match.penaltiesOpponent}
                />
                <ScoreRow
                  label="Drops"
                  usap={match.dropGoalsUsap}
                  opp={match.dropGoalsOpponent}
                />
                {(match.penaltyTriesUsap !== 0 || match.penaltyTriesOpponent !== 0) && (
                  <ScoreRow
                    label="Essais de pénalité"
                    usap={match.penaltyTriesUsap}
                    opp={match.penaltyTriesOpponent}
                  />
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Évolution du score */}
      {match.matchEvents.filter((e) => ["ESSAI", "TRANSFORMATION", "PENALITE", "DROP", "ESSAI_PENALITE"].includes(e.type)).length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold uppercase tracking-wider text-foreground">
            Évolution du score
          </h2>
          <ScoreEvolution
            events={match.matchEvents}
            finalScoreUsap={match.scoreUsap}
            finalScoreOpponent={match.scoreOpponent}
            opponentName={oppName}
            isHome={match.isHome}
          />
        </section>
      )}

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Composition USAP */}
        {usapPlayers.length > 0 && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
              <Users className="h-6 w-6 text-usap-or" />
              Composition USAP
            </h2>

            {usapStarters.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
                  Titulaires ({usapStarters.length})
                </h3>
                <div className="space-y-1">
                  {usapStarters.map((mp) => (
                    <PlayerRow key={mp.id} mp={mp} />
                  ))}
                </div>
              </div>
            )}

            {usapSubstitutes.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
                  Remplaçants ({usapSubstitutes.length})
                </h3>
                <div className="space-y-1">
                  {usapSubstitutes.map((mp) => (
                    <PlayerRow key={mp.id} mp={mp} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Composition adversaire */}
        {oppPlayers.length > 0 && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
              <Users className="h-6 w-6 text-muted-foreground" />
              Composition {oppName}
            </h2>

            {oppStarters.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
                  Titulaires ({oppStarters.length})
                </h3>
                <div className="space-y-1">
                  {oppStarters.map((mp) => (
                    <PlayerRow key={mp.id} mp={mp} isOpponentRow />
                  ))}
                </div>
              </div>
            )}

            {oppSubstitutes.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">
                  Remplaçants ({oppSubstitutes.length})
                </h3>
                <div className="space-y-1">
                  {oppSubstitutes.map((mp) => (
                    <PlayerRow key={mp.id} mp={mp} isOpponentRow />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Événements */}
        {match.matchEvents.length > 0 && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
              <Clock className="h-6 w-6 text-usap-or" />
              Événements
            </h2>
            <div className="space-y-2">
              {match.matchEvents.map((event) => {
                const eventIcons: Record<string, string> = {
                  ESSAI: "🏉",
                  TRANSFORMATION: "✅",
                  PENALITE: "🎯",
                  DROP: "🦶",
                  ESSAI_PENALITE: "🏉",
                  CARTON_JAUNE: "🟨",
                  CARTON_ROUGE: "🟥",
                  REMPLACEMENT_ENTREE: "🔄",
                  REMPLACEMENT_SORTIE: "🔄",
                };

                return (
                  <div
                    key={event.id}
                    className={`flex items-center gap-3 rounded border border-border p-2 text-sm ${
                      event.isUsap ? "bg-usap-sang/5" : "bg-muted/30"
                    }`}
                  >
                    <span className="w-10 shrink-0 text-center font-bold text-muted-foreground">
                      {event.minute}&apos;
                    </span>
                    <span>{eventIcons[event.type] ?? "⚡"}</span>
                    <span className="text-foreground">
                      {event.description || event.type.replace(/_/g, " ")}
                    </span>
                    {!event.isUsap && (
                      <span className="text-xs text-muted-foreground">
                        ({oppName})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Résumé vidéo */}
      {match.videoUrl && (
        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold uppercase tracking-wider text-foreground">
            📺 Résumé vidéo
          </h2>
          <VideoEmbed
            url={match.videoUrl}
            title={`Résumé ${match.isHome ? "USAP" : oppName} - ${match.isHome ? oppName : "USAP"}`}
          />
        </section>
      )}

      {/* Compte-rendu */}
      {match.report && (
        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold uppercase tracking-wider text-foreground">
            Compte-rendu
          </h2>
          <div className="rounded-lg border border-border bg-usap-carte p-6 text-sm leading-relaxed text-muted-foreground">
            {match.report}
          </div>
        </section>
      )}
    </div>
  );
}

function ScoreRow({
  label,
  usap,
  opp,
}: {
  label: string;
  usap: number | null | undefined;
  opp: number | null | undefined;
}) {
  if (usap == null && opp == null) return null;
  return (
    <tr className="border-b border-border">
      <td className="px-4 py-2 text-muted-foreground">{label}</td>
      <td className="px-4 py-2 text-center font-medium text-foreground">
        {usap ?? "—"}
      </td>
      <td className="px-4 py-2 text-center font-medium text-foreground">
        {opp ?? "—"}
      </td>
    </tr>
  );
}

function PlayerRow({
  mp,
  isOpponentRow = false,
}: {
  mp: {
    id: string;
    shirtNumber: number | null;
    isStarter: boolean;
    isCaptain: boolean;
    positionPlayed: string | null;
    minutesPlayed: number | null;
    subIn: number | null;
    subOut: number | null;
    tries: number;
    totalPoints: number;
    yellowCard: boolean;
    redCard: boolean;
    player: {
      slug: string;
      firstName: string;
      lastName: string;
    };
  };
  isOpponentRow?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded border border-border bg-background px-3 py-2 text-sm">
      {/* Numéro */}
      <span className={`w-7 shrink-0 text-center font-bold ${isOpponentRow ? "text-muted-foreground" : "text-usap-sang"}`}>
        {mp.shirtNumber ?? "—"}
      </span>

      {/* Nom */}
      <Link
        href={`/joueurs/${mp.player.slug}`}
        className="flex-1 font-medium text-foreground hover:text-usap-sang"
      >
        {mp.player.firstName} {mp.player.lastName}
        {mp.isCaptain && (
          <span className="ml-1 text-xs text-usap-or">(C)</span>
        )}
      </Link>

      {/* Poste */}
      {mp.positionPlayed && (
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {POSITIONS[mp.positionPlayed]?.label ?? mp.positionPlayed}
        </span>
      )}

      {/* Minutes jouées */}
      {mp.minutesPlayed != null && (
        <span className="text-xs text-muted-foreground" title="Minutes jouées">
          {mp.minutesPlayed}&apos;
          {mp.subIn != null && (
            <span className="ml-0.5">({mp.subIn}&apos;→)</span>
          )}
          {mp.subOut != null && !mp.subIn && (
            <span className="ml-0.5">(→{mp.subOut}&apos;)</span>
          )}
        </span>
      )}

      {/* Stats */}
      {mp.tries > 0 && (
        <span className="rounded bg-usap-sang/10 px-1.5 py-0.5 text-xs font-medium text-usap-sang">
          {mp.tries}E
        </span>
      )}
      {mp.totalPoints > 0 && (
        <span className="rounded bg-usap-or/10 px-1.5 py-0.5 text-xs font-medium text-usap-or">
          {mp.totalPoints}pts
        </span>
      )}
      {mp.yellowCard && <span title="Carton jaune">🟨</span>}
      {mp.redCard && <span title="Carton rouge">🟥</span>}
    </div>
  );
}

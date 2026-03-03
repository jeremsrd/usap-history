import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { POSITIONS } from "@/lib/constants";
import { formatDateFR, countryCodeToFlag } from "@/lib/utils";
import {
  Users,
  MapPin,
  Calendar,
  Ruler,
  Weight,
  Trophy,
  Globe,
} from "lucide-react";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  // Extraire l'id du slug (dernière partie après le dernier tiret, 25+ chars)
  const id = extractIdFromSlug(slug);
  if (!id) return { title: "Joueur introuvable - USAP Historia" };

  const player = await prisma.player.findUnique({
    where: { id },
    select: { firstName: true, lastName: true, position: true },
  });

  if (!player) return { title: "Joueur introuvable - USAP Historia" };

  const posLabel = player.position
    ? POSITIONS[player.position]?.label
    : undefined;

  return {
    title: `${player.firstName} ${player.lastName} - USAP Historia`,
    description: `Fiche de ${player.firstName} ${player.lastName}${posLabel ? `, ${posLabel}` : ""} à l'USA Perpignan. Statistiques, carrière et matchs.`,
  };
}

/**
 * Extrait le CUID de la fin du slug.
 * Les CUIDs Prisma font 25 caractères alphanumériques commençant par 'c'.
 */
function extractIdFromSlug(slug: string): string | null {
  const match = slug.match(/([a-z0-9]{25,})$/);
  return match ? match[1] : null;
}

export default async function JoueurDetailPage({ params }: Props) {
  const { slug } = await params;

  const id = extractIdFromSlug(slug);
  if (!id) notFound();

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      nationality: true,
      birthCountry: true,
      careerClubs: {
        orderBy: { displayOrder: "asc" },
        include: { country: true },
      },
      matchAppearances: {
        include: {
          match: {
            select: {
              slug: true,
              date: true,
              scoreUsap: true,
              scoreOpponent: true,
              result: true,
              isHome: true,
              matchday: true,
              round: true,
              competition: { select: { shortName: true, name: true } },
              opponent: { select: { shortName: true, name: true } },
              season: { select: { label: true } },
            },
          },
        },
        orderBy: { match: { date: "desc" } },
      },
      internationalCaps: { include: { nationalTeam: true } },
      awards: { orderBy: { year: "desc" } },
    },
  });

  if (!player) notFound();

  // Rediriger si le slug a changé (joueur renommé)
  if (player.slug !== slug) {
    redirect(`/joueurs/${player.slug}`);
  }

  // Stats agrégées
  const totalAppearances = player.matchAppearances.length;
  const totalStarts = player.matchAppearances.filter(
    (ma) => ma.isStarter,
  ).length;
  const totalTries = player.matchAppearances.reduce(
    (sum, ma) => sum + ma.tries,
    0,
  );
  const totalPoints = player.matchAppearances.reduce(
    (sum, ma) => sum + ma.totalPoints,
    0,
  );

  const age = player.birthDate
    ? Math.floor(
        (Date.now() - new Date(player.birthDate).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      )
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Fil d'Ariane */}
      <div className="mb-6 text-sm text-muted-foreground">
        <Link href="/joueurs" className="hover:text-usap-sang">
          Joueurs
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">
          {player.firstName} {player.lastName}
        </span>
      </div>

      {/* En-tête joueur */}
      <div className="mb-10 rounded-lg border border-border bg-usap-carte p-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Photo */}
          <div className="flex shrink-0 justify-center sm:justify-start">
            {player.photoUrl ? (
              <Image
                src={player.photoUrl}
                alt={`${player.firstName} ${player.lastName}`}
                width={160}
                height={160}
                className="h-40 w-40 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-muted">
                <Users className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Infos principales */}
          <div className="flex-1">
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="text-3xl font-bold uppercase tracking-wider text-foreground">
                {player.firstName} {player.lastName}
              </h1>
              {player.isActive && (
                <span className="mt-1 rounded bg-usap-sang/10 px-3 py-1 text-sm font-medium text-usap-sang">
                  Effectif actuel
                </span>
              )}
            </div>

            {player.position && (
              <p className="mt-1 text-lg text-usap-or">
                {POSITIONS[player.position]?.label ?? player.position}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {player.nationality && (
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  {countryCodeToFlag(player.nationality.code)}{" "}
                  {player.nationality.name}
                </span>
              )}
              {player.birthDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDateFR(player.birthDate)}
                  {age && !player.deathDate && ` (${age} ans)`}
                </span>
              )}
              {player.deathDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Décédé le {formatDateFR(player.deathDate)}
                </span>
              )}
              {player.birthPlace && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {player.birthPlace}
                  {player.birthCountry &&
                    ` (${player.birthCountry.name})`}
                </span>
              )}
              {player.height && (
                <span className="flex items-center gap-1.5">
                  <Ruler className="h-4 w-4" />
                  {player.height} cm
                </span>
              )}
              {player.weight && (
                <span className="flex items-center gap-1.5">
                  <Weight className="h-4 w-4" />
                  {player.weight} kg
                </span>
              )}
            </div>

            {/* Stats USAP */}
            {totalAppearances > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
                <StatBox label="Matchs" value={totalAppearances} />
                <StatBox label="Titulaire" value={totalStarts} />
                <StatBox label="Essais" value={totalTries} />
                <StatBox
                  label="Points"
                  value={totalPoints}
                  className="text-usap-or"
                />
              </div>
            )}
          </div>
        </div>

        {player.biography && (
          <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
            {player.biography}
          </p>
        )}
      </div>

      {/* Carrière */}
      {player.careerClubs.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold uppercase tracking-wider text-foreground">
            Carrière
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Période
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Club
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell">
                    Pays
                  </th>
                  <th className="hidden px-4 py-3 text-center font-semibold text-foreground md:table-cell">
                    Matchs
                  </th>
                  <th className="hidden px-4 py-3 text-center font-semibold text-foreground md:table-cell">
                    Essais
                  </th>
                </tr>
              </thead>
              <tbody>
                {player.careerClubs.map((cc) => (
                  <tr
                    key={cc.id}
                    className={`border-b border-border transition-colors hover:bg-muted/30 ${
                      cc.isUsap ? "bg-usap-sang/5" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {cc.startYear}
                      {cc.endYear ? ` - ${cc.endYear}` : " - ..."}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-medium ${cc.isUsap ? "text-usap-sang" : "text-foreground"}`}
                      >
                        {cc.isUsap ? "USAP" : cc.clubName}
                      </span>
                      {cc.isLoan && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (prêt)
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {cc.country && (
                        <span>
                          {countryCodeToFlag(cc.country.code)}{" "}
                          {cc.country.name}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-center text-muted-foreground md:table-cell">
                      {cc.appearances ?? "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-center text-muted-foreground md:table-cell">
                      {cc.tries ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Sélections internationales */}
      {player.internationalCaps.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
            <Globe className="h-6 w-6 text-usap-or" />
            Sélections internationales
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {player.internationalCaps.map((cap) => (
              <div
                key={cap.id}
                className="rounded-lg border border-border bg-usap-carte p-4"
              >
                <p className="font-bold text-foreground">
                  {cap.nationalTeam.name}
                </p>
                <p className="mt-1 text-2xl font-bold text-usap-or">
                  {cap.totalCaps}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    sélection{cap.totalCaps > 1 ? "s" : ""}
                  </span>
                </p>
                {cap.totalTries != null && cap.totalTries > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {cap.totalTries} essai{cap.totalTries > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Récompenses */}
      {player.awards.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
            <Trophy className="h-6 w-6 text-usap-or" />
            Distinctions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {player.awards.map((award) => (
              <div
                key={award.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-usap-carte p-4"
              >
                <Trophy className="h-5 w-5 shrink-0 text-usap-or" />
                <div>
                  <p className="font-medium text-foreground">{award.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {award.year}
                    {award.category && ` — ${award.category}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Historique des matchs */}
      {player.matchAppearances.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold uppercase tracking-wider text-foreground">
            <Calendar className="h-6 w-6 text-usap-or" />
            Matchs ({player.matchAppearances.length})
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-2 text-left font-semibold text-foreground">
                    Date
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
                  <th className="px-3 py-2 text-center font-semibold text-foreground">
                    N°
                  </th>
                  <th className="hidden px-3 py-2 text-center font-semibold text-foreground md:table-cell">
                    Essais
                  </th>
                  <th className="hidden px-3 py-2 text-center font-semibold text-foreground md:table-cell">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody>
                {player.matchAppearances.map((ma) => {
                  const m = ma.match;
                  const resultColor =
                    m.result === "VICTOIRE"
                      ? "bg-green-500/10 text-green-600"
                      : m.result === "DEFAITE"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-muted text-muted-foreground";
                  const oppName =
                    m.opponent.shortName || m.opponent.name;

                  return (
                    <tr
                      key={ma.id}
                      className="border-b border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {formatDateFR(m.date)}
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
                      <td className="px-3 py-2 text-center text-muted-foreground">
                        {ma.shirtNumber ?? "—"}
                        {!ma.isStarter && ma.shirtNumber && (
                          <span className="text-xs text-muted-foreground">
                            *
                          </span>
                        )}
                      </td>
                      <td className="hidden px-3 py-2 text-center md:table-cell">
                        {ma.tries > 0 ? (
                          <span className="font-medium text-foreground">
                            {ma.tries}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="hidden px-3 py-2 text-center md:table-cell">
                        {ma.totalPoints > 0 ? (
                          <span className="font-medium text-usap-or">
                            {ma.totalPoints}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
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

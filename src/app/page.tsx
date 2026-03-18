import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatDateFR } from "@/lib/utils";
import { PALMARES, DIVISIONS } from "@/lib/constants";
import {
  Trophy,
  Users,
  Calendar,
  Star,
  ChevronRight,
  MapPin,
  BarChart3,
  Swords,
  Building2,
  History,
} from "lucide-react";
import { Prisma } from "@prisma/client";

// Type pour les matchs retournés par la raw query "ce jour dans l'histoire"
type TodayMatch = {
  slug: string;
  date: Date;
  score_usap: number;
  score_opponent: number;
  result: string;
  is_home: boolean;
  opponent_name: string;
  competition_name: string;
};

export default async function Home() {
  const now = new Date();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();

  const [lastMatch, currentSeason, matchCount, playerCount, seasonCount, todayMatches] =
    await Promise.all([
      // Dernier match joué
      prisma.match.findFirst({
        where: { date: { lte: now } },
        orderBy: { date: "desc" },
        select: {
          slug: true,
          date: true,
          scoreUsap: true,
          scoreOpponent: true,
          result: true,
          isHome: true,
          matchday: true,
          round: true,
          competition: { select: { name: true, shortName: true } },
          opponent: { select: { name: true, shortName: true, logoUrl: true } },
          venue: { select: { name: true, city: true } },
          season: { select: { label: true } },
        },
      }),

      // Saison en cours (la plus récente)
      prisma.season.findFirst({
        orderBy: { startYear: "desc" },
        include: {
          coach: { select: { firstName: true, lastName: true } },
          matches: {
            orderBy: { date: "desc" },
            take: 5,
            select: { result: true },
          },
        },
      }),

      // Compteurs
      prisma.match.count(),
      prisma.player.count({
        where: {
          OR: [
            { careerClubs: { some: { isUsap: true } } },
            { matchAppearances: { some: { isOpponent: false } } },
            { seasonSquads: { some: {} } },
          ],
        },
      }),
      prisma.season.count(),

      // Ce jour dans l'histoire
      prisma.$queryRaw<TodayMatch[]>(
        Prisma.sql`
          SELECT m.slug, m.date, m.score_usap, m.score_opponent, m.result, m.is_home,
                 o.name AS opponent_name, c.name AS competition_name
          FROM matches m
          JOIN opponents o ON m.opponent_id = o.id
          JOIN competitions c ON m.competition_id = c.id
          WHERE EXTRACT(MONTH FROM m.date) = ${todayMonth}
            AND EXTRACT(DAY FROM m.date) = ${todayDay}
          ORDER BY m.date DESC
        `,
      ),
    ]);

  // Formater la date du jour pour l'affichage
  const todayLabel = now.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      {/* ── 1. Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-usap-sang/10 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold uppercase tracking-tight sm:text-5xl md:text-6xl">
            <span className="text-usap-sang">L&apos;histoire</span>{" "}
            <span className="text-usap-or">sang et or</span>
            <br />
            <span className="text-foreground">depuis 1902</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            USAP Historia — La base de données historique complète de
            l&apos;USA Perpignan. Matchs, joueurs, saisons et statistiques du
            club catalan.
          </p>
          {currentSeason && (
            <Link
              href={`/saisons/${currentSeason.label}`}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-usap-sang px-6 py-3 font-semibold text-white transition-colors hover:bg-usap-sang/90"
            >
              Saison {currentSeason.label}
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      {/* ── 2. Dernier match ─────────────────────────────────── */}
      {lastMatch && (
        <section className="border-t border-border py-10">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-6 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Dernier match
            </h2>
            <Link href={`/matchs/${lastMatch.slug}`} className="block">
              <div
                className={`mx-auto max-w-2xl rounded-xl border p-6 transition-shadow hover:shadow-lg ${
                  lastMatch.result === "VICTOIRE"
                    ? "border-green-500/30 bg-green-500/5"
                    : lastMatch.result === "DEFAITE"
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-border bg-muted/50"
                }`}
              >
                {/* Compétition + date */}
                <div className="mb-4 flex items-center justify-center gap-3 text-sm text-muted-foreground">
                  <span className="font-medium">
                    {lastMatch.competition.shortName ?? lastMatch.competition.name}
                    {lastMatch.matchday ? ` · J${lastMatch.matchday}` : ""}
                    {lastMatch.round && !lastMatch.matchday ? ` · ${lastMatch.round}` : ""}
                  </span>
                  <span>·</span>
                  <span>{formatDateFR(lastMatch.date)}</span>
                </div>

                {/* Score */}
                <div className="flex items-center justify-center gap-6">
                  {/* USAP ou adversaire à gauche selon dom/ext */}
                  {lastMatch.isHome ? (
                    <>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">USAP</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-4xl font-bold text-foreground">
                          {lastMatch.scoreUsap}
                        </span>
                        <span className="text-2xl text-muted-foreground">-</span>
                        <span className="text-4xl font-bold text-foreground">
                          {lastMatch.scoreOpponent}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          {lastMatch.opponent.logoUrl && (
                            <Image
                              src={lastMatch.opponent.logoUrl}
                              alt={lastMatch.opponent.name}
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          )}
                          <span className="text-lg font-bold text-foreground">
                            {lastMatch.opponent.shortName ?? lastMatch.opponent.name}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {lastMatch.opponent.logoUrl && (
                            <Image
                              src={lastMatch.opponent.logoUrl}
                              alt={lastMatch.opponent.name}
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          )}
                          <span className="text-lg font-bold text-foreground">
                            {lastMatch.opponent.shortName ?? lastMatch.opponent.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-4xl font-bold text-foreground">
                          {lastMatch.scoreOpponent}
                        </span>
                        <span className="text-2xl text-muted-foreground">-</span>
                        <span className="text-4xl font-bold text-foreground">
                          {lastMatch.scoreUsap}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-foreground">USAP</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Lieu */}
                {lastMatch.venue && (
                  <div className="mt-3 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>
                      {lastMatch.venue.name}, {lastMatch.venue.city}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── 3. Saison en cours ───────────────────────────────── */}
      {currentSeason && (
        <section className="border-t border-border py-10">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-6 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Saison {currentSeason.label}
            </h2>
            <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                {/* Division */}
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Division</div>
                  <div className="text-lg font-bold text-foreground">
                    {DIVISIONS[currentSeason.division] ?? currentSeason.division}
                  </div>
                </div>

                {/* Classement */}
                {currentSeason.finalRanking && (
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Classement</div>
                    <div className="text-lg font-bold text-foreground">
                      {currentSeason.finalRanking}
                      <sup>e</sup>
                    </div>
                  </div>
                )}

                {/* Bilan V/N/D */}
                {currentSeason.wins != null && (
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Bilan</div>
                    <div className="flex items-center gap-1 text-lg font-bold">
                      <span className="text-green-600 dark:text-green-400">
                        {currentSeason.wins}V
                      </span>
                      <span className="text-muted-foreground">
                        {currentSeason.draws}N
                      </span>
                      <span className="text-red-600 dark:text-red-400">
                        {currentSeason.losses}D
                      </span>
                    </div>
                  </div>
                )}

                {/* Points */}
                {currentSeason.totalPoints != null && (
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Points</div>
                    <div className="text-lg font-bold text-foreground">
                      {currentSeason.totalPoints}
                    </div>
                  </div>
                )}
              </div>

              {/* Série des 5 derniers matchs */}
              {currentSeason.matches.length > 0 && (
                <div className="mt-5 flex items-center justify-center gap-2">
                  <span className="mr-2 text-sm text-muted-foreground">
                    Derniers résultats
                  </span>
                  {[...currentSeason.matches].reverse().map((m, i) => (
                    <span
                      key={i}
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                        m.result === "VICTOIRE"
                          ? "bg-green-600"
                          : m.result === "DEFAITE"
                            ? "bg-red-600"
                            : "bg-gray-500"
                      }`}
                    >
                      {m.result === "VICTOIRE" ? "V" : m.result === "DEFAITE" ? "D" : "N"}
                    </span>
                  ))}
                </div>
              )}

              {/* Lien */}
              <div className="mt-5 text-center">
                <Link
                  href={`/saisons/${currentSeason.label}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-usap-sang hover:underline"
                >
                  Voir la saison complète
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Chiffres clés (dynamiques) ────────────────────── */}
      <section className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
            La base de données en chiffres
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                icon: Swords,
                value: matchCount.toLocaleString("fr-FR"),
                label: "Matchs référencés",
              },
              {
                icon: Users,
                value: playerCount.toLocaleString("fr-FR"),
                label: "Joueurs référencés",
              },
              {
                icon: Calendar,
                value: seasonCount.toLocaleString("fr-FR"),
                label: "Saisons",
              },
              {
                icon: Trophy,
                value: String(PALMARES.titresChampion.length),
                label: "Titres de champion",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border bg-card p-5 text-center transition-colors hover:border-usap-or/30"
              >
                <stat.icon className="mx-auto mb-2 h-7 w-7 text-usap-or" />
                <div className="text-3xl font-bold text-usap-or">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Ce jour dans l'histoire ───────────────────────── */}
      <section className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Ce jour dans l&apos;histoire
            </h2>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {todayLabel}
            </p>
          </div>

          {todayMatches.length > 0 ? (
            <div className="mx-auto max-w-3xl space-y-3">
              {todayMatches.map((m) => {
                const year = new Date(m.date).getFullYear();
                return (
                  <Link
                    key={m.slug}
                    href={`/matchs/${m.slug}`}
                    className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-usap-or/30"
                  >
                    <div className="text-lg font-bold text-usap-or">{year}</div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {m.is_home
                          ? `USAP ${m.score_usap} - ${m.score_opponent} ${m.opponent_name}`
                          : `${m.opponent_name} ${m.score_opponent} - ${m.score_usap} USAP`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {m.competition_name}
                      </div>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-bold text-white ${
                        m.result === "VICTOIRE"
                          ? "bg-green-600"
                          : m.result === "DEFAITE"
                            ? "bg-red-600"
                            : "bg-gray-500"
                      }`}
                    >
                      {m.result === "VICTOIRE" ? "V" : m.result === "DEFAITE" ? "D" : "N"}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Aucun match de l&apos;USAP joué un {todayLabel} dans notre base
              de données.
            </p>
          )}
        </div>
      </section>

      {/* ── 6. Palmarès compact ──────────────────────────────── */}
      <section className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Palmarès
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Champion de France */}
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-usap-or" />
                <h3 className="font-bold uppercase text-foreground">
                  Champion de France
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PALMARES.titresChampion.map((year) => (
                  <span
                    key={year}
                    className="rounded bg-usap-sang/15 px-2.5 py-0.5 text-sm font-medium text-usap-sang"
                  >
                    {year}
                  </span>
                ))}
              </div>
            </div>

            {/* Finaliste */}
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Star className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-bold uppercase text-foreground">
                  Finaliste
                </h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PALMARES.finales.map((year) => (
                  <span
                    key={year}
                    className="rounded bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground"
                  >
                    {year}
                  </span>
                ))}
              </div>
            </div>

            {/* Autres trophées */}
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-usap-or" />
                <h3 className="font-bold uppercase text-foreground">
                  Autres titres
                </h3>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">
                    Champion Pro D2
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PALMARES.titresProD2.map((year) => (
                      <span
                        key={year}
                        className="rounded bg-usap-or/15 px-2.5 py-0.5 text-sm font-medium text-usap-or"
                      >
                        {year}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">
                    Challenge du Manoir
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PALMARES.challengeDuManoir.map((year) => (
                      <span
                        key={year}
                        className="rounded bg-usap-or/15 px-2.5 py-0.5 text-sm font-medium text-usap-or"
                      >
                        {year}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">
                    Finale Coupe d&apos;Europe
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PALMARES.finaleCoupeEurope.map((year) => (
                      <span
                        key={year}
                        className="rounded bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground"
                      >
                        {year}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/palmares"
              className="inline-flex items-center gap-1 text-sm font-medium text-usap-sang hover:underline"
            >
              Voir le palmarès complet
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. Accès rapide ──────────────────────────────────── */}
      <section className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Explorer
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              {
                href: "/saisons",
                icon: Calendar,
                label: "Saisons",
                desc: "Toutes les saisons",
              },
              {
                href: "/matchs",
                icon: Swords,
                label: "Matchs",
                desc: "Recherche de matchs",
              },
              {
                href: "/joueurs",
                icon: Users,
                label: "Joueurs",
                desc: "Tous les joueurs",
              },
              {
                href: "/statistiques",
                icon: BarChart3,
                label: "Statistiques",
                desc: "Stats globales",
              },
              {
                href: "/adversaires",
                icon: History,
                label: "Adversaires",
                desc: "Clubs affrontés",
              },
              {
                href: "/stades",
                icon: Building2,
                label: "Stades",
                desc: "Enceintes visitées",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-lg border border-border bg-card p-4 text-center transition-colors hover:border-usap-or/30"
              >
                <item.icon className="mx-auto mb-2 h-7 w-7 text-usap-or transition-transform group-hover:scale-110" />
                <div className="font-bold text-foreground">{item.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {item.desc}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

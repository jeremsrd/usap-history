import { prisma } from "@/lib/prisma";
import { Trophy, Star, Medal } from "lucide-react";
import { PALMARES } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Palmarès - USAP Historia",
  description:
    "Le palmarès complet de l'USA Perpignan : titres de champion de France, finales, coupes et trophées européens.",
};

// Icônes et couleurs par type de trophée
const TROPHY_CONFIG: Record<
  string,
  { icon: typeof Trophy; color: string; bgColor: string }
> = {
  CHAMPION: {
    icon: Trophy,
    color: "text-usap-or",
    bgColor: "bg-usap-or/10",
  },
  FINALISTE: {
    icon: Star,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  DEMI_FINALISTE: {
    icon: Medal,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
  },
  QUART_FINALISTE: {
    icon: Medal,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
  },
  VAINQUEUR_COUPE: {
    icon: Trophy,
    color: "text-usap-or",
    bgColor: "bg-usap-or/10",
  },
  FINALISTE_COUPE: {
    icon: Star,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

const TROPHY_LABELS: Record<string, string> = {
  CHAMPION: "Champion",
  FINALISTE: "Finaliste",
  DEMI_FINALISTE: "Demi-finaliste",
  QUART_FINALISTE: "Quart de finaliste",
  VAINQUEUR_COUPE: "Vainqueur",
  FINALISTE_COUPE: "Finaliste",
};

export default async function PalmaresPage() {
  // Récupérer les trophées de la BDD
  const trophies = await prisma.trophy.findMany({
    orderBy: [{ year: "desc" }],
  });

  // Grouper par compétition
  const trophyByCompetition: Record<
    string,
    typeof trophies
  > = {};
  for (const t of trophies) {
    if (!trophyByCompetition[t.competition]) {
      trophyByCompetition[t.competition] = [];
    }
    trophyByCompetition[t.competition].push(t);
  }

  // Compteurs
  const titlesCount = trophies.filter(
    (t) => t.achievement === "CHAMPION" || t.achievement === "VAINQUEUR_COUPE",
  ).length;
  const finalsCount = trophies.filter(
    (t) =>
      t.achievement === "FINALISTE" || t.achievement === "FINALISTE_COUPE",
  ).length;

  // Si pas de données en BDD, utiliser les constantes statiques
  const hasTrophyData = trophies.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold uppercase tracking-wider text-foreground">
        Palmarès
      </h1>
      <p className="mb-10 text-muted-foreground">
        L&apos;histoire glorieuse de l&apos;USAP depuis 1902.
      </p>

      {/* Compteurs résumé */}
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-usap-carte p-4 text-center">
          <Trophy className="mx-auto mb-2 h-6 w-6 text-usap-or" />
          <div className="text-2xl font-bold text-usap-or sm:text-3xl">
            {hasTrophyData ? titlesCount : PALMARES.titresChampion.length}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Titres de champion
          </div>
        </div>
        <div className="rounded-lg border border-border bg-usap-carte p-4 text-center">
          <Star className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <div className="text-2xl font-bold text-foreground sm:text-3xl">
            {hasTrophyData ? finalsCount : PALMARES.finales.length}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">Finales</div>
        </div>
        <div className="rounded-lg border border-border bg-usap-carte p-4 text-center">
          <Trophy className="mx-auto mb-2 h-6 w-6 text-usap-or" />
          <div className="text-2xl font-bold text-usap-or sm:text-3xl">
            {hasTrophyData
              ? trophies.filter(
                  (t) =>
                    t.achievement === "VAINQUEUR_COUPE" &&
                    t.competition.includes("Manoir"),
                ).length
              : PALMARES.challengeDuManoir.length}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Coupes du Manoir
          </div>
        </div>
        <div className="rounded-lg border border-border bg-usap-carte p-4 text-center">
          <Trophy className="mx-auto mb-2 h-6 w-6 text-usap-or" />
          <div className="text-2xl font-bold text-usap-or sm:text-3xl">
            {PALMARES.titresProD2.length}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Titres Pro D2
          </div>
        </div>
      </div>

      {hasTrophyData ? (
        /* ── Données depuis la BDD ─────────────────────────── */
        <div className="space-y-10">
          {Object.entries(trophyByCompetition).map(([competition, items]) => (
            <section key={competition}>
              <h2 className="mb-4 text-2xl font-bold uppercase tracking-wider text-foreground">
                {competition}
              </h2>
              <div className="space-y-3">
                {items.map((t) => {
                  const config = TROPHY_CONFIG[t.achievement] ?? {
                    icon: Medal,
                    color: "text-muted-foreground",
                    bgColor: "bg-muted/50",
                  };
                  const Icon = config.icon;
                  return (
                    <div
                      key={t.id}
                      className="flex items-start gap-4 rounded-lg border border-border bg-usap-carte p-4"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
                      >
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-usap-or">
                            {t.year}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${config.bgColor} ${config.color}`}
                          >
                            {TROPHY_LABELS[t.achievement] ?? t.achievement}
                          </span>
                        </div>
                        {(t.opponent || t.score) && (
                          <p className="mt-1 text-sm text-foreground">
                            {t.opponent && (
                              <span>
                                vs {t.opponent}
                                {t.score && ` — ${t.score}`}
                              </span>
                            )}
                            {!t.opponent && t.score && <span>{t.score}</span>}
                          </p>
                        )}
                        {t.venue && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {t.venue}
                          </p>
                        )}
                        {t.details && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {t.details}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* ── Fallback : données statiques ──────────────────── */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Champion de France */}
          <PalmaresCard
            icon={<Trophy className="h-5 w-5 text-usap-or" />}
            title="Champion de France"
            years={PALMARES.titresChampion}
            badgeClass="bg-usap-sang/20 text-usap-sang"
          />

          {/* Finaliste */}
          <PalmaresCard
            icon={<Star className="h-5 w-5 text-muted-foreground" />}
            title="Finaliste du Championnat"
            years={PALMARES.finales}
            badgeClass="bg-muted text-muted-foreground"
          />

          {/* Champion Pro D2 */}
          <PalmaresCard
            icon={<Trophy className="h-5 w-5 text-usap-or" />}
            title="Champion de Pro D2"
            years={PALMARES.titresProD2}
            badgeClass="bg-usap-or/20 text-usap-or"
          />

          {/* Challenge du Manoir */}
          <PalmaresCard
            icon={<Trophy className="h-5 w-5 text-usap-or" />}
            title="Challenge Yves du Manoir"
            years={PALMARES.challengeDuManoir}
            badgeClass="bg-usap-or/20 text-usap-or"
          />

          {/* Finale Coupe d'Europe */}
          <PalmaresCard
            icon={<Star className="h-5 w-5 text-muted-foreground" />}
            title="Finale Coupe d'Europe"
            years={PALMARES.finaleCoupeEurope}
            badgeClass="bg-muted text-muted-foreground"
          />
        </div>
      )}

      {/* Frise chronologique résumée */}
      <section className="mt-16">
        <h2 className="mb-6 text-2xl font-bold uppercase tracking-wider text-foreground">
          Chronologie
        </h2>
        <div className="relative border-l-2 border-usap-sang/30 pl-6">
          <TimelineItem year={1902} text="Fondation de l'ASP (Association Sportive Perpignanaise)" />
          <TimelineItem year={1914} text="1er titre de Champion de France" highlight />
          <TimelineItem year={1919} text="Fusion ASP + SOP = USP" />
          <TimelineItem year={1921} text="2e titre de Champion de France" highlight />
          <TimelineItem year={1925} text="3e titre de Champion de France" highlight />
          <TimelineItem year={1933} text="Fusion USP + Arlequin Club = USAP" />
          <TimelineItem year={1935} text="1er Challenge Yves du Manoir" highlight />
          <TimelineItem year={1938} text="4e titre de Champion de France" highlight />
          <TimelineItem year={1944} text="5e titre de Champion de France" highlight />
          <TimelineItem year={1955} text="6e titre + 2e Challenge du Manoir (doublé)" highlight />
          <TimelineItem year={1994} text="3e Challenge Yves du Manoir" highlight />
          <TimelineItem year={2003} text="Finale de la Coupe d'Europe (H-Cup)" />
          <TimelineItem year={2009} text="7e titre de Champion de France" highlight />
          <TimelineItem year={2010} text="Finale du Top 14" />
          <TimelineItem year={2018} text="Champion de Pro D2 — Remontée en Top 14" highlight />
          <TimelineItem year={2021} text="Champion de Pro D2 — Remontée en Top 14" highlight />
        </div>
      </section>
    </div>
  );
}

// ── Composants locaux ────────────────────────────────────────────────

function PalmaresCard({
  icon,
  title,
  years,
  badgeClass,
}: {
  icon: React.ReactNode;
  title: string;
  years: readonly number[];
  badgeClass: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-usap-carte p-6">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-bold uppercase text-foreground">
          {title}
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {years.map((year) => (
          <span
            key={year}
            className={`rounded px-3 py-1 text-sm font-medium ${badgeClass}`}
          >
            {year}
          </span>
        ))}
      </div>
    </div>
  );
}

function TimelineItem({
  year,
  text,
  highlight,
}: {
  year: number;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div className="relative mb-6 last:mb-0">
      <div
        className={`absolute -left-[31px] h-4 w-4 rounded-full border-2 ${
          highlight
            ? "border-usap-sang bg-usap-sang"
            : "border-border bg-background"
        }`}
      />
      <div className="flex items-baseline gap-3">
        <span
          className={`text-lg font-bold ${highlight ? "text-usap-or" : "text-muted-foreground"}`}
        >
          {year}
        </span>
        <span
          className={`text-sm ${highlight ? "font-medium text-foreground" : "text-muted-foreground"}`}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

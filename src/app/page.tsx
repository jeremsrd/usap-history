import { Trophy, Users, Calendar, Star } from "lucide-react";
import { PALMARES } from "@/lib/constants";

const stats = [
  {
    icon: Trophy,
    value: "7",
    label: "Titres de Champion de France",
  },
  {
    icon: Star,
    value: "10",
    label: "Finales disputées",
  },
  {
    icon: Calendar,
    value: "120+",
    label: "Ans d'histoire",
  },
  {
    icon: Users,
    value: "3",
    label: "Coupes du Manoir",
  },
];

export default function Home() {
  return (
    <div>
      {/* Section héro */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-usap-sang/10 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold uppercase tracking-tight sm:text-5xl md:text-6xl">
            <span className="text-usap-sang">L&apos;histoire</span>{" "}
            <span className="text-usap-or">sang et or</span>
            <br />
            <span className="text-foreground">depuis 1902</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            La base de données historique complète de l&apos;USA Perpignan.
            Matchs, joueurs, saisons et statistiques du club catalan.
          </p>
        </div>
      </section>

      {/* Section compteurs */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold uppercase tracking-wider text-foreground">
            Le club en chiffres
          </h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-white/10 bg-usap-carte p-6 text-center transition-colors hover:border-usap-or/30"
              >
                <stat.icon className="mx-auto mb-3 h-8 w-8 text-usap-or" />
                <div className="text-3xl font-bold text-usap-or sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section palmarès */}
      <section className="border-t border-white/10 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold uppercase tracking-wider text-foreground">
            Palmarès
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Champion de France */}
            <div className="rounded-lg border border-white/10 bg-usap-carte p-6">
              <div className="mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-usap-or" />
                <h3 className="text-lg font-bold uppercase text-foreground">
                  Champion de France
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {PALMARES.titresChampion.map((year) => (
                  <span
                    key={year}
                    className="rounded bg-usap-sang/20 px-3 py-1 text-sm font-medium text-usap-sang"
                  >
                    {year}
                  </span>
                ))}
              </div>
            </div>

            {/* Finaliste */}
            <div className="rounded-lg border border-white/10 bg-usap-carte p-6">
              <div className="mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-bold uppercase text-foreground">
                  Finaliste
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {PALMARES.finales.map((year) => (
                  <span
                    key={year}
                    className="rounded bg-white/5 px-3 py-1 text-sm font-medium text-muted-foreground"
                  >
                    {year}
                  </span>
                ))}
              </div>
            </div>

            {/* Champion Pro D2 */}
            <div className="rounded-lg border border-white/10 bg-usap-carte p-6">
              <div className="mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-usap-or" />
                <h3 className="text-lg font-bold uppercase text-foreground">
                  Champion Pro D2
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {PALMARES.titresProD2.map((year) => (
                  <span
                    key={year}
                    className="rounded bg-usap-or/20 px-3 py-1 text-sm font-medium text-usap-or"
                  >
                    {year}
                  </span>
                ))}
              </div>
            </div>

            {/* Challenge Yves du Manoir */}
            <div className="rounded-lg border border-white/10 bg-usap-carte p-6">
              <div className="mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-usap-or" />
                <h3 className="text-lg font-bold uppercase text-foreground">
                  Challenge Yves du Manoir
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {PALMARES.challengeDuManoir.map((year) => (
                  <span
                    key={year}
                    className="rounded bg-usap-or/20 px-3 py-1 text-sm font-medium text-usap-or"
                  >
                    {year}
                  </span>
                ))}
              </div>
            </div>

            {/* Finale Coupe d'Europe */}
            <div className="rounded-lg border border-white/10 bg-usap-carte p-6">
              <div className="mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-bold uppercase text-foreground">
                  Finale Coupe d&apos;Europe
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {PALMARES.finaleCoupeEurope.map((year) => (
                  <span
                    key={year}
                    className="rounded bg-white/5 px-3 py-1 text-sm font-medium text-muted-foreground"
                  >
                    {year}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

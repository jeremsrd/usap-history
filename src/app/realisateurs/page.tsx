import { prisma } from "@/lib/prisma";
import { POSITIONS } from "@/lib/constants";
import { JoueurCellule } from "@/components/JoueurCellule";
import { Target } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

/** Nombre de points à partir duquel un joueur entre au tableau. */
const SEUIL = 50;

export const metadata: Metadata = {
  title: "Meilleurs réalisateurs - USAP Historia",
  description:
    "Les meilleurs réalisateurs de l'USA Perpignan : points marqués, essais, transformations, pénalités et drops.",
};

export default async function RealisateursPage() {
  // Mêmes conventions que les centurions et les marqueurs : le camp catalan,
  // les rencontres jouées, toutes compétitions confondues.
  const lignes = await prisma.matchPlayer.findMany({
    where: {
      isOpponent: false,
      playerId: { not: null },
      match: { result: { not: null } },
    },
    select: {
      playerId: true,
      totalPoints: true,
      tries: true,
      conversions: true,
      penalties: true,
      dropGoals: true,
      match: { select: { date: true } },
    },
  });

  interface Bilan {
    points: number;
    essais: number;
    transformations: number;
    penalites: number;
    drops: number;
    matchs: number;
    premier: Date;
    dernier: Date;
  }

  const parJoueur = new Map<string, Bilan>();
  for (const l of lignes) {
    const b = parJoueur.get(l.playerId!) ?? {
      points: 0,
      essais: 0,
      transformations: 0,
      penalites: 0,
      drops: 0,
      matchs: 0,
      premier: l.match.date,
      dernier: l.match.date,
    };
    b.points += l.totalPoints;
    b.essais += l.tries;
    b.transformations += l.conversions;
    b.penalites += l.penalties;
    b.drops += l.dropGoals;
    b.matchs++;
    if (l.match.date < b.premier) b.premier = l.match.date;
    if (l.match.date > b.dernier) b.dernier = l.match.date;
    parJoueur.set(l.playerId!, b);
  }

  const retenus = [...parJoueur.entries()]
    .filter(([, b]) => b.points >= SEUIL)
    // À égalité de points, le plus efficace passe devant : moins de matchs.
    .sort((a, b) => b[1].points - a[1].points || a[1].matchs - b[1].matchs);

  const fiches = await prisma.player.findMany({
    where: { id: { in: retenus.map(([id]) => id) } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      slug: true,
      position: true,
      photoUrl: true,
      isActive: true,
    },
  });
  const parId = new Map(fiches.map((f) => [f.id, f]));

  const realisateurs = retenus
    .map(([id, bilan]) => ({ joueur: parId.get(id)!, bilan }))
    .filter((r) => r.joueur);

  const annee = (d: Date) => d.getUTCFullYear();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold uppercase tracking-wider text-foreground">
        <Target className="h-8 w-8 text-usap-or" />
        Meilleurs réalisateurs
      </h1>
      <p className="mb-6 text-muted-foreground">
        {realisateurs.length} joueurs ont marqué au moins {SEUIL} points sous le
        maillot catalan.
      </p>

      {/* Même réserve que sur les marqueurs : deux saisons ne portent pour
          ainsi dire aucune réalisation, faute de source. */}
      <div className="mb-8 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">
            Deux saisons manquent presque entièrement à ce compte.
          </span>{" "}
          La LNR ne publie aucun fait de match pour 2004-2005 — ni essai, ni
          transformation, ni pénalité — et n&apos;en publie qu&apos;une poignée
          pour 2005-2006. Les buteurs de ces années-là ont marqué davantage que
          ce que leur ligne affiche, et les époques antérieures ne sont pas en
          base du tout.
        </p>
        <p className="mt-2">
          Le détail retombe sur le total partout : essai 5 points,
          transformation 2, pénalité et drop 3. Un essai de pénalité, lui, vaut
          sept points et n&apos;a pas d&apos;auteur — il compte pour
          l&apos;équipe et pour personne.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-3 text-center font-semibold text-foreground">
                #
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                Joueur
              </th>
              <th className="hidden px-4 py-3 text-left font-semibold text-foreground md:table-cell">
                Poste
              </th>
              <th className="hidden px-4 py-3 text-left font-semibold text-foreground md:table-cell">
                Période
              </th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">
                Points
              </th>
              <th className="hidden px-3 py-3 text-center font-semibold text-foreground sm:table-cell">
                E
              </th>
              <th className="hidden px-3 py-3 text-center font-semibold text-foreground sm:table-cell">
                T
              </th>
              <th className="hidden px-3 py-3 text-center font-semibold text-foreground sm:table-cell">
                P
              </th>
              <th className="hidden px-3 py-3 text-center font-semibold text-foreground sm:table-cell">
                D
              </th>
              <th className="hidden px-4 py-3 text-center font-semibold text-foreground lg:table-cell">
                Matchs
              </th>
            </tr>
          </thead>
          <tbody>
            {realisateurs.map(({ joueur, bilan }, i) => (
              <tr
                key={joueur.id}
                className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
              >
                <td className="px-3 py-3 text-center font-bold text-muted-foreground">
                  {i + 1}
                </td>
                <td className="px-4 py-3">
                  <JoueurCellule
                    slug={joueur.slug}
                    firstName={joueur.firstName}
                    lastName={joueur.lastName}
                    photoUrl={joueur.photoUrl}
                    isActive={joueur.isActive}
                  />
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {joueur.position
                    ? (POSITIONS[joueur.position]?.label ?? joueur.position)
                    : "—"}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground md:table-cell">
                  {annee(bilan.premier)}
                  {annee(bilan.dernier) !== annee(bilan.premier) &&
                    ` - ${annee(bilan.dernier)}`}
                </td>
                <td className="px-4 py-3 text-center font-bold text-usap-sang">
                  {bilan.points}
                </td>
                <td className="hidden px-3 py-3 text-center text-muted-foreground sm:table-cell">
                  {bilan.essais || "—"}
                </td>
                <td className="hidden px-3 py-3 text-center text-muted-foreground sm:table-cell">
                  {bilan.transformations || "—"}
                </td>
                <td className="hidden px-3 py-3 text-center text-muted-foreground sm:table-cell">
                  {bilan.penalites || "—"}
                </td>
                <td className="hidden px-3 py-3 text-center text-muted-foreground sm:table-cell">
                  {bilan.drops || "—"}
                </td>
                <td className="hidden px-4 py-3 text-center text-muted-foreground lg:table-cell">
                  {bilan.matchs}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          E : essais — T : transformations — P : pénalités — D : drops
        </p>
      </div>
    </div>
  );
}

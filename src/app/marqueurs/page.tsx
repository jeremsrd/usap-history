import { prisma } from "@/lib/prisma";
import { POSITIONS } from "@/lib/constants";
import { JoueurCellule } from "@/components/JoueurCellule";
import { Award } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

/** Nombre d'essais à partir duquel un joueur entre au tableau. */
const SEUIL = 10;

export const metadata: Metadata = {
  title: "Meilleurs marqueurs - USAP Historia",
  description:
    "Les meilleurs marqueurs d'essais de l'USA Perpignan : essais, matchs et moyenne par rencontre.",
};

export default async function MarqueursPage() {
  // Mêmes conventions que la page des centurions : le camp catalan, les
  // rencontres jouées, toutes compétitions confondues.
  const lignes = await prisma.matchPlayer.findMany({
    where: {
      isOpponent: false,
      playerId: { not: null },
      match: { result: { not: null } },
    },
    select: {
      playerId: true,
      tries: true,
      match: { select: { date: true } },
    },
  });

  interface Bilan {
    essais: number;
    matchs: number;
    premier: Date;
    dernier: Date;
  }

  const parJoueur = new Map<string, Bilan>();
  for (const l of lignes) {
    const b = parJoueur.get(l.playerId!) ?? {
      essais: 0,
      matchs: 0,
      premier: l.match.date,
      dernier: l.match.date,
    };
    b.essais += l.tries;
    b.matchs++;
    if (l.match.date < b.premier) b.premier = l.match.date;
    if (l.match.date > b.dernier) b.dernier = l.match.date;
    parJoueur.set(l.playerId!, b);
  }

  const retenus = [...parJoueur.entries()]
    .filter(([, b]) => b.essais >= SEUIL)
    // À égalité d'essais, le plus efficace passe devant : moins de matchs.
    .sort((a, b) => b[1].essais - a[1].essais || a[1].matchs - b[1].matchs);

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

  const marqueurs = retenus
    .map(([id, bilan]) => ({ joueur: parId.get(id)!, bilan }))
    .filter((m) => m.joueur);

  const annee = (d: Date) => d.getUTCFullYear();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold uppercase tracking-wider text-foreground">
        <Award className="h-8 w-8 text-usap-or" />
        Meilleurs marqueurs
      </h1>
      <p className="mb-6 text-muted-foreground">
        {marqueurs.length} joueurs ont marqué au moins {SEUIL} essais sous le
        maillot catalan.
      </p>

      {/* La réserve est plus lourde ici que sur les centurions : deux saisons
          ne portent pour ainsi dire aucun essai, faute de source. */}
      <div className="mb-8 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">
            Deux saisons manquent presque entièrement à ce compte.
          </span>{" "}
          La LNR ne publie aucun fait de match pour 2004-2005 — pas un essai,
          pas un carton — et n&apos;en publie qu&apos;une poignée pour
          2005-2006. Les joueurs de ces années-là ont marqué davantage que ce
          que leur ligne affiche, et les époques antérieures ne sont pas en base
          du tout.
        </p>
        <p className="mt-2">
          Un essai de pénalité n&apos;a pas d&apos;auteur, et un essai
          collectif non plus : ils comptent pour l&apos;équipe et pour personne.
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
              <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell">
                Poste
              </th>
              <th className="hidden px-4 py-3 text-left font-semibold text-foreground md:table-cell">
                Période
              </th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">
                Essais
              </th>
              <th className="hidden px-4 py-3 text-center font-semibold text-foreground lg:table-cell">
                Matchs
              </th>
              <th className="hidden px-4 py-3 text-center font-semibold text-foreground lg:table-cell">
                Essais/match
              </th>
            </tr>
          </thead>
          <tbody>
            {marqueurs.map(({ joueur, bilan }, i) => (
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
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
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
                  {bilan.essais}
                </td>
                <td className="hidden px-4 py-3 text-center text-muted-foreground lg:table-cell">
                  {bilan.matchs}
                </td>
                <td className="hidden px-4 py-3 text-center text-muted-foreground lg:table-cell">
                  {(bilan.essais / bilan.matchs).toFixed(2).replace(".", ",")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { POSITIONS } from "@/lib/constants";
import { JoueurCellule } from "@/components/JoueurCellule";
import { Shield } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

/** Nombre de matchs à partir duquel un joueur entre au tableau. */
const SEUIL = 100;

export const metadata: Metadata = {
  title: "Centurions - USAP Historia",
  description:
    "Les joueurs qui ont porté au moins cent fois le maillot de l'USA Perpignan : matchs, titularisations, essais et points.",
};

export default async function CenturionsPage() {
  // Un « match » se compte comme sur la fiche joueur : une ligne de
  // composition sur une rencontre **jouée**, sous le maillot catalan. Un
  // remplaçant qui n'est pas entré en jeu compte donc pour une feuille — c'est
  // la convention du site, et les deux pages doivent dire le même nombre.
  const lignes = await prisma.matchPlayer.findMany({
    where: {
      isOpponent: false,
      playerId: { not: null },
      match: { result: { not: null } },
    },
    select: {
      playerId: true,
      isStarter: true,
      tries: true,
      totalPoints: true,
      match: { select: { date: true } },
    },
  });

  interface Bilan {
    matchs: number;
    titularisations: number;
    essais: number;
    points: number;
    premier: Date;
    dernier: Date;
  }

  const parJoueur = new Map<string, Bilan>();
  for (const l of lignes) {
    const b = parJoueur.get(l.playerId!) ?? {
      matchs: 0,
      titularisations: 0,
      essais: 0,
      points: 0,
      premier: l.match.date,
      dernier: l.match.date,
    };
    b.matchs++;
    if (l.isStarter) b.titularisations++;
    b.essais += l.tries;
    b.points += l.totalPoints;
    if (l.match.date < b.premier) b.premier = l.match.date;
    if (l.match.date > b.dernier) b.dernier = l.match.date;
    parJoueur.set(l.playerId!, b);
  }

  const retenus = [...parJoueur.entries()]
    .filter(([, b]) => b.matchs >= SEUIL)
    .sort((a, b) => b[1].matchs - a[1].matchs);

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

  const centurions = retenus
    .map(([id, bilan]) => ({ joueur: parId.get(id)!, bilan }))
    .filter((c) => c.joueur);

  const enActivite = centurions.filter((c) => c.joueur.isActive).length;
  const annee = (d: Date) => d.getUTCFullYear();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold uppercase tracking-wider text-foreground">
        <Shield className="h-8 w-8 text-usap-or" />
        Centurions
      </h1>
      <p className="mb-6 text-muted-foreground">
        {centurions.length} joueurs ont porté au moins {SEUIL} fois le maillot
        catalan
        {enActivite > 0 && (
          <>
            {" "}
            — dont {enActivite} encore à l&apos;effectif
          </>
        )}
        .
      </p>

      {/* Ce que le tableau ne peut pas dire, et il faut le dire : la base ne
          remonte pas avant 2004-2005, faute de source. */}
      <div className="mb-8 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">
            Ce tableau ne couvre pas toute l&apos;histoire du club.
          </span>{" "}
          Les feuilles de match ne sont disponibles qu&apos;à partir de la
          saison 2004-2005 : les centurions des époques antérieures n&apos;y
          figurent pas, et ceux qui étaient déjà là en 2004 ont joué davantage
          de matchs que le compte affiché.
        </p>
        <p className="mt-2">
          Un match se compte comme sur la fiche du joueur : une feuille de match
          sur une rencontre jouée, toutes compétitions confondues.
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
                Matchs
              </th>
              <th className="hidden px-4 py-3 text-center font-semibold text-foreground lg:table-cell">
                Titulaire
              </th>
              <th className="hidden px-4 py-3 text-center font-semibold text-foreground lg:table-cell">
                Essais
              </th>
              <th className="hidden px-4 py-3 text-center font-semibold text-foreground lg:table-cell">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {centurions.map(({ joueur, bilan }, i) => (
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
                  {bilan.matchs}
                </td>
                <td className="hidden px-4 py-3 text-center text-muted-foreground lg:table-cell">
                  {bilan.titularisations}
                </td>
                <td className="hidden px-4 py-3 text-center text-muted-foreground lg:table-cell">
                  {bilan.essais}
                </td>
                <td className="hidden px-4 py-3 text-center text-muted-foreground lg:table-cell">
                  {bilan.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

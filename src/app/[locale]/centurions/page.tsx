import { prisma } from "@/lib/prisma";
import { POSITIONS } from "@/lib/constants";
import { JoueurCellule } from "@/components/JoueurCellule";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import { Shield } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

/** Nombre de matchs à partir duquel un joueur entre au tableau. */
const SEUIL = 100;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Langue }>;
}): Promise<Metadata> {
  const t = await dictionnaire((await params).locale);
  return {
    title: t("centurions.metaTitre"),
    description: t("centurions.metaDescription"),
  };
}

export default async function CenturionsPage({
  params,
}: {
  params: Promise<{ locale: Langue }>;
}) {
  const t = await dictionnaire((await params).locale);
  const libelleActuel = t("classement.actuel");

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
        {t("centurions.titre")}
      </h1>
      <p className="mb-6 text-muted-foreground">
        {t("centurions.compte", { n: centurions.length, seuil: SEUIL })}
        {enActivite > 0 && t("centurions.dontActifs", { n: enActivite })}.
      </p>

      {/* Ce que le tableau ne peut pas dire, et il faut le dire : la base ne
          remonte pas avant 2004-2005, faute de source. */}
      <div className="mb-8 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">
            {t("centurions.reserveTitre")}
          </span>{" "}
          {t("centurions.reserveTexte")}
        </p>
        <p className="mt-2">{t("centurions.reserveCompte")}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-3 text-center font-semibold text-foreground">
                {t("classement.rang")}
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">
                {t("classement.joueur")}
              </th>
              <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell">
                {t("classement.poste")}
              </th>
              <th className="hidden px-4 py-3 text-left font-semibold text-foreground md:table-cell">
                {t("classement.periode")}
              </th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">
                {t("classement.matchs")}
              </th>
              <th className="hidden px-4 py-3 text-center font-semibold text-foreground lg:table-cell">
                {t("classement.titulaire")}
              </th>
              <th className="hidden px-4 py-3 text-center font-semibold text-foreground lg:table-cell">
                {t("classement.essais")}
              </th>
              <th className="hidden px-4 py-3 text-center font-semibold text-foreground lg:table-cell">
                {t("classement.points")}
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
                    libelleActuel={libelleActuel}
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

import { prisma } from "@/lib/prisma";
import { JoueurCellule } from "@/components/JoueurCellule";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";

/**
 * Les centurions, refaits le 7 septembre 2026 dans l'identité des listes.
 * Sa seule audace est **le nombre de matchs en grand caractère condensé
 * en tête de chaque ligne**, en rouge : c'est ce qui fait un centurion,
 * c'est la clé du classement, et le rang n'en est que l'ombre, en gris à
 * côté. Le reste se tait — le joueur comme sur la liste des joueurs,
 * portrait ou case vide, le poste, la période, les titularisations, les
 * essais et les points en colonnes de chiffres.
 *
 * La réserve de couverture, qui tenait dans un encadré, est un paragraphe
 * sous le chapeau, comme sur toutes les listes : la base ne remonte pas
 * avant 2004-2005, et le tableau ne peut pas dire l'histoire du club.
 *
 * Ce que la page ne fait plus : une icône de bouclier devant le titre, un
 * encadré gris, un tableau bordé et arrondi.
 */

export const dynamic = "force-dynamic";

/** Nombre de matchs à partir duquel un joueur entre au tableau. */
const SEUIL = 100;

type Props = { params: Promise<{ locale: Langue }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await dictionnaire((await params).locale);
  return { title: t("centurions.metaTitre"), description: t("centurions.metaDescription") };
}

export default async function CenturionsPage({ params }: Props) {
  const t = await dictionnaire((await params).locale);
  const libelleActuel = t("classement.actuel");

  // Un « match » se compte comme sur la fiche joueur : une ligne de
  // composition sur une rencontre **jouée**, sous le maillot catalan. Un
  // remplaçant qui n'est pas entré en jeu compte donc pour une feuille — c'est
  // la convention du site, et les deux pages doivent dire le même nombre.
  const lignes = await prisma.matchPlayer.findMany({
    where: { isOpponent: false, playerId: { not: null }, match: { result: { not: null } } },
    select: { playerId: true, isStarter: true, tries: true, totalPoints: true, match: { select: { date: true } } },
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
    const b = parJoueur.get(l.playerId!) ?? { matchs: 0, titularisations: 0, essais: 0, points: 0, premier: l.match.date, dernier: l.match.date };
    b.matchs++;
    if (l.isStarter) b.titularisations++;
    b.essais += l.tries;
    b.points += l.totalPoints;
    if (l.match.date < b.premier) b.premier = l.match.date;
    if (l.match.date > b.dernier) b.dernier = l.match.date;
    parJoueur.set(l.playerId!, b);
  }

  // À matchs égaux, le plus ancien passe devant : il y est arrivé le premier.
  const retenus = [...parJoueur.entries()]
    .filter(([, b]) => b.matchs >= SEUIL)
    .sort((a, b) => b[1].matchs - a[1].matchs || a[1].premier.getTime() - b[1].premier.getTime());

  const fiches = await prisma.player.findMany({
    where: { id: { in: retenus.map(([id]) => id) } },
    select: { id: true, firstName: true, lastName: true, slug: true, position: true, photoUrl: true, isActive: true },
  });
  const parId = new Map(fiches.map((f) => [f.id, f]));
  const centurions = retenus.map(([id, bilan]) => ({ joueur: parId.get(id)!, bilan })).filter((c) => c.joueur);
  const enActivite = centurions.filter((c) => c.joueur.isActive).length;
  const annee = (d: Date) => d.getUTCFullYear();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12">
        <h1 className="font-display text-6xl uppercase leading-none text-usap-sang sm:text-8xl">{t("centurions.titre")}</h1>
        <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">
          {t("centurions.compte", { n: centurions.length, seuil: SEUIL })}
          {enActivite > 0 && t("centurions.dontActifs", { n: enActivite })}.
        </p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {t("centurions.reserveTitre")} {t("centurions.reserveTexte")}
        </p>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("centurions.reserveCompte")}</p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("classement.matchs")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("classement.rang")}</th>
              <th scope="col" className="py-2 pr-4 font-medium">{t("classement.joueur")}</th>
              <th scope="col" className="hidden py-2 pr-4 font-medium sm:table-cell">{t("classement.poste")}</th>
              <th scope="col" className="hidden py-2 pr-4 font-medium md:table-cell">{t("classement.periode")}</th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("classement.titulaire")}</th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("classement.essais")}</th>
              <th scope="col" className="hidden py-2 text-right font-medium sm:table-cell">{t("classement.points")}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {centurions.map(({ joueur, bilan }, i) => (
              <tr key={joueur.id} className="border-b border-border hover:bg-muted">
                <td className="py-2 pr-3 text-right font-display text-3xl leading-none text-usap-sang sm:text-4xl">{bilan.matchs}</td>
                <td className="py-2 pr-3 text-right text-xs text-muted-foreground">{i + 1}</td>
                <td className="py-2 pr-4">
                  <JoueurCellule
                    slug={joueur.slug}
                    firstName={joueur.firstName}
                    lastName={joueur.lastName}
                    photoUrl={joueur.photoUrl}
                    isActive={joueur.isActive}
                    libelleActuel={libelleActuel}
                  />
                </td>
                <td className="hidden py-2 pr-4 whitespace-nowrap text-muted-foreground sm:table-cell">
                  {joueur.position ? t(`postes.${joueur.position}`) : ""}
                </td>
                <td className="hidden py-2 pr-4 whitespace-nowrap text-muted-foreground md:table-cell">
                  {annee(bilan.premier)}
                  {annee(bilan.dernier) !== annee(bilan.premier) && `-${annee(bilan.dernier)}`}
                </td>
                <td className="hidden py-2 pr-3 text-right text-foreground sm:table-cell">{bilan.titularisations}</td>
                <td className="hidden py-2 pr-3 text-right text-foreground sm:table-cell">{bilan.essais || ""}</td>
                <td className="hidden py-2 text-right text-foreground sm:table-cell">{bilan.points || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

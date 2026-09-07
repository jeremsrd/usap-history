import { prisma } from "@/lib/prisma";
import { POSITIONS } from "@/lib/constants";
import { baremeDeMatch } from "@/lib/scoring";
import { JoueurCellule } from "@/components/JoueurCellule";
import { dictionnaire, type Traduire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";

/**
 * Trois classements de ce qui se marque, sur une seule page. Ils ne se
 * recopient pas l'un l'autre : les populations diffèrent — un ailier figure
 * aux essais et pas au pied, un buteur l'inverse — et un joueur y tient trois
 * rangs distincts. Les séparer en trois pages aurait multiplié les entrées de
 * menu pour la même donnée. Les centurions, eux, gardent la leur : ils
 * comptent des matchs, pas des points.
 *
 * Refaits le 7 septembre 2026 dans l'identité des listes, sur le modèle des
 * centurions : **la valeur du classement en grand caractère condensé en tête
 * de chaque ligne**, en rouge — les points, les essais, les points au pied —,
 * le rang en gris à côté ; chaque classement sous un titre rouge et son
 * filet, son critère en une phrase, le détail en colonnes de chiffres aux
 * en-têtes écrits en mots plutôt qu'en lettres à légende. Les trois ancres
 * sont des liens en tête, avec leur compte ; les réserves, des paragraphes
 * sous le chapeau.
 *
 * Ce que la page ne fait plus : une cible, une médaille et une empreinte
 * de pas devant les titres, trois puces bordées pour les ancres, un encadré
 * gris, trois tableaux bordés et arrondis avec une légende en pied.
 */
const SEUIL_POINTS = 50;
const SEUIL_ESSAIS = 10;
const SEUIL_AU_PIED = 50;

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Langue }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await dictionnaire((await params).locale);
  return { title: t("realisateurs.metaTitre"), description: t("realisateurs.metaDescription") };
}

interface Fiche {
  id: string;
  firstName: string;
  lastName: string;
  slug: string;
  position: string | null;
  photoUrl: string | null;
  isActive: boolean;
}

interface Bilan {
  points: number;
  essais: number;
  transformations: number;
  penalites: number;
  drops: number;
  /** Points au pied, comptés ligne à ligne sous le barème de la saison. */
  auPied: number;
  matchs: number;
  premier: Date;
  dernier: Date;
}

export default async function RealisateursPage({ params }: Props) {
  const t = await dictionnaire((await params).locale);
  const libelleActuel = t("classement.actuel");

  // Mêmes conventions que la page des centurions : le camp catalan, les
  // rencontres jouées, toutes compétitions confondues.
  const lignes = await prisma.matchPlayer.findMany({
    where: { isOpponent: false, playerId: { not: null }, match: { result: { not: null } } },
    select: {
      playerId: true,
      totalPoints: true,
      tries: true,
      conversions: true,
      penalties: true,
      dropGoals: true,
      match: { select: { date: true, season: { select: { startYear: true } } } },
    },
  });

  const parJoueur = new Map<string, Bilan>();
  for (const l of lignes) {
    const b = parJoueur.get(l.playerId!) ?? {
      points: 0,
      essais: 0,
      transformations: 0,
      penalites: 0,
      drops: 0,
      auPied: 0,
      matchs: 0,
      premier: l.match.date,
      dernier: l.match.date,
    };
    const bareme = baremeDeMatch(l.match.season.startYear);
    b.auPied += bareme.transformation * l.conversions + bareme.penalite * l.penalties + bareme.drop * l.dropGoals;
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

  const fiches = await prisma.player.findMany({
    where: { id: { in: [...parJoueur.keys()] } },
    select: { id: true, firstName: true, lastName: true, slug: true, position: true, photoUrl: true, isActive: true },
  });
  const parId = new Map(fiches.map((f) => [f.id, f]));

  /** Un classement : on filtre, on trie, et à égalité le moins de matchs devant. */
  const classer = (valeur: (b: Bilan) => number, seuil: number) =>
    [...parJoueur.entries()]
      .filter(([id, b]) => valeur(b) >= seuil && parId.has(id))
      .sort((a, b) => valeur(b[1]) - valeur(a[1]) || a[1].matchs - b[1].matchs)
      .map(([id, bilan]) => ({ joueur: parId.get(id)!, bilan }));

  const auxPoints = classer((b) => b.points, SEUIL_POINTS);
  const auxEssais = classer((b) => b.essais, SEUIL_ESSAIS);
  const auPied = classer((b) => b.auPied, SEUIL_AU_PIED);
  const parMatch = (n: number, matchs: number) => (n / matchs).toFixed(2).replace(".", ",");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12">
        <h1 className="font-display text-5xl uppercase leading-none text-usap-sang sm:text-8xl">{t("realisateurs.titre")}</h1>
        <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">{t("realisateurs.chapeau")}</p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {t("realisateurs.reserveTitre")} {t("realisateurs.reserveTexte")}
        </p>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("realisateurs.reserveBareme")}</p>
      </header>

      <nav className="mb-8 flex flex-wrap gap-x-6 gap-y-2 font-display text-xl">
        {[
          ["#points", t("realisateurs.ongletPoints", { n: auxPoints.length })],
          ["#essais", t("realisateurs.ongletEssais", { n: auxEssais.length })],
          ["#au-pied", t("realisateurs.ongletAuPied", { n: auPied.length })],
        ].map(([href, label]) => (
          <a key={href} href={href} className="text-foreground hover:text-usap-sang">
            {label}
          </a>
        ))}
      </nav>

      <Classement
        t={t}
        libelleActuel={libelleActuel}
        id="points"
        titre={t("realisateurs.sectionPoints")}
        critere={t("realisateurs.criterePoints", { seuil: SEUIL_POINTS })}
        entete={t("classement.points")}
        colonnes={[t("classement.essais"), t("realisateurs.colTransformations"), t("realisateurs.colPenalites"), t("realisateurs.colDrops")]}
        lignes={auxPoints.map(({ joueur, bilan }) => ({
          joueur,
          bilan,
          valeur: bilan.points,
          detail: [bilan.essais, bilan.transformations, bilan.penalites, bilan.drops],
        }))}
      />

      <Classement
        t={t}
        libelleActuel={libelleActuel}
        id="essais"
        titre={t("realisateurs.sectionEssais")}
        critere={t("realisateurs.critereEssais", { seuil: SEUIL_ESSAIS })}
        entete={t("classement.essais")}
        colonnes={[t("realisateurs.enteteEssaisParMatch")]}
        lignes={auxEssais.map(({ joueur, bilan }) => ({ joueur, bilan, valeur: bilan.essais, detail: [parMatch(bilan.essais, bilan.matchs)] }))}
      />

      <Classement
        t={t}
        libelleActuel={libelleActuel}
        id="au-pied"
        titre={t("realisateurs.sectionAuPied")}
        critere={t("realisateurs.critereAuPied", { seuil: SEUIL_AU_PIED })}
        entete={t("classement.points")}
        colonnes={[t("realisateurs.colTransformations"), t("realisateurs.colPenalites"), t("realisateurs.colDrops")]}
        lignes={auPied.map(({ joueur, bilan }) => ({
          joueur,
          bilan,
          valeur: bilan.auPied,
          detail: [bilan.transformations, bilan.penalites, bilan.drops],
        }))}
      />
    </div>
  );
}

/** Un classement : la valeur en grand en tête de ligne, le détail en colonnes. */
function Classement({
  id,
  titre,
  critere,
  entete,
  colonnes,
  lignes,
  t,
  libelleActuel,
}: {
  id: string;
  titre: string;
  critere: string;
  entete: string;
  colonnes: string[];
  lignes: Array<{ joueur: Fiche; bilan: Bilan; valeur: number; detail: Array<number | string> }>;
  t: Traduire;
  libelleActuel: string;
}) {
  const annee = (d: Date) => d.getUTCFullYear();

  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="mb-1 border-b-2 border-usap-sang pb-1 font-display text-3xl uppercase leading-none text-usap-sang">{titre}</h2>
      <p className="mb-3 max-w-prose text-sm text-muted-foreground">{critere}</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th scope="col" className="py-2 pr-3 text-right font-medium">{entete}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("classement.rang")}</th>
              <th scope="col" className="py-2 pr-4 font-medium">{t("classement.joueur")}</th>
              <th scope="col" className="hidden py-2 pr-4 font-medium md:table-cell">{t("classement.poste")}</th>
              <th scope="col" className="hidden py-2 pr-4 font-medium md:table-cell">{t("classement.periode")}</th>
              {colonnes.map((c) => (
                <th key={c} scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">
                  {c}
                </th>
              ))}
              <th scope="col" className="hidden py-2 text-right font-medium lg:table-cell">{t("classement.matchs")}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {lignes.map(({ joueur, bilan, valeur, detail }, i) => (
              <tr key={joueur.id} className="border-b border-border hover:bg-muted">
                <td className="py-2 pr-3 text-right font-display text-3xl leading-none text-usap-sang sm:text-4xl">{valeur}</td>
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
                <td className="hidden py-2 pr-4 whitespace-nowrap text-muted-foreground md:table-cell">
                  {joueur.position ? (POSITIONS[joueur.position]?.label ?? joueur.position) : ""}
                </td>
                <td className="hidden py-2 pr-4 whitespace-nowrap text-muted-foreground md:table-cell">
                  {annee(bilan.premier)}
                  {annee(bilan.dernier) !== annee(bilan.premier) && `-${annee(bilan.dernier)}`}
                </td>
                {detail.map((d, j) => (
                  <td key={j} className="hidden py-2 pr-3 text-right text-foreground sm:table-cell">
                    {d || ""}
                  </td>
                ))}
                <td className="hidden py-2 text-right text-muted-foreground lg:table-cell">{bilan.matchs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

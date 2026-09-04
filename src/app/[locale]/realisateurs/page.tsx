import { prisma } from "@/lib/prisma";
import { POSITIONS } from "@/lib/constants";
import { JoueurCellule } from "@/components/JoueurCellule";
import { Award, Footprints, Target } from "lucide-react";
import { dictionnaire, type Traduire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

/**
 * Trois classements de ce qui se marque, sur une seule page. Ils ne se
 * recopient pas l'un l'autre : les populations diffèrent — un ailier figure
 * aux essais et pas au pied, un buteur l'inverse — et un joueur y tient trois
 * rangs distincts. Les séparer en trois pages aurait multiplié les entrées de
 * menu pour la même donnée. Les centurions, eux, gardent la leur : ils
 * comptent des matchs, pas des points.
 */
const SEUIL_POINTS = 50;
const SEUIL_ESSAIS = 10;
const SEUIL_AU_PIED = 50;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Langue }>;
}): Promise<Metadata> {
  const t = await dictionnaire((await params).locale);
  return {
    title: t("realisateurs.metaTitre"),
    description: t("realisateurs.metaDescription"),
  };
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
  matchs: number;
  premier: Date;
  dernier: Date;
}

/** Points marqués au pied : la transformation, la pénalité et le drop. */
const auPied = (b: Bilan) => 2 * b.transformations + 3 * (b.penalites + b.drops);

export default async function RealisateursPage({
  params,
}: {
  params: Promise<{ locale: Langue }>;
}) {
  const t = await dictionnaire((await params).locale);
  const libelleActuel = t("classement.actuel");

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
      totalPoints: true,
      tries: true,
      conversions: true,
      penalties: true,
      dropGoals: true,
      match: { select: { date: true } },
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

  const fiches = await prisma.player.findMany({
    where: { id: { in: [...parJoueur.keys()] } },
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

  /** Un classement : on filtre, on trie, et à égalité le moins de matchs devant. */
  const classer = (valeur: (b: Bilan) => number, seuil: number) =>
    [...parJoueur.entries()]
      .filter(([id, b]) => valeur(b) >= seuil && parId.has(id))
      .sort(
        (a, b) => valeur(b[1]) - valeur(a[1]) || a[1].matchs - b[1].matchs,
      )
      .map(([id, bilan]) => ({ joueur: parId.get(id)!, bilan }));

  const auxPoints = classer((b) => b.points, SEUIL_POINTS);
  const auxEssais = classer((b) => b.essais, SEUIL_ESSAIS);
  const auPiedListe = classer(auPied, SEUIL_AU_PIED);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold uppercase tracking-wider text-foreground">
        <Target className="h-8 w-8 text-usap-or" />
        {t("realisateurs.titre")}
      </h1>
      <p className="mb-6 text-muted-foreground">
        {t("realisateurs.chapeau")}
      </p>

      <nav className="mb-8 flex flex-wrap gap-2">
        {[
          { href: "#points", label: t("realisateurs.ongletPoints", { n: auxPoints.length }) },
          { href: "#essais", label: t("realisateurs.ongletEssais", { n: auxEssais.length }) },
          { href: "#au-pied", label: t("realisateurs.ongletAuPied", { n: auPiedListe.length }) },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="rounded border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-usap-or/40 hover:text-usap-sang"
          >
            {l.label}
          </a>
        ))}
      </nav>

      {/* La réserve vaut pour les trois classements : elle est posée une fois. */}
      <div className="mb-10 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">
            {t("realisateurs.reserveTitre")}
          </span>{" "}
          {t("realisateurs.reserveTexte")}
        </p>
        <p className="mt-2">
          {t("realisateurs.reserveBareme")}
        </p>
      </div>

      <Classement
        t={t}
        libelleActuel={libelleActuel}
        id="points"
        icone={<Target className="h-5 w-5 text-usap-or" />}
        titre={t("realisateurs.sectionPoints")}
        critere={t("realisateurs.criterePoints", { seuil: SEUIL_POINTS })}
        entete={t("classement.points")}
        lignes={auxPoints.map(({ joueur, bilan }) => ({
          joueur,
          bilan,
          valeur: bilan.points,
          extras: [
            { label: "E", valeur: bilan.essais },
            { label: "T", valeur: bilan.transformations },
            { label: "P", valeur: bilan.penalites },
            { label: "D", valeur: bilan.drops },
          ],
        }))}
        legende={t("realisateurs.legendeComplete")}
      />

      <Classement
        t={t}
        libelleActuel={libelleActuel}
        id="essais"
        icone={<Award className="h-5 w-5 text-usap-or" />}
        titre={t("realisateurs.sectionEssais")}
        critere={t("realisateurs.critereEssais", { seuil: SEUIL_ESSAIS })}
        entete={t("classement.essais")}
        lignes={auxEssais.map(({ joueur, bilan }) => ({
          joueur,
          bilan,
          valeur: bilan.essais,
          extras: [
            {
              label: t("realisateurs.enteteEssaisParMatch"),
              valeur: (bilan.essais / bilan.matchs).toFixed(2).replace(".", ","),
            },
          ],
        }))}
      />

      <Classement
        t={t}
        libelleActuel={libelleActuel}
        id="au-pied"
        icone={<Footprints className="h-5 w-5 text-usap-or" />}
        titre={t("realisateurs.sectionAuPied")}
        critere={t("realisateurs.critereAuPied", { seuil: SEUIL_AU_PIED })}
        entete={t("realisateurs.sectionAuPied")}
        lignes={auPiedListe.map(({ joueur, bilan }) => ({
          joueur,
          bilan,
          valeur: auPied(bilan),
          extras: [
            { label: "T", valeur: bilan.transformations },
            { label: "P", valeur: bilan.penalites },
            { label: "D", valeur: bilan.drops },
          ],
        }))}
        legende={t("realisateurs.legendeAuPied")}
      />
    </div>
  );
}

/** Un classement : même colonnes de tête partout, les suivantes au choix. */
function Classement({
  id,
  icone,
  titre,
  critere,
  entete,
  lignes,
  legende,
  t,
  libelleActuel,
}: {
  id: string;
  icone: React.ReactNode;
  titre: string;
  critere: string;
  entete: string;
  lignes: Array<{
    joueur: Fiche;
    bilan: Bilan;
    valeur: number;
    extras: Array<{ label: string; valeur: number | string }>;
  }>;
  legende?: string;
  t: Traduire;
  libelleActuel: string;
}) {
  const annee = (d: Date) => d.getUTCFullYear();

  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="mb-1 flex items-center gap-2 text-xl font-bold uppercase tracking-wider text-foreground">
        {icone}
        {titre}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">{critere}</p>

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
              <th className="hidden px-4 py-3 text-left font-semibold text-foreground md:table-cell">
                {t("classement.poste")}
              </th>
              <th className="hidden px-4 py-3 text-left font-semibold text-foreground md:table-cell">
                {t("classement.periode")}
              </th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">
                {entete}
              </th>
              {lignes[0]?.extras.map((e) => (
                <th
                  key={e.label}
                  className="hidden px-3 py-3 text-center font-semibold text-foreground sm:table-cell"
                >
                  {e.label}
                </th>
              ))}
              <th className="hidden px-4 py-3 text-center font-semibold text-foreground lg:table-cell">
                {t("classement.matchs")}
              </th>
            </tr>
          </thead>
          <tbody>
            {lignes.map(({ joueur, bilan, valeur, extras }, i) => (
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
                  {valeur}
                </td>
                {extras.map((e) => (
                  <td
                    key={e.label}
                    className="hidden px-3 py-3 text-center text-muted-foreground sm:table-cell"
                  >
                    {e.valeur || "—"}
                  </td>
                ))}
                <td className="hidden px-4 py-3 text-center text-muted-foreground lg:table-cell">
                  {bilan.matchs}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {legende && (
          <p className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
            {legende}
          </p>
        )}
      </div>
    </section>
  );
}

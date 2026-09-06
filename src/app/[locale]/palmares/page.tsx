import Link from "@/components/Lien";
import { prisma } from "@/lib/prisma";
import { PALMARES } from "@/lib/constants";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";

/**
 * Le palmarès, refait le 6 septembre 2026 dans l'identité posée sur les
 * autres pages. Sa seule audace est **la chronologie** : une colonne
 * d'années en grand caractère condensé — en or les titres, en encre les
 * finales perdues, en gris les dates du club, fondation et fusions —, et
 * en regard ce qui s'est passé, l'adversaire, le score, le lieu, et la
 * rencontre quand la base la porte. C'est la structure réelle d'un
 * palmarès, une suite de dates, et le lecteur y voit d'un coup d'œil les
 * années 1920 et 1930 dorées, puis le long silence jusqu'en 2009.
 *
 * Puis, compétition par compétition, le même palmarès en tableaux. Les
 * données viennent de la table `Trophy` ; si elle était vide, les
 * constantes de `PALMARES` la remplacent.
 *
 * Ce que la page ne fait plus : quatre cases de chiffres à trophée, des
 * badges d'années, des ronds d'icône, une frise à pastilles.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Langue }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  return { title: t("palmares.metaTitre"), description: t("palmares.metaDescription") };
}

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Ligne = {
  year: number;
  achievement: string;
  competition: string;
  opponent: string | null;
  score: string | null;
  venue: string | null;
  details: string | null;
};

const ORDRE_COMPETITIONS = ["Championnat de France", "Challenge Yves du Manoir", "Coupe d'Europe", "Pro D2"];
/** Le championnat porte deux libellés en base, « Championnat de France » et « … Top 14 » : un seul ici. */
const competitionDe = (l: Ligne) => (/championnat/i.test(l.competition) ? "Championnat de France" : l.competition);
const estTitre = (l: Ligne) => l.achievement === "CHAMPION" || l.achievement === "VAINQUEUR_COUPE";

export default async function PalmaresPage({ params }: Props) {
  const { locale } = await params;
  const t = await dictionnaire(locale);

  const trophies = await prisma.trophy.findMany({ orderBy: { year: "asc" } });
  const lignes: Ligne[] =
    trophies.length > 0
      ? trophies
      : [
          ...PALMARES.titresChampion.map((year) => ({ year, achievement: "CHAMPION", competition: "Championnat de France" })),
          ...PALMARES.finales.map((year) => ({ year, achievement: "FINALISTE", competition: "Championnat de France" })),
          ...PALMARES.challengeDuManoir.map((year) => ({ year, achievement: "VAINQUEUR_COUPE", competition: "Challenge Yves du Manoir" })),
          ...PALMARES.titresProD2.map((year) => ({ year, achievement: "CHAMPION", competition: "Pro D2" })),
          ...PALMARES.finaleCoupeEurope.map((year) => ({ year, achievement: "FINALISTE", competition: "Coupe d'Europe" })),
        ].map((l) => ({ ...l, opponent: null, score: null, venue: null, details: null }));

  // Les finales que la base porte, par année et par championnat.
  const finales = await prisma.match.findMany({
    where: { round: { startsWith: "Finale" }, result: { not: null } },
    select: { slug: true, date: true, competition: { select: { name: true, shortName: true } } },
  });
  const rencontreDe = (l: Ligne) =>
    finales.find((f) => {
      const c = f.competition.shortName || f.competition.name;
      const proD2 = /pro d2/i.test(c);
      return f.date.getFullYear() === l.year && proD2 === /pro d2/i.test(l.competition) && !/challenge|coupe/i.test(l.competition);
    }) ?? null;

  const libelle = (l: Ligne) => {
    switch (l.achievement) {
      case "CHAMPION":
        return /pro d2/i.test(l.competition) ? t("palmares.championProD2") : t("palmares.champion");
      case "FINALISTE":
        return /championnat/i.test(l.competition) ? t("palmares.finaliste") : `${t("palmares.finalisteCoupe")} — ${l.competition}`;
      case "DEMI_FINALISTE":
        return `${t("palmares.demiFinaliste")} — ${l.competition}`;
      case "QUART_FINALISTE":
        return `${t("palmares.quartFinaliste")} — ${l.competition}`;
      case "VAINQUEUR_COUPE":
        return `${t("palmares.vainqueur")} du ${l.competition}`;
      default:
        return `${t("palmares.finalisteCoupe")} — ${l.competition}`;
    }
  };
  const complement = (l: Ligne) =>
    [l.opponent && t("palmares.contre", { adversaire: l.opponent }), l.score, l.venue && t("palmares.a", { lieu: l.venue })].filter(Boolean).join(", ");

  const compte = (f: (l: Ligne) => boolean) => lignes.filter(f).length;
  const resume = [
    t("palmares.titres", { n: compte((l) => l.achievement === "CHAMPION" && /championnat/i.test(l.competition)) }),
    t("palmares.finales", { n: compte((l) => l.achievement === "FINALISTE" && /championnat/i.test(l.competition)) }),
    t("palmares.manoir", { n: compte((l) => l.achievement === "VAINQUEUR_COUPE" && /manoir/i.test(l.competition)) }),
    t("palmares.proD2", { n: compte((l) => l.achievement === "CHAMPION" && /pro d2/i.test(l.competition)) }),
    t("palmares.europe", { n: compte((l) => /coupe d'europe/i.test(l.competition)) }),
  ];

  // La chronologie : les dates du club et les trophées, dans l'ordre.
  type Evenement = { year: number; texte: string; ton: "or" | "encre" | "gris"; ligne?: Ligne };
  const dates: Evenement[] = [
    { year: 1902, texte: t("palmares.fondation1902"), ton: "gris" },
    { year: 1912, texte: t("palmares.sop1912"), ton: "gris" },
    { year: 1919, texte: t("palmares.fusion1919"), ton: "gris" },
    { year: 1933, texte: t("palmares.fusion1933"), ton: "gris" },
  ];
  const chronologie: Evenement[] = [
    ...dates,
    ...lignes.map<Evenement>((l) => ({ year: l.year, texte: libelle(l), ton: estTitre(l) ? "or" : "encre", ligne: l })),
  ].sort((a, b) => a.year - b.year || (a.ton === "or" ? -1 : 1));
  const tons = { or: "text-usap-or", encre: "text-foreground", gris: "text-muted-foreground" };

  // Par compétition, dans l'ordre d'importance.
  const groupes = new Map<string, Ligne[]>();
  for (const l of lignes) {
    const c = competitionDe(l);
    groupes.set(c, [...(groupes.get(c) ?? []), l]);
  }
  const competitions = [...groupes.keys()].sort((a, b) => {
    const ia = ORDRE_COMPETITIONS.indexOf(a);
    const ib = ORDRE_COMPETITIONS.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, "fr");
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12">
        <h1 className="font-display text-7xl uppercase leading-none text-usap-sang sm:text-8xl">{t("palmares.titre")}</h1>
        <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">{majuscule(resume.join(", ").replace(/, ([^,]*)$/, " et $1"))}.</p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("palmares.reserve")}</p>
      </header>

      {/* La chronologie */}
      <section className="mb-12">
        <Titre>{t("palmares.chronologieTitre")}</Titre>
        <table className="w-full max-w-4xl border-collapse text-sm">
          <tbody>
            {chronologie.map((e, i) => {
              const rencontre = e.ligne ? rencontreDe(e.ligne) : null;
              return (
                <tr key={i} className="border-b border-border">
                  <td className={`w-24 py-1 pr-4 align-baseline font-display text-4xl leading-none tabular-nums sm:w-32 sm:text-5xl ${tons[e.ton]}`}>{e.year}</td>
                  <td className="py-2 align-baseline">
                    <span className={e.ton === "gris" ? "text-muted-foreground" : "font-semibold text-foreground"}>{e.texte}</span>
                    {e.ligne && complement(e.ligne) && <span className="text-muted-foreground">, {complement(e.ligne)}</span>}
                    {e.ligne?.details && <span className="block text-xs text-muted-foreground">{e.ligne.details}</span>}
                    {rencontre && (
                      <>
                        {" "}
                        <Link href={`/matchs/${rencontre.slug}`} className="text-sm text-muted-foreground underline hover:text-usap-sang">
                          {t("palmares.laRencontre")}
                        </Link>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Compétition par compétition */}
      {competitions.map((c) => (
        <section key={c} className="mb-10">
          <Titre encre>{c === "Championnat de France" ? t("palmares.championnat") : c}</Titre>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-4 font-medium">{t("palmares.colAnnee")}</th>
                  <th scope="col" className="py-2 pr-4 font-medium">{t("palmares.colResultat")}</th>
                  <th scope="col" className="py-2 pr-4 font-medium">{t("palmares.colAdversaire")}</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">{t("palmares.colScore")}</th>
                  <th scope="col" className="hidden py-2 pr-4 font-medium sm:table-cell">{t("palmares.colLieu")}</th>
                  <th scope="col" className="py-2 font-medium">
                    <span className="sr-only">{t("palmares.colRencontre")}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {[...groupes.get(c)!].reverse().map((l, i) => {
                  const rencontre = rencontreDe(l);
                  return (
                    <tr key={i} className="border-b border-border hover:bg-muted">
                      <td className={`py-1.5 pr-4 font-semibold ${estTitre(l) ? "text-usap-or" : "text-foreground"}`}>{l.year}</td>
                      <td className="py-1.5 pr-4 text-foreground">{libelle(l).replace(/ — .*$/, "")}</td>
                      <td className="py-1.5 pr-4 text-muted-foreground">{l.opponent ?? ""}</td>
                      <td className="py-1.5 pr-4 text-right whitespace-nowrap text-foreground">{l.score ?? ""}</td>
                      <td className="hidden py-1.5 pr-4 text-muted-foreground sm:table-cell">{l.venue ?? ""}</td>
                      <td className="py-1.5 text-sm">
                        {rencontre && (
                          <Link href={`/matchs/${rencontre.slug}`} className="text-muted-foreground underline hover:text-usap-sang">
                            {t("palmares.laRencontre")}
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

/** Le titre d'une section : la voix condensée de la liste, sous un filet. */
function Titre({ children, encre = false }: { children: React.ReactNode; encre?: boolean }) {
  return (
    <h2
      className={`mb-3 border-b-2 pb-1 font-display text-3xl uppercase leading-none ${
        encre ? "border-foreground text-foreground" : "border-usap-sang text-usap-sang"
      }`}
    >
      {children}
    </h2>
  );
}

import Link from "@/components/Lien";
import { prisma } from "@/lib/prisma";
import { MATCH_JOUE } from "@/lib/matchs";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";
import { liensAlternatifs } from "@/lib/seo";

/**
 * La liste des arbitres, refaite le 7 septembre 2026 sur le modèle exact
 * de `/joueurs` : **l'épine alphabétique**, grosses lettres condensées en
 * rouge avec un index en tête — c'est la structure réelle d'une liste
 * triée par nom. Une ligne par arbitre : le nom lié à sa fiche, la période
 * où il a sifflé l'USAP, et **le bilan catalan sous son arbitrage** —
 * matchs, victoires, nuls, défaites — puis **les cartons qu'il a
 * distribués**, jaunes et rouges, comptés sur les feuilles de ses
 * rencontres. C'est la seule donnée de la base qui soit propre à un
 * arbitre, et la grille de cartes ne la disait pas.
 *
 * Aucun des cent deux arbitres n'a de portrait : pas de colonne pour une
 * case vide à cent pour cent, qui se lirait comme une erreur.
 *
 * Ce que la page ne fait plus : une grille de cartes centrées, chacune
 * sous la même icône Lucide dans un rond gris.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Langue }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  return { title: t("arbitres.metaTitre"), description: t("arbitres.metaDescription"), alternates: liensAlternatifs(locale, "/arbitres") };
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** La lettre de classement d'un nom : sans accent, en capitale. */
function lettreDe(nom: string): string {
  const premiere = nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .charAt(0)
    .toUpperCase();
  return ALPHABET.includes(premiere) ? premiere : "#";
}

/** Le millésime d'une saison d'après une date : une saison commence en été. */
const saisonDe = (d: Date) => {
  const debut = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${debut}-${debut + 1}`;
};

export default async function ArbitresPage({ params }: Props) {
  const { locale } = await params;
  const t = await dictionnaire(locale);

  // Requêtes séquentielles : le pool de Supabase est étroit.
  const referees = await prisma.referee.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, slug: true, firstName: true, lastName: true },
  });
  // Le bilan de l'USAP sous chaque arbitre, sur les rencontres jouées.
  const bilans = await prisma.match.groupBy({
    by: ["refereeId"],
    where: { ...MATCH_JOUE, refereeId: { not: null } },
    _count: { id: true },
    _min: { date: true },
    _max: { date: true },
  });
  const parResultat = await prisma.match.groupBy({
    by: ["refereeId", "result"],
    where: { ...MATCH_JOUE, refereeId: { not: null } },
    _count: { id: true },
  });
  // Les cartons, lus sur les feuilles de ses rencontres — jaunes et rouges,
  // des deux camps.
  const cartons = await prisma.matchPlayer.findMany({
    where: { OR: [{ yellowCard: true }, { redCard: true }], match: { ...MATCH_JOUE, refereeId: { not: null } } },
    select: { yellowCard: true, redCard: true, match: { select: { refereeId: true } } },
  });
  const sansArbitre = await prisma.match.count({ where: { ...MATCH_JOUE, refereeId: null } });

  const cartonsDe = new Map<string, { jaunes: number; rouges: number }>();
  for (const c of cartons) {
    const id = c.match.refereeId!;
    const compte = cartonsDe.get(id) ?? { jaunes: 0, rouges: 0 };
    if (c.yellowCard) compte.jaunes++;
    if (c.redCard) compte.rouges++;
    cartonsDe.set(id, compte);
  }
  const bilanDe = (id: string) => {
    const b = bilans.find((x) => x.refereeId === id);
    if (!b) return null;
    const compte = (r: string) => parResultat.find((x) => x.refereeId === id && x.result === r)?._count.id ?? 0;
    return {
      matchs: b._count.id,
      victoires: compte("VICTOIRE"),
      nuls: compte("NUL"),
      defaites: compte("DEFAITE"),
      premiere: saisonDe(b._min.date!),
      derniere: saisonDe(b._max.date!),
      ...(cartonsDe.get(id) ?? { jaunes: 0, rouges: 0 }),
    };
  };
  const plusDesigne = [...bilans].sort((a, b) => b._count.id - a._count.id)[0];
  const nomDe = (id: string | null) => {
    const r = referees.find((x) => x.id === id);
    return r ? `${r.firstName} ${r.lastName}` : "";
  };

  // Les groupes, dans l'ordre des noms — une lettre absente n'a pas d'ancre.
  const groupes = new Map<string, typeof referees>();
  for (const r of referees) {
    const lettre = lettreDe(r.lastName);
    groupes.set(lettre, [...(groupes.get(lettre) ?? []), r]);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12">
        <h1 className="font-display text-7xl uppercase leading-none text-usap-sang sm:text-8xl">{t("arbitres.titre")}</h1>
        <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">
          {t("arbitres.chapeau", { n: referees.length })}
          {plusDesigne && ` ${t("arbitres.plusDesigne", { nom: nomDe(plusDesigne.refereeId), n: plusDesigne._count.id })}`}
        </p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("arbitres.reserve", { n: sansArbitre })}</p>
      </header>

      <nav aria-label={t("arbitres.indexAria")} className="mb-6 flex flex-wrap gap-x-1 font-display text-xl">
        {ALPHABET.map((lettre) =>
          groupes.has(lettre) ? (
            <a key={lettre} href={`#lettre-${lettre}`} className="px-1 text-foreground hover:text-usap-sang">
              {lettre}
            </a>
          ) : (
            <span key={lettre} aria-label={t("arbitres.lettreVide", { lettre })} className="px-1 text-border">
              {lettre}
            </span>
          ),
        )}
      </nav>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">{t("arbitres.colArbitre")}</th>
              <th scope="col" className="hidden py-2 pr-4 font-medium sm:table-cell">{t("arbitres.colPeriode")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("arbitres.colMatchs")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("arbitres.colVictoires")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("arbitres.colNuls")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("arbitres.colDefaites")}</th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("arbitres.colJaunes")}</th>
              <th scope="col" className="hidden py-2 text-right font-medium sm:table-cell">{t("arbitres.colRouges")}</th>
            </tr>
          </thead>
          {[...groupes.entries()].map(([lettre, liste]) => (
            <tbody key={lettre} id={`lettre-${lettre}`} className="scroll-mt-20 tabular-nums">
              <tr>
                <th scope="rowgroup" colSpan={8} className="border-b-2 border-usap-sang pt-8 pb-1 text-left font-display text-5xl leading-none text-usap-sang">
                  {lettre}
                </th>
              </tr>
              {liste.map((r) => {
                const b = bilanDe(r.id);
                return (
                  <tr key={r.id} className="border-b border-border hover:bg-muted">
                    <td className="py-1.5 pr-4">
                      <Link href={`/arbitres/${r.slug}`} className="text-foreground hover:text-usap-sang">
                        {r.firstName} <span className="font-semibold">{r.lastName}</span>
                      </Link>
                    </td>
                    <td className="hidden py-1.5 pr-4 whitespace-nowrap text-muted-foreground sm:table-cell">
                      {b ? (b.premiere === b.derniere ? b.premiere : `${b.premiere.slice(0, 4)}-${b.derniere.slice(5)}`) : ""}
                    </td>
                    <td className="py-1.5 pr-3 text-right font-semibold text-foreground">{b?.matchs ?? ""}</td>
                    <td className="py-1.5 pr-3 text-right text-usap-sang">{b?.victoires || ""}</td>
                    <td className="py-1.5 pr-3 text-right text-foreground">{b?.nuls || ""}</td>
                    <td className="py-1.5 pr-3 text-right text-muted-foreground">{b?.defaites || ""}</td>
                    <td className="hidden py-1.5 pr-3 text-right text-foreground sm:table-cell">{b?.jaunes || ""}</td>
                    <td className="hidden py-1.5 text-right text-foreground sm:table-cell">{b?.rouges || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

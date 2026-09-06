import Link from "@/components/Lien";
import { prisma } from "@/lib/prisma";
import { MATCH_JOUE } from "@/lib/matchs";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";

/**
 * La liste des stades, refaite le 6 septembre 2026 sur le modèle de la
 * liste des adversaires : **l'épine des pays**, la France en tête, chaque
 * pays en rouge condensé au-dessus de ses stades. Une ligne par stade : le
 * nom lié à sa fiche, la ville, la capacité, qui y reçoit — l'USAP en
 * rouge, le club adverse lié à sa fiche —, la période où l'USAP y a joué,
 * et **le bilan du terrain** — matchs, victoires, nuls, défaites, points
 * pour et contre —, que la grille de cartes ne disait pas. Aimé-Giral vient
 * en tête de la France, puis les autres par leur nom.
 *
 * Ce que la page ne fait plus : une grille de cartes centrées à épingle
 * grise, une pastille « Domicile USAP », un compte de matchs en pied de
 * carte.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Langue }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  return { title: t("stades.metaTitre"), description: t("stades.metaDescription") };
}

const nombre = (n: number) => n.toLocaleString("fr-FR");
/** Le millésime d'une saison d'après une date : une saison commence en été. */
const saisonDe = (d: Date) => {
  const debut = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${debut}-${debut + 1}`;
};

export default async function StadesPage({ params }: Props) {
  const { locale } = await params;
  const t = await dictionnaire(locale);

  // Requêtes séquentielles : le pool de Supabase est étroit.
  const venues = await prisma.venue.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      capacity: true,
      isHomeGround: true,
      country: { select: { name: true } },
      opponents: { select: { name: true, shortName: true, slug: true } },
    },
  });
  const bilans = await prisma.match.groupBy({
    by: ["venueId"],
    where: MATCH_JOUE,
    _count: { id: true },
    _sum: { scoreUsap: true, scoreOpponent: true },
    _min: { date: true },
    _max: { date: true },
  });
  const parResultat = await prisma.match.groupBy({ by: ["venueId", "result"], where: MATCH_JOUE, _count: { id: true } });
  const bilanDe = (id: string) => {
    const b = bilans.find((x) => x.venueId === id);
    if (!b) return null;
    const compte = (r: string) => parResultat.find((x) => x.venueId === id && x.result === r)?._count.id ?? 0;
    return {
      matchs: b._count.id,
      victoires: compte("VICTOIRE"),
      nuls: compte("NUL"),
      defaites: compte("DEFAITE"),
      pour: b._sum.scoreUsap ?? 0,
      contre: b._sum.scoreOpponent ?? 0,
      premiere: saisonDe(b._min.date!),
      derniere: saisonDe(b._max.date!),
    };
  };
  const joues = venues.filter((v) => bilanDe(v.id)).length;

  // Par pays, la France en tête ; Aimé-Giral en tête de la France, puis le nom.
  const groupes = new Map<string, typeof venues>();
  for (const v of venues) {
    const pays = v.country?.name ?? t("stades.sansPays");
    groupes.set(pays, [...(groupes.get(pays) ?? []), v]);
  }
  const pays = [...groupes.keys()].sort((a, b) => (a === "France" ? -1 : b === "France" ? 1 : a.localeCompare(b, "fr")));
  for (const liste of groupes.values()) {
    liste.sort((a, b) => Number(b.isHomeGround) - Number(a.isHomeGround) || a.name.localeCompare(b.name, "fr"));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12">
        <h1 className="font-display text-7xl uppercase leading-none text-usap-sang sm:text-8xl">{t("stades.titre")}</h1>
        <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">{t("stades.chapeau", { n: venues.length, joues })}</p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("stades.reserve")}</p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">{t("stades.colStade")}</th>
              <th scope="col" className="hidden py-2 pr-4 font-medium sm:table-cell">{t("stades.colVille")}</th>
              <th scope="col" className="hidden py-2 pr-4 text-right font-medium lg:table-cell">{t("stades.colPlaces")}</th>
              <th scope="col" className="hidden py-2 pr-4 font-medium md:table-cell">{t("stades.colOccupant")}</th>
              <th scope="col" className="hidden py-2 pr-4 font-medium md:table-cell">{t("stades.colPeriode")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("stades.colMatchs")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("stades.colVictoires")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("stades.colNuls")}</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">{t("stades.colDefaites")}</th>
              <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("stades.colPour")}</th>
              <th scope="col" className="hidden py-2 text-right font-medium sm:table-cell">{t("stades.colContre")}</th>
            </tr>
          </thead>
          {pays.map((p) => (
            <tbody key={p} className="tabular-nums">
              <tr>
                <th scope="rowgroup" colSpan={11} className="border-b-2 border-usap-sang pt-8 pb-1 text-left font-display text-5xl leading-none text-usap-sang">
                  {p}
                </th>
              </tr>
              {groupes.get(p)!.map((v) => {
                const b = bilanDe(v.id);
                const occupants = [
                  v.isHomeGround && <span key="usap" className="font-semibold text-usap-sang">{t("stades.domicile")}</span>,
                  ...v.opponents.map((o) => (
                    <Link key={o.slug} href={`/adversaires/${o.slug}`} className="hover:text-usap-sang">
                      {o.shortName || o.name}
                    </Link>
                  )),
                ].filter(Boolean) as React.ReactElement[];
                return (
                  <tr key={v.id} className="border-b border-border hover:bg-muted">
                    <td className="py-1.5 pr-4">
                      <Link href={`/stades/${v.slug}`} className="font-semibold text-foreground hover:text-usap-sang">
                        {v.name}
                      </Link>
                    </td>
                    <td className="hidden py-1.5 pr-4 text-muted-foreground sm:table-cell">{v.city}</td>
                    <td className="hidden py-1.5 pr-4 text-right text-muted-foreground lg:table-cell">{v.capacity ? nombre(v.capacity) : ""}</td>
                    <td className="hidden py-1.5 pr-4 text-muted-foreground md:table-cell">
                      {occupants.map((o, i) => (
                        <span key={i}>
                          {o}
                          {i < occupants.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </td>
                    <td className="hidden py-1.5 pr-4 whitespace-nowrap text-muted-foreground md:table-cell">
                      {b ? (b.premiere === b.derniere ? b.premiere : `${b.premiere.slice(0, 4)}-${b.derniere.slice(5)}`) : ""}
                    </td>
                    <td className="py-1.5 pr-3 text-right font-semibold text-foreground">{b?.matchs ?? ""}</td>
                    <td className="py-1.5 pr-3 text-right text-usap-sang">{b?.victoires || ""}</td>
                    <td className="py-1.5 pr-3 text-right text-foreground">{b?.nuls || ""}</td>
                    <td className="py-1.5 pr-3 text-right text-muted-foreground">{b?.defaites || ""}</td>
                    <td className="hidden py-1.5 pr-3 text-right text-foreground sm:table-cell">{b?.pour ?? ""}</td>
                    <td className="hidden py-1.5 text-right text-muted-foreground sm:table-cell">{b?.contre ?? ""}</td>
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

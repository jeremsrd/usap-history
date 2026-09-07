import Link from "@/components/Lien";
import { prisma } from "@/lib/prisma";
import { DIVISIONS } from "@/lib/constants";
import { formatDateFR } from "@/lib/utils";
import { dictionnaire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";

/**
 * Les records, refaits le 7 septembre 2026 — la dernière page de l'ancien
 * rendu. Sa seule audace est **la valeur du record en grand caractère
 * condensé en tête de chaque ligne**, en rouge, comme le nombre de matchs
 * des centurions et les années des présidents : un record est un nombre,
 * et c'est lui qu'on grossit. Le reste est en lignes — ce que le record
 * mesure, qui le porte, lié à la rencontre, à la saison ou au joueur, et
 * où et quand —, trois tableaux sous un titre rouge et son filet : sur un
 * match, sur une saison, les séries. Les réserves sont des paragraphes
 * sous le chapeau ; le compte des affluences connues et la division d'une
 * saison sont lus dans la base, plus écrits en dur.
 *
 * Ce que la page ne fait plus : une flamme, un calendrier et un trophée
 * devant les titres, un encadré gris, vingt-trois cartes bordées à
 * libellé en capitales espacées.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Langue }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await dictionnaire((await params).locale);
  return { title: t("records.metaTitre"), description: t("records.metaDescription") };
}

/** Une ligne de record : la valeur, ce qu'elle mesure, qui la porte, où et quand. */
interface Ligne {
  cle: string;
  valeur: number | string;
  record: string;
  detenteur: string;
  href?: string;
  contexte?: string;
}

export default async function RecordsPage({ params }: Props) {
  const t = await dictionnaire((await params).locale);
  const nombre = (n: number) => n.toLocaleString("fr-FR");

  const matchs = await prisma.match.findMany({
    where: { result: { not: null }, scoreUsap: { not: null } },
    select: {
      slug: true,
      date: true,
      isHome: true,
      scoreUsap: true,
      scoreOpponent: true,
      result: true,
      triesUsap: true,
      attendance: true,
      opponent: { select: { shortName: true, name: true } },
      season: { select: { label: true } },
    },
    orderBy: { date: "asc" },
  });
  // `scoreUsap` est nullable en base — un calendrier à venir n'en porte pas —,
  // mais le filtre l'exclut : on resserre le type pour la suite.
  type Rencontre = (typeof matchs)[number] & { scoreUsap: number; scoreOpponent: number };
  const joues = matchs as Rencontre[];

  const lignes = await prisma.matchPlayer.findMany({
    where: { isOpponent: false, playerId: { not: null }, match: { result: { not: null } } },
    select: {
      totalPoints: true,
      tries: true,
      penalties: true,
      player: { select: { firstName: true, lastName: true, slug: true } },
      match: {
        select: { slug: true, date: true, isHome: true, scoreUsap: true, scoreOpponent: true, opponent: { select: { shortName: true, name: true } }, season: { select: { label: true } } },
      },
    },
  });
  const saisons = await prisma.season.findMany({ where: { matchesPlayed: { not: null } }, orderBy: { startYear: "asc" } });

  // ── Fabrique de records ────────────────────────────────────────────
  const meilleur = <T,>(liste: T[], valeur: (x: T) => number): T | null =>
    liste.reduce<T | null>((a, b) => (a === null || valeur(b) > valeur(a) ? b : a), null);
  const nomClub = (o: { name: string; shortName: string | null } | null) => o?.shortName || o?.name || "?";
  const affiche = (m: { isHome: boolean; scoreUsap: number | null; scoreOpponent: number | null; opponent: { name: string; shortName: string | null } | null }) =>
    m.isHome ? `USAP – ${nomClub(m.opponent)}, ${m.scoreUsap}-${m.scoreOpponent}` : `${nomClub(m.opponent)} – USAP, ${m.scoreOpponent}-${m.scoreUsap}`;
  const quand = (m: { date: Date; season: { label: string } }) => `${formatDateFR(m.date)}, ${m.season.label}`;
  const nom = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`;

  const victoires = joues.filter((m) => m.result === "VICTOIRE");
  const defaites = joues.filter((m) => m.result === "DEFAITE");
  const avecEssais = joues.filter((m) => m.triesUsap != null);
  const avecAffluence = joues.filter((m) => m.attendance != null && m.attendance > 0);

  const deMatch = (cle: string, m: Rencontre | null, valeur: (m: Rencontre) => number | string): Ligne | null =>
    m && { cle, valeur: valeur(m), record: t(`records.${cle}`), detenteur: affiche(m), href: `/matchs/${m.slug}`, contexte: quand(m) };
  const deJoueur = (cle: string, l: (typeof lignes)[number] | null, valeur: (l: (typeof lignes)[number]) => number): Ligne | null =>
    l?.player
      ? { cle, valeur: valeur(l), record: t(`records.${cle}`), detenteur: nom(l.player), href: `/joueurs/${l.player.slug}`, contexte: `${affiche(l.match)}, ${quand(l.match)}` }
      : null;

  const surUnMatch = [
    deMatch("plusLargeVictoire", meilleur(victoires, (m) => m.scoreUsap - m.scoreOpponent), (m) => `+${m.scoreUsap - m.scoreOpponent}`),
    deMatch("plusLourdeDefaite", meilleur(defaites, (m) => m.scoreOpponent - m.scoreUsap), (m) => `−${m.scoreOpponent - m.scoreUsap}`),
    deMatch("plusDePointsMarques", meilleur(joues, (m) => m.scoreUsap), (m) => m.scoreUsap),
    deMatch("plusDePointsEncaisses", meilleur(joues, (m) => m.scoreOpponent), (m) => m.scoreOpponent),
    deMatch("plusDEssais", meilleur(avecEssais, (m) => m.triesUsap!), (m) => m.triesUsap!),
    deMatch("matchProlifique", meilleur(joues, (m) => m.scoreUsap + m.scoreOpponent), (m) => m.scoreUsap + m.scoreOpponent),
    deJoueur("pointsJoueur", meilleur(lignes, (l) => l.totalPoints), (l) => l.totalPoints),
    deJoueur("essaisJoueur", meilleur(lignes, (l) => l.tries), (l) => l.tries),
    deJoueur("penalitesJoueur", meilleur(lignes, (l) => l.penalties), (l) => l.penalties),
    deMatch("affluence", meilleur(avecAffluence, (m) => m.attendance!), (m) => nombre(m.attendance!)),
  ].filter(Boolean) as Ligne[];

  // ── Records de saison ──────────────────────────────────────────────
  type Saison = (typeof saisons)[number];
  const diff = (s: Saison) => (s.pointsFor ?? 0) - (s.pointsAgainst ?? 0);
  const deSaison = (cle: string, valeur: (s: Saison) => number, affichee: (s: Saison) => number | string = valeur): Ligne | null => {
    const s = meilleur(saisons, valeur);
    return (
      s && {
        cle,
        valeur: affichee(s),
        record: t(`records.${cle}`),
        detenteur: s.label,
        href: `/saisons/${s.label}`,
        contexte: t("records.matchsDeSaison", { division: DIVISIONS[s.division] ?? s.division, n: s.matchesPlayed ?? 0 }),
      }
    );
  };

  // Meilleur total individuel d'une saison, essais et points.
  const parJoueurEtSaison = new Map<string, { nom: string; slug: string; saison: string; essais: number; points: number }>();
  for (const l of lignes) {
    if (!l.player) continue;
    const saison = l.match.season.label;
    const cle = `${l.player.slug}|${saison}`;
    const b = parJoueurEtSaison.get(cle) ?? { nom: nom(l.player), slug: l.player.slug, saison, essais: 0, points: 0 };
    b.essais += l.tries;
    b.points += l.totalPoints;
    parJoueurEtSaison.set(cle, b);
  }
  const totaux = [...parJoueurEtSaison.values()];
  const deTotal = (cle: string, valeur: (x: (typeof totaux)[number]) => number): Ligne | null => {
    const x = meilleur(totaux, valeur);
    return x && { cle, valeur: valeur(x), record: t(`records.${cle}`), detenteur: x.nom, href: `/joueurs/${x.slug}`, contexte: x.saison };
  };

  const surUneSaison = [
    deSaison("saisonPoints", (s) => s.totalPoints ?? 0),
    deSaison("saisonVictoires", (s) => s.wins ?? 0),
    deSaison("saisonDefaites", (s) => s.losses ?? 0),
    deSaison("saisonMarques", (s) => s.pointsFor ?? 0),
    deSaison("saisonEncaisses", (s) => s.pointsAgainst ?? 0),
    deSaison("saisonMeilleureDiff", diff, (s) => `+${diff(s)}`),
    deSaison("saisonPireDiff", (s) => -diff(s), (s) => `${diff(s)}`),
    deSaison("saisonBonus", (s) => s.bonusOffensif ?? 0),
    deTotal("essaisSurUneSaison", (x) => x.essais),
    deTotal("pointsSurUneSaison", (x) => x.points),
  ].filter(Boolean) as Ligne[];

  // ── Séries ─────────────────────────────────────────────────────────
  /** La plus longue suite de rencontres consécutives vérifiant `ok`. */
  function serie(cle: string, ok: (resultat: string) => boolean): Ligne {
    let courante = 0;
    let record = { longueur: 0, debut: joues[0]?.date, fin: joues[0]?.date };
    let debut = joues[0]?.date;
    for (const m of joues) {
      if (!ok(m.result!)) {
        courante = 0;
        continue;
      }
      if (courante === 0) debut = m.date;
      courante++;
      if (courante > record.longueur) record = { longueur: courante, debut, fin: m.date };
    }
    return {
      cle,
      valeur: record.longueur,
      record: t(`records.${cle}`),
      detenteur: record.debut && record.fin ? t("records.serieDuAu", { debut: formatDateFR(record.debut), fin: formatDateFR(record.fin) }) : "",
    };
  }
  const series = [
    serie("serieVictoires", (r) => r === "VICTOIRE"),
    serie("serieSansDefaite", (r) => r !== "DEFAITE"),
    serie("serieDefaites", (r) => r === "DEFAITE"),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <header className="mb-8 sm:mb-12">
        <h1 className="font-display text-7xl uppercase leading-none text-usap-sang sm:text-8xl">{t("records.titre")}</h1>
        <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">{t("records.chapeau")}</p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {t("records.reserveTitre")} {t("records.reserveTexte")}
        </p>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("records.reserveSaisons")}</p>
      </header>

      <Tableau titre={t("records.surUnMatch")} lignes={surUnMatch} t={t} note={t("records.affluenceNote", { n: avecAffluence.length })} />
      <Tableau titre={t("records.surUneSaison")} lignes={surUneSaison} t={t} />
      <Tableau titre={t("records.series")} chapeau={t("records.seriesChapeau")} lignes={series} t={t} />
    </div>
  );
}

/** Un tableau de records : la valeur en grand en tête de ligne, le reste en mots. */
function Tableau({
  titre,
  chapeau,
  lignes,
  note,
  t,
}: {
  titre: string;
  chapeau?: string;
  lignes: Ligne[];
  note?: string;
  t: (cle: string) => string;
}) {
  return (
    <section className="mb-12">
      <h2 className="mb-1 border-b-2 border-usap-sang pb-1 font-display text-3xl uppercase leading-none text-usap-sang">{titre}</h2>
      {chapeau && <p className="mb-3 max-w-prose text-sm text-muted-foreground">{chapeau}</p>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sr-only">
            <tr>
              <th scope="col">{t("records.colValeur")}</th>
              <th scope="col">{t("records.colRecord")}</th>
              <th scope="col">{t("records.colDetenteur")}</th>
              <th scope="col">{t("records.colContexte")}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {lignes.map((l) => (
              <tr key={l.cle} className="border-b border-border hover:bg-muted">
                <td className="py-2 pr-4 text-right whitespace-nowrap font-display text-3xl leading-none text-usap-sang sm:text-4xl">{l.valeur}</td>
                <td className="py-2 pr-4 text-muted-foreground">{l.record}</td>
                <td className="py-2 pr-4 text-foreground">
                  {l.href ? (
                    <Link href={l.href} className="font-semibold hover:text-usap-sang">
                      {l.detenteur}
                    </Link>
                  ) : (
                    l.detenteur
                  )}
                </td>
                <td className="hidden py-2 text-muted-foreground sm:table-cell">{l.contexte}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-2 max-w-prose text-xs text-muted-foreground">{note}</p>}
    </section>
  );
}

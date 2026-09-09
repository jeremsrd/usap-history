import Link from "@/components/Lien";
import { prisma } from "@/lib/prisma";
import { formatDateFR } from "@/lib/utils";
import { slugify } from "@/lib/slugs";
import { dictionnaire, type Traduire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";

/**
 * Les records, refaits le 7 septembre 2026 — la dernière page de l'ancien
 * rendu. Sa seule audace est **la valeur du record en grand caractère
 * condensé en tête de chaque ligne**, en rouge, comme le nombre de matchs
 * des centurions et les années des présidents : un record est un nombre,
 * et c'est lui qu'on grossit. Le reste est en lignes — ce que le record
 * mesure, qui le porte, lié à la rencontre, à la saison ou au joueur, et
 * où et quand —, sous un titre rouge et son filet. Les réserves sont des
 * paragraphes sous le chapeau ; le compte des affluences connues et la
 * division d'une saison sont lus dans la base, plus écrits en dur.
 *
 * **LE DÉCOUPAGE PAR COMPÉTITION EST DU 9 SEPTEMBRE 2026, DEMANDÉ PAR
 * JÉRÉMY.** Le global reste en tête, inchangé — c'est lui qu'on vient
 * chercher —, et l'épine des compétitions suit, chacune sous son nom en
 * rouge condensé avec son compte de rencontres et sa période, sur le modèle
 * des ancres de `/realisateurs`. Trois choses à savoir avant d'y toucher :
 *
 * 1. **Les bilans de saison ne s'y découpent pas.** Ils sont stockés sur
 *    `Season` et portent le **championnat seul**, phases finales exclues,
 *    pour coller au classement officiel — il n'existe pas d'agrégat de
 *    saison par compétition, et en fabriquer un ici en inventerait un que
 *    la base ne tient pas. Le bloc reste donc global, et le chapeau le dit.
 * 2. **Une série de compétition ignore les autres, elle ne s'y coupe pas.**
 *    Cinq victoires de Top 14, une défaite européenne, trois victoires de
 *    Top 14 : la série de Top 14 vaut huit. C'est le sens utile — le
 *    contraire fabriquerait des séries plus courtes que la réalité, comme
 *    le rappelle déjà la réserve des séries globales sur les saisons.
 * 3. **Une compétition de moins de dix rencontres n'a pas de records**, et
 *    l'omission est dite plutôt que tue : sur deux rencontres, chacun des
 *    dix records est porté par l'une des deux, et le tableau ne mesure
 *    plus rien. Le seuil se dit, il ne se devine pas.
 *
 * Ce que la page ne fait plus : une flamme, un calendrier et un trophée
 * devant les titres, un encadré gris, vingt-trois cartes bordées à
 * libellé en capitales espacées.
 */

export const dynamic = "force-dynamic";

/** En deçà, un « record » n'est plus qu'une rencontre prise au hasard. */
const SEUIL_COMPETITION = 10;

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
      competition: { select: { id: true, name: true, shortName: true } },
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
        select: { slug: true, date: true, isHome: true, scoreUsap: true, scoreOpponent: true, opponent: { select: { shortName: true, name: true } }, season: { select: { label: true } }, competition: { select: { id: true } } },
      },
    },
  });
  type LigneJoueur = (typeof lignes)[number];
  const saisons = await prisma.season.findMany({ where: { matchesPlayed: { not: null } }, orderBy: { startYear: "asc" } });

  // ── Fabrique de records ────────────────────────────────────────────
  const meilleur = <T,>(liste: T[], valeur: (x: T) => number): T | null =>
    liste.reduce<T | null>((a, b) => (a === null || valeur(b) > valeur(a) ? b : a), null);
  const nomClub = (o: { name: string; shortName: string | null } | null) => o?.shortName || o?.name || "?";
  const affiche = (m: { isHome: boolean; scoreUsap: number | null; scoreOpponent: number | null; opponent: { name: string; shortName: string | null } | null }) =>
    m.isHome ? `USAP – ${nomClub(m.opponent)}, ${m.scoreUsap}-${m.scoreOpponent}` : `${nomClub(m.opponent)} – USAP, ${m.scoreOpponent}-${m.scoreUsap}`;
  const quand = (m: { date: Date; season: { label: string } }) => `${formatDateFR(m.date)}, ${m.season.label}`;
  const nom = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`;

  /**
   * **UN RECORD À ZÉRO N'EST PAS UN RECORD, C'EST UNE ABSENCE.**
   *
   * Le Top 16 l'a montré le 9 septembre 2026 : la LNR ne publie aucun fait de
   * match sur 2004-2005, toutes les lignes de composition y valent zéro point
   * et zéro essai, et le maximum tombait sur la première venue — « 0 points
   * d'un joueur, Ludovic Loustau ». Un homme se voyait attribuer un record
   * qu'il ne détient pas, faute de source. Les aides ci-dessous rendent donc
   * `null` sur une mesure nulle, et la ligne disparaît du tableau.
   */
  const deMatch = (
    cle: string,
    liste: Rencontre[],
    mesure: (m: Rencontre) => number,
    affichee: (m: Rencontre) => number | string = mesure,
  ): Ligne | null => {
    const m = meilleur(liste, mesure);
    return m && mesure(m) !== 0
      ? { cle, valeur: affichee(m), record: t(`records.${cle}`), detenteur: affiche(m), href: `/matchs/${m.slug}`, contexte: quand(m) }
      : null;
  };
  const deJoueur = (cle: string, liste: LigneJoueur[], mesure: (l: LigneJoueur) => number): Ligne | null => {
    const l = meilleur(liste, mesure);
    return l?.player && mesure(l) !== 0
      ? { cle, valeur: mesure(l), record: t(`records.${cle}`), detenteur: nom(l.player), href: `/joueurs/${l.player.slug}`, contexte: `${affiche(l.match)}, ${quand(l.match)}` }
      : null;
  };

  /**
   * Les dix records d'une rencontre, sur l'ensemble donné.
   *
   * Le même calcul sert au global et à chaque compétition : c'est la seule
   * façon d'être sûr qu'un record de Top 14 se mesure exactement comme un
   * record toutes compétitions confondues.
   */
  const recordsDeMatch = (rencontres: Rencontre[], parJoueur: LigneJoueur[]): Ligne[] => {
    const victoires = rencontres.filter((m) => m.result === "VICTOIRE");
    const defaites = rencontres.filter((m) => m.result === "DEFAITE");
    const avecEssais = rencontres.filter((m) => m.triesUsap != null);
    const avecAffluence = rencontres.filter((m) => m.attendance != null && m.attendance > 0);
    return [
      deMatch("plusLargeVictoire", victoires, (m) => m.scoreUsap - m.scoreOpponent, (m) => `+${m.scoreUsap - m.scoreOpponent}`),
      deMatch("plusLourdeDefaite", defaites, (m) => m.scoreOpponent - m.scoreUsap, (m) => `−${m.scoreOpponent - m.scoreUsap}`),
      deMatch("plusDePointsMarques", rencontres, (m) => m.scoreUsap),
      deMatch("plusDePointsEncaisses", rencontres, (m) => m.scoreOpponent),
      deMatch("plusDEssais", avecEssais, (m) => m.triesUsap!),
      deMatch("matchProlifique", rencontres, (m) => m.scoreUsap + m.scoreOpponent),
      deJoueur("pointsJoueur", parJoueur, (l) => l.totalPoints),
      deJoueur("essaisJoueur", parJoueur, (l) => l.tries),
      deJoueur("penalitesJoueur", parJoueur, (l) => l.penalties),
      deMatch("affluence", avecAffluence, (m) => m.attendance!, (m) => nombre(m.attendance!)),
    ].filter(Boolean) as Ligne[];
  };

  /** Le nombre de rencontres dont l'affluence est connue, pour la note du tableau. */
  const affluencesConnues = (rencontres: Rencontre[]) =>
    rencontres.filter((m) => m.attendance != null && m.attendance > 0).length;

  // ── Séries ─────────────────────────────────────────────────────────
  /**
   * La plus longue suite de rencontres consécutives vérifiant `ok`.
   *
   * Restreinte à une compétition, elle ignore les rencontres des autres au
   * lieu de s'y couper : la série de Top 14 d'un club qui perd entre-temps
   * un match européen ne s'arrête pas là.
   */
  function serie(cle: string, ok: (resultat: string) => boolean, rencontres: Rencontre[]): Ligne | null {
    let courante = 0;
    let record = { longueur: 0, debut: rencontres[0]?.date, fin: rencontres[0]?.date };
    let debut = rencontres[0]?.date;
    for (const m of rencontres) {
      if (!ok(m.result!)) {
        courante = 0;
        continue;
      }
      if (courante === 0) debut = m.date;
      courante++;
      if (courante > record.longueur) record = { longueur: courante, debut, fin: m.date };
    }
    if (record.longueur === 0 || !record.debut || !record.fin) return null;
    return {
      cle,
      valeur: record.longueur,
      record: t(`records.${cle}`),
      detenteur: t("records.serieDuAu", { debut: formatDateFR(record.debut), fin: formatDateFR(record.fin) }),
    };
  }
  const lesSeries = (rencontres: Rencontre[]): Ligne[] =>
    [
      serie("serieVictoires", (r) => r === "VICTOIRE", rencontres),
      serie("serieSansDefaite", (r) => r !== "DEFAITE", rencontres),
      serie("serieDefaites", (r) => r === "DEFAITE", rencontres),
    ].filter(Boolean) as Ligne[];

  const surUnMatch = recordsDeMatch(joues, lignes);
  const series = lesSeries(joues);

  // ── Records de saison ──────────────────────────────────────────────
  // Ils ne se découpent pas par compétition : `Season` ne porte qu'un bilan,
  // celui du championnat seul, phases finales exclues (cf. l'en-tête).
  type Saison = (typeof saisons)[number];
  const diff = (s: Saison) => (s.pointsFor ?? 0) - (s.pointsAgainst ?? 0);
  const deSaison = (cle: string, valeur: (s: Saison) => number, affichee: (s: Saison) => number | string = valeur): Ligne | null => {
    const s = meilleur(saisons, valeur);
    if (!s || valeur(s) === 0) return null;
    return {
      cle,
      valeur: affichee(s),
      record: t(`records.${cle}`),
      detenteur: s.label,
      href: `/saisons/${s.label}`,
      contexte: t("records.matchsDeSaison", { division: t(`divisions.${s.division}`), n: s.matchesPlayed ?? 0 }),
    };
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
    if (!x || valeur(x) === 0) return null;
    return { cle, valeur: valeur(x), record: t(`records.${cle}`), detenteur: x.nom, href: `/joueurs/${x.slug}`, contexte: x.saison };
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

  // ── Compétition par compétition ────────────────────────────────────
  // Les rencontres sont déjà triées par date : le premier et le dernier de
  // chaque groupe donnent la période sans qu'on ait à retrier.
  const groupes = new Map<string, { nom: string; rencontres: Rencontre[] }>();
  for (const m of joues) {
    const c = m.competition;
    const g = groupes.get(c.id) ?? { nom: c.shortName || c.name, rencontres: [] };
    g.rencontres.push(m);
    groupes.set(c.id, g);
  }
  const lignesParCompetition = new Map<string, LigneJoueur[]>();
  for (const l of lignes) {
    const id = l.match.competition.id;
    const liste = lignesParCompetition.get(id) ?? [];
    liste.push(l);
    lignesParCompetition.set(id, liste);
  }

  const parOrdre = [...groupes.entries()].sort((a, b) => b[1].rencontres.length - a[1].rencontres.length);
  const blocs = parOrdre
    .filter(([, g]) => g.rencontres.length >= SEUIL_COMPETITION)
    .map(([id, g]) => {
      const debut = g.rencontres[0].season.label;
      const fin = g.rencontres[g.rencontres.length - 1].season.label;
      const n = g.rencontres.length;
      return {
        id: slugify(g.nom),
        nom: g.nom,
        n,
        contexte:
          debut === fin
            ? t("records.competitionContexteUneSaison", { n, saison: debut })
            : t("records.competitionContexte", { n, debut, fin }),
        lignes: [...recordsDeMatch(g.rencontres, lignesParCompetition.get(id) ?? []), ...lesSeries(g.rencontres)],
        affluences: affluencesConnues(g.rencontres),
      };
    });
  // Les compétitions sous le seuil sont nommées, non tues : leur absence est
  // un choix, et un choix se dit.
  const ecartees = parOrdre.filter(([, g]) => g.rencontres.length < SEUIL_COMPETITION);

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

      <nav className="mb-8 flex flex-wrap gap-x-6 gap-y-2 font-display text-xl uppercase">
        <a href="#toutes" className="text-foreground hover:text-usap-sang">
          {t("records.toutesCompetitions")} <span className="text-muted-foreground">{joues.length}</span>
        </a>
        {blocs.map((b) => (
          <a key={b.id} href={`#${b.id}`} className="text-foreground hover:text-usap-sang">
            {b.nom} <span className="text-muted-foreground">{b.n}</span>
          </a>
        ))}
      </nav>

      <Tableau id="toutes" titre={t("records.surUnMatch")} lignes={surUnMatch} t={t} note={t("records.affluenceNote", { n: affluencesConnues(joues) })} />
      <Tableau titre={t("records.surUneSaison")} lignes={surUneSaison} t={t} />
      <Tableau titre={t("records.series")} chapeau={t("records.seriesChapeau")} lignes={series} t={t} />

      <section className="mb-8 mt-16">
        <h2 className="mb-1 border-b-2 border-usap-sang pb-1 font-display text-3xl uppercase leading-none text-usap-sang">
          {t("records.parCompetition")}
        </h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("records.parCompetitionChapeau")}</p>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{t("records.parCompetitionSeries")}</p>
        {ecartees.length > 0 && (
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {t("records.competitionsEcartees", {
              n: ecartees.length,
              seuil: SEUIL_COMPETITION,
              liste: ecartees.map(([, g]) => `${g.nom} (${g.rencontres.length})`).join(", "),
            })}
          </p>
        )}
      </section>

      {blocs.map((b) => (
        <Tableau key={b.id} id={b.id} niveau={3} titre={b.nom} chapeau={b.contexte} lignes={b.lignes} t={t} note={b.affluences > 0 ? t("records.affluenceNote", { n: b.affluences }) : undefined} />
      ))}
    </div>
  );
}

/** Un tableau de records : la valeur en grand en tête de ligne, le reste en mots. */
function Tableau({
  id,
  niveau = 2,
  titre,
  chapeau,
  lignes,
  note,
  t,
}: {
  id?: string;
  niveau?: 2 | 3;
  titre: string;
  chapeau?: string;
  lignes: Ligne[];
  note?: string;
  t: Traduire;
}) {
  const Titre = niveau === 2 ? "h2" : "h3";
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <Titre
        className={`mb-1 border-b-2 border-usap-sang pb-1 font-display uppercase leading-none text-usap-sang ${niveau === 2 ? "text-3xl" : "text-2xl"}`}
      >
        {titre}
      </Titre>
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

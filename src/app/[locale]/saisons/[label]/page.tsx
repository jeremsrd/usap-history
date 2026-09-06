import Link from "@/components/Lien";
import Provenance from "@/components/Provenance";
import { JoueurCellule } from "@/components/JoueurCellule";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { estCouperet, estJoue } from "@/lib/matchs";
import { DIVISIONS, POSITIONS } from "@/lib/constants";
import { formatDateFR } from "@/lib/utils";
import { dictionnaire, type Traduire } from "@/i18n/dictionnaire";
import type { Langue } from "@/i18n/langues";
import type { Metadata } from "next";

/**
 * La page d'une saison, refaite le 6 septembre 2026 dans l'identité posée
 * sur `/joueurs`, la fiche joueur et la fiche de match. Sa seule audace est
 * la **frise des résultats** : sous le millésime, la saison entière en une
 * ligne de lettres — V en rouge, N en encre, D en gris —, chacune liée à sa
 * rencontre. C'est la structure réelle d'une saison, une suite de
 * rencontres, et elle se lit d'un coup d'œil : la série de quinze défaites
 * de 2018-2019 s'y voit sans qu'on la nomme.
 *
 * Tout le reste est dit en phrases puis en tableaux : le classement et le
 * bilan du championnat en une phrase, le titre décidé en or, le staff, le
 * bilan rédigé ; les rencontres par compétition, phase finale à part ; trois
 * classements courts — réalisateurs, essais, plus utilisés — ; et
 * **l'effectif en un seul tableau**, chaque homme avec ses matchs, ses
 * titularisations, ses minutes, ses réalisations et ses cartons, à la
 * façon d'une page d'effectif de lfchistory.net. Les onze listes de cartes
 * que la page portait — points, matchs, essais, pénalités,
 * transformations, drops, minutes, et une par couleur de carton — y tiennent
 * en douze colonnes.
 *
 * Ce que la page ne fait plus : des icônes devant les titres, des flèches
 * vertes et rouges pour la montée et la descente, neuf cases de chiffres
 * centrés, des pastilles de score, des logos dans les lignes de match, des
 * ronds gris pour les joueurs sans portrait.
 */

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: Langue; label: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, label } = await params;
  const t = await dictionnaire(locale);
  return {
    title: t("saison.metaTitre", { label }),
    description: t("saison.metaDescription", { label }),
  };
}

const nombre = (n: number) => n.toLocaleString("fr-FR");
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ORDRE_POSTES = Object.keys(POSITIONS);
const rangPoste = (poste: string | null) => (poste ? ORDRE_POSTES.indexOf(poste) : ORDRE_POSTES.length);

/** Ce qu'un joueur a fait sous le maillot sur les rencontres jouées de la saison. */
type Cumul = {
  matchs: number;
  titulaire: number;
  capitaine: number;
  points: number;
  essais: number;
  transformations: number;
  penalites: number;
  drops: number;
  minutes: number;
  jaunes: number;
  oranges: number;
  rouges: number;
  blancs: number;
};

const CUMUL_VIDE: Cumul = {
  matchs: 0, titulaire: 0, capitaine: 0, points: 0, essais: 0, transformations: 0,
  penalites: 0, drops: 0, minutes: 0, jaunes: 0, oranges: 0, rouges: 0, blancs: 0,
};

export default async function SaisonDetailPage({ params }: Props) {
  const { locale, label } = await params;
  const t = await dictionnaire(locale);

  const season = await prisma.season.findFirst({
    where: { label },
    include: {
      coach: { select: { firstName: true, lastName: true, slug: true } },
      president: { select: { firstName: true, lastName: true, slug: true } },
      seasonCoaches: {
        orderBy: { displayOrder: "asc" },
        include: { coach: { select: { firstName: true, lastName: true, slug: true } } },
      },
      matches: {
        orderBy: { date: "asc" },
        include: {
          competition: { select: { name: true, shortName: true } },
          opponent: { select: { name: true, shortName: true, slug: true } },
          venue: { select: { name: true, slug: true } },
        },
      },
      seasonPlayers: {
        include: {
          player: {
            select: { id: true, slug: true, firstName: true, lastName: true, position: true, photoUrl: true, isActive: true },
          },
        },
      },
    },
  });
  if (!season) notFound();

  // Les saisons voisines, pour aller de l'une à l'autre sans repasser par la
  // liste. Requêtes séquentielles : le pool de Supabase est étroit.
  const precedente = await prisma.season.findFirst({ where: { startYear: season.startYear - 1 }, select: { label: true } });
  const suivante = await prisma.season.findFirst({ where: { startYear: season.startYear + 1 }, select: { label: true } });

  // ---- Ce que chaque joueur a fait, sur les rencontres jouées seulement ----
  // Les compositions d'une rencontre à venir entrent la veille : elles ne
  // comptent pas encore. Une seule lecture des lignes, cumulées en mémoire,
  // là où la page faisait onze `groupBy`.
  const joues = season.matches.filter(estJoue);
  const lignes = await prisma.matchPlayer.findMany({
    where: { matchId: { in: joues.map((m) => m.id) }, isOpponent: false, playerId: { not: null } },
    select: {
      playerId: true, isStarter: true, isCaptain: true, totalPoints: true, tries: true, conversions: true,
      penalties: true, dropGoals: true, minutesPlayed: true, yellowCard: true, orangeCard: true, redCard: true, whiteCard: true,
    },
  });
  const cumuls = new Map<string, Cumul>();
  for (const l of lignes) {
    const c = cumuls.get(l.playerId!) ?? { ...CUMUL_VIDE };
    c.matchs += 1;
    if (l.isStarter) c.titulaire += 1;
    if (l.isCaptain) c.capitaine += 1;
    c.points += l.totalPoints;
    c.essais += l.tries;
    c.transformations += l.conversions;
    c.penalites += l.penalties;
    c.drops += l.dropGoals;
    c.minutes += l.minutesPlayed ?? 0;
    if (l.yellowCard) c.jaunes += 1;
    if (l.orangeCard) c.oranges += 1;
    if (l.redCard) c.rouges += 1;
    if (l.whiteCard) c.blancs += 1;
    cumuls.set(l.playerId!, c);
  }
  // Sur 2004-2005 et 2005-2006 la source ne publie aucun temps de jeu : la
  // colonne serait une colonne de zéros, et un zéro n'est pas un « on ne
  // sait pas ». Elle disparaît, et la note le dit.
  const sansMinutes = lignes.length > 0 && lignes.every((l) => l.minutesPlayed == null);

  // ---- L'effectif : les inscrits, et ceux qui ont joué sans être inscrits ----
  // Les lignes d'effectif n'existent que depuis 2021-2022 ; avant, ce sont
  // les feuilles qui disent qui était là.
  const inscrits = new Set(season.seasonPlayers.map((sp) => sp.playerId));
  const manquants = [...cumuls.keys()].filter((id) => !inscrits.has(id));
  const autres = manquants.length
    ? await prisma.player.findMany({
        where: { id: { in: manquants } },
        select: { id: true, slug: true, firstName: true, lastName: true, position: true, photoUrl: true, isActive: true },
      })
    : [];
  const effectif = [
    ...season.seasonPlayers.map((sp) => ({
      joueur: sp.player,
      poste: sp.position ?? sp.player.position,
      numero: sp.shirtNumber,
      cumul: cumuls.get(sp.playerId),
    })),
    ...autres.map((j) => ({ joueur: j, poste: j.position, numero: null as number | null, cumul: cumuls.get(j.id) })),
  ].sort(
    (a, b) =>
      rangPoste(a.poste) - rangPoste(b.poste) ||
      a.joueur.lastName.localeCompare(b.joueur.lastName, "fr") ||
      a.joueur.firstName.localeCompare(b.joueur.firstName, "fr"),
  );
  const avecNumero = effectif.some((e) => e.numero != null);
  const avecCapitaine = effectif.some((e) => (e.cumul?.capitaine ?? 0) > 0);
  const avecCartons = effectif.some((e) => e.cumul && e.cumul.jaunes + e.cumul.oranges + e.cumul.rouges + e.cumul.blancs > 0);

  /** Un classement court : la valeur décroissante, et à égalité le moins de matchs devant. */
  const classement = (cle: keyof Cumul, n = 10) =>
    effectif
      .filter((e): e is typeof e & { cumul: Cumul } => !!e.cumul && e.cumul[cle] > 0)
      .sort((a, b) => b.cumul[cle] - a.cumul[cle] || a.cumul.matchs - b.cumul.matchs || b.cumul.titulaire - a.cumul.titulaire)
      .slice(0, n);
  const realisateurs = classement("points");
  const marqueurs = classement("essais");
  const utilises = classement("matchs");

  // ---- Les rencontres par compétition, la phase finale à part ----
  // Une demi-finale n'a pas à se perdre au milieu des trente journées, c'est
  // elle qui fait le titre. La distinction ne vaut que pour les compétitions
  // qui ont les deux — le barrage d'accession, seul match de sa compétition,
  // garde son intitulé (`estCouperet`).
  const nomCompetition = (m: (typeof season.matches)[number]) => m.competition.shortName || m.competition.name;
  const avecJournees = new Set(season.matches.filter((m) => m.matchday != null).map(nomCompetition));
  const groupes = new Map<string, typeof season.matches>();
  for (const m of season.matches) {
    const nom = nomCompetition(m);
    const cle = estCouperet(m) && avecJournees.has(nom) ? t("saison.phaseFinale", { competition: nom }) : nom;
    groupes.set(cle, [...(groupes.get(cle) ?? []), m]);
  }

  /** Le bilan d'un groupe, sur ses rencontres jouées. Les agrégats de `Season`
   * ne portent que le championnat, pour coller au classement officiel. */
  const bilanDuGroupe = (matchs: typeof season.matches) => {
    const j = matchs.filter(estJoue);
    return {
      joues: j.length,
      victoires: j.filter((m) => m.scoreUsap > m.scoreOpponent).length,
      nuls: j.filter((m) => m.scoreUsap === m.scoreOpponent).length,
      defaites: j.filter((m) => m.scoreUsap < m.scoreOpponent).length,
      pour: j.reduce((s, m) => s + m.scoreUsap, 0),
      contre: j.reduce((s, m) => s + m.scoreOpponent, 0),
    };
  };
  const phraseResultats = (b: { victoires: number; nuls: number; defaites: number }) =>
    [t("saison.victoires", { n: b.victoires }), t("saison.nuls", { n: b.nuls }), t("saison.defaites", { n: b.defaites })].join(", ");

  // ---- L'en-tête, en phrases ----
  const division = DIVISIONS[season.division] ?? season.division;
  const rang = season.finalRanking == null ? null : season.finalRanking === 1 ? t("saison.premier") : t("saison.rang", { n: season.finalRanking });
  const titre = majuscule(
    [
      season.champion && (season.division === "PRO_D2" ? t("saison.championProD2") : t("saison.champion")),
      season.promoted && t("saison.promu"),
      season.relegated && t("saison.relegue"),
    ]
      .filter(Boolean)
      .join(", "),
  );
  const bilan: string[] = [rang ? t("saison.classement", { division, rang }) : division];
  if (season.matchesPlayed != null) {
    bilan.push(
      `${t("saison.matchsJoues", { n: season.matchesPlayed })} : ${phraseResultats({
        victoires: season.wins ?? 0,
        nuls: season.draws ?? 0,
        defaites: season.losses ?? 0,
      })}`,
    );
    const chiffres = [
      season.pointsFor != null && season.pointsAgainst != null && t("saison.pointsMarques", { pour: season.pointsFor, contre: season.pointsAgainst }),
      season.bonusOffensif != null && season.bonusDefensif != null && `${t("saison.bonusOffensifs", { n: season.bonusOffensif })} et ${t("saison.bonusDefensifs", { n: season.bonusDefensif })}`,
      season.totalPoints != null && t("saison.pointsClassement", { n: season.totalPoints }),
    ].filter(Boolean) as string[];
    if (chiffres.length) bilan.push(majuscule(chiffres.join(", ")));
  }

  const roles: Record<string, string> = {
    ENTRAINEUR_PRINCIPAL: t("saison.roleEntraineur"),
    ENTRAINEUR_ADJOINT: t("saison.roleAdjoint"),
    ENTRAINEUR_AVANTS: t("saison.roleAvants"),
    ENTRAINEUR_ARRIERES: t("saison.roleArrieres"),
    ENTRAINEUR_DEFENSE: t("saison.roleDefense"),
    PREPARATEUR_PHYSIQUE: t("saison.rolePrepa"),
    INTERIMAIRE: t("saison.roleInterimaire"),
  };
  // Une prise ou une fin de fonction en cours de saison, au mois près : la
  // source ne donne pas toujours le jour (cf. `seed-cloture-saisons.ts`).
  const mois = (d: Date) => d.toLocaleDateString("fr-FR", { month: "long" });
  const periode = (sc: (typeof season.seasonCoaches)[number]) =>
    sc.startDate && sc.endDate
      ? t("saison.staffDe", { debut: mois(sc.startDate), fin: mois(sc.endDate) })
      : sc.startDate
        ? t("saison.staffDepuis", { mois: mois(sc.startDate) })
        : sc.endDate
          ? t("saison.staffJusqua", { mois: mois(sc.endDate) })
          : null;
  const staff: { role: string; nom: string; href: string; periode: string | null }[] = [
    ...(season.seasonCoaches.length
      ? season.seasonCoaches.map((sc) => ({
          role: roles[sc.role] ?? sc.role.toLowerCase(),
          nom: `${sc.coach.firstName} ${sc.coach.lastName}`,
          href: `/entraineurs/${sc.coach.slug}`,
          periode: periode(sc),
        }))
      : season.coach
        ? [{ role: roles.ENTRAINEUR_PRINCIPAL, nom: `${season.coach.firstName} ${season.coach.lastName}`, href: `/entraineurs/${season.coach.slug}`, periode: null }]
        : []),
    ...(season.president
      ? [{ role: t("saison.president"), nom: `${season.president.firstName} ${season.president.lastName}`, href: `/presidents/${season.president.slug}`, periode: null }]
      : []),
  ];

  const affiche = (m: (typeof season.matches)[number]) => {
    const opp = m.opponent.shortName || m.opponent.name;
    return m.isHome ? `USAP – ${opp}` : `${opp} – USAP`;
  };
  const lettre = (m: (typeof season.matches)[number]) =>
    m.result === "VICTOIRE"
      ? { texte: t("saison.lettreVictoire"), classe: "text-usap-sang" }
      : m.result === "NUL"
        ? { texte: t("saison.lettreNul"), classe: "text-foreground" }
        : m.result === "DEFAITE"
          ? { texte: t("saison.lettreDefaite"), classe: "text-muted-foreground" }
          : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <nav className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <p>
          <Link href="/saisons" className="hover:text-usap-sang">
            {t("saison.filAriane")}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{season.label}</span>
        </p>
        <p className="flex gap-4">
          {precedente && (
            <Link href={`/saisons/${precedente.label}`} className="hover:text-usap-sang">
              {t("saison.precedente")}, {precedente.label}
            </Link>
          )}
          {suivante && (
            <Link href={`/saisons/${suivante.label}`} className="hover:text-usap-sang">
              {t("saison.suivante")}, {suivante.label}
            </Link>
          )}
        </p>
      </nav>

      {/* Le millésime, et la frise des résultats */}
      <header className="mb-10">
        <p className="font-display text-3xl leading-none text-foreground sm:text-4xl">{t("saison.surtitre")}</p>
        <h1 className="font-display text-6xl uppercase leading-[0.9] text-usap-sang tabular-nums sm:text-8xl">{season.label}</h1>
        {joues.length > 0 && (
          <ol aria-label={t("saison.friseAria")} className="mt-3 flex flex-wrap gap-x-1.5 font-display text-3xl leading-none sm:text-4xl">
            {joues.map((m) => {
              const l = lettre(m)!;
              return (
                <li key={m.id}>
                  <Link
                    href={`/matchs/${m.slug}`}
                    title={`${formatDateFR(m.date)}, ${affiche(m)}, ${m.isHome ? m.scoreUsap : m.scoreOpponent}-${m.isHome ? m.scoreOpponent : m.scoreUsap}`}
                    className={`${l.classe} hover:text-usap-or`}
                  >
                    {l.texte}
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
        {titre && (
          <p className={`mt-4 font-display text-2xl uppercase ${season.champion || season.promoted ? "text-usap-or" : "text-muted-foreground"}`}>
            {titre}
          </p>
        )}
        <p className="mt-4 max-w-prose text-lg leading-snug text-foreground">{bilan.join(". ")}.</p>
        {season.matchesPlayed != null && groupes.size > 1 && (
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">{t("saison.reserveChampionnat")}</p>
        )}
        {staff.length > 0 && (
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {staff.map((s, i) => (
              <span key={i}>
                {i === 0 ? majuscule(s.role) : s.role}{" "}
                <Link href={s.href} className="text-foreground hover:text-usap-sang">
                  {s.nom}
                </Link>
                {s.periode ? ` (${s.periode})` : ""}
                {i < staff.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        )}
        {season.notes && <p className="mt-4 max-w-prose text-sm leading-relaxed text-foreground">{season.notes}</p>}
      </header>

      {season.matches.length === 0 && effectif.length === 0 && (
        <p className="text-muted-foreground">{t("saison.aucuneDonnee")}</p>
      )}

      {/* Les rencontres, par compétition */}
      {season.matches.length > 0 && (
        <section className="mb-10">
          <Titre>{t("saison.rencontresTitre")}</Titre>
          {[...groupes.entries()].map(([nom, matchs]) => {
            const b = bilanDuGroupe(matchs);
            return (
              <div key={nom} className="mb-8">
                <h3 className="font-display text-2xl uppercase leading-none text-foreground">{nom}</h3>
                {b.joues > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("saison.bilanGroupe", {
                      resultats: majuscule(phraseResultats(b)),
                      matchs: t("saison.matchsJoues", { n: b.joues }),
                      pour: b.pour,
                      contre: b.contre,
                    })}
                  </p>
                )}
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th scope="col" className="py-2 pr-3 font-medium">{t("saison.colDate")}</th>
                        <th scope="col" className="py-2 pr-3 font-medium">{t("saison.colJournee")}</th>
                        <th scope="col" className="py-2 pr-3 font-medium">{t("saison.colRencontre")}</th>
                        <th scope="col" className="py-2 pr-3 text-right font-medium">{t("saison.colScore")}</th>
                        <th scope="col" className="py-2 pr-3 text-center font-medium">{t("saison.colResultat")}</th>
                        <th scope="col" className="hidden py-2 font-medium md:table-cell">{t("saison.colStade")}</th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {matchs.map((m) => {
                        const joue = estJoue(m);
                        const l = lettre(m);
                        const opp = m.opponent.shortName || m.opponent.name;
                        return (
                          <tr key={m.id} className="border-b border-border hover:bg-muted">
                            <td className="py-1.5 pr-3 whitespace-nowrap text-muted-foreground">{formatDateFR(m.date)}</td>
                            <td className="py-1.5 pr-3 whitespace-nowrap text-muted-foreground">{m.matchday ? `J${m.matchday}` : m.round || ""}</td>
                            <td className="py-1.5 pr-3">
                              <Link href={`/matchs/${m.slug}`} className="text-foreground hover:text-usap-sang">
                                {m.isHome ? (
                                  <>
                                    <span className="font-semibold text-usap-sang">USAP</span> – {opp}
                                  </>
                                ) : (
                                  <>
                                    {opp} – <span className="font-semibold text-usap-sang">USAP</span>
                                  </>
                                )}
                              </Link>
                            </td>
                            <td className="py-1.5 pr-3 text-right whitespace-nowrap">
                              {joue ? (
                                <span className="font-semibold text-foreground">
                                  {m.isHome ? m.scoreUsap : m.scoreOpponent} – {m.isHome ? m.scoreOpponent : m.scoreUsap}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">{t("saison.aVenir")}</span>
                              )}
                            </td>
                            <td className={`py-1.5 pr-3 text-center font-bold ${l?.classe ?? ""}`}>{l?.texte ?? ""}</td>
                            <td className="hidden py-1.5 whitespace-nowrap text-muted-foreground md:table-cell">
                              {m.venue && (
                                <Link href={`/stades/${m.venue.slug}`} className="hover:text-usap-sang">
                                  {m.venue.name}
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Trois classements courts */}
      {(realisateurs.length > 0 || utilises.length > 0) && (
        <section className="mb-10 grid gap-8 lg:grid-cols-3">
          <Classement titre={t("saison.realisateursTitre")} lignes={realisateurs} valeur={(c) => t("saison.valeurPoints", { n: c.points })} libelleActuel={t("joueurs.actuel")} />
          <Classement titre={t("saison.essaisTitre")} lignes={marqueurs} valeur={(c) => t("saison.valeurEssais", { n: c.essais })} libelleActuel={t("joueurs.actuel")} />
          <Classement titre={t("saison.utilisationTitre")} lignes={utilises} valeur={(c) => t("saison.valeurMatchs", { n: c.matchs })} libelleActuel={t("joueurs.actuel")} />
        </section>
      )}

      {/* L'effectif, en un seul tableau */}
      {effectif.length > 0 && (
        <section className="mb-10">
          <Titre>
            {t("saison.effectifTitre")}
            <span className="ml-3 text-xl text-muted-foreground">{t("saison.effectifCompte", { n: effectif.length })}</span>
          </Titre>
          <p className="mb-3 max-w-prose text-sm text-muted-foreground">
            {t("saison.effectifNote")}
            {sansMinutes ? ` ${t("saison.minutesNote")}` : ""}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  {avecNumero && <th scope="col" className="py-2 pr-2 text-right font-medium">{t("saison.colNumero")}</th>}
                  <th scope="col" className="py-2 pr-4 font-medium">{t("saison.colJoueur")}</th>
                  <th scope="col" className="hidden py-2 pr-4 font-medium sm:table-cell">{t("saison.colPoste")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("saison.colMatchs")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("saison.colTitulaire")}</th>
                  {!sansMinutes && <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t("saison.colMinutes")}</th>}
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("saison.colEssais")}</th>
                  <th scope="col" className="hidden py-2 pr-3 text-right font-medium md:table-cell">{t("saison.colTransformations")}</th>
                  <th scope="col" className="hidden py-2 pr-3 text-right font-medium md:table-cell">{t("saison.colPenalites")}</th>
                  <th scope="col" className="hidden py-2 pr-3 text-right font-medium md:table-cell">{t("saison.colDrops")}</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{t("saison.colPoints")}</th>
                  {avecCartons && <th scope="col" className="hidden py-2 font-medium sm:table-cell">{t("saison.colCartons")}</th>}
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {effectif.map((e) => {
                  const c = e.cumul;
                  const cartons = c
                    ? [
                        c.jaunes > 0 && t("saison.jaunes", { n: c.jaunes }),
                        c.oranges > 0 && t("saison.oranges", { n: c.oranges }),
                        c.rouges > 0 && t("saison.rouges", { n: c.rouges }),
                        c.blancs > 0 && t("saison.blancs", { n: c.blancs }),
                      ].filter(Boolean)
                    : [];
                  return (
                    <tr key={e.joueur.id} className="border-b border-border hover:bg-muted">
                      {avecNumero && <td className="py-1 pr-2 text-right text-muted-foreground">{e.numero ?? ""}</td>}
                      <td className="py-1 pr-4">
                        <JoueurCellule
                          slug={e.joueur.slug}
                          firstName={e.joueur.firstName}
                          lastName={e.joueur.lastName}
                          photoUrl={e.joueur.photoUrl}
                          isActive={e.joueur.isActive}
                          libelleActuel={t("joueurs.actuel")}
                        />
                      </td>
                      <td className="hidden py-1 pr-4 text-xs text-muted-foreground sm:table-cell">{e.poste ? (POSITIONS[e.poste]?.label ?? e.poste) : ""}</td>
                      <td className="py-1 pr-3 text-right font-semibold text-foreground">{c?.matchs || ""}</td>
                      <td className="py-1 pr-3 text-right text-muted-foreground">
                        {c?.titulaire || ""}
                        {avecCapitaine && c && c.capitaine > 0 ? <span className="text-usap-sang"> ({c.capitaine} C)</span> : null}
                      </td>
                      {!sansMinutes && <td className="hidden py-1 pr-3 text-right text-muted-foreground sm:table-cell">{c && c.minutes > 0 ? nombre(c.minutes) : ""}</td>}
                      <td className="py-1 pr-3 text-right text-foreground">{c?.essais || ""}</td>
                      <td className="hidden py-1 pr-3 text-right text-foreground md:table-cell">{c?.transformations || ""}</td>
                      <td className="hidden py-1 pr-3 text-right text-foreground md:table-cell">{c?.penalites || ""}</td>
                      <td className="hidden py-1 pr-3 text-right text-foreground md:table-cell">{c?.drops || ""}</td>
                      <td className="py-1 pr-3 text-right font-semibold text-foreground">{c?.points || ""}</td>
                      {avecCartons && <td className="hidden py-1 text-xs text-muted-foreground sm:table-cell">{cartons.join(", ")}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Provenance entite="Season" id={season.id} />
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

type LigneClassement = {
  joueur: { slug: string; firstName: string; lastName: string; photoUrl: string | null; isActive: boolean };
  cumul: Cumul;
};

/** Un classement court : le rang, le joueur, la valeur. */
function Classement({
  titre,
  lignes,
  valeur,
  libelleActuel,
}: {
  titre: string;
  lignes: LigneClassement[];
  valeur: (c: Cumul) => string;
  libelleActuel: string;
}) {
  if (lignes.length === 0) return null;
  return (
    <div>
      <Titre encre>{titre}</Titre>
      <table className="w-full border-collapse text-sm">
        <tbody className="tabular-nums">
          {lignes.map((l, i) => (
            <tr key={l.joueur.slug} className="border-b border-border hover:bg-muted">
              <td className="w-6 py-1 pr-2 text-right text-muted-foreground">{i + 1}</td>
              <td className="py-1 pr-3">
                <JoueurCellule
                  slug={l.joueur.slug}
                  firstName={l.joueur.firstName}
                  lastName={l.joueur.lastName}
                  photoUrl={l.joueur.photoUrl}
                  isActive={l.joueur.isActive}
                  libelleActuel={libelleActuel}
                />
              </td>
              <td className="py-1 text-right whitespace-nowrap font-semibold text-foreground">{valeur(l.cumul)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

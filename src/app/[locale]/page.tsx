import Link from "@/components/Lien";
import Image from "next/image";
import { JoueurCellule } from "@/components/JoueurCellule";
import { prisma } from "@/lib/prisma";
import { MATCH_JOUE, estJoue } from "@/lib/matchs";
import { matchPoints } from "@/lib/scoring";
import { formatDateFR } from "@/lib/utils";
import { dictionnaire } from "@/i18n/dictionnaire";
import { LANGUE_PAR_DEFAUT, type Langue } from "@/i18n/langues";
import { Prisma } from "@prisma/client";
import { liensAlternatifs } from "@/lib/seo";
import type { Metadata } from "next";

/**
 * L'accueil, refait le 6 septembre 2026 dans l'identité posée sur les fiches
 * et la page de saison, puis **repris bloc par bloc à partir du 10 septembre**
 * avec Jérémy.
 *
 * **Le serment l'ouvre** : l'écusson d'un côté, de l'autre les mots que le
 * club fait siens, dans la voix condensée des titres. Suit le titre, puis la
 * phrase de présentation, qui dit la source et l'étendue de la base en
 * chiffres lus dans la base elle-même. Puis, dans l'ordre où un supporter les
 * cherche : sur une même ligne, le dernier match et le prochain, écussons de
 * part et d'autre du score, et un joueur au hasard dans un bandeau sang ; le
 * tête-à-tête avec le prochain adversaire et les réalisateurs contre lui ;
 * la saison en cours avec son bilan en chiffres — championnat seul, comme le
 * classement — et ses trois classements courts, les mêmes que sur la page de
 * saison ; ce jour dans l'histoire en trois colonnes — les rencontres du
 * jour, les joueurs nés ce jour, il y a dix, vingt, cinquante, cent ans — ;
 * et six entrées pour explorer.
 *
 * **LE PALMARÈS A QUITTÉ CETTE PAGE LE 10 SEPTEMBRE 2026**, sur décision de
 * Jérémy. Il en était l'audace — les sept années du Bouclier en or condensé,
 * chacune liée à sa saison —, mais le serment ouvre désormais la page, et
 * trois choses s'y disaient coup sur coup ce que fait ce club. Il garde sa
 * page, `/palmares`, que le Header et le pied de page atteignent depuis
 * partout ; l'accueil n'y mène plus directement, et c'est assumé.
 *
 * Ce que la page ne fait plus : un slogan centré sur un dégradé, un bouton
 * rouge, des cartes à icône pour les chiffres, des pastilles vertes et
 * rouges, des badges pour les années du palmarès, une grille de six cartes
 * à icône pour la navigation que le Header porte déjà.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: Langue }> };

/**
 * L'accueil n'a pas de titre à lui : celui du layout est déjà le sien. Il
 * ne déclare donc que ses liens alternatifs, que Next.js ne fusionne pas
 * depuis le layout — lequel ignore de toute façon le chemin de la page.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: liensAlternatifs(locale, "/") };
}

// Les rencontres jouées un même jour de l'année, par requête brute : Prisma
// ne sait pas filtrer sur le mois et le jour d'une date.
type CeJour = {
  slug: string;
  date: Date;
  score_usap: number;
  score_opponent: number;
  result: string;
  is_home: boolean;
  opponent_name: string;
  competition_name: string;
};

const nombre = (n: number) => n.toLocaleString("fr-FR");
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/**
 * Le bouton du site public, le seul : plein sang, texte blanc, or vif au
 * survol — le couple du hero —, la voix condensée des titres, le rayon du
 * site. Ni ombre ni bouton fantôme. Né sur le tête-à-tête, repris pour la
 * saison ; toute page qui en voudrait un reprend cette classe.
 */
const BOUTON = "inline-block rounded-xs bg-usap-sang px-5 py-2 font-display text-lg uppercase leading-none text-primary-foreground hover:text-usap-or-vif";
/** Une différence signée, avec le vrai signe moins et non le trait d'union. */
const signe = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");

export default async function Home({ params }: Props) {
  const { locale } = await params;
  const t = await dictionnaire(locale);
  const now = new Date();

  // Requêtes séquentielles : le pool de Supabase est étroit.
  const selectionRencontre = {
    slug: true,
    date: true,
    kickoffTime: true,
    scoreUsap: true,
    scoreOpponent: true,
    result: true,
    isHome: true,
    matchday: true,
    round: true,
    competition: { select: { name: true, shortName: true } },
    opponent: { select: { id: true, slug: true, name: true, shortName: true, logoUrl: true } },
    venue: { select: { name: true, city: true, slug: true } },
  } as const;
  // Un match dont le score n'est pas saisi n'est pas « le dernier match » :
  // le calendrier d'une saison entre en base avant ses résultats.
  const dernier = await prisma.match.findFirst({
    where: { date: { lte: now }, ...MATCH_JOUE },
    orderBy: { date: "desc" },
    select: selectionRencontre,
  });
  const prochain = await prisma.match.findFirst({
    where: { date: { gt: now }, result: null },
    orderBy: { date: "asc" },
    select: selectionRencontre,
  });
  // **FACE AU PROCHAIN ADVERSAIRE**, demandé par Jérémy le 11 septembre
  // 2026 : ce qu'un supporter se demande sitôt l'affiche connue. Les
  // rencontres jouées contre ce club, dans l'ordre, et le bilan se calcule en
  // mémoire comme sur la fiche adversaire — vingt-sept lignes au plus.
  const confrontations = prochain
    ? await prisma.match.findMany({
        where: { opponentId: prochain.opponent.id, ...MATCH_JOUE },
        orderBy: { date: "asc" },
        select: { id: true, slug: true, date: true, result: true, isHome: true, scoreUsap: true, scoreOpponent: true, season: { select: { label: true } } },
      })
    : [];
  // **Les réalisateurs catalans contre ce club**, pour la moitié droite —
  // choisi par Jérémy contre les joueurs passés par les deux camps, dont la
  // liste serait énorme pour certains clubs. Même lecture des lignes que sur
  // la fiche adversaire, les cinq premiers.
  const lignesFace = confrontations.length
    ? await prisma.matchPlayer.findMany({
        where: { matchId: { in: confrontations.map((m) => m.id) }, isOpponent: false, playerId: { not: null } },
        select: { playerId: true, totalPoints: true, tries: true },
      })
    : [];
  const cumulsFace = new Map<string, { matchs: number; points: number; essais: number }>();
  for (const l of lignesFace) {
    const c = cumulsFace.get(l.playerId!) ?? { matchs: 0, points: 0, essais: 0 };
    c.matchs += 1;
    c.points += l.totalPoints;
    c.essais += l.tries;
    cumulsFace.set(l.playerId!, c);
  }
  const meilleursFaceIds = [...cumulsFace.entries()]
    .filter(([, c]) => c.points > 0)
    .sort(([, a], [, b]) => b.points - a.points || b.essais - a.essais || a.matchs - b.matchs)
    .slice(0, 5)
    .map(([id]) => id);
  const joueursFace = meilleursFaceIds.length
    ? await prisma.player.findMany({
        where: { id: { in: meilleursFaceIds } },
        select: { id: true, slug: true, firstName: true, lastName: true, photoUrl: true, isActive: true },
      })
    : [];
  const realisateursFace = meilleursFaceIds.map((id) => ({ joueur: joueursFace.find((j) => j.id === id)!, cumul: cumulsFace.get(id)! }));
  const saison = await prisma.season.findFirst({
    orderBy: { startYear: "desc" },
    select: {
      id: true,
      label: true,
      startYear: true,
      division: true,
      matches: {
        orderBy: { date: "asc" },
        select: {
          id: true,
          result: true,
          matchday: true,
          scoreUsap: true,
          scoreOpponent: true,
          triesUsap: true,
          triesOpponent: true,
          bonusOffensif: true,
          bonusDefensif: true,
          competition: { select: { type: true } },
        },
      },
    },
  });
  // **LE BILAN CHIFFRÉ DE LA SAISON EN COURS**, à la demande de Jérémy le
  // 11 septembre 2026, à la place de la frise des lettres qu'il n'aimait pas
  // ici. Sur le **championnat seul, phase régulière** — les rencontres de
  // type CHAMPIONNAT qui portent une journée —, comme l'en-tête de la page de
  // saison et le classement officiel. Les essais ne sont donnés que si la
  // source les a dits sur chaque rencontre ; les points de classement
  // viennent de `matchPoints()`, jamais d'un `4 × victoires` en dur.
  const championnat = saison ? saison.matches.filter((m) => m.competition.type === "CHAMPIONNAT" && m.matchday != null) : [];
  const jouesSaison = championnat.filter(estJoue);
  const bilanSaison = saison && {
    joues: jouesSaison.length,
    aVenir: championnat.length - jouesSaison.length,
    victoires: jouesSaison.filter((m) => m.result === "VICTOIRE").length,
    nuls: jouesSaison.filter((m) => m.result === "NUL").length,
    defaites: jouesSaison.filter((m) => m.result === "DEFAITE").length,
    pour: jouesSaison.reduce((s, m) => s + m.scoreUsap, 0),
    contre: jouesSaison.reduce((s, m) => s + m.scoreOpponent, 0),
    essaisPour: jouesSaison.every((m) => m.triesUsap != null) ? jouesSaison.reduce((s, m) => s + (m.triesUsap ?? 0), 0) : null,
    essaisContre: jouesSaison.every((m) => m.triesOpponent != null) ? jouesSaison.reduce((s, m) => s + (m.triesOpponent ?? 0), 0) : null,
    bonusOffensifs: jouesSaison.filter((m) => m.bonusOffensif).length,
    bonusDefensifs: jouesSaison.filter((m) => m.bonusDefensif).length,
    // `estJoue` resserre les scores, pas `result` ; une rencontre jouée en a un.
    points: jouesSaison.reduce((s, m) => s + (m.result ? matchPoints(m.result, m.bonusOffensif, m.bonusDefensif, saison.startYear) : 0), 0),
  };

  // **LES TROIS CLASSEMENTS DE LA SAISON EN COURS**, demandés par Jérémy le
  // 11 septembre 2026 : réalisateurs, marqueurs d'essais, plus utilisés —
  // ceux de la page de saison, à cinq noms, sous la frise. Même lecture des
  // lignes catalanes des rencontres jouées, même règle d'égalité : à valeur
  // égale le moins de matchs devant, puis le plus de titularisations.
  const lignesSaison = saison
    ? await prisma.matchPlayer.findMany({
        where: { match: { seasonId: saison.id, ...MATCH_JOUE }, isOpponent: false, playerId: { not: null } },
        select: { playerId: true, totalPoints: true, tries: true, isStarter: true },
      })
    : [];
  type CumulSaison = { matchs: number; titulaire: number; points: number; essais: number };
  const cumulsSaison = new Map<string, CumulSaison>();
  for (const l of lignesSaison) {
    const c = cumulsSaison.get(l.playerId!) ?? { matchs: 0, titulaire: 0, points: 0, essais: 0 };
    c.matchs += 1;
    if (l.isStarter) c.titulaire += 1;
    c.points += l.totalPoints;
    c.essais += l.tries;
    cumulsSaison.set(l.playerId!, c);
  }
  const classementSaison = (cle: keyof CumulSaison) =>
    [...cumulsSaison.entries()]
      .filter(([, c]) => c[cle] > 0)
      .sort(([, a], [, b]) => b[cle] - a[cle] || a.matchs - b.matchs || b.titulaire - a.titulaire)
      .slice(0, 5);
  const classementsSaison = { points: classementSaison("points"), essais: classementSaison("essais"), matchs: classementSaison("matchs") };
  const idsSaison = [...new Set(Object.values(classementsSaison).flat().map(([id]) => id))];
  const joueursSaison = idsSaison.length
    ? await prisma.player.findMany({
        where: { id: { in: idsSaison } },
        select: { id: true, slug: true, firstName: true, lastName: true, photoUrl: true, isActive: true },
      })
    : [];
  const lignesDe = (entrees: [string, CumulSaison][]) => entrees.map(([id, cumul]) => ({ joueur: joueursSaison.find((j) => j.id === id)!, cumul }));

  // Les rencontres à venir ne sont pas des matchs référencés : la page des
  // statistiques compte de la même façon.
  const matchs = await prisma.match.count({ where: MATCH_JOUE });
  const joueurs = await prisma.player.count({
    where: {
      OR: [
        { careerClubs: { some: { isUsap: true } } },
        { matchAppearances: { some: { isOpponent: false } } },
        { seasonSquads: { some: {} } },
      ],
    },
  });
  const saisons = await prisma.season.count();
  const saisonsDocumentees = await prisma.season.count({ where: { matches: { some: MATCH_JOUE } } });

  // **UN JOUEUR AU HASARD**, demandé par Jérémy le 10 septembre 2026.
  //
  // Le tirage porte sur les hommes qui ont **joué** sous le maillot — au
  // moins une feuille sur une rencontre jouée —, et non sur les 381 fiches
  // liées au club : une recrue sans match afficherait trois zéros, ce qui
  // n'est pas un portrait.
  //
  // La page est `force-dynamic`, donc le tirage est refait à chaque
  // chargement : c'est ce qu'on attend d'un « au hasard ». `orderBy` est
  // nécessaire, faute de quoi le `skip` porterait sur un ordre indéfini.
  const ELIGIBLE = { matchAppearances: { some: { isOpponent: false, match: MATCH_JOUE } } };
  const tirables = await prisma.player.count({ where: ELIGIBLE });
  const [auHasard] = tirables
    ? await prisma.player.findMany({
        where: ELIGIBLE,
        select: { id: true, slug: true, firstName: true, lastName: true, photoUrl: true },
        orderBy: { id: "asc" },
        skip: Math.floor(Math.random() * tirables),
        take: 1,
      })
    : [];
  // Les mêmes règles de compte que la fiche du joueur et que `/centurions` :
  // une ligne de composition sur une rencontre jouée vaut un match, le
  // remplaçant non entré compris. Deux pages qui lient l'une vers l'autre ne
  // peuvent pas annoncer deux nombres différents pour le même homme.
  const bilanAuHasard = auHasard
    ? await prisma.matchPlayer.aggregate({
        where: { playerId: auHasard.id, isOpponent: false, match: MATCH_JOUE },
        _count: { _all: true },
        _sum: { totalPoints: true, tries: true },
      })
    : null;

  let ceJour: CeJour[] = [];
  try {
    ceJour = await prisma.$queryRaw<CeJour[]>(
      Prisma.sql`
        SELECT m.slug, m.date, m.score_usap, m.score_opponent, m.result, m.is_home,
               COALESCE(o.short_name, o.name) AS opponent_name, COALESCE(c.short_name, c.name) AS competition_name
        FROM matches m
        JOIN opponents o ON m.opponent_id = o.id
        JOIN competitions c ON m.competition_id = c.id
        WHERE EXTRACT(MONTH FROM m.date) = ${now.getMonth() + 1}
          AND EXTRACT(DAY FROM m.date) = ${now.getDate()}
          AND m.result IS NOT NULL
        ORDER BY m.date DESC
      `,
    );
  } catch {
    // La requête brute échoue en silence : la section dit alors « aucune ».
  }
  const aujourdhui = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

  // **« CE JOUR » EN TROIS COLONNES**, demandé par Jérémy le 11 septembre
  // 2026 : le bloc était un tableau de trois lignes, souvent vide. S'y
  // ajoutent **les joueurs nés ce jour-là** et **il y a dix, vingt, cinquante,
  // cent ans**.
  //
  // Les naissances se filtrent en mémoire : 214 fiches portent une date, et
  // Prisma ne sait pas comparer un mois et un jour. La condition du lien avec
  // le club est celle de la liste des joueurs — les adversaires n'ont pas de
  // date de naissance, mais la règle vaut d'être écrite.
  const avecDate = await prisma.player.findMany({
    where: {
      birthDate: { not: null },
      OR: [{ careerClubs: { some: { isUsap: true } } }, { matchAppearances: { some: { isOpponent: false } } }, { seasonSquads: { some: {} } }],
    },
    select: { id: true, slug: true, firstName: true, lastName: true, photoUrl: true, isActive: true, birthDate: true, deathDate: true },
  });
  // **La semaine, non le jour**, et c'est compté : 211 naissances tombent sur
  // 155 jours distincts, la colonne du seul jour serait vide six jours sur
  // dix. Sept jours autour d'aujourd'hui en donnent quatre en moyenne, et la
  // date de chacun est écrite sur sa ligne. Le tri suit le calendrier, du
  // plus proche passé au plus lointain à venir.
  const jourDeLAnnee = (mois: number, jour: number) => new Date(Date.UTC(now.getFullYear(), mois, jour)).getTime();
  const ecart = (d: Date) => {
    const delta = Math.round((jourDeLAnnee(d.getUTCMonth(), d.getUTCDate()) - jourDeLAnnee(now.getMonth(), now.getDate())) / 86400000);
    // Un anniversaire fin décembre vu de début janvier est à quelques jours, pas à un an.
    return delta > 182 ? delta - 365 : delta < -182 ? delta + 365 : delta;
  };
  const anniversaires = avecDate
    .map((j) => ({ ...j, ecart: ecart(j.birthDate!) }))
    .filter((j) => Math.abs(j.ecart) <= 3)
    .sort((a, b) => a.ecart - b.ecart || a.birthDate!.getTime() - b.birthDate!.getTime());

  // « Il y a N ans » : la rencontre jouée la plus proche d'aujourd'hui, N ans
  // plus tôt, à trois semaines près — un jour précis tomberait presque
  // toujours à côté, une saison en compte vingt-six. Une seule requête pour
  // les quatre fenêtres, puis la plus proche de chacune en mémoire. Cinquante
  // et cent ans ne rendent rien tant que la base s'arrête à 2004-2005 et aux
  // deux finales d'avant-guerre ; le jour où elles rendront, la colonne
  // s'allongera d'elle-même.
  const DISTANCES = [10, 20, 50, 100] as const;
  const FENETRE = 21 * 24 * 3600 * 1000;
  const cibles = DISTANCES.map((n) => ({ n, date: new Date(Date.UTC(now.getFullYear() - n, now.getMonth(), now.getDate(), 12)) }));
  const autrefois = await prisma.match.findMany({
    where: { AND: [MATCH_JOUE, { OR: cibles.map((c) => ({ date: { gte: new Date(c.date.getTime() - FENETRE), lte: new Date(c.date.getTime() + FENETRE) } })) }] },
    select: { slug: true, date: true, scoreUsap: true, scoreOpponent: true, result: true, isHome: true, opponent: { select: { name: true, shortName: true } }, competition: { select: { name: true, shortName: true } } },
  });
  const ilYA = cibles
    .map((c) => {
      const proches = autrefois.filter((m) => Math.abs(m.date.getTime() - c.date.getTime()) <= FENETRE);
      const m = proches.length ? proches.reduce((a, b) => (Math.abs(b.date.getTime() - c.date.getTime()) < Math.abs(a.date.getTime() - c.date.getTime()) ? b : a)) : null;
      return m && { n: c.n, match: m };
    })
    .filter((x): x is { n: (typeof DISTANCES)[number]; match: (typeof autrefois)[number] } => x != null);

  const nomAdverse = (m: { opponent: { name: string; shortName: string | null } }) => m.opponent.shortName || m.opponent.name;
  /**
   * L'ÉCUSSON D'UN CAMP, POSÉ DE PART ET D'AUTRE DU SCORE.
   *
   * Demandé par Jérémy le 10 septembre 2026, et **choisi sur pièce** : les
   * deux dispositions possibles ont été mises l'une sous l'autre sur la page
   * — l'écusson collé au nom du club, ou l'écusson encadrant le score, façon
   * tableau d'affichage —, et c'est la seconde qu'il a retenue.
   *
   * C'est une exception assumée au reste du site : la fiche de match et la
   * liste des matchs se sont débarrassées de leurs logos pendant le chantier
   * design, les écussons étant ailleurs. Ici les deux blocs ne montrent
   * qu'une rencontre chacun, et l'écusson illustre au lieu d'encombrer — à ne
   * pas prendre plus tard pour un oubli de nettoyage.
   *
   * Trois précautions dans ces quelques lignes :
   *
   * - **l'écusson adverse porte `logo-club`**, sans quoi une marque sombre —
   *   le tigre de Leicester, le masque des Ospreys — disparaîtrait en thème
   *   sombre sans que rien ne le signale. Celui de l'USAP s'en passe, comme
   *   dans le Header et dans le hero : il a son propre contour d'or ;
   * - **un club sans écusson ne laisse pas de case vide.** Les 61 adversaires
   *   en ont un aujourd'hui, un club neuf entrerait sans, et le nom se suffit ;
   * - **`shrink-0`**, faute de quoi un écusson se laisse écraser par le score
   *   dans la colonne étroite du mobile.
   *
   * L'ordre vient de `isHome`, et les deux appels le lisent au même endroit :
   * l'écusson et le score ne peuvent pas se désynchroniser.
   */
  const ecusson = (m: { opponent: { name: string; shortName: string | null; logoUrl: string | null } }, usap: boolean) =>
    usap ? (
      <Image src="/images/usap/logo.png" alt="" width={56} height={56} className="h-12 w-12 shrink-0" />
    ) : (
      m.opponent.logoUrl && <Image src={m.opponent.logoUrl} alt="" width={56} height={56} className="h-12 w-12 shrink-0 logo-club" />
    );
  const affiche = (m: { isHome: boolean; opponent?: { name: string; shortName: string | null } }, nom = m.opponent ? nomAdverse({ opponent: m.opponent }) : "") =>
    m.isHome ? (
      <>
        <span className="font-semibold text-usap-sang">USAP</span> – {nom}
      </>
    ) : (
      <>
        {nom} – <span className="font-semibold text-usap-sang">USAP</span>
      </>
    );
  const intitule = (m: { matchday: number | null; round: string | null; competition: { name: string; shortName: string | null } }) => {
    const competition = m.competition.shortName || m.competition.name;
    return m.matchday
      ? t(m.matchday === 1 ? "match.journee" : "match.journeeN", { competition, n: m.matchday })
      : m.round
        ? t("match.tour", { competition, tour: m.round })
        : competition;
  };
  const lettre = (result: string | null) =>
    result === "VICTOIRE"
      ? { texte: t("saison.lettreVictoire"), classe: "text-usap-sang" }
      : result === "NUL"
        ? { texte: t("saison.lettreNul"), classe: "text-foreground" }
        : { texte: t("saison.lettreDefaite"), classe: "text-muted-foreground" };

  return (
    <>
      {/* **L'accueil est la dernière page sans catalan** : elle sera refondue en
          dernier, et son dictionnaire écrit alors. D'ici là, le dire. Le
          bandeau reste au-dessus du hero : il avertit sur la page entière. */}
      {locale !== LANGUE_PAR_DEFAUT && (
        <p className="border-b border-border bg-usap-or/10 px-4 py-2 text-center text-sm text-foreground">{t("langue.nonTraduit")}</p>
      )}
      {/* **LE SERMENT, SANG ET OR**, demandé par Jérémy le 10 septembre 2026 :
          l'écusson d'un côté, de l'autre les mots que le club fait siens, dans
          la voix condensée des titres. Deux colonnes dès `sm`, l'une et l'autre
          dessous en mobile — un écusson ne se met pas à côté de quatre lignes
          sur 375 pixels.

          **Le bandeau va d'un bord à l'autre**, et c'est pourquoi il est hors
          du conteneur de la page : un rectangle rouge à l'intérieur des marges
          se lirait comme une carte, ce dont le chantier design a justement
          débarrassé le site. Sa doublure intérieure reprend la largeur du
          reste, pour que l'écusson s'aligne sur le titre qui suit.

          **L'or y est `usap-or-vif`, non `usap-or`** : celui-ci vaut un or
          sombre en thème clair, illisible sur le sang — 1,8:1. Cf. la
          démonstration dans `globals.css`. */}
      <section className="bg-usap-sang">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-10 sm:grid-cols-[auto_1fr] sm:gap-10 sm:py-14">
          <Image
            src="/images/usap/logo.png"
            alt={t("nav.logo")}
            width={224}
            height={224}
            priority
            className="h-28 w-28 sm:h-40 sm:w-40"
          />
          <blockquote className="font-display text-2xl uppercase leading-[1.05] text-usap-or-vif sm:text-4xl">
            {t("accueil.serment")}
          </blockquote>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <header className="mb-12">
          <h1 className="font-display text-4xl uppercase leading-none text-foreground sm:text-6xl">{t("accueil.titre")}</h1>
          <p className="mt-6 max-w-prose text-lg leading-snug text-foreground">{t("accueil.chapeau")}</p>
          {/* L'état des travaux, en italique : le chapeau dit le projet, cette
              note dit où il en est. Les chiffres sont ici et non là-haut — « en
              cours » est exactement ce qu'ils disent. */}
          <p className="mt-2 max-w-prose text-sm italic leading-relaxed text-muted-foreground">
            {t("accueil.reserve", {
              matchs: nombre(matchs),
              joueurs: nombre(joueurs),
              saisons: saisonsDocumentees,
              total: saisons,
            })}
          </p>
        </header>

        {/* **Le dernier match, le prochain, un joueur au hasard** — trois
            colonnes au même niveau, demandé par Jérémy le 11 septembre 2026 :
            le joueur y était d'abord seul, plus bas, entre « ce jour dans
            l'histoire » et « Explorer ». Ce sont les trois choses qu'un
            supporter regarde en premier, et elles tiennent sur une ligne. */}
        {(dernier || prochain || auHasard) && (
          <section className="mb-10 grid gap-8 md:grid-cols-3">
            {dernier && (
              <div>
                <Titre>{t("accueil.dernierTitre")}</Titre>
                <p className="text-sm text-muted-foreground">
                  {intitule(dernier)}, {t("match.le", { date: formatDateFR(dernier.date) })}.
                </p>
                <p className="mt-1 text-xl text-foreground">
                  <Link href={`/matchs/${dernier.slug}`} className="hover:text-usap-sang">
                    {affiche(dernier)}
                  </Link>
                </p>
                <p className="mt-2 flex items-center gap-4 font-display text-5xl leading-none text-foreground tabular-nums">
                  {ecusson(dernier, dernier.isHome)}
                  <Link href={`/matchs/${dernier.slug}`} className="hover:text-usap-sang">
                    {dernier.isHome ? dernier.scoreUsap : dernier.scoreOpponent}
                    <span className="mx-2 text-muted-foreground">–</span>
                    {dernier.isHome ? dernier.scoreOpponent : dernier.scoreUsap}
                  </Link>
                  {ecusson(dernier, !dernier.isHome)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dernier.result === "VICTOIRE" ? t("match.victoire") : dernier.result === "NUL" ? t("match.nul") : t("match.defaite")}
                  {dernier.venue && (
                    <>
                      ,{" "}
                      <Link href={`/stades/${dernier.venue.slug}`} className="hover:text-usap-sang">
                        {dernier.venue.name}, {dernier.venue.city}
                      </Link>
                    </>
                  )}
                  .
                </p>
              </div>
            )}
            {prochain && (
              <div>
                <Titre encre>{t("accueil.prochainTitre")}</Titre>
                <p className="text-sm text-muted-foreground">
                  {intitule(prochain)}, {t("match.le", { date: formatDateFR(prochain.date) })}
                  {prochain.kickoffTime ? ` ${t("match.a", { heure: prochain.kickoffTime })}` : ""}.
                </p>
                <p className="mt-1 text-xl text-foreground">
                  <Link href={`/matchs/${prochain.slug}`} className="hover:text-usap-sang">
                    {affiche(prochain)}
                  </Link>
                </p>
                <p className="mt-2 flex items-center gap-4 font-display text-5xl leading-none text-muted-foreground">
                  {ecusson(prochain, prochain.isHome)}
                  {t("match.aVenir")}
                  {ecusson(prochain, !prochain.isHome)}
                </p>
                {prochain.venue && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    <Link href={`/stades/${prochain.venue.slug}`} className="hover:text-usap-sang">
                      {prochain.venue.name}, {prochain.venue.city}
                    </Link>
                    .
                  </p>
                )}
              </div>
            )}
            {/* **Un joueur au hasard.** Le nom est dans la voix du dos de
                maillot, comme sur la fiche du joueur — prénom au-dessus, nom
                condensé en rouge —, et **la case du portrait reste vide** quand
                la LNR et Commons n'ont rien : 65 fiches sur 381 sont
                illustrées, et ne tirer que parmi celles-là rendrait presque
                toujours un joueur de l'effectif du jour.

                **Le nom est en 4xl, un cran sous le score des deux autres
                colonnes, et c'est mesuré** : en 5xl, « Kubunakaravi » fait
                298 pixels quand un tiers de page moins le portrait en laisse
                240, et un patronyme ne se coupe pas au milieu. En 4xl tout
                tient, « Guerois-Galisson » se coupant à son trait d'union. Le
                prénom au-dessus rend au bloc la hauteur du score.

                **Et la colonne est un bandeau sang**, demandé par Jérémy le
                11 septembre 2026 — la seule surface colorée de la page avec le
                hero, et elle en reprend la règle : la surface impose son encre.
                Titre et nom en `usap-or-vif`, le dos de maillot tel qu'il est,
                prénom et bilan en `primary-foreground`, blanc dans les deux
                thèmes. `usap-or` y serait illisible en clair, cf. `globals.css`.
                La grille étire la colonne à la hauteur des deux autres, ce qui
                fait le cadre sans bordure ; et **le bandeau déborde en haut et
                en bas de son rembourrage** (`md:-my-5`) pour que son titre reste
                sur la ligne des deux autres — un rembourrage sans ce
                débordement le faisait descendre de vingt pixels. En mobile
                les blocs s'empilent, et le bandeau garde ses marges. */}
            {auHasard && bilanAuHasard && (
              <div className="rounded-xs bg-usap-sang p-5 md:-my-5">
                <Titre sang>{t("accueil.hasardTitre")}</Titre>
                <div className="flex items-center gap-4">
                  {auHasard.photoUrl && (
                    <Image
                      src={auHasard.photoUrl}
                      alt=""
                      width={96}
                      height={96}
                      className="h-20 w-20 shrink-0 rounded-xs object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <Link href={`/joueurs/${auHasard.slug}`} className="group">
                      <span className="block font-display text-xl leading-none text-primary-foreground group-hover:text-usap-or-vif">
                        {auHasard.firstName}
                      </span>
                      <span className="block break-words font-display text-4xl uppercase leading-[0.9] text-usap-or-vif">
                        {auHasard.lastName}
                      </span>
                    </Link>
                    <p className="mt-2 text-sm text-primary-foreground tabular-nums">
                      {t("accueil.hasardMatchs", { n: bilanAuHasard._count._all })},{" "}
                      {t("accueil.hasardPoints", { n: bilanAuHasard._sum.totalPoints ?? 0 })},{" "}
                      {t("accueil.hasardEssais", { n: bilanAuHasard._sum.tries ?? 0 })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* **Face au prochain adversaire.** Le bilan en une phrase avec les
            mots de la fiche du club, les cinq dernières confrontations en
            lignes courtes, le plus large succès et la plus lourde défaite liés
            à leur rencontre, et un bouton vers le tête-à-tête complet. Un club
            jamais rencontré le dit, plutôt que de cacher le bloc : « première
            rencontre » est une information. Le bloc suit le prochain match et
            précède la saison : l'affiche, puis qui on affronte, puis où on en
            est.

            **La frise des confrontations a été essayée et défaite** le
            11 septembre 2026 : trente-deux lettres pour Castres, « indigeste »
            selon Jérémy — sur la fiche du club elle est l'audace de la page,
            ici elle encombrait un bloc qui n'est pas le sujet. Les cinq
            dernières confrontations disent la tendance sans le mur.

            **Le bloc est en deux moitiés** dès `md` : à gauche le tête-à-tête,
            à droite **les cinq meilleurs réalisateurs catalans contre ce
            club**, dans le tableau de la fiche adversaire. Choisi par Jérémy
            contre les joueurs passés par les deux camps, dont la liste serait
            énorme pour certains clubs. */}
        {prochain && (() => {
          const jouees = confrontations.filter(estJoue);
          const victoires = jouees.filter((m) => m.result === "VICTOIRE");
          const nuls = jouees.filter((m) => m.result === "NUL");
          const defaites = jouees.filter((m) => m.result === "DEFAITE");
          const pour = jouees.reduce((s, m) => s + m.scoreUsap, 0);
          const contre = jouees.reduce((s, m) => s + m.scoreOpponent, 0);
          const plusLarge = victoires.length ? victoires.reduce((a, m) => (m.scoreUsap - m.scoreOpponent > a.scoreUsap - a.scoreOpponent ? m : a)) : null;
          const plusLourde = defaites.length ? defaites.reduce((a, m) => (m.scoreOpponent - m.scoreUsap > a.scoreOpponent - a.scoreUsap ? m : a)) : null;
          const dernieres = [...jouees].reverse().slice(0, 5);
          const nom = nomAdverse(prochain);
          const score = (m: (typeof jouees)[number]) => (
            <Link href={`/matchs/${m.slug}`} className="hover:text-usap-sang">
              {m.scoreUsap}-{m.scoreOpponent} {t("match.le", { date: formatDateFR(m.date) })}
            </Link>
          );
          return (
            <section className="mb-10 grid gap-8 md:grid-cols-2">
              <div>
              <Titre encre>
                <Link href={`/adversaires/${prochain.opponent.slug}`} className="hover:text-usap-sang">
                  {t("accueil.faceATitre", { nom })}
                </Link>
              </Titre>
              <p className="max-w-prose text-foreground">
                {jouees.length === 0
                  ? `${t("adversaire.aucune")} ${t("accueil.faceAPremiere")}`
                  : t(jouees.length === 1 ? "adversaire.bilanUne" : "adversaire.bilan", {
                      n: jouees.length,
                      saison: jouees[0].season.label,
                      v: t("saison.victoires", { n: victoires.length }),
                      nu: t("saison.nuls", { n: nuls.length }),
                      d: t("saison.defaites", { n: defaites.length }),
                      pour: nombre(pour),
                      contre: nombre(contre),
                    })}
              </p>
              {dernieres.length > 0 && (
                <table className="mt-3 w-full border-collapse text-sm">
                  {/* Le libellé est visible, à la demande de Jérémy : un tableau
                      de cinq lignes sans titre se lit comme une liste tronquée. */}
                  <caption className="pb-1 text-left text-sm font-semibold text-foreground">{t("accueil.faceADernieres")}</caption>
                  <tbody className="tabular-nums">
                    {dernieres.map((m) => {
                      const l = lettre(m.result);
                      return (
                        <tr key={m.id} className="border-b border-border hover:bg-muted">
                          <td className="py-1.5 pr-4 text-muted-foreground whitespace-nowrap">{formatDateFR(m.date)}</td>
                          <td className="py-1.5 pr-4">
                            <Link href={`/matchs/${m.slug}`} className="text-foreground hover:text-usap-sang">
                              {affiche(m, nom)}
                            </Link>
                          </td>
                          <td className="py-1.5 pr-3 text-right font-semibold text-foreground whitespace-nowrap">
                            {m.isHome ? m.scoreUsap : m.scoreOpponent} – {m.isHome ? m.scoreOpponent : m.scoreUsap}
                          </td>
                          <td className={`py-1.5 text-center font-bold ${l.classe}`}>{l.texte}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {(plusLarge || plusLourde) && (
                <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
                  {plusLarge && (
                    <>
                      {t("adversaire.plusLarge", { score: "" }).trim()} {score(plusLarge)}
                      {plusLourde ? ", " : "."}
                    </>
                  )}
                  {plusLourde && (
                    <>
                      {plusLarge ? t("adversaire.plusLourde", { score: "" }).trim() : majuscule(t("adversaire.plusLourde", { score: "" }).trim())} {score(plusLourde)}.
                    </>
                  )}
                </p>
              )}
              {/* **Le bouton**, demandé par Jérémy — cf. `BOUTON`. */}
              <p className="mt-4 text-center">
                <Link href={`/adversaires/${prochain.opponent.slug}`} className={BOUTON}>
                  {t("accueil.faceAComplet")}
                </Link>
              </p>
              </div>
              {realisateursFace.length > 0 && (
                <div>
                  {/* En rouge, non en encre comme sur la fiche : deux titres
                      noirs côte à côte font fade, a dit Jérémy, et celui-ci
                      parle des Catalans — le rouge est le leur. */}
                  <Titre>{t("adversaire.realisateursTitre", { nom })}</Titre>
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th scope="col" className="py-2 pr-2 font-medium" />
                        <th scope="col" className="py-2 pr-3 font-medium">{t("adversaire.colJoueur")}</th>
                        <th scope="col" className="py-2 pr-3 text-right font-medium">{t("adversaire.colMatchs")}</th>
                        <th scope="col" className="py-2 pr-3 text-right font-medium">{t("adversaire.colEssais")}</th>
                        <th scope="col" className="py-2 text-right font-medium">{t("adversaire.colPoints")}</th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {realisateursFace.map((r, i) => (
                        <tr key={r.joueur.id} className="border-b border-border hover:bg-muted">
                          <td className="w-6 py-1 pr-2 text-right text-muted-foreground">{i + 1}</td>
                          <td className="py-1 pr-3">
                            <JoueurCellule
                              slug={r.joueur.slug}
                              firstName={r.joueur.firstName}
                              lastName={r.joueur.lastName}
                              photoUrl={r.joueur.photoUrl}
                              isActive={r.joueur.isActive}
                              libelleActuel={t("joueurs.actuel")}
                            />
                          </td>
                          <td className="py-1 pr-3 text-right text-muted-foreground">{r.cumul.matchs}</td>
                          <td className="py-1 pr-3 text-right text-foreground">{r.cumul.essais || ""}</td>
                          <td className="py-1 text-right font-semibold text-foreground">{r.cumul.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })()}

        {/* La saison en cours, et sa frise */}
        {saison && (
          <section className="mb-10">
            <Titre>
              <Link href={`/saisons/${saison.label}`} className="hover:text-usap-or">
                {t("accueil.saisonTitre", { label: saison.label })}
              </Link>
            </Titre>
            <p className="text-sm text-muted-foreground">
              {t(`divisions.${saison.division}`)}
              {bilanSaison && bilanSaison.aVenir > 0 && `, ${t("accueil.bilanAVenir", { n: bilanSaison.aVenir })}`}. {t("accueil.bilanNote")}
            </p>
            {/* **Le bilan en chiffres**, à la place de la frise des lettres :
                une rangée de nombres dans la voix condensée, chacun sous son
                libellé en petit — ce que le classement officiel dit d'une
                équipe, dans son ordre. Les points de classement sont en rouge,
                c'est le chiffre qu'on vient chercher. Un tiret quand la source
                n'a pas dit les essais. */}
            {bilanSaison && bilanSaison.joues > 0 && (
              <dl className="mt-4 grid grid-cols-3 gap-x-6 gap-y-4 text-center sm:grid-cols-5 lg:grid-cols-10">
                {(
                  [
                    ["accueil.bilanJoues", bilanSaison.joues],
                    ["accueil.bilanVictoires", bilanSaison.victoires],
                    ["accueil.bilanNuls", bilanSaison.nuls],
                    ["accueil.bilanDefaites", bilanSaison.defaites],
                    ["accueil.bilanPour", bilanSaison.pour],
                    ["accueil.bilanContre", bilanSaison.contre],
                    ["accueil.bilanDifference", bilanSaison.pour - bilanSaison.contre],
                    ["accueil.bilanEssais", bilanSaison.essaisPour != null && bilanSaison.essaisContre != null ? `${bilanSaison.essaisPour}/${bilanSaison.essaisContre}` : null],
                    ["accueil.bilanBonus", `${bilanSaison.bonusOffensifs}/${bilanSaison.bonusDefensifs}`],
                    ["accueil.bilanPoints", bilanSaison.points],
                  ] as const
                ).map(([cle, valeur]) => (
                  <div key={cle}>
                    <dd className={`font-display text-4xl leading-none tabular-nums ${cle === "accueil.bilanPoints" ? "text-usap-sang" : "text-foreground"}`}>
                      {valeur == null ? "–" : cle === "accueil.bilanDifference" ? signe(valeur as number) : valeur}
                    </dd>
                    <dt className="mt-1 text-xs text-muted-foreground">{t(cle)}</dt>
                  </div>
                ))}
              </dl>
            )}
            {/* Les trois classements, en trois colonnes dès `md`. Les titres
                sont des h3 en encre, plus petits que le titre rouge de la
                section : c'est une hiérarchie, pas une répétition. */}
            {classementsSaison.points.length > 0 && (
              <div className="mt-6 grid gap-8 md:grid-cols-3">
                <ClassementCourt titre={t("saison.realisateursTitre")} lignes={lignesDe(classementsSaison.points)} valeur={(c) => t("saison.valeurPoints", { n: c.points })} libelleActuel={t("joueurs.actuel")} />
                <ClassementCourt titre={t("saison.essaisTitre")} lignes={lignesDe(classementsSaison.essais)} valeur={(c) => t("saison.valeurEssais", { n: c.essais })} libelleActuel={t("joueurs.actuel")} />
                <ClassementCourt titre={t("saison.utilisationTitre")} lignes={lignesDe(classementsSaison.matchs)} valeur={(c) => t("saison.valeurMatchs", { n: c.matchs })} libelleActuel={t("joueurs.actuel")} />
              </div>
            )}
            <p className="mt-6 text-center">
              <Link href={`/saisons/${saison.label}`} className={BOUTON}>
                {t("accueil.saisonEntiere")}
              </Link>
            </p>
          </section>
        )}

        {/* **Ce jour dans l'histoire, en trois colonnes** : les rencontres
            jouées un même jour de l'année, les anniversaires de la semaine
            avec l'âge fêté, le jour même en gras, et la rencontre la plus proche il y a dix, vingt,
            cinquante et cent ans. Une colonne vide le dit plutôt que de
            disparaître : les trois restent à leur place d'un jour à l'autre. */}
        <section className="mb-10">
          <Titre encre>
            {t("accueil.ceJourTitre")}
            <span className="ml-3 text-xl text-muted-foreground">{aujourdhui}</span>
          </Titre>
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <SousTitre>{t("accueil.ceJourRencontres")}</SousTitre>
              {ceJour.length > 0 ? (
                <table className="w-full border-collapse text-sm">
                  <tbody className="tabular-nums">
                    {ceJour.map((m) => {
                      const l = lettre(m.result);
                      return (
                        <tr key={m.slug} className="border-b border-border hover:bg-muted">
                          <td className="py-1.5 pr-3 font-display text-2xl leading-none text-usap-sang">{new Date(m.date).getFullYear()}</td>
                          <td className="py-1.5 pr-3">
                            <Link href={`/matchs/${m.slug}`} className="text-foreground hover:text-usap-sang">
                              {m.is_home ? (
                                <>
                                  <span className="font-semibold text-usap-sang">USAP</span> – {m.opponent_name}
                                </>
                              ) : (
                                <>
                                  {m.opponent_name} – <span className="font-semibold text-usap-sang">USAP</span>
                                </>
                              )}
                            </Link>
                            <span className="block text-xs text-muted-foreground">{m.competition_name}</span>
                          </td>
                          <td className="py-1.5 pr-2 text-right font-semibold text-foreground whitespace-nowrap">
                            {m.is_home ? m.score_usap : m.score_opponent} – {m.is_home ? m.score_opponent : m.score_usap}
                          </td>
                          <td className={`py-1.5 text-center font-bold ${l.classe}`}>{l.texte}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground">{t("accueil.ceJourAucun", { date: aujourdhui })}</p>
              )}
            </div>
            <div>
              <SousTitre>{t("accueil.ceJourNes")}</SousTitre>
              {anniversaires.length > 0 ? (
                <table className="w-full border-collapse text-sm">
                  <tbody className="tabular-nums">
                    {anniversaires.map((j) => {
                      const annee = j.birthDate!.getUTCFullYear();
                      return (
                        <tr key={j.id} className={`border-b border-border hover:bg-muted ${j.ecart === 0 ? "font-semibold" : ""}`}>
                          <td className="py-1.5 pr-3 text-muted-foreground whitespace-nowrap">
                            {j.birthDate!.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" })}
                          </td>
                          <td className="py-1.5 pr-3">
                            <JoueurCellule slug={j.slug} firstName={j.firstName} lastName={j.lastName} photoUrl={j.photoUrl} isActive={j.isActive} libelleActuel={t("joueurs.actuel")} />
                          </td>
                          {/* L'âge n'est donné qu'à un vivant : la base porte la
                              date de décès des figures historiques. */}
                          {/* L'âge fêté — celui de l'anniversaire, pas celui
                              d'aujourd'hui —, l'année de cet anniversaire
                              pouvant être la voisine autour du 1er janvier.
                              Un disparu garde son année de naissance. */}
                          <td className="py-1.5 text-right text-muted-foreground whitespace-nowrap">
                            {j.deathDate
                              ? annee
                              : t("accueil.ceJourAge", { n: new Date(now.getFullYear(), now.getMonth(), now.getDate() + j.ecart).getFullYear() - annee })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground">{t("accueil.ceJourNesAucun", { date: aujourdhui })}</p>
              )}
            </div>
            <div>
              <SousTitre>{t("accueil.ceJourIlYA")}</SousTitre>
              {ilYA.length > 0 ? (
                <table className="w-full border-collapse text-sm">
                  <tbody className="tabular-nums">
                    {ilYA.map(({ n, match: m }) => {
                      const l = lettre(m.result);
                      return (
                        <tr key={n} className="border-b border-border hover:bg-muted">
                          <td className="py-1.5 pr-3 font-display text-2xl leading-none text-usap-sang whitespace-nowrap">{t("accueil.ceJourAns", { n })}</td>
                          <td className="py-1.5 pr-3">
                            <Link href={`/matchs/${m.slug}`} className="text-foreground hover:text-usap-sang">
                              {affiche(m)}
                            </Link>
                            <span className="block text-xs text-muted-foreground">
                              {formatDateFR(m.date)}, {m.competition.shortName || m.competition.name}
                            </span>
                          </td>
                          <td className="py-1.5 pr-2 text-right font-semibold text-foreground whitespace-nowrap">
                            {m.isHome ? m.scoreUsap : m.scoreOpponent} – {m.isHome ? m.scoreOpponent : m.scoreUsap}
                          </td>
                          <td className={`py-1.5 text-center font-bold ${l.classe}`}>{l.texte}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground">{t("accueil.ceJourIlYAAucun")}</p>
              )}
            </div>
          </div>
        </section>

        {/* Explorer */}
        <section>
          <Titre>{t("accueil.explorerTitre")}</Titre>
          <ul className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["/saisons", "nav.saisons", "accueil.explorerSaisons"],
                ["/matchs", "nav.matchs", "accueil.explorerMatchs"],
                ["/joueurs", "nav.joueurs", "accueil.explorerJoueurs"],
                ["/statistiques", "nav.statistiques", "accueil.explorerStatistiques"],
                ["/adversaires", "nav.adversaires", "accueil.explorerAdversaires"],
                ["/stades", "nav.stades", "accueil.explorerStades"],
              ] as const
            ).map(([href, nom, desc]) => (
              <li key={href}>
                <Link href={href} className="font-semibold text-foreground hover:text-usap-sang">
                  {t(nom)}
                </Link>
                <span className="text-muted-foreground">, {t(desc)}.</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

/** Un classement court de la saison : le rang, le joueur, la valeur — celui de la page de saison, à cinq noms. */
function ClassementCourt<C>({
  titre,
  lignes,
  valeur,
  libelleActuel,
}: {
  titre: string;
  lignes: { joueur: { slug: string; firstName: string; lastName: string; photoUrl: string | null }; cumul: C }[];
  valeur: (c: C) => string;
  libelleActuel: string;
}) {
  if (lignes.length === 0) return null;
  return (
    <div>
      <SousTitre>{titre}</SousTitre>
      <table className="w-full border-collapse text-sm">
        <tbody className="tabular-nums">
          {lignes.map((l, i) => (
            <tr key={l.joueur.slug} className="border-b border-border hover:bg-muted">
              <td className="w-6 py-1 pr-2 text-right text-muted-foreground">{i + 1}</td>
              <td className="py-1 pr-3">
                {/* « Actuel » est tu : dans la saison en cours, chacun l'est
                    par définition, et la mention quatorze fois n'annonce rien. */}
                <JoueurCellule slug={l.joueur.slug} firstName={l.joueur.firstName} lastName={l.joueur.lastName} photoUrl={l.joueur.photoUrl} isActive={false} libelleActuel={libelleActuel} />
              </td>
              <td className="py-1 text-right whitespace-nowrap font-semibold text-foreground">{valeur(l.cumul)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Le titre d'une colonne dans une section : un h3 en encre, plus petit que le h2 — une hiérarchie, pas une répétition. */
function SousTitre({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 border-b border-foreground pb-1 font-display text-xl uppercase leading-none text-foreground">{children}</h3>;
}

/**
 * Le titre d'une section : la voix condensée de la liste, sous un filet.
 * `sang` est la variante pour un bandeau rouge, où le rouge du titre
 * disparaîtrait : l'or vif, seul or lisible sur le sang.
 */
function Titre({ children, encre = false, sang = false }: { children: React.ReactNode; encre?: boolean; sang?: boolean }) {
  return (
    <h2
      className={`mb-3 border-b-2 pb-1 font-display text-3xl uppercase leading-none ${
        sang ? "border-usap-or-vif text-usap-or-vif" : encre ? "border-foreground text-foreground" : "border-usap-sang text-usap-sang"
      }`}
    >
      {children}
    </h2>
  );
}

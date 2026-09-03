/**
 * Crée les vingt-sept matchs de la saison 2005-2006 : les vingt-six journées
 * du championnat et la demi-finale, perdue 12-9 à Biarritz.
 *
 * Elle finit **quatrième avec 84 points** — 18 victoires, aucun nul,
 * 8 défaites, 671 points marqués pour 398 encaissés, 9 bonus offensifs et
 * 3 défensifs. Biarritz est champion, aux dépens de Toulouse.
 *
 * **LA PLUS ANCIENNE SAISON DE LA BASE, ET LA PREMIÈRE DU TOP 14** : le
 * championnat passe de seize clubs à quatorze en 2005-2006, d'où vingt-six
 * journées au lieu de trente. L'archive de la LNR remonte d'une saison de plus
 * — 2004-2005 répond encore, avec ses trente journées de Top 16 — et s'arrête
 * là : 2003-2004 rend 404.
 *
 * QUATRIÈME SAISON SANS CLASSEMENT LNR, après 2006-2007, 2007-2008 et
 * 2008-2009 : la page existe et son tableau ne rend aucun club. Le garde-fou
 * vient donc de **Wikipédia**, avec la réserve habituelle — ce n'est pas une
 * source officielle. Elle se valide toutefois d'elle-même : 18×4 + 12 bonus
 * font bien les 84 points annoncés.
 *
 * LE BANC N'A QUE SEPT REMPLAÇANTS : les feuilles portent **22 joueurs**,
 * comme en 2006-2007 et 2007-2008. `effectifDeFeuille` le sait, et la borne
 * basse de cette règle recule encore d'un an sans être atteinte.
 *
 * **LA LNR NE PUBLIE AUCUN CHANGEMENT SUR CETTE SAISON**, et c'est nouveau :
 * les vingt-sept feuilles en portent zéro, quand celles de 2006-2007 en
 * donnent une douzaine par match. Les faits de match, eux, sont là. Ce script
 * n'en souffre pas — il ne compte que des totaux —, mais
 * `seed-opponent-sheet.ts` en dépend pour reconstituer les temps de jeu, et
 * il ne peut donc pas les écrire (cf. CLAUDE.md).
 *
 * CINQ JOURNÉES SONT AMPUTÉES SUR LE CALENDRIER ARCHIVÉ — J2, J6, J15, J17 et
 * J18 —, contre trois en 2006-2007. Et le balayage des identifiants n'y suffit
 * plus : les journées de février et mars ne sont pas jouées dans l'ordre, si
 * bien que leurs identifiants s'entrelacent. Ce sont les **clubs absents de la
 * page** qui désignent la rencontre. `FEUILLES_HORS_CALENDRIER` de
 * `lib/lnr.ts` les donne en dur, avec la démonstration de leurs scores.
 *
 * UNE FEUILLE EST MUETTE — J8 à Bayonne, aucun fait de match là où il en
 * faudrait dix. Son score est connu, 15-33, sa décomposition ne l'est pas :
 * compteurs à `null`, et son bonus déduit du classement.
 *
 * LA DEMI-FINALE N'A NI COMPOSITION NI FAIT, et la LNR la place à une heure du
 * matin. Trois choses viennent donc de Wikipédia : ses réalisations — trois
 * pénalités de chaque côté, plus un drop biarrot —, sa mi-temps de 6-3, et
 * son terrain neutre, le stade de la Mosson de Montpellier. Son coup d'envoi
 * à 01:00 est traité comme « heure inconnue », faute de quoi la rencontre
 * reculerait au 1er juin (cf. `momentDuMatch`).
 *
 * PAS DE COUPE D'EUROPE EN BASE : le flux de l'EPCR ne rend rien avant
 * 2020-2021.
 *
 * ATTENTION AU SCORE COURANT : jusqu'en 2016-2017 inclus, il crédite neuf
 * points à un essai de pénalité, la transformation — qu'il fallait alors
 * encore jouer — y étant comptée deux fois. `lireFeuille` le corrige.
 *
 * Ce que le script écrit : la rencontre elle-même — date et heure,
 * compétition, journée, adversaire, lieu, score, réalisations des deux camps,
 * résultat, bonus et arbitre —, plus les agrégats de la saison. **Pas les
 * compositions ni les chronologies.**
 *
 * Sources : LNR (calendrier, feuilles, compositions) ; Wikipédia pour le
 * classement de la phase régulière, les cinq scores hors calendrier, et la
 * demi-finale.
 *
 * Usage : npx tsx scripts/seed-season-2005-2006.ts [--dry]
 */
import { PrismaClient, MatchResult, Prisma } from "@prisma/client";
import {
  lireCalendrier,
  lireFeuille,
  lireCompositions,
  momentDuMatch,
  realisationsDepuisFaits as realisations,
  type Realisations,
  type Camp,
} from "./lib/lnr";
import { trouverOuCreerArbitre } from "./lib/arbitres";
import { CLUBS_LNR } from "./lib/clubs";
import { computeBonuses, matchPoints } from "../src/lib/scoring";
import { generateMatchSlug, generateOpponentSlug } from "../src/lib/slugs";
import { completerRealisations } from "./lib/feuilles";
import { preserverAnnexes } from "./lib/saison";
import { terrainDuMatch } from "./lib/stades";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

const SAISON = "2005-2006";
const JOURNEES = 26;

async function trouverAdversaire(nom: string): Promise<string> {
  const trouve = await prisma.opponent.findFirst({
    where: { OR: [{ shortName: nom }, { name: nom }] },
    select: { id: true },
  });
  if (trouve) return trouve.id;
  throw new Error(`adversaire « ${nom} » introuvable en base`);
}

/**
 * Aucun club à créer : les treize adversaires de 2006-2007 sont tous en base,
 * arrivés avec les saisons plus récentes — Agen et Narbonne compris.
 */
const NOUVEAUX_ADVERSAIRES: Array<{
  name: string;
  shortName: string;
  city: string;
  pays: string;
}> = [];

/**
 * Aucun score corrigé sur cette saison.
 *
 * Les vingt et un scores que la LNR publie et les cinq que Wikipédia fournit
 * pour les journées amputées totalisent exactement les 671 points marqués et
 * 398 encaissés du classement, pour 18 victoires et 8 défaites — trois
 * égalités indépendantes, sans marge. Rien à contredire ici, à la différence
 * de la troisième journée de 2006-2007.
 */
const SCORES_CORRIGES: Record<string, { usap: number; adverse: number }> = {};

/**
 * FEUILLES DONT LA LNR NE PUBLIE PAS DE QUOI RECONSTITUER LE SCORE.
 *
 * **J8 à Bayonne, 15-33** : la feuille ne porte aucun fait de match là où il
 * en faudrait dix. Le score est connu, sa décomposition ne l'est pas, et
 * Wikipédia ne détaille pas les réalisations de cette saison.
 *
 * **J26 à Brive, 14-42**, et d'un seul côté. La feuille nomme cinq essais
 * catalans, tous transformés à en croire ses propres incréments, soit
 * trente-cinq points pour quarante-deux au score du calendrier. Sept points
 * manquent — un essai transformé — et son score courant est de surcroît deux
 * points trop haut à partir de la 73e, où il fait gagner neuf points à un
 * essai. Aucune combinaison ne s'impose : six essais et six transformations
 * est la plus économique, mais cinq essais, quatre transformations et trois
 * pénalités font tout aussi bien quarante-deux, et la feuille ne nomme aucune
 * pénalité catalane. Compteurs catalans à `null` ; **ceux de Brive restent
 * écrits**, ses trois pénalités et son essai reconstituant ses quatorze points
 * exactement, d'où `camps`.
 *
 * **LEURS BONUS SE DÉDUISENT DU CLASSEMENT, ET ILS N'ONT QU'UNE SOLUTION.**
 * Les deux rencontres sont des victoires par dix-huit et vingt-huit points :
 * aucune ne peut porter de bonus défensif, dont le classement annonce trois et
 * dont les feuilles lisibles donnent exactement trois — les défaites de deux,
 * sept et trois points des J10, J16 et J22. Reste l'offensif, et le classement
 * en annonce neuf quand les vingt-quatre journées lisibles n'en donnent que
 * sept. Les deux indécidables les portent donc toutes les deux, et le
 * garde-fou de fin de script le vérifie. Ce n'est pas une supposition, c'est
 * une contrainte qui n'a qu'une solution.
 *
 * Elle est d'ailleurs plausible sur le score seul : trente-trois points à
 * Bayonne et quarante-deux à Brive se font difficilement sans quatre essais,
 * qui suffisaient au bonus en 2005-2006.
 */
interface SansDetail {
  bonusOffensif: boolean;
  bonusDefensif: boolean;
  /**
   * Camps dont la décomposition est indécidable. **Les deux par défaut** — une
   * feuille muette ne dit rien de personne. La J26 est le cas partiel : sa
   * feuille reconstitue les quatorze points de Brive au point près, et échoue
   * sur les quarante-deux de l'USAP.
   */
  camps?: ("usap" | "adversaire")[];
}

const FEUILLES_SANS_FAITS: Record<string, SansDetail> = {
  j8: { bonusOffensif: true, bonusDefensif: false },
  j26: { bonusOffensif: true, bonusDefensif: false, camps: ["usap"] },
};

/**
 * Scores à la mi-temps. La LNR ne les publie jamais ; Wikipédia détaille en
 * revanche le déroulé des phases finales, et donne 6-3 pour Biarritz à la
 * pause de la demi-finale.
 */
const MI_TEMPS: Record<string, { usap: number; adverse: number }> = {
  "demi-finales": { usap: 3, adverse: 6 },
};

async function assurerAdversaires() {
  for (const club of NOUVEAUX_ADVERSAIRES) {
    if (await prisma.opponent.findFirst({ where: { shortName: club.shortName } })) continue;
    if (DRY_RUN) {
      console.log(`  [adversaire] à créer : ${club.name}`);
      continue;
    }
    const pays = await prisma.country.findFirst({ where: { code: club.pays } });
    const cree = await prisma.opponent.create({
      data: {
        name: club.name,
        shortName: club.shortName,
        city: club.city,
        countryId: pays?.id ?? null,
        slug: `temp-${club.shortName.toLowerCase()}`,
      },
    });
    await prisma.opponent.update({
      where: { id: cree.id },
      data: { slug: generateOpponentSlug(club.name, cree.id) },
    });
    console.log(`  [adversaire] créé : ${club.name}`);
  }
}

interface Rencontre {
  date: Date;
  kickoffTime: string | null;
  competitionShortName: string;
  matchday: number | null;
  round: string | null;
  isHome: boolean;
  opponentNom: string;
  scoreUsap: number;
  scoreOpponent: number;
  halfTimeUsap: number | null;
  halfTimeOpponent: number | null;
  arbitre: string | null;
  attendance: number | null;
  usap: Realisations;
  adverse: Realisations;
  /** Renseigné quand la feuille ne permet pas de reconstituer le score :
   *  compteurs inconnus, bonus repris d'une autre source
   *  (cf. `FEUILLES_SANS_FAITS`). */
  sansDetail?: SansDetail;
}

/**
 * Les vingt-six journées de Top 14 et la demi-finale, depuis la LNR.
 *
 * Quatrième de la phase régulière, l'USAP dispute la demi-finale et la perd
 * 12-9 à Biarritz ; il n'y a donc pas de finale. La demi-finale n'a pas de
 * journée : elle porte un libellé de tour, d'où `estCouperet()` déduira
 * qu'elle n'attribue pas de bonus.
 */
async function championnat(echecs: string[]): Promise<Rencontre[]> {
  const rencontres: Rencontre[] = [];
  const phases = [
    ...Array.from({ length: JOURNEES }, (_, i) => `j${i + 1}`),
    "demi-finales",
  ];
  /** Libellé de tour, pour les phases qui n'ont pas de journée. */
  const TOURS: Record<string, string> = { "demi-finales": "Demi-finale" };
  for (const phase of phases) {
    const n = phase.startsWith("j") ? Number(phase.slice(1)) : null;
    // Cinq journées sont amputées sur le calendrier archivé, et la rencontre
    // de l'USAP y manque : `lireCalendrier` prend le relais sur sa propre
    // table, partagée par toute la chaîne (cf. `lib/lnr.ts`).
    const carte = await lireCalendrier(SAISON, phase);
    if (!carte) {
      echecs.push(`${phase} : aucun match de l'USAP au calendrier`);
      continue;
    }
    const isHome = carte.recevant === "perpignan";
    const adversaireSlug = isHome ? carte.visiteur : carte.recevant;
    const nom = CLUBS_LNR[adversaireSlug];
    if (!nom) {
      echecs.push(`${phase} : club « ${adversaireSlug} » inconnu de la table`);
      continue;
    }

    const feuille = await lireFeuille(carte.url);
    if ((feuille.campUsap === "home") !== isHome) {
      echecs.push(`${phase} : la feuille et le calendrier ne s'accordent pas sur le terrain`);
      continue;
    }
    if (!feuille.coupDEnvoi) {
      echecs.push(`${phase} : coup d'envoi introuvable sur la feuille`);
      continue;
    }
    const campAdverse: Camp = isHome ? "away" : "home";
    // Le score du calendrier fait foi partout, sauf là où on peut démontrer
    // qu'il est faux — cf. `SCORES_CORRIGES`.
    const corrige = SCORES_CORRIGES[phase];
    const scoreUsap = corrige?.usap ?? (isHome ? carte.scoreRecevant : carte.scoreVisiteur);
    const scoreOpponent =
      corrige?.adverse ?? (isHome ? carte.scoreVisiteur : carte.scoreRecevant);

    // La LNR omet parfois des points : `completerRealisations` ajoute ce
    // qu'une autre source établit, et le contrôle ci-dessous le vérifie.
    const jourFeuille = feuille.coupDEnvoi.slice(0, 10);
    const usap = completerRealisations(
      jourFeuille,
      "usap",
      realisations(feuille.faits, feuille.campUsap, scoreUsap),
    );
    const adverse = completerRealisations(
      jourFeuille,
      "adversaire",
      realisations(feuille.faits, campAdverse, scoreOpponent),
    );
    // Une feuille qui ne permet pas de reconstituer le score met le contrôle
    // en échec pour toujours, et il n'aurait rien à dire : le camp concerné en
    // est dispensé, et lui seul. Cf. `FEUILLES_SANS_FAITS`.
    const sansDetail = FEUILLES_SANS_FAITS[phase];
    const indecidables = sansDetail?.camps ?? (sansDetail ? ["usap", "adversaire"] : []);
    const indecidableUsap = indecidables.includes("usap");
    const indecidableAdverse = indecidables.includes("adversaire");
    // **UN SCORE CORRIGÉ NE DISPENSE PAS DU CONTRÔLE.** Il en a dispensé, et
    // la J3 y a écrit une décomposition fausse en silence — cf. l'entrée `j3`
    // de `FEUILLES_SANS_FAITS`. Ce qui dispense, c'est de déclarer le camp
    // indécidable, ce qui se lit dans la table et se démontre à côté.
    if (!indecidableUsap || !indecidableAdverse) {
      const ecart: string[] = [];
      if (!indecidableUsap && usap.total !== scoreUsap) {
        ecart.push(`USAP ${usap.total} pour ${scoreUsap}`);
      }
      if (!indecidableAdverse && adverse.total !== scoreOpponent) {
        ecart.push(`${nom} ${adverse.total} pour ${scoreOpponent}`);
      }
      if (ecart.length > 0) {
        echecs.push(`${phase} : réalisations incohérentes — ${ecart.join(", ")}`);
        continue;
      }
    }
    if (
      (!indecidableUsap || usap.total === scoreUsap) &&
      (!indecidableAdverse || adverse.total === scoreOpponent) &&
      sansDetail
    ) {
      // **Le garde-fou porte sur la reconstitution, pas sur le nombre de
      // faits.** Ces feuilles-là n'en sont pas vides : trois portent un carton
      // jaune et rien d'autre, une porte les seuls points de l'adversaire. Ce
      // qui les qualifie, c'est qu'elles ne permettent pas de retrouver le
      // score. Si un jour elles le permettent, la table doit disparaître
      // plutôt que de masquer une source devenue exploitable.
      echecs.push(
        `${phase} : le score se reconstitue désormais — ` +
          "retirer la phase de FEUILLES_SANS_FAITS",
      );
      continue;
    }

    let arbitre: string | null = null;
    try {
      arbitre = (await lireCompositions(carte.url)).arbitre;
    } catch {
      // La LNR ne publie pas les compositions de toutes ses archives : sans
      // elles, pas d'arbitre, ce qui n'empêche pas de créer la rencontre.
    }

    // Un coup d'envoi à 00:00 veut dire « heure inconnue » (cf. `momentDuMatch`).
    const moment = momentDuMatch(feuille.coupDEnvoi);
    rencontres.push({
      date: moment.date,
      kickoffTime: moment.kickoffTime,
      competitionShortName: "Top 14",
      matchday: n,
      round: n != null ? null : (TOURS[phase] ?? null),
      isHome,
      opponentNom: nom,
      scoreUsap,
      scoreOpponent,
      halfTimeUsap: MI_TEMPS[phase]?.usap ?? null,
      halfTimeOpponent: MI_TEMPS[phase]?.adverse ?? null,
      arbitre,
      attendance: null,
      usap,
      adverse,
      sansDetail,
    });
  }
  return rencontres;
}

async function cloreLaSaison(seasonId: string, startYear: number) {
  const journees = await prisma.match.findMany({
    where: { seasonId, matchday: { not: null } },
    select: { result: true, scoreUsap: true, scoreOpponent: true, bonusOffensif: true, bonusDefensif: true },
  });
  if (journees.length !== JOURNEES) {
    console.log(`\n  ⚠ ${journees.length} journées trouvées pour ${JOURNEES} attendues — agrégats non écrits`);
    return;
  }

  // `scoreUsap` et `result` sont nullables depuis que les calendriers à venir
  // entrent en base : une saison close n'en porte pas, mais le type l'ignore.
  const jouees = journees.filter(
    (m): m is typeof m & { scoreUsap: number; scoreOpponent: number; result: MatchResult } =>
      m.scoreUsap != null && m.scoreOpponent != null && m.result != null,
  );
  if (jouees.length !== journees.length) {
    console.log(
      `\n  ⚠ ${journees.length - jouees.length} journée(s) sans score — agrégats non écrits`,
    );
    return;
  }

  const compte = (r: MatchResult) => jouees.filter((m) => m.result === r).length;
  const agregats = {
    matchesPlayed: jouees.length,
    wins: compte(MatchResult.VICTOIRE),
    draws: compte(MatchResult.NUL),
    losses: compte(MatchResult.DEFAITE),
    pointsFor: jouees.reduce((s, m) => s + m.scoreUsap, 0),
    pointsAgainst: jouees.reduce((s, m) => s + m.scoreOpponent, 0),
    bonusOffensif: jouees.filter((m) => m.bonusOffensif).length,
    bonusDefensif: jouees.filter((m) => m.bonusDefensif).length,
    // Quatrième de la phase régulière, éliminée en demi-finale.
    finalRanking: 4,
  };
  const points = jouees.reduce(
    (s, m) => s + matchPoints(m.result, m.bonusOffensif, m.bonusDefensif, startYear),
    0,
  );

  console.log(
    `\n  saison : ${agregats.wins}V ${agregats.draws}N ${agregats.losses}D — ` +
      `${agregats.pointsFor} pts pour / ${agregats.pointsAgainst} contre — ` +
      `${agregats.bonusOffensif} BO, ${agregats.bonusDefensif} BD — ${points} points — ` +
      `${agregats.finalRanking}e`,
  );
  // Chiffres de la phase régulière selon **Wikipédia**, la LNR ne publiant
  // aucun classement pour 2005-2006 — sa page existe et son tableau ne rend
  // pas un seul club (cf. l'en-tête). Source non officielle, mais éprouvée au
  // point près sur 2009-2010.
  //
  // ELLE SÉPARE L'OFFENSIF DU DÉFENSIF, ce que les pages de la LNR ne font
  // pas : le contrôle porte sur les deux bonus pris un à un. C'est ce qui rend
  // décidable le bonus de la feuille muette de la huitième journée
  // (cf. `FEUILLES_SANS_FAITS`).
  //
  // **Et il porte à faux si la demi-finale entre dans le compte** : elle n'a
  // pas de journée, `cloreLaSaison` ne retient que les rencontres qui en ont,
  // et les 26 journées se comptent donc seules. La défaite de Biarritz ne doit
  // pas s'ajouter aux huit du classement.
  const OFFICIEL = {
    wins: 18, draws: 0, losses: 8, pointsFor: 671, pointsAgainst: 398,
    points: 84, bonusOffensif: 9, bonusDefensif: 3,
  };
  const ecarts = [
    agregats.wins !== OFFICIEL.wins ? `${agregats.wins}V pour ${OFFICIEL.wins}` : null,
    agregats.draws !== OFFICIEL.draws ? `${agregats.draws}N pour ${OFFICIEL.draws}` : null,
    agregats.losses !== OFFICIEL.losses ? `${agregats.losses}D pour ${OFFICIEL.losses}` : null,
    agregats.pointsFor !== OFFICIEL.pointsFor
      ? `${agregats.pointsFor} marqués pour ${OFFICIEL.pointsFor}` : null,
    agregats.pointsAgainst !== OFFICIEL.pointsAgainst
      ? `${agregats.pointsAgainst} encaissés pour ${OFFICIEL.pointsAgainst}` : null,
    points !== OFFICIEL.points ? `${points} points pour ${OFFICIEL.points}` : null,
    agregats.bonusOffensif !== OFFICIEL.bonusOffensif
      ? `${agregats.bonusOffensif} BO pour ${OFFICIEL.bonusOffensif}` : null,
    agregats.bonusDefensif !== OFFICIEL.bonusDefensif
      ? `${agregats.bonusDefensif} BD pour ${OFFICIEL.bonusDefensif}` : null,
  ].filter(Boolean);
  if (ecarts.length > 0) {
    console.log(`  ⚠ écart avec le classement de référence : ${ecarts.join(", ")} — agrégats non écrits`);
    return;
  }
  console.log("  ✔ conforme au classement de la phase régulière (Wikipédia)");

  if (!DRY_RUN) {
    await prisma.season.update({
      where: { id: seasonId },
      // Quatrième : ni championne, ni promue, ni reléguée.
      data: { ...agregats, totalPoints: points, champion: false, promoted: false, relegated: false },
    });
  }
}

async function main() {
  console.log(`=== Saison ${SAISON}${DRY_RUN ? " (simulation)" : ""} ===\n`);

  // La LNR sépare ses deux divisions sur deux sites, et `top14` est la valeur
  // par défaut du module : rien à basculer pour une saison de première
  // division.

  const saison = await prisma.season.findFirstOrThrow({ where: { label: SAISON } });
  await assurerAdversaires();

  const echecs: string[] = [];
  const rencontres = (await championnat(echecs)).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  let crees = 0;
  let majs = 0;

  for (const r of rencontres) {
    const jour = r.date.toISOString().slice(0, 10);
    const competition = await prisma.competition.findFirstOrThrow({
      where: { shortName: r.competitionShortName },
    });
    const opponentId = DRY_RUN
      ? await trouverAdversaire(r.opponentNom).catch(() => "")
      : await trouverAdversaire(r.opponentNom);

    // La demi-finale est un couperet : pas de bonus.
    const isKnockout = r.matchday == null && !(r.round ?? "").startsWith("Poule");
    // Sans essais, le bonus offensif ne se calcule pas : il est repris tel
    // quel de la source qui le donne (cf. `FEUILLES_SANS_FAITS`).
    const bonus = r.sansDetail ?? computeBonuses({
      competitionShortName: r.competitionShortName,
      seasonStartYear: saison.startYear,
      isKnockout,
      scoreUsap: r.scoreUsap,
      scoreOpponent: r.scoreOpponent,
      triesUsap: r.usap.essais + r.usap.essaisDePenalite,
      triesOpponent: r.adverse.essais + r.adverse.essaisDePenalite,
    });

    const resultat =
      r.scoreUsap > r.scoreOpponent
        ? MatchResult.VICTOIRE
        : r.scoreUsap < r.scoreOpponent
          ? MatchResult.DEFAITE
          : MatchResult.NUL;

    // Quels camps la feuille ne permet pas de décomposer. Les deux, sauf J3.
    const indecidables = r.sansDetail?.camps ?? (r.sansDetail ? ["usap", "adversaire"] : []);
    const sansUsap = indecidables.includes("usap");
    const sansAdverse = indecidables.includes("adversaire");

    const marques = sansUsap
      ? "détail inconnu"
      : [
      r.usap.essais ? `${r.usap.essais}E` : null,
      r.usap.transformations ? `${r.usap.transformations}T` : null,
      r.usap.penalites ? `${r.usap.penalites}P` : null,
      r.usap.drops ? `${r.usap.drops}D` : null,
      r.usap.essaisDePenalite ? `${r.usap.essaisDePenalite}EP` : null,
        ]
          .filter(Boolean)
          .join(" ");
    console.log(
      `${jour} ${r.kickoffTime ?? "  :  "} ${(r.matchday ? `J${r.matchday}` : (r.round ?? "")).padEnd(18)} ` +
        `${r.isHome ? "H" : "A"} ${r.opponentNom.padEnd(16)} ${r.scoreUsap}-${r.scoreOpponent}` +
        `${bonus.bonusOffensif ? " BO" : ""}${bonus.bonusDefensif ? " BD" : ""}` +
        ` | ${marques}${r.arbitre ? ` | ${r.arbitre}` : ""}${r.attendance ? ` | ${r.attendance} spect.` : ""}`,
    );

    if (DRY_RUN) continue;

    const existant = await prisma.match.findFirst({
      where: {
        seasonId: saison.id,
        opponentId,
        date: {
          gte: new Date(`${jour}T00:00:00Z`),
          lt: new Date(`${jour}T23:59:59Z`),
        },
      },
      select: {
        id: true,
        halfTimeUsap: true,
        halfTimeOpponent: true,
        attendance: true,
        videoUrl: true,
      },
    });

    // Le terrain d'alors, pas celui d'aujourd'hui : `terrainDuMatch` lit
    // l'historique des stades et les lieux particuliers (cf. lib/stades.ts).
    const venueId = await terrainDuMatch(prisma, {
      opponentId,
      isHome: r.isHome,
      startYear: saison.startYear,
      jour,
    });

    const donnees: Prisma.MatchUncheckedCreateInput = {
      slug: generateMatchSlug({
        competitionShortName: competition.shortName,
        competitionName: competition.name,
        opponentShortName: r.opponentNom,
        opponentName: r.opponentNom,
        isHome: r.isHome,
        matchday: r.matchday,
        round: r.round,
        date: r.date,
      }),
      date: r.date,
      kickoffTime: r.kickoffTime,
      seasonId: saison.id,
      competitionId: competition.id,
      matchday: r.matchday,
      round: r.round,
      isHome: r.isHome,
      venueId,
      opponentId,
      scoreUsap: r.scoreUsap,
      scoreOpponent: r.scoreOpponent,
      halfTimeUsap: r.halfTimeUsap,
      halfTimeOpponent: r.halfTimeOpponent,
      result: resultat,
      bonusOffensif: bonus.bonusOffensif,
      bonusDefensif: bonus.bonusDefensif,
      refereeId: r.arbitre ? await trouverOuCreerArbitre(prisma, r.arbitre, false) : null,
      attendance: r.attendance,
      // `null` se lit « on ne sait pas », jamais « zéro » : certaines feuilles
      // ne permettent pas de reconstituer le score, et la J3 ne l'interdit que
      // d'un côté (cf. `FEUILLES_SANS_FAITS`).
      triesUsap: sansUsap ? null : r.usap.essais,
      conversionsUsap: sansUsap ? null : r.usap.transformations,
      penaltiesUsap: sansUsap ? null : r.usap.penalites,
      dropGoalsUsap: sansUsap ? null : r.usap.drops,
      penaltyTriesUsap: sansUsap ? null : r.usap.essaisDePenalite,
      triesOpponent: sansAdverse ? null : r.adverse.essais,
      conversionsOpponent: sansAdverse ? null : r.adverse.transformations,
      penaltiesOpponent: sansAdverse ? null : r.adverse.penalites,
      dropGoalsOpponent: sansAdverse ? null : r.adverse.drops,
      penaltyTriesOpponent: sansAdverse ? null : r.adverse.essaisDePenalite,
    };

    if (existant) {
      // Une relance ne doit pas effacer ce que la LNR ne donne pas
      // (cf. lib/saison.ts) : mi-temps, affluence et vidéo viennent d'ailleurs.
      await prisma.match.update({
        where: { id: existant.id },
        data: preserverAnnexes(donnees, existant),
      });
      majs++;
    } else {
      await prisma.match.create({ data: donnees });
      crees++;
    }
  }

  await cloreLaSaison(saison.id, saison.startYear);

  console.log(
    `\n=== ${rencontres.length} rencontre(s) lue(s)` +
      (DRY_RUN ? "" : `, ${crees} créée(s), ${majs} mise(s) à jour`) +
      `, ${echecs.length} en échec ===`,
  );
  for (const e of echecs) console.log(`  ⚠ ${e}`);
  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

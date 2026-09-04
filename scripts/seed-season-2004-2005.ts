/**
 * Crée les trente matchs de la saison 2004-2005 : la phase de classement du
 * **Top 16**, l'USAP finissant cinquième et ne disputant pas la phase finale.
 *
 * **LA PLUS ANCIENNE SAISON QUE LA LNR ARCHIVE, ET LA DERNIÈRE DU TOP 16.** Le
 * championnat compte alors seize clubs et trente journées ; il passera à
 * quatorze clubs et vingt-six journées en 2005-2006.
 * `/calendrier-et-resultats/2003-2004/j1` rend 404 : on ne remontera pas
 * au-delà par cette source.
 *
 * **ELLE ATTESTE LA BASCULE DU BARÈME, QUI N'ÉTAIT QUE SUPPOSÉE.** CLAUDE.md
 * posait que le 3/2/1 sans bonus cède au 4/2/0 avec bonus en 2004-2005, en
 * réservant que « seule la saison d'application est attestée par les
 * classements ». C'est désormais attesté ici : le classement de Wikipédia
 * porte deux colonnes BO et BD, et 18×4 + 1×2 + 9 + 3 font bien les 86 points
 * annoncés. Avec le vieux barème, la même ligne en vaudrait 67.
 *
 * **LA LNR NE PUBLIE NI FAIT NI CHANGEMENT SUR CETTE SAISON.** Aucune des
 * trente feuilles ne porte un seul essai, carton ou remplacement — vérifié sur
 * treize d'entre elles, réparties sur toute la saison. C'est un cran de plus
 * que 2005-2006, où les faits étaient là et les changements absents. Il n'y a
 * donc ni marqueur, ni chronologie, ni temps de jeu, et les **compteurs de
 * réalisations des trente rencontres sont à `null`**.
 *
 * **CE QUI BLOQUE LES AGRÉGATS : LES NEUF BONUS OFFENSIFS.** Le bonus défensif
 * se lit sur le seul score — une défaite de sept points au plus — et les trois
 * annoncés se retrouvent exactement. L'offensif, lui, se compte en essais, et
 * la LNR n'en publie aucun ; allrugby.com, qui marque le bonus match par match
 * à partir de 2006-2007, ne couvre de cette saison que les rencontres de
 * Clermont. Aucune source ne place donc les neuf, et le script **refuse
 * d'écrire les agrégats de la saison** — comme 2006-2007 l'a fait jusqu'à ce
 * qu'une source revienne en ligne. Les trente rencontres, elles, sont écrites.
 *
 * ET LA LNR SE TROMPE SUR UN SCORE. Elle donne 29-23 au Bourgoin-Perpignan de
 * la seizième journée ; Wikipédia donne 33-23. Deux démonstrations
 * indépendantes la contredisent :
 *
 *   - avec les scores de la LNR, la colonne des **points marqués** de la
 *     saison retombe sur les 688 annoncés **au point près**, quand celle des
 *     **points encaissés** vaut 579 pour 583 — quatre de moins, et J16 est la
 *     seule rencontre où les deux sources divergent, de exactement quatre
 *     points ;
 *   - le **compte des bonus défensifs** tranche dans le même sens : une
 *     défaite 23-29 en donne un, une défaite 23-33 non. Avec le score de la
 *     LNR, la saison en compte quatre ; avec celui de Wikipédia, exactement
 *     les trois du classement.
 *
 * `SCORES_CORRIGES` porte le cas. C'est le second du projet après la troisième
 * journée de 2006-2007, et il est démontré deux fois plutôt qu'une.
 *
 * TREIZE FEUILLES SUR TRENTE N'ONT PAS DE COMPOSITION, et les dix-sept autres
 * en ont une **vraie** : leur indice alphabétique va de 0,27 à 0,41, le régime
 * des saisons saines, quand les compositions fabriquées de 2005-2006 montaient
 * de 0,55 à 0,95. Toutes portent leurs quinze titulaires — ce que 2005-2006 ne
 * faisait pas. La dégradation de la source n'est donc pas monotone : elle
 * s'aggrave sur les faits et s'améliore sur les compositions.
 *
 * L'effectif de feuille y descend en revanche jusqu'à **dix-sept joueurs**, la
 * LNR en oubliant jusqu'à cinq au banc.
 *
 * PAS DE COUPE D'EUROPE EN BASE : le flux de l'EPCR ne rend rien avant
 * 2020-2021.
 *
 * Ce que le script écrit : la rencontre elle-même — date et heure,
 * compétition, journée, adversaire, lieu, score, résultat, bonus défensif et
 * arbitre. **Ni réalisations, ni agrégats, ni compositions, ni chronologies.**
 *
 * Sources : LNR (calendrier, feuilles, compositions) ; Wikipédia pour le
 * classement de la phase de classement et le score de la seizième journée.
 *
 * Usage : npx tsx scripts/seed-season-2004-2005.ts [--dry]
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

const SAISON = "2004-2005";
const JOURNEES = 30;

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
 * SCORES QUE LA LNR DONNE FAUX, ET QU'UNE AUTRE SOURCE CORRIGE.
 *
 * **Bourgoin-Perpignan de la seizième journée.** La LNR annonce 29-23 ;
 * Wikipédia annonce 33-23. La démonstration est double, et chaque moitié
 * suffirait :
 *
 *   - avec les scores de la LNR pour les trente journées, la colonne des
 *     **points marqués** de la saison retombe sur les 688 du classement, au
 *     point près ; celle des **points encaissés** vaut 579 pour 583 annoncés,
 *     et J16 est la seule rencontre où les deux sources divergent, de
 *     exactement quatre points ;
 *   - le **compte des bonus défensifs** dit la même chose autrement. Le
 *     classement en annonce trois. Les défaites de l'USAP sont 21-24, 33-34 et
 *     19-21 à sept points ou moins — trois —, plus celle de Bourgoin :
 *     23-29 en est une quatrième, 23-33 n'en est pas une. Le compte ne tombe
 *     juste qu'avec le score de Wikipédia.
 *
 * Le bilan, 18 V 1 N 11 D, est identique des deux côtés : la correction ne
 * change pas le résultat, seulement l'écart.
 *
 * C'est le second cas du projet où une autre source l'emporte **contre** le
 * score officiel, après la troisième journée de 2006-2007 — et le premier à
 * être démontré deux fois.
 */
const SCORES_CORRIGES: Record<string, { usap: number; adverse: number }> = {
  j16: { usap: 23, adverse: 33 },
};


/**
 * AUCUNE FEUILLE NE PORTE LE MOINDRE FAIT, ET C'EST TOUTE LA SAISON.
 *
 * Les saisons précédentes avaient une table de rencontres muettes — trois en
 * 2006-2007, une en 2005-2006. Ici la table serait la saison entière : la LNR
 * ne publie pour 2004-2005 ni essai, ni carton, ni score courant, sur aucune
 * des trente journées. Vérifié sur treize feuilles réparties d'août à mai,
 * toutes à zéro fait.
 *
 * Les **compteurs de réalisations sont donc `null` partout** — « on ne sait
 * pas », jamais « zéro » —, et il n'y a ni chronologie ni réalisation par
 * joueur à écrire.
 *
 * **LE BONUS DÉFENSIF SURVIT, L'OFFENSIF NON.** Le premier ne dépend que du
 * score : une défaite de sept points au plus, en 2004-2005. `computeBonuses`
 * le rend donc juste sans connaître un seul essai, et les trois du classement
 * se retrouvent exactement. Le second se compte en essais, et il vaudra
 * toujours `false` faute d'en connaître un seul : c'est pour cela, et pour
 * cela seul, que les agrégats de la saison ne sont pas écrits.
 */
const SANS_AUCUN_FAIT = true;

/**
 * Scores à la mi-temps : aucun. La LNR ne les publie jamais, et l'USAP ne
 * dispute pas de phase finale dont Wikipédia détaillerait le déroulé.
 */
const MI_TEMPS: Record<string, { usap: number; adverse: number }> = {};

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
  /** Vrai sur toute la saison : la LNR n'y publie aucun fait, et les
   *  compteurs de réalisations restent donc inconnus (cf. `SANS_AUCUN_FAIT`). */
  sansDetail: boolean;
}

/**
 * Les trente journées du Top 16, depuis la LNR.
 *
 * Cinquième de la phase de classement, l'USAP ne dispute pas la phase finale,
 * réservée aux quatre premiers : il n'y a donc aucun tour à lire.
 */
async function championnat(echecs: string[]): Promise<Rencontre[]> {
  const rencontres: Rencontre[] = [];
  const phases = Array.from({ length: JOURNEES }, (_, i) => `j${i + 1}`);
  /** Libellé de tour, pour les phases qui n'ont pas de journée. Aucune ici. */
  const TOURS: Record<string, string> = {};
  for (const phase of phases) {
    const n = phase.startsWith("j") ? Number(phase.slice(1)) : null;
    // Aucune journée n'est amputée : les trente pages du calendrier archivé
    // publient bien la rencontre de l'USAP, ce qui n'était le cas ni en
    // 2005-2006 ni en 2006-2007.
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
    // **LE CONTRÔLE ARITHMÉTIQUE N'A RIEN À CONTRÔLER ICI**, la feuille ne
    // portant aucun fait : `realisations()` rend zéro partout, et confronter
    // ce zéro au score échouerait sur les trente journées sans rien apprendre.
    // Il reste néanmoins un garde-fou, et il vaut d'être posé : si la LNR
    // venait à publier ses faits, le zéro cesserait d'être vrai et la table
    // `SANS_AUCUN_FAIT` devrait disparaître plutôt que de masquer une source
    // devenue exploitable.
    if (SANS_AUCUN_FAIT && (usap.total > 0 || adverse.total > 0)) {
      echecs.push(
        `${phase} : la feuille porte désormais des faits — ` +
          "retirer SANS_AUCUN_FAIT et reprendre la saison",
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
      competitionShortName: "Top 16",
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
      sansDetail: SANS_AUCUN_FAIT,
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
    // Cinquième, hors de la phase finale.
    finalRanking: 5,
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
  // Chiffres de la phase de classement selon **Wikipédia**, la LNR ne publiant
  // aucun classement pour 2004-2005. Source non officielle, mais éprouvée au
  // point près sur 2009-2010.
  //
  // ELLE SÉPARE L'OFFENSIF DU DÉFENSIF, ce que les pages de la LNR ne font
  // pas : le contrôle porte sur les deux bonus pris un à un. C'est ce qui rend
  // décidable ce qui peut l'être : ici, le bonus défensif, qui ne dépend que
  // du score.
  //
  // La ligne se reprend telle quelle : cinquième, l'USAP n'a pas de phase
  // finale à retrancher de ses 30 journées.
  const OFFICIEL = {
    wins: 18, draws: 1, losses: 11, pointsFor: 688, pointsAgainst: 583,
    points: 86, bonusOffensif: 9, bonusDefensif: 3,
  };

  // **LES NEUF BONUS OFFENSIFS N'ONT AUCUNE SOURCE, ET LE SCRIPT LE DIT.**
  // Ils se comptent en essais, la LNR n'en publie aucun sur cette saison, et
  // allrugby.com — qui marque le bonus match par match à partir de 2006-2007 —
  // ne couvre de 2004-2005 que les rencontres de Clermont. Le contrôle
  // échouera donc toujours sur cette ligne, et les agrégats ne seront pas
  // écrits : c'est l'état voulu, et il ne se lèvera qu'avec une source.
  //
  // Tout le reste est vérifié au passage, et le vérifier a servi : c'est ce
  // contrôle qui a démontré le score faux de la seizième journée, sur les
  // points encaissés comme sur le compte des bonus défensifs.
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
      // Cinquième : ni championne, ni promue, ni reléguée.
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
    // **Le bonus se calcule quand même, et il n'est juste qu'à moitié.** Sans
    // essai connu, `computeBonuses` rend un bonus offensif toujours faux et un
    // bonus défensif toujours juste, celui-ci ne dépendant que du score. C'est
    // exactement la moitié qu'on sait établir, et c'est pourquoi les agrégats
    // ne sont pas écrits.
    const bonus = computeBonuses({
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

    // Les deux camps, toujours : aucune feuille de la saison ne se décompose.
    const sansUsap = r.sansDetail;
    const sansAdverse = r.sansDetail;

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

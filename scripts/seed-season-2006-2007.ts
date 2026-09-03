/**
 * Crée les vingt-six matchs de la saison 2006-2007 : le championnat seul,
 * l'USAP ne disputant pas la phase finale.
 *
 * Elle finit **cinquième avec 75 points** — 16 victoires, 1 nul, 9 défaites,
 * 493 points marqués pour 398 encaissés, 5 bonus offensifs et 4 défensifs. Le
 * Stade français est champion.
 *
 * TROISIÈME SAISON SANS CLASSEMENT LNR, après 2007-2008 et 2008-2009 : la page
 * existe, son conteneur aussi, et le tableau ne rend **aucun club**. Le
 * garde-fou vient donc de **Wikipédia**, avec la réserve habituelle — ce n'est
 * pas une source officielle. Elle se valide toutefois d'elle-même : 16×4 + 1×2
 * + 9 bonus font bien les 75 points annoncés.
 *
 * LE BARÈME CHANGE ICI, ET C'EST SA BORNE HAUTE. 2006-2007 est la dernière
 * saison du **bonus offensif à quatre essais** ; le différentiel de trois
 * arrive en 2007-2008 (cf. `pointsScaleFor`). Les 5 BO du classement mettent
 * la règle à l'épreuve : un barème faux ferait diverger le compte, et le
 * script refuserait d'écrire.
 *
 * LE BANC N'A QUE SEPT REMPLAÇANTS, comme en 2007-2008 : les feuilles portent
 * **22 joueurs**, vérifié sur les vingt-six. `effectifDeFeuille` le sait. La
 * borne basse de cette règle recule donc d'un an sans être atteinte.
 *
 * TROIS JOURNÉES SONT AMPUTÉES SUR LE CALENDRIER ARCHIVÉ — J6, J11 et J24 —,
 * contre deux en 2007-2008. Le motif est plus net encore : chaque journée
 * aligne 7 rencontres, les pages n'en publient que 6, et l'identifiant
 * manquant est exactement le trou entre deux journées. Les trois feuilles sont
 * complètes, et `FEUILLES_HORS_CALENDRIER` de `lib/lnr.ts` les donne en dur.
 *
 * ET LA LNR SE TROMPE SUR UN SCORE, CE QUI EST NOUVEAU. Elle donne 40-6 au
 * Perpignan-Narbonne de la troisième journée, sur son calendrier **comme dans
 * ses faits** ; Wikipédia donne 45-6. L'arithmétique tranche, et sans appel :
 *
 *   - avec les scores de la LNR, la colonne des **points encaissés** de la
 *     saison retombe sur les 398 annoncés **au point près** ;
 *   - celle des **points marqués** vaut 488 pour 493 annoncés, soit cinq de
 *     moins — et J3 est le seul match où les deux sources divergent, de
 *     exactement cinq points ;
 *   - le bilan, 16 V 1 N 9 D, est identique des deux côtés.
 *
 * La LNR omet donc un essai non transformé, et son calendrier est faux. C'est
 * la première fois du projet qu'on retient une autre source **contre** le
 * score officiel — CLAUDE.md pose ailleurs que le calendrier fait foi, et
 * cette exception-là est démontrée, pas supposée. `SCORES_CORRIGES` la porte.
 *
 * CINQ FEUILLES NE PERMETTENT PAS DE RECONSTITUER LE SCORE — J1, J7 et J20,
 * un seul fait chacune ; J8, qui ne porte que les réalisations albigeoises ;
 * J25, entièrement vide, compositions comprises. Leurs scores sont connus,
 * leur décomposition ne l'est pas, et Wikipédia ne détaille pas les
 * réalisations de cette saison. Elles sont donc écrites avec leurs
 * **compteurs à `null`**, comme l'Albi-Perpignan du 3 novembre 2007.
 *
 * **ET LE CINQUIÈME BONUS OFFENSIF A ÉTÉ TROUVÉ : IL EST À LA J7.** Le
 * classement seul ne pouvait pas le placer — trois journées muettes en étaient
 * capables, et l'arithmétique n'en écartait aucune. La saison est restée sans
 * agrégats pour ce seul chiffre, jusqu'à ce qu'`allrugby.com`, injoignable en
 * août 2026, redevienne consultable : il marque le bonus match par match, et
 * donne « Bo » au Perpignan-Brive 24-13 du 23 septembre 2006.
 *
 * **La source n'est pas officielle, et c'est sa concordance qui la vaut.** Sa
 * lecture des vingt-six journées redonne exactement les bonus déjà établis sur
 * les feuilles lisibles — les quatre offensifs des J3, J15, J17 et J24, les
 * quatre défensifs des J9, J14, J18 et J25 —, sans un écart. Vingt-cinq
 * concordances, une information nouvelle, et le total tombe alors sur les 5 BO
 * et 4 BD du classement. Le garde-fou de fin de script le vérifie ; il ne
 * l'aurait pas laissé passer si la journée avait été mal choisie.
 *
 * Elle confirme au passage le 45-6 de la J3, tout comme Sky Sports.
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
 * classement de la phase régulière et le score de la troisième journée ;
 * allrugby.com pour le bonus offensif de la septième.
 *
 * Usage : npx tsx scripts/seed-season-2006-2007.ts [--dry]
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

const SAISON = "2006-2007";
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
 * SCORES QUE LA LNR DONNE FAUX, ET QU'UNE AUTRE SOURCE CORRIGE.
 *
 * **Perpignan-Narbonne du 30 août 2006, troisième journée.** La LNR annonce
 * 40-6, sur son calendrier comme dans le score courant de ses faits ;
 * Wikipédia annonce 45-6. C'est la première fois du projet qu'on retient une
 * autre source **contre** le score officiel, et la démonstration est
 * arithmétique :
 *
 *   - avec les scores de la LNR pour les vingt-six journées, la colonne des
 *     **points encaissés** de la saison retombe sur les 398 annoncés par le
 *     classement, **au point près** ;
 *   - celle des **points marqués** vaut 488 pour 493 annoncés — cinq de
 *     moins, et J3 est la seule rencontre où les deux sources divergent, de
 *     exactement cinq points ;
 *   - le bilan, 16 V 1 N 9 D, est identique des deux côtés.
 *
 * Une colonne juste au point près et l'autre courte d'exactement l'écart
 * constaté sur un seul match : la LNR omet un essai non transformé. Ce n'est
 * pas la faute connue — sauter une transformation en vaut deux —, c'est un
 * essai entier absent du calendrier et des faits.
 *
 * Le garde-fou de fin de script vérifie la correction : sans elle, il
 * refuserait d'écrire les agrégats.
 */
const SCORES_CORRIGES: Record<string, { usap: number; adverse: number }> = {
  j3: { usap: 45, adverse: 6 },
};

/**
 * FEUILLES DONT LA LNR NE PUBLIE PAS DE QUOI RECONSTITUER LE SCORE.
 *
 * **J1 contre Castres, J7 contre Brive, J20 à Brive** : chacune ne porte
 * qu'un unique fait de match là où il en faudrait dix. Les scores sont connus
 * — 20-16, 24-13 et 22-22 —, leur décomposition ne l'est pas, et Wikipédia ne
 * détaille pas les réalisations de cette saison. Les rencontres sont donc
 * écrites avec leurs **compteurs de réalisations à `null`** : « on ne sait
 * pas », et non « zéro ». C'est le traitement de l'Albi-Perpignan du
 * 3 novembre 2007, et `fix-bonus-points` reconnaît ces matchs.
 *
 * **LE BONUS SE DÉDUIT DU CLASSEMENT, ET IL N'A QU'UNE SOLUTION.** Les trois
 * rencontres sont deux victoires et un nul : aucune ne peut porter de bonus
 * défensif, qui suppose une défaite. Reste l'offensif, et le classement en
 * annonce cinq sur la saison. Si les vingt-trois autres journées les donnent
 * déjà toutes les cinq, ces trois-là n'en ont aucun — et le garde-fou de fin
 * de script le vérifie, refusant d'écrire des agrégats qui s'écarteraient du
 * classement. La valeur ci-dessous est donc contrainte, pas supposée.
 */
interface SansDetail {
  bonusOffensif: boolean;
  bonusDefensif: boolean;
  /**
   * Camps dont la décomposition est indécidable. **Les deux par défaut** — une
   * feuille muette ne dit rien de personne. La J3 est le seul cas partiel : sa
   * feuille reconstitue les six points de Narbonne au point près, et échoue sur
   * les quarante-cinq de l'USAP.
   */
  camps?: ("usap" | "adversaire")[];
}

const FEUILLES_SANS_FAITS: Record<string, SansDetail> = {
  // Un carton jaune pour tout fait, et rien d'autre.
  j1: { bonusOffensif: false, bonusDefensif: false },
  // Perpignan 24-13 Brive : **le cinquième bonus offensif de la saison**, et
  // la seule journée où le classement seul ne pouvait pas le placer. Il est
  // marqué « Bo » par allrugby.com, dont la lecture des vingt-six journées
  // redonne par ailleurs exactement les bonus déjà établis sur les feuilles
  // lisibles — les quatre offensifs des J3, J15, J17 et J24, les quatre
  // défensifs des J9, J14, J18 et J25. Vingt-cinq concordances et une seule
  // information nouvelle : le total tombe alors sur les 5 BO et 4 BD du
  // classement, et le garde-fou de fin de script le vérifie.
  //
  // **La décomposition, elle, reste inconnue — mais elle est contrainte.**
  // Vingt-quatre points avec au moins quatre essais n'ont qu'une solution,
  // quatre essais et deux transformations ; les treize points de Brive en ont
  // plusieurs. Les compteurs restent donc à `null` des deux côtés, faute de
  // pouvoir en écrire un seul sans écrire l'autre.
  j7: { bonusOffensif: true, bonusDefensif: false },
  j20: { bonusOffensif: false, bonusDefensif: false },
  // Perpignan 45-6 Narbonne : **la feuille n'est pas muette, elle est
  // contradictoire**, et du seul côté catalan. Son fait de la 34e est étiqueté
  // « Pénalité » et vaut cinq points à son propre score courant (14-3 → 19-3),
  // là où une pénalité en vaut trois ; il porte de surcroît un
  // `conversionPlayer`, que les deux pénalités narbonnaises de la même feuille
  // n'ont pas. Deux lectures en découlent, et le score de 45 — établi par
  // l'arithmétique de la saison, confirmé depuis par allrugby.com et Sky
  // Sports — n'en départage aucune :
  //
  //   - le fait est un **essai non transformé**, le score courant est juste de
  //     bout en bout, la feuille totalise 40, et il manque un second essai non
  //     transformé : 7 essais, 5 transformations ;
  //   - le fait est bien une **pénalité**, le score courant déraille à partir
  //     de la 34e, la feuille totalise 38, et il manque un essai transformé :
  //     6 essais, 6 transformations, 1 pénalité.
  //
  // Les deux font 45, les deux donnent le bonus offensif — six essais au
  // moins, quand il en fallait quatre en 2006-2007 —, et rien ne tranche. Les
  // compteurs catalans sont donc `null` : « on ne sait pas ». **Ceux de
  // Narbonne restent écrits**, ses deux pénalités reconstituant ses six points
  // exactement, d'où `camps`.
  //
  // Auparavant, le score corrigé dispensait la rencontre de tout contrôle
  // arithmétique, et le script y écrivait 5 essais, 0 transformation et
  // 1 pénalité — vingt-huit points pour quarante-cinq au score. Une
  // décomposition fausse, affirmée en silence.
  j3: { bonusOffensif: true, bonusDefensif: false, camps: ["usap"] },
  // Albi-Perpignan : la feuille porte les quatre réalisations albigeoises,
  // qui reconstituent bien leurs 16 points, et **aucune des catalanes**. Sept
  // points ne peuvent pas faire quatre essais : pas de bonus offensif. Neuf
  // points d'écart : pas de bonus défensif non plus.
  j8: { bonusOffensif: false, bonusDefensif: false },
  // Stade Français-Perpignan : la feuille est **entièrement vide**, ni fait ni
  // changement, et la LNR n'en publie pas non plus les compositions. Onze
  // points ne font pas quatre essais ; la défaite d'un point, elle, donne le
  // bonus défensif — celui-là se lit sur le score seul.
  j25: { bonusOffensif: false, bonusDefensif: true },
};

/**
 * Scores à la mi-temps : aucun. La LNR ne les publie jamais, et cette saison
 * n'a pas de phase finale dont Wikipédia détaillerait le déroulé.
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
  /** Renseigné quand la feuille ne permet pas de reconstituer le score :
   *  compteurs inconnus, bonus repris d'une autre source
   *  (cf. `FEUILLES_SANS_FAITS`). */
  sansDetail?: SansDetail;
}

/**
 * Les vingt-six journées de Top 14, la demi-finale et la finale, depuis la LNR.
 *
 * Les deux phases finales n'ont pas de journée : elles portent un libellé de
 * tour, d'où `estCouperet()` déduira qu'elles n'attribuent pas de bonus.
 */
async function championnat(echecs: string[]): Promise<Rencontre[]> {
  const rencontres: Rencontre[] = [];
  // Le championnat seul : l'USAP finit cinquième et ne dispute pas la phase
  // finale, à laquelle les quatre premiers seulement accédaient.
  const phases = Array.from({ length: JOURNEES }, (_, i) => `j${i + 1}`);
  /** Libellé de tour, pour les phases qui n'ont pas de journée. Aucune ici. */
  const TOURS: Record<string, string> = {};
  for (const phase of phases) {
    const n = phase.startsWith("j") ? Number(phase.slice(1)) : null;
    // Deux journées sont amputées sur le calendrier archivé, et la rencontre
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
  // Chiffres de la phase régulière selon **Wikipédia**, la LNR ne publiant
  // aucun classement pour 2006-2007 — sa page existe et son tableau ne rend
  // pas un seul club (cf. l'en-tête). Source non officielle, mais éprouvée au
  // point près sur 2009-2010.
  //
  // ELLE SÉPARE L'OFFENSIF DU DÉFENSIF, ce que les pages de la LNR ne font
  // pas : le contrôle porte sur les deux bonus pris un à un. C'est ce qui rend
  // décidable le bonus des trois feuilles muettes (cf. `FEUILLES_SANS_FAITS`),
  // et ce qui met à l'épreuve la **borne haute du barème** — 2006-2007 est la
  // dernière saison du bonus offensif à quatre essais, le différentiel de
  // trois arrivant en 2007-2008.
  //
  // La ligne se reprend telle quelle : cinquième, l'USAP n'a pas de phase
  // finale à retrancher de ses 26 journées.
  const OFFICIEL = {
    wins: 16, draws: 1, losses: 9, pointsFor: 493, pointsAgainst: 398,
    points: 75, bonusOffensif: 5, bonusDefensif: 4,
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

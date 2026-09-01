/**
 * Crée les vingt-sept matchs de la saison 2007-2008 : vingt-six journées de
 * Top 14 et la demi-finale.
 *
 * L'USAP finit **quatrième de la phase régulière avec 79 points** — 17
 * victoires, 2 nuls, 7 défaites, 531 points marqués pour 392 encaissés, 4
 * bonus offensifs et 3 défensifs —, puis tombe 21-7 contre Clermont au
 * Vélodrome. Toulouse est champion, vainqueur 26-20 de Clermont en finale.
 *
 * LA LNR NE PUBLIE AUCUN CLASSEMENT POUR CETTE SAISON. Sa page existe, porte
 * bien ses en-têtes de colonnes, et ne contient **pas une ligne de club** —
 * seulement le tableau des phases finales. C'est le second cas après
 * 2008-2009, et le garde-fou vient donc de **Wikipédia**, dont la table s'était
 * révélée exacte au point près sur 2009-2010. Ce n'est pas une source
 * officielle, et la réserve vaut d'être relue avant de s'appuyer sur ces
 * chiffres.
 *
 * Elle se valide toutefois d'elle-même : 17×4 + 2×2 = 72, plus 7 bonus, font
 * bien les 79 points annoncés. Et Wikipédia sépare l'offensif du défensif, ce
 * que les pages de la LNR ne font pas — le contrôle porte donc sur les deux,
 * et non sur leur seule somme.
 *
 * LE BANC N'A QUE SEPT REMPLAÇANTS. Une feuille de 2007-2008 porte **22
 * joueurs**, non 23 : le passage à huit remplaçants se fait la saison suivante
 * (cf. `effectifDeFeuille` de `lib/feuilles.ts`). Rien à faire ici — le script
 * de saison n'écrit pas les compositions —, mais `seed-lineup.ts` attendra 44
 * lignes et non 46.
 *
 * DEUX JOURNÉES SONT AMPUTÉES SUR LE CALENDRIER ARCHIVÉ, et c'est le fait
 * marquant de cette reprise. La page de J11 ne publie que 2 rencontres sur 7,
 * celle de J24 en publie 5 sur 7, et dans les deux cas la rencontre de l'USAP
 * manque — les deux contre Auch. `lireCalendrier` ne peut donc rien en tirer.
 *
 * Les feuilles existent pourtant : les identifiants de la LNR étant
 * séquentiels, elles se retrouvent par balayage entre ceux des rencontres
 * publiées de part et d'autre. D'où `FEUILLES_HORS_CALENDRIER`, qui les donne
 * en dur. Leurs dates expliquent l'omission — 23 février et 30 mai 2008 —,
 * ces deux matchs ayant été reportés et rejoués hors de leur journée.
 *
 * **Les scores donnés dans cette table ne sont pas crus sur parole** : le
 * contrôle des réalisations les confronte aux faits de la feuille officielle,
 * et le script refuse d'écrire une rencontre dont les points ne se
 * reconstituent pas.
 *
 * AUCH EST CRÉÉ ICI. Le FC Auch Gers, monté en 2007-2008 et redescendu
 * aussitôt, est le seul club de la saison que la base ne connaissait pas. Son
 * nom vient de Wikipédia : la LNR ne lui laisse qu'un nom court, sa page de
 * club ayant disparu avec lui — même cas qu'Albi et Bourgoin.
 *
 * LA DEMI-FINALE EST SUR TERRAIN NEUTRE, au Vélodrome de Marseille, quand la
 * feuille désigne Clermont recevant. La déduction habituelle donnerait le
 * Marcel-Michelin : `TERRAINS_PARTICULIERS` de `lib/stades.ts` porte la
 * correction, avec sa source. Sa **mi-temps, 16-0**, vient de Wikipédia elle
 * aussi — la LNR ne publie pas les scores à la pause.
 *
 * PAS DE COUPE D'EUROPE EN BASE, et ce n'est pas un oubli : le flux de l'EPCR
 * ne rend rien avant 2020-2021 et son site n'offre plus que les saisons
 * récentes. La campagne européenne de 2007-2008 restera hors base.
 *
 * ATTENTION AU SCORE COURANT : jusqu'en 2016-2017 inclus, il crédite neuf
 * points à un essai de pénalité, la transformation — qu'il fallait alors
 * encore jouer — y étant comptée deux fois. `lireFeuille` le corrige et porte
 * la démonstration ; il n'y a rien à faire ici.
 *
 * Le barème est celui de 2007-2008 à 2013-2014 : bonus offensif à trois essais
 * d'écart, bonus défensif à sept points. **Cette saison en est la borne
 * basse** — 2006-2007 comptait encore quatre essais —, et le total de 7 bonus
 * la met à l'épreuve : le script refuserait d'écrire si le barème était faux.
 *
 * Ce que le script écrit : la rencontre elle-même — date et heure,
 * compétition, journée, adversaire, lieu, score, réalisations des deux camps,
 * résultat, bonus et arbitre —, plus les agrégats de la saison. **Pas les
 * compositions ni les chronologies**, qui relèvent de `seed-lineup.ts`,
 * `seed-opponent-sheet.ts` et `seed-chronologie.ts`.
 *
 * Sources : LNR (calendrier, feuilles, compositions) ; Wikipédia pour le
 * classement de la phase régulière, le nom d'Auch, le stade et la mi-temps de
 * la demi-finale.
 *
 * Usage : npx tsx scripts/seed-season-2007-2008.ts [--dry]
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
  type LnrRencontre,
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

const SAISON = "2007-2008";
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
 * Un seul club à créer : le **FC Auch Gers**, monté en 2007-2008 et redescendu
 * aussitôt — quatorzième avec 19 points, 3 victoires en 26 journées. Les
 * douze autres adversaires sont déjà en base.
 *
 * Son nom vient de **Wikipédia**, et non de la LNR : celle-ci ne lui laisse
 * que le nom court de ses URL, sa page de club ayant disparu avec lui du
 * championnat. C'est le cas d'Albi et de Bourgoin, et la même réserve vaut —
 * ce n'est pas la source officielle du projet.
 */
const NOUVEAUX_ADVERSAIRES: Array<{
  name: string;
  shortName: string;
  city: string;
  pays: string;
}> = [{ name: "FC Auch Gers", shortName: "Auch", city: "Auch", pays: "FR" }];

/**
 * RENCONTRES QUE LE CALENDRIER ARCHIVÉ NE PUBLIE PAS.
 *
 * La page de J11 ne porte que 2 des 7 rencontres de la journée, celle de J24
 * en porte 5 sur 7 — et les deux manquantes de l'USAP sont ses deux
 * rencontres contre Auch. `lireCalendrier` cherche le lien du match catalan
 * sur la page de la journée : il n'y est pas, et rend `null`.
 *
 * **Les feuilles existent pourtant.** Les identifiants de la LNR sont
 * séquentiels : ceux de J11 vont de 3878 à 3884 sur la page, ceux de J12
 * commencent à 3889 ; un balayage de l'intervalle rend `3883-perpignan-auch`.
 * Même méthode pour J24, dont les identifiants publiés couvrent 3971-3975 et
 * dont J25 commence à 3979 : `3970-auch-perpignan` répond.
 *
 * Leurs dates disent pourquoi elles manquent : **23 février et 30 mai 2008**,
 * hors de leur journée. Ce sont deux matchs reportés, et la page de la journée
 * ne les a jamais listés.
 *
 * **Les scores ci-dessous ne sont pas crus sur parole.** Ils viennent de
 * Wikipédia, mais le contrôle des réalisations les confronte aux faits de la
 * feuille officielle : si les points ne se reconstituent pas, la rencontre est
 * rejetée. C'est le même garde-fou que pour les vingt-cinq autres.
 */
const FEUILLES_HORS_CALENDRIER: Record<string, LnrRencontre> = {
  j11: {
    url: "https://top14.lnr.fr/feuille-de-match/2007-2008/j11/3883-perpignan-auch",
    recevant: "perpignan",
    visiteur: "auch",
    scoreRecevant: 28,
    scoreVisiteur: 23,
  },
  j24: {
    url: "https://top14.lnr.fr/feuille-de-match/2007-2008/j24/3970-auch-perpignan",
    recevant: "auch",
    visiteur: "perpignan",
    scoreRecevant: 13,
    scoreVisiteur: 25,
  },
};

/**
 * FEUILLES DONT LA LNR NE PUBLIE AUCUN FAIT DE MATCH.
 *
 * **Albi-Perpignan du 3 novembre 2007, deuxième journée.** Sa feuille porte
 * les deux compositions et dix changements, mais pas un seul fait : ni essai,
 * ni pénalité, ni carton, et pas d'arbitre non plus. Le score est connu — il
 * vient du calendrier, 16-21 —, sa décomposition ne l'est pas, et **aucune
 * autre source ne la donne** : Wikipédia ne détaille les réalisations que des
 * phases finales.
 *
 * La rencontre est donc écrite avec ses **compteurs de réalisations à
 * `null`** — « on ne sait pas », et non « zéro ». C'est déjà le cas des quatre
 * matchs de Challenge européen de 2022-2023, que `fix-bonus-points` reconnaît
 * et laisse en l'état : « N match(s) sans détail d'essais ».
 *
 * Le bonus, lui, ne peut pas se calculer faute d'essais : il est repris de
 * **Wikipédia**, qui marque le match d'un bonus défensif pour l'USAP et
 * d'aucun pour Albi. L'arithmétique le corrobore — 21-16 fait cinq points
 * d'écart, sous le seuil de sept en vigueur cette saison-là — et seul le bonus
 * offensif resterait indécidable, celui-là dépendant des essais.
 *
 * L'alternative aurait été de laisser la rencontre hors base ; la saison
 * n'aurait alors compté que 25 journées, et les agrégats n'auraient pas pu
 * être écrits du tout, le garde-fou en exigeant 26.
 */
const FEUILLES_SANS_FAITS: Record<string, { bonusOffensif: boolean; bonusDefensif: boolean }> = {
  j2: { bonusOffensif: false, bonusDefensif: true },
};

/**
 * Scores à la mi-temps, que la LNR ne publie jamais.
 *
 * Seule la demi-finale en a un, donné par Wikipédia : Clermont mène 16-0 à la
 * pause avant de l'emporter 21-7. Les vingt-six journées resteront sans, faute
 * de source.
 */
const MI_TEMPS: Record<string, { usap: number; adverse: number }> = {
  "demi-finales": { usap: 0, adverse: 16 },
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
  /** Renseigné quand la LNR ne publie aucun fait : compteurs inconnus, bonus
   *  repris d'une autre source (cf. `FEUILLES_SANS_FAITS`). */
  sansDetail?: { bonusOffensif: boolean; bonusDefensif: boolean };
}

/**
 * Les vingt-six journées de Top 14, la demi-finale et la finale, depuis la LNR.
 *
 * Les deux phases finales n'ont pas de journée : elles portent un libellé de
 * tour, d'où `estCouperet()` déduira qu'elles n'attribuent pas de bonus.
 */
async function championnat(echecs: string[]): Promise<Rencontre[]> {
  const rencontres: Rencontre[] = [];
  // Pas de finale : l'USAP tombe en demi contre Clermont.
  const phases = [
    ...Array.from({ length: JOURNEES }, (_, i) => `j${i + 1}`),
    "demi-finales",
  ];
  /** Libellé de tour, pour les phases qui n'ont pas de journée. */
  const TOURS: Record<string, string> = { "demi-finales": "Demi-finale" };
  for (const phase of phases) {
    const n = phase.startsWith("j") ? Number(phase.slice(1)) : null;
    // Deux journées sont amputées sur le calendrier archivé, et la rencontre
    // de l'USAP y manque : `FEUILLES_HORS_CALENDRIER` prend le relais.
    const carte = (await lireCalendrier(SAISON, phase)) ?? FEUILLES_HORS_CALENDRIER[phase];
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
    const scoreUsap = isHome ? carte.scoreRecevant : carte.scoreVisiteur;
    const scoreOpponent = isHome ? carte.scoreVisiteur : carte.scoreRecevant;

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
    // Une feuille muette ne permet aucune reconstitution : le contrôle serait
    // toujours en échec, et il n'aurait rien à dire. Cf. `FEUILLES_SANS_FAITS`.
    const sansDetail = FEUILLES_SANS_FAITS[phase];
    if (!sansDetail) {
      const ecart: string[] = [];
      if (usap.total !== scoreUsap) ecart.push(`USAP ${usap.total} pour ${scoreUsap}`);
      if (adverse.total !== scoreOpponent) {
        ecart.push(`${nom} ${adverse.total} pour ${scoreOpponent}`);
      }
      if (ecart.length > 0) {
        echecs.push(`${phase} : réalisations incohérentes — ${ecart.join(", ")}`);
        continue;
      }
    } else if (feuille.faits.length > 0) {
      // Si la LNR se met à publier ces faits, la table doit disparaître
      // plutôt que de masquer une source devenue exploitable.
      echecs.push(
        `${phase} : ${feuille.faits.length} fait(s) désormais publiés — ` +
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
  // aucun classement pour 2007-2008 (cf. l'en-tête). Source non officielle,
  // mais éprouvée au point près sur 2009-2010.
  //
  // ELLE SÉPARE L'OFFENSIF DU DÉFENSIF, ce que les pages de classement de la
  // LNR ne font pas : le contrôle porte donc sur les deux bonus pris un à un,
  // et non sur leur seule somme comme pour les saisons voisines. C'est un
  // garde-fou plus serré, et il met à l'épreuve la borne basse du barème —
  // 2007-2008 est la première saison du bonus offensif à trois essais d'écart,
  // et un barème faux ferait diverger le compte.
  //
  // La ligne se reprend telle quelle : quatrième, l'USAP n'a pas de phase
  // finale à retrancher de ses 26 journées.
  const OFFICIEL = {
    wins: 17, draws: 2, losses: 7, pointsFor: 531, pointsAgainst: 392,
    points: 79, bonusOffensif: 4, bonusDefensif: 3,
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
      // Quatrième, éliminée en demi-finale : ni championne, ni promue, ni
      // reléguée.
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

    const marques = r.sansDetail
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
      // `null` se lit « on ne sait pas », jamais « zéro » : la feuille de la
      // deuxième journée ne porte aucun fait (cf. `FEUILLES_SANS_FAITS`).
      triesUsap: r.sansDetail ? null : r.usap.essais,
      conversionsUsap: r.sansDetail ? null : r.usap.transformations,
      penaltiesUsap: r.sansDetail ? null : r.usap.penalites,
      dropGoalsUsap: r.sansDetail ? null : r.usap.drops,
      penaltyTriesUsap: r.sansDetail ? null : r.usap.essaisDePenalite,
      triesOpponent: r.sansDetail ? null : r.adverse.essais,
      conversionsOpponent: r.sansDetail ? null : r.adverse.transformations,
      penaltiesOpponent: r.sansDetail ? null : r.adverse.penalites,
      dropGoalsOpponent: r.sansDetail ? null : r.adverse.drops,
      penaltyTriesOpponent: r.sansDetail ? null : r.adverse.essaisDePenalite,
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

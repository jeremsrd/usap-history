/**
 * Crée les vingt-huit matchs de la saison 2009-2010, celle de la finale perdue
 * contre Clermont.
 *
 * Vingt-six journées, une demi-finale et une finale. L'USAP termine
 * **première de la phase régulière avec 80 points** — 17 victoires, aucun nul,
 * 9 défaites, 582 points marqués pour 412 encaissés, 12 points de bonus —,
 * bat Toulouse 21-13 en demi-finale, puis perd la finale 6-19 contre Clermont,
 * qui décroche là son premier titre après dix finales perdues.
 *
 * LE CLASSEMENT ADDITIONNE LES PHASES FINALES, et cette fois **l'USAP est
 * concernée** : sa ligne officielle compte 28 journées — 26 plus la demie et
 * la finale —, soit `84 pts, 18 G, 0 N, 10 P, 12 bonus, 609 pour, 444 contre`.
 * La phase régulière s'en déduit en retranchant les deux : une victoire de
 * moins et quatre points de moins pour la demie gagnée, une défaite de moins
 * pour la finale perdue qui n'en rapportait aucun, et les scores des deux
 * rencontres de part et d'autre — 609 − 21 − 6 = 582, 444 − 13 − 19 = 412.
 *
 * **La soustraction est vérifiée par une source extérieure**, et pas seulement
 * par son arithmétique : le classement de la phase régulière publié par
 * Wikipédia donne exactement `80 pts, 17 G, 0 N, 9 P, 582, 412` pour l'USAP,
 * et `80 pts, 18 G, 1 N, 7 P, 541, 456` pour Toulon — ce que la même méthode
 * appliquée à la ligne toulonnaise redonne au point près.
 *
 * PREMIÈRE DE LA PHASE RÉGULIÈRE, ET IL FALLAIT LE DÉMONTRER. L'USAP et Toulon
 * finissent tous deux à 80 points, et Toulon compte **plus de victoires**
 * — 18 contre 17 —, ce qui suffirait à le placer devant si les victoires
 * départageaient en premier. C'est la différence de points qui tranche, +170
 * contre +85, et Wikipédia confirme le rang.
 *
 * PARTICULARITÉ COMMUNE AUX SAISONS ANCIENNES : la page ne donne qu'un
 * **total de bonus**, 12, sans séparer l'offensif du défensif. Le script
 * contrôle donc la somme `BO + BD`, sur les seules vingt-six journées.
 *
 * DEUX RENCONTRES SUR TERRAIN NEUTRE, et la déduction par le camp y est
 * fausse : les phases finales du Top 14 se jouent ailleurs, et la feuille de
 * la LNR désigne pourtant un recevant. La demi-finale s'est jouée au stade de
 * la Mosson de Montpellier, la finale au Stade de France.
 * `TERRAINS_PARTICULIERS` de `lib/stades.ts` porte les deux dates et leur
 * source.
 *
 * PAS DE COUPE D'EUROPE EN BASE : le flux de l'EPCR ne rend rien avant
 * 2020-2021.
 *
 * ATTENTION AU SCORE COURANT : jusqu'en 2016-2017 inclus, il crédite neuf
 * points à un essai de pénalité. `lireFeuille` le corrige.
 *
 * Ce que le script écrit : la rencontre elle-même — date et heure,
 * compétition, journée ou phase, adversaire, lieu, score, réalisations des
 * deux camps, résultat, bonus et arbitre —, plus les agrégats de la saison,
 * calculés sur les seules vingt-six journées. **Pas les compositions ni la
 * chronologie** : elles viennent ensuite.
 *
 * Usage :
 *   npx tsx scripts/seed-season-2009-2010.ts --dry
 *   npx tsx scripts/seed-season-2009-2010.ts
 *
 * Idempotent : un match déjà créé est mis à jour, jamais dupliqué.
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

const SAISON = "2009-2010";
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
 * Aucun club à créer : les treize adversaires de Top 14 de 2009-2010 sont tous
 * en base, arrivés avec les saisons plus récentes. Le tableau reste, vide,
 * pour que la saison suivante n'ait qu'à le remplir.
 */
const NOUVEAUX_ADVERSAIRES: Array<{
  name: string;
  shortName: string;
  city: string;
  pays: string;
}> = [];

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
}

/**
 * Les vingt-six journées de Top 14, la demi-finale et la finale, depuis la LNR.
 *
 * Les deux phases finales n'ont pas de journée : elles portent un libellé de
 * tour, d'où `estCouperet()` déduira qu'elles n'attribuent pas de bonus.
 */
async function championnat(echecs: string[]): Promise<Rencontre[]> {
  const rencontres: Rencontre[] = [];
  const phases = [
    ...Array.from({ length: JOURNEES }, (_, i) => `j${i + 1}`),
    "demi-finales",
    "finale",
  ];
  /** Libellé de tour, pour les phases qui n'ont pas de journée. */
  const TOURS: Record<string, string> = { "demi-finales": "Demi-finale", finale: "Finale" };
  for (const phase of phases) {
    const n = phase.startsWith("j") ? Number(phase.slice(1)) : null;
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
    const ecart: string[] = [];
    if (usap.total !== scoreUsap) ecart.push(`USAP ${usap.total} pour ${scoreUsap}`);
    if (adverse.total !== scoreOpponent) ecart.push(`${nom} ${adverse.total} pour ${scoreOpponent}`);
    if (ecart.length > 0) {
      echecs.push(`${phase} : réalisations incohérentes — ${ecart.join(", ")}`);
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
      halfTimeUsap: null,
      halfTimeOpponent: null,
      arbitre,
      attendance: null,
      usap,
      adverse,
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
    // Première de la phase régulière, finaliste.
    finalRanking: 1,
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
  // Le classement officiel de la LNR fait foi : on refuse d'écrire des
  // agrégats qui s'en écartent.
  // La page de classement ne sépare pas BO et BD : elle n'affiche qu'un total
  // de 9. On contrôle donc la somme, seul chiffre que la source permet
  // d'affirmer.
  //
  // La ligne est reprise telle quelle : contrairement aux six premiers, l'USAP
  // n'a pas de phase finale à retrancher, et la page lui compte bien 26
  // journées.
  // Chiffres de la phase régulière : la ligne officielle **moins la
  // demi-finale et la finale** (cf. l'en-tête), et Wikipédia les confirme.
  const OFFICIEL = {
    wins: 17, draws: 0, losses: 9, pointsFor: 582, pointsAgainst: 412,
    points: 80, bonus: 12,
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
    agregats.bonusOffensif + agregats.bonusDefensif !== OFFICIEL.bonus
      ? `${agregats.bonusOffensif + agregats.bonusDefensif} bonus pour ${OFFICIEL.bonus}` : null,
  ].filter(Boolean);
  if (ecarts.length > 0) {
    console.log(`  ⚠ écart avec le classement officiel : ${ecarts.join(", ")} — agrégats non écrits`);
    return;
  }
  console.log("  ✔ conforme au classement officiel de la LNR");

  if (!DRY_RUN) {
    await prisma.season.update({
      where: { id: seasonId },
      // Première de la régulière, battue en finale : ni championne, ni
      // promue, ni reléguée.
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

    // La demi-finale et la finale sont des couperets : pas de bonus.
    const isKnockout = r.matchday == null && !(r.round ?? "").startsWith("Poule");
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

    const marques = [
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
      triesUsap: r.usap.essais,
      conversionsUsap: r.usap.transformations,
      penaltiesUsap: r.usap.penalites,
      dropGoalsUsap: r.usap.drops,
      penaltyTriesUsap: r.usap.essaisDePenalite,
      triesOpponent: r.adverse.essais,
      conversionsOpponent: r.adverse.transformations,
      penaltiesOpponent: r.adverse.penalites,
      dropGoalsOpponent: r.adverse.drops,
      penaltyTriesOpponent: r.adverse.essaisDePenalite,
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

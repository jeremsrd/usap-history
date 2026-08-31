/**
 * Crée les trente-deux matchs de la saison 2017-2018, celle du titre de Pro D2
 * et de la remontée en Top 14.
 *
 * Trente journées, une demi-finale contre Mont-de-Marsan et la finale contre
 * Grenoble. L'USAP termine **premier de la phase régulière avec 97 points** —
 * 20 victoires, 1 nul, 9 défaites, 919 points marqués pour 571 encaissés, 15
 * points de bonus —, puis remporte le titre 38-13. Le classement officiel de
 * la LNR sert de garde-fou aux agrégats, et l'arithmétique tombe juste :
 * 20×4 + 1×2 + 15 font 97.
 *
 * La saison n'ayant pas de barrage d'accession, le titre valait la montée :
 * l'USAP est directement promue, et joue le Top 14 en 2018-2019 — la saison de
 * la relégation, déjà en base.
 *
 * PARTICULARITÉ DU CLASSEMENT DE LA LNR pour cette saison : la page ne donne
 * qu'un **total de bonus**, 15, sans séparer l'offensif du défensif. Le script
 * contrôle donc la somme `BO + BD`, et non chaque compteur — c'est tout ce que
 * la source permet d'affirmer.
 *
 * Source unique, la LNR, sur `prod2.lnr.fr` : pas de campagne européenne,
 * l'USAP jouait en deuxième division. Ce site archive bien 2017-2018 — les
 * vingt-trois de chaque camp, les faits, les changements et l'arbitre sont
 * publiés sur les trente-deux feuilles.
 *
 * Ce que le script écrit : la rencontre elle-même — date et heure,
 * compétition, journée ou phase, adversaire, lieu, score, réalisations des
 * deux camps, résultat, bonus et arbitre —, plus les agrégats de la saison,
 * calculés sur les seules trente journées de championnat. **Pas les
 * compositions ni la chronologie** : elles viennent ensuite, avec
 * `seed-lineup.ts`, `seed-opponent-sheet.ts` et `seed-chronologie.ts`.
 *
 * Trois clubs manquaient à la base — Dax, Massy et Narbonne, que l'USAP n'a
 * plus croisés depuis. Leurs noms viennent du classement officiel de la LNR,
 * pas de mémoire.
 *
 * Usage :
 *   npx tsx scripts/seed-season-2017-2018.ts --dry
 *   npx tsx scripts/seed-season-2017-2018.ts
 *
 * TERRAIN NEUTRE : LA FINALE NE SE DÉDUIT PAS. Le lieu d'un match se déduit du
 * camp — Aimé-Giral à domicile, le stade de l'adversaire à l'extérieur —, et
 * cette déduction est fausse pour une finale. La feuille de la LNR n'aide
 * pas : elle désigne quand même un recevant, « perpignan-grenoble », et ne
 * nomme aucun stade. La finale du 6 mai 2018 s'est jouée au **stade
 * Ernest-Wallon de Toulouse**.
 *
 * **Source : Jérémy, qui y était.** Aucune source lue par machine ne le
 * donne, et le témoignage direct est ici la meilleure disponible. Il est
 * inscrit dans `TERRAINS_PARTICULIERS` de `lib/stades.ts`, et non posé à la
 * main sur le match : une correction manuelle aurait été effacée à la
 * première relance du script, qui recalcule le lieu de chaque rencontre.
 *
 * La demi-finale, elle, garde Aimé-Giral : en Pro D2 le mieux classé reçoit,
 * et l'USAP a fini première. Ce n'est pas une déduction hasardeuse.
 *
 * Idempotent : un match déjà créé est mis à jour, jamais dupliqué —
 * l'appariement se fait sur la saison, l'adversaire et le jour.
 */

import { PrismaClient, MatchResult, Prisma } from "@prisma/client";
import {
  lireCalendrier,
  lireFeuille,
  lireCompositions,
  realisationsDepuisFaits as realisations,
  utiliserDivision,
  type Realisations,
  type Camp,
} from "./lib/lnr";
import { trouverOuCreerArbitre } from "./lib/arbitres";
import { CLUBS_LNR, CLUBS_EPCR } from "./lib/clubs";
import { computeBonuses, matchPoints } from "../src/lib/scoring";
import { generateMatchSlug, generateOpponentSlug } from "../src/lib/slugs";
import { preserverAnnexes } from "./lib/saison";
import { terrainDuMatch } from "./lib/stades";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

const SAISON = "2017-2018";
const JOURNEES = 30;

/**
 * Le terrain neutre de la finale ne se déduit pas, et il ne vit plus ici :
 * `TERRAINS_PARTICULIERS` de `lib/stades.ts` le porte, avec sa source, pour
 * que la règle ne soit écrite qu'à un seul endroit — la finale du 6 mai 2018
 * s'est jouée au stade Ernest-Wallon de Toulouse.
 *
 * La demi-finale, elle, garde Aimé-Giral : en Pro D2 le mieux classé reçoit,
 * et l'USAP a fini première. Ce n'est pas une déduction hasardeuse.
 */

async function trouverAdversaire(nom: string): Promise<string> {
  const trouve = await prisma.opponent.findFirst({
    where: { OR: [{ shortName: nom }, { name: nom }] },
    select: { id: true },
  });
  if (trouve) return trouve.id;
  throw new Error(`adversaire « ${nom} » introuvable en base`);
}

/**
 * Les trois clubs de Pro D2 que la base ne connaît pas encore. Les noms sont
 * ceux du classement officiel de la LNR, relevé sur `prod2.lnr.fr/classement`,
 * et non de mémoire. Aucun n'a recroisé l'USAP depuis 2017-2018, d'où leur
 * absence jusqu'ici.
 */
const NOUVEAUX_ADVERSAIRES = [
  { name: "US Dax", shortName: "Dax", city: "Dax", pays: "FR" },
  { name: "RC Massy Essonne", shortName: "Massy", city: "Massy", pays: "FR" },
  { name: "RC Narbonnais", shortName: "Narbonne", city: "Narbonne", pays: "FR" },
];

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
 * Les trente journées de Pro D2, la demi-finale et la finale, depuis la LNR.
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
  const TOURS: Record<string, string> = {
    "demi-finales": "Demi-finale",
    finale: "Finale",
  };
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

    const usap = realisations(feuille.faits, feuille.campUsap, scoreUsap);
    const adverse = realisations(feuille.faits, campAdverse, scoreOpponent);
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

    rencontres.push({
      date: new Date(feuille.coupDEnvoi),
      kickoffTime: feuille.coupDEnvoi.slice(11, 16),
      competitionShortName: "Pro D2",
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
    // Premier de la phase régulière, puis champion et promu en Top 14.
    finalRanking: 1,
  };
  const points = jouees.reduce(
    (s, m) =>
      s +
      matchPoints(m.result, m.bonusOffensif, m.bonusDefensif, startYear),
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
  // La page de classement de 2017-2018 ne sépare pas BO et BD : elle n'affiche
  // qu'un total de 15. On contrôle donc la somme, seul chiffre que la source
  // permet d'affirmer.
  const OFFICIEL = {
    wins: 20, draws: 1, losses: 9, pointsFor: 919, pointsAgainst: 571,
    points: 97, bonus: 15,
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
      // Championne de Pro D2 et promue : la finale valait la montée, il n'y
      // avait pas de barrage d'accession cette saison-là.
      data: { ...agregats, totalPoints: points, champion: true, promoted: true },
    });
  }
}

async function main() {
  console.log(`=== Saison ${SAISON}${DRY_RUN ? " (simulation)" : ""} ===\n`);

  // La LNR sépare ses deux divisions sur deux sites.
  utiliserDivision("prod2");

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

    // Un match couperet n'attribue pas de bonus.
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

    // Terrain neutre et terrain d'alors : `terrainDuMatch` porte les deux
    // règles, la finale du 6 mai 2018 figurant dans `TERRAINS_PARTICULIERS`.
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

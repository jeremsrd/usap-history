/**
 * Crée les trente-deux matchs de la saison 2020-2021, celle du titre de
 * Pro D2 et de la remontée.
 *
 * Trente journées, une demi-finale contre Oyonnax et la finale contre
 * Biarritz. L'USAP termine premier de la phase régulière avec 107 points —
 * 24 victoires, 1 nul, 5 défaites, 821 points marqués pour 504 encaissés —
 * puis remporte le titre. Le classement officiel de la LNR sert de garde-fou
 * aux agrégats, et l'arithmétique tombe juste : 24×4 + 1×2 + 9 points de
 * bonus font 107.
 *
 * PREMIÈRE SAISON DE PRO D2 REPRISE. La LNR sépare ses deux divisions sur
 * deux sites de structure identique ; `utiliserDivision("prod2")` bascule
 * `lnr.ts` sur `prod2.lnr.fr`. Les phases finales y ont leurs propres
 * segments d'URL — `demi-finales` et `finale` —, que `phasesLnr()` déduit du
 * libellé de tour.
 *
 * Ce site archive mieux que celui du Top 14 : il publie les compositions de
 * 2020-2021, quand le site Top 14 ne le fait pas pour toutes ses archives.
 *
 * Source unique, la LNR : pas de campagne européenne cette saison-là, l'USAP
 * jouait en deuxième division.
 *
 * Ce que le script écrit : la rencontre elle-même — date et heure,
 * compétition, journée ou phase, adversaire, lieu, score, réalisations des
 * deux camps, résultat, bonus et arbitre —, plus les agrégats de la saison,
 * calculés sur les seules trente journées de championnat. **Pas les
 * compositions ni la chronologie** : elles viennent ensuite, avec
 * `seed-lineup.ts`, `seed-opponent-sheet.ts` et `seed-chronologie.ts`.
 *
 * Huit clubs manquaient à la base — Colomiers, Nevers, Carcassonne,
 * Aurillac, Béziers, Rouen, Valence-Romans et Soyaux-Angoulême. Leurs noms
 * viennent du classement officiel de la LNR, pas de mémoire.
 *
 * Usage :
 *   npx tsx scripts/seed-season-2020-2021.ts --dry
 *   npx tsx scripts/seed-season-2020-2021.ts
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

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

const SAISON = "2020-2021";
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
 * Les huit clubs de Pro D2 que la base ne connaît pas encore. Les noms sont
 * ceux du classement officiel de la LNR, relevé sur `prod2.lnr.fr/classement`,
 * et non de mémoire.
 */
const NOUVEAUX_ADVERSAIRES = [
  { name: "Colomiers Rugby", shortName: "Colomiers", city: "Colomiers", pays: "FR" },
  { name: "USON Nevers", shortName: "Nevers", city: "Nevers", pays: "FR" },
  { name: "US Carcassonnaise", shortName: "Carcassonne", city: "Carcassonne", pays: "FR" },
  { name: "Stade Aurillacois", shortName: "Aurillac", city: "Aurillac", pays: "FR" },
  { name: "AS Béziers Hérault", shortName: "Béziers", city: "Béziers", pays: "FR" },
  { name: "Rouen Normandie Rugby", shortName: "Rouen", city: "Rouen", pays: "FR" },
  { name: "Valence Romans", shortName: "Valence-Romans", city: "Valence", pays: "FR" },
  { name: "Soyaux-Angoulême XV", shortName: "Angoulême", city: "Angoulême", pays: "FR" },
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
 * Les vingt-six journées de Top 14 et le match d'accession, depuis la LNR.
 * La rencontre de barrage n'a pas de journée : elle porte une phase.
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
    // Premier de la phase régulière, puis champion.
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
  const OFFICIEL = { wins: 24, draws: 1, losses: 5, pointsFor: 821, pointsAgainst: 504, points: 107 };
  const ecarts = [
    agregats.wins !== OFFICIEL.wins ? `${agregats.wins}V pour ${OFFICIEL.wins}` : null,
    agregats.draws !== OFFICIEL.draws ? `${agregats.draws}N pour ${OFFICIEL.draws}` : null,
    agregats.losses !== OFFICIEL.losses ? `${agregats.losses}D pour ${OFFICIEL.losses}` : null,
    agregats.pointsFor !== OFFICIEL.pointsFor
      ? `${agregats.pointsFor} marqués pour ${OFFICIEL.pointsFor}` : null,
    agregats.pointsAgainst !== OFFICIEL.pointsAgainst
      ? `${agregats.pointsAgainst} encaissés pour ${OFFICIEL.pointsAgainst}` : null,
    points !== OFFICIEL.points ? `${points} points pour ${OFFICIEL.points}` : null,
  ].filter(Boolean);
  if (ecarts.length > 0) {
    console.log(`  ⚠ écart avec le classement officiel : ${ecarts.join(", ")} — agrégats non écrits`);
    return;
  }
  console.log("  ✔ conforme au classement officiel de la LNR");

  if (!DRY_RUN) {
    await prisma.season.update({
      where: { id: seasonId },
      data: { ...agregats, totalPoints: points },
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
      select: { id: true },
    });

    const venue = r.isHome
      ? await prisma.venue.findFirst({ where: { name: "Stade Aimé-Giral" }, select: { id: true } })
      : await prisma.opponent
          .findUnique({ where: { id: opponentId }, select: { venueId: true } })
          .then((o) => (o?.venueId ? { id: o.venueId } : null));

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
      venueId: venue?.id ?? null,
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
      await prisma.match.update({ where: { id: existant.id }, data: donnees });
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

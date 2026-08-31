/**
 * Crée les trente-et-un matchs de la saison 2014-2015, la première de Pro D2
 * après la relégation de 2014.
 *
 * Trente journées et une demi-finale. L'USAP termine **troisième de la phase
 * régulière avec 82 points** — 17 victoires, 1 nul, 12 défaites, 744 points
 * marqués pour 615 encaissés, 12 points de bonus —, puis reçoit Agen en
 * demi-finale et fait **32-32**. Agen se qualifie, ira gagner la finale contre
 * Mont-de-Marsan et montera en Top 14 derrière Pau, premier et promu
 * directement.
 *
 * ATTENTION, LE CLASSEMENT DE LA LNR ADDITIONNE ICI LES PHASES FINALES, et
 * c'est le piège de cette saison. Sa page ne s'arrête pas à la trentième
 * journée comme celles de 2017-2018 ou de 2020-2021 : Perpignan y compte
 * **31 journées**, Albi 31, Mont-de-Marsan et Agen 32 — soit exactement les
 * quatre demi-finalistes, et eux seuls. Son titre annonce pourtant « J30 ».
 *
 * La ligne brute de l'USAP est donc `84 pts, 31 J, 17 G, 2 N, 12 P, 12 bonus,
 * 776 pour, 647 contre`, et la phase régulière s'en déduit en retranchant la
 * demi-finale : un nul de moins (2 N → 1 N), deux points de moins (84 → 82),
 * et 32 points de part et d'autre (776 → 744, 647 → 615).
 *
 * **La soustraction se vérifie sur les trois autres**, et c'est ce qui la
 * fonde : Mont-de-Marsan 88 moins sa demie gagnée fait 84, Agen 87 moins la
 * finale gagnée et le nul de la demie fait 81, Albi 80 inchangé ayant perdu sa
 * demie, Pau 94 jamais touché. La phase régulière donne alors Pau 94,
 * Mont-de-Marsan 84, Perpignan 82, Agen 81, Albi 80 — et ce classement-là
 * explique les demi-finales telles qu'elles ont été tirées, le deuxième
 * recevant le cinquième et le troisième le quatrième. Aucune autre lecture ne
 * rend cet accord.
 *
 * PARTICULARITÉ COMMUNE AUX SAISONS ANCIENNES : la page ne donne qu'un
 * **total de bonus**, 12, sans séparer l'offensif du défensif. Le script
 * contrôle donc la somme `BO + BD`.
 *
 * ET CE TOTAL EST UN TEST. 2014-2015 est la première saison où le bonus
 * défensif s'obtient à **cinq** points d'écart et non sept (cf. CLAUDE.md,
 * « Points de bonus »). Si la borne était fausse, le compte de bonus ne
 * retomberait pas sur 12 et le script refuserait d'écrire.
 *
 * Source unique, la LNR, sur `prod2.lnr.fr` : pas de campagne européenne,
 * l'USAP jouait en deuxième division. Ce site archive bien 2014-2015 — les
 * vingt-trois de chaque camp, les faits, les changements et l'arbitre sont
 * publiés sur les trente-et-une feuilles.
 *
 * ATTENTION AU SCORE COURANT : jusqu'en 2016-2017 inclus, il crédite neuf
 * points à un essai de pénalité, la transformation — qu'il fallait alors
 * encore jouer — y étant comptée deux fois. `lireFeuille` le corrige et porte
 * la démonstration ; il n'y a rien à faire ici.
 *
 * Ce que le script écrit : la rencontre elle-même — date et heure,
 * compétition, journée ou phase, adversaire, lieu, score, réalisations des
 * deux camps, résultat, bonus et arbitre —, plus les agrégats de la saison,
 * calculés sur les seules trente journées de championnat. **Pas les
 * compositions ni la chronologie** : elles viennent ensuite, avec
 * `seed-lineup.ts`, `seed-opponent-sheet.ts` et `seed-chronologie.ts`.
 *
 * Aucun club nouveau : les quinze adversaires de la saison sont déjà en base,
 * avec leur stade — Massy est arrivé avec 2017-2018, Albi et Bourgoin avec
 * 2016-2017, Tarbes avec 2015-2016.
 *
 * Pas de terrain neutre non plus : la demi-finale s'est jouée à Aimé-Giral, le
 * mieux classé recevant en Pro D2, et l'USAP a fini troisième quand Agen était
 * quatrième. La déduction du lieu par le camp vaut donc pour les trente-et-un
 * matchs.
 *
 * Usage :
 *   npx tsx scripts/seed-season-2014-2015.ts --dry
 *   npx tsx scripts/seed-season-2014-2015.ts
 *
 * Idempotent : un match déjà créé est mis à jour, jamais dupliqué —
 * l'appariement se fait sur la saison, l'adversaire et le jour.
 */

import { PrismaClient, MatchResult, Prisma } from "@prisma/client";
import {
  lireCalendrier,
  lireFeuille,
  lireCompositions,
  momentDuMatch,
  realisationsDepuisFaits as realisations,
  utiliserDivision,
  type Realisations,
  type Camp,
} from "./lib/lnr";
import { trouverOuCreerArbitre } from "./lib/arbitres";
import { CLUBS_LNR } from "./lib/clubs";
import { computeBonuses, matchPoints } from "../src/lib/scoring";
import { generateMatchSlug, generateOpponentSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

const SAISON = "2014-2015";
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
 * Aucun club à créer : les quinze adversaires de 2014-2015 sont tous en base,
 * arrivés avec les saisons déjà reprises. Le tableau reste, vide, pour que la
 * saison suivante n'ait qu'à le remplir.
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
 * Les trente journées de Pro D2 et la demi-finale, depuis la LNR.
 *
 * La demi-finale n'a pas de journée : elle porte un libellé de tour, d'où
 * `estCouperet()` déduira qu'elle n'attribue pas de bonus.
 */
async function championnat(echecs: string[]): Promise<Rencontre[]> {
  const rencontres: Rencontre[] = [];
  const phases = [...Array.from({ length: JOURNEES }, (_, i) => `j${i + 1}`), "demi-finales"];
  /** Libellé de tour, pour les phases qui n'ont pas de journée. */
  const TOURS: Record<string, string> = { "demi-finales": "Demi-finale" };
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

    // Un coup d'envoi à 00:00 veut dire « heure inconnue » (cf. `momentDuMatch`).
    const moment = momentDuMatch(feuille.coupDEnvoi);
    rencontres.push({
      date: moment.date,
      kickoffTime: moment.kickoffTime,
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
    // Troisième de la phase régulière, éliminée en demi-finale.
    finalRanking: 3,
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
  // de 12. On contrôle donc la somme, seul chiffre que la source permet
  // d'affirmer — et ce total teste au passage la borne de 2014-2015 sur le
  // bonus défensif, passé de sept à cinq points d'écart cette saison-là.
  //
  // Les chiffres sont ceux de la ligne officielle **moins la demi-finale**,
  // que cette page additionne (cf. l'en-tête) : 84 pts, 31 J, 17 G, 2 N, 12 P,
  // 776 pour, 647 contre, moins un nul à 32-32.
  const OFFICIEL = {
    wins: 17, draws: 1, losses: 12, pointsFor: 744, pointsAgainst: 615,
    points: 82, bonus: 12,
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
      // Ni championne, ni promue, ni reléguée : éliminée en demi-finale.
      data: { ...agregats, totalPoints: points, champion: false, promoted: false, relegated: false },
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

    // La demi-finale est un couperet : elle n'attribue pas de bonus.
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

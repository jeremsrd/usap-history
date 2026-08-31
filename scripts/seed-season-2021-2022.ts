/**
 * Crée les trente matchs de la saison 2021-2022, la première du chantier de
 * phase 4 — l'enrichissement historique, mené en remontant le temps.
 *
 * Vingt-six journées de Top 14, montée de Pro D2 oblige, quatre matchs de
 * Challenge européen, et le match d'accession du 12 juin 2022 face à
 * Mont-de-Marsan — treizième du Top 14, l'USAP a dû défendre sa place, et l'a
 * fait de belle manière (41-16).
 *
 * Attention au segment d'URL du barrage : la LNR l'écrit `match-daccession`
 * cette saison-là, `access` en 2022-2023 et `access-top-14` depuis 2024-2025.
 *
 * Sources :
 *   - championnat : la LNR, qui couvre bien 2021-2022. Le calendrier donne le
 *     score final — celui que la feuille égrène au fil des actions saute
 *     parfois une transformation —, la feuille de match donne le coup d'envoi
 *     à la minute près et le détail des réalisations, l'onglet compositions
 *     donne l'arbitre central ;
 *   - coupe d'Europe : le flux de l'EPCR, qui donne en plus l'affluence et le
 *     score à la mi-temps.
 *
 * Ce que le script écrit : la rencontre elle-même — date et heure, compétition,
 * journée ou phase, adversaire, lieu, score, réalisations des deux camps,
 * résultat, bonus et arbitre —, plus les agrégats de la saison, calculés sur
 * les seules vingt-six journées de championnat. **Pas les compositions ni la
 * chronologie** : elles viendront ensuite, avec les scripts de feuille. Pas
 * non plus la clôture éditoriale — entraîneur, président, bilan rédigé —, qui
 * demande des sources que la LNR ne donne pas.
 *
 * Le classement final, 13e, n'est pas lu quelque part : il se déduit du match
 * d'accession lui-même, que seul le treizième du Top 14 dispute.
 *
 * Les réalisations se déduisent des faits de match sans avoir besoin d'une
 * composition : essais, pénalités et drops se comptent, et les transformations
 * se lisent dans le reliquat du score courant — deux points de plus que ce que
 * les faits expliquent, c'est une transformation. Le total doit retomber
 * exactement sur le score, sinon le match est refusé.
 *
 * La poule de Challenge n'a que trois journées pour l'USAP : sa deuxième
 * rencontre, décembre 2021, n'a jamais été jouée — le Covid a emporté une
 * bonne partie de la phase de poules cette saison-là. Le flux de l'EPCR ne la
 * connaît pas davantage.
 *
 * Usage :
 *   npx tsx scripts/seed-season-2021-2022.ts --dry
 *   npx tsx scripts/seed-season-2021-2022.ts
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
  type Realisations,
  type Camp,
} from "./lib/lnr";
import { COMPETITIONS, USAP, chercherMatchs, lireMatch, type EpcrEquipe } from "./lib/epcr";
import { trouverOuCreerArbitre } from "./lib/arbitres";
import { CLUBS_LNR, CLUBS_EPCR } from "./lib/clubs";
import { computeBonuses, matchPoints } from "../src/lib/scoring";
import { generateMatchSlug, generateOpponentSlug } from "../src/lib/slugs";
import { preserverAnnexes } from "./lib/saison";
import { terrainDuMatch } from "./lib/stades";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

const SAISON = "2021-2022";
const JOURNEES = 26;

/** Phases de la coupe, du numéro de tour de l'EPCR au libellé de la base. */
const PHASES_EPCR: Record<number, string> = {
  1: "Poule J1",
  2: "Poule J2",
  3: "Poule J3",
  4: "Poule J4",
  5: "Huitième de finale",
};

/** Réalisations d'un camp selon l'EPCR, où les stats des joueurs font foi. */
function realisationsEpcr(equipe: EpcrEquipe): Realisations {
  const somme = (choix: (j: EpcrEquipe["joueurs"][number]) => number) =>
    equipe.joueurs.reduce((s, j) => s + choix(j), 0);
  const bilan: Realisations = {
    essais: somme((j) => j.essais),
    transformations: somme((j) => j.transformations),
    penalites: somme((j) => j.penalites),
    drops: somme((j) => j.drops),
    essaisDePenalite: equipe.essaisDePenalite,
    total: 0,
  };
  bilan.total =
    5 * bilan.essais +
    2 * bilan.transformations +
    3 * bilan.penalites +
    3 * bilan.drops +
    7 * bilan.essaisDePenalite;
  return bilan;
}

async function trouverAdversaire(nom: string): Promise<string> {
  const trouve = await prisma.opponent.findFirst({
    where: { OR: [{ shortName: nom }, { name: nom }] },
    select: { id: true },
  });
  if (trouve) return trouve.id;
  throw new Error(`adversaire « ${nom} » introuvable en base`);
}

/** Les deux clubs de 2021-2022 que la base ne connaît pas encore. */
const NOUVEAUX_ADVERSAIRES = [
  { name: "Gloucester Rugby", shortName: "Gloucester", city: "Gloucester", pays: "ENG" },
  { name: "Stade Montois", shortName: "Mont-de-Marsan", city: "Mont-de-Marsan", pays: "FR" },
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
    "match-daccession",
  ];
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
      competitionShortName: n != null ? "Top 14" : "Barrages",
      matchday: n,
      round: n != null ? null : "Access Match",
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

/** Les matchs de Challenge européen, depuis le flux de l'EPCR. */
async function coupe(echecs: string[]): Promise<Rencontre[]> {
  const rencontres: Rencontre[] = [];
  const calendrier = await chercherMatchs(SAISON, COMPETITIONS["challenge-cup"]);
  const siens = calendrier.filter((m) => m.domicile.id === USAP || m.exterieur.id === USAP);

  for (const resume of siens.sort((a, b) => a.date.localeCompare(b.date))) {
    const feuille = await lireMatch(resume.id);
    const isHome = feuille.domicile.id === USAP;
    const equipeUsap = isHome ? feuille.domicile : feuille.exterieur;
    const equipeAdverse = isHome ? feuille.exterieur : feuille.domicile;
    const nom = CLUBS_EPCR[equipeAdverse.nom];
    if (!nom) {
      echecs.push(`EPCR ${feuille.id} : club « ${equipeAdverse.nom} » inconnu de la table`);
      continue;
    }
    const round = PHASES_EPCR[feuille.round ?? 0];
    if (!round) {
      echecs.push(`EPCR ${feuille.id} : tour ${feuille.round} sans libellé`);
      continue;
    }

    const usap = realisationsEpcr(equipeUsap);
    const adverse = realisationsEpcr(equipeAdverse);
    const ecart: string[] = [];
    if (usap.total !== equipeUsap.score) ecart.push(`USAP ${usap.total} pour ${equipeUsap.score}`);
    if (adverse.total !== equipeAdverse.score) {
      ecart.push(`${nom} ${adverse.total} pour ${equipeAdverse.score}`);
    }
    if (ecart.length > 0) {
      echecs.push(`EPCR ${feuille.id} : réalisations incohérentes — ${ecart.join(", ")}`);
      continue;
    }

    const date = new Date(feuille.date);
    rencontres.push({
      date,
      // L'heure est donnée en UTC : on l'affiche à l'heure de Perpignan, comme
      // le reste de la base.
      kickoffTime: date.toLocaleTimeString("fr-FR", {
        timeZone: "Europe/Paris",
        hour: "2-digit",
        minute: "2-digit",
      }),
      competitionShortName: "Challenge Européen",
      matchday: null,
      round,
      isHome,
      opponentNom: nom,
      scoreUsap: equipeUsap.score ?? 0,
      scoreOpponent: equipeAdverse.score ?? 0,
      halfTimeUsap: equipeUsap.miTemps,
      halfTimeOpponent: equipeAdverse.miTemps,
      arbitre: feuille.arbitre,
      attendance: feuille.affluence,
      usap,
      adverse,
    });
  }
  return rencontres;
}

/**
 * Agrégats de la saison, sur les seules journées de championnat : le barrage
 * et la coupe d'Europe ne comptent pas au classement.
 */
async function cloreLaSaison(seasonId: string, startYear: number) {
  const journees = await prisma.match.findMany({
    where: { seasonId, matchday: { not: null } },
    select: { result: true, scoreUsap: true, scoreOpponent: true, bonusOffensif: true, bonusDefensif: true },
  });
  if (journees.length !== JOURNEES) {
    console.log(`\n  ⚠ ${journees.length} journées trouvées pour ${JOURNEES} attendues — agrégats non écrits`);
    return;
  }

  const compte = (r: MatchResult) => journees.filter((m) => m.result === r).length;
  const agregats = {
    matchesPlayed: journees.length,
    wins: compte(MatchResult.VICTOIRE),
    draws: compte(MatchResult.NUL),
    losses: compte(MatchResult.DEFAITE),
    pointsFor: journees.reduce((s, m) => s + m.scoreUsap, 0),
    pointsAgainst: journees.reduce((s, m) => s + m.scoreOpponent, 0),
    bonusOffensif: journees.filter((m) => m.bonusOffensif).length,
    bonusDefensif: journees.filter((m) => m.bonusDefensif).length,
    // Seul le treizième du Top 14 dispute le match d'accession.
    finalRanking: 13,
  };
  const points = journees.reduce(
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
  if (!DRY_RUN) {
    await prisma.season.update({
      where: { id: seasonId },
      data: { ...agregats, totalPoints: points },
    });
  }
}

async function main() {
  console.log(`=== Saison ${SAISON}${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const saison = await prisma.season.findFirstOrThrow({ where: { label: SAISON } });
  await assurerAdversaires();

  const echecs: string[] = [];
  const rencontres = [...(await championnat(echecs)), ...(await coupe(echecs))].sort(
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

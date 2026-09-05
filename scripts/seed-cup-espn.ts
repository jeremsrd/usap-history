/**
 * Une campagne européenne d'avant 2020-2021, depuis ESPN : les rencontres,
 * les deux compositions et les réalisations par joueur.
 *
 * **La source n'est pas officielle, et le script est construit autour de ce
 * fait.** Cf. l'en-tête de `lib/espn.ts`. Rien ne s'écrit sans avoir été
 * recoupé :
 *
 *   - **les scores** sont confrontés au classement de poule de Wikipédia —
 *     victoires, nuls, défaites, points marqués et encaissés, bonus, total —
 *     avant la première écriture. Un seul écart, et rien n'est écrit ;
 *   - **les réalisations d'un camp** ne s'écrivent que si la somme des points
 *     de ses joueurs retombe sur son score. Sinon, ses compteurs restent à
 *     `null` — « la source ne le dit pas » —, ses lignes de composition
 *     portent zéro réalisation, et le match est signalé. C'est le cas de deux
 *     feuilles sur six en 2008-2009 ;
 *   - **les compositions** passent le contrôle des dossards de
 *     `lib/dossards.ts`, le seul instrument qui voie une feuille brouillée ;
 *   - **les identités** passent par `lib/joueurs.ts`, jamais par le seul
 *     patronyme. Après écriture, relancer `detect-duplicate-players.ts`.
 *
 * **Ce qui reste à `null`, et pourquoi.** Les minutes, les entrées et sorties
 * et la minute des cartons : ESPN ne les donne pas, et une minute ne
 * s'invente pas. Un carton est donc posé sans minute. Aucune chronologie
 * n'est écrite, pour la même raison. L'arbitre et l'affluence ne sont pas
 * dans la source.
 *
 * **Le bonus offensif d'un camp dont la feuille ne boucle pas ne se calcule
 * pas** : `computeBonuses` le rend faux et lève `triesMissing`. C'est le
 * garde-fou de poule qui tranche alors — le total de bonus offensifs du
 * classement dit s'il en manque un. Pour 2008-2009, il n'en manque pas :
 * Wikipédia en compte un, celui du 48-16 à Trévise, huit essais.
 *
 * Usage :
 *   npx tsx scripts/seed-cup-espn.ts 2008-2009 --dry
 *   npx tsx scripts/seed-cup-espn.ts 2008-2009
 *   npx tsx scripts/seed-cup-espn.ts 2008-2009 --match=2009-01-17
 *
 * Idempotent : une rencontre déjà créée est retrouvée sur la saison,
 * l'adversaire et le jour, puis mise à jour ; ses compositions sont effacées
 * et réécrites.
 */

import { PrismaClient, MatchResult, Prisma, type Position } from "@prisma/client";
import {
  chercherMatchsUsap,
  lireMatch,
  USAP_ESPN,
  type EspnEquipe,
  type EspnMatch,
  type Ligue,
} from "./lib/espn";
import { CLUBS_ESPN } from "./lib/clubs";
import { POSTE_PAR_NUMERO, trouverOuCreerJoueur } from "./lib/joueurs";
import { concordanceDesDossards } from "./lib/dossards";
import { terrainDuMatch } from "./lib/stades";
import { preserverAnnexes } from "./lib/saison";
import { computeBonuses } from "../src/lib/scoring";
import {
  generateMatchSlug,
  generateOpponentSlug,
  generateVenueSlug,
} from "../src/lib/slugs";

const prisma = new PrismaClient();

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry");
const SAISON = ARGS.find((a) => /^\d{4}-\d{4}$/.test(a));
const SEUL = ARGS.find((a) => a.startsWith("--match="))?.slice("--match=".length);

/** Le classement de poule, tel que Wikipédia le donne pour l'USAP. */
interface ClassementDePoule {
  joues: number;
  victoires: number;
  nuls: number;
  defaites: number;
  essaisPour: number;
  essaisContre: number;
  pour: number;
  contre: number;
  bonusOffensifs: number;
  bonusDefensifs: number;
  points: number;
}

interface Campagne {
  ligue: Ligue;
  /** `shortName` de la compétition en base. */
  competition: string;
  nouveauxAdversaires: Array<{ name: string; shortName: string; city: string; pays: string }>;
  /** Terrains à créer et rattacher, avec leur source dans le commentaire. */
  terrains: Array<{ club: string; stade: string; ville: string; capacite: number | null }>;
  poule: ClassementDePoule;
  /** Ce qu'on sait de la campagne, pour le journal et pour la relecture. */
  note: string;
}

const CAMPAGNES: Record<string, Campagne> = {
  /**
   * Heineken Cup 2008-2009, poule 3 : Leicester, Ospreys, Perpignan, Trévise.
   * Troisième, à deux points des Ospreys : pas de phase finale. Classement
   * de la poule d'après la Wikipédia anglophone, « 2008–09 Heineken Cup ».
   * Welford Road d'après Wikipédia — l'USAP n'y a joué que ce 6 décembre.
   */
  "2008-2009": {
    ligue: "champions-cup",
    competition: "H-Cup",
    nouveauxAdversaires: [
      { name: "Leicester Tigers", shortName: "Leicester", city: "Leicester", pays: "ENG" },
    ],
    terrains: [
      { club: "Leicester", stade: "Welford Road Stadium", ville: "Leicester", capacite: 25849 },
    ],
    poule: {
      joues: 6,
      victoires: 4,
      nuls: 0,
      defaites: 2,
      essaisPour: 17,
      essaisContre: 10,
      pour: 154,
      contre: 120,
      bonusOffensifs: 1,
      bonusDefensifs: 1,
      points: 18,
    },
    note: "Heineken Cup, poule 3 — troisième, éliminée en poule",
  },
  /**
   * Heineken Cup 2009-2010, poule 1 : Munster, Northampton, Perpignan,
   * Trévise. Troisième, deux victoires à domicile, dont un 9-8 perdu à
   * Trévise et un 0-34 à Northampton. Classement d'après la Wikipédia
   * anglophone, « 2009–10 Heineken Cup ». Franklin's Gardens et Thomond Park
   * d'après Wikipédia.
   */
  "2009-2010": {
    ligue: "champions-cup",
    competition: "H-Cup",
    nouveauxAdversaires: [
      { name: "Northampton Saints", shortName: "Northampton", city: "Northampton", pays: "ENG" },
      { name: "Munster Rugby", shortName: "Munster", city: "Limerick", pays: "IE" },
    ],
    terrains: [
      { club: "Northampton", stade: "Franklin's Gardens", ville: "Northampton", capacite: 15249 },
      { club: "Munster", stade: "Thomond Park", ville: "Limerick", capacite: 25600 },
    ],
    poule: {
      joues: 6,
      victoires: 2,
      nuls: 0,
      defaites: 4,
      essaisPour: 12,
      essaisContre: 10,
      pour: 108,
      contre: 123,
      bonusOffensifs: 1,
      bonusDefensifs: 2,
      points: 11,
    },
    note: "Heineken Cup, poule 1 — troisième, éliminée en poule",
  },
};

// =============================================================================
// ADVERSAIRES ET TERRAINS
// =============================================================================

async function assurerAdversaires(campagne: Campagne) {
  for (const club of campagne.nouveauxAdversaires) {
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
  for (const t of campagne.terrains) {
    const club = await prisma.opponent.findFirst({
      where: { shortName: t.club },
      select: { id: true, venueId: true },
    });
    if (!club) {
      console.log(`  [stade] ${t.club} : club absent, rattachement différé`);
      continue;
    }
    if (club.venueId) continue;
    if (DRY_RUN) {
      console.log(`  [stade] à créer et rattacher : ${t.stade}, ${t.ville} → ${t.club}`);
      continue;
    }
    let stade = await prisma.venue.findFirst({ where: { name: t.stade }, select: { id: true } });
    if (!stade) {
      const cree = await prisma.venue.create({
        data: {
          name: t.stade,
          city: t.ville,
          capacity: t.capacite,
          slug: `temp-${t.club.toLowerCase()}`,
        },
      });
      stade = await prisma.venue.update({
        where: { id: cree.id },
        data: { slug: generateVenueSlug(t.stade, t.ville, cree.id) },
        select: { id: true },
      });
      console.log(`  [stade] créé : ${t.stade}, ${t.ville}`);
    }
    await prisma.opponent.update({ where: { id: club.id }, data: { venueId: stade.id } });
    console.log(`  [stade] ${t.club} → ${t.stade}`);
  }
}

// =============================================================================
// LECTURE ET CONTRÔLES
// =============================================================================

interface Realisations {
  essais: number;
  transformations: number;
  penalites: number;
  drops: number;
  total: number;
  /** Vrai si la somme des joueurs retombe sur le score du camp. */
  coherent: boolean;
}

/**
 * Réalisations d'un camp d'après ses joueurs — et le verdict. ESPN ne
 * connaît pas l'essai de pénalité : un écart de sept points en serait la
 * marque, mais ce serait une inférence, et le camp est alors simplement tenu
 * pour incohérent.
 */
function realisations(equipe: EspnEquipe): Realisations {
  const somme = (choix: (j: EspnEquipe["joueurs"][number]) => number) =>
    equipe.joueurs.reduce((s, j) => s + choix(j), 0);
  const r = {
    essais: somme((j) => j.essais),
    transformations: somme((j) => j.transformations),
    penalites: somme((j) => j.penalites),
    drops: somme((j) => j.drops),
  };
  const total = 5 * r.essais + 2 * r.transformations + 3 * r.penalites + 3 * r.drops;
  const points = somme((j) => j.points);
  return {
    ...r,
    total,
    coherent: equipe.score != null && total === equipe.score && points === equipe.score,
  };
}

interface Rencontre {
  feuille: EspnMatch;
  jour: string;
  date: Date;
  kickoffTime: string;
  isHome: boolean;
  opponentNom: string;
  usap: EspnEquipe;
  adverse: EspnEquipe;
  realUsap: Realisations;
  realAdverse: Realisations;
  bonusOffensif: boolean;
  bonusDefensif: boolean;
  bonusIndecidable: boolean;
  resultat: MatchResult;
  alertes: string[];
}

async function lireCampagne(
  saison: string,
  campagne: Campagne,
  echecs: string[],
): Promise<Rencontre[]> {
  const resumes = await chercherMatchsUsap(saison, campagne.ligue);
  const rencontres: Rencontre[] = [];
  const startYear = Number(saison.slice(0, 4));

  for (const resume of resumes) {
    const feuille = await lireMatch(campagne.ligue, resume.id);
    // Le tour vient du calendrier, la feuille ne le porte pas toujours.
    feuille.tour = resume.tour || feuille.tour;
    const isHome = feuille.domicile.id === USAP_ESPN;
    const usap = isHome ? feuille.domicile : feuille.exterieur;
    const adverse = isHome ? feuille.exterieur : feuille.domicile;
    const date = new Date(feuille.date || resume.date);
    const jour = date.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
    const etiquette = `${jour} ${adverse.nom}`;

    const opponentNom = CLUBS_ESPN[adverse.nom];
    if (!opponentNom) {
      echecs.push(`${etiquette} : club « ${adverse.nom} » inconnu de CLUBS_ESPN`);
      continue;
    }
    if (!/^Poule J\d+$|^(Quart|Demi|Finale)/.test(feuille.tour)) {
      echecs.push(`${etiquette} : tour « ${feuille.tour} » sans libellé connu`);
      continue;
    }
    if (usap.score == null || adverse.score == null) {
      echecs.push(`${etiquette} : score absent`);
      continue;
    }

    const alertes: string[] = [];
    for (const [camp, equipe] of [
      ["USAP", usap],
      [opponentNom, adverse],
    ] as const) {
      const titulaires = equipe.joueurs.filter((j) => j.isStarter).length;
      if (titulaires !== 15) {
        echecs.push(`${etiquette} : ${camp} aligne ${titulaires} titulaires`);
      }
      if (equipe.joueurs.length < 22) {
        alertes.push(`${camp} : ${equipe.joueurs.length} joueurs sur la feuille`);
      }
      const numeros = new Set(equipe.joueurs.map((j) => j.numero));
      if (numeros.size !== equipe.joueurs.length) {
        echecs.push(`${etiquette} : ${camp} porte deux fois le même dossard`);
      }
    }

    const realUsap = realisations(usap);
    const realAdverse = realisations(adverse);
    for (const [camp, r, equipe] of [
      ["USAP", realUsap, usap],
      [opponentNom, realAdverse, adverse],
    ] as const) {
      if (!r.coherent) {
        alertes.push(
          `${camp} : ${r.total} points reconstitués pour ${equipe.score} au score — ` +
            "réalisations non écrites",
        );
      }
    }

    const isKnockout = !feuille.tour.startsWith("Poule");
    const bonus = computeBonuses({
      competitionShortName: campagne.competition,
      seasonStartYear: startYear,
      isKnockout,
      scoreUsap: usap.score,
      scoreOpponent: adverse.score,
      triesUsap: realUsap.coherent ? realUsap.essais : null,
      triesOpponent: realAdverse.coherent ? realAdverse.essais : null,
    });

    rencontres.push({
      feuille,
      jour,
      date,
      kickoffTime: date.toLocaleTimeString("fr-FR", {
        timeZone: "Europe/Paris",
        hour: "2-digit",
        minute: "2-digit",
      }),
      isHome,
      opponentNom,
      usap,
      adverse,
      realUsap,
      realAdverse,
      bonusOffensif: bonus.bonusOffensif,
      bonusDefensif: bonus.bonusDefensif,
      bonusIndecidable: bonus.triesMissing,
      resultat:
        usap.score > adverse.score
          ? MatchResult.VICTOIRE
          : usap.score < adverse.score
            ? MatchResult.DEFAITE
            : MatchResult.NUL,
      alertes,
    });
  }
  return rencontres;
}

/**
 * Le garde-fou : la poule reconstituée doit redonner le classement de
 * Wikipédia. Rend la liste des écarts, vide si tout retombe. Les essais ne
 * sont comparés que si toutes les feuilles du camp bouclent ; sinon ils sont
 * rendus en avertissement.
 */
function controlerLaPoule(
  rencontres: Rencontre[],
  officiel: ClassementDePoule,
): { ecarts: string[]; avertissements: string[] } {
  const poule = rencontres.filter((r) => r.feuille.tour.startsWith("Poule"));
  const v = poule.filter((r) => r.resultat === MatchResult.VICTOIRE).length;
  const n = poule.filter((r) => r.resultat === MatchResult.NUL).length;
  const d = poule.filter((r) => r.resultat === MatchResult.DEFAITE).length;
  const pour = poule.reduce((s, r) => s + r.usap.score!, 0);
  const contre = poule.reduce((s, r) => s + r.adverse.score!, 0);
  const bo = poule.filter((r) => r.bonusOffensif).length;
  const bd = poule.filter((r) => r.bonusDefensif).length;
  const points = 4 * v + 2 * n + bo + bd;

  const ecarts = [
    poule.length !== officiel.joues ? `${poule.length} joués pour ${officiel.joues}` : null,
    v !== officiel.victoires ? `${v}V pour ${officiel.victoires}` : null,
    n !== officiel.nuls ? `${n}N pour ${officiel.nuls}` : null,
    d !== officiel.defaites ? `${d}D pour ${officiel.defaites}` : null,
    pour !== officiel.pour ? `${pour} marqués pour ${officiel.pour}` : null,
    contre !== officiel.contre ? `${contre} encaissés pour ${officiel.contre}` : null,
    bo !== officiel.bonusOffensifs ? `${bo} BO pour ${officiel.bonusOffensifs}` : null,
    bd !== officiel.bonusDefensifs ? `${bd} BD pour ${officiel.bonusDefensifs}` : null,
    points !== officiel.points ? `${points} points pour ${officiel.points}` : null,
  ].filter((e): e is string => e != null);

  const avertissements: string[] = [];
  for (const [camp, choix, attendu] of [
    ["marqués", (r: Rencontre) => r.realUsap, officiel.essaisPour],
    ["encaissés", (r: Rencontre) => r.realAdverse, officiel.essaisContre],
  ] as const) {
    const bouclent = poule.filter((r) => choix(r).coherent);
    const essais = bouclent.reduce((s, r) => s + choix(r).essais, 0);
    if (bouclent.length === poule.length) {
      if (essais !== attendu) ecarts.push(`${essais} essais ${camp} pour ${attendu}`);
    } else {
      avertissements.push(
        `essais ${camp} : ${essais} sur ${bouclent.length} feuille(s) qui bouclent, ` +
          `${attendu} au classement — ${poule.length - bouclent.length} feuille(s) muette(s)`,
      );
    }
  }
  return { ecarts, avertissements };
}

// =============================================================================
// ÉCRITURE
// =============================================================================

interface LigneAEcrire {
  isOpponent: boolean;
  playerId: string;
  shirtNumber: number;
  isStarter: boolean;
  isCaptain: boolean;
  positionPlayed: Position | null;
  tries: number;
  conversions: number;
  penalties: number;
  dropGoals: number;
  totalPoints: number;
  yellowCard: boolean;
  redCard: boolean;
}

/**
 * Les lignes d'un camp, fiches résolues par `lib/joueurs.ts`.
 *
 * **Deux passes, et l'ordre compte.** La première (`creer: false`) ne crée
 * rien : elle apparie les fiches connues, ce qui suffit au contrôle des
 * dossards — il ne regarde que celles-là. La seconde crée ce qui manque,
 * pour les seuls camps retenus. Sans cela, un camp écarté laissait derrière
 * lui les fiches de ses joueurs, sans aucune feuille : Trévise, le
 * 10 octobre 2009, en avait semé onze.
 */
async function resoudreCamp(
  camp: string,
  isOpponent: boolean,
  equipe: EspnEquipe,
  ecrireRealisations: boolean,
  creer: boolean,
): Promise<LigneAEcrire[]> {
  const lignes: LigneAEcrire[] = [];
  if (creer) console.log(`\n  --- ${camp} ---`);
  for (const j of equipe.joueurs) {
    const playerId = await trouverOuCreerJoueur(
      prisma,
      { firstName: j.firstName, lastName: j.lastName, numero: j.numero },
      { dryRun: DRY_RUN || !creer, journal: creer ? (m) => console.log(m) : () => {} },
    );
    // Le poste du banc ne se déduit pas du numéro : on reprend celui de la
    // fiche, faute de mieux — et jamais celui qu'ESPN écrit.
    let poste: Position | null = j.isStarter ? (POSTE_PAR_NUMERO[j.numero] ?? null) : null;
    if (!j.isStarter && playerId) {
      const fiche = await prisma.player.findUnique({
        where: { id: playerId },
        select: { position: true },
      });
      poste = fiche?.position ?? null;
    }
    const marques = ecrireRealisations
      ? [
          j.essais ? `${j.essais}E` : null,
          j.transformations ? `${j.transformations}T` : null,
          j.penalites ? `${j.penalites}P` : null,
          j.drops ? `${j.drops}D` : null,
        ]
          .filter(Boolean)
          .join(" ")
      : "";
    if (creer) console.log(
      `    n°${String(j.numero).padStart(2)} ${j.firstName} ${j.lastName}` +
        `${j.isCaptain ? " (cap)" : ""}${poste ? ` [${poste}]` : ""}` +
        `${marques ? ` — ${marques}` : ""}${j.jaunes ? " 🟨" : ""}${j.rouges ? " 🟥" : ""}`,
    );
    lignes.push({
      isOpponent,
      playerId,
      shirtNumber: j.numero,
      isStarter: j.isStarter,
      isCaptain: j.isCaptain,
      positionPlayed: poste,
      tries: ecrireRealisations ? j.essais : 0,
      conversions: ecrireRealisations ? j.transformations : 0,
      penalties: ecrireRealisations ? j.penalites : 0,
      dropGoals: ecrireRealisations ? j.drops : 0,
      totalPoints: ecrireRealisations ? j.points : 0,
      yellowCard: j.jaunes > 0,
      redCard: j.rouges > 0,
    });
  }
  return lignes;
}

async function main() {
  if (!SAISON || !(SAISON in CAMPAGNES)) {
    console.error(
      `Usage : npx tsx scripts/seed-cup-espn.ts <saison> [--dry] [--match=AAAA-MM-JJ]\n` +
        `Saisons connues : ${Object.keys(CAMPAGNES).join(", ")}`,
    );
    process.exit(1);
  }
  const campagne = CAMPAGNES[SAISON];
  console.log(
    `=== Coupe d'Europe ${SAISON} depuis ESPN${DRY_RUN ? " (simulation)" : ""} ===\n` +
      `${campagne.note}\n`,
  );

  const saison = await prisma.season.findFirstOrThrow({ where: { label: SAISON } });
  const competition = await prisma.competition.findFirstOrThrow({
    where: { shortName: campagne.competition },
  });
  await assurerAdversaires(campagne);

  const echecs: string[] = [];
  const rencontres = await lireCampagne(SAISON, campagne, echecs);

  console.log("");
  for (const r of rencontres) {
    const marques = (real: Realisations) =>
      real.coherent
        ? [
            real.essais ? `${real.essais}E` : null,
            real.transformations ? `${real.transformations}T` : null,
            real.penalites ? `${real.penalites}P` : null,
            real.drops ? `${real.drops}D` : null,
          ]
            .filter(Boolean)
            .join(" ") || "0"
        : "?";
    console.log(
      `${r.jour} ${r.kickoffTime} ${r.feuille.tour.padEnd(15)} ${r.isHome ? "H" : "A"} ` +
        `${r.opponentNom.padEnd(12)} ${r.usap.score}-${r.adverse.score}` +
        ` (mt ${r.usap.miTemps ?? "?"}-${r.adverse.miTemps ?? "?"})` +
        `${r.bonusOffensif ? " BO" : ""}${r.bonusDefensif ? " BD" : ""}${r.bonusIndecidable ? " BO?" : ""}` +
        ` | USAP ${marques(r.realUsap)} · ${r.opponentNom} ${marques(r.realAdverse)}`,
    );
    for (const a of r.alertes) console.log(`    ⚠ ${a}`);
  }

  // ---- Le garde-fou, avant toute écriture --------------------------------
  const { ecarts, avertissements } = controlerLaPoule(rencontres, campagne.poule);
  const avertissementsPoule = avertissements.length;
  console.log("");
  for (const a of avertissements) console.log(`  ⚠ ${a}`);
  if (echecs.length > 0 || ecarts.length > 0) {
    for (const e of echecs) console.log(`  ⚠ ${e}`);
    if (ecarts.length > 0) {
      console.log(`  ⚠ écart avec le classement de poule (Wikipédia) : ${ecarts.join(", ")}`);
    }
    console.log("\nRien n'est écrit.");
    process.exitCode = 1;
    return;
  }
  console.log("  ✔ poule conforme au classement de Wikipédia");

  // ---- Écriture -----------------------------------------------------------
  let crees = 0;
  let majs = 0;
  let lignesEcrites = 0;
  for (const r of rencontres) {
    if (SEUL && r.jour !== SEUL) continue;
    const opponent = await prisma.opponent.findFirst({
      where: { OR: [{ shortName: r.opponentNom }, { name: r.opponentNom }] },
      select: { id: true },
    });
    // En simulation, un adversaire encore à créer n'empêche pas de relire les
    // compositions : c'est précisément le camp catalan qu'on veut relire.
    if (!opponent && !DRY_RUN) {
      throw new Error(`adversaire « ${r.opponentNom} » introuvable en base`);
    }

    console.log(`\n=== ${r.jour} ${r.isHome ? "USAP" : r.opponentNom} – ${r.isHome ? r.opponentNom : "USAP"} ===`);
    // Première passe, sans création : de quoi contrôler les dossards.
    const lignes = [
      ...(await resoudreCamp("USAP", false, r.usap, r.realUsap.coherent, false)),
      ...(await resoudreCamp(r.opponentNom, true, r.adverse, r.realAdverse.coherent, false)),
    ];

    // Le contrôle des dossards, sur les fiches déjà connues : en simulation
    // les fiches à créer n'ont pas d'identifiant et sont laissées de côté.
    //
    // **Un camp brouillé n'écarte que lui**, à la différence de la LNR, dont
    // les deux compositions viennent d'une même page. Chez ESPN les deux
    // listes sont indépendantes, et l'accident l'a montré : à Trévise le
    // 10 octobre 2009, il manque un pilier à la liste de Benetton et tous
    // les numéros suivants sont décalés d'un cran — 17 % d'accord —, quand
    // le camp catalan de la même feuille est à 93 %. La rencontre elle-même
    // est écrite dans tous les cas : son score est validé par la poule.
    const campsEcartes = new Set<boolean>();
    for (const [camp, isOpponent] of [
      ["USAP", false],
      [r.opponentNom, true],
    ] as const) {
      const titulaires = lignes
        .filter((l) => l.isOpponent === isOpponent && l.isStarter && l.playerId)
        .map((l) => ({ playerId: l.playerId, numero: l.shirtNumber }));
      const bilan = await concordanceDesDossards(prisma, SAISON!, titulaires);
      if (bilan.taux == null) {
        console.log(`  dossards : ${camp} — trop peu de repères en base pour conclure`);
        continue;
      }
      console.log(
        `  dossards : ${camp} — ${(bilan.taux * 100).toFixed(0)} % d'accord ` +
          `avec le reste de la base, sur ${bilan.compares} titulaires`,
      );
      if (bilan.fabriques) {
        campsEcartes.add(isOpponent);
        avertissements.push(
          `${r.jour} ${r.opponentNom} : dossards de ${camp} incohérents avec la base — ` +
            "composition écartée, la rencontre est écrite sans elle",
        );
      }
    }
    // Seconde passe, avec création, pour les seuls camps retenus.
    const lignesRetenues = [
      ...(campsEcartes.has(false)
        ? []
        : await resoudreCamp("USAP", false, r.usap, r.realUsap.coherent, true)),
      ...(campsEcartes.has(true)
        ? []
        : await resoudreCamp(r.opponentNom, true, r.adverse, r.realAdverse.coherent, true)),
    ];
    if (DRY_RUN || !opponent) continue;

    const venueId = await terrainDuMatch(prisma, {
      opponentId: opponent.id,
      isHome: r.isHome,
      startYear: saison.startYear,
      jour: r.jour,
    });
    const donnees: Prisma.MatchUncheckedCreateInput = {
      slug: generateMatchSlug({
        competitionShortName: competition.shortName,
        competitionName: competition.name,
        opponentShortName: r.opponentNom,
        opponentName: r.opponentNom,
        isHome: r.isHome,
        matchday: null,
        round: r.feuille.tour,
        date: r.date,
      }),
      date: r.date,
      kickoffTime: r.kickoffTime,
      seasonId: saison.id,
      competitionId: competition.id,
      matchday: null,
      round: r.feuille.tour,
      isHome: r.isHome,
      venueId,
      opponentId: opponent.id,
      scoreUsap: r.usap.score,
      scoreOpponent: r.adverse.score,
      halfTimeUsap: r.usap.miTemps,
      halfTimeOpponent: r.adverse.miTemps,
      result: r.resultat,
      bonusOffensif: r.bonusOffensif,
      bonusDefensif: r.bonusDefensif,
      attendance: r.feuille.affluence,
      triesUsap: r.realUsap.coherent ? r.realUsap.essais : null,
      conversionsUsap: r.realUsap.coherent ? r.realUsap.transformations : null,
      penaltiesUsap: r.realUsap.coherent ? r.realUsap.penalites : null,
      dropGoalsUsap: r.realUsap.coherent ? r.realUsap.drops : null,
      penaltyTriesUsap: r.realUsap.coherent ? 0 : null,
      triesOpponent: r.realAdverse.coherent ? r.realAdverse.essais : null,
      conversionsOpponent: r.realAdverse.coherent ? r.realAdverse.transformations : null,
      penaltiesOpponent: r.realAdverse.coherent ? r.realAdverse.penalites : null,
      dropGoalsOpponent: r.realAdverse.coherent ? r.realAdverse.drops : null,
      penaltyTriesOpponent: r.realAdverse.coherent ? 0 : null,
    };

    const existant = await prisma.match.findFirst({
      where: {
        seasonId: saison.id,
        opponentId: opponent.id,
        date: { gte: new Date(`${r.jour}T00:00:00Z`), lt: new Date(`${r.jour}T23:59:59Z`) },
      },
      select: {
        id: true,
        halfTimeUsap: true,
        halfTimeOpponent: true,
        attendance: true,
        videoUrl: true,
        _count: { select: { players: true } },
      },
    });
    let matchId: string;
    if (existant) {
      await prisma.match.update({
        where: { id: existant.id },
        data: preserverAnnexes(donnees, existant),
      });
      matchId = existant.id;
      majs++;
      if (existant._count.players > 0) {
        await prisma.matchEvent.deleteMany({ where: { matchId } });
        await prisma.matchPlayer.deleteMany({ where: { matchId } });
        console.log(`  ${existant._count.players} ligne(s) effacée(s) avant réécriture`);
      }
    } else {
      matchId = (await prisma.match.create({ data: donnees, select: { id: true } })).id;
      crees++;
    }
    await prisma.matchPlayer.createMany({
      data: lignesRetenues.map((l) => ({ ...l, matchId })),
    });
    lignesEcrites += lignesRetenues.length;
  }

  console.log(
    `\n=== ${rencontres.length} rencontre(s) lue(s)` +
      (DRY_RUN ? "" : `, ${crees} créée(s), ${majs} mise(s) à jour, ${lignesEcrites} lignes écrites`) +
      `, ${echecs.length} en échec ===`,
  );
  for (const a of avertissements.slice(avertissementsPoule)) console.log(`  ⚠ ${a}`);
  for (const e of echecs) console.log(`  ⚠ ${e}`);
  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
  if (!DRY_RUN) {
    console.log(
      "\nÀ enchaîner :\n" +
        "  npx tsx scripts/detect-duplicate-players.ts\n" +
        "  npx tsx scripts/fix-bonus-points.ts --dry",
    );
  }
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

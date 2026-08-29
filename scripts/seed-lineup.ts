/**
 * Crée les deux compositions d'un match, depuis la source officielle.
 *
 * Deux sources, une seule logique : la LNR pour le championnat, l'EPCR pour
 * les coupes d'Europe — toutes deux donnent vingt-trois joueurs par camp, avec
 * dossard et brassard. La compétition du match décide.
 *
 * Le pendant amont de `seed-opponent-sheet.ts` : celui-ci suppose la
 * composition déjà en base et n'y écrit que les réalisations et les temps de
 * jeu ; celui-là fabrique les vingt-trois lignes de chaque camp quand il n'y
 * en a aucune. C'est ce qu'il faut pour 2021-2022, dont les 31 rencontres
 * existent sans le moindre joueur.
 *
 * Usage :
 *   npx tsx scripts/seed-lineup.ts 2021-09-04 --dry
 *   npx tsx scripts/seed-lineup.ts 2021-09-04
 *   npx tsx scripts/seed-lineup.ts 2021-09-04 --force   # réécrit une feuille existante
 *
 * Ce qu'il écrit : dossard, titulaire ou remplaçant, brassard de capitaine, et
 * le poste tenu — déduit du numéro pour les quinze de départ, repris du poste
 * de référence de la fiche pour le banc, où le numéro ne dit rien. Les
 * réalisations et les minutes restent vides : elles viennent de
 * `seed-opponent-sheet.ts`, qui les reconstitue depuis la même feuille.
 *
 * Rien n'est écrit avant que les quarante-six identités soient résolues : un
 * nom qui coince au milieu laisserait sinon une feuille à moitié remplie.
 *
 * Idempotent, et prudent avec ça : un match qui porte déjà des lignes est
 * laissé tel quel, sauf `--force`. La réécriture efface alors réalisations et
 * minutes avec les lignes — il faut relancer le script de feuille derrière.
 *
 * Contrôles, tous bloquants — une composition fausse contamine ensuite les
 * temps de jeu des deux camps :
 *   - le camp de l'USAP déduit de l'URL doit correspondre à `isHome` ;
 *   - vingt-trois joueurs par camp, dont exactement quinze titulaires. La LNR
 *     dessinait seize Lyonnais sur son terrain du 29 octobre 2022, et chaque
 *     titulaire de trop ajoute jusqu'à 80 minutes fictives au total de
 *     l'équipe ;
 *   - au plus un capitaine par camp. La feuille du 29 octobre 2022 en
 *     désignait quinze côté catalan : `lireCompositions()` retire le
 *     renseignement dans ce cas, et l'on écrit alors « aucun ».
 */

import { PrismaClient, type Position } from "@prisma/client";
import {
  chercherFeuille,
  lireCompositions,
  phasesLnr,
  type LnrTitulaire,
} from "./lib/lnr";
import { USAP, chercherMatchUsap, lireMatch } from "./lib/epcr";
import { POSTE_PAR_NUMERO, trouverOuCreerJoueur } from "./lib/joueurs";

const prisma = new PrismaClient();

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry");
const FORCE = ARGS.includes("--force");
const DATE = ARGS.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));

if (!DATE) {
  console.error(
    "Une date de match est attendue.\n" +
      "  npx tsx scripts/seed-lineup.ts 2021-09-04 --dry\n" +
      "Options : --dry (simulation), --force (réécrit une feuille existante)",
  );
  process.exit(1);
}

/** Contrôles de forme sur une composition, avant toute écriture. */
function verifier(camp: string, joueurs: LnrTitulaire[]): void {
  if (joueurs.length !== 23) {
    throw new Error(`${camp} : ${joueurs.length} joueurs sur la feuille, 23 attendus`);
  }
  const titulaires = joueurs.filter((j) => j.isStarter);
  if (titulaires.length !== 15) {
    throw new Error(
      `${camp} : ${titulaires.length} titulaires, 15 attendus — ` +
        "chaque titulaire de trop vaut jusqu'à 80 minutes fictives",
    );
  }
  const numeros = new Set(joueurs.map((j) => j.numero));
  if (numeros.size !== 23) throw new Error(`${camp} : dossards en double`);
  const capitaines = joueurs.filter((j) => j.isCaptain);
  if (capitaines.length > 1) {
    throw new Error(`${camp} : ${capitaines.length} capitaines sur la feuille`);
  }
}

interface LigneAEcrire {
  isOpponent: boolean;
  playerId: string;
  shirtNumber: number;
  isStarter: boolean;
  isCaptain: boolean;
  positionPlayed: Position | null;
}

/**
 * Résout les vingt-trois identités d'un camp **sans écrire de composition**.
 *
 * Rien n'est posé sur le match avant que les deux camps soient résolus : un
 * nom qui coince au milieu laisserait sinon une feuille à moitié remplie, ce
 * qui est arrivé pour Pau le 2 octobre 2021 — 23 Catalans et 7 Palois, le
 * script s'étant arrêté sur un doublon de la base.
 */
async function resoudreCamp(
  camp: string,
  isOpponent: boolean,
  joueurs: LnrTitulaire[],
): Promise<LigneAEcrire[]> {
  const lignes: LigneAEcrire[] = [];
  console.log(`\n  --- ${camp} ---`);
  for (const officiel of [...joueurs].sort((a, b) => a.numero - b.numero)) {
    const playerId = await trouverOuCreerJoueur(prisma, officiel, {
      dryRun: DRY_RUN,
      journal: (m) => console.log(m),
    });

    // Le poste du banc ne se déduit pas du numéro : 16 à 23 ne désignent
    // aucune place sur le terrain. On reprend celui de la fiche, faute de
    // mieux — la vraie place tenue n'apparaîtra qu'avec le changement.
    let poste: Position | null = officiel.isStarter
      ? (POSTE_PAR_NUMERO[officiel.numero] ?? null)
      : null;
    if (!officiel.isStarter && playerId) {
      const fiche = await prisma.player.findUnique({
        where: { id: playerId },
        select: { position: true },
      });
      poste = fiche?.position ?? null;
    }

    const etiquette =
      `    n°${String(officiel.numero).padStart(2)} ` +
      `${officiel.firstName} ${officiel.lastName}` +
      `${officiel.isCaptain ? " (cap)" : ""}` +
      `${poste ? ` [${poste}]` : ""}`;
    console.log(etiquette);

    lignes.push({
      isOpponent,
      playerId,
      shirtNumber: officiel.numero,
      isStarter: officiel.isStarter,
      isCaptain: officiel.isCaptain ?? false,
      positionPlayed: poste,
    });
  }
  return lignes;
}

async function main() {
  console.log(`=== Composition du ${DATE}${DRY_RUN ? " (simulation)" : ""} ===`);

  const match = await prisma.match.findFirstOrThrow({
    where: {
      date: { gte: new Date(`${DATE}T00:00:00Z`), lt: new Date(`${DATE}T23:59:59Z`) },
    },
    include: {
      opponent: { select: { name: true, shortName: true } },
      competition: { select: { name: true, shortName: true } },
      season: { select: { label: true } },
      players: { select: { id: true } },
    },
  });

  const adversaire = match.opponent.shortName ?? match.opponent.name;
  console.log(
    `${match.season.label} J${match.matchday ?? "?"} — ` +
      `${match.isHome ? "USAP" : adversaire} ${match.scoreUsap ?? "?"}-${match.scoreOpponent ?? "?"} ` +
      `${match.isHome ? adversaire : "USAP"}`,
  );

  if (match.players.length > 0 && !FORCE) {
    console.log(
      `\n${match.players.length} ligne(s) déjà en base : rien à faire. ` +
        "Ajouter --force pour les réécrire (réalisations et minutes comprises).",
    );
    return;
  }

  // Deux sources, selon la compétition : la LNR pour le championnat, l'EPCR
  // pour les coupes d'Europe. Même logique de part et d'autre — vingt-trois
  // joueurs par camp, avec dossard et brassard.
  const estCoupeEurope = /Champions|Challenge/i.test(match.competition.name);
  let compositions: { usap: LnrTitulaire[]; adversaire: LnrTitulaire[] };

  if (estCoupeEurope) {
    const resume = await chercherMatchUsap(match.season.label, DATE!);
    if (!resume) throw new Error(`Match introuvable dans le flux de l'EPCR au ${DATE}`);
    const feuille = await lireMatch(resume.id);
    console.log(`Flux EPCR : match ${resume.id} — ${feuille.domicile.nom} contre ${feuille.exterieur.nom}`);

    const usapEstRecevant = feuille.domicile.id === USAP;
    if (usapEstRecevant !== match.isHome) {
      throw new Error(
        `L'EPCR donne l'USAP ${usapEstRecevant ? "recevant" : "visiteur"}, ` +
          `la base dit ${match.isHome ? "recevant" : "visiteur"}`,
      );
    }
    const versTitulaire = (j: {
      firstName: string;
      lastName: string;
      numero: number;
      isStarter: boolean;
      isCaptain: boolean;
    }): LnrTitulaire => ({
      firstName: j.firstName,
      lastName: j.lastName,
      url: "",
      numero: j.numero,
      isStarter: j.isStarter,
      isCaptain: j.isCaptain,
    });
    const catalans = usapEstRecevant ? feuille.domicile : feuille.exterieur;
    const autres = usapEstRecevant ? feuille.exterieur : feuille.domicile;
    compositions = {
      usap: catalans.joueurs.map(versTitulaire),
      adversaire: autres.joueurs.map(versTitulaire),
    };
  } else {
    // Journée de championnat, ou barrage d'accession — dont le segment d'URL
    // a changé trois fois de nom, d'où plusieurs candidats.
    const phases = phasesLnr(
      match.season.label,
      match.matchday,
      /Barrage/i.test(match.competition.name),
    );
    if (phases.length === 0) {
      throw new Error(
        `Compétition « ${match.competition.name} » sans journée : phase LNR inconnue.`,
      );
    }
    let url: string | null = null;
    for (const phase of phases) {
      url = await chercherFeuille(match.season.label, phase);
      if (url) break;
    }
    if (!url) throw new Error(`Feuille LNR introuvable pour ${phases.join(" / ")}`);
    console.log(`Feuille : ${url}`);

    compositions = await lireCompositions(url);
    const usapEstRecevant = /\/\d+-perpignan-/.test(url);
    if (usapEstRecevant !== match.isHome) {
      throw new Error(
        `L'URL donne l'USAP ${usapEstRecevant ? "recevant" : "visiteur"}, ` +
          `la base dit ${match.isHome ? "recevant" : "visiteur"}`,
      );
    }
  }

  verifier("USAP", compositions.usap);
  verifier(adversaire, compositions.adversaire);

  // Les deux camps d'abord, l'écriture ensuite.
  const lignes = [
    ...(await resoudreCamp("USAP", false, compositions.usap)),
    ...(await resoudreCamp(adversaire, true, compositions.adversaire)),
  ];

  if (!DRY_RUN) {
    if (match.players.length > 0) {
      await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
      await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
      console.log(`\n${match.players.length} ligne(s) effacée(s) avant réécriture.`);
    }
    await prisma.matchPlayer.createMany({
      data: lignes.map((l) => ({ ...l, matchId: match.id })),
    });
  }

  console.log(
    `\n=== ${lignes.length} lignes ${DRY_RUN ? "à écrire" : "écrites"} ===\n` +
      "Réalisations et temps de jeu : enchaîner avec\n" +
      (estCoupeEurope
        ? `  npx tsx scripts/seed-cup-sheet.ts --match=${DATE}`
        : `  npx tsx scripts/seed-opponent-sheet.ts ${match.season.label} --match=${DATE} --usap`),
  );
  if (DRY_RUN) console.log("Simulation — relancer sans --dry pour appliquer.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

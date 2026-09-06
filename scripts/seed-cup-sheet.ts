/**
 * Feuille de match complète des rencontres de coupe d'Europe, depuis l'EPCR.
 *
 * Dernier trou du chantier des feuilles : la LNR ne couvre que le
 * championnat, et les dix-huit matchs européens de la base tenaient leurs
 * réalisations d'ESPN ou d'allrugby — quand ils en avaient. Quatre matchs de
 * Challenge 2023-2024 n'avaient aucun détail adverse, et les temps de jeu des
 * autres étaient inventés : Lucas Bachelier et Valentin Moro figuraient à 0'
 * contre les Lions le 10 décembre 2023, alors qu'ils ont joué 25 et 19
 * minutes.
 *
 * L'EPCR donne tout d'un coup, et pour les deux camps : réalisations par
 * joueur qui retombent exactement sur le score, cartons, entrées et sorties,
 * plus l'arbitre, l'affluence et le score à la mi-temps que la LNR ne publie
 * pas. Les deux côtés sont donc réécrits — celui de l'USAP compris, puisque
 * c'est là que les minutes fictives se trouvaient.
 *
 * Source : rugby-union-feeds.incrowdsports.com, le flux public du site de
 *          l'EPCR, via scripts/lib/epcr.ts
 *
 * L'appariement se fait sur le **dossard**, l'identité servant de contrôle :
 * les compositions ont été remises en accord avec ces mêmes feuilles par
 * fix-opponent-lineup.ts, qui sait désormais lire l'EPCR. Un nom qui ne
 * correspond pas au dossard fait échouer le match entier.
 *
 * Contrôles avant écriture, par match :
 *   - le camp de l'USAP et les deux scores doivent correspondre à la base ;
 *   - la somme des points de chaque camp doit retomber sur son score, essais
 *     de pénalité déduits ;
 *   - le nombre d'essais doit correspondre au compteur du match.
 * Les temps de jeu et le compte des essais de pénalité font l'objet d'un
 * simple avertissement.
 *
 * Usage :
 *   npx tsx scripts/seed-cup-sheet.ts --dry
 *   npx tsx scripts/seed-cup-sheet.ts 2023-2024 --dry --detail
 *   npx tsx scripts/seed-cup-sheet.ts --match=2023-12-10
 *
 * Idempotent : la feuille est remise à zéro avant d'être réécrite.
 */

import { PrismaClient } from "@prisma/client";
import { memeJoueur } from "./lib/noms";
import { privationDuJaune } from "./lib/feuilles";
import { baremeDeMatch } from "../src/lib/scoring";
import { trouverOuCreerArbitre } from "./lib/arbitres";
import { USAP, chercherMatchUsap, lireMatch, type EpcrEquipe, type EpcrJoueur } from "./lib/epcr";

const prisma = new PrismaClient();

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry");
const DETAIL = ARGS.includes("--detail");
const SAISON = ARGS.find((a) => /^\d{4}-\d{4}$/.test(a));
const SEUL = ARGS.find((a) => a.startsWith("--match="))?.slice("--match=".length);

/** Compétitions que la LNR ne couvre pas et que l'EPCR publie. */
const COUPES_EUROPE = ["Challenge Européen", "H-Cup"];

const DUREE = 80;

/**
 * Minutes dont une équipe est privée par un carton rouge, en coupe d'Europe.
 *
 * **CE N'EST PAS `80 − minute du carton`.** Cette règle-là, celle du
 * championnat et de CLAUDE.md, suppose un rouge définitif où l'équipe finit à
 * quatorze. La coupe d'Europe applique le **carton rouge de 20 minutes** : le
 * joueur sanctionné sort bien pour de bon, mais son poste est repourvu au
 * bout de la période de sanction. L'équipe ne finit pas à quatorze, elle y
 * joue vingt minutes.
 *
 * Le Dragons-Perpignan du 7 décembre 2025 le démontre, et c'est le seul cas
 * de la base : Duncan Paia'aua est exclu à la 14ᵉ, Job Poulet entre à la
 * 35ᵉ, et la feuille totalise 1 179 minutes. La règle du championnat en
 * attendait 1 134 — quarante-cinq de moins que la réalité, et l'écart a été
 * pris pour une anomalie de la base pendant tout un audit. Celle-ci en attend
 * 1 180.
 *
 * **La minute qui reste n'est pas rattrapée, et c'est délibéré.** Les minutes
 * d'Opta ne se recoupent pas au ras de la minute : il compte lui-même 1 179,
 * et sa feuille laisse une sortie de la 63ᵉ sans entrée en regard.
 * Reconstituer la privation en appariant les entrées aux sorties suivrait
 * donc la source dans ses arrondis au lieu de la contrôler. Vingt minutes est
 * la règle ; l'écart résiduel se signale et se regarde, ce que fait déjà
 * l'alerte.
 */
const PRIVATION_ROUGE = 20;

/**
 * Minutes qu'une équipe doit totaliser : quinze joueurs sur toute la partie,
 * moins le temps passé à quatorze. Un rouge tardif prive moins de vingt
 * minutes, la rencontre s'achevant avant la fin de la sanction.
 */
function minutesAttendues(joueurs: EpcrJoueur[], duree: number): number {
  const privation = joueurs
    .filter((j) => j.rouge != null)
    .reduce((s, j) => s + Math.min(duree - j.rouge!, PRIVATION_ROUGE), 0);
  // Et dix minutes par carton jaune, ou ce qu'il en reste — la règle du
  // projet depuis le 6 septembre 2026, qui est aussi celle d'Opta.
  const jaunes = joueurs.reduce(
    (s, j) => s + (j.minutes == null ? 0 : privationDuJaune(j.jaune, j.subOut ?? j.rouge ?? duree)),
    0,
  );
  return 15 * duree - privation - jaunes;
}

interface Ligne {
  id: string;
  nom: string;
  shirtNumber: number | null;
  actuel: {
    minutes: number | null;
    subIn: number | null;
    subOut: number | null;
    points: number;
    tries: number;
  };
}

/** Écarts entre la feuille et la base, pour le relevé de simulation. */
function ecarts(ligne: Ligne, joueur: EpcrJoueur): string[] {
  const paires: Array<[string, unknown, unknown]> = [
    ["minutes", ligne.actuel.minutes, joueur.minutes],
    ["subIn", ligne.actuel.subIn, joueur.subIn],
    ["subOut", ligne.actuel.subOut, joueur.subOut],
    ["points", ligne.actuel.points, joueur.points],
    ["essais", ligne.actuel.tries, joueur.essais],
  ];
  return paires
    .filter(([, a, b]) => a !== b)
    .map(([champ, a, b]) => `${champ} ${a ?? "∅"}→${b ?? "∅"}`);
}

async function main() {
  console.log(
    `=== Feuilles de coupe d'Europe depuis l'EPCR${DRY_RUN ? " (simulation)" : ""} ===\n`,
  );

  const matchs = await prisma.match.findMany({
    where: {
      competition: { shortName: { in: COUPES_EUROPE } },
      ...(SAISON ? { season: { label: SAISON } } : {}),
    },
    orderBy: { date: "asc" },
    include: {
      season: { select: { label: true } },
      opponent: { select: { name: true, shortName: true } },
      referee: { select: { firstName: true, lastName: true } },
    },
  });

  let traites = 0;
  let lignesModifiees = 0;
  const echecs: string[] = [];
  const divergences: string[] = [];

  for (const match of matchs) {
    const jour = match.date.toISOString().slice(0, 10);
    if (SEUL && jour !== SEUL) continue;
    const adversaire = match.opponent.shortName ?? match.opponent.name;
    const etiquette = `${jour} ${adversaire.padEnd(16)} ${match.scoreUsap}-${match.scoreOpponent}`;

    const resume = await chercherMatchUsap(match.season.label, jour);
    if (!resume) {
      echecs.push(`${etiquette} : aucun match EPCR le ${jour}`);
      continue;
    }
    const feuille = await lireMatch(resume.id);
    const usapDomicile = feuille.domicile.id === USAP;
    if (usapDomicile !== match.isHome) {
      echecs.push(
        `${etiquette} : l'EPCR donne l'USAP ${usapDomicile ? "à domicile" : "à l'extérieur"}, la base dit l'inverse`,
      );
      continue;
    }
    const cotes: Array<{ equipe: EpcrEquipe; isOpponent: boolean; score: number }> = [
      {
        equipe: usapDomicile ? feuille.domicile : feuille.exterieur,
        isOpponent: false,
        score: match.scoreUsap,
      },
      {
        equipe: usapDomicile ? feuille.exterieur : feuille.domicile,
        isOpponent: true,
        score: match.scoreOpponent,
      },
    ];

    const ennuis: string[] = [];
    const alertes: string[] = [];
    const aEcrire: Array<{ id: string; joueur: EpcrJoueur }> = [];
    const modifiees: Array<{ ligne: Ligne; joueur: EpcrJoueur; camp: string }> = [];

    for (const cote of cotes) {
      const camp = cote.isOpponent ? adversaire : "USAP";
      if (cote.equipe.score !== cote.score) {
        ennuis.push(`${camp} : ${cote.equipe.score} à l'EPCR pour ${cote.score} en base`);
        continue;
      }

      const lignes: Ligne[] = (
        await prisma.matchPlayer.findMany({
          where: { matchId: match.id, isOpponent: cote.isOpponent },
          select: {
            id: true,
            shirtNumber: true,
            minutesPlayed: true,
            subIn: true,
            subOut: true,
            totalPoints: true,
            tries: true,
            player: { select: { firstName: true, lastName: true } },
          },
        })
      )
        .filter((l) => l.player)
        .map((l) => ({
          id: l.id,
          nom: `${l.player!.firstName} ${l.player!.lastName}`,
          shirtNumber: l.shirtNumber,
          actuel: {
            minutes: l.minutesPlayed,
            subIn: l.subIn,
            subOut: l.subOut,
            points: l.totalPoints,
            tries: l.tries,
          },
        }));

      // ---- Appariement par dossard, l'identité servant de contrôle --------
      for (const joueur of cote.equipe.joueurs) {
        const candidates = lignes.filter((l) => l.shirtNumber === joueur.numero);
        if (candidates.length !== 1) {
          ennuis.push(`${camp} n°${joueur.numero} : ${candidates.length} ligne(s) en base`);
          continue;
        }
        const ligne = candidates[0];
        const nomOfficiel = `${joueur.firstName} ${joueur.lastName}`;
        if (!memeJoueur(ligne.nom, nomOfficiel) && !memeJoueur(ligne.nom, joueur.known)) {
          ennuis.push(
            `${camp} n°${joueur.numero} : « ${ligne.nom} » en base pour « ${nomOfficiel} » sur la feuille`,
          );
          continue;
        }
        aEcrire.push({ id: ligne.id, joueur });
        if (ecarts(ligne, joueur).length > 0) modifiees.push({ ligne, joueur, camp });
      }

      // ---- Contrôles ------------------------------------------------------
      const points = cote.equipe.joueurs.reduce((s, j) => s + j.points, 0);
      const attendu = cote.score - baremeDeMatch(Number(match.season.label.slice(0, 4))).essaiDePenalite * cote.equipe.essaisDePenalite;
      if (points !== attendu) {
        ennuis.push(
          `${camp} : ${points} points reconstitués pour ${attendu} attendus ` +
            `(${cote.score} au score, ${cote.equipe.essaisDePenalite} essai(s) de pénalité)`,
        );
      }

      const essais = cote.equipe.joueurs.reduce((s, j) => s + j.essais, 0);
      const compteur = cote.isOpponent ? match.triesOpponent : match.triesUsap;
      if (compteur != null && essais !== compteur) {
        alertes.push(`${camp} : ${essais} essais sur la feuille, ${compteur} au compteur du match`);
      }
      const compteurEP = cote.isOpponent ? match.penaltyTriesOpponent : match.penaltyTriesUsap;
      if (cote.equipe.essaisDePenalite !== (compteurEP ?? 0)) {
        alertes.push(
          `${camp} : ${cote.equipe.essaisDePenalite} essai(s) de pénalité à l'EPCR, ` +
            `${compteurEP ?? "aucun compteur"} en base`,
        );
      }

      // Les minutes reconstituées se confrontent à celles d'Opta. Depuis le
      // 6 septembre 2026 les deux retirent les dix minutes d'un carton jaune,
      // et ne diffèrent plus que sur un joueur temporairement sorti, qu'Opta
      // arrête au coup de sifflet. Un écart ne condamne pas la feuille, il
      // demande un coup d'œil.
      //
      // L'attendu tient compte des cartons rouges, et de la période de
      // sanction de vingt minutes — cf. `minutesAttendues`. Comparer à
      // 15 × 80 en dur donnait quarante-cinq minutes d'écart apparent sur le
      // seul match de la base à carton rouge européen.
      const minutes = cote.equipe.joueurs.reduce((s, j) => s + (j.minutes ?? 0), 0);
      const opta = cote.equipe.joueurs.reduce((s, j) => s + (j.minutesOpta ?? 0), 0);
      const attenduMinutes = minutesAttendues(cote.equipe.joueurs, DUREE);
      if (minutes !== attenduMinutes) {
        const rouges = cote.equipe.joueurs.filter((j) => j.rouge != null);
        const mention = rouges.length
          ? ` — ${rouges.length} carton(s) rouge(s) à la ${rouges.map((j) => `${j.rouge}ᵉ`).join(", ")}`
          : "";
        alertes.push(
          `${camp} : ${minutes} minutes reconstituées pour ${attenduMinutes} attendues${mention} ` +
            `(Opta en compte ${opta})`,
        );
      }
    }

    if (ennuis.length > 0) {
      echecs.push(`${etiquette} :\n      ${ennuis.join("\n      ")}`);
      continue;
    }

    lignesModifiees += modifiees.length;
    for (const a of alertes) divergences.push(`${etiquette} : ${a}`);

    const arbitreBase = match.referee
      ? `${match.referee.firstName} ${match.referee.lastName}`
      : null;
    const annexe: string[] = [];
    if (feuille.arbitre && !arbitreBase) annexe.push(`arbitre ${feuille.arbitre}`);
    else if (feuille.arbitre && arbitreBase && !memeJoueur(arbitreBase, feuille.arbitre)) {
      divergences.push(
        `${etiquette} : arbitre « ${arbitreBase} » en base, « ${feuille.arbitre} » à l'EPCR`,
      );
    }
    // Une affluence à zéro se lit « aucun spectateur » alors qu'elle veut dire
    // « le flux ne la donne pas » — Benetton-USAP du 9 avril 2022.
    if (feuille.affluence && match.attendance == null) {
      annexe.push(`affluence ${feuille.affluence}`);
    }
    const miUsap = usapDomicile ? feuille.domicile.miTemps : feuille.exterieur.miTemps;
    const miAdv = usapDomicile ? feuille.exterieur.miTemps : feuille.domicile.miTemps;
    if (miUsap != null && miAdv != null && (match.halfTimeUsap !== miUsap || match.halfTimeOpponent !== miAdv)) {
      annexe.push(`mi-temps ${match.halfTimeUsap ?? "∅"}-${match.halfTimeOpponent ?? "∅"} → ${miUsap}-${miAdv}`);
    }

    console.log(
      `${etiquette} → EPCR ${feuille.id}, ${modifiees.length} ligne(s) modifiée(s)` +
        (annexe.length ? `, ${annexe.join(", ")}` : ""),
    );
    if (DETAIL) {
      for (const m of modifiees) {
        console.log(
          `    ~ ${m.camp.padEnd(16)} ${String(m.joueur.numero).padStart(2)} ` +
            `${m.joueur.firstName} ${m.joueur.lastName} : ${ecarts(m.ligne, m.joueur).join(", ")}`,
        );
      }
    }

    if (DRY_RUN) {
      traites++;
      continue;
    }

    // ---- Écriture -----------------------------------------------------------
    for (const { id, joueur } of aEcrire) {
      await prisma.matchPlayer.update({
        where: { id },
        data: {
          minutesPlayed: joueur.minutes,
          subIn: joueur.subIn,
          subOut: joueur.subOut,
          tries: joueur.essais,
          conversions: joueur.transformations,
          penalties: joueur.penalites,
          dropGoals: joueur.drops,
          totalPoints: joueur.points,
          yellowCard: joueur.jaune != null,
          yellowCardMin: joueur.jaune,
          redCard: joueur.rouge != null,
          redCardMin: joueur.rouge,
        },
      });
    }

    const refereeId =
      feuille.arbitre && !match.referee
        ? await trouverOuCreerArbitre(prisma, feuille.arbitre, DRY_RUN)
        : null;
    await prisma.match.update({
      where: { id: match.id },
      data: {
        ...(refereeId ? { refereeId } : {}),
        ...(feuille.affluence && match.attendance == null
          ? { attendance: feuille.affluence }
          : {}),
        ...(miUsap != null && miAdv != null
          ? { halfTimeUsap: miUsap, halfTimeOpponent: miAdv }
          : {}),
        penaltyTriesUsap: usapDomicile
          ? feuille.domicile.essaisDePenalite
          : feuille.exterieur.essaisDePenalite,
        penaltyTriesOpponent: usapDomicile
          ? feuille.exterieur.essaisDePenalite
          : feuille.domicile.essaisDePenalite,
      },
    });
    traites++;
  }

  console.log(
    `\n=== ${traites} match(s) ${DRY_RUN ? "prêts" : "écrits"}, ` +
      `${lignesModifiees} ligne(s) ${DRY_RUN ? "à modifier" : "modifiées"}, ` +
      `${echecs.length} en échec ===`,
  );
  for (const d of divergences) console.log(`  ⚠ ${d}`);
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

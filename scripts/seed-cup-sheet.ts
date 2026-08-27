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
import { USAP, chercherMatchUsap, lireMatch, type EpcrEquipe, type EpcrJoueur } from "./lib/epcr";
import { generateRefereeSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry");
const DETAIL = ARGS.includes("--detail");
const SAISON = ARGS.find((a) => /^\d{4}-\d{4}$/.test(a));
const SEUL = ARGS.find((a) => a.startsWith("--match="))?.slice("--match=".length);

/** Compétitions que la LNR ne couvre pas et que l'EPCR publie. */
const COUPES_EUROPE = ["Challenge Européen", "H-Cup"];

const DUREE = 80;

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

/** « Adam Leal » → prénom et nom, le dernier mot faisant le patronyme. */
function separerNom(complet: string): { firstName: string; lastName: string } {
  const mots = complet.trim().split(/\s+/);
  return {
    firstName: mots.slice(0, -1).join(" "),
    lastName: mots[mots.length - 1] ?? complet,
  };
}

/** Fiche arbitre correspondant au nom donné, créée au besoin. */
async function trouverOuCreerArbitre(nom: string): Promise<string | null> {
  const { firstName, lastName } = separerNom(nom);
  if (!lastName) return null;

  const tous = await prisma.referee.findMany({ select: { id: true, firstName: true, lastName: true } });
  const candidats = tous.filter((a) => memeJoueur(`${a.firstName} ${a.lastName}`, nom));
  if (candidats.length === 1) return candidats[0].id;
  if (candidats.length > 1) {
    throw new Error(`arbitre « ${nom} » : ${candidats.length} fiches candidates — à arbitrer`);
  }
  if (DRY_RUN) return null;

  const cree = await prisma.referee.create({
    data: { firstName, lastName, slug: `temp-${Date.now()}` },
  });
  await prisma.referee.update({
    where: { id: cree.id },
    data: { slug: generateRefereeSlug(firstName, lastName, cree.id) },
  });
  return cree.id;
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
      const attendu = cote.score - 7 * cote.equipe.essaisDePenalite;
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

      // Les minutes reconstituées se confrontent à celles d'Opta, qui les
      // calcule autrement : il retire les dix minutes d'un carton jaune et
      // arrête au coup de sifflet un joueur temporairement sorti. Un écart ne
      // condamne pas la feuille, il demande un coup d'œil.
      const minutes = cote.equipe.joueurs.reduce((s, j) => s + (j.minutes ?? 0), 0);
      const opta = cote.equipe.joueurs.reduce((s, j) => s + (j.minutesOpta ?? 0), 0);
      if (minutes !== 15 * DUREE) {
        alertes.push(
          `${camp} : ${minutes} minutes reconstituées pour ${15 * DUREE} attendues ` +
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
    if (feuille.affluence != null && match.attendance == null) {
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
      feuille.arbitre && !match.referee ? await trouverOuCreerArbitre(feuille.arbitre) : null;
    await prisma.match.update({
      where: { id: match.id },
      data: {
        ...(refereeId ? { refereeId } : {}),
        ...(feuille.affluence != null && match.attendance == null
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

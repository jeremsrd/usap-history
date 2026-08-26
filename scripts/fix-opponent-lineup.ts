/**
 * Remet une composition adverse en accord avec la feuille officielle LNR.
 *
 * Complément de audit-opponent-lineups.ts, qui repère les écarts sans les
 * corriger. Ce script en corrige un match : bon joueur sur chaque dossard,
 * titulaires et remplaçants comme sur la feuille, capitaine signalé.
 *
 * L'appariement se fait sur l'identité, puis les restes sont réattribués par
 * dossard : quand la base porte un joueur qui n'a pas joué et ignore celui qui
 * a joué, c'est bien un échange de fiche sur un même numéro. Les joueurs
 * absents de la base sont créés — après recherche sur le nom normalisé, pour
 * ne pas fabriquer de doublon.
 *
 * Ce que le script **ne touche pas** : réalisations, cartons et temps de jeu.
 * Ils dépendent de l'identité qu'on vient de changer, et se réécrivent depuis
 * la même source, avec seed-opponent-sheet-{saison}.ts. Le script prévient
 * quand une ligne réattribuée en portait.
 *
 * Usage :
 *   npx tsx scripts/fix-opponent-lineup.ts 2024-09-28 --dry
 *   npx tsx scripts/fix-opponent-lineup.ts 2024-09-28
 */

import { PrismaClient, Position } from "@prisma/client";
import { chercherFeuille, lireCompositions, type LnrTitulaire } from "./lib/lnr";
import { generatePlayerSlug } from "../src/lib/slugs";
import { meilleurCandidat, normalize, proximite } from "./lib/noms";

const prisma = new PrismaClient();

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry");
const DATE = ARGS.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));

/** Poste tenu par un titulaire, déduit de son numéro de maillot. */
const POSTE_PAR_NUMERO: Record<number, Position> = {
  1: Position.PILIER_GAUCHE,
  2: Position.TALONNEUR,
  3: Position.PILIER_DROIT,
  4: Position.DEUXIEME_LIGNE,
  5: Position.DEUXIEME_LIGNE,
  6: Position.TROISIEME_LIGNE_AILE,
  7: Position.TROISIEME_LIGNE_AILE,
  8: Position.NUMERO_HUIT,
  9: Position.DEMI_DE_MELEE,
  10: Position.DEMI_OUVERTURE,
  11: Position.AILIER,
  12: Position.CENTRE,
  13: Position.CENTRE,
  14: Position.AILIER,
  15: Position.ARRIERE,
};

/**
 * Recherche d'un joueur dans toute la table, plus stricte que l'appariement
 * au sein d'une feuille. Sur 23 candidats, un nom de famille approchant suffit
 * à lever l'ambiguïté ; sur 1 380 fiches, il fabrique des rapprochements
 * absurdes — « Folau Fainga'a » et « Leicester Faingaanuku » partagent un
 * préfixe de sept lettres. On exige donc deux mots communs, ou un nom de
 * famille rigoureusement identique.
 */
async function chercherJoueur(officiel: LnrTitulaire): Promise<string | null> {
  const nomCherche = `${officiel.firstName} ${officiel.lastName}`;
  const tous = await prisma.player.findMany({
    select: { id: true, firstName: true, lastName: true },
  });

  const candidats = tous.filter((j) => {
    const { communs } = proximite(`${j.firstName} ${j.lastName}`, nomCherche);
    if (communs >= 2) return true;
    return communs >= 1 && normalize(j.lastName) === normalize(officiel.lastName);
  });
  if (candidats.length === 1) return candidats[0].id;
  if (candidats.length > 1) {
    throw new Error(
      `${nomCherche} : ${candidats.length} fiches candidates ` +
        `(${candidats.map((c) => `${c.firstName} ${c.lastName}`).join(", ")}) — à arbitrer`,
    );
  }
  return null;
}

async function trouverOuCreerJoueur(officiel: LnrTitulaire): Promise<string> {
  const existant = await chercherJoueur(officiel);
  if (existant) return existant;

  if (DRY_RUN) {
    console.log(`    [joueur] à créer : ${officiel.firstName} ${officiel.lastName}`);
    return "";
  }

  const cree = await prisma.player.create({
    data: {
      firstName: officiel.firstName,
      lastName: officiel.lastName,
      // isActive signifie « actuellement à l'USAP »
      isActive: false,
      slug: `temp-${normalize(officiel.lastName)}-${officiel.numero}`,
    },
  });
  await prisma.player.update({
    where: { id: cree.id },
    data: {
      slug: generatePlayerSlug(officiel.firstName, officiel.lastName, cree.id),
    },
  });
  console.log(`    [joueur] créé : ${officiel.firstName} ${officiel.lastName}`);
  return cree.id;
}

async function main() {
  if (!DATE) {
    console.error("Usage : npx tsx scripts/fix-opponent-lineup.ts AAAA-MM-JJ [--dry]");
    process.exit(1);
  }

  const match = await prisma.match.findFirstOrThrow({
    where: { date: new Date(DATE) },
    include: {
      season: { select: { label: true, startYear: true } },
      opponent: { select: { name: true, shortName: true } },
      competition: { select: { shortName: true } },
    },
  });

  const adversaire = match.opponent.shortName ?? match.opponent.name;
  console.log(
    `=== ${match.season.label} ${DATE} ${adversaire} ${match.scoreUsap}-${match.scoreOpponent}` +
      `${DRY_RUN ? " (simulation)" : ""} ===\n`,
  );

  const phase =
    match.matchday != null
      ? `j${match.matchday}`
      : match.competition.shortName === "Barrages"
        ? match.season.startYear >= 2024
          ? "access-top-14"
          : "access"
        : null;
  if (!phase) throw new Error(`Compétition hors périmètre LNR : ${match.competition.shortName}`);

  const url = await chercherFeuille(match.season.label, phase);
  if (!url) throw new Error(`Feuille LNR introuvable pour ${phase}`);
  const officielle = (await lireCompositions(url)).adversaire;
  console.log(`Feuille officielle : ${url}\n`);

  const enBase = await prisma.matchPlayer.findMany({
    where: { matchId: match.id, isOpponent: true },
    select: {
      id: true,
      shirtNumber: true,
      isStarter: true,
      isCaptain: true,
      positionPlayed: true,
      totalPoints: true,
      player: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (officielle.length !== enBase.length) {
    throw new Error(
      `${officielle.length} joueurs sur la feuille, ${enBase.length} en base — à arbitrer à la main`,
    );
  }

  // ---- Appariement sur l'identité, puis par dossard pour les restes -------
  const restants = [...enBase];
  const cible = new Map<number, (typeof enBase)[number]>();

  for (const officiel of officielle) {
    const trouve = meilleurCandidat(
      restants,
      (l) => `${l.player?.firstName ?? ""} ${l.player?.lastName ?? ""}`,
      (l) => l.shirtNumber,
      `${officiel.firstName} ${officiel.lastName}`,
      officiel.numero,
    );
    if (!trouve) continue;
    cible.set(officiel.numero, trouve);
    restants.splice(restants.indexOf(trouve), 1);
  }

  const orphelins = officielle.filter((o) => !cible.has(o.numero));
  for (const officiel of orphelins) {
    const parNumero = restants.find((l) => l.shirtNumber === officiel.numero);
    const ligne = parNumero ?? restants[0];
    if (!ligne) throw new Error(`Plus de ligne disponible pour ${officiel.lastName}`);
    cible.set(officiel.numero, ligne);
    restants.splice(restants.indexOf(ligne), 1);
  }

  // ---- Corrections --------------------------------------------------------
  let corrections = 0;

  for (const officiel of officielle) {
    const ligne = cible.get(officiel.numero)!;
    const nomBase = `${ligne.player?.firstName} ${ligne.player?.lastName}`;
    const nomOfficiel = `${officiel.firstName} ${officiel.lastName}`;

    const memeIdentite =
      ligne.player != null &&
      meilleurCandidat([ligne], () => nomBase, () => ligne.shirtNumber, nomOfficiel, officiel.numero) !=
        null;

    const changements: string[] = [];
    let playerId = ligne.player?.id;

    if (!memeIdentite) {
      playerId = await trouverOuCreerJoueur(officiel);
      changements.push(`identité : « ${nomBase} » → « ${nomOfficiel} »`);
      if (ligne.totalPoints > 0) {
        console.log(
          `    ⚠ n°${officiel.numero} portait ${ligne.totalPoints} point(s) au nom de ${nomBase} : ` +
            `relancer le script de feuille de la saison`,
        );
      }
    }
    if (ligne.shirtNumber !== officiel.numero) {
      changements.push(`n°${ligne.shirtNumber} → n°${officiel.numero}`);
    }
    if (ligne.isStarter !== officiel.isStarter) {
      changements.push(officiel.isStarter ? "remplaçant → titulaire" : "titulaire → remplaçant");
    }
    if (officiel.isCaptain && !ligne.isCaptain) changements.push("capitaine");

    const poste = officiel.isStarter ? POSTE_PAR_NUMERO[officiel.numero] : ligne.positionPlayed;
    if (officiel.isStarter && ligne.positionPlayed !== poste) {
      changements.push(`poste → ${poste}`);
    }

    if (changements.length === 0) continue;
    corrections++;
    console.log(`  n°${String(officiel.numero).padStart(2)} ${nomOfficiel} — ${changements.join(", ")}`);

    if (DRY_RUN) continue;
    await prisma.matchPlayer.update({
      where: { id: ligne.id },
      data: {
        playerId: playerId || undefined,
        shirtNumber: officiel.numero,
        isStarter: officiel.isStarter,
        isCaptain: officiel.isCaptain ?? false,
        positionPlayed: poste,
      },
    });
  }

  console.log(
    `\n=== ${corrections} ligne(s) ${DRY_RUN ? "à corriger" : "corrigée(s)"} sur ${officielle.length} ===`,
  );
  if (DRY_RUN) console.log("Simulation — relancer sans --dry pour appliquer.");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

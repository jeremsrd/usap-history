/**
 * Retrouver ou créer une fiche joueur à partir d'une feuille officielle.
 *
 * Partagé par les scripts qui écrivent une composition — `fix-opponent-lineup.ts`
 * quand il remet un dossard au bon joueur, `seed-lineup.ts` quand il crée la
 * feuille de toutes pièces. Une seule implémentation, parce qu'une recherche
 * trop lâche fabrique des doublons et qu'on en a déjà soldé assez comme ça.
 *
 * La règle est **plus stricte que l'appariement au sein d'une feuille**. Sur
 * 23 candidats, un nom de famille approchant suffit à lever l'ambiguïté ; sur
 * 1 380 fiches, il fabrique des rapprochements absurdes — « Folau Fainga'a »
 * et « Leicester Faingaanuku » partagent un préfixe de sept lettres. On exige
 * donc deux mots communs, ou un nom de famille rigoureusement identique.
 */

import type { PrismaClient, Position } from "@prisma/client";
import { Position as Postes } from "@prisma/client";
import { generatePlayerSlug } from "../../src/lib/slugs";
import { memeMot, mots, motsOrphelins, normalize, proximite } from "./noms";

/** Poste tenu par un titulaire, déduit de son numéro de maillot. */
export const POSTE_PAR_NUMERO: Record<number, Position> = {
  1: Postes.PILIER_GAUCHE,
  2: Postes.TALONNEUR,
  3: Postes.PILIER_DROIT,
  4: Postes.DEUXIEME_LIGNE,
  5: Postes.DEUXIEME_LIGNE,
  6: Postes.TROISIEME_LIGNE_AILE,
  7: Postes.TROISIEME_LIGNE_AILE,
  8: Postes.NUMERO_HUIT,
  9: Postes.DEMI_DE_MELEE,
  10: Postes.DEMI_OUVERTURE,
  11: Postes.AILIER,
  12: Postes.CENTRE,
  13: Postes.CENTRE,
  14: Postes.AILIER,
  15: Postes.ARRIERE,
};

/** Ce qu'une feuille officielle donne d'un joueur, LNR comme EPCR. */
export interface JoueurOfficiel {
  firstName: string;
  lastName: string;
  /** Numéro de maillot, seulement pour fabriquer un slug provisoire unique. */
  numero?: number;
}

/**
 * Fiche correspondante, ou `null`. Lève quand plusieurs fiches se valent :
 * un doublon se tranche à la main, jamais au hasard.
 */
/** Distance d'édition, arrêtée à 2 : au-delà, seul le fait qu'elle dépasse importe. */
function distance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const lignes = [Array.from({ length: b.length + 1 }, (_, i) => i)];
  for (let i = 1; i <= a.length; i++) {
    lignes[i] = [i];
    for (let j = 1; j <= b.length; j++) {
      lignes[i][j] = Math.min(
        lignes[i - 1][j] + 1,
        lignes[i][j - 1] + 1,
        lignes[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return lignes[a.length][b.length];
}

export async function chercherJoueur(
  prisma: PrismaClient,
  officiel: JoueurOfficiel,
  journal: (message: string) => void = (m) => console.log(m),
): Promise<string | null> {
  const nomCherche = `${officiel.firstName} ${officiel.lastName}`;
  const tous = await prisma.player.findMany({
    select: { id: true, firstName: true, lastName: true },
  });

  // Tout rapprochement passe par le **nom de famille** : deux mots communs ne
  // suffisent pas si aucun ne vient de là. « Ratu Tevita KURIDRANI », centre
  // de Biarritz, s'est ainsi retrouvé rattaché à Tevita Ratuva, deuxième ligne
  // de Brive — « Ratu » est le début de « Ratuva », et le prénom faisait le
  // second mot commun. Deux Fidjiens, deux hommes.
  const memeFamille = (candidat: string) => {
    const cibles = mots(officiel.lastName);
    return mots(candidat).some((mot) => cibles.some((cible) => memeMot(mot, cible)));
  };

  // Nom de famille concordant, et un prénom qui suit : c'est solide.
  const candidats = tous.filter(
    (j) =>
      memeFamille(j.lastName) &&
      proximite(`${j.firstName} ${j.lastName}`, nomCherche).communs >= 2,
  );

  // Le nom de famille seul ne suffit pas. « Kane Douglas », deuxième ligne de
  // La Rochelle, s'est ainsi retrouvé ailier de Brive parce que la feuille
  // annonçait « Wesley DOUGLAS » : deux hommes, un patronyme. On ne retient
  // donc l'homonyme que si les prénoms sont à une lettre l'un de l'autre —
  // « Mathieu » et « Matthieu » Ugena sont bien le même joueur. Sinon on ne
  // rattache rien, et l'appelant crée une fiche après avoir été prévenu : un
  // doublon se repère et se fusionne, une identité fausse ne se voit pas.
  if (candidats.length === 0) {
    const homonymes = tous.filter((j) => memeFamille(j.lastName));
    const proches = homonymes.filter(
      (j) => distance(normalize(j.firstName), normalize(officiel.firstName)) <= 1,
    );
    if (proches.length === 1) return proches[0].id;
    if (homonymes.length > 0) {
      journal(
        `    [homonyme] « ${nomCherche} » laissé de côté malgré ` +
          `${homonymes.map((h) => `« ${h.firstName} ${h.lastName} »`).join(", ")} — ` +
          "prénoms trop éloignés pour conclure",
      );
    }
    return null;
  }
  if (candidats.length === 1) return candidats[0].id;
  if (candidats.length > 1) {
    // Une fiche qui porte exactement ce nom tranche : les autres candidates ne
    // s'en approchent que par un prénom voisin (Jérémie / Jérémy Maurouard).
    const exactes = candidats.filter(
      (j) =>
        normalize(`${j.firstName} ${j.lastName}`) === normalize(nomCherche),
    );
    if (exactes.length === 1) return exactes[0].id;
    // Sinon, la fiche dont **tous** les mots figurent dans le nom officiel :
    // les feuilles ajoutent des seconds prénoms que la base n'a pas. « Alivereti
    // Uqueqe Duguivalu » couvre ainsi « Alivereti Duguivalu » mais pas « Freddy
    // Duguivalu ». Il en faut exactement une : deux frères se départagent au
    // prénom, pas ici.
    const couvertes = candidats.filter(
      (j) => motsOrphelins(`${j.firstName} ${j.lastName}`, nomCherche).length === 0,
    );
    if (couvertes.length === 1) return couvertes[0].id;
    throw new Error(
      `${nomCherche} : ${candidats.length} fiches candidates ` +
        `(${candidats.map((c) => `${c.firstName} ${c.lastName}`).join(", ")}) — à arbitrer`,
    );
  }
  return null;
}

/**
 * Fiche correspondante, créée si elle manque. En simulation, rend `""` — la
 * chaîne vide signale « fiche à créer » sans rien écrire.
 */
export async function trouverOuCreerJoueur(
  prisma: PrismaClient,
  officiel: JoueurOfficiel,
  options: { dryRun: boolean; journal?: (message: string) => void },
): Promise<string> {
  const journal = options.journal ?? ((m: string) => console.log(m));
  const existant = await chercherJoueur(prisma, officiel, journal);
  if (existant) return existant;

  if (options.dryRun) {
    journal(`    [joueur] à créer : ${officiel.firstName} ${officiel.lastName}`);
    return "";
  }

  const cree = await prisma.player.create({
    data: {
      firstName: officiel.firstName,
      lastName: officiel.lastName,
      // isActive signifie « actuellement à l'USAP »
      isActive: false,
      slug: `temp-${normalize(officiel.lastName)}-${officiel.numero ?? 0}`,
    },
  });
  await prisma.player.update({
    where: { id: cree.id },
    data: {
      slug: generatePlayerSlug(officiel.firstName, officiel.lastName, cree.id),
    },
  });
  journal(`    [joueur] créé : ${officiel.firstName} ${officiel.lastName}`);
  return cree.id;
}

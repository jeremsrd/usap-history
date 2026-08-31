/**
 * Rapprochement des arbitres entre une source et la base.
 *
 * Les feuilles officielles donnent l'arbitre en toutes lettres — « Adrien
 * Marbot », « Chris Busby » — sans identifiant stable. On cherche donc la
 * fiche sur le nom, avec la même souplesse que pour les joueurs, et on la crée
 * si elle manque. Le slug passe par `generateRefereeSlug()` : un slug refait à
 * la main sans le CUID en suffixe rendrait la fiche introuvable.
 */

import type { PrismaClient } from "@prisma/client";
import { normalize } from "./noms";
import { generateRefereeSlug } from "../../src/lib/slugs";

/**
 * LA LNR GLISSE LE SIGLE DE LA FÉDÉRATION D'UN ARBITRE ÉTRANGER DANS SON NOM.
 *
 * Elle écrit « Federico (Uar) Anselmi » pour l'Argentin qui a dirigé le
 * Colomiers-Perpignan du 18 janvier 2015 — l'UAR étant l'Unión Argentina de
 * Rugby. Le sigle est au milieu du nom, si bien qu'un découpage au dernier mot
 * en ferait un prénom : « Federico (Uar) », « Anselmi ». On le retire donc
 * avant de couper, et la fiche porte « Federico Anselmi ».
 *
 * Ce n'est pas cosmétique : le prénom sert au rapprochement des homonymes, et
 * une parenthèse dans le prénom empêcherait de reconnaître le même arbitre
 * sur une feuille qui l'écrirait sans sigle.
 */
function sansSigleFederation(nom: string): string {
  return nom.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

/** « Adrien Marbot » → prénom et nom, le dernier mot faisant le patronyme. */
export function separerNom(complet: string): { firstName: string; lastName: string } {
  const mots = sansSigleFederation(complet).split(/\s+/);
  return {
    firstName: mots.slice(0, -1).join(" "),
    lastName: mots[mots.length - 1] ?? complet,
  };
}

/**
 * Fiche arbitre correspondant au nom donné, créée au besoin.
 *
 * L'appariement exige le **nom de famille**, pas seulement un prénom commun :
 * les feuilles donnent les arbitres en toutes lettres, et le corps arbitral
 * français aligne assez d'Adrien pour qu'un rapprochement au prénom confonde
 * Adrien Marbot et Adrien Descottes.
 *
 * Renvoie `null` en simulation quand la fiche serait à créer : l'appelant n'a
 * alors rien à écrire. Lève si plusieurs fiches se disputent le nom — deux
 * arbitres homonymes demandent un arbitrage, sans jeu de mots.
 */
export async function trouverOuCreerArbitre(
  prisma: PrismaClient,
  nom: string,
  dryRun: boolean,
): Promise<string | null> {
  const { firstName, lastName } = separerNom(nom);
  if (!lastName) return null;
  // Le nom sert aussi à la comparaison plus bas : on y retire le sigle, sans
  // quoi « Federico (Uar) Anselmi » ne s'apparierait jamais à sa propre fiche.
  const nomPropre = sansSigleFederation(nom);

  const tous = await prisma.referee.findMany({
    select: { id: true, firstName: true, lastName: true },
  });
  const exactes = tous.filter(
    (a) => normalize(`${a.firstName} ${a.lastName}`) === normalize(nomPropre),
  );
  if (exactes.length === 1) return exactes[0].id;

  const candidats = tous.filter((a) => normalize(a.lastName) === normalize(lastName));
  if (candidats.length === 1) return candidats[0].id;
  if (candidats.length > 1) {
    throw new Error(
      `arbitre « ${nom} » : ${candidats.length} fiches candidates ` +
        `(${candidats.map((c) => `${c.firstName} ${c.lastName}`).join(", ")}) — à arbitrer`,
    );
  }
  if (dryRun) return null;

  const cree = await prisma.referee.create({
    data: { firstName, lastName, slug: `temp-${lastName.toLowerCase()}` },
  });
  await prisma.referee.update({
    where: { id: cree.id },
    data: { slug: generateRefereeSlug(firstName, lastName, cree.id) },
  });
  return cree.id;
}

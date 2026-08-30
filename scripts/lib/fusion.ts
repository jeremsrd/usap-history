/**
 * Fusion de deux fiches joueur : l'opération, une fois pour toutes.
 *
 * Elle vivait dans `merge-players.ts`, et `merge-duplicate-players-2026.ts`
 * en portait une seconde écriture. Une troisième allait naître avec le lot du
 * 30 août 2026 : trois copies d'un même geste destructeur, libres de diverger.
 * C'est le défaut que ce module supprime — `merge-players.ts` et
 * `merge-duplicate-players-2026-08.ts` l'appellent tous deux.
 *
 * Ce qui est repointé vers la fiche conservée : lignes de composition,
 * événements de chronologie (auteur et joueur lié), effectifs de saison — en
 * respectant leur contrainte d'unicité —, clubs de carrière, passages à
 * l'USAP, sélections et distinctions. La fiche absorbée est ensuite supprimée.
 *
 * Deux refus, et ils comptent :
 *   - **fiche conservée introuvable** : on lève, l'appelant s'est trompé
 *     d'identifiant ;
 *   - **les deux fiches sur un même match** : ce sont deux joueurs distincts,
 *     ou une feuille fautive. On rend la main sans rien écrire.
 *
 * Idempotent : la fiche absorbée déjà disparue rend `deja` et n'écrit rien.
 */

import type { PrismaClient } from "@prisma/client";
import { generatePlayerSlug } from "../../src/lib/slugs";

export interface Fusion {
  /** Fiche conservée. */
  keepId: string;
  /** Fiche absorbée puis supprimée. */
  dropId: string;
  /** Orthographe à poser sur la fiche conservée. */
  nom?: { firstName: string; lastName: string };
}

export type Issue =
  | { etat: "deja" }
  | { etat: "collision"; dates: string[] }
  | {
      etat: "fusionnable" | "fusionne";
      keep: string;
      drop: string;
      compte: { compositions: number; evenements: number; lies: number; effectifs: number };
      renomme: boolean;
    };

export async function fusionner(
  prisma: PrismaClient,
  { keepId, dropId, nom }: Fusion,
  simulation: boolean,
): Promise<Issue> {
  if (keepId === dropId) throw new Error(`Deux identifiants distincts sont attendus : ${keepId}`);

  const keep = await prisma.player.findUnique({ where: { id: keepId } });
  const drop = await prisma.player.findUnique({ where: { id: dropId } });
  if (!keep) throw new Error(`Fiche conservée introuvable : ${keepId}`);
  if (!drop) return { etat: "deja" };

  // Un même match ne doit pas se retrouver avec deux lignes pour le joueur.
  const dejaVus = new Set(
    (await prisma.matchPlayer.findMany({ where: { playerId: keepId }, select: { matchId: true } }))
      .map((x) => x.matchId),
  );
  const collisions = (
    await prisma.matchPlayer.findMany({
      where: { playerId: dropId },
      select: { matchId: true, match: { select: { date: true } } },
    })
  ).filter((x) => dejaVus.has(x.matchId));
  if (collisions.length > 0) {
    return { etat: "collision", dates: collisions.map((c) => c.match.date.toISOString().slice(0, 10)) };
  }

  const compte = {
    compositions: await prisma.matchPlayer.count({ where: { playerId: dropId } }),
    evenements: await prisma.matchEvent.count({ where: { playerId: dropId } }),
    lies: await prisma.matchEvent.count({ where: { relatedPlayerId: dropId } }),
    effectifs: await prisma.seasonPlayer.count({ where: { playerId: dropId } }),
  };
  const renomme = nom != null && (keep.firstName !== nom.firstName || keep.lastName !== nom.lastName);
  const identite = {
    keep: `${keep.firstName} ${keep.lastName}`,
    drop: `${drop.firstName} ${drop.lastName}`,
    compte,
    renomme,
  };

  if (simulation) return { etat: "fusionnable", ...identite };

  await prisma.matchPlayer.updateMany({ where: { playerId: dropId }, data: { playerId: keepId } });
  await prisma.matchEvent.updateMany({ where: { playerId: dropId }, data: { playerId: keepId } });
  await prisma.matchEvent.updateMany({
    where: { relatedPlayerId: dropId },
    data: { relatedPlayerId: keepId },
  });

  // seasonPlayer porte une contrainte d'unicité (seasonId, playerId)
  for (const lien of await prisma.seasonPlayer.findMany({ where: { playerId: dropId } })) {
    const existe = await prisma.seasonPlayer.findFirst({
      where: { seasonId: lien.seasonId, playerId: keepId },
    });
    if (existe) await prisma.seasonPlayer.delete({ where: { id: lien.id } });
    else await prisma.seasonPlayer.update({ where: { id: lien.id }, data: { playerId: keepId } });
  }

  for (const modele of ["careerClub", "playerStint", "playerInternational", "playerAward"] as const) {
    // @ts-expect-error accès dynamique aux modèles Prisma
    await prisma[modele].updateMany({ where: { playerId: dropId }, data: { playerId: keepId } });
  }

  await prisma.player.delete({ where: { id: dropId } });

  if (renomme && nom) {
    await prisma.player.update({
      where: { id: keepId },
      data: {
        firstName: nom.firstName,
        lastName: nom.lastName,
        slug: generatePlayerSlug(nom.firstName, nom.lastName, keepId),
      },
    });
  }

  return { etat: "fusionne", ...identite };
}

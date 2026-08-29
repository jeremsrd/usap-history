import type { Prisma } from "@prisma/client";

/**
 * Une rencontre est **jouée** dès qu'elle porte un score.
 *
 * Le calendrier d'une saison entre en base avant que ses matchs ne se jouent :
 * `scoreUsap`, `scoreOpponent` et `result` sont alors nuls, et `null` s'y lit
 * « pas encore joué », jamais « zéro ». Toute statistique — bilan, records,
 * confrontations, fiches joueur — doit donc écarter ces rencontres, faute de
 * quoi un calendrier à venir se compterait en matchs nuls.
 */
export const MATCH_JOUE = { result: { not: null } } satisfies Prisma.MatchWhereInput;

/** L'inverse : les rencontres encore à disputer. */
export const MATCH_A_VENIR = { result: null } satisfies Prisma.MatchWhereInput;

type Scores = { scoreUsap: number | null; scoreOpponent: number | null };

/**
 * Garde de type qui accompagne `MATCH_JOUE` : Prisma ne resserre pas ses types
 * sur un filtre `where`, il faut donc le lui dire côté TypeScript.
 */
export function estJoue<T extends Scores>(
  match: T,
): match is T & { scoreUsap: number; scoreOpponent: number } {
  return match.scoreUsap != null && match.scoreOpponent != null;
}

/**
 * Une rencontre est un **couperet** — phase finale, barrage, finale — si elle
 * n'a pas de journée et que son tour ne commence pas par « Poule ».
 *
 * C'est la définition qui sert déjà aux points de bonus, qu'un match couperet
 * n'attribue pas : une poule de coupe d'Europe n'a pas de journée non plus,
 * mais elle en donne. Elle sert aussi à séparer la phase finale de la phase
 * régulière sur la page de saison — l'USAP a été championne de Pro D2 en
 * 2020-2021 en gagnant une demi-finale et une finale, et ces deux rencontres
 * n'ont pas à se perdre au milieu des trente journées.
 */
export function estCouperet(match: {
  matchday: number | null;
  round: string | null;
}): boolean {
  return match.matchday == null && !(match.round ?? "").startsWith("Poule");
}

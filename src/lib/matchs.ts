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

import type { Traduire } from "@/i18n/dictionnaire";

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

/**
 * La lettre d'un résultat et sa couleur — **V en or, N en encre, D en gris**,
 * arbitré par Jérémy le 19 septembre 2026.
 *
 * Elle était en **sang** jusque-là, et c'est ce qui a fait tomber la règle :
 * le sang est la couleur de l'USAP partout ailleurs sur le site — le titre
 * d'une page, un nom de joueur, un lien au survol. Dans une frise il ne
 * disait donc pas « gagné », il disait « nous », et le lecteur n'avait aucun
 * moyen de le savoir. L'or, lui, ne sert qu'à ce qui est acquis — un titre
 * sous une saison, une distinction —, et il garde ce sens ici.
 *
 * `usap-or` et non `usap-or-vif` : la frise vit sur le fond de la page, qui
 * suit le thème, et c'est le jeton qui suit le thème avec elle. `usap-or-vif`
 * ne s'emploie que sur du sang, cf. CLAUDE.md.
 *
 * **Une seule définition pour tout le site.** Elle était recopiée dans huit
 * pages — saison, adversaire, stade, arbitre, entraîneur, président, liste
 * des matchs, accueil —, et deux des huit rendaient la défaite là où les
 * autres rendaient `null`, si bien qu'une rencontre sans résultat s'y serait
 * affichée « D ». Un code couleur qui vit en huit exemplaires ne se change
 * pas, il se réécrit sept fois et on en oublie une.
 *
 * Rend `null` quand la rencontre n'a pas de résultat — elle n'est pas encore
 * jouée —, jamais une lettre par défaut : `null` se lit « pas de résultat »,
 * comme partout ailleurs dans ce projet.
 */
export function lettreResultat(
  result: string | null | undefined,
  t: Traduire,
): { texte: string; classe: string } | null {
  if (result === "VICTOIRE") return { texte: t("saison.lettreVictoire"), classe: "text-usap-or" };
  if (result === "NUL") return { texte: t("saison.lettreNul"), classe: "text-foreground" };
  if (result === "DEFAITE") return { texte: t("saison.lettreDefaite"), classe: "text-muted-foreground" };
  return null;
}

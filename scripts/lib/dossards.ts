/**
 * LES DOSSARDS D'UNE COMPOSITION CONCORDENT-ILS AVEC CEUX QUE CES JOUEURS
 * PORTENT AILLEURS ?
 *
 * **La LNR publie des compositions qui n'en sont pas.** Sur 2005-2006, ses
 * pages `/compositions` dessinent des quinze où un talonneur porte le n°10, où
 * un pilier porte le n°6, où un deuxième ligne porte le n°11 — vingt-trois des
 * vingt-six journées sont dans ce cas. Une partie de ces listes est
 * franchement alphabétique, et `dossardsFabriques()` de `lib/lnr.ts` les
 * reconnaît à cela seul ; les autres sont brouillées sans l'être, et rien dans
 * la page ne les distingue d'une vraie feuille.
 *
 * **Ce qui les distingue, c'est la base.** Un joueur porte le même numéro d'un
 * match à l'autre, à la ligne près : Perry Freshwater est pilier gauche,
 * Marius Tincu talonneur, Nathan Hines deuxième ligne. Il suffit donc de
 * demander à chaque titulaire quel numéro il porte **partout ailleurs**, et de
 * compter les accords.
 *
 * La mesure sépare sans ambiguïté, et sur 2005-2006 elle est brutale :
 *
 *   - trois équipes-matchs concordent à **0,82 et plus** — les 20 et 26 août
 *     et le 8 octobre 2005, où l'on lit un vrai quinze : Freshwater 1,
 *     Konieckiewicz 2, Bozzi 3, Gaston 4, Hines 5 ;
 *   - toutes les autres tombent entre **0,00 et 0,31**.
 *
 * Aucune valeur entre les deux, et le seuil est posé à 0,50, au milieu du
 * vide. Une composition en dessous est **écartée**, jamais réparée : aucune
 * source ne donne les vrais dossards de ces rencontres.
 *
 * **LE CONTRÔLE NE VAUT QUE SI LA BASE EN SAIT ASSEZ.** Il compare la
 * composition à ce que la base porte déjà, et se tait quand elle n'a rien à
 * dire — moins de six titulaires connus par ailleurs. C'est le cas d'une
 * saison reprise avant toutes les autres, ou d'un club qui ne paraît qu'une
 * fois : là, il ne conclut pas, et `dossardsFabriques()` reste seul en
 * première ligne.
 */

import type { PrismaClient } from "@prisma/client";

/**
 * Ligne de front, ligne arrière : deux numéros du même groupe décrivent le
 * même poste. L'enum `Position` ne distingue pas non plus le 4 du 5, ni le 11
 * du 14 (cf. CLAUDE.md).
 */
const GROUPE: Record<number, string> = {
  1: "1",
  2: "2",
  3: "3",
  4: "4-5",
  5: "4-5",
  6: "6-7",
  7: "6-7",
  8: "8",
  9: "9",
  10: "10",
  11: "11-14",
  12: "12-13",
  13: "12-13",
  14: "11-14",
  15: "15",
};

/** En deçà, la base n'en sait pas assez pour conclure. */
const TITULAIRES_MINIMUM = 6;

/** Au-dessus, la composition est tenue pour vraie. */
const SEUIL = 0.5;

export interface Concordance {
  /** Part des titulaires connus dont le numéro concorde, ou `null` si indécidable. */
  taux: number | null;
  /** Titulaires sur lesquels la mesure a porté. */
  compares: number;
  fabriques: boolean;
}

/**
 * Confronte les dossards d'une composition à ceux que ces joueurs portent sur
 * les **autres** saisons de la base.
 *
 * On exclut la saison examinée pour ne pas se donner raison à soi-même : une
 * saison entièrement brouillée s'y confirmerait elle-même.
 */
export async function concordanceDesDossards(
  prisma: PrismaClient,
  saison: string,
  titulaires: Array<{ playerId: string; numero: number }>,
): Promise<Concordance> {
  const groupeDu = (numero: number) => GROUPE[numero];
  const candidats = titulaires.filter((t) => groupeDu(t.numero) != null);
  if (candidats.length === 0) return { taux: null, compares: 0, fabriques: false };

  const ailleurs = await prisma.matchPlayer.findMany({
    where: {
      playerId: { in: candidats.map((t) => t.playerId) },
      isStarter: true,
      shirtNumber: { lte: 15, gte: 1 },
      match: { season: { label: { not: saison } } },
    },
    select: { playerId: true, shirtNumber: true },
  });

  /** Groupe de numéros le plus fréquent, joueur par joueur. */
  const frequences = new Map<string, Map<string, number>>();
  for (const ligne of ailleurs) {
    if (!ligne.playerId || ligne.shirtNumber == null) continue;
    const groupe = groupeDu(ligne.shirtNumber);
    if (!groupe) continue;
    if (!frequences.has(ligne.playerId)) frequences.set(ligne.playerId, new Map());
    const compte = frequences.get(ligne.playerId)!;
    compte.set(groupe, (compte.get(groupe) ?? 0) + 1);
  }
  const habituel = new Map<string, string>();
  for (const [id, compte] of frequences) {
    habituel.set(id, [...compte].sort((a, b) => b[1] - a[1])[0][0]);
  }

  const compares = candidats.filter((t) => habituel.has(t.playerId));
  if (compares.length < TITULAIRES_MINIMUM) {
    return { taux: null, compares: compares.length, fabriques: false };
  }
  const accords = compares.filter(
    (t) => habituel.get(t.playerId) === groupeDu(t.numero),
  ).length;
  const taux = accords / compares.length;
  return { taux, compares: compares.length, fabriques: taux < SEUIL };
}

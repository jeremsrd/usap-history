/**
 * Ce que les feuilles officielles omettent, et qu'une autre source rend.
 *
 * LA LNR OUBLIE PARFOIS UN JOUEUR. Un remplaçant ne coûte qu'une ligne, et
 * `seed-lineup.ts` le tolère en le signalant. Un **titulaire**, en revanche,
 * fait échouer le match : quatorze titulaires, ce sont quatre-vingts minutes
 * qui manquent au total de l'équipe, et le trou se propagerait sans bruit.
 *
 * Cette table rend le joueur manquant à son dossard. Elle vit ici, et non dans
 * l'un des deux scripts, parce que **deux** s'en servent et devraient sinon la
 * répéter : `seed-lineup.ts` pour compléter la composition, et
 * `audit-opponent-lineups.ts` pour ne pas signaler « en trop » un joueur qu'on
 * a délibérément ajouté. Une table recopiée dérive ; celle-ci n'existe qu'une
 * fois.
 *
 * ELLE NE S'ÉCRIT QU'AVEC LA DÉMONSTRATION SOUS LES YEUX, comme
 * `CHANGEMENTS_CORRIGES` : il faut une source donnant la composition entière,
 * et dont les autres joueurs concordent avec la feuille officielle **au
 * dossard près** — sans quoi rien ne dit qu'il s'agit du même match.
 */

/** Un joueur absent de la feuille officielle, rendu à son dossard. */
import { pointsDesRealisations, type Bareme } from "../../src/lib/scoring";
import { BAREME_LNR } from "./lnr";
export interface TitulaireManquant {
  camp: "usap" | "adversaire";
  numero: number;
  prenom: string;
  nom: string;
}

/**
 * Par jour de match.
 *
 * **Stade Français - Perpignan du 21 avril 2012.** La LNR publie vingt-deux
 * Parisiens, et il manque le n°6. La fiche d'ESPN pour cette rencontre
 * (`gameId=143710`) donne les quinze titulaires, dont les quatorze publiés par
 * la LNR au dossard près, et complète par **George Smith**. Le troisième ligne
 * australien était bien au Stade Français ce printemps-là, arrivé en cours de
 * saison pour huit matchs — une source indépendante le confirme. La même fiche
 * donne Charléty pour stade, ce que l'historique des terrains dit déjà de son
 * côté.
 *
 * **2010-2011 en a quatre**, tous adverses, et l'omission devient courante à
 * mesure qu'on remonte. Même méthode chaque fois : la fiche d'ESPN donne les
 * quinze, et ses quatorze autres concordent avec la LNR **au dossard près** —
 * vérifié un à un, aux variantes d'orthographe près, la LNR écrivant
 * « Giorge Jgenti » pour Giorgi, « John Leo O » pour Johnny Leo'o, « Sereli
 * Bobo » pour Sireli, « Johann Van Niekerk » pour Joe van Niekerk.
 *
 * ESPN confirme au passage Colombes pour le Racing et Mayol pour Toulon, ce
 * que l'historique des terrains dit déjà de son côté.
 *
 * Les noms sont repris **tels qu'ESPN les écrit** : la LNR ne publiant pas ces
 * joueurs, il n'existe pas d'orthographe officielle à laquelle se conformer,
 * et rien n'autorise à l'embellir.
 *
 * George Smith paraît deux fois, à Toulon : il y a bien disputé trente matchs
 * de Top 14 en 2010-2011, ce qu'une source indépendante confirme — la même qui
 * atteste son passage au Stade Français en 2012.
 *
 * **LE JETON « 545 » DÉSIGNE GONÇALO UVA**, et c'est la démonstration la plus
 * solide de cette table. Quand la LNR a perdu la fiche d'un joueur, elle
 * écrit un gabarit — « Prenom_545 NOM_545 » — où 545 est son identifiant
 * interne. Ce jeton paraît deux fois dans les saisons reprises, à deux ans
 * d'écart, et les deux fois une lecture indépendante d'ESPN y met le même
 * homme : sortant de Montpellier le 28 août 2010, et n°18 montpelliérain le
 * 20 septembre 2008. Sa fiche est donc corrompue de bout en bout chez la LNR,
 * qui l'omet aussi de ses compositions — le banc du 20 septembre 2008 ne
 * compte que sept joueurs, le n°18 manquant.
 *
 * **Ici la règle du dossard ne s'applique pas, et il faut le dire** : la
 * composition qu'ESPN publie pour ce match ne concorde pas avec la LNR — elle
 * met Macurdy au n°4 quand la LNR y met Bascou, et diverge sur deux places de
 * banc. Ce n'est donc pas elle qui fonde l'identification, mais la constance
 * du jeton d'un match à l'autre.
 */
export const TITULAIRES_MANQUANTS: Record<string, TitulaireManquant[]> = {
  // Banc montpelliérain à sept joueurs, le n°18 manquant — c'est le jeton
  // « 545 », soit Gonçalo Uva (cf. plus haut). Il entre à la 69e.
  "2008-09-20": [{ camp: "adversaire", numero: 18, prenom: "Goncalo", nom: "Uva" }],
  // gameId ESPN 119006 — Perpignan 6-16 Montpellier
  "2010-08-28": [{ camp: "adversaire", numero: 4, prenom: "Goncalo", nom: "Uva" }],
  // gameId ESPN 119062 — Racing Métro 18-18 Perpignan
  "2010-10-29": [{ camp: "adversaire", numero: 13, prenom: "Albert", nom: "Vulivuli" }],
  // gameId ESPN 119069 — Perpignan 20-29 Toulon
  "2010-11-04": [{ camp: "adversaire", numero: 7, prenom: "George", nom: "Smith" }],
  // gameId ESPN 119160 — Toulon 43-12 Perpignan
  "2011-04-23": [{ camp: "adversaire", numero: 7, prenom: "George", nom: "Smith" }],
  // gameId ESPN 143710 — Stade Français 35-31 Perpignan
  "2012-04-21": [{ camp: "adversaire", numero: 6, prenom: "George", nom: "Smith" }],
};

/** Ce joueur-là a-t-il été ajouté à la main sur cette feuille ? */
export function estAjoutHorsFeuille(
  jour: string,
  camp: "usap" | "adversaire",
  numero: number,
): boolean {
  return (TITULAIRES_MANQUANTS[jour] ?? []).some(
    (m) => m.camp === camp && m.numero === numero,
  );
}

/** Réalisations qu'une feuille officielle omet, camp par camp. */
export interface RealisationsCompletees {
  camp: "usap" | "adversaire";
  essais?: number;
  transformations?: number;
  penalites?: number;
  drops?: number;
  essaisDePenalite?: number;
  /**
   * Part de ces points qu'**aucun joueur ne porte**, faute d'auteur nommé.
   *
   * Les deux scripts n'en font pas le même usage. Celui de la saison compte
   * les réalisations de l'équipe et ignore ce champ. Celui de la feuille
   * répartit les points entre les joueurs, et doit savoir combien lui
   * échappent : sans cela son contrôle — la somme des joueurs doit valoir le
   * score — échouerait sur ce que la source n'a pas écrit.
   */
  pointsSansAuteur?: number;
  /**
   * Nombre d'**essais** omis qu'aucun joueur ne porte.
   *
   * Distinct de `pointsSansAuteur` parce que le script de feuille en fait deux
   * usages : il retranche leurs points du total attendu, comme les autres,
   * mais il les compte aussi dans les essais — son second contrôle confronte
   * le nombre d'essais reconstitués au compteur du match. Les cinq points
   * d'un essai sans auteur ne se déclarent donc **pas** dans
   * `pointsSansAuteur`, sans quoi ils seraient retranchés deux fois.
   */
  essaisSansAuteur?: number;
  /** D'où vient le complément. Obligatoire : rien ici n'est déductible seul. */
  source: string;
}

/**
 * LA LNR OUBLIE AUSSI DES POINTS, et pas seulement des joueurs.
 *
 * Ses faits de match ne suffisent alors plus à reconstituer le score, et le
 * script de saison refuse d'écrire la rencontre — à raison : des compteurs
 * d'essais faux fausseraient le bonus offensif, donc le total de la saison.
 *
 * Cette table ajoute ce qui manque, camp par camp. Comme les autres, elle ne
 * s'écrit qu'avec la démonstration, et le garde-fou du script la vérifie
 * aussitôt : le total reconstitué doit retomber sur le score officiel.
 *
 * **Perpignan 28-20 Bayonne, 15 août 2009.** Les faits donnent à Bayonne deux
 * essais et une pénalité, soit 13 points pour 20. La feuille se corrige
 * elle-même : son score courant donne Bayonne à 17 après l'essai de la 77ᵉ, et
 * le score officiel est 20. Il manque **une pénalité**, non inscrite, et les
 * deux transformations que le reliquat révèle — 2 essais, 2 transformations,
 * 2 pénalités font bien 20.
 *
 * **Perpignan 25-9 Toulon, 5 novembre 2009.** Les faits donnent à l'USAP deux
 * essais et deux pénalités, soit 16 points pour 25. Ici le score courant ne
 * sauve rien : il passe de 3 à 5 entre la 14ᵉ et la 25ᵉ, deux points qu'aucune
 * action n'explique, et la feuille est fautive de bout en bout. La fiche
 * d'ESPN (`gameId=99380`) signale **un essai de pénalité à la 26ᵉ**.
 *
 * Il est compté ici comme un **troisième essai transformé**, et non par le
 * champ `essaisDePenalite`, parce que c'est ce qu'il était en 2009 : jusqu'en
 * 2017 l'essai de pénalité valait cinq points et se transformait (cf.
 * `corrigerEssaisDePenalite` dans `lib/lnr.ts`). Trois essais, deux
 * transformations et deux pénalités font bien 25, et la transformation reste
 * au crédit du buteur que la feuille nomme — d'où cinq points sans auteur, et
 * non sept.
 *
 * Ce complément change le bonus offensif : trois essais contre zéro, l'USAP le
 * prend. C'est le **total de bonus de la saison** qui l'atteste — le garde-fou
 * du script exige 12, et il ne les atteint qu'avec cet essai-là.
 */
export const REALISATIONS_COMPLETEES: Record<string, RealisationsCompletees[]> = {
  "2009-08-15": [
    {
      camp: "adversaire",
      transformations: 2,
      penalites: 1,
      // Les deux transformations sont au crédit du buteur que la feuille
      // nomme ; seule la pénalité oubliée n'a pas d'auteur.
      pointsSansAuteur: 3,
      source:
        "Score courant de la feuille LNR : Bayonne à 17 après l'essai de la 77e, " +
        "20 au score officiel.",
    },
  ],
  "2009-11-05": [
    {
      camp: "usap",
      essais: 1,
      transformations: 2,
      // L'essai lui-même n'a pas d'auteur ; sa transformation, si.
      essaisSansAuteur: 1,
      source: "Fiche ESPN gameId=99380 : essai de pénalité à la 26e minute.",
    },
  ],
  // **Biarritz 12-9 Perpignan, demi-finale du 2 juin 2006.** La feuille de la
  // LNR est entièrement vide sur cette rencontre — ni composition, ni fait, ni
  // officiel —, quand son calendrier en donne le score. Wikipédia détaille le
  // déroulé des phases finales, et c'est un match sans essai : neuf points
  // catalans en trois pénalités, douze biarrots en trois pénalités et un drop.
  //
  // Les auteurs sont nommés — Edmonds à la 2e et à la 50e, Laharrague à la
  // 74e ; Dupuy aux 6e, 31e et 55e, plus son drop de la 70e —, mais aucun ne
  // se reporte sur une composition que la LNR ne publie pas : rien de tout
  // cela n'a d'auteur **en base**, d'où les points sans auteur des deux côtés.
  "2006-06-02": [
    {
      camp: "usap",
      penalites: 3,
      pointsSansAuteur: 9,
      source:
        "Wikipédia, modèle de match de la demi-finale : Edmonds (2e, 50e), " +
        "Laharrague (74e).",
    },
    {
      camp: "adversaire",
      penalites: 3,
      drops: 1,
      pointsSansAuteur: 12,
      source:
        "Wikipédia, modèle de match de la demi-finale : Dupuy (6e, 31e, 55e), " +
        "drop de Dupuy (70e).",
    },
  ],
};

/** Ajoute à un bilan de réalisations ce que la feuille officielle a omis. */
export function completerRealisations<
  T extends {
    essais: number;
    transformations: number;
    penalites: number;
    drops: number;
    essaisDePenalite: number;
    total: number;
  },
>(jour: string, camp: "usap" | "adversaire", bilan: T, bareme: Bareme = BAREME_LNR): T {
  const ajouts = (REALISATIONS_COMPLETEES[jour] ?? []).filter((a) => a.camp === camp);
  if (ajouts.length === 0) return bilan;
  const complete = { ...bilan };
  for (const a of ajouts) {
    complete.essais += a.essais ?? 0;
    complete.transformations += a.transformations ?? 0;
    complete.penalites += a.penalites ?? 0;
    complete.drops += a.drops ?? 0;
    complete.essaisDePenalite += a.essaisDePenalite ?? 0;
    complete.total += pointsDesRealisations(a, bareme);
  }
  return complete;
}

/** Points d'un match qu'aucun joueur ne porte, la source ne les ayant pas écrits. */
export function pointsOmisSansAuteur(jour: string, camp: "usap" | "adversaire"): number {
  return (REALISATIONS_COMPLETEES[jour] ?? [])
    .filter((a) => a.camp === camp)
    .reduce((s, a) => s + (a.pointsSansAuteur ?? 0), 0);
}

/** Essais omis qu'aucun joueur ne porte — comptés comme des essais collectifs. */
export function essaisOmisSansAuteur(jour: string, camp: "usap" | "adversaire"): number {
  return (REALISATIONS_COMPLETEES[jour] ?? [])
    .filter((a) => a.camp === camp)
    .reduce((s, a) => s + (a.essaisSansAuteur ?? 0), 0);
}

/**
 * NOMBRE DE JOUEURS QU'UNE FEUILLE DE MATCH DOIT PORTER.
 *
 * **Vingt-deux jusqu'en 2007-2008, vingt-trois depuis 2008-2009** : le banc
 * est passé de sept remplaçants à huit entre ces deux saisons.
 *
 * LA BASE LE DÉMONTRE D'ELLE-MÊME, sans qu'il faille croire un règlement sur
 * parole. Sur les compositions déjà écrites, 2008-2009 compte 54
 * équipes-matchs à 23 pour 2 à 22 — les deux oublis connus de la LNR —, et
 * toutes les saisons postérieures sont à 23 sans exception. Les 25
 * compositions lisibles de 2007-2008 sont, elles, **toutes à 22, sur les deux
 * camps**, six journées réparties d'août à juin. Le basculement tombe donc
 * entre les deux saisons, et nulle part ailleurs.
 *
 * **Sans cette règle, le contrôle se retournait contre lui-même.**
 * `seed-lineup.ts` tient 23 pour la norme et annonce « la LNR en oublie un »
 * en deçà : sur 2007-2008 il l'aurait annoncé **cinquante-quatre fois**, une
 * par composition, et le seul vrai oubli de la saison — les 21 Auchois du
 * 30 mai 2008 — s'y serait perdu. C'est le défaut qu'on a corrigé ailleurs
 * sur l'audit : un avertissement qui se déclenche toujours n'avertit plus.
 *
 * **La borne haute est attestée des deux côtés, la borne basse ne l'est
 * pas** : rien ici ne dit jusqu'où l'on remonte à 22, ni ce qui valait avant.
 * À établir en reprenant 2006-2007, de la même façon — en comptant, pas en
 * supposant.
 */
export function effectifDeFeuille(saison: string): number {
  return Number(saison.slice(0, 4)) >= 2008 ? 23 : 22;
}

/**
 * NOMBRE DE JOUEURS EN DEÇÀ DUQUEL UNE FEUILLE N'EST PLUS EXPLOITABLE.
 *
 * Le critère d'acceptation du projet est ailleurs — **les quinze titulaires
 * doivent être là**, et c'est le contrôle qui compte. Celui-ci n'est qu'un
 * garde de forme : une feuille où il manquerait la moitié du banc trahirait
 * plus vraisemblablement une lecture cassée qu'un oubli de la source.
 *
 * **Il dépend donc de ce que la source omet à chaque époque, et cela se
 * compte.** Sur les 52 équipes-matchs de 2005-2006 : 32 portent les 22
 * joueurs attendus, 12 en portent 21, et **8 en portent 20**. Sur celles de
 * 2006-2007 et 2007-2008, l'oubli ne dépasse jamais un joueur.
 *
 * **2004-2005 descend jusqu'à dix-sept**, soit les quinze titulaires et deux
 * remplaçants seulement : la LNR en oublie alors jusqu'à cinq au banc. Le
 * plancher y vaut donc dix-sept, et il ne protège plus de grand-chose — c'est
 * assumé, le contrôle qui compte étant celui des quinze titulaires, que les
 * dix-sept feuilles publiées de cette saison satisfont toutes.
 */
export function effectifMinimalDeFeuille(saison: string): number {
  const annee = Number(saison.slice(0, 4));
  if (annee <= 2004) return 17;
  return effectifDeFeuille(saison) - (annee <= 2005 ? 2 : 1);
}

/**
 * LA SOURCE OMET-ELLE DES TITULAIRES À CETTE ÉPOQUE ?
 *
 * Une composition de moins de quinze titulaires est **toujours** une lacune,
 * jamais un fait de jeu : quinze joueurs commencent la rencontre. La question
 * n'est donc pas de savoir si c'est normal, mais si c'est **la source** qui
 * l'explique ou **la lecture** qu'on en fait.
 *
 * Jusqu'en 2005-2006, c'est la source : son schéma du terrain oublie des
 * dossards précis — le n°10 catalan du 13 mai 2006, les n°4 et n°15 bayonnais
 * du 8 avril —, sur six des vingt-six journées, et aucune autre source ne les
 * donne. La composition partielle est alors écrite, avec un avertissement.
 *
 * À partir de 2006-2007, la LNR ne fait plus cela : sur les saisons reprises,
 * une seule feuille omet un titulaire — le n°6 parisien du 21 avril 2012 —, et
 * `TITULAIRES_MANQUANTS` le rend à son dossard depuis une autre source. Un
 * écart y trahirait donc une lecture cassée, et il doit rester un échec.
 */
export function titulairesManquantsAdmis(saison: string): boolean {
  return Number(saison.slice(0, 4)) <= 2005;
}

/**
 * Feuille adverse complète d'une saison de championnat, depuis la LNR.
 *
 * Reconstitue, pour chaque match de Top 14 et pour le barrage d'accession,
 * les réalisations, les cartons et surtout les temps de jeu adverses — ces
 * derniers déduits des changements officiels, seule source qui les donne
 * avec leur camp, leur minute et leur caractère définitif ou temporaire.
 *
 * Écrit d'abord pour 2024-2025, dont les minutes adverses étaient une
 * fiction : 474 titulaires à exactement 80' et 256 remplaçants à 0', aucune
 * entrée renseignée sur les 32 matchs. Des joueurs figuraient donc comme
 * marqueurs sans avoir joué une minute.
 *
 * La LNR est la source de référence : ses noms sont ceux des feuilles
 * officielles, elle donne le score après chaque fait de match, et elle
 * n'oublie pas les essais de pénalité — trois points sur lesquels ESPN s'est
 * montré fautif. Toute divergence est signalée, et c'est la LNR qui l'emporte.
 *
 * Une réserve, coûteuse à découvrir : `conversionPlayer` ment. Il désigne
 * parfois un joueur de l'autre équipe, se pose parfois sur un carton pour
 * dire la transformation de l'essai précédent, et manque parfois tout à fait.
 * C'est donc le **score courant** qui décide s'il y a eu transformation —
 * tout reliquat de deux points en est une —, `conversionPlayer` ne servant
 * qu'à nommer le buteur quand il appartient bien à l'équipe.
 *
 * Source : top14.lnr.fr/feuille-de-match/{saison}/{phase}/{id}-{dom}-{ext}
 *          /resumes-replays, via scripts/lib/lnr.ts
 *
 * Périmètre : les journées de Top 14 (`matchday` renseigné) et le barrage
 * d'accession. Les matchs de coupe d'Europe en sont exclus — ils relèvent de
 * l'EPCR, que la LNR ne couvre pas.
 *
 * Contrôles avant écriture, par match :
 *   - le camp de l'USAP déduit de l'URL doit correspondre à `isHome` ;
 *   - tout auteur ou remplaçant absent de la composition en base fait échouer
 *     le match entier : un nom non apparié fausserait les temps de jeu des
 *     deux joueurs concernés — et le plus souvent, c'est la composition en
 *     base qui est fautive (cf. audit-opponent-lineups.ts) ;
 *   - la somme des points doit retomber sur le score, essais de pénalité
 *     déduits, et le nombre d'essais sur le compteur du match.
 * Les temps de jeu font l'objet d'un simple avertissement : un carton rouge
 * ou un remplacement temporaire non refermé décale le total sans invalider
 * la feuille.
 *
 * Usage :
 *   npx tsx scripts/seed-opponent-sheet.ts 2023-2024 --dry
 *   npx tsx scripts/seed-opponent-sheet.ts 2023-2024
 *   npx tsx scripts/seed-opponent-sheet.ts 2025-2026 --dry --detail
 *   npx tsx scripts/seed-opponent-sheet.ts 2022-2023 --dry --match=2023-06-03
 *
 * Sur une saison déjà renseignée, la simulation chiffre l'écart entre la
 * feuille officielle et la base, ligne par ligne : `--detail` en donne le
 * relevé.
 *
 * Idempotent : la feuille adverse est remise à zéro avant d'être réécrite.
 */

import { PrismaClient } from "@prisma/client";
import { estCouperet } from "../src/lib/matchs";
import {
  essaisOmisSansAuteur,
  pointsOmisSansAuteur,
  titulairesManquantsAdmis,
} from "./lib/feuilles";
import { memeMot, mots, normalize, proximite } from "./lib/noms";
import {
  chercherFeuille,
  lireFeuille,
  phasesLnr,
  utiliserDivision,
  type Camp,
  type LnrFeuille,
  type LnrJoueur,
} from "./lib/lnr";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");
const DETAIL = process.argv.includes("--detail");
const AVEC_USAP = process.argv.includes("--usap");
const SAISON = process.argv.slice(2).find((a) => /^\d{4}-\d{4}$/.test(a));
const SEUL = process.argv
  .find((a) => a.startsWith("--match="))
  ?.slice("--match=".length);

if (!SAISON) {
  console.error(
    "Saison manquante.\n" +
      "  npx tsx scripts/seed-opponent-sheet.ts 2023-2024 --dry\n" +
      "Options : --dry (simulation), --detail (relevé des écarts), --match=AAAA-MM-JJ",
  );
  process.exit(1);
}

const DUREE = 80;
/** Durée d'un match allé au bout de ses prolongations : 80 + 2 × 10. */
const DUREE_PROLONGATIONS = 100;

/**
 * UNE PHASE FINALE PEUT ALLER EN PROLONGATIONS, ET LE MATCH DURE ALORS
 * CENT MINUTES.
 *
 * Le modèle compte tout match pour quatre-vingts minutes plates, ce qui est
 * vrai de toute rencontre de championnat — un match nul de phase régulière
 * reste nul. Mais un couperet doit se départager, et la demi-finale du
 * 17 mai 2015 contre Agen l'a fait : la feuille y inscrit des pénalités aux
 * 82ᵉ, 88ᵉ, 94ᵉ et 99ᵉ minutes, le score passant de 26-26 à la fin du temps
 * réglementaire à 32-32 au coup de sifflet final. Deux périodes de dix
 * minutes, et Agen s'est qualifié sur les essais marqués, quatre à deux.
 *
 * Sans cette durée, les deux camps totalisaient 1 200 et 1 203 minutes au lieu
 * de 1 500 : chaque titulaire resté sur le terrain se voyait amputé de ses
 * vingt minutes de prolongation, et le remplaçant entré à la 83ᵉ recevait zéro
 * minute au lieu de dix-sept.
 *
 * **La règle est verrouillée sur le couperet**, et c'est ce qui la rend sûre :
 * une rencontre de championnat ne peut pas se prolonger, si bien qu'un fait
 * tardif n'y est jamais qu'un arrêt de jeu — la LNR additionne les minutes
 * additionnelles à la minute du fait, et une pénalité à la 83ᵉ d'une journée
 * ordinaire est une pénalité de la 80ᵉ+3. Le seuil de 90 minutes laisse donc
 * passer tout temps additionnel plausible, et ne retient que ce qu'aucun arrêt
 * de jeu n'explique.
 *
 * Réserve : un couperet prolongé dont la feuille n'inscrirait aucun fait ni
 * changement après la 90ᵉ passerait inaperçu. Le total de minutes le dirait —
 * il tomberait 300 minutes trop bas, ce qui ne se rate pas.
 */
function dureeDuMatch(feuille: LnrFeuille, estCouperet: boolean): number {
  if (!estCouperet) return DUREE;
  const derniere = Math.max(
    0,
    ...feuille.faits.map((f) => f.minute),
    ...feuille.changements.map((c) => c.minute),
  );
  return derniere > 90 ? DUREE_PROLONGATIONS : DUREE;
}

/**
 * Changements que la feuille officielle rapporte de travers, corrigés à la
 * main. Une entrée ici, c'est affirmer que la LNR se trompe — à ne poser
 * qu'avec la démonstration sous les yeux.
 *
 * **Pau, 22 février 2026.** La feuille annonce à la 56ᵉ « entre Clément
 * MONDINAT, sort Grégoire ARFEUIL ». Deux choses l'interdisent :
 *   - Arfeuil ne peut pas sortir, il n'était jamais entré. Il porte le 22, et
 *     aucun changement ne le fait entrer ;
 *   - Mondinat ne figure pas parmi les vingt-trois que la LNR publie
 *     elle-même, et n'apparaît sur aucun des deux terrains qu'elle dessine.
 *
 * Le second terrain, celui de la fin de match, dit ce qui s'est passé :
 * Valentino n'y est plus, la ligne de trois-quarts a glissé
 * (Grandidier-Nkanang 14→11, Decron 13→12, Maddocks 15→13, Luc 11→15) et
 * **Arfeuil occupe le 14**. Valentino, lui, ne figure dans aucun changement
 * alors que tous les autres sortants pauois en ont un.
 *
 * Les deux noms de ce seul enregistrement sont donc décalés d'un cran : le
 * sortant est Valentino, l'entrant Arfeuil, et Mondinat n'est que l'occupant
 * du 22 sur le banc de fin de match. La feuille ment sur les noms — ce n'est
 * pas la première fois, `conversionPlayer` en fait autant.
 */
const CHANGEMENTS_CORRIGES: Record<
  string,
  Array<{ minute: number; club: "home" | "away"; entrant: string; sortant: string }>
> = {
  "2026-02-22": [
    { minute: 56, club: "away", entrant: "Grégoire Arfeuil", sortant: "Quentin Valentino" },
  ],
  // **Perpignan-Montpellier du 28 août 2010.** La feuille fait entrer Mamuka
  // Gorgodze à la 44ᵉ à la place de « Prenom_545 NOM_545 » — un gabarit, non
  // un nom. L'enregistrement montpelliérain de Gonçalo Uva est corrompu de
  // bout en bout : la LNR l'omet aussi de sa composition, où le n°4 manque
  // (cf. `TITULAIRES_MANQUANTS` de `lib/feuilles.ts`). Le déroulé d'ESPN pour
  // cette rencontre (`gameId=119006`) donne le remplacement en toutes
  // lettres : Gorgodze pour Uva à la 44ᵉ.
  "2010-08-28": [
    { minute: 44, club: "away", entrant: "Mamuka Gorgodze", sortant: "Goncalo Uva" },
  ],
  // **Montpellier-Perpignan du 20 septembre 2008.** Même jeton, même homme,
  // dans l'autre sens : « Prenom_545 NOM_545 » entre à la 69ᵉ à la place de
  // Jacques Bascou, et 545 est Gonçalo Uva (cf. `lib/feuilles.ts`).
  "2008-09-20": [
    { minute: 69, club: "home", entrant: "Goncalo Uva", sortant: "Jacques Bascou" },
  ],
};

/**
 * CARTONS QUE LA LNR DONNE À UN JOUEUR QU'ELLE N'ALIGNE PAS.
 *
 * Un carton porté par un homme absent des vingt-trois est irrattachable : on
 * ne peut ni le poser sur une ligne, ni en déduire la minute où le joueur a
 * quitté le terrain. Le tolérer, c'est écrire le reste de la feuille — les
 * réalisations, les temps de jeu, les autres cartons — plutôt que de perdre
 * un camp entier pour un fait qu'on ne saurait de toute façon pas placer.
 *
 * Chaque ligne s'écrit avec la démonstration sous les yeux, comme
 * `CHANGEMENTS_CORRIGES`. La seule à ce jour :
 *
 * **Béziers, 16 octobre 2016.** La feuille inscrit deux cartons rouges à la
 * 40ᵉ pour Béziers : Joshua Valentine, qui porte bien le 9, et Manuel Edmonds,
 * qui ne figure sur aucune des deux listes de vingt-trois que la LNR publie
 * elle-même sur ce match — la page `/compositions` n'affiche que cinquante-deux
 * blocs de joueurs, vingt-trois par camp et six officiels, et il n'y est pas.
 * Ses deux onglets se contredisent donc, et rien ne permet de trancher : on
 * peut démontrer que la feuille est fausse, pas ce qui s'est passé sur le
 * terrain. Le rouge de Valentine est enregistré, celui d'Edmonds ignoré, et
 * le total de Béziers vaut en conséquence 1 160 minutes et non 1 120.
 */
const CARTONS_HORS_COMPOSITION: Record<string, Array<{ minute: number; nom: string }>> = {
  "2016-10-16": [{ minute: 40, nom: "Manuel Edmonds" }],
};

/**
 * TEMPS DE JEU QUE LA LNR NE PERMET PAS DE RECONSTITUER, PARCE QU'ELLE
 * N'INSCRIT PAS LE CARTON QUI L'EXPLIQUE.
 *
 * Le script déduit les minutes des seuls changements. Quand un joueur quitte
 * le terrain sur un carton que la feuille ne mentionne pas, il le croit donc
 * en jeu jusqu'au coup de sifflet, et l'écrit ainsi — sans qu'aucun contrôle
 * s'en aperçoive, la somme de l'équipe retombant alors sur 1 200.
 *
 * **Barrage Provence-Perpignan du 14 juin 2026.** Sama Malolo, talonneur n°2,
 * prend un **carton orange à la 33ᵉ** et ne revient pas. La LNR n'enregistre
 * ni le carton ni sa sortie, et lui donne 80 minutes ; c'est ce que la reprise
 * du 1er septembre 2026 avait écrit, en effaçant les 33 minutes que la base
 * portait.
 *
 * Ce qu'elle enregistre, en revanche, trahit le carton : à la 34ᵉ, « Ignacio
 * RUIZ ← Jefferson-Lee JOSEPH », soit **un talonneur qui remplace un ailier**.
 * Ce n'est pas une substitution ordinaire, c'est la loi sur la première
 * ligne : un spécialiste entre, et un autre joueur sort pour que l'équipe
 * reste à quatorze. La LNR n'a retenu que ce second mouvement, et l'a présenté
 * comme un remplacement normal.
 *
 * D'où les deux lignes ci-dessous. Malolo s'arrête à la 33ᵉ. Joseph sort à la
 * 34ᵉ et **revient à la 53ᵉ**, quand s'achèvent les vingt minutes de
 * sanction : 34 + 27 = 61 minutes. `subIn` et `subOut` gardent la première
 * sortie et le retour, comme pour toute sortie temporaire.
 *
 * **L'arithmétique atteste l'ensemble** : l'USAP joue à quatorze de la 33ᵉ à
 * la 53ᵉ, soit vingt minutes, et son total vaut donc 1 200 − 20 = 1 180. Les
 * deux corrections y mènent au point près, là où la seule correction de
 * Malolo laisserait 1 153. Le retour de Joseph n'est écrit par aucune source ;
 * il est confirmé par Jérémy, et c'est la seule minute de ce bloc qui ne se
 * démontre pas.
 *
 * `PRIVATIONS_SUR_CARTON`, juste au-dessus, corrige l'**attendu** auquel ces
 * lignes sont confrontées : sans elle le contrôle réclamerait 1 200 et
 * signalerait la correction comme un défaut à chaque passage. Une table
 * corrige les lignes, l'autre la règle à laquelle on les mesure.
 */
const PRIVATIONS_SUR_CARTON: Record<string, Array<{ club: Camp; minutes: number }>> = {
  // Le carton orange de Sama Malolo à la 33ᵉ, cf. `TEMPS_DE_JEU_CORRIGES`.
  "2026-06-14": [{ club: "away", minutes: 20 }],
};

const TEMPS_DE_JEU_CORRIGES: Record<
  string,
  Array<{
    club: Camp;
    dossard: number;
    minutes: number;
    subIn: number | null;
    subOut: number | null;
  }>
> = {
  "2026-06-14": [
    { club: "away", dossard: 2, minutes: 33, subIn: null, subOut: 33 },
    { club: "away", dossard: 14, minutes: 61, subIn: 53, subOut: 34 },
  ],
};

/** Ce carton-là est-il un de ceux qu'on sait irrattachables ? */
function cartonTolere(jour: string, minute: number, joueur: LnrJoueur): boolean {
  const nom = normalize(`${joueur.firstName} ${joueur.lastName}`);
  return (CARTONS_HORS_COMPOSITION[jour] ?? []).some(
    (c) => c.minute === minute && normalize(c.nom) === nom,
  );
}

/** Applique les corrections connues aux changements d'une feuille. */
function corriger(feuille: LnrFeuille, jour: string): LnrFeuille {
  const corrections = CHANGEMENTS_CORRIGES[jour];
  if (!corrections) return feuille;

  const nom = (complet: string) => {
    const mots = complet.trim().split(/\s+/);
    return { firstName: mots.slice(0, -1).join(" "), lastName: mots[mots.length - 1] };
  };

  return {
    ...feuille,
    changements: feuille.changements.map((c) => {
      // **Le club fait partie de l'appariement, et il le faut** : deux
      // changements peuvent tomber à la même minute, un par camp. Sans lui, la
      // correction du 20 septembre 2008 réécrivait aussi le changement
      // catalan de la 69ᵉ, et le camp de l'USAP échouait à son tour.
      const correction = corrections.find((x) => x.minute === c.minute && x.club === c.club);
      if (!correction) return c;
      return { ...c, entrant: nom(correction.entrant), sortant: nom(correction.sortant) };
    }),
  };
}

interface Ligne {
  id: string;
  firstName: string;
  lastName: string;
  shirtNumber: number | null;
  isStarter: boolean;
  /** Valeurs actuellement en base, pour chiffrer l'écart avec la feuille. */
  actuel: Bilan;
}

interface Bilan {
  minutes: number | null;
  subIn: number | null;
  subOut: number | null;
  tries: number;
  conversions: number;
  penalties: number;
  drops: number;
  points: number;
  jaune: number | null;
  rouge: number | null;
}

const bilanVide = (): Bilan => ({
  minutes: null,
  subIn: null,
  subOut: null,
  tries: 0,
  conversions: 0,
  penalties: 0,
  drops: 0,
  points: 0,
  jaune: null,
  rouge: null,
});

/**
 * Mots de `nom` qui trouvent un correspondant dans `reference`, un mot pouvant
 * en abréger un autre (« Nafi » pour « Nafitalai »).
 */
function motsCommuns(nom: string, reference: string): string[] {
  const cibles = mots(reference);
  return mots(nom).filter((mot) => cibles.some((cible) => memeMot(mot, cible)));
}

/**
 * Rattache un joueur de la feuille officielle à une ligne de la composition
 * en base, en comparant les **noms complets** mot à mot.
 *
 * Comparer le seul nom de famille ne suffit pas : les deux sources ne coupent
 * pas le nom au même endroit. La LNR écrit « Levani Botia | VEIVUKE » là où la
 * base porte « Levani | Botia », « Iakopo | PETELO MAPU » pour « Iakopo |
 * Mapu ». Le nom de famille de l'une est le prénom de l'autre.
 *
 * Un mot du nom de famille pèse plus lourd qu'un prénom partagé, et un seul
 * mot commun ne suffit que s'il vient du nom de famille de la feuille
 * et qu'il est assez long : sur un banc où six joueurs s'appellent Thomas, se
 * contenter du prénom rattacherait n'importe qui à n'importe qui — et un
 * appariement fautif fausse les minutes de deux joueurs à la fois. En cas
 * d'ex æquo, on préfère échouer : le match entier sera signalé.
 *
 * Deux noms identiques à l'accent près court-circuitent tout le reste : les
 * noms de famille de moins de trois lettres — Connor Sa, à Bordeaux — ne
 * laissent aucun mot significatif à comparer. Un nom de famille identique
 * suffit d'ailleurs à lui seul, quand bien même les prénoms divergeraient :
 * la feuille écrit « Akinbiyi Olabamigbe ALO » là où la base porte
 * « Biyi Alo ».
 */
function apparier(roster: Ligne[], joueur: LnrJoueur): Ligne | null {
  const cherche = `${joueur.firstName} ${joueur.lastName}`;
  const famille = mots(joueur.lastName);
  const nomDeFamille = normalize(joueur.lastName);

  const identiques = roster.filter(
    (l) => normalize(`${l.firstName} ${l.lastName}`) === normalize(cherche),
  );
  if (identiques.length === 1) return identiques[0];

  const notes = roster
    .map((ligne) => {
      const communs = motsCommuns(`${ligne.firstName} ${ligne.lastName}`, cherche);
      const { plusLong } = proximite(`${ligne.firstName} ${ligne.lastName}`, cherche);
      // Un mot du nom de famille pèse plus lourd qu'un prénom partagé : le
      // banc bayonnais aligne Lucas Martin et Lucas Paulos quand la feuille
      // annonce « Lucas Martin PAULOS ADLER ».
      const parFamille = communs.filter((mot) =>
        famille.some((autre) => memeMot(mot, autre)),
      ).length;
      return {
        ligne,
        communs,
        plusLong,
        note: communs.length * 10 + plusLong + parFamille * 20,
      };
    })
    .filter(
      (c) =>
        c.communs.length >= 2 ||
        (c.communs.length === 1 &&
          (normalize(c.ligne.lastName) === nomDeFamille ||
            (c.plusLong >= 4 && famille.some((mot) => memeMot(mot, c.communs[0]))))),
    )
    .sort((a, b) => b.note - a.note);

  if (notes.length === 0) return null;
  if (notes.length > 1 && notes[1].note === notes[0].note) return null;
  return notes[0].ligne;
}

/**
 * Coups de pied placés identifiés de l'équipe, avec leur minute : pénalités
 * réussies et transformations nommées. Sert à retrouver le buteur d'une
 * transformation que la feuille ne nomme pas — c'est presque toujours celui
 * qui a botté juste avant ou juste après.
 */
function repererButeurs(
  roster: Ligne[],
  feuille: LnrFeuille,
  camp: Camp,
): { minute: number; ligne: Ligne }[] {
  const buteurs: { minute: number; ligne: Ligne }[] = [];
  for (const fait of feuille.faits) {
    if (fait.club === camp && fait.type === "penalite" && fait.joueur) {
      const ligne = apparier(roster, fait.joueur);
      if (ligne) buteurs.push({ minute: fait.minute, ligne });
    }
    // Un `conversionPlayer` peut être porté par un fait de l'autre équipe :
    // l'appariement au effectif fait le tri.
    if (fait.transformePar) {
      const ligne = apparier(roster, fait.transformePar);
      if (ligne) buteurs.push({ minute: fait.minute, ligne });
    }
  }
  return buteurs;
}

/** Buteur le plus proche d'une minute ; `null` si deux se disputent la place. */
function buteurLePlusProche(
  buteurs: { minute: number; ligne: Ligne }[],
  minute: number,
): Ligne | null {
  let meilleur: Ligne | null = null;
  let ecart = Infinity;
  let partage = false;
  for (const buteur of buteurs) {
    const distance = Math.abs(buteur.minute - minute);
    if (distance < ecart) {
      ecart = distance;
      meilleur = buteur.ligne;
      partage = false;
    } else if (distance === ecart && buteur.ligne.id !== meilleur?.id) {
      partage = true;
    }
  }
  return partage ? null : meilleur;
}

/**
 * Temps de jeu de chaque ligne, reconstitué à partir des changements.
 * Un joueur peut sortir puis revenir : on additionne les intervalles, et on
 * ne garde comme `subIn` / `subOut` que la première entrée et la première
 * sortie, seules valeurs que porte le modèle.
 */
function calculerTempsDeJeu(
  roster: Ligne[],
  feuille: LnrFeuille,
  campAdverse: Camp,
  bilans: Map<string, Bilan>,
  echecs: string[],
  duree: number,
  jour: string,
) {
  const surLeTerrain = new Map<string, number | null>();
  const total = new Map<string, number>();

  for (const ligne of roster) {
    surLeTerrain.set(ligne.id, ligne.isStarter ? 0 : null);
    total.set(ligne.id, 0);
  }

  /**
   * @param sortie vraie sortie (remplacement, carton rouge) plutôt que la
   *   fin de la rencontre : seule une vraie sortie se note dans `subOut`.
   */
  const fermer = (id: string, minute: number, sortie: boolean) => {
    const depuis = surLeTerrain.get(id);
    if (depuis == null) return;
    total.set(id, (total.get(id) ?? 0) + Math.max(0, minute - depuis));
    surLeTerrain.set(id, null);
    const bilan = bilans.get(id)!;
    if (sortie && bilan.subOut == null) bilan.subOut = minute;
  };

  for (const changement of feuille.changements.filter((c) => c.club === campAdverse)) {
    const entrant = apparier(roster, changement.entrant);
    const sortant = apparier(roster, changement.sortant);
    if (!entrant || !sortant) {
      echecs.push(
        `changement ${changement.minute}' non apparié : ` +
          `${changement.entrant.firstName} ${changement.entrant.lastName} ← ` +
          `${changement.sortant.firstName} ${changement.sortant.lastName}`,
      );
      continue;
    }
    fermer(sortant.id, changement.minute, true);
    if (surLeTerrain.get(entrant.id) == null) {
      surLeTerrain.set(entrant.id, changement.minute);
      const bilan = bilans.get(entrant.id)!;
      if (bilan.subIn == null) bilan.subIn = changement.minute;
    }
  }

  for (const ligne of roster) {
    // Un carton rouge met fin au match du joueur
    const rouge = bilans.get(ligne.id)!.rouge;
    fermer(ligne.id, rouge ?? duree, rouge != null);
    const joue = total.get(ligne.id) ?? 0;
    const bilan = bilans.get(ligne.id)!;
    // Remplaçant jamais entré : minutes inconnues plutôt que zéro
    bilan.minutes = !ligne.isStarter && bilan.subIn == null ? null : joue;
  }

  // Les sorties sur carton que la feuille passe sous silence, et qu'aucun
  // changement ne permet donc de déduire — cf. `TEMPS_DE_JEU_CORRIGES`.
  for (const c of TEMPS_DE_JEU_CORRIGES[jour] ?? []) {
    if (c.club !== campAdverse) continue;
    const ligne = roster.find((l) => l.shirtNumber === c.dossard);
    if (!ligne) {
      echecs.push(`temps de jeu corrigé : aucun n°${c.dossard} dans la composition`);
      continue;
    }
    const bilan = bilans.get(ligne.id)!;
    bilan.minutes = c.minutes;
    bilan.subIn = c.subIn;
    bilan.subOut = c.subOut;
  }
}

/**
 * Un essai que la LNR n'attribue à personne. Les archives anciennes en portent
 * — « Essai collectif » à Carcassonne le 27 septembre 2020 —, et l'auteur y
 * est un nom de famille sans prénom.
 */
function estCollectif(joueur: LnrJoueur | null): boolean {
  if (!joueur) return true;
  return /essai collectif/i.test(`${joueur.firstName} ${joueur.lastName}`);
}

/** Champs sur lesquels la feuille officielle et la base sont confrontées. */
const CHAMPS: (keyof Bilan)[] = [
  "minutes",
  "subIn",
  "subOut",
  "tries",
  "conversions",
  "penalties",
  "drops",
  "points",
  "jaune",
  "rouge",
];

/** Écarts entre la feuille et la base, sous forme « champ base→feuille ». */
function ecarts(actuel: Bilan, retenu: Bilan): string[] {
  return CHAMPS.filter((champ) => actuel[champ] !== retenu[champ]).map(
    (champ) => `${champ} ${actuel[champ] ?? "∅"}→${retenu[champ] ?? "∅"}`,
  );
}

async function main(cible: "adverse" | "usap") {
  console.log(
    `=== Feuille ${cible === "usap" ? "catalane" : "adverse"} ${SAISON} depuis la LNR` +
      `${DRY_RUN ? " (simulation)" : ""} ===\n`,
  );

  const saison = await prisma.season.findFirstOrThrow({ where: { label: SAISON } });
  // La LNR sépare Top 14 et Pro D2 sur deux sites.
  utiliserDivision(saison.division === "PRO_D2" ? "prod2" : "top14");
  const matchs = await prisma.match.findMany({
    where: { seasonId: saison.id },
    orderBy: { date: "asc" },
    include: {
      opponent: { select: { name: true, shortName: true } },
      competition: { select: { name: true, shortName: true } },
    },
  });

  let traites = 0;
  let lignesModifiees = 0;
  const horsPerimetre: string[] = [];
  const echecs: string[] = [];
  const divergences: string[] = [];

  for (const match of matchs) {
    const jour = match.date.toISOString().slice(0, 10);
    if (SEUL && jour !== SEUL) continue;
    const adversaire = match.opponent.shortName ?? match.opponent.name;
    const etiquette = `${jour} ${adversaire.padEnd(16)} ${match.scoreUsap}-${match.scoreOpponent}`;

    // Journée, phase finale ou barrage — `phasesLnr` déduit le segment d'URL
    // du libellé de tour, la LNR l'ayant renommé au fil des saisons.
    const phases = phasesLnr(
      SAISON!,
      match.matchday,
      `${match.competition.name} ${match.round ?? ""}`,
    );
    if (phases.length === 0) {
      horsPerimetre.push(`${etiquette} (${match.competition.shortName})`);
      continue;
    }

    let url: string | null = null;
    for (const phase of phases) {
      url = await chercherFeuille(SAISON!, phase);
      if (url) break;
    }
    if (!url) {
      echecs.push(`${etiquette} : feuille LNR introuvable pour ${phases.join(" / ")}`);
      continue;
    }

    const feuille = corriger(await lireFeuille(url), jour);
    if ((feuille.campUsap === "home") !== match.isHome) {
      echecs.push(
        `${etiquette} : ${url} donne l'USAP ${feuille.campUsap}, la base dit ${match.isHome ? "home" : "away"}`,
      );
      continue;
    }
    // Le camp traité, et les compteurs du match qui lui correspondent : tout
    // le reste de la boucle est écrit une fois pour les deux.
    const campTraite: Camp =
      cible === "usap"
        ? feuille.campUsap
        : feuille.campUsap === "home"
          ? "away"
          : "home";
    const score = cible === "usap" ? match.scoreUsap : match.scoreOpponent;
    const essaisCompteur = cible === "usap" ? match.triesUsap : match.triesOpponent;
    const penaltyTries =
      cible === "usap" ? match.penaltyTriesUsap : match.penaltyTriesOpponent;

    // `null` au score se lit « pas encore jouée », jamais « zéro ».
    if (score == null) {
      horsPerimetre.push(`${etiquette} (rencontre non jouée)`);
      continue;
    }

    const roster: Ligne[] = (
      await prisma.matchPlayer.findMany({
        where: { matchId: match.id, isOpponent: cible === "adverse" },
        select: {
          id: true,
          isStarter: true,
          shirtNumber: true,
          minutesPlayed: true,
          subIn: true,
          subOut: true,
          tries: true,
          conversions: true,
          penalties: true,
          dropGoals: true,
          totalPoints: true,
          yellowCardMin: true,
          redCardMin: true,
          player: { select: { firstName: true, lastName: true } },
        },
      })
    )
      .filter((l) => l.player)
      .map((l) => ({
        id: l.id,
        firstName: l.player!.firstName,
        lastName: l.player!.lastName,
        shirtNumber: l.shirtNumber,
        isStarter: l.isStarter,
        actuel: {
          minutes: l.minutesPlayed,
          subIn: l.subIn,
          subOut: l.subOut,
          tries: l.tries,
          conversions: l.conversions,
          penalties: l.penalties,
          drops: l.dropGoals,
          points: l.totalPoints,
          jaune: l.yellowCardMin,
          rouge: l.redCardMin,
        },
      }));

    const bilans = new Map<string, Bilan>(roster.map((l) => [l.id, bilanVide()]));

    const ennuis: string[] = [];
    const inferences: string[] = [];
    let essaisDePenalite = 0;
    /** Essais que la feuille n'attribue à personne, hors essais de pénalité. */
    // Un essai que la feuille omet entièrement compte comme un essai
    // collectif : cinq points pour l'équipe, aucun auteur (cf. lib/feuilles.ts).
    let essaisCollectifs = essaisOmisSansAuteur(jour, cible === "usap" ? "usap" : "adversaire");
    /**
     * Points que la feuille ne rattache à personne, hors essais.
     *
     * **La LNR écrit « n.a. » quand elle ne sait pas qui a marqué**, et cela
     * ne vaut pas que pour les essais de pénalité : le Bayonne-Perpignan du
     * 9 février 2013 ne nomme **aucun** de ses trois marqueurs bayonnais —
     * pénalités des 6ᵉ et 28ᵉ, essai collectif de la 36ᵉ et sa transformation.
     * Les treize points de Bayonne comptent pour l'équipe, et pour personne.
     *
     * On ne confond pas ce cas avec un nom qui ne s'apparie pas : là, la
     * source désigne quelqu'un que la composition ignore, et le match échoue
     * — c'est le plus souvent la composition qui est fausse. Ici la source ne
     * désigne personne, et il n'y a rien à trouver.
     */
    // La feuille omet parfois des points de bout en bout — pas seulement leur
    // auteur. `lib/feuilles.ts` porte ce que d'autres sources établissent, et
    // la part qu'aucun joueur ne peut porter.
    let pointsSansAuteur = pointsOmisSansAuteur(jour, cible === "usap" ? "usap" : "adversaire");

    // Une composition qui n'aligne pas quinze titulaires ne permet pas de
    // reconstituer les temps de jeu : chaque titulaire **de trop** ajoute
    // jusqu'à 80 minutes fictives. La LNR dessine parfois seize joueurs sur
    // son terrain — Lyon à Aimé-Giral le 29 octobre 2022.
    //
    // Un titulaire **manquant** ne fabrique rien, et il est admis là où la
    // source en omet — cf. `titulairesManquantsAdmis`, et le même partage dans
    // `seed-lineup.ts`. Sur ces saisons-là, les temps de jeu ne sont de toute
    // façon pas écrits, la LNR ne publiant aucun changement.
    const titulaires = roster.filter((l) => l.isStarter).length;
    const titulairesFautifs =
      titulaires > 15 || (titulaires < 15 && !titulairesManquantsAdmis(SAISON ?? ""));
    if (titulairesFautifs) {
      ennuis.push(`${titulaires} titulaires dans la composition en base`);
    }

    // ---- Réalisations et cartons ------------------------------------------
    // Le score courant est la seule donnée sûre de la feuille : on additionne
    // les points de base au fil des faits, et tout reliquat de deux points est
    // une transformation — nommée ou non.
    const cote: 0 | 1 = campTraite === "home" ? 0 : 1;
    const avecScore = feuille.faits.some((f) => f.score);
    const buteurs = repererButeurs(roster, feuille, campTraite);
    // `ligne` est nulle pour un essai que la feuille n'attribue à personne.
    const essaisAdverses: { minute: number; ligne: Ligne | null; transforme: boolean }[] = [];
    /** Points adverses reconstitués, essais de pénalité compris. */
    let courant = 0;

    /**
     * Crédite une transformation au dernier essai qui n'en a pas. Le buteur
     * proposé par la feuille l'emporte s'il appartient bien à l'équipe ;
     * sinon c'est le buteur de l'équipe le plus proche dans le temps.
     */
    const transformer = (propose: LnrJoueur | null) => {
      const essai = [...essaisAdverses].reverse().find((e) => !e.transforme);
      if (!essai) {
        ennuis.push("une transformation de plus que d'essais à transformer");
        return;
      }
      essai.transforme = true;
      const nomme = propose ? apparier(roster, propose) : null;
      const buteur = nomme ?? buteurLePlusProche(buteurs, essai.minute);
      if (!buteur) {
        // Aucun buteur nommé de tout le match : la feuille ne dit pas qui a
        // transformé, et rien ne permet de le déduire. Les deux points restent
        // à l'équipe, comme l'essai qu'ils transforment.
        pointsSansAuteur += 2;
        inferences.push(
          `transformation de l'essai de ${essai.minute}' : aucun buteur nommé, points laissés à l'équipe`,
        );
        return;
      }
      const bilan = bilans.get(buteur.id)!;
      bilan.conversions++;
      bilan.points += 2;
      if (!nomme) {
        inferences.push(
          `transformation de l'essai de ${essai.minute}' non nommée, portée au crédit de ` +
            `${buteur.firstName} ${buteur.lastName}`,
        );
      }
    };

    for (const fait of feuille.faits) {
      if (fait.club === campTraite) {
        if (fait.type === "essai-de-penalite") {
          essaisDePenalite++;
          courant += 7;
        } else if (fait.type === "essai" && estCollectif(fait.joueur)) {
          // « Essai collectif » : la LNR n'attribue pas cet essai-là. Il compte
          // pour l'équipe, jamais pour un joueur — comme un essai de pénalité,
          // mais à cinq points, et transformable.
          essaisCollectifs++;
          courant += 5;
          essaisAdverses.push({ minute: fait.minute, ligne: null, transforme: false });
        } else if (!fait.joueur && (fait.type === "penalite" || fait.type === "drop")) {
          // « n.a. » sur une pénalité ou un drop : les points sont à l'équipe.
          pointsSansAuteur += 3;
          courant += 3;
          inferences.push(`${fait.type} ${fait.minute}' : aucun auteur nommé, points laissés à l'équipe`);
        } else if (!fait.joueur) {
          ennuis.push(`fait ${fait.minute}' ${fait.type} sans auteur`);
        } else {
          const ligne = apparier(roster, fait.joueur);
          if (!ligne) {
            const message =
              `${fait.type} ${fait.minute}' : ${fait.joueur.firstName} ${fait.joueur.lastName} hors composition`;
            if (
              (fait.type === "jaune" || fait.type === "rouge") &&
              cartonTolere(jour, fait.minute, fait.joueur)
            ) {
              inferences.push(`${message} — carton irrattachable, ignoré`);
            } else {
              ennuis.push(message);
            }
          } else {
            const bilan = bilans.get(ligne.id)!;
            switch (fait.type) {
              case "essai":
                bilan.tries++;
                bilan.points += 5;
                courant += 5;
                essaisAdverses.push({ minute: fait.minute, ligne, transforme: false });
                break;
              case "penalite":
                bilan.penalties++;
                bilan.points += 3;
                courant += 3;
                break;
              case "drop":
                bilan.drops++;
                bilan.points += 3;
                courant += 3;
                break;
              case "jaune":
                bilan.jaune = fait.minute;
                break;
              case "rouge":
                bilan.rouge = fait.minute;
                break;
            }
          }
        }
      }

      // Le reliquat se lit sur n'importe quel fait, pas seulement sur ceux de
      // l'équipe : la LNR inscrit volontiers la transformation sur le score du
      // fait suivant, fût-il un carton de l'adversaire.
      if (!fait.score) continue;
      let residu = fait.score[cote] - courant;
      while (residu >= 2 && essaisAdverses.some((e) => !e.transforme)) {
        transformer(fait.transformePar);
        courant += 2;
        residu -= 2;
      }
      if (residu !== 0) {
        // Le score courant de la LNR déraille parfois — deux points inscrits
        // avant l'essai qui les vaut. On le signale sans écarter la feuille :
        // c'est le total final, contrôlé plus bas, qui fait foi.
        inferences.push(
          `score ${fait.score.join("-")} à la ${fait.minute}' pour ${courant} points reconstitués`,
        );
      }
    }

    // La feuille s'arrête parfois avant la dernière transformation : le score
    // du match, lui, la compte.
    if (avecScore) {
      let manque = score - courant;
      while (manque >= 2 && essaisAdverses.some((e) => !e.transforme)) {
        transformer(null);
        courant += 2;
        manque -= 2;
      }
    } else {
      // Feuille sans score courant : faute de mieux, on s'en remet aux noms.
      for (const fait of feuille.faits.filter(
        (f) => f.club === campTraite && f.type === "essai" && f.transformePar,
      )) {
        transformer(fait.transformePar);
        courant += 2;
      }
    }

    // ---- Temps de jeu ------------------------------------------------------
    // Un couperet peut être allé en prolongations : le match dure alors cent
    // minutes et non quatre-vingts (cf. `dureeDuMatch`).
    const duree = dureeDuMatch(feuille, estCouperet(match));
    calculerTempsDeJeu(roster, feuille, campTraite, bilans, ennuis, duree, jour);

    if (ennuis.length > 0) {
      echecs.push(`${etiquette} :\n      ${ennuis.join("\n      ")}`);
      continue;
    }

    // ---- Contrôles ---------------------------------------------------------
    const lignes = [...bilans.entries()];
    const points = lignes.reduce((s, [, b]) => s + b.points, 0);
    const essais = lignes.reduce((s, [, b]) => s + b.tries, 0);
    // Ni les essais de pénalité, ni les essais collectifs, ni les points que
    // la feuille marque « n.a. » n'ont d'auteur : ils ne figurent sur aucune
    // ligne de joueur.
    const attendu =
      score - 7 * essaisDePenalite - 5 * essaisCollectifs - pointsSansAuteur;

    if (points !== attendu) {
      echecs.push(
        `${etiquette} : ${points} points reconstitués pour ${attendu} attendus ` +
          `(${score} au score, ${essaisDePenalite} essai(s) de pénalité)`,
      );
      continue;
    }
    if (essaisCompteur != null && essais + essaisCollectifs !== essaisCompteur) {
      echecs.push(
        `${etiquette} : ${essais + essaisCollectifs} essais reconstitués pour ${essaisCompteur} au compteur`,
      );
      continue;
    }
    // `penaltyTriesOpponent` est nullable et parfois nul : comparer sans le
    // traiter fait passer la ligne en silence.
    if (essaisDePenalite !== (penaltyTries ?? 0)) {
      divergences.push(
        `${etiquette} : ${essaisDePenalite} essai(s) de pénalité selon la LNR, ` +
          `${penaltyTries ?? "aucun compteur"} en base`,
      );
    }

    for (const inference of inferences) divergences.push(`${etiquette} : ${inference}`);

    // **QUAND LA FEUILLE NE PORTE AUCUN CHANGEMENT, ON N'ÉCRIT PAS DE
    // MINUTES.** La LNR n'en publie aucun sur 2005-2006 — les vingt-sept
    // feuilles en donnent zéro, quand celles de 2006-2007 en donnent une
    // douzaine par match. `calculerTempsDeJeu` rend alors 80 minutes à chaque
    // titulaire et `null` à chaque remplaçant, ce qui revient à affirmer
    // qu'aucun remplacement n'a eu lieu de toute la saison. C'est faux, et
    // **rien ne le signalerait** : le total retombe pile sur les 1 200 minutes
    // attendues, puisque c'est exactement 15 × 80.
    //
    // Les réalisations, elles, viennent des faits de match et restent
    // écrites. Le temps de jeu est laissé à `null` des deux côtés — sur cette
    // saison, `minutesPlayed` à `null` se lit « la source ne le dit pas », et
    // non « n'est pas entré en jeu ». Arbitré par Jérémy le 3 septembre 2026.
    const sansTempsDeJeu = feuille.changements.length === 0;
    if (sansTempsDeJeu) {
      for (const [, b] of lignes) {
        b.minutes = null;
        b.subIn = null;
        b.subOut = null;
      }
    }

    const minutes = lignes.reduce((s, [, b]) => s + (b.minutes ?? 0), 0);
    const perduesRouge = lignes.reduce(
      (s, [, b]) => s + (b.rouge != null ? duree - b.rouge : 0),
      0,
    );
    // Un carton que la LNR n'inscrit pas prive quand même l'équipe : le
    // carton orange du championnat, comme le rouge de 20 minutes en coupe
    // d'Europe, la laisse à quatorze pendant vingt minutes avant que le poste
    // ne soit repourvu. Sans ce terme, la correction du 14 juin 2026 serait
    // signalée en anomalie à chaque relance.
    const perduesCarton = (PRIVATIONS_SUR_CARTON[jour] ?? [])
      .filter((x) => x.club === campTraite)
      .reduce((s2, x) => s2 + x.minutes, 0);
    const minutesAttendues = 15 * duree - perduesRouge - perduesCarton;
    const alerte = sansTempsDeJeu
      ? " ⚠ aucun changement publié — temps de jeu non écrit"
      : minutes !== minutesAttendues
        ? ` ⚠ ${minutes}/${minutesAttendues} minutes`
        : "";

    // ---- Écart avec la base --------------------------------------------------
    const modifiees = lignes.filter(([id, b]) => {
      const ligne = roster.find((l) => l.id === id)!;
      return ecarts(ligne.actuel, b).length > 0;
    });
    lignesModifiees += modifiees.length;

    const joueurs = lignes.filter(([, b]) => b.points > 0 || b.jaune != null || b.rouge != null);
    const entres = lignes.filter(([, b]) => b.subIn != null).length;
    console.log(
      `${etiquette} → ${essais} essai(s), ${points} pts, ${entres} entrée(s), ` +
        `${modifiees.length} ligne(s) modifiée(s)${alerte}`,
    );
    for (const [id, b] of joueurs) {
      const ligne = roster.find((l) => l.id === id)!;
      const detail = [
        b.tries ? `${b.tries}E` : null,
        b.conversions ? `${b.conversions}T` : null,
        b.penalties ? `${b.penalties}P` : null,
        b.drops ? `${b.drops}D` : null,
        b.jaune != null ? `🟨${b.jaune}'` : null,
        b.rouge != null ? `🟥${b.rouge}'` : null,
      ]
        .filter(Boolean)
        .join(" ");
      console.log(
        `    ${String(ligne.shirtNumber ?? "").padStart(2)} ${ligne.firstName} ${ligne.lastName} — ${detail} (${b.minutes ?? "?"}')`,
      );
    }
    if (DETAIL) {
      for (const [id, b] of modifiees) {
        const ligne = roster.find((l) => l.id === id)!;
        console.log(
          `    ~ ${String(ligne.shirtNumber ?? "").padStart(2)} ${ligne.firstName} ${ligne.lastName} : ` +
            ecarts(ligne.actuel, b).join(", "),
        );
      }
    }

    if (DRY_RUN) {
      traites++;
      continue;
    }

    // ---- Écriture -----------------------------------------------------------
    for (const [id, b] of lignes) {
      await prisma.matchPlayer.update({
        where: { id },
        data: {
          minutesPlayed: b.minutes,
          subIn: b.subIn,
          subOut: b.subOut,
          tries: b.tries,
          conversions: b.conversions,
          penalties: b.penalties,
          dropGoals: b.drops,
          totalPoints: b.points,
          yellowCard: b.jaune != null,
          yellowCardMin: b.jaune,
          redCard: b.rouge != null,
          redCardMin: b.rouge,
        },
      });
    }

    const verif = await prisma.matchPlayer.aggregate({
      where: { matchId: match.id, isOpponent: cible === "adverse" },
      _sum: { totalPoints: true },
    });
    if ((verif._sum.totalPoints ?? 0) !== attendu) {
      throw new Error(`${etiquette} : ${verif._sum.totalPoints} points écrits pour ${attendu}`);
    }
    traites++;
  }

  console.log(
    `\n=== ${traites} match(s) ${DRY_RUN ? "prêts" : "écrits"}, ` +
      `${lignesModifiees} ligne(s) ${DRY_RUN ? "à modifier" : "modifiées"}, ` +
      `${horsPerimetre.length} hors périmètre, ${echecs.length} en échec ===`,
  );
  for (const h of horsPerimetre) console.log(`  — ${h}`);
  for (const d of divergences) console.log(`  ⚠ ${d}`);
  for (const e of echecs) console.log(`  ⚠ ${e}`);
  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
}

// Le camp adverse d'abord, le camp catalan seulement sur demande : c'est lui
// qui a le plus souvent des minutes déjà saisies par d'anciens scripts.
(async () => {
  await main("adverse");
  if (AVEC_USAP) await main("usap");
})()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

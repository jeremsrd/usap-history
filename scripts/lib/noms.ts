/**
 * Rapprochement des noms de joueurs entre une source et la base.
 *
 * Aucune source n'écrit un nom comme la précédente, et la base porte encore
 * les choix d'imports successifs. Les écarts rencontrés, tous réels :
 *
 *   accents et casse        « Bécognée » / « BECOGNEE »
 *   ponctuation             « Guerois-Galisson » / « Guerois Galisson »
 *   nom composé tronqué     « Priso » pour Priso Mouangue
 *   coupure différente      la LNR écrit « Levani Botia | VEIVUKE », la base
 *                           « Levani | Botia » — le nom de famille de l'un est
 *                           le prénom de l'autre
 *   second prénom ajouté    « Komiti Junior Alainuuese » / « Komiti Alainu'uese »
 *   diminutif               « Billy » pour Viliami Vunipola, « Harry » pour
 *                           Harrison Plummer, « Tom » pour Thomas Staniforth
 *
 * D'où la règle : comparer les **noms complets** mot à mot, jamais le seul nom
 * de famille, et accepter qu'un mot en abrège un autre.
 */

/** Sans accent, sans casse, sans ponctuation. */
export function normalize(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

/**
 * Mots significatifs d'un nom. On coupe sur les espaces et les traits d'union,
 * jamais sur l'apostrophe : « Alainu'uese » et « Ma'afu » sont d'un seul
 * tenant. Les mots de moins de trois lettres (« le », « de », « van ») sont
 * écartés, trop communs pour identifier quiconque.
 */
export function mots(nom: string): string[] {
  return nom
    .split(/[\s-]+/)
    .map(normalize)
    .filter((mot) => mot.length >= 3);
}

/**
 * Noms d'usage : deux mots sans rien de commun qui désignent la même personne.
 *
 * Le seul cas qui ne relève ni de l'accent, ni de l'abréviation, ni de la
 * coupure — un patronyme de rechange, ou un prénom d'usage que rien ne relie
 * à l'état civil. La table est **vérifiée à la main**, jamais devinée : y
 * ajouter une paire, c'est affirmer que ce sont deux noms d'un même homme.
 *
 * Waisea Nayacalevu Vuidravuwalu : la LNR l'inscrit sous Vuidravuwalu, la base
 * le porte sous Nayacalevu, comme la presse française.
 *
 * Les deux paires de prénoms viennent de 2018-2019, où la base et la LNR se
 * sont trouvées à nommer deux fois le même homme :
 *   - « Paddy » / « Patrick » : l'ouvreur de l'USAP cette saison-là, que la
 *     LNR inscrit « David Patrick JACKSON » et que la base porte, comme tout
 *     le monde, sous Paddy Jackson ;
 *   - « Richie » / « Richard » : le deuxième ligne écossais de Toulouse,
 *     « Richard GRAY » sur la feuille du 25 mai 2019, Richie Gray en base
 *     depuis ses deux feuilles avec Glasgow. La même paire a aussitôt révélé
 *     un doublon voisin — Richie Arnold et Richard Tamanui Arnold, une seule
 *     et même deuxième ligne de Toulouse, que la LNR inscrit toujours sous son
 *     état civil ; fusionnés le 30 août 2026. Son jumeau Rory figure sur la
 *     feuille du 5 février 2022 à côté de lui, et reste une fiche à part.
 *
 * N'y entrent que les paires dont dépend l'**arbitrage d'identité**. Une
 * abréviation vraie se passe de la table, le préfixe suffisant : « Nafi »
 * couvre « Nafitalai ». Mais attention à ne pas croire le préfixe plus large
 * qu'il n'est — « Thomas » ne commence pas par « Tom », ni « Joseph » par
 * « Joe », ni « Nicholas » par « Nick » : ces diminutifs-là ne sont **pas**
 * couverts, et ce fichier a longtemps affirmé le contraire.
 *
 * Les y ajouter serait pourtant une faute : `memeMot` sert à `joueurs.ts`,
 * `seed-opponent-sheet.ts` et `sync-effectif.ts`, et rendre équivalents des
 * prénoms aussi répandus rouvrirait l'accident Kane Douglas / Wesley Douglas.
 * Quand l'écart n'est qu'un **nom d'affichage** à reconnaître — ce que fait
 * l'audit des compositions —, c'est `VARIANTES_DAFFICHAGE` de
 * `audit-opponent-lineups.ts` qu'il faut compléter : elle apparie des noms
 * complets deux à deux, sans toucher au rapprochement des mots.
 */
const NOMS_DUSAGE: string[][] = [
  ["nayacalevu", "vuidravuwalu"],
  ["paddy", "patrick"],
  ["richie", "richard"],
  // « Manny » pour Manuel Edmonds, l'ouvreur catalan de 2010-2011, tel
  // qu'ESPN l'écrit sur ses huit feuilles européennes : « manny » n'est pas
  // un préfixe de « manuel », et la fiche porte l'état civil.
  ["manny", "manuel"],
  // « Rudi » pour Rudolf Coetzee, centre catalan de 2011-2012, chez ESPN.
  ["rudi", "rudolf"],
  // « Sona » pour Faka'anaua Ki Alisona Taumalolo, pilier catalan de 2013-2014,
  // chez ESPN : la fin d'un prénom, non son début.
  ["sona", "alisona"],
  // « Tima » pour Lotima Faingaanuku, ailier catalan de 2018-2019, chez ESPN.
  ["tima", "lotima"],
  // ESPN écrit « Boutemane » pour Yassin Boutemmani, pilier catalan de 2013 à
  // 2021, 69 feuilles LNR en base : une faute de la source, pas un nom
  // d'usage — mais le remède est le même, faute de quoi chaque campagne
  // européenne lui refabriquerait une fiche.
  ["boutemane", "boutemmani"],
  // L'ERC écrit « Yoann » Vivalda, deuxième ligne catalan, que la LNR donne
  // « Yohan » : deux lettres d'écart, une de trop pour la règle.
  ["yoann", "yohan"],
];

/**
 * Variantes d'affichage vérifiées à la main : la base porte le nom d'usage,
 * la feuille officielle l'état civil, et ce sont bien deux écritures du même
 * homme.
 *
 * **Pourquoi une table à part**, et non deux lignes dans `NOMS_DUSAGE` : cette table-là nourrit `memeMot`, dont
 * dépendent `joueurs.ts` pour créer ou retrouver une fiche,
 * `seed-opponent-sheet.ts` pour apparier une composition et `sync-effectif.ts`.
 * Y déclarer « tom = thomas », « joe = joseph » ou « nick = nicholas », c'est
 * rendre équivalents des prénoms parmi les plus répandus du rugby et rouvrir
 * l'accident Kane Douglas / Wesley Douglas. Ici on ne rapproche pas deux
 * **mots**, on reconnaît deux **noms complets** appariés : « Tom Staniforth »
 * ne vaut que pour « Thomas Staniforth », et aucun autre Tom ne s'en trouve
 * rapproché d'aucun autre Thomas. L'arbitrage d'identité n'est pas touché.
 *
 * **Pourquoi elle est nécessaire.** Sans elle le compteur d'ÉCRITURE n'est
 * plus un signal : la fusion des dix doublons du 30 août 2026 l'a fait passer
 * de 21 à 31, non parce que la base se dégradait, mais parce qu'un homme
 * réuni sous son nom d'usage diverge désormais de la LNR sur chacune de ses
 * feuilles. Un audit dont on apprend à ignorer le total ne garde plus rien —
 * c'est ainsi que 22 faux hommes ont vécu en ÉCRITURE jusqu'au 30 août.
 *
 * **Ce qu'on affirme en y ajoutant une ligne** : que ces deux noms désignent
 * la même personne, feuille officielle sous les yeux. Rien n'est deviné, et
 * rien n'est caché : le total des variantes tues figure au récapitulatif de
 * l'audit, et `--variantes` les affiche une à une.
 *
 * **ELLE VIT ICI, ET NON PLUS DANS L'AUDIT, DEPUIS LE 14 SEPTEMBRE 2026**,
 * parce que l'audit constate quand `joueurs.ts` crée. Tant qu'elle n'était
 * lue que par l'audit, chaque feuille de Castres allait recréer « Thomas
 * Staniforth » à côté de « Tom Staniforth » — le doublon fusionné le
 * 30 août —, l'audit le tenant ensuite pour conforme puisque c'est le nom
 * que la feuille écrit, et seul `detect-duplicate-players.ts` le sortant
 * après coup. Vu sur la première feuille venue, la J2 de 2026-2027.
 * `chercherJoueur` la consulte donc juste après le nom exact : un nom
 * officiel qui figure en colonne `feuille` désigne la fiche nommée en
 * colonne `base`, et rien d'autre — le rapprochement des mots n'est
 * toujours pas touché.
 */
export const VARIANTES_DAFFICHAGE: [base: string, feuille: string][] = [
  // Prénom d'usage en base, état civil sur la feuille.
  ["Tom Staniforth", "Thomas Staniforth"],
  ["Tom Willis", "Thomas Daniel Willis"],
  ["Joe Powell", "Joseph Patrick Powell"],
  ["Harry Plummer", "Harrison Plummer"],
  ["Sammy Arnold", "Samuel Arnold"],
  ["Billy Vunipola", "Viliami Vunipola"],
  ["Cobus Reinach", "Jacobus Meyer Reinach"],
  ["Nacho Brex", "Juan Ignacio Brex"],
  ["Nick Champion de Crespigny", "Richard Nicholas Champion De Crespigny"],
  // Les quatre Toulonnais du quart de finale de Heineken Cup 2011, qu'ESPN
  // écrit sous leur nom d'usage : les fiches, nées des feuilles LNR sous
  // l'état civil, ont été fusionnées sous ce nom-là le 5 septembre 2026.
  ["Jonny Wilkinson", "Jonathan Wilkinson"],
  ["Joe Van Niekerk", "Johann Van Niekerk"],
  ["Rudi Wulf", "Rudolffe Wulf"],
  ["Gaby Lovobalavu", "Gabiriele Lovobalavu"],
  // Fusionné le 6 septembre 2026 sur arbitrage de Jérémy : Grenoble puis
  // Stade Français, jamais sur une même feuille, même n°6.
  ["Tanginoa Halaifonua", "Tanginoa Palu Halaifonua"],
  // Le prénom d'usage reprend la fin du patronyme, que la feuille répète.
  ["Tolu Latu", "Latu Silatolu Latu"],
  // La LNR ampute l'apostrophe et coupe le nom ailleurs.
  ["Marvin O'Connor", "Marvin O Connor"],
  ["Ma'a Nonu", "Ma A Allan Nonu"],
  // Orthographe : la feuille perd le « h ».
  ["Sikhumbuzo Notshe", "Sikumbuzo Notshe"],
  // Apparues le 30 août 2026, quand l'audit a enfin vu les saisons de Pro D2.
  // La LNR écrit le même talonneur « Cyriel » à Dax en 2017-2018 et « Cyril »
  // à Vannes ensuite ; une seule fiche, un seul Blanchard par feuille.
  ["Cyril Blanchard", "Cyriel Blanchard"],
  ["Eddie Sawailau", "Edward Dratai Sawailau"],
  ["Napolioni Nalaga", "Naipolioni Vonowale Nalaga"],
  // Apparues avec 2004-2005, et **la source se contredit elle-même dans les
  // deux cas**. Thibaut Privat, deuxième ligne de Clermont puis de
  // Montpellier, porte dix-huit feuilles en base ; la LNR l'écrit « Thibault »
  // sur celle du 19 février 2005 et « Thibaut » partout ailleurs. Yohann
  // Authier, lui, est « Yohann » à Grenoble le 21 mai 2005 et « Johann » à
  // Oyonnax le 12 avril 2014 — neuf ans, deux clubs, un seul homme, deux
  // orthographes officielles.
  ["Thibaut Privat", "Thibault Privat"],
  ["Johann Authier", "Yohann Authier"],
];

/** La fiche que désigne un nom officiel, d'après `VARIANTES_DAFFICHAGE` ; `null` si aucune ligne ne le porte. */
export function nomEnBasePour(nomOfficiel: string): string | null {
  const cle = normalize(nomOfficiel);
  const ligne = VARIANTES_DAFFICHAGE.find(([, feuille]) => normalize(feuille) === cle);
  return ligne ? ligne[0] : null;
}

/**
 * Un mot en vaut un autre s'il en est le début — « Nafi » pour « Nafitalai » —
 * ou s'il en est le nom d'usage déclaré.
 */
export function memeMot(a: string, b: string): boolean {
  if (a === b || a.startsWith(b) || b.startsWith(a)) return true;
  return NOMS_DUSAGE.some((noms) => noms.includes(a) && noms.includes(b));
}

/** Mots de `nom` sans correspondant dans `reference`. */
export function motsOrphelins(nom: string, reference: string): string[] {
  const cibles = mots(reference);
  return mots(nom).filter((mot) => !cibles.some((cible) => memeMot(mot, cible)));
}

/**
 * Particules de nom, qui ne désignent personne. `mots()` écarte déjà ce qui
 * fait moins de trois lettres — « le », « de » —, mais « van » et « der » en
 * font exactement trois : sans cette liste, « Van Der Mescht », « Van Der
 * Westhuizen » et « Van Der Merwe » se valent tous, et trois Sud-Africains
 * sans rapport deviennent candidats l'un pour l'autre.
 *
 * Elles vivaient dans `joueurs.ts`, qui rapproche un nom de feuille d'une
 * fiche ; elles sont ici parce que **tout** rapprochement de noms en a
 * besoin. L'appariement de l'effectif ne les avait pas, et il tenait de ce
 * fait « Jacobus Van Tonder » pour un candidat possible de « Martinus
 * Jacobus Van Der Heever » — deux hommes que seul « Van » rapproche.
 */
const PARTICULES = new Set([
  "van", "der", "den", "von", "dos", "das", "del", "della", "ter", "vander",
]);

/** Mots d'un nom qui identifient réellement quelqu'un. */
export function motsUtiles(nom: string): string[] {
  const utiles = mots(nom).filter((mot) => !PARTICULES.has(mot));
  // Un nom fait entièrement de particules n'existe pas, mais on ne rend pas
  // une liste vide : elle ferait correspondre n'importe qui à n'importe qui.
  return utiles.length > 0 ? utiles : mots(nom);
}

/**
 * Nombre de mots communs, et longueur du plus long d'entre eux.
 *
 * Un mot de `b` ne sert qu'une fois : sans cela, un nom court les attire tous.
 * « Clement RIC », talonneur de Lyon, s'est ainsi retrouvé enregistré sous
 * Ricky Riccitelli le 13 avril 2019 — « Ricky » et « Riccitelli » comptaient
 * l'un et l'autre comme communs avec le seul « Ric », dont ils sont tous deux
 * le prolongement, et les deux mots communs exigés étaient réunis par un seul
 * mot de la feuille.
 */
export function proximite(
  a: string,
  b: string,
): { communs: number; plusLong: number } {
  const x = mots(a);
  const y = mots(b);
  const pris = new Set<number>();
  let communs = 0;
  let plusLong = 0;
  for (const mot of x) {
    const index = y.findIndex((autre, i) => !pris.has(i) && memeMot(mot, autre));
    if (index === -1) continue;
    pris.add(index);
    communs++;
    plusLong = Math.max(plusLong, Math.min(mot.length, y[index].length));
  }
  return { communs, plusLong };
}

/**
 * Assez proches pour être la même personne ? Deux mots communs suffisent ; un
 * seul aussi, s'il est assez long — les diminutifs sont légion sur les
 * feuilles officielles, et seul le nom de famille relie alors les deux
 * écritures.
 */
export function memeJoueur(a: string, b: string): boolean {
  // Deux noms identiques à l'accent près : inutile d'aller plus loin. Ce
  // raccourci rattrape les noms trop courts pour la règle des mots — « Ali
  // Oz » n'a qu'un mot d'au moins trois lettres, son prénom.
  if (normalize(a) === normalize(b)) return true;
  const { communs, plusLong } = proximite(a, b);
  return communs >= 2 || (communs >= 1 && plusLong >= 4);
}

/**
 * Meilleur candidat d'une liste, ou `null`. Le dossard départage : deux frères
 * peuvent figurer sur la même feuille.
 */
export function meilleurCandidat<T>(
  candidats: T[],
  nomDe: (candidat: T) => string,
  numeroDe: (candidat: T) => number | null,
  nomCherche: string,
  numeroCherche: number,
): T | null {
  let meilleur: T | null = null;
  let note = 0;
  for (const candidat of candidats) {
    const nom = nomDe(candidat);
    if (!memeJoueur(nom, nomCherche)) continue;
    const { communs, plusLong } = proximite(nom, nomCherche);
    const valeur =
      communs * 10 + plusLong + (numeroDe(candidat) === numeroCherche ? 5 : 0);
    if (valeur > note) {
      note = valeur;
      meilleur = candidat;
    }
  }
  return meilleur;
}

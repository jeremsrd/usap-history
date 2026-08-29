/**
 * Du nom de club des sources officielles à celui porté en base.
 *
 * La LNR désigne chaque club par un segment d'URL — `bordeaux-begles`,
 * `paris` —, l'EPCR par son nom complet. La base, elle, a ses propres noms
 * courts. Une table explicite vaut mieux qu'un rapprochement approximatif :
 * « paris » ne ressemble pas à « Stade Français », et se tromper de club est
 * la faute qu'aucun contrôle de points ne rattrape.
 *
 * À compléter au fil des saisons reprises, avec les clubs que l'USAP croise.
 */
export const CLUBS_LNR: Record<string, string> = {
  bayonne: "Bayonne",
  biarritz: "Biarritz",
  "bordeaux-begles": "UBB",
  brive: "Brive",
  castres: "Castres",
  clermont: "Clermont",
  grenoble: "Grenoble",
  "la-rochelle": "La Rochelle",
  lyon: "Lyon",
  "mont-de-marsan": "Mont-de-Marsan",
  montauban: "Montauban",
  montpellier: "Montpellier",
  oyonnax: "Oyonnax",
  paris: "Stade Français",
  "provence-rugby": "Provence",
  // Clubs de Pro D2 croisés en 2020-2021.
  angouleme: "Angoulême",
  aurillac: "Aurillac",
  beziers: "Béziers",
  carcassonne: "Carcassonne",
  colomiers: "Colomiers",
  nevers: "Nevers",
  rouen: "Rouen",
  "valence-romans": "Valence-Romans",
  pau: "Pau",
  // L'USAP elle-même, pour récupérer son écusson à la source.
  perpignan: "Perpignan",
  "racing-92": "Racing 92",
  toulon: "Toulon",
  toulouse: "Toulouse",
  vannes: "Vannes",
};

/** Idem pour les coupes d'Europe, où l'EPCR donne le nom complet. */
export const CLUBS_EPCR: Record<string, string> = {
  "Benetton Rugby": "Benetton",
  "Bristol Bears": "Bristol",
  "Cardiff Rugby": "Cardiff",
  "Connacht Rugby": "Connacht",
  "Dragons RFC": "Dragons",
  "Emirates Lions": "Lions",
  "Fidelity SecureDrive Lions": "Lions",
  "Glasgow Warriors": "Glasgow",
  "Gloucester Rugby": "Gloucester",
  "Lyon O.U.": "Lyon",
  Montpellier: "Montpellier",
  "Newcastle Falcons": "Newcastle",
  "Newcastle Red Bulls": "Newcastle",
  Ospreys: "Ospreys",
  "Racing 92": "Racing 92",
  "Toyota Cheetahs": "Cheetahs",
  "Zebre Parma": "Zebre",
  "Toyota Cheetahs ": "Cheetahs",
};

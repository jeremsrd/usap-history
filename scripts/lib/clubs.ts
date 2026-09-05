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
  agen: "Agen",
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
  // Clubs de Pro D2 croisés en 2017-2018, et pas depuis.
  dax: "Dax",
  // Clubs de Pro D2 croisés en 2016-2017, et pas depuis. La LNR ne leur
  // connaît plus que ce nom court : leurs pages de club ont disparu avec eux.
  albi: "Albi",
  bourgoin: "Bourgoin",
  // Croisé en 2007-2008 seulement : le FC Auch Gers, monté cette saison-là et
  // redescendu aussitôt, a disparu du Top 14 et de la LNR avec lui. Même cas
  // qu'Albi et Bourgoin — il ne lui reste que ce nom court.
  auch: "Auch",
  // Croisé en 2015-2016, et pas depuis. Même cas que les deux précédents : la
  // LNR ne lui connaît plus que ce nom court.
  tarbes: "Tarbes",
  massy: "Massy",
  narbonne: "Narbonne",
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
  "Exeter Chiefs": "Exeter",
  "Fidelity SecureDrive Lions": "Lions",
  "Glasgow Warriors": "Glasgow",
  "Gloucester Rugby": "Gloucester",
  "Leicester Tigers": "Leicester",
  "Lyon O.U.": "Lyon",
  Montpellier: "Montpellier",
  "Munster Rugby": "Munster",
  "Newcastle Falcons": "Newcastle",
  "Newcastle Red Bulls": "Newcastle",
  "Northampton Saints": "Northampton",
  Ospreys: "Ospreys",
  "Racing 92": "Racing 92",
  Scarlets: "Scarlets",
  "Toyota Cheetahs": "Cheetahs",
  "Ulster Rugby": "Ulster",
  "Zebre Parma": "Zebre",
  "Toyota Cheetahs ": "Cheetahs",
};

/**
 * Idem pour ESPN, qui nomme les clubs à sa façon — « Benetton Treviso » là
 * où l'EPCR écrit « Benetton Rugby ». Ne sert qu'aux coupes d'Europe d'avant
 * 2020-2021, cf. `lib/espn.ts`. L'USAP y est reconnue par son identifiant,
 * pas par son nom.
 */
export const CLUBS_ESPN: Record<string, string> = {
  "Benetton Treviso": "Benetton",
  "Cavalieri Prato": "Cavalieri Prato",
  Dragons: "Dragons",
  "Exeter Chiefs": "Exeter",
  "Leicester Tigers": "Leicester",
  Munster: "Munster",
  "Northampton Saints": "Northampton",
  Ospreys: "Ospreys",
  Scarlets: "Scarlets",
  Toulon: "Toulon",
};

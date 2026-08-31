/**
 * Où un club recevait, à une saison donnée.
 *
 * LE LIEU D'UN DÉPLACEMENT SE DÉDUISAIT DU SEUL `Opponent.venueId`, qui ne
 * porte qu'un terrain — celui d'aujourd'hui — et ignore le temps. La déduction
 * vieillit donc mal : le Racing 92 y est au Paris La Défense Arena, ouvert en
 * 2017, alors qu'il recevait à Colombes en 2013 ; le Stade Français à
 * Jean-Bouin, alors en reconstruction, quand il jouait à Charléty.
 *
 * `OpponentVenue` dit où le club recevait avant. Ce module en fait la lecture,
 * et c'est le **seul endroit** où la règle est écrite — les scripts de saison
 * et `fix-match-venues.ts` l'appellent tous, comme ils appellent
 * `generateVenueSlug` pour les slugs.
 *
 * TROIS CHOSES À SAVOIR AVANT DE S'EN SERVIR.
 *
 * 1. **La saison est donnée par son année de début**, 2012 pour 2012-2013, et
 *    elle vient de `Season.startYear` — jamais d'une déduction sur le mois du
 *    match, qui se tromperait sur les rencontres de janvier.
 * 2. **Un club sans historique retombe sur `venueId`**, et c'est le cas
 *    général : sur les quarante-trois clubs que l'USAP a visités, trois
 *    seulement ont déménagé pendant la période couverte.
 * 3. **Une délocalisation ponctuelle ne relève pas d'ici.** L'UBB a reçu
 *    l'USAP à Chaban-Delmas en août 2012 et en mars 2014 alors que son terrain
 *    d'alors était André-Moga : c'est le match qui porte le lieu, pas le club.
 *    `TERRAINS_PARTICULIERS` recense ces cas, et prime sur tout le reste.
 */

import type { PrismaClient } from "@prisma/client";

/**
 * Rencontres jouées ailleurs que sur le terrain habituel des deux clubs.
 *
 * Finale sur terrain neutre, délocalisation, match d'ouverture au Stade de
 * France : le lieu ne se déduit alors d'aucune règle, et se pose ici par sa
 * date. `null` vaut « ailleurs, stade inconnu » — mieux qu'un lieu faux.
 *
 * Chaque ligne porte sa source en commentaire. Rien ici n'est déductible :
 * ni la LNR ni l'EPCR ne donnent le stade d'une rencontre.
 */
export const TERRAINS_PARTICULIERS: Record<string, string | null> = {
  // Finale de Pro D2 2018, Perpignan-Grenoble. Source : Jérémy, présent au
  // stade. La feuille de la LNR désigne un recevant et ne nomme aucun lieu.
  "2018-05-06": "Stade Ernest-Wallon",
  // **L'UBB a eu deux terrains à la fois**, et non l'un après l'autre : il a
  // reçu au stade André-Moga de Bègles et à Chaban-Delmas la même saison,
  // jusqu'à son installation définitive à Chaban en 2015. Ce n'est donc pas
  // un déménagement — rien à mettre dans `OpponentVenue` — mais un fait par
  // match, et il faut le vérifier match par match.
  //
  // Les trois réceptions de l'USAP d'avant 2015, d'après les fiches d'ESPN,
  // dont le score concorde chaque fois avec celui de la LNR :
  //   12 mai 2012, 37-29 : André-Moga — le seul qui s'écarte du terrain
  //                        d'aujourd'hui, d'où sa présence ici ;
  //   24 août 2012, 26-22 : Chaban-Delmas ;
  //   29 mars 2014, 23-5  : Chaban-Delmas.
  "2012-05-12": "Stade André-Moga",
  // **Les phases finales du Top 14 se jouent sur terrain neutre**, et la
  // feuille de la LNR désigne pourtant un recevant — « perpignan-toulouse »,
  // « perpignan-clermont ». La déduction par le camp y est donc fausse, comme
  // pour la finale de Pro D2 2018.
  //
  // Demi-finale du 14 mai 2010, Perpignan 21-13 Toulouse, au stade de la
  // Mosson de Montpellier devant 32 204 spectateurs ; finale du 29 mai 2010,
  // Perpignan 6-19 Clermont, au Stade de France devant 79 262. Source :
  // Wikipédia, qui donne le stade et l'affluence de chacune — aucune source
  // officielle ne publie le lieu d'une rencontre.
  "2010-05-14": "Stade de la Mosson",
  "2010-05-29": "Stade de France",
  // Demi-finale du 30 mai 2009, Perpignan 25-21 Stade Français, au stade de
  // Gerland de Lyon ; finale du 6 juin 2009, Perpignan 22-13 Clermont, au
  // Stade de France. Source : Wikipédia. Gerland est en base sous son nom
  // d'aujourd'hui, « Matmut Stadium de Gerland » — c'est le même terrain,
  // rebaptisé quand le LOU s'y est installé en 2017, comme Pierre-Antoine est
  // devenu Pierre-Fabre à Castres.
  "2009-05-30": "Matmut Stadium de Gerland",
  "2009-06-06": "Stade de France",
};

/** Stade de l'USAP, seul terrain qu'elle ait connu sur la période couverte. */
export const TERRAIN_USAP = "Stade Aimé-Giral";

/**
 * Identifiant du stade où se joue une rencontre, ou `null` si on l'ignore.
 *
 * @param startYear année de début de la saison (2012 pour 2012-2013)
 * @param jour      date du match au format `AAAA-MM-JJ`
 */
export async function terrainDuMatch(
  prisma: PrismaClient,
  opts: { opponentId: string; isHome: boolean; startYear: number; jour: string },
): Promise<string | null> {
  // Un lieu particulier prime sur toute déduction, y compris à domicile.
  if (opts.jour in TERRAINS_PARTICULIERS) {
    const nom = TERRAINS_PARTICULIERS[opts.jour];
    if (nom == null) return null;
    const v = await prisma.venue.findFirst({ where: { name: nom }, select: { id: true } });
    return v?.id ?? null;
  }

  if (opts.isHome) {
    const v = await prisma.venue.findFirst({
      where: { name: TERRAIN_USAP },
      select: { id: true },
    });
    return v?.id ?? null;
  }

  // Le terrain d'alors s'il est connu, celui d'aujourd'hui sinon.
  const ancien = await prisma.opponentVenue.findFirst({
    where: {
      opponentId: opts.opponentId,
      OR: [{ fromSeason: null }, { fromSeason: { lte: opts.startYear } }],
      AND: [{ OR: [{ untilSeason: null }, { untilSeason: { gte: opts.startYear } }] }],
    },
    orderBy: { fromSeason: "desc" },
    select: { venueId: true },
  });
  if (ancien) return ancien.venueId;

  const club = await prisma.opponent.findUnique({
    where: { id: opts.opponentId },
    select: { venueId: true },
  });
  return club?.venueId ?? null;
}

/**
 * Écrit l'historique des terrains : où chaque club recevait avant son stade
 * d'aujourd'hui.
 *
 * POURQUOI. `Opponent.venueId` ne porte qu'un terrain, celui d'aujourd'hui, et
 * la déduction du lieu d'un déplacement s'en trouve fausse dès qu'on remonte.
 * Cinq clubs sont concernés sur les quarante-trois que l'USAP a visités, et
 * huit matchs en tout :
 *
 * | Match | En base avant | En réalité |
 * |---|---|---|
 * | Racing 92, 23 mars 2013 | Paris La Défense Arena | Colombes |
 * | Racing 92, 8 septembre 2013 | Paris La Défense Arena | Colombes |
 * | Stade Français, 22 septembre 2012 | Jean-Bouin | Charléty |
 * | Stade Français, 4 mars 2005, 11 mars 2006, 8 mars 2008 | Charléty | Jean-Bouin |
 * | Lyon, 31 mars 2016 | Gerland | Matmut Stadium (Vénissieux) |
 * | Grenoble, 26 novembre 2004 | Stade des Alpes | Lesdiguières |
 * | Montpellier, 9 avril 2005, 12 novembre 2005, 11 novembre 2006 | GGL Stadium | Sabathé |
 *
 * Les quatre derniers ont été vus le 17 octobre 2026 en reprenant 2003-2004 :
 * le calendrier de l'ancienne LNR y nomme « Lesdiguières » et « Sabathé » là
 * où la base déduisait deux stades qui n'existaient pas encore. Ils sont
 * appliqués par `fix-stades-sabathe-lesdiguieres.ts`, `fix-match-venues.ts`
 * ne complétant que les matchs sans lieu.
 *
 * LES SOURCES, ET CE QU'ELLES VALENT. Aucune n'est officielle au sens du
 * projet : ni la LNR ni l'EPCR ne donnent le stade d'une rencontre, et le
 * calendrier de la LNR ne porte aucun champ de lieu — vérifié. Ce sont donc
 * des sources de presse et Wikipédia, au même titre que l'Albert-Domec de
 * Carcassonne ou le Maurice-Trélut de Tarbes, déjà en base à ce compte.
 *
 * Le détail figure sur chaque ligne du tableau `HISTORIQUE`.
 *
 * **UNE PÉRIODE A DEUX BORNES.** La ligne de Charléty a d'abord été écrite
 * sans début — « jusqu'en 2012-2013 » —, alors que sa source dit « de
 * 2010-2011 à 2012-2013 » : tous les déplacements d'avant 2010 tombaient à
 * Charléty. Vu le 17 octobre 2026 en reprenant 2002-2003, dont le calendrier
 * de l'ancienne LNR nomme « Jean Bouin ». `from` porte désormais le début, et
 * une ligne déjà écrite est remise à ses bornes. Les matchs sont corrigés par
 * `fix-stades-stade-francais.ts`.
 *
 * CE QUI N'EST PAS ICI, ET POURQUOI BORDEAUX N'Y EST PAS. L'UBB a eu **deux
 * terrains à la fois** jusqu'en 2015, et non l'un après l'autre : il recevait
 * au stade André-Moga de Bègles et à Chaban-Delmas la même saison, au gré de
 * l'affiche. Ce n'est donc pas un déménagement, et aucune période ne le
 * décrit — c'est un fait par match, à vérifier un par un. Ses trois réceptions
 * de l'USAP d'avant 2015 sont dans `TERRAINS_PARTICULIERS` quand elles
 * s'écartent du terrain d'aujourd'hui. Le stade Moga est créé ici pour
 * qu'elles aient où pointer.
 *
 * Deux clubs ont **changé de nom de stade sans déménager** : Castres
 * (Pierre-Antoine, puis Pierre-Fabre) et Béziers (la Méditerranée, puis
 * Raoul-Barrière) n'ont rien à faire ici. Montpellier, lui, a les deux : son
 * stade d'aujourd'hui a été Yves-du-Manoir, puis Altrad Stadium, puis GGL
 * Stadium — un seul terrain, ouvert en 2007 —, mais il recevait **avant** à
 * Sabathé, et c'est un déménagement.
 *
 * Usage :
 *   npx tsx scripts/seed-stades-historiques.ts --dry
 *   npx tsx scripts/seed-stades-historiques.ts
 *
 * Idempotent : les stades et les lignes d'historique déjà écrits ne sont pas
 * recréés. Relancer ensuite `fix-match-venues.ts` pour appliquer aux matchs.
 */

import { PrismaClient } from "@prisma/client";
import { generateVenueSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry");

/** Stades d'alors que la base ne connaît pas encore. */
const STADES_A_CREER = [
  {
    nom: "Stade Olympique Yves-du-Manoir",
    ville: "Colombes",
    pays: "FR",
    notes:
      "Terrain du Racing jusqu'à l'ouverture de Paris La Défense Arena, " +
      "inaugurée pour le rugby le 23 décembre 2017 face au Stade Toulousain.",
  },
  {
    nom: "Stade Sébastien-Charléty",
    ville: "Paris",
    pays: "FR",
    notes:
      "Domicile provisoire du Stade Français de 2010-2011 à 2012-2013, " +
      "pendant la reconstruction de Jean-Bouin, rouvert le 30 août 2013.",
  },
  {
    // Sans ligne d'historique : l'UBB a joué à Moga **et** à Chaban-Delmas la
    // même saison, ce n'est pas un déménagement. Le match concerné est dans
    // `TERRAINS_PARTICULIERS` (cf. lib/stades.ts).
    nom: "Stade André-Moga",
    ville: "Bègles",
    pays: "FR",
    notes:
      "Terrain de l'Union Bordeaux-Bègles jusqu'en 2015, en alternance avec " +
      "Chaban-Delmas ; dernier match officiel le 9 mai 2015 contre Oyonnax.",
  },
  {
    // Sans ligne d'historique non plus : c'est un terrain neutre, celui de la
    // demi-finale du 14 mai 2010, et non le stade d'un club. Il est créé ici
    // pour que `TERRAINS_PARTICULIERS` ait où pointer.
    nom: "Stade de la Mosson",
    ville: "Montpellier",
    pays: "FR",
    notes:
      "Terrain neutre de la demi-finale du Top 14 du 14 mai 2010, " +
      "Perpignan 21-13 Toulouse, devant 32 204 spectateurs.",
  },
  {
    nom: "Matmut Stadium",
    ville: "Vénissieux",
    pays: "FR",
    notes:
      "Terrain du LOU de 2011 à 2016-2017, avant le Matmut Stadium de Gerland, " +
      "occupé à partir de la saison 2017-2018.",
  },
  {
    nom: "Stade Lesdiguières",
    ville: "Grenoble",
    pays: "FR",
    notes:
      "Terrain du FC Grenoble de 1921 à 2014, ouvert en 1911 ; le club reçoit " +
      "au Stade des Alpes depuis 2014, et y jouait certaines affiches depuis 2011.",
  },
  {
    nom: "Stade Sabathé",
    ville: "Montpellier",
    pays: "FR",
    notes:
      "Terrain du rugby à XV montpelliérain jusqu'en 2006-2007, inauguré le " +
      "11 novembre 1930 ; dernier match du MHR en Top 14 contre Biarritz, 39-29.",
  },
];

/**
 * Où chaque club recevait avant son terrain d'aujourd'hui.
 *
 * Les bornes sont des **années de début de saison** : 2012 pour 2012-2013.
 * `until` est la dernière saison où le club recevait là, incluse.
 */
const HISTORIQUE: Array<{ club: string; stade: string; from?: number; until: number; source: string }> = [
  {
    club: "Racing 92",
    stade: "Stade Olympique Yves-du-Manoir",
    until: 2016,
    source:
      "Paris La Défense Arena a été inaugurée pour le rugby le 23 décembre 2017, " +
      "Racing 92 - Stade Toulousain ; le Racing recevait à Colombes auparavant. " +
      "Le match du 23 mars 2013 contre l'USAP y est attesté par la presse.",
  },
  {
    club: "Stade Français",
    stade: "Stade Sébastien-Charléty",
    from: 2010,
    until: 2012,
    source:
      "Jean-Bouin a été reconstruit de 2010 à 2013 et rouvert le 30 août 2013 ; " +
      "le Stade Français a joué à Charléty de 2010-2011 à 2012-2013.",
  },
  {
    club: "Lyon",
    stade: "Matmut Stadium",
    until: 2016,
    source:
      "Le LOU a pris possession du Matmut Stadium de Gerland pour la saison " +
      "2017-2018 ; il recevait au Matmut Stadium de Vénissieux depuis 2011.",
  },
  {
    // Borné à 2007-2008 et non à 2013-2014, dernière saison de résident : le
    // Stade des Alpes n'existait pas avant février 2008, mais le FCG y a joué
    // des affiches de 2011 à 2014 (premier match le 27 novembre 2011). Ces
    // saisons-là, comme l'UBB, sont un fait par match : les déplacements de
    // l'USAP du 6 octobre 2012 et du 25 janvier 2014 restent à vérifier.
    club: "Grenoble",
    stade: "Stade Lesdiguières",
    until: 2007,
    source:
      "Wikipédia, « Stade Lesdiguières » (club résident de 1921 à 2014) et « Stade des Alpes » " +
      "(inauguré en février 2008, FCG résident depuis 2014) ; le calendrier 2003-2004 de " +
      "l'ancienne LNR place Grenoble-Perpignan du 24 octobre 2003 à Lesdiguières.",
  },
  {
    club: "Montpellier",
    stade: "Stade Sabathé",
    until: 2006,
    source:
      "Wikipédia, « Stade Sabathé » (le MHR rejoint Yves-du-Manoir en 2007) et « Septeo Stadium » " +
      "(premier match officiel le 27 octobre 2007, Montpellier-USAP 19-12, d'après Midi libre) ; " +
      "le calendrier 2003-2004 de l'ancienne LNR place Montpellier-Perpignan du 29 novembre 2003 à Sabathé.",
  },
];

async function main() {
  console.log(`=== Historique des terrains${DRY_RUN ? " (simulation)" : ""} ===\n`);

  console.log("--- stades");
  for (const s of STADES_A_CREER) {
    const existe = await prisma.venue.findFirst({ where: { name: s.nom } });
    if (existe) {
      console.log(`  ${s.nom} (${s.ville}) : déjà en base`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`  ${s.nom} (${s.ville}) : à créer`);
      continue;
    }
    const pays = await prisma.country.findFirst({ where: { code: s.pays } });
    // Le slug porte le CUID : il ne peut donc pas être calculé avant la
    // création. On crée avec un slug provisoire, puis on le réécrit.
    const cree = await prisma.venue.create({
      data: {
        name: s.nom,
        city: s.ville,
        countryId: pays?.id ?? null,
        notes: s.notes,
        slug: `temp-${Date.now()}`,
      },
    });
    await prisma.venue.update({
      where: { id: cree.id },
      data: { slug: generateVenueSlug(s.nom, s.ville, cree.id) },
    });
    console.log(`  ${s.nom} (${s.ville}) : créé`);
  }

  console.log("\n--- historique");
  for (const h of HISTORIQUE) {
    const club = await prisma.opponent.findFirst({
      where: { OR: [{ shortName: h.club }, { name: h.club }] },
      select: { id: true, shortName: true },
    });
    if (!club) {
      console.log(`  ⚠ club « ${h.club} » introuvable`);
      continue;
    }
    const stade = await prisma.venue.findFirst({
      where: { name: h.stade },
      select: { id: true },
    });
    if (!stade) {
      console.log(`  ⚠ stade « ${h.stade} » introuvable${DRY_RUN ? " (créé hors simulation)" : ""}`);
      continue;
    }
    const periode = `${h.from != null ? `de ${h.from}-${h.from + 1} ` : ""}jusqu'en ${h.until}-${h.until + 1}`;
    const deja = await prisma.opponentVenue.findFirst({
      where: { opponentId: club.id, venueId: stade.id },
    });
    if (deja) {
      if (deja.fromSeason === (h.from ?? null) && deja.untilSeason === h.until && deja.source === h.source) {
        console.log(`  ${h.club} → ${h.stade} : déjà écrit`);
        continue;
      }
      console.log(`  ${h.club} → ${h.stade} : bornes ${deja.fromSeason ?? "…"}-${deja.untilSeason} → ${periode}${DRY_RUN ? " (à corriger)" : " : corrigé"}`);
      if (!DRY_RUN) {
        await prisma.opponentVenue.update({
          where: { id: deja.id },
          data: { fromSeason: h.from ?? null, untilSeason: h.until, source: h.source },
        });
      }
      continue;
    }
    if (DRY_RUN) {
      console.log(`  ${h.club} → ${h.stade} ${periode} : à écrire`);
      continue;
    }
    await prisma.opponentVenue.create({
      data: {
        opponentId: club.id,
        venueId: stade.id,
        fromSeason: h.from ?? null,
        untilSeason: h.until,
        source: h.source,
      },
    });
    console.log(`  ${h.club} → ${h.stade} ${periode} : écrit`);
  }

  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
  else console.log("\nEnchaîner avec : npx tsx scripts/fix-match-venues.ts --dry");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

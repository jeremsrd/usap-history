/**
 * Écrit l'historique des terrains : où chaque club recevait avant son stade
 * d'aujourd'hui.
 *
 * POURQUOI. `Opponent.venueId` ne porte qu'un terrain, celui d'aujourd'hui, et
 * la déduction du lieu d'un déplacement s'en trouve fausse dès qu'on remonte.
 * Trois clubs sont concernés sur les quarante-trois que l'USAP a visités, et
 * quatre matchs en tout :
 *
 * | Match | En base avant | En réalité |
 * |---|---|---|
 * | Racing 92, 23 mars 2013 | Paris La Défense Arena | Colombes |
 * | Racing 92, 8 septembre 2013 | Paris La Défense Arena | Colombes |
 * | Stade Français, 22 septembre 2012 | Jean-Bouin | Charléty |
 * | Lyon, 31 mars 2016 | Gerland | Matmut Stadium (Vénissieux) |
 *
 * LES SOURCES, ET CE QU'ELLES VALENT. Aucune n'est officielle au sens du
 * projet : ni la LNR ni l'EPCR ne donnent le stade d'une rencontre, et le
 * calendrier de la LNR ne porte aucun champ de lieu — vérifié. Ce sont donc
 * des sources de presse et Wikipédia, au même titre que l'Albert-Domec de
 * Carcassonne ou le Maurice-Trélut de Tarbes, déjà en base à ce compte.
 *
 * Le détail figure sur chaque ligne du tableau `HISTORIQUE`.
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
 * Deux clubs ont **changé de nom de stade sans déménager**, et n'ont rien à
 * faire ici non plus : Montpellier (Yves-du-Manoir, puis Altrad Stadium, puis
 * GGL Stadium) et Castres (Pierre-Antoine, puis Pierre-Fabre).
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
];

/**
 * Où chaque club recevait avant son terrain d'aujourd'hui.
 *
 * Les bornes sont des **années de début de saison** : 2012 pour 2012-2013.
 * `until` est la dernière saison où le club recevait là, incluse.
 */
const HISTORIQUE = [
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
    const deja = await prisma.opponentVenue.findFirst({
      where: { opponentId: club.id, venueId: stade.id },
    });
    if (deja) {
      console.log(`  ${h.club} → ${h.stade} : déjà écrit`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`  ${h.club} → ${h.stade} jusqu'en ${h.until}-${h.until + 1} : à écrire`);
      continue;
    }
    await prisma.opponentVenue.create({
      data: {
        opponentId: club.id,
        venueId: stade.id,
        fromSeason: null,
        untilSeason: h.until,
        source: h.source,
      },
    });
    console.log(`  ${h.club} → ${h.stade} jusqu'en ${h.until}-${h.until + 1} : écrit`);
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

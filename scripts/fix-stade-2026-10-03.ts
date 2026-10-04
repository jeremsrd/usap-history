/**
 * Racing 92 – USAP du 3 octobre 2026, joué à Créteil et non à Nanterre.
 *
 * La J5 de 2026-2027 a été posée par `seed-calendrier-2026-2027.ts` au Paris
 * La Défense Arena, terrain du Racing en base. Le Racing a reçu au **stade
 * Dominique-Duvauchelle de Créteil** : *L'Indépendant* du lendemain le dit,
 * avec 4 535 spectateurs, et son score, sa mi-temps (22-13) et son évolution
 * du score concordent avec la feuille de la LNR. Celle-ci ne nomme aucun lieu
 * — c'est l'angle mort habituel, cf. `fix-matchs-barcelone.ts`.
 *
 * Le stade n'existait pas en base : le script le crée, avec un slug
 * provisoire réécrit aussitôt par `generateVenueSlug`, qui porte le CUID de la
 * ligne. La capacité est laissée vide, faute de source lue.
 *
 * **Le lieu vient de `TERRAINS_PARTICULIERS`** (`lib/stades.ts`), où la date
 * est inscrite : le script ne fait qu'appliquer `terrainDuMatch`, et une
 * relance du calendrier — qui passe désormais par la même règle — ne le
 * défera pas.
 *
 * Une seule source, de presse : degré PROBABLE.
 *
 * Usage :
 *   npx tsx scripts/fix-stade-2026-10-03.ts --dry
 *   npx tsx scripts/fix-stade-2026-10-03.ts
 *
 * Idempotent : un stade déjà créé est retrouvé sur son nom, un lieu déjà juste
 * n'est pas réécrit, l'attestation est remplacée à chaque passage.
 */

import { PrismaClient } from "@prisma/client";
import { generateVenueSlug } from "../src/lib/slugs";
import { attester } from "./lib/attestations";
import { terrainDuMatch } from "./lib/stades";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

const JOUR = "2026-10-03";
const STADE = { name: "Stade Dominique-Duvauchelle", city: "Créteil" };
const ANCIEN = "Paris La Défense Arena";
const SOURCE = "L'Indépendant du 4 octobre 2026";

async function main() {
  const debut = new Date(`${JOUR}T00:00:00Z`);
  const fin = new Date(debut.getTime() + 24 * 3600 * 1000);
  const matchs = await prisma.match.findMany({
    where: { date: { gte: debut, lt: fin } },
    include: { season: { select: { startYear: true } }, venue: { select: { name: true } } },
  });
  if (matchs.length !== 1) throw new Error(`${matchs.length} rencontre(s) le ${JOUR} — il en faut exactement une.`);
  const match = matchs[0];
  const actuel = match.venue?.name ?? "aucun";
  if (actuel !== ANCIEN && actuel !== STADE.name) {
    throw new Error(`${JOUR} : stade « ${actuel} » en base, ni « ${ANCIEN} » ni « ${STADE.name} » — à relire.`);
  }

  let stade = await prisma.venue.findFirst({ where: { name: STADE.name }, select: { id: true } });
  if (!stade) {
    if (DRY) {
      console.log(`  [dry] stade à créer : ${STADE.name}, ${STADE.city}`);
    } else {
      const france = await prisma.country.findUniqueOrThrow({ where: { code: "FR" }, select: { id: true } });
      const cree = await prisma.venue.create({
        data: { ...STADE, slug: `provisoire-${Date.now()}`, countryId: france.id },
      });
      await prisma.venue.update({
        where: { id: cree.id },
        data: { slug: generateVenueSlug(STADE.name, STADE.city, cree.id) },
      });
      stade = { id: cree.id };
      console.log(`  ✔ stade créé : ${STADE.name}, ${STADE.city}`);
    }
  }

  if (stade) {
    const venueId = await terrainDuMatch(prisma, {
      opponentId: match.opponentId,
      isHome: match.isHome,
      startYear: match.season.startYear,
      jour: JOUR,
    });
    if (venueId !== stade.id) {
      throw new Error(`${JOUR} : terrainDuMatch ne rend pas « ${STADE.name} » — la date est-elle dans TERRAINS_PARTICULIERS ?`);
    }
  }

  if (actuel === STADE.name) {
    console.log(`  ${JOUR} : ${STADE.name} déjà en base`);
  } else if (DRY) {
    console.log(`  [dry] ${JOUR} : ${actuel} → ${STADE.name}, ${STADE.city}`);
  } else {
    await prisma.match.update({ where: { id: match.id }, data: { venueId: stade!.id } });
    console.log(`  ✔ ${JOUR} : ${actuel} → ${STADE.name}, ${STADE.city}`);
  }

  await attester(
    prisma,
    {
      entite: "Match",
      entiteId: match.id,
      champ: "venueId",
      degre: "PROBABLE",
      source: SOURCE,
      note:
        "Réception du Racing 92 au stade Dominique-Duvauchelle de Créteil, devant 4 535 spectateurs, " +
        "et non au Paris La Défense Arena. La LNR ne publie pas le lieu d'une rencontre ; le journal " +
        "concorde avec sa feuille sur le score, la mi-temps et l'évolution du score. " +
        "Cf. fix-stade-2026-10-03.ts.",
    },
    DRY,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

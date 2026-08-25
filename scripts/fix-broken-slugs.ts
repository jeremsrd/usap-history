/**
 * Répare les slugs qui ne permettent pas de retrouver l'entité.
 *
 * Les pages de détail (/joueurs/[slug], /stades/[slug], etc.) retrouvent
 * l'enregistrement en extrayant le CUID de la fin du slug, via une expression
 * régulière qui exige au moins 25 caractères alphanumériques :
 *
 *   function extractIdFromSlug(slug) { return slug.match(/([a-z0-9]{25,})$/)?.[1] }
 *
 * Un slug dont le suffixe est tronqué ("peceli-yato-mmc8i1z1zu8v") ou absent
 * ("andro-dvali") renvoie donc systématiquement un 404. C'est le cas de
 * 419 joueurs, dont 13 apparaissent dans la liste /joueurs et sont donc
 * cliquables : Yato, Urdapilleta, les frères Lotrian, Gray, Dvali...
 *
 * backfill-slugs.ts ne corrige pas ces cas : il ne cible que les slugs vides
 * (`slug: ""`), or ceux-ci sont non vides mais malformés.
 *
 * Aucun slug cassé ne pointe vers une autre entité (vérifié : les 419
 * donnent un 404 franc, aucune mauvaise fiche), la réécriture est donc sans
 * risque de régression.
 *
 * Usage :
 *   npx tsx scripts/fix-broken-slugs.ts --dry   (liste sans rien écrire)
 *   npx tsx scripts/fix-broken-slugs.ts
 *
 * Idempotent : ne touche que les slugs qui ne se terminent pas par l'id.
 */

import { PrismaClient } from "@prisma/client";
import { generatePlayerSlug, slugify } from "../src/lib/slugs";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

/** Un slug est exploitable s'il se termine par l'id de l'entité. */
function isBroken(slug: string, id: string): boolean {
  return !slug.endsWith(id);
}

async function main() {
  console.log(
    `=== Réparation des slugs${DRY_RUN ? " (simulation, aucune écriture)" : ""} ===\n`,
  );

  // ---- Joueurs ------------------------------------------------------------
  const players = await prisma.player.findMany({
    select: { id: true, slug: true, firstName: true, lastName: true },
  });
  const brokenPlayers = players.filter((p) => isBroken(p.slug, p.id));

  // Ceux qui sont réellement atteignables depuis la liste /joueurs
  const usapCondition = {
    OR: [
      { usapStints: { some: {} } },
      { careerClubs: { some: { isUsap: true } } },
      { matchAppearances: { some: { isOpponent: false } } },
      { seasonSquads: { some: {} } },
    ],
  };
  const usapIds = new Set(
    (await prisma.player.findMany({ where: usapCondition, select: { id: true } })).map(
      (p) => p.id,
    ),
  );

  console.log(`Joueurs : ${brokenPlayers.length} slug(s) à réparer sur ${players.length}`);
  for (const p of brokenPlayers) {
    const slug = generatePlayerSlug(p.firstName, p.lastName, p.id);
    const visible = usapIds.has(p.id) ? " ← listé sur /joueurs" : "";
    if (visible) console.log(`  ${p.firstName} ${p.lastName}\n    ${p.slug}\n    → ${slug}${visible}`);
    if (!DRY_RUN) {
      await prisma.player.update({ where: { id: p.id }, data: { slug } });
    }
  }
  const visibles = brokenPlayers.filter((p) => usapIds.has(p.id)).length;
  console.log(`  dont ${visibles} joueur(s) USAP cliquable(s) depuis la liste\n`);

  // ---- Stades -------------------------------------------------------------
  const venues = await prisma.venue.findMany({
    select: { id: true, slug: true, name: true, city: true },
  });
  const brokenVenues = venues.filter((v) => isBroken(v.slug, v.id));

  console.log(`Stades : ${brokenVenues.length} slug(s) à réparer sur ${venues.length}`);
  for (const v of brokenVenues) {
    // Même convention que fix-venues-2022-2023.ts
    const slug = `${slugify(v.name)}-${slugify(v.city)}-${v.id}`;
    console.log(`  ${v.name} (${v.city})\n    ${v.slug === "" ? "(vide)" : v.slug}\n    → ${slug}`);
    if (!DRY_RUN) {
      await prisma.venue.update({ where: { id: v.id }, data: { slug } });
    }
  }

  console.log(
    DRY_RUN
      ? "\nSimulation terminée — relancer sans --dry pour appliquer."
      : "\nTerminé.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * Fusionne deux fiches d'adversaire désignées par leur identifiant.
 *
 * Le pendant de `merge-players.ts` pour les clubs. Les imports successifs ont
 * créé des doublons de bonne foi — « FC Grenoble » et « FC Grenoble Rugby »,
 * chacun avec son barrage —, invisibles tant qu'on ne regarde pas la liste
 * des adversaires de près : même ville, même stade, même logo, deux fiches.
 *
 * Le script **ne cherche rien de lui-même** : il exécute la fusion qu'on lui
 * donne, une fois la paire vérifiée à la main. Tout ce qui pointe vers la
 * fiche absorbée est repointé — matchs, anciens noms, clubs de carrière —,
 * puis la fiche disparaît.
 *
 * Les champs de la fiche conservée qui seraient vides prennent la valeur de
 * l'absorbée : ville, pays, stade, logo, couleurs, année de fondation, site.
 * On ne perd donc rien de ce que l'une des deux savait.
 *
 * Usage :
 *   npx tsx scripts/merge-opponents.ts --keep=<id> --drop=<id> --dry
 *   npx tsx scripts/merge-opponents.ts --keep=<id> --drop=<id>
 *   npx tsx scripts/merge-opponents.ts --keep=<id> --drop=<id> --nom="FC Grenoble Rugby"
 *
 * `--nom` rétablit la dénomination sur la fiche conservée ; le slug est
 * régénéré avec le CUID en suffixe, sans quoi la fiche répondrait 404.
 *
 * Idempotent : une fusion déjà faite ne trouve plus la fiche absorbée.
 */

import { PrismaClient } from "@prisma/client";
import { generateOpponentSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");
const KEEP = process.argv.find((a) => a.startsWith("--keep="))?.slice("--keep=".length);
const DROP = process.argv.find((a) => a.startsWith("--drop="))?.slice("--drop=".length);
const NOM = process.argv.find((a) => a.startsWith("--nom="))?.slice("--nom=".length)?.trim();

if (!KEEP || !DROP || KEEP === DROP) {
  console.error(
    "Deux identifiants distincts sont attendus.\n" +
      "  npx tsx scripts/merge-opponents.ts --keep=<id> --drop=<id> --dry\n" +
      'Options : --dry (simulation), --nom="Nom du club" (dénomination à retenir)',
  );
  process.exit(1);
}

/** Champs que la fiche conservée peut hériter de l'absorbée si elle est vide. */
const HERITABLES = [
  "officialName",
  "city",
  "countryId",
  "logoUrl",
  "primaryColor",
  "secondaryColor",
  "venueId",
  "foundedYear",
  "websiteUrl",
  "facebookUrl",
  "instagramUrl",
  "notes",
] as const;

async function main() {
  console.log(`=== Fusion de deux fiches d'adversaire${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const keep = await prisma.opponent.findUnique({ where: { id: KEEP! } });
  const drop = await prisma.opponent.findUnique({ where: { id: DROP! } });
  if (!keep) throw new Error(`Fiche conservée introuvable : ${KEEP}`);
  if (!drop) {
    console.log(`Fiche absorbée introuvable : ${DROP} — fusion déjà faite, rien à faire.`);
    return;
  }

  console.log(`  conservée : ${keep.name} (${keep.id})`);
  console.log(`  absorbée  : ${drop.name} (${drop.id})\n`);

  const compte = {
    matchs: await prisma.match.count({ where: { opponentId: DROP } }),
    anciensNoms: await prisma.opponentAlias.count({ where: { opponentId: DROP } }),
    carrieres: await prisma.careerClub.count({ where: { opponentId: DROP } }),
  };
  console.log(
    `  à repointer : ${compte.matchs} match(s), ${compte.anciensNoms} ancien(s) nom(s), ` +
      `${compte.carrieres} club(s) de carrière`,
  );

  const herites = HERITABLES.filter(
    (champ) => keep[champ] == null && drop[champ] != null,
  );
  if (herites.length > 0) console.log(`  hérités de l'absorbée : ${herites.join(", ")}`);
  if (NOM && NOM !== keep.name) console.log(`  dénomination à retenir : ${NOM}`);

  if (DRY_RUN) {
    console.log("\nSimulation — relancer sans --dry pour appliquer.");
    return;
  }

  await prisma.match.updateMany({ where: { opponentId: DROP }, data: { opponentId: KEEP } });
  await prisma.opponentAlias.updateMany({
    where: { opponentId: DROP },
    data: { opponentId: KEEP },
  });
  await prisma.careerClub.updateMany({
    where: { opponentId: DROP },
    data: { opponentId: KEEP },
  });

  const data: Record<string, unknown> = {};
  for (const champ of herites) data[champ] = drop[champ];
  if (NOM && NOM !== keep.name) {
    data.name = NOM;
    data.slug = generateOpponentSlug(NOM, keep.id);
  }
  if (Object.keys(data).length > 0) {
    await prisma.opponent.update({ where: { id: KEEP }, data });
  }

  await prisma.opponent.delete({ where: { id: DROP } });
  console.log("\n  fusionné.");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

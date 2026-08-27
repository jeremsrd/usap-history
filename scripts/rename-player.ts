/**
 * Renomme une fiche joueur, slug compris.
 *
 * Un `UPDATE` à la main ne suffit pas : les pages de détail retrouvent
 * l'enregistrement en extrayant le CUID de la fin du slug, si bien qu'un slug
 * laissé sur l'ancien nom reste valable mais incohérent, et qu'un slug
 * refabriqué sans le CUID rend la fiche introuvable (404). Le script passe
 * par `generatePlayerSlug()`, seule façon d'en produire un qui se résolve.
 *
 * Sert aux arbitrages d'identité — choisir sous quel nom d'usage une personne
 * figure au site — là où `merge-players.ts` traite les doublons.
 *
 * Usage :
 *   npx tsx scripts/rename-player.ts --id=<id> --nom="Waisea|Nayacalevu" --dry
 *   npx tsx scripts/rename-player.ts --id=<id> --nom="Waisea|Nayacalevu"
 *
 * Idempotent : une fiche déjà au bon nom n'est pas réécrite.
 */

import { PrismaClient } from "@prisma/client";
import { generatePlayerSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");
const ID = process.argv.find((a) => a.startsWith("--id="))?.slice("--id=".length);
const NOM = process.argv.find((a) => a.startsWith("--nom="))?.slice("--nom=".length);
const nom = NOM?.split("|").map((x) => x.trim());

if (!ID || !nom || nom.length !== 2 || !nom[0] || !nom[1]) {
  console.error(
    "Identifiant et nom sont attendus.\n" +
      '  npx tsx scripts/rename-player.ts --id=<id> --nom="Prénom|Nom" --dry',
  );
  process.exit(1);
}

async function main() {
  const joueur = await prisma.player.findUnique({ where: { id: ID! } });
  if (!joueur) throw new Error(`Fiche introuvable : ${ID}`);

  const [firstName, lastName] = nom!;
  if (joueur.firstName === firstName && joueur.lastName === lastName) {
    console.log(`${firstName} ${lastName} : déjà au bon nom, rien à faire.`);
    return;
  }

  const slug = generatePlayerSlug(firstName, lastName, ID!);
  console.log(`${joueur.firstName} ${joueur.lastName} → ${firstName} ${lastName}`);
  console.log(`  slug ${joueur.slug} → ${slug}`);

  const feuilles = await prisma.matchPlayer.count({ where: { playerId: ID } });
  console.log(`  ${feuilles} feuille(s) de match concernée(s)`);

  if (DRY_RUN) {
    console.log("\nSimulation — relancer sans --dry pour appliquer.");
    return;
  }
  await prisma.player.update({ where: { id: ID }, data: { firstName, lastName, slug } });
  console.log("  renommé.");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

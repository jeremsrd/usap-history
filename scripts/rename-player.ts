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
 * `--source="…"` pose une attestation sur le nom (`Player.nom`, `PROBABLE`) :
 * toute orthographe venue d'ailleurs que la feuille officielle en porte une —
 * un accent que la LNR retire et que la presse rend, par exemple.
 *
 * Usage :
 *   npx tsx scripts/rename-player.ts --id=<id> --nom="Waisea|Nayacalevu" --dry
 *   npx tsx scripts/rename-player.ts --id=<id> --nom="Clément|Paul" --source="L'Indépendant du 8 novembre 2026"
 *
 * Idempotent : une fiche déjà au bon nom n'est pas réécrite ; l'attestation
 * est posée ou remplacée.
 */

import { PrismaClient } from "@prisma/client";
import { generatePlayerSlug } from "../src/lib/slugs";
import { attester } from "./lib/attestations";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");
const ID = process.argv.find((a) => a.startsWith("--id="))?.slice("--id=".length);
const NOM = process.argv.find((a) => a.startsWith("--nom="))?.slice("--nom=".length);
const nom = NOM?.split("|").map((x) => x.trim());
const SOURCE = process.argv.find((a) => a.startsWith("--source="))?.slice("--source=".length);

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
  const attestation = SOURCE
    ? {
        entite: "Player" as const,
        entiteId: ID!,
        champ: "nom",
        degre: "PROBABLE" as const,
        source: SOURCE,
        note: `Nom retenu : ${firstName} ${lastName} ; la fiche portait « ${joueur.firstName} ${joueur.lastName} ».`,
      }
    : null;
  if (joueur.firstName === firstName && joueur.lastName === lastName) {
    console.log(`${firstName} ${lastName} : déjà au bon nom, rien à faire.`);
    return;
  }

  const slug = generatePlayerSlug(firstName, lastName, ID!);
  console.log(`${joueur.firstName} ${joueur.lastName} → ${firstName} ${lastName}`);
  console.log(`  slug ${joueur.slug} → ${slug}`);

  const feuilles = await prisma.matchPlayer.count({ where: { playerId: ID } });
  console.log(`  ${feuilles} feuille(s) de match concernée(s)`);

  if (attestation) await attester(prisma, attestation, DRY_RUN);
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

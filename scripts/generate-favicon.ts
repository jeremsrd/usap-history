/**
 * L'icône d'onglet, tirée de l'écusson catalan du dépôt.
 *
 * Next.js sert `src/app/favicon.ico` à `/favicon.ico` sans qu'on le déclare :
 * c'est une convention de fichier, pas une entrée de `metadata`. Le fichier
 * qui s'y trouvait était celui du starter Next.js, resté depuis la création du
 * projet.
 *
 * **La source est `public/images/usap/logo.png`**, le même écusson que le
 * Header, le hero et le pied de page — celui du site du club, en 523 par 523
 * transparent (cf. `SOURCE_USAP` dans `fetch-club-logos.ts`). Le script ne va
 * donc rien chercher sur le réseau : il dérive ce que le dépôt porte déjà, et
 * une relance après un changement d'écusson refait l'icône avec.
 *
 * Deux précautions dans les quelques lignes qui suivent :
 *
 * - **le blason est plus haut que large** — 413 par 523 une fois ses marges
 *   transparentes retirées —, et une icône est carrée. Il est donc posé au
 *   centre d'un carré, sans être déformé : `fit: "contain"` sur fond
 *   transparent. L'étirer en carré donnerait un écusson gras à 16 pixels ;
 * - **l'ICO enveloppe des PNG**, ce que tous les navigateurs modernes lisent,
 *   et c'est la seule façon d'en produire un ici : sharp n'écrit pas ce
 *   format. L'en-tête et la table des matières sont assemblés à la main —
 *   six octets, puis seize par taille — et le reste est du PNG.
 *
 * Quatre tailles : 16 et 32 pour l'onglet selon la densité d'écran, 48 pour
 * le raccourci Windows, 64 pour les affichages qui piochent au plus grand.
 *
 * Usage :
 *   npx tsx scripts/generate-favicon.ts --dry
 *   npx tsx scripts/generate-favicon.ts
 *
 * Idempotent : la même source rend le même fichier.
 */

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const DRY_RUN = process.argv.includes("--dry");

const SOURCE = join(process.cwd(), "public", "images", "usap", "logo.png");
const CIBLE = join(process.cwd(), "src", "app", "favicon.ico");
const TAILLES = [16, 32, 48, 64];

/** Le blason au centre d'un carré de `cote`, sans déformation. */
async function vignette(source: Buffer, cote: number): Promise<Buffer> {
  return sharp(source)
    .trim({ threshold: 0 })
    .resize(cote, cote, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** L'enveloppe ICO autour de PNG déjà encodés. */
function assemblerIco(images: { cote: number; png: Buffer }[]): Buffer {
  const ENTETE = 6;
  const ENTREE = 16;
  const entete = Buffer.alloc(ENTETE);
  entete.writeUInt16LE(0, 0); // réservé
  entete.writeUInt16LE(1, 2); // 1 = icône
  entete.writeUInt16LE(images.length, 4);

  let offset = ENTETE + ENTREE * images.length;
  const entrees: Buffer[] = [];
  for (const { cote, png } of images) {
    const e = Buffer.alloc(ENTREE);
    // 256 s'écrit 0 dans un octet : la convention du format.
    e.writeUInt8(cote >= 256 ? 0 : cote, 0);
    e.writeUInt8(cote >= 256 ? 0 : cote, 1);
    e.writeUInt8(0, 2); // palette : aucune
    e.writeUInt8(0, 3); // réservé
    e.writeUInt16LE(1, 4); // plans
    e.writeUInt16LE(32, 6); // bits par pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    entrees.push(e);
    offset += png.length;
  }
  return Buffer.concat([entete, ...entrees, ...images.map((i) => i.png)]);
}

async function main() {
  const source = await readFile(SOURCE);
  const images = [];
  for (const cote of TAILLES) images.push({ cote, png: await vignette(source, cote) });
  const ico = assemblerIco(images);

  const detail = images.map((i) => `${i.cote}px ${Math.round(i.png.length / 1024)} ko`).join(", ");
  console.log(`favicon.ico : ${TAILLES.length} tailles — ${detail}`);
  console.log(`total ${Math.round(ico.length / 1024)} ko`);

  if (DRY_RUN) {
    console.log("\nSimulation — relancer sans --dry pour écrire.");
    return;
  }
  await writeFile(CIBLE, ico);
  console.log(`écrit dans ${CIBLE}`);
}

main();

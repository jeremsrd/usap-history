import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Ce qu'il faut pour dessiner une image de partage — OpenGraph, la carte que
 * WhatsApp, X ou un moteur montrent quand on colle un lien du site —, depuis
 * le 14 septembre 2026. Les images se dessinent en JSX par `ImageResponse`
 * de `next/og`, à la volée, hors du navigateur : ni Tailwind ni `next/image`
 * n'y valent, les couleurs et les polices sont données ici.
 *
 * **Archivo est dans le dépôt**, `src/app/fonts/`, licence OFL : `next/font`
 * ne laisse pas ses fichiers sur disque, et aller chercher la police chez
 * Google à chaque rendu ferait dépendre chaque carte d'un appel réseau. La
 * condensée noire est celle des titres du site, à 62,5 % de chasse ; la
 * normale sert au reste.
 *
 * Les écussons sont lus dans `public/` et donnés en `data:` — une image de
 * partage ne peut pas référencer un chemin relatif, et une adresse absolue
 * désignerait `localhost` en développement.
 */
export const OG_LARGEUR = 1200;
export const OG_HAUTEUR = 630;
export const SANG = "#C8102E";
export const OR_VIF = "#FFD700";
export const BLANC = "#ffffff";

const racine = process.cwd();

export async function policesOg() {
  const [condensee, normale] = await Promise.all([
    readFile(path.join(racine, "src/app/fonts/Archivo-CondensedBlack.ttf")),
    readFile(path.join(racine, "src/app/fonts/Archivo-Regular.ttf")),
  ]);
  return [
    { name: "Archivo Condensed", data: condensee, weight: 900 as const, style: "normal" as const },
    { name: "Archivo", data: normale, weight: 400 as const, style: "normal" as const },
  ];
}

/** Une image de `public/` en `data:`, ou `null` si elle manque. */
export async function imagePublique(chemin: string | null): Promise<string | null> {
  if (!chemin || !chemin.startsWith("/")) return null;
  try {
    const octets = await readFile(path.join(racine, "public", chemin));
    const type = chemin.endsWith(".webp") ? "image/webp" : chemin.endsWith(".jpg") || chemin.endsWith(".jpeg") ? "image/jpeg" : "image/png";
    return `data:${type};base64,${octets.toString("base64")}`;
  } catch {
    return null;
  }
}

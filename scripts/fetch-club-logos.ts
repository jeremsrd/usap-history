/**
 * Rapatrie les logos officiels des clubs dans le dépôt.
 *
 * Les sources les servent déjà, et je les lis de toute façon : la LNR pose
 * `cdn.lnr.fr/club/{slug}/photo/logo.{empreinte}` dans chaque page de
 * calendrier, l'EPCR un `imageUrl` par équipe dans son flux. Plutôt que de
 * pointer vers ces CDN — dont les URL portent une empreinte qui peut changer,
 * et qui peuvent refuser le lien direct —, on télécharge une fois pour toutes
 * dans `public/images/logos/`. Le site ne dépend alors de personne, les
 * chemins sont locaux, et `next/image` n'a aucun hôte distant à autoriser.
 *
 * Les deux logos déjà téléversés sur Supabase — Clermont et Toulon — sont
 * rapatriés eux aussi, tels quels : ce sont des images choisies à la main, on
 * ne les remplace pas par celles de la LNR, on les met simplement au même
 * endroit que les autres.
 *
 * Les logos de club sont des marques déposées. Les afficher sur un site
 * d'histoire non commercial est l'usage, et c'est déjà ce que fait la base
 * pour deux clubs ; le choix reste celui du propriétaire du site.
 *
 * Usage :
 *   npx tsx scripts/fetch-club-logos.ts --dry
 *   npx tsx scripts/fetch-club-logos.ts
 *   npx tsx scripts/fetch-club-logos.ts --tout            # réécrit tout
 *   npx tsx scripts/fetch-club-logos.ts --club=Clermont   # un seul club
 *   npx tsx scripts/fetch-club-logos.ts --usap            # l'écusson catalan
 *
 * `--club` désigne un ou plusieurs clubs par leur nom court, séparés par des
 * virgules, et **force le retéléchargement** : c'est ce qu'il faut pour
 * reprendre un logo à la source officielle quand celui en place vient
 * d'ailleurs. Clermont était ainsi le seul JPEG de la série, donc sans
 * transparence — un rectangle blanc derrière l'écusson en thème sombre.
 *
 * `--usap` rafraîchit `public/images/usap/logo.png`, l'écusson catalan que le
 * site affiche partout ailleurs que sur les fiches d'adversaire.
 *
 * Idempotent : un fichier déjà présent n'est pas retéléchargé, sauf `--tout`
 * ou `--club`.
 */

import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile, stat, rm } from "node:fs/promises";
import sharp from "sharp";
import { join } from "node:path";
import { CLUBS_LNR, CLUBS_EPCR } from "./lib/clubs";
import { entetesEpcr } from "./lib/epcr";
import { slugify } from "../src/lib/slugs";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");
const TOUT = process.argv.includes("--tout");
const USAP = process.argv.includes("--usap");
const CIBLES = process.argv
  .find((a) => a.startsWith("--club="))
  ?.slice("--club=".length)
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

/**
 * Côté le plus long d'un écusson stocké, en pixels.
 *
 * Le plus grand affichage du site est de 48 pixels, et `next/image` sert des
 * variantes optimisées — 1,4 Ko pour Carcassonne. L'original n'a donc besoin
 * d'être ni immense ni petit : il pèse sur le dépôt, pas sur les pages. Or la
 * LNR sert du 5420 par 6346 pour Carcassonne, 1,1 Mo à lui seul, quand
 * Clermont fait 151 par 151.
 *
 * Ce qui dépasse est réduit, transparence comprise ; ce qui est en dessous
 * n'est pas touché, un agrandissement n'ajouterait rien.
 */
const COTE_MAX = 1200;

/**
 * Réduit un écusson trop grand, laisse les autres tels quels.
 *
 * Deux précautions apprises à la dure. **L'encodage par défaut de sharp est
 * plus lourd que celui de la LNR** : redimensionner dix écussons sans y penser
 * a fait passer leur total de 2 724 à 2 911 Ko, alors que les images étaient
 * plus petites. Un écusson est une image à plat, quelques couleurs : la
 * palette lui va, et Carcassonne tombe de 1 093 à 94 Ko.
 *
 * Et l'on **ne garde le résultat que s'il est réellement plus léger**. Réduire
 * une image bien compressée peut l'alourdir, et l'original a alors tout pour
 * lui : plus fin, et moins gros.
 */
async function reduire(contenu: Buffer): Promise<Buffer> {
  const { width = 0, height = 0 } = await sharp(contenu).metadata();
  if (Math.max(width, height) <= COTE_MAX) return contenu;

  const reduit = await sharp(contenu)
    .resize({ width: COTE_MAX, height: COTE_MAX, fit: "inside" })
    .png({ palette: true, compressionLevel: 9 })
    .toBuffer();
  return reduit.length < contenu.length ? reduit : contenu;
}

const DOSSIER = join(process.cwd(), "public", "images", "logos");
const CHEMIN_PUBLIC = "/images/logos";
/** L'écusson catalan, hors du dossier des adversaires et référencé en dur. */
const LOGO_USAP = join(process.cwd(), "public", "images", "usap", "logo.png");

/** Pages de calendrier où la LNR expose les logos de tous les clubs engagés. */
const PAGES_LNR = [
  // 2018-2019 est là pour Agen, seul club de cette saison-là que les
  // calendriers plus récents ne montrent plus.
  ...["2018-2019", "2021-2022", "2022-2023", "2023-2024", "2024-2025", "2025-2026", "2026-2027"].map(
    (s) => `https://top14.lnr.fr/calendrier-et-resultats/${s}/j1`,
  ),
  "https://top14.lnr.fr/calendrier-et-resultats/2021-2022/match-daccession",
  "https://top14.lnr.fr/calendrier-et-resultats/2022-2023/access",
  "https://top14.lnr.fr/calendrier-et-resultats/2024-2025/access-top-14",
  "https://top14.lnr.fr/calendrier-et-resultats/2025-2026/access-top-14",
  // La Pro D2 est sur un autre site, et c'est de là que viennent les écussons
  // des clubs de deuxième division — Carcassonne, Rouen, Colomiers et les
  // autres, croisés en 2020-2021. Même CDN, même forme d'URL.
  "https://prod2.lnr.fr/calendrier-et-resultats/2020-2021/j1",
  "https://prod2.lnr.fr/calendrier-et-resultats/2020-2021/j2",
  // 2017-2018 pour Dax, Massy et Narbonne, sortis de Pro D2 depuis : leurs
  // pages de club ont disparu, mais les calendriers archivés servent encore
  // leurs écussons. Même raison que 2018-2019 pour Agen, plus haut.
  "https://prod2.lnr.fr/calendrier-et-resultats/2017-2018/j1",
];

async function lire(url: string, entetes?: Record<string, string>): Promise<string> {
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const reponse = await fetch(url, {
        headers: entetes,
        signal: AbortSignal.timeout(30_000),
      });
      if (reponse.ok) return await reponse.text();
    } catch {
      // on retente
    }
  }
  return "";
}

/** Logos de la LNR, par nom de club en base. */
async function moissonLnr(): Promise<Map<string, string>> {
  const parNom = new Map<string, string>();
  for (const page of PAGES_LNR) {
    const html = await lire(page);
    for (const [, slug, empreinte] of html.matchAll(
      /cdn\.lnr\.fr\/club\/([a-z0-9-]+)\/photo\/logo\.([0-9a-f]+)/g,
    )) {
      const nom = CLUBS_LNR[slug];
      if (!nom || parNom.has(nom)) continue;
      parNom.set(nom, `https://cdn.lnr.fr/club/${slug}/photo/logo.${empreinte}`);
    }
  }
  return parNom;
}

/** Logos de l'EPCR, par nom de club en base. */
async function moissonEpcr(): Promise<Map<string, string>> {
  const parNom = new Map<string, string>();
  for (const saison of ["202101", "202201", "202301", "202401", "202501"]) {
    for (const comp of [1026, 1008]) {
      const corps = await lire(
        `https://rugby-union-feeds.incrowdsports.com/v1/matches` +
          `?provider=rugbyviz&compId=${comp}&season=${saison}&images=true`,
        entetesEpcr(),
      );
      if (!corps) continue;
      const data = JSON.parse(corps)?.data ?? [];
      for (const m of data) {
        for (const equipe of [m.homeTeam, m.awayTeam]) {
          const nom = CLUBS_EPCR[equipe?.name];
          if (!nom || !equipe?.imageUrl || parNom.has(nom)) continue;
          parNom.set(nom, equipe.imageUrl);
        }
      }
    }
  }
  return parNom;
}

async function existe(chemin: string): Promise<boolean> {
  try {
    await stat(chemin);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`=== Logos des clubs${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const [lnr, epcr] = await Promise.all([moissonLnr(), moissonEpcr()]);
  console.log(`  ${lnr.size} logo(s) côté LNR, ${epcr.size} côté EPCR\n`);

  if (!DRY_RUN) await mkdir(DOSSIER, { recursive: true });

  const clubs = await prisma.opponent.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortName: true, logoUrl: true },
  });

  let recuperes = 0;
  let octets = 0;
  const sans: string[] = [];

  for (const club of clubs) {
    const nomCourt = club.shortName ?? club.name;
    const vise = CIBLES?.includes(nomCourt) ?? false;
    if (CIBLES && !vise) continue;
    // Un logo déjà téléversé sur Supabase est rapatrié tel quel : c'est une
    // image choisie à la main, on ne la remplace pas par celle de la LNR —
    // sauf demande expresse, `--club` allant justement chercher la source
    // officielle.
    const source =
      club.logoUrl?.startsWith("http") && !vise
        ? club.logoUrl
        : (lnr.get(nomCourt) ?? epcr.get(nomCourt));
    if (!source) {
      sans.push(nomCourt);
      continue;
    }

    const extension = source.match(/\.(png|jpe?g|webp|svg)(\?|$)/i)?.[1]?.toLowerCase() ?? "png";
    const fichier = `${slugify(nomCourt)}.${extension}`;
    const chemin = join(DOSSIER, fichier);
    const url = `${CHEMIN_PUBLIC}/${fichier}`;
    const dejaLa = await existe(chemin);

    if (dejaLa && !TOUT && !vise) {
      if (club.logoUrl !== url && !DRY_RUN) {
        await prisma.opponent.update({ where: { id: club.id }, data: { logoUrl: url } });
      }
      continue;
    }

    if (DRY_RUN) {
      console.log(`  ${nomCourt.padEnd(18)} → ${fichier}`);
      recuperes++;
      continue;
    }

    const reponse = await fetch(source, { signal: AbortSignal.timeout(30_000) });
    if (!reponse.ok) {
      sans.push(`${nomCourt} (téléchargement ${reponse.status})`);
      continue;
    }
    const contenu = await reduire(Buffer.from(await reponse.arrayBuffer()));
    await writeFile(chemin, contenu);
    // Le nouveau fichier peut changer d'extension — le JPEG de Clermont cède
    // la place à un PNG : l'ancien ne doit pas rester derrière.
    if (club.logoUrl?.startsWith(CHEMIN_PUBLIC) && club.logoUrl !== url) {
      await rm(join(process.cwd(), "public", club.logoUrl), { force: true });
    }
    await prisma.opponent.update({ where: { id: club.id }, data: { logoUrl: url } });
    console.log(`  ${nomCourt.padEnd(18)} → ${fichier} (${Math.round(contenu.length / 1024)} ko)`);
    recuperes++;
    octets += contenu.length;
  }

  if (USAP) {
    const source = lnr.get("Perpignan") ?? lnr.get("USAP");
    if (!source) sans.push("USAP (aucune source LNR)");
    else if (DRY_RUN) {
      console.log("  USAP               → images/usap/logo.png");
      recuperes++;
    } else {
      const reponse = await fetch(source, { signal: AbortSignal.timeout(30_000) });
      if (!reponse.ok) sans.push(`USAP (téléchargement ${reponse.status})`);
      else {
        const contenu = Buffer.from(await reponse.arrayBuffer());
        await writeFile(LOGO_USAP, contenu);
        console.log(`  USAP               → images/usap/logo.png (${Math.round(contenu.length / 1024)} ko)`);
        recuperes++;
        octets += contenu.length;
      }
    }
  }

  console.log(
    `\n=== ${recuperes} logo(s) ${DRY_RUN ? "à récupérer" : "récupérés"}` +
      (octets ? `, ${Math.round(octets / 1024)} ko au total` : "") +
      `, ${sans.length} sans source ===`,
  );
  for (const s of sans) console.log(`  ⚠ ${s}`);
  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

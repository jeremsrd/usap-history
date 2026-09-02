/**
 * Portraits des joueurs de l'USAP — moisson, redimensionnement, crédits.
 *
 * ------------------------------------------------------------------------
 * POURQUOI PAS LA LNR, QUI EST LA SOURCE OFFICIELLE DU PROJET
 *
 * Elle sert bien des portraits, `cdn.lnr.fr/joueur/{id}-{slug}/photo/
 * photoPortrait.{empreinte}`, et ses feuilles de match donnent l'URL de
 * fiche de chaque joueur d'une composition. Mais **elle ne les conserve que
 * pour les joueurs récents** : vérifié le 2 septembre 2026, les fiches de la
 * feuille Perpignan-Toulon du 25 août 2012 — Nicolas Mas, Alasdair
 * Strokosch, Jérémy Castex, Romain Terrain — ne portent aucune image, quand
 * celles de la J1 de 2025-2026 en portent toutes. Les joueurs les plus
 * capés de l'histoire récente du club étant précisément les anciens, la LNR
 * couvre mal ce chantier-ci.
 *
 * ------------------------------------------------------------------------
 * D'OÙ WIKIMEDIA COMMONS, ET CE QUE CE CHOIX SUPPOSE
 *
 * Une photo de joueur est une œuvre protégée, et bien davantage qu'un
 * écusson : la republier sans droit n'est pas un usage toléré. Commons a
 * l'avantage décisif de porter une **licence explicite et lisible par
 * machine** — le script refuse toute image dont la licence n'est pas dans
 * `LICENCES_LIBRES`, et enregistre pour chaque portrait son auteur, sa
 * licence et sa page de description dans `credits.json`.
 *
 * CC BY et CC BY-SA EXIGENT L'ATTRIBUTION. Le fichier de crédits n'est donc
 * pas une commodité : c'est la condition de la licence, et `credits.json`
 * est lu par la fiche joueur, qui affiche le crédit sous la photo. Retirer
 * cet affichage, c'est republier sans droit.
 *
 * ------------------------------------------------------------------------
 * TROIS GARDE-FOUS, ET AUCUN N'EST FACULTATIF
 *
 * 1. **L'article est nommé à la main**, dans `PORTRAITS`. Chercher le nom
 *    par mot-clé rendait « Lucas Dubois » ou « David Marty » sans qu'on
 *    puisse dire de quel homme il s'agit : c'est le même piège que les
 *    homonymes des feuilles de match, et il se résout de la même façon —
 *    une table vérifiée à la main plutôt qu'une heuristique.
 * 2. **L'article doit parler de Perpignan.** Un titre juste ne prouve pas
 *    l'identité ; le script lit le texte de l'article et refuse celui qui
 *    ne mentionne ni « Perpignan » ni « USAP ».
 * 3. **La licence doit être libre**, et l'image assez grande pour être un
 *    portrait (un drapeau ou un logo de club passerait autrement).
 *
 * ------------------------------------------------------------------------
 * LE RECADRAGE EST UNE HEURISTIQUE, ET IL FAUT LE REGARDER
 *
 * Le site affiche la photo en carré — 160×160 sur la fiche, 80×80 en liste,
 * `object-cover` — quand Commons sert des portraits en pied de 1500×2700.
 * Un recadrage centré donnerait le torse. `sharp.strategy.attention` vise la
 * région la plus saillante, ce qui tombe le plus souvent sur le visage, mais
 * **c'est une heuristique et elle se trompe**. D'où `--planche`, qui écrit
 * une planche contact HTML : le résultat se regarde avant d'être publié.
 *
 * Usage :
 *   npx tsx scripts/fetch-player-photos.ts --dry
 *   npx tsx scripts/fetch-player-photos.ts --images --planche   # sans la base
 *   npx tsx scripts/fetch-player-photos.ts
 *   npx tsx scripts/fetch-player-photos.ts --joueur="Guilhem Guirado" --force
 *   npx tsx scripts/fetch-player-photos.ts --planche
 */
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

/** Nom tel que la base l'écrit → titre de l'article Wikipédia francophone. */
const PORTRAITS: Record<string, string> = {
  "Damien Chouly": "Damien Chouly",
  "Karl Chateau": "Karl Chateau",
  "Tristan Labouteley": "Tristan Labouteley",
  "David Marty": "David Marty",
  "Mathieu Acébès": "Mathieu Acebes",
  "Kisi Pulu": "Kisi Pulu",
  "Enzo Forletta": "Enzo Forletta",
  "Jean Bernard Pujol": "Jean-Bernard Pujol",
  "Guilhem Guirado": "Guilhem Guirado",
  "Joffrey Michel": "Joffrey Michel",
  "Jean-Pierre Pérez": "Jean-Pierre Pérez",
  "Shahn Eru": "Shahn Eru",
  "Jonathan Bousquet": "Jonathan Bousquet",
  "Jérôme Porical": "Jérôme Porical",
  "James Hook": "James Hook (rugby à XV)",
  "Tommaso Allan": "Tommaso Allan",
  "Melvyn Jaminet": "Melvyn Jaminet",
  "Nicolas Laharrague": "Nicolas Laharrague",
  "Enzo Selponi": "Enzo Selponi",
  "David Mélé": "David Mélé",
  "Jake McIntyre": "Jake McIntyre",
};

/**
 * Joueurs de la liste que Wikipédia n'illustre pas, au 2 septembre 2026.
 *
 * Leur article existe pour la plupart, sans photo ; les fiches LNR de leur
 * époque n'en portent pas davantage. Ils sont nommés ici pour que le
 * récapitulatif les compte, plutôt que de les passer sous silence.
 */
const SANS_PORTRAIT = [
  "Alan Brazo",
  "Guillaume Vilaceca",
  "Sadek Deghmache",
  "Genesis Mamea Lemalu",
  "Lucas Dubois",
  "Sione Piukala",
  "Tristan Tedder",
  // Wikipédia l'illustre, mais par un plan large d'un groupe pris de dos —
  // « Lifemi_Mafi_Munster_back.jpg ». Aucun cadrage n'en tire un portrait :
  // l'image ne montre pas le visage du joueur. Écartée délibérément, une
  // absence valant mieux qu'une photo qui n'illustre personne.
  "Lifeimi Mafi",
];

/**
 * Licences acceptées, et elles seules.
 *
 * Le champ `LicenseShortName` de Commons est du texte libre : la
 * comparaison se fait donc sur un préfixe normalisé, et tout ce qui n'y
 * figure pas est refusé — « fair use », « marque déposée » et les licences
 * non commerciales comprises.
 */
const LICENCES_LIBRES = [
  "cc0",
  "cc by",
  "cc by-sa",
  "public domain",
  "fal",
  "gfdl",
];

/**
 * Recadrages posés à la main, quand l'heuristique échoue — en fractions de
 * l'image d'origine : `x` et `y` sont le coin haut-gauche, `cote` la part du
 * plus petit côté. Chaque ligne a été regardée sur la planche contact.
 */
const CADRAGES: Record<string, { x: number; y: number; cote: number }> = {
  // Huit joueurs photographiés de loin, en action ou en pied : la bande
  // supérieure ne suffit pas, le visage y reste minuscule. Coordonnées
  // relevées sur l'original, grille au dixième, le 2 septembre 2026.
  "Karl Chateau": { x: 0.22, y: 0.02, cote: 0.45 },
  "Melvyn Jaminet": { x: 0.32, y: 0.13, cote: 0.32 },
  "Nicolas Laharrague": { x: 0.34, y: 0.047, cote: 0.34 },
  "Jake McIntyre": { x: 0.465, y: 0.115, cote: 0.32 },
  "Jonathan Bousquet": { x: 0.32, y: 0.14, cote: 0.35 },
  "Tristan Labouteley": { x: 0.29, y: 0.065, cote: 0.4 },
  "James Hook": { x: 0.07, y: 0.04, cote: 0.55 },
  "Jean-Pierre Pérez": { x: 0.3, y: 0.074, cote: 0.4 },
};

const DOSSIER = join(process.cwd(), "public", "images", "players");
const CREDITS = join(DOSSIER, "credits.json");
// Hors de `public/`, qui est servi tel quel : la planche est un instrument
// de relecture, pas une page du site.
const PLANCHE = join(process.cwd(), "scripts", ".planche-portraits.html");
const COTE = 400; // 160 px affichés, servis en 2× par next/image
const UA = { "user-agent": "usap-history/1.0 (https://github.com/jeremsrd/usap-history)" };

interface Credit {
  joueur: string;
  fichier: string;
  auteur: string;
  licence: string;
  source: string;
  original: string;
}

async function api(base: string, params: Record<string, string>): Promise<any> {
  const url = new URL(base);
  for (const [k, v] of Object.entries({ format: "json", formatversion: "2", ...params })) {
    url.searchParams.set(k, v);
  }
  const reponse = await fetch(url, { headers: UA });
  if (!reponse.ok) throw new Error(`${reponse.status} sur ${url}`);
  return reponse.json();
}

/** Le HTML des métadonnées Commons : « <a href=…>Nom</a> » et consorts. */
function texte(valeur: any): string {
  return String(valeur?.value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function licenceLibre(licence: string): boolean {
  const n = licence.toLowerCase().replace(/\s+/g, " ").trim();
  return LICENCES_LIBRES.some((forme) => n.startsWith(forme));
}

function slugFichier(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface Trouvaille {
  fichier: string;
  url: string;
  auteur: string;
  licence: string;
  source: string;
  largeur: number;
  hauteur: number;
}

/**
 * Le portrait d'un article, sa licence et son auteur — ou l'explication du
 * refus. Le contrôle « l'article parle-t-il de Perpignan » est fait ici :
 * il porte sur l'identité, pas sur l'image, et doit précéder tout
 * téléchargement.
 */
async function portraitDeLArticle(titre: string): Promise<Trouvaille | string> {
  const page = (
    await api("https://fr.wikipedia.org/w/api.php", {
      action: "query",
      prop: "pageimages|extracts",
      piprop: "name",
      explaintext: "1",
      exsectionformat: "plain",
      titles: titre,
      redirects: "1",
    })
  )?.query?.pages?.[0];

  if (!page || page.missing) return `article « ${titre} » introuvable`;

  const extrait = String(page.extract ?? "");
  if (!/perpignan|usap/i.test(extrait)) {
    return `l'article « ${page.title} » ne mentionne ni Perpignan ni l'USAP`;
  }
  if (!page.pageimage) return `l'article « ${page.title} » n'a pas d'illustration`;

  const info = (
    await api("https://commons.wikimedia.org/w/api.php", {
      action: "query",
      prop: "imageinfo",
      iiprop: "extmetadata|size|url",
      titles: `File:${page.pageimage}`,
    })
  )?.query?.pages?.[0]?.imageinfo?.[0];

  if (!info) return `« ${page.pageimage} » n'est pas sur Commons`;

  const meta = info.extmetadata ?? {};
  const licence = texte(meta.LicenseShortName) || "inconnue";
  if (!licenceLibre(licence)) return `licence refusée : ${licence}`;
  if (info.width < 300) return `image trop petite (${info.width}×${info.height}), sans doute pas un portrait`;

  return {
    fichier: page.pageimage,
    // L'URL rendue par l'API porte des paramètres de suivi : on la nettoie.
    url: String(info.url).split("?")[0],
    auteur: texte(meta.Artist) || "auteur non indiqué",
    licence,
    source: info.descriptionurl,
    largeur: info.width,
    hauteur: info.height,
  };
}

/**
 * Carré de `COTE` pixels, cadré sur le visage autant que faire se peut.
 *
 * `sharp.strategy.attention` seule ne suffit pas, et l'essai du 2 septembre
 * 2026 le montre sans appel : sur les 22 portraits, elle a rendu le torse de
 * Jean-Bernard Pujol et de David Mélé — tête coupée —, les jambes de Kisi
 * Pulu, une mêlée sans visage pour Jean-Pierre Pérez et Tristan Labouteley,
 * et une tribune pour Lifeimi Mafi. Elle vise le contraste, non le visage,
 * et un maillot vif l'emporte sur une figure.
 *
 * D'où le procédé en deux temps. Sur une photo **plus haute que large** —
 * un portrait en pied, le cas de Commons —, on ne garde d'abord que la
 * **bande supérieure**, où la tête se trouve nécessairement ; l'attention ne
 * choisit plus ensuite que le cadrage **horizontal**, ce qu'elle fait bien.
 * Sur une photo carrée ou en largeur, où rien ne dit où est le sujet, elle
 * garde la main sur les deux axes.
 *
 * `HAUT` vaut 0,55 : plus bas, la tête d'un joueur photographié de loin
 * sortait du cadre ; plus haut, le torse revenait.
 *
 * **Cela reste une heuristique**, et c'est pourquoi `CADRAGES` existe et que
 * la planche contact n'est pas facultative.
 */
const HAUT = 0.55;

async function enCarre(donnees: Buffer, nom: string): Promise<Buffer> {
  const main = CADRAGES[nom];
  let image = sharp(donnees);
  const { width = 0, height = 0 } = await image.metadata();

  if (main) {
    // Recadrage vérifié à la main, en fractions de l'image d'origine.
    const cote = Math.round(Math.min(width, height) * main.cote);
    image = sharp(donnees).extract({
      left: Math.max(0, Math.min(width - cote, Math.round(width * main.x))),
      top: Math.max(0, Math.min(height - cote, Math.round(height * main.y))),
      width: cote,
      height: cote,
    });
  } else if (height > width) {
    const bande = Math.max(Math.round(height * HAUT), width);
    image = sharp(donnees).extract({ left: 0, top: 0, width, height: Math.min(bande, height) });
  }

  return image
    .resize(COTE, COTE, { fit: "cover", position: sharp.strategy.attention })
    .webp({ quality: 82 })
    .toBuffer();
}

async function main() {
  const args = process.argv.slice(2);
  const simulation = args.includes("--dry");
  const force = args.includes("--force");
  const planche = args.includes("--planche");
  // Les images et les crédits, sans toucher à `photoUrl` : le recadrage est
  // une heuristique, et `DATABASE_URL` pointe sur la production.
  const imagesSeules = args.includes("--images");
  const seul = args.find((a) => a.startsWith("--joueur="))?.split("=")[1];

  mkdirSync(DOSSIER, { recursive: true });
  const credits: Record<string, Credit> = existsSync(CREDITS)
    ? JSON.parse(readFileSync(CREDITS, "utf8"))
    : {};

  const cibles = Object.entries(PORTRAITS).filter(([nom]) => !seul || nom === seul);
  if (seul && !cibles.length) {
    throw new Error(`« ${seul} » ne figure pas dans PORTRAITS`);
  }

  let ecrits = 0;
  let sautes = 0;
  const refuses: string[] = [];

  for (const [nom, titre] of cibles) {
    // La fiche, retrouvée sur le nom complet : la base sépare prénom et nom
    // à des endroits variables (« Jean Bernard Pujol »).
    const candidats = await prisma.player.findMany({
      where: { lastName: { contains: nom.split(" ").pop()!, mode: "insensitive" } },
      select: { id: true, firstName: true, lastName: true, slug: true, photoUrl: true },
    });
    const fiches = candidats.filter(
      (c) => `${c.firstName} ${c.lastName}`.toLowerCase() === nom.toLowerCase(),
    );
    if (fiches.length !== 1) {
      refuses.push(`${nom} — ${fiches.length} fiche(s) en base, il en faut une`);
      continue;
    }
    const fiche = fiches[0];

    const cible = `${slugFichier(nom)}.webp`;
    if (fiche.photoUrl && !force) {
      sautes++;
      console.log(`  ·  ${nom.padEnd(24)} déjà illustré`);
      continue;
    }

    const trouve = await portraitDeLArticle(titre);
    if (typeof trouve === "string") {
      refuses.push(`${nom} — ${trouve}`);
      continue;
    }

    const brut = Buffer.from(await (await fetch(trouve.url, { headers: UA })).arrayBuffer());
    const carre = await enCarre(brut, nom);

    console.log(
      `  ${simulation ? "≈" : "✔"}  ${nom.padEnd(24)} ${String(trouve.largeur + "×" + trouve.hauteur).padEnd(11)} ` +
        `${Math.round(carre.length / 1024)} Ko  ${trouve.licence.padEnd(14)} ${trouve.auteur.slice(0, 30)}`,
    );

    credits[cible] = {
      joueur: nom,
      fichier: trouve.fichier,
      auteur: trouve.auteur,
      licence: trouve.licence,
      source: trouve.source,
      original: trouve.url,
    };

    if (!simulation) {
      writeFileSync(join(DOSSIER, cible), carre);
      if (!imagesSeules) {
        await prisma.player.update({
          where: { id: fiche.id },
          data: { photoUrl: `/images/players/${cible}` },
        });
      }
    }
    ecrits++;
    await new Promise((r) => setTimeout(r, 300));
  }

  if (!simulation && ecrits) {
    // Un portrait écarté après coup — Lifeimi Mafi — laisserait sinon son
    // crédit derrière lui, et la fiche joueur créditerait une image absente.
    for (const fichier of Object.keys(credits)) {
      if (!existsSync(join(DOSSIER, fichier))) delete credits[fichier];
    }
    writeFileSync(CREDITS, JSON.stringify(credits, null, 2) + "\n");
  }

  if (planche) ecrirePlanche(credits);

  console.log(
    `\n${simulation ? "Simulation" : imagesSeules ? "Images écrites, base intacte" : "Écrit"} : ${ecrits} portrait(s), ${sautes} déjà illustré(s), ` +
      `${refuses.length} refusé(s), ${SANS_PORTRAIT.length} sans source connue.`,
  );
  for (const r of refuses) console.log(`  ✗  ${r}`);
  for (const n of SANS_PORTRAIT) console.log(`  –  ${n} — aucune photo libre trouvée`);

  await prisma.$disconnect();
}

/** Planche contact : le recadrage automatique se juge à l'œil, pas au log. */
function ecrirePlanche(credits: Record<string, Credit>) {
  const cases = Object.entries(credits)
    .map(
      ([fichier, c]) => `<figure>
    <img src="../public/images/players/${fichier}" width="160" height="160" alt="${c.joueur}">
    <figcaption><b>${c.joueur}</b><br>${c.auteur} — ${c.licence}</figcaption>
  </figure>`,
    )
    .join("\n  ");
  writeFileSync(
    PLANCHE,
    `<meta charset="utf-8"><title>Portraits — planche contact</title>
<style>
  body{font:14px system-ui;margin:2rem;background:#111;color:#eee}
  h1{font-size:1.2rem;text-transform:uppercase;letter-spacing:.1em;color:#C8102E}
  div{display:flex;flex-wrap:wrap;gap:1.2rem}
  figure{margin:0;width:160px}
  img{border-radius:.5rem;display:block;object-fit:cover}
  figcaption{font-size:11px;line-height:1.35;margin-top:.4rem;color:#aaa}
  b{color:#eee}
</style>
<h1>Portraits — vérifier le cadrage</h1>
<div>
  ${cases}
</div>
`,
  );
  console.log(`\nPlanche contact : scripts/.planche-portraits.html`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

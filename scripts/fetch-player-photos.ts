/**
 * Portraits des joueurs de l'USAP — moisson, redimensionnement, crédits.
 *
 * ------------------------------------------------------------------------
 * DEUX SOURCES, ET C'EST L'ÉPOQUE DU JOUEUR QUI TRANCHE
 *
 * **La LNR pour l'effectif actuel.** Elle sert des portraits officiels
 * standardisés — `cdn.lnr.fr/joueur/{id}-{slug}/photo/photoFull.{empreinte}`,
 * 800×1200 en WebP, buste détouré sur fond transparent — et c'est la source
 * officielle du projet. Le joueur y porte le maillot de la saison.
 *
 * **Mais elle ne les conserve que pour les joueurs récents**, et c'est
 * vérifié : les fiches de la feuille Perpignan-Toulon du 25 août 2012 —
 * Nicolas Mas, Alasdair Strokosch, Jérémy Castex, Romain Terrain — ne
 * portent aucune image, quand celles de la J1 de 2025-2026 en portent
 * toutes. Or les joueurs les plus capés de la base sont précisément les
 * anciens : pour eux, la LNR ne peut rien.
 *
 * ------------------------------------------------------------------------
 * D'OÙ WIKIMEDIA COMMONS POUR LES ANCIENS, ET CE QUE CE CHOIX SUPPOSE
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
 * ------------------------------------------------------------------------
 * ET LES DROITS NE SONT PAS LES MÊMES DES DEUX CÔTÉS
 *
 * Commons donne une licence libre, la LNR non : ses portraits sont son bien,
 * et les afficher relève du même arbitrage que les écussons de club — un
 * usage d'usage sur un site d'histoire non commercial, qui appartient au
 * propriétaire du site. `credits.json` le dit en toutes lettres plutôt que
 * de le taire, et la fiche joueur affiche la mention.
 *
 * Usage :
 *   npx tsx scripts/fetch-player-photos.ts --dry
 *   npx tsx scripts/fetch-player-photos.ts             # les deux sources
 *   npx tsx scripts/fetch-player-photos.ts --effectif  # la LNR seule
 *   npx tsx scripts/fetch-player-photos.ts --commons   # Commons seul
 *   npx tsx scripts/fetch-player-photos.ts --images --planche   # sans la base
 *   npx tsx scripts/fetch-player-photos.ts --joueur="Guilhem Guirado" --force
 */
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { createHash } from "crypto";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { lireEffectif, utiliserDivision, type LnrEffectifJoueur } from "./lib/lnr";
import { apparierEffectif } from "./lib/effectif";

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
  // Trois recrues de 2026-2027 que la LNR n'a pas encore photographiées.
  "Sevu Reece": "Sevu Reece",
  "Braydon Ennor": "Braydon Ennor",
  "Marco Riccioni": "Marco Riccioni",
};

/**
 * Joueurs dispensés du garde-fou « l'article parle de Perpignan », parce
 * qu'une **recrue toute fraîche** n'y est pas encore : Wikipédia met des
 * semaines à enregistrer un transfert, et refuser sur ce motif reviendrait à
 * n'illustrer que les joueurs installés.
 *
 * LA DISPENSE NE VAUT QUE PARCE QUE L'IDENTITÉ EST ÉTABLIE AUTREMENT, et
 * chaque ligne est une affirmation vérifiée à la main. Marco Riccioni : la
 * LNR l'inscrit à Perpignan en 1ère ligne, l'article décrit un pilier droit
 * international italien né en 1997, alors aux Saracens — même nom, même
 * poste, et il n'existe pas d'autre joueur de rugby de ce nom. L'article est
 * en retard, pas faux.
 */
const ARTICLES_HORS_PERPIGNAN = new Set(["Marco Riccioni"]);

/**
 * Anciens que Wikipédia n'illustre pas, au 2 septembre 2026.
 *
 * Leur article existe pour la plupart, sans photo ; les fiches LNR de leur
 * époque n'en portent pas davantage. Ils sont nommés ici pour que le
 * récapitulatif les compte, plutôt que de les passer sous silence.
 *
 * **N'y inscrire qu'un joueur hors de l'effectif.** Lucas Dubois et Tristan
 * Tedder y ont figuré une journée, avant que la moisson LNR ne les serve :
 * un joueur en activité à l'USAP a son portrait officiel, c'est la source
 * qu'il faut interroger avant de déclarer une lacune.
 */
const SANS_PORTRAIT = [
  "Alan Brazo",
  "Guillaume Vilaceca",
  "Sadek Deghmache",
  "Genesis Mamea Lemalu",
  "Sione Piukala",
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

/**
 * LE PLACEHOLDER DE LA LNR, ET IL FAUT LE RECONNAÎTRE.
 *
 * Quand un joueur n'a pas encore été photographié, son CDN ne rend pas une
 * erreur : il rend une **silhouette grise** de 237×335 pixels, 5 730 octets,
 * sous l'URL normale de son portrait. C'est le même piège que le bouclier
 * gris des écussons — enregistré sans contrôle, il aurait donné huit fiches
 * illustrées d'une ombre.
 *
 * Le 2 septembre 2026, huit des cinquante joueurs de l'effectif étaient dans
 * ce cas, tous des recrues : Riccioni, Amituanai, Taty, McGrath, Reece,
 * Kubunakaravi, Ennor, Mascarenc. Les quarante-deux autres portraits ont
 * chacun une empreinte distincte — le contrôle ne rejette donc rien de bon.
 */
const PLACEHOLDER_LNR = "60a0c0dc2df281db65ad3183dc7aa79ea1ee0d14bb583ff0d0cbc086cf5fd406";

/**
 * Part de la largeur du buste que le carré retient. 0,62 laisse le visage
 * dominant et le col visible ; à 0,55 le crâne frôle le bord, à 0,70 la tête
 * se perd dans les épaules.
 */
const PART_DU_BUSTE = 0.62;

/**
 * Carré cadré sur le visage d'un portrait officiel de la LNR.
 *
 * **CES IMAGES SONT DÉTOURÉES**, et c'est ce qui permet de se passer
 * d'heuristique : le canal alpha donne la boîte exacte du buste. On rogne
 * dessus, puis on prend un carré en haut, centré — sur un buste, la tête est
 * en haut et au milieu, c'est une propriété de l'anatomie, pas une
 * supposition sur l'image.
 *
 * UN CADRAGE EN FRACTIONS FIXES NE SUFFISAIT PAS, et le contre-exemple est
 * net : le gabarit de la LNR **n'est pas uniforme d'un club à l'autre**.
 * Les portraits pris à Perpignan cadrent le buste serré, celui de Benjamin
 * Urdapilleta — repris de Clermont, comme sept autres recrues qui posent
 * encore sous leur ancien maillot — recule d'un bon tiers. Les fractions
 * calées sur le premier lot lui prenaient le vide au-dessus de la tête. Le
 * détourage, lui, dit où est l'homme quel que soit le lot.
 *
 * Repli sur l'heuristique générale si le rognage ne donne rien d'exploitable
 * — une image sans transparence, que `trim()` laisserait intacte.
 */
async function enCarreLnr(donnees: Buffer, nom: string): Promise<Buffer> {
  try {
    const rogne = await sharp(donnees).trim({ threshold: 1 }).png().toBuffer();
    const { width = 0, height = 0 } = await sharp(rogne).metadata();
    const cote = Math.min(Math.round(width * PART_DU_BUSTE), height);
    if (cote < 200 || height < width) throw new Error("rognage inexploitable");
    return sharp(rogne)
      .extract({ left: Math.round((width - cote) / 2), top: 0, width: cote, height: cote })
      .resize(COTE, COTE)
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return enCarre(donnees, nom);
  }
}

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
async function portraitDeLArticle(
  titre: string,
  dispense = false,
): Promise<Trouvaille | string> {
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
  if (!dispense && !/perpignan|usap/i.test(extrait)) {
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

/**
 * Le portrait officiel d'un joueur sur sa fiche LNR, ou l'explication du
 * refus.
 *
 * La fiche est du HTML ordinaire, sans JSON embarqué : les images du CDN s'y
 * lisent en clair. On ne retient que celles dont l'URL porte l'identifiant
 * **de ce joueur** — la page affiche aussi les vignettes de ses coéquipiers,
 * et les prendre pour les siennes donnerait le visage d'un autre.
 */
async function portraitLnr(
  joueur: LnrEffectifJoueur,
): Promise<{ url: string; donnees: Buffer; largeur: number; hauteur: number } | string> {
  const fiche = `https://top14.lnr.fr/joueur/${joueur.id}-${joueur.slug}`;
  const html = await (await fetch(fiche, { headers: UA })).text();
  const siennes = [
    ...new Set(
      [...html.matchAll(/https:\\?\/\\?\/cdn\.lnr\.fr\/joueur\/[^"'\s]+/g)].map((m) =>
        m[0].replace(/\\/g, ""),
      ),
    ),
  ].filter((u) => u.includes(`${joueur.id}-${joueur.slug}/`));

  const url =
    siennes.find((u) => /\/photoFull\./.test(u)) ??
    siennes.find((u) => /\/photoPortrait\./.test(u));
  if (!url) return "aucune image sur sa fiche LNR";

  const reponse = await fetch(url, { headers: UA });
  if (!reponse.ok) return `${reponse.status} sur ${url}`;
  const donnees = Buffer.from(await reponse.arrayBuffer());

  if (createHash("sha256").update(donnees).digest("hex") === PLACEHOLDER_LNR) {
    return "la LNR n'a que sa silhouette grise";
  }
  const { width = 0, height = 0 } = await sharp(donnees).metadata();
  if (width < 300) return `image trop petite (${width}×${height})`;

  return { url, donnees, largeur: width, hauteur: height };
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
  // Sans précision, les deux sources : la LNR pour l'effectif, Commons pour
  // les anciens. Chacune se demande seule.
  const queCommons = args.includes("--commons");
  const queEffectif = args.includes("--effectif");

  mkdirSync(DOSSIER, { recursive: true });
  const credits: Record<string, Credit> = existsSync(CREDITS)
    ? JSON.parse(readFileSync(CREDITS, "utf8"))
    : {};

  let ecrits = 0;
  let sautes = 0;
  const refuses: string[] = [];
  const remplacables: string[] = [];
  // Un joueur que la LNR n'illustre pas et que Commons rattrape ne doit pas
  // rester au relevé des refus : les deux sources passent l'une après
  // l'autre, et c'est le résultat final qui compte.
  const servis = new Set<string>();

  // ---- L'effectif actuel, depuis la LNR --------------------------------
  if (!queCommons) {
    utiliserDivision("top14");
    const effectif = await lireEffectif("perpignan");
    const fiches = await prisma.player.findMany({
      select: { id: true, firstName: true, lastName: true, photoUrl: true },
    });
    const { lies, aCreer, douteux, ambigus } = apparierEffectif(effectif, fiches);

    // On ne devine jamais une identité : un joueur qu'on ne sait pas
    // rattacher n'a pas de portrait, et il est nommé.
    for (const { joueur, candidats } of ambigus) {
      refuses.push(
        `${joueur.prenoms} ${joueur.nom} — plusieurs fiches : ` +
          candidats.map((c) => `${c.firstName} ${c.lastName}`).join(" / "),
      );
    }
    for (const { joueur } of douteux) {
      refuses.push(`${joueur.prenoms} ${joueur.nom} — le prénom ne suit pas le patronyme`);
    }
    for (const joueur of aCreer) {
      refuses.push(`${joueur.prenoms} ${joueur.nom} — aucune fiche en base`);
    }

    console.log(`=== Effectif — ${lies.size} joueurs rattachés sur ${effectif.length} ===\n`);

    for (const [ficheId, joueur] of lies) {
      const fiche = fiches.find((f) => f.id === ficheId)!;
      const nom = `${fiche.firstName} ${fiche.lastName}`;
      if (seul && nom !== seul) continue;

      if (fiche.photoUrl && !force) {
        sautes++;
        if (!fiche.photoUrl.startsWith("/images/players/")) remplacables.push(nom);
        console.log(`  ·  ${nom.padEnd(28)} déjà illustré`);
        continue;
      }

      const trouve = await portraitLnr(joueur);
      if (typeof trouve === "string") {
        refuses.push(`${nom} — ${trouve}`);
        continue;
      }

      const cible = `${slugFichier(nom)}.webp`;
      const carre = await enCarreLnr(trouve.donnees, nom);
      console.log(
        `  ${simulation ? "≈" : "✔"}  ${nom.padEnd(28)} ${(trouve.largeur + "×" + trouve.hauteur).padEnd(11)} ` +
          `${Math.round(carre.length / 1024)} Ko  LNR`,
      );

      credits[cible] = {
        joueur: nom,
        fichier: `${joueur.id}-${joueur.slug}`,
        auteur: "Ligue nationale de rugby",
        licence: "© LNR, tous droits réservés",
        source: `https://top14.lnr.fr/joueur/${joueur.id}-${joueur.slug}`,
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
      servis.add(nom);
      ecrits++;
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // ---- Les anciens, depuis Wikimedia Commons ----------------------------
  const cibles = queEffectif
    ? []
    : Object.entries(PORTRAITS).filter(([nom]) => !seul || nom === seul);
  if (seul && !queEffectif && !cibles.length) {
    throw new Error(`« ${seul} » ne figure pas dans PORTRAITS`);
  }
  if (cibles.length) console.log(`\n=== Anciens — Wikimedia Commons ===\n`);

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

    const trouve = await portraitDeLArticle(titre, ARTICLES_HORS_PERPIGNAN.has(nom));
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
    servis.add(nom);
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
      `${refuses.filter((r) => !servis.has(r.split(" — ")[0])).length} refusé(s), ` +
      `${queEffectif ? 0 : SANS_PORTRAIT.length} sans source connue.`,
  );
  const restants = refuses.filter((r) => !servis.has(r.split(" — ")[0]));
  for (const r of restants) console.log(`  ✗  ${r}`);
  if (!queEffectif) {
    for (const n of SANS_PORTRAIT) console.log(`  –  ${n} — aucune photo libre trouvée`);
  }
  // Une photo d'une autre provenance sur un joueur que la LNR illustre : le
  // script ne tranche pas, il le dit. `--force` remplacerait.
  for (const n of remplacables) {
    console.log(`  ?  ${n} — photo hébergée ailleurs, la LNR en a une`);
  }

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

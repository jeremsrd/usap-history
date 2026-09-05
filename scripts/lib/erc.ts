/**
 * Lecture des comptes rendus de l'ERC — l'organisateur des coupes d'Europe
 * jusqu'en 2014, prédécesseur de l'EPCR — tels que la Wayback Machine les a
 * conservés.
 *
 * **C'est la source officielle de ces années-là**, et elle donne ce qu'ESPN
 * n'a pas : les deux compositions numérotées de 1 à 22 avec capitaines,
 * cartons et entrées-sorties, les réalisations par joueur, l'essai de
 * pénalité, l'affluence, le stade. Le site `ercrugby.com` a disparu avec
 * l'ERC ; l'archive en garde des milliers de pages, à condition d'y aller
 * doucement — **elle a refusé toute connexion** le 5 septembre 2026 après une
 * centaine de requêtes rapprochées. D'où quatre secondes entre deux pages, et
 * un cache sur disque : une page archivée ne change plus.
 *
 * Deux formats, selon l'époque du site :
 *
 *   - **2007-2008, les comptes rendus `eng/12_NNNN.php`** : une table
 *     `matchteams` où chaque ligne porte un joueur de chaque camp sous le
 *     même numéro — le recevant à gauche avec ses colonnes P D C T, le
 *     visiteur à droite avec T C D P —, les remplaçants sous un intertitre,
 *     et une dernière ligne « Penalty Tries » avec un compte par camp. Le
 *     capitaine est marqué « (capt) », les cartons et les changements par des
 *     icônes. **La page est en latin-1**, et se décode comme telle : lue en
 *     UTF-8, elle perd ses accents — « Jrme Porical » pour Jérôme ;
 *   - **2010-2013, les pages `eng/matchcentre/NNNNN.php`** : mi-temps,
 *     affluence, arbitre et juges de touche, une chronologie minutée des
 *     réalisations, et les deux listes de 1 à 23 avec T C D P par joueur.
 *     Le lecteur de ce format n'est pas encore écrit ; les pages sont en
 *     UTF-8.
 *
 * **Une page a une identité stable, mais un contenu qui change** : la même
 * adresse est d'abord une présentation d'avant-match, sans composition, puis
 * le compte rendu. Il faut donc demander un instantané **postérieur** à la
 * rencontre, et l'archive répond par le plus proche.
 *
 * Ce que le compte rendu de 2007-2008 ne donne pas : la mi-temps — dans la
 * prose seulement —, l'arbitre, et les minutes des changements et des
 * cartons. Ils restent à `null`.
 */

import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { EspnEquipe, EspnJoueur } from "./espn";

const RACINE = "http://www.ercrugby.com/eng/";
const ARCHIVE = "http://web.archive.org/web/";
const CACHE = join(process.cwd(), "node_modules", ".cache", "usap-erc");
const PAUSE_MS = 4000;

let derniereRequete = 0;

/**
 * La page archivée, telle que l'archive la sert (`id_` : sans son bandeau ni
 * ses réécritures d'adresses), au plus près de l'instantané demandé.
 */
export async function lirePageArchivee(page: string, instantane: string): Promise<Buffer> {
  mkdirSync(CACHE, { recursive: true });
  const fichier = join(CACHE, `${instantane}-${page.replace(/[^\w.-]/g, "_")}`);
  if (existsSync(fichier)) return readFileSync(fichier);

  const url = `${ARCHIVE}${instantane}id_/${RACINE}${page}`;
  let derniere = "";
  for (let essai = 1; essai <= 4; essai++) {
    const attente = Math.max(0, derniereRequete + PAUSE_MS - Date.now());
    if (attente > 0) await new Promise((r) => setTimeout(r, attente));
    derniereRequete = Date.now();
    try {
      const reponse = await fetch(url, {
        headers: { "User-Agent": "usap-history (lecture d'archives, une requête toutes les quatre secondes)" },
        signal: AbortSignal.timeout(120_000),
        redirect: "follow",
      });
      if (reponse.ok) {
        const corps = Buffer.from(await reponse.arrayBuffer());
        // La page « Wayback Machine » de 4 Ko est un 404 déguisé.
        if (corps.length > 5000) {
          writeFileSync(fichier, corps);
          return corps;
        }
        derniere = "page absente de l'archive";
        break;
      }
      derniere = `HTTP ${reponse.status}`;
    } catch (e) {
      derniere = e instanceof Error ? e.message : String(e);
    }
    console.log(`  ↻ archive : ${page}, nouvel essai dans ${10 * essai} s (${derniere})`);
    await new Promise((r) => setTimeout(r, 10_000 * essai));
  }
  throw new Error(`Archive ERC injoignable : ${page} @ ${instantane} (${derniere})`);
}

export interface ErcMatch {
  titre: string;
  stade: string | null;
  affluence: number | null;
  domicile: EspnEquipe;
  exterieur: EspnEquipe;
}

function texte(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function nombre(cellule: string): number {
  const t = texte(cellule);
  return t === "" ? 0 : Number(t);
}

/** « Rimas&nbsp;Alvarez Kairelis (capt) » → prénom, nom, brassard. */
function separerNom(cellule: string): { firstName: string; lastName: string; isCaptain: boolean } {
  const brut = cellule.replace(/<[^>]+>/g, "").trim();
  const isCaptain = /\(capt\)/i.test(brut);
  const sansBrassard = brut.replace(/\s*\(capt\)\s*/i, " ").trim();
  // L'espace insécable sépare le prénom du nom ; à défaut, le dernier mot fait le nom.
  const [prenom, ...reste] = sansBrassard.includes("&nbsp;")
    ? sansBrassard.split("&nbsp;")
    : [sansBrassard.split(/\s+/).slice(0, -1).join(" "), sansBrassard.split(/\s+/).slice(-1)[0]];
  return {
    firstName: texte(prenom ?? ""),
    lastName: texte(reste.join(" ")),
    isCaptain,
  };
}

/**
 * Le compte rendu de 2007-2008 : équipes, score, affluence, stade, et les
 * deux compositions avec leurs réalisations. Lève si la page n'a pas de
 * composition — c'est alors la présentation d'avant-match.
 */
export function lireCompteRendu2007(brut: Buffer): ErcMatch {
  const html = brut.toString("latin1");
  const titre = texte(/<title>(.*?)<\/title>/s.exec(html)?.[1] ?? "").replace(/^European Rugby Cup\s*:\s*/, "");

  const table = [...html.matchAll(/<table[^>]*>[\s\S]*?<\/table>/g)]
    .map((m) => m[0])
    .find((t) => t.includes('class="player"'));
  if (!table) throw new Error(`${titre} : aucune composition sur la page`);

  const equipes = [...table.matchAll(/<td class="teams"[^>]*>(.*?)<\/td>/gs)].map((m) => texte(m[1]));
  if (equipes.length !== 2) throw new Error(`${titre} : ${equipes.length} équipe(s) en tête de table`);
  const [nomDomicile, nomExterieur] = equipes;

  const domicile: EspnJoueur[] = [];
  const exterieur: EspnJoueur[] = [];
  for (const [, ligne] of table.matchAll(/<tr class="player">([\s\S]*?)<\/tr>/g)) {
    const cellules = [...ligne.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    if (cellules.length !== 15) throw new Error(`${titre} : ligne de composition à ${cellules.length} cellules`);
    // [0] icônes A, [1] P, [2] D, [3] C, [4] T, [5] poste A, [6] nom A, [7] numéro,
    // [8] nom B, [9] poste B, [10] T, [11] C, [12] D, [13] P, [14] icônes B
    const numero = nombre(cellules[7]);
    const cartons = (c: string) => ({
      jaunes: (c.match(/yellow\.gif/g) ?? []).length,
      rouges: (c.match(/red\.gif/g) ?? []).length,
    });
    const faire = (nom: string, t: number, c: number, d: number, p: number, icones: string): EspnJoueur => ({
      id: 0,
      ...separerNom(nom),
      numero,
      isStarter: numero <= 15,
      posteEspn: null,
      essais: t,
      transformations: c,
      drops: d,
      penalites: p,
      points: 5 * t + 2 * c + 3 * d + 3 * p,
      ...cartons(icones),
    });
    if (texte(cellules[6])) {
      domicile.push(faire(cellules[6], nombre(cellules[4]), nombre(cellules[3]), nombre(cellules[2]), nombre(cellules[1]), cellules[0]));
    }
    if (texte(cellules[8])) {
      exterieur.push(faire(cellules[8], nombre(cellules[10]), nombre(cellules[11]), nombre(cellules[12]), nombre(cellules[13]), cellules[14]));
    }
  }

  const penaltyTries = [...table.matchAll(/class="penaltytries"[^>]*>(.*?)<\/td>/gs)].map((m) => nombre(m[1]));

  // « Perpignan 45 - 25 Benetton Treviso Stade Aime Giral, Perpignan Att: 8,200 »
  const corps = texte(html);
  const score = new RegExp(`${echapper(nomDomicile)}\\s+(\\d+)\\s*-\\s*(\\d+)\\s+${echapper(nomExterieur)}\\s+(.*?)\\s+Att:\\s*([\\d,]+)`).exec(corps);
  const stade = score?.[3]?.trim() || null;
  const affluence = score ? Number(score[4].replace(/,/g, "")) : null;

  const equipe = (nom: string, joueurs: EspnJoueur[], scoreEquipe: string | undefined, ep: number | undefined): EspnEquipe => ({
    id: 0,
    nom,
    score: scoreEquipe != null ? Number(scoreEquipe) : null,
    miTemps: null,
    essaisSansAuteur: ep ?? 0,
    joueurs: joueurs.sort((a, b) => a.numero - b.numero),
  });
  return {
    titre,
    stade,
    affluence,
    domicile: equipe(nomDomicile, domicile, score?.[1], penaltyTries[0]),
    exterieur: equipe(nomExterieur, exterieur, score?.[2], penaltyTries[1]),
  };
}

function echapper(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

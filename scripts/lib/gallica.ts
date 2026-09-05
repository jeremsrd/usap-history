/**
 * Lecture de la presse numérisée de Gallica (BnF), pour les rencontres
 * d'avant-guerre qu'aucune feuille de match ne documente.
 *
 * **CE N'EST PAS UNE FEUILLE, C'EST UN JOURNAL.** Ce que le projet en tire
 * vient du corps d'un article — « Les équipes se présentèrent comme suit »,
 * puis deux XV par lignes —, lu par un OCR qui abîme les noms propres :
 * *L'Auto* du 4 mai 1925 écrit « Raruis » pour Ramis, « Hi.bère » pour
 * Ribère, « 1\Iontade » pour Montade. Rien de ce qui sort d'ici ne vaut
 * donc une donnée, tant qu'un humain ne l'a pas relu sur l'image : ce
 * module **propose**, et c'est au script appelant de le dire, et de ne
 * rien écrire tant que la base ne sait pas porter « d'après *L'Auto* du
 * 4 mai 1925, relu par Jérémy » — le troisième état dont CLAUDE.md,
 * « Remonter avant 2006 », dit le manque.
 *
 * **Ce qu'un numéro du lendemain donne, quand son OCR est bon**, vérifié
 * le 6 septembre 2026 sur les finales gagnées :
 *   - 1925, page 5 : les deux XV, arrière, trois-quarts, demis, troisième,
 *     deuxième et première ligne, le capitaine « (cap.) », l'arbitre
 *     « M. Vigné, qui arbitra », le marqueur ;
 *   - 1914, page 3 : une chronologie à l'heure de l'horloge — « 4 h. 40 :
 *     essai pour Perpignan, 4 h. 41 : but par Giral » ;
 *   - 1938, page 8 : la mi-temps dans le titre, « 11 à 6 (5-6) » — et le
 *     corps entièrement « [texte illisible] » : l'OCR peut manquer tout à
 *     fait, et un numéro n'est pas une source tant qu'on ne l'a pas lu.
 *
 * **Par où passer.** Trois services, tous sans clé :
 *   - `ark:/12148/{cb}/date{AAAAMMJJ}` redirige vers le fascicule du jour,
 *     un `bpt6k…` — ou vers un calendrier quand il n'y en a pas ;
 *   - `services/ContentSearch?ark=&query=` dit sur quelles pages un mot
 *     figure, avec un extrait ;
 *   - `RequestDigitalElement?O={ark}&E=ALTO&Deb={page}` rend l'OCR d'une
 *     page en ALTO, mot à mot avec ses coordonnées et ses césures.
 *   `texteBrut`, lui, est derrière un contrôle de sécurité qu'un script ne
 *   passe pas : ne pas s'y fier.
 *
 * **GALLICA PLAFONNE DUREMENT** : 429 « Trop de requêtes » dès la cinquième
 * page ALTO rapprochée, le 6 septembre 2026. D'où trente secondes entre
 * deux requêtes, un cache sur disque, et une reprise patiente sur 429.
 */

import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RACINE = "https://gallica.bnf.fr";
const CACHE = join(process.cwd(), "node_modules", ".cache", "usap-gallica");
const PAUSE_MS = 30_000;
const UA = "usap-history (lecture d'archives, une requête toutes les trente secondes)";

/** Les périodiques connus, par leur notice. */
export const PERIODIQUES = {
  "L'Auto": "cb327071375",
  "Midi olympique": "cb34413999x",
} as const;

export type Periodique = keyof typeof PERIODIQUES;

let derniereRequete = 0;

async function attendreSonTour(): Promise<void> {
  const attente = Math.max(0, derniereRequete + PAUSE_MS - Date.now());
  if (attente > 0) await new Promise((r) => setTimeout(r, attente));
  derniereRequete = Date.now();
}

/**
 * Une ressource, en cache si elle y est, sinon après son tour de parole.
 * Un 429 vaut une minute d'attente par essai, jamais moins.
 */
async function lire(url: string, cle: string, redirection: "follow" | "manual" = "follow"): Promise<{ corps: string; url: string }> {
  mkdirSync(CACHE, { recursive: true });
  const fichier = join(CACHE, cle);
  if (existsSync(fichier)) {
    const contenu = readFileSync(fichier, "utf8");
    // Une redirection mise en cache ne porte que l'adresse d'arrivée.
    return redirection === "manual" ? { corps: "", url: contenu } : { corps: contenu, url };
  }
  let derniere = "";
  for (let essai = 1; essai <= 4; essai++) {
    await attendreSonTour();
    try {
      const reponse = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(120_000),
        redirect: redirection,
      });
      if (redirection === "manual" && reponse.status >= 300 && reponse.status < 400) {
        const vers = new URL(reponse.headers.get("location") ?? "", url).toString();
        writeFileSync(fichier, vers);
        return { corps: "", url: vers };
      }
      if (reponse.ok) {
        const corps = await reponse.text();
        if (/Trop de requ|Too Many Requests/.test(corps.slice(0, 200))) {
          derniere = "429 dans le corps";
        } else {
          writeFileSync(fichier, corps);
          return { corps, url: reponse.url || url };
        }
      } else {
        derniere = `HTTP ${reponse.status}`;
      }
    } catch (e) {
      derniere = e instanceof Error ? e.message : String(e);
    }
    console.log(`  ↻ gallica : ${cle}, nouvel essai dans ${60 * essai} s (${derniere})`);
    await new Promise((r) => setTimeout(r, 60_000 * essai));
  }
  throw new Error(`Gallica injoignable : ${url} (${derniere})`);
}

/**
 * Le fascicule paru un jour donné — son ark `bpt6k…` —, ou `null` s'il n'en
 * existe pas : *L'Auto* ne paraît pas autour du 26 mars 1944 dans Gallica.
 */
export async function fasciculeDuJour(periodique: Periodique, jour: string): Promise<string | null> {
  const cb = PERIODIQUES[periodique];
  const compact = jour.replace(/-/g, "");
  let url = `${RACINE}/ark:/12148/${cb}/date${compact}`;
  // La redirection se fait parfois en deux temps ; on suit à la main, pour
  // lire l'adresse d'arrivée sans charger la page.
  for (let saut = 0; saut < 5; saut++) {
    const { url: vers } = await lire(url, `fascicule-${cb}-${compact}-${saut}.txt`, "manual");
    const ark = vers.match(/bpt6k[0-9a-z]+/)?.[0];
    if (ark) return ark;
    if (vers === url || !vers) break;
    url = vers;
  }
  return null;
}

/** Les pages d'un fascicule où un mot figure, d'après l'index de Gallica. */
export async function pagesContenant(ark: string, mot: string): Promise<number[]> {
  const { corps } = await lire(
    `${RACINE}/services/ContentSearch?ark=${ark}&query=${encodeURIComponent(mot)}`,
    `${ark}-contient-${mot.replace(/[^\w]/g, "_")}.xml`,
  );
  const pages = new Set<number>();
  for (const m of corps.matchAll(/<p_id>PAG_(\d+)<\/p_id>/g)) pages.add(Number(m[1]));
  return [...pages].sort((a, b) => a - b);
}

function decoder(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

/**
 * Les lignes d'une page, dans l'ordre du flux ALTO. Une césure de fin de
 * ligne est recousue : la première moitié porte le mot entier
 * (`SUBS_CONTENT`), la seconde est tue — sans quoi « louan-ger » paraît deux
 * fois, sur deux lignes.
 */
export async function lirePage(ark: string, page: number): Promise<string[]> {
  const { corps } = await lire(
    `${RACINE}/RequestDigitalElement?O=${ark}&E=ALTO&Deb=${page}`,
    `${ark}-alto-${page}.xml`,
  );
  const lignes: string[] = [];
  for (const [, ligne] of corps.matchAll(/<TextLine[^>]*>(.*?)<\/TextLine>/gs)) {
    const mots: string[] = [];
    for (const [, attributs] of ligne.matchAll(/<String([^>]*)\/>/g)) {
      const type = attributs.match(/SUBS_TYPE="([^"]*)"/)?.[1];
      if (type === "HypPart2") continue;
      const contenu =
        type === "HypPart1"
          ? attributs.match(/SUBS_CONTENT="([^"]*)"/)?.[1]
          : attributs.match(/CONTENT="([^"]*)"/)?.[1];
      if (contenu) mots.push(decoder(contenu));
    }
    if (mots.length) lignes.push(mots.join(" "));
  }
  return lignes;
}

// =============================================================================
// CE QU'UN ARTICLE DIT D'UN MATCH
// =============================================================================

/** Les lignes d'un XV, telles que *L'Auto* les nomme en 1925. */
export type LigneDuXV =
  | "arrière"
  | "trois-quarts"
  | "demis"
  | "troisième ligne"
  | "deuxième ligne"
  | "première ligne";

/** Le nombre d'hommes que chaque ligne doit compter : c'est le garde-fou. */
export const EFFECTIF_DES_LIGNES: Record<LigneDuXV, number> = {
  "arrière": 1,
  "trois-quarts": 4,
  "demis": 2,
  "troisième ligne": 3,
  "deuxième ligne": 2,
  "première ligne": 3,
};

export interface XVDuJournal {
  /** Le club tel que le journal l'écrit — « U.S. Perpignanaise ». */
  club: string;
  lignes: { ligne: LigneDuXV; noms: string[] }[];
  capitaine: string | null;
}

/**
 * Nettoie un nom sorti de l'OCR sans prétendre le corriger : les signes qui
 * ne sont pas des lettres tombent, les lettres restent telles quelles.
 * « Hi.bère » devient « Hibère », et c'est un humain qui en fera Ribère.
 */
export function nettoyerNom(brut: string): string {
  return brut
    .replace(/\(cap\.?\)/i, "")
    .replace(/[^\p{L}' -]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const ENTETES: [RegExp, LigneDuXV][] = [
  [/arri[èeé]re\s*:/i, "arrière"],
  [/trois[- ]?['’]?\s*quarts?\s*:/i, "trois-quarts"],
  [/demis?\s*:/i, "demis"],
  [/3[e®°"]?\s*ligne\s*:/i, "troisième ligne"],
  [/2[e®°"]?\s*ligne\s*:/i, "deuxième ligne"],
  [/[1lj]re?\s*ligne\s*:/i, "première ligne"],
];

/**
 * Les deux XV d'un article, à partir de « Les équipes se présentèrent comme
 * suit » et jusqu'au premier titre qui suit. Chaque club ouvre par son nom
 * suivi d'un tiret, puis viennent les lignes dans l'ordre du journal —
 * arrière, trois-quarts, demis, avants par ligne.
 *
 * Rend une liste vide quand le bloc manque : c'est le cas d'une page dont
 * l'OCR a rendu « [texte illisible] », et c'est au script de le dire.
 */
export function lireEquipes(lignes: string[]): XVDuJournal[] {
  const texte = lignes.join("\n");
  const debut = texte.search(/[ÉE]quipes se pr[ée]sent[èe]rent comme suit/i);
  if (debut < 0) return [];
  const suite = texte.slice(debut);
  // Le bloc s'arrête au premier titre en capitales sur sa ligne.
  const fin = suite.search(/\n[A-ZÉÈÀ][A-ZÉÈÀ' ]{8,}\n/);
  const bloc = (fin > 0 ? suite.slice(0, fin) : suite).replace(/\n/g, " ");

  // Chaque club : un nom, un tiret long ou court, puis « Arrière : ». Le nom
  // commence après « comme suit : » ou après le point qui clôt le XV
  // précédent — sans cette ancre, le dernier avant de Carcassonne,
  // « Aguado. », passait dans le nom de l'U.S. Perpignanaise.
  const clubs = [
    ...bloc.matchAll(/(?:comme suit\s*:?\s*|\.\s+)([A-Z][\p{L}.' -]{3,60}?)\.?\s*[—–-]{1,2}\s*(?=Arri[èeé]re\s*:)/giu),
  ];
  const equipes: XVDuJournal[] = [];
  for (let i = 0; i < clubs.length; i++) {
    const de = clubs[i].index! + clubs[i][0].length;
    const a = i + 1 < clubs.length ? clubs[i + 1].index! : bloc.length;
    const corps = bloc.slice(de, a);
    const marques = ENTETES.flatMap(([re, ligne]) =>
      [...corps.matchAll(new RegExp(re.source, "gi"))].map((m) => ({ ligne, de: m.index!, a: m.index! + m[0].length })),
    ).sort((x, y) => x.de - y.de);
    const xv: XVDuJournal = { club: clubs[i][1].replace(/\s+/g, " ").trim(), lignes: [], capitaine: null };
    for (let j = 0; j < marques.length; j++) {
      const brut = corps.slice(marques[j].a, j + 1 < marques.length ? marques[j + 1].de : corps.length)
        // « avants : » n'est pas une ligne, c'est le titre des trois qui suivent.
        .replace(/avants?\s*:/i, "");
      const noms = brut
        .split(/[,;/]/)
        .map((n) => {
          if (/\(cap\.?\)/i.test(n)) xv.capitaine = nettoyerNom(n);
          return nettoyerNom(n);
        })
        .filter((n) => n.length >= 2);
      xv.lignes.push({ ligne: marques[j].ligne, noms });
    }
    if (xv.lignes.length) equipes.push(xv);
  }
  return equipes;
}

/** « M. Vigné, qui arbitra » : l'arbitre, quand l'article le nomme ainsi. */
export function lireArbitre(lignes: string[]): string | null {
  const texte = lignes.join(" ");
  const m =
    texte.match(/M\.\s+([\p{Lu}][\p{L}'-]+),?\s+qui\s+arbitra/u) ??
    texte.match(/arbitr(?:e|é|age)\s*(?:de|par|:)\s*M\.\s+([\p{Lu}][\p{L}'-]+)/u);
  return m ? m[1] : null;
}

/** « 11 à 6 (5-6) » : score et mi-temps, quand un titre les porte. */
export function lireScoreEtMiTemps(lignes: string[]): { score: [number, number]; miTemps: [number, number] | null }[] {
  const trouves: { score: [number, number]; miTemps: [number, number] | null }[] = [];
  for (const l of lignes) {
    const m = l.match(/\b(\d{1,2})\s*à\s*(\d{1,2})\b(?:\s*\((\d{1,2})\s*[-–]\s*(\d{1,2})\))?/);
    if (m) trouves.push({ score: [Number(m[1]), Number(m[2])], miTemps: m[3] ? [Number(m[3]), Number(m[4])] : null });
  }
  return trouves;
}

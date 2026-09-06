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

/**
 * Les lignes d'un XV, telles que *L'Auto* les nomme. En 1925 les avants sont
 * donnés ligne par ligne ; en 1921 ils forment un seul bloc de huit, sans
 * ligne — « avants » est alors une ligne à part entière.
 */
export type LigneDuXV =
  | "arrière"
  | "trois-quarts"
  | "demis"
  | "avants"
  | "troisième ligne"
  | "deuxième ligne"
  | "première ligne";

/** Le nombre d'hommes que chaque ligne doit compter : c'est le garde-fou. */
export const EFFECTIF_DES_LIGNES: Record<LigneDuXV, number> = {
  "arrière": 1,
  "trois-quarts": 4,
  "demis": 2,
  "avants": 8,
  "troisième ligne": 3,
  "deuxième ligne": 2,
  "première ligne": 3,
};

export interface XVDuJournal {
  /** Le club tel que le journal l'écrit — « U.S. Perpignanaise ». */
  club: string;
  /**
   * « ? » : des noms que l'OCR a laissés sans en-tête lisible — en 1921,
   * « Arrière » et « trois-quarts » sont rendus « AITIÙIO » et
   * « txrM?-qua-rte », et les cinq premiers Catalans n'ont plus de ligne.
   */
  lignes: { ligne: LigneDuXV | "?"; noms: string[] }[];
  capitaine: string | null;
}

/**
 * Nettoie un nom sorti de l'OCR sans prétendre le corriger : les signes qui
 * ne sont pas des lettres tombent, les lettres restent telles quelles.
 * « Hi.bère » devient « Hibère », et c'est un humain qui en fera Ribère.
 */
export function nettoyerNom(brut: string): string {
  return brut
    // « (cap.) », « (ouverture) », « (mêlée) » : des annotations, pas le
    // nom — et l'OCR de 1914 ouvre la parenthèse par un « < ».
    .replace(/[(<][^)>]*[)>]?/g, "")
    .replace(/\b(cap|ouverture|m[êe]l[ée]e)\b\.?/gi, "")
    .replace(/[^\p{L}' -]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

const ENTETES: [RegExp, LigneDuXV][] = [
  [/arri[èeé]re\s*:/i, "arrière"],
  // « Trois-quai,ts » en 1914 : l'OCR casse le mot, on tolère quatre signes
  // entre « qua » et « ts ».
  [/trois[- ]?['’]?\s*qua[^:\n]{0,4}ts?\s*:/i, "trois-quarts"],
  [/demis?\s*:/i, "demis"],
  // Les lignes d'avants : « 1re », « 1" », « l1' », « 2' », « 3® »… l'OCR
  // rend l'exposant comme il peut.
  [/3\s*[e®°"'’]*\s*ligne\s*:?/i, "troisième ligne"],
  [/2\s*[e®°"'’]*\s*ligne\s*:?/i, "deuxième ligne"],
  [/[1lj]\s*[1lre®°"'’]*\s*ligne\s*:?/i, "première ligne"],
  // « avants : » ouvre soit les trois lignes qui suivent, soit — en 1921 —
  // un bloc de huit sans ligne. On l'inscrit toujours, et on le retire après
  // coup s'il ne porte aucun nom en propre.
  [/avants?\s*:/i, "avants"],
];

/**
 * Les deux XV d'un article. Trois tournures vues : « Les équipes se
 * présentèrent comme suit » (1925), « … dans l'ordre suivant » (1921), et
 * « LES EQUIPES » en titre, chaque club sur sa ligne en capitales (1914).
 * Un club ouvre par son nom — suivi d'un tiret, ou seul sur sa ligne —,
 * puis viennent les lignes dans l'ordre du journal.
 *
 * Chaque liste de noms s'arrête au point qui la clôt en fin de ligne :
 * c'est ce qui sépare « Galiay. » de « Les Tarbais sont en blanc », la
 * phrase qui suit le XV de 1914.
 *
 * Rend une liste vide quand le bloc manque : c'est le cas d'une page dont
 * l'OCR a rendu « [texte illisible] », et c'est au script de le dire.
 */
export function lireEquipes(lignes: string[], indices: string[] = []): XVDuJournal[] {
  const texte = lignes.join("\n");
  const debut = texte.search(/[ÉE]quipes se pr[ée]sent[èe]rent|\nLES [ÉE]QUIPES\n/i);
  if (debut < 0) return [];
  const bloc = texte.slice(debut, debut + 4000);

  // Chaque club : un nom, puis « Arrière : » — après un tiret, ou au début
  // de la ligne suivante. Le nom commence en début de ligne ou après le
  // point qui clôt le XV précédent — sans cette ancre, le dernier avant de
  // Carcassonne, « Aguado. », passait dans le nom de l'U.S. Perpignanaise.
  // Quand l'OCR a défiguré « Arrière », un nom de club qu'on attend — les
  // `indices` — suffit, pourvu qu'un tiret le suive.
  const motif = /(?:^|\n|\.\s+|:\s*)([A-Z][^\n]{2,60}?)\.?\s*(?:[—–-]{1,2}\s*|\n\s*)(?=Arri[èeé]re\s*:)/gu;
  const clubs = [...bloc.matchAll(motif)];
  if (indices.length) {
    // Un tiret long seulement — un trait d'union prend « Tarbes av- » dans le
    // récit —, et un deux-points dans les cent signes qui suivent : ce qui
    // reste d'un en-tête de ligne.
    for (const m of bloc.matchAll(/(?:^|\n|\.\s+)([A-Z][^\n]{2,40}?\p{L})\.?\s*[—–]\s*(?=[^\n]{0,100}:)/gu)) {
      const nom = m[1];
      if (indices.some((i) => nom.toLowerCase().includes(i.toLowerCase())) && !clubs.some((c) => c.index === m.index)) {
        clubs.push(m);
      }
    }
    clubs.sort((x, y) => x.index! - y.index!);
  }
  const retenus = clubs.filter((m) => !/^les\s+[ée]quipes/i.test(m[1]));
  const equipes: XVDuJournal[] = [];
  for (let i = 0; i < retenus.length; i++) {
    const de = retenus[i].index! + retenus[i][0].length;
    const a = i + 1 < retenus.length ? retenus[i + 1].index! : bloc.length;
    const corps = bloc.slice(de, a);
    const marques = ENTETES.flatMap(([re, ligne]) =>
      [...corps.matchAll(new RegExp(re.source, "gi"))].map((m) => ({ ligne: ligne as LigneDuXV | "?", de: m.index!, a: m.index! + m[0].length })),
    ).sort((x, y) => x.de - y.de);
    // Ce qui précède le premier en-tête est une ligne sans nom : « ? ».
    if (marques.length === 0 || marques[0].de > 0) marques.unshift({ ligne: "?", de: 0, a: 0 });
    const xv: XVDuJournal = { club: retenus[i][1].replace(/\s+/g, " ").trim(), lignes: [], capitaine: null };
    for (let j = 0; j < marques.length; j++) {
      let brut = corps.slice(marques[j].a, j + 1 < marques.length ? marques[j + 1].de : corps.length);
      // La liste s'arrête au point de fin de ligne ; ce qui suit est du récit
      // — sauf si l'en-tête suivant vient presque aussitôt, comme
      // « Couffe. » avant « Trois-quarts » en 1914, ou « Laterraif. »
      // avant « (mêlée). » puis « Avants » : le point clôt la ligne, pas le
      // XV. Vingt signes de reste au plus, sans quoi c'est le récit.
      const point = brut.search(/\.\s*(\n|$)/);
      let clos = false;
      if (point >= 0) {
        const reste = brut.slice(point + 1).replace(/[\s()<>.,;:'"-]/g, "");
        clos = !(j + 1 < marques.length && reste.length <= 20);
        brut = brut.slice(0, point);
      }
      const noms = brut
        .replace(/\n/g, " ")
        .split(/[,;/]/)
        .map((n) => {
          if (/\(cap\b/i.test(n)) xv.capitaine = nettoyerNom(n);
          return nettoyerNom(n);
        })
        .filter((n) => n.length >= 2);
      if ((marques[j].ligne === "avants" || marques[j].ligne === "?") && noms.length === 0) {
        if (clos) break;
        continue;
      }
      xv.lignes.push({ ligne: marques[j].ligne, noms });
      if (clos) break;
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

export interface ScoreDuJournal {
  score: [number, number];
  miTemps: [number, number] | null;
  /** « 2 essais, 1 but » à « 1 essai, 1 but sur coup tombé », quand l'article décompose. */
  detail: [string, string] | null;
}

/**
 * Le score, et la mi-temps quand elle est dite. Trois tournures vues :
 * « 11 à 6 (5-6) » dans un titre de 1938 ; « par 8 points (2 essais, 1 but)
 * à 7 points (1 essai, 1 but sur coup tombé) » en 1914 ; et, la même année,
 * « Première mi-temps. — PERPIGNAN : 0 ; TARBES : 0 » puis « Deuxième
 * mi-temps. — PERPIGNAN : 8 ; TARBES : 7 » — le second étant le total.
 */
export function lireScoreEtMiTemps(lignes: string[]): ScoreDuJournal[] {
  const trouves: ScoreDuJournal[] = [];
  const texte = lignes.join("\n");
  for (const m of texte.matchAll(/(\d{1,2})\s*points?\s*\(([^)]{3,60})\)\s*à\s*(\d{1,2})\s*points?\s*\(([^)]{3,60})\)/g)) {
    trouves.push({
      score: [Number(m[1]), Number(m[3])],
      miTemps: null,
      detail: [m[2].replace(/\s+/g, " ").trim(), m[4].replace(/\s+/g, " ").trim()],
    });
  }
  const premiere = texte.match(/Premi[èe]re mi-temps[^\d\n]{0,40}(\d{1,2})[^\d\n]{1,20}(\d{1,2})/);
  const seconde = texte.match(/Deuxi[èe]me mi-temps[^\d\n]{0,40}(\d{1,2})[^\d\n]{1,20}(\d{1,2})/);
  if (seconde) {
    trouves.push({
      score: [Number(seconde[1]), Number(seconde[2])],
      miTemps: premiere ? [Number(premiere[1]), Number(premiere[2])] : null,
      detail: null,
    });
  }
  for (const l of lignes) {
    const m = l.match(/\b(\d{1,2})\s*à\s*(\d{1,2})\b(?:\s*\((\d{1,2})\s*[-–]\s*(\d{1,2})\))?/);
    if (m) trouves.push({ score: [Number(m[1]), Number(m[2])], miTemps: m[3] ? [Number(m[3]), Number(m[4])] : null, detail: null });
  }
  return trouves;
}

export interface FaitHoraire {
  /** L'heure de l'horloge, telle que le journal l'écrit — « 4 h. 40 ». */
  heure: number;
  minute: number;
  texte: string;
}

/**
 * La chronologie à l'heure de l'horloge, comme *L'Auto* la tient en 1914 :
 * « 4 h. 10 : essai de Lastegaray pour Tarbes ». Il faut l'heure du coup
 * d'envoi pour en faire des minutes de jeu, et l'article la donne aussi.
 * Les faits sont rendus dans l'ordre du texte, sans rien en déduire.
 */
export function lireChronologieHoraire(lignes: string[]): FaitHoraire[] {
  const faits: FaitHoraire[] = [];
  for (const l of lignes) {
    const m = l.match(/^\s*(\d)\s*[hb]\.?\s*(\d{1,2})?\s*:\s*(.{3,120})$/);
    if (m) faits.push({ heure: Number(m[1]), minute: m[2] ? Number(m[2]) : 0, texte: m[3].trim() });
  }
  return faits;
}

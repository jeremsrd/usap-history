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
import { baremeDeMatch, pointsDesRealisations } from "../../src/lib/scoring";

/** Les pages de l'ERC vont de 2007 à 2013 : le barème d'aujourd'hui, écrit une seule fois. */
const BAREME_ERC = baremeDeMatch(2007);

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
      points: pointsDesRealisations({ essais: t, transformations: c, drops: d, penalites: p }, BAREME_ERC),
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

// =============================================================================
// LE MATCH CENTRE, 2010-2013
// =============================================================================

export type ErcTypeEvenement = "essai" | "transformation" | "penalite" | "drop";

export interface ErcEvenement {
  minute: number;
  type: ErcTypeEvenement;
  /** Le nom tel que la page l'écrit — « D Mele », initiale et patronyme. */
  nom: string;
  domicile: boolean;
}

export interface ErcMatchCentre extends ErcMatch {
  miTemps: { domicile: number; exterieur: number } | null;
  arbitre: string | null;
  evenements: ErcEvenement[];
  /**
   * Minutes des essais de pénalité, quand la chronologie les trahit : une
   * transformation que nul essai ne précède à la même minute ni à la
   * précédente. `[domicile, extérieur]`.
   */
  essaisDePenaliteMinutes: [number[], number[]];
}

const TYPES_MATCH_CENTRE: Record<string, ErcTypeEvenement> = {
  Try: "essai",
  Conversion: "transformation",
  Penalty: "penalite",
  "Drop Goal": "drop",
  "Drop goal": "drop",
};

/** « Sébastien Vahaamahina » → prénom et nom ; une particule ouvre le nom. */
function couperNom(complet: string): { firstName: string; lastName: string } {
  const mots = complet.trim().split(/\s+/);
  const particule = mots.findIndex((m, i) => i > 0 && /^(van|von|de|da|di|du|del|della|le|la|mc|o')$/i.test(m));
  const coupe = particule > 0 ? particule : Math.max(1, mots.length - 1);
  return { firstName: mots.slice(0, coupe).join(" "), lastName: mots.slice(coupe).join(" ") };
}

function lireListe(bloc: string): EspnJoueur[] {
  const joueurs: EspnJoueur[] = [];
  for (const [, ligne] of bloc.matchAll(/<tr class="play(?:start|sub)[^"]*">([\s\S]*?)<\/tr>/g)) {
    const cellules = [...ligne.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    if (cellules.length < 7) continue;
    // [0] numéro, [1] nom, [2] T, [3] C, [4] D, [5] P, [6] cartons — les
    // réalisations s'écrivent « 4P », « 2T », un nombre suivi de sa lettre.
    const valeur = (c: string) => Number(/\d+/.exec(texte(c))?.[0] ?? 0);
    const numero = valeur(cellules[0]);
    const t = valeur(cellules[2]);
    const c = valeur(cellules[3]);
    const d = valeur(cellules[4]);
    const pen = valeur(cellules[5]);
    const nomBrut = texte(cellules[1]);
    joueurs.push({
      id: 0,
      ...couperNom(nomBrut.replace(/\s*\((?:capt|c)\)\s*/i, " ").trim()),
      numero,
      isStarter: numero <= 15,
      isCaptain: /\((?:capt|c)\)/i.test(nomBrut),
      posteEspn: null,
      essais: t,
      transformations: c,
      drops: d,
      penalites: pen,
      points: pointsDesRealisations({ essais: t, transformations: c, drops: d, penalites: pen }, BAREME_ERC),
      jaunes: (cellules[6].match(/yellowcard/g) ?? []).length,
      rouges: (cellules[6].match(/redcard/g) ?? []).length,
    });
  }
  return joueurs.sort((a, b) => a.numero - b.numero);
}

function lireScorecard(bloc: string, domicile: boolean): ErcEvenement[] {
  const evenements: ErcEvenement[] = [];
  for (const [, ev] of bloc.matchAll(/<div class="event[^"]*">([\s\S]*?)<\/div>\s*<\/div>/g)) {
    const type = TYPES_MATCH_CENTRE[texte(/<div class="scoretype">([^<]*)/.exec(ev)?.[1] ?? "")];
    const nom = texte(/<div class="playname">([^<]*)/.exec(ev)?.[1] ?? "");
    const minute = Number(texte(/<div class="mins">([^<]*)/.exec(ev)?.[1] ?? ""));
    if (type && Number.isFinite(minute)) evenements.push({ minute, type, nom, domicile });
  }
  // **Un fait anonyme suivi du même fait nommé, à la minute suivante, est
  // un doublon** : le Perpignan-Trévise du 17 octobre 2010 porte une
  // transformation sans nom à la 64ᵉ puis « J Porical » à la 65ᵉ, pour un
  // seul essai de pénalité. La feuille des joueurs tranche — cinq
  // transformations, non six.
  return evenements.filter(
    (e, i) =>
      e.nom !== "" ||
      !evenements.some((a, k) => k !== i && a.type === e.type && a.nom !== "" && Math.abs(a.minute - e.minute) <= 1),
  );
}

/**
 * La page Match Centre de 2010-2013 : score, mi-temps, stade, affluence,
 * arbitre, les deux listes de 1 à 23 avec leurs réalisations, et la
 * chronologie minutée. **L'essai de pénalité n'y est pas écrit** : il se
 * lit à une transformation que nul essai ne précède, et la page le laisse
 * sinon dans un écart de cinq points — le Rovigo-Perpignan du 13 octobre
 * 2012 en porte un, deux transformations de David Mélé à la 58ᵉ pour un seul
 * essai nommé. On le compte alors comme essai sans auteur.
 */
export function lireMatchCentre(brut: Buffer): ErcMatchCentre {
  const html = brut.toString("utf8");
  const titre = texte(/<title>(.*?)<\/title>/s.exec(html)?.[1] ?? "");
  const nomDomicile = texte(/<div class="name homename">([\s\S]*?)<\/div>/.exec(html)?.[1] ?? "");
  const nomExterieur = texte(/<div class="name awayname">([\s\S]*?)<\/div>/.exec(html)?.[1] ?? "");
  const score = /<div class="score">\s*(\d+)\s*-\s*(\d+)/.exec(html);
  const mt = /Half Time\s*(\d+)\s*-\s*(\d+)/.exec(html);
  const stade = texte(/<div class="venue">Venue:([\s\S]*?)<\/div>/.exec(html)?.[1] ?? "") || null;
  const affluence = Number((/<div class="attendance">Attendance:([\s\S]*?)<\/div>/.exec(html)?.[1] ?? "").replace(/[^\d]/g, "")) || null;
  // « John Paul 'JP' Doyle » : le surnom entre guillemets n'est pas un
  // prénom, et la base porte John Paul Doyle.
  const arbitre =
    texte(/<div class="referee">Referee:([\s\S]*?)<\/div>/.exec(html)?.[1] ?? "")
      .replace(/\s*['"‘’“”][^'"‘’“”]+['"‘’“”]\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim() || null;

  const lineups = html.slice(html.indexOf('<div class="lineups'));
  const iAway = lineups.indexOf('<div class="away">');
  const domicileJoueurs = lireListe(lineups.slice(0, iAway));
  const exterieurJoueurs = lireListe(lineups.slice(iAway, lineups.indexOf("</table>", iAway) + 8));

  const iHome = html.indexOf('<div class="homescorecard');
  const iAwaySc = html.indexOf('<div class="awayscorecard');
  const evenements = [
    ...lireScorecard(html.slice(iHome, iAwaySc), true),
    ...lireScorecard(html.slice(iAwaySc, html.indexOf("Match Details", iAwaySc)), false),
  ].sort((a, b) => a.minute - b.minute);

  // **L'essai de pénalité se lit dans l'écart.** La page ne l'écrit nulle
  // part ; les réalisations nommées laissent alors cinq points sans auteur,
  // et c'est exactement ce qu'il vaut avant 2017, sa transformation étant
  // déjà sur la ligne du buteur. Un écart qui n'est pas un multiple de cinq
  // n'est pas un essai de pénalité : le camp restera incohérent, et signalé.
  // Chaque essai n'absorbe qu'une transformation : deux transformations de
  // David Mélé à la 58ᵉ pour un seul essai nommé à la 57ᵉ, et la seconde est
  // celle d'un essai de pénalité.
  const orphelines = (domicile: boolean) => {
    const essais = evenements.filter((e) => e.domicile === domicile && e.type === "essai").map((e) => ({ minute: e.minute, pris: false }));
    const sansEssai: number[] = [];
    for (const t of evenements.filter((e) => e.domicile === domicile && e.type === "transformation")) {
      // Une transformation suit son essai d'une à deux minutes sur ces pages.
      const essai = essais.find((e) => !e.pris && t.minute - e.minute >= 0 && t.minute - e.minute <= 2);
      if (essai) essai.pris = true;
      else sansEssai.push(t.minute);
    }
    return sansEssai;
  };
  const equipe = (nom: string, joueurs: EspnJoueur[], scoreEquipe: string | undefined, domicile: boolean): EspnEquipe => {
    const marques = joueurs.reduce((s, j) => s + j.points, 0);
    const scoreNum = scoreEquipe != null ? Number(scoreEquipe) : null;
    const ecart = scoreNum != null ? scoreNum - marques : 0;
    return {
      id: 0,
      nom,
      score: scoreNum,
      miTemps: mt ? Number(domicile ? mt[1] : mt[2]) : null,
      essaisSansAuteur: ecart > 0 && ecart % 5 === 0 ? ecart / 5 : 0,
      joueurs,
    };
  };
  return {
    titre,
    stade,
    affluence,
    arbitre,
    miTemps: mt ? { domicile: Number(mt[1]), exterieur: Number(mt[2]) } : null,
    domicile: equipe(nomDomicile, domicileJoueurs, score?.[1], true),
    exterieur: equipe(nomExterieur, exterieurJoueurs, score?.[2], false),
    evenements,
    essaisDePenaliteMinutes: [orphelines(true), orphelines(false)],
  };
}

function echapper(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

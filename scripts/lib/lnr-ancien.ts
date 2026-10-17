/**
 * L'ancien site de la LNR, d'avant 2004-2005, tel que la Wayback Machine l'a
 * gardé.
 *
 * **LA SEULE SOURCE OFFICIELLE D'AVANT LA LNR D'AUJOURD'HUI.** Le site actuel
 * n'archive rien avant 2004-2005 (`/calendrier-et-resultats/2003-2004/j1`
 * rend 404) ; l'ancien, en ASP, publiait pour chaque saison une page de
 * **résultats** et une page de **calendrier**, journée par journée, et la
 * Wayback Machine en a capturé plusieurs états. Repérées le 17 octobre 2026 :
 *
 *   - 2003-2004, résultats : `Menus.asp?CR=16354&CSR=16375&Cle=45654`, vue par
 *     défaut = Top 16 (`VueCompet=42583` = Pro D2) ;
 *   - 2003-2004, calendrier : `Menus.asp?CR=16354&CSR=16378&Cle=45356`.
 *
 * Les deux pages ont la même forme une fois le HTML ôté : une phase
 * (« Phase préliminaire »), une journée (« Matchs aller - 1er Journée :
 * 10/11 Octobre 2003 »), un ou deux intitulés de poule, puis des paires de
 * lignes — « Montauban / Perpignan » et, dessous, le score sur la page des
 * résultats, « Samedi 11 octobre (19h30), Sapiac » sur celle du calendrier.
 *
 * **LE CALENDRIER DONNE LE JOUR EXACT, L'HEURE ET LE STADE**, et ses
 * captures successives suivent les reports : celle de novembre 2003 met
 * Perpignan-Toulouse au samedi 24 avril, celle de janvier 2005 au « Match
 * reporté au Mercredi 28 avril ». La plus tardive fait donc foi.
 *
 * **MÊMES ADRESSES, AUTRES MOTS, D'UNE SAISON À L'AUTRE.** Sans `Cle=`,
 * `CSR=16375` et `CSR=16378` rendent les résultats et le calendrier de la
 * saison en cours au jour de la capture : 2001-2002 en 2002, 2002-2003 en
 * 2003. Mais les phases n'y portent pas le même nom — « Match Aller »,
 * « Play-offs », « Play-downs » en 2001-2002 ; « Phase régulière », « Phase
 * de qualification », « Phases finales » en 2002-2003 — et `PHASES` les
 * ramène aux quatre de 2003-2004.
 *
 * **AVANT 2003-2004, LE CALENDRIER NE NOMME QUE LE JOUR DE LA SEMAINE** :
 * « Samedi (19h30), Aimé Giral ». Le quantième se retrouve dans l'en-tête
 * de journée (`jourDeLaSemaine`) — « Vendredi » sous « 5/6 Avril 2003 »
 * vaut le 4 avril —, et la date reste exacte : le jour est nommé.
 *
 * **L'EN-TÊTE DE JOURNÉE N'EST PAS FIABLE POUR L'ANNÉE** : la Pro D2 de
 * 2003-2004 y écrit « 15ème Journée : 10/11 Janvier 2003 ». L'année se
 * déduit du mois et de la saison (`anneeDuMois`), jamais de l'en-tête.
 *
 * Pages en latin-1, cache sur disque : une page archivée ne change plus.
 */
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ARCHIVE = "http://web.archive.org/web/";
const CACHE = join(process.cwd(), "node_modules", ".cache", "usap-lnr-ancien");
const PAUSE_MS = 4000;

let derniereRequete = 0;

/** L'adresse de la capture, telle qu'on la cite dans une attestation. */
export function adresseArchivee(url: string, instantane: string): string {
  return `https://web.archive.org/web/${instantane}/${url}`;
}

/** La page archivée, sans bandeau (`id_`), au plus près de l'instantané. */
export async function lirePageLnrArchivee(url: string, instantane: string): Promise<Buffer> {
  mkdirSync(CACHE, { recursive: true });
  const fichier = join(CACHE, `${instantane}-${url.replace(/[^\w.-]/g, "_")}`);
  if (existsSync(fichier)) return readFileSync(fichier);

  const adresse = `${ARCHIVE}${instantane}id_/${url}`;
  let derniere = "";
  for (let essai = 1; essai <= 4; essai++) {
    const attente = Math.max(0, derniereRequete + PAUSE_MS - Date.now());
    if (attente > 0) await new Promise((r) => setTimeout(r, attente));
    derniereRequete = Date.now();
    try {
      const reponse = await fetch(adresse, {
        headers: { "User-Agent": "usap-history (lecture d'archives, une requête toutes les quatre secondes)" },
        signal: AbortSignal.timeout(120_000),
        redirect: "follow",
      });
      if (reponse.ok) {
        const corps = Buffer.from(await reponse.arrayBuffer());
        // La page « Wayback Machine » de quelques Ko est un 404 déguisé.
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
    console.log(`  ↻ archive : ${url}, nouvel essai dans ${10 * essai} s (${derniere})`);
    await new Promise((r) => setTimeout(r, 10_000 * essai));
  }
  throw new Error(`Archive LNR injoignable : ${url} @ ${instantane} (${derniere})`);
}

const ENTITES: Record<string, string> = {
  nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">",
  eacute: "é", egrave: "è", ecirc: "ê", agrave: "à", acirc: "â", ccedil: "ç",
  ocirc: "ô", ucirc: "û", ugrave: "ù", icirc: "î", iuml: "ï", euml: "ë",
  Eacute: "É", Egrave: "È",
};

/** Le texte de la page, une ligne non vide par élément. */
export function lignesDe(brut: Buffer): string[] {
  return brut
    .toString("latin1")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, "\n")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&(\w+);/g, (m, nom: string) => ENTITES[nom] ?? m)
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export type PhaseAncienne = "préliminaire" | "qualificative" | "finale" | "maintien";

export interface EntreeAncienne {
  phase: PhaseAncienne;
  /** Numéro de journée de la phase ; `null` en phase finale. */
  journee: number | null;
  /** « Demi-finale » ou « Finale » en phase finale, `null` ailleurs. */
  tour: string | null;
  /** La poule, quand la page la rattache sans ambiguïté (un seul intitulé ouvert). */
  poule: string | null;
  /** Ce que l'en-tête de journée dit de la date, tel quel : « 10/11 Octobre 2003 ». */
  enTete: string;
  recevant: string;
  visiteur: string;
  /** La ligne sous la paire : le score, ou la description du calendrier. */
  suite: string;
}

/**
 * Les rencontres d'une page de résultats ou de calendrier, dans l'ordre de
 * la page. Les doublons — la page des résultats répète parfois deux lignes
 * en fin de journée — sont retirés.
 */
/** Les intitulés de phase de chaque saison, ramenés aux quatre de 2003-2004. */
const PHASES: Array<[RegExp, PhaseAncienne]> = [
  [/^(Phase (préliminaire|régulière)|Match (Aller|Retour))$/i, "préliminaire"],
  [/^(Phase (qualificative|de qualification)|Play-offs)$/i, "qualificative"],
  [/^Phases? finales?$/i, "finale"],
  [/^(Phase de maintien|Play-downs)$/i, "maintien"],
];

export function lireTableau(brutes: string[]): EntreeAncienne[] {
  // La paire est parfois coupée en deux éléments : « Agen » puis « / Pau »
  // sur les résultats de 2003-2004, « Béziers / » puis « Dax » sur le
  // calendrier de 2001-2002. On la recolle avant de lire.
  const lignes: string[] = [];
  for (const l of brutes) {
    const prec = lignes[lignes.length - 1];
    if (prec != null && (l.startsWith("/ ") || prec.endsWith(" /"))) {
      lignes[lignes.length - 1] = `${prec} ${l}`.replace(/\s+/g, " ");
    } else lignes.push(l);
  }

  const entrees: EntreeAncienne[] = [];
  const vues = new Set<string>();
  let phase: PhaseAncienne | null = null;
  let journee: number | null = null;
  let tour: string | null = null;
  let enTete = "";
  let poules: string[] = [];

  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    const nouvelle = PHASES.find(([re]) => re.test(l))?.[1];
    if (nouvelle) {
      // Les résultats répètent « Phase finale » sous « Finale : 26 Juin
      // 2004 », et 2001-2002 « Play-downs » avant chaque rencontre du
      // maintien : la répétition ne doit effacer ni le tour ni la journée.
      // « Match Aller » puis « Match Retour » restent une seule phase, dont
      // les journées se suivent de 1 à 14.
      if (nouvelle !== phase) {
        phase = nouvelle;
        journee = null;
        tour = null;
      }
      continue;
    }
    if (!phase) continue;
    const j = /^(?:Matchs (?:aller|retour) - )?(\d+)(?:er|ère|ème|e) journée\s*:\s*(.*)$/i.exec(l);
    if (j) {
      journee = Number(j[1]);
      tour = null;
      enTete = j[2];
      poules = [];
      continue;
    }
    // « Demi finales : … », « Demi-finales: 31 mai 2003 », « Finale: 7 Juin
    // 2003. », et en 2001-2002 « Demi finale » ou « Finale » tout court.
    const t = /^(Demi[- ]finales?|Finale)\s*(?::\s*(.*?)\.?)?$/i.exec(l);
    if (t && phase === "finale") {
      journee = null;
      tour = /^demi/i.test(t[1]) ? "Demi-finale" : "Finale";
      enTete = t[2] ?? "";
      poules = [];
      continue;
    }
    // « Poule 1 », « Top 16 - Poule 2 », « Phase qualificative (Poule A) »,
    // « Play-offs poule B ».
    const pl = /poule ([A-Z0-9])\)?$/i.exec(l);
    if (pl) {
      poules.push(pl[1]);
      continue;
    }
    const m = /^(.+?) \/ (.+)$/.exec(l);
    if (m && i + 1 < lignes.length) {
      const entree: EntreeAncienne = {
        phase,
        journee,
        tour,
        poule: poules.length === 1 ? poules[0] : null,
        enTete,
        recevant: m[1].trim(),
        visiteur: m[2].trim(),
        suite: lignes[i + 1],
      };
      i++;
      const cle = cleDe(entree);
      if (vues.has(cle)) continue;
      vues.add(cle);
      entrees.push(entree);
    }
  }
  return entrees;
}

/** Ce qui désigne une rencontre d'une page à l'autre. */
export function cleDe(e: Pick<EntreeAncienne, "phase" | "journee" | "tour" | "recevant" | "visiteur">): string {
  return `${e.phase}|${e.journee ?? e.tour}|${e.recevant}|${e.visiteur}`;
}

/** « 34-19 » ou « 23-07 » ; `null` si la ligne n'est pas un score. */
export function lireScore(suite: string): { recevant: number; visiteur: number } | null {
  const s = /^(\d{1,3})\s*-\s*(\d{1,3})$/.exec(suite);
  return s ? { recevant: Number(s[1]), visiteur: Number(s[2]) } : null;
}

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** L'année civile d'un mois de la saison : d'août à décembre, la première. */
export function anneeDuMois(mois: number, startYear: number): number {
  return mois >= 8 ? startYear : startYear + 1;
}

const deux = (n: number) => String(n).padStart(2, "0");

/**
 * Le jour, l'heure et le reste d'une ligne de calendrier : « Samedi 11
 * octobre (19h30), Sapiac », « Match reporté au Mercredi 28 avril
 * (19 heures), Aimé Giral », « Dimanche 20 juin, 17h30, La Mosson,
 * Montpellier ». `null` si la ligne ne nomme pas de jour.
 */
export function lireCreneau(
  suite: string,
  startYear: number,
  enTete?: string,
): { jour: string; heure: string | null; texte: string } | null {
  const d = new RegExp(
    `(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\\s+(\\d{1,2})(?:er)?\\s+(${MOIS.join("|")})`,
    "i",
  ).exec(suite);
  let jour: string | null = null;
  if (d) {
    const mois = MOIS.indexOf(d[2].toLowerCase()) + 1;
    jour = `${anneeDuMois(mois, startYear)}-${deux(mois)}-${deux(Number(d[1]))}`;
  } else if (enTete != null) {
    // « Samedi (19h30), Aimé Giral » : le jour de la semaine seul.
    const s = new RegExp(`^(?:match reporté au )?(${SEMAINE.join("|")})\\b`, "i").exec(suite);
    if (s) jour = jourDeLaSemaine(enTete, SEMAINE.indexOf(s[1].toLowerCase()), startYear);
  }
  if (!jour) return null;
  const h = /(\d{1,2})\s*h\s*(\d{2})?|(\d{1,2}) heures/i.exec(suite);
  const heure = h ? `${deux(Number(h[1] ?? h[3]))}:${h[2] ?? "00"}` : null;
  return { jour, heure, texte: suite };
}

/** Dans l'ordre de `Date.getUTCDay()`. */
const SEMAINE = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/**
 * Les jours qu'un en-tête de journée nomme, en ISO : « 5/6 Avril 2003 »,
 * « 1er / 2 mars 2003 », « 30 novembre / 1er décembre 2002 », « 31 Mai au
 * 1er juin 2003 », « 23/24 et 28 Avril 2004 ». Chaque quantième prend le
 * premier mois qui le suit.
 */
export function joursDeLEnTete(enTete: string, startYear: number): string[] {
  const jetons = [...enTete.toLowerCase().matchAll(new RegExp(`(?<!\\d)(\\d{1,2})(?:er)?(?!\\d)|(${MOIS.join("|")})`, "g"))];
  const jours: string[] = [];
  let attente: number[] = [];
  for (const j of jetons) {
    if (j[1]) {
      attente.push(Number(j[1]));
      continue;
    }
    const mois = MOIS.indexOf(j[2]) + 1;
    const annee = anneeDuMois(mois, startYear);
    jours.push(...attente.map((q) => `${annee}-${deux(mois)}-${deux(q)}`));
    attente = [];
  }
  return jours;
}

/**
 * Le jour de la semaine `jourSemaine` (0 = dimanche) le plus proche des jours
 * de l'en-tête, à trois jours au plus : « Vendredi » sous « 5/6 Avril 2003 »
 * donne le 4 avril. `null` s'il n'y en a pas, ou s'il y en a deux à égale
 * distance — on ne choisit pas au hasard.
 */
export function jourDeLaSemaine(enTete: string, jourSemaine: number, startYear: number): string | null {
  const nommes = joursDeLEnTete(enTete, startYear).map((iso) => Date.parse(`${iso}T12:00:00Z`));
  if (nommes.length === 0) return null;
  const premier = Math.min(...nommes);
  const dernier = Math.max(...nommes);
  const JOUR = 86_400_000;
  const candidats: Array<{ iso: string; ecart: number }> = [];
  for (let t = premier - 3 * JOUR; t <= dernier + 3 * JOUR; t += JOUR) {
    if (new Date(t).getUTCDay() !== jourSemaine) continue;
    const ecart = t < premier ? premier - t : t > dernier ? t - dernier : 0;
    candidats.push({ iso: new Date(t).toISOString().slice(0, 10), ecart });
  }
  candidats.sort((a, b) => a.ecart - b.ecart);
  if (candidats.length === 0) return null;
  if (candidats.length > 1 && candidats[0].ecart === candidats[1].ecart) return null;
  return candidats[0].iso;
}

/**
 * Le samedi d'un en-tête de journée — « 10/11 Octobre 2003 », « 23/24 et
 * 28 Avril 2004 » —, ou son premier jour s'il n'y a pas de samedi.
 *
 * C'est le repli quand le calendrier ne nomme pas le jour d'une rencontre :
 * **une date probable, jamais certaine**, à attester `PROBABLE`.
 */
export function samediDeLEnTete(enTete: string, startYear: number): string | null {
  const isos = joursDeLEnTete(enTete, startYear);
  return isos.find((iso) => new Date(`${iso}T12:00:00Z`).getUTCDay() === 6) ?? isos[0] ?? null;
}

/**
 * Les rencontres de la page de résultats de 2000-2001, `championnat/
 * resultats2000_d1.shtm` — d'une tout autre forme que celles de `Menus.asp`.
 *
 * **AUCUNE DATE** : « 1ère » puis « Journée » sur deux lignes, et rien
 * d'autre. Les deux poules y sont mêlées sous un même numéro de journée, la
 * poule 2 (onze clubs, vingt-deux journées) portant une ligne « exempt X ».
 * **Les noms sont coupés n'importe où** — « Perpignan / Stade » puis
 * « Français », « Castres / Mont de » puis « Marsan », « Bègles Bordeaux/ »
 * puis « Mont de Marsan » — : on recolle tout jusqu'à la ligne du score. La
 * phase finale s'écrit « 1/4 », « de finale », « 1/2 », « finale », puis
 * « Matchs de barrage » pour le maintien.
 *
 * Deux coquilles de la page sont redressées : « Pergignan » (5e journée) et
 * « Stade-Français » (quart de finale).
 */
export function lireResultats2000(brutes: string[]): EntreeAncienne[] {
  const entrees: EntreeAncienne[] = [];
  const debut = brutes.indexOf("Matchs Aller");
  if (debut < 0) throw new Error("LNR 2000-2001 : « Matchs Aller » introuvable");
  let phase: PhaseAncienne = "préliminaire";
  let journee: number | null = null;
  let tour: string | null = null;
  let morceaux: string[] = [];
  const nom = (n: string) =>
    n.replace(/\s+/g, " ").trim().replace(/^Pergignan$/, "Perpignan").replace(/^Stade-Français$/, "Stade Français");

  for (let i = debut + 1; i < brutes.length; i++) {
    const l = brutes[i];
    const suivante = brutes[i + 1] ?? "";
    const n = /^(\d+)(?:ère|ème|e)$/.exec(l);
    if (n && suivante === "Journée") {
      journee = Number(n[1]);
      morceaux = [];
      i++;
      continue;
    }
    if (l === "Phase Finale") {
      phase = "finale";
      journee = null;
      morceaux = [];
      continue;
    }
    if (l === "1/4" && suivante === "de finale") {
      tour = "Quart de finale";
      morceaux = [];
      i++;
      continue;
    }
    if (l === "1/2" && suivante === "finale") {
      tour = "Demi-finale";
      morceaux = [];
      i++;
      continue;
    }
    if (l === "finale" && phase === "finale") {
      tour = "Finale";
      morceaux = [];
      continue;
    }
    if (l === "Matchs de barrage") break;
    if (/^(Matchs (Aller|Retour)|Poule \d|exempt .*)$/.test(l)) {
      morceaux = [];
      continue;
    }
    if (/^\d{1,3}-\d{1,3}$/.test(l)) {
      const paire = /^(.+?)\s*\/\s*(.+)$/.exec(morceaux.join(" "));
      morceaux = [];
      if (!paire) continue;
      entrees.push({
        phase,
        journee: phase === "préliminaire" ? journee : null,
        tour: phase === "finale" ? tour : null,
        poule: null,
        enTete: "",
        recevant: nom(paire[1]),
        visiteur: nom(paire[2]),
        suite: l,
      });
      continue;
    }
    morceaux.push(l);
  }
  return entrees;
}

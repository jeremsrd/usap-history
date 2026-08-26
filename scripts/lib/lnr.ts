/**
 * Lecture des feuilles de match de la LNR (top14.lnr.fr).
 *
 * Source officielle, et de loin la plus complète : chaque essai y porte son
 * transformateur, les cartons ont leur minute, et les changements distinguent
 * le remplacement définitif du temporaire (sang, protocole commotion), ce qui
 * permet de reconstituer les minutes réellement jouées.
 *
 * Les pages sont rendues côté serveur : le HTML embarque la charge utile JSON
 * du composant, échappée en entités (`&quot;`). Pas besoin de navigateur, un
 * simple `fetch` suffit — contrairement à ce que laissait penser une lecture
 * rapide du site, qui affiche bien les changements par du JavaScript mais à
 * partir de données déjà présentes dans la page.
 *
 * Deux formes coexistent dans cette charge utile :
 *   - les faits de match, objets `{ slugType: "point" | "exclusion-joueur",
 *     club, period, minute, additionalMinute, player, conversionPlayer? }` ;
 *   - les changements, objets `{ club, minute, type, in, out }`.
 * Les compositions, elles, sont du HTML classique et ne sont pas lues ici :
 * les feuilles en base portent déjà numéros et titulaires.
 *
 * `club` vaut « home » ou « away » ; le camp de l'USAP se déduit de l'URL,
 * de la forme `{id}-{recevant}-{visiteur}`.
 */

const RACINE = "https://top14.lnr.fr";

export type Camp = "home" | "away";

export interface LnrJoueur {
  firstName: string;
  lastName: string;
  /** Fiche LNR, `https://top14.lnr.fr/joueur/184-giorgi-akhaladze`. */
  url?: string;
  isCaptain?: boolean;
}

export interface LnrFait {
  type: "essai" | "essai-de-penalite" | "penalite" | "drop" | "jaune" | "rouge";
  club: Camp;
  minute: number;
  joueur: LnrJoueur | null;
  /** Auteur de la transformation, sur un essai transformé. */
  transformePar: LnrJoueur | null;
}

export interface LnrChangement {
  club: Camp;
  minute: number;
  /** « Définitif » ou « Temporaire ». */
  type: string;
  entrant: LnrJoueur;
  sortant: LnrJoueur;
}

export interface LnrFeuille {
  url: string;
  /** Camp occupé par l'USAP sur cette feuille. */
  campUsap: Camp;
  faits: LnrFait[];
  changements: LnrChangement[];
}

// =============================================================================
// RÉCUPÉRATION
// =============================================================================

async function lirePage(url: string): Promise<string> {
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const reponse = await fetch(url, { signal: AbortSignal.timeout(25_000) });
      if (reponse.ok) return await reponse.text();
    } catch {
      // on retente
    }
  }
  throw new Error(`LNR injoignable : ${url}`);
}

/**
 * URL de la feuille de match de l'USAP pour une phase donnée.
 *
 * @param saison « 2024-2025 »
 * @param phase  « j24 » pour une journée, « access-top-14 » pour un barrage.
 *               Le segment a changé de nom au fil des saisons : « access » en
 *               2022-2023, « access-top-14 » depuis 2024-2025.
 */
export async function chercherFeuille(
  saison: string,
  phase: string,
): Promise<string | null> {
  const html = await lirePage(`${RACINE}/calendrier-et-resultats/${saison}/${phase}`);
  const liens = html.match(
    new RegExp(`feuille-de-match/${saison}/${phase}/[^"'?\\s]*perpignan[^"'?\\s]*`, "g"),
  );
  if (!liens?.length) return null;
  return `${RACINE}/${liens[0].replace(/'+$/, "")}`;
}

// =============================================================================
// EXTRACTION
// =============================================================================

const ENTITES: Record<string, string> = {
  "&quot;": '"',
  "&#039;": "'",
  "&#39;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
  "&amp;": "&",
};

/** `&amp;` en dernier, sinon on ré-échappe ce qu'on vient de décoder. */
function decoderEntites(html: string): string {
  let sortie = html;
  for (const [entite, caractere] of Object.entries(ENTITES)) {
    sortie = sortie.split(entite).join(caractere);
  }
  return sortie;
}

/**
 * Objet JSON englobant la position donnée : on remonte jusqu'à son accolade
 * ouvrante, puis on relit vers l'avant en comptant les accolades hors chaînes.
 */
function objetEnglobant(texte: string, position: number): any | null {
  let profondeur = 0;
  let debut = -1;
  for (let i = position; i >= 0; i--) {
    const c = texte[i];
    if (c === "}") profondeur++;
    else if (c === "{") {
      if (profondeur === 0) {
        debut = i;
        break;
      }
      profondeur--;
    }
  }
  if (debut < 0) return null;

  let niveau = 0;
  let dansChaine = false;
  let echappe = false;
  for (let i = debut; i < texte.length; i++) {
    const c = texte[i];
    if (dansChaine) {
      if (echappe) echappe = false;
      else if (c === "\\") echappe = true;
      else if (c === '"') dansChaine = false;
      continue;
    }
    if (c === '"') dansChaine = true;
    else if (c === "{") niveau++;
    else if (c === "}") {
      niveau--;
      if (niveau === 0) {
        try {
          return JSON.parse(texte.slice(debut, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function versJoueur(brut: any): LnrJoueur | null {
  if (!brut || typeof brut !== "object") return null;
  const lastName = String(brut.lastName ?? "").trim();
  // Un essai de pénalité n'a pas d'auteur : la LNR écrit « n.a. »
  if (!lastName || lastName === "n.a.") return null;
  return {
    firstName: String(brut.firstName ?? "").trim(),
    lastName,
    url: typeof brut.url === "string" ? brut.url : undefined,
    isCaptain: Boolean(brut.isCaptain),
  };
}

const TYPES_FAIT: Record<string, LnrFait["type"]> = {
  essai: "essai",
  "essai-de-penalite": "essai-de-penalite",
  penalite: "penalite",
  drop: "drop",
  jaune: "jaune",
  rouge: "rouge",
};

/** Camp de l'USAP d'après l'URL, `{id}-{recevant}-{visiteur}`. */
function campUsapDepuisUrl(url: string): Camp {
  const dernier = url.split("/").filter(Boolean).pop() ?? "";
  return dernier.endsWith("-perpignan") ? "away" : "home";
}

/**
 * Faits de match et changements d'une feuille LNR.
 *
 * @param url URL de la feuille, sans onglet — l'onglet `resumes-replays` est
 *            ajouté ici.
 */
export async function lireFeuille(url: string): Promise<LnrFeuille> {
  const html = decoderEntites(await lirePage(`${url}/resumes-replays`));

  // ---- Faits de match ---------------------------------------------------
  const faits = new Map<string, LnrFait>();
  for (const trouve of html.matchAll(/"slugType":"(point|exclusion-joueur)"/g)) {
    const brut = objetEnglobant(html, trouve.index!);
    if (!brut?.id || !brut.slugSubType) continue;
    const type = TYPES_FAIT[brut.slugSubType];
    if (!type) continue;
    faits.set(brut.id, {
      type,
      club: brut.club === "home" ? "home" : "away",
      minute: Number(brut.minute ?? 0) + Number(brut.additionalMinute ?? 0),
      joueur: versJoueur(brut.player),
      transformePar: versJoueur(brut.conversionPlayer),
    });
  }

  // ---- Changements -------------------------------------------------------
  const changements = new Map<string, LnrChangement>();
  for (const trouve of html.matchAll(/"in":\{"photo"/g)) {
    const brut = objetEnglobant(html, trouve.index!);
    if (!brut?.in || !brut.out) continue;
    const entrant = versJoueur(brut.in);
    const sortant = versJoueur(brut.out);
    if (!entrant || !sortant) continue;
    const minute = Number(brut.minute ?? 0);
    const cle = `${minute}|${entrant.lastName}|${sortant.lastName}`;
    changements.set(cle, {
      club: brut.club === "home" ? "home" : "away",
      minute,
      type: String(brut.type ?? ""),
      entrant,
      sortant,
    });
  }

  return {
    url,
    campUsap: campUsapDepuisUrl(url),
    faits: [...faits.values()].sort((a, b) => a.minute - b.minute),
    changements: [...changements.values()].sort((a, b) => a.minute - b.minute),
  };
}

/** Points marqués par un fait de match. */
export function pointsDuFait(type: LnrFait["type"], transforme: boolean): number {
  switch (type) {
    case "essai":
      return 5 + (transforme ? 2 : 0);
    case "essai-de-penalite":
      return 7;
    case "penalite":
    case "drop":
      return 3;
    default:
      return 0;
  }
}

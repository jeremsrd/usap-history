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
 *
 * Les compositions font exception : elles sont rendues en HTML classique, et
 * `lireCompositions()` les lit à part. La LNR ne les publie d'ailleurs pas
 * pour toutes ses archives — sur une partie de 2022-2023, la page n'affiche
 * que les officiels de match.
 *
 * `club` vaut « home » ou « away » ; le camp de l'USAP se déduit de l'URL,
 * de la forme `{id}-{recevant}-{visiteur}`.
 */

/**
 * La LNR sépare ses deux divisions sur deux sites, de structure identique.
 * Le Top 14 est le défaut ; une saison de Pro D2 demande de basculer avant
 * tout appel, par `utiliserDivision("prod2")`.
 *
 * L'état est global au module, ce qui suffit ici : une saison appartient à une
 * division et une seule, et aucun script n'en traite deux à la fois.
 */
const RACINES = {
  top14: "https://top14.lnr.fr",
  prod2: "https://prod2.lnr.fr",
} as const;

export type Division = keyof typeof RACINES;

let RACINE: string = RACINES.top14;

export function utiliserDivision(division: Division): void {
  RACINE = RACINES[division];
}

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
  /**
   * Auteur de la transformation, sur un essai transformé — **et il ment**.
   *
   * Il l'est souvent, pas toujours. Trois façons de se tromper, toutes
   * rencontrées : il porte parfois un joueur de l'**autre équipe** — l'essai
   * lyonnais de Monty Ioane, le 20 avril 2024, est donné transformé par Jake
   * McIntyre, ouvreur catalan ; il se pose parfois sur un fait qui n'est pas
   * un essai, un carton, pour désigner en réalité la transformation de
   * l'essai précédent ; et il manque parfois alors que la transformation a
   * bien eu lieu.
   *
   * **Ne jamais s'en servir pour décider qu'il y a eu transformation** : seul
   * `score` le dit. Ne l'employer que pour **nommer** le buteur, et seulement
   * s'il figure dans la composition de l'équipe concernée.
   */
  transformePar: LnrJoueur | null;
  /**
   * Score après le fait, `[recevant, visiteur]`, tel que la LNR l'affiche.
   * Seuls les faits marquants en portent un ; c'est la seule donnée qui dise
   * de façon sûre si un essai a été transformé.
   *
   * Il déraille pourtant lui aussi : à Toulouse le 13 septembre 2025, deux
   * points sont inscrits **avant** l'essai qui les vaut, et le 6 mai 2023 à
   * Lyon la dernière transformation du match n'apparaît nulle part. Le total
   * final, lui, est toujours juste — c'est lui qui tranche.
   */
  score: [number, number] | null;
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
  /**
   * Coup d'envoi réel, ISO avec fuseau — « 2021-09-04T16:05:00+02:00 ». Seule
   * source de l'heure du match : le calendrier n'affiche l'horaire que des
   * rencontres à venir.
   */
  coupDEnvoi: string | null;
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

export interface LnrRencontre {
  url: string;
  /** Club recevant et club visiteur, tels que la LNR les nomme dans l'URL. */
  recevant: string;
  visiteur: string;
  scoreRecevant: number;
  scoreVisiteur: number;
}

/**
 * Résultat de l'USAP sur une phase donnée, lu sur la page de calendrier.
 *
 * Le score ne se trouve nulle part ailleurs de façon sûre : celui que la
 * feuille de match égrène au fil des actions saute parfois une transformation
 * (cf. `lireFeuille`). Le lien de la carte, lui, porte le score final.
 */
export async function lireCalendrier(
  saison: string,
  phase: string,
): Promise<LnrRencontre | null> {
  const html = (await lirePage(`${RACINE}/calendrier-et-resultats/${saison}/${phase}`))
    .replace(/\s+/g, " ");
  const carte = html.match(
    new RegExp(
      `href="${RACINE}/feuille-de-match/${saison}/${phase}/(\\d+)-([a-z0-9-]*perpignan[a-z0-9-]*)"` +
        `\\s*class="match-line__score"\\s*>\\s*(\\d+) - (\\d+)\\s*<`,
    ),
  );
  if (!carte) return null;

  const [, identifiant, slug, dom, ext] = carte;
  const clubs = slug.replace(/^perpignan-/, "perpignan|").replace(/-perpignan$/, "|perpignan");
  const [recevant, visiteur] = clubs.split("|");
  return {
    url: `${RACINE}/feuille-de-match/${saison}/${phase}/${identifiant}-${slug}`,
    recevant,
    visiteur,
    scoreRecevant: Number(dom),
    scoreVisiteur: Number(ext),
  };
}

/**
 * Coup d'envoi d'une rencontre, y compris à venir.
 *
 * La feuille d'un match non joué n'a ni faits ni changements, mais elle porte
 * déjà son horaire — que le calendrier, lui, n'affiche pas une fois la saison
 * commencée. Attention au bandeau de la prochaine journée, qui pose le même
 * champ en haut de chaque page : on s'ancre sur le composant du match.
 */
export async function lireCoupDEnvoi(url: string): Promise<string | null> {
  const html = decoderEntites(await lirePage(url));
  return (
    html.match(/header-timeline[\s\S]{0,600}?"firstPeriodStartDate":"([^"]+)"/)?.[1] ?? null
  );
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
      score:
        Array.isArray(brut.score) && brut.score.length === 2
          ? [Number(brut.score[0]), Number(brut.score[1])]
          : null,
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
    // Le bandeau de la prochaine journée porte le même champ en haut de page :
    // on s'ancre sur le composant du match, pas sur le premier venu.
    coupDEnvoi:
      html.match(/header-timeline[\s\S]{0,600}?"firstPeriodStartDate":"([^"]+)"/)?.[1] ?? null,
    faits: [...faits.values()].sort((a, b) => a.minute - b.minute),
    changements: [...changements.values()].sort((a, b) => a.minute - b.minute),
  };
}

// =============================================================================
// COMPOSITIONS
// =============================================================================

export interface LnrTitulaire extends LnrJoueur {
  /** Numéro de maillot, 1 à 23. */
  numero: number;
  isStarter: boolean;
}

export interface LnrCompositions {
  usap: LnrTitulaire[];
  adversaire: LnrTitulaire[];
  /** Arbitre central, tel que la page le nomme parmi les officiels. */
  arbitre: string | null;
}

/**
 * Sépare « Giorgi AKHALADZE » en prénom et nom : la LNR met le nom de famille
 * en capitales, ce qui reste vrai des noms composés (« Dany PRISO MOUANGUE »).
 */
function separerNom(complet: string): { firstName: string; lastName: string } {
  const mots = complet.trim().split(/\s+/);
  let debut = mots.length;
  while (debut > 0) {
    const mot = mots[debut - 1];
    // Un mot est « en capitales » s'il ne contient aucune minuscule
    if (mot !== mot.toUpperCase() || !/[A-ZÀ-Ý]/.test(mot)) break;
    debut--;
  }
  if (debut === 0 || debut === mots.length) {
    // Pas de capitales détectables : dernier mot pour nom, le reste pour prénom
    return {
      firstName: mots.slice(0, -1).join(" "),
      lastName: mots[mots.length - 1] ?? complet,
    };
  }
  return {
    firstName: mots.slice(0, debut).join(" "),
    lastName: mots.slice(debut).join(" "),
  };
}

/**
 * « FAINGA'A » → « Fainga'a », « LE GARREC » → « Le Garrec ».
 *
 * La LNR écrit les noms de famille en capitales : les reprendre tels quels
 * ferait entrer en base des fiches criardes, et surtout incohérentes avec les
 * 1 380 existantes. Chaque composant d'un nom composé est repris séparément,
 * apostrophes et traits d'union compris.
 */
function capitaliser(nom: string): string {
  if (nom !== nom.toUpperCase()) return nom.trim();
  return nom
    .trim()
    .toLowerCase()
    .replace(/(^|[\s'-])([a-zà-ÿ])/g, (_, avant, lettre) => avant + lettre.toUpperCase());
}

/** Fiche joueur LNR → identifiant stable, `184-giorgi-akhaladze`. */
function identifiant(href: string): string {
  return href.split("/joueur/")[1] ?? href;
}

/**
 * Compositions officielles des deux équipes, numéros compris.
 *
 * L'onglet `/compositions` est du HTML classique, pas du JSON embarqué. Le
 * XV de départ est dessiné sur un terrain (`player-pitch`), chaque joueur
 * portant le maillot de son club dans l'URL de son image : c'est ce qui
 * permet d'attribuer les blocs sans se fier à leur ordre, qui varie d'une
 * feuille à l'autre. Les listes du bas (`player-block`) répètent le XV puis
 * donnent les remplaçants, sans mention du club : chaque liste est rattachée
 * en comparant son XV à ceux du terrain.
 */
/**
 * Les postes que cette page affiche **ne sont pas fiables** : un ailier y est
 * donné « demi de mêlée ». Ils décrivent le poste de référence du joueur, pas
 * celui du jour — `positionPlayed` se déduit du numéro de maillot, jamais
 * d'ici.
 */
export async function lireCompositions(url: string): Promise<LnrCompositions> {
  // Les noms sont écrits en entités dans le HTML : « FAINGA&#039;A »
  const html = decoderEntites(await lirePage(`${url}/compositions`));
  const campUsap = campUsapDepuisUrl(url);

  // La LNR ne publie pas les compositions de toutes ses archives : sur une
  // partie de 2022-2023, la page n'affiche que les officiels de match.
  if (html.includes("line-up--empty") || html.includes("ne sont pas disponibles")) {
    throw new Error(`Compositions non publiées par la LNR : ${url}`);
  }

  // ---- XV de départ, depuis le terrain ------------------------------------
  const parClub = new Map<string, LnrTitulaire[]>();
  const identitesParClub = new Map<string, Set<string>>();

  // Le capitaine porte une classe de plus (`player-pitch--captain`) : la
  // liste des classes est capturée plutôt que figée.
  const blocsTerrain = html.matchAll(
    /class="(player-pitch[^"]*player-pitch--position-\d+)"\s*href="([^"]+)"([\s\S]*?)<\/a>/g,
  );
  for (const bloc of blocsTerrain) {
    const classes = bloc[1];
    const href = bloc[2];
    const corps = bloc[3];
    const club = corps.match(/cdn\.lnr\.fr\/club\/([a-z0-9-]+)\//)?.[1];
    const numero = Number(corps.match(/player-pitch__number">(\d+)</)?.[1]);
    const firstName = corps.match(/player-pitch__first-name">([^<]*)</)?.[1]?.trim();
    const lastName = corps.match(/player-pitch__last-name">([^<]*)</)?.[1]?.trim();
    if (!club || !numero || !lastName) continue;

    if (!parClub.has(club)) {
      parClub.set(club, []);
      identitesParClub.set(club, new Set());
    }

    // Certaines feuilles dessinent deux terrains : le XV de départ, puis
    // l'équipe telle qu'elle a fini la rencontre. Le second porte les mêmes
    // dossards avec d'autres joueurs — on s'en tient au premier, seul à
    // décrire une composition de départ.
    if (parClub.get(club)!.some((joueur) => joueur.numero === numero)) continue;
    // Le second terrain peut aussi introduire un dossard neuf : Alfred
    // Parisien, entré avec le 22, figure sur celui de Lyon à Aimé-Giral le
    // 29 octobre 2022, et la liste des remplaçants l'oublie. Une équipe ne
    // commence jamais à seize : passé le quinzième, on le tient pour un
    // remplaçant.
    const titulaires = parClub.get(club)!.filter((j) => j.isStarter).length;
    parClub.get(club)!.push({
      numero,
      firstName: capitaliser(firstName ?? ""),
      lastName: capitaliser(lastName),
      url: href,
      isCaptain: classes.includes("player-pitch--captain"),
      isStarter: titulaires < 15,
    });
    identitesParClub.get(club)!.add(identifiant(href));
  }

  // ---- Remplaçants, depuis les listes du bas -------------------------------
  const sections = html.split('class="line-up__classic-team"').slice(1);
  for (const section of sections) {
    const lire = (extrait: string) =>
      [
        ...extrait.matchAll(
          /href="([^"]+)"\s+class="(player-block[^"]*player-block--lineup)"([\s\S]*?)<\/a>/g,
        ),
      ].map((bloc) => ({
        href: bloc[1],
        capitaine: bloc[2].includes("player-block--captain"),
        numero: Number(bloc[3].match(/player-block__number">(\d+)</)?.[1]),
        nom: bloc[3].match(/player-block__name">([^<]*)</)?.[1]?.trim() ?? "",
      }));

    // La section entière sert à reconnaître le club — elle répète le XV que
    // le terrain a déjà donné.
    const tousLesBlocs = lire(section);
    if (tousLesBlocs.length === 0) continue;

    let club: string | null = null;
    for (const [candidat, identites] of identitesParClub) {
      const communs = tousLesBlocs.filter((b) =>
        identites.has(identifiant(b.href)),
      ).length;
      if (communs >= 8) {
        club = candidat;
        break;
      }
    }
    if (!club) continue;

    // Seule la liste des remplaçants apporte du nouveau. Sur les feuilles à
    // double composition, elle est écrite deux fois — XV et banc de départ,
    // puis équipe de fin de match : on ne garde que la première occurrence de
    // chaque dossard.
    const remplacants = section.indexOf("Remplaçants");
    const blocs: typeof tousLesBlocs = [];
    for (const bloc of remplacants >= 0 ? lire(section.slice(remplacants)) : tousLesBlocs) {
      if (blocs.some((autre) => autre.numero === bloc.numero)) continue;
      blocs.push(bloc);
    }

    const dejaVus = identitesParClub.get(club)!;
    for (const bloc of blocs) {
      if (!bloc.numero || !bloc.nom || dejaVus.has(identifiant(bloc.href))) continue;
      const { firstName, lastName } = separerNom(bloc.nom);
      parClub.get(club)!.push({
        numero: bloc.numero,
        firstName: capitaliser(firstName),
        lastName: capitaliser(lastName),
        url: bloc.href,
        isCaptain: bloc.capitaine,
        isStarter: false,
      });
      dejaVus.add(identifiant(bloc.href));
    }
  }

  // Une équipe n'a qu'un capitaine. Quand la feuille en désigne plusieurs —
  // celle du 29 octobre 2022 pose le brassard sur les quinze Catalans —, le
  // renseignement ne vaut rien : on le retire plutôt que d'en inventer un.
  // Aucun capitaine signalé veut alors dire « la feuille ne le dit pas », et
  // non « personne ne l'était ».
  for (const joueurs of parClub.values()) {
    if (joueurs.filter((j) => j.isCaptain).length > 1) {
      for (const j of joueurs) j.isCaptain = false;
    }
  }

  const usap = parClub.get("perpignan") ?? [];
  const autre = [...parClub.entries()].find(([club]) => club !== "perpignan");
  if (usap.length === 0 || !autre) {
    throw new Error(`Compositions illisibles : ${url} (camp USAP ${campUsap})`);
  }

  const trier = (liste: LnrTitulaire[]) =>
    [...liste].sort((a, b) => a.numero - b.numero);

  // Les officiels sont rendus comme des joueurs, leur poste portant le rôle.
  const arbitre =
    html
      .match(
        /player-block__name">([^<]*)<\/p>\s*<p class="player-block__position">\s*Arbitre Central/,
      )?.[1]
      ?.trim() ?? null;

  return { usap: trier(usap), adversaire: trier(autre[1]), arbitre };
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

/**
 * Segments d'URL possibles pour le barrage d'accession, du plus probable au
 * moins, selon la saison.
 *
 * La LNR l'a renommé trois fois : « match-daccession » en 2021-2022,
 * « access » en 2022-2023, « access-top-14 » depuis 2024-2025. On essaie dans
 * l'ordre le plus vraisemblable plutôt que de trancher, les bornes n'étant
 * connues que par les saisons effectivement reprises.
 */
export function phasesBarrage(saison: string): string[] {
  const debut = Number(saison.slice(0, 4));
  if (debut >= 2024) return ["access-top-14", "access"];
  if (debut >= 2022) return ["access", "access-top-14"];
  return ["match-daccession", "access"];
}

/**
 * Phases à essayer pour un match : journée, phase finale ou barrage.
 *
 * `contexte` est ce que la base dit du match — nom de compétition et libellé
 * de tour, concaténés. La demi-finale se teste avant la finale, « demi-finale »
 * contenant « finale ».
 *
 * Rend une liste vide quand rien ne correspond : une rencontre de coupe
 * d'Europe, que la LNR ne couvre pas.
 */
export function phasesLnr(
  saison: string,
  matchday: number | null,
  contexte: string,
): string[] {
  if (matchday != null) return [`j${matchday}`];
  if (/demi[\s-]?finale/i.test(contexte)) return ["demi-finales"];
  if (/finale/i.test(contexte)) return ["finale"];
  if (/barrage|accession|access/i.test(contexte)) return phasesBarrage(saison);
  return [];
}

export interface Realisations {
  essais: number;
  transformations: number;
  penalites: number;
  drops: number;
  essaisDePenalite: number;
  /** Points reconstitués, à confronter au score. */
  total: number;
}

/**
 * Réalisations d'un camp, déduites des faits de match.
 *
 * Les essais, pénalités et drops se comptent. Les transformations, non : la
 * feuille ne les inscrit pas comme des faits, et `conversionPlayer` ment (cf.
 * lib/lnr.ts). C'est le **score courant** qui les révèle — tout reliquat de
 * deux points sur un essai qui n'en a pas encore est une transformation. Le
 * total du match tranche en dernier ressort, la feuille s'arrêtant parfois
 * avant la dernière.
 */
export function realisationsDepuisFaits(
  faits: LnrFait[],
  camp: Camp,
  score: number,
): Realisations {
  const cote = camp === "home" ? 0 : 1;
  const bilan: Realisations = {
    essais: 0,
    transformations: 0,
    penalites: 0,
    drops: 0,
    essaisDePenalite: 0,
    total: 0,
  };
  let aTransformer = 0;

  for (const fait of faits) {
    if (fait.club === camp) {
      switch (fait.type) {
        case "essai":
          bilan.essais++;
          bilan.total += 5;
          aTransformer++;
          break;
        case "essai-de-penalite":
          bilan.essaisDePenalite++;
          bilan.total += 7;
          break;
        case "penalite":
          bilan.penalites++;
          bilan.total += 3;
          break;
        case "drop":
          bilan.drops++;
          bilan.total += 3;
          break;
      }
    }
    if (!fait.score) continue;
    let residu = fait.score[cote] - bilan.total;
    while (residu >= 2 && aTransformer > 0) {
      bilan.transformations++;
      bilan.total += 2;
      aTransformer--;
      residu -= 2;
    }
  }

  let manque = score - bilan.total;
  while (manque >= 2 && aTransformer > 0) {
    bilan.transformations++;
    bilan.total += 2;
    aTransformer--;
    manque -= 2;
  }
  return bilan;
}

// =============================================================================
// EFFECTIF D'UN CLUB
// =============================================================================

export interface LnrEffectifJoueur {
  /** Identifiant LNR, stable d'une saison à l'autre : 594 pour Urdapilleta. */
  id: number;
  /** Segment d'URL de sa fiche : `594-benjamin-urdapilleta`. */
  slug: string;
  /** Prénoms tels qu'écrits, seconds prénoms compris : « Sama Leonardo ». */
  prenoms: string;
  /** Nom de famille, en capitales sur la page : « MALOLO », « GOMES SA ». */
  nom: string;
  /** Le poste tel que la LNR le groupe : « 1ère ligne », « 3ème ligne »… */
  poste: string;
}

/**
 * L'effectif professionnel d'un club, depuis `/club/{club}/effectif-staff`.
 *
 * Contrairement aux feuilles de match, cette page n'embarque pas de JSON : les
 * joueurs sont du HTML ordinaire, une ancre `player-block` par joueur, dont le
 * lien porte l'identifiant LNR. Le staff est rendu à part et n'a pas de lien
 * `/joueur/`, il ne remonte donc pas ici.
 *
 * Le nom est écrit « Prénom NOM », le nom de famille tout en capitales — c'est
 * la seule source qui dise où couper, et elle règle les cas que les feuilles
 * de match rendent ambigus (« Sama Leonardo | MALOLO »).
 *
 * Attention, le poste est **plus grossier que l'enum du projet** : « 1ère
 * ligne » confond les deux piliers et le talonneur, « 3ème ligne » englobe le
 * numéro 8. La fiche individuelle du joueur n'en dit pas plus. Il n'y a donc
 * pas de quoi renseigner `Position` pour ces deux groupes.
 */
export async function lireEffectif(
  club: string,
): Promise<LnrEffectifJoueur[]> {
  const html = await lirePage(`${RACINE}/club/${club}/effectif-staff`);
  const blocs = html.split(
    /<a href="https:\/\/top14\.lnr\.fr\/joueur\/(\d+)-([a-z0-9-]+)"[^>]*class="player-block/,
  );

  const effectif: LnrEffectifJoueur[] = [];
  // Le découpage rend [avant, id, slug, corps, id, slug, corps, …].
  for (let i = 1; i + 2 < blocs.length + 1; i += 3) {
    const id = Number(blocs[i]);
    const slug = blocs[i + 1];
    const corps = blocs[i + 2] ?? "";
    const nomComplet = corps.match(/player-block__name">([^<]+)</);
    const poste = corps.match(/player-block__position">([^<]*)</);
    if (!nomComplet) continue;

    const mots = decoderEntites(nomComplet[1]).trim().split(/\s+/);
    // Le nom de famille est la traîne en capitales ; tout ce qui précède est
    // prénom. « GOMES SA » et « DE LA FUENTE » restent donc d'un seul tenant.
    let coupe = mots.length - 1;
    while (coupe > 0 && mots[coupe - 1] === mots[coupe - 1].toUpperCase()) {
      coupe--;
    }
    effectif.push({
      id,
      slug,
      prenoms: mots.slice(0, coupe).join(" "),
      nom: mots.slice(coupe).join(" "),
      poste: poste ? decoderEntites(poste[1]).trim() : "",
    });
  }
  return effectif;
}

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
  /**
   * Auteur de la transformation, sur un essai transformé. Champ à recouper :
   * la LNR y met parfois un joueur de l'autre équipe, et l'omet parfois alors
   * que le score prouve la transformation — d'où `score`.
   */
  transformePar: LnrJoueur | null;
  /**
   * Score après le fait, `[recevant, visiteur]`, tel que la LNR l'affiche.
   * Seuls les faits marquants en portent un ; c'est la seule donnée qui dise
   * de façon sûre si un essai a été transformé.
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

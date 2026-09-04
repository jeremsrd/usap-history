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

/**
 * Lit une page de la LNR, en réessayant **avec une attente croissante**.
 *
 * LA LNR PLAFONNE LE DÉBIT. Un script qui enchaîne les requêtes — une reprise
 * de saison en fait une trentaine, l'audit complet cinq cents — se fait couper
 * au bout d'un moment, et la coupure disparaît dès qu'on cesse d'insister :
 * le 1er septembre 2026, trois audits complets d'affilée ont rendu 175, 54
 * puis 268 matchs examinés quand le réseau était sain avant et après chacun.
 *
 * **La version précédente réessayait trois fois sans attendre**, ce qui était
 * le contraire du remède : trois requêtes de plus dans le même instant,
 * ajoutées à celles qui venaient de déclencher la limitation, et les trois
 * tentatives épuisées en quelques millisecondes. Une reprise de 2007-2008 est
 * morte ainsi à la dix-huitième journée, emportant les dix-sept précédentes.
 *
 * On attend donc 2, puis 4, puis 8 secondes, et **on annonce la reprise** :
 * une source qui lâche à répétition dit quelque chose, un script qui s'en
 * remet en silence le cacherait. C'est la règle déjà appliquée à
 * `avecReconnexion()` de `audit-opponent-lineups.ts`, pour la base.
 *
 * Un statut HTTP refusé est traité comme une panne — c'est sous cette forme
 * que le plafonnement se manifeste —, et il est rapporté dans le message
 * final, l'ancienne version le passant sous silence.
 */
async function lirePage(url: string): Promise<string> {
  const TENTATIVES = 4;
  let dernier = "cause inconnue";
  for (let essai = 1; essai <= TENTATIVES; essai++) {
    try {
      const reponse = await fetch(url, { signal: AbortSignal.timeout(25_000) });
      if (reponse.ok) return await reponse.text();
      dernier = `HTTP ${reponse.status}`;
    } catch (erreur) {
      const nom = (erreur as Error).name;
      dernier = nom === "TimeoutError" ? "délai dépassé" : (erreur as Error).message;
    }
    if (essai < TENTATIVES) {
      const attente = 2000 * 2 ** (essai - 1);
      console.log(
        `  ↻ LNR ${dernier} — reprise ${essai}/${TENTATIVES - 1} dans ${attente / 1000}s`,
      );
      await new Promise((resoudre) => setTimeout(resoudre, attente));
    }
  }
  throw new Error(`LNR injoignable (${dernier}) : ${url}`);
}

/**
 * URL de la feuille de match de l'USAP pour une phase donnée.
 *
 * @param saison « 2024-2025 »
 * @param phase  « j24 » pour une journée, « access-top-14 » pour un barrage.
 *               Le segment a changé de nom au fil des saisons : « access » en
 *               2022-2023, « access-top-14 » depuis 2024-2025.
 */
/**
 * FEUILLES QUE LE CALENDRIER ARCHIVÉ NE LIE PAS.
 *
 * Certaines pages de journée sont amputées : celle de la J11 de 2007-2008 ne
 * publie que 2 rencontres sur 7, celle de la J24 en publie 5 sur 7, et dans
 * les deux cas la rencontre de l'USAP manque. `chercherFeuille` et
 * `lireCalendrier` lisent la page de la journée : ils ne peuvent rien y
 * trouver.
 *
 * **Les feuilles existent pourtant.** Les identifiants de la LNR sont
 * séquentiels : ceux de la J11 vont de 3878 à 3884 sur la page et ceux de la
 * J12 commencent à 3889, si bien qu'un balayage de l'intervalle rend
 * `3883-perpignan-auch`. Même méthode pour la J24, entre 3975 et 3979 :
 * `3970-auch-perpignan` répond.
 *
 * Leurs dates disent pourquoi elles manquent — 23 février et 30 mai 2008,
 * hors de leur journée : ce sont deux matchs reportés, que la page d'origine
 * n'a jamais listés.
 *
 * **La table est ici, et non dans un script de saison**, parce que toute la
 * chaîne en dépend : le script de saison, mais aussi `seed-lineup.ts`,
 * `seed-opponent-sheet.ts` et `seed-chronologie.ts`, qui cherchent chacun
 * leur feuille par le calendrier. La poser ailleurs, c'était la réécrire
 * quatre fois — ou, plus vraisemblablement, l'oublier trois.
 *
 * Les scores sont donnés parce que `lireCalendrier` les rend d'ordinaire, et
 * qu'ils font foi sur le score final. Ils ne sont pas crus sur parole : le
 * script de saison les confronte aux faits de la feuille officielle.
 */
const FEUILLES_HORS_CALENDRIER: Record<string, LnrRencontre> = {
  // **2006-2007 en compte trois**, et le motif y est encore plus net qu'en
  // 2007-2008 : chaque journée aligne 7 rencontres, les pages n'en publient
  // que 6, et l'identifiant manquant est **exactement le trou entre deux
  // journées** — 3415 entre J5 et J6, 3450 entre J10 et J11, 3541 entre J23
  // et J24. Les clubs absents de la page désignent l'adversaire : Bourgoin
  // une fois, Agen deux.
  //
  // Les scores viennent du score courant final de chaque feuille, et ils sont
  // confirmés par le classement : avec eux, la colonne des points encaissés
  // de la saison retombe sur les 398 annoncés, au point près.
  "2006-2007/j6": {
    url: "https://top14.lnr.fr/feuille-de-match/2006-2007/j6/3415-bourgoin-perpignan",
    recevant: "bourgoin",
    visiteur: "perpignan",
    scoreRecevant: 22,
    scoreVisiteur: 3,
  },
  "2006-2007/j11": {
    url: "https://top14.lnr.fr/feuille-de-match/2006-2007/j11/3450-agen-perpignan",
    recevant: "agen",
    visiteur: "perpignan",
    scoreRecevant: 6,
    scoreVisiteur: 13,
  },
  "2006-2007/j24": {
    url: "https://top14.lnr.fr/feuille-de-match/2006-2007/j24/3541-perpignan-agen",
    recevant: "perpignan",
    visiteur: "agen",
    scoreRecevant: 31,
    scoreVisiteur: 18,
  },
  "2007-2008/j11": {
    url: "https://top14.lnr.fr/feuille-de-match/2007-2008/j11/3883-perpignan-auch",
    recevant: "perpignan",
    visiteur: "auch",
    scoreRecevant: 28,
    scoreVisiteur: 23,
  },
  "2007-2008/j24": {
    url: "https://top14.lnr.fr/feuille-de-match/2007-2008/j24/3970-auch-perpignan",
    recevant: "auch",
    visiteur: "perpignan",
    scoreRecevant: 13,
    scoreVisiteur: 25,
  },
  // **2005-2006 EN COMPTE CINQ, ET LE BALAYAGE N'Y SUFFIT PLUS.** Les
  // identifiants restent séquentiels, mais les journées ne sont plus jouées
  // dans l'ordre : la J16 se joue le 11 mars, après la J17 du 18 février et la
  // J18 du 3 mars, et leurs identifiants s'entrelacent — J15 à 3055, J17 à
  // 3062, J18 de 3064 à 3070, J16 de 3072 à 3077. Il n'y a donc pas de « trou
  // entre deux journées » où lire l'identifiant manquant.
  //
  // Ce qui reste vrai, c'est que **les clubs absents de la page désignent la
  // rencontre**. Les six ou sept matchs publiés nomment douze ou treize des
  // quatorze clubs ; les deux qui manquent sont les deux qui jouaient le match
  // non publié, et l'un des deux est Perpignan. Le slug est alors connu, et il
  // ne reste qu'à essayer les identifiants libres de la plage — treize au plus
  // ici, dans les deux sens de la rencontre.
  //
  // **Les cinq scores ne viennent pas de la feuille**, dont le score courant
  // est ici muet ou incomplet, mais du tableau croisé de Wikipédia. Ils ne
  // sont pas crus sur parole : les vingt et une rencontres que la LNR publie
  // totalisent 584 points marqués et 304 encaissés, pour 16 V et 5 D ; le
  // classement en annonce 671, 398, 18 V et 8 D. Les cinq manquantes doivent
  // donc valoir exactement 87 points marqués, 94 encaissés, 2 victoires et
  // 3 défaites — et les cinq scores de Wikipédia donnent 87, 94, 2 et 3. Trois
  // égalités indépendantes, aucune marge.
  "2005-2006/j2": {
    url: "https://top14.lnr.fr/feuille-de-match/2005-2006/j2/2959-biarritz-perpignan",
    recevant: "biarritz",
    visiteur: "perpignan",
    scoreRecevant: 29,
    scoreVisiteur: 8,
  },
  "2005-2006/j6": {
    url: "https://top14.lnr.fr/feuille-de-match/2005-2006/j6/2987-toulouse-perpignan",
    recevant: "toulouse",
    visiteur: "perpignan",
    scoreRecevant: 30,
    scoreVisiteur: 22,
  },
  "2005-2006/j15": {
    url: "https://top14.lnr.fr/feuille-de-match/2005-2006/j15/3055-perpignan-biarritz",
    recevant: "perpignan",
    visiteur: "biarritz",
    scoreRecevant: 3,
    scoreVisiteur: 17,
  },
  "2005-2006/j17": {
    url: "https://top14.lnr.fr/feuille-de-match/2005-2006/j17/3062-perpignan-castres",
    recevant: "perpignan",
    visiteur: "castres",
    scoreRecevant: 34,
    scoreVisiteur: 3,
  },
  "2005-2006/j18": {
    url: "https://top14.lnr.fr/feuille-de-match/2005-2006/j18/3064-clermont-perpignan",
    recevant: "clermont",
    visiteur: "perpignan",
    scoreRecevant: 15,
    scoreVisiteur: 20,
  },
};

export async function chercherFeuille(
  saison: string,
  phase: string,
): Promise<string | null> {
  const hors = FEUILLES_HORS_CALENDRIER[`${saison}/${phase}`];
  if (hors) return hors.url;
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
  const hors = FEUILLES_HORS_CALENDRIER[`${saison}/${phase}`];
  if (hors) return hors;
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
 * Jour et heure d'une rencontre, à partir du coup d'envoi de la feuille.
 *
 * **Un coup d'envoi à 00:00 veut dire « heure inconnue »**, non « joué à
 * minuit ». La LNR en laisse ici et là : le Perpignan-Dax de la première
 * journée de 2015-2016 est annoncé « 2015-08-21T00:00:00+02:00 » quand les
 * sept autres matchs de la même journée portent une heure réelle, de 19h00 à
 * 20h45. C'est un trou dans sa donnée, pas un horaire.
 *
 * Et ce trou déplace le match d'un jour si on le prend au mot : minuit à
 * +02:00, c'est 22 heures la veille en temps universel, si bien qu'un
 * `toISOString()` rend le 20 août pour une rencontre du 21. On rend donc
 * l'heure `null`, et on ancre la date à **midi en temps universel** du jour
 * annoncé — aucun fuseau ne peut alors la faire changer de jour, quand minuit
 * la ferait basculer dans tout l'ouest.
 *
 * **ET LE TROU NE VAUT PAS TOUJOURS EXACTEMENT MINUIT.** La demi-finale du
 * 2 juin 2006 est annoncée « 2006-06-02T01:00:00+02:00 » — une heure du matin,
 * quand les vingt-six journées de la même saison sont toutes à 00:00 sauf une.
 * Prise au mot, elle recule la rencontre au 1er juin, la LNR datant elle-même
 * le match du 2 comme Wikipédia. C'est le même trou, décalé d'une heure.
 *
 * La règle porte donc sur une **plage** et non sur une valeur : un coup
 * d'envoi avant huit heures du matin n'est pas un horaire de rugby. Aucune
 * rencontre de la base n'en porte un qui soit réel — les vrais coups d'envoi
 * vont de 11h05 à 21h15 —, et la borne est assez basse pour qu'un match
 * matinal, s'il en existait un, reste au-dessus. Vérifié : sur les 533 coups
 * d'envoi renseignés de la base, le plus matinal est à 12h30 et le plus
 * tardif à 21h05 — la borne n'en écarte aucun.
 *
 * Les autres coups d'envoi sont rendus tels quels : ce sont de vrais
 * instants, et ils tombent tous en soirée ou en après-midi.
 */
const PREMIERE_HEURE_PLAUSIBLE = 8;

export function momentDuMatch(coupDEnvoi: string): {
  date: Date;
  kickoffTime: string | null;
} {
  const heure = coupDEnvoi.slice(11, 16);
  if (Number(heure.slice(0, 2)) < PREMIERE_HEURE_PLAUSIBLE) {
    return { date: new Date(`${coupDEnvoi.slice(0, 10)}T12:00:00Z`), kickoffTime: null };
  }
  return { date: new Date(coupDEnvoi), kickoffTime: heure };
}

/**
 * L'ESSAI DE PÉNALITÉ COMPTE NEUF POINTS SUR LES FEUILLES D'AVANT 2017-2018,
 * ET SA TRANSFORMATION Y EST COMPTÉE DEUX FOIS.
 *
 * **Avant le changement de règle de 2017, l'essai de pénalité était un essai
 * comme un autre : cinq points, à transformer.** Depuis, il est accordé
 * d'office à sept, sans coup de pied. Les feuilles d'avant portent donc
 * réellement une transformation — la LNR **en nomme le buteur** dans
 * `conversionPlayer`, Enzo Selponi le 21 octobre 2016, Sébastien Descons le
 * 25 novembre, Joseph Carlisles le 15 janvier 2017 —, et c'est là que le
 * compte se casse : sa propre table de points valorise déjà l'essai de
 * pénalité à sept. La transformation est ainsi ajoutée une seconde fois, et
 * le score courant gagne neuf points au lieu de sept.
 *
 * Les huit essais de pénalité de 2016-2017, avec le score du camp avant et
 * après :
 *
 * | Match | Fait | Score du camp | Saut |
 * |---|---|---|---|
 * | Bourgoin, 21 octobre 2016 | EP 31' | 12 → 21 | 9 |
 * | Bourgoin, 21 octobre 2016 | EP 47' | 28 → 37 | 9 |
 * | Agen, 17 novembre 2016 | EP 73' | 16 → 25 | 9 |
 * | Narbonne, 25 novembre 2016 | EP 66' | 47 → 56 | 9 |
 * | Biarritz, 1er décembre 2016 | EP 64' | 15 → 22 | **7** |
 * | Albi, 16 décembre 2016 | EP 22' | 10 → 19 | 9 |
 * | Aurillac, 15 janvier 2017 | EP 31' | 8 → 17 | 9 |
 * | Colomiers, 20 janvier 2017 | EP 34' | 10 → 19 | 9 |
 *
 * **Les deux points ne tombent pas toujours au même endroit**, et c'est la
 * seule difficulté. Sept fois sur huit ils sont portés par l'essai de
 * pénalité lui-même, qui saute alors de neuf. À Biarritz il saute de sept, la
 * feuille ne nommant aucun buteur sur ce fait-là — et les deux points
 * arrivent au fait suivant, le carton de la 65ᵉ, où elle inscrit Lucu. On les
 * retranche donc là où ils apparaissent, au premier fait dont le score dépasse
 * de deux points ce que les faits du camp expliquent, plutôt qu'à une place
 * décidée d'avance.
 *
 * Ce qui démontre le double compte n'est d'ailleurs pas le saut — un essai
 * transformé entre-temps en ferait autant —, mais le **score final** : sans
 * correction, le score courant de Bourgoin finit à 49-15 quand le résultat
 * officiel est 45-15, celui de Narbonne à 68-13 pour 66-13, celui de Biarritz
 * à 24-19 pour 22-19, celui d'Aurillac à 43-20 pour 41-20. L'écart vaut
 * exactement deux points par essai de pénalité, sur les huit, et la correction
 * fait retomber les sept feuilles sur leur score officiel.
 *
 * **La base, elle, garde l'essai de pénalité à sept points**, transformation
 * comprise et non comptée — la convention de tout le reste du projet, dont
 * dépend la règle d'audit `points = score − 7 × penaltyTries`. C'est légitime
 * tant que la transformation a été réussie, ce qu'elle fut huit fois sur huit
 * en 2016-2017. **Un essai de pénalité manqué vaudrait cinq points**, et
 * l'arithmétique ne retomberait plus : `realisationsDepuisFaits` échouerait
 * bruyamment sur ce match. C'est le comportement voulu, et c'est un cas à
 * attendre en remontant plus haut.
 *
 * Pourquoi la borne à 2017-2018, et ce qu'elle vaut. Les saisons 2017-2018 à
 * 2025-2026, déjà en base, ont toutes été reprises avec un score courant lu
 * tel quel, et leurs essais de pénalité n'ont jamais fait diverger le total :
 * sur ces feuilles-là, il vaut bien sept, sans transformation. La borne est
 * donc attestée des deux côtés, et elle est celle de la règle.
 *
 * Réserve : rien n'est vérifié avant 2016-2017. Si une saison plus ancienne
 * comptait autrement, cela se verrait aussitôt — les reconstitutions de points
 * comparent toujours leur total au score officiel.
 */
function corrigerEssaisDePenalite(faits: LnrFait[], saison: string | null): void {
  if (!saison || Number(saison.slice(0, 4)) >= 2017) return;

  // Tant qu'un essai de pénalité reste en attente, le premier fait dont le
  // score dépasse de deux points ce que les faits du camp expliquent porte sa
  // transformation en double : c'est là qu'on la retranche, et de là qu'on
  // décale la suite.
  const decalage: [number, number] = [0, 0];
  const dernierBrut: [number, number] = [0, 0];
  const pointsDepuis: [number, number] = [0, 0];
  const enAttente: [number, number] = [0, 0];

  for (const fait of faits) {
    const cote = fait.club === "home" ? 0 : 1;
    pointsDepuis[cote] += pointsDuFait(fait.type, false);
    if (fait.type === "essai-de-penalite") enAttente[cote]++;
    if (!fait.score) continue;

    const brut: [number, number] = [fait.score[0], fait.score[1]];
    for (const k of [0, 1] as const) {
      if (enAttente[k] > 0 && brut[k] - dernierBrut[k] - pointsDepuis[k] >= 2) {
        decalage[k] += 2;
        enAttente[k]--;
      }
    }
    fait.score = [brut[0] - decalage[0], brut[1] - decalage[1]];
    dernierBrut[0] = brut[0];
    dernierBrut[1] = brut[1];
    pointsDepuis[0] = 0;
    pointsDepuis[1] = 0;
  }
}

/** Saison d'une feuille, d'après son URL : `/feuille-de-match/2016-2017/j8/…`. */
function saisonDepuisUrl(url: string): string | null {
  return url.match(/\/feuille-de-match\/(\d{4}-\d{4})\//)?.[1] ?? null;
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

  // Le score courant des feuilles d'avant 2017-2018 gonfle l'essai de
  // pénalité de deux points : on le ramène à ce qu'il vaut avant de le rendre.
  const faitsTries = [...faits.values()].sort((a, b) => a.minute - b.minute);
  corrigerEssaisDePenalite(faitsTries, saisonDepuisUrl(url));

  return {
    url,
    campUsap: campUsapDepuisUrl(url),
    // Le bandeau de la prochaine journée porte le même champ en haut de page :
    // on s'ancre sur le composant du match, pas sur le premier venu.
    coupDEnvoi:
      html.match(/header-timeline[\s\S]{0,600}?"firstPeriodStartDate":"([^"]+)"/)?.[1] ?? null,
    faits: faitsTries,
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
  /**
   * Camps dont la composition a été **écartée** parce que ses dossards sont
   * fabriqués — cf. `dossardsFabriques`. Leur liste est rendue vide.
   */
  fabriquees: ("usap" | "adversaire")[];
}

/**
 * LA LNR NUMÉROTE PARFOIS SES COMPOSITIONS PAR ORDRE ALPHABÉTIQUE.
 *
 * Ce n'est pas une erreur de dossard, c'est une composition qui n'existe pas.
 * Sur quinze journées de 2005-2006, sa page `/compositions` dessine sur le
 * terrain une **liste alphabétique de l'effectif du club**, numérotée de 1 à
 * 22 : la quinzième journée aligne ainsi Alvarez-Kairelis, Bomati, Bortolaso,
 * Bourret et Bozzi aux numéros 2 à 6 — cinq avants dans l'ordre du
 * dictionnaire, ce qui n'est pas une équipe de rugby. Les noms sont ceux du
 * club, l'ordre est celui de l'alphabet, et la liste est tronquée là où le
 * compte de vingt-deux est atteint : des joueurs qui n'ont pas disputé la
 * rencontre y figurent, et des titulaires en sont absents — le 7 janvier
 * 2006, la feuille nomme Opeti Fonua marqueur d'un essai à la 80e et ne
 * l'aligne pas.
 *
 * **LE MOTIF EST EN SERPENTIN**, la LNR remplissant son schéma du terrain
 * ligne par ligne, en alternant les sens : la suite monte puis redescend, si
 * bien qu'un simple contrôle de tri croissant la manque. Ce qui la trahit,
 * c'est que deux dossards voisins portent presque toujours deux noms
 * **voisins dans l'alphabet**, dans un sens ou dans l'autre.
 *
 * D'où cet indice : la part des couples de dossards consécutifs dont les rangs
 * alphabétiques diffèrent d'exactement un. Il sépare sans ambiguïté, et la
 * mesure porte sur toute la base :
 *
 *   - 2006-2007, 2007-2008, 2008-2009, 2013-2014, 2025-2026 : **jamais plus de
 *     0,32**, médiane autour de 0,10 ;
 *   - 2005-2006 : vingt-neuf équipes-matchs entre **0,48 et 0,95**, et les
 *     vingt-trois autres à 0,21 ou moins. Aucune valeur entre les deux.
 *
 * Le seuil est posé à 0,40, au milieu du vide. Une composition au-dessus est
 * **écartée**, jamais réparée : aucune source ne donne les vrais dossards de
 * ces rencontres.
 */
export function dossardsFabriques(joueurs: LnrTitulaire[]): boolean {
  if (joueurs.length < 10) return false;
  const noms = [...joueurs]
    .sort((a, b) => a.numero - b.numero)
    .map((j) => j.lastName.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase());
  const rang = new Map<string, number>();
  [...noms]
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .forEach((n, r) => {
      if (!rang.has(n)) rang.set(n, r);
    });
  let voisins = 0;
  for (let i = 1; i < noms.length; i++) {
    if (Math.abs(rang.get(noms[i])! - rang.get(noms[i - 1])!) === 1) voisins++;
  }
  return voisins / (noms.length - 1) >= 0.4;
}

/**
 * Sépare « Giorgi AKHALADZE » en prénom et nom : la LNR met le nom de famille
 * en capitales, ce qui reste vrai des noms composés (« Dany PRISO MOUANGUE »).
 */
/**
 * NOMS QUE LA LNR ÉCRIT À L'ENVERS, ET QU'AUCUNE RÈGLE NE PEUT REDRESSER.
 *
 * `separerNom` s'appuie sur la seule convention que la LNR respecte — le nom
 * de famille en capitales — et elle la respecte ici aussi : elle écrit
 * « Aramburu Federico MARTIN ». Simplement, **son enregistrement est faux** :
 * le trois-quarts argentin de l'USAP est Federico Martín **Aramburu**, et
 * « Martín » est son second prénom. La source met donc les capitales sur le
 * mauvais mot, et le découpage suit.
 *
 * Rien ne permet de le deviner : « Martin » est un patronyme parfaitement
 * ordinaire, et la base en porte huit. Laisser faire créait une fiche
 * « Aramburu Federico | Martin » — **une identité fausse**, le pire cas selon
 * la règle du projet : un doublon se repère et se fusionne, une identité
 * fausse ne se voit pas, et elle aurait été réutilisée à chaque feuille où la
 * LNR répète l'inversion.
 *
 * La table se corrige donc **au découpage**, pour tous les appelants d'un
 * coup, et non dans un script de saison. Elle est vérifiée à la main : y
 * ajouter une ligne, c'est affirmer que la source se trompe sur un nom, ce
 * qui ne se fait pas sur une impression.
 *
 * Identité confirmée par Jérémy, qui situe aussi son départ en 2008 — seule
 * la saison 2007-2008 est donc concernée.
 */
const NOMS_MAL_DECOUPES: Record<string, { firstName: string; lastName: string }> = {
  "aramburu federico martin": { firstName: "Federico Martín", lastName: "Aramburu" },
  // **Deux Brivistes de 2007-2008, sur la même feuille du 5 janvier 2008.** La
  // LNR met « VAN » en capitales et le prend pour le patronyme entier, laissant
  // le reste du nom en prénom : « Der Merwe Ryno | VAN », « Rensburg Charl |
  // VAN ». Ses propres URL le confirment — `5917-der-merwe-ryno-van` et
  // `5919-rensburg-charl-van`. Et elle sait pourtant faire : « Johan | VAN
  // ZYL » est correct sur cette même page, avec le slug qui va avec.
  "der merwe ryno van": { firstName: "Ryno", lastName: "Van Der Merwe" },
  "rensburg charl van": { firstName: "Charl", lastName: "Van Rensburg" },
};

/**
 * Particules qui ne désignent personne. Un patronyme réduit à l'une d'elles
 * n'est pas un nom : c'est la marque d'un enregistrement inversé.
 */
const PARTICULES = new Set([
  "van", "von", "de", "der", "den", "du", "des", "le", "la", "di", "da", "dos", "el", "al",
]);

/** Clé de comparaison : minuscules, sans accents, espaces normalisés. */
function cleDeNom(complet: string): string {
  return complet
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Redresse un nom que la LNR donne à l'envers, quel que soit le chemin par
 * lequel il arrive.
 *
 * **Il y en a deux, et c'est le piège.** Les remplaçants viennent des listes
 * du bas, en un seul morceau, et passent par `separerNom`. Les titulaires,
 * eux, viennent du schéma du terrain, où la LNR fournit `player-pitch__first-name`
 * et `player-pitch__last-name` **déjà séparés** — `separerNom` ne les voit
 * jamais. Corriger le seul découpage laissait donc Aramburu juste quand il
 * était sur le banc et faux quand il était titulaire, sur la même saison.
 */
function redresserNom(nom: { firstName: string; lastName: string }): {
  firstName: string;
  lastName: string;
} {
  const redresse = NOMS_MAL_DECOUPES[cleDeNom(`${nom.firstName} ${nom.lastName}`)];
  if (redresse) return redresse;
  // **On échoue plutôt que d'écrire une identité fausse.** Un patronyme réduit
  // à une particule signale une inversion que rien d'autre ne trahirait : la
  // fiche serait créée sans un mot, sous un nom qui n'est celui de personne, et
  // réutilisée à chaque feuille où la source répète l'erreur. Le cas se
  // constate, se vérifie à la main, puis s'inscrit dans `NOMS_MAL_DECOUPES`.
  if (PARTICULES.has(cleDeNom(nom.lastName))) {
    throw new Error(
      `nom inversé par la source : « ${nom.firstName} | ${nom.lastName} » — ` +
        "« " + nom.lastName + " » est une particule, pas un patronyme. " +
        "Vérifier l'identité, puis l'inscrire dans NOMS_MAL_DECOUPES de lib/lnr.ts",
    );
  }
  return nom;
}

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
    return redresserNom({
      firstName: mots.slice(0, -1).join(" "),
      lastName: mots[mots.length - 1] ?? complet,
    });
  }
  return redresserNom({
    firstName: mots.slice(0, debut).join(" "),
    lastName: mots.slice(debut).join(" "),
  });
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
      // Le schéma du terrain donne les deux champs déjà séparés : ils
      // échappent à `separerNom`, d'où le redressement explicite ici.
      ...redresserNom({
        firstName: capitaliser(firstName ?? ""),
        lastName: capitaliser(lastName),
      }),
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

  // **Une composition aux dossards fabriqués est écartée, pas rendue.** Elle
  // ne décrit pas la rencontre (cf. `dossardsFabriques`), et l'arbitre, lui,
  // reste bon — c'est pourquoi on n'échoue pas : le script de saison ne vient
  // ici que pour lui.
  const fabriquees: ("usap" | "adversaire")[] = [];
  const listes = { usap: trier(usap), adversaire: trier(autre[1]) };
  for (const camp of ["usap", "adversaire"] as const) {
    if (!dossardsFabriques(listes[camp])) continue;
    fabriquees.push(camp);
    listes[camp] = [];
  }

  return { ...listes, arbitre, fabriquees };
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
 * Compétitions dont la LNR publie les feuilles de match : ses deux
 * championnats et leur barrage d'accession. Rien d'autre.
 *
 * **C'est une liste blanche, et c'en est une par nécessité.** La liste noire
 * des coupes d'Europe que portait `audit-opponent-lineups.ts` ne protège que
 * des intitulés qu'on a pensé à y inscrire, et elle n'était écrite que là :
 * les quatre autres appelants de `phasesLnr()` n'avaient rien.
 *
 * Or « passer au travers » ne veut pas dire « échouer ». `/finale/i`
 * reconnaît « Huitième de finale » : un huitième de Challenge européen part
 * donc chercher le segment `finale` du championnat. Le 4 avril 2026 il n'a
 * rien trouvé et l'a dit — mais une saison où l'USAP dispute les deux aurait
 * rendu la feuille de la finale de Top 14 et l'aurait écrite sur le match
 * européen, sans un mot.
 *
 * Devant un intitulé inconnu, on rend donc la liste vide : le match sort du
 * périmètre, et les appelants le disent.
 *
 * **Le Top 16 y est entré avec 2004-2005**, dernière saison du championnat à
 * seize clubs et la plus ancienne que la LNR archive. Ses trente journées se
 * lisent sur les mêmes URL que celles du Top 14, sous le même
 * `top14.lnr.fr` : c'est bien elle qui les publie, et l'omettre aurait mis
 * toute la saison hors périmètre sans un mot.
 */
const COMPETITIONS_LNR = [/\btop 14\b/i, /\btop 16\b/i, /\bpro d2\b/i, /\bbarrages?\b/i];

/**
 * Phases à essayer pour un match : journée, phase finale ou barrage.
 *
 * `contexte` est ce que la base dit du match — nom de compétition et libellé
 * de tour, concaténés. Les appelants y mettent tantôt `name`, tantôt
 * `shortName` : les deux écritures doivent être reconnues.
 *
 * **La compétition se teste avant tout le reste.** Un mot de phase ne veut
 * rien dire tant qu'on ne sait pas si la LNR couvre la rencontre. Le test
 * passe aussi avant la journée : un match de poule européenne n'en porte pas
 * aujourd'hui, mais son libellé de tour s'écrit déjà « Poule J1 », et rien
 * n'empêcherait qu'on lui en pose une.
 *
 * La demi-finale se teste avant la finale, « demi-finale » contenant
 * « finale ».
 *
 * Rend une liste vide dès que la LNR ne couvre pas la rencontre, ou qu'aucune
 * phase ne se reconnaît.
 */
export function phasesLnr(
  saison: string,
  matchday: number | null,
  contexte: string,
): string[] {
  if (!COMPETITIONS_LNR.some((forme) => forme.test(contexte))) return [];
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
 * Les essais, essais de pénalité, pénalités et drops se comptent sur les
 * faits : la feuille les inscrit tous. Les transformations, non — elle ne les
 * inscrit pas comme des faits, et `conversionPlayer` ment (cf. plus haut).
 *
 * ELLES SE DÉDUISENT DONC DU SCORE FINAL, ET DE LUI SEUL :
 * `T = (score − 5×E − 7×EP − 3×P − 3×D) / 2`. Rien d'autre n'est nécessaire,
 * cette fonction ne rendant que des **comptes** — attribuer une transformation
 * à son buteur est le travail de `seed-chronologie.ts`, et c'est là que le
 * score courant sert.
 *
 * **Le score courant ne sert pas ici, et c'est délibéré.** Il a d'abord été lu
 * fait à fait, tout reliquat de deux points valant transformation. Cette
 * lecture suit la feuille dans ses fautes : celle-ci saute parfois une
 * transformation, et son score courant déraille alors avec elle — d'où le
 * rattrapage sur le total final que faisait déjà l'ancienne version.
 * L'arithmétique, elle, ne dépend que du score officiel, qui fait foi, et rend
 * exactement le même résultat partout où l'ancienne lecture aboutissait : si
 * le total reconstitué valait le score, c'est que le compte de transformations
 * était déjà celui-ci.
 *
 * Quand le reliquat est impair, négatif, ou demande plus de transformations
 * qu'il n'y a d'essais, on n'invente rien : le bilan est rendu avec le total
 * des seuls faits, et l'appelant, qui compare `total` au score, échoue. C'est
 * ainsi qu'un **essai de pénalité manqué** se signalerait sur une saison
 * d'avant 2017-2018, où il fallait encore le transformer : il vaudrait cinq
 * points quand ce calcul lui en compte sept, et le reliquat tomberait impair
 * (cf. `corrigerEssaisDePenalite`). Aucun des huit de 2016-2017 n'est dans ce
 * cas.
 */
export function realisationsDepuisFaits(
  faits: LnrFait[],
  camp: Camp,
  score: number,
): Realisations {
  const bilan: Realisations = {
    essais: 0,
    transformations: 0,
    penalites: 0,
    drops: 0,
    essaisDePenalite: 0,
    total: 0,
  };

  for (const fait of faits) {
    if (fait.club !== camp) continue;
    switch (fait.type) {
      case "essai":
        bilan.essais++;
        bilan.total += 5;
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

  const reliquat = score - bilan.total;
  if (reliquat >= 0 && reliquat % 2 === 0 && reliquat / 2 <= bilan.essais) {
    bilan.transformations = reliquat / 2;
    bilan.total = score;
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

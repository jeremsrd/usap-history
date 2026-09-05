/**
 * Lecture des feuilles de match d'ESPN, pour les coupes d'Europe d'avant
 * 2020-2021.
 *
 * **CE N'EST PAS UNE SOURCE OFFICIELLE, ET LE PROJET L'A DÉJÀ ÉCARTÉE UNE
 * FOIS.** Le passage d'ESPN à la LNR sur le championnat 2024-2025 a corrigé
 * quatre erreurs de fond en vingt-six matchs : essais attribués au frère
 * célèbre, cartons inventés, essais de pénalité oubliés, noms composés
 * raccourcis. Elle ne revient que parce que **rien d'autre ne couvre les
 * campagnes européennes de 2007-2008 à 2018-2019** — le flux de l'EPCR ne
 * rend rien avant 2020-2021, revérifié le 5 septembre 2026 —, et à la
 * condition de tout recouper : les scores sur le classement de poule de
 * Wikipédia, les réalisations par l'arithmétique des points, camp par camp.
 *
 * **Ce qu'elle donne** (`summary?event=`), pour les deux camps :
 *   - les **22 joueurs** avec dossard, titulaire ou remplaçant, brassard
 *     quand il est renseigné ;
 *   - les **réalisations par joueur** — essais, transformations, pénalités,
 *     drops, points — et le nombre de cartons ;
 *   - le **score à la mi-temps**.
 *
 * **Ce qu'elle ne donne pas**, et qui reste donc à `null` : les minutes, les
 * entrées et sorties, la minute d'un carton, la chronologie, l'arbitre,
 * l'affluence — toujours à zéro —, et le stade avant 2013-2014.
 *
 * **Et ce qu'elle donne faux.** Sur les six feuilles de 2008-2009, deux ne
 * bouclent pas : à Leicester le 6 décembre 2008, les joueurs totalisent 20
 * points pour 38 et 10 pour 27 ; contre les Ospreys le 17 janvier 2009, 17
 * pour 15. Les réalisations d'un camp ne s'écrivent que si leur somme
 * retombe sur son score — c'est `seed-cup-espn.ts` qui tranche, ici on lit.
 *
 * **Elle répond sans `User-Agent` de navigateur, et rend 403 avec.** C'est
 * l'inverse de la LNR, et c'est vérifié : `curl` nu passe, Chrome est refusé.
 * On se présente donc pour ce qu'on est.
 *
 * Deux ligues, aux identifiants stables : 271937 pour la Champions Cup —
 * Heineken Cup comprise —, 272073 pour le Challenge européen. L'USAP y porte
 * l'identifiant 25920.
 */

const RACINE = "https://site.api.espn.com/apis/site/v2/sports/rugby";

export const LIGUES = {
  "champions-cup": 271937,
  "challenge-cup": 272073,
} as const;

export type Ligue = keyof typeof LIGUES;

/** Identifiant ESPN de l'USAP. */
export const USAP_ESPN = 25920;

export interface EspnJoueur {
  /** Identifiant ESPN, stable d'un match à l'autre. */
  id: number;
  firstName: string;
  lastName: string;
  /** Dossard : 1 à 15 pour les titulaires, 16 à 22 ou 23 pour le banc. */
  numero: number;
  isStarter: boolean;
  isCaptain: boolean;
  /** Poste tel qu'ESPN l'écrit — pour information, jamais pour la fiche. */
  posteEspn: string | null;
  essais: number;
  transformations: number;
  penalites: number;
  drops: number;
  points: number;
  /** Nombre de cartons : ESPN ne donne pas la minute. */
  jaunes: number;
  rouges: number;
}

export interface EspnEquipe {
  id: number;
  nom: string;
  score: number | null;
  miTemps: number | null;
  /**
   * Essais que la source n'attribue à personne — l'essai de pénalité
   * d'avant 2017, cinq points et une transformation créditée au buteur.
   * ESPN n'en connaît pas ; l'ERC les compte à part, cf. `lib/erc.ts`.
   */
  essaisSansAuteur: number;
  joueurs: EspnJoueur[];
}

export interface EspnResume {
  id: number;
  /** Date ISO du coup d'envoi, en UTC. */
  date: string;
  /** Libellé de tour de la base — « Poule J1 », « Quart de finale »… */
  tour: string;
  domicile: { id: number; nom: string; score: number | null };
  exterieur: { id: number; nom: string; score: number | null };
}

export interface EspnMatch extends EspnResume {
  ligue: number;
  stade: string | null;
  affluence: number | null;
  domicile: EspnResume["domicile"] & EspnEquipe;
  exterieur: EspnResume["exterieur"] & EspnEquipe;
}

// =============================================================================
// RÉCUPÉRATION
// =============================================================================

async function lire(chemin: string): Promise<any> {
  let derniere = "";
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const reponse = await fetch(`${RACINE}${chemin}`, {
        headers: { "User-Agent": "usap-history (script d'import, lecture seule)" },
        signal: AbortSignal.timeout(30_000),
      });
      if (reponse.ok) return await reponse.json();
      derniere = `HTTP ${reponse.status}`;
    } catch (e) {
      derniere = e instanceof Error ? e.message : String(e);
    }
    await new Promise((r) => setTimeout(r, 1000 * 2 ** essai));
  }
  throw new Error(`ESPN injoignable : ${chemin} (${derniere})`);
}

/**
 * Du libellé de tour d'ESPN — « Round 3 », « Quarter-final » — à celui de la
 * base. Un libellé inconnu est rendu tel quel : c'est à l'appelant d'échouer
 * dessus plutôt que d'écrire un tour qu'il ne sait pas nommer.
 */
export function tourDeLaBase(libelle: string | null | undefined): string {
  const brut = (libelle ?? "").trim();
  const poule = brut.match(/^Round\s+(\d+)$/i);
  if (poule) return `Poule J${poule[1]}`;
  if (/quarter/i.test(brut)) return "Quart de finale";
  if (/semi/i.test(brut)) return "Demi-finale";
  if (/^final$/i.test(brut)) return "Finale";
  return brut;
}

/** « 2008-2009 » → la fenêtre d'une campagne, d'octobre à fin mai. */
function fenetre(saisonLabel: string): string {
  const debut = Number(saisonLabel.slice(0, 4));
  return `${debut}1001-${debut + 1}0531`;
}

function versResume(e: any): EspnResume | null {
  const c = e.competitions?.[0];
  if (!c) return null;
  const camp = (role: string) => {
    const t = (c.competitors ?? []).find((x: any) => x.homeAway === role);
    return t
      ? {
          id: Number(t.team?.id),
          nom: String(t.team?.displayName ?? ""),
          score: t.score != null && t.score !== "" ? Number(t.score) : null,
        }
      : null;
  };
  const domicile = camp("home");
  const exterieur = camp("away");
  if (!domicile || !exterieur) return null;
  return {
    id: Number(e.id),
    date: String(c.date ?? e.date),
    tour: tourDeLaBase(c.notes?.[0]?.headline),
    domicile,
    exterieur,
  };
}

/**
 * Les matchs **joués** de l'USAP dans une ligue sur une saison.
 *
 * Le calendrier d'ESPN se lit par plage de dates ; une campagne tient entre
 * octobre et mai. Une rencontre encore à venir — statut autre que final — est
 * écartée : cette source ne sert que le passé.
 */
export async function chercherMatchsUsap(
  saisonLabel: string,
  ligue: Ligue,
): Promise<EspnResume[]> {
  const d = await lire(
    `/${LIGUES[ligue]}/scoreboard?dates=${fenetre(saisonLabel)}&limit=300`,
  );
  return ((d.events ?? []) as any[])
    .filter((e) => e.status?.type?.name === "STATUS_FINAL")
    .map(versResume)
    .filter((r): r is EspnResume => r != null)
    .filter((r) => r.domicile.id === USAP_ESPN || r.exterieur.id === USAP_ESPN)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// =============================================================================
// EXTRACTION
// =============================================================================

/** Valeur d'une statistique nommée, 0 si elle manque. */
function stat(ligne: any, nom: string): number {
  const s = (ligne.stats ?? []).find((x: any) => x.name === nom);
  return s ? Number(s.value ?? 0) : 0;
}

/**
 * ESPN ne donne pas le prénom à part : `fullName` et `lastName` seulement.
 * Le prénom est ce qui précède le nom de famille — et rien, quand l'un vaut
 * l'autre.
 */
function separerNom(athlete: any): { firstName: string; lastName: string } {
  const complet = String(athlete.fullName ?? athlete.displayName ?? "").trim();
  const lastName = String(athlete.lastName ?? "").trim();
  if (lastName && complet.endsWith(lastName)) {
    return { firstName: complet.slice(0, complet.length - lastName.length).trim(), lastName };
  }
  const mots = complet.split(/\s+/);
  return { firstName: mots.slice(0, -1).join(" "), lastName: mots[mots.length - 1] ?? complet };
}

function versEquipe(brut: any, competitor: any): EspnEquipe {
  const lignes: any[] = (brut.roster ?? []).filter(
    (l: any) => l.jersey != null && l.jersey !== "",
  );
  // **ESPN ne marque plus les titulaires en 2018-2019** : `starter` y est
  // faux pour les vingt-trois. Le dossard tranche alors, comme à l'EPCR —
  // 1 à 15 sur le terrain, 16 à 23 sur le banc —, et seulement quand aucune
  // ligne de la feuille ne porte le drapeau : une feuille qui le porte est
  // crue sur parole.
  const sansDrapeau = lignes.length > 0 && lignes.every((l) => !l.starter);
  const joueurs: EspnJoueur[] = lignes
    .map((l: any) => ({
      id: Number(l.athlete?.id),
      ...separerNom(l.athlete ?? {}),
      numero: Number(l.jersey),
      isStarter: sansDrapeau ? Number(l.jersey) <= 15 : Boolean(l.starter),
      isCaptain: Boolean(l.captain),
      posteEspn: l.position?.abbreviation ?? null,
      essais: stat(l, "tries"),
      transformations: stat(l, "conversionGoals"),
      penalites: stat(l, "penaltyGoals"),
      drops: stat(l, "dropGoalsConverted"),
      points: stat(l, "points"),
      jaunes: stat(l, "yellowCards"),
      rouges: stat(l, "redCards"),
    }))
    .sort((a: EspnJoueur, b: EspnJoueur) => a.numero - b.numero);

  const miTemps = competitor?.linescores?.[0]?.displayValue;
  return {
    id: Number(brut.team?.id),
    nom: String(brut.team?.displayName ?? ""),
    score:
      competitor?.score != null && competitor.score !== "" ? Number(competitor.score) : null,
    miTemps: miTemps != null && miTemps !== "" ? Number(miTemps) : null,
    essaisSansAuteur: 0,
    joueurs,
  };
}

/** Feuille complète d'un match : les deux équipes et ce que l'annexe donne. */
export async function lireMatch(ligue: Ligue, id: number): Promise<EspnMatch> {
  const d = await lire(`/${LIGUES[ligue]}/summary?event=${id}`);
  const c = d.header?.competitions?.[0] ?? {};
  const competitors: any[] = c.competitors ?? [];
  const rosters: any[] = d.rosters ?? [];

  const cote = (role: string) => {
    const competitor = competitors.find((t) => t.homeAway === role);
    const roster = rosters.find((r) => String(r.team?.id) === String(competitor?.team?.id));
    return versEquipe(roster ?? { team: competitor?.team, roster: [] }, competitor);
  };
  const domicile = cote("home");
  const exterieur = cote("away");

  // Une affluence à zéro veut dire « inconnue », comme à l'EPCR.
  const affluence = Number(d.gameInfo?.attendance ?? 0) || null;
  return {
    id: Number(d.header?.id ?? id),
    date: String(c.date ?? ""),
    tour: tourDeLaBase(c.notes?.[0]?.headline ?? d.header?.gameNote),
    ligue: LIGUES[ligue],
    stade: d.gameInfo?.venue?.fullName ?? null,
    affluence,
    domicile,
    exterieur,
  };
}

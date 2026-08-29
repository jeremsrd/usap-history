/**
 * Lecture des feuilles de match de l'EPCR (coupes d'Europe).
 *
 * La LNR ne couvre que le championnat : pour la Champions Cup et le Challenge
 * européen, la source officielle est l'EPCR. Son site est un Nuxt en rendu
 * serveur, mais il n'y a pas à le gratter : ses pages appellent un flux public
 * — `rugby-union-feeds.incrowdsports.com`, alimenté par Opta — dont la clé
 * d'API est celle du front, publiée dans la page. C'est ce flux qu'on
 * interroge ici, en lecture seule et à petit débit.
 *
 * Ce que le flux donne, et qu'aucune autre source ne donne aussi bien :
 *   - les **23 joueurs de chaque équipe**, avec leur dossard (`positionId`,
 *     1 à 15 pour les titulaires, 16 à 23 pour le banc) et le brassard ;
 *   - les **réalisations par joueur** (`stats`), qui retombent exactement sur
 *     le score — essais de pénalité déduits ;
 *   - les **entrées et sorties** minute par minute ;
 *   - l'**arbitre**, l'**affluence** et le **score à la mi-temps**, que la LNR
 *     ne publie pas.
 *
 * Trois réserves :
 *   - le type d'événement `Penalty` désigne une pénalité **concédée**, pas un
 *     coup de pied réussi. Les points se lisent dans les `stats` du joueur,
 *     jamais en comptant les événements ;
 *   - `minutesPlayedTotal` retire les dix minutes d'un carton jaune, ce que la
 *     convention du projet refuse (cf. CLAUDE.md). Les minutes sont donc
 *     reconstituées à partir des entrées et sorties, et la valeur d'Opta n'est
 *     gardée que pour contrôle, sous `minutesOpta` ;
 *   - un remplacement temporaire s'écrit « sortie puis entrée du **même**
 *     joueur à la même minute », sans que l'on sache qui l'a suppléé. Les deux
 *     s'annulent : le joueur est tenu pour resté sur le terrain.
 */

const RACINE = "https://rugby-union-feeds.incrowdsports.com";

/**
 * En-têtes du flux, dont la clé publique du front epcrugby.com — celle qui est
 * écrite dans la configuration de ses pages. Elle n'ouvre que la lecture des
 * données déjà affichées sur le site, et elle n'est pas à nous : il n'y a rien
 * à révoquer ni à faire tourner si elle circule.
 *
 * Elle est tout de même sortie du dépôt et lue dans `EPCR_API_KEY`, parce
 * qu'un scanner de secrets la signale à chaque poussée : le motif `X-API-KEY`
 * suffit à déclencher l'alerte, sans regarder ce que la clé ouvre.
 *
 * Lue à l'appel et non à l'évaluation du module, pour ne pas dépendre de
 * l'ordre des imports : c'est `@prisma/client` qui charge `.env`, à son propre
 * import. `.env.local` ne l'est pas — il n'est lu que par Next.
 */
export function entetesEpcr(): Record<string, string> {
  if (!process.env.EPCR_API_KEY) {
    try {
      process.loadEnvFile();
    } catch {
      // pas de .env : le message ci-dessous dira quoi faire
    }
  }
  const cle = process.env.EPCR_API_KEY;
  if (!cle) {
    throw new Error(
      "EPCR_API_KEY manquante : l'ajouter dans .env (cf. env.example). " +
        "C'est la clé du front epcrugby.com, visible dans la configuration " +
        "de ses pages — chercher « apiKey » dans la source d'une page de match.",
    );
  }
  return { "X-API-KEY": cle, "X-APP-ID": "web", "X-REALM": "epcr" };
}

/** Identifiants de compétition, tels que le site les configure. */
export const COMPETITIONS = {
  "challenge-cup": 1026,
  "champions-cup": 1008,
} as const;

/** Identifiant Opta de l'USAP, le même d'une saison à l'autre. */
export const USAP = 1783;

/** « 2023-2024 » → 202301, le code de saison du flux. */
export function codeSaison(label: string): number {
  return Number(label.slice(0, 4)) * 100 + 1;
}

export interface EpcrJoueur {
  /** Identifiant Opta, stable d'un match à l'autre. */
  id: number;
  firstName: string;
  lastName: string;
  /** Nom d'usage affiché par l'EPCR, parfois un diminutif. */
  known: string;
  /** Dossard : 1 à 15 pour les titulaires, 16 à 23 pour le banc. */
  numero: number;
  isStarter: boolean;
  isCaptain: boolean;
  /** Minutes reconstituées à partir des entrées et sorties. */
  minutes: number | null;
  subIn: number | null;
  subOut: number | null;
  /** Minutes selon Opta, cartons jaunes déduits — pour contrôle seulement. */
  minutesOpta: number | null;
  essais: number;
  transformations: number;
  penalites: number;
  drops: number;
  points: number;
  jaune: number | null;
  rouge: number | null;
}

export interface EpcrEquipe {
  id: number;
  nom: string;
  score: number | null;
  miTemps: number | null;
  /** Essais de pénalité, qui n'ont pas d'auteur et n'entrent dans aucune stat. */
  essaisDePenalite: number;
  joueurs: EpcrJoueur[];
}

export interface EpcrMatch {
  id: number;
  /** Date ISO du coup d'envoi, en UTC. */
  date: string;
  compId: number;
  saison: number;
  round: number | null;
  arbitre: string | null;
  affluence: number | null;
  stade: string | null;
  domicile: EpcrEquipe;
  exterieur: EpcrEquipe;
}

export interface EpcrResume {
  id: number;
  date: string;
  round: number | null;
  domicile: { id: number; nom: string; score: number | null };
  exterieur: { id: number; nom: string; score: number | null };
}

const DUREE = 80;

// =============================================================================
// RÉCUPÉRATION
// =============================================================================

async function lire(chemin: string): Promise<any> {
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const reponse = await fetch(`${RACINE}${chemin}`, {
        headers: entetesEpcr(),
        signal: AbortSignal.timeout(30_000),
      });
      if (reponse.ok) {
        const corps = await reponse.json();
        if (corps?.status === "success") return corps.data;
      }
    } catch {
      // on retente
    }
  }
  throw new Error(`Flux EPCR injoignable : ${chemin}`);
}

/**
 * Tous les matchs d'une compétition sur une saison.
 *
 * Le calendrier d'une saison ne bouge plus une fois jouée, et un lot de
 * matchs interroge toujours la même : on le garde en mémoire pour le temps du
 * script plutôt que de le redemander vingt fois.
 */
const calendriers = new Map<string, EpcrResume[]>();

export async function chercherMatchs(
  saisonLabel: string,
  compId: number,
): Promise<EpcrResume[]> {
  const cle = `${saisonLabel}|${compId}`;
  const garde = calendriers.get(cle);
  if (garde) return garde;

  const data = await lire(
    `/v1/matches?provider=rugbyviz&compId=${compId}&season=${codeSaison(saisonLabel)}`,
  );
  const matchs: EpcrResume[] = (data ?? []).map((m: any) => ({
    id: m.id,
    date: m.date,
    round: m.round ?? null,
    domicile: { id: m.homeTeam.id, nom: m.homeTeam.name, score: m.homeTeam.score ?? null },
    exterieur: { id: m.awayTeam.id, nom: m.awayTeam.name, score: m.awayTeam.score ?? null },
  }));
  calendriers.set(cle, matchs);
  return matchs;
}

// =============================================================================
// EXTRACTION
// =============================================================================

/**
 * Minutes, entrée et sortie de chaque joueur, reconstituées à partir des
 * événements. Une sortie et une entrée du même joueur à la même minute
 * s'annulent : c'est la façon dont Opta note un remplacement temporaire dont
 * il ignore le suppléant.
 *
 * Le carton rouge est traité **dans la chronologie**, pas après coup : depuis
 * 2025-2026 les coupes d'Europe appliquent le carton rouge de vingt minutes,
 * et le remplaçant du joueur exclu entre bien plus tard. Opta enregistre alors
 * une sortie du joueur exclu à la minute où son suppléant entre, ce qui, pris
 * au pied de la lettre, lui donnerait vingt minutes qu'il n'a pas jouées —
 * Duncan Paia'aua, exclu à la 14ᵉ contre les Dragons le 7 décembre 2025, a été
 * remplacé à la 35ᵉ.
 */
function tempsDeJeu(
  joueurs: Map<number, EpcrJoueur>,
  evenements: any[],
  equipeId: number,
) {
  const surLeTerrain = new Map<number, number | null>();
  const total = new Map<number, number>();
  for (const j of joueurs.values()) {
    surLeTerrain.set(j.id, j.isStarter ? 0 : null);
    total.set(j.id, 0);
  }

  const siens = evenements.filter((e) => e.teamId === equipeId);
  const annules = new Set<number>();
  for (const e of siens.filter((e) => e.type === "Sub Off")) {
    const retour = siens.find(
      (a) => a.type === "Sub On" && a.playerId === e.playerId && a.minute === e.minute,
    );
    if (retour) {
      annules.add(e.id);
      annules.add(retour.id);
    }
  }

  const fermer = (id: number, minute: number, sortie: boolean) => {
    const depuis = surLeTerrain.get(id);
    if (depuis == null) return;
    total.set(id, (total.get(id) ?? 0) + Math.max(0, minute - depuis));
    surLeTerrain.set(id, null);
    const j = joueurs.get(id);
    if (j && sortie && j.subOut == null) j.subOut = minute;
  };

  // Un rouge à la même minute qu'un changement doit être traité en premier :
  // c'est lui qui met fin au match du joueur.
  const chronologie = siens
    .filter((e) => ["Sub Off", "Sub On", "Red card"].includes(e.type) && !annules.has(e.id))
    .map((e, rang) => ({ ...e, rang }))
    .sort((a, b) => a.minute - b.minute || (a.type === "Red card" ? -1 : 1) - (b.type === "Red card" ? -1 : 1) || a.rang - b.rang);

  for (const e of chronologie) {
    if (!joueurs.has(e.playerId)) continue;
    if (e.type === "Sub Off" || e.type === "Red card") fermer(e.playerId, e.minute, true);
    else if (surLeTerrain.get(e.playerId) == null) {
      surLeTerrain.set(e.playerId, e.minute);
      const j = joueurs.get(e.playerId)!;
      if (j.subIn == null) j.subIn = e.minute;
    }
  }

  for (const j of joueurs.values()) {
    // Un carton jaune ne se déduit pas des minutes jouées ; le rouge, si —
    // il a déjà fermé la ligne dans la chronologie.
    fermer(j.id, DUREE, false);
    j.minutes = !j.isStarter && j.subIn == null ? null : (total.get(j.id) ?? 0);
  }
}

/**
 * Un seul brassard par équipe.
 *
 * Opta signale capitaine tout joueur qui l'a été, si bien qu'un match où le
 * brassard change de mains en désigne deux — Ben Carter et Angus O'Brien pour
 * les Dragons, le 7 décembre 2025. Le modèle n'en garde qu'un, celui du coup
 * d'envoi : parmi les titulaires signalés, **le premier sorti**, puisque c'est
 * son remplacement qui a fait passer le brassard. Faute de pouvoir départager,
 * on ne désigne personne — un brassard inventé vaut moins qu'un brassard
 * absent.
 */
function unSeulCapitaine(joueurs: Map<number, EpcrJoueur>) {
  const signales = [...joueurs.values()].filter((j) => j.isCaptain);
  if (signales.length <= 1) return;

  const titulaires = signales.filter((j) => j.isStarter);
  const sortis = titulaires
    .filter((j) => j.subOut != null)
    .sort((a, b) => a.subOut! - b.subOut!);
  const premier =
    sortis.length > 0 && (sortis.length === 1 || sortis[0].subOut !== sortis[1].subOut)
      ? sortis[0]
      : null;

  for (const j of signales) j.isCaptain = j === premier;
}

function versEquipe(brut: any, evenements: any[]): EpcrEquipe {
  const joueurs = new Map<number, EpcrJoueur>();
  for (const p of brut.players ?? []) {
    const s = p.stats ?? {};
    joueurs.set(p.id, {
      id: p.id,
      firstName: String(p.firstName ?? "").trim(),
      lastName: String(p.lastName ?? "").trim(),
      known: String(p.known ?? "").trim(),
      numero: Number(p.positionId),
      isStarter: Number(p.positionId) <= 15,
      isCaptain: Boolean(p.captain),
      minutes: null,
      subIn: null,
      subOut: null,
      minutesOpta: s.minutesPlayedTotal ?? null,
      essais: s.tries ?? 0,
      transformations: s.conversionGoals ?? 0,
      penalites: s.penaltyGoals ?? 0,
      drops: s.dropGoalsConverted ?? 0,
      points: s.points ?? 0,
      jaune: null,
      rouge: null,
    });
  }

  for (const e of evenements) {
    if (e.teamId !== brut.id || !joueurs.has(e.playerId)) continue;
    const j = joueurs.get(e.playerId)!;
    if (e.type === "Yellow card" && j.jaune == null) j.jaune = e.minute;
    if (e.type === "Red card" && j.rouge == null) j.rouge = e.minute;
  }

  tempsDeJeu(joueurs, evenements, brut.id);
  unSeulCapitaine(joueurs);

  return {
    id: brut.id,
    nom: String(brut.name ?? ""),
    score: brut.score ?? null,
    miTemps: brut.halfTimeScore ?? null,
    essaisDePenalite: evenements.filter(
      (e) => e.type === "Penalty Try" && e.teamId === brut.id,
    ).length,
    joueurs: [...joueurs.values()].sort((a, b) => a.numero - b.numero),
  };
}

/** Feuille complète d'un match, les deux équipes et l'annexe. */
export async function lireMatch(id: number): Promise<EpcrMatch> {
  const d = await lire(`/v1/matches/${id}?provider=rugbyviz`);
  const evenements: any[] = d.events ?? [];
  const arbitre = (d.officials ?? []).find((o: any) => o.role === "referee");
  return {
    id: d.id,
    date: d.date,
    compId: d.compId,
    saison: d.season,
    round: d.round ?? null,
    arbitre: arbitre?.name ?? null,
    affluence: d.attendance ?? null,
    stade: d.venue?.name ?? null,
    domicile: versEquipe(d.homeTeam, evenements),
    exterieur: versEquipe(d.awayTeam, evenements),
  };
}

/**
 * Match de coupe d'Europe de l'USAP joué un jour donné.
 *
 * Les deux compétitions sont essayées : une saison de Challenge peut suivre
 * une saison de Champions Cup sans que la base ait à le dire. Le jour suffit à
 * lever l'ambiguïté — l'USAP ne joue jamais deux matchs européens le même
 * jour.
 */
export async function chercherMatchUsap(
  saisonLabel: string,
  jour: string,
): Promise<EpcrResume | null> {
  for (const compId of Object.values(COMPETITIONS)) {
    const matchs = await chercherMatchs(saisonLabel, compId);
    const trouve = matchs.find(
      (m) =>
        m.date.slice(0, 10) === jour &&
        (m.domicile.id === USAP || m.exterieur.id === USAP),
    );
    if (trouve) return trouve;
  }
  return null;
}

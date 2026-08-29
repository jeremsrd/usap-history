/**
 * Écrit la chronologie d'un match depuis la feuille officielle de la LNR.
 *
 * Troisième temps de la reprise d'une rencontre, après `seed-lineup.ts` qui
 * crée les compositions et `seed-opponent-sheet.ts` qui remplit réalisations
 * et temps de jeu. Celui-ci ne touche qu'à `MatchEvent`, la ligne de temps
 * affichée sur la fiche du match.
 *
 * Usage :
 *   npx tsx scripts/seed-chronologie.ts 2021-09-04 --dry
 *   npx tsx scripts/seed-chronologie.ts 2021-09-04
 *
 * Idempotent : les événements du match sont effacés avant d'être recréés.
 *
 * LE SCORE COURANT EST LA SOURCE. La LNR donne le score après chaque fait,
 * `[recevant, visiteur]`, et c'est de son écart qu'on déduit ce qui vient de
 * se passer — cinq points pour un essai, sept pour un essai transformé ou de
 * pénalité, trois pour une pénalité ou un drop. `conversionPlayer` ne sert
 * qu'à nommer le buteur, jamais à décider qu'il y a eu transformation : il
 * désigne parfois un joueur de l'autre équipe.
 *
 * Tout écart inattendu **fait échouer le match entier** plutôt que d'écrire
 * une chronologie fausse. C'est nécessaire : le score courant de la LNR
 * déraille sur certaines feuilles — deux points inscrits avant l'essai qui
 * les vaut à Toulouse le 13 septembre 2025, une transformation absente à Lyon
 * le 6 mai 2023. Ces matchs-là demanderont une table de corrections vérifiée
 * à la main, sur le modèle de `CHANGEMENTS_CORRIGES`.
 *
 * Les descriptions suivent l'usage de la base : « Essai de Machin (Club).
 * 7-10. », score de l'USAP en premier, comme partout ailleurs dans le projet.
 */

import { EventType, PrismaClient } from "@prisma/client";
import {
  chercherFeuille,
  lireFeuille,
  phasesLnr,
  type LnrFait,
  type LnrJoueur,
} from "./lib/lnr";
import { normalize, proximite } from "./lib/noms";
import {
  USAP,
  chercherMatchUsap,
  lireEvenements,
  lireMatch,
  type EpcrTypeEvenement,
} from "./lib/epcr";

const prisma = new PrismaClient();

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry");
const DATE = ARGS.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));

if (!DATE) {
  console.error(
    "Une date de match est attendue.\n" +
      "  npx tsx scripts/seed-chronologie.ts 2021-09-04 --dry",
  );
  process.exit(1);
}

/** Points d'un fait, hors transformation. */
const POINTS: Record<LnrFait["type"], number> = {
  essai: 5,
  "essai-de-penalite": 7,
  penalite: 3,
  drop: 3,
  jaune: 0,
  rouge: 0,
};

const TYPES: Record<LnrFait["type"], EventType> = {
  essai: EventType.ESSAI,
  "essai-de-penalite": EventType.ESSAI_PENALITE,
  penalite: EventType.PENALITE,
  drop: EventType.DROP,
  jaune: EventType.CARTON_JAUNE,
  rouge: EventType.CARTON_ROUGE,
};

interface Evenement {
  minute: number;
  type: EventType;
  isUsap: boolean;
  playerId: string | null;
  description: string;
}

async function main() {
  console.log(`=== Chronologie du ${DATE}${DRY_RUN ? " (simulation)" : ""} ===`);

  const match = await prisma.match.findFirstOrThrow({
    where: {
      date: { gte: new Date(`${DATE}T00:00:00Z`), lt: new Date(`${DATE}T23:59:59Z`) },
    },
    include: {
      opponent: { select: { name: true, shortName: true } },
      competition: { select: { name: true } },
      season: { select: { label: true } },
      players: {
        select: {
          isOpponent: true,
          shirtNumber: true,
          player: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });
  const adversaire = match.opponent.shortName ?? match.opponent.name;

  if (match.scoreUsap == null || match.scoreOpponent == null) {
    throw new Error("Rencontre non jouée : pas de chronologie à écrire.");
  }
  // Une chronologie sans composition reste utile — elle porte les noms en
  // clair, que la page affiche telle quelle. C'est le cas du barrage
  // d'accession du 12 juin 2022, dont la LNR ne publie les compositions ni
  // sur son site Top 14 ni sur celui de Pro D2.
  if (match.players.length === 0) {
    console.log(
      "Aucune composition en base : les événements porteront les noms de la " +
        "feuille, sans lien vers les fiches joueur.",
    );
  }

  /** Points d'un fait, transformation comprise puisqu'elle est un fait à part. */
  const POINTS_EPCR: Record<EpcrTypeEvenement, number> = {
    essai: 5,
    "essai-de-penalite": 7,
    transformation: 2,
    penalite: 3,
    drop: 3,
    jaune: 0,
    rouge: 0,
  };

  /**
   * Chronologie d'un match de coupe d'Europe, depuis le flux de l'EPCR.
   *
   * Plus simple que la feuille de la LNR : les transformations y sont des
   * faits à part entière, il n'y a rien à déduire d'un score courant. Les
   * joueurs sont désignés par leur identifiant Opta, qu'on rattache à la
   * composition **par le dossard** — aucun rapprochement de noms, donc aucune
   * des erreurs d'identité que le championnat nous a values.
   *
   * Le garde-fou reste le score final : si le type `Penalty` désignait des
   * pénalités concédées plutôt que réussies, le total ne retomberait pas et
   * rien ne serait écrit.
   */
  async function depuisEpcr(): Promise<{ evenements: Evenement[]; usap: number; adverse: number }> {
    const resume = await chercherMatchUsap(match.season.label, DATE!);
    if (!resume) throw new Error(`Match introuvable dans le flux de l'EPCR au ${DATE}`);
    const feuilleEpcr = await lireMatch(resume.id);
    const evts = await lireEvenements(resume.id);

    // Identifiant Opta → dossard et camp, puis dossard → ligne de la base.
    const dossards = new Map<number, { numero: number; isOpponent: boolean }>();
    for (const [equipe, isOpponent] of [
      [feuilleEpcr.domicile, feuilleEpcr.domicile.id !== USAP],
      [feuilleEpcr.exterieur, feuilleEpcr.exterieur.id !== USAP],
    ] as const) {
      for (const j of equipe.joueurs) dossards.set(j.id, { numero: j.numero, isOpponent });
    }

    const evenements: Evenement[] = [];
    let usap = 0;
    let adverse = 0;
    for (const e of evts) {
      const isUsap = e.equipeId === USAP;
      const club = isUsap ? "USAP" : adversaire;
      const place = e.joueurId != null ? dossards.get(e.joueurId) : undefined;
      const ligne =
        place && place.isOpponent === !isUsap
          ? match.players.find(
              (l) => l.isOpponent === place.isOpponent && l.shirtNumber === place.numero,
            )
          : undefined;
      const nom = ligne?.player
        ? `${ligne.player.firstName} ${ligne.player.lastName}`
        : null;

      const points = POINTS_EPCR[e.type];
      if (isUsap) usap += points;
      else adverse += points;
      const score = `${usap}-${adverse}`;

      const libelle: Record<EpcrTypeEvenement, string> = {
        essai: `Essai ${de(nom ?? "")} (${club}).`,
        "essai-de-penalite": `Essai de pénalité (${club}).`,
        transformation: `Transformation ${de(nom ?? "")} (${club}).`,
        penalite: `Pénalité ${de(nom ?? "")} (${club}).`,
        drop: `Drop ${de(nom ?? "")} (${club}).`,
        jaune: `Carton jaune ${nom} (${club}).`,
        rouge: `Carton rouge ${nom} (${club}).`,
      };
      const TYPES_BASE: Record<EpcrTypeEvenement, EventType> = {
        essai: EventType.ESSAI,
        "essai-de-penalite": EventType.ESSAI_PENALITE,
        transformation: EventType.TRANSFORMATION,
        penalite: EventType.PENALITE,
        drop: EventType.DROP,
        jaune: EventType.CARTON_JAUNE,
        rouge: EventType.CARTON_ROUGE,
      };
      evenements.push({
        minute: e.minute,
        type: TYPES_BASE[e.type],
        isUsap,
        playerId: ligne?.player?.id ?? null,
        description: points > 0 ? `${libelle[e.type]} ${score}.` : libelle[e.type],
      });
    }
    return { evenements, usap, adverse };
  }

  /** « LAOUSSE AZPIAZU » → « Laousse Azpiazu ». */
  const casseNom = (nom: string) =>
    nom
      .split(/\s+/)
      .map((mot) => mot.charAt(0) + mot.slice(1).toLowerCase())
      .join(" ");

  /** « de Tristan Tedder », mais « d'Enzo Hervé ». */
  const de = (nom: string) =>
    /^[aeiouyàâéèêëîïôöûü]/i.test(nom) ? `d'${nom}` : `de ${nom}`;

  const estCoupeEurope = /Champions|Challenge/i.test(match.competition.name);
  if (estCoupeEurope) {
    const { evenements, usap, adverse } = await depuisEpcr();
    return terminer(match.id, evenements, usap, adverse, match.scoreUsap!, match.scoreOpponent!);
  }

  const phases = phasesLnr(
    match.season.label,
    match.matchday,
    /Barrage/i.test(match.competition.name),
  );
  if (phases.length === 0) {
    throw new Error(
      `Compétition « ${match.competition.name} » sans journée : phase LNR inconnue.`,
    );
  }
  let url: string | null = null;
  for (const phase of phases) {
    url = await chercherFeuille(match.season.label, phase);
    if (url) break;
  }
  if (!url) throw new Error(`Feuille LNR introuvable pour ${phases.join(" / ")}`);
  const feuille = await lireFeuille(url);
  const campUsap = feuille.campUsap;

  /**
   * Retrouve un joueur dans la composition du camp concerné, et rend le nom
   * **tel que la base l'écrit** — la LNR met les patronymes en capitales et
   * mange les accents, « Enzo HERVE » pour Enzo Hervé.
   *
   * L'appariement passe d'abord par le nom de famille, seul discriminant
   * fiable : sur les vingt-trois d'une feuille, un prénom partagé suffit à
   * confondre deux joueurs — « Tristan James TEDDER » s'apparie aussi bien à
   * Tristan Labouteley qu'à Tristan Tedder.
   */
  const chercher = (
    joueur: LnrJoueur,
    isOpponent: boolean,
  ): { id: string; nom: string } | null => {
    const lignes = match.players.filter((l) => l.isOpponent === isOpponent && l.player);
    const nomDe = (l: (typeof lignes)[number]) =>
      `${l.player!.firstName} ${l.player!.lastName}`;

    const memeFamille = lignes.filter(
      (l) => normalize(l.player!.lastName) === normalize(joueur.lastName),
    );
    const retenus =
      memeFamille.length === 1
        ? memeFamille
        : lignes.filter(
            (l) =>
              proximite(nomDe(l), `${joueur.firstName} ${joueur.lastName}`).communs >= 2,
          );
    if (retenus.length !== 1) return null;
    return { id: retenus[0].player!.id, nom: nomDe(retenus[0]) };
  };

  const evenements: Evenement[] = [];
  // Score courant, [recevant, visiteur], comme la LNR l'écrit.
  const courant: [number, number] = [0, 0];

  for (const fait of feuille.faits) {
    const cote = fait.club === "home" ? 0 : 1;
    const isUsap = fait.club === campUsap;
    const club = isUsap ? "USAP" : adversaire;
    const trouve = fait.joueur ? chercher(fait.joueur, !isUsap) : null;
    const playerId = trouve?.id ?? null;
    // Faute de fiche, on garde le nom de la feuille — remis en casse normale,
    // la LNR écrivant les patronymes en capitales.
    const nom =
      trouve?.nom ??
      (fait.joueur
        ? `${fait.joueur.firstName} ${casseNom(fait.joueur.lastName)}`
        : null);

    // Ce que le fait vaut, et ce que le score dit qu'il a valu.
    const attendu = POINTS[fait.type];
    const constate = fait.score ? fait.score[cote] - courant[cote] : attendu;
    if (fait.score && fait.score[1 - cote] !== courant[1 - cote]) {
      throw new Error(
        `${fait.minute}' ${fait.type} : le score de l'autre équipe bouge ` +
          `(${courant.join("-")} → ${fait.score.join("-")})`,
      );
    }
    const transforme = fait.type === "essai" && constate === 7;
    if (constate !== attendu && !transforme) {
      throw new Error(
        `${fait.minute}' ${fait.type} : ${constate} point(s) au score courant, ` +
          `${attendu} attendus (${courant.join("-")} → ${fait.score?.join("-")})`,
      );
    }

    courant[cote] += attendu;
    const scoreLisible = () =>
      campUsap === "home"
        ? `${courant[0]}-${courant[1]}`
        : `${courant[1]}-${courant[0]}`;

    const libelle: Record<LnrFait["type"], string> = {
      essai: `Essai ${de(nom ?? "")} (${club}).`,
      "essai-de-penalite": `Essai de pénalité (${club}).`,
      penalite: `Pénalité ${de(nom ?? "")} (${club}).`,
      drop: `Drop ${de(nom ?? "")} (${club}).`,
      jaune: `Carton jaune ${nom} (${club}).`,
      rouge: `Carton rouge ${nom} (${club}).`,
    };
    evenements.push({
      minute: fait.minute,
      type: TYPES[fait.type],
      isUsap,
      playerId,
      description:
        attendu > 0 ? `${libelle[fait.type]} ${scoreLisible()}.` : libelle[fait.type],
    });

    if (transforme) {
      // Le buteur n'est nommé que s'il appartient bien à l'équipe : la LNR y
      // met parfois l'ouvreur d'en face.
      const buteur = fait.transformePar ? chercher(fait.transformePar, !isUsap) : null;
      courant[cote] += 2;
      evenements.push({
        minute: fait.minute,
        type: EventType.TRANSFORMATION,
        isUsap,
        playerId: buteur?.id ?? null,
        description: buteur
          ? `Transformation ${de(buteur.nom)} (${club}). ${scoreLisible()}.`
          : `Transformation (${club}). ${scoreLisible()}.`,
      });
    }
  }

  const finalUsap = campUsap === "home" ? courant[0] : courant[1];
  const finalAdverse = campUsap === "home" ? courant[1] : courant[0];
  return terminer(
    match.id,
    evenements,
    finalUsap,
    finalAdverse,
    match.scoreUsap!,
    match.scoreOpponent!,
  );
}

/**
 * Contrôle, relevé et écriture — communs aux deux sources.
 *
 * Le score reconstitué doit retomber sur le score officiel, sans quoi rien
 * n'est écrit : c'est ce garde-fou qui rend exploitable le type `Penalty` de
 * l'EPCR, dont on sait qu'il désigne parfois une pénalité concédée.
 */
async function terminer(
  matchId: string,
  evenements: Evenement[],
  usap: number,
  adverse: number,
  scoreUsap: number,
  scoreAdverse: number,
): Promise<void> {
  if (usap !== scoreUsap || adverse !== scoreAdverse) {
    throw new Error(
      `Chronologie incomplète : ${usap}-${adverse} reconstitués ` +
        `pour ${scoreUsap}-${scoreAdverse} au score`,
    );
  }

  for (const e of evenements) {
    console.log(
      `  ${String(e.minute).padStart(2)}' ${e.type.padEnd(14)} ` +
        `${e.playerId ? "·" : "?"} ${e.description}`,
    );
  }
  console.log(
    `\n=== ${evenements.length} événement(s), score reconstitué ${usap}-${adverse} ===`,
  );

  if (DRY_RUN) {
    console.log("Simulation — relancer sans --dry pour appliquer.");
    return;
  }

  await prisma.matchEvent.deleteMany({ where: { matchId } });
  for (const e of evenements) {
    await prisma.matchEvent.create({ data: { matchId, ...e } });
  }
  console.log("Chronologie écrite.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

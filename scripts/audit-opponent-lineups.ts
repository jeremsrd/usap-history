/**
 * Confronte les compositions en base aux feuilles officielles LNR —
 * l'adversaire toujours, le camp catalan sur `--usap`.
 *
 * Trois compositions adverses fabriquées de toutes pièces ont été trouvées
 * jusqu'ici — le J20 2025-2026 contre Toulon, Grenoble au barrage 2024-2025,
 * Clermont le 28/09/2024 — et chaque fois par hasard, parce qu'un nom coinçait
 * sur autre chose. Ce script cherche les autres : il confronte joueur par
 * joueur ce que dit la base et ce que dit la feuille officielle.
 *
 * Lecture seule : il ne corrige rien, il liste. À chaque anomalie sa gravité :
 *
 *   MANQUANT    un joueur de la feuille officielle qui ne figure nulle part
 *               dans la composition en base — le cas grave, celui des
 *               compositions inventées ou incomplètes
 *   EN TROP     un joueur en base absent de la feuille officielle
 *   NUMÉRO      le bon joueur, sous un autre dossard — sans conséquence sur
 *               l'identité, mais `positionPlayed` se déduit du numéro
 *   ÉCRITURE    la base porte un mot que la feuille officielle ignore —
 *               « Bill » pour Brandon Nansen, « Théo » pour Thibaut Martel.
 *               Un nom simplement plus court (« Levani Botia » pour « Levani
 *               Botia Veivuke ») ne compte pas : c'est une variante d'écriture.
 *               Les variantes d'affichage déjà arbitrées, elles, sont tues —
 *               voir `VARIANTES_DAFFICHAGE` dans `lib/noms.ts`
 *   TITULAIRE   titulaire d'un côté, remplaçant de l'autre
 *   CAPITAINE   capitaine non signalé en base
 *
 * L'appariement se fait sur l'identité, jamais sur le numéro : sinon une
 * permutation de dossards se lirait comme deux joueurs inventés.
 *
 * Les écarts d'accent, de casse et de ponctuation sont ignorés, de même qu'un
 * nom plus court que l'officiel : ce sont des variantes d'écriture, pas des
 * erreurs de saisie.
 *
 * Usage :
 *   npx tsx scripts/audit-opponent-lineups.ts                  # toutes les saisons
 *   npx tsx scripts/audit-opponent-lineups.ts 2023-2024        # une seule
 *   npx tsx scripts/audit-opponent-lineups.ts --usap           # + le camp catalan
 *   npx tsx scripts/audit-opponent-lineups.ts --graves         # MANQUANT et EN TROP
 *   npx tsx scripts/audit-opponent-lineups.ts --variantes      # + les variantes tues
 *
 * ------------------------------------------------------------------------
 * LE CAMP CATALAN N'AVAIT AUCUN AUDIT, ET C'EST PAR LÀ QUE PASSAIT LE RESTE
 *
 * Ce script filtrait `isOpponent: true`, sur une seule ligne, et cette ligne
 * décidait de tout : **14 666 lignes adverses relues, 14 692 lignes
 * catalanes jamais** — la moitié de la table, et celle qui porte les fiches
 * joueur, les centurions, les réalisateurs et les records.
 *
 * Il existait bien des outils côté catalan — `seed-opponent-sheet --usap`,
 * `fix-opponent-lineup --usap` — mais ce sont des **correcteurs** : ils
 * écrivent, on les lance quand on soupçonne déjà quelque chose, et ils ne
 * disent rien tant qu'on ne les lance pas. Il manquait un témoin.
 *
 * Le projet l'a payé deux fois. Les quatre saisons de 2022-2023 à 2025-2026
 * avaient été écrites **sans `--usap`** — 1 279 lignes catalanes fausses, que
 * seul le contrôle des minutes a fini par trahir. Et le 22 septembre 2026,
 * quatre feuilles catalanes de 2025-2026 portaient **Sacha Lotrian** quand
 * c'était son frère Mathys : les scores retombaient, les minutes aussi, les
 * points par joueur également, et c'est Jérémy qui l'a vu en relisant une
 * liste de joueurs sans portrait.
 *
 * **Auditer les deux camps ne coûte rien de plus.** La page `/compositions`
 * de la LNR porte les vingt-trois de chaque côté : le script la téléchargeait
 * déjà en entier et jetait la moitié. Mesuré le 23 septembre 2026 sur
 * 2025-2026 — 27 matchs, 44 s pour le seul camp adverse, 33 s pour les deux.
 * Le surcoût est dans le bruit de mesure ; c'est la raison pour laquelle ce
 * contrôle vit ici et non dans un script à part, qui retéléchargerait tout.
 *
 * **Zéro anomalie est l'état attendu**, et c'est tout l'intérêt de la table de
 * variantes : le total redevient un signal, tout écart nouveau se remarque.
 *
 * Ne couvre que ce que la LNR publie — championnat et phases finales des deux
 * divisions, barrages compris. Les coupes d'Europe relèvent de l'EPCR.
 *
 * **Sauf le contrôle des camps entrelacés**, qui ne confronte pas la base à
 * une source mais à elle-même : il tourne toujours, et couvre donc aussi les
 * coupes d'Europe et les rencontres dont la LNR ne publie rien.
 *
 * DEUX ANGLES MORTS, CORRIGÉS LE 30 AOÛT 2026, et ils étaient graves pour un
 * script dont c'est le seul métier. Il cherchait toutes ses feuilles sur
 * `top14.lnr.fr`, sans jamais appeler `utiliserDivision` : **les trois saisons
 * de Pro D2 en base — 2017-2018, 2019-2020, 2020-2021, soit 85 matchs —
 * n'avaient donc jamais été auditées**, et le disaient poliment, « feuille
 * introuvable ». Et il recalculait la phase au lieu d'appeler `phasesLnr()`,
 * ne connaissant que la journée et le barrage : demi-finales et finales
 * partaient en « hors périmètre », comme si elles relevaient de l'EPCR.
 *
 * UN TROISIÈME, CORRIGÉ LE 3 SEPTEMBRE 2026 : une rencontre dont la base n'a
 * **aucune** composition adverse était confrontée quand même, et rendait
 * vingt et une anomalies « MANQUANT » à chaque exécution. Ce n'est pas une
 * composition fautive, c'est une composition absente, et deux rencontres de
 * 2007-2008 sont dans ce cas pour de bon — la LNR y corrompt un
 * enregistrement, et rien ne le répare. Quarante-deux anomalies permanentes
 * auraient suffi à ce qu'on apprenne à ignorer le total, ce qui est
 * exactement le sinistre que ce script est censé prévenir. Elles sont
 * désormais **comptées à part**, et nommées au récapitulatif.
 *
 * À ne pas confondre avec une « feuille non lue », où c'est la **source** qui
 * manque : le Stade Français-Perpignan du 13 mai 2007 n'a de composition ni
 * en base ni chez la LNR, et sort par là.
 */

import { Prisma, PrismaClient } from "@prisma/client";
import { estAjoutHorsFeuille } from "./lib/feuilles";
import {
  chercherFeuille,
  lireCompositions,
  phasesLnr,
  utiliserDivision,
  type LnrTitulaire,
} from "./lib/lnr";
import { meilleurCandidat, motsOrphelins, normalize, VARIANTES_DAFFICHAGE } from "./lib/noms";
import { MATCH_A_VENIR, MATCH_JOUE } from "../src/lib/matchs";

const prisma = new PrismaClient();

const ARGS = process.argv.slice(2);
const SAISON_DEMANDEE = ARGS.find((a) => /^\d{4}-\d{4}$/.test(a));
const GRAVES_SEULEMENT = ARGS.includes("--graves");
const VARIANTES_VISIBLES = ARGS.includes("--variantes");
const AVEC_USAP = ARGS.includes("--usap");


const VARIANTES = new Set(
  VARIANTES_DAFFICHAGE.map(([base, feuille]) => `${normalize(base)}|${normalize(feuille)}`),
);

/** Ce couple de noms est-il une variante d'affichage déjà arbitrée ? */
function varianteConnue(nom: string, officielNom: string): boolean {
  return VARIANTES.has(`${normalize(nom)}|${normalize(officielNom)}`);
}

/** Le camp confronté. La feuille LNR porte les deux sur la même page. */
type Camp = "adversaire" | "usap";

/**
 * Compositions que la base porte **délibérément** autrement que la feuille,
 * et qu'il ne faut donc pas compter en anomalie.
 *
 * Y inscrire une ligne, c'est affirmer que **la source se trompe et qu'on l'a
 * démontré** — jamais qu'on n'a pas eu le temps de regarder. Les deux
 * rencontres ci-dessous sont documentées dans CLAUDE.md, avec leur preuve.
 *
 * Sans cette table, elles rendraient six anomalies à chaque exécution, pour
 * toujours. C'est exactement le sinistre que ce script est censé prévenir :
 * un total qu'on apprend à ignorer ne signale plus rien.
 */
const COMPOSITIONS_ARBITREES: Record<
  string,
  { camp: Camp; numero?: number; pourquoi: string }
> = {
  // La feuille se contredit sur les deux camps : ses changements font entrer
  // deux joueurs absents des vingt-trois qu'elle publie, et sortir un joueur
  // jamais entré. Le banc catalan y est décalé d'un cran. C'est le seul match
  // que `fix-opponent-lineup.ts --usap --identites` doit épargner.
  "2026-02-22": {
    camp: "usap",
    pourquoi: "feuille LNR contradictoire sur les deux camps, banc décalé d'un cran",
  },
  // La LNR a gardé l'équipe *annoncée* : elle met Bruce Devaux au n°1 quand
  // *L'Indépendant* et allrugby donnent Enzo Forletta titulaire, et que sa
  // propre page de faits fait entrer Forletta à la 72e — un homme absent de
  // ses vingt-trois. `fix-titulaire-2026-09-12.ts` a rendu le dossard.
  "2026-09-12": {
    camp: "usap",
    pourquoi: "la LNR publie l'équipe annoncée, non l'équipe alignée (n°1 Forletta)",
  },
  // LA LNR POINTE LA FICHE DU FRÈRE. Sa feuille donne « Mathys Lotrian » au
  // n°17 catalan ; c'est **Sacha** qui joue, et trois choses le disent. Le
  // n°17 est le dossard du **pilier gauche remplaçant** — Sacha est pilier
  // gauche, Mathys est talonneur, et le n°16 de cette même feuille est déjà
  // Victor Montgaillard. La feuille de la J1, une semaine plus tôt, donne
  // Sacha au n°17 : le banc n'a pas changé de pilier entre les deux
  // journées. Et Mathys, né en 2004, n'a alors aucune feuille
  // professionnelle — la première est de janvier 2025.
  //
  // C'est donc l'inverse du cas de 2025-2026, où la base avait pris Sacha
  // pour Mathys : ici la base dit vrai et la source se trompe. Arbitré par
  // Jérémy le 23 septembre 2026, sur le dossard.
  //
  // Seule la ligne du n°17 est tue, non la composition entière : les
  // vingt-deux autres restent confrontées.
  "2023-08-26": {
    camp: "usap",
    numero: 17,
    pourquoi: "la LNR pointe la fiche de Mathys Lotrian au n°17 ; c'est Sacha, pilier gauche",
  },
};

type Gravite =
  | "MANQUANT"
  | "EN TROP"
  | "NUMÉRO"
  | "ÉCRITURE"
  | "TITULAIRE"
  | "CAPITAINE";

const GRAVES: Gravite[] = ["MANQUANT", "EN TROP"];

interface Anomalie {
  gravite: Gravite;
  numero: number;
  detail: string;
}

/** Anomalies retenues, et variantes d'affichage reconnues puis tues. */
interface Bilan {
  anomalies: Anomalie[];
  variantes: string[];
  /**
   * **La base n'a aucune composition pour ce camp.** Ce n'est pas une
   * composition fautive, c'est une composition absente, et la confronter ligne
   * à ligne rend autant de « MANQUANT » qui n'annoncent rien de neuf. Les deux
   * rencontres de 2007-2008 dont la LNR corrompt un enregistrement en sont là
   * pour de bon (cf. CLAUDE.md) : sans ce cas à part, elles porteraient à
   * elles seules quarante-deux anomalies à chaque exécution, et le total
   * cesserait d'être un signal — c'est exactement ce que les vingt-six
   * rencontres à venir de 2026-2027 faisaient avant qu'on ne les écarte.
   *
   * Le nombre exact dépend de la feuille : vingt-deux joueurs jusqu'en
   * 2007-2008, vingt-trois depuis, moins ceux que la LNR omet elle-même.
   */
  sansComposition?: boolean;
}

/**
 * Codes Prisma qui disent « la connexion a lâché », non « la requête est
 * fausse ». Rejouer les seconds masquerait un bug ; rejouer les premiers est
 * la seule façon de survivre à une moisson longue.
 */
const CONNEXION_PERDUE = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

/**
 * Cette erreur dit-elle « la connexion a lâché » ? Rend le code à afficher, ou
 * `null` s'il faut la laisser remonter.
 *
 * **Deux familles, et la seconde a coûté une exécution.** Les erreurs de
 * requête portent un `code` — `P1017` quand le serveur ferme la connexion,
 * `P2024` quand le pool expire. Mais quand le serveur est carrément
 * injoignable, Prisma lève une `PrismaClientInitializationError`, qui **ne
 * porte pas de `code`** : son `errorCode` vaut `undefined`. Le test sur le
 * seul `code` la laissait donc passer, et l'audit du 1er septembre 2026 est
 * mort dessus après avoir pourtant réussi sa première reprise sur `P2024`.
 * On la reconnaît au type, seul moyen sûr.
 */
function connexionPerdue(erreur: unknown): string | null {
  if (erreur instanceof Prisma.PrismaClientInitializationError) {
    return erreur.errorCode ?? "serveur injoignable";
  }
  const code = (erreur as { code?: unknown }).code;
  return typeof code === "string" && CONNEXION_PERDUE.has(code) ? code : null;
}

/**
 * Rejoue une requête que le serveur a fait échouer en fermant la connexion.
 *
 * **L'audit tient une connexion Prisma pendant toute sa moisson** : il
 * télécharge 488 feuilles une à une, et entre deux requêtes la connexion reste
 * inutilisée assez longtemps pour que Supabase la coupe. Elle rend alors
 * `P1017`, et le script mourait au milieu — c'est arrivé le 1er septembre
 * 2026, après une vingtaine de minutes de travail perdu, et sans qu'aucune
 * ligne de résultat ait été écrite.
 *
 * Prisma rouvre de lui-même à la requête suivante : il suffit donc de rejouer
 * celle qui a échoué, après avoir laissé au serveur le temps de reprendre.
 * Trois tentatives, l'attente doublant à chaque fois.
 *
 * **La reprise s'annonce.** Une connexion qui lâche à répétition dit quelque
 * chose de la base ou du réseau, et un script qui s'en remet en silence le
 * cacherait.
 */
async function avecReconnexion<T>(quoi: string, requete: () => Promise<T>): Promise<T> {
  const TENTATIVES = 3;
  for (let essai = 1; ; essai++) {
    try {
      return await requete();
    } catch (erreur) {
      const code = connexionPerdue(erreur);
      if (code === null || essai >= TENTATIVES) throw erreur;
      const attente = 1000 * 2 ** (essai - 1);
      console.log(
        `  ↻ connexion perdue (${code}) sur ${quoi} — reprise ${essai}/${TENTATIVES - 1} ` +
          `dans ${attente / 1000}s`,
      );
      await prisma.$disconnect().catch(() => undefined);
      await new Promise((resoudre) => setTimeout(resoudre, attente));
    }
  }
}

async function auditerMatch(
  matchId: string,
  officielle: LnrTitulaire[],
  jour: string,
  camp: Camp,
): Promise<Bilan> {
  const enBase = await avecReconnexion(`la composition ${camp} du ${jour}`, () =>
    prisma.matchPlayer.findMany({
      where: { matchId, isOpponent: camp === "adversaire" },
      select: {
        shirtNumber: true,
        isStarter: true,
        isCaptain: true,
        player: { select: { firstName: true, lastName: true } },
      },
    }),
  );

  const anomalies: Anomalie[] = [];
  const variantes: string[] = [];

  // Rien à confronter : la rencontre est comptée à part, non auditée.
  if (enBase.length === 0) return { anomalies, variantes, sansComposition: true };

  /**
   * Les joueurs sont d'abord appariés sur leur identité, pas sur leur numéro.
   * Sans quoi une simple permutation de dossards — cas de loin le plus
   * fréquent — se lit comme une composition entièrement inventée : deux
   * joueurs bien présents, chacun sous le numéro de l'autre.
   */
  const restants = enBase.filter((l) => l.player != null);
  const paires = new Map<number, (typeof restants)[number]>();

  for (const officiel of officielle) {
    const officielNom = `${officiel.firstName} ${officiel.lastName}`;
    const trouve = meilleurCandidat(
      restants,
      (l) => `${l.player!.firstName} ${l.player!.lastName}`,
      (l) => l.shirtNumber,
      officielNom,
      officiel.numero,
    );
    if (!trouve) continue;
    paires.set(officiel.numero, trouve);
    restants.splice(restants.indexOf(trouve), 1);
  }

  for (const officiel of officielle) {
    const ligne = paires.get(officiel.numero);
    if (!ligne?.player) {
      anomalies.push({
        gravite: "MANQUANT",
        numero: officiel.numero,
        detail: `${officiel.firstName} ${officiel.lastName} ne figure nulle part dans la composition en base`,
      });
      continue;
    }

    const nom = `${ligne.player.firstName} ${ligne.player.lastName}`;
    const officielNom = `${officiel.firstName} ${officiel.lastName}`;

    if (ligne.shirtNumber !== officiel.numero) {
      anomalies.push({
        gravite: "NUMÉRO",
        numero: officiel.numero,
        detail: `${officielNom} porte le n°${ligne.shirtNumber} en base`,
      });
    }
    const orphelins = motsOrphelins(nom, officielNom);
    if (orphelins.length > 0) {
      // Une variante déjà arbitrée n'est pas une anomalie, mais elle reste
      // comptée : une table qui grossit sans qu'on la voie ne vaut rien.
      if (varianteConnue(nom, officielNom)) {
        variantes.push(`n°${String(officiel.numero).padStart(2)} « ${nom} » / « ${officielNom} »`);
      } else {
        anomalies.push({
          gravite: "ÉCRITURE",
          numero: officiel.numero,
          detail: `base « ${nom} » — feuille « ${officielNom} »`,
        });
      }
    }
    if (ligne.isStarter !== officiel.isStarter) {
      anomalies.push({
        gravite: "TITULAIRE",
        numero: officiel.numero,
        detail: `${nom} : ${ligne.isStarter ? "titulaire" : "remplaçant"} en base, ${officiel.isStarter ? "titulaire" : "remplaçant"} sur la feuille`,
      });
    }
    if (officiel.isCaptain && !ligne.isCaptain) {
      anomalies.push({
        gravite: "CAPITAINE",
        numero: officiel.numero,
        detail: `${nom} est capitaine sur la feuille`,
      });
    }
  }

  for (const ligne of restants) {
    // Un joueur que la feuille officielle omet et qu'on a rendu à son dossard
    // depuis une autre source n'est pas « en trop » : il est absent parce que
    // la LNR l'a oublié. `lib/feuilles.ts` porte la table et sa démonstration.
    if (estAjoutHorsFeuille(jour, camp === "adversaire" ? "adversaire" : "usap", ligne.shirtNumber ?? 0)) {
      variantes.push(
        `n°${ligne.shirtNumber} ${ligne.player?.firstName} ${ligne.player?.lastName} — ` +
          "ajouté depuis une autre source, la LNR ne le publie pas",
      );
      continue;
    }
    anomalies.push({
      gravite: "EN TROP",
      numero: ligne.shirtNumber ?? 0,
      detail: `${ligne.player?.firstName} ${ligne.player?.lastName} absent de la feuille officielle`,
    });
  }

  return { anomalies: anomalies.sort((a, b) => a.numero - b.numero), variantes };
}

/**
 * Les joueurs qui passent d'un camp à l'autre **et reviennent**, sur une
 * même saison.
 *
 * UN HOMME NE JOUE PAS DES DEUX CÔTÉS EN MÊME TEMPS, et c'est le seul
 * contrôle du projet qui n'ait besoin d'aucune source : il ne confronte pas
 * la base à la LNR, il confronte la base à elle-même. Il est donc gratuit,
 * et il couvre ce que l'audit des feuilles ne couvre pas — les coupes
 * d'Europe, et les rencontres dont la LNR ne publie pas de composition.
 *
 * **Mais « deux camps la même saison » ne suffit pas comme critère.** Le
 * mercato le fait légitimement, quatre fois dans la base : Xavier Chiocci
 * affronte l'USAP avec Lyon en septembre 2021 puis y signe en décembre,
 * Jonathan Gray avec l'UBB en octobre 2025 avant d'arriver en avril. Les
 * signaler serait apprendre à ignorer le total.
 *
 * Ce qui distingue le transfert de l'erreur, c'est le **nombre de
 * bascules** : un joueur qui change de club en change une fois, et ses
 * feuilles se rangent en deux blocs. Deux bascules ou plus, c'est un
 * entrelacement — le même homme des deux côtés en alternance —, et cela ne
 * se produit pas.
 *
 * LE CAS FONDATEUR EST SACHA LOTRIAN, le 22 septembre 2026. La base lui
 * donnait quatre feuilles catalanes de 2025-2026 qui sont celles de son
 * frère Mathys, talonneur, et il figurait par ailleurs dans le camp de
 * Clermont le 20 décembre 2025 — au milieu. Deux bascules. Aucun autre
 * contrôle ne pouvait le voir : les scores retombaient, les minutes aussi,
 * et `audit-opponent-lineups` ne lisait que l'adversaire. C'est Jérémy qui
 * l'a trouvé, en relisant une liste de joueurs sans portrait.
 */
async function campsEntrelaces(saison: Prisma.MatchWhereInput): Promise<string[]> {
  const lignes = await avecReconnexion("les lignes des deux camps", () =>
    prisma.matchPlayer.findMany({
      where: { playerId: { not: null }, match: { ...MATCH_JOUE, ...saison } },
      select: {
        isOpponent: true,
        playerId: true,
        player: { select: { firstName: true, lastName: true } },
        match: {
          select: {
            date: true,
            seasonId: true,
            season: { select: { label: true } },
            opponent: { select: { name: true, shortName: true } },
          },
        },
      },
    }),
  );

  const parJoueurEtSaison = new Map<string, typeof lignes>();
  for (const l of lignes) {
    const cle = `${l.playerId}|${l.match.seasonId}`;
    if (!parJoueurEtSaison.has(cle)) parJoueurEtSaison.set(cle, []);
    parJoueurEtSaison.get(cle)!.push(l);
  }

  const signales: string[] = [];
  for (const groupe of parJoueurEtSaison.values()) {
    groupe.sort((a, b) => a.match.date.getTime() - b.match.date.getTime());
    let bascules = 0;
    for (let i = 1; i < groupe.length; i++) {
      if (groupe[i].isOpponent !== groupe[i - 1].isOpponent) bascules++;
    }
    if (bascules < 2) continue;
    const joueur = groupe[0].player!;
    const suite = groupe
      .map((l) => {
        const jour = l.match.date.toISOString().slice(0, 10);
        const ou = l.isOpponent
          ? (l.match.opponent.shortName ?? l.match.opponent.name)
          : "USAP";
        return `${jour} ${ou}`;
      })
      .join("  →  ");
    signales.push(
      `${groupe[0].match.season.label}  ${joueur.firstName} ${joueur.lastName} — ` +
        `${bascules} bascules\n      ${suite}`,
    );
  }
  return signales;
}

async function main() {
  console.log(
    `=== Compositions ${AVEC_USAP ? "des deux camps" : "adverses"} confrontées aux ` +
      `feuilles LNR${SAISON_DEMANDEE ? ` — ${SAISON_DEMANDEE}` : ""} ===\n`,
  );

  const saison = SAISON_DEMANDEE ? { season: { label: SAISON_DEMANDEE } } : {};

  // **Une rencontre à venir n'a rien à auditer**, la LNR ne publiant ses
  // compositions que la veille. Sans ce filtre, l'audit allait chercher les
  // vingt-six feuilles vides du calendrier 2026-2027 à chaque passage et les
  // rangeait en « feuille non lue » : vingt-six avertissements par exécution,
  // qui n'annonçaient rien et noyaient les vrais. Le compte des écartées est
  // rendu au récapitulatif, une omission tue valant mieux dite.
  const matchs = await avecReconnexion("la liste des matchs", () =>
    prisma.match.findMany({
      where: { ...MATCH_JOUE, ...saison },
      orderBy: { date: "asc" },
      include: {
        season: { select: { label: true, startYear: true, division: true } },
        opponent: { select: { name: true, shortName: true } },
        competition: { select: { shortName: true } },
      },
    }),
  );

  /** Les camps confrontés. Le catalan n'entre que sur `--usap`. */
  const camps: Camp[] = AVEC_USAP ? ["adversaire", "usap"] : ["adversaire"];

  let examines = 0;
  let sains = 0;
  const horsPerimetre: string[] = [];
  /** Rencontres dont la base n'a aucune composition adverse : rien à auditer. */
  const sansCompositionEnBase: string[] = [];
  const illisibles: string[] = [];
  /** Compositions délibérément divergentes, tues mais comptées. */
  const arbitrees: string[] = [];
  const parGravite = new Map<Gravite, number>();
  const variantesTues: string[] = [];

  for (const match of matchs) {
    const jour = match.date.toISOString().slice(0, 10);
    const adversaire = match.opponent.shortName ?? match.opponent.name;
    const etiquette = `${match.season.label} ${jour} ${adversaire.padEnd(16)}`;

    // La LNR sépare ses deux divisions sur deux sites : sans cette bascule,
    // une saison de Pro D2 se cherche sur top14.lnr.fr et ne rend rien.
    utiliserDivision(String(match.season.division) === "PRO_D2" ? "prod2" : "top14");

    // `phasesLnr()` porte la règle complète — la liste blanche des
    // compétitions que la LNR couvre, puis journée, demi-finale, finale et
    // barrage avec ses trois noms successifs. Ce script a longtemps porté sa
    // propre liste noire des coupes d'Europe ; elle est partie dans la
    // fonction, seule à en avoir besoin dans ses cinq appelants.
    const phases = phasesLnr(
      match.season.label,
      match.matchday,
      `${match.competition.shortName} ${match.round ?? ""}`,
    );
    if (phases.length === 0) {
      horsPerimetre.push(`${etiquette} (${match.competition.shortName})`);
      continue;
    }

    // **UNE SEULE LECTURE POUR LES DEUX CAMPS.** La page `/compositions` de
    // la LNR porte les vingt-trois de chaque côté : auditer le camp catalan
    // ne coûte donc pas une requête de plus, seulement une lecture Prisma et
    // un appariement. C'est la raison pour laquelle ce contrôle vit ici et
    // non dans un script à part, qui téléchargerait les mêmes feuilles une
    // seconde fois.
    let compositions: { adversaire: LnrTitulaire[]; usap: LnrTitulaire[] } | null = null;
    let dernierEchec = "";
    for (const phase of phases) {
      try {
        const url = await chercherFeuille(match.season.label, phase);
        if (!url) {
          dernierEchec = `feuille introuvable pour ${phase}`;
          continue;
        }
        const lues = await lireCompositions(url);
        compositions = { adversaire: lues.adversaire, usap: lues.usap };
        break;
      } catch (erreur) {
        dernierEchec = (erreur as Error).message;
      }
    }
    if (!compositions) {
      illisibles.push(`${etiquette} : ${dernierEchec}`);
      continue;
    }

    for (const camp of camps) {
      const officielle = compositions[camp];
      const marque = camp === "usap" ? "USAP    " : "adverse ";

      const arbitree = COMPOSITIONS_ARBITREES[jour];
      // Sans dossard, c'est la composition entière qui est écartée ; avec,
      // seule la ligne de ce dossard est tue et le reste reste confronté.
      if (arbitree && arbitree.camp === camp && arbitree.numero === undefined) {
        arbitrees.push(`${etiquette} ${marque} — ${arbitree.pourquoi}`);
        continue;
      }
      const { anomalies, variantes, sansComposition } = await auditerMatch(
        match.id,
        officielle,
        jour,
        camp,
      );
      if (sansComposition) {
        sansCompositionEnBase.push(`${etiquette} ${marque}`);
        continue;
      }

      // La ligne arbitrée sort des anomalies, mais elle est comptée et dite.
      if (arbitree && arbitree.camp === camp && arbitree.numero !== undefined) {
        const avant = anomalies.length;
        for (let i = anomalies.length - 1; i >= 0; i--) {
          if (anomalies[i].numero === arbitree.numero) anomalies.splice(i, 1);
        }
        if (avant !== anomalies.length) {
          arbitrees.push(
            `${etiquette} ${marque} n°${arbitree.numero} — ${arbitree.pourquoi}`,
          );
        }
      }

      examines++;
      const retenues = GRAVES_SEULEMENT
        ? anomalies.filter((a) => GRAVES.includes(a.gravite))
        : anomalies;

      if (anomalies.length === 0) sains++;
      for (const a of anomalies) {
        parGravite.set(a.gravite, (parGravite.get(a.gravite) ?? 0) + 1);
      }
      for (const v of variantes) variantesTues.push(`${etiquette} ${marque} ${v}`);
      if (retenues.length === 0) continue;

      console.log(`${etiquette} ${marque}— ${retenues.length} anomalie(s)`);
      for (const a of retenues) {
        console.log(`    ${a.gravite.padEnd(9)} n°${String(a.numero).padStart(2)} ${a.detail}`);
      }
    }
  }

  console.log(
    `\n=== ${examines} match(s) examinés, ${sains} conformes, ${examines - sains} avec au moins une anomalie ===`,
  );
  for (const [gravite, nombre] of [...parGravite].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${gravite.padEnd(9)} ${nombre}`);
  }
  if (variantesTues.length > 0) {
    console.log(
      `  ${"variantes".padEnd(9)} ${variantesTues.length} d'affichage déjà arbitrée(s), tue(s)` +
        `${VARIANTES_VISIBLES ? " :" : " — « --variantes » pour les voir"}`,
    );
    if (VARIANTES_VISIBLES) for (const v of variantesTues) console.log(`      ${v}`);
  }
  if (illisibles.length > 0) {
    console.log(`\n${illisibles.length} feuille(s) non lue(s) :`);
    for (const i of illisibles) console.log(`  ⚠ ${i}`);
  }
  if (sansCompositionEnBase.length > 0) {
    console.log(
      `\n${sansCompositionEnBase.length} match(s) sans composition en base, rien à auditer :`,
    );
    for (const ligne of sansCompositionEnBase) console.log(`  · ${ligne}`);
  }
  if (arbitrees.length > 0) {
    console.log(`\n${arbitrees.length} composition(s) délibérément divergente(s), non auditée(s) :`);
    for (const a of arbitrees) console.log(`  · ${a}`);
  }
  if (horsPerimetre.length > 0) {
    console.log(`\n${horsPerimetre.length} match(s) hors périmètre LNR (coupes d'Europe).`);
  }

  // Ce contrôle-là ne dépend d'aucune source : il tourne toujours, y compris
  // sur les rencontres que la LNR ne couvre pas.
  const entrelaces = await campsEntrelaces(saison);
  if (entrelaces.length > 0) {
    console.log(`\n${entrelaces.length} joueur(s) des deux camps en alternance — à vérifier :`);
    for (const e of entrelaces) console.log(`  ⚠ ${e}`);
  } else {
    console.log("\nAucun joueur des deux camps en alternance.");
  }
  // Ce compte-là est le plus exposé de tous : il tombe après la moisson
  // entière, quand la connexion est restée inutilisée le plus longtemps.
  const aVenir = await avecReconnexion("le compte des rencontres à venir", () =>
    prisma.match.count({ where: { ...MATCH_A_VENIR, ...saison } }),
  );
  if (aVenir > 0) {
    console.log(`${aVenir} rencontre(s) à venir, sans composition à auditer.`);
  }
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

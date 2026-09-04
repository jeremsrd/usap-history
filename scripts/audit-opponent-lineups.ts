/**
 * Confronte les compositions adverses en base aux feuilles officielles LNR.
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
 *               voir `VARIANTES_DAFFICHAGE` plus bas
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
 *   npx tsx scripts/audit-opponent-lineups.ts --graves         # MANQUANT et EN TROP
 *   npx tsx scripts/audit-opponent-lineups.ts --variantes      # + les variantes tues
 *
 * **Zéro anomalie est l'état attendu**, et c'est tout l'intérêt de la table de
 * variantes : le total redevient un signal, tout écart nouveau se remarque.
 *
 * Ne couvre que ce que la LNR publie — championnat et phases finales des deux
 * divisions, barrages compris. Les coupes d'Europe relèvent de l'EPCR.
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
import { meilleurCandidat, motsOrphelins, normalize } from "./lib/noms";
import { MATCH_A_VENIR, MATCH_JOUE } from "../src/lib/matchs";

const prisma = new PrismaClient();

const ARGS = process.argv.slice(2);
const SAISON_DEMANDEE = ARGS.find((a) => /^\d{4}-\d{4}$/.test(a));
const GRAVES_SEULEMENT = ARGS.includes("--graves");
const VARIANTES_VISIBLES = ARGS.includes("--variantes");

/**
 * Variantes d'affichage vérifiées à la main : la base porte le nom d'usage,
 * la feuille officielle l'état civil, et ce sont bien deux écritures du même
 * homme.
 *
 * **Pourquoi une table propre à l'audit**, et non deux lignes dans
 * `NOMS_DUSAGE` de `lib/noms.ts` : cette table-là nourrit `memeMot`, dont
 * dépendent `joueurs.ts` pour créer ou retrouver une fiche,
 * `seed-opponent-sheet.ts` pour apparier une composition et `sync-effectif.ts`.
 * Y déclarer « tom = thomas », « joe = joseph » ou « nick = nicholas », c'est
 * rendre équivalents des prénoms parmi les plus répandus du rugby et rouvrir
 * l'accident Kane Douglas / Wesley Douglas. Ici on ne rapproche pas deux
 * **mots**, on reconnaît deux **noms complets** appariés : « Tom Staniforth »
 * ne vaut que pour « Thomas Staniforth », et aucun autre Tom ne s'en trouve
 * rapproché d'aucun autre Thomas. L'arbitrage d'identité n'est pas touché.
 *
 * **Pourquoi elle est nécessaire.** Sans elle le compteur d'ÉCRITURE n'est
 * plus un signal : la fusion des dix doublons du 30 août 2026 l'a fait passer
 * de 21 à 31, non parce que la base se dégradait, mais parce qu'un homme
 * réuni sous son nom d'usage diverge désormais de la LNR sur chacune de ses
 * feuilles. Un audit dont on apprend à ignorer le total ne garde plus rien —
 * c'est ainsi que 22 faux hommes ont vécu en ÉCRITURE jusqu'au 30 août.
 *
 * **Ce qu'on affirme en y ajoutant une ligne** : que ces deux noms désignent
 * la même personne, feuille officielle sous les yeux. Rien n'est deviné, et
 * rien n'est caché : le total des variantes tues figure au récapitulatif, et
 * `--variantes` les affiche une à une.
 */
const VARIANTES_DAFFICHAGE: [base: string, feuille: string][] = [
  // Prénom d'usage en base, état civil sur la feuille.
  ["Tom Staniforth", "Thomas Staniforth"],
  ["Tom Willis", "Thomas Daniel Willis"],
  ["Joe Powell", "Joseph Patrick Powell"],
  ["Harry Plummer", "Harrison Plummer"],
  ["Sammy Arnold", "Samuel Arnold"],
  ["Billy Vunipola", "Viliami Vunipola"],
  ["Cobus Reinach", "Jacobus Meyer Reinach"],
  ["Nacho Brex", "Juan Ignacio Brex"],
  ["Nick Champion de Crespigny", "Richard Nicholas Champion De Crespigny"],
  // Le prénom d'usage reprend la fin du patronyme, que la feuille répète.
  ["Tolu Latu", "Latu Silatolu Latu"],
  // La LNR ampute l'apostrophe et coupe le nom ailleurs.
  ["Marvin O'Connor", "Marvin O Connor"],
  ["Ma'a Nonu", "Ma A Allan Nonu"],
  // Orthographe : la feuille perd le « h ».
  ["Sikhumbuzo Notshe", "Sikumbuzo Notshe"],
  // Apparues le 30 août 2026, quand l'audit a enfin vu les saisons de Pro D2.
  // La LNR écrit le même talonneur « Cyriel » à Dax en 2017-2018 et « Cyril »
  // à Vannes ensuite ; une seule fiche, un seul Blanchard par feuille.
  ["Cyril Blanchard", "Cyriel Blanchard"],
  ["Eddie Sawailau", "Edward Dratai Sawailau"],
  ["Napolioni Nalaga", "Naipolioni Vonowale Nalaga"],
  // Apparues avec 2004-2005, et **la source se contredit elle-même dans les
  // deux cas**. Thibaut Privat, deuxième ligne de Clermont puis de
  // Montpellier, porte dix-huit feuilles en base ; la LNR l'écrit « Thibault »
  // sur celle du 19 février 2005 et « Thibaut » partout ailleurs. Yohann
  // Authier, lui, est « Yohann » à Grenoble le 21 mai 2005 et « Johann » à
  // Oyonnax le 12 avril 2014 — neuf ans, deux clubs, un seul homme, deux
  // orthographes officielles.
  ["Thibaut Privat", "Thibault Privat"],
  ["Johann Authier", "Yohann Authier"],
];

const VARIANTES = new Set(
  VARIANTES_DAFFICHAGE.map(([base, feuille]) => `${normalize(base)}|${normalize(feuille)}`),
);

/** Ce couple de noms est-il une variante d'affichage déjà arbitrée ? */
function varianteConnue(nom: string, officielNom: string): boolean {
  return VARIANTES.has(`${normalize(nom)}|${normalize(officielNom)}`);
}

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
): Promise<Bilan> {
  const enBase = await avecReconnexion(`la composition du ${jour}`, () =>
    prisma.matchPlayer.findMany({
      where: { matchId, isOpponent: true },
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
    if (estAjoutHorsFeuille(jour, "adversaire", ligne.shirtNumber ?? 0)) {
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

async function main() {
  console.log(
    `=== Compositions adverses confrontées aux feuilles LNR${SAISON_DEMANDEE ? ` — ${SAISON_DEMANDEE}` : ""} ===\n`,
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

  let examines = 0;
  let sains = 0;
  const horsPerimetre: string[] = [];
  /** Rencontres dont la base n'a aucune composition adverse : rien à auditer. */
  const sansCompositionEnBase: string[] = [];
  const illisibles: string[] = [];
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

    let officielle: LnrTitulaire[] | null = null;
    let dernierEchec = "";
    for (const phase of phases) {
      try {
        const url = await chercherFeuille(match.season.label, phase);
        if (!url) {
          dernierEchec = `feuille introuvable pour ${phase}`;
          continue;
        }
        officielle = (await lireCompositions(url)).adversaire;
        break;
      } catch (erreur) {
        dernierEchec = (erreur as Error).message;
      }
    }
    if (!officielle) {
      illisibles.push(`${etiquette} : ${dernierEchec}`);
      continue;
    }

    const { anomalies, variantes, sansComposition } = await auditerMatch(
      match.id,
      officielle,
      jour,
    );
    if (sansComposition) {
      sansCompositionEnBase.push(etiquette);
      continue;
    }

    examines++;
    const retenues = GRAVES_SEULEMENT
      ? anomalies.filter((a) => GRAVES.includes(a.gravite))
      : anomalies;

    if (anomalies.length === 0) sains++;
    for (const a of anomalies) {
      parGravite.set(a.gravite, (parGravite.get(a.gravite) ?? 0) + 1);
    }
    for (const v of variantes) variantesTues.push(`${etiquette} ${v}`);
    if (retenues.length === 0) continue;

    console.log(`${etiquette} — ${retenues.length} anomalie(s)`);
    for (const a of retenues) {
      console.log(`    ${a.gravite.padEnd(9)} n°${String(a.numero).padStart(2)} ${a.detail}`);
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
  if (horsPerimetre.length > 0) {
    console.log(`\n${horsPerimetre.length} match(s) hors périmètre LNR (coupes d'Europe).`);
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

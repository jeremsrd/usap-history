/**
 * Remet une composition adverse en accord avec la feuille officielle.
 *
 * Deux sources, une seule logique : la LNR pour le championnat, l'EPCR pour
 * les coupes d'Europe. Toutes deux donnent vingt-trois joueurs avec leur
 * dossard et le brassard, ce qui suffit à corriger la base.
 *
 * Complément de audit-opponent-lineups.ts, qui repère les écarts sans les
 * corriger. Ce script en corrige un match : bon joueur sur chaque dossard,
 * titulaires et remplaçants comme sur la feuille, capitaine signalé.
 *
 * L'appariement se fait sur l'identité, puis les restes sont réattribués par
 * dossard : quand la base porte un joueur qui n'a pas joué et ignore celui qui
 * a joué, c'est bien un échange de fiche sur un même numéro. Les joueurs
 * absents de la base sont créés — après recherche sur le nom normalisé, pour
 * ne pas fabriquer de doublon.
 *
 * Ce que le script **ne touche pas** : réalisations, cartons et temps de jeu.
 * Ils dépendent de l'identité qu'on vient de changer, et se réécrivent depuis
 * la même source, avec seed-opponent-sheet.ts. Le script prévient
 * quand une ligne réattribuée en portait.
 *
 * Les **changements d'identité** — rendre un dossard à celui qui l'a porté —
 * demandent `--identites`. Sans ce drapeau, une ligne dont l'occupant ne
 * correspond pas à la feuille est laissée telle quelle et signalée : sur un
 * passage global, ces cas-là méritent d'être regardés un par un, alors qu'un
 * dossard ou un brassard de capitaine se corrige sans risque.
 *
 * Usage :
 *   npx tsx scripts/fix-opponent-lineup.ts 2024-09-28 --dry
 *   npx tsx scripts/fix-opponent-lineup.ts 2024-09-28 --identites
 *   npx tsx scripts/fix-opponent-lineup.ts 2023-2024 --dry     # une saison
 *   npx tsx scripts/fix-opponent-lineup.ts --tout --dry        # toute la base
 *   npx tsx scripts/fix-opponent-lineup.ts --tout --usap --dry # les deux camps
 */

import { PrismaClient, Position } from "@prisma/client";
import { chercherFeuille, lireCompositions, type LnrTitulaire } from "./lib/lnr";
import { USAP, chercherMatchUsap, lireMatch } from "./lib/epcr";
import { POSTE_PAR_NUMERO, trouverOuCreerJoueur as trouverOuCreer } from "./lib/joueurs";
import { meilleurCandidat, normalize } from "./lib/noms";

const prisma = new PrismaClient();

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry");
const IDENTITES = ARGS.includes("--identites");
const TOUT = ARGS.includes("--tout");
const AVEC_USAP = ARGS.includes("--usap");
const DATE = ARGS.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const SAISON = ARGS.find((a) => /^\d{4}-\d{4}$/.test(a));


/** Le module partagé prend le client et les options ; ici ils sont fixes. */
async function trouverOuCreerJoueur(officiel: LnrTitulaire): Promise<string> {
  return trouverOuCreer(prisma, officiel, { dryRun: DRY_RUN });
}


type MatchAvecContexte = Awaited<ReturnType<typeof chargerMatchs>>[number];

async function chargerMatchs() {
  return prisma.match.findMany({
    where: DATE
      ? // Une rencontre porte l'heure du coup d'envoi : comparer sa date à
        // minuit ne trouve rien, et le script annonçait « 0 match examiné »
        // comme un succès. On prend la journée entière.
        {
          date: {
            gte: new Date(`${DATE}T00:00:00Z`),
            lt: new Date(`${DATE}T23:59:59Z`),
          },
        }
      : SAISON
        ? { season: { label: SAISON } }
        : {},
    orderBy: { date: "asc" },
    include: {
      season: { select: { label: true, startYear: true } },
      opponent: { select: { name: true, shortName: true } },
      competition: { select: { shortName: true } },
    },
  });
}

interface Bilan {
  corrections: number;
  identitesIgnorees: number;
}

/** Compétitions dont la LNR ne publie rien : elles relèvent de l'EPCR. */
const COUPES_EUROPE = new Set(["Challenge Européen", "H-Cup"]);

/**
 * Composition adverse officielle : la LNR pour le championnat, l'EPCR pour les
 * coupes d'Europe. Les deux sources disent la même chose — vingt-trois joueurs,
 * leur dossard et le brassard —, ce qui permet de n'écrire la correction
 * qu'une fois.
 *
 * `null` pour une rencontre qu'aucune des deux ne couvre : la finale 2008-2009
 * n'a ni journée, ni barrage, ni coupe d'Europe.
 */
type Camp = "usap" | "adverse";

async function composition(
  match: MatchAvecContexte,
  camp: Camp,
): Promise<{ source: string; joueurs: LnrTitulaire[] } | null> {
  if (COUPES_EUROPE.has(match.competition.shortName ?? "")) {
    const jour = match.date.toISOString().slice(0, 10);
    const resume = await chercherMatchUsap(match.season.label, jour);
    if (!resume) throw new Error(`Match EPCR introuvable pour le ${jour}`);
    const feuille = await lireMatch(resume.id);
    if ((feuille.domicile.id === USAP) !== match.isHome) {
      throw new Error(
        `l'EPCR donne l'USAP ${feuille.domicile.id === USAP ? "à domicile" : "à l'extérieur"}, ` +
          `la base dit l'inverse`,
      );
    }
    const usap = feuille.domicile.id === USAP ? feuille.domicile : feuille.exterieur;
    const adverse = feuille.domicile.id === USAP ? feuille.exterieur : feuille.domicile;
    return {
      source: `EPCR ${feuille.id}`,
      joueurs: (camp === "usap" ? usap : adverse).joueurs.map((j) => ({
        numero: j.numero,
        firstName: j.firstName,
        lastName: j.lastName,
        isCaptain: j.isCaptain,
        isStarter: j.isStarter,
      })),
    };
  }

  const phase =
    match.matchday != null
      ? `j${match.matchday}`
      : match.competition.shortName === "Barrages"
        ? match.season.startYear >= 2024
          ? "access-top-14"
          : "access"
        : null;
  if (!phase) return null;

  const url = await chercherFeuille(match.season.label, phase);
  if (!url) throw new Error(`Feuille LNR introuvable pour ${phase}`);
  const compositions = await lireCompositions(url);
  return {
    source: url.split("/").pop() ?? url,
    joueurs: camp === "usap" ? compositions.usap : compositions.adversaire,
  };
}

/**
 * Les deux camps ne sont pas corrigés par défaut. La composition de l'USAP est
 * saisie à la main et généralement juste ; celle de l'adversaire vient
 * d'imports successifs. Les feuilles de coupe d'Europe ont montré l'exception
 * — six d'entre elles intervertissent deux dossards catalans —, d'où `--usap`.
 */
async function corrigerCamp(
  match: MatchAvecContexte,
  camp: Camp,
): Promise<Bilan | null> {
  const adversaire = match.opponent.shortName ?? match.opponent.name;
  const jour = match.date.toISOString().slice(0, 10);
  const entete =
    `${match.season.label} ${jour} ${adversaire.padEnd(16)}` +
    (camp === "usap" ? " [USAP]" : "");

  const source = await composition(match, camp);
  if (!source) return null;
  const officielle = source.joueurs;

  const enBase = await prisma.matchPlayer.findMany({
    where: { matchId: match.id, isOpponent: camp === "adverse" },
    select: {
      id: true,
      shirtNumber: true,
      isStarter: true,
      isCaptain: true,
      positionPlayed: true,
      totalPoints: true,
      player: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (officielle.length !== enBase.length) {
    throw new Error(
      `${officielle.length} joueurs sur la feuille, ${enBase.length} en base — à arbitrer à la main`,
    );
  }

  // ---- Appariement sur l'identité, puis par dossard pour les restes -------
  const restants = [...enBase];
  const cible = new Map<number, (typeof enBase)[number]>();

  for (const officiel of officielle) {
    const trouve = meilleurCandidat(
      restants,
      (l) => `${l.player?.firstName ?? ""} ${l.player?.lastName ?? ""}`,
      (l) => l.shirtNumber,
      `${officiel.firstName} ${officiel.lastName}`,
      officiel.numero,
    );
    if (!trouve) continue;
    cible.set(officiel.numero, trouve);
    restants.splice(restants.indexOf(trouve), 1);
  }

  const orphelins = officielle.filter((o) => !cible.has(o.numero));
  for (const officiel of orphelins) {
    const parNumero = restants.find((l) => l.shirtNumber === officiel.numero);
    const ligne = parNumero ?? restants[0];
    if (!ligne) throw new Error(`Plus de ligne disponible pour ${officiel.lastName}`);
    cible.set(officiel.numero, ligne);
    restants.splice(restants.indexOf(ligne), 1);
  }

  // ---- Corrections --------------------------------------------------------
  const capitaineConnu = officielle.some((o) => o.isCaptain);
  // Une équipe n'a qu'un capitaine. Si la base en porte deux et que la feuille
  // ne tranche pas, on retire les deux : une contradiction vaut moins qu'un
  // renseignement absent, et douze matchs vivent déjà sans brassard connu.
  const tropDeCapitaines = enBase.filter((l) => l.isCaptain).length > 1;
  let corrections = 0;
  const lignes: string[] = [];
  const divergences: string[] = [];
  const aEcrire: Array<{ id: string; data: Record<string, unknown> }> = [];

  for (const officiel of officielle) {
    const ligne = cible.get(officiel.numero)!;
    const nomBase = `${ligne.player?.firstName} ${ligne.player?.lastName}`;
    const nomOfficiel = `${officiel.firstName} ${officiel.lastName}`;

    const memeIdentite =
      ligne.player != null &&
      meilleurCandidat([ligne], () => nomBase, () => ligne.shirtNumber, nomOfficiel, officiel.numero) !=
        null;

    const changements: string[] = [];
    let playerId = ligne.player?.id;
    let remiseAZero = false;

    if (!memeIdentite) {
      if (!IDENTITES) {
        // Corriger les dossards voisins sans corriger celui-ci laisserait deux
        // lignes sur le même numéro : la feuille entière est mise de côté.
        divergences.push(
          `  n°${String(officiel.numero).padStart(2)} « ${nomBase} » en base pour « ${nomOfficiel} » sur la feuille`,
        );
        continue;
      }
      playerId = await trouverOuCreerJoueur(officiel);
      changements.push(`identité : « ${nomBase} » → « ${nomOfficiel} »`);
      // Minutes, réalisations et cartons de cette ligne décrivaient la
      // rencontre de quelqu'un d'autre : les garder les attribuerait au
      // nouveau venu. On les efface, quitte à laisser la ligne vide — le
      // script de feuille de la saison les rétablira depuis la LNR.
      remiseAZero = true;
      if (ligne.totalPoints > 0) {
        lignes.push(
          `    ⚠ n°${officiel.numero} portait ${ligne.totalPoints} point(s) au nom de ${nomBase} : ` +
            `effacés, à rétablir avec le script de feuille de la saison`,
        );
      }
    }
    if (ligne.shirtNumber !== officiel.numero) {
      changements.push(`n°${ligne.shirtNumber} → n°${officiel.numero}`);
    }
    if (ligne.isStarter !== officiel.isStarter) {
      changements.push(officiel.isStarter ? "remplaçant → titulaire" : "titulaire → remplaçant");
    }
    // La feuille fait foi dans les deux sens : un brassard que la base porte
    // à tort doit disparaître, sinon un match finit avec deux capitaines.
    // Encore faut-il qu'elle le dise : une composition sans aucun capitaine
    // n'apprend rien, et retirer le brassard sur cette foi-là l'effacerait
    // sans raison.
    if (capitaineConnu) {
      if (officiel.isCaptain && !ligne.isCaptain) changements.push("capitaine");
      if (!officiel.isCaptain && ligne.isCaptain) changements.push("capitaine retiré");
    } else if (tropDeCapitaines && ligne.isCaptain) {
      changements.push("capitaine retiré, la feuille n'en désigne aucun");
    }

    // Un titulaire peut porter un numéro de remplaçant : le poste ne se déduit
    // alors de rien, on garde celui déjà enregistré.
    const poste = officiel.isStarter
      ? (POSTE_PAR_NUMERO[officiel.numero] ?? ligne.positionPlayed)
      : ligne.positionPlayed;
    if (officiel.isStarter && ligne.positionPlayed !== poste) {
      changements.push(`poste → ${poste}`);
    }

    if (changements.length === 0) continue;
    corrections++;
    lignes.push(
      `  n°${String(officiel.numero).padStart(2)} ${nomOfficiel} — ${changements.join(", ")}`,
    );

    aEcrire.push({
      id: ligne.id,
      data: {
        playerId: playerId || undefined,
        shirtNumber: officiel.numero,
        isStarter: officiel.isStarter,
        // Faute de capitaine sur la feuille, on garde celui de la base — une
        // ligne réécrite pour un dossard ne doit pas perdre son brassard —,
        // sauf si la base s'en donne plusieurs.
        isCaptain: capitaineConnu
          ? (officiel.isCaptain ?? false)
          : tropDeCapitaines
            ? false
            : ligne.isCaptain,
        positionPlayed: poste,
        ...(remiseAZero
          ? {
              minutesPlayed: null,
              subIn: null,
              subOut: null,
              tries: 0,
              conversions: 0,
              penalties: 0,
              dropGoals: 0,
              totalPoints: 0,
              yellowCard: false,
              yellowCardMin: null,
              redCard: false,
              redCardMin: null,
              notes: null,
            }
          : {}),
      },
    });
  }

  // Rien n'est écrit avant d'avoir parcouru toute la feuille : une divergence
  // d'identité annule les corrections du match, pas seulement la sienne.
  if (divergences.length > 0) {
    console.log(`${entete} — ${divergences.length} identité(s) divergente(s), match laissé de côté`);
    for (const d of divergences) console.log(d);
    return { corrections: 0, identitesIgnorees: divergences.length };
  }

  if (!DRY_RUN) {
    for (const ecriture of aEcrire) {
      await prisma.matchPlayer.update({ where: { id: ecriture.id }, data: ecriture.data });
    }
  }

  if (lignes.length > 0) {
    console.log(`${entete} — ${source.source}`);
    for (const l of lignes) console.log(l);
  }
  return { corrections, identitesIgnorees: 0 };
}

async function corrigerMatch(match: MatchAvecContexte): Promise<Bilan | null> {
  const camps: Camp[] = AVEC_USAP ? ["adverse", "usap"] : ["adverse"];
  let bilan: Bilan | null = null;
  for (const camp of camps) {
    const partiel = await corrigerCamp(match, camp);
    if (!partiel) continue;
    bilan = {
      corrections: (bilan?.corrections ?? 0) + partiel.corrections,
      identitesIgnorees: (bilan?.identitesIgnorees ?? 0) + partiel.identitesIgnorees,
    };
  }
  return bilan;
}

async function main() {
  if (!DATE && !SAISON && !TOUT) {
    console.error(
      "Usage : npx tsx scripts/fix-opponent-lineup.ts (AAAA-MM-JJ | AAAA-AAAA | --tout) [--usap] [--identites] [--dry]",
    );
    process.exit(1);
  }

  console.log(
    `=== Compositions adverses remises en accord avec les feuilles officielles${DRY_RUN ? " (simulation)" : ""} ===` +
      `${IDENTITES ? "" : "\n(identités laissées de côté — ajouter --identites pour les traiter)"}\n`,
  );

  const matchs = await chargerMatchs();
  let traites = 0;
  let corrections = 0;
  let ignorees = 0;
  const echecs: string[] = [];

  for (const match of matchs) {
    try {
      const bilan = await corrigerMatch(match);
      if (!bilan) continue;
      traites++;
      corrections += bilan.corrections;
      ignorees += bilan.identitesIgnorees;
    } catch (erreur) {
      echecs.push(
        `${match.season.label} ${match.date.toISOString().slice(0, 10)} ` +
          `${match.opponent.shortName ?? match.opponent.name} : ${(erreur as Error).message}`,
      );
    }
  }

  console.log(
    `\n=== ${traites} match(s) examinés, ${corrections} ligne(s) ${DRY_RUN ? "à corriger" : "corrigée(s)"}` +
      `${ignorees > 0 ? `, ${ignorees} identité(s) laissée(s) de côté` : ""}, ${echecs.length} en échec ===`,
  );
  for (const e of echecs) console.log(`  ⚠ ${e}`);
  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

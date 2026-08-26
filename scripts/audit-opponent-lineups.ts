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
 *               Botia Veivuke ») ne compte pas : c'est une variante d'écriture
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
 *
 * Ne couvre que ce que la LNR publie : Top 14 et barrages d'accession. Les
 * coupes d'Europe relèvent de l'EPCR.
 */

import { PrismaClient } from "@prisma/client";
import { chercherFeuille, lireCompositions, type LnrTitulaire } from "./lib/lnr";
import { meilleurCandidat, motsOrphelins } from "./lib/noms";

const prisma = new PrismaClient();

const ARGS = process.argv.slice(2);
const SAISON_DEMANDEE = ARGS.find((a) => /^\d{4}-\d{4}$/.test(a));
const GRAVES_SEULEMENT = ARGS.includes("--graves");

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

async function auditerMatch(
  matchId: string,
  officielle: LnrTitulaire[],
): Promise<Anomalie[]> {
  const enBase = await prisma.matchPlayer.findMany({
    where: { matchId, isOpponent: true },
    select: {
      shirtNumber: true,
      isStarter: true,
      isCaptain: true,
      player: { select: { firstName: true, lastName: true } },
    },
  });

  const anomalies: Anomalie[] = [];

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
      anomalies.push({
        gravite: "ÉCRITURE",
        numero: officiel.numero,
        detail: `base « ${nom} » — feuille « ${officielNom} »`,
      });
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
    anomalies.push({
      gravite: "EN TROP",
      numero: ligne.shirtNumber ?? 0,
      detail: `${ligne.player?.firstName} ${ligne.player?.lastName} absent de la feuille officielle`,
    });
  }

  return anomalies.sort((a, b) => a.numero - b.numero);
}

async function main() {
  console.log(
    `=== Compositions adverses confrontées aux feuilles LNR${SAISON_DEMANDEE ? ` — ${SAISON_DEMANDEE}` : ""} ===\n`,
  );

  const matchs = await prisma.match.findMany({
    where: SAISON_DEMANDEE ? { season: { label: SAISON_DEMANDEE } } : {},
    orderBy: { date: "asc" },
    include: {
      season: { select: { label: true, startYear: true } },
      opponent: { select: { name: true, shortName: true } },
      competition: { select: { shortName: true } },
    },
  });

  let examines = 0;
  let sains = 0;
  const horsPerimetre: string[] = [];
  const illisibles: string[] = [];
  const parGravite = new Map<Gravite, number>();

  for (const match of matchs) {
    const jour = match.date.toISOString().slice(0, 10);
    const adversaire = match.opponent.shortName ?? match.opponent.name;
    const etiquette = `${match.season.label} ${jour} ${adversaire.padEnd(16)}`;

    const phase =
      match.matchday != null
        ? `j${match.matchday}`
        : match.competition.shortName === "Barrages"
          ? // Le segment a changé de nom : « access » avant 2024-2025
            match.season.startYear >= 2024
            ? "access-top-14"
            : "access"
          : null;
    if (!phase) {
      horsPerimetre.push(`${etiquette} (${match.competition.shortName})`);
      continue;
    }

    let officielle: LnrTitulaire[];
    try {
      const url = await chercherFeuille(match.season.label, phase);
      if (!url) {
        illisibles.push(`${etiquette} : feuille introuvable pour ${phase}`);
        continue;
      }
      officielle = (await lireCompositions(url)).adversaire;
    } catch (erreur) {
      illisibles.push(`${etiquette} : ${(erreur as Error).message}`);
      continue;
    }

    examines++;
    const anomalies = await auditerMatch(match.id, officielle);
    const retenues = GRAVES_SEULEMENT
      ? anomalies.filter((a) => GRAVES.includes(a.gravite))
      : anomalies;

    if (anomalies.length === 0) sains++;
    for (const a of anomalies) {
      parGravite.set(a.gravite, (parGravite.get(a.gravite) ?? 0) + 1);
    }
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
  if (illisibles.length > 0) {
    console.log(`\n${illisibles.length} feuille(s) non lue(s) :`);
    for (const i of illisibles) console.log(`  ⚠ ${i}`);
  }
  if (horsPerimetre.length > 0) {
    console.log(`\n${horsPerimetre.length} match(s) hors périmètre LNR (coupes d'Europe).`);
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

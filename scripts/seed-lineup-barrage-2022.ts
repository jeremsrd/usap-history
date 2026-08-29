/**
 * Composition du barrage d'accession du 12 juin 2022, Mont-de-Marsan - USAP.
 *
 * Le seul match de 2021-2022 dont la composition ne vient pas d'une source
 * officielle lue par machine. La LNR publie la feuille — faits et changements
 * — mais **pas les vingt-trois**, ni sur son site Top 14 ni sur celui de
 * Pro D2 : la page `/compositions` existe et ne contient aucun joueur. ESPN ne
 * couvre pas le match d'accession, et allrugby.com était injoignable.
 *
 * Les deux compositions ci-dessous ont donc été fournies à la main, puis
 * **recoupées avec la feuille officielle**, qui les corrobore largement :
 *   - 19 des 21 changements annoncés y figurent à l'identique, noms et
 *     minutes. La feuille en ajoute deux que la source omettait : le retour de
 *     Faleafa à la 59ᵉ et l'entrée de Rodor à la 70ᵉ ;
 *   - chaque sortant de la feuille est bien un titulaire ci-dessous, chaque
 *     entrant bien un remplaçant ;
 *   - la feuille tranche une ambiguïté de la source, qui hésitait entre
 *     « Lisena » et « Lafforgue » pour le 6 montois : c'est **Lafforgue** ;
 *   - les prénoms de Garrault, Wakaya et Mensa, absents de la source, viennent
 *     de l'archive Pro D2 de la LNR — la feuille Narbonne-Mont-de-Marsan de la
 *     J1 2021-2022, dont les compositions, elles, sont publiées.
 *
 * **CE QUI RESTE INCERTAIN : les numéros.** Ils ne viennent que de la source
 * fournie, les changements de la LNR ne les mentionnant pas. Celle-ci
 * signalait elle-même que la feuille d'AllRugby intervertit les 1 et 3
 * montois et les 12 et 13 catalans par rapport aux compositions publiées par
 * les clubs ; c'est la version des clubs qui est retenue ici. Un numéro faux
 * ne fausse que `positionPlayed`, jamais l'identité ni les minutes.
 *
 * Non corroborés par la feuille, faute d'être mêlés à un changement ou à un
 * fait de match : Oviedo (6) et Acébès (11) côté catalan, Garrault (7),
 * Mensa (12) et Wakaya (13) côté montois.
 *
 * Usage :
 *   npx tsx scripts/seed-lineup-barrage-2022.ts --dry
 *   npx tsx scripts/seed-lineup-barrage-2022.ts
 *
 * Idempotent : la composition est effacée avant d'être réécrite. Enchaîner
 * ensuite avec seed-opponent-sheet.ts (minutes et réalisations, depuis la
 * feuille officielle) puis seed-chronologie.ts (pour relier les événements
 * aux fiches).
 */

import { PrismaClient, type Position } from "@prisma/client";
import { POSTE_PAR_NUMERO, trouverOuCreerJoueur } from "./lib/joueurs";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry");
const JOUR = "2022-06-12";

/** « Prénom Nom », dans l'ordre des dossards, du 1 au 23. */
const MONT_DE_MARSAN = [
  "Jean-Luc Innocente",
  "Romain Latterrade",
  "Anthony Alvès",
  "Léandro Cedaro",
  "Andrey Ostrikov",
  "Aurélien Lafforgue",
  "Nicolas Garrault",
  "Michael Faleafa",
  "Léo Coly",
  "Willem Du Plessis",
  "Vereniki Goneva",
  "Lucas Mensa",
  "Nacani Wakaya",
  "Alexandre De Nardi",
  "Yoann Laousse Azpiazu",
  "Pablo Dimcheff",
  "Thomas Bultel",
  "Thibault Tauleigne",
  "Maxime Gouzou",
  "Christophe Loustalot",
  "Yann Brethous",
  "Simon Desaubies",
  "Lasha Macharashvili",
];

const USAP = [
  "Sacha Lotrian",
  "Seilala Lam",
  "Siosiua Halanukonuka",
  "Tristan Labouteley",
  "Piula Faasalele",
  "Joaquin Oviedo",
  "Alan Brazo",
  "Genesis Mamea Lemalu",
  "Tom Ecochard",
  "Tristan Tedder",
  "Mathieu Acébès",
  "Jeronimo De La Fuente",
  "Afusipa Taumoepeau",
  "Alivereti Duguivalu",
  "Melvyn Jaminet",
  "Mike Tadjer",
  "Xavier Chiocci",
  "Shahn Eru",
  "Lucas Bachelier",
  "Matteo Rodor",
  "George Tilsley",
  "Lucas Dubois",
  "Arthur Joly",
];

/** Le brassard, que la source donne à Acébès. */
const CAPITAINE_USAP = 11;

async function ecrire(matchId: string, noms: string[], isOpponent: boolean) {
  console.log(`\n  --- ${isOpponent ? "Mont-de-Marsan" : "USAP"} ---`);
  for (const [index, complet] of noms.entries()) {
    const numero = index + 1;
    const mots = complet.split(" ");
    // Le nom de famille est tout ce qui suit le premier mot : « De La Fuente »,
    // « Laousse Azpiazu », « Mamea Lemalu » restent d'un seul tenant.
    const officiel = {
      firstName: mots[0],
      lastName: mots.slice(1).join(" "),
      numero,
    };
    const playerId = await trouverOuCreerJoueur(prisma, officiel, { dryRun: DRY_RUN });

    const isStarter = numero <= 15;
    let poste: Position | null = isStarter ? (POSTE_PAR_NUMERO[numero] ?? null) : null;
    if (!isStarter && playerId) {
      const fiche = await prisma.player.findUnique({
        where: { id: playerId },
        select: { position: true },
      });
      poste = fiche?.position ?? null;
    }
    const isCaptain = !isOpponent && numero === CAPITAINE_USAP;
    console.log(
      `    n°${String(numero).padStart(2)} ${complet}${isCaptain ? " (cap)" : ""}` +
        `${poste ? ` [${poste}]` : ""}`,
    );
    if (DRY_RUN) continue;
    await prisma.matchPlayer.create({
      data: { matchId, playerId, isOpponent, shirtNumber: numero, isStarter, isCaptain, positionPlayed: poste },
    });
  }
}

async function main() {
  console.log(`=== Composition du barrage ${JOUR}${DRY_RUN ? " (simulation)" : ""} ===`);
  if (MONT_DE_MARSAN.length !== 23 || USAP.length !== 23) {
    throw new Error("Chaque composition doit compter vingt-trois joueurs.");
  }

  const match = await prisma.match.findFirstOrThrow({
    where: { date: { gte: new Date(`${JOUR}T00:00:00Z`), lt: new Date(`${JOUR}T23:59:59Z`) } },
    include: { opponent: true, players: { select: { id: true } } },
  });
  console.log(`${match.opponent.name} ${match.scoreOpponent}-${match.scoreUsap} USAP`);

  if (match.players.length > 0 && !DRY_RUN) {
    await prisma.matchEvent.deleteMany({ where: { matchId: match.id } });
    await prisma.matchPlayer.deleteMany({ where: { matchId: match.id } });
    console.log(`${match.players.length} ligne(s) effacée(s) avant réécriture.`);
  }

  await ecrire(match.id, USAP, false);
  await ecrire(match.id, MONT_DE_MARSAN, true);

  console.log(`\n=== 46 lignes ${DRY_RUN ? "à écrire" : "écrites"} ===`);
  if (DRY_RUN) console.log("Simulation — relancer sans --dry pour appliquer.");
  else {
    console.log("Enchaîner avec :");
    console.log(`  npx tsx scripts/seed-opponent-sheet.ts 2021-2022 --match=${JOUR} --usap`);
    console.log(`  npx tsx scripts/seed-chronologie.ts ${JOUR}`);
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

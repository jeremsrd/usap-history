/**
 * Change le joueur porté par un dossard sur une feuille de match.
 *
 * Troisième scalpel des arbitrages d'identité, avec `merge-players.ts` qui
 * fusionne deux fiches et `rename-player.ts` qui en corrige l'orthographe.
 * Celui-ci sert au cas contraire : la base a mis **quelqu'un d'autre** sur ce
 * dossard, et les deux se ressemblent trop pour que quoi que ce soit s'en
 * aperçoive. Grenoble alignait Barnabé Couilloud au barrage 2024-2025 ; la
 * base y avait rattaché son frère Baptiste, demi de mêlée de Lyon, dont la
 * fiche portait déjà cinq autres matchs.
 *
 * `fix-opponent-lineup.ts --identites` ne voit pas ces cas-là, et c'est
 * voulu : il tient deux noms pour la même personne dès qu'un nom de famille
 * concorde, faute de quoi il prendrait tous les diminutifs des feuilles
 * officielles pour des erreurs. Il faut donc désigner la ligne à la main.
 *
 * La fiche visée est cherchée sur le nom **normalisé** et créée si elle
 * manque. Les réalisations et le temps de jeu de la ligne ne sont **pas**
 * touchés : ils décrivent ce qui s'est passé sur le terrain, à ce dossard, et
 * restent valables une fois le bon nom posé dessus. Si l'ancien occupant les
 * avait faussés, relancer le script de feuille de la saison.
 *
 * Usage :
 *   npx tsx scripts/reassign-match-player.ts --match=2025-06-14 --numero=9 \
 *     --nom="Barnabé|Couilloud" --adverse --dry
 *
 * `--adverse` désigne la composition adverse ; sans lui, c'est celle de l'USAP.
 *
 * Idempotent : une ligne déjà au bon nom n'est pas réécrite.
 */

import { PrismaClient } from "@prisma/client";
import { normalize } from "./lib/noms";
import { generatePlayerSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry");
const ADVERSE = ARGS.includes("--adverse");
const JOUR = ARGS.find((a) => a.startsWith("--match="))?.slice("--match=".length);
const NUMERO = Number(ARGS.find((a) => a.startsWith("--numero="))?.slice("--numero=".length));
const NOM = ARGS.find((a) => a.startsWith("--nom="))?.slice("--nom=".length);
const nom = NOM?.split("|").map((x) => x.trim());

if (!JOUR || !NUMERO || !nom || nom.length !== 2 || !nom[0] || !nom[1]) {
  console.error(
    "Date, dossard et nom sont attendus.\n" +
      '  npx tsx scripts/reassign-match-player.ts --match=AAAA-MM-JJ --numero=9 --nom="Prénom|Nom" [--adverse] [--dry]',
  );
  process.exit(1);
}

async function trouverOuCreer(firstName: string, lastName: string): Promise<string> {
  const cible = normalize(`${firstName} ${lastName}`);
  const tous = await prisma.player.findMany({ select: { id: true, firstName: true, lastName: true } });
  const exactes = tous.filter((p) => normalize(`${p.firstName} ${p.lastName}`) === cible);
  if (exactes.length === 1) {
    console.log(`  fiche existante : ${firstName} ${lastName} (${exactes[0].id})`);
    return exactes[0].id;
  }
  if (exactes.length > 1) {
    throw new Error(`${firstName} ${lastName} : ${exactes.length} fiches portent ce nom — à arbitrer`);
  }
  if (DRY_RUN) {
    console.log(`  fiche à créer : ${firstName} ${lastName}`);
    return "";
  }
  // isActive signifie « actuellement à l'USAP »
  const cree = await prisma.player.create({
    data: { firstName, lastName, isActive: false, slug: `temp-${normalize(lastName)}-${NUMERO}` },
  });
  await prisma.player.update({
    where: { id: cree.id },
    data: { slug: generatePlayerSlug(firstName, lastName, cree.id) },
  });
  console.log(`  fiche créée : ${firstName} ${lastName} (${cree.id})`);
  return cree.id;
}

async function main() {
  console.log(`=== Réattribution d'un dossard${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const match = await prisma.match.findFirstOrThrow({
    where: {
      date: { gte: new Date(`${JOUR}T00:00:00Z`), lt: new Date(`${JOUR}T23:59:59Z`) },
    },
    include: { opponent: { select: { name: true, shortName: true } } },
  });
  const camp = ADVERSE ? (match.opponent.shortName ?? match.opponent.name) : "USAP";

  const lignes = await prisma.matchPlayer.findMany({
    where: { matchId: match.id, isOpponent: ADVERSE, shirtNumber: NUMERO },
    select: { id: true, totalPoints: true, player: { select: { id: true, firstName: true, lastName: true } } },
  });
  if (lignes.length !== 1) {
    throw new Error(`${lignes.length} ligne(s) pour le n°${NUMERO} de ${camp} le ${JOUR}`);
  }
  const ligne = lignes[0];
  const [firstName, lastName] = nom!;
  console.log(
    `${JOUR} ${camp} n°${NUMERO} : « ${ligne.player?.firstName} ${ligne.player?.lastName} » → « ${firstName} ${lastName} »`,
  );
  if (ligne.player && normalize(`${ligne.player.firstName} ${ligne.player.lastName}`) === normalize(`${firstName} ${lastName}`)) {
    console.log("  déjà au bon nom, rien à faire.");
    return;
  }
  if (ligne.totalPoints > 0) {
    console.log(
      `  ⚠ cette ligne porte ${ligne.totalPoints} point(s) : ils restent attachés au dossard, ` +
        `vérifier qu'ils décrivent bien la rencontre du nouveau venu`,
    );
  }

  const playerId = await trouverOuCreer(firstName, lastName);
  if (DRY_RUN) {
    console.log("\nSimulation — relancer sans --dry pour appliquer.");
    return;
  }
  await prisma.matchPlayer.update({ where: { id: ligne.id }, data: { playerId } });
  console.log("  réattribué.");

  // Ce que la chronologie du **même match** attribuait à l'ancien occupant
  // revient au nouveau : c'est le dossard qui a agi, pas la fiche. Sans cela
  // l'ancienne fiche reste rattachée au match qu'elle vient de quitter, et
  // `delete-orphan-players.ts` la garde au motif qu'elle porte un événement —
  // « Guillhem Marchand », sorti à la 45ᵉ pour Lyon le 21 mars 2026, a tenu
  // ainsi après que son dossard fut rendu à Guillaume Marchand.
  const ancien = ligne.player?.id;
  if (ancien && ancien !== playerId) {
    const auteur = await prisma.matchEvent.updateMany({
      where: { matchId: match.id, playerId: ancien },
      data: { playerId },
    });
    const associe = await prisma.matchEvent.updateMany({
      where: { matchId: match.id, relatedPlayerId: ancien },
      data: { relatedPlayerId: playerId },
    });
    const total = auteur.count + associe.count;
    if (total > 0) console.log(`  ${total} événement(s) de chronologie repointé(s).`);
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

/**
 * Deux arbitres faux sur la poule de Challenge européen 2022-2023.
 *
 * Signalé par Jérémy le 9 septembre 2026 : Christophe Berdos, arbitre du
 * Perpignan-Bristol du 9 décembre 2022 en base, a sifflé son dernier match
 * professionnel le 16 mai 2015 — Stade Français-Montpellier, 25ᵉ journée du
 * Top 14 2014-2015, atteint par la limite d'âge de 45 ans (Wikipédia,
 * « Christophe Berdos »). Ses vingt autres rencontres en base vont de 2004 à
 * 2014 ; celle de 2022 est la seule d'après sa retraite, et un balayage des
 * fiches d'arbitre ne trouve aucun autre écart de sept ans ou plus entre
 * deux rencontres.
 *
 * La même poule porte une seconde erreur, du même ordre : Evan Urruzmendi,
 * arbitre français, sur le Perpignan-Glasgow du 14 janvier 2023 — l'EPCR ne
 * désigne pas un arbitre français sur un club français.
 *
 * **Ce que deux sources indépendantes établissent**, l'une et l'autre lues
 * le 9 septembre 2026 :
 *
 *   09/12/2022  USAP 5-19 Bristol Bears     : Chris Busby (Irlande)
 *               ARs Dan Carson et Robbie Jenkinson, TMO Olly Hodges
 *   14/01/2023  USAP 26-40 Glasgow Warriors : Craig Evans (pays de Galles)
 *               ARs Ben Breakspear et Gwyn Morris, TMO Ian Davies
 *
 * — Wikipédia, « 2022–23 EPCR Challenge Cup pool stage », qui donne aussi les
 *   6 245 spectateurs déjà en base sur la J1 et redonne les deux arbitres
 *   des deux autres journées tels que la base les porte, Anthony Woodthorpe
 *   le 16 décembre et Sam Grove-White le 20 janvier ;
 * — rugbyreferee.net, les désignations de la semaine — « Rugby referee
 *   appointments round up: 9-12 December » du 8 décembre 2022, et « Weekly
 *   appointments round up » du 12 janvier 2023.
 *
 * Aucune des deux n'est l'organisateur : le site de l'EPCR ne remonte pas à
 * 2022-2023, et allrugby.com, source des compositions de cette poule, ne
 * donne pas les arbitres (cf. `seed-challenge-2022-2023.ts`). Le degré est
 * donc CONCORDANT, et l'attestation est posée sur `Match.refereeId`.
 *
 * D'où venaient les deux noms faux : d'aucun script du dépôt — aucun ne les
 * pose —, donc d'une saisie à la main dans l'admin, avant que la chaîne
 * n'atteste ce qu'elle écrit.
 *
 * Usage :
 *   npx tsx scripts/fix-arbitres-challenge-2022-2023.ts --dry
 *   npx tsx scripts/fix-arbitres-challenge-2022-2023.ts
 *
 * Idempotent : un arbitre déjà juste n'est pas réécrit, l'attestation est
 * remplacée à chaque passage.
 */

import { PrismaClient } from "@prisma/client";
import { trouverOuCreerArbitre } from "./lib/arbitres";
import { attester } from "./lib/attestations";
import { normalize } from "./lib/noms";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

const CORRECTIONS = [
  {
    date: "2022-12-09",
    arbitre: "Chris Busby",
    enBase: "Christophe Berdos",
    sourceUrl:
      "https://rugbyreferee.net/2022/12/08/rugby-referee-appointments-round-up-9-12-december/",
    note:
      "Christophe Berdos, en base jusqu'ici, a arbitré son dernier match professionnel le 16 mai 2015 " +
      "(Wikipédia). Désignation EPCR : Chris Busby (Irl), ARs Dan Carson et Robbie Jenkinson, TMO Olly Hodges. " +
      "Signalé par Jérémy le 9 septembre 2026 ; cf. fix-arbitres-challenge-2022-2023.ts.",
  },
  {
    date: "2023-01-14",
    arbitre: "Craig Evans",
    enBase: "Evan Urruzmendi",
    sourceUrl:
      "https://rugbyreferee.net/2023/01/12/weekly-appointments-round-up-epcr-and-domestic-leagues-in-england-france-hong-kong-wales/",
    note:
      "Evan Urruzmendi, en base jusqu'ici, est un arbitre français, que l'EPCR ne désigne pas sur un club français. " +
      "Désignation EPCR : Craig Evans (Gal), ARs Ben Breakspear et Gwyn Morris, TMO Ian Davies. " +
      "Cf. fix-arbitres-challenge-2022-2023.ts.",
  },
] as const;

const SOURCE =
  "Wikipédia, « 2022–23 EPCR Challenge Cup pool stage », et rugbyreferee.net, désignations de la semaine";

async function main() {
  let corriges = 0;
  for (const c of CORRECTIONS) {
    const debut = new Date(`${c.date}T00:00:00Z`);
    const fin = new Date(debut.getTime() + 24 * 3600 * 1000);
    const matchs = await prisma.match.findMany({
      where: { date: { gte: debut, lt: fin } },
      include: {
        opponent: { select: { name: true } },
        referee: { select: { firstName: true, lastName: true } },
      },
    });
    if (matchs.length !== 1) {
      throw new Error(`${matchs.length} rencontre(s) le ${c.date} — il en faut exactement une.`);
    }
    const match = matchs[0];
    const affiche = match.isHome
      ? `USAP – ${match.opponent.name}`
      : `${match.opponent.name} – USAP`;
    const actuel = match.referee ? `${match.referee.firstName} ${match.referee.lastName}` : "aucun";

    // Le script ne remplace que l'arbitre qu'il dit remplacer : si la base
    // porte un troisième nom, c'est qu'on ne sait plus ce qu'on corrige.
    const dejaJuste = normalize(actuel) === normalize(c.arbitre);
    if (!dejaJuste && normalize(actuel) !== normalize(c.enBase)) {
      throw new Error(
        `${c.date} ${affiche} : arbitre « ${actuel} » en base, ni « ${c.enBase} » ni « ${c.arbitre} » — à relire avant d'écrire.`,
      );
    }

    if (dejaJuste) {
      console.log(`  ${c.date} ${affiche} : ${c.arbitre} déjà en base`);
    } else {
      const refereeId = await trouverOuCreerArbitre(prisma, c.arbitre, DRY);
      if (DRY) {
        console.log(
          `  [dry] ${c.date} ${affiche} : ${actuel} → ${c.arbitre}` +
            (refereeId ? ` (fiche existante ${refereeId})` : " (fiche à créer)"),
        );
      } else {
        if (!refereeId) throw new Error(`Aucune fiche obtenue pour « ${c.arbitre} »`);
        await prisma.match.update({ where: { id: match.id }, data: { refereeId } });
        console.log(`  ✔ ${c.date} ${affiche} : ${actuel} → ${c.arbitre} (${refereeId})`);
      }
      corriges++;
    }

    await attester(
      prisma,
      {
        entite: "Match",
        entiteId: match.id,
        champ: "refereeId",
        degre: "CONCORDANT",
        source: SOURCE,
        sourceUrl: c.sourceUrl,
        note: c.note,
      },
      DRY,
    );
  }
  console.log(`${DRY ? "[dry] " : ""}${corriges} arbitre(s) corrigé(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

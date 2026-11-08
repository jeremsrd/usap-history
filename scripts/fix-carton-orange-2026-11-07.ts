/**
 * Pau-Perpignan du 7 novembre 2026 (J9, 63-26) : l'attestation des cartons de
 * Mattéo Le Corvec et du retour de Lucas Velarte.
 *
 * Les valeurs elles-mêmes vivent dans `TEMPS_DE_JEU_CORRIGES` de
 * `seed-opponent-sheet.ts`, qui réécrit les lignes à chaque passage : c'est là
 * qu'est la démonstration. Ce script ne pose que la provenance, sur les deux
 * lignes de composition, puisque la LNR n'inscrit ni le jaune de la 25ᵉ, ni
 * le carton orange de la 51ᵉ, ni l'entrée de Velarte à la 72ᵉ.
 *
 * Il refuse si la base ne porte pas encore la correction : lancer d'abord
 * `seed-opponent-sheet.ts 2026-2027 --match=2026-11-07 --usap`.
 *
 * Usage : npx tsx scripts/fix-carton-orange-2026-11-07.ts [--dry]
 */

import { PrismaClient } from "@prisma/client";
import { attester } from "./lib/attestations";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry");
const SLUG = "top-14-pau-vs-usap-j9-07-11-2026";
const SOURCE = "L'Indépendant du 8 novembre 2026, page Sports, et allrugby.com, contre la feuille LNR";
const URL = "https://www.allrugby.com/saison-2026-2027/matchs/pau-perpignan-26067.html";

async function main() {
  console.log(`=== Cartons de Le Corvec, ${SLUG}${DRY_RUN ? " (simulation)" : ""} ===\n`);
  const match = await prisma.match.findUniqueOrThrow({ where: { slug: SLUG }, select: { id: true } });
  const lignes = await prisma.matchPlayer.findMany({
    where: { matchId: match.id, isOpponent: false, shirtNumber: { in: [6, 8] } },
    select: { id: true, shirtNumber: true, minutesPlayed: true, subIn: true, yellowCardMin: true, orangeCardMin: true, player: { select: { lastName: true } } },
  });
  const leCorvec = lignes.find((l) => l.shirtNumber === 6);
  const velarte = lignes.find((l) => l.shirtNumber === 8);
  if (leCorvec?.player?.lastName !== "Le Corvec" || velarte?.player?.lastName !== "Velarte") {
    throw new Error("les n°6 et n°8 ne sont pas Le Corvec et Velarte");
  }
  if (leCorvec.minutesPlayed !== 41 || leCorvec.yellowCardMin !== 25 || leCorvec.orangeCardMin !== 51 || velarte.minutesPlayed !== 70 || velarte.subIn !== 72) {
    throw new Error("la correction n'est pas en base : passer d'abord seed-opponent-sheet --usap sur ce match");
  }

  await attester(
    prisma,
    {
      entite: "MatchPlayer",
      entiteId: leCorvec.id,
      champ: "cartons",
      degre: "CONCORDANT",
      source: SOURCE,
      sourceUrl: URL,
      note:
        "La LNR n'inscrit ni le jaune ni le carton orange et donne 80 minutes. Le journal : jaune 25ᵉ, orange 51ᵉ, remplacé par Velarte à la 72ᵉ ; " +
        "allrugby : jaune 24ᵉ, rouge 50ᵉ, même remplacement. Minutes du journal, qui suit l'horloge de la LNR. 41 minutes.",
      decidePar: "Jérémy, le 8 novembre 2026",
    },
    DRY_RUN,
  );
  await attester(
    prisma,
    {
      entite: "MatchPlayer",
      entiteId: velarte.id,
      champ: "subIn",
      degre: "CONCORDANT",
      source: SOURCE,
      sourceUrl: URL,
      note: "Sorti à la 62ᵉ pour Tanguy, revenu à la 72ᵉ à la place de Le Corvec, expulsé à la 51ᵉ. 70 minutes.",
      decidePar: "Jérémy, le 8 novembre 2026",
    },
    DRY_RUN,
  );
  console.log(DRY_RUN ? "\nSimulation — relancer sans --dry pour appliquer." : "\n✔ deux lignes attestées.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

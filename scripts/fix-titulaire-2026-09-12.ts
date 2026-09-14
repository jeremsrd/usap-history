/**
 * Le n°1 catalan du Perpignan-Castres du 12 septembre 2026 (J2, 43-29) :
 * **Enzo Forletta**, non Bruce Devaux.
 *
 * **Ce que dit la LNR, et pourquoi elle se contredit.** Sa page de
 * composition met Bruce Devaux au n°1 et Lorencio Boyer Gallardo au 17, sans
 * Forletta parmi les vingt-trois ; sa page de faits enregistre pourtant à la
 * 72ᵉ « entre Enzo FORLETTA, sort Bruce DEVAUX » — un entrant qui n'est sur
 * aucune de ses listes. C'est la contradiction du 22 février 2026 à Pau,
 * dans l'autre sens : là un entrant absent des vingt-trois, ici le même
 * défaut, et la feuille ment sur les noms.
 *
 * **Ce que disent deux sources indépendantes, et elles concordent.**
 *   - *L'Indépendant* du 13 septembre 2026, page Sports, dans sa
 *     composition : « Ceccarelli (Amituanai, 64), Montgaillard (Malolo, 48),
 *     **Forletta (Boyer-Gallardo, 72)** » — la première ligne, 3-2-1 ;
 *   - allrugby.com, fiche `saison-2026-2027/matchs/perpignan-castres-26017` :
 *     « Enzo FORLETTA 1 », « Lorencio BOYER GALLARDO 17 », et parmi les
 *     remplacements « FORLETTA remplacé par BOYER GALLARDO, 71' ».
 *
 * Le journal et allrugby s'accordent sur les vingt-deux autres dossards
 * catalans avec la LNR, ce qui prouve qu'ils décrivent la même feuille ; ils
 * ne divergent d'elle que sur ce n°1, et **dans le même sens**. La page de
 * composition de la LNR a gardé l'équipe annoncée — Devaux, remplacé par
 * Forletta avant le coup d'envoi —, et son changement de la 72ᵉ a glissé
 * d'un cran, comme à Pau : le sortant est Forletta, l'entrant Boyer Gallardo,
 * que `CHANGEMENTS_CORRIGES` de `seed-opponent-sheet.ts` rétablit.
 *
 * Ce script rend le dossard à Forletta et **atteste la ligne**, `CONCORDANT`,
 * deux sources secondaires recoupées contre la source officielle. Devaux
 * n'a pas joué : sa ligne disparaît avec la réattribution, puisque c'est la
 * même ligne qui change d'homme. Idempotent ; `--dry`.
 *
 * `fix-opponent-lineup.ts --usap --identites` rendrait ce dossard à Devaux :
 * cette rencontre rejoint celle du 22 février 2026 parmi celles qu'il ne
 * faut pas lui passer.
 */

import { PrismaClient } from "@prisma/client";
import { normalize } from "./lib/noms";
import { attester } from "./lib/attestations";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry");
const JOUR = "2026-09-12";

async function main() {
  console.log(`=== Le n°1 catalan du ${JOUR}${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const match = await prisma.match.findFirstOrThrow({
    where: { date: { gte: new Date(`${JOUR}T00:00:00Z`), lt: new Date(`${JOUR}T23:59:59Z`) } },
    select: { id: true, scoreUsap: true, scoreOpponent: true, opponent: { select: { name: true } } },
  });
  if (!/castres/i.test(match.opponent.name) || match.scoreUsap !== 43 || match.scoreOpponent !== 29) {
    throw new Error(`ce n'est pas le Perpignan-Castres 43-29 attendu : ${match.opponent.name} ${match.scoreUsap}-${match.scoreOpponent}`);
  }

  const ligne = await prisma.matchPlayer.findFirstOrThrow({
    where: { matchId: match.id, isOpponent: false, shirtNumber: 1 },
    select: { id: true, player: { select: { id: true, firstName: true, lastName: true } } },
  });
  const tous = await prisma.player.findMany({ select: { id: true, firstName: true, lastName: true } });
  const forletta = tous.filter((p) => normalize(`${p.firstName} ${p.lastName}`) === normalize("Enzo Forletta"));
  if (forletta.length !== 1) throw new Error(`${forletta.length} fiche(s) « Enzo Forletta »`);

  const actuel = ligne.player ? `${ligne.player.firstName} ${ligne.player.lastName}` : "personne";
  if (ligne.player?.id === forletta[0].id) {
    console.log("n°1 : Enzo Forletta, déjà en place.");
  } else {
    console.log(`n°1 : « ${actuel} » → « Enzo Forletta »`);
    if (!DRY_RUN) await prisma.matchPlayer.update({ where: { id: ligne.id }, data: { playerId: forletta[0].id } });
  }

  await attester(
    prisma,
    {
      entite: "MatchPlayer",
      entiteId: ligne.id,
      champ: "playerId",
      degre: "CONCORDANT",
      source: "L'Indépendant du 13 septembre 2026 et allrugby.com, contre la feuille LNR",
      sourceUrl: "https://www.allrugby.com/saison-2026-2027/matchs/perpignan-castres-26017.html",
      note:
        "La LNR met Bruce Devaux au n°1 et fait entrer Forletta à la 72ᵉ, absent de ses vingt-trois — elle se contredit. " +
        "Le journal et allrugby donnent Forletta titulaire, remplacé par Boyer Gallardo à la 72ᵉ, et concordent avec la LNR sur les vingt-deux autres dossards.",
      decidePar: "Claude, sur les deux sources",
    },
    DRY_RUN,
  );
  console.log(DRY_RUN ? "\nSimulation — relancer sans --dry pour appliquer." : "\n✔ n°1 rendu à Forletta, attesté.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

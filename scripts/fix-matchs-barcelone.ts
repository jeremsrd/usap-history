/**
 * Les deux réceptions délocalisées à Barcelone que la base plaçait à Perpignan.
 *
 * **Signalé par Jérémy le 9 septembre 2026.** L'USAP a reçu trois fois au
 * stade olympique de Montjuïc, l'Estadi Olímpic Lluís Companys de Barcelone.
 * Une seule était en base : le quart de finale de Heineken Cup du 9 avril
 * 2011 contre Toulon, posé dans `TERRAINS_PARTICULIERS` avec sa source. Les
 * deux autres sont des rencontres de championnat, et elles étaient à
 * Aimé-Giral :
 *
 *   15/09/2012  J5  Perpignan 34-20 Stade Toulousain  (~23 000 spectateurs)
 *   19/04/2014  J25 Perpignan 31-46 RC Toulon         (~24 000 spectateurs)
 *
 * **Rien ne pouvait le signaler.** Ni la LNR ni l'EPCR ne donnent le lieu
 * d'une rencontre : le stade se déduit du camp — Aimé-Giral à domicile,
 * `Opponent.venueId` à l'extérieur —, et une réception délocalisée reste une
 * réception. C'est le même angle mort que la finale de Pro D2 2018, sur
 * laquelle la feuille de la LNR désignait un recevant sans nommer Ernest-Wallon.
 *
 * **Trois sources concordantes**, lues le 9 septembre 2026, dont deux nomment
 * les trois délocalisations ensemble et redonnent les scores déjà en base :
 *
 *   — Wikipédia, « Stade olympique Lluís-Companys », qui liste les trois
 *     rencontres avec leur date, leur adversaire et leur compétition ;
 *   — RugbyPass, « Les raisons qui poussent l'USAP à jouer à Barcelone »,
 *     qui donne les trois précédents avec leurs scores — 29-25, 34-20,
 *     31-46, ceux de la base au point près — et leurs affluences ;
 *   — France 3 Occitanie du 19 avril 2014, qui annonce « la troisième
 *     délocalisation » de l'histoire du club : la phrase borne la liste
 *     autant qu'elle confirme la rencontre du jour. ESPN nomme Montjuïc sur
 *     celle de 2014 également.
 *
 * Aucune n'est officielle, et c'est leur concordance qui les vaut — le degré
 * posé est donc CONCORDANT, sur `Match.venueId`.
 *
 * **L'AFFLUENCE N'EST PAS ÉCRITE, DÉLIBÉRÉMENT.** RugbyPass donne « environ
 * 23 000 » et « environ 24 000 » ; le champ `attendance` porte ailleurs des
 * chiffres de feuille ou de presse à l'unité — 12 065 spectateurs à
 * Jean-Bouin. Écrire un ordre de grandeur dans une colonne de comptes exacts
 * lui prêterait une précision qu'il n'a pas, et la page des records le
 * comparerait à des chiffres qui ne se mesurent pas de la même façon. Les
 * deux valeurs vivent dans la note de l'attestation, où l'approximation se
 * lit. À reprendre le jour où une source les donne à l'unité.
 *
 * **Le stade se pose dans `TERRAINS_PARTICULIERS`, pas sur le match.** Les
 * scripts de saison recalculent le lieu de chaque rencontre à chaque relance,
 * par `terrainDuMatch()` : un stade écrit ici sans la table serait effacé au
 * passage suivant de `seed-season-2012-2013.ts` ou de `seed-season-2013-2014.ts`.
 * Ce script ne fait donc qu'appliquer ce que la table dit désormais.
 *
 * `isNeutralVenue` reste à `false`, comme sur le quart de 2011 : une réception
 * délocalisée n'est pas un terrain neutre, l'USAP y est bien recevante.
 *
 * Usage :
 *   npx tsx scripts/fix-matchs-barcelone.ts --dry
 *   npx tsx scripts/fix-matchs-barcelone.ts
 *
 * Idempotent : un stade déjà juste n'est pas réécrit, l'attestation est
 * remplacée à chaque passage.
 */

import { PrismaClient } from "@prisma/client";
import { attester } from "./lib/attestations";
import { terrainDuMatch, TERRAIN_USAP } from "./lib/stades";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

const MONTJUIC = "Estadi Olímpic Lluís Companys";

const DELOCALISATIONS = [
  {
    jour: "2012-09-15",
    affiche: "Perpignan 34-20 Stade Toulousain",
    affluence: "environ 23 000 spectateurs",
  },
  {
    jour: "2014-04-19",
    affiche: "Perpignan 31-46 RC Toulon",
    affluence: "environ 24 000 spectateurs",
  },
] as const;

const SOURCE =
  "Wikipédia, « Stade olympique Lluís-Companys » ; RugbyPass, « Les raisons qui poussent " +
  "l'USAP à jouer à Barcelone » ; France 3 Occitanie du 19 avril 2014";

async function main() {
  let corriges = 0;

  for (const d of DELOCALISATIONS) {
    const debut = new Date(`${d.jour}T00:00:00Z`);
    const fin = new Date(debut.getTime() + 24 * 3600 * 1000);
    const matchs = await prisma.match.findMany({
      where: { date: { gte: debut, lt: fin } },
      include: {
        season: { select: { startYear: true } },
        venue: { select: { name: true } },
      },
    });
    if (matchs.length !== 1) {
      throw new Error(`${matchs.length} rencontre(s) le ${d.jour} — il en faut exactement une.`);
    }
    const match = matchs[0];
    const actuel = match.venue?.name ?? "aucun";

    // Le lieu vient de `terrainDuMatch`, seul endroit où la règle est écrite :
    // le script n'invente pas un identifiant de stade, il applique la table.
    const venueId = await terrainDuMatch(prisma, {
      opponentId: match.opponentId,
      isHome: match.isHome,
      startYear: match.season.startYear,
      jour: d.jour,
    });
    if (!venueId) throw new Error(`${d.jour} : aucun stade obtenu — « ${MONTJUIC} » est-il en base ?`);
    const stade = await prisma.venue.findUniqueOrThrow({
      where: { id: venueId },
      select: { name: true, city: true },
    });
    if (stade.name !== MONTJUIC) {
      throw new Error(
        `${d.jour} : terrainDuMatch rend « ${stade.name} » et non « ${MONTJUIC} » — ` +
          "la date est-elle bien inscrite dans TERRAINS_PARTICULIERS ?",
      );
    }

    // Le script ne remplace que ce qu'il dit remplacer : si la base porte un
    // troisième stade, c'est qu'on ne sait plus ce qu'on corrige.
    if (actuel !== MONTJUIC && actuel !== TERRAIN_USAP) {
      throw new Error(
        `${d.jour} ${d.affiche} : stade « ${actuel} » en base, ni « ${TERRAIN_USAP} » ni ` +
          `« ${MONTJUIC} » — à relire avant d'écrire.`,
      );
    }

    if (actuel === MONTJUIC) {
      console.log(`  ${d.jour} ${d.affiche} : ${MONTJUIC} déjà en base`);
    } else if (DRY) {
      console.log(`  [dry] ${d.jour} ${d.affiche} : ${actuel} → ${stade.name}, ${stade.city}`);
      corriges++;
    } else {
      await prisma.match.update({ where: { id: match.id }, data: { venueId } });
      console.log(`  ✔ ${d.jour} ${d.affiche} : ${actuel} → ${stade.name}, ${stade.city}`);
      corriges++;
    }

    await attester(
      prisma,
      {
        entite: "Match",
        entiteId: match.id,
        champ: "venueId",
        degre: "CONCORDANT",
        source: SOURCE,
        sourceUrl: "https://fr.wikipedia.org/wiki/Stade_olympique_Llu%C3%ADs-Companys",
        note:
          `Réception délocalisée au stade olympique de Montjuïc, à Barcelone, devant ${d.affluence} ` +
          "— l'affluence n'est pas écrite en base, la source ne la donnant qu'en ordre de grandeur. " +
          "Ni la LNR ni l'EPCR ne publient le lieu d'une rencontre : la déduction habituelle plaçait " +
          "celle-ci à Aimé-Giral. Troisième et dernière des trois délocalisations catalanes à Barcelone, " +
          "avec le quart de finale de Heineken Cup du 9 avril 2011. " +
          "Signalé par Jérémy le 9 septembre 2026 ; cf. fix-matchs-barcelone.ts.",
      },
      DRY,
    );
  }

  console.log(`${DRY ? "[dry] " : ""}${corriges} rencontre(s) corrigée(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

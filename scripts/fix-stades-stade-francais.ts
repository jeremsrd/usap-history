/**
 * Les déplacements chez le Stade français d'avant la reconstruction de
 * Jean-Bouin : à Jean-Bouin, ou au Stade de France pour trois affiches, et
 * non à Charléty, son terrain de 2010-2011 à 2012-2013 seulement.
 *
 * | Match | En base avant | En réalité |
 * |---|---|---|
 * | 4 mars 2005 | Charléty | Jean-Bouin |
 * | 11 mars 2006 | Charléty | Jean-Bouin |
 * | 13 mai 2007 | Charléty | Stade de France (69 805 spectateurs) |
 * | 8 mars 2008 | Charléty | Jean-Bouin |
 * | 31 janvier 2009 | Charléty | Stade de France (79 122) |
 * | 24 octobre 2009 | Charléty | Stade de France (76 972) |
 *
 * Vus le 17 octobre 2026 en reprenant 2002-2003 : le calendrier de l'ancienne
 * LNR nomme « Jean Bouin » le 3 mai 2003, là où la base déduisait Charléty —
 * la ligne d'historique de Charléty n'avait pas de début. **La règle est dans
 * l'historique des stades** (`seed-stades-historiques.ts`, à lancer avant) et
 * dans `TERRAINS_PARTICULIERS` (`lib/stades.ts`) pour le Stade de France : ce
 * script ne fait qu'appliquer `terrainDuMatch` aux rencontres déjà en base,
 * que `fix-match-venues.ts` ne touche pas.
 *
 * **GARDE-FOU** : la liste des changements doit être exactement celle du
 * tableau. Toute autre différence arrête le script sans rien écrire.
 *
 * Wikipédia et le calendrier officiel de 2002-2003 pour Jean-Bouin,
 * stades-spectateurs.com pour le Stade de France, dont les trois scores
 * concordent avec la base : degré CONCORDANT sur `Match.venueId`.
 *
 * Usage :
 *   npx tsx scripts/fix-stades-stade-francais.ts --dry
 *   npx tsx scripts/fix-stades-stade-francais.ts
 *
 * Idempotent : un lieu déjà juste n'est pas réécrit ; l'attestation est
 * remplacée à chaque passage.
 */

import { PrismaClient } from "@prisma/client";
import { attester } from "./lib/attestations";
import { jourDeParis } from "./lib/dates";
import { terrainDuMatch } from "./lib/stades";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

/** Jour → stade attendu. Rien d'autre ne doit changer. */
const ATTENDUS: Record<string, string> = {
  "2005-03-04": "Stade Jean-Bouin",
  "2006-03-11": "Stade Jean-Bouin",
  "2007-05-13": "Stade de France",
  "2008-03-08": "Stade Jean-Bouin",
  "2009-01-31": "Stade de France",
  "2009-10-24": "Stade de France",
};

const SOURCE =
  "Wikipédia (Stade Jean-Bouin, reconstruit de 2010 à 2013), recoupée par le calendrier " +
  "2002-2003 de l'ancienne LNR (Wayback Machine) ; stades-spectateurs.com, records de " +
  "spectateurs du Stade de France, pour les trois affiches qui s'y sont jouées";

async function main() {
  console.log(`=== Stades du Stade français d'avant 2010${DRY ? " (simulation)" : ""} ===\n`);

  const matchs = await prisma.match.findMany({
    where: { isHome: false, opponent: { shortName: "Stade Français" } },
    select: {
      id: true,
      date: true,
      opponentId: true,
      isHome: true,
      season: { select: { startYear: true } },
      venue: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });

  const changements: Array<{ id: string; jour: string; avant: string; apres: string; venueId: string }> = [];
  for (const m of matchs) {
    const jour = jourDeParis(m.date);
    const venueId = await terrainDuMatch(prisma, {
      opponentId: m.opponentId,
      isHome: m.isHome,
      startYear: m.season.startYear,
      jour,
    });
    if (!venueId) continue;
    const stade = await prisma.venue.findUniqueOrThrow({ where: { id: venueId }, select: { name: true } });
    const avant = m.venue?.name ?? "aucun";
    if (avant !== stade.name) {
      changements.push({ id: m.id, jour, avant, apres: stade.name, venueId });
    }
  }

  const deja = Object.keys(ATTENDUS).filter((j) => !changements.some((c) => c.jour === j));
  const hors = changements.filter((c) => ATTENDUS[c.jour] !== c.apres);
  for (const c of changements) console.log(`  ${c.jour} : ${c.avant} → ${c.apres}`);
  if (deja.length) console.log(`  déjà justes : ${deja.join(", ")}`);
  if (hors.length > 0) {
    console.log(`\n⚠ ${hors.length} changement(s) hors du tableau vérifié — rien n'est écrit.`);
    process.exitCode = 1;
    return;
  }

  for (const c of changements) {
    if (!DRY) await prisma.match.update({ where: { id: c.id }, data: { venueId: c.venueId } });
  }
  // L'attestation se pose sur les six, changés ou déjà justes.
  const vises = matchs.filter((m) => jourDeParis(m.date) in ATTENDUS);
  for (const m of vises) {
    await attester(
      prisma,
      {
        entite: "Match",
        entiteId: m.id,
        champ: "venueId",
        degre: "CONCORDANT",
        source: SOURCE,
        note:
          `${ATTENDUS[jourDeParis(m.date)]} : Charléty n'a reçu le Stade français que de 2010 à 2013. ` +
          "Cf. fix-stades-stade-francais.ts.",
      },
      DRY,
    );
  }

  if (!DRY) {
    // Compter ce qui est en base, plutôt que se fier au code de sortie.
    const relus = await prisma.match.findMany({
      where: { id: { in: vises.map((m) => m.id) } },
      select: { date: true, venue: { select: { name: true } } },
    });
    const justes = relus.filter((m) => m.venue?.name === ATTENDUS[jourDeParis(m.date)]).length;
    console.log(`\n  relu en base : ${justes}/${Object.keys(ATTENDUS).length} au bon stade`);
  }
  console.log(
    `\n=== ${changements.length} changement(s)${DRY ? " — simulation, relancer sans --dry pour appliquer" : " appliqué(s)"} ===`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

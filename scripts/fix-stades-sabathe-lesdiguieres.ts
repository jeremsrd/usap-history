/**
 * Les déplacements à Grenoble et à Montpellier d'avant leurs stades
 * d'aujourd'hui : Lesdiguières et Sabathé, et non le Stade des Alpes et le
 * GGL Stadium, qui n'existaient pas encore.
 *
 * | Match | En base avant | En réalité |
 * |---|---|---|
 * | Grenoble, 26 novembre 2004 | Stade des Alpes (ouvert en 2008) | Lesdiguières |
 * | Montpellier, 9 avril 2005 | GGL Stadium (ouvert en 2007) | Sabathé |
 * | Montpellier, 12 novembre 2005 | GGL Stadium | Sabathé |
 * | Montpellier, 11 novembre 2006 | GGL Stadium | Sabathé |
 *
 * Vus le 17 octobre 2026 en reprenant 2003-2004, dont le calendrier archivé
 * de l'ancienne LNR nomme « Lesdiguières » et « Sabathé ». **La règle est
 * dans l'historique des stades** (`seed-stades-historiques.ts`, à lancer
 * avant) : ce script ne fait qu'appliquer `terrainDuMatch` aux rencontres
 * déjà en base, que `fix-match-venues.ts` ne touche pas — il ne complète que
 * les matchs sans lieu. Une relance d'un script de saison, qui passe par la
 * même règle, ne le défera pas.
 *
 * **GARDE-FOU** : la liste des changements doit être exactement celle du
 * tableau. Toute autre différence arrête le script sans rien écrire — elle
 * dirait que l'historique posé déborde de ce qui a été vérifié.
 *
 * Wikipédia recoupée par le calendrier officiel de 2003-2004 : degré
 * CONCORDANT sur `Match.venueId`.
 *
 * Usage :
 *   npx tsx scripts/fix-stades-sabathe-lesdiguieres.ts --dry
 *   npx tsx scripts/fix-stades-sabathe-lesdiguieres.ts
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
  "2004-11-26": "Stade Lesdiguières",
  "2005-04-09": "Stade Sabathé",
  "2005-11-12": "Stade Sabathé",
  "2006-11-11": "Stade Sabathé",
};

const SOURCE =
  "Wikipédia (Stade Lesdiguières, Stade des Alpes, Stade Sabathé, Septeo Stadium), " +
  "recoupée par le calendrier 2003-2004 de l'ancienne LNR (Wayback Machine)";

async function main() {
  console.log(`=== Stades d'avant 2007 à Grenoble et Montpellier${DRY ? " (simulation)" : ""} ===\n`);

  const matchs = await prisma.match.findMany({
    where: { isHome: false, opponent: { shortName: { in: ["Grenoble", "Montpellier"] } } },
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
  // L'attestation se pose sur les quatre, changés ou déjà justes.
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
          `${ATTENDUS[jourDeParis(m.date)]} : le stade d'aujourd'hui n'existait pas encore. ` +
          "Cf. fix-stades-sabathe-lesdiguieres.ts.",
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

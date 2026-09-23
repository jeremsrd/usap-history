/**
 * Purge le cache des pages du site en production, après une saisie.
 *
 * ------------------------------------------------------------------------
 * POURQUOI CE SCRIPT EXISTE
 *
 * Les fiches sont en cache **sept jours** — `HISTORIQUE` de `src/lib/cache.ts`
 * —, parce qu'une revalidation horaire sur les 2 948 pages du site épuisait
 * le quota Vercel en moins de trois jours. Le 23 septembre 2026, `ISR Writes`
 * était à 213 000 pour 200 000 et `Fluid Active CPU` à 4 h 22 pour 4 h.
 *
 * La contrepartie, c'est qu'une fiche saisie le lendemain d'un match
 * resterait périmée une semaine. **Ce script est donc le dernier temps de la
 * marche du « lendemain d'un match »**, et l'oublier est le seul moyen de se
 * tromper avec le nouveau réglage : le quota se voit tout de suite, une fiche
 * périmée ne se voit pas.
 *
 * ------------------------------------------------------------------------
 * CE QU'IL PURGE, ET POURQUOI PAS SEULEMENT LA FICHE DU MATCH
 *
 * Une rencontre saisie change bien plus que sa propre page : les compteurs
 * d'un joueur, les centurions, les réalisateurs, les records, le bilan de la
 * saison, la fiche de l'adversaire, celle du stade, celle de l'arbitre, et
 * l'accueil. `PAGES` les liste toutes, dans leur **forme de route** — avec
 * les segments dynamiques —, ce qui purge les deux langues d'un coup.
 *
 * Usage :
 *   npx tsx scripts/purger-cache.ts --dry
 *   npx tsx scripts/purger-cache.ts
 *   npx tsx scripts/purger-cache.ts --url=https://www.usaphistoria.cat
 *
 * `REVALIDATE_SECRET` est attendu dans `.env`, et doit valoir celui posé dans
 * les variables d'environnement Vercel. Il n'est pas dans le dépôt.
 */
import { config } from "dotenv";
import { HISTORIQUE } from "../src/lib/cache";

config();

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry");
const URL_SITE =
  ARGS.find((a) => a.startsWith("--url="))?.slice("--url=".length) ??
  "https://www.usaphistoria.cat";

/** Tout ce qu'une saisie de rencontre peut changer. */
const PAGES = [
  "/[locale]",
  "/[locale]/matchs",
  "/[locale]/matchs/[slug]",
  "/[locale]/saisons",
  "/[locale]/saisons/[label]",
  "/[locale]/joueurs",
  "/[locale]/joueurs/[slug]",
  "/[locale]/adversaires",
  "/[locale]/adversaires/[slug]",
  "/[locale]/stades",
  "/[locale]/stades/[slug]",
  "/[locale]/arbitres",
  "/[locale]/arbitres/[slug]",
  "/[locale]/entraineurs",
  "/[locale]/entraineurs/[slug]",
  "/[locale]/presidents",
  "/[locale]/presidents/[slug]",
  "/[locale]/centurions",
  "/[locale]/realisateurs",
  "/[locale]/records",
  "/[locale]/statistiques",
  "/[locale]/palmares",
];

async function main() {
  const jours = HISTORIQUE / 86400;
  console.log(
    `=== Purge du cache${DRY_RUN ? " (simulation)" : ""} — ${URL_SITE} ===\n` +
      `Les fiches sont en cache ${jours} jour(s) sans cette purge.\n`,
  );
  for (const page of PAGES) console.log(`  ${page}`);
  console.log(`\n${PAGES.length} route(s), les deux langues comprises.`);

  // La simulation ne contacte personne : elle n'a donc pas besoin du secret,
  // et doit pouvoir servir avant qu'il ne soit configuré.
  if (DRY_RUN) {
    console.log("\nSimulation — relancer sans --dry pour purger.");
    return;
  }

  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    throw new Error(
      "REVALIDATE_SECRET manque dans `.env`. Il doit valoir celui posé dans " +
        "les variables d'environnement du projet Vercel.",
    );
  }

  const reponse = await fetch(`${URL_SITE}/api/revalidate`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-revalidate-secret": secret },
    body: JSON.stringify({ chemins: PAGES }),
  });

  const corps = await reponse.text();
  if (!reponse.ok) {
    throw new Error(`HTTP ${reponse.status} — ${corps}`);
  }
  console.log(`\nPurgé. ${corps}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

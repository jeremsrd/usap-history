/**
 * Remet au jour de Paris la date finale des slugs de match.
 *
 * `generateMatchSlug` lisait le jour en UTC jusqu'au 18 octobre 2026, quand
 * la base se lit à l'heure de Paris (`docs/modele-de-donnees.md`). Une
 * rencontre sans horaire, posée à minuit de Paris, recevait donc le slug de
 * la veille : 31 sur 821 ce jour-là, les 13 de H Cup écrites sans horaire
 * par `seed-cup-espn.ts` et 18 rencontres du Top 14 2026-2027 au
 * calendrier non calé.
 *
 * Seule la date finale change ; le reste du slug n'est pas recalculé, pour
 * ne toucher à rien d'autre. **Seule la signature du défaut est corrigée** :
 * une date de slug égale au jour UTC et différente du jour de Paris. Un slug
 * qui ne porte ni l'un ni l'autre dit que la date en base est peut-être
 * fausse, et se signale sans être touché tant que la date n'est pas vérifiée
 * (`DATES_VERIFIEES`). Un slug déjà pris fait échouer sa ligne, sans écrire.
 *
 * Usage :
 *   npx tsx scripts/fix-match-slugs-paris.ts --dry
 *   npx tsx scripts/fix-match-slugs-paris.ts
 *
 * Idempotent : un slug déjà au jour de Paris n'est pas touché.
 */

import { PrismaClient } from "@prisma/client";
import { jourDeParis } from "./lib/dates";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

/**
 * Slugs ni au jour UTC ni au jour de Paris, dont la date en base a été
 * vérifiée juste : leur slug se corrige sur elle.
 */
const DATES_VERIFIEES = new Set([
  // Dimanche 29 décembre 2024, J13, USAP 21-13 La Rochelle : RugbyPass et
  // ESPN. Le slug portait le 28.
  "top-14-usap-vs-la-rochelle-j13-28-12-2024",
  // Samedi 11 janvier 2025, 14 h, USAP 23-20 Cardiff : le site de Cardiff et
  // RugbyPass. Le slug portait le 12.
  "challenge-europeen-usap-vs-cardiff-poule-j3-12-01-2025",
]);

async function main() {
  const matchs = await prisma.match.findMany({ select: { id: true, slug: true, date: true } });
  const pris = new Set(matchs.map((m) => m.slug));
  const echecs: string[] = [];
  let corriges = 0;

  for (const m of matchs) {
    const fin = m.slug.match(/-(\d{2})-(\d{2})-(\d{4})$/);
    if (!fin) continue;
    const [annee, mois, jour] = jourDeParis(m.date).split("-");
    const attendu = `-${jour}-${mois}-${annee}`;
    if (fin[0] === attendu) continue;
    if (!DATES_VERIFIEES.has(m.slug) && fin[0] !== `-${m.date.toISOString().slice(8, 10)}-${m.date.toISOString().slice(5, 7)}-${m.date.toISOString().slice(0, 4)}`) {
      echecs.push(`${m.slug} : ni le jour UTC ni celui de Paris (${jourDeParis(m.date)}) — la date est à vérifier`);
      continue;
    }

    const slug = m.slug.slice(0, -fin[0].length) + attendu;
    if (pris.has(slug)) {
      echecs.push(`${m.slug} → ${slug} : déjà pris`);
      continue;
    }
    console.log(`${m.slug} → ${slug}`);
    if (!DRY_RUN) {
      await prisma.match.update({ where: { id: m.id }, data: { slug } });
      pris.delete(m.slug);
      pris.add(slug);
    }
    corriges++;
  }

  console.log(`\n=== ${corriges} slug(s) ${DRY_RUN ? "à corriger" : "corrigé(s)"}, ${echecs.length} en échec ===`);
  for (const e of echecs) console.log(`  ✘ ${e}`);
  if (DRY_RUN) console.log("Simulation — relancer sans --dry pour appliquer.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

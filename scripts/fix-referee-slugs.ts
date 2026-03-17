/**
 * Script de correction des slugs d'arbitres.
 * Les slugs doivent contenir le CUID pour que la page /arbitres/[slug] fonctionne.
 * Format attendu : prenom-nom-{cuid}
 *
 * Exécution : npx tsx scripts/fix-referee-slugs.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("=== Correction des slugs d'arbitres ===\n");

  const referees = await prisma.referee.findMany({ orderBy: { lastName: "asc" } });
  let fixed = 0;

  for (const r of referees) {
    const expectedBase = slugify(`${r.firstName}-${r.lastName}`);
    const expectedSlug = `${expectedBase}-${r.id}`;

    if (r.slug !== expectedSlug) {
      await prisma.referee.update({
        where: { id: r.id },
        data: { slug: expectedSlug },
      });
      console.log(`  FIXED: "${r.slug}" → "${expectedSlug}" (${r.firstName} ${r.lastName})`);
      fixed++;
    } else {
      console.log(`  OK:    "${r.slug}" (${r.firstName} ${r.lastName})`);
    }
  }

  console.log(`\n${fixed} arbitre(s) corrigé(s) sur ${referees.length} total.`);
}

main()
  .catch((e) => { console.error("Erreur :", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

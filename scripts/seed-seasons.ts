// =============================================================================
// USAP HISTORY - Seed des saisons historiques (1902-2026)
// Peuple toutes les saisons de l'USAP avec la bonne division par ère.
// Usage : npx tsx scripts/seed-seasons.ts
// =============================================================================

import { PrismaClient, Division } from "@prisma/client";

const prisma = new PrismaClient();

// Helper : génère les saisons pour une plage d'années (startYear) avec une division
function range(
  startFrom: number,
  startTo: number,
  division: Division,
): { startYear: number; endYear: number; label: string; division: Division }[] {
  return Array.from({ length: startTo - startFrom + 1 }, (_, i) => ({
    startYear: startFrom + i,
    endYear: startFrom + i + 1,
    label: `${startFrom + i}-${startFrom + i + 1}`,
    division,
  }));
}

// Toutes les saisons de l'USAP, classées par ère
const seasons = [
  // 1902-1911 : Championnat de France 2ème série
  // L'ASP monte en 1ère série en 1911 après avoir remporté la finale de 2ème série
  ...range(1902, 1910, Division.CHAMPIONNAT_2EME_SERIE),

  // 1911-1914 : Championnat de France 1ère série
  // Champion 1914
  ...range(1911, 1913, Division.CHAMPIONNAT_1ERE_SERIE),

  // ⚠️ 1914-1919 : Pas de championnat (Première Guerre mondiale)

  // 1919-1967 : Championnat de France 1ère série
  // Champions : 1921, 1925, 1938, 1944, 1955
  ...range(1919, 1966, Division.CHAMPIONNAT_1ERE_SERIE),

  // 1967-1987 : Championnat Excellence
  // Finaliste 1977
  ...range(1967, 1986, Division.CHAMPIONNAT_EXCELLENCE),

  // 1987-1996 : Groupe A
  // Challenge Du Manoir 1994
  ...range(1987, 1995, Division.GROUPE_A),

  // 1996-2003 : Première Division
  // Finaliste 1998, Finale H-Cup 2003
  ...range(1996, 2002, Division.PREMIERE_DIVISION),

  // 2003-2005 : Top 16
  // Finaliste 2004
  ...range(2003, 2004, Division.TOP_16),

  // 2005-2014 : Top 14
  // Champion 2009, Finaliste 2010. Relégué fin 2013-14
  ...range(2005, 2013, Division.TOP_14),

  // 2014-2018 : Pro D2 (1ère relégation)
  // Champion Pro D2 2018 → remontée
  ...range(2014, 2017, Division.PRO_D2),

  // 2018-2019 : Top 14
  // Relégation immédiate (dernier, 2 victoires seulement)
  ...range(2018, 2018, Division.TOP_14),

  // 2019-2021 : Pro D2 (2ème relégation)
  // Champion Pro D2 2021 → remontée
  ...range(2019, 2020, Division.PRO_D2),

  // 2021-2026 : Top 14
  // Maintien chaque saison (souvent in extremis via barrages)
  ...range(2021, 2025, Division.TOP_14),
];

async function main() {
  console.log("📅 Seed des saisons historiques de l'USAP...\n");
  console.log(`   ${seasons.length} saisons à insérer (1902-2026, hors WWI)\n`);

  const result = await prisma.season.createMany({
    data: seasons,
    skipDuplicates: true,
  });

  console.log(`✅ ${result.count} saison(s) créée(s) (les doublons existants ont été ignorés).`);

  // Afficher un résumé par division
  const counts = await prisma.season.groupBy({
    by: ["division"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  console.log("\n📊 Répartition par division :");
  for (const c of counts) {
    console.log(`   ${c.division} : ${c._count.id} saison(s)`);
  }

  const total = await prisma.season.count();
  console.log(`\n   Total en base : ${total} saisons`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

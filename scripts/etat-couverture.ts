/**
 * État de la couverture des données, saison par saison.
 *
 * Ces chiffres ne sont écrits nulle part : ils se recalculent. CLAUDE.md a
 * longtemps porté trois tableaux qu'il fallait tenir à jour à chaque saison
 * reprise, et qui se contredisaient dès qu'on oubliait une ligne. Ce script
 * les remplace.
 *
 * Lecture seule. Usage :
 *   npx tsx scripts/etat-couverture.ts
 *
 * Les colonnes : compositions et chronologies écrites, puis l'annexe du match
 * — arbitre, score à la mi-temps, vidéo, compte-rendu, affluence. Une colonne
 * vide sur une saison ancienne n'est pas forcément un manque : la LNR ne
 * publie ni affluence, ni mi-temps, ni compte-rendu (cf. « Où trouver les
 * données »).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const saisons = await prisma.season.findMany({
    where: { matches: { some: {} } },
    orderBy: { startYear: "desc" },
    select: {
      label: true,
      division: true,
      matches: {
        select: {
          halfTimeUsap: true,
          attendance: true,
          videoUrl: true,
          report: true,
          refereeId: true,
          _count: { select: { players: true, matchEvents: true } },
        },
      },
    },
  });

  console.log(
    "saison     division  matchs  compo  chrono  arbitre  mi-temps  vidéo  c.-rendu  affluence",
  );
  const total = { matchs: 0, compo: 0, chrono: 0 };
  for (const s of saisons) {
    const m = s.matches;
    const renseignes = (lire: (x: (typeof m)[number]) => unknown) =>
      m.filter((x) => lire(x) != null).length;
    const compo = m.filter((x) => x._count.players > 0).length;
    const chrono = m.filter((x) => x._count.matchEvents > 0).length;
    total.matchs += m.length;
    total.compo += compo;
    total.chrono += chrono;
    console.log(
      `${s.label}  ${String(s.division).padEnd(8)}  ${String(m.length).padStart(6)}  ` +
        `${String(compo).padStart(5)}  ${String(chrono).padStart(6)}  ` +
        `${String(renseignes((x) => x.refereeId)).padStart(7)}  ` +
        `${String(renseignes((x) => x.halfTimeUsap)).padStart(8)}  ` +
        `${String(renseignes((x) => x.videoUrl)).padStart(5)}  ` +
        `${String(renseignes((x) => x.report)).padStart(8)}  ` +
        `${String(renseignes((x) => x.attendance)).padStart(9)}`,
    );
  }

  const saisonsTotal = await prisma.season.count();
  console.log(
    `\n${total.matchs} matchs sur ${saisons.length} saisons renseignées ` +
      `(${saisonsTotal} en base) — ${total.compo} avec composition, ` +
      `${total.chrono} avec chronologie.`,
  );
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

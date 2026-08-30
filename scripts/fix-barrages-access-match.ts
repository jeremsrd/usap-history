/**
 * Les deux trous des barrages d'accession, et une transformation retrouvée.
 *
 * `etat-couverture.ts` ne signalait plus que deux manques isolés sur les 238
 * matchs joués : l'arbitre du barrage 2021-2022 et la mi-temps de celui de
 * 2022-2023. Les deux viennent de la même cause — la LNR ne publie pas la
 * feuille d'un access match, et n'a jamais donné de score à la pause.
 *
 * **Source : Jérémy.** Ces deux faits ne viennent d'aucune source lue par
 * machine, et c'est le seul moyen de les obtenir aujourd'hui.
 *
 *   12/06/2022  Mont-de-Marsan – USAP 16-41 : arbitre Thomas Charabas
 *   03/06/2023  Grenoble – USAP 19-33       : Grenoble menait 16-11 à la pause
 *
 * **Le second a révélé un défaut, et la base en porte la preuve.** La
 * chronologie du 3 juin 2023 donnait 14-11 à la 40ᵉ, deux points sous le
 * chiffre annoncé, et son score courant finissait à 17-33 quand le match dit
 * 19-33. Le même écart de deux points, du même côté, à partir de la 36ᵉ : une
 * transformation manquante. Ce n'est pas une hypothèse — la composition
 * enregistre Romain Trouilloud à 11 points, soit 1 transformation et
 * 3 pénalités, et la somme des points de Grenoble retombe exactement sur 19.
 * L'essai de Romain Barthelemy à la 36ᵉ a donc bien été transformé, et c'est
 * la chronologie seule qui l'ignorait.
 *
 * C'est le défaut LNR documenté dans `lib/lnr.ts` : la feuille saute parfois
 * une transformation, et son score courant déraille avec elle. Le total final
 * fait foi, et il l'a tranché ici.
 *
 * Le script ajoute donc l'événement manquant et rattrape les sept scores
 * courants qui le suivent — les descriptions portent le score sous la forme
 * « recevant-visiteur », Grenoble recevant ce jour-là.
 *
 * Usage :
 *   npx tsx scripts/fix-barrages-access-match.ts --dry
 *   npx tsx scripts/fix-barrages-access-match.ts
 *
 * Idempotent : les valeurs déjà posées ne sont pas réécrites, et
 * la transformation n'est ajoutée que si elle manque.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry");

const BARRAGE_2022 = "cmtbnp0f2001x4149r85g7tp9"; // 12/06/2022 vs Mont-de-Marsan
const BARRAGE_2023 = "cmnejoo73001p1ubami76g2k3"; // 03/06/2023 vs Grenoble

/** Scores courants à reprendre : Grenoble avait deux points de plus. */
const SCORES_COURANTS: [ancien: string, nouveau: string][] = [
  ["Essai de Léon Seilala Lam (USAP). 14-16.", "Essai de Léon Seilala Lam (USAP). 16-16."],
  ["Transformation de Tristan James Tedder (USAP). 14-18.", "Transformation de Tristan James Tedder (USAP). 16-18."],
  ["Essai de Sadek Deghmache (USAP). 14-23.", "Essai de Sadek Deghmache (USAP). 16-23."],
  ["Pénalité de Romain Trouilloud (Grenoble). 17-23.", "Pénalité de Romain Trouilloud (Grenoble). 19-23."],
  ["Essai de Jake Aron McIntyre (USAP). 17-28.", "Essai de Jake Aron McIntyre (USAP). 19-28."],
  ["Transformation de Tristan James Tedder (USAP). 17-30.", "Transformation de Tristan James Tedder (USAP). 19-30."],
  ["Pénalité de Dorian Laborde (USAP). 17-33.", "Pénalité de Dorian Laborde (USAP). 19-33."],
];

async function main() {
  console.log(`=== Barrages d'accession : arbitre, mi-temps, transformation${DRY_RUN ? " (simulation)" : ""} ===\n`);

  // --- 1. l'arbitre du 12 juin 2022
  const arbitre = await prisma.referee.findFirst({ where: { lastName: "Charabas", firstName: "Thomas" } });
  if (!arbitre) throw new Error("Fiche arbitre Thomas Charabas introuvable");
  const m2022 = await prisma.match.findUniqueOrThrow({
    where: { id: BARRAGE_2022 },
    select: { refereeId: true },
  });
  if (m2022.refereeId === arbitre.id) {
    console.log("  ✓ 12/06/2022 : arbitre déjà posé");
  } else if (m2022.refereeId) {
    console.log(`  ⚠ 12/06/2022 : un autre arbitre est déjà renseigné (${m2022.refereeId}) — laissé tel quel`);
  } else {
    console.log(`  ${DRY_RUN ? "→" : "✔"} 12/06/2022 : arbitre Thomas Charabas (${arbitre.id})`);
    if (!DRY_RUN) await prisma.match.update({ where: { id: BARRAGE_2022 }, data: { refereeId: arbitre.id } });
  }

  // --- 2. la mi-temps du 3 juin 2023
  const m2023 = await prisma.match.findUniqueOrThrow({
    where: { id: BARRAGE_2023 },
    select: { halfTimeUsap: true, halfTimeOpponent: true, scoreUsap: true, scoreOpponent: true },
  });
  if (m2023.halfTimeUsap != null || m2023.halfTimeOpponent != null) {
    console.log(`  ✓ 03/06/2023 : mi-temps déjà posée (${m2023.halfTimeUsap}-${m2023.halfTimeOpponent})`);
  } else {
    console.log(`  ${DRY_RUN ? "→" : "✔"} 03/06/2023 : mi-temps USAP 11 – Grenoble 16`);
    if (!DRY_RUN) {
      await prisma.match.update({
        where: { id: BARRAGE_2023 },
        data: { halfTimeUsap: 11, halfTimeOpponent: 16 },
      });
    }
  }

  // --- 3. la transformation manquante, et les scores courants qui la suivent
  const essai = await prisma.matchEvent.findFirstOrThrow({
    where: { matchId: BARRAGE_2023, minute: 36, type: "ESSAI", isUsap: false },
    select: { id: true },
  });
  const buteur = await prisma.matchPlayer.findFirstOrThrow({
    where: { matchId: BARRAGE_2023, isOpponent: true, conversions: { gt: 0 } },
    select: { playerId: true, player: { select: { firstName: true, lastName: true } } },
  });
  const deja = await prisma.matchEvent.findFirst({
    where: { matchId: BARRAGE_2023, minute: 36, type: "TRANSFORMATION", isUsap: false },
  });
  if (deja) {
    console.log("  ✓ 03/06/2023 : transformation de la 36ᵉ déjà présente");
  } else {
    const desc = `Transformation de ${buteur.player!.firstName} ${buteur.player!.lastName} (Grenoble). 16-11.`;
    console.log(`  ${DRY_RUN ? "→" : "✔"} 03/06/2023 : 36ᵉ « ${desc} » (essai ${essai.id})`);
    if (!DRY_RUN) {
      await prisma.matchEvent.create({
        data: {
          matchId: BARRAGE_2023, minute: 36, type: "TRANSFORMATION",
          playerId: buteur.playerId, isUsap: false, description: desc,
        },
      });
    }
  }

  let repris = 0;
  for (const [ancien, nouveau] of SCORES_COURANTS) {
    const ev = await prisma.matchEvent.findFirst({
      where: { matchId: BARRAGE_2023, description: ancien },
      select: { id: true },
    });
    if (!ev) continue;
    repris++;
    console.log(`      ${DRY_RUN ? "→" : "✔"} « ${ancien.slice(-8)} » devient « ${nouveau.slice(-8)} »`);
    if (!DRY_RUN) await prisma.matchEvent.update({ where: { id: ev.id }, data: { description: nouveau } });
  }
  console.log(`  ${repris} score(s) courant(s) ${DRY_RUN ? "à reprendre" : "repris"} sur ${SCORES_COURANTS.length}`);

  // --- garde-fou : la chronologie doit retomber sur le score du match
  const points: Record<string, number> = { ESSAI: 5, TRANSFORMATION: 2, PENALITE: 3, DROP: 3, ESSAI_PENALITE: 7 };
  const ev = await prisma.matchEvent.findMany({
    where: { matchId: BARRAGE_2023 },
    select: { minute: true, type: true, isUsap: true },
  });
  const cumul = (jusqua: number) =>
    ev.filter((e) => e.minute <= jusqua).reduce(
      (acc, e) => {
        const p = points[e.type] ?? 0;
        if (e.isUsap) acc.u += p; else acc.o += p;
        return acc;
      },
      { u: 0, o: 0 },
    );
  const mt = cumul(40);
  const fin = cumul(200);
  const simule = DRY_RUN && !deja ? { u: mt.u, o: mt.o + 2 } : mt;
  const simuleFin = DRY_RUN && !deja ? { u: fin.u, o: fin.o + 2 } : fin;
  console.log(
    `\n  chronologie : ${simule.u}-${simule.o} à la 40ᵉ (attendu 11-16), ` +
      `${simuleFin.u}-${simuleFin.o} au coup de sifflet (match : ${m2023.scoreUsap}-${m2023.scoreOpponent})`,
  );
  if (simule.u !== 11 || simule.o !== 16) console.log("  ⚠ la mi-temps ne retombe pas — à inspecter");
  if (simuleFin.u !== m2023.scoreUsap || simuleFin.o !== m2023.scoreOpponent) {
    console.log("  ⚠ le total ne retombe pas sur le score du match — à inspecter");
  }
  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

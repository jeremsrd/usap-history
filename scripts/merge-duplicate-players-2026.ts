/**
 * Fusionne les six doublons de joueurs identifiés en base, un par un.
 *
 * Contrairement à fix-duplicate-players.ts, qui apparie automatiquement les
 * prénoms par préfixe et par inclusion, ce script ne traite que les paires
 * listées ci-dessous, vérifiées à la main : même poste, mêmes saisons, aucune
 * date de naissance contradictoire. Il ne devine rien.
 *
 * Les six doublons sont tous des variantes d'accent ou d'orthographe nées de
 * scripts d'import successifs qui cherchaient le joueur existant sur le nom
 * exact plutôt que sur le nom normalisé.
 *
 * Traite aussi une erreur d'attribution distincte, du même famille :
 * Grégory Le Corvec, troisième ligne de la finale 2009, est rattaché à quatre
 * matchs de 2025-2026 qui sont ceux de Mattéo Le Corvec. Grégory ne figure pas
 * dans l'effectif 2025-2026, Mattéo si.
 *
 * Usage :
 *   npx tsx scripts/merge-duplicate-players-2026.ts --dry
 *   npx tsx scripts/merge-duplicate-players-2026.ts
 *
 * Idempotent : les fusions déjà faites sont ignorées (id introuvable).
 */

import { PrismaClient } from "@prisma/client";
import { generatePlayerSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

/**
 * keepId  : la fiche conservée (celle qui a le plus de rattachements)
 * dropId  : la fiche absorbée puis supprimée
 * rename  : orthographe correcte à poser sur la fiche conservée, si besoin
 */
const MERGES: Array<{
  label: string;
  keepId: string;
  dropId: string;
  rename?: { firstName: string; lastName: string };
}> = [
  {
    label: "So'otala Fa'aso'o ← Sootala Fa'aso'o",
    keepId: "cmmby9qnf002n1ucd8afco6qw",
    dropId: "cmnd3vvrs00101ujb43xu1416",
  },
  {
    label: "Mattéo Le Corvec ← Matteo Le Corvec",
    keepId: "cmmltrcbf00661uxdeln7nq76",
    dropId: "cmt8c0zye001241ufugqc5pp5",
  },
  {
    label: "Kélian Galletier ← Kelian Galletier",
    keepId: "cmnh93dqx000c1u520wud8loc",
    dropId: "cmn4lk51r00141uum0u8x90km",
  },
  {
    label: "Andrei Mahu ← Andreï Mahu",
    keepId: "cmng6nc7400081ukf2ztsbi8f",
    dropId: "cmnno9m5900081u8wuc59te8a",
  },
  {
    // La fiche la plus fournie porte l'orthographe sans accent : on la garde
    // et on rétablit le nom argentin correct.
    label: "Patricio Fernández ← Patricio Fernandez",
    keepId: "cmng87v8c00151ueu3fml6arh",
    dropId: "cmnhejtno00141u8y8jbuaz4m",
    rename: { firstName: "Patricio", lastName: "Fernández" },
  },
  {
    label: "Nino Séguéla ← Nino Séguela",
    keepId: "cmnhejtt600171u8y21fzv9lv",
    dropId: "cmng87vbt00181ueu4lnbqrg1",
  },
];

/** Réattribution : matchs 2025-2026 mis au compte du mauvais Le Corvec. */
const REASSIGN_2025_2026 = {
  label: "matchs 2025-2026 de Grégory Le Corvec → Mattéo Le Corvec",
  fromId: "cmmah2cb3000h1ug31ir681hm",
  toId: "cmmltrcbf00661uxdeln7nq76",
  seasonLabel: "2025-2026",
};

async function merge(keepId: string, dropId: string, label: string) {
  const keep = await prisma.player.findUnique({ where: { id: keepId } });
  const drop = await prisma.player.findUnique({ where: { id: dropId } });

  if (!keep || !drop) {
    console.log(`  déjà fusionné ou introuvable : ${label}`);
    return;
  }

  // Un même match ne doit pas se retrouver avec deux lignes pour le joueur
  const keepMatches = new Set(
    (
      await prisma.matchPlayer.findMany({
        where: { playerId: keepId },
        select: { matchId: true },
      })
    ).map((x) => x.matchId),
  );
  const collisions = (
    await prisma.matchPlayer.findMany({
      where: { playerId: dropId },
      select: { matchId: true },
    })
  ).filter((x) => keepMatches.has(x.matchId));

  if (collisions.length > 0) {
    console.log(
      `  ⚠ ${label} : ${collisions.length} match(s) où les deux fiches apparaissent — fusion annulée, à arbitrer`,
    );
    return;
  }

  if (DRY_RUN) {
    const mp = await prisma.matchPlayer.count({ where: { playerId: dropId } });
    const me = await prisma.matchEvent.count({ where: { playerId: dropId } });
    const sp = await prisma.seasonPlayer.count({ where: { playerId: dropId } });
    console.log(`  ${label}\n    ${mp} feuille(s) de match, ${me} événement(s), ${sp} lien(s) effectif`);
    return;
  }

  await prisma.matchPlayer.updateMany({
    where: { playerId: dropId },
    data: { playerId: keepId },
  });
  await prisma.matchEvent.updateMany({
    where: { playerId: dropId },
    data: { playerId: keepId },
  });
  await prisma.matchEvent.updateMany({
    where: { relatedPlayerId: dropId },
    data: { relatedPlayerId: keepId },
  });

  // seasonPlayer porte une contrainte d'unicité (seasonId, playerId)
  const dropSeasons = await prisma.seasonPlayer.findMany({
    where: { playerId: dropId },
  });
  for (const sp of dropSeasons) {
    const exists = await prisma.seasonPlayer.findFirst({
      where: { seasonId: sp.seasonId, playerId: keepId },
    });
    if (exists) await prisma.seasonPlayer.delete({ where: { id: sp.id } });
    else
      await prisma.seasonPlayer.update({
        where: { id: sp.id },
        data: { playerId: keepId },
      });
  }

  for (const model of ["careerClub", "playerStint", "playerInternational", "playerAward"] as const) {
    // @ts-expect-error accès dynamique aux modèles Prisma
    await prisma[model].updateMany({
      where: { playerId: dropId },
      data: { playerId: keepId },
    });
  }

  await prisma.player.delete({ where: { id: dropId } });
  console.log(`  fusionné : ${label}`);
}

async function main() {
  console.log(`=== Fusion des doublons${DRY_RUN ? " (simulation)" : ""} ===\n`);

  for (const m of MERGES) {
    await merge(m.keepId, m.dropId, m.label);
    if (m.rename && !DRY_RUN) {
      const p = await prisma.player.findUnique({ where: { id: m.keepId } });
      if (p && (p.firstName !== m.rename.firstName || p.lastName !== m.rename.lastName)) {
        await prisma.player.update({
          where: { id: m.keepId },
          data: {
            ...m.rename,
            slug: generatePlayerSlug(m.rename.firstName, m.rename.lastName, m.keepId),
          },
        });
        console.log(`    orthographe rétablie : ${m.rename.firstName} ${m.rename.lastName}`);
      }
    }
  }

  // ---- Réattribution Le Corvec -------------------------------------------
  console.log(`\n${REASSIGN_2025_2026.label}`);
  const season = await prisma.season.findFirst({
    where: { label: REASSIGN_2025_2026.seasonLabel },
  });
  if (season) {
    const where = {
      playerId: REASSIGN_2025_2026.fromId,
      match: { seasonId: season.id },
    };
    const mp = await prisma.matchPlayer.count({ where });
    const me = await prisma.matchEvent.count({ where });
    console.log(`  ${mp} feuille(s) de match, ${me} événement(s)`);
    if (!DRY_RUN && mp + me > 0) {
      const rows = await prisma.matchPlayer.findMany({ where, select: { id: true } });
      for (const r of rows) {
        await prisma.matchPlayer.update({
          where: { id: r.id },
          data: { playerId: REASSIGN_2025_2026.toId },
        });
      }
      const evs = await prisma.matchEvent.findMany({ where, select: { id: true } });
      for (const e of evs) {
        await prisma.matchEvent.update({
          where: { id: e.id },
          data: { playerId: REASSIGN_2025_2026.toId },
        });
      }
      console.log("  réattribué");
    }
  }

  console.log(
    DRY_RUN
      ? "\nSimulation terminée — relancer sans --dry pour appliquer."
      : "\nTerminé.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

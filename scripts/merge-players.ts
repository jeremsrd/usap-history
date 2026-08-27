/**
 * Fusionne deux fiches joueur désignées par leur identifiant.
 *
 * Même travail que merge-duplicate-players-2026.ts, mais sur une paire donnée
 * en ligne de commande plutôt que sur un lot figé : les arbitrages d'identité
 * arrivent un par un, au fil des feuilles officielles, et chacun demande une
 * vérification à la main avant d'être lancé.
 *
 * Le script **ne devine rien** : il ne cherche pas les doublons, il exécute
 * celui qu'on lui donne. Il refuse la fusion si les deux fiches figurent sur
 * un même match — ce serait deux joueurs distincts, ou une feuille fautive.
 *
 * Tout ce qui pointe vers la fiche absorbée est repointé : lignes de
 * composition, événements de chronologie (auteur et joueur lié), effectifs de
 * saison — en respectant leur contrainte d'unicité —, clubs de carrière,
 * passages à l'USAP, sélections et distinctions. La fiche absorbée est ensuite
 * supprimée.
 *
 * Usage :
 *   npx tsx scripts/merge-players.ts --keep=<id> --drop=<id> --dry
 *   npx tsx scripts/merge-players.ts --keep=<id> --drop=<id>
 *   npx tsx scripts/merge-players.ts --keep=<id> --drop=<id> --nom="Waisea|Vuidravuwalu"
 *
 * `--nom` rétablit l'orthographe sur la fiche conservée, prénom et nom séparés
 * par une barre verticale ; le slug est régénéré avec le CUID en suffixe, sans
 * quoi la fiche répondrait 404.
 *
 * Après une fusion touchant un joueur adverse, relancer
 * `seed-opponent-sheet.ts <saison> --match=<date>` : c'est l'appariement des
 * noms qui était bloqué, et il ne l'est plus.
 *
 * Idempotent : une fusion déjà faite ne trouve plus la fiche absorbée et
 * s'arrête sans rien changer.
 */

import { PrismaClient } from "@prisma/client";
import { generatePlayerSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");
const KEEP = process.argv.find((a) => a.startsWith("--keep="))?.slice("--keep=".length);
const DROP = process.argv.find((a) => a.startsWith("--drop="))?.slice("--drop=".length);
const NOM = process.argv.find((a) => a.startsWith("--nom="))?.slice("--nom=".length);

if (!KEEP || !DROP || KEEP === DROP) {
  console.error(
    "Deux identifiants distincts sont attendus.\n" +
      "  npx tsx scripts/merge-players.ts --keep=<id> --drop=<id> --dry\n" +
      'Options : --dry (simulation), --nom="Prénom|Nom" (orthographe à rétablir)',
  );
  process.exit(1);
}

const nom = NOM?.split("|");
if (NOM && (!nom || nom.length !== 2 || !nom[0].trim() || !nom[1].trim())) {
  console.error('--nom attend « Prénom|Nom », par exemple --nom="Waisea|Vuidravuwalu"');
  process.exit(1);
}

async function main() {
  console.log(`=== Fusion de deux fiches joueur${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const keep = await prisma.player.findUnique({ where: { id: KEEP! } });
  const drop = await prisma.player.findUnique({ where: { id: DROP! } });
  if (!keep) throw new Error(`Fiche conservée introuvable : ${KEEP}`);
  if (!drop) {
    console.log(`Fiche absorbée introuvable : ${DROP} — fusion déjà faite, rien à faire.`);
    return;
  }

  console.log(`  conservée : ${keep.firstName} ${keep.lastName} (${keep.id})`);
  console.log(`  absorbée  : ${drop.firstName} ${drop.lastName} (${drop.id})\n`);

  // Un même match ne doit pas se retrouver avec deux lignes pour le joueur.
  const dejaVus = new Set(
    (
      await prisma.matchPlayer.findMany({
        where: { playerId: KEEP },
        select: { matchId: true },
      })
    ).map((x) => x.matchId),
  );
  const collisions = (
    await prisma.matchPlayer.findMany({
      where: { playerId: DROP },
      select: { matchId: true, match: { select: { date: true } } },
    })
  ).filter((x) => dejaVus.has(x.matchId));
  if (collisions.length > 0) {
    console.log(
      `  ⚠ les deux fiches figurent sur ${collisions.length} même(s) match(s) — ` +
        `fusion annulée, à arbitrer :\n` +
        collisions.map((c) => `      ${c.match.date.toISOString().slice(0, 10)}`).join("\n"),
    );
    return;
  }

  const compte = {
    compositions: await prisma.matchPlayer.count({ where: { playerId: DROP } }),
    evenements: await prisma.matchEvent.count({ where: { playerId: DROP } }),
    lies: await prisma.matchEvent.count({ where: { relatedPlayerId: DROP } }),
    effectifs: await prisma.seasonPlayer.count({ where: { playerId: DROP } }),
  };
  console.log(
    `  à repointer : ${compte.compositions} composition(s), ${compte.evenements} événement(s), ` +
      `${compte.lies} lien(s) d'événement, ${compte.effectifs} effectif(s) de saison`,
  );

  if (DRY_RUN) {
    if (nom) console.log(`  orthographe à rétablir : ${nom[0]} ${nom[1]}`);
    console.log("\nSimulation — relancer sans --dry pour appliquer.");
    return;
  }

  await prisma.matchPlayer.updateMany({ where: { playerId: DROP }, data: { playerId: KEEP } });
  await prisma.matchEvent.updateMany({ where: { playerId: DROP }, data: { playerId: KEEP } });
  await prisma.matchEvent.updateMany({
    where: { relatedPlayerId: DROP },
    data: { relatedPlayerId: KEEP },
  });

  // seasonPlayer porte une contrainte d'unicité (seasonId, playerId)
  for (const lien of await prisma.seasonPlayer.findMany({ where: { playerId: DROP } })) {
    const existe = await prisma.seasonPlayer.findFirst({
      where: { seasonId: lien.seasonId, playerId: KEEP },
    });
    if (existe) await prisma.seasonPlayer.delete({ where: { id: lien.id } });
    else await prisma.seasonPlayer.update({ where: { id: lien.id }, data: { playerId: KEEP } });
  }

  for (const modele of ["careerClub", "playerStint", "playerInternational", "playerAward"] as const) {
    // @ts-expect-error accès dynamique aux modèles Prisma
    await prisma[modele].updateMany({ where: { playerId: DROP }, data: { playerId: KEEP } });
  }

  await prisma.player.delete({ where: { id: DROP } });
  console.log("  fusionné.");

  if (nom && (keep.firstName !== nom[0] || keep.lastName !== nom[1])) {
    await prisma.player.update({
      where: { id: KEEP },
      data: {
        firstName: nom[0],
        lastName: nom[1],
        slug: generatePlayerSlug(nom[0], nom[1], KEEP!),
      },
    });
    console.log(`  orthographe rétablie : ${nom[0]} ${nom[1]}`);
  }
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

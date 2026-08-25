/**
 * Unifie la représentation des joueurs adverses sur une seule convention.
 *
 * CONTEXTE
 * Deux conventions coexistaient depuis le 04/03/2026 :
 *   A — le joueur adverse est une vraie ligne `Player`, reliée par
 *       MatchPlayer.playerId avec isOpponent = true (scripts add-*-compo-*)
 *   B — le joueur adverse n'est qu'une chaîne dans
 *       MatchPlayer.opponentPlayerName (scripts update-match-*)
 *
 * La convention A est la plus récente et la plus riche : elle permet de
 * suivre une personne d'un club à l'autre, de compter ses confrontations
 * avec l'USAP, et de gérer le cas des joueurs passés par les deux camps
 * (Yato, Urdapilleta, les Lotrian...). Elle a d'ailleurs remplacé la B sur
 * tous les matchs où elle a été appliquée.
 *
 * Laisser cohabiter les deux crée des doublons d'identité : 437 des 803 noms
 * stockés en texte correspondent à une ligne `Player` déjà existante — la
 * même personne enregistrée deux fois de deux manières différentes.
 *
 * CE QUE FAIT CE SCRIPT
 * Pour chaque MatchPlayer adverse encore en convention B, rattache la ligne
 * au `Player` correspondant (comparaison sur nom normalisé : sans accents,
 * sans casse, sans ponctuation), en le créant s'il n'existe pas, puis vide
 * opponentPlayerName.
 *
 * Les joueurs créés le sont avec isActive = false et un slug conforme
 * (généré via generatePlayerSlug, donc exploitable par extractIdFromSlug —
 * les scripts add-*-compo-* fabriquaient un suffixe aléatoire qui rendait
 * les fiches inaccessibles, cf. fix-broken-slugs.ts).
 *
 * Usage :
 *   npx tsx scripts/normalize-opponent-players.ts --dry
 *   npx tsx scripts/normalize-opponent-players.ts
 *
 * Idempotent : ne traite que les lignes ayant encore un opponentPlayerName.
 */

import { PrismaClient, Position } from "@prisma/client";
import { generatePlayerSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

/** Nom comparable : sans accents, sans casse, sans ponctuation. */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Découpe un nom complet en prénom / nom, en gardant les particules avec le
 * nom de famille ("Jeronimo de la Fuente" → "Jeronimo" + "de la Fuente").
 */
function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: "", lastName: parts[0] };

  const particles = new Set(["de", "la", "le", "van", "von", "du", "des", "da", "di"]);
  const idx = parts.findIndex((p, i) => i > 0 && particles.has(p.toLowerCase()));
  if (idx > 0) {
    return {
      firstName: parts.slice(0, idx).join(" "),
      lastName: parts.slice(idx).join(" "),
    };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

async function main() {
  console.log(
    `=== Unification des joueurs adverses${DRY_RUN ? " (simulation)" : ""} ===\n`,
  );

  const rows = await prisma.matchPlayer.findMany({
    where: { isOpponent: true, opponentPlayerName: { not: null } },
    select: {
      id: true,
      opponentPlayerName: true,
      positionPlayed: true,
      match: { select: { slug: true } },
    },
  });

  if (rows.length === 0) {
    console.log("Aucune ligne en convention B : rien à faire.");
    return;
  }

  // Index des joueurs existants par nom normalisé
  const players = await prisma.player.findMany({
    select: { id: true, firstName: true, lastName: true },
  });
  const index = new Map<string, string[]>();
  for (const p of players) {
    const key = normalizeName(`${p.firstName} ${p.lastName}`);
    index.set(key, [...(index.get(key) ?? []), p.id]);
  }

  // Cache des joueurs créés pendant ce passage
  const created = new Map<string, string>();
  let linked = 0;
  let createdCount = 0;
  const ambiguous: string[] = [];

  for (const row of rows) {
    const full = row.opponentPlayerName!;
    const key = normalizeName(full);

    let playerId = created.get(key);

    if (!playerId) {
      const matches = index.get(key) ?? [];
      if (matches.length > 1) {
        // Plusieurs personnes portent ce nom : on ne devine pas.
        ambiguous.push(`${full} (${matches.length} homonymes) — ${row.match.slug}`);
        continue;
      }
      playerId = matches[0];
    }

    if (!playerId) {
      const { firstName, lastName } = splitName(full);
      if (!DRY_RUN) {
        const p = await prisma.player.create({
          data: {
            firstName,
            lastName,
            position: row.positionPlayed as Position | null,
            isActive: false,
            slug: `temp-${Date.now()}-${Math.random()}`,
          },
        });
        await prisma.player.update({
          where: { id: p.id },
          data: { slug: generatePlayerSlug(firstName, lastName, p.id) },
        });
        playerId = p.id;
      } else {
        playerId = `(à créer)`;
      }
      created.set(key, playerId);
      createdCount++;
    }

    if (!DRY_RUN) {
      await prisma.matchPlayer.update({
        where: { id: row.id },
        data: { playerId, opponentPlayerName: null },
      });
    }
    linked++;
  }

  console.log(`Lignes adverses en convention B : ${rows.length}`);
  console.log(`  rattachées à un Player          : ${linked}`);
  console.log(`  dont joueurs nouvellement créés : ${createdCount}`);
  console.log(`  laissées en l'état (homonymes)  : ${ambiguous.length}`);
  if (ambiguous.length > 0) {
    console.log("\nÀ arbitrer manuellement :");
    ambiguous.forEach((a) => console.log(`  ${a}`));
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

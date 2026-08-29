/**
 * Recalcule les points de bonus de tous les matchs et les agrégats de saison.
 *
 * POURQUOI
 * Le bonus offensif et le bonus défensif n'étaient calculés nulle part : chaque
 * script de match posait un booléen en dur, et l'admin propose une case à
 * cocher. Rien ne vérifiait la règle, si bien que 7 matchs étaient mal cochés
 * et que deux saisons affichaient un total de points erroné.
 *
 * Ce script applique src/lib/scoring.ts, qui tient compte de la compétition ET
 * de l'époque : différentiel de 3 essais depuis 2007-2008 en France, seuil
 * défensif ramené de 7 à 5 points en 2014-2015, 4 essais et 7 points dans les
 * coupes d'Europe jusqu'en 2025-2026. Aucun bonus sur un match couperet.
 *
 * GARDE-FOU
 * Les saisons dont le classement final officiel est connu sont vérifiées après
 * recalcul. Toute divergence annule l'écriture : il vaut mieux ne rien changer
 * que de propager une règle mal appliquée.
 *
 * Usage :
 *   npx tsx scripts/fix-bonus-points.ts --dry
 *   npx tsx scripts/fix-bonus-points.ts
 *
 * Idempotent.
 */

import { PrismaClient } from "@prisma/client";
import { MATCH_JOUE } from "../src/lib/matchs";
import { computeBonuses, matchPoints } from "../src/lib/scoring";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

/**
 * Classements finaux officiels, pour vérifier le recalcul.
 *
 * Les trois premiers viennent de Wikipédia ; ceux de Pro D2 du classement de
 * la LNR elle-même, `{top14|prod2}.lnr.fr/classement/{saison}`, qui donne
 * victoires, nuls, défaites, points marqués, encaissés et bonus.
 *
 * 2019-2020 s'arrête à la 23ᵉ journée : le Covid a interrompu le championnat
 * en mars 2020, et le classement de la LNR est celui de cet arrêt.
 */
const OFFICIEL: Record<string, { bo: number; bd: number; pts: number }> = {
  "2019-2020": { bo: 8, bd: 4, pts: 76 },
  "2020-2021": { bo: 7, bd: 2, pts: 107 },
  "2023-2024": { bo: 5, bd: 1, pts: 58 },
  "2024-2025": { bo: 2, bd: 2, pts: 44 },
  "2025-2026": { bo: 1, bd: 4, pts: 29 },
};

/** Une rencontre est un match couperet si elle n'a pas de journée et que sa
 *  phase n'est pas une poule. */
function isKnockout(matchday: number | null, round: string | null): boolean {
  return matchday == null && round != null && !round.startsWith("Poule");
}

async function main() {
  console.log(`=== Recalcul des points de bonus${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const matches = await prisma.match.findMany({
    // Une rencontre à venir n'a ni score ni résultat : elle n'a pas de bonus
    // à recalculer, et ne compte dans aucun agrégat de saison.
    where: MATCH_JOUE,
    orderBy: { date: "asc" },
    include: { competition: true, season: true, opponent: true },
  });

  const corrections: string[] = [];
  let sansEssais = 0;
  // Valeurs retenues par match, pour que la simulation agrège les chiffres
  // corrigés et non ceux encore en base.
  const retenu = new Map<string, { bo: boolean; bd: boolean }>();

  for (const m of matches) {
    const short = m.competition.shortName ?? m.competition.name;
    const res = computeBonuses({
      competitionShortName: short,
      seasonStartYear: m.season.startYear,
      isKnockout: isKnockout(m.matchday, m.round),
      scoreUsap: m.scoreUsap,
      scoreOpponent: m.scoreOpponent,
      // **Un essai de pénalité est un essai** : il compte dans l'écart qui
      // ouvre le bonus offensif, alors qu'il vit dans son propre compteur,
      // faute d'auteur. L'oublier ajoutait un bonus à l'USAP contre Colomiers
      // le 21 janvier 2021 — quatre essais contre un, mais Colomiers en avait
      // marqué un de pénalité, et l'écart n'était que de deux. Le classement
      // officiel de la LNR le confirme : 107 points, pas 108.
      triesUsap:
        m.triesUsap != null ? m.triesUsap + (m.penaltyTriesUsap ?? 0) : null,
      triesOpponent:
        m.triesOpponent != null
          ? m.triesOpponent + (m.penaltyTriesOpponent ?? 0)
          : null,
    });

    // Sans le détail des essais, on ne touche pas au bonus offensif déjà saisi
    if (res.triesMissing && res.rules) {
      sansEssais++;
      retenu.set(m.id, { bo: m.bonusOffensif, bd: res.bonusDefensif });
      if (m.bonusDefensif !== res.bonusDefensif) {
        corrections.push(
          `${m.season.label} ${(m.matchday ? "J" + m.matchday : m.round ?? "").padEnd(18)} vs ${m.opponent.name.slice(0, 20).padEnd(20)} BD ${m.bonusDefensif} → ${res.bonusDefensif}`,
        );
        if (!DRY_RUN) {
          await prisma.match.update({
            where: { id: m.id },
            data: { bonusDefensif: res.bonusDefensif },
          });
        }
      }
      continue;
    }

    retenu.set(m.id, { bo: res.bonusOffensif, bd: res.bonusDefensif });

    const changes: string[] = [];
    if (m.bonusOffensif !== res.bonusOffensif) changes.push(`BO ${m.bonusOffensif} → ${res.bonusOffensif}`);
    if (m.bonusDefensif !== res.bonusDefensif) changes.push(`BD ${m.bonusDefensif} → ${res.bonusDefensif}`);
    if (changes.length === 0) continue;

    const detail =
      m.triesUsap != null ? ` (${m.triesUsap}E-${m.triesOpponent}E)` : "";
    corrections.push(
      `${m.season.label} ${(m.matchday ? "J" + m.matchday : m.round ?? "").padEnd(18)} vs ${m.opponent.name.slice(0, 20).padEnd(20)} ${m.scoreUsap}-${m.scoreOpponent}${detail}  ${changes.join(", ")}`,
    );
    if (!DRY_RUN) {
      await prisma.match.update({
        where: { id: m.id },
        data: { bonusOffensif: res.bonusOffensif, bonusDefensif: res.bonusDefensif },
      });
    }
  }

  console.log(`Matchs examinés : ${matches.length}`);
  console.log(`Corrections : ${corrections.length}`);
  corrections.forEach((c) => console.log(`  ${c}`));
  if (sansEssais > 0) {
    console.log(
      `\n${sansEssais} match(s) sans détail d'essais : bonus offensif laissé tel quel.`,
    );
  }

  // ---- Agrégats de saison --------------------------------------------------
  console.log("\n--- Agrégats de saison (championnat uniquement) ---");
  const seasons = await prisma.season.findMany({
    where: { matches: { some: {} } },
    orderBy: { startYear: "asc" },
  });

  const echecs: string[] = [];

  for (const s of seasons) {
    const ms = await prisma.match.findMany({
      where: {
        ...MATCH_JOUE,
        seasonId: s.id,
        competition: { shortName: { in: ["Top 14", "Pro D2"] } },
        matchday: { not: null },
      },
    });
    if (ms.length === 0) continue;

    const valeurs = ms.map((m) => ({
      result: m.result,
      ...(retenu.get(m.id) ?? { bo: m.bonusOffensif, bd: m.bonusDefensif }),
    }));
    const bo = valeurs.filter((v) => v.bo).length;
    const bd = valeurs.filter((v) => v.bd).length;
    const pts = valeurs.reduce(
      (acc, v) => acc + matchPoints(v.result, v.bo, v.bd, s.startYear),
      0,
    );

    const ref = OFFICIEL[s.label];
    const conforme = !ref || (ref.bo === bo && ref.bd === bd && ref.pts === pts);
    const marque = ref ? (conforme ? " ✔ conforme au classement officiel" : " ✘ DIVERGENCE") : "";
    console.log(
      `${s.label} : ${ms.length}J — ${bo} BO, ${bd} BD, ${pts} pts` +
        ` (stocké : ${s.bonusOffensif ?? 0} BO, ${s.bonusDefensif ?? 0} BD, ${s.totalPoints ?? 0} pts)${marque}`,
    );
    if (ref && !conforme) {
      echecs.push(`${s.label} : calculé ${bo}/${bd}/${pts}, officiel ${ref.bo}/${ref.bd}/${ref.pts}`);
      continue;
    }

    if (!DRY_RUN) {
      await prisma.season.update({
        where: { id: s.id },
        data: { bonusOffensif: bo, bonusDefensif: bd, totalPoints: pts },
      });
    }
  }

  if (echecs.length > 0) {
    console.error("\n❌ Divergences avec les classements officiels :");
    echecs.forEach((e) => console.error(`   ${e}`));
    console.error("Ces saisons n'ont pas été mises à jour.");
    process.exit(1);
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

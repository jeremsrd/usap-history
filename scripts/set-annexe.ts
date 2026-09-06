/**
 * Pose ce que la LNR ne donne pas d'une rencontre — l'affluence, la
 * mi-temps — quand une autre source le donne, et le dit.
 *
 * La feuille de la LNR n'a ni affluence ni score à la mi-temps ; la presse
 * les a. *L'Indépendant* du lendemain publie l'un et l'autre en tête de sa
 * feuille — « 12 065 spectateurs », « Mi-temps : 28-6 » —, et c'est de là
 * que viennent ceux de 2026-2027. Ce n'est pas une feuille officielle : la
 * valeur s'écrit **avec son attestation**, `PROBABLE` par défaut, et
 * `CONCORDANT` pour une mi-temps que la chronologie déjà en base redonne —
 * le script le vérifie lui-même, et refuse une mi-temps que la chronologie
 * contredit. C'est le contrôle que « Grenoble menait 16-11 à la pause »
 * avait fait jouer en 2023 (cf. CLAUDE.md, « Couverture des données »).
 *
 * Usage :
 *   npx tsx scripts/set-annexe.ts --match=2026-09-05 --affluence=12065 --mi-temps=6-28 \
 *     --source="L'Indépendant du 6 septembre 2026" --dry
 *
 * La mi-temps s'écrit **USAP en premier**, comme partout dans le projet.
 * `--force` remplace une valeur déjà posée.
 */

import { PrismaClient } from "@prisma/client";
import { attester } from "./lib/attestations";

const prisma = new PrismaClient();

function argument(nom: string): string | undefined {
  const prefixe = `--${nom}=`;
  return process.argv.find((a) => a.startsWith(prefixe))?.slice(prefixe.length);
}

async function main() {
  const dry = process.argv.includes("--dry");
  const force = process.argv.includes("--force");
  const jour = argument("match");
  const source = argument("source");
  const affluence = argument("affluence");
  const miTemps = argument("mi-temps");
  if (!jour || !/^\d{4}-\d{2}-\d{2}$/.test(jour) || !source || (!affluence && !miTemps)) {
    console.error(
      'Usage : npx tsx scripts/set-annexe.ts --match=AAAA-MM-JJ --source="…" [--affluence=N] [--mi-temps=U-A] [--dry] [--force]',
    );
    process.exit(1);
  }
  const debut = new Date(`${jour}T00:00:00Z`);
  const fin = new Date(debut.getTime() + 86_400_000);
  const matchs = await prisma.match.findMany({
    where: { date: { gte: debut, lt: fin } },
    include: { opponent: { select: { name: true } }, matchEvents: { orderBy: { minute: "asc" } } },
  });
  if (matchs.length !== 1) {
    console.error(`${matchs.length} rencontre(s) le ${jour} — il en faut exactement une.`);
    process.exit(1);
  }
  const match = matchs[0];
  const affiche = match.isHome ? `USAP – ${match.opponent.name}` : `${match.opponent.name} – USAP`;
  const donnees: { attendance?: number; halfTimeUsap?: number; halfTimeOpponent?: number } = {};

  if (affluence) {
    const n = Number(affluence.replace(/\D/g, ""));
    if (!n) throw new Error(`affluence « ${affluence} » illisible`);
    if (match.attendance != null && !force) {
      console.error(`${jour} ${affiche} : affluence déjà posée, ${match.attendance}. Relancer avec --force.`);
      process.exit(1);
    }
    donnees.attendance = n;
    console.log(`${dry ? "[dry] " : ""}${jour} ${affiche} : affluence ${n} (${source})`);
  }

  let miTempsConcordante = false;
  if (miTemps) {
    const m = miTemps.match(/^(\d+)-(\d+)$/);
    if (!m) throw new Error(`mi-temps « ${miTemps} » illisible, attendu U-A`);
    const usap = Number(m[1]);
    const adverse = Number(m[2]);
    if (match.halfTimeUsap != null && !force) {
      console.error(`${jour} ${affiche} : mi-temps déjà posée, ${match.halfTimeUsap}-${match.halfTimeOpponent}. Relancer avec --force.`);
      process.exit(1);
    }
    // La chronologie en base, si elle existe, doit passer par cette
    // mi-temps. Chaque fait porte le score courant dans sa description,
    // « … 28-6. », l'USAP en premier — mais **la LNR additionne les arrêts de
    // jeu à la minute du fait** : l'essai de Ward à « 40+2 » selon la presse
    // est à 42' chez elle, et la première période ne s'arrête donc pas à 40.
    // On cherche la mi-temps parmi les scores courants atteints avant la
    // 50ᵉ ; on la refuse si la chronologie ne passe jamais par ce score.
    const scores = match.matchEvents
      .filter((e) => e.minute <= 50)
      .map((e) => e.description?.match(/(\d+)-(\d+)\.\s*$/))
      .filter((m): m is RegExpMatchArray => m != null)
      .map((m) => [Number(m[1]), Number(m[2])] as const);
    if (scores.length) {
      if (!scores.some(([u, a]) => u === usap && a === adverse)) {
        console.error(
          `${jour} ${affiche} : la chronologie ne passe jamais par ${usap}-${adverse} avant la 50ᵉ — ` +
            `elle donne ${scores.map(([u, a]) => `${u}-${a}`).join(", ")}. Rien n'est écrit : confronter les deux avant d'insister.`,
        );
        process.exit(1);
      }
      miTempsConcordante = true;
    }
    donnees.halfTimeUsap = usap;
    donnees.halfTimeOpponent = adverse;
    console.log(`${dry ? "[dry] " : ""}${jour} ${affiche} : mi-temps ${usap}-${adverse} (${source}${miTempsConcordante ? ", concordante avec la chronologie" : ", chronologie muette"})`);
  }

  if (dry) return;
  await prisma.match.update({ where: { id: match.id }, data: donnees });
  if (donnees.attendance != null) {
    await attester(prisma, { entite: "Match", entiteId: match.id, champ: "attendance", degre: "PROBABLE", source, note: "La LNR ne publie pas l'affluence ; celle-ci vient de la presse." });
  }
  if (donnees.halfTimeUsap != null) {
    await attester(prisma, {
      entite: "Match", entiteId: match.id, champ: "halfTime",
      degre: miTempsConcordante ? "CONCORDANT" : "PROBABLE",
      source,
      note: miTempsConcordante ? "La chronologie de la LNR passe par ce score avant la 50ᵉ minute, arrêts de jeu compris." : "La LNR ne publie pas la mi-temps ; celle-ci vient de la presse, sans chronologie pour la recouper.",
    });
  }
  console.log("✔ écrit, avec attestation.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

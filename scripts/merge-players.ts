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
 * L'opération elle-même vit dans `lib/fusion.ts`, que partage
 * `merge-duplicate-players-2026-08.ts` : ce fichier n'est plus que la ligne de
 * commande qui l'appelle.
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
import { fusionner } from "./lib/fusion";

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

const mots = NOM?.split("|");
if (NOM && (!mots || mots.length !== 2 || !mots[0].trim() || !mots[1].trim())) {
  console.error('--nom attend « Prénom|Nom », par exemple --nom="Waisea|Vuidravuwalu"');
  process.exit(1);
}
const nom = mots ? { firstName: mots[0], lastName: mots[1] } : undefined;

async function main() {
  console.log(`=== Fusion de deux fiches joueur${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const issue = await fusionner(prisma, { keepId: KEEP!, dropId: DROP!, nom }, DRY_RUN);

  if (issue.etat === "deja") {
    console.log(`Fiche absorbée introuvable : ${DROP} — fusion déjà faite, rien à faire.`);
    return;
  }
  if (issue.etat === "collision") {
    console.log(
      `  ⚠ les deux fiches figurent sur ${issue.dates.length} même(s) match(s) — ` +
        `fusion annulée, à arbitrer :\n` +
        issue.dates.map((d) => `      ${d}`).join("\n"),
    );
    return;
  }

  console.log(`  conservée : ${issue.keep} (${KEEP})`);
  console.log(`  absorbée  : ${issue.drop} (${DROP})\n`);
  const c = issue.compte;
  console.log(
    `  à repointer : ${c.compositions} composition(s), ${c.evenements} événement(s), ` +
      `${c.lies} lien(s) d\'événement, ${c.effectifs} effectif(s) de saison`,
  );

  if (issue.etat === "fusionnable") {
    if (issue.renomme && nom) console.log(`  orthographe à rétablir : ${nom.firstName} ${nom.lastName}`);
    console.log("\nSimulation — relancer sans --dry pour appliquer.");
    return;
  }

  console.log("  fusionné.");
  if (issue.renomme && nom) console.log(`  orthographe rétablie : ${nom.firstName} ${nom.lastName}`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

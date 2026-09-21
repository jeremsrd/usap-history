/**
 * Pose la photo officielle de l'équipe d'une saison, et son crédit.
 *
 * Une photo par saison pour l'instant — `Season.photoUrl`, `Season.photoCredit`
 * —, demandée par Jérémy le 21 septembre 2026 pour la page de chaque saison.
 * Deux chemins y mènent : l'admin, qui téléverse dans Supabase par
 * `ImageUpload` ; et ce script, pour une photo **déposée dans le dépôt**,
 * `public/images/saisons/AAAA-AAAA.jpg`, servie par le site comme les
 * écussons et les portraits. Le script vérifie que le fichier existe avant
 * d'écrire son chemin : un chemin sans fichier ferait une image cassée sur
 * la page sans que rien ne le dise.
 *
 * **Le crédit n'est pas décoratif.** Une photo d'équipe est une œuvre, et
 * son auteur s'affiche sous la photo comme celui d'un portrait de joueur.
 * On l'exige donc, sauf `--sans-credit` : une omission dite vaut mieux
 * qu'une omission tue.
 *
 * **Première photo, le 21 septembre 2026 : 2008-2009**, l'équipe posée au
 * Stade de France devant le panneau « Finale 2009 », le 6 juin 2009 —
 * « © Photo TONTON JO » en bas de l'image. Donnée par Jérémy, qui la juge
 * provisoire, « pas géniale », à remplacer par une meilleure.
 *
 * Usage :
 *   npx tsx scripts/set-photo-saison.ts --saison=2008-2009 --credit="Tonton Jo" --dry
 *   npx tsx scripts/set-photo-saison.ts --saison=2008-2009 --credit="Tonton Jo"
 *   npx tsx scripts/set-photo-saison.ts --saison=2008-2009 --fichier=2008-2009-bis.jpg …
 *   npx tsx scripts/set-photo-saison.ts … --force        # remplace une photo déjà posée
 *   npx tsx scripts/set-photo-saison.ts --saison=… --retirer   # efface photo et crédit
 *
 * Refuse d'écrire si la saison n'existe pas, si le fichier manque dans
 * `public/images/saisons/`, ou si une photo est déjà posée sans `--force`.
 */

import { PrismaClient } from "@prisma/client";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();
const DOSSIER = join(process.cwd(), "public", "images", "saisons");

function argument(nom: string): string | undefined {
  const prefixe = `--${nom}=`;
  return process.argv.find((a) => a.startsWith(prefixe))?.slice(prefixe.length);
}

async function main() {
  const dry = process.argv.includes("--dry");
  const force = process.argv.includes("--force");
  const retirer = process.argv.includes("--retirer");
  const sansCredit = process.argv.includes("--sans-credit");
  const label = argument("saison");
  const credit = argument("credit")?.trim() || null;
  const fichier = argument("fichier") ?? `${label}.jpg`;

  if (!label || !/^\d{4}-\d{4}$/.test(label) || (!retirer && !credit && !sansCredit)) {
    console.error(
      'Usage : npx tsx scripts/set-photo-saison.ts --saison=AAAA-AAAA --credit="Photographe" [--fichier=nom.jpg] [--dry] [--force]\n' +
        "        npx tsx scripts/set-photo-saison.ts --saison=AAAA-AAAA --retirer [--dry]",
    );
    process.exit(1);
  }

  const saison = await prisma.season.findFirst({
    where: { label },
    select: { id: true, label: true, photoUrl: true, photoCredit: true },
  });
  if (!saison) {
    console.error(`Saison ${label} introuvable.`);
    process.exit(1);
  }

  if (retirer) {
    if (!saison.photoUrl) {
      console.log(`${label} : aucune photo posée, rien à retirer.`);
      return;
    }
    console.log(`${label} : ${dry ? "retirerait" : "retire"} ${saison.photoUrl} (${saison.photoCredit ?? "sans crédit"}).`);
    if (!dry) await prisma.season.update({ where: { id: saison.id }, data: { photoUrl: null, photoCredit: null } });
    return;
  }

  const chemin = join(DOSSIER, fichier);
  if (!existsSync(chemin)) {
    console.error(`Fichier introuvable : ${chemin}. Le déposer d'abord dans public/images/saisons/.`);
    process.exit(1);
  }
  const url = `/images/saisons/${fichier}`;
  const poids = Math.round(statSync(chemin).size / 1024);

  if (saison.photoUrl && saison.photoUrl !== url && !force) {
    console.error(
      `${label} : une photo est déjà posée, ${saison.photoUrl} (${saison.photoCredit ?? "sans crédit"}). ` +
        "Relancer avec --force pour la remplacer.",
    );
    process.exit(1);
  }

  console.log(`${label} : ${dry ? "poserait" : "pose"} ${url} (${poids} Ko), crédit ${credit ?? "aucun"}.`);
  if (!dry) {
    await prisma.season.update({ where: { id: saison.id }, data: { photoUrl: url, photoCredit: credit } });
    console.log("✔ écrit.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

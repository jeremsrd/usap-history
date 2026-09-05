/**
 * Pose l'arbitre d'une rencontre, quand il vient d'ailleurs que d'une feuille.
 *
 * La LNR ne désigne l'arbitre sur sa feuille qu'après le match, et parfois
 * jamais — les access matchs n'en ont pas. Entre-temps, l'arbitre se sait :
 * la désignation est publiée en semaine, et Jérémy la donne. Ce script est
 * l'instrument de ces cas-là : un match par sa date, un nom en toutes lettres,
 * et c'est `lib/arbitres.ts` qui retrouve ou crée la fiche — jamais un slug
 * refait à la main, jamais un prénom apparié tout seul.
 *
 * **Premier emploi, le 5 septembre 2026 : Stade Français – USAP, première
 * journée de Top 14, arbitre Kévin Bralley. Source : Jérémy.** La feuille de
 * la LNR n'existait pas encore ; le calendrier, lui, était déjà en base.
 *
 * Usage :
 *   npx tsx scripts/set-arbitre.ts --match=2026-09-05 --nom="Kévin Bralley" --dry
 *   npx tsx scripts/set-arbitre.ts --match=2026-09-05 --nom="Kévin Bralley"
 *   npx tsx scripts/set-arbitre.ts … --force     # remplace un arbitre déjà posé
 *
 * Refuse d'écrire si la date désigne plusieurs rencontres, ou si un arbitre
 * est déjà posé et que `--force` n'est pas là : un arbitre venu d'une feuille
 * officielle vaut mieux qu'un nom donné de mémoire.
 */

import { PrismaClient } from "@prisma/client";
import { trouverOuCreerArbitre } from "./lib/arbitres";

const prisma = new PrismaClient();

function argument(nom: string): string | undefined {
  const prefixe = `--${nom}=`;
  return process.argv.find((a) => a.startsWith(prefixe))?.slice(prefixe.length);
}

async function main() {
  const dry = process.argv.includes("--dry");
  const force = process.argv.includes("--force");
  const date = argument("match");
  const nom = argument("nom");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !nom) {
    console.error(
      'Usage : npx tsx scripts/set-arbitre.ts --match=AAAA-MM-JJ --nom="Prénom Nom" [--dry] [--force]',
    );
    process.exit(1);
  }

  // La date en base est un instant ; on prend la journée entière en UTC,
  // large d'un jour de chaque côté pour les coups d'envoi tardifs, puis on
  // exige que la date civile locale corresponde.
  const debut = new Date(`${date}T00:00:00Z`);
  const fin = new Date(debut.getTime() + 24 * 3600 * 1000);
  const matchs = await prisma.match.findMany({
    where: { date: { gte: debut, lt: fin } },
    include: {
      opponent: { select: { name: true } },
      referee: { select: { firstName: true, lastName: true } },
    },
  });
  if (matchs.length !== 1) {
    console.error(
      `${matchs.length} rencontre(s) le ${date} — il en faut exactement une.`,
    );
    process.exit(1);
  }
  const match = matchs[0];
  const affiche = match.isHome
    ? `USAP – ${match.opponent.name}`
    : `${match.opponent.name} – USAP`;

  if (match.referee && !force) {
    console.error(
      `${date} ${affiche} : arbitre déjà posé, ${match.referee.firstName} ${match.referee.lastName}. ` +
        "Relancer avec --force pour le remplacer.",
    );
    process.exit(1);
  }

  const refereeId = await trouverOuCreerArbitre(prisma, nom, dry);
  if (dry) {
    console.log(
      `[dry] ${date} ${affiche} : arbitre → ${nom}` +
        (refereeId ? ` (fiche existante ${refereeId})` : " (fiche à créer)"),
    );
    return;
  }
  if (!refereeId) throw new Error(`Aucune fiche obtenue pour « ${nom} »`);
  await prisma.match.update({ where: { id: match.id }, data: { refereeId } });
  console.log(`✔ ${date} ${affiche} : arbitre ${nom} (${refereeId})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

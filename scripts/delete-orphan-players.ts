/**
 * Supprime les fiches joueur que rien ne rattache à quoi que ce soit.
 *
 * Les imports successifs laissent des coquilles : un nom lu sur une feuille,
 * créé, puis abandonné quand la ligne a été réattribuée à quelqu'un d'autre.
 * Clément Mondinat, que la feuille LNR du 22 février 2026 fait entrer à la
 * 56ᵉ sans qu'il figure sur les vingt-trois, en est le cas d'école.
 *
 * **Une fiche sans match n'est pas forcément à jeter.** La base porte des
 * figures historiques qui n'ont aucune rencontre saisie — Aimé Giral, qui a
 * donné son nom au stade, Jean-François Imbernon, Joseph Desclaux — et des
 * joueurs de passage cités pour mémoire. Le script ne supprime donc que ce
 * qui est **vide de bout en bout** : aucune feuille de match, aucun
 * événement, aucun effectif de saison, aucun club de carrière, aucune
 * sélection, aucune distinction, et pas la moindre donnée personnelle — ni
 * date de naissance, ni biographie, ni photo, ni nationalité, ni taille ni
 * poids. Une fiche qui porte ne serait-ce qu'une ligne de biographie est
 * laissée en place.
 *
 * **Et `isActive` protège à lui seul.** Une recrue entre en base avant son
 * premier match : elle n'a alors ni feuille, ni chronologie, ni rien de
 * personnel, et rien ne la distinguait d'une coquille. Les six recrues de
 * 2026-2027 figuraient ainsi parmi les fiches à supprimer, le 30 août 2026,
 * alors que CLAUDE.md les donnait pour protégées — elles ne l'étaient pas.
 * Une fiche déclarée dans l'effectif professionnel n'est pas un déchet
 * d'import : elle est écartée d'office.
 *
 * Usage :
 *   npx tsx scripts/delete-orphan-players.ts --dry
 *   npx tsx scripts/delete-orphan-players.ts
 *
 * Idempotent : il n'y a rien à supprimer deux fois.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

async function main() {
  console.log(`=== Fiches joueur orphelines${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const candidats = await prisma.player.findMany({
    where: {
      matchAppearances: { none: {} },
      seasonSquads: { none: {} },
      careerClubs: { none: {} },
      usapStints: { none: {} },
      internationalCaps: { none: {} },
      awards: { none: {} },
      // Une recrue entrée avant son premier match n'a rien d'autre que ce
      // drapeau : il suffit à la mettre hors d'atteinte.
      isActive: false,
      birthDate: null,
      biography: null,
      photoUrl: null,
      nationalityId: null,
      birthCountryId: null,
      height: null,
      weight: null,
    },
    select: { id: true, firstName: true, lastName: true, position: true },
  });

  const aSupprimer: typeof candidats = [];
  for (const p of candidats) {
    // Un événement de chronologie peut pointer une fiche sans qu'elle figure
    // sur la composition : le lien compte autant qu'une feuille de match.
    const evenements = await prisma.matchEvent.count({
      where: { OR: [{ playerId: p.id }, { relatedPlayerId: p.id }] },
    });
    if (evenements > 0) {
      console.log(`  gardée : ${p.firstName} ${p.lastName} — ${evenements} événement(s) de chronologie`);
      continue;
    }
    aSupprimer.push(p);
  }

  for (const p of aSupprimer) {
    console.log(`  ${p.firstName} ${p.lastName} [${p.position ?? "poste inconnu"}]`);
    if (!DRY_RUN) await prisma.player.delete({ where: { id: p.id } });
  }

  console.log(
    `\n=== ${aSupprimer.length} fiche(s) ${DRY_RUN ? "à supprimer" : "supprimées"} ` +
      `sur ${candidats.length} candidate(s) ===`,
  );
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

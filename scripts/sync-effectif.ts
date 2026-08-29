/**
 * Met l'effectif professionnel de l'USAP en accord avec la LNR.
 *
 * Usage :
 *   npx tsx scripts/sync-effectif.ts --dry
 *   npx tsx scripts/sync-effectif.ts
 *
 * Ce que fait le script : il lit `/club/perpignan/effectif-staff`, rapproche
 * chaque joueur d'une fiche existante, crée celles qui manquent, lève
 * `isActive` sur tout l'effectif et l'abaisse sur ceux qui n'y sont plus.
 * Idempotent : une seconde exécution ne touche plus rien.
 *
 * SOURCE — la LNR, et pas le site du club. Le 29 août 2026, `usap.fr` affichait
 * encore l'effectif de la saison écoulée : Allan, Petaia, Ritchie, Brookes y
 * figuraient toujours. La page de la LNR, elle, était à jour, et quatre des
 * joueurs qu'elle avait retirés de Perpignan apparaissaient déjà dans
 * l'effectif d'un autre club — Beria à Vannes, Delpy à Toulouse, Duguivalu au
 * Stade Français, Reus à l'UBB. Une page périmée ne peut pas produire ça.
 *
 * TROIS RÉSERVES, à garder en tête avant de relancer :
 *
 *   - `isActive` se lit « actuellement à l'USAP », et la LNR ne publie que
 *     l'effectif **professionnel**. Un joueur passé chez les espoirs est donc
 *     abaissé alors qu'il est toujours au club : Thomas Serezat figure sur la
 *     page espoirs d'`usap.fr` et sur aucune feuille professionnelle. Le
 *     script le signale au lieu de faire semblant.
 *   - le poste de la LNR est plus grossier que l'enum du projet : « 1ère
 *     ligne » confond les deux piliers et le talonneur, « 3ème ligne » englobe
 *     le numéro 8. Les joueurs créés dans ces deux groupes n'ont donc pas de
 *     `position` — à compléter à la main depuis l'admin. Le poste d'une fiche
 *     existante n'est jamais écrasé.
 *   - la LNR ajoute les seconds prénoms (« Jake Aron MCINTYRE ») ; la base s'en
 *     tient au premier. Les fiches créées suivent la base, et le relevé imprime
 *     le nom complet de la source pour qu'on puisse vérifier.
 *
 * RAPPROCHEMENT — `noms.ts` est calibré pour les 23 joueurs d'une feuille de
 * match ; sur les 1 368 fiches de la base, sa règle du « un mot commun assez
 * long » apparierait deux inconnus qui partagent un prénom. La règle est donc
 * resserrée ici : il faut un mot du **nom de famille** en commun, et un mot du
 * prénom en plus. Un nom de famille qui s'apparie sans que le prénom suive
 * n'est **pas** créé — c'est le cas des diminutifs, « Jonny » pour Jonathan
 * Gray —, il part au relevé pour arbitrage, et sa résolution s'inscrit à la
 * main dans LIENS_VERIFIES.
 */

import { PrismaClient, Position } from "@prisma/client";
import { lireEffectif, type LnrEffectifJoueur } from "./lib/lnr";
import { mots, memeMot, normalize } from "./lib/noms";
import { generatePlayerSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry");

/**
 * Rapprochements tranchés à la main, de l'identifiant LNR vers le nom exact
 * porté en base. À n'employer que pour les cas que la règle laisse en doute —
 * y inscrire une ligne, c'est affirmer que ces deux écritures désignent le
 * même homme.
 */
const LIENS_VERIFIES: Record<number, string> = {};

/** Le poste de la LNR vers l'enum du projet ; `null` quand elle ne tranche pas. */
const POSTES: Record<string, Position | null> = {
  "1ère ligne": null, // pilier gauche, talonneur ou pilier droit
  "2ème ligne": Position.DEUXIEME_LIGNE,
  "3ème ligne": null, // troisième ligne aile ou numéro 8
  "Demi de mêlée": Position.DEMI_DE_MELEE,
  "Demi d'ouverture": Position.DEMI_OUVERTURE,
  Ailier: Position.AILIER,
  Arrière: Position.ARRIERE,
  Centre: Position.CENTRE,
};

/** « MCGRATH » → « McGrath » : les capitales de la source ne se devinent pas. */
const CASSES_VERIFIEES: Record<string, string> = {
  MCGRATH: "McGrath",
  MCINTYRE: "McIntyre",
};

/** « GOMES SA » → « Gomes Sa », « MCGRATH » → « McGrath ». */
function casseNom(nom: string): string {
  return nom
    .split(" ")
    .map(
      (mot) =>
        CASSES_VERIFIEES[mot] ??
        mot.charAt(0) + mot.slice(1).toLowerCase(),
    )
    .join(" ");
}

interface Fiche {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  position: Position | null;
}

/** Un mot du nom de famille en commun. */
function memeFamille(a: string, b: string): boolean {
  const cibles = mots(b);
  return mots(a).some((mot) => cibles.some((cible) => memeMot(mot, cible)));
}

async function main() {
  console.log(`=== Effectif de l'USAP${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const effectif = await lireEffectif("perpignan");
  const postesInconnus = effectif
    .map((j) => j.poste)
    .filter((p) => !(p in POSTES));
  if (postesInconnus.length) {
    throw new Error(
      `Poste inconnu sur la page de la LNR : ${[...new Set(postesInconnus)].join(", ")} — ` +
        "la page a changé, compléter POSTES avant de continuer.",
    );
  }

  const fiches: Fiche[] = await prisma.player.findMany({
    select: { id: true, firstName: true, lastName: true, isActive: true, position: true },
  });
  console.log(`${effectif.length} joueurs à la LNR, ${fiches.length} fiches en base\n`);

  const lies = new Map<string, LnrEffectifJoueur>(); // id de fiche -> joueur LNR
  const aCreer: LnrEffectifJoueur[] = [];
  const douteux: { joueur: LnrEffectifJoueur; candidats: Fiche[] }[] = [];
  const ambigus: { joueur: LnrEffectifJoueur; candidats: Fiche[] }[] = [];

  for (const joueur of effectif) {
    const nomVerifie = LIENS_VERIFIES[joueur.id];
    if (nomVerifie) {
      const fiche = fiches.find(
        (f) => normalize(`${f.firstName} ${f.lastName}`) === normalize(nomVerifie),
      );
      if (!fiche) {
        throw new Error(
          `LIENS_VERIFIES[${joueur.id}] désigne « ${nomVerifie} », introuvable en base.`,
        );
      }
      lies.set(fiche.id, joueur);
      continue;
    }

    const parFamille = fiches.filter((f) => memeFamille(f.lastName, joueur.nom));
    const avecPrenom = parFamille.filter((f) =>
      memeFamille(f.firstName, joueur.prenoms),
    );

    if (avecPrenom.length === 1) lies.set(avecPrenom[0].id, joueur);
    else if (avecPrenom.length > 1) ambigus.push({ joueur, candidats: avecPrenom });
    else if (parFamille.length > 0) douteux.push({ joueur, candidats: parFamille });
    else aCreer.push(joueur);
  }

  if (ambigus.length) {
    for (const { joueur, candidats } of ambigus) {
      console.log(
        `  AMBIGU  ${joueur.prenoms} ${joueur.nom} → ${candidats
          .map((c) => `${c.firstName} ${c.lastName}`)
          .join(" / ")}`,
      );
    }
    throw new Error(
      `${ambigus.length} nom(s) apparié(s) à plusieurs fiches : trancher dans LIENS_VERIFIES.`,
    );
  }

  const dejaActifs = [...lies.keys()].filter(
    (id) => fiches.find((f) => f.id === id)!.isActive,
  );
  const aActiver = [...lies.keys()].filter(
    (id) => !fiches.find((f) => f.id === id)!.isActive,
  );
  const aDesactiver = fiches.filter((f) => f.isActive && !lies.has(f.id));

  // Une fiche qu'on s'apprête à abaisser et qui porte le nom de famille d'un
  // joueur de l'effectif est un doublon, pas un partant : les deux écritures
  // ne s'apparient pas entre elles, si bien que rien d'autre ne le verrait.
  // « Lorenço Boyer Gallardo » sortait ainsi de l'effectif au moment même où
  // « Lorencio Boyer Gallardo » y entrait.
  const doublons = aDesactiver
    .map((f) => ({
      fiche: f,
      joueur: [...lies.values()].find((j) => memeFamille(f.lastName, j.nom)),
    }))
    .filter((d) => d.joueur);
  if (doublons.length) {
    for (const { fiche, joueur } of doublons) {
      const garde = fiches.find((f) => lies.get(f.id) === joueur)!;
      console.log(
        `  DOUBLON  « ${fiche.firstName} ${fiche.lastName} » désactivé pendant que ` +
          `« ${garde.firstName} ${garde.lastName} » est retenu pour ${joueur!.prenoms} ${joueur!.nom}`,
      );
    }
    throw new Error(
      `${doublons.length} fiche(s) en double : fusionner avec merge-players.ts avant de continuer.`,
    );
  }

  console.log(`  ${dejaActifs.length} déjà actifs, rien à faire`);
  console.log(`  ${aActiver.length} à réactiver, ${aCreer.length} à créer, ${aDesactiver.length} à désactiver`);
  console.log(`  ${douteux.length} en attente d'arbitrage\n`);

  if (douteux.length) {
    console.log("=== À ARBITRER — nom de famille reconnu, prénom divergent ===");
    for (const { joueur, candidats } of douteux) {
      console.log(
        `  « ${joueur.prenoms} ${joueur.nom} » (LNR ${joueur.id}) ≟ ${candidats
          .map((c) => `${c.firstName} ${c.lastName}`)
          .join(" / ")}`,
      );
    }
    console.log("  → inscrire le bon rapprochement dans LIENS_VERIFIES, ou laisser créer.\n");
  }

  if (aActiver.length) {
    console.log("=== RÉACTIVÉS ===");
    for (const id of aActiver) {
      const f = fiches.find((x) => x.id === id)!;
      console.log(`  ${f.firstName} ${f.lastName}`);
    }
    console.log();
  }

  if (aCreer.length) {
    console.log("=== CRÉÉS ===");
    for (const j of aCreer) {
      const poste = POSTES[j.poste];
      console.log(
        `  ${j.prenoms.split(" ")[0]} ${casseNom(j.nom)}` +
          `${poste ? ` [${poste}]` : " [poste à compléter]"}` +
          `   (LNR : « ${j.prenoms} ${j.nom} », ${j.poste})`,
      );
    }
    console.log();
  }

  if (aDesactiver.length) {
    console.log("=== DÉSACTIVÉS — absents de l'effectif professionnel ===");
    for (const f of aDesactiver) console.log(`  ${f.firstName} ${f.lastName}`);
    console.log();
  }

  if (DRY_RUN) {
    console.log("Simulation — relancer sans --dry pour appliquer.");
    return;
  }

  for (const id of aActiver) {
    await prisma.player.update({ where: { id }, data: { isActive: true } });
  }
  for (const j of aCreer) {
    const firstName = j.prenoms.split(" ")[0];
    const lastName = casseNom(j.nom);
    const cree = await prisma.player.create({
      data: {
        firstName,
        lastName,
        position: POSTES[j.poste],
        isActive: true,
        slug: `temp-${j.id}`,
      },
    });
    await prisma.player.update({
      where: { id: cree.id },
      data: { slug: generatePlayerSlug(firstName, lastName, cree.id) },
    });
  }
  for (const f of aDesactiver) {
    await prisma.player.update({ where: { id: f.id }, data: { isActive: false } });
  }

  const actifs = await prisma.player.count({ where: { isActive: true } });
  console.log(`Effectif enregistré : ${actifs} joueurs actifs.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

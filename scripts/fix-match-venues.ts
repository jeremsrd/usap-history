/**
 * Met les stades en ordre : doublons fusionnés, manquants créés, rattachements
 * posés, et matchs sans lieu complétés.
 *
 * Le lieu d'une rencontre ne se saisit pas match par match : il se déduit du
 * camp. À domicile c'est Aimé-Giral, à l'extérieur c'est le terrain du club
 * qui reçoit — que porte déjà `Opponent.venueId`. Encore faut-il que ce champ
 * soit renseigné, et qu'un même stade ne figure pas deux fois en base.
 *
 * Quatre temps, dans cet ordre :
 *   1. **fusion des doublons**, listés à la main : « Stade du Hameau » et
 *      « Matmut Stadium de Gerland » existaient chacun en deux exemplaires,
 *      leurs matchs répartis entre les deux ;
 *   2. **création des stades manquants**, listés à la main eux aussi — avec un
 *      slug provisoire, réécrit aussitôt par `generateVenueSlug` : le slug
 *      porte le CUID de la ligne, il ne peut donc pas être calculé avant elle ;
 *   3. **rattachement des clubs à leur terrain** : quand `Opponent.venueId`
 *      manque, il se déduit des matchs déjà joués là-bas — c'est la base qui
 *      renseigne la base, sans rien inventer ;
 *   4. **complément des matchs** restés sans lieu.
 *
 * Usage :
 *   npx tsx scripts/fix-match-venues.ts --dry
 *   npx tsx scripts/fix-match-venues.ts
 *
 * Idempotent : un doublon déjà fusionné est introuvable, un stade déjà créé
 * est retrouvé sur son nom, un rattachement déjà posé n'est pas réécrit.
 *
 * ATTENTION AU SLUG. Ce script a créé trois stades le 27 août 2026 — Aguiléra,
 * Kingsholm, Guy-Boniface — avec un `slugify(nom)` improvisé, sans le CUID que
 * la page de détail extrait de la fin du slug : leurs trois fiches ont répondu
 * 404 jusqu'au 29. Il n'existait alors pas de générateur pour les stades, et
 * le script s'en était écrit un. Ne jamais refabriquer une convention de slug
 * ici : `generateVenueSlug` est dans `src/lib/slugs.ts`, c'est la seule.
 */

import { PrismaClient } from "@prisma/client";
import { generateVenueSlug, slugify } from "../src/lib/slugs";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

/** Le stade de l'USAP, lieu de toutes ses rencontres à domicile. */
const AIME_GIRAL = "Stade Aimé-Giral";

/**
 * Doublons vérifiés à la main : même nom, même ville, matchs répartis entre
 * les deux fiches. La conservée est celle qui en porte le plus.
 */
const DOUBLONS = ["Stade du Hameau", "Matmut Stadium de Gerland"];

/**
 * Stades absents de la base, avec le club qui y reçoit.
 *
 * Aguiléra vient de Jérémy ; Kingsholm et Guy-Boniface sont de notoriété
 * publique — à corriger si l'un d'eux est faux, ils ne viennent pas d'une
 * source officielle.
 *
 * Les six suivants viennent de la LNR elle-même, page par page :
 * `prod2.lnr.fr/club/{club}/informations` donne le nom du stade, sa capacité
 * et son adresse. Noter que le Pré Fleuri de Nevers n'est pas à Nevers mais à
 * Sermoise-sur-Loire, et que le Georges-Pompidou de Valence-Romans est à
 * Valence : c'est l'adresse officielle qui fait foi, pas le nom du club.
 *
 * Les deux derniers ont quitté la Pro D2, leur page LNR a disparu avec eux.
 * Albert-Domec est donné par Wikipédia, Robert-Diochon par Wikipédia **et par
 * le site du club** — moins officiel que le reste de cette liste, et signalé
 * comme tel. Réserve pour Rouen : ces deux sources décrivent son stade
 * d'aujourd'hui, et rien n'a permis de vérifier qu'il y jouait déjà en
 * 2020-2021.
 *
 * Armandie, arrivé avec 2018-2019, tient le milieu : la LNR le nomme bien
 * comme le stade du SU Agen, mais dans un article, pas dans une donnée — ni
 * sa page de club ni ses feuilles de match ne portent de lieu. Même réserve
 * que pour Rouen, donc : c'est le terrain d'aujourd'hui, et rien de lisible
 * par machine ne dit qu'Agen y recevait déjà le 2 septembre 2018.
 */
const MANQUANTS = [
  { nom: "Parc des Sports Aguiléra", ville: "Biarritz", club: "Biarritz" },
  { nom: "Kingsholm Stadium", ville: "Gloucester", club: "Gloucester" },
  { nom: "Stade Guy-Boniface", ville: "Mont-de-Marsan", club: "Mont-de-Marsan" },
  { nom: "Stade Chanzy", ville: "Angoulême", club: "Angoulême" },
  // Raoul Barrière existe déjà en base ; il figure ici pour le **rattachement**,
  // la liste servant aussi à cela. Le stade n'est pas recréé, il est retrouvé.
  { nom: "Stade Raoul Barrière", ville: "Béziers", club: "Béziers" },
  { nom: "Stade Jean Alric", ville: "Aurillac", club: "Aurillac" },
  { nom: "Stade Michel Bendichou", ville: "Colomiers", club: "Colomiers" },
  { nom: "Stade du Pré Fleuri", ville: "Sermoise-sur-Loire", club: "Nevers" },
  { nom: "Stade Georges Pompidou", ville: "Valence", club: "Valence-Romans" },
  { nom: "Stade Albert-Domec", ville: "Carcassonne", club: "Carcassonne" },
  { nom: "Stade Robert-Diochon", ville: "Le Petit-Quevilly", club: "Rouen" },
  { nom: "Stade Armandie", ville: "Agen", club: "Agen" },
];

async function fusionnerDoublons() {
  console.log("--- doublons de stades");
  for (const nom of DOUBLONS) {
    const fiches = await prisma.venue.findMany({
      where: { name: nom },
      include: { _count: { select: { matches: true, opponents: true } } },
    });
    if (fiches.length < 2) {
      console.log(`  ${nom} : ${fiches.length} fiche(s), rien à fusionner`);
      continue;
    }
    const [garde, ...absorbes] = [...fiches].sort(
      (a, b) => b._count.matches + b._count.opponents - (a._count.matches + a._count.opponents),
    );
    for (const perdu of absorbes) {
      console.log(
        `  ${nom} : ${perdu._count.matches} match(s) et ${perdu._count.opponents} club(s) ` +
          `repointés vers ${garde.id}`,
      );
      if (DRY_RUN) continue;
      await prisma.match.updateMany({ where: { venueId: perdu.id }, data: { venueId: garde.id } });
      await prisma.opponent.updateMany({
        where: { venueId: perdu.id },
        data: { venueId: garde.id },
      });
      await prisma.venue.delete({ where: { id: perdu.id } });
    }
  }
}

/**
 * Stades créés au cours de cette exécution, par nom. En simulation
 * l'identifiant manque : on retient quand même le nom, sans quoi les deux
 * étapes suivantes ne verraient rien et la simulation ne prédirait rien.
 */
const crees = new Map<string, string | null>();

async function creerManquants() {
  console.log("\n--- stades manquants");
  for (const stade of MANQUANTS) {
    const existant = await prisma.venue.findFirst({ where: { name: stade.nom } });
    if (existant) {
      console.log(`  ${stade.nom} : déjà en base`);
      crees.set(stade.nom, existant.id);
      continue;
    }
    console.log(`  ${stade.nom} (${stade.ville}) — terrain de ${stade.club}`);
    if (DRY_RUN) {
      crees.set(stade.nom, null);
      continue;
    }
    // Le slug ne peut pas être calculé avant la création : la page de détail
    // retrouve le stade par le CUID qu'elle extrait de la fin du slug, et ce
    // CUID n'existe qu'une fois la ligne écrite.
    const cree = await prisma.venue.create({
      data: { name: stade.nom, city: stade.ville, slug: `temp-${slugify(stade.nom)}` },
    });
    await prisma.venue.update({
      where: { id: cree.id },
      data: { slug: generateVenueSlug(stade.nom, stade.ville, cree.id) },
    });
    crees.set(stade.nom, cree.id);
  }
}

/** Terrain retenu pour chaque club, par identifiant d'adversaire. */
const terrains = new Map<string, { id: string | null; nom: string }>();

async function rattacherClubs() {
  console.log("\n--- clubs sans terrain");
  const clubs = await prisma.opponent.findMany({
    select: { id: true, name: true, shortName: true, venueId: true },
  });

  for (const club of clubs) {
    const nomCourt = club.shortName ?? club.name;
    if (club.venueId) {
      const stade = await prisma.venue.findUniqueOrThrow({ where: { id: club.venueId } });
      terrains.set(club.id, { id: stade.id, nom: stade.name });
      continue;
    }

    // Un stade déclaré plus haut désigne son club ; sinon, on regarde où
    // l'USAP s'est déjà déplacée pour l'affronter.
    const declare = MANQUANTS.find((s) => s.club === nomCourt);
    if (declare) {
      const retenu = { id: crees.get(declare.nom) ?? null, nom: declare.nom };
      terrains.set(club.id, retenu);
      console.log(`  ${nomCourt} → ${declare.nom} (déclaré)`);
      if (!DRY_RUN && retenu.id) {
        await prisma.opponent.update({ where: { id: club.id }, data: { venueId: retenu.id } });
      }
      continue;
    }

    const deplacements = await prisma.match.groupBy({
      by: ["venueId"],
      where: { opponentId: club.id, isHome: false, venueId: { not: null } },
      _count: { venueId: true },
    });
    const plusFrequent = deplacements.sort((a, b) => b._count.venueId - a._count.venueId)[0];
    if (!plusFrequent?.venueId) {
      console.log(`  ${nomCourt} : terrain inconnu, laissé vide`);
      continue;
    }
    const stade = await prisma.venue.findUniqueOrThrow({ where: { id: plusFrequent.venueId } });
    terrains.set(club.id, { id: stade.id, nom: stade.name });
    console.log(
      `  ${nomCourt} → ${stade.name} (${plusFrequent._count.venueId} match(s) déjà joué(s) là-bas)`,
    );
    if (!DRY_RUN) {
      await prisma.opponent.update({ where: { id: club.id }, data: { venueId: stade.id } });
    }
  }
}

async function completerMatchs() {
  console.log("\n--- matchs sans lieu");
  const aimeGiral = await prisma.venue.findFirstOrThrow({ where: { name: AIME_GIRAL } });
  const matchs = await prisma.match.findMany({
    where: { venueId: null },
    orderBy: { date: "asc" },
    include: { opponent: { select: { id: true, name: true, shortName: true } }, season: true },
  });

  let completes = 0;
  for (const m of matchs) {
    const nomCourt = m.opponent.shortName ?? m.opponent.name;
    const terrain = m.isHome
      ? { id: aimeGiral.id, nom: aimeGiral.name }
      : terrains.get(m.opponent.id);
    const etiquette = `${m.season.label} ${m.date.toISOString().slice(0, 10)} ${m.isHome ? "H" : "A"} ${nomCourt}`;
    if (!terrain) {
      console.log(`  ${etiquette} : ${nomCourt} n'a pas de terrain, laissé vide`);
      continue;
    }
    console.log(`  ${etiquette} → ${terrain.nom}`);
    if (!DRY_RUN && terrain.id) {
      await prisma.match.update({ where: { id: m.id }, data: { venueId: terrain.id } });
    }
    completes++;
  }
  console.log(
    `\n=== ${completes} match(s) ${DRY_RUN ? "à compléter" : "complétés"} sur ${matchs.length} sans lieu ===`,
  );
}

async function main() {
  console.log(`=== Stades${DRY_RUN ? " (simulation)" : ""} ===\n`);
  await fusionnerDoublons();
  await creerManquants();
  await rattacherClubs();
  await completerMatchs();
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

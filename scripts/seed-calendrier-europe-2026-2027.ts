/**
 * Le calendrier européen de 2026-2027, avant qu'il ne se joue : les quatre
 * matchs de poule de Challenge Cup, depuis le flux de l'EPCR.
 *
 * C'est le pendant de `seed-calendrier-2026-2027.ts` pour la coupe d'Europe.
 * La source est la même que pour les feuilles — le flux Opta qu'alimente
 * `epcrugby.com`, seule source officielle des coupes —, et la convention aussi :
 * une rencontre à venir n'a ni score ni résultat, `null` s'y lit « pas encore
 * joué », et une relance met la date à jour sans toucher au score.
 *
 * **Ce que le flux donne au 5 septembre 2026** : les quatre journées de poule,
 * avec leur date et leur heure — en UTC, affichée ici à l'heure de Perpignan.
 * La phase finale n'existe pas encore ; `seed-cup-sheet.ts` la trouvera le
 * moment venu.
 *
 * **Deux terrains sont posés à la main, avec leur source.** L'USAP n'a jamais
 * joué à Belfast ni à Newport : la base n'avait donc ni l'un ni l'autre, et
 * `terrainDuMatch()` ne peut rien déduire d'un déplacement qui n'a pas eu
 * lieu. Comme pour Carcassonne ou Tarbes, ce sont les terrains **d'aujourd'hui**
 * d'après Wikipédia, et aucune source officielle ne les nomme.
 *
 *   Ulster Rugby  — Ravenhill Stadium, Belfast (Affidea Stadium depuis 2024)
 *   Dragons RFC   — Rodney Parade, Newport
 *
 * L'Ulster est un club nouveau pour la base, créé ici sous l'Irlande — c'est
 * la fédération à laquelle il appartient, quelle que soit la frontière.
 *
 * Usage :
 *   npx tsx scripts/seed-calendrier-europe-2026-2027.ts --dry
 *   npx tsx scripts/seed-calendrier-europe-2026-2027.ts
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { COMPETITIONS, USAP, chercherMatchs } from "./lib/epcr";
import { CLUBS_EPCR } from "./lib/clubs";
import { terrainDuMatch } from "./lib/stades";
import {
  generateMatchSlug,
  generateOpponentSlug,
  generateVenueSlug,
} from "../src/lib/slugs";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry");

const SAISON = "2026-2027";
const COMPETITION = "Challenge Européen";

/** Du numéro de tour de l'EPCR au libellé de la base. */
const PHASES_EPCR: Record<number, string> = {
  1: "Poule J1",
  2: "Poule J2",
  3: "Poule J3",
  4: "Poule J4",
};

/** Les clubs que la base ne connaît pas encore. */
const NOUVEAUX_ADVERSAIRES = [
  { name: "Ulster Rugby", shortName: "Ulster", city: "Belfast", pays: "IE" },
];

/** Les terrains à rattacher, et d'où ils viennent — cf. l'en-tête. */
const TERRAINS = [
  { club: "Ulster", stade: "Ravenhill Stadium", ville: "Belfast", capacite: 18196 },
  { club: "Dragons", stade: "Rodney Parade", ville: "Newport", capacite: 8700 },
];

async function assurerAdversaires() {
  for (const club of NOUVEAUX_ADVERSAIRES) {
    if (await prisma.opponent.findFirst({ where: { shortName: club.shortName } })) continue;
    if (DRY_RUN) {
      console.log(`  [adversaire] à créer : ${club.name}`);
      continue;
    }
    const pays = await prisma.country.findFirst({ where: { code: club.pays } });
    const cree = await prisma.opponent.create({
      data: {
        name: club.name,
        shortName: club.shortName,
        city: club.city,
        countryId: pays?.id ?? null,
        slug: `temp-${club.shortName.toLowerCase()}`,
      },
    });
    await prisma.opponent.update({
      where: { id: cree.id },
      data: { slug: generateOpponentSlug(club.name, cree.id) },
    });
    console.log(`  [adversaire] créé : ${club.name}`);
  }
}

async function assurerTerrains() {
  for (const t of TERRAINS) {
    const club = await prisma.opponent.findFirst({
      where: { shortName: t.club },
      select: { id: true, venueId: true },
    });
    if (!club) {
      // En simulation, le club peut être encore à créer : rien à rattacher.
      console.log(`  [stade] ${t.club} : club absent, rattachement différé`);
      continue;
    }
    if (club.venueId) continue;
    if (DRY_RUN) {
      console.log(`  [stade] à créer et rattacher : ${t.stade}, ${t.ville} → ${t.club}`);
      continue;
    }
    let stade = await prisma.venue.findFirst({ where: { name: t.stade }, select: { id: true } });
    if (!stade) {
      const cree = await prisma.venue.create({
        data: { name: t.stade, city: t.ville, capacity: t.capacite, slug: `temp-${t.club.toLowerCase()}` },
      });
      stade = await prisma.venue.update({
        where: { id: cree.id },
        data: { slug: generateVenueSlug(t.stade, t.ville, cree.id) },
        select: { id: true },
      });
      console.log(`  [stade] créé : ${t.stade}, ${t.ville}`);
    }
    await prisma.opponent.update({ where: { id: club.id }, data: { venueId: stade.id } });
    console.log(`  [stade] ${t.club} → ${t.stade}`);
  }
}

async function main() {
  console.log(`=== Calendrier européen ${SAISON}${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const saison = await prisma.season.findFirstOrThrow({ where: { label: SAISON } });
  const competition = await prisma.competition.findFirstOrThrow({
    where: { shortName: COMPETITION },
  });

  await assurerAdversaires();
  await assurerTerrains();

  const echecs: string[] = [];
  const feuilles = (await chercherMatchs(SAISON, COMPETITIONS["challenge-cup"])).filter(
    (m) => m.domicile.id === USAP || m.exterieur.id === USAP,
  );
  if (feuilles.length === 0) {
    console.log("Aucune rencontre de l'USAP au calendrier de l'EPCR.");
    return;
  }

  let crees = 0;
  let majs = 0;
  for (const f of feuilles.sort((a, b) => a.date.localeCompare(b.date))) {
    const isHome = f.domicile.id === USAP;
    const nomEpcr = isHome ? f.exterieur.nom : f.domicile.nom;
    const nom = CLUBS_EPCR[nomEpcr];
    if (!nom) {
      echecs.push(`EPCR ${f.id} : club « ${nomEpcr} » inconnu de CLUBS_EPCR`);
      continue;
    }
    const round = PHASES_EPCR[f.round ?? 0];
    if (!round) {
      echecs.push(`EPCR ${f.id} : tour ${f.round} sans libellé`);
      continue;
    }
    const adversaire = await prisma.opponent.findFirst({
      where: { OR: [{ shortName: nom }, { name: nom }] },
      select: { id: true },
    });

    const date = new Date(f.date);
    const kickoffTime = date.toLocaleTimeString("fr-FR", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      minute: "2-digit",
    });
    const jour = date.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
    console.log(`${jour} ${kickoffTime} ${round.padEnd(9)} ${isHome ? "H" : "A"} ${nom}`);

    if (!adversaire) {
      echecs.push(`${round} : adversaire « ${nom} » introuvable en base`);
      continue;
    }
    if (DRY_RUN) continue;

    const donnees: Prisma.MatchUncheckedCreateInput = {
      slug: generateMatchSlug({
        competitionShortName: competition.shortName,
        competitionName: competition.name,
        opponentShortName: nom,
        opponentName: nom,
        isHome,
        matchday: null,
        round,
        date,
      }),
      date,
      kickoffTime,
      seasonId: saison.id,
      competitionId: competition.id,
      matchday: null,
      round,
      isHome,
      opponentId: adversaire.id,
      venueId: await terrainDuMatch(prisma, {
        opponentId: adversaire.id,
        isHome,
        startYear: saison.startYear,
        jour,
      }),
    };

    const existant = await prisma.match.findFirst({
      where: { seasonId: saison.id, competitionId: competition.id, round },
      select: { id: true },
    });
    if (existant) {
      await prisma.match.update({ where: { id: existant.id }, data: donnees });
      majs++;
    } else {
      await prisma.match.create({ data: donnees });
      crees++;
    }
  }

  console.log(
    `\n=== ${feuilles.length} rencontre(s) lue(s)` +
      (DRY_RUN ? "" : `, ${crees} créée(s), ${majs} mise(s) à jour`) +
      `, ${echecs.length} en échec ===`,
  );
  for (const e of echecs) console.log(`  ⚠ ${e}`);
  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

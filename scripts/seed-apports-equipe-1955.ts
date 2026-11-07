/**
 * Ce que *L'Équipe* du 25 mai 1955 apporte aux finales de 1914 et de 1925.
 *
 * L'encadré « Six équipes, six titres », page 12, redonne les XV champions et
 * ajoute trois faits que *L'Auto* du lendemain ne portait pas :
 *   - Félix Barbe capitaine en 1914, ce que Wikipédia légende aussi ;
 *   - en 1925, Pascot à l'ouverture et Carbonne à la mêlée, « (o) » et « (m) » ;
 *   - sept champions de 1914 « tombés au champ d'honneur » en 1914-1918.
 *
 * **Pas de date de mort** : le journal n'en donne pas, `deathDate` reste vide
 * et la fiche le dit en une phrase. Aimé Giral, le septième, a déjà sa date et
 * sa biographie : on n'y touche pas. Une biographie déjà écrite non plus.
 *
 * Les graphies du journal (Couffe, Fournier, Nauté) désignent les fiches
 * Couffé, Fournié et Naute : même XV, tranché par Jérémy le 6 septembre 2026.
 *
 * L'attestation du capitaine prend le champ `capitaineUsap` : `capitaine` porte
 * déjà celle de Duffour, le capitaine tarbais, et un champ n'en a qu'une.
 *
 * Usage :
 *   npx tsx scripts/seed-apports-equipe-1955.ts --dry
 *   npx tsx scripts/seed-apports-equipe-1955.ts
 */

import { PrismaClient, type Position } from "@prisma/client";
import { attester } from "./lib/attestations";

const prisma = new PrismaClient();

const SOURCE = "L'Équipe du 25 mai 1955, page 12, « Six équipes, six titres »";
const IMAGE = "https://gallica.bnf.fr/ark:/12148/bd6t599049b/f12.item.zoom";
const RELU = { reluPar: "Claude, sur l'image du PDF ; validé par Jérémy le 7 novembre 2026", reluLe: new Date("2026-11-07") };

const FINALE_1914 = "1ere-serie-usap-vs-tarbes-finale-03-05-1914";
const FINALE_1925 = "1ere-serie-usap-vs-carcassonne-finale-03-05-1925";

const DEMIS_1925: { nom: string; poste: Position }[] = [
  { nom: "Pascot", poste: "DEMI_OUVERTURE" },
  { nom: "Carbonne", poste: "DEMI_DE_MELEE" },
];

const TOMBES = ["Couffé", "Fournié", "Lyda", "Gravas", "Naute", "Schuller"];
const BIOGRAPHIE = "Champion de France en 1914 avec l'AS perpignanaise, tombé au champ d'honneur pendant la Première Guerre mondiale.";

async function ligneUsap(slug: string, lastName: string) {
  const match = await prisma.match.findUniqueOrThrow({ where: { slug }, select: { id: true } });
  const lignes = await prisma.matchPlayer.findMany({
    where: { matchId: match.id, isOpponent: false, player: { lastName } },
    select: { id: true, isCaptain: true, positionPlayed: true, player: { select: { id: true, firstName: true, lastName: true, position: true, biography: true, deathDate: true } } },
  });
  if (lignes.length !== 1) throw new Error(`${slug} : ${lignes.length} ligne(s) USAP au nom de ${lastName}, il en faut une`);
  const { player, ...ligne } = lignes[0];
  if (!player) throw new Error(`${slug} : la ligne de ${lastName} n'a pas de fiche`);
  return { matchId: match.id, ligne: { ...ligne, player } };
}

async function main() {
  const dry = process.argv.includes("--dry");
  console.log(dry ? "=== Simulation : rien n'est écrit ===\n" : "=== Écriture ===\n");

  // ---- Barbe capitaine en 1914 ---------------------------------------------
  const barbe = await ligneUsap(FINALE_1914, "Barbe");
  console.log(`1914 capitaine : ${barbe.ligne.player.firstName} ${barbe.ligne.player.lastName}, ${barbe.ligne.isCaptain ? "déjà marqué" : "à marquer"}`);
  const autres = await prisma.matchPlayer.count({ where: { matchId: barbe.matchId, isOpponent: false, isCaptain: true, NOT: { id: barbe.ligne.id } } });
  if (autres) throw new Error(`1914 : ${autres} autre(s) capitaine(s) USAP déjà en base`);
  if (!dry) await prisma.matchPlayer.update({ where: { id: barbe.ligne.id }, data: { isCaptain: true } });
  await attester(
    prisma,
    { entite: "Match", entiteId: barbe.matchId, champ: "capitaineUsap", degre: "CONCORDANT", source: `${SOURCE} — « Barbe (cap.) » — et Wikipédia, légende de la photo des deux capitaines`, sourceUrl: IMAGE, note: "L'Auto du 4 mai 1914 ne marque pas le capitaine de Perpignan ; rétrospective de 1955.", decidePar: "Jérémy", ...RELU },
    dry,
  );

  // ---- Les demis de 1925 ---------------------------------------------------
  let matchIdDe1925 = "";
  for (const { nom, poste } of DEMIS_1925) {
    const { matchId, ligne } = await ligneUsap(FINALE_1925, nom);
    matchIdDe1925 = matchId;
    console.log(`1925 ${nom} : poste joué ${ligne.positionPlayed ?? "vide"} → ${poste} ; fiche ${ligne.player.position ?? "vide"}${ligne.player.position ? ", gardée" : ` → ${poste}`}`);
    if (ligne.positionPlayed && ligne.positionPlayed !== poste) throw new Error(`1925 ${nom} : déjà ${ligne.positionPlayed} en base`);
    if (!dry) {
      await prisma.matchPlayer.update({ where: { id: ligne.id }, data: { positionPlayed: poste } });
      if (!ligne.player.position) await prisma.player.update({ where: { id: ligne.player.id }, data: { position: poste } });
    }
  }
  await attester(
    prisma,
    { entite: "Match", entiteId: matchIdDe1925, champ: "postesDesDemis", degre: "PROBABLE", source: `${SOURCE} — « (o) Pascot — (m) Carbonne »`, sourceUrl: IMAGE, note: "Rétrospective de 1955 ; L'Auto du 4 mai 1925 donne les demis sans les distinguer.", decidePar: "Jérémy", ...RELU },
    dry,
  );

  // ---- Les morts de 14-18 --------------------------------------------------
  for (const nom of TOMBES) {
    const { ligne } = await ligneUsap(FINALE_1914, nom);
    const p = ligne.player;
    if (p.biography || p.deathDate) {
      console.log(`Tombé : ${p.firstName} ${p.lastName}, fiche déjà renseignée, laissée telle quelle`);
      continue;
    }
    console.log(`Tombé : ${p.firstName} ${p.lastName} → biographie`);
    if (!dry) await prisma.player.update({ where: { id: p.id }, data: { biography: BIOGRAPHIE } });
    await attester(
      prisma,
      { entite: "Player", entiteId: p.id, champ: "biography", degre: "PROBABLE", source: `${SOURCE} — « sont tombés au champ d'honneur au cours de la guerre 1914-1918 »`, sourceUrl: IMAGE, note: "Rétrospective de 1955. Ni date, ni lieu : deathDate reste vide.", decidePar: "Jérémy", ...RELU },
      dry,
    );
  }

  if (dry) {
    console.log("\nSimulation : relancer sans --dry pour écrire.");
    return;
  }

  // ---- Compter ce qui est écrit --------------------------------------------
  const capitaines = await prisma.matchPlayer.findMany({ where: { matchId: barbe.matchId, isOpponent: false, isCaptain: true }, select: { player: { select: { lastName: true } } } });
  const demis = await prisma.matchPlayer.count({ where: { matchId: matchIdDe1925, isOpponent: false, positionPlayed: { in: ["DEMI_OUVERTURE", "DEMI_DE_MELEE"] } } });
  const fiches = await prisma.player.count({ where: { biography: BIOGRAPHIE } });
  if (capitaines.length !== 1 || capitaines[0].player?.lastName !== "Barbe") throw new Error("1914 : le capitaine n'est pas Barbe seul");
  if (demis !== 2) throw new Error(`1925 : ${demis} demis pour 2`);
  if (fiches !== TOMBES.length) throw new Error(`${fiches} fiches portent la biographie, pour ${TOMBES.length}`);
  console.log(`\n[contrôle] capitaine 1914 Barbe, 2 demis en 1925, ${fiches} biographies`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * Script de nettoyage automatique des doublons de joueurs.
 * Détecte les joueurs avec le même nom de famille et des prénoms similaires
 * (différences d'accents, prénoms abrégés, etc.), fusionne les matchPlayers,
 * matchEvents et seasonPlayers vers le joueur principal, puis supprime le doublon.
 *
 * Usage : npx tsx scripts/fix-duplicate-players.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Normalise un prénom pour comparaison (retire accents, minuscules) */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['-]/g, "")
    .trim();
}

/** Vérifie si deux prénoms sont des variantes du même joueur */
function isSamePlayer(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);

  // Identiques après normalisation
  if (na === nb) return true;

  // L'un est un préfixe de l'autre (Max/Maxwell, Joe/Joseph, Dan/Daniel...)
  if (na.startsWith(nb) || nb.startsWith(na)) return true;

  // L'un contient l'autre (Moses vs Moses Eneliko)
  if (na.includes(nb) || nb.includes(na)) return true;

  return false;
}

// Paires connues comme étant des joueurs DIFFÉRENTS (même nom de famille)
const KNOWN_DIFFERENT = new Set([
  // Frères, père/fils ou homonymes
  "Barlot:Gaëtan|Maxime",
  "Barlot:Maxime|Gaëtan",
  "Botha:Arno|PJ",
  "Botha:PJ|Arno",
  "Boudehent:Paul|Pierre",
  "Boudehent:Pierre|Paul",
  "Bouthier:Antoine|Anthony",
  "Bouthier:Anthony|Antoine",
  "Brennan:Daniel|Joshua",
  "Brennan:Joshua|Daniel",
  "Carter:Ben|Dan",
  "Carter:Dan|Ben",
  "Coetzee:Aranos|Carel-Jan",
  "Coetzee:Carel-Jan|Aranos",
  "Davids:Angelo|Eddie",
  "Davids:Eddie|Angelo",
  "Davies:Aled|Sam",
  "Davies:Sam|Aled",
  "Davies:Aled|Seb",
  "Davies:Seb|Aled",
  "Davies:Sam|Seb",
  "Davies:Seb|Sam",
  "Durand:Nicolas|Teddy",
  "Durand:Teddy|Nicolas",
  "Falatea:Loni|Sipili",
  "Falatea:Sipili|Loni",
  "Ferrari:Giacomo|Simone",
  "Ferrari:Simone|Giacomo",
  "Garbisi:Alessandro|Paolo",
  "Garbisi:Paolo|Alessandro",
  "Garcia:Alvaro|Gonzalo",
  "Garcia:Gonzalo|Alvaro",
  "Garcia:Alvaro|Mateo",
  "Garcia:Mateo|Alvaro",
  "Garcia:Alvaro|Pierre",
  "Garcia:Pierre|Alvaro",
  "Garcia:Gonzalo|Mateo",
  "Garcia:Mateo|Gonzalo",
  "Garcia:Gonzalo|Pierre",
  "Garcia:Pierre|Gonzalo",
  "Garcia:Mateo|Pierre",
  "Garcia:Pierre|Mateo",
  "Gazzotti:Luca|Marko",
  "Gazzotti:Marko|Luca",
  "Hughes:Dafydd|Nathan",
  "Hughes:Nathan|Dafydd",
  "Hughes:Dafydd|Nicky",
  "Hughes:Nicky|Dafydd",
  "Hughes:Nathan|Nicky",
  "Hughes:Nicky|Nathan",
  "Hulleu:Nathanaël|Wesley",
  "Hulleu:Wesley|Nathanaël",
  "Hulleu:Nathanaël|Wilfried",
  "Hulleu:Wilfried|Nathanaël",
  "Hulleu:Wesley|Wilfried",
  "Hulleu:Wilfried|Wesley",
  "Hunt:Rhys|Robert",
  "Hunt:Robert|Rhys",
  "Jacobs:Tiaan|Zack",
  "Jacobs:Zack|Tiaan",
  "Joseph:Jefferson-Lee|Jordan",
  "Joseph:Jordan|Jefferson-Lee",
  "Le Corvec:Grégory|Mattéo",
  "Le Corvec:Mattéo|Grégory",
  "Lotrian:Mathys|Sacha",
  "Lotrian:Sacha|Mathys",
  "Martin:Lucas|Mackenzie",
  "Martin:Mackenzie|Lucas",
  "Muarua:Penisoni|Pio",
  "Muarua:Pio|Penisoni",
  "Ntamack:Romain|Théo",
  "Ntamack:Théo|Romain",
  "O'Brien:Angus|Sean F",
  "O'Brien:Sean F|Angus",
  "Palu:Boris|Tevita",
  "Palu:Tevita|Boris",
  "Rebbadj:Rayan|Swan",
  "Rebbadj:Swan|Rayan",
  "Rey:Joël|Lucas",
  "Rey:Lucas|Joël",
  "Sadie:Ben Jason|Carlu Johann",
  "Sadie:Carlu Johann|Ben Jason",
  "Sarragallet:Mathis|Mattéo",
  "Sarragallet:Mattéo|Mathis",
  "Scelzo:Martin|Juan Martin",
  "Scelzo:Juan Martin|Martin",
  "Schoeman:RF|Ruben",
  "Schoeman:Ruben|RF",
  "Simmonds:Joe|Sam",
  "Simmonds:Sam|Joe",
  "Smith:Andrew|Chris",
  "Smith:Chris|Andrew",
  "Smith:Andrew|Rhyno",
  "Smith:Rhyno|Andrew",
  "Smith:Chris|Rhyno",
  "Smith:Rhyno|Chris",
  "Spring:Max|Tom",
  "Spring:Tom|Max",
  "Thomas:Ben|Dan",
  "Thomas:Dan|Ben",
  "Thomas:Ben|Teddy",
  "Thomas:Teddy|Ben",
  "Thomas:Dan|Teddy",
  "Thomas:Teddy|Dan",
  "Tolofua:Christopher|Selevasio",
  "Tolofua:Selevasio|Christopher",
  "Trouilloud:Hugo|Romain",
  "Trouilloud:Romain|Hugo",
  "Tuilagi:Etuale Manusamoa|Manu",
  "Tuilagi:Manu|Etuale Manusamoa",
  "Tuilagi:Etuale Manusamoa|Posolo",
  "Tuilagi:Posolo|Etuale Manusamoa",
  "Tuilagi:Manu|Posolo",
  "Tuilagi:Posolo|Manu",
  "Taofifenua:Donovan|Romain",
  "Taofifenua:Romain|Donovan",
  "Taofifenua:Donovan|Sébastien",
  "Taofifenua:Sébastien|Donovan",
  "Taofifenua:Romain|Sébastien",
  "Taofifenua:Sébastien|Romain",
  "Vincent:Arthur|Thomas",
  "Vincent:Thomas|Arthur",
  "Vunipola:Billy|Makovina",
  "Vunipola:Makovina|Billy",
  "Vunipola:Billy|Viliami",
  "Vunipola:Viliami|Billy",
  "Vunipola:Makovina|Viliami",
  "Vunipola:Viliami|Makovina",
  "Williams:Harry|Rhodri",
  "Williams:Rhodri|Harry",
  "Williams:Harry|Teddy",
  "Williams:Teddy|Harry",
  "Williams:Rhodri|Teddy",
  "Williams:Teddy|Rhodri",
  "Basse:Yacine|Yanis",
  "Basse:Yanis|Yacine",
  // Maurouard: Jérémie vs Jérémy - noms très proches mais joueurs différents ?
  "Maurouard:Jérémie|Jérémy",
  "Maurouard:Jérémy|Jérémie",
]);

function isKnownDifferent(lastName: string, firstNameA: string, firstNameB: string): boolean {
  const key = `${lastName}:${firstNameA}|${firstNameB}`;
  return KNOWN_DIFFERENT.has(key);
}

async function mergePlayer(keepId: string, deleteId: string, keepName: string, deleteName: string) {
  // 1. matchPlayers
  const mpCount = await prisma.matchPlayer.updateMany({
    where: { playerId: deleteId },
    data: { playerId: keepId },
  });

  // 2. matchEvents
  const meCount = await prisma.matchEvent.updateMany({
    where: { playerId: deleteId },
    data: { playerId: keepId },
  });

  // 3. seasonPlayers (gérer les doublons)
  const delSeasons = await prisma.seasonPlayer.findMany({ where: { playerId: deleteId } });
  for (const sp of delSeasons) {
    const exists = await prisma.seasonPlayer.findFirst({
      where: { seasonId: sp.seasonId, playerId: keepId },
    });
    if (exists) {
      await prisma.seasonPlayer.delete({ where: { id: sp.id } });
    } else {
      await prisma.seasonPlayer.update({ where: { id: sp.id }, data: { playerId: keepId } });
    }
  }

  // 4. Supprimer le doublon
  await prisma.player.delete({ where: { id: deleteId } });

  const parts = [];
  if (mpCount.count > 0) parts.push(`${mpCount.count} mp`);
  if (meCount.count > 0) parts.push(`${meCount.count} me`);
  if (delSeasons.length > 0) parts.push(`${delSeasons.length} sp`);
  const detail = parts.length > 0 ? ` [${parts.join(", ")}]` : "";
  console.log(`  ✓ ${deleteName} → ${keepName}${detail}`);
}

async function main() {
  console.log("=== Nettoyage automatique des doublons ===\n");

  // Charger tous les joueurs avec leur nombre de matchs
  const players = await prisma.player.findMany({
    select: { id: true, firstName: true, lastName: true },
    orderBy: { lastName: "asc" },
  });

  // Compter les matchs par joueur
  const matchCounts: Record<string, number> = {};
  for (const p of players) {
    const count = await prisma.matchPlayer.count({ where: { playerId: p.id } });
    matchCounts[p.id] = count;
  }

  // Grouper par nom de famille normalisé
  const groups: Record<string, typeof players> = {};
  for (const p of players) {
    const key = normalize(p.lastName);
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  let merged = 0;

  for (const [lastNameKey, group] of Object.entries(groups)) {
    if (group.length < 2) continue;

    // Pour chaque paire dans le groupe
    const toDelete = new Set<string>();

    for (let i = 0; i < group.length; i++) {
      if (toDelete.has(group[i].id)) continue;

      for (let j = i + 1; j < group.length; j++) {
        if (toDelete.has(group[j].id)) continue;

        const a = group[i];
        const b = group[j];

        // Vérifier si c'est connu comme joueurs différents
        if (isKnownDifferent(a.lastName, a.firstName, b.firstName)) continue;
        if (isKnownDifferent(b.lastName, b.firstName, a.firstName)) continue;

        // Vérifier si les prénoms sont similaires
        if (!isSamePlayer(a.firstName, b.firstName)) continue;

        // Fusionner : garder celui avec le plus de matchs
        const countA = matchCounts[a.id] || 0;
        const countB = matchCounts[b.id] || 0;

        let keep, del;
        if (countA >= countB) {
          keep = a; del = b;
        } else {
          keep = b; del = a;
        }

        console.log(`${keep.lastName}: "${del.firstName}" (${matchCounts[del.id]}m) → "${keep.firstName}" (${matchCounts[keep.id]}m)`);
        await mergePlayer(keep.id, del.id, `${keep.firstName} ${keep.lastName}`, `${del.firstName} ${del.lastName}`);
        toDelete.add(del.id);
        merged++;
      }
    }
  }

  console.log(`\n=== Terminé : ${merged} doublon(s) fusionné(s) ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

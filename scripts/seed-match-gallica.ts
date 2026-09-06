/**
 * Une rencontre d'avant-guerre, reconstituée depuis la presse de Gallica —
 * **en simulation seulement**, et c'est délibéré.
 *
 * Ce que le script fait : il retrouve le numéro du lendemain, les pages où
 * Perpignan est nommé, lit leur OCR par `lib/gallica.ts`, en tire les deux
 * XV par lignes, le capitaine, l'arbitre, le score et la mi-temps quand un
 * titre les porte, puis confronte chaque nom aux fiches de la base. Il
 * imprime tout cela, avec ce qui ne concorde pas.
 *
 * Ce qu'il ne fait pas, et refuse de faire : **écrire**. Trois raisons,
 * toutes dans CLAUDE.md, « Remonter avant 2006 » :
 *   - la base ne sait pas dire « probable, d'après *L'Auto* du 4 mai 1925,
 *     relu par Jérémy » — elle n'a que l'affirmé et l'inconnu, et une
 *     composition lue par un OCR n'est ni l'un ni l'autre ;
 *   - un essai vaut trois points en 1925, et le barème est en dur à quatre
 *     endroits ;
 *   - et les noms sortent abîmés — « Raruis » pour Ramis —, chacun devant
 *     être relu sur l'image avant de devenir une fiche.
 * Lancé sans `--dry`, il s'arrête en le disant.
 *
 * **Le garde-fou** : le score de Wikipédia, en dur dans `MATCHS`, doit se
 * retrouver dans le journal ; chaque ligne du XV doit compter ses hommes —
 * un arrière, quatre trois-quarts, deux demis, trois, deux et trois avants.
 *
 * Usage :
 *   npx tsx scripts/seed-match-gallica.ts --match=1925-05-03 --dry
 *
 * Quatre finales dans `MATCHS`, et ce que chacune a rendu le 6 septembre
 * 2026 : 1914, deux XV complets, la mi-temps, l'arbitre, une chronologie à
 * l'heure de l'horloge ; 1921, un OCR trop abîmé pour les en-têtes, les
 * avants lisibles ; 1925, deux XV dont un à quatorze, l'arbitre ; 1938,
 * le score et la mi-temps du titre, la page des équipes illisible.
 */

import { PrismaClient } from "@prisma/client";
import {
  EFFECTIF_DES_LIGNES,
  fasciculeDuJour,
  lireArbitre,
  lireChronologieHoraire,
  lireEquipes,
  lirePage,
  lireScoreEtMiTemps,
  pagesContenant,
  type Periodique,
} from "./lib/gallica";
import { chercherJoueur } from "./lib/joueurs";

const prisma = new PrismaClient();

interface MatchDeJournal {
  competition: string;
  tour: string;
  adversaire: string;
  /** D'après Wikipédia : le garde-fou. */
  scoreUsap: number;
  scoreOpponent: number;
  lieu: string;
  journal: Periodique;
  /** Le numéro qui rend compte du match, en général celui du lendemain. */
  numero: string;
  note: string;
}

const MATCHS: Record<string, MatchDeJournal> = {
  "1914-05-03": {
    competition: "Championnat de France",
    tour: "Finale",
    adversaire: "Tarbes",
    scoreUsap: 8,
    scoreOpponent: 7,
    lieu: "Toulouse, stade des Ponts-Jumeaux",
    journal: "L'Auto",
    numero: "1914-05-04",
    note:
      "Premier titre, sous le nom de l'Association sportive perpignanaise, contre le Stadoceste tarbais. " +
      "8-7, 0-0 à la mi-temps, arbitre Charles Gondouin, d'après Wikipédia, « Championnat de France de rugby à XV 1913-1914 ».",
  },
  "1921-04-17": {
    competition: "Championnat de France",
    tour: "Finale",
    adversaire: "Toulouse",
    scoreUsap: 5,
    scoreOpponent: 0,
    lieu: "Béziers, stade de Sauclières",
    journal: "L'Auto",
    numero: "1921-04-18",
    note:
      "Deuxième titre, sous le nom de l'US Perpignanaise, contre le Stade toulousain. Score 5-0 d'après l'article " +
      "de Wikipédia sur le club ; la page de la saison 1920-1921 ne détaille pas sa finale — c'est le journal qui confirmera.",
  },
  "1925-05-03": {
    competition: "Championnat de France",
    tour: "Finale",
    adversaire: "Carcassonne",
    scoreUsap: 5,
    scoreOpponent: 0,
    lieu: "Narbonne",
    journal: "L'Auto",
    numero: "1925-05-04",
    note:
      "Finale à rejouer : la première, le 26 avril à Toulouse, s'était achevée 0-0. " +
      "Troisième titre de l'US Perpignanaise. Score et date d'après Wikipédia, « Championnat de France de rugby à XV 1924-1925 ».",
  },
  "1938-05-08": {
    competition: "Championnat de France",
    tour: "Finale",
    adversaire: "Biarritz",
    scoreUsap: 11,
    scoreOpponent: 6,
    lieu: "Toulouse",
    journal: "L'Auto",
    numero: "1938-05-09",
    note:
      "Premier titre sous le nom de l'USAP, contre le Biarritz olympique, d'après Wikipédia, « Championnat de France de rugby à XV 1937-1938 ». " +
      "Le score, 11-6 avec 5-6 à la mi-temps, est celui du titre de L'Auto lui-même : la page de Wikipédia ne le donne pas.",
  },
};

function argument(nom: string): string | undefined {
  const prefixe = `--${nom}=`;
  return process.argv.find((a) => a.startsWith(prefixe))?.slice(prefixe.length);
}

async function main() {
  const dry = process.argv.includes("--dry");
  const jour = argument("match");
  const match = jour ? MATCHS[jour] : undefined;
  if (!jour || !match) {
    console.error(`Usage : npx tsx scripts/seed-match-gallica.ts --match=AAAA-MM-JJ --dry\nRencontres connues : ${Object.keys(MATCHS).join(", ")}`);
    process.exit(1);
  }
  if (!dry) {
    console.error(
      "Ce script ne sait pas écrire, et c'est voulu : la base n'a pas d'état de provenance pour une composition lue " +
        "dans un journal, et le barème de 1925 n'est pas porté. Relancer avec --dry ; cf. l'en-tête.",
    );
    process.exit(1);
  }

  console.log(`=== ${jour} ${match.tour} ${match.competition} — USAP ${match.scoreUsap}-${match.scoreOpponent} ${match.adversaire} (simulation) ===`);
  console.log(`  source : ${match.journal} du ${match.numero}, dans Gallica\n`);

  const ark = await fasciculeDuJour(match.journal, match.numero);
  if (!ark) {
    console.log(`  ⚠ aucun numéro de ${match.journal} au ${match.numero} dans Gallica.`);
    return;
  }
  const pages = await pagesContenant(ark, "Perpignan");
  console.log(`  fascicule ${ark}, Perpignan nommé en page${pages.length > 1 ? "s" : ""} ${pages.join(", ") || "aucune"}`);

  const avertissements: string[] = [];
  let equipesTrouvees = false;
  for (const page of pages) {
    const lignes = await lirePage(ark, page);
    const illisibles = lignes.filter((l) => /\[texte (illisible|non reconnu)\]/.test(l)).length;
    console.log(`\n  — page ${page} : ${lignes.length} lignes d'OCR${illisibles ? `, ${illisibles} illisibles` : ""}`);

    const scores = lireScoreEtMiTemps(lignes).filter(
      (s) => (s.score[0] === match.scoreUsap && s.score[1] === match.scoreOpponent) || (s.score[1] === match.scoreUsap && s.score[0] === match.scoreOpponent),
    );
    for (const s of scores.slice(0, 2)) {
      console.log(
        `    score « ${s.score[0]} à ${s.score[1]} » retrouvé` +
          (s.miTemps ? `, mi-temps ${s.miTemps[0]}-${s.miTemps[1]}` : "") +
          (s.detail ? `, « ${s.detail[0]} » contre « ${s.detail[1]} »` : ""),
      );
    }
    const arbitre = lireArbitre(lignes);
    if (arbitre) console.log(`    arbitre : M. ${arbitre}`);
    const faits = lireChronologieHoraire(lignes);
    if (faits.length) {
      console.log(`    chronologie à l'heure de l'horloge, ${faits.length} fait(s) :`);
      for (const f of faits) console.log(`      ${f.heure} h ${String(f.minute).padStart(2, "0")}  ${f.texte}`);
    }

    const equipes = lireEquipes(lignes, ["Perpign", match.adversaire]);
    if (!equipes.length) continue;
    equipesTrouvees = true;
    for (const xv of equipes) {
      const total = xv.lignes.reduce((n, l) => n + l.noms.length, 0);
      console.log(`\n    ${xv.club} — ${total} noms${xv.capitaine ? `, capitaine ${xv.capitaine}` : ", capitaine non marqué"}`);
      for (const l of xv.lignes) {
        if (l.ligne === "?") {
          console.log(`      ${"sans en-tête".padEnd(16)} ${l.noms.join(", ")}  ⚠ l'OCR a perdu la ligne`);
          avertissements.push(`${xv.club} : ${l.noms.length} nom(s) dont l'OCR a perdu la ligne`);
          continue;
        }
        const attendu = EFFECTIF_DES_LIGNES[l.ligne];
        const ecart = l.noms.length === attendu ? "" : `  ⚠ ${l.noms.length} pour ${attendu}`;
        console.log(`      ${l.ligne.padEnd(16)} ${l.noms.join(", ")}${ecart}`);
        if (ecart) avertissements.push(`${xv.club}, ${l.ligne} : ${l.noms.length} nom(s) pour ${attendu}`);
      }
      if (total !== 15) avertissements.push(`${xv.club} : ${total} noms pour 15`);

      // Chaque nom confronté à la base, en lecture seule. Un nom de 1925 n'y
      // sera presque jamais : c'est attendu, la base commence en 2004-2005.
      const silencieux = () => {};
      const enBase: string[] = [];
      for (const l of xv.lignes) {
        for (const nom of l.noms) {
          try {
            const id = await chercherJoueur(prisma, { firstName: "", lastName: nom }, silencieux);
            if (id) enBase.push(nom);
          } catch {
            enBase.push(`${nom} (plusieurs fiches)`);
          }
        }
      }
      console.log(`      en base : ${enBase.length ? enBase.join(", ") : "aucun — toutes les fiches seraient à créer, après relecture"}`);
    }
  }

  if (!equipesTrouvees) avertissements.push("aucun bloc « Les équipes se présentèrent comme suit » lisible");
  console.log(`\n=== ${avertissements.length} avertissement(s) ===`);
  for (const a of avertissements) console.log(`  ⚠ ${a}`);
  console.log("\nSimulation — rien n'est écrit, et rien ne le sera tant que la base ne porte pas la provenance d'une composition (cf. l'en-tête).");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

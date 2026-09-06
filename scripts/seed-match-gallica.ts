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
 *   - la base sait dire « probable, d'après *L'Auto* du 4 mai 1925, relu
 *     par Jérémy » depuis le 6 septembre 2026 — la table `attestations` —,
 *     mais aucun nom n'a encore été relu, et une composition lue par un OCR
 *     n'est ni affirmée ni inconnue tant qu'elle ne l'est pas ;
 *   - un essai vaut trois points en 1925 — `baremeDeMatch` le sait depuis
 *     le 6 septembre 2026, et la décomposition de 1914 le vérifie ✓ —, mais
 *     aucun script d'écriture n'a encore été relu sous ce barème ;
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
  lireDecomposition,
  lireEquipes,
  lirePage,
  lireScoreEtMiTemps,
  pagesContenant,
  type LigneDuXV,
  type Periodique,
} from "./lib/gallica";
import { chercherJoueur } from "./lib/joueurs";
import { baremeDeMatch, pointsDesRealisations } from "../src/lib/scoring";

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

/**
 * LA RELECTURE SUR L'IMAGE.
 *
 * L'OCR abîme les noms, et une composition ne vaut rien tant qu'un humain ne
 * l'a pas relue sur l'original. Le 6 septembre 2026, les blocs « Les
 * équipes » des numéros de 1914 et de 1925 ont été découpés dans l'image de
 * Gallica — par IIIF, aux coordonnées que l'ALTO donne de chaque ligne — et
 * relus par Claude, puis confrontés aux XV que Wikipédia donne des deux
 * finales, prénoms compris. Les deux sources concordent à quinze sur quinze
 * pour les quatre équipes, à l'orthographe près : le journal écrit Sicard,
 * Seyroux, Couffe, Amillat, Serres, Fournier, Nauté, Galiay, Dufour là où
 * Wikipédia écrit Sicart, Sayrou, Couffé, Amilhat, Serre, Fournié, Naute,
 * Gallay, Duffour.
 *
 * **Ce que la table affirme** : le nom tel que le journal l'imprime, lu sur
 * l'image et non sur l'OCR, dans l'ordre du journal, ligne par ligne ; et en
 * regard, le nom complet de Wikipédia. **Ce qu'elle n'affirme pas** :
 * laquelle des deux orthographes est la bonne — c'est à Jérémy de trancher,
 * et `valide` reste `false` tant qu'il ne l'a pas fait. Rien ne s'écrit
 * avant.
 */
interface XVRelu {
  club: string;
  lignes: { ligne: LigneDuXV; noms: string[] }[];
  capitaine: string;
  /** Les quinze de Wikipédia, prénom et nom, dans l'ordre du journal. */
  wikipedia: string[];
}

interface Relecture {
  reluPar: string;
  reluLe: string;
  /** L'image relue, par IIIF : région de la page, aux coordonnées de l'ALTO. */
  image: string;
  /** Tranché par Jérémy ? Tant que non, la simulation propose et le script refuse d'écrire. */
  valide: boolean;
  equipes: XVRelu[];
}

const RELECTURES: Record<string, Relecture> = {
  "1914-05-03": {
    reluPar: "Claude, sur l'image, confronté à Wikipédia « Championnat de France de rugby à XV 1913-1914 »",
    reluLe: "2026-09-06",
    image: "https://gallica.bnf.fr/iiif/ark:/12148/bpt6k4626515t/f1/5522,4780,1080,850/full/0/native.jpg",
    valide: false,
    equipes: [
      {
        club: "Perpignan",
        capitaine: "",
        lignes: [
          { ligne: "arrière", noms: ["Couffe"] },
          { ligne: "trois-quarts", noms: ["Amillat", "Courregé", "Barbe", "Serres"] },
          { ligne: "demis", noms: ["Giral", "Fournier"] },
          { ligne: "première ligne", noms: ["Joué", "Schuller", "Cutzach"] },
          { ligne: "deuxième ligne", noms: ["Gravas", "Nauté"] },
          { ligne: "troisième ligne", noms: ["Lacarra", "Roques", "Lyda"] },
        ],
        wikipedia: [
          "Joseph Couffé", "Joseph Amilhat", "Max Courregé", "Félix Barbe", "Paul Serre", "Aimé Giral", "François Fournié",
          "Edouard Joué", "Raymond Schuller", "André Cutzach", "Maurice Gravas", "François Naute", "Georges Lacarra", "Jean Roques", "Joseph Lyda",
        ],
      },
      {
        club: "Tarbes",
        capitaine: "",
        lignes: [
          { ligne: "arrière", noms: ["Caujolle"] },
          { ligne: "trois-quarts", noms: ["Cazajous", "Gardex", "Sentilles", "Lacoste"] },
          { ligne: "demis", noms: ["Pourtau", "Laterrade"] },
          { ligne: "première ligne", noms: ["Lastegaray", "Faure", "Dufour"] },
          { ligne: "deuxième ligne", noms: ["Labeyrie", "Mousseigne"] },
          { ligne: "troisième ligne", noms: ["Lavigne", "Vogt", "Galiay"] },
        ],
        wikipedia: [
          "Jean Caujolle", "Albert Cazajous", "Amédée Gardex", "Jean Sentilles", "Robert Lacoste", "Jean Pourtau", "Guillaume Laterrade",
          "Jean-Marcellin Lastegaray", "Félix Faure", "René Duffour", "Maurice Labeyrie", "Emile Mousseigne", "Roger Lavigne", "Albert Vogt", "Paul Gallay",
        ],
      },
    ],
  },
  "1925-05-03": {
    reluPar: "Claude, sur l'image, confronté à Wikipédia « Championnat de France de rugby à XV 1924-1925 »",
    reluLe: "2026-09-06",
    image: "https://gallica.bnf.fr/iiif/ark:/12148/bpt6k4684973p/f5/356,4540,1090,540/full/0/native.jpg",
    valide: false,
    equipes: [
      {
        club: "Carcassonne",
        capitaine: "Jean Sebédio",
        lignes: [
          { ligne: "arrière", noms: ["Andrieu"] },
          { ligne: "trois-quarts", noms: ["Gleyzes", "Roux", "Miquel", "Domec"] },
          { ligne: "demis", noms: ["Marty", "Darsans"] },
          { ligne: "troisième ligne", noms: ["Jean Sebédio", "Joseph Raynaud", "Siguier"] },
          { ligne: "deuxième ligne", noms: ["Cadenat", "Germain Raynaud"] },
          { ligne: "première ligne", noms: ["Castérot", "Mauran", "Aguado"] },
        ],
        wikipedia: [
          "François Andrieu", "Henri Gleyzes", "Jean Roux", "Albert Miquel", "Albert Domec", "Philippe Marty", "Jean Darsans",
          "Jean Sébédio", "Joseph Raynaud", "Henri Siguier", "Georges Cadenat", "Germain Raynaud", "Jean Castérot", "Roger Mauran", "Étienne Aguado",
        ],
      },
      {
        club: "Perpignan",
        capitaine: "Ramis",
        lignes: [
          { ligne: "arrière", noms: ["Cayrol"] },
          { ligne: "trois-quarts", noms: ["Darné", "Ramis", "Baillette", "Tabès"] },
          { ligne: "demis", noms: ["Pascot", "Carbonne"] },
          { ligne: "troisième ligne", noms: ["Ribère", "Camo", "Sicard"] },
          { ligne: "deuxième ligne", noms: ["Rière", "Henric"] },
          { ligne: "première ligne", noms: ["Montade", "Delort", "Seyroux"] },
        ],
        wikipedia: [
          "Étienne Cayrol", "Marcel Darné", "Roger Ramis", "Marcel Baillette", "René Tabès", "Joseph Pascot", "Jean Carbonne",
          "Eugène Ribère", "Ernest Camo", "Noël Sicart", "André Rière", "Marcel Henric", "Camille Montade", "Georges Delort", "Joseph Sayrou",
        ],
      },
    ],
  },
};

/**
 * Deux graphies d'un même nom, ou deux hommes ? On compare les patronymes,
 * accents ôtés, à la distance d'édition : deux lettres au plus font une
 * variante — Seyroux et Sayrou, Galiay et Gallay, Amillat et Amilhat —, au
 * delà ce sont deux noms. C'est un tri pour la lecture, pas un verdict :
 * le verdict est celui de Jérémy.
 */
function memeNomDeJournal(journal: string, wikipedia: string): "identique" | "variante" | "différent" {
  const n = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
  const a = n(journal.split(" ").slice(-1)[0]);
  const b = n(wikipedia.split(" ").slice(-1)[0]);
  if (a === b) return "identique";
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length] <= 2 ? "variante" : "différent";
}

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
      "Ce script ne sait pas encore écrire : la relecture des noms sur l'image attend la validation de Jérémy " +
        "(cf. RELECTURES, `valide`). Relancer avec --dry ; cf. l'en-tête.",
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
      // La décomposition du journal, confrontée au barème de l'époque : c'est
      // le barème qui est vérifié autant que le journal.
      if (s.detail) {
        const bareme = baremeDeMatch(Number(jour.slice(0, 4)) - (Number(jour.slice(5, 7)) < 8 ? 1 : 0));
        s.detail.forEach((d, i) => {
          const r = lireDecomposition(d);
          if (!r) {
            avertissements.push(`décomposition « ${d} » : un mot que le barème ne sait pas dire`);
            return;
          }
          const total = pointsDesRealisations(r, bareme);
          const ok = total === s.score[i];
          console.log(
            `      ${ok ? "✓" : "✗"} « ${d} » = ${r.essais}×${bareme.essai} + ${r.transformations}×${bareme.transformation} + ${r.penalites}×${bareme.penalite} + ${r.drops}×${bareme.drop} = ${total}${ok ? "" : ` ≠ ${s.score[i]}`}`,
          );
          if (!ok) avertissements.push(`décomposition « ${d} » : ${total} points sous le barème de ${bareme.essai}/${bareme.transformation}/${bareme.penalite}/${bareme.drop}, pour ${s.score[i]}`);
        });
      }
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

  // ---- La relecture sur l'image, en regard de l'OCR et de Wikipédia -------
  const relecture = RELECTURES[jour];
  if (relecture) {
    console.log(`\n  — relecture sur l'image (${relecture.reluLe}, ${relecture.reluPar})${relecture.valide ? ", validée par Jérémy" : " — À VALIDER PAR JÉRÉMY"}`);
    console.log(`    ${relecture.image}`);
    for (const xv of relecture.equipes) {
      const lus = xv.lignes.flatMap((l) => l.noms);
      console.log(`\n    ${xv.club} — ${lus.length} noms lus${xv.capitaine ? `, capitaine ${xv.capitaine}` : ""}, ${xv.wikipedia.length} chez Wikipédia`);
      let k = 0;
      for (const l of xv.lignes) {
        for (const nom of l.noms) {
          const w = xv.wikipedia[k++] ?? "—";
          const verdict = memeNomDeJournal(nom, w);
          const marque = verdict === "identique" ? " " : verdict === "variante" ? "≈" : "✗";
          console.log(`      ${marque} ${l.ligne.padEnd(16)} ${nom.padEnd(18)} ${w}`);
          if (verdict === "différent") avertissements.push(`${xv.club} : « ${nom} » lu sur l'image, « ${w} » chez Wikipédia — ce n'est pas le même homme`);
        }
      }
      if (lus.length !== 15) avertissements.push(`${xv.club} : ${lus.length} noms lus sur l'image pour 15`);
      if (xv.wikipedia.length !== 15) avertissements.push(`${xv.club} : ${xv.wikipedia.length} noms chez Wikipédia pour 15`);
    }
    console.log("\n    ≈ : deux graphies d'un même nom, à trancher ; ✗ : deux hommes.");
  }
  console.log(`\n=== ${avertissements.length} avertissement(s) ===`);
  for (const a of avertissements) console.log(`  ⚠ ${a}`);
  console.log(
    "\nSimulation — rien n'est écrit" +
      (relecture ? (relecture.valide ? "." : ", et rien ne le sera tant que Jérémy n'a pas validé la relecture (cf. RELECTURES).") : ", et rien ne le sera tant que les noms n'ont pas été relus sur l'image (cf. RELECTURES)."),
  );
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

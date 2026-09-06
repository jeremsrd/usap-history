/**
 * Une rencontre d'avant-guerre, reconstituée depuis la presse de Gallica.
 *
 * **En simulation**, le script retrouve le numéro du lendemain, les pages où
 * Perpignan est nommé, lit leur OCR par `lib/gallica.ts`, en tire les deux XV
 * par lignes, le capitaine, l'arbitre, le score et la mi-temps quand un titre
 * les porte, confronte chaque décomposition du score au barème de l'époque et
 * chaque nom à la base — puis affiche la **relecture sur l'image** en regard
 * de l'OCR et de Wikipédia (cf. `RELECTURES`).
 *
 * **En écriture**, il ne s'appuie plus sur l'OCR mais sur la relecture, et
 * refuse tant qu'elle n'est pas validée par Jérémy. Il crée la rencontre,
 * les deux XV, les réalisations et — pour 1914, qui a une chronologie à
 * l'heure de l'horloge — la ligne de temps ; il pose une **attestation** sur
 * chaque fait venu du journal, par `lib/attestations.ts`, avec l'image relue
 * pour adresse. Le barème est celui de l'époque, `baremeDeMatch`.
 *
 * **Ce que la base dit, et ne dit pas, d'un match de 1914** :
 *   - les XV dans l'ordre du journal, ligne par ligne, **sans numéro de
 *     maillot** — il n'y en avait pas —, et le poste réellement tenu n'est
 *     porté que là où la ligne le dit sans ambiguïté : arrière, deuxième
 *     ligne, et les demis quand le journal écrit « (ouverture) » et
 *     « (mêlée) ». Un trois-quarts, un troisième ligne, un pilier restent
 *     sans poste plutôt que d'en recevoir un deviné ; la ligne est en note ;
 *   - aucune minute de jeu : « la source ne le dit pas » ;
 *   - la chronologie de 1914 en **minutes déduites de l'horloge** — reprise
 *     à 4 h 00, donc 40 + les minutes écoulées —, ce qui suppose que
 *     l'horloge du journal ne s'arrête pas : la description garde l'heure,
 *     et l'attestation dit la règle.
 *
 * **Le garde-fou** : le score de Wikipédia doit se retrouver dans le journal,
 * chaque ligne du XV doit compter ses hommes, et la somme des réalisations
 * de chaque camp, sous le barème de l'époque, doit faire son score.
 *
 * Usage :
 *   npx tsx scripts/seed-match-gallica.ts --match=1925-05-03 --dry
 *   npx tsx scripts/seed-match-gallica.ts --match=1925-05-03
 *
 * Quatre finales dans `MATCHS`, et ce que chacune a rendu le 6 septembre
 * 2026 : 1914, deux XV complets, la mi-temps, l'arbitre, une chronologie à
 * l'heure de l'horloge ; 1921, un OCR trop abîmé pour les en-têtes, les
 * avants lisibles ; 1925, deux XV dont un à quatorze — l'image le complète —,
 * l'arbitre ; 1938, le score et la mi-temps du titre, la page des équipes
 * illisible. **1914 et 1925 sont écrites**, relues sur l'image et validées.
 */

import { PrismaClient, EventType, MatchResult, type DegreAttestation, type Position } from "@prisma/client";
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
import { chercherJoueur, trouverOuCreerJoueur } from "./lib/joueurs";
import { trouverOuCreerArbitre } from "./lib/arbitres";
import { attester, type Attestation } from "./lib/attestations";
import { baremeDeMatch, pointsDesRealisations } from "../src/lib/scoring";
import { generateMatchSlug, generateVenueSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

interface Realisation {
  camp: "usap" | "adversaire";
  /** Le nom tel que le journal l'écrit, celui des `lignes` de la relecture. */
  nom: string;
  essais?: number;
  transformations?: number;
  penalites?: number;
  drops?: number;
}

interface FaitDeChronologie {
  /** L'heure du journal, en clair. */
  horloge: string;
  /** La minute de jeu déduite — cf. l'en-tête. */
  minute: number;
  type: EventType;
  camp: "usap" | "adversaire";
  nom: string;
}

interface MatchDeJournal {
  competition: string;
  tour: string;
  adversaire: string;
  /** D'après Wikipédia : le garde-fou. */
  scoreUsap: number;
  scoreOpponent: number;
  journal: Periodique;
  /** Le numéro qui rend compte du match, en général celui du lendemain. */
  numero: string;
  note: string;
  stade: { nom: string; ville: string; source: string; degre: DegreAttestation };
  arbitre: { nom: string; source: string; degre: DegreAttestation } | null;
  affluence: { valeur: number; source: string; degre: DegreAttestation } | null;
  miTemps: { usap: number; adversaire: number; source: string; degre: DegreAttestation } | null;
  /** « 15:03 » — le coup d'envoi à l'horloge du journal, ou rien. */
  coupDEnvoi: string | null;
  realisations: Realisation[];
  chronologie: FaitDeChronologie[] | null;
}

const MATCHS: Record<string, MatchDeJournal> = {
  "1914-05-03": {
    competition: "1ère série",
    tour: "Finale",
    adversaire: "Tarbes",
    scoreUsap: 8,
    scoreOpponent: 7,
    journal: "L'Auto",
    numero: "1914-05-04",
    note:
      "Premier titre, sous le nom de l'Association sportive perpignanaise, contre le Stadoceste tarbais. " +
      "8-7, 0-0 à la mi-temps, arbitre Charles Gondouin, d'après Wikipédia, « Championnat de France de rugby à XV 1913-1914 ».",
    stade: { nom: "Stade des Ponts-Jumeaux", ville: "Toulouse", source: "L'Auto du 4 mai 1914 — « le champ des Ponts-Jumeaux » — et Wikipédia", degre: "CONCORDANT" },
    arbitre: { nom: "Charles Gondouin", source: "L'Auto du 4 mai 1914 — « M. Gondouin » — et Wikipédia pour le prénom", degre: "CONCORDANT" },
    affluence: null,
    miTemps: { usap: 0, adversaire: 0, source: "L'Auto du 4 mai 1914 — « Première mi-temps. — PERPIGNAN : 0 ; TARBES : 0 » — et Wikipédia", degre: "CONCORDANT" },
    coupDEnvoi: "15:03",
    realisations: [
      { camp: "usap", nom: "Lyda", essais: 1 },
      { camp: "usap", nom: "Courregé", essais: 1 },
      { camp: "usap", nom: "Giral", transformations: 1 },
      { camp: "adversaire", nom: "Lastegaray", essais: 1 },
      { camp: "adversaire", nom: "Gardex", drops: 1 },
    ],
    // Coup d'envoi 3 h 03, fin de la première mi-temps 3 h 50, reprise
    // 4 h 00 : la minute de jeu de la seconde période vaut 40 + (heure − 4 h 00).
    chronologie: [
      { horloge: "4 h 10", minute: 50, type: EventType.ESSAI, camp: "adversaire", nom: "Lastegaray" },
      { horloge: "4 h 12", minute: 52, type: EventType.DROP, camp: "adversaire", nom: "Gardex" },
      { horloge: "4 h 26", minute: 66, type: EventType.ESSAI, camp: "usap", nom: "Lyda" },
      { horloge: "4 h 40", minute: 80, type: EventType.ESSAI, camp: "usap", nom: "Courregé" },
      { horloge: "4 h 41", minute: 81, type: EventType.TRANSFORMATION, camp: "usap", nom: "Giral" },
    ],
  },
  "1921-04-17": {
    competition: "1ère série",
    tour: "Finale",
    adversaire: "Toulouse",
    scoreUsap: 5,
    scoreOpponent: 0,
    journal: "L'Auto",
    numero: "1921-04-18",
    note:
      "Deuxième titre, sous le nom de l'US Perpignanaise, contre le Stade toulousain. Score 5-0 d'après l'article " +
      "de Wikipédia sur le club ; la page de la saison 1920-1921 ne détaille pas sa finale — c'est le journal qui confirmera.",
    stade: { nom: "Stade de Sauclières", ville: "Béziers", source: "Wikipédia", degre: "PROBABLE" },
    arbitre: null,
    affluence: null,
    miTemps: null,
    coupDEnvoi: null,
    realisations: [],
    chronologie: null,
  },
  "1925-05-03": {
    competition: "1ère série",
    tour: "Finale",
    adversaire: "Carcassonne",
    scoreUsap: 5,
    scoreOpponent: 0,
    journal: "L'Auto",
    numero: "1925-05-04",
    note:
      "Finale à rejouer : la première, le 26 avril à Toulouse, s'était achevée 0-0. " +
      "Troisième titre de l'US Perpignanaise. Score et date d'après Wikipédia, « Championnat de France de rugby à XV 1924-1925 ».",
    stade: { nom: "Stade de Maraussan", ville: "Narbonne", source: "L'Auto du 4 mai 1925 — « à Maraussan, terrain des luttes fameuses » — et Wikipédia", degre: "CONCORDANT" },
    arbitre: { nom: "Henri Vigné", source: "L'Auto du 4 mai 1925 — « M. Vigné, qui arbitra » — et Wikipédia pour le prénom", degre: "CONCORDANT" },
    affluence: { valeur: 20000, source: "L'Auto du 4 mai 1925 — « 20.000 spectateurs, sans exagération aucune » — et Wikipédia", degre: "CONCORDANT" },
    miTemps: { usap: 5, adversaire: 0, source: "L'Auto du 4 mai 1925 — la mi-temps survient « en laissant l'avantage aux Catalans par 5 points à 0 » — et Wikipédia", degre: "CONCORDANT" },
    coupDEnvoi: null,
    realisations: [{ camp: "usap", nom: "Ramis", essais: 1, transformations: 1 }],
    chronologie: null,
  },
  "1938-05-08": {
    competition: "1ère série",
    tour: "Finale",
    adversaire: "Biarritz",
    scoreUsap: 11,
    scoreOpponent: 6,
    journal: "L'Auto",
    numero: "1938-05-09",
    note:
      "Premier titre sous le nom de l'USAP, contre le Biarritz olympique, d'après Wikipédia, « Championnat de France de rugby à XV 1937-1938 ». " +
      "Le score, 11-6 avec 5-6 à la mi-temps, est celui du titre de L'Auto lui-même : la page de Wikipédia ne le donne pas.",
    stade: { nom: "Stade des Ponts-Jumeaux", ville: "Toulouse", source: "Wikipédia", degre: "PROBABLE" },
    arbitre: null,
    affluence: null,
    miTemps: null,
    coupDEnvoi: null,
    realisations: [],
    chronologie: null,
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
 * Seyroux, Couffe, Amillat, Serres, Fournier, Nauté, Galiay là où Wikipédia
 * écrit Sicart, Sayrou, Couffé, Amilhat, Serre, Fournié, Naute, Gallay —
 * huit graphies ; la neuvième, Duffour, le journal la tranche lui-même.
 *
 * **Jérémy a tranché le 6 septembre 2026 : les graphies de Wikipédia**, avec
 * le prénom. C'est le nom que la base porte ; celui du journal reste dans
 * la table, ligne par ligne, et dans l'attestation de chaque fiche.
 */
interface XVRelu {
  club: string;
  lignes: { ligne: LigneDuXV; noms: string[] }[];
  /** Le capitaine que le journal marque « (cap.) », ou rien. */
  capitaine: string;
  /** Le capitaine selon Wikipédia, quand le journal ne le marque pas. */
  capitaineWikipedia?: string;
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
  validePar?: string;
  equipes: XVRelu[];
}

const RELECTURES: Record<string, Relecture> = {
  "1914-05-03": {
    reluPar: "Claude, sur l'image, confronté à Wikipédia « Championnat de France de rugby à XV 1913-1914 »",
    reluLe: "2026-09-06",
    image: "https://gallica.bnf.fr/iiif/ark:/12148/bpt6k4626515t/f1/5522,4780,1080,850/full/0/native.jpg",
    valide: true,
    validePar: "Jérémy, le 6 septembre 2026 — les graphies de Wikipédia",
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
        // Wikipédia : « la sortie de son capitaine Duffour, côte fracturée ».
        capitaineWikipedia: "Duffour",
        lignes: [
          { ligne: "arrière", noms: ["Caujolle"] },
          { ligne: "trois-quarts", noms: ["Cazajous", "Gardex", "Sentilles", "Lacoste"] },
          { ligne: "demis", noms: ["Pourtau", "Laterrade"] },
          // « Du-four » coupé en fin de ligne dans la composition, mais
          // « Duffour » deux fois dans le même numéro — le récit, « Duffour,
          // touché, n'était guère utile à son équipe », et la chronologie,
          // « 3 h. 34 : Duffour est touché », « 3 h. 36 : Duffour revient ».
          // C'est le journal qui tranche sa propre graphie. Jérémy ne le
          // connaissait pas : c'est un Tarbais, pas un Catalan.
          { ligne: "première ligne", noms: ["Lastegaray", "Faure", "Duffour"] },
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
    valide: true,
    validePar: "Jérémy, le 6 septembre 2026 — les graphies de Wikipédia",
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
  const n = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
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

/**
 * Le poste que la ligne dit sans ambiguïté, et rien d'autre. Un trois-quarts
 * peut être ailier ou centre, un troisième ligne aile ou numéro 8, un
 * premier ligne pilier ou talonneur : le journal ne le dit pas, la base non
 * plus. Les demis le disent quand le journal écrit « (ouverture) » et
 * « (mêlée) » — c'est le cas de 1914, dans l'ordre du journal.
 */
function posteDeLaLigne(ligne: LigneDuXV, rang: number, jour: string): Position | null {
  if (ligne === "arrière") return "ARRIERE";
  if (ligne === "deuxième ligne") return "DEUXIEME_LIGNE";
  if (ligne === "demis" && jour === "1914-05-03") return rang === 0 ? "DEMI_OUVERTURE" : "DEMI_DE_MELEE";
  return null;
}

function saisonDe(jour: string): string {
  const annee = Number(jour.slice(0, 4));
  const debut = Number(jour.slice(5, 7)) < 8 ? annee - 1 : annee;
  return `${debut}-${debut + 1}`;
}

function separer(complet: string): { firstName: string; lastName: string } {
  const mots = complet.trim().split(/\s+/);
  return { firstName: mots.slice(0, -1).join(" "), lastName: mots[mots.length - 1] };
}

function argument(nom: string): string | undefined {
  const prefixe = `--${nom}=`;
  return process.argv.find((a) => a.startsWith(prefixe))?.slice(prefixe.length);
}

// =============================================================================
// SIMULATION : CE QUE LE JOURNAL DIT
// =============================================================================

async function simuler(jour: string, match: MatchDeJournal): Promise<void> {
  console.log(`=== ${jour} ${match.tour} — USAP ${match.scoreUsap}-${match.scoreOpponent} ${match.adversaire} (simulation) ===`);
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
        const bareme = baremeDeMatch(Number(saisonDe(jour).slice(0, 4)));
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

  const relecture = RELECTURES[jour];
  if (relecture) {
    console.log(`\n  — relecture sur l'image (${relecture.reluLe}, ${relecture.reluPar})${relecture.valide ? `, validée par ${relecture.validePar}` : " — À VALIDER PAR JÉRÉMY"}`);
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
      (relecture ? (relecture.valide ? " ; relancer sans --dry pour écrire." : ", et rien ne le sera tant que Jérémy n'a pas validé la relecture (cf. RELECTURES).") : ", et rien ne le sera tant que les noms n'ont pas été relus sur l'image (cf. RELECTURES)."),
  );
}

// =============================================================================
// ÉCRITURE : CE QUE LA RELECTURE VALIDÉE PERMET
// =============================================================================

async function ecrire(jour: string, match: MatchDeJournal, relecture: Relecture): Promise<void> {
  const label = saisonDe(jour);
  const bareme = baremeDeMatch(Number(label.slice(0, 4)));
  console.log(`=== ${jour} ${match.tour} — USAP ${match.scoreUsap}-${match.scoreOpponent} ${match.adversaire} — écriture ===`);
  console.log(`  ${match.journal} du ${match.numero} ; relecture validée par ${relecture.validePar}`);
  console.log(`  barème ${label} : essai ${bareme.essai}, transformation ${bareme.transformation}, pénalité ${bareme.penalite}, drop ${bareme.drop}\n`);

  // ---- Le garde-fou arithmétique, avant tout ------------------------------
  for (const camp of ["usap", "adversaire"] as const) {
    const r = match.realisations.filter((x) => x.camp === camp);
    const total = r.reduce((s, x) => s + pointsDesRealisations(x, bareme), 0);
    const score = camp === "usap" ? match.scoreUsap : match.scoreOpponent;
    if (total !== score) throw new Error(`${camp} : ${total} points de réalisations sous le barème de ${label}, pour ${score} au score`);
  }
  for (const xv of relecture.equipes) {
    const n = xv.lignes.reduce((s, l) => s + l.noms.length, 0);
    if (n !== 15 || xv.wikipedia.length !== 15) throw new Error(`${xv.club} : ${n} noms lus, ${xv.wikipedia.length} chez Wikipédia — il en faut quinze et quinze`);
  }

  // ---- Les entités autour de la rencontre ---------------------------------
  const saison = await prisma.season.findFirstOrThrow({ where: { label } });
  const competition = await prisma.competition.findFirstOrThrow({ where: { shortName: match.competition } });
  const adversaire = await prisma.opponent.findFirstOrThrow({ where: { shortName: match.adversaire } });

  let stade = await prisma.venue.findFirst({ where: { name: match.stade.nom, city: match.stade.ville }, select: { id: true } });
  if (!stade) {
    const cree = await prisma.venue.create({ data: { name: match.stade.nom, city: match.stade.ville, slug: `temp-${Date.now()}` } });
    stade = await prisma.venue.update({ where: { id: cree.id }, data: { slug: generateVenueSlug(match.stade.nom, match.stade.ville, cree.id) }, select: { id: true } });
    console.log(`  [stade] créé : ${match.stade.nom}, ${match.stade.ville}`);
    await attester(prisma, { entite: "Venue", entiteId: stade.id, degre: match.stade.degre, source: match.stade.source, note: "Stade créé pour cette rencontre ; ni la LNR ni l'EPCR n'existaient." });
  }

  const refereeId = match.arbitre ? await trouverOuCreerArbitre(prisma, match.arbitre.nom, false) : null;

  // ---- Les joueurs : la graphie de Wikipédia, la ligne du journal ---------
  interface Aligne {
    playerId: string;
    cree: boolean;
    nomJournal: string;
    nomWikipedia: string;
    ligne: LigneDuXV;
    rang: number;
    capitaine: boolean;
  }
  const alignes: { camp: "usap" | "adversaire"; joueurs: Aligne[] }[] = [];
  for (const xv of relecture.equipes) {
    const camp: "usap" | "adversaire" = /perpign/i.test(xv.club) ? "usap" : "adversaire";
    const joueurs: Aligne[] = [];
    let k = 0;
    for (const l of xv.lignes) {
      l.noms.forEach((nomJournal, rang) => {
        const nomWikipedia = xv.wikipedia[k++];
        joueurs.push({ playerId: "", cree: false, nomJournal, nomWikipedia, ligne: l.ligne, rang, capitaine: false });
      });
    }
    const cap = xv.capitaine || xv.capitaineWikipedia || "";
    if (cap) {
      const c = joueurs.find((j) => j.nomJournal === cap || j.nomJournal.endsWith(cap));
      if (!c) throw new Error(`${xv.club} : capitaine « ${cap} » introuvable dans le XV`);
      c.capitaine = true;
    }
    for (const j of joueurs) {
      const officiel = separer(j.nomWikipedia);
      const existant = await chercherJoueur(prisma, officiel, () => {});
      j.cree = !existant;
      j.playerId = existant ?? (await trouverOuCreerJoueur(prisma, officiel, { dryRun: false, journal: (m) => console.log(`    ${m}`) }));
      const poste = posteDeLaLigne(j.ligne, j.rang, jour);
      if (poste && j.cree) await prisma.player.update({ where: { id: j.playerId }, data: { position: poste } });
      const graphie = j.nomJournal.split(" ").slice(-1)[0] !== officiel.lastName ? ` (le journal écrit « ${j.nomJournal} »)` : "";
      console.log(`  ${(camp === "usap" ? "USAP" : match.adversaire).padEnd(12)} ${j.ligne.padEnd(16)} ${j.nomWikipedia.padEnd(28)} ${j.cree ? "créé" : "en base"}${graphie}`);
      if (j.cree) {
        await attester(prisma, {
          entite: "Player",
          entiteId: j.playerId,
          degre: "PROBABLE",
          source: `${match.journal} du ${match.numero}, composition de la finale, relu sur l'image ; graphie de Wikipédia`,
          sourceUrl: relecture.image,
          note:
            (graphie ? `Le journal écrit « ${j.nomJournal} ». ` : "") +
            `${j.ligne[0].toUpperCase()}${j.ligne.slice(1)} de ${xv.club} en finale ${label}.`,
          decidePar: "Jérémy",
          reluPar: relecture.validePar,
          reluLe: new Date(relecture.reluLe),
        });
      }
    }
    alignes.push({ camp, joueurs });
  }
  for (const r of match.realisations) {
    const camp = alignes.find((a) => a.camp === r.camp)!;
    if (!camp.joueurs.some((j) => j.nomJournal === r.nom || j.nomJournal.endsWith(r.nom))) throw new Error(`réalisation de « ${r.nom} » : absent du XV`);
  }

  // ---- La rencontre --------------------------------------------------------
  const date = new Date(`${jour}T12:00:00Z`);
  const compte = (camp: "usap" | "adversaire", quoi: "essais" | "transformations" | "penalites" | "drops") =>
    match.realisations.filter((r) => r.camp === camp).reduce((s, r) => s + (r[quoi] ?? 0), 0);
  const donnees = {
    date,
    kickoffTime: match.coupDEnvoi,
    seasonId: saison.id,
    competitionId: competition.id,
    matchday: null,
    round: match.tour,
    isHome: true,
    isNeutralVenue: true,
    venueId: stade.id,
    opponentId: adversaire.id,
    scoreUsap: match.scoreUsap,
    scoreOpponent: match.scoreOpponent,
    halfTimeUsap: match.miTemps?.usap ?? null,
    halfTimeOpponent: match.miTemps?.adversaire ?? null,
    result: match.scoreUsap > match.scoreOpponent ? MatchResult.VICTOIRE : match.scoreUsap < match.scoreOpponent ? MatchResult.DEFAITE : MatchResult.NUL,
    bonusOffensif: false,
    bonusDefensif: false,
    refereeId,
    attendance: match.affluence?.valeur ?? null,
    triesUsap: compte("usap", "essais"),
    conversionsUsap: compte("usap", "transformations"),
    penaltiesUsap: compte("usap", "penalites"),
    dropGoalsUsap: compte("usap", "drops"),
    penaltyTriesUsap: 0,
    triesOpponent: compte("adversaire", "essais"),
    conversionsOpponent: compte("adversaire", "transformations"),
    penaltiesOpponent: compte("adversaire", "penalites"),
    dropGoalsOpponent: compte("adversaire", "drops"),
    penaltyTriesOpponent: 0,
  };
  const existant = await prisma.match.findFirst({
    where: { seasonId: saison.id, competitionId: competition.id, opponentId: adversaire.id, round: match.tour },
    select: { id: true },
  });
  let matchId: string;
  if (existant) {
    await prisma.matchEvent.deleteMany({ where: { matchId: existant.id } });
    await prisma.matchPlayer.deleteMany({ where: { matchId: existant.id } });
    await prisma.match.update({ where: { id: existant.id }, data: donnees });
    matchId = existant.id;
    console.log(`\n  [rencontre] reprise ${matchId}`);
  } else {
    const slug = generateMatchSlug({
      competitionShortName: competition.shortName,
      competitionName: competition.name,
      opponentShortName: adversaire.shortName,
      opponentName: adversaire.name,
      isHome: true,
      matchday: null,
      round: match.tour,
      date,
    });
    matchId = (await prisma.match.create({ data: { ...donnees, slug } })).id;
    console.log(`\n  [rencontre] créée ${matchId} — ${slug}`);
  }

  // ---- Les deux XV ---------------------------------------------------------
  let lignes = 0;
  for (const { camp, joueurs } of alignes) {
    for (const j of joueurs) {
      const r = match.realisations.find((x) => x.camp === camp && (x.nom === j.nomJournal || j.nomJournal.endsWith(x.nom)));
      const graphie = j.nomJournal.split(" ").slice(-1)[0] !== separer(j.nomWikipedia).lastName ? ` (qui écrit « ${j.nomJournal} »)` : "";
      await prisma.matchPlayer.create({
        data: {
          matchId,
          playerId: j.playerId,
          isOpponent: camp === "adversaire",
          shirtNumber: null,
          isStarter: true,
          isCaptain: j.capitaine,
          positionPlayed: posteDeLaLigne(j.ligne, j.rang, jour),
          minutesPlayed: null,
          tries: r?.essais ?? 0,
          conversions: r?.transformations ?? 0,
          penalties: r?.penalites ?? 0,
          dropGoals: r?.drops ?? 0,
          totalPoints: r ? pointsDesRealisations(r, bareme) : 0,
          notes: `${j.ligne[0].toUpperCase()}${j.ligne.slice(1)}, d'après ${match.journal} du ${match.numero}${graphie}.`,
        },
      });
      lignes++;
    }
  }
  console.log(`  [compositions] ${lignes} lignes, sans numéro ni minute`);

  // ---- La chronologie, quand le journal la donne à l'heure ----------------
  if (match.chronologie) {
    let su = 0;
    let sa = 0;
    for (const f of match.chronologie) {
      const camp = alignes.find((a) => a.camp === f.camp)!;
      const j = camp.joueurs.find((x) => x.nomJournal === f.nom || x.nomJournal.endsWith(f.nom));
      if (!j) throw new Error(`chronologie : « ${f.nom} » absent du XV`);
      const points =
        f.type === EventType.ESSAI ? bareme.essai
        : f.type === EventType.TRANSFORMATION ? bareme.transformation
        : f.type === EventType.PENALITE ? bareme.penalite
        : f.type === EventType.DROP ? bareme.drop
        : 0;
      if (f.camp === "usap") su += points;
      else sa += points;
      const libelle =
        f.type === EventType.ESSAI ? "Essai" : f.type === EventType.TRANSFORMATION ? "Transformation" : f.type === EventType.PENALITE ? "Pénalité" : "Drop";
      await prisma.matchEvent.create({
        data: {
          matchId,
          minute: f.minute,
          type: f.type,
          playerId: j.playerId,
          isUsap: f.camp === "usap",
          description: `${libelle} de ${j.nomWikipedia} (${f.camp === "usap" ? "USAP" : match.adversaire}), ${f.horloge} à l'horloge. ${su}-${sa}.`,
        },
      });
    }
    if (su !== match.scoreUsap || sa !== match.scoreOpponent) throw new Error(`chronologie : ${su}-${sa} pour ${match.scoreUsap}-${match.scoreOpponent}`);
    console.log(`  [chronologie] ${match.chronologie.length} faits, ${su}-${sa}`);
  }

  // ---- Les attestations de la rencontre ------------------------------------
  const ark = await fasciculeDuJour(match.journal, match.numero);
  const fascicule = ark ? `https://gallica.bnf.fr/ark:/12148/${ark}` : null;
  const attestations: Attestation[] = [
    {
      entite: "Match",
      entiteId: matchId,
      champ: "",
      degre: "PROBABLE",
      source: `${match.journal} du ${match.numero} (Gallica), et Wikipédia pour le score`,
      sourceUrl: fascicule,
      note: `${match.note} Score, mi-temps et réalisations lus dans le journal ; aucune feuille de match n'existe pour cette époque.`,
      decidePar: "Jérémy",
    },
    {
      entite: "Match",
      entiteId: matchId,
      champ: "composition",
      degre: "PROBABLE",
      source: `${match.journal} du ${match.numero}, « Les équipes », relu sur l'image et confronté aux XV de Wikipédia — quinze sur quinze`,
      sourceUrl: relecture.image,
      note: "Les XV dans l'ordre du journal, ligne par ligne, sans numéro de maillot ; le poste n'est porté que là où la ligne le dit sans ambiguïté. Graphies de Wikipédia, celles du journal en note de chaque ligne.",
      decidePar: "Jérémy",
      reluPar: relecture.validePar,
      reluLe: new Date(relecture.reluLe),
    },
    { entite: "Match", entiteId: matchId, champ: "venueId", degre: match.stade.degre, source: match.stade.source },
  ];
  if (match.arbitre) attestations.push({ entite: "Match", entiteId: matchId, champ: "refereeId", degre: match.arbitre.degre, source: match.arbitre.source });
  if (match.affluence) attestations.push({ entite: "Match", entiteId: matchId, champ: "attendance", degre: match.affluence.degre, source: match.affluence.source });
  if (match.miTemps) attestations.push({ entite: "Match", entiteId: matchId, champ: "halfTime", degre: match.miTemps.degre, source: match.miTemps.source });
  if (match.chronologie) {
    attestations.push({
      entite: "Match",
      entiteId: matchId,
      champ: "chronologie",
      degre: "PROBABLE",
      source: `${match.journal} du ${match.numero}, chronologie à l'heure de l'horloge`,
      sourceUrl: fascicule,
      note: "Minutes déduites de l'horloge du journal : reprise à 4 h 00, la minute de jeu vaut 40 plus les minutes écoulées, ce qui suppose que l'horloge ne s'arrête pas. Chaque fait garde son heure en clair.",
    });
  }
  for (const xv of relecture.equipes) {
    if (!xv.capitaine && xv.capitaineWikipedia) {
      attestations.push({
        entite: "Match",
        entiteId: matchId,
        champ: "capitaine",
        degre: "CONCORDANT",
        source: `Wikipédia, pour le capitaine de ${xv.club} — ${xv.capitaineWikipedia} — que ${match.journal} ne marque pas`,
      });
    }
  }
  for (const a of attestations) await attester(prisma, a);
  const crees = alignes.flatMap((a) => a.joueurs).filter((j) => j.cree).length;
  console.log(`  [attestations] ${attestations.length} sur la rencontre, ${crees} sur des fiches créées`);
}

async function main() {
  const dry = process.argv.includes("--dry");
  const jour = argument("match");
  const match = jour ? MATCHS[jour] : undefined;
  if (!jour || !match) {
    console.error(`Usage : npx tsx scripts/seed-match-gallica.ts --match=AAAA-MM-JJ [--dry]\nRencontres connues : ${Object.keys(MATCHS).join(", ")}`);
    process.exit(1);
  }
  if (dry) {
    await simuler(jour, match);
    return;
  }
  const relecture = RELECTURES[jour];
  if (!relecture?.valide) {
    console.error(
      "Ce script n'écrit qu'une rencontre dont la relecture sur l'image est validée par Jérémy (cf. RELECTURES, `valide`). " +
        "Relancer avec --dry pour voir ce que le journal donne.",
    );
    process.exit(1);
  }
  await ecrire(jour, match, relecture);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

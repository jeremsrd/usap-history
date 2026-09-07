/**
 * Confronte le cahier catalan au cahier français, clé par clé.
 *
 * Le français est la source : toute clé qui lui manque en catalan retombe
 * sur lui en silence (cf. `dictionnaire.ts`), ce qui est voulu pour une
 * page pas encore traduite et ne l'est pas pour une clé oubliée. Ce script
 * dit lesquelles manquent, lesquelles sont en trop — une clé que rien ne
 * lit —, et lesquelles ne portent pas les mêmes `{variables}`, sans quoi
 * une phrase traduite afficherait `{n}` en clair.
 *
 * Attendu : seule la section `accueil` manque, tant que la page d'accueil
 * n'est pas refondue. Lecture seule ; sort en erreur s'il y a autre chose.
 */
import { fr } from "../src/i18n/fr";
import { ca } from "../src/i18n/ca";

const SECTIONS_ATTENDUES_ABSENTES = ["accueil"];

type Feuilles = Map<string, string>;

function aplatir(objet: unknown, prefixe = "", sortie: Feuilles = new Map()): Feuilles {
  if (typeof objet === "string") {
    sortie.set(prefixe, objet);
  } else if (objet && typeof objet === "object") {
    if ("one" in objet && "other" in objet) {
      const f = objet as { one: string; other: string };
      sortie.set(`${prefixe}.one`, f.one);
      sortie.set(`${prefixe}.other`, f.other);
    } else {
      for (const [k, v] of Object.entries(objet)) aplatir(v, prefixe ? `${prefixe}.${k}` : k, sortie);
    }
  }
  return sortie;
}

const variables = (phrase: string) => [...phrase.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

const frF = aplatir(fr);
const caF = aplatir(ca);
const manquantes = [...frF.keys()].filter((k) => !caF.has(k) && !SECTIONS_ATTENDUES_ABSENTES.some((s) => k.startsWith(`${s}.`)));
const enTrop = [...caF.keys()].filter((k) => !frF.has(k));
const variablesDivergentes = [...caF.keys()].filter((k) => frF.has(k) && variables(frF.get(k)!) !== variables(caF.get(k)!));
const attendues = [...frF.keys()].filter((k) => SECTIONS_ATTENDUES_ABSENTES.some((s) => k.startsWith(`${s}.`)) && !caF.has(k)).length;

console.log(`${frF.size} clés en français, ${caF.size} en catalan, ${attendues} absentes comme attendu (${SECTIONS_ATTENDUES_ABSENTES.join(", ")})`);
for (const k of manquantes) console.log(`  ✗ manque en catalan : ${k}`);
for (const k of enTrop) console.log(`  ✗ en trop en catalan : ${k}`);
for (const k of variablesDivergentes) console.log(`  ✗ variables différentes : ${k} — fr {${variables(frF.get(k)!)}} / ca {${variables(caF.get(k)!)}}`);
const defauts = manquantes.length + enTrop.length + variablesDivergentes.length;
console.log(defauts === 0 ? "✔ les deux cahiers se répondent" : `${defauts} défaut(s)`);
process.exit(defauts === 0 ? 0 : 1);

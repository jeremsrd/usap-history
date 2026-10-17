/**
 * Crée les vingt-deux matchs de la saison 2003-2004 : quatorze journées de
 * **phase préliminaire** du Top 16 (poule 2), six de **phase qualificative**
 * (poule A), la demi-finale gagnée contre Toulouse et la finale perdue contre
 * le Stade français.
 *
 * **LA PREMIÈRE SAISON D'AVANT LA LNR D'AUJOURD'HUI.** Le site actuel de la
 * LNR n'archive rien avant 2004-2005 ; l'ancien, dans la Wayback Machine,
 * donne les résultats et le calendrier journée par journée
 * (cf. `scripts/lib/lnr-ancien.ts`). Aucune feuille, aucune composition,
 * aucun arbitre : la rencontre, son jour, son heure, son lieu et son score.
 *
 * **WIKIPÉDIA NE DONNE PAS LES DATES, ET C'EST POURQUOI IL FAUT LA LNR.** La
 * page de la saison porte la phase préliminaire en tableau croisé — recevant
 * en ligne, visiteur en colonne, le score —, sans date ni journée ; seules
 * la phase qualificative et la phase finale sont datées. Elle sert ici de
 * **contre-source** : chaque score de la LNR y est confronté, chaque date
 * qu'elle donne aussi, et les totaux de la saison à ses deux classements.
 *
 * **LA DATE : LE JOUR DU CALENDRIER, SINON LE SAMEDI.** Le calendrier nomme
 * le jour et l'heure de chaque rencontre de l'USAP — « Samedi 11 octobre
 * (19h30), Sapiac » —, et sa capture de janvier 2005 suit les reports. Si une
 * rencontre n'y figurait pas, le samedi de l'en-tête de journée serait posé
 * et attesté `PROBABLE` sur `Match.date`, comme l'a tranché Jérémy le
 * 17 octobre 2026. Aucune n'en a besoin en 2003-2004.
 *
 * **BARÈME 3/2/1, SANS BONUS** : les classements de Wikipédia portent
 * `bonus=non`, et 9 V 5 D font bien 32 points.
 *
 * Attestation : la rencontre entière `OFFICIEL` — publication de
 * l'organisateur hors de la chaîne, comme l'ERC par la Wayback Machine —,
 * avec l'adresse de la capture des résultats.
 *
 * Usage : npx tsx scripts/seed-season-2003-2004.ts [--dry]
 */
import { PrismaClient, MatchResult, Prisma } from "@prisma/client";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  lirePageLnrArchivee,
  lignesDe,
  lireTableau,
  lireScore,
  lireCreneau,
  samediDeLEnTete,
  cleDe,
  adresseArchivee,
  type EntreeAncienne,
} from "./lib/lnr-ancien";
import { attester } from "./lib/attestations";
import { instantDeParis } from "./lib/dates";
import { computeBonuses, matchPoints } from "../src/lib/scoring";
import { generateMatchSlug } from "../src/lib/slugs";
import { preserverAnnexes } from "./lib/saison";
import { terrainDuMatch } from "./lib/stades";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

const SAISON = "2003-2004";
const START_YEAR = 2003;

const RESULTATS = {
  url: "http://lnr.fr/Menus.asp?CR=16354&CSR=16375&Cle=45654",
  instantane: "20051015164146",
};
/** Du plus ancien au plus récent : le dernier qui nomme une rencontre fait foi. */
const CALENDRIERS = [
  { url: "http://www.lnr.fr/Menus.asp?CR=16354&CSR=16378&Cle=45356", instantane: "20031106232245" },
  { url: "http://www.lnr.fr/Menus.asp?CR=16354&CSR=16378&Cle=45356", instantane: "20050118192713" },
];
const WIKIPEDIA = "Championnat_de_France_de_rugby_à_XV_2003-2004";

/** Nom de l'ancienne LNR → `shortName` en base. */
const CLUBS: Record<string, string> = {
  Perpignan: "Perpignan",
  Montauban: "Montauban",
  Narbonne: "Narbonne",
  Grenoble: "Grenoble",
  Montpellier: "Montpellier",
  Biarritz: "Biarritz",
  Toulouse: "Toulouse",
  "Béziers": "Béziers",
  "Bourgoin-Jallieu": "Bourgoin",
  Castres: "Castres",
  "Stade Français": "Stade Français",
};

/** Abréviation du tableau croisé de Wikipédia → `shortName` en base. */
const ABREVIATIONS: Record<string, string> = {
  BEZ: "Béziers", BIA: "Biarritz", GRE: "Grenoble", MTB: "Montauban",
  MPL: "Montpellier", NAR: "Narbonne", PER: "Perpignan", TOU: "Toulouse",
};

/** Un mot du lien Wikipédia → `shortName` en base, pour les tableaux datés. */
function clubDuLien(lien: string): string | null {
  const table: Array<[RegExp, string]> = [
    [/perpignan/i, "Perpignan"], [/bourgoin/i, "Bourgoin"], [/castres/i, "Castres"],
    [/béziers/i, "Béziers"], [/toulous/i, "Toulouse"], [/stade fran/i, "Stade Français"],
    [/biarritz/i, "Biarritz"],
  ];
  return table.find(([re]) => re.test(lien))?.[1] ?? null;
}

/**
 * Totaux de l'USAP selon les deux classements de Wikipédia, barème 3/2/1.
 * La LNR d'alors ne publie aucun classement archivé pour cette saison.
 */
const CLASSEMENTS = {
  préliminaire: { wins: 9, draws: 0, losses: 5, pointsFor: 357, pointsAgainst: 284, points: 32 },
  qualificative: { wins: 5, draws: 0, losses: 1, pointsFor: 169, pointsAgainst: 75, points: 16 },
};

interface Rencontre {
  entree: EntreeAncienne;
  date: Date;
  jour: string;
  kickoffTime: string | null;
  /** Vrai quand le jour vient du samedi de l'en-tête, faute de calendrier. */
  dateProbable: boolean;
  /** Ce que le calendrier dit du lieu, tel quel. */
  creneau: string | null;
  matchday: number | null;
  round: string | null;
  isHome: boolean;
  opponentNom: string;
  scoreUsap: number;
  scoreOpponent: number;
}

// ---------------------------------------------------------------- Wikipédia

const CACHE = join(process.cwd(), "node_modules", ".cache", "usap-wikipedia");

async function wikitexte(titre: string): Promise<string> {
  mkdirSync(CACHE, { recursive: true });
  const fichier = join(CACHE, `${titre.replace(/[^\w.-]/g, "_")}.wiki`);
  if (existsSync(fichier)) return readFileSync(fichier, "utf8");
  const reponse = await fetch(
    `https://fr.wikipedia.org/w/index.php?title=${encodeURIComponent(titre)}&action=raw`,
    { headers: { "User-Agent": "usap-history (contre-source d'une saison)" } },
  );
  if (!reponse.ok) throw new Error(`Wikipédia : HTTP ${reponse.status} sur ${titre}`);
  const texte = await reponse.text();
  writeFileSync(fichier, texte);
  return texte;
}

/**
 * Le tableau croisé de la poule de l'USAP : « recevant|visiteur » → score.
 * Ligne = recevant, colonne = visiteur, dans l'ordre des en-têtes ; la case
 * grise de la diagonale le vérifie.
 */
function tableauCroise(wiki: string): Map<string, [number, number]> {
  const debut = wiki.search(/^! scope="col"[^\n]*\| PER$/m);
  if (debut < 0) throw new Error("Wikipédia : tableau croisé de la poule de l'USAP introuvable");
  const tableau = wiki.slice(wiki.lastIndexOf("{|", debut), wiki.indexOf("\n|}", debut));
  const colonnes = [...tableau.matchAll(/^! scope="col"[^\n]*\| ([A-Z]{3})$/gm)].map((m) => m[1]);
  const lignes = tableau.split(/^! scope="row"/m).slice(1);
  if (lignes.length !== colonnes.length) {
    throw new Error(`Wikipédia : ${lignes.length} lignes pour ${colonnes.length} colonnes`);
  }
  const scores = new Map<string, [number, number]>();
  lignes.forEach((ligne, i) => {
    // `[ \t]*` et non `\s*` : la case vide de la diagonale avalerait sinon la
    // ligne suivante, et décalerait toute la rangée d'une colonne.
    const cases = [...ligne.matchAll(/^\| style="background:#(\w+);"\|[ \t]*([^\n]*)$/gm)];
    cases.forEach((c, k) => {
      if (k === i) {
        if (c[1].toUpperCase() !== "CCCCCC") throw new Error(`Wikipédia : diagonale décalée en ${colonnes[i]}`);
        return;
      }
      const s = /(\d+)-(\d+)/.exec(c[2]);
      if (s) {
        scores.set(`${ABREVIATIONS[colonnes[i]]}|${ABREVIATIONS[colonnes[k]]}`, [Number(s[1]), Number(s[2])]);
      }
    });
  });
  return scores;
}

/** Les rencontres datées de la page — phase qualificative et phase finale. */
function rencontresDatees(wiki: string): Array<{ jour: string; recevant: string; visiteur: string; score: [number, number] }> {
  const MOIS: Record<string, number> = { mai: 5, juin: 6 };
  const sortie: Array<{ jour: string; recevant: string; visiteur: string; score: [number, number] }> = [];
  for (const m of wiki.matchAll(/^\| \{\{date-\|(\d+) (\w+)\}\}\s*\|\|(.+?)\|\|(.+?)\|\|(.+)$/gm)) {
    const r = clubDuLien(m[3]);
    const v = clubDuLien(m[5]);
    const s = /(\d+)\D+?(\d+)/.exec(m[4].replace(/'/g, ""));
    if (!r || !v || !s || !MOIS[m[2]]) continue;
    sortie.push({
      jour: `2004-${String(MOIS[m[2]]).padStart(2, "0")}-${m[1].padStart(2, "0")}`,
      recevant: r,
      visiteur: v,
      score: [Number(s[1]), Number(s[2])],
    });
  }
  // Demi-finales et finale : le modèle « Phase finale à 4 ».
  for (const cle of ["D1", "D2", "F1"]) {
    const champ = (n: string) => new RegExp(`^\\|${cle}-${n}=(.*)$`, "m").exec(wiki)?.[1] ?? "";
    const d = /\{\{date\|(\d+)\|(\w+)\|2004/.exec(champ("info"));
    const r = clubDuLien(champ("E1"));
    const v = clubDuLien(champ("E2"));
    const s1 = /(\d+)/.exec(champ("S1"));
    const s2 = /(\d+)/.exec(champ("S2"));
    if (!d || !r || !v || !s1 || !s2 || !MOIS[d[2]]) continue;
    sortie.push({
      jour: `2004-${String(MOIS[d[2]]).padStart(2, "0")}-${d[1].padStart(2, "0")}`,
      recevant: r,
      visiteur: v,
      score: [Number(s1[1]), Number(s2[1])],
    });
  }
  return sortie;
}

// ---------------------------------------------------------------- LNR

async function lire(echecs: string[]): Promise<Rencontre[]> {
  const resultats = lireTableau(lignesDe(await lirePageLnrArchivee(RESULTATS.url, RESULTATS.instantane)))
    .filter((e) => e.phase !== "maintien")
    .filter((e) => e.recevant === "Perpignan" || e.visiteur === "Perpignan");

  // Le dernier calendrier qui nomme la rencontre fait foi ; un changement
  // d'une capture à l'autre est un report, et se dit.
  const creneaux = new Map<string, string>();
  for (const cal of CALENDRIERS) {
    const entrees = lireTableau(lignesDe(await lirePageLnrArchivee(cal.url, cal.instantane)));
    for (const e of entrees) {
      if (e.recevant !== "Perpignan" && e.visiteur !== "Perpignan") continue;
      const avant = creneaux.get(cleDe(e));
      const avantJour = avant ? lireCreneau(avant, START_YEAR)?.jour : null;
      const apresJour = lireCreneau(e.suite, START_YEAR)?.jour;
      if (avantJour && apresJour && avantJour !== apresJour) {
        console.log(`  [report] ${e.recevant} / ${e.visiteur} : ${avantJour} → ${apresJour} (capture ${cal.instantane})`);
      }
      creneaux.set(cleDe(e), e.suite);
    }
  }

  const rencontres: Rencontre[] = [];
  for (const e of resultats) {
    const libelle = `${e.phase} ${e.journee ?? e.tour} ${e.recevant} / ${e.visiteur}`;
    const score = lireScore(e.suite);
    if (!score) {
      echecs.push(`${libelle} : score illisible « ${e.suite} »`);
      continue;
    }
    const isHome = e.recevant === "Perpignan";
    const adverse = CLUBS[isHome ? e.visiteur : e.recevant];
    if (!adverse) {
      echecs.push(`${libelle} : club inconnu de la table`);
      continue;
    }

    const texte = creneaux.get(cleDe(e)) ?? null;
    const creneau = texte ? lireCreneau(texte, START_YEAR) : null;
    let jour = creneau?.jour ?? null;
    const dateProbable = !jour;
    if (!jour) jour = samediDeLEnTete(e.enTete, START_YEAR);
    if (!jour) {
      echecs.push(`${libelle} : ni calendrier ni en-tête lisible (« ${e.enTete} »)`);
      continue;
    }
    const heure = creneau?.heure ?? null;

    let round: string | null = null;
    if (e.phase === "qualificative") round = "Poule A";
    if (e.phase === "finale") round = e.tour;

    rencontres.push({
      entree: e,
      // Sans heure, midi UTC, comme `momentDuMatch` : le jour est le même partout.
      date: heure ? instantDeParis(jour, heure) : new Date(`${jour}T12:00:00Z`),
      jour,
      kickoffTime: heure,
      dateProbable,
      creneau: texte,
      matchday: e.phase === "préliminaire" ? e.journee : null,
      round,
      isHome,
      opponentNom: adverse,
      scoreUsap: isHome ? score.recevant : score.visiteur,
      scoreOpponent: isHome ? score.visiteur : score.recevant,
    });
  }
  return rencontres;
}

// ---------------------------------------------------------------- contrôles

function confronter(rencontres: Rencontre[], wiki: string, echecs: string[]) {
  const croise = tableauCroise(wiki);
  const datees = rencontresDatees(wiki);
  let confrontees = 0;

  // La poule qualificative : la LNR rattache sans ambiguïté certaines
  // rencontres à leur poule (journées 3 et 4) ; elles doivent dire « A ».
  for (const r of rencontres) {
    if (r.entree.phase === "qualificative" && r.entree.poule && r.entree.poule !== "A") {
      echecs.push(`${r.jour} : la LNR place l'USAP en poule ${r.entree.poule}, le script en poule A`);
    }
  }

  for (const r of rencontres) {
    const recevant = r.isHome ? "Perpignan" : r.opponentNom;
    const visiteur = r.isHome ? r.opponentNom : "Perpignan";
    const lnr: [number, number] = r.isHome ? [r.scoreUsap, r.scoreOpponent] : [r.scoreOpponent, r.scoreUsap];
    if (r.entree.phase === "préliminaire") {
      const w = croise.get(`${recevant}|${visiteur}`);
      if (!w) {
        echecs.push(`J${r.matchday} ${recevant}-${visiteur} : absent du tableau croisé de Wikipédia`);
      } else if (w[0] !== lnr[0] || w[1] !== lnr[1]) {
        echecs.push(`J${r.matchday} ${recevant}-${visiteur} : LNR ${lnr.join("-")}, Wikipédia ${w.join("-")}`);
      } else confrontees++;
      continue;
    }
    const w = datees.find((d) => d.recevant === recevant && d.visiteur === visiteur);
    if (!w) {
      echecs.push(`${r.round} ${recevant}-${visiteur} : absent des tableaux datés de Wikipédia`);
      continue;
    }
    if (w.score[0] !== lnr[0] || w.score[1] !== lnr[1]) {
      echecs.push(`${r.round} ${recevant}-${visiteur} : LNR ${lnr.join("-")}, Wikipédia ${w.score.join("-")}`);
    } else if (w.jour !== r.jour) {
      echecs.push(`${r.round} ${recevant}-${visiteur} : LNR le ${r.jour}, Wikipédia le ${w.jour}`);
    } else confrontees++;
  }
  console.log(`\n  Wikipédia : ${confrontees}/${rencontres.length} rencontres concordantes (score, et date quand elle en donne une)`);

  for (const phase of ["préliminaire", "qualificative"] as const) {
    const jouees = rencontres.filter((r) => r.entree.phase === phase);
    const res = jouees.map((r) => resultatDe(r));
    const totaux = {
      wins: res.filter((x) => x === MatchResult.VICTOIRE).length,
      draws: res.filter((x) => x === MatchResult.NUL).length,
      losses: res.filter((x) => x === MatchResult.DEFAITE).length,
      pointsFor: jouees.reduce((s, r) => s + r.scoreUsap, 0),
      pointsAgainst: jouees.reduce((s, r) => s + r.scoreOpponent, 0),
      points: res.reduce((s, x) => s + matchPoints(x, false, false, START_YEAR), 0),
    };
    const attendu = CLASSEMENTS[phase];
    const ecarts = (Object.keys(attendu) as Array<keyof typeof attendu>)
      .filter((k) => totaux[k] !== attendu[k])
      .map((k) => `${k} ${totaux[k]} pour ${attendu[k]}`);
    console.log(
      `  phase ${phase} : ${totaux.wins}V ${totaux.draws}N ${totaux.losses}D, ` +
        `${totaux.pointsFor}-${totaux.pointsAgainst}, ${totaux.points} pts — ` +
        (ecarts.length ? `⚠ ${ecarts.join(", ")}` : "✔ conforme au classement de Wikipédia"),
    );
    if (ecarts.length) echecs.push(`phase ${phase} : ${ecarts.join(", ")}`);
  }
}

function resultatDe(r: Pick<Rencontre, "scoreUsap" | "scoreOpponent">): MatchResult {
  return r.scoreUsap > r.scoreOpponent
    ? MatchResult.VICTOIRE
    : r.scoreUsap < r.scoreOpponent
      ? MatchResult.DEFAITE
      : MatchResult.NUL;
}

// ---------------------------------------------------------------- écriture

async function main() {
  console.log(`=== Saison ${SAISON}${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const saison = await prisma.season.findFirstOrThrow({ where: { label: SAISON } });
  const competition = await prisma.competition.findFirstOrThrow({ where: { shortName: "Top 16" } });

  const echecs: string[] = [];
  const rencontres = (await lire(echecs)).sort((a, b) => a.date.getTime() - b.date.getTime());
  confronter(rencontres, await wikitexte(WIKIPEDIA), echecs);

  // Un écart avec la contre-source arrête tout : rien n'est écrit sur une
  // saison qui ne retombe pas.
  if (echecs.length > 0 && !DRY_RUN) {
    console.log(`\n=== ${echecs.length} échec(s), rien n'est écrit ===`);
    for (const e of echecs) console.log(`  ⚠ ${e}`);
    process.exitCode = 1;
    return;
  }

  console.log("");
  let crees = 0;
  let majs = 0;
  for (const r of rencontres) {
    const opponent = await prisma.opponent.findFirst({
      where: { OR: [{ shortName: r.opponentNom }, { name: r.opponentNom }] },
      select: { id: true },
    });
    if (!opponent) {
      echecs.push(`adversaire « ${r.opponentNom} » introuvable en base`);
      continue;
    }
    const venueId = await terrainDuMatch(prisma, {
      opponentId: opponent.id,
      isHome: r.isHome,
      startYear: START_YEAR,
      jour: r.jour,
    });
    const stade = venueId
      ? (await prisma.venue.findUnique({ where: { id: venueId }, select: { name: true } }))?.name
      : null;

    const isKnockout = r.matchday == null && !(r.round ?? "").startsWith("Poule");
    const bonus = computeBonuses({
      competitionShortName: "Top 16",
      seasonStartYear: START_YEAR,
      isKnockout,
      scoreUsap: r.scoreUsap,
      scoreOpponent: r.scoreOpponent,
      triesUsap: 0,
      triesOpponent: 0,
    });

    const lieuLnr = r.creneau ?? "?";
    console.log(
      `${r.jour} ${r.kickoffTime ?? "  :  "} ${(r.matchday ? `J${r.matchday}` : (r.round ?? "")).padEnd(12)} ` +
        `${r.isHome ? "H" : "A"} ${r.opponentNom.padEnd(15)} ${r.scoreUsap}-${r.scoreOpponent}` +
        `${bonus.bonusOffensif ? " BO" : ""}${bonus.bonusDefensif ? " BD" : ""}` +
        `${r.dateProbable ? " [date probable]" : ""} | base : ${stade ?? "—"} | LNR : ${lieuLnr}`,
    );

    if (DRY_RUN) continue;

    const existant = await prisma.match.findFirst({
      where: {
        seasonId: saison.id,
        opponentId: opponent.id,
        date: { gte: new Date(`${r.jour}T00:00:00Z`), lt: new Date(`${r.jour}T23:59:59Z`) },
      },
      select: { id: true, halfTimeUsap: true, halfTimeOpponent: true, attendance: true, videoUrl: true },
    });

    const donnees: Prisma.MatchUncheckedCreateInput = {
      slug: generateMatchSlug({
        competitionShortName: competition.shortName,
        competitionName: competition.name,
        opponentShortName: r.opponentNom,
        opponentName: r.opponentNom,
        isHome: r.isHome,
        matchday: r.matchday,
        round: r.round,
        date: r.date,
      }),
      date: r.date,
      kickoffTime: r.kickoffTime,
      seasonId: saison.id,
      competitionId: competition.id,
      matchday: r.matchday,
      round: r.round,
      isHome: r.isHome,
      venueId,
      opponentId: opponent.id,
      scoreUsap: r.scoreUsap,
      scoreOpponent: r.scoreOpponent,
      result: resultatDe(r),
      bonusOffensif: bonus.bonusOffensif,
      bonusDefensif: bonus.bonusDefensif,
      // Aucune réalisation publiée : `null`, « on ne sait pas ».
    };

    let id: string;
    if (existant) {
      await prisma.match.update({ where: { id: existant.id }, data: preserverAnnexes(donnees, existant) });
      id = existant.id;
      majs++;
    } else {
      id = (await prisma.match.create({ data: donnees, select: { id: true } })).id;
      crees++;
    }

    await attester(prisma, {
      entite: "Match",
      entiteId: id,
      degre: "OFFICIEL",
      source: "Ancien site de la LNR, résultats et calendrier 2003-2004 (Wayback Machine)",
      sourceUrl: adresseArchivee(RESULTATS.url, RESULTATS.instantane),
      note: "Score confronté à la page de la saison sur Wikipédia : concordant.",
    });
    if (r.dateProbable) {
      await attester(prisma, {
        entite: "Match",
        entiteId: id,
        champ: "date",
        degre: "PROBABLE",
        source: `Samedi de la journée (« ${r.entree.enTete} »), faute de jour au calendrier`,
        decidePar: "Jérémy",
      });
    }
  }

  console.log(
    `\n=== ${rencontres.length} rencontre(s) lue(s)` +
      (DRY_RUN ? "" : `, ${crees} créée(s), ${majs} mise(s) à jour`) +
      `, ${echecs.length} en échec ===`,
  );
  for (const e of echecs) console.log(`  ⚠ ${e}`);
  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

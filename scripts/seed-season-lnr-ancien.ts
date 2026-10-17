/**
 * Crée les matchs d'une saison d'avant 2004-2005 depuis l'**ancien site de
 * la LNR**, tel que la Wayback Machine l'a gardé (cf. `scripts/lib/lnr-ancien.ts`).
 * Une fiche par saison dans `SAISONS` ; le reste est commun.
 *
 *   2003-2004 : 14 journées de phase préliminaire, 6 de phase qualificative
 *               (poule A), demi-finale gagnée contre Toulouse, finale perdue
 *               contre le Stade français — 22 rencontres ;
 *   2002-2003 : 14 journées de phase régulière, 6 de phase de qualification
 *               (poule 1), pas de phase finale — 20 rencontres ;
 *   2001-2002 : 14 journées de phase de classement (« Match Aller », « Match
 *               Retour »), 6 de play-offs (poule B) — 20 rencontres ;
 *   2000-2001 : 18 journées de poule 1, quart de finale perdu à Toulouse —
 *               19 rencontres, **sans aucune date** (voir plus bas).
 *
 * **LA PREMIÈRE SOURCE OFFICIELLE D'AVANT LA LNR D'AUJOURD'HUI.** Le site
 * actuel n'archive rien avant 2004-2005 ; l'ancien donne les résultats et le
 * calendrier journée par journée. Aucune feuille, aucune composition, aucun
 * arbitre : la rencontre, son jour, son heure, son lieu et son score.
 *
 * **WIKIPÉDIA EST LA CONTRE-SOURCE, ET TOUT ÉCART ARRÊTE L'ÉCRITURE.** La page
 * de la saison porte la phase préliminaire en tableau croisé — recevant en
 * ligne, visiteur en colonne —, sans date ; la phase qualificative et la
 * phase finale y sont datées. Chaque score de la LNR y est confronté, chaque
 * date qu'elle donne aussi, et les totaux de l'USAP à ses deux classements.
 * La poule qualificative prend le nom que lui donne Wikipédia : la LNR ouvre
 * les deux intitulés avant les rencontres, et ne dit donc pas laquelle est
 * celle de l'USAP.
 *
 * **LA DATE : LE JOUR DU CALENDRIER, SINON LE SAMEDI.** En 2003-2004 le
 * calendrier écrit « Samedi 11 octobre (19h30), Sapiac » ; avant, il ne nomme
 * que le jour de la semaine — « Samedi (19h30), Aimé Giral » —, et le
 * quantième se retrouve dans l'en-tête de journée : la date reste exacte.
 * Ses captures successives suivent les reports, la plus tardive fait foi.
 * Si une rencontre n'y figurait pas, le samedi de l'en-tête de journée serait
 * posé et attesté `PROBABLE` sur `Match.date`, comme l'a tranché Jérémy le
 * 17 octobre 2026.
 *
 * **2000-2001 N'A NI CALENDRIER NI DATE.** La Wayback Machine ne garde le
 * site de la LNR qu'à partir de septembre 2001, et la page de résultats de
 * 2000-2001 (`lireResultats2000`) ne date rien. Jérémy a tranché le
 * 17 octobre 2026 : une date de journée estimée, attestée `PROBABLE`, à
 * corriger quand on aura les feuilles. L'estimation vient de la **page de
 * saison de Biarritz** sur Wikipédia, qui date chacun de ses matchs : les
 * deux poules partagent les numéros de journée de la LNR — Grenoble-Biarritz
 * et Perpignan-Béziers sont sous le même « 12ème Journée » —, et le jour de
 * Biarritz est pris pour celui de l'USAP. Biarritz, de l'autre poule, jouait
 * parfois en semaine, et rien ne dit que la poule 1 jouait le même jour : la
 * date peut être fausse de quelques jours. Aux journées 5 et 16, Biarritz
 * était exempt : c'est le samedi à mi-chemin des deux journées voisines, plus
 * fragile encore. Le quart de finale prend la date de la Wikipédia française.
 *
 * **BARÈME 3/2/1, SANS BONUS** jusqu'en 2003-2004 : les classements de
 * Wikipédia portent `bonus=non`.
 *
 * Attestation : la rencontre entière `OFFICIEL` — publication de
 * l'organisateur hors de la chaîne, comme l'ERC par la Wayback Machine —,
 * avec l'adresse de la capture des résultats.
 *
 * Usage : npx tsx scripts/seed-season-lnr-ancien.ts --saison=AAAA-AAAA [--dry]
 */
import { PrismaClient, MatchResult, Prisma } from "@prisma/client";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  lirePageLnrArchivee,
  lignesDe,
  lireTableau,
  lireResultats2000,
  lireScore,
  lireCreneau,
  samediDeLEnTete,
  joursDeLEnTete,
  cleDe,
  adresseArchivee,
  anneeDuMois,
  type EntreeAncienne,
  type PhaseAncienne,
} from "./lib/lnr-ancien";
import { attester } from "./lib/attestations";
import { instantDeParis, journeeDeParis } from "./lib/dates";
import { computeBonuses, matchPoints } from "../src/lib/scoring";
import { generateMatchSlug, generateOpponentSlug, generateVenueSlug } from "../src/lib/slugs";
import { preserverAnnexes } from "./lib/saison";
import { terrainDuMatch } from "./lib/stades";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

interface Capture {
  url: string;
  instantane: string;
}

interface Totaux {
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  points: number;
}

interface FicheSaison {
  startYear: number;
  /** La forme de la page de résultats : `Menus.asp` (2001-2004) ou celle de 2000-2001. */
  lecteur?: "2000";
  resultats: Capture;
  /** Du plus ancien au plus récent : le dernier qui nomme une rencontre fait foi. */
  calendriers: Capture[];
  wikipedia: string;
  /** La poule qualificative de l'USAP, sous le nom que lui donne Wikipédia. */
  pouleQualificative: string;
  /** Totaux de l'USAP selon les classements de Wikipédia, barème 3/2/1. */
  classements: { préliminaire: Totaux; qualificative?: Totaux };
  /** Faute de calendrier : la page Wikipédia d'un club qui date ses journées. */
  datesDeJournee?: string;
}

const MENUS = "http://www.lnr.fr/Menus.asp?CR=16354";

const SAISONS: Record<string, FicheSaison> = {
  "2003-2004": {
    startYear: 2003,
    resultats: { url: "http://lnr.fr/Menus.asp?CR=16354&CSR=16375&Cle=45654", instantane: "20051015164146" },
    calendriers: [
      { url: `${MENUS}&CSR=16378&Cle=45356`, instantane: "20031106232245" },
      { url: `${MENUS}&CSR=16378&Cle=45356`, instantane: "20050118192713" },
    ],
    wikipedia: "Championnat_de_France_de_rugby_à_XV_2003-2004",
    pouleQualificative: "Poule A",
    classements: {
      préliminaire: { wins: 9, draws: 0, losses: 5, pointsFor: 357, pointsAgainst: 284, points: 32 },
      qualificative: { wins: 5, draws: 0, losses: 1, pointsFor: 169, pointsAgainst: 75, points: 16 },
    },
  },
  // Sans `Cle=`, l'adresse rend la saison en cours au jour de la capture.
  "2002-2003": {
    startYear: 2002,
    resultats: { url: `${MENUS}&CSR=16375`, instantane: "20030826111837" },
    calendriers: [
      { url: `${MENUS}&CSR=16378`, instantane: "20021017172327" },
      { url: `${MENUS}&CSR=16378`, instantane: "20030217074051" },
      { url: `${MENUS}&CSR=16378`, instantane: "20030609181627" },
    ],
    wikipedia: "Championnat_de_France_de_rugby_à_XV_2002-2003",
    pouleQualificative: "Poule 1",
    classements: {
      préliminaire: { wins: 8, draws: 0, losses: 6, pointsFor: 326, pointsAgainst: 208, points: 30 },
      qualificative: { wins: 2, draws: 0, losses: 4, pointsFor: 119, pointsAgainst: 136, points: 10 },
    },
  },
  "2001-2002": {
    startYear: 2001,
    resultats: { url: `${MENUS}&CSR=16375`, instantane: "20020701013431" },
    calendriers: [
      { url: "http://www.lnr.fr/championnat/calendrier.asp", instantane: "20011122154931" },
      { url: `${MENUS}&CSR=16378`, instantane: "20020527121241" },
    ],
    wikipedia: "Championnat_de_France_de_rugby_à_XV_2001-2002",
    pouleQualificative: "Poule B",
    classements: {
      préliminaire: { wins: 11, draws: 0, losses: 3, pointsFor: 413, pointsAgainst: 313, points: 36 },
      qualificative: { wins: 2, draws: 0, losses: 4, pointsFor: 127, pointsAgainst: 154, points: 10 },
    },
  },
  "2000-2001": {
    startYear: 2000,
    lecteur: "2000",
    resultats: { url: "http://www.lnr.fr/championnat/resultats2000_d1.shtm", instantane: "20011224134443" },
    calendriers: [],
    wikipedia: "Championnat_de_France_de_rugby_à_XV_2000-2001",
    pouleQualificative: "",
    classements: {
      préliminaire: { wins: 11, draws: 0, losses: 7, pointsFor: 492, pointsAgainst: 452, points: 40 },
    },
    datesDeJournee: "Saison_2000-2001_du_Biarritz_olympique",
  },
};

/** Nom de l'ancienne LNR → `shortName` en base. */
const CLUBS: Record<string, string> = {
  Perpignan: "Perpignan",
  Agen: "Agen",
  Béziers: "Béziers",
  Biarritz: "Biarritz",
  // Le CA Bordeaux-Bègles Gironde, et non l'UBB : cf. `CLUBS_A_CREER`.
  "Bordeaux-Bègles": "Bordeaux-Bègles",
  "Bègles Bordeaux": "Bordeaux-Bègles",
  "Bourgoin-Jallieu": "Bourgoin",
  Bourgoin: "Bourgoin",
  Castres: "Castres",
  Colomiers: "Colomiers",
  Dax: "Dax",
  Grenoble: "Grenoble",
  "La Rochelle": "La Rochelle",
  "Mont de Marsan": "Mont-de-Marsan",
  Montauban: "Montauban",
  // L'AS Montferrand, devenue ASM Clermont Auvergne en 2004 : le même club.
  Montferrand: "Clermont",
  Montpellier: "Montpellier",
  Narbonne: "Narbonne",
  Pau: "Pau",
  Périgueux: "Périgueux",
  "Stade Français": "Stade Français",
  Toulouse: "Toulouse",
};

/** Le lien Wikipédia d'un club → `shortName` en base. L'ordre compte. */
const LIENS: Array<[RegExp, string]> = [
  [/perpignan/i, "Perpignan"], [/bourgoin/i, "Bourgoin"], [/castres/i, "Castres"],
  [/béziers/i, "Béziers"], [/toulous/i, "Toulouse"], [/stade fran/i, "Stade Français"],
  [/biarritz/i, "Biarritz"], [/agen/i, "Agen"], [/palois|\bpau\b/i, "Pau"],
  [/grenobl/i, "Grenoble"], [/montauban/i, "Montauban"], [/narbonn/i, "Narbonne"],
  [/montpellier/i, "Montpellier"], [/colomiers/i, "Colomiers"],
  [/montois|mont-de-marsan/i, "Mont-de-Marsan"], [/montferrand|clermont/i, "Clermont"],
  [/\bdax\b/i, "Dax"], [/rochel/i, "La Rochelle"], [/bègles/i, "Bordeaux-Bègles"],
  [/périg/i, "Périgueux"],
];

/**
 * Les clubs d'alors que la base ne connaît pas, créés à l'écriture.
 *
 * **LE CA BORDEAUX-BÈGLES GIRONDE N'EST PAS L'UBB.** L'UBB est née en 2006 de
 * sa fusion avec le Stade bordelais : deux clubs en ont fait un troisième, et
 * le rattacher à l'un des deux reviendrait à oublier l'autre. Club distinct,
 * tranché par Jérémy le 17 octobre 2026. Il recevait au stade André-Moga de
 * Bègles, déjà en base pour l'UBB d'avant 2015.
 */
const CLUBS_A_CREER: Array<{ name: string; shortName: string; city: string; stade: { nom: string; ville: string } }> = [
  {
    name: "CA Bordeaux-Bègles Gironde",
    shortName: "Bordeaux-Bègles",
    city: "Bègles",
    stade: { nom: "Stade André-Moga", ville: "Bègles" },
  },
  // En première division en 2000-2001, poule 1 avec l'USAP.
  {
    name: "CA Périgueux Dordogne",
    shortName: "Périgueux",
    city: "Périgueux",
    stade: { nom: "Stade Francis-Rongiéras", ville: "Périgueux" },
  },
];

async function creerClubs() {
  for (const club of CLUBS_A_CREER) {
    const existe = await prisma.opponent.findFirst({ where: { OR: [{ name: club.name }, { shortName: club.shortName }] } });
    if (existe) continue;
    if (DRY_RUN) {
      console.log(`  [adversaire] à créer : ${club.name}, à ${club.stade.nom}`);
      continue;
    }
    let stade = await prisma.venue.findFirst({ where: { name: club.stade.nom }, select: { id: true } });
    if (!stade) {
      const pays = await prisma.country.findFirst({ where: { code: "FR" } });
      // Le slug porte le CUID : provisoire à la création, réécrit aussitôt.
      const cree = await prisma.venue.create({
        data: { name: club.stade.nom, city: club.stade.ville, countryId: pays?.id ?? null, slug: `temp-${Date.now()}` },
      });
      await prisma.venue.update({ where: { id: cree.id }, data: { slug: generateVenueSlug(club.stade.nom, club.stade.ville, cree.id) } });
      stade = { id: cree.id };
      console.log(`  [stade] créé : ${club.stade.nom}`);
    }
    const pays = await prisma.country.findFirst({ where: { code: "FR" } });
    const cree = await prisma.opponent.create({
      data: {
        name: club.name,
        shortName: club.shortName,
        city: club.city,
        countryId: pays?.id ?? null,
        venueId: stade.id,
        isActive: false,
        slug: `temp-${Date.now()}`,
      },
    });
    await prisma.opponent.update({ where: { id: cree.id }, data: { slug: generateOpponentSlug(club.name, cree.id) } });
    console.log(`  [adversaire] créé : ${club.name}`);
  }
}

function clubDuLien(texte: string): string | null {
  return LIENS.find(([re]) => re.test(texte))?.[1] ?? null;
}

const argSaison = process.argv.find((a) => a.startsWith("--saison="))?.slice("--saison=".length);
if (!argSaison || !SAISONS[argSaison]) {
  console.error(`Usage : --saison=${Object.keys(SAISONS).join("|")} [--dry]`);
  process.exit(1);
}
const SAISON = argSaison;
const FICHE = SAISONS[SAISON];
const START_YEAR = FICHE.startYear;

interface Rencontre {
  entree: EntreeAncienne;
  date: Date;
  jour: string;
  kickoffTime: string | null;
  /** Vrai quand le jour vient du samedi de l'en-tête, faute de calendrier. */
  dateProbable: boolean;
  /** Ce que le calendrier dit du lieu, tel quel. */
  creneau: string | null;
  /** D'où vient la date quand elle est probable, pour l'attestation. */
  sourceDate: string | null;
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
 *
 * Ligne = recevant, colonne = visiteur. Les colonnes suivent l'ordre des
 * lignes — les en-têtes sont des abréviations, qui changent d'une saison à
 * l'autre —, et la case grise de la diagonale le vérifie : un tableau dont la
 * diagonale ne tombe pas juste est écarté. Les lignes s'ouvrent sur `! scope=
 * "row"` en 2003-2004, sur `| align="left" |` avant.
 */
function tableauCroise(wiki: string): Map<string, [number, number]> {
  for (const bloc of wiki.split(/^\{\|/m).slice(1)) {
    const tableau = bloc.slice(0, bloc.search(/^\|\}/m));
    const lignes = tableau.split(/^(?=! scope="row"|\| align="left" \|)/m).slice(1);
    if (lignes.length < 4 || !lignes.some((l) => /perpignan/i.test(l.split("\n")[0]))) continue;
    const clubs = lignes.map((l) => clubDuLien(l.split("\n")[0]));
    // `[ \t]*` et non `\s*` : la case vide de la diagonale avalerait sinon la
    // ligne suivante, et décalerait toute la rangée d'une colonne.
    const cases = lignes.map((l) => [...l.matchAll(/^\|\s*style="background:#(\w+);?"\s*\|[ \t]*([^\n]*)$/gm)]);
    const carre = cases.every((c, i) => c.length === lignes.length && c[i][1].toUpperCase() === "CCCCCC");
    if (!carre || clubs.some((c) => !c)) continue;
    const scores = new Map<string, [number, number]>();
    cases.forEach((rangee, i) =>
      rangee.forEach((c, k) => {
        const s = /(\d+)\s*[-–]\s*(\d+)/.exec(c[2].replace(/'/g, ""));
        if (k !== i && s) scores.set(`${clubs[i]}|${clubs[k]}`, [Number(s[1]), Number(s[2])]);
      }),
    );
    return scores;
  }
  throw new Error("Wikipédia : tableau croisé de la poule de l'USAP introuvable");
}

interface RencontreDatee {
  /** Le jour, ou les jours du week-end quand la page écrit « 30-31 mars ». */
  jours: string[];
  recevant: string;
  visiteur: string;
  score: [number, number];
}

const MOIS_WIKI = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function moisDe(texte: string): number | null {
  if (/^\d+$/.test(texte)) return Number(texte);
  const m = MOIS_WIKI.indexOf(texte.toLowerCase()) + 1;
  return m > 0 ? m : null;
}

const iso = (annee: number, mois: number, jour: number) =>
  `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;

/**
 * Les rencontres datées de la page — phase qualificative et phase finale.
 *
 * Les poules s'écrivent « | {{date|15 mars}} || recevant || visiteur ||
 * score » en 2002-2003, « | 30-{{date-|31 mars}} || … » en 2001-2002 — un
 * week-end, non un jour —, et le score au milieu en 2003-2004 : la colonne du
 * score est celle qui ne porte pas de lien. Les phases finales sont dans le
 * modèle à cases, `|D1-info=… {{date|31|5|2003…}}`, `|D1-E1=`, `|D1-S1=`.
 */
function rencontresDatees(wiki: string): RencontreDatee[] {
  const sortie: RencontreDatee[] = [];
  const re = /^\|\s*(?:(\d+)-)?\{\{date-?\|(\d+)(?:er)? (\p{L}+)\}\}\s*\|\|(.+?)\|\|(.+?)\|\|(.+)$/gmu;
  for (const m of wiki.matchAll(re)) {
    const mois = moisDe(m[3]);
    if (!mois) continue;
    const annee = anneeDuMois(mois, START_YEAR);
    const colonnes = [m[4], m[5], m[6]];
    const iScore = colonnes.findIndex((c) => !c.includes("[[") && /\d+\D+?\d+/.test(c.replace(/'/g, "")));
    if (iScore < 0) continue;
    const [r, v] = colonnes.filter((_, i) => i !== iScore).map(clubDuLien);
    const s = /(\d+)\D+?(\d+)/.exec(colonnes[iScore].replace(/align="\w+"\s*\|/, "").replace(/'/g, ""));
    if (!r || !v || !s) continue;
    const premier = m[1] ? Number(m[1]) : Number(m[2]);
    const jours = [];
    for (let j = premier; j <= Number(m[2]); j++) jours.push(iso(annee, mois, j));
    sortie.push({ jours, recevant: r, visiteur: v, score: [Number(s[1]), Number(s[2])] });
  }
  for (const k of wiki.matchAll(/^\|([A-Z]\d+)-info=(.*)$/gm)) {
    const champ = (n: string) => new RegExp(`^\\|${k[1]}-${n}=(.*)$`, "m").exec(wiki)?.[1] ?? "";
    const d = /\{\{date\|(\d+)(?:er)?\|(\p{L}+|\d+)\|(\d{4})/u.exec(k[2]);
    const mois = d ? moisDe(d[2]) : null;
    const r = clubDuLien(champ("E1"));
    const v = clubDuLien(champ("E2"));
    const s1 = /(\d+)/.exec(champ("S1"));
    const s2 = /(\d+)/.exec(champ("S2"));
    if (!d || !mois || !r || !v || !s1 || !s2) continue;
    sortie.push({
      jours: [iso(Number(d[3]), mois, Number(d[1]))],
      recevant: r,
      visiteur: v,
      score: [Number(s1[1]), Number(s2[1])],
    });
  }
  return sortie;
}

// ---------------------------------------------------------------- LNR

/**
 * Le jour de chaque journée d'après la page de saison d'un club : « date=
 * '''Match 12'''<br> Dimanche 7 janvier 2001 ». La première série seulement —
 * les coupes d'Europe suivent, numérotées de nouveau à partir de 1.
 */
function joursDesJournees(wiki: string): Map<number, string> {
  const jours = new Map<number, string>();
  let derniere = 0;
  for (const m of wiki.matchAll(/date='''Match (\d+)'''<br>\s*\p{L}+ (\d+)(?:er)? (\p{L}+) (\d{4})/gu)) {
    const n = Number(m[1]);
    if (n <= derniere) break;
    derniere = n;
    const mois = moisDe(m[3]);
    if (mois) jours.set(n, iso(Number(m[4]), mois, Number(m[2])));
  }
  return jours;
}

/** Le samedi le plus proche du milieu de deux jours. */
function samediAuMilieu(avant: string, apres: string): string {
  const milieu = (Date.parse(`${avant}T12:00:00Z`) + Date.parse(`${apres}T12:00:00Z`)) / 2;
  const decalage = (6 - new Date(milieu).getUTCDay() + 7) % 7;
  const t = milieu + (decalage <= 3 ? decalage : decalage - 7) * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Faute de calendrier : le jour de la journée chez un autre club, ou entre deux. */
function dateEstimee(
  e: EntreeAncienne,
  journees: Map<number, string>,
  datees: RencontreDatee[],
): { jour: string; source: string } | null {
  if (e.phase === "finale") {
    const clubs = [CLUBS[e.recevant], CLUBS[e.visiteur]];
    const w = datees.find((d) => clubs.includes(d.recevant) && clubs.includes(d.visiteur));
    return w && w.jours.length === 1 ? { jour: w.jours[0], source: `Wikipédia, page de la saison ${SAISON}` } : null;
  }
  if (e.journee == null) return null;
  const page = `Wikipédia, « ${FICHE.datesDeJournee?.replace(/_/g, " ")} »`;
  const jour = journees.get(e.journee);
  if (jour) return { jour, source: `${page} : jour du match de la ${e.journee}e journée, dans l'autre poule` };
  const avant = journees.get(e.journee - 1);
  const apres = journees.get(e.journee + 1);
  if (!avant || !apres) return null;
  return {
    jour: samediAuMilieu(avant, apres),
    source: `${page}, exempt à la ${e.journee}e journée : samedi à mi-chemin des journées ${e.journee - 1} et ${e.journee + 1}`,
  };
}

async function lire(echecs: string[], wiki: string): Promise<Rencontre[]> {
  const brutes = lignesDe(await lirePageLnrArchivee(FICHE.resultats.url, FICHE.resultats.instantane));
  const journees = FICHE.datesDeJournee ? joursDesJournees(await wikitexte(FICHE.datesDeJournee)) : new Map<number, string>();
  const datees = rencontresDatees(wiki);
  const resultats = (FICHE.lecteur === "2000" ? lireResultats2000(brutes) : lireTableau(brutes))
    .filter((e) => e.phase !== "maintien")
    .filter((e) => e.recevant === "Perpignan" || e.visiteur === "Perpignan");

  // Le dernier calendrier qui nomme la rencontre fait foi ; un changement
  // d'une capture à l'autre est un report, et se dit.
  const creneaux = new Map<string, EntreeAncienne>();
  for (const cal of FICHE.calendriers) {
    const entrees = lireTableau(lignesDe(await lirePageLnrArchivee(cal.url, cal.instantane)));
    for (const e of entrees) {
      if (e.recevant !== "Perpignan" && e.visiteur !== "Perpignan") continue;
      const avant = creneaux.get(cleDe(e));
      const avantJour = avant ? lireCreneau(avant.suite, START_YEAR, avant.enTete)?.jour : null;
      const apresJour = lireCreneau(e.suite, START_YEAR, e.enTete)?.jour;
      if (avantJour && apresJour && avantJour !== apresJour) {
        console.log(`  [report] ${e.recevant} / ${e.visiteur} : ${avantJour} → ${apresJour} (capture ${cal.instantane})`);
      }
      creneaux.set(cleDe(e), e);
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

    const cal = creneaux.get(cleDe(e)) ?? null;
    const creneau = cal ? lireCreneau(cal.suite, START_YEAR, cal.enTete) : null;
    let jour = creneau?.jour ?? null;
    const dateProbable = !jour;
    let sourceDate: string | null = null;
    if (!jour && FICHE.datesDeJournee) {
      const estimee = dateEstimee(e, journees, datees);
      if (estimee) ({ jour, source: sourceDate } = estimee);
    } else if (!jour) {
      jour = samediDeLEnTete(e.enTete, START_YEAR);
      sourceDate = `Samedi de la journée (« ${e.enTete} »), faute de jour au calendrier`;
    }
    if (!jour) {
      echecs.push(`${libelle} : ni calendrier ni en-tête lisible (« ${e.enTete} »)`);
      continue;
    }
    // Le jour tiré du calendrier doit tomber dans la journée que nomment les
    // résultats, à trois jours près : sinon le rapprochement s'est trompé.
    const nommes = joursDeLEnTete(e.enTete, START_YEAR).map((j) => Date.parse(j));
    const ecart = nommes.length ? Math.min(...nommes.map((t) => Math.abs(t - Date.parse(jour)))) : 0;
    if (ecart > 3 * 86_400_000) {
      echecs.push(`${libelle} : le ${jour} tombe loin de la journée « ${e.enTete} »`);
      continue;
    }
    const heure = creneau?.heure ?? null;

    let round: string | null = null;
    if (e.phase === "qualificative") round = FICHE.pouleQualificative;
    if (e.phase === "finale") round = e.tour;

    rencontres.push({
      entree: e,
      // Sans heure, midi UTC, comme `momentDuMatch` : le jour est le même partout.
      date: heure ? instantDeParis(jour, heure) : new Date(`${jour}T12:00:00Z`),
      jour,
      kickoffTime: heure,
      dateProbable,
      creneau: cal?.suite ?? null,
      sourceDate,
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
    // La poule qualificative se joue en aller et retour : le même ordre
    // d'abord, et le même jour s'il y en a deux. Sur terrain neutre seulement,
    // Wikipédia peut nommer les deux clubs dans l'autre ordre que la LNR, et
    // le score se retourne avec eux.
    const memeOrdre = datees.filter((d) => d.recevant === recevant && d.visiteur === visiteur);
    const w =
      memeOrdre.find((d) => d.jours.includes(r.jour)) ??
      memeOrdre[0] ??
      datees.find((d) => d.recevant === visiteur && d.visiteur === recevant && r.entree.phase === "finale");
    if (!w) {
      echecs.push(`${r.round} ${recevant}-${visiteur} : absent des tableaux datés de Wikipédia`);
      continue;
    }
    const score = w.recevant === recevant ? w.score : [w.score[1], w.score[0]];
    if (score[0] !== lnr[0] || score[1] !== lnr[1]) {
      echecs.push(`${r.round} ${recevant}-${visiteur} : LNR ${lnr.join("-")}, Wikipédia ${score.join("-")}`);
    } else if (!w.jours.includes(r.jour)) {
      echecs.push(`${r.round} ${recevant}-${visiteur} : LNR le ${r.jour}, Wikipédia le ${w.jours.join(" ou ")}`);
    } else confrontees++;
  }
  console.log(`\n  Wikipédia : ${confrontees}/${rencontres.length} rencontres concordantes (score, et date quand elle en donne une)`);

  for (const phase of ["préliminaire", "qualificative"] as const satisfies readonly PhaseAncienne[]) {
    const attendu = FICHE.classements[phase];
    if (!attendu) continue;
    const jouees = rencontres.filter((r) => r.entree.phase === phase);
    const res = jouees.map((r) => resultatDe(r));
    const totaux: Totaux = {
      wins: res.filter((x) => x === MatchResult.VICTOIRE).length,
      draws: res.filter((x) => x === MatchResult.NUL).length,
      losses: res.filter((x) => x === MatchResult.DEFAITE).length,
      pointsFor: jouees.reduce((s, r) => s + r.scoreUsap, 0),
      pointsAgainst: jouees.reduce((s, r) => s + r.scoreOpponent, 0),
      points: res.reduce((s, x) => s + matchPoints(x, false, false, START_YEAR), 0),
    };
    const ecarts = (Object.keys(attendu) as Array<keyof Totaux>)
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
  const wiki = await wikitexte(FICHE.wikipedia);
  const rencontres = (await lire(echecs, wiki)).sort((a, b) => a.date.getTime() - b.date.getTime());
  confronter(rencontres, wiki, echecs);

  // Un écart avec la contre-source arrête tout : rien n'est écrit sur une
  // saison qui ne retombe pas.
  if (echecs.length > 0 && !DRY_RUN) {
    console.log(`\n=== ${echecs.length} échec(s), rien n'est écrit ===`);
    for (const e of echecs) console.log(`  ⚠ ${e}`);
    process.exitCode = 1;
    return;
  }

  console.log("");
  await creerClubs();
  let crees = 0;
  let majs = 0;
  for (const r of rencontres) {
    const opponent = await prisma.opponent.findFirst({
      where: { OR: [{ shortName: r.opponentNom }, { name: r.opponentNom }] },
      select: { id: true },
    });
    if (!opponent) {
      // En simulation, un club à créer n'existe pas encore : on le dit, sans échec.
      if (DRY_RUN && CLUBS_A_CREER.some((c) => c.shortName === r.opponentNom)) {
        console.log(`${r.jour} ${r.kickoffTime ?? "  :  "} J${r.matchday ?? r.round} ${r.opponentNom} ${r.scoreUsap}-${r.scoreOpponent} [adversaire à créer] | LNR : ${r.creneau ?? "?"}`);
        continue;
      }
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

    console.log(
      `${r.jour} ${r.kickoffTime ?? "  :  "} ${(r.matchday ? `J${r.matchday}` : (r.round ?? "")).padEnd(12)} ` +
        `${r.isHome ? "H" : "A"} ${r.opponentNom.padEnd(15)} ${r.scoreUsap}-${r.scoreOpponent}` +
        `${bonus.bonusOffensif ? " BO" : ""}${bonus.bonusDefensif ? " BD" : ""}` +
        `${r.dateProbable ? " [date probable]" : ""} | base : ${stade ?? "—"} | LNR : ${r.creneau ?? "?"}`,
    );

    if (DRY_RUN) continue;

    const existant = await prisma.match.findFirst({
      where: { seasonId: saison.id, opponentId: opponent.id, date: journeeDeParis(r.jour) },
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
      source: `Ancien site de la LNR, résultats et calendrier ${SAISON} (Wayback Machine)`,
      sourceUrl: adresseArchivee(FICHE.resultats.url, FICHE.resultats.instantane),
      note: "Score confronté à la page de la saison sur Wikipédia : concordant.",
    });
    if (r.dateProbable) {
      await attester(prisma, {
        entite: "Match",
        entiteId: id,
        champ: "date",
        degre: "PROBABLE",
        source: r.sourceDate ?? "Date estimée",
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

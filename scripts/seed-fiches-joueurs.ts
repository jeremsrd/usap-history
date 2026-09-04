/**
 * Données personnelles et biographie des joueurs, depuis Wikipédia.
 *
 * La fiche joueur affiche une nationalité, une date et un lieu de naissance,
 * une taille et un poids — et **ces cinq champs étaient vides sur 341 fiches
 * sur 351**. Ni la LNR ni l'EPCR ne les publient : ils viennent de Wikipédia,
 * avec la réserve habituelle.
 *
 * **L'IDENTITÉ EST GARANTIE PAR LA CATÉGORIE, PAS PAR LE TITRE.** Un article
 * intitulé « Lucas Dubois » ne prouve rien — c'est le piège des homonymes que
 * `fetch-player-photos.ts` a déjà rencontré sur Commons. Wikipédia classe en
 * revanche ses joueurs par club : l'article retenu doit porter une **catégorie
 * citant Perpignan**, faute de quoi il est refusé. Sur les 351 fiches, 191
 * passent ce contrôle, 22 ont un article sans la catégorie, 7 tombent sur une
 * page d'homonymie — correctement écartée — et 131 n'ont pas d'article.
 *
 * `ARTICLES_SANS_CATEGORIE` dispense les recrues que Wikipédia n'a pas encore
 * rattachées au club. Comme sa jumelle de `fetch-player-photos.ts`, **chaque
 * ligne est une affirmation vérifiée à la main** : y inscrire un nom, c'est
 * répondre de l'identité à la place du contrôle.
 *
 * CE QUI EST LU, ET CE QUI NE L'EST PAS. L'infobox donne la date, la ville et
 * le pays de naissance, la taille, le poids et le surnom : tout cela est
 * écrit. Elle donne aussi le **poste**, et il n'est pas repris — le projet le
 * déduit du numéro de maillot, ce qui est plus sûr, et un poste de référence
 * faux se propage à toutes les lignes de remplaçant du joueur (cf. CLAUDE.md).
 *
 * **LA BIOGRAPHIE EST COMPOSÉE, PAS RECOPIÉE.** Reprendre le résumé de
 * Wikipédia poserait une question de licence — CC BY-SA exige l'attribution,
 * comme les photos de Commons. La phrase est donc écrite à partir des faits
 * extraits et de ce que la base établit déjà : poste, naissance, surnom, et
 * les titres gagnés sous le maillot catalan. Les six biographies rédigées à la
 * main sont conservées telles quelles.
 *
 * **LE POIDS N'Y EST PAS**, et ce n'est pas un défaut de lecture : le modèle
 * `Infobox Rugbyman` ne porte pas ce champ. La fiche l'affiche pourtant, et il
 * restera vide tant qu'une autre source ne le donnera pas.
 *
 * Wikipédia limite le débit de son API : les requêtes sont groupées et
 * espacées, et une réponse non-JSON est rejouée après une attente croissante.
 * **Dix titres par appel, pas davantage** : `prop=categories` plafonne le
 * nombre total de catégories rendues, et un lot de vingt-cinq faisait passer
 * cinquante articles bien réels pour introuvables.
 *
 * Usage : npx tsx scripts/seed-fiches-joueurs.ts [--dry] [--joueur="Prénom Nom"]
 */
import { PrismaClient } from "@prisma/client";
import { POSITIONS } from "../src/lib/constants";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry");
const JOUEUR = process.argv.find((a) => a.startsWith("--joueur="))?.slice("--joueur=".length);

/** Recrues dont l'article existe sans porter encore la catégorie du club. */
const ARTICLES_SANS_CATEGORIE = new Set<string>([]);

const dodo = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function api(params: Record<string, string>, essai = 0): Promise<Record<string, unknown>> {
  const u = new URL("https://fr.wikipedia.org/w/api.php");
  for (const [k, v] of Object.entries({ ...params, format: "json", formatversion: "2" })) {
    u.searchParams.set(k, v);
  }
  const r = await fetch(u, {
    headers: { "User-Agent": "usap-history/1.0 (https://github.com/jeremsrd/usap-history)" },
  });
  const t = await r.text();
  try {
    return JSON.parse(t) as Record<string, unknown>;
  } catch {
    // Le plafonnement de débit répond en texte, pas en JSON.
    if (essai >= 4) throw new Error(`Wikipédia : ${t.slice(0, 80)}`);
    console.log(`  ↻ Wikipédia limite le débit — reprise ${essai + 1}/4`);
    await dodo(4000 * (essai + 1));
    return api(params, essai + 1);
  }
}

const MOIS: Record<string, number> = {
  janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, décembre: 12, decembre: 12,
};

/** `{{date|5|10|1995|…}}` ou `{{date|21|juillet|1997|…}}`. */
function lireDate(valeur: string): Date | null {
  const m = valeur.match(/\{\{[Dd]ate[^|]*\|\s*(\d{1,2})\s*\|\s*([^|]+?)\s*\|\s*(\d{4})/);
  if (!m) return null;
  const jour = Number(m[1]);
  const mois = /^\d+$/.test(m[2]) ? Number(m[2]) : MOIS[m[2].toLowerCase()];
  if (!mois || !jour) return null;
  return new Date(Date.UTC(Number(m[3]), mois - 1, jour));
}

/** `[[Céret]]`, `[[Perpignan|sa ville]]`, `Céret` — on garde le libellé lisible. */
function lireLien(valeur: string): string | null {
  const v = valeur
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/\[\[([^|\]]*)\|([^\]]*)\]\]/g, "$2")
    .replace(/\[\[([^\]]*)\]\]/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/'''?/g, "")
    .trim();
  return v || null;
}

/** `{{taille|m=1.85}}` → 185 cm ; `{{poids|kg=104}}` → 104. */
function lireMesure(valeur: string, unite: "m" | "kg"): number | null {
  const m = valeur.match(new RegExp(`${unite}\\s*=\\s*([\\d.,]+)`));
  if (m) {
    const n = Number(m[1].replace(",", "."));
    return unite === "m" ? Math.round(n * 100) : Math.round(n);
  }
  const brut = valeur.match(/([\d.,]+)/);
  if (!brut) return null;
  const n = Number(brut[1].replace(",", "."));
  if (unite === "m") return n < 3 ? Math.round(n * 100) : Math.round(n);
  return Math.round(n);
}

interface Infobox {
  naissance: Date | null;
  ville: string | null;
  pays: string | null;
  taille: number | null;
  poids: number | null;
  surnom: string | null;
  /** Poste tel que l'infobox l'écrit. **Jamais écrit dans `Player.position`** :
   *  il n'entre que dans la phrase de biographie, où il ne se propage nulle
   *  part. Le poste de référence, lui, se déduit du numéro de maillot. */
  poste: string | null;
}

function lireInfobox(wikitexte: string): Infobox | null {
  const debut = wikitexte.search(/\{\{Infobox/i);
  if (debut < 0) return null;
  // On coupe au premier saut de ligne suivi de `}}` en début de ligne.
  const fin = wikitexte.indexOf("\n}}", debut);
  const bloc = wikitexte.slice(debut, fin < 0 ? debut + 4000 : fin);
  // Le nom du champ est échappé : « position (rugby à XV) » porte des
  // parenthèses, que l'expression régulière prendrait pour un groupe — le
  // poste ne se lisait jamais.
  const champ = (nom: string): string | null => {
    const echappe = nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = bloc.match(new RegExp(`\\|\\s*${echappe}\\s*=([^\\n]*)`, "i"));
    return m ? m[1].trim() : null;
  };
  const ville = champ("ville de naissance");
  const pays = champ("pays de naissance");
  const taille = champ("taille");
  const poids = champ("poids");
  const surnom = champ("surnom");
  const poste = champ("position (rugby à XV)") ?? champ("position");
  return {
    poste: poste ? ((lireLien(poste) ?? "").split(",")[0].trim() || null) : null,
    naissance: lireDate(champ("date de naissance") ?? ""),
    ville: ville ? lireLien(ville) : null,
    pays: pays ? lireLien(pays) : null,
    taille: taille ? lireMesure(taille, "m") : null,
    poids: poids ? lireMesure(poids, "kg") : null,
    surnom: surnom ? lireLien(surnom) : null,
  };
}

/** Titres gagnés sous le maillot catalan, d'après les saisons et les feuilles. */
function titres(saisons: Array<{ label: string; division: string; champion: boolean }>): string | null {
  const gagnees = [...saisons].sort((a, b) => a.label.localeCompare(b.label));
  const top14 = gagnees.filter((s) => s.champion && s.division === "TOP_14").map((s) => s.label.slice(5));
  const prod2 = gagnees.filter((s) => s.champion && s.division === "PRO_D2").map((s) => s.label.slice(5));
  const bouts: string[] = [];
  const liste = (a: string[]) => (a.length > 1 ? `${a.slice(0, -1).join(", ")} et ${a[a.length - 1]}` : a[0]);
  if (top14.length) bouts.push(`champion de France ${liste(top14)}`);
  if (prod2.length) bouts.push(`champion de France de Pro D2 ${liste(prod2)}`);
  if (bouts.length === 0) return null;
  const phrase = bouts.join(", ");
  return `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)} avec l'USAP.`;
}

async function main() {
  console.log(`=== Fiches joueurs depuis Wikipédia${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const joueurs = await prisma.player.findMany({
    where: {
      OR: [{ matchAppearances: { some: { isOpponent: false } } }, { seasonSquads: { some: {} } }],
      ...(JOUEUR
        ? { firstName: JOUEUR.split(" ")[0], lastName: JOUEUR.split(" ").slice(1).join(" ") }
        : {}),
    },
    select: {
      id: true, firstName: true, lastName: true, position: true, biography: true,
      birthDate: true, birthPlace: true, height: true, weight: true,
      matchAppearances: {
        where: { isOpponent: false },
        select: { match: { select: { season: { select: { label: true, division: true, champion: true } } } } },
      },
    },
    orderBy: { lastName: "asc" },
  });

  // ---- Les articles, et le contrôle d'identité -----------------------------
  const titres_ = joueurs.map((j) => `${j.firstName} ${j.lastName}`);
  const retenus = new Map<string, string>();
  const refuses: string[] = [];
  const introuvables: string[] = [];
  let sansArticle = 0;
  // **Dix titres par appel, et pas vingt-cinq.** `prop=categories` plafonne le
  // nombre total de catégories rendues : au-delà, l'API tronque et poursuit en
  // continuation. Un lot trop large rendait donc des pages sans catégorie, que
  // le contrôle refusait — cinquante articles bien réels s'y perdaient.
  for (let i = 0; i < titres_.length; i += 10) {
    const lot = titres_.slice(i, i + 10);
    const d = await api({ action: "query", prop: "categories", cllimit: "max", titles: lot.join("|"), redirects: "1" });
    const q = (d.query ?? {}) as Record<string, unknown>;
    const parTitre = new Map<string, Record<string, unknown>>();
    for (const p of (q.pages ?? []) as Record<string, unknown>[]) parTitre.set(String(p.title), p);
    const vers = new Map<string, string>();
    for (const n of [...((q.normalized ?? []) as { from: string; to: string }[]), ...((q.redirects ?? []) as { from: string; to: string }[])]) {
      vers.set(n.from, n.to);
    }
    for (const t of lot) {
      let cible = vers.get(t) ?? t;
      cible = vers.get(cible) ?? cible;
      const p = parTitre.get(cible);
      if (!p || p.missing) { sansArticle++; introuvables.push(t); continue; }
      const cats = ((p.categories ?? []) as { title: string }[]).map((c) => c.title);
      if (cats.some((c) => /homonymie/i.test(c))) { refuses.push(`${t} — page d'homonymie`); continue; }
      if (!cats.some((c) => /Perpignan/i.test(c)) && !ARTICLES_SANS_CATEGORIE.has(t)) {
        refuses.push(`${t} — article sans catégorie Perpignan`);
        continue;
      }
      retenus.set(t, cible);
    }
    await dodo(900);
  }
  console.log(`${titres_.length} fiches : ${retenus.size} articles retenus, ${refuses.length} refusés, ${sansArticle} sans article\n`);
  if (process.argv.includes("--introuvables")) {
    console.log("sans article :", introuvables.join(", "), "\n");
  }

  // ---- Les faits, puis l'écriture -----------------------------------------
  const pays = new Map((await prisma.country.findMany()).map((c) => [c.name.toLowerCase(), c.id]));
  const parNom = new Map(joueurs.map((j) => [`${j.firstName} ${j.lastName}`, j]));
  const cibles = [...retenus.entries()];
  let ecrits = 0, bios = 0, sansInfobox = 0;

  for (let i = 0; i < cibles.length; i += 8) {
    const lot = cibles.slice(i, i + 8);
    const d = await api({
      action: "query", prop: "revisions", rvprop: "content", rvslots: "main",
      titles: lot.map(([, c]) => c).join("|"), redirects: "1",
    });
    const contenu = new Map<string, string>();
    for (const p of ((d.query ?? {}) as Record<string, unknown>).pages as Record<string, unknown>[] ?? []) {
      const rev = (p.revisions as Record<string, unknown>[] | undefined)?.[0];
      const slot = (rev?.slots as Record<string, { content?: string }> | undefined)?.main;
      if (slot?.content) contenu.set(String(p.title), slot.content);
    }

    for (const [nom, cible] of lot) {
      const j = parNom.get(nom)!;
      const w = contenu.get(cible);
      const info = w ? lireInfobox(w) : null;
      if (!info) { sansInfobox++; continue; }

      const saisons = new Map<string, { label: string; division: string; champion: boolean }>();
      for (const a of j.matchAppearances) saisons.set(a.match.season.label, a.match.season as never);

      // Le poste de la base d'abord — il vient des numéros de maillot ; celui
      // de l'infobox seulement à défaut, et pour la phrase uniquement.
      const poste = j.position ? POSITIONS[j.position]?.label : (info.poste ?? null);
      const phrases: string[] = [];
      const quand = info.naissance
        ? ` né le ${info.naissance.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`
        : "";
      // « à Céret » quand la ville est connue ; « (Fidji) » quand seul le pays
      // l'est, une préposition juste ne se devinant pas d'un nom de pays.
      const ou = info.ville
        ? ` à ${info.ville}`
        : info.pays && info.pays !== "France"
          ? ` (${info.pays})`
          : "";
      const tete = `${poste ?? "Joueur"}${quand}${ou}`;
      if (info.naissance || ou || poste) phrases.push(`${tete}.`);
      if (info.surnom) phrases.push(`Surnommé « ${info.surnom} ».`);
      const palmares = titres([...saisons.values()]);
      if (palmares) phrases.push(palmares);
      // On n'écrase pas une biographie rédigée à la main.
      const bio = j.biography ?? (phrases.length ? phrases.join(" ") : null);

      const donnees = {
        birthDate: j.birthDate ?? info.naissance,
        birthPlace: j.birthPlace ?? info.ville,
        birthCountryId: info.pays ? (pays.get(info.pays.toLowerCase()) ?? null) : null,
        height: j.height ?? info.taille,
        weight: j.weight ?? info.poids,
        biography: bio,
      };
      console.log(
        `  ${nom.padEnd(30)} ${info.naissance ? info.naissance.toISOString().slice(0, 10) : "          "} ` +
          `${(info.ville ?? "").slice(0, 16).padEnd(16)} ${info.taille ?? "   "}cm ${info.poids ?? "   "}kg`,
      );
      if (!DRY_RUN) await prisma.player.update({ where: { id: j.id }, data: donnees });
      ecrits++;
      if (bio && !j.biography) bios++;
    }
    await dodo(900);
  }

  console.log(`\n=== ${ecrits} fiche(s) complétée(s), ${bios} biographie(s) composée(s) ===`);
  console.log(`  ${sansInfobox} article(s) sans infobox exploitable`);
  console.log(`  ${refuses.length} article(s) refusés :`);
  for (const r of refuses.slice(0, 30)) console.log(`     ${r}`);
  if (DRY_RUN) console.log("\nSimulation — relancer sans --dry pour appliquer.");
}

main().finally(() => prisma.$disconnect());

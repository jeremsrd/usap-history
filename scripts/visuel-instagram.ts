/**
 * Fabrique, depuis la base, un visuel Instagram et sa légende.
 *
 * Deux formats fixes, tenables dans la durée, en 1080 × 1350, avec **une seule
 * audace, tirée de la donnée** (`docs/design.md`) : l'image se partage comme le
 * score, chaque camp ayant la hauteur de ses points.
 *
 * - **le bilan du lendemain** (`--bilan=AAAA-MM-JJ`) : le score et les
 *   réalisateurs. Fin de la marche du lendemain de match, une fois la feuille
 *   saisie ;
 * - **« il y a N ans »** (`--ce-jour[=AAAA-MM-JJ]`) : une rencontre jouée ce
 *   même jour de l'année. Une **finale** passe d'abord, puis un anniversaire
 *   rond (25 ou 10, puis 5), puis la plus ancienne. Les autres candidates sont
 *   affichées ; `--annee=AAAA` en impose une. 
 *
 * **Lecture seule sur la base.** Le script n'écrit que dans `visuels/`, hors du
 * dépôt : un `.png` et un `.txt` (légende française, une ligne en catalan), à
 * publier à la main. `--dry` affiche la légende sans rien écrire. Relancer
 * remplace les fichiers du même jour.
 *
 * **Une date incertaine ne fait pas d'anniversaire** : une rencontre attestée
 * `PROBABLE` sur sa date (les journées estimées de 2000-2001) n'entre jamais
 * dans « il y a N ans ». Le jour sans rencontre sûre, le script le dit et ne
 * fabrique rien.
 *
 * **Les réalisateurs doivent tomber juste** : si les lignes de la composition
 * ne redonnent pas les compteurs du match, le bloc est retiré plutôt qu'affiché
 * à moitié.
 *
 * Jamais de photo de presse : seulement ce que la base permet de dessiner.
 *
 * Usage :
 *   npx tsx scripts/visuel-instagram.ts --bilan=2026-10-31 [--dry]
 *   npx tsx scripts/visuel-instagram.ts --ce-jour [--dry]
 *   npx tsx scripts/visuel-instagram.ts --ce-jour=2026-11-04 --annee=2016 [--dry]
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { ImageResponse } from "next/og";
import { createElement as h, type CSSProperties, type ReactNode } from "react";
import sharp from "sharp";
import { BLANC, OR_VIF, SANG, imagePublique, policesOg } from "../src/lib/og";
import { MATCH_JOUE } from "../src/lib/matchs";
import { jourDeParis, journeeDeParis } from "./lib/dates";

const prisma = new PrismaClient();

const LARGEUR = 1080;
const HAUTEUR = 1350;
const DOSSIER = path.join(process.cwd(), "visuels");
const DRY = process.argv.includes("--dry");

/** L'USAP naît en 1933 de la fusion : avant, le club est l'US Perpignanaise. */
const FONDATION_USAP = 1933;

function argument(nom: string): string | undefined {
  const prefixe = `--${nom}=`;
  return process.argv.find((a) => a.startsWith(prefixe))?.slice(prefixe.length);
}

const SELECTION = {
  id: true,
  date: true,
  isHome: true,
  isNeutralVenue: true,
  matchday: true,
  round: true,
  result: true,
  scoreUsap: true,
  scoreOpponent: true,
  triesUsap: true,
  penaltyTriesUsap: true,
  conversionsUsap: true,
  penaltiesUsap: true,
  dropGoalsUsap: true,
  opponent: { select: { name: true, shortName: true, logoUrl: true } },
  competition: { select: { name: true, shortName: true } },
  players: {
    where: { isOpponent: false },
    select: {
      tries: true,
      conversions: true,
      penalties: true,
      dropGoals: true,
      player: { select: { firstName: true, lastName: true } },
    },
  },
} as const;

type Rencontre = NonNullable<Awaited<ReturnType<typeof lireRencontre>>>;

function lireRencontre(id: string) {
  return prisma.match.findUnique({ where: { id }, select: SELECTION });
}

const anneeDe = (m: { date: Date }) => Number(jourDeParis(m.date).slice(0, 4));
const nomAdverse = (m: Rencontre) => m.opponent.shortName || m.opponent.name;
const avantUsap = (m: Rencontre) => anneeDe(m) < FONDATION_USAP;
const sigleClub = (m: Rencontre) => (avantUsap(m) ? "USP" : "USAP");
const clubFr = (m: Rencontre) => (avantUsap(m) ? "l'US Perpignanaise" : "l'USAP");
const clubCa = clubFr;
const score = (m: Rencontre) => `${m.scoreUsap}-${m.scoreOpponent}`;

function intitule(m: Rencontre): string {
  const competition = m.competition.shortName || m.competition.name;
  if (m.matchday) return `${competition}, ${m.matchday === 1 ? "1re" : `${m.matchday}e`} journée`;
  return m.round ? `${competition}, ${m.round}` : competition;
}

function dateLongue(m: Rencontre, locale: "fr-FR" | "ca-ES"): string {
  return m.date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

function lieuFr(m: Rencontre): string {
  return m.isNeutralVenue ? "sur terrain neutre" : m.isHome ? "à domicile" : "à l'extérieur";
}

function lieuCa(m: Rencontre): string {
  return m.isNeutralVenue ? "en terreny neutral" : m.isHome ? "a casa" : "a fora";
}

/** « victoire de l'USAP à domicile contre Toulon, 24-12 », sans majuscule. */
function phraseFr(m: Rencontre): string {
  const contre = `${lieuFr(m)} contre ${nomAdverse(m)}, ${score(m)}`;
  if (m.result === "NUL") return `match nul de ${clubFr(m)} ${contre}`;
  return `${m.result === "VICTOIRE" ? "victoire" : "défaite"} de ${clubFr(m)} ${contre}`;
}

function phraseCa(m: Rencontre): string {
  const contra = `${lieuCa(m)} contra ${nomAdverse(m)}, ${score(m)}`;
  if (m.result === "NUL") return `empat de ${clubCa(m)} ${contra}`;
  return `${m.result === "VICTOIRE" ? "victòria" : "derrota"} de ${clubCa(m)} ${contra}`;
}

const capitale = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Les réalisateurs, ou `null` si les lignes de la composition ne redonnent pas
 * les compteurs du match : une liste à moitié juste est pire que pas de liste.
 */
function realisateurs(m: Rencontre): { essais: string; pied: string } | null {
  if (m.triesUsap == null) return null;
  const marqueurs = m.players.filter((p) => p.tries || p.conversions || p.penalties || p.dropGoals);
  if (marqueurs.some((p) => !p.player)) return null;

  const total = (champ: "tries" | "conversions" | "penalties" | "dropGoals") => marqueurs.reduce((s, p) => s + p[champ], 0);
  const penalite = m.penaltyTriesUsap ?? 0;
  const essaisJustes = total("tries") === m.triesUsap || total("tries") + penalite === m.triesUsap;
  if (!essaisJustes) return null;
  if ((m.conversionsUsap ?? 0) !== total("conversions")) return null;
  if ((m.penaltiesUsap ?? 0) !== total("penalties")) return null;
  if ((m.dropGoalsUsap ?? 0) !== total("dropGoals")) return null;

  const nom = (p: (typeof marqueurs)[number]) => `${p.player!.firstName} ${p.player!.lastName}`;
  // L'espace insécable garde le « ×2 » collé au nom en bout de ligne.
  const essais = marqueurs.filter((p) => p.tries).map((p) => (p.tries > 1 ? `${nom(p)} ×${p.tries}` : nom(p)));
  if (penalite) essais.push(penalite > 1 ? `essai de pénalité ×${penalite}` : "essai de pénalité");
  const pied = marqueurs
    .filter((p) => p.conversions || p.penalties || p.dropGoals)
    .map((p) => {
      const detail = [p.conversions && `${p.conversions} T`, p.penalties && `${p.penalties} P`, p.dropGoals && `${p.dropGoals} D`].filter(Boolean).join(", ");
      return `${nom(p)} (${detail})`;
    });
  return { essais: essais.join(", "), pied: pied.join(", ") };
}

/** Un écusson en `data:` PNG ; le moteur de dessin ne lit pas le WebP. */
async function ecusson(chemin: string | null): Promise<string | null> {
  const donnee = await imagePublique(chemin);
  if (!donnee || !donnee.startsWith("data:image/webp")) return donnee;
  const png = await sharp(Buffer.from(donnee.split(",")[1], "base64")).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

type Enfant = ReactNode;
const bloc = (style: CSSProperties, ...enfants: Enfant[]) => h("div", { style: { display: "flex", ...style } }, ...enfants);
const TITRE = "Archivo Condensed";
const MARGE = 60;

/** L'encre, le papier et les règles du thème clair, cf. `docs/design.md`. */
const ENCRE = "#1b1214";
const PAPIER = "#f8f4f3";
const REGLE = "#dccfcf";

function logo(src: string | null, taille: number) {
  return src
    ? h("img", { src, alt: "", width: taille, height: taille, style: { width: taille, height: taille, objectFit: "contain" } })
    : null;
}

async function dessiner(racine: ReturnType<typeof bloc>): Promise<Buffer> {
  const reponse = new ImageResponse(racine, { width: LARGEUR, height: HAUTEUR, fonts: await policesOg() });
  return Buffer.from(await reponse.arrayBuffer());
}

/** Le pied des deux formats : de quelle rencontre il s'agit, et où lire la suite. */
function pied(texte: string) {
  return bloc(
    { justifyContent: "space-between", alignItems: "baseline", gap: 32, fontSize: 30 },
    bloc({ flex: 1 }, texte),
    bloc({ fontFamily: TITRE, fontSize: 38 }, "usaphistoria.cat"),
  );
}

interface Camp {
  nom: string;
  points: number;
  src: string | null;
  fond: string;
  encre: string;
  chiffre: string;
}

/**
 * Une bande du bilan. **Le chiffre grandit avec sa bande**, dans la limite de
 * la largeur : c'est ce qui fait lire l'écart avant de lire le score.
 */
function bande(camp: Camp, hauteur: number) {
  const signes = String(camp.points).length;
  const place = LARGEUR - 2 * MARGE - 300;
  // Les chiffres d'Archivo condensée noire : 0,72 em de haut, 0,42 em de large.
  const corps = Math.round(Math.min((hauteur - 64) / 0.72, place / (signes * 0.42)));
  const serree = hauteur < 300;
  return bloc(
    { height: hauteur, background: camp.fond, color: camp.encre, alignItems: "center", justifyContent: "space-between", padding: `0 ${MARGE}px`, overflow: "hidden" },
    bloc({ fontFamily: TITRE, fontSize: corps, lineHeight: 1, color: camp.chiffre }, String(camp.points)),
    bloc(
      { flexDirection: "column", alignItems: "center", gap: serree ? 6 : 16, width: 280 },
      logo(camp.src, Math.round(Math.max(84, Math.min(hauteur * 0.42, 230)))),
      bloc({ fontFamily: TITRE, fontSize: serree ? 42 : 64, lineHeight: 1.02, textAlign: "center" }, camp.nom),
    ),
  );
}

/**
 * **L'image se partage comme le score** : chaque camp a la hauteur de ses points,
 * sans écraser le chiffre du perdant. Le dessin des deux formats.
 */
async function partage(m: Rencontre, basDePage: number) {
  const usap = m.scoreUsap!;
  const adverse = m.scoreOpponent!;
  const surface = HAUTEUR - basDePage;
  const MINIMUM = 210;
  const part = usap + adverse === 0 ? 0.5 : usap / (usap + adverse);
  const hauteurUsap = Math.round(Math.max(MINIMUM, Math.min(surface - MINIMUM, surface * part)));
  const logos = avantUsap(m) ? [null, null] : [await ecusson("/images/usap/logo.png"), await ecusson(m.opponent.logoUrl)];
  return [
    // L'or dit « acquis » : il ne sort que sur une victoire.
    bande({ nom: sigleClub(m), points: usap, src: logos[0], fond: SANG, encre: BLANC, chiffre: m.result === "VICTOIRE" ? OR_VIF : BLANC }, hauteurUsap),
    bande({ nom: nomAdverse(m), points: adverse, src: logos[1], fond: PAPIER, encre: ENCRE, chiffre: ENCRE }, surface - hauteurUsap),
  ];
}

async function visuelBilan(m: Rencontre): Promise<{ image: Buffer; legende: string }> {
  const faits = realisateurs(m);

  const lignes = (faits?.essais ? Math.ceil(`Essais  ${faits.essais}`.length / 56) : 0) + (faits?.pied ? Math.ceil(`Au pied  ${faits.pied}`.length / 56) : 0);
  const basDePage = 150 + (lignes ? lignes * 44 + 24 : 0);

  const ligne = (titre: string, valeur: string) =>
    bloc({ fontSize: 32, lineHeight: 1.35, gap: 18 }, bloc({ fontFamily: TITRE, flexShrink: 0, width: 112, color: REGLE }, titre), bloc({ flex: 1 }, valeur));

  const racine = bloc(
    { width: "100%", height: "100%", flexDirection: "column", fontFamily: "Archivo", background: ENCRE },
    ...(await partage(m, basDePage)),
    bloc(
      { flex: 1, flexDirection: "column", justifyContent: "center", gap: 24, color: PAPIER, padding: `0 ${MARGE}px` },
      ...(faits?.essais || faits?.pied
        ? [
            bloc(
              { flexDirection: "column", gap: 6 },
              ...(faits?.essais ? [ligne("Essais", faits.essais)] : []),
              ...(faits?.pied ? [ligne("Au pied", faits.pied)] : []),
            ),
          ]
        : []),
      pied(`${intitule(m)}, le ${dateLongue(m, "fr-FR")}`),
    ),
  );

  const legende = [
    `${capitale(phraseFr(m))}.`,
    `${intitule(m)}, le ${dateLongue(m, "fr-FR")}.`,
    ...(faits?.essais ? [`Essais : ${faits.essais.replace(/ /g, " ")}.`] : []),
    ...(faits?.pied ? [`Au pied : ${faits.pied}.`] : []),
    "",
    `${capitale(phraseCa(m))}.`,
    "",
    "La fiche du match sur usaphistoria.cat",
    "#USAP #Perpignan #Rugby #SangEtOr",
  ].join("\n");
  return { image: await dessiner(racine), legende };
}

async function visuelCeJour(m: Rencontre, n: number): Promise<{ image: Buffer; legende: string }> {
  const ans = n > 1 ? `${n} ans` : "1 an";
  const anys = n > 1 ? `${n} anys` : "1 any";
  const racine = bloc(
    { width: "100%", height: "100%", flexDirection: "column", fontFamily: "Archivo", background: ENCRE },
    ...(await partage(m, 330)),
    bloc(
      { flex: 1, flexDirection: "column", justifyContent: "center", color: PAPIER, padding: `0 ${MARGE}px` },
      bloc({ fontFamily: TITRE, fontSize: 132, lineHeight: 1 }, `Il y a ${ans}`),
      bloc({ marginTop: 20 }),
      pied(`${intitule(m)}, le ${dateLongue(m, "fr-FR")}`),
    ),
  );
  const legende = [
    `Il y a ${ans} jour pour jour, le ${dateLongue(m, "fr-FR")} : ${phraseFr(m)}.`,
    `${intitule(m)}.`,
    "",
    `Fa ${anys}, el ${dateLongue(m, "ca-ES")}: ${phraseCa(m)}.`,
    "",
    "Toute l'histoire du club sur usaphistoria.cat",
    "#USAP #Perpignan #Rugby #SangEtOr",
  ].join("\n");
  return { image: await dessiner(racine), legende };
}

/**
 * Les rencontres dont la date n'est que probable. Le champ vide ne compte pas :
 * sur les finales de 1914 et de 1925, c'est le score qui est `PROBABLE`, et
 * *L'Auto* du lendemain en établit la date.
 */
async function datesIncertaines(): Promise<Set<string>> {
  const lignes = await prisma.attestation.findMany({
    where: { entite: "Match", degre: "PROBABLE", champ: "date" },
    select: { entiteId: true },
  });
  return new Set(lignes.map((l) => l.entiteId));
}

/** Finale d'abord, puis anniversaire rond, puis la plus ancienne. */
function rang(m: { round: string | null }, n: number): number[] {
  const finale = /^finale/i.test(m.round ?? "") ? 1 : 0;
  const rond = n % 25 === 0 || n % 10 === 0 ? 2 : n % 5 === 0 ? 1 : 0;
  return [finale, rond, n];
}

function compareRangs(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return b[i] - a[i];
  return 0;
}

async function choisirCeJour(jour: string, anneeImposee: number | null): Promise<{ id: string; n: number } | null> {
  const [incertaines, jouees] = await Promise.all([
    datesIncertaines(),
    prisma.match.findMany({
      where: MATCH_JOUE,
      select: { id: true, date: true, round: true, slug: true },
    }),
  ]);
  const annee = Number(jour.slice(0, 4));
  const candidates = jouees
    .filter((m) => jourDeParis(m.date).slice(5) === jour.slice(5) && anneeDe(m) < annee && !incertaines.has(m.id))
    .map((m) => ({ ...m, n: annee - anneeDe(m) }))
    .sort((a, b) => compareRangs(rang(a, a.n), rang(b, b.n)));

  if (candidates.length > 1) {
    console.log(`${candidates.length} candidates :`);
    for (const c of candidates) console.log(`  ${anneeDe(c)} (${c.n} ans)  ${c.slug}`);
  }
  const choix = anneeImposee ? candidates.find((c) => anneeDe(c) === anneeImposee) : candidates[0];
  return choix ? { id: choix.id, n: choix.n } : null;
}

async function publier(nom: string, resultat: { image: Buffer; legende: string }) {
  console.log(`\n${resultat.legende}\n`);
  if (DRY) {
    console.log(`[dry] ${nom}.png et ${nom}.txt ne sont pas écrits (${resultat.image.length} octets dessinés).`);
    return;
  }
  await mkdir(DOSSIER, { recursive: true });
  const png = path.join(DOSSIER, `${nom}.png`);
  await writeFile(png, resultat.image);
  await writeFile(path.join(DOSSIER, `${nom}.txt`), `${resultat.legende}\n`);
  console.log(`Écrit : ${png} (et ${nom}.txt)`);
}

async function main() {
  const bilan = argument("bilan");
  const ceJourDonne = argument("ce-jour");
  const ceJour = ceJourDonne ?? (process.argv.includes("--ce-jour") ? jourDeParis(new Date()) : undefined);
  const jourValide = /^\d{4}-\d{2}-\d{2}$/;

  if (bilan && jourValide.test(bilan)) {
    const trouvees = await prisma.match.findMany({ where: { date: journeeDeParis(bilan) }, select: { id: true, result: true } });
    if (trouvees.length !== 1) throw new Error(`${trouvees.length} rencontre(s) le ${bilan}, il en faut une.`);
    if (!trouvees[0].result) throw new Error(`La rencontre du ${bilan} n'a pas de score : set-score.ts d'abord.`);
    const m = await lireRencontre(trouvees[0].id);
    await publier(`${bilan}-bilan`, await visuelBilan(m!));
    return;
  }

  if (ceJour && jourValide.test(ceJour)) {
    const annee = argument("annee");
    const choix = await choisirCeJour(ceJour, annee ? Number(annee) : null);
    if (!choix) {
      console.log(`Aucune rencontre à la date sûre pour le ${ceJour}${annee ? ` en ${annee}` : ""} : rien à publier.`);
      return;
    }
    const m = await lireRencontre(choix.id);
    await publier(`${ceJour}-il-y-a-${choix.n}-ans`, await visuelCeJour(m!, choix.n));
    return;
  }

  throw new Error("Usage : --bilan=AAAA-MM-JJ ou --ce-jour[=AAAA-MM-JJ], [--annee=AAAA], [--dry]");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

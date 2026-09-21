/**
 * Pose le résumé vidéo d'une rencontre — `Match.videoUrl` —, depuis un lien
 * donné par Jérémy.
 *
 * Source : la chaîne YouTube « TOP 14 - Officiel », dont les résumés ne
 * remontent pas au-delà de 2022-2023. Les deux scripts d'avant,
 * `add-video-urls.ts` et `add-video-urls-j13-j26.ts`, portaient une liste en
 * dur par saison, sans contrôle ; celui-ci prend une rencontre et un lien,
 * et **vérifie avant d'écrire** :
 *
 * - l'identifiant existe, par `youtube.com/oembed` — la règle du projet, le
 *   HTML de recherche désalignant titres et identifiants ;
 * - le titre rendu nomme bien cette rencontre : la saison (« 2026-2027 »),
 *   la journée (« J03 ») quand la rencontre en a une, et Perpignan. Un lien
 *   copié de travers — la journée d'à côté, un autre club — est refusé, et
 *   le titre est affiché pour qu'on voie pourquoi ;
 * - la chaîne est nommée : « TOP 14 - Officiel » attendue, une autre est
 *   acceptée mais dite.
 *
 * Ce qui s'écrit est l'adresse **nettoyée** — `https://www.youtube.com/watch?v=ID`
 * —, sans les paramètres de liste (`list=`, `index=`, `pp=`) que le
 * navigateur colle au lien : `VideoEmbed` n'en a pas besoin, et une adresse
 * canonique se compare.
 *
 * **Premier emploi, le 21 septembre 2026 : les trois premières journées de
 * 2026-2027**, liens donnés par Jérémy.
 *
 * Usage :
 *   npx tsx scripts/set-video.ts --match=2026-09-05 --url="https://www.youtube.com/watch?v=…" --dry
 *   npx tsx scripts/set-video.ts --match=2026-09-05 --url="…"
 *   npx tsx scripts/set-video.ts … --force     # remplace un résumé déjà posé
 *
 * Refuse d'écrire si la date désigne plusieurs rencontres, si le titre ne
 * concorde pas, ou si un résumé est déjà posé sans `--force`.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CHAINE_ATTENDUE = "TOP 14 - Officiel";

function argument(nom: string): string | undefined {
  const prefixe = `--${nom}=`;
  return process.argv.find((a) => a.startsWith(prefixe))?.slice(prefixe.length);
}

/** L'identifiant YouTube d'un lien, sous ses trois formes courantes. */
function identifiantYoutube(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

async function main() {
  const dry = process.argv.includes("--dry");
  const force = process.argv.includes("--force");
  const date = argument("match");
  const url = argument("url");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !url) {
    console.error('Usage : npx tsx scripts/set-video.ts --match=AAAA-MM-JJ --url="https://www.youtube.com/watch?v=…" [--dry] [--force]');
    process.exit(1);
  }
  const id = identifiantYoutube(url);
  if (!id) {
    console.error(`Pas d'identifiant YouTube dans ${url}.`);
    process.exit(1);
  }
  const propre = `https://www.youtube.com/watch?v=${id}`;

  // La rencontre : la journée entière en UTC, une seule attendue.
  const debut = new Date(`${date}T00:00:00Z`);
  const fin = new Date(debut.getTime() + 24 * 3600 * 1000);
  const matchs = await prisma.match.findMany({
    where: { date: { gte: debut, lt: fin } },
    include: { opponent: { select: { name: true } }, season: { select: { label: true } } },
  });
  if (matchs.length !== 1) {
    console.error(`${matchs.length} rencontre(s) le ${date} — il en faut exactement une.`);
    process.exit(1);
  }
  const match = matchs[0];
  const affiche = match.isHome ? `USAP – ${match.opponent.name}` : `${match.opponent.name} – USAP`;

  if (match.videoUrl && match.videoUrl !== propre && !force) {
    console.error(`${date} ${affiche} : résumé déjà posé, ${match.videoUrl}. Relancer avec --force pour le remplacer.`);
    process.exit(1);
  }

  // oembed : l'identifiant existe, et son titre dit quelle rencontre c'est.
  const reponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(propre)}&format=json`);
  if (!reponse.ok) {
    console.error(`YouTube ne connaît pas ${id} (oembed ${reponse.status}).`);
    process.exit(1);
  }
  const { title, author_name } = (await reponse.json()) as { title: string; author_name: string };
  const titre = sansAccents(title);

  const ecarts: string[] = [];
  if (!titre.includes(match.season.label)) ecarts.push(`la saison ${match.season.label} n'y est pas`);
  if (match.matchday != null) {
    const journee = new RegExp(`\\bj0*${match.matchday}\\b`);
    if (!journee.test(titre)) ecarts.push(`la journée J${match.matchday} n'y est pas`);
  }
  if (!titre.includes("perpignan")) ecarts.push("Perpignan n'y est pas");
  if (ecarts.length > 0) {
    console.error(`${date} ${affiche} : le titre ne concorde pas — ${ecarts.join(", ")}.\n  « ${title} »`);
    process.exit(1);
  }
  if (author_name !== CHAINE_ATTENDUE) console.warn(`  chaîne « ${author_name} », et non « ${CHAINE_ATTENDUE} »`);

  console.log(`${date} ${affiche} : ${dry ? "poserait" : "pose"} ${propre}\n  « ${title} »`);
  if (!dry) {
    await prisma.match.update({ where: { id: match.id }, data: { videoUrl: propre } });
    console.log("✔ écrit.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

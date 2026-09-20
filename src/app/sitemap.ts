import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";
import { LANGUES } from "@/i18n/langues";

/**
 * `/sitemap.xml`, lu dans la base, depuis le 14 septembre 2026 — il rendait
 * 404 en production, et un moteur n'avait que l'accueil et ce qu'il y
 * trouvait de liens pour découvrir le reste.
 *
 * Chaque page y est donnée dans les deux langues, chacune portant l'autre en
 * `alternates` — le pendant du `hreflang` que `liensAlternatifs()` pose dans
 * les pages. Les fiches y sont toutes : rencontres, saisons, adversaires,
 * stades, arbitres, entraîneurs, présidents ; et **les joueurs liés au
 * club seulement**, la condition de la liste des joueurs — les trois mille
 * cinq cents fiches d'adversaires existent mais ne valent pas d'être
 * poussées aux moteurs. L'admin et la connexion n'y sont pas.
 *
 * `lastModified` vient de `updatedAt` quand le modèle le porte ; les listes
 * bougent à chaque match, elles prennent la date du jour.
 */
export const revalidate = 3600;

const LISTES = [
  "",
  "/saisons",
  "/matchs",
  "/joueurs",
  "/adversaires",
  "/stades",
  "/arbitres",
  "/entraineurs",
  "/presidents",
  "/centurions",
  "/realisateurs",
  "/records",
  "/palmares",
  "/statistiques",
  "/mentions-legales",
  "/confidentialite",
];

function entrees(chemin: string, lastModified?: Date): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LANGUES.map((l) => [l, `${SITE_URL}/${l}${chemin}`]));
  return LANGUES.map((l) => ({ url: `${SITE_URL}/${l}${chemin}`, lastModified, alternates: { languages } }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [matchs, saisons, joueurs, adversaires, stades, arbitres, entraineurs, presidents] = await Promise.all([
    prisma.match.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.season.findMany({ select: { label: true, updatedAt: true } }),
    prisma.player.findMany({
      where: {
        OR: [{ usapStints: { some: {} } }, { careerClubs: { some: { isUsap: true } } }, { matchAppearances: { some: { isOpponent: false } } }, { seasonSquads: { some: {} } }],
      },
      select: { slug: true, updatedAt: true },
    }),
    prisma.opponent.findMany({ select: { slug: true, updatedAt: true } }),
    // Stades, arbitres et présidents n'ont pas d'`updatedAt` : sans date.
    prisma.venue.findMany({ select: { slug: true } }),
    prisma.referee.findMany({ select: { slug: true } }),
    prisma.coach.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.president.findMany({ select: { slug: true } }),
  ]);
  const aujourdhui = new Date();
  return [
    ...LISTES.flatMap((c) => entrees(c, aujourdhui)),
    ...matchs.flatMap((m) => entrees(`/matchs/${m.slug}`, m.updatedAt)),
    ...saisons.flatMap((s) => entrees(`/saisons/${s.label}`, s.updatedAt)),
    ...joueurs.flatMap((j) => entrees(`/joueurs/${j.slug}`, j.updatedAt)),
    ...adversaires.flatMap((a) => entrees(`/adversaires/${a.slug}`, a.updatedAt)),
    ...stades.flatMap((s) => entrees(`/stades/${s.slug}`)),
    ...arbitres.flatMap((a) => entrees(`/arbitres/${a.slug}`)),
    ...entraineurs.flatMap((e) => entrees(`/entraineurs/${e.slug}`, e.updatedAt)),
    ...presidents.flatMap((p) => entrees(`/presidents/${p.slug}`)),
  ];
}

/**
 * Script d'ajout des URLs vidéo (Dailymotion) des résumés de matchs J13-J26 + Challenge Cup + Barrages
 * Source : chaîne officielle TOP 14 sur Dailymotion (dailymotion.com/TOP14)
 *
 * Note : Les résumés à partir de J13 ne sont plus sur YouTube mais sur Dailymotion.
 * Le composant VideoEmbed supporte les deux plateformes.
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-video-urls-j13-j26.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEASON_ID = "cmm6wnzg7001z1uihyfpyo4gy"; // Saison 2024-2025

// ============================================================
// URLs Dailymotion des résumés TOP 14 (J13 → J26)
// Mapping matchday → URL Dailymotion du résumé officiel TOP 14
// ============================================================
const TOP14_VIDEO_URLS: Record<number, string> = {
  13: "https://www.dailymotion.com/video/x9bjzx4",   // J13 USAP - La Rochelle (28/12/2024)
  // 14: "",                                           // J14 Lyon - USAP (04/01/2025) — résumé non trouvé
  15: "https://www.dailymotion.com/video/x9d2hk4",   // J15 USAP - Bayonne (25/01/2025)
  // 16: "",                                           // J16 USAP - Castres (15/02/2025) — résumé non trouvé
  // 17: "",                                           // J17 Pau - USAP (22/02/2025) — résumé non trouvé
  18: "https://www.dailymotion.com/video/x9fgyz0",   // J18 USAP - UBB (01/03/2025)
  19: "https://www.dailymotion.com/video/x9gndeu",   // J19 Toulon - USAP (22/03/2025)
  20: "https://www.dailymotion.com/video/x9h1jmu",   // J20 Vannes - USAP (29/03/2025)
  21: "https://www.dailymotion.com/video/x9i7tls",   // J21 USAP - Racing 92 (19/04/2025)
  // 22: "",                                           // J22 Montpellier - USAP (26/04/2025) — résumé non trouvé
  23: "https://www.dailymotion.com/video/x9jc94u",   // J23 USAP - Stade Français (10/05/2025)
  24: "https://www.dailymotion.com/video/x9jqrsg",   // J24 Clermont - USAP (17/05/2025)
  25: "https://www.dailymotion.com/video/x9km8iq",   // J25 La Rochelle - USAP (31/05/2025)
  26: "https://www.dailymotion.com/video/x9kzcz4",   // J26 USAP - Toulouse (07/06/2025)
};

// ============================================================
// URLs des matchs Challenge Européen + Barrages (matchday null)
// Identifiés par leur slug puisqu'ils n'ont pas de numéro de journée
// ============================================================
const SLUG_VIDEO_URLS: Record<string, string> = {
  // Challenge Cup — Pool stage : résumés non disponibles sur Dailymotion
  // "challenge-europeen-cheetahs-vs-usap-poule-j1-08-12-2024": "",       // Cheetahs - USAP
  // "challenge-europeen-usap-vs-connacht-poule-j2-15-12-2024": "",       // USAP - Connacht
  // "challenge-europeen-usap-vs-cardiff-poule-j3-12-01-2025": "",        // USAP - Cardiff
  // "challenge-europeen-zebre-vs-usap-poule-j4-19-01-2025": "",          // Zebre - USAP

  // Challenge Cup — 8e de finale
  "challenge-europeen-usap-vs-racing-92-huitieme-de-finale-05-04-2025":
    "https://www.dailymotion.com/video/x9he2yk",   // USAP - Racing 92 (8e, 05/04/2025)

  // Barrages — Access Match
  "barrages-grenoble-vs-usap-access-match-14-06-2025":
    "https://www.dailymotion.com/video/x9lf8js",   // Grenoble - USAP (14/06/2025)
};

async function main() {
  console.log("=== Ajout des URLs Dailymotion aux matchs 2024-2025 (J13-J26 + Coupes) ===\n");

  let count = 0;

  // --- TOP 14 : matchs par numéro de journée ---
  console.log("--- TOP 14 ---");
  for (const [matchday, videoUrl] of Object.entries(TOP14_VIDEO_URLS)) {
    const match = await prisma.match.findFirst({
      where: { seasonId: SEASON_ID, matchday: Number(matchday) },
      include: { opponent: { select: { shortName: true, name: true } } },
    });

    if (!match) {
      console.log(`  J${matchday}: MATCH NON TROUVÉ`);
      continue;
    }

    await prisma.match.update({
      where: { id: match.id },
      data: { videoUrl },
    });

    const oppName = match.opponent.shortName || match.opponent.name;
    const homeAway = match.isHome ? "dom" : "ext";
    console.log(
      `  J${String(matchday).padStart(2, " ")} ${homeAway} vs ${oppName.padEnd(20)} → ${videoUrl}`
    );
    count++;
  }

  // --- Challenge Cup + Barrages : matchs par slug ---
  console.log("\n--- Challenge Européen + Barrages ---");
  for (const [slug, videoUrl] of Object.entries(SLUG_VIDEO_URLS)) {
    const match = await prisma.match.findFirst({
      where: { seasonId: SEASON_ID, slug },
      include: { opponent: { select: { shortName: true, name: true } } },
    });

    if (!match) {
      console.log(`  ${slug}: MATCH NON TROUVÉ`);
      continue;
    }

    await prisma.match.update({
      where: { id: match.id },
      data: { videoUrl },
    });

    const oppName = match.opponent.shortName || match.opponent.name;
    const homeAway = match.isHome ? "dom" : "ext";
    console.log(
      `  ${homeAway} vs ${oppName.padEnd(20)} → ${videoUrl}`
    );
    count++;
  }

  console.log(`\n=== ${count} URLs vidéo ajoutées ===`);

  // Résumé des matchs sans vidéo
  const matchesSansVideo = await prisma.match.findMany({
    where: { seasonId: SEASON_ID, videoUrl: null },
    select: {
      matchday: true,
      date: true,
      isHome: true,
      opponent: { select: { shortName: true, name: true } },
      competition: { select: { shortName: true } },
    },
    orderBy: { date: "asc" },
  });

  if (matchesSansVideo.length > 0) {
    console.log(`\n⚠️  ${matchesSansVideo.length} matchs restent sans vidéo :`);
    for (const m of matchesSansVideo) {
      const opp = m.opponent.shortName || m.opponent.name;
      const ha = m.isHome ? "dom" : "ext";
      const day = m.matchday ? `J${String(m.matchday).padStart(2, " ")}` : "   ";
      const comp = m.competition.shortName || "";
      console.log(`  ${day} ${ha} vs ${opp.padEnd(18)} (${comp})`);
    }
  }
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

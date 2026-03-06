/**
 * Script d'ajout des URLs YouTube des résumés de matchs
 * Source : chaîne officielle @top14 (TOP 14 - Officiel)
 *
 * Exécution : PATH="/usr/local/opt/node@22/bin:$PATH" npx tsx scripts/add-video-urls.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEASON_ID = "cmm6wnzg7001z1uihyfpyo4gy"; // Saison 2024-2025

// Mapping matchday → URL YouTube du résumé officiel TOP 14
const VIDEO_URLS: Record<number, string> = {
  1: "https://www.youtube.com/watch?v=0VhkxKGMnjo",   // J01 Bayonne/Castres - USAP (07/09/2024)
  2: "https://www.youtube.com/watch?v=9HdUQCK6T5A",   // J02 USAP - Montpellier (14/09/2024)
  3: "https://www.youtube.com/watch?v=966j-ndJFKI",   // J03 Castres/Bayonne - USAP (21/09/2024)
  4: "https://www.youtube.com/watch?v=p5MZjsExx38",   // J04 USAP - Clermont (28/09/2024)
  5: "https://www.youtube.com/watch?v=WDKr5iM7z6Y",   // J05 USAP - Pau (05/10/2024)
  6: "https://www.youtube.com/watch?v=fPWhIGrcMhU",   // J06 UBB - USAP (19/10/2024)
  7: "https://www.youtube.com/watch?v=LpS3Rm_fDwQ",   // J07 USAP - Lyon (19/10/2024)
  8: "https://www.youtube.com/watch?v=ZPDHqliywE4",   // J08 Racing 92 - USAP (26/10/2024)
  9: "https://www.youtube.com/watch?v=Kv9Jetom9Ck",   // J09 USAP - Vannes (02/11/2024)
  10: "https://www.youtube.com/watch?v=mboNtO3EYhQ",  // J10 Toulouse - USAP (23/11/2024)
  11: "https://www.youtube.com/watch?v=ZberxMf7ToQ",   // J11 USAP - Toulon (30/11/2024)
  12: "https://www.youtube.com/watch?v=mXwTU7x6aCw",  // J12 Stade Français - USAP (21/12/2024)
};

async function main() {
  console.log("=== Ajout des URLs YouTube aux matchs 2024-2025 ===\n");

  for (const [matchday, videoUrl] of Object.entries(VIDEO_URLS)) {
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
    console.log(`  J${String(matchday).padStart(2, " ")} ${homeAway} vs ${oppName.padEnd(20)} → ${videoUrl}`);
  }

  console.log(`\n=== ${Object.keys(VIDEO_URLS).length} URLs ajoutées ===`);
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

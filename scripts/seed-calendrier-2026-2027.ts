/**
 * Crée la saison 2026-2027 et son calendrier de Top 14, avant qu'elle ne
 * commence.
 *
 * Une rencontre à venir n'a ni score ni résultat : depuis la migration
 * `match_scores_nullable`, `scoreUsap`, `scoreOpponent` et `result` acceptent
 * `null`, et `null` s'y lit « pas encore joué ». Les pages publiques affichent
 * « à venir » à la place du score, et les statistiques écartent ces
 * rencontres (`MATCH_JOUE` dans `src/lib/matchs.ts`).
 *
 * Source : la LNR, qui publie le calendrier dès sa parution avec les dates et
 * les horaires exacts — là où la presse annonce des week-ends. Le calendrier
 * a été recoupé avec l'article d'ici.fr du 9 juillet 2026 : mêmes adversaires,
 * mêmes journées, mêmes terrains.
 *
 * Ce que le script écrit : la rencontre — date et heure, journée, adversaire,
 * lieu — et rien d'autre. Les scores s'ajouteront au fil de la saison.
 *
 * **Seules les premières journées ont un horaire.** La LNR ne cale les coups
 * d'envoi qu'au fil des désignations télévisées : pour les autres, sa feuille
 * porte une date de référence à minuit, celle qui ouvre le week-end de la
 * journée. L'heure est alors laissée vide et la date reste provisoire — une
 * relance du script les mettra à jour au fur et à mesure.
 *
 * Usage :
 *   npx tsx scripts/seed-calendrier-2026-2027.ts --dry
 *   npx tsx scripts/seed-calendrier-2026-2027.ts
 *
 * Idempotent : une rencontre déjà créée est mise à jour, jamais dupliquée, et
 * son score — s'il a été saisi entre-temps — n'est pas touché.
 */

import { PrismaClient, Division, Prisma } from "@prisma/client";
import { chercherFeuille, lireCoupDEnvoi } from "./lib/lnr";
import { CLUBS_LNR } from "./lib/clubs";
import { generateMatchSlug } from "../src/lib/slugs";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry");

const SAISON = "2026-2027";
const JOURNEES = 26;

interface Rencontre {
  matchday: number;
  date: Date;
  /** Nul tant que la LNR n'a pas calé le coup d'envoi. */
  kickoffTime: string | null;
  isHome: boolean;
  opponentNom: string;
}

async function lireCalendrier(echecs: string[]): Promise<Rencontre[]> {
  const rencontres: Rencontre[] = [];
  for (let n = 1; n <= JOURNEES; n++) {
    const phase = `j${n}`;
    const url = await chercherFeuille(SAISON, phase);
    if (!url) {
      echecs.push(`${phase} : aucun match de l'USAP au calendrier`);
      continue;
    }
    // L'URL se termine par `{id}-{recevant}-{visiteur}`.
    const slug = (url.split("/").pop() ?? "").replace(/^\d+-/, "");
    const isHome = slug.startsWith("perpignan-");
    const adversaireSlug = isHome ? slug.slice("perpignan-".length) : slug.replace(/-perpignan$/, "");
    const nom = CLUBS_LNR[adversaireSlug];
    if (!nom) {
      echecs.push(`${phase} : club « ${adversaireSlug} » inconnu de la table`);
      continue;
    }

    const coupDEnvoi = await lireCoupDEnvoi(url);
    if (!coupDEnvoi) {
      echecs.push(`${phase} : coup d'envoi introuvable sur la feuille`);
      continue;
    }
    // Minuit pile ne désigne pas un coup d'envoi : c'est la date de référence
    // que la LNR pose tant que l'horaire n'est pas arrêté.
    const heure = coupDEnvoi.slice(11, 16);
    rencontres.push({
      matchday: n,
      date: new Date(coupDEnvoi),
      kickoffTime: heure === "00:00" ? null : heure,
      isHome,
      opponentNom: nom,
    });
  }
  return rencontres;
}

async function main() {
  console.log(`=== Calendrier ${SAISON}${DRY_RUN ? " (simulation)" : ""} ===\n`);

  const echecs: string[] = [];
  const rencontres = await lireCalendrier(echecs);

  let saisonId = (await prisma.season.findFirst({ where: { label: SAISON } }))?.id ?? null;
  if (!saisonId) {
    console.log(`  [saison] à créer : ${SAISON} (Top 14)`);
    if (!DRY_RUN) {
      const creee = await prisma.season.create({
        data: {
          label: SAISON,
          startYear: 2026,
          endYear: 2027,
          division: Division.TOP_14,
        },
      });
      saisonId = creee.id;
    }
  }

  const competition = await prisma.competition.findFirstOrThrow({
    where: { shortName: "Top 14" },
  });
  const aimeGiral = await prisma.venue.findFirstOrThrow({
    where: { name: "Stade Aimé-Giral" },
  });

  let crees = 0;
  let majs = 0;

  for (const r of rencontres) {
    // Affiché à l'heure de Perpignan : un coup d'envoi calé à minuit tomberait
    // la veille en UTC.
    const jour = r.date.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
    const adversaire = await prisma.opponent.findFirst({
      where: { OR: [{ shortName: r.opponentNom }, { name: r.opponentNom }] },
      select: { id: true, venueId: true },
    });
    if (!adversaire) {
      echecs.push(`J${r.matchday} : adversaire « ${r.opponentNom} » introuvable en base`);
      continue;
    }

    console.log(
      `${jour} ${r.kickoffTime ?? "  ·  "} J${String(r.matchday).padStart(2)} ` +
        `${r.isHome ? "H" : "A"} ${r.opponentNom.padEnd(16)}` +
        `${r.kickoffTime ? "" : " (horaire non calé, date provisoire)"}`,
    );
    if (DRY_RUN || !saisonId) continue;

    const donnees: Prisma.MatchUncheckedCreateInput = {
      slug: generateMatchSlug({
        competitionShortName: competition.shortName,
        competitionName: competition.name,
        opponentShortName: r.opponentNom,
        opponentName: r.opponentNom,
        isHome: r.isHome,
        matchday: r.matchday,
        round: null,
        date: r.date,
      }),
      date: r.date,
      kickoffTime: r.kickoffTime,
      seasonId: saisonId,
      competitionId: competition.id,
      matchday: r.matchday,
      isHome: r.isHome,
      venueId: r.isHome ? aimeGiral.id : adversaire.venueId,
      opponentId: adversaire.id,
    };

    const existant = await prisma.match.findFirst({
      where: { seasonId: saisonId, competitionId: competition.id, matchday: r.matchday },
      select: { id: true },
    });
    if (existant) {
      // Le score, s'il a été saisi entre-temps, ne fait pas partie des données
      // écrites ici : une relance ne l'efface pas.
      await prisma.match.update({ where: { id: existant.id }, data: donnees });
      majs++;
    } else {
      await prisma.match.create({ data: donnees });
      crees++;
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
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

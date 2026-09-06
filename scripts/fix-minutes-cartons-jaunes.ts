/**
 * Retire à chaque joueur jauni les minutes de sa sanction — toute la base.
 *
 * **La règle a changé le 6 septembre 2026.** Jusque-là, « un carton jaune ne
 * se déduit pas des minutes jouées » : un titulaire jauni resté jusqu'au bout
 * comptait 80, et 441 lignes étaient dans ce cas. Jérémy l'a fait tomber sur
 * Mattéo Le Corvec, jauni à la 40ᵉ du Stade Français-USAP du 5 septembre
 * 2026 et compté 80 — un joueur au banc de touche ne joue pas. Opta, la
 * seule source qui publie des minutes par joueur, les retirait déjà.
 * `privationDuJaune()` de `lib/feuilles.ts` porte désormais la règle, les
 * deux scripts de feuille l'appliquent, et ce script rattrape ce qui a été
 * écrit avant.
 *
 * **Ce qu'il fait, ligne par ligne**, pour toute ligne à carton jaune dont
 * la minute est connue et dont les minutes sont écrites : il retrouve la
 * minute où le joueur a cessé d'être en jeu — sa sortie, ou son entrée plus
 * ses minutes, ce qui vaut la fin du match pour un titulaire resté sur le
 * terrain et la minute du rouge pour un exclu — et retire au plus dix
 * minutes à partir du carton. Un jaune à la 75ᵉ en coûte cinq.
 *
 * **Ce qu'il laisse**, et le dit : les cartons sans minute — ESPN n'en donne
 * pas sur les coupes d'avant 2020 —, les lignes sans minutes — 2005-2006 et
 * les coupes d'ESPN —, et les lignes déjà corrigées, que la relance ne
 * recorrige pas : il ne s'applique qu'une fois, sur les minutes telles que
 * l'ancienne règle les avait écrites, et refuse une ligne dont les minutes
 * sont déjà en dessous de ce que l'ancienne règle donnait. Les lignes qui
 * portent une note de retour en jeu sont signalées, pas touchées.
 *
 * Usage :
 *   npx tsx scripts/fix-minutes-cartons-jaunes.ts --dry
 *   npx tsx scripts/fix-minutes-cartons-jaunes.ts
 */

import { PrismaClient } from "@prisma/client";
import { privationDuJaune } from "./lib/feuilles";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry");

async function main() {
  console.log(`=== Les dix minutes du carton jaune${DRY ? " (simulation)" : ""} ===\n`);
  const lignes = await prisma.matchPlayer.findMany({
    where: { yellowCard: true },
    select: {
      id: true, minutesPlayed: true, subIn: true, subOut: true, isStarter: true,
      yellowCardMin: true, redCardMin: true, notes: true, isOpponent: true,
      match: { select: { date: true, opponent: { select: { shortName: true } } } },
      player: { select: { firstName: true, lastName: true } },
    },
    orderBy: { match: { date: "asc" } },
  });

  let corrigees = 0;
  let sansMinuteDeCarton = 0;
  let sansMinutes = 0;
  let dejaFaites = 0;
  const signalees: string[] = [];
  const parPrivation = new Map<number, number>();

  for (const l of lignes) {
    const qui = `${l.match.date.toISOString().slice(0, 10)} ${l.isOpponent ? l.match.opponent.shortName : "USAP"} ${l.player?.firstName ?? ""} ${l.player?.lastName ?? "?"}`;
    if (l.yellowCardMin == null) { sansMinuteDeCarton++; continue; }
    if (l.minutesPlayed == null) { sansMinutes++; continue; }
    if (l.notes && /retour|revient|rentr/i.test(l.notes)) {
      signalees.push(`${qui} : note de retour en jeu — à reprendre à la main (${l.minutesPlayed} min, jaune ${l.yellowCardMin}')`);
      continue;
    }
    // La minute où le joueur a cessé d'être en jeu, telle que l'ancienne
    // règle l'écrivait : sa sortie, ou son entrée plus ses minutes.
    const fin = l.subOut ?? (l.subIn ?? 0) + l.minutesPlayed;
    if (l.subOut != null && l.subOut !== (l.subIn ?? 0) + l.minutesPlayed) {
      // Les minutes ne sont plus « sortie − entrée » : soit un retour en jeu
      // non noté, soit une ligne déjà corrigée. On ne devine pas.
      if ((l.subIn ?? 0) + l.minutesPlayed === l.subOut - privationDuJaune(l.yellowCardMin, l.subOut)) {
        dejaFaites++;
      } else {
        signalees.push(`${qui} : ${l.minutesPlayed} min entre ${l.subIn ?? 0}' et ${l.subOut}' — ne se déduit pas d'une entrée et d'une sortie, à regarder`);
      }
      continue;
    }
    const privation = privationDuJaune(l.yellowCardMin, fin);
    if (privation === 0) continue;
    parPrivation.set(privation, (parPrivation.get(privation) ?? 0) + 1);
    if (!DRY) {
      await prisma.matchPlayer.update({ where: { id: l.id }, data: { minutesPlayed: l.minutesPlayed - privation } });
    }
    corrigees++;
    if (corrigees <= 12 || privation < 10) {
      console.log(`  ${qui.padEnd(46)} jaune ${String(l.yellowCardMin).padStart(2)}'  ${l.minutesPlayed} → ${l.minutesPlayed - privation}${privation < 10 ? `  (−${privation}, ${l.subOut != null ? "sorti" : "fin"} à la ${fin}ᵉ)` : ""}`);
    }
  }

  console.log(`\n=== ${lignes.length} lignes à carton jaune — ${corrigees} ${DRY ? "à corriger" : "corrigées"} ===`);
  console.log(`  par privation : ${[...parPrivation].sort((a, b) => b[0] - a[0]).map(([p, n]) => `−${p} min × ${n}`).join(", ")}`);
  console.log(`  laissées : ${sansMinuteDeCarton} sans minute de carton, ${sansMinutes} sans minutes, ${dejaFaites} déjà corrigées, ${signalees.length} à regarder`);
  for (const s of signalees) console.log(`  ⚠ ${s}`);
  if (DRY) console.log("\nSimulation — relancer sans --dry pour appliquer.");
}

main()
  .catch((e) => {
    console.error("Erreur :", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
